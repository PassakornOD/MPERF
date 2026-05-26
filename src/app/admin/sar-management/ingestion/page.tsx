'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Database, 
  Play, 
  Loader2, 
  Server, 
  Layers, 
  Calendar,
  Clock
} from 'lucide-react';
import { useToast } from '@/components/common/Toast';

const IngestPage = () => {
  const { showToast } = useToast();
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [hostnames, setHostnames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    mode: 'yesterday',
    hostgroup: '',
    hostname: '',
    date: '',
    month: '',
    year: new Date().getFullYear().toString(),
    os: 'All',
    dataType: 'All'
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = useMemo(() => Array.from({ length: 40 }, (_, i) => (new Date().getFullYear() - i).toString()), []);

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [hgRes, hnRes] = await Promise.all([
        axios.get('/api/inventory/hostgroups'),
        axios.get('/api/inventory/hostnames')
      ]);
      setHostgroups(hgRes.data);
      setHostnames(hnRes.data);
    } catch (err) {
      console.error('Failed to fetch metadata:', err);
      showToast('Failed to load host metadata', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredHostnames = formData.hostgroup 
    ? hostnames.filter(hn => hn.hostgroup_id === parseInt(formData.hostgroup))
    : hostnames;

  const handleStartIngestion = async () => {
    setIngesting(true);
    setResults([]);
    
    const payload: any = {
      os: formData.os === 'All' ? undefined : formData.os,
      dataType: formData.dataType
    };

    if (formData.hostgroup) {
        const hg = hostgroups.find(g => g.hostgroup_id === parseInt(formData.hostgroup));
        if (hg) payload.hostgroup = hg.hostgroup;
    }
    
    if (formData.hostname) {
        payload.hostname = formData.hostname;
    }

    if (formData.mode === 'yesterday') {
      payload.day = 'yesterday';
    } else if (formData.mode === 'specific') {
      if (!formData.date) {
          showToast('Please specify a date', 'error');
          setIngesting(false);
          return;
      }
      payload.day = formData.date;
    } else if (formData.mode === 'month') {
      if (!formData.month || !formData.year) {
          showToast('Please specify both month and year', 'error');
          setIngesting(false);
          return;
      }
      payload.month = formData.month;
      payload.year = formData.year;
    }

    try {
      const response = await axios.post('/api/admin/ingest', payload);
      setResults(response.data.results || ['Ingestion completed with no logs.']);
      showToast('Ingestion task completed', 'success');
    } catch (err: any) {
      console.error('Ingestion failed:', err);
      showToast(err.response?.data?.error || 'Ingestion failed', 'error');
      setResults([`Error: ${err.response?.data?.error || err.message}`]);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-6">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 transition-all hover:shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <Clock className="w-3 h-3" /> Ingestion Mode
              </label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'yesterday', label: 'Yesterday', icon: Clock },
                  { id: 'specific', label: 'Specific Date', icon: Calendar },
                  { id: 'month', label: 'Full Month', icon: Calendar }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFormData({ ...formData, mode: m.id })}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-xs font-bold ${
                      formData.mode === m.id 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' 
                      : 'border-gray-50 bg-gray-50 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    <m.icon className={`w-4 h-4 ${formData.mode === m.id ? 'text-blue-600' : 'text-gray-400'}`} />
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <Layers className="w-3 h-3" /> Target Filter
              </label>
              <div className="space-y-3">
                <select value={formData.hostgroup} onChange={(e) => setFormData({ ...formData, hostgroup: e.target.value, hostname: '' })} className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none cursor-pointer">
                    <option value="">All Hostgroups</option>
                    {hostgroups.map(hg => <option key={hg.hostgroup_id} value={hg.hostgroup_id}>{hg.hostgroup}</option>)}
                </select>
                <select value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none cursor-pointer">
                    <option value="">All Hostnames</option>
                    {filteredHostnames.map(hn => <option key={hn.hostname_id} value={hn.hostname}>{hn.hostname}</option>)}
                </select>
                <select value={formData.dataType} onChange={(e) => setFormData({ ...formData, dataType: e.target.value })} className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 px-4 text-xs font-bold outline-none cursor-pointer">
                    <option value="All">All Data Types</option>
                    <option value="cpu">CPU Only</option>
                    <option value="mem">Memory Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <Calendar className="w-3 h-3" /> Date Configuration
              </label>
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                {formData.mode === 'specific' && (
                    <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border-2 border-gray-100 rounded-xl py-3 px-3 text-xs font-bold outline-none" />
                )}
                {formData.mode === 'month' && (
                    <div className="grid grid-cols-2 gap-2">
                        <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} className="bg-white border-2 border-gray-100 rounded-xl py-2 px-2 text-xs font-bold outline-none">
                            <option value="">Month</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="bg-white border-2 border-gray-100 rounded-xl py-2 px-2 text-xs font-bold outline-none">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                )}
              </div>
              <button disabled={ingesting || loading} onClick={handleStartIngestion} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-widest text-xs">
                {ingesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingesting...</> : <><Play className="w-4 h-4" /> Start Ingestion</>}
              </button>
            </div>
          </div>
        </div>
        <div className="bg-gray-900 rounded-[32px] border border-gray-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col p-6 font-mono text-[11px] text-gray-300">
            {results.map((line, idx) => <div key={idx}>{line}</div>)}
        </div>
    </div>
  );
};

export default IngestPage;
