import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { MetricService } from './MetricService';
import { PdfGeneratorService } from './PdfGeneratorService';
import { ReportPayload, HostGroupData, HostData } from '@/types/report';
import pool from '@/lib/db';

export class AutomationService {
  static init() {
    const statusDir = this.getStatusDir();
    if (!fs.existsSync(statusDir)) return;

    fs.readdirSync(statusDir).forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(statusDir, file);
        try {
          const job = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (job.status === 'processing') {
            console.log(`[Automation] Marking interrupted job ${job.id || file} as failed.`);
            fs.writeFileSync(filePath, JSON.stringify({
              ...job,
              status: 'failed',
              message: 'Job interrupted due to unexpected service restart.'
            }));
          }
        } catch (e) {
          console.error(`[Automation] Failed to check status of ${file}:`, e);
        }
      }
    });
  }

  private static getStatusDir() {
    let projectRoot = process.cwd();
    if (fs.existsSync(path.join(projectRoot, 'MPERF/package.json'))) {
        projectRoot = path.join(projectRoot, 'MPERF');
    }
    const dir = path.join(projectRoot, 'public/reports/jobs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  }

  private static updateStatus(jobId: string, update: any) {
    if (!jobId) return;
    const statusDir = this.getStatusDir();
    const statusFile = path.join(statusDir, `${jobId}.json`);
    if (!fs.existsSync(statusFile)) return;
    try {
      const current = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      const next = { ...current, ...update };
      fs.writeFileSync(statusFile, JSON.stringify(next));
    } catch (e) {
      console.error(`[Automation] Failed to update status for job ${jobId}:`, e);
    }
  }

  static async generateFullMonthlyReport(month: number, year: number, templateId?: number, jobId?: string): Promise<string> {
    const reportDate = new Date(year, month - 1);
    const monthName = reportDate.toLocaleString('en-US', { month: 'long' });
    const generatedDate = new Date().toLocaleDateString();
    
    let reportTitle = `MFEC Full Monthly Performance Report - ${monthName} ${year}`;
    let reportTypes = [
      { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average' },
      { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak' },
      { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal' },
      { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal' },
      { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak' },
      { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal' },
    ];

    let targetHosts: { id: string, name: string, group: string }[] = [];

    // If templateId provided, load template config
    if (templateId) {
      try {
        const [rows]: any = await pool.query('SELECT * FROM report_templates WHERE id = ?', [templateId]);
        if (rows.length > 0) {
          const config = typeof rows[0].config === 'string' ? JSON.parse(rows[0].config) : rows[0].config;
          reportTitle = config.reportTitle || rows[0].name;
          reportTypes = (config.charts || config.activeReports || []).filter((c: any) => c.enabled !== false);
          targetHosts = config.hosts || config.selectedHostnames || [];
        }
      } catch (e: any) {
        console.error(`[Automation] Failed to load template ${templateId}:`, e);
        if (jobId) this.updateStatus(jobId, { status: 'failed', message: `Failed to load template: ${e.message}` });
        throw e;
      }
    }

    if (jobId) this.updateStatus(jobId, { status: 'processing', message: 'Resolving metrics...', templateName: reportTitle });

    // Dates for metrics
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startDate = format(firstDay);
    const endDate = format(lastDay);

    const outputDir = path.join(process.cwd(), 'public/reports/monthly', `${year}_${String(month).padStart(2, '0')}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const tmpDir = path.join(process.cwd(), 'public/reports/tmp', jobId || 'manual_' + Date.now());
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // Group hosts by hostgroup
    let hostgroups: any[] = [];
    if (targetHosts.length > 0) {
        const groupsMap = targetHosts.reduce((acc: any, host) => {
            if (!acc[host.group]) acc[host.group] = { name: host.group, hosts: [] };
            acc[host.group].hosts.push(host);
            return acc;
        }, {});
        hostgroups = Object.values(groupsMap); // Removed .sort() to respect payload order
    } else {
        // Default: Get everything if no template
        const rawGroups = await MetricService.getHostGroups(0, 'admin');
        hostgroups = rawGroups.map(g => ({
            name: g.hostgroup,
            hosts: g.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }))
        }));
    }

    // Phase 0: Pre-calculate TOC Pages
    const mockTOCPayload: ReportPayload = {
        reportMonth: `${monthName} ${year}`,
        reportTitle: reportTitle,
        targetMonth: month, targetYear: year, generatedDate,
        hostgroups: hostgroups.map(g => ({
            id: g.name, name: g.name,
            hosts: g.hosts.map((h: any) => ({ name: h.name } as any))
        }))
    };
    const mockTOCBuffer = await PdfGeneratorService.generatePdfBuffer(mockTOCPayload, { 
        skipContent: true 
    });
    const mockTOCDoc = await PDFDocument.load(mockTOCBuffer);
    const tocOffset = mockTOCDoc.getPageCount();

    const intermediatePdfPaths: string[] = [];
    const hostgroupPageMap: Record<string, number> = {};
    const hostPageMap: Record<string, number> = {};
    
    // Use dynamic TOC count. Content starts from tocOffset + 1.
    let currentGlobalPage = tocOffset + 1; 
    let totalProcessedHosts = 0;
    const totalHostsToProcess = targetHosts.length || hostgroups.reduce((acc, g) => acc + g.hosts.length, 0);

    // Phase 1: Generate all content chunks and track page counts PRECISELY
    for (let i = 0; i < hostgroups.length; i++) {
      const group = hostgroups[i];
      
      // 1. Hostgroup Cover
      const coverPayload: ReportPayload = {
          reportMonth: `${monthName} ${year}`,
          reportTitle: reportTitle,
          targetMonth: month, targetYear: year, generatedDate,
          hostgroups: [{ id: group.name, name: group.name, hosts: [] }] 
      };
      
      hostgroupPageMap[`group-${i}`] = currentGlobalPage;
      const coverBuffer = await PdfGeneratorService.generatePdfBuffer(coverPayload, { 
          skipCover: true, skipTOC: true, skipGroupCover: false, skipStats: true, skipCharts: true,
          groupIndexOffset: i, pageOffset: tocOffset, pageMap: hostgroupPageMap
      });
      const groupCoverPath = path.join(tmpDir, `group_${i}_cover.pdf`);
      fs.writeFileSync(groupCoverPath, coverBuffer);
      intermediatePdfPaths.push(groupCoverPath);
      
      const coverDoc = await PDFDocument.load(coverBuffer);
      currentGlobalPage += coverDoc.getPageCount();

      // 2. Statistics Tables for ALL hosts in the group
      const STAT_CHUNK_SIZE = 40; 
      for (let c = 0; c < group.hosts.length; c += STAT_CHUNK_SIZE) {
          const statChunk = group.hosts.slice(c, c + STAT_CHUNK_SIZE);
          const chunkIndex = Math.floor(c / STAT_CHUNK_SIZE);
          
          const hostsWithStatsData = await Promise.all(statChunk.map(async (host: any) => {
              const cpuStats = await MetricService.getCpuStatsSummary(0, 'admin', group.name, parseInt(host.id), String(month), String(year));
              const memStats = await MetricService.getMemStatsSummary(0, 'admin', group.name, parseInt(host.id), String(month), String(year));
              return { id: String(host.id), name: host.name, mem: host.mem, cpuStats, memStats, charts: [] };
          }));

          const statsPayload: ReportPayload = {
              reportMonth: `${monthName} ${year}`,
              reportTitle: reportTitle,
              targetMonth: month, targetYear: year, generatedDate,
              hostgroups: [{ id: group.name, name: group.name, hosts: hostsWithStatsData }]
          };

          // Record start of stats for this chunk
          const statsPageId = chunkIndex === 0 ? `group-stats-${i}` : `group-stats-${i}-cpu-${chunkIndex}`;
          hostgroupPageMap[statsPageId] = currentGlobalPage;

          const statsBuffer = await PdfGeneratorService.generatePdfBuffer(statsPayload, { 
              skipCover: true, skipTOC: true, skipGroupCover: true, skipCharts: true,
              groupIndexOffset: i, pageOffset: tocOffset, pageMap: hostgroupPageMap // Pass map to allow footer generation
          });
          const statsPath = path.join(tmpDir, `group_${i}_stats_chunk_${chunkIndex}.pdf`);
          fs.writeFileSync(statsPath, statsBuffer);
          intermediatePdfPaths.push(statsPath);
          
          const statsDoc = await PDFDocument.load(statsBuffer);
          currentGlobalPage += statsDoc.getPageCount();
      }

      // 3. Charts for EACH host individually
      for (let hi = 0; hi < group.hosts.length; hi++) {
          const host = group.hosts[hi];
          
          const hostCharts = await Promise.all(reportTypes.map(async (report: any) => {
              let metrics: any[] = []; let totalAvg = 0;
              try {
                  if (report.type === 'cpu-daily' || report.id?.includes('cpu-daily')) metrics = await MetricService.getCpuDaily(0, 'admin', group.name, parseInt(host.id), report.mode as any, startDate, endDate);
                  else if (report.type === 'cpu-monthly' || report.id?.includes('cpu-monthly')) metrics = await MetricService.getCpuMonthly(0, 'admin', group.name, parseInt(host.id), String(month), String(year));
                  else if (report.type === 'mem-daily' || report.id?.includes('mem-daily')) { const res = await MetricService.getMemDaily(0, 'admin', group.name, parseInt(host.id), report.mode as any, startDate, endDate); metrics = res.data; totalAvg = res.totalAvg; }
                  else if (report.type === 'mem-monthly' || report.id?.includes('mem-monthly')) metrics = await MetricService.getMemMonthly(0, 'admin', group.name, parseInt(host.id), String(month), String(year));
              } catch (e) {}
              return { label: report.label, metrics, report, totalAvg, hostname: host.name, hostMem: host.mem, startDate, endDate, month: String(month), year: String(year) };
          }));

          const hostPayload: ReportPayload = {
              reportMonth: `${monthName} ${year}`,
              reportTitle: reportTitle,
              targetMonth: month, targetYear: year, generatedDate,
              hostgroups: [{ id: group.name, name: group.name, hosts: [{ id: String(host.id), name: host.name, mem: host.mem, charts: hostCharts } as any] }]
          };

          hostPageMap[`host-${i}-${hi}`] = currentGlobalPage;
          const hostBuffer = await PdfGeneratorService.generatePdfBuffer(hostPayload, { 
              skipCover: true, skipTOC: true, skipGroupCover: true, skipStats: true,
              groupIndexOffset: i, hostIndexOffset: hi, pageOffset: tocOffset,
              pageMap: { ...hostgroupPageMap, ...hostPageMap } // Pass updated map for footer
          });
          const hostPath = path.join(tmpDir, `group_${i}_host_${hi}_charts.pdf`);
          fs.writeFileSync(hostPath, hostBuffer);
          intermediatePdfPaths.push(hostPath);
          
          const hostDoc = await PDFDocument.load(hostBuffer);
          currentGlobalPage += hostDoc.getPageCount();

          totalProcessedHosts++;
          if (jobId) {
              const progress = Math.round((totalProcessedHosts / totalHostsToProcess) * 85); 
              this.updateStatus(jobId, { progress, message: `Rendered host: ${host.name} (${totalProcessedHosts}/${totalHostsToProcess})` });
          }
      }
    }

    // Phase 2: Generate Cover and TOC PDF
    if (jobId) this.updateStatus(jobId, { progress: 90, message: 'Generating Table of Contents...' });

    const fullStructurePayload: ReportPayload = {
        reportMonth: `${monthName} ${year}`,
        reportTitle: reportTitle,
        targetMonth: month, targetYear: year, generatedDate,
        hostgroups: hostgroups.map(g => ({
            id: g.name, name: g.name,
            hosts: g.hosts.map((h: any) => ({ name: h.name } as any))
        }))
    };

    const combinedPageMap = { ...hostgroupPageMap, ...hostPageMap };
    
    const coverTocBuffer = await PdfGeneratorService.generatePdfBuffer(fullStructurePayload, { 
        totalFullPages: currentGlobalPage - 1,
        pageOffset: tocOffset,
        pageMap: combinedPageMap,
        skipContent: true 
    });
    
    const coverPath = path.join(tmpDir, `cover_toc.pdf`);
    fs.writeFileSync(coverPath, coverTocBuffer);

    // Phase 3: Final Merge
    if (jobId) this.updateStatus(jobId, { progress: 95, message: 'Finalizing PDF...' });

    const mergedPdf = await PDFDocument.create();
    
    // Add Cover/TOC first
    const coverPdf = await PDFDocument.load(fs.readFileSync(coverPath));
    const coverPages = await mergedPdf.copyPages(coverPdf, coverPdf.getPageIndices());
    coverPages.forEach(p => mergedPdf.addPage(p));

    // Add all content chunks
    for (const pdfPath of intermediatePdfPaths) {
      const pdf = await PDFDocument.load(fs.readFileSync(pdfPath));
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
    }

    const finalPdfBytes = await mergedPdf.save();
    const finalFileName = `MFEC_SAR_Full_Report_${year}_${String(month).padStart(2, '0')}_${Date.now()}.pdf`;
    const finalPath = path.join(outputDir, finalFileName);
    fs.writeFileSync(finalPath, finalPdfBytes);

    // Clean up temporary files
    try {
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
        intermediatePdfPaths.forEach(p => { if (fs.existsSync(p)) fs.unlinkSync(p); });
        if (fs.existsSync(tmpDir)) fs.rmdirSync(tmpDir);
    } catch (e) { console.warn('[Automation] Cleanup failed:', e); }

    const webPath = `/public/reports/monthly/${year}_${String(month).padStart(2, '0')}/${finalFileName}`;
    if (jobId) this.updateStatus(jobId, { status: 'completed', progress: 100, message: 'Report generated successfully', pdfPath: webPath });

    return finalPath;
  }
}
