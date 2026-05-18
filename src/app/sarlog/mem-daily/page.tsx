
'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedHostnameId, setSelectedHostnameId] = useState<string>('');
  const [type, setType] = useState<'Peak' | 'Normal'>('Normal');

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

  const getChartOptions = (): Highcharts.Options => {
    const metrics = response?.data;
    const totalAvg = response?.totalAvg || 0;

    if (!metrics || metrics.length === 0) return { title: { text: 'No Data Found' } };

    const hostnameInfo = hostGroups?.find(g => g.hostgroup === selectedGroup)?.hostnames.find(h => String(h.hostname_id) === selectedHostnameId);
    const totalMem = (hostnameInfo as any)?.mem || 16;

    const categories = metrics.map((m: any) => {
      const d = new Date(m.time);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day} ${time}`;
    });

    const tickInterval = type === 'Normal' ? Math.max(1, Math.floor(metrics.length / 20)) : 1;

    let options: any = {
      chart: { shadow: false },
      title: { text: `Sar ${startDate} To ${endDate}` },
      subtitle: { text: `Hostname : ${getHostnameLabel()} Type : ${type}` },
      xAxis: {
        categories,
        tickInterval,
        labels: { rotation: -45, align: 'right', style: { font: 'normal 10px Verdana, sans-serif' } }
      },
      yAxis: {
        title: { text: `Memory (${totalMem} GB)` },
        min: 0,
        max: totalMem,
        maxPadding: 0.2,
        endOnTick: false,
        labels: {
          formatter: function () {
            const val = (this as any).value as number;
            const percent = (val * 100 / totalMem).toFixed(2);
            return val + ' GB ';
          }
        }
      },
      plotOptions: {
        area: { lineColor: '#000000', lineWidth: 0.1, marker: { enabled: false } },
        spline: { marker: { enabled: true } }
      }
    };

    if (type === 'Normal') {
      options.chart.type = 'area';
      options.plotOptions.area = {
        stacking: undefined,
        lineColor: '#000000',
        lineWidth: 0.5,
        shadow: false,
        marker: { enabled: false }
      };
      options.yAxis.plotLines = [{
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
      }];
      options.series = [{
        name: 'mem usage',
        data: metrics.map((m: any) => Number(m.mem) || 0),
        color: "#AA4643",
        type: 'area'
      }];
    } else {
      options.series = [
        { name: 'mem peak', data: metrics.map((m: any) => m.mem || 0), color: "#92A8CD", type: 'spline' },
        { name: 'mem avg', data: metrics.map((m: any) => m.avg_mem || 0), color: "#AA4643", type: 'area' }
      ];
    }
    return options;
  };

  return (
    <Block title="Sar stats" subtitle="Memory Daily Usage" tabs={['Per days']}>
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

      <div id="container" className="min-h-[435px]">
        {isFetching ? <div className="text-center py-20">Loading...</div> : queryEnabled ? (
          response?.data && response.data.length > 0 ? <SarChart options={getChartOptions()} /> : <div className="text-center py-20 bg-gray-50 rounded">No records found.</div>
        ) : <div className="text-gray-400 italic text-center">Please select filters and click Query.</div>}
      </div>
    </Block>
  );
};

export default MemDailyPage;
