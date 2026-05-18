'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Block from '@/components/common/Block';
import Modal from '@/components/common/Modal';
import dynamic from 'next/dynamic';
import { 
  ChevronDown, 
  FileText,
  ArrowUp,
  ArrowDown,
  Loader2
} from 'lucide-react';
import { ReportPayload } from '@/types/report';

const Highcharts = typeof window !== 'undefined' ? require('highcharts') : null;

const SarChart = dynamic(() => import('@/components/charts/SarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-64 bg-gray-50 flex items-center justify-center animate-pulse border border-dashed rounded-lg text-xs text-gray-400">Loading Chart Engine...</div>
});

const ReportContentItem = ({ type, mode, host, startDate, endDate, month, year, itemLabel }: any) => {
  const { data: metrics, isFetching } = useQuery({
    queryKey: ['report-item', type, mode, host.id, startDate, endDate, month, year],
    queryFn: async () => {
      const endpoint = type.includes('monthly') ? '/api/metrics/monthly' : `/api/metrics/${type}`;
      const params: any = { hostgroup: host.group, hostnameId: host.id, month, year, startDate, endDate, type: mode };
      if (type.includes('monthly')) params.type = type.startsWith('mem') ? 'r' : 'u';
      return (await axios.get(endpoint, { params })).data;
    }
  });

  if (isFetching) return (
    <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-4 animate-pulse">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <span className="text-[10px] font-bold uppercase tracking-widest">Aggregating {host.name} Data...</span>
    </div>
  );

  const metricsData = Array.isArray(metrics) ? metrics : (metrics?.data || []);
  const totalAvg = metrics?.totalAvg || 0;

  if (!metricsData || metricsData.length === 0) return (
    <div className="h-64 flex flex-col items-center justify-center text-gray-300 italic border-2 border-dashed border-gray-100 rounded-3xl bg-slate-50/50">
      <FileText className="w-8 h-8 mb-2 opacity-20" />
      <span className="text-[11px] font-medium">No Performance Data Records Found</span>
    </div>
  );

  const totalMem = Number(host.mem || 16);
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mMonth = monthNames[parseInt(month) - 1] || month;

  let chartOptions: Highcharts.Options = {
    chart: { type: type === 'cpu-daily' ? 'area' : 'spline', height: 400, spacingTop: 20 },
    title: { text: `Sar ${startDate} To ${endDate}`, style: { fontWeight: 'bold', fontSize: '16px' } },
    subtitle: { text: `Hostname : ${host.name} Type : ${mode}` },
    xAxis: {
      categories: metricsData.map((m: any) => {
        if (!m.time) return 'N/A';
        if (mode === 'Average' || mode === 'Peak') return String(m.time).split('T')[0].split(' ')[0];
        const d = new Date(m.time);
        if (isNaN(d.getTime())) return String(m.time);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      }),
      tickInterval: type === 'mem-daily' && mode === 'Normal' ? Math.max(1, Math.floor(metricsData.length / 20)) : ((mode === 'Average' || mode === 'Peak') ? 1 : Math.max(1, Math.floor(metricsData.length / 20))),
      labels: { rotation: -45, align: 'right', style: { fontSize: '9px' } }
    },
    yAxis: { title: { text: 'Percent' }, min: 0, max: 100 },
    plotOptions: {
      area: {
        lineColor: '#000000',
        lineWidth: 0.1,
        marker: { enabled: false },
        shadow: false,
        stacking: (type === 'cpu-daily' && (mode === 'Normal' || mode === 'Average')) ? 'percent' : undefined
      },
      spline: { marker: { enabled: true }, shadow: false }
    }
  };

  if (type === 'cpu-daily') {
    if (mode === 'Peak') {
      chartOptions.series = [
        { name: '%peak', data: metricsData.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline' },
        { name: '%avg', data: metricsData.map((m: any) => Number(m.usr) || 0), color: '#92A8CD' }
      ] as any;
    } else {
      const hasNice = metricsData[0]?.hasOwnProperty('nice');
      if (hasNice) {
        chartOptions.series = [
          { name: '%idle', data: metricsData.map((m: any) => Number(m.idle) || 0) },
          { name: '%wio', data: metricsData.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' },
          { name: '%nice', data: metricsData.map((m: any) => Number(m.nice) || 0) },
          { name: '%steal', data: metricsData.map((m: any) => Number(m.steal) || 0) },
          { name: '%usr', data: metricsData.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
          { name: '%sys', data: metricsData.map((m: any) => Number(m.sys) || 0), color: '#00FF00' }
        ] as any;
      } else {
        chartOptions.series = [
          { name: '%idle', data: metricsData.map((m: any) => Number(m.idle) || 0) },
          { name: '%usr', data: metricsData.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
          { name: '%sys', data: metricsData.map((m: any) => Number(m.sys) || 0), color: '#00FF00' },
          { name: '%wio', data: metricsData.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' }
        ] as any;
      }
    }
  } else if (type === 'cpu-monthly') {
    chartOptions.title = { text: 'CPU Monthly Usage', style: { fontWeight: 'bold', fontSize: '16px' } };
    chartOptions.subtitle = { text: `Hostname : ${host.name} Month : ${mMonth}/${year}` };
    const daySeriesMap: Record<number, Record<string, number>> = {};
    metricsData.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
      daySeriesMap[m.day][String(m.time_label)] = 100 - (Number(m.val) || 0);
    });
    const categories = Array.from(new Set(metricsData.map((m: any) => String(m.time_label)))).sort() as string[];
    chartOptions.xAxis = { categories, tickInterval: 10, labels: { rotation: -45, align: 'right', style: { fontSize: '9px' } } };
    chartOptions.series = Object.keys(daySeriesMap).sort((a,b) => Number(a)-Number(b)).map(day => ({
        name: `Day ${day}`, 
        data: categories.map((cat: string) => daySeriesMap[Number(day)][cat] ?? null),
        type: 'line'
    })) as any;
  } else {
    chartOptions.title = { text: `Sar ${startDate} To ${endDate}`, style: { fontWeight: 'bold', fontSize: '16px' } };
    chartOptions.subtitle = { text: `Hostname : ${host.name} Type : ${mode}` };
    chartOptions.yAxis = { 
      title: { text: mode === 'Peak' ? 'Memory' : `Memory (${totalMem} GB )` }, 
      min: 0, 
      max: totalMem,
      endOnTick: false,
      labels: {
        formatter: function() {
          const val = (this as any).value as number;
          return val + ' GB';
        }
      }
    };
    
    if (type === 'mem-monthly') {
        chartOptions.title = { text: 'Memory Monthly Usage', style: { fontWeight: 'bold', fontSize: '16px' } };
        chartOptions.subtitle = { text: `Hostname : ${host.name} Month : ${mMonth}/${year}` };
        
        const categories = Array.from(new Set(metricsData.map((m: any) => String(m.time_label)))).sort() as string[];
        const daySeriesMap: Record<number, Record<string, number>> = {};
        metricsData.forEach((m: any) => {
            if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
            daySeriesMap[m.day][String(m.time_label)] = Number(m.val) || 0;
        });

        chartOptions.xAxis = { categories, tickInterval: 10, labels: { rotation: -45, align: 'right', style: { fontSize: '9px' } } };
        chartOptions.series = Object.keys(daySeriesMap).sort((a,b) => Number(a)-Number(b)).map(day => ({
            name: `Day ${day}`, 
            data: categories.map((cat: string) => daySeriesMap[Number(day)][cat] ?? null),
            type: 'line'
        })) as any;
    } else {
        if (mode === 'Normal') {
          chartOptions.chart = { ...chartOptions.chart, type: 'area' };
          chartOptions.yAxis = {
            ...(chartOptions.yAxis as object),
            plotLines: [{
              value: totalMem, 
              color: 'white',
              dashStyle: 'Dash',
              width: 2,
              label: {
                text: `AVG Memory Usage = ${totalAvg.toFixed(2)} GB = ${((totalAvg / totalMem) * 100).toFixed(2)} %`,
                y: 15,
                style: { color: '#CC0000' },
                align: 'right'
              }
            }]
          };
          chartOptions.series = [
            { name: 'mem usage', data: metricsData.map((m: any) => Number(m.mem) || 0), color: "#AA4643", type: 'area' }
          ] as any;
        } else {
          chartOptions.series = [
            { name: 'mem peak', data: metricsData.map((m: any) => Number(m.mem) || 0), color: "#92A8CD", type: 'spline' },
            { name: 'mem avg', data: metricsData.map((m: any) => Number(m.avg_mem) || 0), color: "#AA4643", type: 'area' }
          ] as any;
        }
    }
  }

  return <SarChart options={chartOptions} />;
};

const ReportExportPage = () => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedHostnames, setSelectedHostnames] = useState<{ id: string, name: string, group: string, mem?: number }[]>([]);
  const [isExporting, setIsFetchingPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) {
        setMonth(String(d.getMonth() + 1));
        setYear(String(d.getFullYear()));
      }
    }
  }, [startDate]);

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

  const structuredData = useMemo(() => {
    const groups: Record<string, { name: string, hosts: any[] }> = {};
    selectedHostnames.forEach(host => {
      if (!groups[host.group]) groups[host.group] = { name: host.group, hosts: [] };
      groups[host.group].hosts.push(host);
    });
    return Object.values(groups);
  }, [selectedHostnames]);

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

  const handlePreviewPDF = async () => {
    if (isExporting || selectedHostnames.length === 0) return;
    setIsFetchingPDF(true);

    const getChartSVG = (id: string) => {
      const el = document.getElementById(id);
      const chart = (Highcharts as any).charts.find((c: any) => c && (c.renderTo === el?.querySelector('.highcharts-container')?.parentElement || el?.contains(c.renderTo)));
      if (!chart) return "";
      const svg = chart.getSVG({
        chart: { backgroundColor: '#ffffff', style: { fontFamily: 'sans-serif' } }
      });
      return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    };

    const fetchHostStats = async (hostgroup: string, type: string) => {
      const { data } = await axios.get('/api/utilization/stats-last-12', { params: { hostgroup, month, year }, headers: { 'x-type': type } });
      return data;
    };

    try {
      const hostgroupsWithData = await Promise.all(structuredData.map(async (group) => {
        const cpuStats = await fetchHostStats(group.name, 'cpu');
        const memStats = await fetchHostStats(group.name, 'mem');

        return {
          id: group.name,
          name: group.name,
          hosts: group.hosts.map(host => {
            const hostCpuStats = cpuStats
              .filter((s: any) => s.hostname === host.name)
              .map((s: any) => ({ month: s.month, year: s.year, value: (100 - Number(s.avg_idle)).toFixed(2) }));

            const hostMemStats = memStats
              .filter((s: any) => s.hostname === host.name)
              .map((s: any) => ({ month: s.month, year: s.year, value: Number(s.val).toFixed(2) }));

            return {
              id: host.id,
              name: host.name,
              mem: host.mem,
              cpuStats: hostCpuStats,
              memStats: hostMemStats,
              charts: selectedReportsList.map(report => ({
                label: report.label,
                data: getChartSVG(`host-item-${host.id}-${report.id}`)
              }))
            };
          })
        };
      }));

      const payload: ReportPayload = {
        reportMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        generatedDate: new Date().toLocaleDateString(),
        hostgroups: hostgroupsWithData
      };

      const response = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (e) {
      console.error(e);
      alert("PDF Preview failed");
    } finally {
      setIsFetchingPDF(false);
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
    <Block title="Structured Report Export" subtitle="MFEC Standard Performance Report Layout">
      <div className="flex flex-col gap-6 mb-10 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-sm border-none ring-1 ring-gray-100">
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border-none ring-1 ring-gray-100">
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border-none ring-1 ring-gray-100">
          <h3 className="font-bold text-sm mb-4 text-gray-700">3. Chart Order</h3>
          <div className="flex flex-col gap-2">
              {activeReports.map((report, idx) => (
                <div key={report.id} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${report.enabled ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`} onClick={() => toggleReport(report.id)}>
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

      <div className="flex gap-4 justify-center pt-6">
         <button 
           onClick={handlePreviewPDF} 
           disabled={isExporting || selectedHostnames.length === 0} 
           className={`px-8 py-3 rounded font-bold ${isExporting || selectedHostnames.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
         >
            {isExporting ? 'Generating...' : 'Preview PDF'}
         </button>
      </div>

      <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="PDF Preview" onDownload={handleDownloadPDF}>
          {pdfUrl && <iframe src={pdfUrl} className="w-full h-full" title="PDF Preview" />}
      </Modal>
    </Block>
  );
};

export default ReportExportPage;
