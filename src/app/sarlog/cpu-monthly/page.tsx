
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

interface HostName { hostname_id: number; hostname: string; }
interface HostGroup { hostgroup_id: number; hostgroup: string; hostnames: HostName[]; }

const CpuMonthlyPage = () => {
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
    queryKey: ['cpuMonthly', selectedGroup, selectedHostnameId, month, year],
    queryFn: async () => {
      const res = await axios.get('/api/metrics/monthly', {
        params: { hostgroup: selectedGroup, hostnameId: selectedHostnameId, month, year }
      });
      return res.data;
    },
    enabled: queryEnabled && !!selectedGroup && !!selectedHostnameId
  });

  const getHostnameLabel = () => hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.find(h => String(h.hostname_id) === selectedHostnameId)?.hostname || selectedHostnameId;

  const getChartOptions = (): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    // 1. Identify all unique time labels to use as categories, sorted chronologically
    const categoriesSet = new Set<string>();
    metrics.forEach((m: any) => {
      if (m.time_label) categoriesSet.add(String(m.time_label));
    });
    const categories: string[] = Array.from(categoriesSet).sort();

    // 2. Map data to series by day
    const daySeriesMap: Record<number, Record<string, number>> = {};
    metrics.forEach((m: any) => {
      if (!daySeriesMap[m.day]) daySeriesMap[m.day] = {};
      daySeriesMap[m.day][String(m.time_label)] = 100 - (m.val || 0);
    });

    // 3. Create Highcharts series objects
    const series = Object.keys(daySeriesMap).sort((a, b) => Number(a) - Number(b)).map(day => {
      const dayNum = Number(day);
      return {
        name: String(day),
        data: categories.map((cat: string) => daySeriesMap[dayNum][cat] ?? null),
        type: 'line' as const
      };
    });

    const mMonthLabel = months.find(m => m.value === month)?.label || month;

    return {
      chart: { shadow: false },
      title: { text: 'CPU Monthly Usage' },
      subtitle: { text: `Hostname : ${getHostnameLabel()} Month : ${mMonthLabel}/${year}` },
      legend: {
        itemStyle: { fontSize: '10px' },
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 10,
        margin: 15
      },
      xAxis: {
        categories: categories,
        tickInterval: 10,
        labels: {
          rotation: -45,
          align: 'right',
          style: { font: 'normal 10px Verdana, sans-serif' }
        }
      },
      yAxis: { title: { text: 'Percent' }, min: 0, max: 100 },
      plotOptions: {
        line: {
          lineWidth: 1,
          marker: { enabled: false }
        }
      },
      series: series
    };
  };

  return (
    <Block title="CPU Performance Metrics" subtitle="Monthly Processor Utilization Distribution" tabs={[]}>
      <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mb-8 flex flex-wrap gap-5 items-end justify-center transition-all shadow-inner">
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
        <div className="w-44">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Reporting Period</label>
          <div className="flex gap-2">
            <div className="relative group flex-1">
              <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm text-center" value={month} onChange={(e) => setMonth(e.target.value)}>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div className="relative group flex-1">
              <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm text-center" value={year} onChange={(e) => setYear(e.target.value)}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs  capitalize  hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-30 h-[42px] active:scale-95" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
      </div>

      <div className="flex items-center gap-3 mb-6 px-2">
        <div className={`w-2 h-2 rounded-full ${isFetching ? 'bg-blue-500 animate-pulse' : metrics ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`}></div>
        <span className="text-xs  text-slate-400 capitalize ">{isFetching ? 'Stream Incoming' : metrics ? 'Data Link Online' : 'System Ready'}</span>
      </div>

      <div id="container" className="min-h-[500px] bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] p-10 animate-ease-in relative overflow-hidden">
        {isFetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm z-10">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 opacity-20" />
            <p className="mt-8 text-xs  text-slate-400 capitalize ">Processing Monthly Aggregate...</p>
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

export default CpuMonthlyPage;
