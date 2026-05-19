'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Block from '@/components/common/Block';
import Modal from '@/components/common/Modal';
import dynamic from 'next/dynamic';
import { 
  ChevronDown, 
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { ReportPayload } from '@/types/report';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), { ssr: false });

const Highcharts = typeof window !== 'undefined' ? require('highcharts') : null;

// Helper to generate chart options for the PDF export
const getChartOptions = (metrics: any[], report: any, hostname: string, totalMem: number, startDate: string, endDate: string, targetMonth: string, targetYear: string, totalAvg?: number): any => {
  if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

  const isMonthly = report.type.includes('monthly');
  const type = report.mode;
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMonthLabel = monthNames[parseInt(targetMonth) - 1] || targetMonth;

  if (isMonthly) {
    // Logic from Monthly dashboard pages: Line chart with separate series per day
    const categoriesSet = new Set<string>();
    metrics.forEach((m: any) => {
        if (m.time_label) categoriesSet.add(String(m.time_label));
    });
    const categories: string[] = Array.from(categoriesSet).sort();

    const daySeriesMap: Record<number, Record<string, number>> = {};
    metrics.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
      const val = report.type.includes('cpu') ? (100 - (Number(m.val) || 0)) : (Number(m.val || m.mem) || 0);
      daySeriesMap[m.day][String(m.time_label)] = val;
    });

    const series = Object.keys(daySeriesMap).sort((a,b) => Number(a)-Number(b)).map(day => {
        const dayNum = Number(day);
        return {
            name: report.type.includes('cpu') ? String(day) : `Day ${day}`,
            data: categories.map((cat: string) => daySeriesMap[dayNum][cat] ?? null),
            type: 'line' as const
        };
    });

    return {
      chart: { type: 'line', backgroundColor: '#ffffff' },
      title: { text: `${report.type.includes('cpu') ? 'CPU' : 'Memory'} Monthly Usage`, style: { fontSize: '14px', fontWeight: 'bold' } },
      subtitle: { text: `Hostname : ${hostname} Month : ${mMonthLabel}/${targetYear}`, style: { fontSize: '12px' } },
      xAxis: { 
        categories, 
        tickInterval: Math.max(1, Math.floor(categories.length / 10)), 
        labels: { 
          rotation: -45, 
          align: 'right',
          style: { fontSize: '8px', fontFamily: 'Verdana, sans-serif' } 
        } 
      },
      yAxis: { 
        title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, 
        min: 0, 
        max: report.type.includes('cpu') ? 100 : (totalMem || undefined),
        labels: {
          formatter: function() {
            const val = (this as any).value;
            return report.type.includes('cpu') ? val : val + ' GB';
          },
          style: { fontSize: '8px' }
        }
      },
      series,
      plotOptions: { line: { lineWidth: 1, marker: { enabled: false } } },
      legend: { 
        itemStyle: { fontSize: '8pt' }, 
        maxHeight: 100, 
        itemMarginBottom: 2,
        itemDistance: 5,
        padding: 5
      },
      credits: { enabled: false }
    };
  }

  // Daily logic
  const categories = metrics.map((m: any) => {
    if (!m.time) return 'N/A';
    if (type === 'Average' || type === 'Peak') return String(m.time).split('T')[0];
    const d = new Date(m.time);
    if (isNaN(d.getTime())) return String(m.time);
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
  });
  const tickInterval = Math.max(1, Math.floor(metrics.length / 15));

  let series: any[] = [];
  if (report.type === 'cpu-daily') {
    if (type === 'Peak') {
      series = [
        { name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline' },
        { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#92A8CD' }
      ];
    } else {
      const hasNice = metrics[0]?.hasOwnProperty('nice');
      if (hasNice) {
          // Red Hat order: idle, wio, nice, steal, usr, sys
          series = [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0) },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' },
            { name: '%nice', data: metrics.map((m: any) => Number(m.nice) || 0) },
            { name: '%steal', data: metrics.map((m: any) => Number(m.steal) || 0) },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00' }
          ];
      } else {
          // Non-Red Hat (Solaris/AIX) order: idle, usr, sys, wio
          series = [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0) },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00' },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' }
          ];
      }
    }
  } else {
    // mem-daily
    if (type === 'Normal') {
       series = [{ name: 'mem usage', data: metrics.map((m: any) => Number(m.mem) || 0), color: '#AA4643' }];
    } else {
       series = [
         { name: 'mem peak', data: metrics.map((m: any) => Number(m.mem) || 0), color: "#92A8CD", type: 'spline' },
         { name: 'mem avg', data: metrics.map((m: any) => Number(m.avg_mem) || 0), color: "#AA4643", type: 'area' }
       ];
    }
  }

  let yAxisOptions: any = { 
    title: { text: report.type.includes('cpu') ? 'Percent' : `Memory (${totalMem || '?'} GB)` }, 
    min: 0, 
    max: report.type.includes('cpu') ? 100 : (totalMem || undefined),
    labels: {
      formatter: function() {
        const val = (this as any).value;
        return report.type.includes('cpu') ? val : val + ' GB';
      },
      style: { fontSize: '8px' }
    }
  };

  // Add AVG Memory Usage label for mem-daily Normal mode
  if (report.type === 'mem-daily' && type === 'Normal' && totalAvg !== undefined) {
    yAxisOptions.plotLines = [{
      value: totalMem,
      color: 'white',
      dashStyle: 'Dash',
      width: 2,
      label: {
        text: `AVG Memory Usage = ${totalAvg.toFixed(2)} GB = ${((totalAvg / totalMem) * 100).toFixed(2)}`,
        y: 15,
        style: { color: '#CC0000', fontSize: '10px', fontWeight: 'bold' },
        align: 'right'
      }
    }];
  }

  return {
    chart: { type: 'area', backgroundColor: '#ffffff' },
    title: { text: `Sar ${startDate} To ${endDate}`, style: { fontSize: '14px', fontWeight: 'bold' } },
    subtitle: { text: `Hostname : ${hostname} Type : ${type}`, style: { fontSize: '12px' } },
    xAxis: { 
      categories, 
      tickInterval, 
      labels: { 
        rotation: -45, 
        align: 'right',
        style: { fontSize: '8px', fontFamily: 'Verdana, sans-serif' } 
      } 
    },
    yAxis: yAxisOptions,
    series,
    plotOptions: { area: { stacking: (report.type.includes('cpu') && type !== 'Peak') ? 'percent' : undefined, marker: { enabled: false } } },
    legend: { itemStyle: { fontSize: '8pt' } },
    credits: { enabled: false }
  };
};

const ReportExportPage = () => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedHostnames, setSelectedHostnames] = useState<{ id: string, name: string, group: string, mem?: number }[]>([]);
  const [isExporting, setIsFetchingPDF] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Added for hidden rendering
  const [renderCharts, setRenderCharts] = useState(false);
  const [hiddenChartsData, setHiddenChartsData] = useState<any[]>([]);

  const getPrevMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return {
      start: format(firstDay),
      end: format(lastDay),
      month: String(firstDay.getMonth() + 1),
      year: String(firstDay.getFullYear())
    };
  };

  const datesObj = getPrevMonthDates();
  const [startDate, setStartDate] = useState(datesObj.start);
  const [endDate, setEndDate] = useState(datesObj.end);
  const [month, setMonth] = useState<string>(datesObj.month);
  const [year, setYear] = useState<string>(datesObj.year);

  const { data: hostGroupsRaw } = useQuery({
    queryKey: ['hostGroups-batch-report'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const hostGroups = useMemo(() => {
    if (!hostGroupsRaw) return [];
    return [...hostGroupsRaw].sort((a, b) => a.hostgroup.localeCompare(b.hostgroup));
  }, [hostGroupsRaw]);

  const toggleExpandAll = () => {
    if (expandedGroups.length === hostGroups?.length) setExpandedGroups([]);
    else setExpandedGroups(hostGroups?.map((g: any) => g.hostgroup) || []);
  };

  const toggleExpand = (groupName: string) => {
    setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
  };

  const toggleGroup = (groupName: string) => {
    const isSelected = selectedGroups.includes(groupName);
    const groupData = hostGroups?.find((g: any) => g.hostgroup === groupName);
    const groupHostnames = groupData?.hostnames.map((h: any) => ({
      id: String(h.hostname_id),
      name: h.hostname,
      group: groupName,
      mem: h.mem
    })) || [];

    if (isSelected) {
      setSelectedGroups(prev => prev.filter(g => g !== groupName));
      setSelectedHostnames(prev => prev.filter(h => h.group !== groupName));
    } else {
      setSelectedGroups(prev => [...prev, groupName]);
      setSelectedHostnames(prev => {
        const others = prev.filter(h => h.group !== groupName);
        return [...others, ...groupHostnames];
      });
    }
  };

  const toggleHostname = (h: { id: string, name: string, group: string, mem?: number }) => {
    setSelectedHostnames(prev => 
      prev.find(p => p.id === h.id) 
        ? prev.filter(p => p.id !== h.id) 
        : [...prev, { ...h, mem: h.mem }]
    );
  };

  const [activeReports, setActiveReports] = useState([
    { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average', enabled: true },
    { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak', enabled: true },
    { id: 'cpu-daily-normal', label: 'CPU Daily (Normal)', type: 'cpu-daily', mode: 'Normal', enabled: false },
    { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal', enabled: true },
    { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal', enabled: true },
    { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak', enabled: false },
    { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal', enabled: false },
  ]);

  const selectedReportsList = useMemo(() => activeReports.filter(r => r.enabled), [activeReports]);

  const toggleReport = (id: string) => {
    setActiveReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const moveReport = (index: number, direction: 'up' | 'down') => {
    const newReports = [...activeReports];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newReports.length) return;
    [newReports[index], newReports[target]] = [newReports[target], newReports[index]];
    setActiveReports(newReports);
  };

  const saveTemplate = async () => {
    if (!templateName || selectedHostnames.length === 0) return alert('Please enter a template name and select hosts.');
    try {
      await axios.post('/api/report-templates', {
        name: templateName,
        config: { startDate, endDate, month, year, selectedHostnames, activeReports }
      });
      const res = await axios.get('/api/report-templates');
      setTemplates(res.data);
      alert('Template saved successfully!');
    } catch (e: any) {
      console.error(e);
      alert('Failed to save template: ' + (e.response?.data?.error || e.message));
    }
  };

  const loadTemplate = (id: number) => {
    const t = templates.find(temp => temp.id === id);
    if (!t) return;
    const config = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
    setStartDate(config.startDate);
    setEndDate(config.endDate);
    setMonth(config.month);
    setYear(config.year);
    setSelectedHostnames(config.selectedHostnames);
    setActiveReports(config.activeReports);
  };

  const handlePreviewPDF = async () => {
    if (isExporting || selectedHostnames.length === 0) return;
    setIsFetchingPDF(true);
    setExportStatus('Fetching data...');

    const getChartSVG = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return "";
      const chart = (Highcharts as any).charts.find((c: any) => c && (c.renderTo === el?.querySelector('.highcharts-container')?.parentElement || el?.contains(c.renderTo)));
      if (!chart) return "";
      try {
        const svg = chart.getSVG({
          chart: { backgroundColor: '#ffffff', style: { fontFamily: 'sans-serif' } }
        });
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      } catch (e) {
        console.error("Failed to get SVG for", id, e);
        return "";
      }
    };

    const fetchHostStats = async (hostgroup: string, type: string) => {
      const { data } = await axios.get('/api/utilization/stats-last-12', { params: { hostgroup, month, year }, headers: { 'x-type': type } });
      return data;
    };

    const fetchMetrics = async (host: any, report: any) => {
      let endpoint = '';
      const params: any = { hostgroup: host.group, hostnameId: host.id };
      if (report.type === 'cpu-daily') { 
        endpoint = '/api/metrics/cpu-daily'; 
        params.type = report.mode; 
        params.startDate = startDate; 
        params.endDate = endDate; 
      }
      else if (report.type === 'cpu-monthly') { 
        endpoint = '/api/metrics/monthly'; 
        params.month = month; 
        params.year = year; 
      }
      else if (report.type === 'mem-daily') { 
        endpoint = '/api/metrics/mem-daily'; 
        params.type = report.mode; 
        params.startDate = startDate; 
        params.endDate = endDate; 
      }
      else if (report.type === 'mem-monthly') { 
        endpoint = '/api/metrics/monthly'; 
        params.month = month; 
        params.year = year; 
        params.type = 'r'; // Memory type
      }
      
      const { data } = await axios.get(endpoint, { params });
      return data;
    };

    const currentStructuredData = selectedHostnames.reduce((acc: any, host) => {
        if (!acc[host.group]) acc[host.group] = { name: host.group, hosts: [] };
        acc[host.group].hosts.push(host);
        return acc;
    }, {});
    const structuredDataArr = Object.values(currentStructuredData);

    try {
      // Step 1: Fetch all data
      setExportStatus('Fetching chart metrics...');
      const chartsData: any[] = [];
      const hostgroupsWithData = await Promise.all(structuredDataArr.map(async (group: any) => {
        const cpuRaw = await fetchHostStats(group.name, 'cpu');
        const memRaw = await fetchHostStats(group.name, 'mem');

        const hostsWithStats = await Promise.all(group.hosts.map(async (host: any) => {
          const hostCpuStats = cpuRaw
            .filter((row: any) => row.hostname === host.name)
            .map((row: any) => ({ month: row.month, year: row.year, value: (100 - (Number(row.avg_idle) || 0)).toFixed(2) }));
          
          const hostMemStats = memRaw
            .filter((row: any) => row.hostname === host.name)
            .map((row: any) => ({ month: row.month, year: row.year, value: (Number(row.val) || 0).toFixed(2) }));

          // Prepare chart data for hidden rendering
          const hostCharts = await Promise.all(selectedReportsList.map(async (report) => {
            const result = await fetchMetrics(host, report);
            const metrics = result.data || result;
            const totalAvg = result.totalAvg;
            chartsData.push({ hostId: host.id, reportId: report.id, hostname: host.name, hostMem: host.mem, metrics, report, totalAvg });
            return { label: report.label, metrics };
          }));

          return { id: host.id, name: host.name, mem: host.mem, cpuStats: hostCpuStats, memStats: hostMemStats, hostCharts };
        }));

        return { id: group.name, name: group.name, hosts: hostsWithStats };
      }));

      // Step 2: Trigger hidden rendering
      setExportStatus('Rendering charts...');
      setHiddenChartsData(chartsData);
      setRenderCharts(true);

      // Step 3: Wait for Highcharts to initialize and render
      await new Promise(r => setTimeout(r, 3000)); // Give it a few seconds to render all charts

      // Step 4: Capture SVGs and finalize payload
      setExportStatus('Generating PDF payload...');
      const finalHostgroups = hostgroupsWithData.map(group => ({
        ...group,
        hosts: group.hosts.map((host: any) => ({
          ...host,
          charts: selectedReportsList.map(report => ({
            label: report.label,
            data: getChartSVG(`host-item-${host.id}-${report.id}`)
          }))
        }))
      }));

      const payload: ReportPayload = {
        reportMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        targetMonth: parseInt(month),
        targetYear: parseInt(year),
        generatedDate: new Date().toLocaleDateString(),
        hostgroups: finalHostgroups as any
      };

      setExportStatus('Generating PDF on server...');
      const response = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfUrl(url);
      setRenderCharts(false);
      setHiddenChartsData([]);
      setIsFetchingPDF(false);
      setExportStatus('');
    } catch (e: any) {
      console.error("PDF Export Error:", e);
      alert('Error generating PDF: ' + (e.response?.data?.message || e.message));
      setIsFetchingPDF(false);
      setExportStatus('');
      setRenderCharts(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.setAttribute('download', `MFEC_Report_${Date.now()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <Block title="Structured Report Export" subtitle="Manage and Export Performance Reports">
      <div className="flex flex-col gap-6 mb-10 max-w-4xl mx-auto">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm mb-4 text-gray-700">1. Select Target Hosts</h3>
            <button onClick={toggleExpandAll} className="text-xs text-blue-600 font-medium block mb-3 hover:underline">Expand/Collapse All</button>
            <div className="bg-gray-50/50 rounded-xl p-4 max-h-[400px] overflow-y-auto ring-1 ring-gray-100">
                {hostGroups?.map((g: any) => (
                    <div key={g.hostgroup_id} className="mb-3">
                        <div 
                            className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg transition-colors ${selectedGroups.includes(g.hostgroup) ? 'bg-blue-600 text-white' : 'hover:bg-gray-200'}`}
                            onClick={() => toggleGroup(g.hostgroup)}
                        >
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(g.hostgroup); }} className={selectedGroups.includes(g.hostgroup) ? 'text-white' : 'text-gray-400'}>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-semibold">{g.hostgroup}</span>
                        </div>
                        {expandedGroups.includes(g.hostgroup) && (
                            <div className="ml-8 mt-1 space-y-1">
                                {g.hostnames.map((h: any) => (
                                    <div 
                                        key={h.hostname_id} 
                                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${selectedHostnames.find(s => s.id === String(h.hostname_id)) ? 'bg-blue-600 text-white font-semibold' : 'text-gray-600 hover:bg-gray-200'}`}
                                        onClick={() => toggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem })}
                                    >
                                        {h.hostname}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-sm mb-4 text-gray-700">2. Configurations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="font-semibold text-xs uppercase text-gray-400 tracking-wider">For Daily</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">From Date</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">To Date</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-xs uppercase text-gray-400 tracking-wider">For Monthly</h4>
                <div>
                  <label className="block text-[10px] uppercase text-gray-400 mb-1">Target Month/Year</label>
                  <div className="flex gap-2">
                    <select value={month} onChange={e => setMonth(e.target.value)} className="bg-gray-50 border-none rounded-lg p-3 text-sm flex-1 focus:ring-2 focus:ring-blue-500">
                      {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                    </select>
                    <input type="number" value={year} onChange={e => setYear(e.target.value)} className="bg-gray-50 border-none rounded-lg p-3 text-sm w-24 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-gray-700">3. Chart Order</h3>
          <div className="flex flex-col gap-2">
              {activeReports.map((report, idx) => (
                <div key={report.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${report.enabled ? 'border-sky-600 bg-sky-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`} onClick={() => toggleReport(report.id)}>
                  <span className="text-sm font-medium text-gray-700 flex-1">{report.label}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); moveReport(idx, 'up'); }} disabled={idx === 0} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveReport(idx, 'down'); }} disabled={idx === activeReports.length - 1} className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 justify-center items-center pt-6">
         {exportStatus && (
           <div className="flex items-center gap-2 text-sky-600 font-medium animate-pulse">
             <Loader2 className="w-4 h-4 animate-spin" />
             {exportStatus}
           </div>
         )}
         <button 
           onClick={handlePreviewPDF} 
           disabled={isExporting || selectedHostnames.length === 0} 
           className={`px-8 py-3 rounded font-bold ${isExporting || selectedHostnames.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'} text-white`}
         >
            {isExporting ? 'Generating...' : 'Preview PDF'}
         </button>
      </div>

      {/* Hidden Rendering Container for Charts */}
      {renderCharts && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1, pointerEvents: 'none' }}>
          {hiddenChartsData.map((item, idx) => (
            <div key={`${item.hostId}-${item.reportId}-${idx}`} id={`host-item-${item.hostId}-${item.reportId}`} style={{ width: '800px', height: '400px', overflow: 'hidden' }}>
              <SarChart options={getChartOptions(item.metrics, item.report, item.hostname, item.hostMem, startDate, endDate, month, year)} />
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="PDF Preview" onDownload={handleDownloadPDF}>
          {pdfUrl && <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />}
      </Modal>
    </Block>
  );
};

export default ReportExportPage;
