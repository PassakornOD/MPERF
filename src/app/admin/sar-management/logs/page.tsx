'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Trash2 } from 'lucide-react';
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
    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-black text-gray-900 uppercase">Ingestion Logs</h2>
        <div className="flex gap-2">
            <button onClick={() => setIsConfirmOpen(true)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-red-100 flex items-center gap-1">
                <Trash2 className="w-3 h-3"/> Clear All
            </button>
            <button 
                onClick={() => window.location.href = `/api/admin/ingest-logs/export?date=${date}&status=${status}`}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-[10px] font-black uppercase"
            >
                Export CSV
            </button>
            <input type="date" className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-bold" value={date} onChange={e => { setDate(e.target.value); setPage(1); }} />
            <select className="bg-gray-50 border border-gray-100 rounded-lg p-2 text-xs font-bold" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All Status</option>
                <option value="Success">Success</option>
                <option value="Error">Error</option>
                <option value="Skip">Skip</option>
            </select>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleClearLogs} 
        title="Clear All Logs" 
        message="Are you sure you want to permanently delete all ingestion logs? This action cannot be undone."
      />
      {isLoading ? (
        <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600"/></div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-black uppercase text-[10px]">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Table</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Records</th>
                  <th className="px-6 py-4">Message</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any, idx: number) => (
                  <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3">{new Date(new Date(log.timestamp).getTime() + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)}</td>
                    <td className="px-6 py-3 font-bold text-gray-700">{log.user}</td>
                    <td className="px-6 py-3 font-bold text-gray-700">{log.table_name}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded-full font-black text-[9px] uppercase ${log.status === 'Success' ? 'bg-green-100 text-green-700' : log.status === 'Error' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-700">{log.records_processed}</td>
                    <td className="px-6 py-3 text-gray-600">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Page {page} of {totalPages || 1} ({total} total)</span>
              <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 rounded bg-gray-100 text-xs font-bold hover:bg-gray-200 disabled:opacity-50">Next</button>
              </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsPage;