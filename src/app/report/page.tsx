'use client';
import autoTable from "jspdf-autotable";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Block from '@/components/common/Block';
import dynamic from 'next/dynamic';
import { FileDown, Download, CheckCircle2, XCircle, AlertCircle, CheckSquare, Square, FileText, List } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Highcharts from 'highcharts';
const HighchartsAny: any = Highcharts;

const SarChart = dynamic(() => import('@/components/charts/SarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-50 flex items-center justify-center animate-pulse border border-dashed rounded-lg text-xs text-gray-400">Loading Chart Engine...</div>
});

const ReportExportPage = () => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedHostnames, setSelectedHostnames] = useState<{id: string, name: string, group: string}[]>([]);
  const [isExporting, setIsFetchingPDF] = useState(false);
  
  const getPrevMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: format(firstDay), end: format(lastDay) };
  };
  
  const datesObj = getPrevMonthDates();
  const [startDate, setStartDate] = useState(datesObj.start);
  const [endDate, setEndDate] = useState(datesObj.end);
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1)); 
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));

  const [queryEnabled, setQueryEnabled] = useState(false);

  const { data: hostGroups } = useQuery({
    queryKey: ['hostGroups-batch-report'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const availableHostnames = useMemo(() => {
    if (!hostGroups || !Array.isArray(hostGroups)) return [];
    return hostGroups
      .filter((g: any) => selectedGroups.includes(g.hostgroup))
      .flatMap((g: any) => g.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem })));
  }, [hostGroups, selectedGroups]);

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]);
  };

  const selectAllGroups = () => {
    if (hostGroups) setSelectedGroups(hostGroups.map((g:any) => g.hostgroup));
  };

  const clearGroups = () => {
    setSelectedGroups([]);
    setSelectedHostnames([]);
  };

  const toggleHostname = (h: {id: string, name: string, group: string}) => {
    setSelectedHostnames(prev => prev.find(p => p.id === h.id) ? prev.filter(p => p.id !== h.id) : [...prev, h]);
  };

  const selectAllHostnames = () => {
    setSelectedHostnames(availableHostnames);
  };

  const clearHostnames = () => {
    setSelectedHostnames([]);
  };

  const isAllGroupsSelected = hostGroups && hostGroups.length > 0 && selectedGroups.length === hostGroups.length;
  const isAllHostnamesSelected = availableHostnames.length > 0 && selectedHostnames.length === availableHostnames.length;

  const structuredData = useMemo(() => {
    const groups: Record<string, {name: string, hosts: any[]}> = {};
    selectedHostnames.forEach(host => {
        if (!groups[host.group]) groups[host.group] = { name: host.group, hosts: [] };
        groups[host.group].hosts.push(host);
    });
    return Object.values(groups);
  }, [selectedHostnames]);

  const selectedReportsList = [
    { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average' },
    { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak' },
    { id: 'cpu-monthly-normal', label: 'CPU Monthly (Normal)', type: 'cpu-monthly', mode: 'Normal' },
    { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal' },
  ];

  const drawChartAtPos = async (pdf: jsPDF, elementId: string, title: string, yPos: number, height: number, pageWidth: number, marginX: number) => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.warn(`Element ${elementId} not found`);
        return;
    }
    
    const chartDiv = element.querySelector('[data-highcharts-chart]');
    const chartIndex = chartDiv ? parseInt(chartDiv.getAttribute('data-highcharts-chart') || '') : null;
    const chart: any = (chartIndex !== null && HighchartsAny.charts) ? HighchartsAny.charts[chartIndex] : null;

    pdf.setFontSize(16); pdf.setTextColor(0); 
    pdf.text(title, marginX, yPos - 5);
    
    try {
        if (chart && typeof chart.getSVG === 'function') {
            let svg = chart.getSVG({ chart: { width: 800, height: 400 } });
            svg = svg.replace(/(lab|oklab|lch|oklch)\([^)]+\)/gi, 'rgb(128,128,128)');
            
            const canvas = document.createElement('canvas');
            canvas.width = 1600; canvas.height = 800;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const img = new Image();
                const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(svgBlob);
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                });
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, 1600, 800);
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginX, yPos, pageWidth - (2 * marginX), height);
                URL.revokeObjectURL(url);
            }
        } else {
            // Check if it's a table first
            const tableElement = element.querySelector('table');
            if (tableElement) {
                // Use autoTable for reliable table rendering
                autoTable(pdf, {
                    html: tableElement as HTMLTableElement,
                    startY: yPos,
                    margin: { left: marginX, right: marginX },
                    styles: { 
                        fontSize: 7, 
                        cellPadding: 1,
                        valign: 'middle',
                        halign: 'center',
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200]
                    },
                    headStyles: { 
                        fillColor: [30, 58, 138], 
                        textColor: 255,
                        fontSize: 7,
                        fontStyle: 'bold'
                    },
                    bodyStyles: {
                        textColor: 50
                    },
                    alternateRowStyles: {
                        fillColor: [245, 247, 250]
                    },
                    columnStyles: {
                        0: { halign: 'left', fontStyle: 'bold', cellWidth: 30 }
                    }
                });
            } else {
                // Fallback to html2canvas for other elements
                const canvas = await html2canvas(element, { 
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: '#ffffff',
                    logging: false
                });
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', marginX, yPos, pageWidth - (2 * marginX), height);
            }
        }
    } catch (err) {
        console.error(`Error rendering chart ${elementId}:`, err);
    }
  };

  const handleExportPDF = async () => {
    if (isExporting) return;
    setIsFetchingPDF(true);

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 12;
    const marginY = 20;

    const pageMapping: Record<string, number> = {};
    const pageHeaders: Record<number, { left: string, right: string }> = {};

    try {
        // 1. Cover Page
        try {
            const logoImg = new Image();
            logoImg.src = '/logo/mfec.png';
            await new Promise((r) => { logoImg.onload = r; logoImg.onerror = r; });
            if (logoImg.complete && logoImg.naturalWidth > 0) {
                pdf.addImage(logoImg, 'PNG', pageWidth/2 - 25, 60, 50, 20);
            }
        } catch (e) {}

        pdf.setFontSize(32); pdf.setTextColor(30, 58, 138);
        pdf.text("MFEC Performance Report", pageWidth/2, 100, { align: 'center' });
        pdf.setFontSize(18); pdf.setTextColor(100);
        pdf.text(`Report Period: ${new Date(parseInt(year), parseInt(month)-1).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`, pageWidth/2, 115, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth/2, 130, { align: 'center' });

        // 2. Placeholder for TOC (Page 2)
        pdf.addPage();
        const tocPageIndex = 2;

        // 3. Content Body
        for (const group of structuredData) {
            // หน้า 1: Hostgroup Title Page
            pdf.addPage();
            const groupTitlePage = pdf.getNumberOfPages();
            pageMapping[`group-${group.name}`] = groupTitlePage;
            pageHeaders[groupTitlePage] = { left: "MFEC Performance Report", right: "" };
            pdf.setFontSize(32); pdf.setTextColor(0);
            pdf.text(group.name, pageWidth/2, pageHeight/2, { align: 'center' });

            // หน้า 2: CPU & Mem Stats
            pdf.addPage();
            const groupStatPage = pdf.getNumberOfPages();
            pageHeaders[groupStatPage] = { left: "MFEC Performance Report", right: group.name };
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(16); pdf.setTextColor(0);
            pdf.text(group.name, marginX, 30);
            pdf.setFont("helvetica", "normal");
            await drawChartAtPos(pdf, `group-stat-${group.name}-stat-cpu`, "Group CPU Utilization Stats (12 Months)", 45, 100, pageWidth, marginX);
            await drawChartAtPos(pdf, `group-stat-${group.name}-stat-mem`, "Group Memory Utilization Stats (12 Months)", 165, 100, pageWidth, marginX);

            for (const host of group.hosts) {
                // หน้า 3: CPU Daily (Average) & (Peak)
                pdf.addPage();
                const hostPage1 = pdf.getNumberOfPages();
                pageMapping[`host-${host.id}`] = hostPage1;
                pageHeaders[hostPage1] = { left: "MFEC Performance Report", right: `${group.name}-${host.name}` };
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(16); pdf.setTextColor(0);
                pdf.text(host.name, marginX, 30);
                pdf.setFont("helvetica", "normal");
                await drawChartAtPos(pdf, `host-item-${host.id}-cpu-daily-average`, `${host.name} - cpu daily (Average)`, 50, 100, pageWidth, marginX);
                await drawChartAtPos(pdf, `host-item-${host.id}-cpu-daily-peak`, `${host.name} - cpu daily (Peak)`, 170, 100, pageWidth, marginX);

                // หน้า 4: CPU Monthly & Mem Daily (Normal)
                pdf.addPage();
                const hostPage2 = pdf.getNumberOfPages();
                pageHeaders[hostPage2] = { left: "MFEC Performance Report", right: `${group.name}-${host.name}` };
                // No hostname title on this page per spec
                await drawChartAtPos(pdf, `host-item-${host.id}-cpu-monthly-normal`, `${host.name} - cpu monthly`, 50, 100, pageWidth, marginX);
                await drawChartAtPos(pdf, `host-item-${host.id}-mem-daily-normal`, `${host.name} - memory daily (Normal)`, 170, 100, pageWidth, marginX);
            }
        }

        // 4. Fill Table of Contents (Go back to Page 2)
        pdf.setPage(tocPageIndex);
        pdf.setFontSize(22); pdf.setTextColor(30, 58, 138);
        pdf.text("Table of Contents", marginX, 30);
        pdf.setDrawColor(200); pdf.line(marginX, 35, pageWidth - marginX, 35);
        
        let tocY = 50;
        const rightEdge = pageWidth - marginX;

        const drawTocLine = (label: string, pageNum: number, x: number, fontSize: number, isBold: boolean, color: number) => {
            pdf.setFontSize(fontSize);
            pdf.setTextColor(color);
            if (isBold) pdf.setFont("helvetica", "bold");
            else pdf.setFont("helvetica", "normal");
            
            pdf.text(label, x, tocY);
            
            const labelWidth = pdf.getTextWidth(label);
            const pageStr = String(pageNum || "?");
            const pageNumWidth = pdf.getTextWidth(pageStr);
            
            const dotsStart = x + labelWidth + 2;
            const dotsEnd = rightEdge - pageNumWidth - 2;
            
            if (dotsEnd > dotsStart) {
                pdf.setFont("helvetica", "normal");
                const dotWidth = pdf.getTextWidth(".");
                const numDots = Math.floor((dotsEnd - dotsStart) / dotWidth);
                pdf.text(".".repeat(numDots), dotsStart, tocY);
            }
            
            pdf.text(pageStr, rightEdge, tocY, { align: 'right' });
            pdf.link(x, tocY - 4, rightEdge - x, 6, { pageNumber: pageNum });
            pdf.setFont("helvetica", "normal"); // Reset
        };

        structuredData.forEach(group => {
            const groupPage = pageMapping[`group-${group.name}`];
            drawTocLine(group.name, groupPage, marginX, 16, true, 0);

            tocY += 10;
            group.hosts.forEach(host => {
                const hostPage = pageMapping[`host-${host.id}`];
                drawTocLine(host.name, hostPage, marginX + 10, 14, false, 50);

                tocY += 8;
                if (tocY > pageHeight - 20) { 
                    pdf.addPage(); 
                    pdf.setPage(pdf.getNumberOfPages()); 
                    tocY = 20; 
                }
            });
            tocY += 5;
        });

        // 5. Add Header & Footer
        const totalPages = pdf.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            
            // Header
            if (i > 1) { 
                const header = pageHeaders[i];
                pdf.setFontSize(8); pdf.setTextColor(150);
                if (header) {
                    pdf.text(header.left, marginX, 10);
                    if (header.right) {
                        pdf.text(header.right, pageWidth - marginX, 10, { align: 'right' });
                    }
                } else if (i === tocPageIndex) {
                    pdf.text("MFEC Performance Report", marginX, 10);
                }
            }
            
            // Footer
            if (i > 0) {
                pdf.setFontSize(8); pdf.setTextColor(150);
                pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }
        }

        pdf.save(`MFEC_Report_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error("PDF Failed:", error);
        alert("Export Failed. See console.");
    } finally {
        setIsFetchingPDF(false);
    }
  };

  return (
    <Block title="Structured Report Export" subtitle="MFEC Standard Performance Report Layout">
      <div className="grid grid-cols-12 gap-6 mb-8 text-xs">
        <div className="col-span-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-gray-500 uppercase flex items-center gap-2">
                <input type="checkbox" checked={isAllGroupsSelected || false} onChange={e => e.target.checked ? selectAllGroups() : clearGroups()} className="w-3.5 h-3.5" />
                1. Hostgroups
            </label>
          </div>
          <div className="border border-gray-200 rounded-lg h-48 overflow-y-auto p-1 space-y-0.5 bg-white shadow-inner">
            {hostGroups?.map((g: any) => (
              <label key={g.hostgroup_id} className={`w-full flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${selectedGroups.includes(g.hostgroup) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={selectedGroups.includes(g.hostgroup)} onChange={() => toggleGroup(g.hostgroup)} className="w-3 h-3 text-blue-600 rounded" />
                {g.hostgroup}
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-3 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="font-bold text-gray-500 uppercase flex items-center gap-2">
                <input type="checkbox" checked={isAllHostnamesSelected || false} onChange={e => e.target.checked ? selectAllHostnames() : clearHostnames()} disabled={availableHostnames.length === 0} className="w-3.5 h-3.5" />
                2. Hostnames
            </label>
          </div>
          <div className="border border-gray-200 rounded-lg h-48 overflow-y-auto p-1 space-y-0.5 bg-white shadow-inner">
            {availableHostnames.length === 0 ? (
                <div className="text-center py-10 text-gray-300 text-[10px] italic">Select group(s)</div>
            ) : availableHostnames.map((h: any) => (
              <label key={h.id} className={`w-full flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors ${selectedHostnames.find(s => s.id === h.id) ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <input type="checkbox" checked={!!selectedHostnames.find(s => s.id === h.id)} onChange={() => toggleHostname(h)} className="w-3.5 h-3.5 text-green-600 rounded" />
                {h.name}
              </label>
            ))}
          </div>
        </div>

        <div className="col-span-6 flex flex-col">
          <label className="font-bold text-gray-500 mb-2 uppercase">3. Report Configurations</label>
          <div className="flex-1 bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-inner flex gap-8">
            <div className="space-y-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase block tracking-widest">Daily Range</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-blue-200 rounded px-2 py-1 text-[10px] bg-white w-32" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-blue-200 rounded px-2 py-1 text-[10px] bg-white w-32 block" />
            </div>
            <div className="space-y-3">
                <span className="text-[10px] font-bold text-blue-600 uppercase block tracking-widest">Monthly Target</span>
                <select value={month} onChange={e => setMonth(e.target.value)} className="border border-blue-200 rounded px-2 py-1 text-[10px] bg-white w-32 block">
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={String(i+1)}>{new Date(2000, i).toLocaleString('en-US', {month: 'long'})}</option>)}
                </select>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} className="border border-blue-200 rounded px-2 py-1 text-[10px] bg-white w-32 block" />
            </div>
          </div>
        </div>

        <div className="col-span-12 flex justify-end gap-3 mt-2">
            <button onClick={() => setQueryEnabled(true)} disabled={selectedHostnames.length === 0} className="bg-blue-600 text-white px-10 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg disabled:bg-gray-300 transition-all flex items-center gap-2"><List className="w-4 h-4" /> Preview Structure</button>
            <button onClick={handleExportPDF} disabled={!queryEnabled || isExporting} className="bg-red-600 text-white px-10 py-3 rounded-xl text-sm font-bold hover:bg-red-700 shadow-lg disabled:bg-gray-300 transition-all flex items-center gap-2">{isExporting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <FileText className="w-4 h-4" />}{isExporting ? 'Exporting...' : 'Export Final PDF'}</button>
        </div>
      </div>

      <div className="space-y-24">
        {queryEnabled && structuredData.map(group => (
            <div key={group.name} className="space-y-12">
                <div className="bg-slate-100 p-4 border-l-4 border-blue-600">
                    <h2 className="text-3xl font-bold text-slate-800">{group.name}</h2>
                    <p className="text-sm text-slate-500">Hostgroup Level Summaries</p>
                </div>

                <div className="grid grid-cols-1 gap-12 pl-4">
                    <div id={`group-stat-${group.name}-stat-cpu`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-bold text-blue-600 uppercase mb-4 block">Group CPU Utilization Stats (12 Months)</span>
                        <ReportGroupStat group={group} type="cpu" month={month} year={year} />
                    </div>
                    <div id={`group-stat-${group.name}-stat-mem`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <span className="text-[10px] font-bold text-blue-600 uppercase mb-4 block">Group Memory Utilization Stats (12 Months)</span>
                        <ReportGroupStat group={group} type="mem" month={month} year={year} />
                    </div>
                </div>

                {group.hosts.map((host: any) => (
                    <div key={host.id} className="space-y-8 pl-12 border-l-2 border-gray-100 ml-4">
                        <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-green-500" /><h3 className="text-2xl font-bold text-slate-700">{host.name}</h3></div>
                        <div className="grid grid-cols-1 gap-10">
                            {selectedReportsList.map(item => (
                                <div key={item.id} id={`host-item-${host.id}-${item.id}`} className="bg-white p-6 border border-gray-100 rounded-2xl shadow-sm">
                                    <ReportContentItem type={item.type} mode={item.mode} host={host} startDate={startDate} endDate={endDate} month={month} year={year} itemLabel={item.label} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        ))}
      </div>
    </Block>
  );
};

const ReportGroupStat = ({ group, type, month, year }: any) => {
    const { data: metrics, isFetching } = useQuery({
        queryKey: ['report-group-stat', group.name, type, month, year],
        queryFn: async () => (await axios.get('/api/utilization/stats-last-12', { params: { hostgroup: group.name, month, year }, headers: { 'x-type': type } })).data
    });

    const months: Array<{ label: string; month: number; year: number }> = [];
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    for (let i = 1; i <= 12; i++) {
      const d = new Date(targetDate.getFullYear(), targetDate.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('en-US', { month: 'short' }) + String(d.getFullYear()).slice(-2), month: d.getMonth() + 1, year: d.getFullYear() });
    }

    if (isFetching) return <div className="h-32 flex items-center justify-center text-gray-400 text-xs">Loading {type.toUpperCase()} stats...</div>;

    return (
        <table className="w-full text-[9px] text-center border-collapse border border-gray-200">
            <thead>
                <tr className="bg-slate-800 text-white"><th className="border border-gray-300 px-2 py-1 text-left">Hostname</th>{months.map(m => <th key={m.label} className="border border-gray-300 px-1 py-1">{m.label}</th>)}</tr>
            </thead>
            <tbody>
                {group.hosts.map((host: any) => (
                    <tr key={host.id}>
                        <td className="border border-gray-300 px-2 py-1.5 font-bold text-left bg-gray-50">{host.name}</td>
                        {months.map(m => {
                            const val = metrics?.find((s: any) => s.hostname === host.name && s.month === m.month && s.year === m.year);
                            
                            let displayVal = '-';
                            if (val) {
                                if (type === 'cpu') {
                                    const idle = Number(val.avg_idle);
                                    if (!isNaN(idle)) {
                                        displayVal = (100 - idle).toFixed(2);
                                    }
                                } else {
                                    const v = Number(val.val);
                                    if (!isNaN(v)) {
                                        displayVal = v.toFixed(2);
                                    }
                                }
                            }
                            return <td key={m.label} className="border border-gray-300 px-1 py-1.5">{displayVal}</td>
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ReportContentItem = ({ type, mode, host, startDate, endDate, month, year, itemLabel }: any) => {
    const { data: response, isFetching } = useQuery({
        queryKey: ['report-item', type, mode, host.id, startDate, endDate, month, year],
        queryFn: async () => {
          const endpoint = type.includes('monthly') ? '/api/metrics/monthly' : `/api/metrics/${type}`;
          const params: any = { hostgroup: host.group, hostnameId: host.id, month, year, startDate, endDate, type: mode };
          if (type.includes('monthly')) params.type = type.startsWith('mem') ? 'r' : 'u';
          return (await axios.get(endpoint, { params })).data;
        }
    });

    if (isFetching) return <div className="h-64 flex items-center justify-center text-gray-400 gap-2 animate-pulse">Loading {host.name}...</div>;
    const metrics = Array.isArray(response) ? response : (response?.data || []);
    if (!metrics || metrics.length === 0) return <div className="h-64 flex items-center justify-center text-gray-300 italic border border-dashed border-gray-50 rounded-xl">No Data</div>;

    const totalMem = Number(host.mem || 16);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mMonth = monthNames[parseInt(month) - 1] || month;

    const chartOptions: Highcharts.Options = type.includes('monthly') ? {
        chart: { type: 'spline', height: 400 },
        title: { text: `${type.startsWith('cpu') ? 'CPU' : 'Memory'} Monthly Usage` },
        subtitle: { text: `Hostname : ${host.name} Month : ${mMonth}/${year}` },
        xAxis: { 
            categories: Array.from(new Set(metrics.filter((m: any) => String(m.day) === String(metrics[0]?.day)).map((m: any) => String(m.time_label)))) as string[], 
            tickInterval: 10, 
            labels: { 
                rotation: -45, 
                align: 'right',
                style: { fontSize: '10px', fontFamily: 'Verdana, sans-serif' } 
            } 
        },
        yAxis: { 
            title: { text: type.startsWith('cpu') ? 'Percent' : `Memory( ${totalMem} GB )` }, 
            min: 0, 
            max: type.startsWith('cpu') ? 100 : totalMem 
        },
        plotOptions: { spline: { marker: { enabled: false }, lineWidth: 1.5 } },
        series: Array.from(new Set(metrics.map((m: any) => m.day))).sort((a:any, b:any) => a-b).map(day => {
            const timeLabels = Array.from(new Set(metrics.filter((m: any) => String(m.day) === String(metrics[0]?.day)).map((m: any) => String(m.time_label)))) as string[];
            return { name: String(day), data: timeLabels.map(cat => {
                const point = metrics.find((m: any) => String(m.day) === String(day) && m.time_label === cat);
                return point ? (type.startsWith('cpu') ? (100 - (Number(point.val) || 0)) : Number(point.val || 0)) : null;
            })};
        })
    } : {
        chart: { height: 400 },
        title: { text: `Sar ${startDate} To ${endDate}` },
        subtitle: { text: `Hostname : ${host.name} | Type : ${mode}` },
        xAxis: { 
            categories: metrics.map((m: any) => { 
                if (!m.time) return 'N/A';
                if (mode === 'Peak' || mode === 'Average') {
                    return String(m.time).split('T')[0].split(' ')[0];
                }
                const d = new Date(m.time);
                if (isNaN(d.getTime())) return String(m.time);
                return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
            }), 
            tickInterval: (mode === 'Peak' || mode === 'Average') ? 1 : Math.max(1, Math.floor(metrics.length/20)), 
            labels: { rotation: -45, style: { fontSize: '8px' } } 
        },
        yAxis: { 
            title: { text: type.startsWith('cpu') ? 'Percent' : `Memory (${totalMem} GB)` }, 
            min: 0, 
            max: type.startsWith('cpu') ? 100 : totalMem,
            labels: {
                formatter: function() {
                    const val = (this as any).value as number;
                    if (type.startsWith('cpu')) return val + '%';
                    const percent = (val * 100 / totalMem).toFixed(2);
                    return val + ' GB (' + percent + '%)';
                }
            }
        },
        plotOptions: { 
            area: { 
                stacking: (type === 'cpu-daily' && (mode === 'Normal' || mode === 'Average')) ? 'percent' : undefined, 
                lineColor: '#000000', 
                lineWidth: 0.1, 
                marker: { enabled: false } 
            },
            spline: { marker: { enabled: true } }
        },
        series: type === 'cpu-daily' ? (mode === 'Peak' ? [
            { name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline' }, 
            { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#92A8CD', type: 'area' }
        ] : (metrics[0]?.hasOwnProperty('nice') ? [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0), type: 'area' }, 
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99', type: 'area' },
            { name: '%nice', data: metrics.map((m: any) => Number(m.nice) || 0), type: 'area' },
            { name: '%steal', data: metrics.map((m: any) => Number(m.steal) || 0), type: 'area' },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00', type: 'area' }, 
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00', type: 'area' }
        ] : [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0), type: 'area' }, 
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00', type: 'area' }, 
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00', type: 'area' },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99', type: 'area' }
        ])) : (mode === 'Peak' ? [
            { name: 'mem peak', data: metrics.map((m: any) => Number(m.mem) || 0), color: "#92A8CD", type: 'spline' }, 
            { name: 'mem avg', data: metrics.map((m: any) => Number(m.avg_mem) || 0), color: "#AA4643", type: 'area' }
        ] : [
            { name: 'mem usage', data: metrics.map((m: any) => Number(m.mem) || 0), color: "#AA4643", type: 'area' }
        ])
    };

    if (type === 'mem-daily' && mode === 'Normal') {
        const totalAvg = response?.totalAvg || metrics.reduce((acc: number, m: any) => acc + Number(m.mem), 0) / metrics.length;
        chartOptions.yAxis = { ...chartOptions.yAxis, plotLines: [{ value: totalMem, color: 'white', dashStyle: 'Dash', width: 2, label: { text: `AVG Memory Usage = ${totalAvg.toFixed(2)} GB = ${((totalAvg / totalMem) * 100).toFixed(2)} %`, y: 15, style: { color: '#CC0000' }, align: 'right' } }] };
    }

    return <SarChart options={chartOptions} />;
};

export default ReportExportPage;
