
'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), { 
  ssr: false,
  loading: () => <div className="w-full h-[435px] bg-gray-50 animate-pulse flex items-center justify-center">Loading Chart...</div>
});

interface HostName { hostname_id: number; hostname: string; }
interface HostGroup { hostgroup_id: number; hostgroup: string; hostnames: HostName[]; }

const CpuDailyPage = () => {
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedHostnameId, setSelectedHostnameId] = useState<string>('');
  const [type, setType] = useState<'Peak' | 'Normal' | 'Average'>('Normal');
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

  const { data: metrics, isFetching, refetch } = useQuery({
    queryKey: ['cpuDaily', selectedGroup, selectedHostnameId, type, startDate, endDate],
    queryFn: async () => {
      const res = await axios.get('/api/metrics/cpu-daily', {
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
      // Use chartOptions to override title and subtitle during SVG generation
      const svg = chartRef.current.getSVG({
          chart: { backgroundColor: '#ffffff' },
          title: { text: `Sar ${startDate} To ${endDate}` },
          subtitle: { text: `Hostname : ${getHostnameLabel()} Type : ${type}` }
      });
      const hostname = getHostnameLabel();
      const group = selectedGroup;

      const payload = {
        reportMonth: `${startDate} to ${endDate}`,
        generatedDate: new Date().toLocaleDateString(),
        hostgroups: [{
          name: group,
          hosts: [{
            name: hostname,
            cpuStats: [],
            memStats: [],
            charts: [{ label: `CPU Daily (${type})`, data: svg }]
          }]
        }]
      };

      const res = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `CPU_Daily_${hostname}_${startDate}_${endDate}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error('Export failed:', e);
      alert('PDF Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const getChartOptions = (): Highcharts.Options => {
    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    const categories = metrics.map((m: any) => {
        if (!m.time) return 'N/A';
        // Use string split to robustly extract date or time part avoiding timezone shifts
        if (type === 'Average' || type === 'Peak') {
            return String(m.time).split('T')[0].split(' ')[0];
        }
        const d = new Date(m.time);
        if (isNaN(d.getTime())) return String(m.time);
        return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    });
    
    const tickInterval = (type === 'Average' || type === 'Peak') ? 1 : Math.max(1, Math.floor(metrics.length / 20));
    const hasNice = metrics[0]?.hasOwnProperty('nice');

    let options: any = {
      chart: { type: 'area', shadow: false },
      title: { text: `Sar ${startDate} To ${endDate}` },
      subtitle: { text: `Hostname : ${getHostnameLabel()} Type : ${type}` },
      xAxis: { 
        categories: categories,
        tickInterval: tickInterval,
        labels: { rotation: -45, align: 'right', style: { font: 'normal 10px Verdana, sans-serif' } }
      },
      yAxis: { title: { text: 'Percent' }, min: 0, max: 100 },
      plotOptions: { 
        area: { 
          lineColor: '#000000', 
          lineWidth: 0.1, 
          marker: { enabled: false },
          stacking: (type === 'Normal' || type === 'Average') ? 'percent' : null
        } 
      }
    };

    if (type === 'Peak') {
      options.series = [
        { name: '%peak', data: metrics.map((m: any) => 100 - (Number(m.idle) || 0)), color: "#AA4643", type: 'spline' },
        { name: '%avg', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#92A8CD' }
      ];
    } else {
      if (hasNice) {
          // Red Hat order: idle, wio, nice, steal, usr, sys
          options.series = [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0) },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' },
            { name: '%nice', data: metrics.map((m: any) => Number(m.nice) || 0) },
            { name: '%steal', data: metrics.map((m: any) => Number(m.steal) || 0) },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00' }
          ];
      } else {
          // Non-Red Hat (Solaris/AIX) order: idle, usr, sys, wio
          options.series = [
            { name: '%idle', data: metrics.map((m: any) => Number(m.idle) || 0) },
            { name: '%usr', data: metrics.map((m: any) => Number(m.usr) || 0), color: '#FFCC00' },
            { name: '%sys', data: metrics.map((m: any) => Number(m.sys) || 0), color: '#00FF00' },
            { name: '%wio', data: metrics.map((m: any) => Number(m.wio) || 0), color: '#FFFF99' }
          ];
      }
    }
    return options;
  };

  return (
    <Block title="Sar stats" subtitle="CPU Daily Usage" tabs={['Per days']}>
      <div className="bg-gray-100 p-4 rounded-md mb-8 flex flex-wrap gap-4 items-end justify-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hostgroup</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[150px]" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map(g => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hostname</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[150px]" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
            <option value="">Select Hostname</option>
            {hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.map(h => <option key={h.hostname_id} value={h.hostname_id}>{h.hostname}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Type</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="Peak">Peak</option>
            <option value="Normal">Normal</option>
            <option value="Average">Average</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Start Date</label>
          <input type="date" className="border border-gray-300 rounded px-2 py-1 text-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Stop Date</label>
          <input type="date" className="border border-gray-300 rounded px-2 py-1 text-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={() => { setQueryEnabled(true); refetch(); }} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 h-[30px]" disabled={!selectedGroup || !selectedHostnameId}>Query</button>
      </div>

      <div className="flex justify-end mb-4">
        {metrics && metrics.length > 0 && (
            <button onClick={handleExport} className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700" disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>
        )}
      </div>

      <div id="container" className="min-h-[435px]">
        {isFetching ? <div className="text-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-500">Loading...</p></div> : queryEnabled ? (
          metrics && metrics.length > 0 ? <SarChart ref={chartRef} options={getChartOptions()} /> : <div className="text-center py-20 bg-gray-50 rounded">No records found.</div>
        ) : <div className="text-gray-400 italic text-center">Please select filters and click Query.</div>}
      </div>
    </Block>
  );
};
export default CpuDailyPage;
