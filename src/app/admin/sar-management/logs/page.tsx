'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Trash2, Database, Download } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';

const LogsPage = () => {
  const [page, setPage] = useState(1);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const pageSize = 50;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['ingest-logs', page, date, status],
    queryFn: async () => (await axios.get(`/api/admin/ingest-logs?page=${page}&pageSize=${pageSize}&date=${date}&status=${status}`)).data
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const handleClearLogs = async () => {
      try {
          await axios.post('/api/admin/ingest-logs/clear');
          showToast('Logs cleared successfully', 'success');
          setIsConfirmOpen(false);
          refetch();
          queryClient.invalidateQueries({ queryKey: ['ingest-logs'] });
      } catch (err: any) {
          showToast('Failed to clear logs', 'error');
      }
  };

  return (
    <div className="bg-card rounded-[2rem] border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="px-8 py-6 border-b border-slate-50 bg-background/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Database className="w-5 h-5" />
            </div>
            <div>
                <h2 className="text-sm text-foreground capitalize  leading-none">Ingestion History</h2>
                <p className="text-xs font-bold text-muted-foreground capitalize mt-1">Audit log of automated data cycles</p>
            </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
            <button onClick={() => setIsConfirmOpen(true)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs capitalize  hover:bg-red-100 flex items-center gap-2 transition-all">
                <Trash2 className="w-3.5 h-3.5"/> Purge All
            </button>
            <button 
                onClick={() => window.location.href = `/api/admin/ingest-logs/export?date=${date}&status=${status}`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs capitalize  shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
            >
                <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <div className="flex items-center gap-2 bg-card border border-border p-1.5 rounded-xl shadow-inner">
                <input type="date" className="bg-transparent border-none text-xs capitalize outline-none px-2 text-slate-600" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} />
                <div className="w-px h-4 bg-slate-100 mx-1"></div>
                <select className="bg-transparent border-none text-xs capitalize outline-none px-2 text-slate-600 cursor-pointer" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">Status: All</option>
                    <option value="Success">Success</option>
                    <option value="Error">Error</option>
                    <option value="Skip">Skip</option>
                </select>
            </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleClearLogs} 
        title="Security Override" 
        message="Are you sure you want to permanently delete all ingestion logs? This action cannot be undone."
      />
      {isLoading ? (
        <div className="p-32 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 opacity-20"/>
            <p className="text-xs text-slate-300 capitalize  mt-6">Retrieving audit stream...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto custom-scrollbar border border-border rounded-xl shadow-inner bg-background/20 mx-8 mb-8">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-card border-b border-border">
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">Timestamp</th>
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">Operator</th>
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">Target Table</th>
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">State</th>
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">Delta</th>
                  <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize ">System Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 bg-card">
                {logs.map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-blue-50/30 transition-all duration-200 group">
                    <td className="px-8 py-4 text-muted-foreground font-medium tabular-nums">{new Date(new Date(log.timestamp).getTime() + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)}</td>
                    <td className="px-8 py-4 text-slate-700 capitalize tracking-tight">{log.user}</td>
                    <td className="px-8 py-4 font-bold text-blue-600"><code className="bg-blue-50/50 px-2 py-0.5 rounded text-xs">{log.table_name}</code></td>
                    <td className="px-8 py-4">
                      <span className={`px-2.5 py-1 rounded-xl text-[8px] capitalize  border ${
                          log.status === 'Success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm' : 
                          log.status === 'Error' ? 'bg-red-50 text-red-700 border-red-100 shadow-sm' : 
                          'bg-slate-100 text-muted-foreground border-border'
                      }`}>
                          {log.status}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-slate-700 tabular-nums">{log.records_processed.toLocaleString()}</td>
                    <td className="px-8 py-4 text-muted-foreground font-medium max-w-xs truncate" title={log.message}>{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-6 bg-background/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground capitalize ">Historical Sequence</span>
                  <div className="bg-card border border-border px-4 py-1.5 rounded-xl text-xs text-blue-600 shadow-sm">{page} <span className="text-slate-300 font-medium px-1">/</span> {totalPages || 1}</div>
                  <span className="text-xs text-slate-300 capitalize  ml-4">Total: {total.toLocaleString()} Records</span>
              </div>
              <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-8 py-2.5 rounded-xl bg-card border border-border text-xs capitalize  hover:bg-background hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-20 shadow-sm active:scale-95">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-8 py-2.5 rounded-xl bg-card border border-border text-xs capitalize  hover:bg-background hover:border-blue-300 hover:text-blue-600 transition-all disabled:opacity-20 shadow-sm active:scale-95">Next Cycle</button>
              </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsPage;