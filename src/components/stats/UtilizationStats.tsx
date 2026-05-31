
'use client';

import React, { useState } from 'react';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/components/common/Toast';
import { Loader2, Activity } from 'lucide-react';

const UtilizationStats = ({ type }: { type: 'CPU' | 'Mem' }) => {
  const { showToast } = useToast();
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
      showToast("Please select a hostgroup", 'info');
      return;
    }
    setQueryEnabled(true);
    refetch();
  };

  return (
    <Block title={`${type} Utilization`} subtitle={`Long-term ${type === 'CPU' ? 'Processor' : 'Memory'} usage stats (Last 12 Months)`}>
      <div className="bg-gray-50/80 p-6 sm:p-8 rounded-3xl border border-gray-100 mb-2 flex flex-wrap gap-6 items-end justify-start sm:justify-center transition-all">
        <div className="flex-1 min-w-[250px]">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">Hostgroup</label>
          <select className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm" value={hostgroup} onChange={(e) => setHostgroup(e.target.value)}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
        </div>
        <button onClick={handleQuery} className="bg-blue-600 text-white px-10 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 h-[42px]">
          Query
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-inner overflow-hidden">
        <div className="overflow-x-auto">
          {isFetching ? (
            <div className="text-center py-32">
              <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-6 text-sm font-bold text-gray-400">Fetching statistics...</p>
            </div>
          ) : queryEnabled ? (
            stats && stats.length > 0 ? (
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">Hostname</th>
                    {months.map(m => (
                      <th key={`${m.month}-${m.year}`} className="px-2 py-5 text-center text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                        {m.label}{String(m.year).slice(-2)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hostnames.map((hn: any) => (
                    <tr key={hn} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">{hn}</td>
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
                        return <td key={`${m.month}-${m.year}`} className="px-2 py-4 text-center font-semibold text-gray-600">{displayVal}</td>
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-32 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">No records found for this hostgroup.</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-gray-300">
              <Activity size={64} className="mb-4 opacity-20" />
              <p className="font-bold text-lg">Select a hostgroup and click Query</p>
            </div>
          )}
        </div>
      </div>
    </Block>
  );
};

export default UtilizationStats;
