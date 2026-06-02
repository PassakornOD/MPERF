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
  Clock,
  ChevronDown
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
    <div className="space-y-10 animate-ease-in">
        <div className="modern-card p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs font-black text-slate-400 capitalize  px-1">
                <Clock className="w-3.5 h-3.5" /> Ingestion Strategy
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { id: 'yesterday', label: 'Rolling Yesterday', icon: Clock },
                  { id: 'specific', label: 'Target Date', icon: Calendar },
                  { id: 'month', label: 'Full Month Archival', icon: Calendar }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setFormData({ ...formData, mode: m.id })}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border-2 transition-all text-xs font-black capitalize tracking-wider ${
                      formData.mode === m.id 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm' 
                      : 'border-slate-50 bg-slate-50/30 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${formData.mode === m.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border border-slate-100 text-slate-300'}`}>
                        <m.icon className="w-4 h-4" />
                    </div>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs font-black text-slate-400 capitalize  px-1">
                <Layers className="w-3.5 h-3.5" /> Granular Filtering
              </label>
              <div className="space-y-4">
                <div className="relative group">
                    <select value={formData.hostgroup} onChange={(e) => setFormData({ ...formData, hostgroup: e.target.value, hostname: '' })} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 px-5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner">
                        <option value="">Global Scan (All Groups)</option>
                        {hostgroups.map(hg => <option key={hg.hostgroup_id} value={hg.hostgroup_id}>{hg.hostgroup}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                </div>
                <div className="relative group">
                    <select value={formData.hostname} onChange={(e) => setFormData({ ...formData, hostname: e.target.value })} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 px-5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner">
                        <option value="">Consolidated Scan (All Hosts)</option>
                        {filteredHostnames.map(hn => <option key={hn.hostname_id} value={hn.hostname}>{hn.hostname}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                </div>
                <div className="relative group">
                    <select value={formData.dataType} onChange={(e) => setFormData({ ...formData, dataType: e.target.value })} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 px-5 text-xs font-black capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner">
                        <option value="All">Unified Metrics</option>
                        <option value="cpu">CPU Dimensional Only</option>
                        <option value="mem">Memory Resource Only</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs font-black text-slate-400 capitalize  px-1">
                <Calendar className="w-3.5 h-3.5" /> Timeline Context
              </label>
              <div className="space-y-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col justify-center min-h-[180px]">
                {formData.mode === 'yesterday' && (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs font-black text-slate-400 capitalize ">Targeting Window</p>
                    <p className="text-sm font-black text-blue-600 capitalize  italic animate-pulse">Yesterday's SAR Cycle</p>
                  </div>
                )}
                {formData.mode === 'specific' && (
                    <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                        <label className="text-[9px] font-black text-slate-400 capitalize ml-1">Target Date</label>
                        <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all" />
                    </div>
                )}
                {formData.mode === 'month' && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 capitalize ml-1">Month</label>
                            <select value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all text-center appearance-none">
                                <option value="">Select</option>
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 capitalize ml-1">Year</label>
                            <select value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full bg-white border border-slate-100 rounded-xl py-3 px-2 text-xs font-black outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all text-center appearance-none">
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                    </div>
                )}
              </div>
              <button disabled={ingesting || loading} onClick={handleStartIngestion} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 disabled:shadow-none capitalize  text-xs">
                {ingesting ? <><Loader2 className="w-4 h-4 animate-spin" /> Commencing Ingestion...</> : <><Play className="w-4 h-4" /> Start Ingestion Cycle</>}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden min-h-[400px] flex flex-col transition-all">
            <div className="px-10 py-5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${ingesting ? 'bg-blue-500 animate-pulse' : results.length > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                  <span className="text-xs font-black text-slate-400 capitalize ">Operational Stream Log</span>
                </div>
                {results.length > 0 && (
                  <button 
                    onClick={() => setResults([])}
                    className="text-xs font-black text-slate-500 hover:text-white transition-all capitalize  bg-slate-700/50 px-3 py-1 rounded-xl"
                  >
                    Flush Log
                  </button>
                )}
            </div>
            <div className="p-10 font-mono text-[11px] space-y-2 overflow-y-auto max-h-[500px] custom-scrollbar text-slate-300">
                {results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-700 py-32 space-y-4">
                    <Database className="w-16 h-12 mb-2 opacity-10" />
                    <p className="text-xs font-black capitalize  opacity-40">System ready for data intake</p>
                  </div>
                ) : (
                  results.map((line, idx) => (
                    <div key={idx} className="flex gap-6 border-b border-slate-800/30 py-2 last:border-0 hover:bg-white/5 transition-all group rounded-xl px-2 -mx-2">
                        <span className="text-slate-600 w-10 text-right select-none font-bold tabular-nums">{(idx + 1).toString().padStart(3, '0')}</span>
                        <span className={`
                            ${line.includes('[Success]') ? 'text-emerald-400 font-bold' : ''}
                            ${line.includes('[Error]') ? 'text-red-400 font-bold bg-red-500/10 px-2 rounded' : ''}
                            ${line.includes('[Skip]') ? 'text-amber-400 font-bold italic opacity-80' : ''}
                            ${line.startsWith('Error') ? 'text-red-500 font-black text-xs' : ''}
                        `}>{line}</span>
                    </div>
                  ))
                )}
            </div>
        </div>
    </div>
  );
};

export default IngestPage;
