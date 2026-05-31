
'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/components/common/Toast';
import { Loader2, Download, Activity } from 'lucide-react';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-[435px] bg-gray-50 animate-pulse flex items-center justify-center">Loading Chart...</div>
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
    <Block title="Sar Statistics" subtitle="Daily Memory Utilization Analysis" tabs={[]}>
      <div className="bg-gray-50/80 p-4 sm:p-5 rounded-3xl border border-gray-100 mb-2 flex flex-wrap gap-3 items-end justify-start lg:justify-center transition-all">
        <div className="w-44">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Hostgroup</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map(g => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
        </div>
        <div className="w-44">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Hostname</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm disabled:opacity-50" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
            <option value="">Select Hostname</option>
            {hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.map(h => <option key={h.hostname_id} value={h.hostname_id}>{h.hostname}</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Type</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="Peak">Peak</option>
            <option value="Normal">Normal</option>
          </select>
        </div>
        <div className="w-36">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Start Date</label>
          <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="w-36">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">Stop Date</label>
          <input type="date" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 h-[38px]" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
      </div>

      <div className="flex justify-end">
        {response?.data && response.data.length > 0 && (
          <button onClick={handleExport} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50" disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Exporting...' : 'Export PDF Report'}
          </button>
        )}
      </div>

      <div id="container" className="min-h-[435px] bg-white rounded-3xl border border-gray-50 shadow-inner p-4">
        {isFetching ? (
          <div className="text-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-sm font-bold text-gray-400">Fetching metrics...</p>
          </div>
        ) : queryEnabled ? (
          response?.data && response.data.length > 0 ? <SarChart ref={chartRef} options={getChartOptions()} /> : (
            <div className="text-center py-32 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">No performance records found for this period.</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-gray-300">
            <Activity size={64} className="mb-4 opacity-20" />
            <p className="font-bold text-lg">Select filters and click Query to visualize data</p>
          </div>
        )}
      </div>
    </Block>
  );
};

export default MemDailyPage;
