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
          console.log('Fetching summary for:', { type, hostgroup: selectedGroup, hostname_id: selectedHostnameId, year, month });
          const res = await axios.get('/api/admin/sar-summary', { params: { type, hostgroup: selectedGroup, hostname_id: selectedHostnameId, year, month } });
          console.log('Summary response:', res.data);
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
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
        <div className="flex gap-4 mb-6">
          <button onClick={() => setType('cpu')} className={`px-6 py-2 rounded-2xl text-xs font-black uppercase transition-all ${type === 'cpu' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>CPU</button>
          <button onClick={() => setType('mem')} className={`px-6 py-2 rounded-2xl text-xs font-black uppercase transition-all ${type === 'mem' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>Memory</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold" value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setSelectedHostnameId(''); }}>
            <option value="">Select Hostgroup</option>
            {hostGroups?.map((g: any) => <option key={g.hostgroup} value={g.hostgroup}>{g.hostgroup}</option>)}
          </select>
          
          <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold" value={selectedHostnameId} onChange={(e) => setSelectedHostnameId(e.target.value)} disabled={!selectedGroup}>
            <option value="">All Hostnames</option>
            {hostGroups?.find((g: any) => g.hostgroup === selectedGroup)?.hostnames.map((h: any) => (
              <option key={h.hostname_id} value={h.hostname_id}>{h.hostname}</option>
            ))}
          </select>

          <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold" value={filterLevel} onChange={(e) => setFilterLevel(e.target.value as any)}>
            <option value="all">All Data</option>
            <option value="year">By Year</option>
            <option value="month">By Month</option>
            <option value="day">By Day</option>
          </select>

          <div className="flex gap-2">
            {filterLevel !== 'all' && (
                <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold w-full" value={year} onChange={(e) => setYear(e.target.value)}>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            )}
            {(filterLevel === 'month' || filterLevel === 'day') && (
                <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold w-full" value={month} onChange={(e) => setMonth(e.target.value)}>
                    {months.map(m => <option key={m.val} value={m.val}>{m.name}</option>)}
                </select>
            )}
            {filterLevel === 'day' && (
                <select className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold w-full" value={day} onChange={(e) => setDay(e.target.value)}>
                    {Array.from({ length: getDaysInMonth(month, year) }, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleQuery(1)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />} Query
            </button>
            <button onClick={() => setIsConfirmOpen(true)} className="bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl px-6 py-3 text-xs font-black uppercase transition-all">
                Delete
            </button>
          </div>
        </div>
      </div>
      
      {/* (Add ConfirmModal component implementation here or use standard one) */}
      <ConfirmModal 
          isOpen={isConfirmOpen} 
          onClose={() => setIsConfirmOpen(false)} 
          onConfirm={handleDelete}
          title="Confirm Deletion"
          message={`Are you sure you want to delete SAR ${type} data for ${selectedGroup} / ${selectedHostnameId} (Level: ${filterLevel})?`}
      />

      {filterLevel === 'month' && summaryData.length > 0 && (
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-900">Data Availability Summary ({year}-{month})</h3>
            {Object.entries(summaryData.reduce((acc: any, s: any) => {
                const key = `${s.hostname_id}|${s.hostname}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(s);
                return acc;
            }, {})).map(([key, records]: [string, any]) => {
                const [id, hostname] = key.split('|');
                return (
                    <div key={id}>
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-2 border-b border-blue-50 pb-1">{hostname} (ID: {id})</p>
                        <div className="flex flex-wrap gap-2">
                            {records.map((s: any) => {
                                const dateObj = new Date(s.date);
                                const d = String(dateObj.getDate()).padStart(2, '0');
                                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                const y = dateObj.getFullYear();
                                return (
                                    <div key={s.date} className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-100">
                                        {d}-{m}-{y}: {s.count} records
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
          </div>
      )}

      {queryData.length > 0 && (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-black uppercase text-[9px]">
                  {Object.keys(queryData[0]).map(key => <th key={key} className="px-6 py-4 text-left">{key}</th>)}
                </tr>
              </thead>
              <tbody>
                {queryData.map((row, idx) => (
                  <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50">
                    {Object.entries(row).map(([key, val]: [string, any], i) => (
                      <td key={i} className="px-6 py-3 font-bold text-gray-600">
                        {key === 'time' ? new Date(val).toISOString().replace('T', ' ').substring(0, 19) : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Page {page} of {totalPages} ({total} total)</span>
              <div className="flex gap-2">
                  <button onClick={() => handleQuery(page - 1, true)} disabled={page <= 1} className="px-3 py-1 rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 disabled:opacity-50">Prev</button>
                  <button onClick={() => handleQuery(page + 1, true)} disabled={page >= totalPages} className="px-3 py-1 rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 disabled:opacity-50">Next</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SarManagementPage;
