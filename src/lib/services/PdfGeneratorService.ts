import puppeteer from 'puppeteer';
import { ReportPayload, HostData, ChartData } from '@/types/report';
import fs from 'fs';
import path from 'path';

interface ChartToRender extends ChartData {
  id: string;
}

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

  static generateHTML(payload: ReportPayload, pageMap: Record<string, number> = {}, logoBase64: string = '', totalLogicalPages: number = 0, options: { skipCover?: boolean, skipTOC?: boolean, skipGroupCover?: boolean, skipStats?: boolean, skipCharts?: boolean, skipContent?: boolean, groupIndexOffset?: number, hostIndexOffset?: number, pageOffset?: number, totalFullPages?: number } = {}): { html: string, chartsToRender: ChartToRender[] } {
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
    // Use pageOffset from options if provided, otherwise fallback to dynamic calculation.
    const offset = options.pageOffset !== undefined ? options.pageOffset : (firstGroupPage > 0 ? (firstGroupPage - 1) : 2);
    const title = (payload.reportTitle || "MFEC Performance Report").toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    const formatChartLabel = (hostname: string, label: string) => {
      const lower = label.toLowerCase();
      if (lower.includes('cpu daily (average)') || lower.includes('cpu daily (avg)')) {
        return `${hostname} cpu daily (Average)`;
      }
      if (lower.includes('cpu daily (peak)')) {
        return `${hostname} cpu daily (Peak)`;
      }
      if (lower.includes('cpu monthly')) {
        return `${hostname} cpu monthly`;
      }
      if (lower.includes('memory daily (normal)') || lower.includes('mem daily (normal)')) {
        return `${hostname} memory daily (Normal)`;
      }
      if (lower.includes('memory daily (peak)') || lower.includes('mem daily (peak)')) {
        return `${hostname} memory daily (Peak)`;
      }
      if (lower.includes('memory monthly') || lower.includes('mem monthly')) {
        return `${hostname} memory monthly`;
      }

      let cleanLabel = lower;
      cleanLabel = cleanLabel.replace('average', 'Average');
      cleanLabel = cleanLabel.replace('peak', 'Peak');
      cleanLabel = cleanLabel.replace('normal', 'Normal');
      return `${hostname} ${cleanLabel}`;
    };

    const displayHostgroups = payload.hostgroups;

    const getLogicalFooter = (id: string, isReportingPage: boolean = true) => {
      if (!pageMap[id]) return '';
      const logicalPage = pageMap[id] - offset;
      // Allow pages even if logicalPage <= 0 if they are part of the report structure, 
      // but only number them if they are > 0.
      if (logicalPage <= 0) return '';
      const displayPage = logicalPage;
      return `<div class="footer">Page ${displayPage}</div>`;
    };

    const chartsToRender: ChartToRender[] = [];
    const hcScripts = this.getHighchartsScripts();

    // Use a counter for pages that don't have a specific ID mapping
    let runningPageCount = options.pageOffset || 0;

    const htmlContent = `
      <html>
        <head>
          ${hcScripts}
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; color: #000000; margin: 0; padding: 0; line-height: 1.4; width: 180mm; }
            .page-break { page-break-after: always; position: relative; min-height: 255mm; display: flex; flex-direction: column; }
            .content-wrapper { width: 100%; }
            a { text-decoration: none; color: inherit; }
            .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 267mm; text-align: center; }
            .cover h1 { font-size: 24pt; color: #000000; margin-bottom: 10px; font-weight: bold; }
            .cover p { font-size: 12pt; margin: 5px 0; color: #000000; }
            .toc { display: flex; flex-direction: column; padding-left: 15px; min-height: 267mm; }
            .toc-content { width: 95%; }
            .toc h1 { font-size: 18pt; margin-bottom: 20px; color: #000000; padding-bottom: 10px; text-align: center; width: 100%; font-weight: bold; }
            .toc-item { display: flex; align-items: baseline; font-size: 14pt; font-weight: bold; margin: 8px 0; color: #000000; }
            .toc-item .dots { flex: 1; border-bottom: 1px dotted #000000; margin: 0 10px; }
            .toc-hostname { display: flex; align-items: baseline; font-size: 12pt; font-weight: normal; margin: 4px 0 4px 40px; color: #000000; }
            .toc-hostname .dots { flex: 1; border-bottom: 1px dotted #000000; margin: 0 10px; }
            .header { display: flex; justify-content: space-between; border-bottom: 1px solid #dfe6e9; padding-bottom: 5px; margin-bottom: 10px; font-size: 8pt; color: #000000; }
            .section-title { font-size: 16pt; font-weight: bold; color: #000000; margin-bottom: 10px; }
            h3 { font-size: 14pt; font-weight: bold; margin: 5px 0; color: #000000; }
            .section-divider { font-size: 32pt; font-weight: bold; text-align: center; color: #000000; display: flex; align-items: center; justify-content: center; height: 257mm; }
            table { width: 100%; border-collapse: collapse; margin: 5px 0 15px 0; table-layout: auto; }
            th, td { border: 1px solid #dfe6e9; padding: 4px; text-align: center; font-size: 7.5pt; color: #000000; }
            th { background: #f8f9fa; font-weight: bold; color: #000000; }
            td.hostname-cell { text-align: left; padding-left: 5px; width: auto; white-space: nowrap; color: #000000; }
            .chart-container { width: 100%; height: 112mm; margin: 2px 0; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; }
            .chart-placeholder { width: 100%; height: 107mm; }
            .footer { position: absolute; bottom: 2mm; left: 0; width: 100%; text-align: center; font-size: 8pt; color: #000000; border-top: 0.5px solid #dfe6e9; padding-top: 5px; background: white; z-index: 100; break-inside: avoid; display: block; }
          </style>
        </head>
        <body>
          ${(() => {
        if (!options.skipCover) runningPageCount++;
        return !options.skipCover ? `
            <div id="cover" class="cover page-break">
              ${logoBase64 ? `<img src="${logoBase64}" style="width: 150px; margin-bottom: 30px;" />` : ''}
              <h1>${title}</h1>
              <p style="font-size: 14pt; font-weight: bold;">${payload.reportMonth}</p>
              <p>Generated: ${payload.generatedDate}</p>
            </div>` : '';
      })()}
          
          ${(() => {
        if (!options.skipTOC) runningPageCount++;
        return !options.skipTOC ? `
            <div id="toc" class="toc page-break">
              <div class="toc-content">
                <h1>Table of Contents</h1>
                ${displayHostgroups.map((g, gi) => `
                  <div class="toc-item">
                    <a href="#group-${gi}">${g.name}</a>
                    <span class="dots"></span>
                    <span class="toc-page">${pageMap[`group-${gi}`] ? (pageMap[`group-${gi}`] - offset) : ''}</span>
                  </div>
                  ${g.hosts.map((h, hi) => `
                    <div class="toc-hostname">
                      <a href="#host-${gi}-${hi}">${h.name}</a>
                      <span class="dots"></span>
                      <span class="toc-page">${pageMap[`host-${gi}-${hi}`] ? (pageMap[`host-${gi}-${hi}`] - offset) : ''}</span>
                    </div>
                  `).join('')}
                `).join('')}
              </div>
            </div>` : '';
      })()}

          ${!options.skipContent && ((options.skipCover && options.skipTOC) || (!options.skipCover && !options.skipTOC)) ? displayHostgroups.map((g, gi) => {
        const currentGi = gi + (options.groupIndexOffset || 0);

        let groupHtml = '';

        if (!options.skipGroupCover) {
          runningPageCount++;
          groupHtml += `
                  <div id="group-${currentGi}" class="section-divider page-break">
                    ${g.name}
                  </div>`;
        }

        if (!options.skipStats && g.hosts && g.hosts.length > 0) {
          const hosts = g.hosts;
          const maxSingleTableRows = 30;
          const maxCombinedRows = 15;

          if (hosts.length <= maxCombinedRows) {
            runningPageCount++;
            const pageId = `group-stats-${currentGi}`;
            const displayPage = pageMap[pageId] || runningPageCount;
            const totalDisplay = options.totalFullPages || totalLogicalPages;
            groupHtml += `
                  <div id="${pageId}" class="page-break">
                    ${getLogicalFooter(pageId)}
                    <div class="header"><span>${title}</span><span>${g.name}</span></div>
                    <div class="section-title">${g.name}</div>
                    <h3>CPU Utilization stat (Last 12 months)</h3>
                    <table>
                        <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                        <tbody>${hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
              const stat = Array.isArray(h.cpuStats) ? h.cpuStats.find(s => s.month === m.month && s.year === m.year) : null;
              return `<td>${stat ? stat.value : '-'}</td>`;
            }).join('')}</tr>`).join('')}</tbody>
                    </table>
                    <div style="height: 1.2em;"></div>
                    <h3>Memory Utilization stat (Last 12 months)</h3>
                    <table>
                        <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                        <tbody>${hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
              const stat = Array.isArray(h.memStats) ? h.memStats.find(s => s.month === m.month && s.year === m.year) : null;
              return `<td>${stat ? stat.value : '-'}</td>`;
            }).join('')}</tr>`).join('')}</tbody>
                    </table>
                  </div>
                `;
          } else {
            const cpuPages: HostData[][] = [];
            for (let i = 0; i < hosts.length; i += maxSingleTableRows) {
              cpuPages.push(hosts.slice(i, i + maxSingleTableRows));
            }

            cpuPages.forEach((chunk, cpIndex) => {
              runningPageCount++;
              const pageId = cpIndex === 0 ? `group-stats-${currentGi}` : `group-stats-${currentGi}-cpu-${cpIndex}`;
              const displayPage = pageMap[pageId] || runningPageCount;
              const totalDisplay = options.totalFullPages || totalLogicalPages;
              groupHtml += `
                    <div id="${pageId}" class="page-break">
                      ${getLogicalFooter(pageId)}
                      <div class="header"><span>${title}</span><span>${g.name}</span></div>
                      <div class="section-title">${g.name}</div>
                      <h3>CPU Utilization stat (Last 12 months)${cpuPages.length > 1 ? ` (Part ${cpIndex + 1})` : ''}</h3>
                      <table>
                          <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                          <tbody>${chunk.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
                const stat = Array.isArray(h.cpuStats) ? h.cpuStats.find(s => s.month === m.month && s.year === m.year) : null;
                return `<td>${stat ? stat.value : '-'}</td>`;
              }).join('')}</tr>`).join('')}</tbody>
                      </table>
                    </div>
                  `;
            });

            const memPages: HostData[][] = [];
            for (let i = 0; i < hosts.length; i += maxSingleTableRows) {
              memPages.push(hosts.slice(i, i + maxSingleTableRows));
            }

            memPages.forEach((chunk, mpIndex) => {
              runningPageCount++;
              const pageId = `group-stats-${currentGi}-mem-${mpIndex}`;
              const displayPage = pageMap[pageId] || runningPageCount;
              const totalDisplay = options.totalFullPages || totalLogicalPages;
              groupHtml += `
                    <div id="${pageId}" class="page-break">
                      ${getLogicalFooter(pageId)}
                      <div class="header"><span>${title}</span><span>${g.name}</span></div>
                      <div class="section-title">${g.name}</div>
                      <h3>Memory Utilization stat (Last 12 months)${memPages.length > 1 ? ` (Part ${mpIndex + 1})` : ''}</h3>
                      <table>
                          <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                          <tbody>${chunk.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
                const stat = Array.isArray(h.memStats) ? h.memStats.find(s => s.month === m.month && s.year === m.year) : null;
                return `<td>${stat ? stat.value : '-'}</td>`;
              }).join('')}</tr>`).join('')}</tbody>
                      </table>
                    </div>
                  `;
            });
          }
        }

        if (!options.skipCharts && g.hosts && g.hosts.length > 0) {
          groupHtml += g.hosts.map((h, hi) => {
            const currentHi = hi + (options.hostIndexOffset || 0);
            const charts = h.charts || [];
            const chartPairs: ChartData[][] = [];
            for (let i = 0; i < charts.length; i += 2) chartPairs.push(charts.slice(i, i + 2));
            return chartPairs.map((pair, pi) => {
              runningPageCount++;
              const pageId = `host-${currentGi}-${currentHi}${pi === 0 ? '' : '-p' + pi}`;
              const displayPage = pageMap[pageId] || runningPageCount;
              const totalDisplay = options.totalFullPages || totalLogicalPages;
              return `
                    <div id="${pageId}" class="page-break">
                      ${getLogicalFooter(pageId)}
                      <div class="header"><span>${title}</span><span>${g.name} - ${h.name}</span></div>
                      ${pi === 0 ? `<div class="section-title">${h.name}</div>` : ''}
                      ${pair.map((chart, ci) => {
                const chartId = `chart-${currentGi}-${currentHi}-${ci}-${pi}`;
                const formattedTitle = formatChartLabel(h.name, chart.label);

                if (chart.data) {
                  return `
                            <h3>${formattedTitle}</h3>
                            <div class="chart-container">
                              <img src="${chart.data}" style="width: 100%; height: auto; max-height: 110mm; object-fit: contain;" />
                            </div>
                          `;
                }

                chartsToRender.push({ id: chartId, ...chart });
                return `
                          <h3>${formattedTitle}</h3>
                          <div class="chart-container">
                            <div id="${chartId}" class="chart-placeholder"></div>
                          </div>
                        `;
              }).join('')}
                    </div>
                  `;
            }).join('');
          }).join('');
        }

        return groupHtml;
      }).join('') : ''}
          <script>
            window.getChartOptions = function(metrics, report, hostname, totalMem, startDate, endDate, targetMonth, targetYear, totalAvg) {
                if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };
                const isMonthly = report.type?.includes('monthly') || report.id?.includes('monthly');
                const type = report.mode || 'Normal';
                const baseOptions = {
                  chart: { backgroundColor: '#ffffff', shadow: false, animation: false, spacingBottom: 25, marginRight: 35, reflow: true },
                  title: { style: { fontSize: '14px', fontWeight: 'bold' } },
                  subtitle: { style: { fontSize: '12px' } },
                  legend: { 
                    itemStyle: { fontSize: '8px' }, 
                    borderWidth: 1, 
                    borderColor: '#e5e7eb', 
                    borderRadius: 8, 
                    padding: 6, 
                    margin: 10
                  },
                  credits: { enabled: false },
                  xAxis: { labels: { rotation: -45, align: 'right', style: { fontSize: '7.5pt' } } },
                  plotOptions: { 
                    series: { animation: false, enableMouseTracking: false },
                    area: { animation: false },
                    line: { animation: false },
                    spline: { animation: false }
                  }
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
                  else { 
                    stacking = 'percent'; 
                    const map = [{ key: 'idle', name: '%idle', color: COLORS.idle }, { key: 'wio', name: '%wio', color: COLORS.wio }, { key: 'nice', name: '%nice', color: COLORS.nice }, { key: 'steal', name: '%steal', color: COLORS.steal }, { key: 'usr', name: '%usr', color: COLORS.usr }, { key: 'sys', name: '%sys', color: COLORS.sys }]; 
                    const availableKeys = new Set();
                    metrics.forEach(function(m) { Object.keys(m).forEach(function(k) { availableKeys.add(k); }); });
                    series = map.filter(function(m) { return availableKeys.has(m.key); }).map(function(m) { return { name: m.name, data: metrics.map(function(data) { return Number(data[m.key] || 0); }), color: m.color, type: 'area' }; }); 
                  }
                } else {
                  if (type === 'Normal') { series = [{ name: 'mem usage', data: metrics.map(function(m) { return Number(m.mem) || 0; }), color: COLORS.memUsage, type: 'area' }]; }
                  else { series = [{ name: 'mem peak', data: metrics.map(function(m) { return Number(m.mem) || 0; }), color: COLORS.memPeak, type: 'spline' }, { name: 'mem avg', data: metrics.map(function(m) { return Number(m.avg_mem) || 0; }), color: COLORS.memAvg, type: 'area' }]; }
                }
                const options = Object.assign({}, baseOptions, { title: { text: 'Sar ' + startDate + ' To ' + endDate }, subtitle: { text: 'Hostname : ' + hostname + ' Type : ' + type }, xAxis: Object.assign({}, baseOptions.xAxis, { categories: categories, tickInterval: (type === 'Peak' || type === 'Average') ? 1 : Math.max(1, Math.floor(metrics.length / 20)), labels: Object.assign({}, baseOptions.xAxis.labels, { step: (type === 'Peak' || type === 'Average') ? 1 : undefined }) }), yAxis: { title: { text: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 'Percent' : 'Memory (' + (totalMem || '?') + ' GB)', style: { fontSize: '10px' } }, min: 0, max: (report.type?.includes('cpu') || report.id?.includes('cpu')) ? 100 : (totalMem || undefined), maxPadding: (report.type?.includes('mem') || report.id?.includes('mem')) ? 0.2 : 0, endOnTick: (report.type?.includes('mem') || report.id?.includes('mem')) ? false : true, labels: { style: { fontSize: '8px' }, formatter: function () { if ((report.type?.includes('mem') || report.id?.includes('mem')) && totalMem) { const val = this.value; const percent = ((val / totalMem) * 100).toFixed(1); return val + ' GB (' + percent + '%)'; } return String(this.value); } } }, series: series, plotOptions: { area: { stacking: stacking, lineColor: '#000000', lineWidth: type === 'Normal' ? 0.5 : 0.1, marker: { enabled: false } }, spline: { marker: { enabled: true, radius: 2 } } } });
                if ((report.type?.includes('mem') || report.id?.includes('mem')) && type === 'Normal' && totalAvg !== undefined) {
                  const avgPercent = totalMem ? ((totalAvg / totalMem) * 100).toFixed(1) : 0;
                  options.yAxis.plotLines = [{ value: totalAvg, color: '#CC0000', dashStyle: 'Dash', width: 0, label: { text: 'AVG Memory Usage = ' + totalAvg.toFixed(2) + ' GB = ' + avgPercent + '%', y: -20, style: { color: '#CC0000', fontSize: '8px' }, align: 'right', verticalAlign: 'top', textAlign: 'right', x: 0 } }];
                }
                return options;
            };
          </script>
        </body>
      </html>
    `;
    return { html: htmlContent, chartsToRender };
  }

  static async generatePdfBuffer(payload: ReportPayload, options: { skipCover?: boolean, skipTOC?: boolean, skipGroupCover?: boolean, skipStats?: boolean, skipCharts?: boolean, skipContent?: boolean, groupIndexOffset?: number, hostIndexOffset?: number, pageOffset?: number, totalFullPages?: number, pageMap?: Record<string, number> } = {}): Promise<Buffer> {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      const renderBatch = async (charts: ChartToRender[]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await page.evaluate((data: any) => { (window as any).accumulatedCharts = data; }, charts as any);
        await page.evaluate(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const charts = (window as any).accumulatedCharts;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          charts.forEach((item: any) => {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const options = (window as any).getChartOptions(item.metrics, item.report, item.hostname, item.hostMem, item.startDate, item.endDate, item.month, item.year, item.totalAvg);
              options.chart.width = 670; options.chart.height = 400;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).Highcharts.chart(item.id, options);
            } catch (e) { console.error('Error rendering chart ' + item.id, e); }
          });
        });
      };

      for (let i = 0; i < firstPass.chartsToRender.length; i += CHUNK_SIZE) {
        await renderBatch(firstPass.chartsToRender.slice(i, i + CHUNK_SIZE));
      }
      // Wait for all charts in the first pass to render completely
      await new Promise(r => setTimeout(r, Math.max(2000, Math.min(60000, firstPass.chartsToRender.length * 400))));

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

      // Calculate global offset: find an element that exists in both initialPageMap and result.map
      let chunkGlobalOffset = 0;
      for (const key of Object.keys(result.map)) {
        if (initialPageMap[key]) {
          chunkGlobalOffset = initialPageMap[key] - result.map[key];
          break;
        }
      }

      const adjustedResultMap = { ...result.map };
      if (chunkGlobalOffset !== 0) {
        Object.keys(adjustedResultMap).forEach(key => {
          adjustedResultMap[key] += chunkGlobalOffset;
        });
      }

      const calculatedOffset = (result.map['group-0'] || (options.skipCover ? 1 : (options.skipTOC ? 2 : 3))) - 1;
      // Use provided pageOffset if available, otherwise use calculated offset from first pass.
      const forcedOffset = options.pageOffset !== undefined ? options.pageOffset : calculatedOffset;
      const finalPageMap = { ...initialPageMap, ...adjustedResultMap };
      const finalPass = this.generateHTML(payload, finalPageMap, logoBase64, result.totalPhysicalPages - forcedOffset, { ...options, pageOffset: forcedOffset });
      await page.setContent(finalPass.html, { waitUntil: 'domcontentloaded', timeout: 600000 });

      for (let i = 0; i < finalPass.chartsToRender.length; i += CHUNK_SIZE) {
        await renderBatch(finalPass.chartsToRender.slice(i, i + CHUNK_SIZE));
      }
      // Wait for all charts in the final pass to render completely
      await new Promise(r => setTimeout(r, Math.max(2000, Math.min(30000, finalPass.chartsToRender.length * 200))));

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false,
        margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' }
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
