import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { MetricService } from './MetricService';
import { PdfGeneratorService } from './PdfGeneratorService';
import { ReportPayload, HostGroupData, HostData } from '@/types/report';

export class AutomationService {
  static async generateFullMonthlyReport(month: number, year: number): Promise<string> {
    const reportDate = new Date(year, month - 1);
    const monthName = reportDate.toLocaleString('en-US', { month: 'long' });
    const reportTitle = `MFEC Full Monthly Performance Report - ${monthName} ${year}`;
    const generatedDate = new Date().toLocaleDateString();
    
    // Define the 6 report types to include per host
    const reportTypes = [
      { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average' },
      { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak' },
      { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal' },
      { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal' },
      { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak' },
      { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal' },
    ];

    // Dates for metrics
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const startDate = format(firstDay);
    const endDate = format(lastDay);

    console.log(`[Automation] Starting report generation for ${monthName} ${year}`);

    // Fetch all groups (as admin to see everything)
    const hostgroups = await MetricService.getHostGroups(0, 'admin');
    const pdfBuffers: Buffer[] = [];

    const outputDir = path.join(process.cwd(), 'public/reports/monthly', `${year}_${String(month).padStart(2, '0')}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (let i = 0; i < hostgroups.length; i++) {
      const group = hostgroups[i];
      console.log(`[Automation] Processing group ${i + 1}/${hostgroups.length}: ${group.hostgroup}`);

      const hostsWithData: HostData[] = await Promise.all(group.hostnames.map(async (host: any) => {
        // Fetch summary stats
        const cpuStats = await MetricService.getCpuStatsSummary(0, 'admin', group.hostgroup, host.hostname_id, String(month), String(year));
        const memStats = await MetricService.getMemStatsSummary(0, 'admin', group.hostgroup, host.hostname_id, String(month), String(year));

        const hostCharts = await Promise.all(reportTypes.map(async (report) => {
          let metrics: any[] = [];
          let totalAvg = 0;

          try {
            if (report.type === 'cpu-daily') {
              metrics = await MetricService.getCpuDaily(0, 'admin', group.hostgroup, host.hostname_id, report.mode as any, startDate, endDate);
            } else if (report.type === 'cpu-monthly') {
              metrics = await MetricService.getCpuMonthly(0, 'admin', group.hostgroup, host.hostname_id, String(month), String(year));
            } else if (report.type === 'mem-daily') {
              const res = await MetricService.getMemDaily(0, 'admin', group.hostgroup, host.hostname_id, report.mode as any, startDate, endDate);
              metrics = res.data;
              totalAvg = res.totalAvg;
            } else if (report.type === 'mem-monthly') {
              metrics = await MetricService.getMemMonthly(0, 'admin', group.hostgroup, host.hostname_id, String(month), String(year));
            }
          } catch (e) {
            console.error(`[Automation] Failed to fetch metrics for ${host.hostname} - ${report.label}:`, e);
          }

          return {
            label: report.label,
            metrics,
            report,
            totalAvg,
            hostname: host.hostname,
            hostMem: host.mem,
            startDate,
            endDate,
            month: String(month),
            year: String(year)
          };
        }));

        return {
          id: String(host.hostname_id),
          name: host.hostname,
          mem: host.mem,
          cpuStats,
          memStats,
          charts: hostCharts
        };
      }));

      const payload: ReportPayload = {
        reportMonth: `${monthName} ${year}`,
        reportTitle: `${group.hostgroup} Performance Report`,
        targetMonth: month,
        targetYear: year,
        generatedDate,
        hostgroups: [{ id: String(group.hostgroup_id), name: group.hostgroup, hosts: hostsWithData }]
      };

      try {
        const groupBuffer = await PdfGeneratorService.generatePdfBuffer(payload);
        pdfBuffers.push(groupBuffer);
        console.log(`[Automation] Successfully generated PDF for group: ${group.hostgroup}`);
      } catch (e) {
        console.error(`[Automation] Failed to generate PDF for group: ${group.hostgroup}`, e);
      }
    }

    if (pdfBuffers.length === 0) throw new Error("No PDFs were generated");

    console.log(`[Automation] Merging ${pdfBuffers.length} PDFs...`);
    const mergedPdf = await PDFDocument.create();

    for (const buffer of pdfBuffers) {
      const pdf = await PDFDocument.load(buffer);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const finalPdfBytes = await mergedPdf.save();
    const finalPath = path.join(outputDir, `MFEC_SAR_Full_Report_${year}_${String(month).padStart(2, '0')}.pdf`);
    fs.writeFileSync(finalPath, finalPdfBytes);

    console.log(`[Automation] Full report saved to: ${finalPath}`);
    return finalPath;
  }
}
