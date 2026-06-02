
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Activity, ChevronDown } from 'lucide-react';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-[435px] bg-slate-50 animate-pulse flex items-center justify-center">Loading Chart...</div>
});

interface HostName {
  hostname_id: number;
  hostname: string;
  mem: number;
}

interface HostGroup {
  hostgroup_id: number;
  hostgroup: string;
  hostnames: HostName[];
}

const MemMonthlyPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedHostnameId, setSelectedHostnameId] = useState<string>('');
  const [month, setMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [year, setYear] = useState<string>(String(new Date().getFullYear()));
  const [queryEnabled, setQueryEnabled] = useState(false);

  const months = [
    { label: 'Jan', value: '1' }, { label: 'Feb', value: '2' }, { label: 'Mar', value: '3' },
    { label: 'Apr', value: '4' }, { label: 'May', value: '5' }, { label: 'Jun', value: '6' },
    { label: 'Jul', value: '7' }, { label: 'Aug', value: '8' }, { label: 'Sep', value: '9' },
    { label: 'Oct', value: '10' }, { label: 'Nov', value: '11' }, { label: 'Dec', value: '12' },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 41 }, (_, i) => String(currentYear - 20 + i));

  const { data: hostGroups } = useQuery<HostGroup[]>({
    queryKey: ['hostGroups'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const { data: metrics, isFetching, refetch } = useQuery({
    queryKey: ['memMonthly', selectedGroup, selectedHostnameId, month, year],
    queryFn: async () => {
      const res = await axios.get('/api/metrics/monthly', {
        params: { hostgroup: selectedGroup, hostnameId: selectedHostnameId, month, year, type: 'r' }
      });
      return res.data;
    },
    enabled: queryEnabled && !!selectedGroup && !!selectedHostnameId
  });

  const getChartOptions = (): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    const hostnameInfo = hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.find(h => String(h.hostname_id) === selectedHostnameId);
    const totalMem = (hostnameInfo as any)?.mem || 16;

    // Extract unique times for X-axis labels
    const timeLabels = Array.from(new Set(metrics.map((m: any) => m.time_label))).sort();

    // Map data to series by day
    const daySeriesMap: Record<number, any[]> = {};
    metrics.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = new Array(timeLabels.length).fill(null);
      const idx = timeLabels.indexOf(m.time_label);
      if (idx !== -1) daySeriesMap[m.day][idx] = Number(m.val);
    });

    return {
      chart: { type: 'line', shadow: false, backgroundColor: undefined },
      title: { text: 'Memory Monthly Usage', style: { fontSize: '14px' } },
      subtitle: { text: `Hostname : ${hostnameInfo?.hostname || ''} Month : ${months.find(m => m.value === month)?.label}/${year}`, style: { fontSize: '12px' } },
      xAxis: {
        categories: timeLabels as string[],
        tickInterval: 5,
        labels: { rotation: -45, align: 'right', style: { fontSize: '8px' } }
      },
      yAxis: {
        title: { text: `Memory (${totalMem} GB)` },
        min: 0,
        max: totalMem,
        labels: { formatter: function () { return (this.value as number).toFixed(1); } }
      },
      plotOptions: {
        line: { lineWidth: 1, marker: { enabled: false, radius: 2 } }
      },
      series: Object.keys(daySeriesMap).sort((a, b) => Number(a) - Number(b)).map(day => ({
        name: `Day ${day}`,
        data: daySeriesMap[Number(day)],
        type: 'line'
      }))
    };
  };

  return (
    <Block title="Memory Performance Metrics" subtitle="Monthly Resource Allocation Distribution" tabs={[]}>
      <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mb-8 flex flex-wrap gap-5 items-end justify-center transition-all shadow-inner">
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-black text-slate-400 capitalize tracking-widest mb-2 ml-1 block">Hostgroup</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
              <option value="">Select Infrastructure Group</option>
              {hostGroups?.map(g => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="text-xs font-black text-slate-400 capitalize tracking-widest mb-2 ml-1 block">Hostname</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm disabled:opacity-30" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
              <option value="">Select Network Node</option>
              {hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.map(h => <option key={h.hostname_id} value={String(h.hostname_id)}>{h.hostname}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <div className="w-44">
          <label className="text-xs font-black text-slate-400 capitalize tracking-widest mb-2 ml-1 block">Analytics Cycle</label>
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm text-center" value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="relative group flex-1">
              <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm text-center" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-black capitalize tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-30 h-[42px] active:scale-95" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
      </div>

      <div className="flex items-center gap-3 mb-6 px-2">
        <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-blue-500 animate-pulse' : metrics ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
        <span className="text-xs font-black text-slate-400 capitalize tracking-widest">{isFetching ? 'Stream Incoming' : metrics ? 'Data Link Online' : 'System Ready'}</span>
      </div>

      <div id="container" className="min-h-[500px] bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-10 animate-ease-in relative overflow-hidden">
        {isFetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 opacity-20" />
            <p className="mt-8 text-xs font-black text-slate-400 capitalize tracking-[0.3em]">Processing Monthly Aggregate...</p>
          </div>
        ) : null}

        {queryEnabled ? (
          metrics && metrics.length > 0 ? (
            <div className="animate-in fade-in zoom-in-95 duration-700">
              <SarChart options={getChartOptions()} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100">
              <Activity size={48} className="text-slate-200 mb-4" />
              <p className="text-xs font-black text-slate-300 capitalize tracking-[0.2em]">No performance metrics retrieved for cycle</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center py-40">
            <Activity size={80} className="mb-8 text-slate-100 animate-pulse" />
            <p className="text-xs font-black text-slate-300 capitalize tracking-[0.3em]">Awaiting Instruction Set</p>
          </div>
        )}
      </div>
    </Block>
  );
};

export default MemMonthlyPage;

