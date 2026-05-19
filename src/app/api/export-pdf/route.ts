import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { ReportPayload } from '@/types/report';
import fs from 'fs';
import path from 'path';

const generateHTML = (payload: ReportPayload, pageMap: Record<string, number> = {}, logoBase64: string = '', totalLogicalPages: number = 0): string => {
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    if (payload.targetYear && payload.targetMonth) {
      // Set to 1st of the month AFTER the target month to match stats-last-12 logic
      d.setFullYear(payload.targetYear, payload.targetMonth, 1);
    }
    d.setMonth(d.getMonth() - 1 - i);
    return {
      label: d.toLocaleString('en-US', { month: 'short' }) + String(d.getFullYear()).slice(-2),
      month: d.getMonth() + 1,
      year: d.getFullYear()
    };
  });

  // Calculate offset if pageMap is available
  const firstGroupPage = pageMap['group-0'] || 0;
  const offset = firstGroupPage > 0 ? firstGroupPage - 1 : 0;

  const getFooter = (id: string) => {
    if (!pageMap[id] || totalLogicalPages === 0) return '';
    const logicalPage = pageMap[id] - offset;
    return `
      <div class="footer-spacer"></div>
      <div class="footer">
        Page ${logicalPage} of ${totalLogicalPages}
      </div>
    `;
  };

  return `
    <html>
      <head>
        <style>
          @page { size: A4 portrait; margin: 15mm 10mm; }
          body { font-family: sans-serif; color: #000000; margin: 0; padding: 0; }
          .page-break { 
            page-break-after: always; 
            position: relative; 
            min-height: 267mm; /* Optimized for A4 content area with 15mm margins */
            display: flex;
            flex-direction: column;
          }
          .content-wrapper { width: 100%; }
          a { text-decoration: none; color: inherit; }
          
          /* Cover & TOC */
          .cover { 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            height: calc(297mm - 30mm); 
            text-align: center; 
          }
          .logo { font-size: 24pt; font-weight: bold; margin-bottom: 20px; }
          .toc h1 { font-size: 24pt; margin-bottom: 30px; text-align: center; }
          .toc-item { display: flex; align-items: baseline; font-size: 16pt; font-weight: bold; margin: 15px 0; }
          .toc-item .dots { flex: 1; border-bottom: 2px dotted #000; margin: 0 10px; }
          .toc-page { font-size: inherit; }
          .toc-hostname { display: flex; align-items: baseline; font-size: 14pt; font-weight: normal; margin: 8px 0 8px 40px; }
          .toc-hostname .dots { flex: 1; border-bottom: 1px dotted #ccc; margin: 0 10px; }

          /* Content */
          .header { display: flex; justify-content: space-between; border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 10px; font-size: 8pt; }
          .section-title { font-size: 14pt; font-weight: bold; margin-bottom: 10px; }
          h3 { font-size: 14pt; font-weight: bold; margin: 10px 0; }
          .section-divider { font-size: 32pt; font-weight: bold; text-align: center; justify-content: center; align-items: center; }
          .content-indent { padding-left: 40px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #000; padding: 4px; text-align: center; font-size: 8pt; }
          th { background: #f0f0f0; }
          .chart-container { height: 110mm; margin: 2px 0; display: flex; align-items: center; justify-content: center; }
          img { max-width: 100%; max-height: 100%; object-fit: contain; }
          
          .footer-spacer { height: 5mm; }
          .footer {
            position: absolute;
            bottom: -12mm;
            width: 100%;
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 0.5px solid #eee;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <!-- Cover Page -->
        <div class="cover page-break">
          <div class="content-wrapper">
            ${logoBase64 ? `<img src="${logoBase64}" style="width: 200px; margin-bottom: 20px;" />` : ''}
            <h1>MFEC Performance Report</h1>
            <p style="font-size: 18pt;">${payload.reportMonth}</p>
            <p style="font-size: 12pt;">Generated: ${payload.generatedDate}</p>
          </div>
        </div>

        <!-- TOC Page -->
        <div class="toc page-break">
          <div class="content-wrapper">
            <h1>Table of Contents</h1>
            <div style="padding-left: 40px;">
              ${payload.hostgroups.map((g, gi) => `
                <div class="toc-item">
                  <a href="#group-${gi}"><span>${g.name}</span></a>
                  <span class="dots"></span>
                  <span class="toc-page">${pageMap[`group-${gi}`] ? pageMap[`group-${gi}`] - offset : ''}</span>
                </div>
                ${g.hosts.map((h, hi) => `
                  <div class="toc-hostname">
                    <a href="#host-${gi}-${hi}"><span>${h.name}</span></a>
                    <span class="dots"></span>
                    <span class="toc-page">${pageMap[`host-${gi}-${hi}`] ? pageMap[`host-${gi}-${hi}`] - offset : ''}</span>
                  </div>
                `).join('')}
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Content -->
        ${payload.hostgroups.map((g, gi) => `
          <div id="group-${gi}" class="section-divider page-break">
            <div class="content-wrapper" style="display:flex; align-items:center; justify-content:center;">
              ${g.name}
            </div>
            ${getFooter(`group-${gi}`)}
          </div>
          
          <div id="group-stats-${gi}" class="page-break content-indent">
            <div class="content-wrapper">
              <div class="header"><span>MFEC Performance Report</span><span>${g.name}</span></div>
              <div class="section-title">${g.name}</div>
              <h3>CPU Utilization (Last 12 months)</h3>
              <table>
                  <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                  <tbody>${g.hosts.map(h => `<tr><td style="text-align:left;">${h.name}</td>${months.map(m => {
                    const stat = (h.cpuStats || []).find(s => s.month === m.month && s.year === m.year);
                    return `<td>${stat ? stat.value : '-'}</td>`;
                  }).join('')}</tr>`).join('')}</tbody>
              </table>
              <div style="height: 20px;"></div>
              <h3>Memory Utilization (Last 12 months)</h3>
              <table>
                  <thead><tr><th>Hostname</th>${months.map(m => `<th>${m.label}</th>`).join('')}</tr></thead>
                  <tbody>${g.hosts.map(h => `<tr><td style="text-align:left;">${h.name}</td>${months.map(m => {
                    const stat = (h.memStats || []).find(s => s.month === m.month && s.year === m.year);
                    return `<td>${stat ? stat.value : '-'}</td>`;
                  }).join('')}</tr>`).join('')}</tbody>
              </table>
            </div>
            ${getFooter(`group-stats-${gi}`)}
          </div>

          ${g.hosts.map((h, hi) => {
            const chartPairs: any[][] = [];
            for (let i = 0; i < (h.charts || []).length; i += 2) {
              chartPairs.push(h.charts.slice(i, i + 2));
            }

    return chartPairs.map((pair, pi) => {
      const pageId = `host-${gi}-${hi}${pi === 0 ? '' : '-p' + pi}`;
      return `
                <div id="${pageId}" class="page-break content-indent">
                  <div class="content-wrapper">
                    <div class="header"><span>MFEC Performance Report</span><span>${g.name} - ${h.name}</span></div>
                    ${pi === 0 ? `<div class="section-title" style="font-size: 16pt;">${h.name}</div>` : ''}
                    ${pair.map(chart => `
                      <h3 style="font-size: 14pt;">${h.name} - ${chart.label}</h3>
                      <div class="chart-container">
                        ${chart.data && chart.data.length > 100
          ? `<img src="${chart.data}" />`
          : `<div style="color: #999; font-style: italic;">No data available</div>`
        }
                      </div>
                    `).join('')}
                  </div>
                  ${getFooter(pageId)}
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
  console.log('API /api/export-pdf called');

  let browser;
  try {
    const payload: ReportPayload = await req.json();
    console.log('Payload received:', payload ? 'Yes' : 'No');
    if (!payload || !payload.hostgroups) {
      throw new Error('Invalid or empty payload received');
    }

    // Prepare logo base64
    let logoBase64 = '';
    try {
      const possiblePaths = [
        path.join(process.cwd(), 'public/logo/mfec1.png'),
        path.join(process.cwd(), 'MPERF/public/logo/mfec1.png'),
        '/app/public/logo/mfec1.png'
      ];

      for (const logoPath of possiblePaths) {
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
          console.log('Logo loaded from:', logoPath);
          break;
        }
      }
    } catch (e) {
      console.warn('Could not load logo:', e);
    }

    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process'
      ]
    });

    console.log('Starting Pass 1 (Mock Render)');
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(120000);
    await page.setContent(generateHTML(payload, {}, logoBase64), { waitUntil: 'load' });

    console.log('Calculating Page Map');
    const result = await page.evaluate(() => {
      const map: Record<string, number> = {};
      const elements = document.querySelectorAll('[id^="group-"], [id^="host-"]');
      const pageBreaks = Array.from(document.querySelectorAll('.page-break'));

      elements.forEach(el => {
        let pageNum = 1;
        for (const pb of pageBreaks) {
          if (pb === el) break;
          if (pb.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) {
            pageNum++;
          }
        }
        map[el.id] = pageNum;
      });

      return {
        map,
        totalPhysicalPages: pageBreaks.length
      };
    });

    const pageMap = result.map;
    const firstGroupPage = pageMap['group-0'] || 1;
    const offset = firstGroupPage - 1;
    const totalLogicalPages = result.totalPhysicalPages - offset;

    console.log('Page Map Calculated:', pageMap);
    console.log(`Offset: ${offset}, Total Logical Pages: ${totalLogicalPages}`);

    console.log('Starting Pass 2 (Final Render)');
    await page.setContent(generateHTML(payload, pageMap, logoBase64, totalLogicalPages), { waitUntil: 'load' });

    console.log('Generating PDF');
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', bottom: '15mm', left: '10mm', right: '10mm' },
      displayHeaderFooter: false, // Using HTML-based footer for logical numbering
    });

    console.log('PDF Generated, returning buffer');
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: { 'Content-Type': 'application/pdf' }
    });

  } catch (error: any) {
    console.error('CRITICAL PDF Generation Error:', error);
    return new NextResponse(JSON.stringify({
      error: 'Failed to generate PDF',
      details: error.message || String(error),
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    if (browser) {
      console.log('Closing browser');
      await browser.close();
    }
  }
}
