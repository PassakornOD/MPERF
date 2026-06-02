'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Database, Search, ChevronDown, Monitor, Calendar } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const SarManagementPage = () => {
  const { showToast } = useToast();
  
  // State
  const [type, setType] = useState<'cpu' | 'mem'>('cpu');
  const [filterLevel, setFilterLevel] = useState<'year' | 'month' | 'day' | 'all'>('year');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [selectedHostnameId, setSelectedHostnameId] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [day, setDay] = useState(new Date().getDate().toString().padStart(2, '0'));
  const [queryData, setQueryData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Queries
  const { data: hostGroups } = useQuery({
    queryKey: ['hostGroups-admin'],
    queryFn: async () => (await axios.get('/api/host-groups')).data
  });

  const { refetch: fetchSummary } = useQuery({
      queryKey: ['sar-summary', type, selectedGroup, selectedHostnameId, year, month],
      queryFn: async () => {
          if (!selectedGroup) return [];

          const res = await axios.get('/api/admin/sar-summary', { params: { type, hostgroup: selectedGroup, hostname_id: selectedHostnameId, year, month } });
          setSummaryData(res.data.data);
          return res.data.data;
      },
      enabled: false
  });

  const months = [
    { name: 'Jan', val: '01' }, { name: 'Feb', val: '02' }, { name: 'Mar', val: '03' }, { name: 'Apr', val: '04' },
    { name: 'May', val: '05' }, { name: 'Jun', val: '06' }, { name: 'Jul', val: '07' }, { name: 'Aug', val: '08' },
    { name: 'Sep', val: '09' }, { name: 'Oct', val: '10' }, { name: 'Nov', val: '11' }, { name: 'Dec', val: '12' }
  ];

  const getDaysInMonth = (m: string, y: string) => {
      return new Date(parseInt(y), parseInt(m), 0).getDate();
  };

  const years = useMemo(() => {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 41 }, (_, i) => (currentYear + 20 - i).toString());
  }, []);

  const handleQuery = async (pageNum = 1, silent = false) => {
    if (!selectedGroup) return showToast('Please select a hostgroup', 'error');
    
    setLoading(true);
    try {
      const params: any = { type, hostgroup: selectedGroup, year, level: filterLevel, hostname_id: selectedHostnameId, page: pageNum, pageSize };
      if (filterLevel === 'month' || filterLevel === 'day') params.month = month;
      if (filterLevel === 'day') params.day = day;

      const response = await axios.get('/api/admin/sar-data', { params });
      setQueryData(response.data.data);
      setTotal(response.data.total);
      setPage(pageNum);
      
      if (pageNum === 1 && filterLevel === 'month') {
          fetchSummary();
      }
      else if (pageNum === 1) setSummaryData([]);
      if (!silent) showToast(`Found ${response.data.total} records`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Query failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
      if (!selectedGroup || !selectedHostnameId) return showToast('Hostgroup and Hostname required', 'error');
      
      try {
          await axios.post('/api/admin/sar-data/delete', {
              hostgroup: selectedGroup,
              type,
              level: filterLevel,
              year,
              month,
              date: `${year}-${month}-${day}`,
              hostname_id: selectedHostnameId
          });
          showToast('Data deleted successfully', 'success');
          setIsConfirmOpen(false);
          handleQuery(1);
      } catch (err: any) {
          showToast(err.response?.data?.error || 'Deletion failed', 'error');
      }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-10 animate-ease-in pb-20">
      <div className="modern-card p-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
            <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 capitalize tracking-widest">Analytics Scope</h3>
                <p className="text-xs font-bold text-slate-400 capitalize">Select metric dimension for exploration</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl inner-shadow w-fit border border-slate-200/50">
              <button 
                onClick={() => setType('cpu')} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black capitalize tracking-[0.2em] transition-all duration-300 ${type === 'cpu' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                CPU Analytics
              </button>
              <button 
                onClick={() => setType('mem')} 
                className={`px-8 py-2.5 rounded-xl text-xs font-black capitalize tracking-[0.2em] transition-all duration-300 ${type === 'mem' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Memory Analytics
              </button>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 capitalize tracking-widest ml-1">Hostgroup</label>
            <div className="relative group">
                <select className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3.5 px-4 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
                  <option value="">Select Target</option>
                  {hostGroups?.map((g: any) => <option key={g.hostgroup} value={g.hostgroup}>{g.hostgroup}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 capitalize tracking-widest ml-1">Hostname</label>
            <div className="relative group">
                <select className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3.5 px-4 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner disabled:opacity-30" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
                  <option value="">Consolidated (All)</option>
                  {hostGroups?.find((g: any) => g.hostgroup === selectedGroup)?.hostnames.map((h: any) => (
                    <option key={h.hostname_id} value={h.hostname_id}>{h.hostname}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 capitalize tracking-widest ml-1">Filter Depth</label>
            <div className="relative group">
                <select className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-3.5 px-4 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as any)}>
                  <option value="all">Unfiltered (All)</option>
                  <option value="year">Annual View</option>
                  <option value="month">Monthly View</option>
                  <option value="day">Daily Detail</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 capitalize tracking-widest ml-1">Timeline</label>
            <div className="flex gap-2">
              {filterLevel !== 'all' && (
                  <select className="flex-1 bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner appearance-none text-center" value={year} onChange={(e) => setYear(e.target.value)}>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
              )}
              {(filterLevel === 'month' || filterLevel === 'day') && (
                  <select className="flex-1 bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner appearance-none text-center" value={month} onChange={(e) => setMonth(e.target.value)}>
                      {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                  </select>
              )}
              {filterLevel === 'day' && (
                  <select className="flex-1 bg-slate-50/50 border border-slate-100 rounded-xl py-3 px-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner appearance-none text-center" value={day} onChange={(e) => setDay(e.target.value)}>
                      {Array.from({ length: getDaysInMonth(month, year) }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
              )}
            </div>
          </div>

          <div className="flex gap-2 h-[46px]">
            <button onClick={() => handleQuery(1)} className="flex-1 bg-slate-900 hover:bg-black text-white rounded-xl px-6 py-2 text-xs font-black capitalize tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Search className="w-3.5 h-3.5" />} Fetch
            </button>
            <button onClick={() => setIsConfirmOpen(true)} className="flex-none bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl px-4 py-2 text-xs font-black capitalize tracking-widest transition-all border border-red-100 shadow-sm">
                Purge
            </button>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
          isOpen={isConfirmOpen} 
          onClose={() => setIsConfirmOpen(false)} 
          onConfirm={handleDelete}
          title="Security Override Required"
          message={`Permanent deletion of SAR ${type.toUpperCase()} records for ${selectedGroup}${selectedHostnameId ? ` / ${selectedHostnameId}` : ''} at ${filterLevel} resolution. This action cannot be reversed.`}
      />

      {filterLevel === 'month' && summaryData.length > 0 && (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-10 space-y-10 transition-all hover:shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-800 capitalize tracking-widest">Availability Summary</h3>
                        <p className="text-xs font-bold text-slate-400 capitalize mt-0.5">Inventory of records for cycle {year}-{month}</p>
                    </div>
                </div>
            </div>
            <div className="space-y-10">
                {Object.entries(summaryData.reduce((acc: any, s: any) => {
                    const key = `${s.hostname_id}|${s.hostname}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(s);
                    return acc;
                }, {})).map(([key, records]: [string, any]) => {
                    const [id, hostname] = key.split('|');
                    return (
                        <div key={id} className="space-y-5 animate-ease-in">
                            <div className="flex items-center gap-3">
                                <Monitor size={14} className="text-blue-500" />
                                <span className="text-[11px] font-black text-slate-800 capitalize tracking-tight">{hostname}</span>
                                <span className="text-[9px] font-black text-slate-300 capitalize tracking-widest">System ID: {id}</span>
                            </div>
                            <div className="flex flex-wrap gap-2.5 p-6 bg-slate-50/30 rounded-xl border border-slate-100 shadow-inner">
                                {records.map((s: any) => {
                                    const dateObj = new Date(s.date);
                                    const d = String(dateObj.getDate()).padStart(2, '0');
                                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                    const y = dateObj.getFullYear();
                                    return (
                                        <div key={s.date} className="px-4 py-2.5 bg-white text-slate-600 rounded-xl text-xs font-black border border-slate-100 shadow-sm hover:border-blue-300 hover:text-blue-600 transition-all cursor-default">
                                            {d}-{m}-{y} &bull; <span className="text-blue-600">{s.count}</span> <span className="text-[8px] opacity-60 capitalize">Entries</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
      )}

      {queryData.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl shadow-inner bg-slate-50/20 mx-10 my-10">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-400 font-black capitalize text-[9px] tracking-widest border-b border-slate-100">
                  {Object.keys(queryData[0]).map(key => <th key={key} className="px-10 py-6 whitespace-nowrap">{key}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 bg-white">
                {queryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-all duration-200 group">
                    {Object.entries(row).map(([key, val]: [string, any], i) => (
                      <td key={i} className="px-10 py-5 font-bold text-slate-600 whitespace-nowrap group-hover:text-blue-700">
                        {key === 'time' ? new Date(val).toISOString().replace('T', ' ').substring(0, 19) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-10 py-8 bg-slate-50/30 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-slate-400 capitalize tracking-[0.2em]">Viewing Page</span>
                  <div className="bg-white border border-slate-200 px-3 py-1 rounded-xl font-black text-xs text-blue-600 shadow-sm">{page} <span className="text-slate-300 font-medium px-1">/</span> {totalPages}</div>
                  <span className="text-xs font-black text-slate-300 capitalize tracking-widest ml-4">Total Population: {total.toLocaleString()} Records</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => handleQuery(page - 1, true)} disabled={page <= 1} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black capitalize tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-20 shadow-sm active:scale-95">Prev</button>
                  <button onClick={() => handleQuery(page + 1, true)} disabled={page >= totalPages} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-black capitalize tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-20 shadow-sm active:scale-95">Next</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SarManagementPage;
