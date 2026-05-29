import puppeteer from 'puppeteer';
import { ReportPayload } from '@/types/report';
import fs from 'fs';
import path from 'path';

export class PdfGeneratorService {
  private static cachedLogoBase64: string | null = null;

  static getLogoBase64() {
    if (this.cachedLogoBase64) return this.cachedLogoBase64;
    try {
      const logoPath = path.join(process.cwd(), 'public/logo/mfec1.png');
      if (fs.existsSync(logoPath)) {
        this.cachedLogoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
        return this.cachedLogoBase64;
      }
    } catch (e) {
      console.error('Failed to read logo:', e);
    }
    return '';
  }

  static getHighchartsScripts() {
    try {
      const hcPath = path.join(process.cwd(), 'node_modules/highcharts/highcharts.js');
      const expPath = path.join(process.cwd(), 'node_modules/highcharts/modules/exporting.js');

      let scripts = '';
      if (fs.existsSync(hcPath)) scripts += `<script>${fs.readFileSync(hcPath, 'utf8')}</script>`;
      if (fs.existsSync(expPath)) scripts += `<script>${fs.readFileSync(expPath, 'utf8')}</script>`;
      return scripts;
    } catch (e) {
      console.error('Failed to read Highcharts scripts:', e);
      return '<script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/exporting.js"></script>';
    }
  }

  static generateHTML(payload: ReportPayload, pageMap: Record<string, number> = {}, logoBase64: string = '', totalLogicalPages: number = 0, options: { skipCover?: boolean, skipTOC?: boolean, skipGroupCover?: boolean, pageOffset?: number, totalFullPages?: number } = {}): { html: string, chartsToRender: any[] } {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      if (payload.targetYear && payload.targetMonth) {
        d.setFullYear(payload.targetYear, payload.targetMonth, 1);
      }
      d.setMonth(d.getMonth() - 1 - i);
      return {
        label: d.toLocaleString('en-US', { month: 'short' }) + String(d.getFullYear()).slice(-2),
        month: d.getMonth() + 1,
        year: d.getFullYear()
      };
    });

    const firstGroupPage = pageMap['group-0'] || 0;
    const offset = options.pageOffset !== undefined ? -options.pageOffset + 1 : (firstGroupPage > 0 ? firstGroupPage - 1 : 0);
    const title = payload.reportTitle || "MFEC Performance Report";

    const sortedHostgroups = [...payload.hostgroups].sort((a, b) => a.name.localeCompare(b.name));

    const getLogicalFooter = (id: string, isReportingPage: boolean = true) => {
      if (!pageMap[id]) return '';
      const logicalPage = pageMap[id] - offset;
      if (logicalPage <= 0 && isReportingPage) return '';
      const displayPage = logicalPage;
      const totalDisplay = options.totalFullPages || totalLogicalPages;
      return `<div class="footer">Page ${displayPage} of ${totalDisplay}</div>`;
    };

    const chartsToRender: any[] = [];
    const hcScripts = this.getHighchartsScripts();

    const htmlContent = `
      <html>
        <head>
          ${hcScripts}
          <style>
            @page { size: A4 portrait; margin: 12mm; }
            body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; color: #2d3436; margin: 0; padding: 0; line-height: 1.4; width: 186mm; }
            .page-break { page-break-after: always; position: relative; height: 270mm; display: flex; flex-direction: column; page-break-inside: avoid; overflow: hidden; }
            .content-wrapper { width: 100%; }
            a { text-decoration: none; color: inherit; }
            .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 270mm; text-align: center; }
            .cover h1 { font-size: 24pt; color: #0984e3; margin-bottom: 10px; }
            .cover p { font-size: 12pt; margin: 5px 0; color: #636e72; }
            .toc { display: flex; flex-direction: column; padding-left: 15px; height: 270mm; }
            .toc-content { width: 95%; }
            .toc h1 { font-size: 18pt; margin-bottom: 20px; color: #2d3436; padding-bottom: 10px; text-align: center; width: 100%; }
            .toc-item { display: flex; align-items: baseline; font-size: 11pt; font-weight: bold; margin: 10px 0; }
            .toc-item .dots { flex: 1; border-bottom: 1px dotted #b2bec3; margin: 0 10px; }
            .toc-hostname { display: flex; align-items: baseline; font-size: 10pt; font-weight: normal; margin: 5px 0 5px 25px; color: #636e72; }
            .toc-hostname .dots { flex: 1; border-bottom: 1px dotted #dfe6e9; margin: 0 10px; }
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #dfe6e9; padding-bottom: 5px; margin-bottom: 10px; font-size: 7pt; color: #b2bec3; }
            .section-title { font-size: 14pt; font-weight: bold; color: #0984e3; margin-bottom: 10px; }
            h3 { font-size: 10pt; font-weight: bold; margin: 10px 0; color: #2d3436; }
            .section-divider { font-size: 24pt; font-weight: bold; text-align: center; color: #0984e3; display: flex; align-items: center; justify-content: center; height: 260mm; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0 15px 0; table-layout: fixed; }
            th, td { border: 1px solid #dfe6e9; padding: 3px; text-align: center; font-size: 6.5pt; word-wrap: break-word; }
            th { background: #f8f9fa; font-weight: bold; color: #636e72; }
            td.hostname-cell { text-align: left; padding-left: 5px; width: 110px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .chart-container { width: 100%; height: 115mm; margin: 2px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
            .chart-placeholder { width: 180mm; height: 100mm; }
            .footer { position: absolute; bottom: 2mm; left: 0; width: 100%; text-align: center; font-size: 7pt; color: #b2bec3; border-top: 0.5px solid #dfe6e9; padding-top: 5px; background: white; z-index: 100; break-inside: avoid; display: block; }
          </style>
        </head>
        <body>
          ${!options.skipCover ? `
          <div id="cover" class="cover page-break">
            ${logoBase64 ? `<img src="${logoBase64}" style="width: 150px; margin-bottom: 30px;" />` : ''}
            <h1>${title}</h1>
            <p style="font-size: 14pt; font-weight: bold;">${payload.reportMonth}</p>
            <p>Generated: ${payload.generatedDate}</p>
          </div>` : ''}
          
          ${!options.skipTOC ? `
          <div id="toc" class="toc page-break">
            <div class="toc-content">
              <h1>Table of Contents</h1>
              ${sortedHostgroups.map((g, gi) => `
                <div class="toc-item">
                  <a href="#group-${gi}">${g.name}</a>
                  <span class="dots"></span>
                  <span class="toc-page">${pageMap[`group-${gi}`] ? pageMap[`group-${gi}`] + (options.pageOffset || 0) : ''}</span>
                </div>
                ${g.hosts.map((h, hi) => `
                  <div class="toc-hostname">
                    <a href="#host-${gi}-${hi}">${h.name}</a>
                    <span class="dots"></span>
                    <span class="toc-page">${pageMap[`host-${gi}-${hi}`] ? pageMap[`host-${gi}-${hi}`] + (options.pageOffset || 0) : ''}</span>
                  </div>
                `).join('')}
              `).join('')}
            </div>
          </div>` : ''}

          ${(options.skipCover && options.skipTOC) || (!options.skipCover && !options.skipTOC) ? sortedHostgroups.map((g, gi) => `
            ${!options.skipGroupCover ? `
            <div id="group-${gi}" class="section-divider page-break">
              ${g.name}
            </div>` : ''}
            <div id="group-stats-${gi}" class="page-break">
              ${getLogicalFooter(`group-stats-${gi}`, true)}
              <div class="header"><span>${title}</span><span>${g.name}</span></div>
              <div class="section-title">${g.name}</div>
              <h3>CPU Utilization (Last 12 Months)</h3>
              <table>
                  <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                  <tbody>${g.hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
      const stat = Array.isArray(h.cpuStats) ? h.cpuStats.find(s => s.month === m.month && s.year === m.year) : null;
      return `<td>${stat ? stat.value : '-'}</td>`;
    }).join('')}</tr>`).join('')}</tbody>
              </table>
              <h3>Memory Utilization (Last 12 Months)</h3>
              <table>
                  <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                  <tbody>${g.hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
      const stat = Array.isArray(h.memStats) ? h.memStats.find(s => s.month === m.month && s.year === m.year) : null;
      return `<td>${stat ? stat.value : '-'}</td>`;
    }).join('')}</tr>`).join('')}</tbody>
              </table>
            </div>
            ${g.hosts.map((h, hi) => {
      const charts = h.charts || [];
      const chartPairs: any[][] = [];
      for (let i = 0; i < charts.length; i += 2) chartPairs.push(charts.slice(i, i + 2));
      return chartPairs.map((pair, pi) => {
        const pageId = `host-${gi}-${hi}${pi === 0 ? '' : '-p' + pi}`;
        return `
                  <div id="${pageId}" class="page-break">
                    ${getLogicalFooter(pageId, true)}
                    <div class="header"><span>${title}</span><span>${g.name} - ${h.name}</span></div>
                    ${pi === 0 ? `<div class="section-title">${h.name}</div>` : ''}
                    ${pair.map((chart, ci) => {
          const chartId = `chart-${gi}-${hi}-${ci}-${pi}`;
          
          if (chart.data) {
            return `
              <h3>${h.name} - ${chart.label}</h3>
              <div class="chart-container">
                <img src="${chart.data}" style="width: 100%; height: auto; max-height: 100mm; object-fit: contain;" />
              </div>
            `;
          }

          if (chart.data) {
            return `
              <h3>${h.name} - ${chart.label}</h3>
              <div class="chart-container">
                <img src="${chart.data}" style="width: 100%; height: auto; max-height: 100mm; object-fit: contain;" />
              </div>
            `;
          }

          chartsToRender.push({ id: chartId, ...chart });
          return `
                        <h3>${h.name} - ${chart.label}</h3>
                        <div class="chart-container">
                          <div id="${chartId}" class="chart-placeholder"></div>
                        </div>
                      `;
        }).join('')}
                  </div>
                `;
      }).join('');
    }).join('')}
          `).join('') : ''}
          <script>
            window.getChartOptions = function(metrics, report, hostname, totalMem, startDate, endDate, targetMonth, targetYear, totalAvg) {
                if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };
                const isMonthly = report.type?.includes('monthly') || report.id?.includes('monthly');
                const type = report.mode || 'Normal';
                const baseOptions = {
                  chart: { backgroundColor: '#ffffff', shadow: false, animation: false },
                  title: { style: { fontSize: '14px', fontWeight: 'bold' } },
                  subtitle: { style: { fontSize: '12px' } },
                  legend: { itemStyle: { fontSize: '8px' }, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 10, margin: 15 },
                  credits: { enabled: false },
                  xAxis: { labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } } },
                  plotOptions: { series: { animation: false } }
                };
                const COLORS = { idle: '#4572A7', wio: '#FFFF99', nice: '#89A54E', steal: '#AA4643', usr: '#FFCC00', sys: '#00FF00', memUsage: '#AA4643', memPeak: '#92A8CD', memAvg: '#AA4643' };
                if (isMonthly) {
                  const timeLabels = Array.from(new Set(metrics.map(function(m) { return m.time_label; }))).sort();
                  const daySeriesMap = {};
                  metrics.forEach(function(m) {
                    if (!daySeriesMap[m.day]) daySeriesMap[m.day] = new Array(timeLabels.length).fill(null);
                    const idx = timeLabels.indexOf(m.time_label);
                    if (idx !== -1) {
                      const rawVal = Number(m.val !== undefined ? m.val : m.mem);
                      daySeriesMap[m.day][idx] = (report.type?.includes('cpu') || report.id?.includes('cpu')) ? (100 - rawVal) : rawVal;
                    }
                  });
                  const series = Object.keys(daySeriesMap).sort(function(a, b) { return Number(a) - Number(b); }).map(function(day) { return { name: day, data: daySeriesMap[Number(day)], type: 'line' }; });
                  return Object.assign({}, baseOptions, { chart: Object.assign({}, baseOptions.chart, { type: 'line' }), title: { text: ((report.type?.includes('cpu') || report.id?.includes('cpu')) ? 'CPU' : 'Memory') + ' Monthly Usage' }, subtitle: { text: 'Hostname : ' + hostname + ' Month : ' + targetMonth + '/' + targetYear }, xAxis: Object.assign({}, baseOptions.xAxis, { categories: timeLabels, tickInterval: 10 }), yAxis: { title: { text: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 'Percent' : 'Memory (' + totalMem + ' GB)', style: { fontSize: '10px' } }, min: 0, max: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 100 : totalMem, labels: { style: { fontSize: '8px' } } }, series: series, plotOptions: { line: { marker: { enabled: false } } } });
                }
                const categories = metrics.map(function(m) {
                    const d = new Date(m.time);
                    if (!isNaN(d.getTime())) {
                        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                        if (type === 'Average' || type === 'Peak') return dateStr;
                        const timeStr = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
                        return (startDate !== endDate) ? dateStr + ' ' + timeStr : timeStr;
                    }
                    return String(m.time);
                });
                let series = []; let stacking = undefined;
                if (report.type === 'cpu-daily' || report.id?.includes('cpu-daily')) {
                  if (type === 'Peak') { series = [{ name: '%peak', data: metrics.map(function(m) { return 100 - (Number(m.idle) || 0); }), color: COLORS.steal, type: 'spline', lineWidth: 2 }, { name: '%avg', data: metrics.map(function(m) { return Number(m.usr) || 0; }), color: COLORS.memPeak, type: 'area', lineWidth: 1 }]; }
                  else { stacking = 'percent'; const first = metrics[0] || {}; const map = [{ key: 'idle', name: '%idle', color: COLORS.idle }, { key: 'wio', name: '%wio', color: COLORS.wio }, { key: 'nice', name: '%nice', color: COLORS.nice }, { key: 'steal', name: '%steal', color: COLORS.steal }, { key: 'usr', name: '%usr', color: COLORS.usr }, { key: 'sys', name: '%sys', color: COLORS.sys }]; series = map.filter(function(m) { return first.hasOwnProperty(m.key); }).map(function(m) { return { name: m.name, data: metrics.map(function(data) { return Number(data[m.key] || 0); }), color: m.color, type: 'area' }; }); }
                } else {
                  if (type === 'Normal') { series = [{ name: 'mem usage', data: metrics.map(function(m) { return Number(m.mem) || 0; }), color: COLORS.memUsage, type: 'area' }]; }
                  else { series = [{ name: 'mem peak', data: metrics.map(function(m) { return Number(m.mem) || 0; }), color: COLORS.memPeak, type: 'spline' }, { name: 'mem avg', data: metrics.map(function(m) { return Number(m.avg_mem) || 0; }), color: COLORS.memAvg, type: 'area' }]; }
                }
                const options = Object.assign({}, baseOptions, { title: { text: 'Sar ' + startDate + ' To ' + endDate }, subtitle: { text: 'Hostname : ' + hostname + ' Type : ' + type }, xAxis: Object.assign({}, baseOptions.xAxis, { categories: categories, tickInterval: (type === 'Peak' || type === 'Average') ? 1 : Math.max(1, Math.floor(metrics.length / 20)), labels: Object.assign({}, baseOptions.xAxis.labels, { step: (type === 'Peak' || type === 'Average') ? 1 : undefined }) }), yAxis: { title: { text: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 'Percent' : 'Memory (' + (totalMem || '?') + ' GB)', style: { fontSize: '10px' } }, min: 0, max: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 100 : (totalMem || undefined), maxPadding: (report.type?.includes('mem') || report.id?.includes('mem')) ? 0.2 : 0, endOnTick: (report.type?.includes('mem') || report.id?.includes('mem')) ? false : true, labels: { style: { fontSize: (type === 'Peak' || type === 'Average') ? '6px' : '8px' }, formatter: function () { if ((report.type?.includes('mem') || report.id?.includes('mem')) && totalMem) { const val = this.value; const percent = ((val / totalMem) * 100).toFixed(1); return val + ' GB (' + percent + '%)'; } return String(this.value); } } }, series: series, plotOptions: { area: { stacking: stacking, lineColor: '#000000', lineWidth: type === 'Normal' ? 0.5 : 0.1, marker: { enabled: false } }, spline: { marker: { enabled: true, radius: 2 } } } });
                if ((report.type?.includes('mem') || report.id?.includes('mem')) && type === 'Normal' && totalAvg !== undefined) {
                  const avgPercent = totalMem ? ((totalAvg / totalMem) * 100).toFixed(1) : 0;
                  options.yAxis.plotLines = [{ value: totalAvg, color: 'white', dashStyle: 'Dash', width: 2, label: { text: 'AVG Memory Usage = ' + totalAvg.toFixed(2) + ' GB = ' + avgPercent + '%', y: 15, style: { color: '#CC0000', fontSize: '8px' }, align: 'right', verticalAlign: 'top', textAlign: 'right', x: 0 } }];
                }
                return options;
            };
          </script>
        </body>
      </html>
    `;
    return { html: htmlContent, chartsToRender };
  }

  static async generatePdfBuffer(payload: ReportPayload, options: { skipCover?: boolean, skipTOC?: boolean, skipGroupCover?: boolean, pageOffset?: number, totalFullPages?: number, pageMap?: Record<string, number> } = {}): Promise<Buffer> {
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      protocolTimeout: 1200000, // 20 minutes for very large chunks
      ignoreHTTPSErrors: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage', 
        '--disable-gpu', 
        '--no-zygote', 
        '--js-flags=--max-old-space-size=4096',
        '--single-process',
        '--disable-extensions'
      ]
    } as any);

    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(600000); // 10 minutes
      await page.setViewport({ width: 1200, height: 1600 });

      const logoBase64 = this.getLogoBase64();
      const initialPageMap = options.pageMap || {};
      const firstPass = this.generateHTML(payload, initialPageMap, logoBase64, options.totalFullPages || 0, options);
      await page.setContent(firstPass.html, { waitUntil: 'domcontentloaded', timeout: 600000 });

      const CHUNK_SIZE = 50;
      const renderBatch = async (charts: any[]) => {
        await page.evaluate((data: any) => { (window as any).accumulatedCharts = data; }, charts as any);
        await page.evaluate(() => {
          const charts = (window as any).accumulatedCharts;
          charts.forEach((item: any) => {
            try {
              const options = (window as any).getChartOptions(item.metrics, item.report, item.hostname, item.hostMem, item.startDate, item.endDate, item.month, item.year, item.totalAvg);
              options.chart.width = 680; options.chart.height = 380;
              (window as any).Highcharts.chart(item.id, options);
            } catch (e) { console.error('Error rendering chart ' + item.id, e); }
          });
        });
      };

      for (let i = 0; i < firstPass.chartsToRender.length; i += CHUNK_SIZE) {
        await renderBatch(firstPass.chartsToRender.slice(i, i + CHUNK_SIZE));
      }
      await new Promise(r => setTimeout(r, Math.min(15000, firstPass.chartsToRender.length * 50)));

      const result = await page.evaluate(() => {
        const map: Record<string, number> = {};
        const elements = document.querySelectorAll('#cover, #toc, [id^="group-"], [id^="host-"]');
        const pageBreaks = Array.from(document.querySelectorAll('.page-break')) as HTMLElement[];
        elements.forEach(el => {
          let pageNum = 1;
          for (const pb of pageBreaks) {
            if (pb === el) break;
            if (pb.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) pageNum++;
          }
          map[el.id] = pageNum;
        });
        return { map, totalPhysicalPages: pageBreaks.length };
      });

      const offset = (result.map['group-0'] || (options.skipCover ? 1 : (options.skipTOC ? 2 : 3))) - 1;
      const finalPass = this.generateHTML(payload, result.map, logoBase64, result.totalPhysicalPages - offset, options);
      await page.setContent(finalPass.html, { waitUntil: 'domcontentloaded', timeout: 600000 });

      for (let i = 0; i < finalPass.chartsToRender.length; i += CHUNK_SIZE) {
        await renderBatch(finalPass.chartsToRender.slice(i, i + CHUNK_SIZE));
      }
      await new Promise(r => setTimeout(r, Math.min(15000, finalPass.chartsToRender.length * 50)));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '12mm', bottom: '12mm', left: '12mm', right: '12mm' }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
