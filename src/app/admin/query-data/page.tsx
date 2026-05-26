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
    <div className="space-y-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input 
              placeholder="Table (e.g., BSS:u)"
              className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold"
              value={formData.table}
              onChange={(e) => setFormData({...formData, table: e.target.value})}
            />
            <input 
              placeholder="Year"
              className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold"
              value={formData.year}
              onChange={(e) => setFormData({...formData, year: e.target.value})}
            />
            <input 
              placeholder="Month"
              className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold"
              value={formData.month}
              onChange={(e) => setFormData({...formData, month: e.target.value})}
            />
            <input 
              placeholder="Day"
              className="bg-gray-50 border-2 border-gray-50 rounded-2xl p-3 text-xs font-bold"
              value={formData.day}
              onChange={(e) => setFormData({...formData, day: e.target.value})}
            />
            <button 
              onClick={handleQuery}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Search className="w-4 h-4" />} Query
            </button>
          </div>
        </div>

        {queryData.length > 0 && (
          <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-black uppercase text-[10px]">
                    {Object.keys(queryData[0]).map(key => <th key={key} className="px-6 py-4 text-left">{key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {queryData.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50/50">
                      {Object.values(row).map((val: any, i) => (
                        <td key={i} className="px-6 py-3 font-bold text-gray-700">{typeof val === 'object' ? JSON.stringify(val) : val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  );
};

export default QueryDataPage;
