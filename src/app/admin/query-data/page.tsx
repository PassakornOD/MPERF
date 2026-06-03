'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Database, Search, Loader2, Table as TableIcon } from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import { useToast } from '@/components/common/Toast';

const QueryDataPage = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [queryData, setQueryData] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    table: '',
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
    day: new Date().getDate().toString().padStart(2, '0'),
    limit: 100
  });

  const handleQuery = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/admin/query-data', formData);
      setQueryData(response.data.data);
      showToast(`Found ${response.data.count} records`, 'success');
    } catch (err: any) {
      console.error('Query failed:', err);
      showToast(err.response?.data?.error || 'Query failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-ease-in">
        <div className="modern-card p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
            <div className="space-y-2 lg:col-span-1">
                <label className="text-xs text-slate-400 capitalize ml-1">Database Table</label>
                <input 
                  placeholder="e.g. BSS:u"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs capitalize tracking-tight outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner"
                  value={formData.table}
                  onChange={(e) => setFormData({...formData, table: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-slate-400 capitalize ml-1">Year</label>
                <input 
                  placeholder="YYYY"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-slate-400 capitalize ml-1">Month</label>
                <input 
                  placeholder="MM"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner"
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs text-slate-400 capitalize ml-1">Day</label>
                <input 
                  placeholder="DD"
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner"
                  value={formData.day}
                  onChange={(e) => setFormData({...formData, day: e.target.value})}
                />
            </div>
            <button 
              onClick={handleQuery}
              className="bg-slate-900 hover:bg-black text-white rounded-xl px-8 py-3.5 text-xs capitalize flex items-center justify-center gap-2.5 transition-all shadow-xl shadow-slate-200 h-[46px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />} Execute Query
            </button>
          </div>
        </div>

        {queryData.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="px-8 py-5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <TableIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-slate-800 capitalize">Query Result Set</span>
                </div>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[9px] capitalize tracking-tighter shadow-md shadow-blue-100">{queryData.length} Records</span>
            </div>
            <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl shadow-inner bg-slate-50/20 mx-8 my-8">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-white text-slate-400 capitalize text-[9px] border-b border-slate-100">
                    {Object.keys(queryData[0]).map(key => <th key={key} className="px-8 py-5 whitespace-nowrap">{key}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 bg-white">
                  {queryData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/30 transition-all duration-200 group">
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="px-8 py-4 font-bold text-slate-600 whitespace-nowrap group-hover:text-blue-700">
                          {typeof val === 'object' ? <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">{JSON.stringify(val)}</code> : val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50/30 border-t border-slate-50 text-center">
                <p className="text-[9px] text-slate-300 capitalize italic">End of query results</p>
            </div>
          </div>
        )}
      </div>
  );
};

export default QueryDataPage;
