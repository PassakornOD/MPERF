
'use client';

import React, { useState } from 'react';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const UtilizationStats = ({ type }: { type: 'CPU' | 'Mem' }) => {
  const [hostgroup, setHostgroup] = useState('');
  const [queryEnabled, setQueryEnabled] = useState(false);

  // Generate 12 months array ending at previous month, newest to oldest
  const get12Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 1; i <= 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('en-US', { month: 'short' }),
        month: d.getMonth() + 1,
        year: d.getFullYear()
      });
    }
    return months;
  };

  const months = get12Months();

  const { data: hostGroups } = useQuery({
    queryKey: ['hostGroups'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const { data: stats, isFetching, refetch } = useQuery({
    queryKey: ['utilization', type, hostgroup],
    queryFn: async () => {
      const res = await axios.get('/api/utilization/stats-last-12', { 
        params: { hostgroup },
        headers: { 'x-type': type.toLowerCase() }
      });
      return res.data;
    },
    enabled: queryEnabled && !!hostgroup
  });

  const hostnames = Array.from(new Set(stats?.map((s: any) => s.hostname) || []));

  const handleQuery = () => {
    if (!hostgroup) {
        alert("Please select a hostgroup");
        return;
    }
    setQueryEnabled(true);
    refetch();
  };

  return (
    <Block title={`${type} Utilization Stat (Last 12 Months)`} tabs={['Per Month']}>
      <div className="bg-gray-100 p-4 rounded-md mb-8 flex flex-wrap gap-4 items-end justify-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Hostgroup</label>
          <select className="border border-gray-300 rounded px-2 py-1 text-sm min-w-[150px]" value={hostgroup} onChange={(e) => setHostgroup(e.target.value)}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
        </div>
        <button onClick={handleQuery} className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700 h-[30px]">
          Query
        </button>
      </div>

      <div className="overflow-x-auto">
        {isFetching ? <div className="text-center py-10">Loading...</div> : queryEnabled ? (
          stats && stats.length > 0 ? (
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase text-xs font-bold">
                  <th className="px-4 py-3">Hostname</th>
                  {months.map(m => (
                    <th key={`${m.month}-${m.year}`} className="px-2 py-3 text-center">
                      {m.label}{String(m.year).slice(-2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {hostnames.map((hn: any) => (
                  <tr key={hn} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{hn}</td>
                    {months.map(m => {
                      const val = stats?.find((s: any) => s.hostname === hn && s.month === m.month && s.year === m.year);
                      let displayVal = '-';
                      if (val) {
                          if (type === 'CPU') {
                              const idle = parseFloat(val.avg_idle);
                              if (!isNaN(idle)) displayVal = (100 - idle).toFixed(2);
                          } else {
                              const v = parseFloat(val.val);
                              if (!isNaN(v)) displayVal = v.toFixed(2);
                          }
                      }
                      return <td key={`${m.month}-${m.year}`} className="px-2 py-3 text-center">{displayVal}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-10 text-gray-500">No records found.</div>
          )
        ) : (
            <div className="text-center py-10 text-gray-400 italic">Please select filters and click Query.</div>
        )}
      </div>
    </Block>
  );
};

export default UtilizationStats;
