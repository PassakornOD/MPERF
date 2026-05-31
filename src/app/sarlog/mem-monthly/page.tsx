
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Activity } from 'lucide-react';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), {
  ssr: false,
  loading: () => <div className="w-full h-[435px] bg-gray-50 animate-pulse flex items-center justify-center">Loading Chart...</div>
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
    <Block title="Sar Statistics" subtitle="Monthly Memory Utilization Analysis" tabs={[]}>
      <div className="bg-gray-50/80 p-5 sm:p-6 rounded-3xl border border-gray-100 mb-2 flex flex-wrap gap-4 items-end justify-start lg:justify-center transition-all">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Hostgroup</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map(g => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Hostname</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm disabled:opacity-50" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
            <option value="">Select Hostname</option>
            {hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.map(h => <option key={h.hostname_id} value={h.hostname_id}>{h.hostname}</option>)}
          </select>
        </div>
        <div className="w-48">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Month / Year</label>
          <div className="flex gap-2">
            <select className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 h-[38px]" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
      </div>

      <div id="container" className="min-h-[450px] bg-white rounded-3xl border border-gray-50 shadow-inner p-4">
        {isFetching ? (
          <div className="text-center py-32">
            <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-6 text-sm font-bold text-gray-400">Fetching metrics...</p>
          </div>
        ) : queryEnabled ? (
          metrics && metrics.length > 0 ? <SarChart options={getChartOptions()} /> : (
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

export default MemMonthlyPage;

