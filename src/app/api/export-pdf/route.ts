import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { ReportPayload } from '@/types/report';
import fs from 'fs';
import path from 'path';

const generateHTML = (payload: ReportPayload, pageMap: Record<string, number> = {}, logoBase64: string = '', totalLogicalPages: number = 0): string => {
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
  const offset = firstGroupPage > 0 ? firstGroupPage - 1 : 0;

  const title = payload.reportTitle || "MFEC Performance Report";

  return `
    <html>
      <head>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; color: #2d3436; margin: 0; padding: 0; line-height: 1.4; }
          .page-break { page-break-after: always; position: relative; min-height: 250mm; display: flex; flex-direction: column; }
          .content-wrapper { width: 100%; }
          a { text-decoration: none; color: inherit; }
          
          .cover { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 260mm; text-align: center; }
          .cover h1 { font-size: 24pt; color: #0984e3; margin-bottom: 10px; }
          .cover p { font-size: 12pt; margin: 5px 0; color: #636e72; }

          .toc h1 { font-size: 18pt; margin-bottom: 20px; color: #2d3436; border-bottom: 1px solid #dfe6e9; padding-bottom: 10px; }
          .toc-item { display: flex; align-items: baseline; font-size: 11pt; font-weight: bold; margin: 10px 0; }
          .toc-item .dots { flex: 1; border-bottom: 1px dotted #b2bec3; margin: 0 10px; }
          .toc-hostname { display: flex; align-items: baseline; font-size: 10pt; font-weight: normal; margin: 5px 0 5px 25px; color: #636e72; }
          .toc-hostname .dots { flex: 1; border-bottom: 1px dotted #dfe6e9; margin: 0 10px; }

          .header { display: flex; justify-content: space-between; border-bottom: 1px solid #dfe6e9; padding-bottom: 5px; margin-bottom: 15px; font-size: 7pt; color: #b2bec3; }
          .section-title { font-size: 14pt; font-weight: bold; color: #0984e3; margin-bottom: 15px; }
          h3 { font-size: 11pt; font-weight: bold; margin: 15px 0 8px 0; color: #2d3436; }
          .section-divider { font-size: 24pt; font-weight: bold; text-align: center; color: #0984e3; display: flex; align-items: center; justify-content: center; }
          
          table { width: 100%; border-collapse: collapse; margin: 10px 0 20px 0; }
          th, td { border: 1px solid #dfe6e9; padding: 4px; text-align: center; font-size: 7pt; }
          th { background: #f8f9fa; font-weight: bold; color: #636e72; }
          td.hostname-cell { text-align: left; padding-left: 10px; }
          
          .chart-container { height: 110mm; margin: 5px 0; display: flex; align-items: center; justify-content: center; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
          
          .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 7pt; color: #b2bec3; border-top: 0.5px solid #dfe6e9; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="cover page-break">
          ${logoBase64 ? `<img src="${logoBase64}" style="width: 150px; margin-bottom: 30px;" />` : ''}
          <h1>${title}</h1>
          <p style="font-size: 14pt; font-weight: bold;">${payload.reportMonth}</p>
          <p>Generated: ${payload.generatedDate}</p>
        </div>

        <div class="toc page-break">
          <h1>Table of Contents</h1>
          ${payload.hostgroups.map((g, gi) => `
            <div class="toc-item">
              <a href="#group-${gi}">${g.name}</a>
              <span class="dots"></span>
              <span class="toc-page">${pageMap[`group-${gi}`] ? pageMap[`group-${gi}`] - offset : ''}</span>
            </div>
            ${g.hosts.map((h, hi) => `
              <div class="toc-hostname">
                <a href="#host-${gi}-${hi}">${h.name}</a>
                <span class="dots"></span>
                <span class="toc-page">${pageMap[`host-${gi}-${hi}`] ? pageMap[`host-${gi}-${hi}`] - offset : ''}</span>
              </div>
            `).join('')}
          `).join('')}
        </div>

        ${payload.hostgroups.map((g, gi) => `
          <div id="group-${gi}" class="section-divider page-break">
            ${g.name}
          </div>
          
          <div id="group-stats-${gi}" class="page-break">
            <div class="header"><span>${title}</span><span>${g.name}</span></div>
            <div class="section-title">${g.name}</div>
            <h3>CPU Utilization (Last 12 Months)</h3>
            <table>
                <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                <tbody>${g.hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
                  const stat = (h.cpuStats || []).find(s => s.month === m.month && s.year === m.year);
                  return `<td>${stat ? stat.value : '-'}</td>`;
                }).join('')}</tr>`).join('')}</tbody>
            </table>
            <h3>Memory Utilization (Last 12 Months)</h3>
            <table>
                <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                <tbody>${g.hosts.map(h => `<tr><td class="hostname-cell">${h.name}</td>${months.map(m => {
                  const stat = (h.memStats || []).find(s => s.month === m.month && s.year === m.year);
                  return `<td>${stat ? stat.value : '-'}</td>`;
                }).join('')}</tr>`).join('')}</tbody>
            </table>
          </div>

          ${g.hosts.map((h, hi) => {
            const chartPairs: any[][] = [];
            for (let i = 0; i < (h.charts || []).length; i += 2) chartPairs.push(h.charts.slice(i, i + 2));
            return chartPairs.map((pair, pi) => {
              const pageId = `host-${gi}-${hi}${pi === 0 ? '' : '-p' + pi}`;
              return `
                <div id="${pageId}" class="page-break">
                  <div class="header"><span>${title}</span><span>${g.name} - ${h.name}</span></div>
                  ${pi === 0 ? `<div class="section-title">${h.name}</div>` : ''}
                  ${pair.map(chart => `
                    <h3>${h.name} - ${chart.label}</h3>
                    <div class="chart-container">
                      ${chart.data && chart.data.length > 100 ? `<img src="${chart.data}" />` : `<div style="color: #b2bec3; font-style: italic;">No data available</div>`}
                    </div>
                  `).join('')}
                </div>
              `;
            }).join('');
          }).join('')}
        `).join('')}
      </body>
    </html>
  `;
};

export async function POST(req: NextRequest) {
  let browser;
  try {
    const payload: ReportPayload = await req.json();
    if (!payload || !payload.hostgroups) throw new Error('Invalid payload');

    // Sort hostgroups and hosts alphabetically A-Z
    payload.hostgroups.sort((a, b) => a.name.localeCompare(b.name));
    payload.hostgroups.forEach(group => {
      if (group.hosts) {
        group.hosts.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    let logoBase64 = '';
    const logoPath = path.join(process.cwd(), 'public/logo/mfec1.png');
    if (fs.existsSync(logoPath)) {
        logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`;
    }

    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(generateHTML(payload, {}, logoBase64), { waitUntil: 'load' });

    const result = await page.evaluate(() => {
      const map: Record<string, number> = {};
      const elements = document.querySelectorAll('[id^="group-"], [id^="host-"]');
      const pageBreaks = Array.from(document.querySelectorAll('.page-break'));
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

    const offset = (result.map['group-0'] || 1) - 1;
    await page.setContent(generateHTML(payload, result.map, logoBase64, result.totalPhysicalPages - offset), { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      // Increased padding and adjusted templates for visual balance
      footerTemplate: `<div style="font-size: 8px; text-align: center; width: 100%; color: #636e72; padding: 5px 10mm 15mm 10mm; border-top: 0.5px solid #dfe6e9;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      headerTemplate: `<div style="font-size: 8px; text-align: center; width: 100%; color: #636e72; padding: 15mm 10mm 0 10mm;"></div>`,
      margin: { top: '20mm', bottom: '20mm', left: '10mm', right: '10mm' }
    });

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' }
    });
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
