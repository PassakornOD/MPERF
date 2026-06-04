
'use client';

import React, { useState } from 'react';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from '@/components/common/Toast';
import { Loader2, Activity, ChevronDown, AlertCircle } from 'lucide-react';
import ProgressBar from '@/components/common/ProgressBar';

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
      <div className="bg-slate-50/50 p-6 sm:p-8 rounded-xl border border-slate-100 mb-8 flex flex-wrap gap-6 items-end justify-start sm:justify-center transition-all shadow-inner">
        <div className="flex-1 min-w-[250px]">
          <label className="text-xs  text-slate-400 capitalize  mb-2 ml-1 block">Hostgroup Scope</label>
          <div className="relative group">
            <select className="w-full bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs  capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all appearance-none cursor-pointer shadow-sm" value={hostgroup} onChange={(e) => setHostgroup(e.target.value)}>
              <option value="">Select Hostgroup</option>
              {hostGroups?.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup}>{g.hostgroup}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
          </div>
        </div>
        <button onClick={handleQuery} className="bg-slate-900 text-white px-10 py-2.5 rounded-xl text-xs  capitalize  hover:bg-black transition-all shadow-xl shadow-slate-200 h-[42px] active:scale-95">
          Query
        </button>
      </div>

      <div id="container" className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden animate-ease-in relative">
        <ProgressBar isVisible={isFetching} />
        <div className="overflow-x-auto custom-scrollbar">
          {isFetching ? (
            <div className="p-10 space-y-4">
              <div className="flex gap-4">
                <div className="w-40 h-10 skeleton"></div>
                <div className="flex-1 h-10 skeleton"></div>
              </div>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="w-full h-12 skeleton opacity-50"></div>
              ))}
            </div>
          ) : queryEnabled ? (
            stats && stats.length > 0 ? (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-8 py-6 text-slate-400  text-[9px] capitalize ">Hostname</th>
                    {months.map(m => (
                      <th key={`${m.month}-${m.year}`} className="px-3 py-6 text-center text-slate-400  text-[9px] capitalize ">
                        {m.label} {String(m.year).slice(-2)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {hostnames.map((hn: any) => (
                    <tr key={hn} className="hover:bg-blue-50/30 transition-all duration-200 group">
                      <td className="px-8 py-5  text-slate-800 capitalize tracking-tight whitespace-nowrap group-hover:text-blue-700">{hn}</td>
                      {months.map(m => {
                        const val = stats?.find((s: any) => s.hostname === hn && s.month === m.month && s.year === m.year);
                        let displayVal = '-';
                        let isHigh = false;
                        if (val) {
                          if (type === 'CPU') {
                            const idle = parseFloat(val.avg_idle);
                            if (!isNaN(idle)) {
                              const utilization = 100 - idle;
                              displayVal = utilization.toFixed(2);
                              isHigh = utilization > 80;
                            }
                          } else {
                            const v = parseFloat(val.val);
                            if (!isNaN(v)) {
                              displayVal = v.toFixed(2);
                              // For memory, we don't necessarily know the total here without more lookup, 
                              // but we could color based on absolute value if we wanted.
                            }
                          }
                        }
                        return (
                          <td key={`${m.month}-${m.year}`} className="px-3 py-5 text-center whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-xl font-bold tabular-nums text-[11px] ${displayVal === '-' ? 'text-slate-300 font-medium' :
                              isHigh ? 'bg-red-50 text-red-600' : 'text-slate-600'
                              }`}>
                              {displayVal}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-40 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-100 mx-10 my-10">
                <AlertCircle className="w-12 h-12 text-slate-200 mb-4" />
                <p className="text-xs  text-slate-300 capitalize ">No operational records found for sector</p>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-40">
              <Activity size={80} className="mb-8 text-slate-100 animate-pulse" />
              <p className="text-xs  text-slate-300 capitalize ">Awaiting Vector Selection</p>
            </div>
          )}
        </div>
      </div>
    </Block>
  );
};

export default UtilizationStats;
