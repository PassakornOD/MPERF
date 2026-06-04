
'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import ProgressBar from '@/components/common/ProgressBar';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/components/common/Toast';
import { Loader2, Download, Activity, ChevronDown, AlertCircle } from 'lucide-react';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-[435px] bg-slate-50 animate-pulse flex items-center justify-center">Loading Chart...</div>
});

interface HostName {
  hostname_id: number;
  hostname: string;
}

interface HostGroup {
  hostgroup_id: number;
  hostgroup: string;
  hostnames: HostName[];
}

const MemDailyPage = () => {
  const { showToast } = useToast();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedHostnameId, setSelectedHostnameId] = useState<string>('');
  const [type, setType] = useState<'Peak' | 'Normal'>('Normal');
  const chartRef = useRef<any>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getPrevMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    return { start: format(firstDay), end: format(lastDay) };
  };

  const datesObj = getPrevMonthDates();
  const [startDate, setStartDate] = useState<string>(datesObj.start);
  const [endDate, setEndDate] = useState<string>(datesObj.end);
  const [queryEnabled, setQueryEnabled] = useState(false);

  const { data: hostGroups } = useQuery<HostGroup[]>({
    queryKey: ['hostGroups'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const { data: response, isFetching, refetch } = useQuery({
    queryKey: ['memDaily', selectedGroup, selectedHostnameId, type, startDate, endDate],
    queryFn: async () => {
      const res = await axios.get('/api/metrics/mem-daily', {
        params: { hostgroup: selectedGroup, hostnameId: selectedHostnameId, type, startDate, endDate }
      });
      return res.data;
    },
    enabled: queryEnabled && !!selectedGroup && !!selectedHostnameId
  });

  const getHostnameLabel = () => hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.find(h => String(h.hostname_id) === selectedHostnameId)?.hostname || selectedHostnameId;

  const handleExport = async () => {
    if (!chartRef.current) return;
    setIsExporting(true);
    try {
      const svg = chartRef.current.getSVG({
        chart: { backgroundColor: '#ffffff' },
        title: { text: `Sar ${startDate} To ${endDate}` },
        subtitle: { text: `Hostname : ${getHostnameLabel()} Type : ${type}` }
      });
      const hostname = getHostnameLabel();

      const payload = {
        reportMonth: `${startDate} to ${endDate}`,
        generatedDate: new Date().toLocaleDateString(),
        hostgroups: [{
          name: selectedGroup,
          hosts: [{
            name: hostname,
            cpuStats: [],
            memStats: [],
            charts: [{ label: `Memory Daily (${type})`, data: svg }]
          }]
        }]
      };

      const res = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Mem_Daily_${hostname}_${startDate}_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export failed:', e);
      showToast('PDF Export failed.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const getChartOptions = (): Highcharts.Options => {
    const metrics = response?.data;
    const totalAvg = response?.totalAvg || 0;

    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    const hostnameInfo = hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.find(h => String(h.hostname_id) === selectedHostnameId);
    const totalMem = (hostnameInfo as any)?.mem || 16;

    const xAxis: Highcharts.XAxisOptions = {
      labels: { rotation: -45, align: 'right', style: { font: 'normal 10px Verdana, sans-serif' } }
    };
    let series: any[] = [];
    let categories: string[] = [];

    if (type === 'Peak') {
      categories = metrics.map((m: any) => {
        const d = new Date(m.time);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
      xAxis.categories = categories;
      xAxis.tickInterval = 1;
      series = [
        { name: 'mem peak', data: metrics.map((m: any) => m.mem || 0), color: "#92A8CD", type: 'spline' },
        { name: 'mem avg', data: metrics.map((m: any) => m.avg_mem || 0), color: "#AA4643", type: 'area' }
      ];
    } else {
      categories = metrics.map((m: any) => {
        const d = new Date(m.time);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      });
      xAxis.categories = categories;
      xAxis.tickInterval = Math.max(1, Math.floor(metrics.length / 20));
      series = [{
        name: 'mem usage',
        data: metrics.map((m: any) => Number(m.mem) || 0),
        color: "#AA4643",
        type: 'area'
      }];
    }

    const options: any = {
      chart: { shadow: false },
      title: { text: `Sar ${startDate} To ${endDate}` },
      subtitle: { text: `Hostname : ${getHostnameLabel()} Type : ${type}` },
      xAxis,
      yAxis: {
        title: { text: `Memory (${totalMem} GB)` },
        min: 0,
        max: totalMem,
        maxPadding: 0.2,
        endOnTick: false,
        labels: {
          formatter: function () {
            const val = (this as any).value as number;
            const percent = ((val / totalMem) * 100).toFixed(1);
            return `${val} GB (${percent}%)`;
          }
        }
      },
      plotOptions: {
        area: {
          lineColor: '#000000',
          lineWidth: type === 'Normal' ? 0.5 : 0.1,
          marker: { enabled: false },
          stacking: undefined // Explicitly no stacking for memory
        },
        spline: { marker: { enabled: true } }
      },
      series
    };

    if (type === 'Normal') {
      options.chart.type = 'area';
      const avgPercent = totalMem ? ((totalAvg / totalMem) * 100).toFixed(1) : 0;
      options.yAxis.plotLines = [{
        value: totalAvg,
        color: 'white',
        dashStyle: 'Dash',
        width: 2,
        label: {
          text: `AVG Memory Usage = ${totalAvg.toFixed(2)} GB = ${avgPercent}%`,
          y: -30,
          style: { color: '#CC0000' },
          align: 'right'
        }
      }];
    }
    return options;
  };

  return (
    <Block title="Memory Performance Metrics" subtitle="Daily Memory Utilization Analysis" tabs={[]}>
      <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mb-8 flex flex-nowrap gap-3 items-end justify-center transition-all shadow-inner">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Hostgroup</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
              <option value="">Select Hostgroup</option>
              {hostGroups?.map(g => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Hostname</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-30" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
              <option value="">Select Hostname</option>
              {hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.map(h => <option key={h.hostname_id} value={String(h.hostname_id)}>{h.hostname}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <div className="w-32">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Type</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="Peak">Peak</option>
              <option value="Normal">Normal</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <div className="w-40">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Start Date</label>
          <input type="date" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs  capitalize outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-40">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Stop Date</label>
          <input type="date" className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2 text-xs  capitalize outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs  capitalize  hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-30 h-[42px] active:scale-95" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-blue-500 animate-pulse' : response?.data ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
          <span className="text-xs  text-slate-400 capitalize ">{isFetching ? 'Stream Incoming' : response?.data ? 'Data Link Online' : 'System Ready'}</span>
        </div>
        {response?.data && response.data.length > 0 && (
          <button onClick={handleExport} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-xs  capitalize  hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95" disabled={isExporting}>
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            {isExporting ? 'Compiling...' : 'Acquire PDF'}
          </button>
        )}
      </div>

      <div id="container" className="min-h-[500px] bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-10 animate-ease-in relative overflow-hidden">
        <ProgressBar isVisible={isFetching} />
        {isFetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 opacity-20" />
            <p className="mt-8 text-xs  text-slate-400 capitalize ">Synchronizing Nodes...</p>
          </div>
        ) : null}

        {queryEnabled ? (
          response?.data && response.data.length > 0 ? (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <SarChart ref={chartRef} options={getChartOptions()} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
              <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
              <p className="text-xs  text-slate-300 capitalize ">No performance metrics retrieved for cycle</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-40">
            <Activity size={80} className="mb-8 text-slate-100 animate-pulse" />
            <p className="text-xs  text-slate-300 capitalize ">Awaiting Instruction Set</p>
          </div>
        )}
      </div>
    </Block>
  );
};

export default MemDailyPage;
