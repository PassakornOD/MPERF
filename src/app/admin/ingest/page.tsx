'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Database, 
  Play, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Server, 
  Layers, 
  Calendar,
  XCircle,
  Clock,
  Search
} from 'lucide-react';
import DashboardWrapper from '@/components/layout/DashboardWrapper';
import { useToast } from '@/components/common/Toast';
import { HostGroup, Hostname } from '@/types/report';

interface IngestionPayload {
  os?: string;
  hostgroup?: string;
  hostname?: string;
  day?: string;
  month?: string;
}

const IngestPage = () => {
  const { showToast } = useToast();
  const [hostgroups, setHostgroups] = useState<HostGroup[]>([]);
  const [hostnames, setHostnames] = useState<Hostname[]>([]);
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    mode: 'yesterday', // 'yesterday', 'specific', 'month'
    hostgroup: '',
    hostname: '',
    day: '',
    month: '',
    os: 'All'
  });

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    fetchMetadata();
  }, []);

  const fetchMetadata = async () => {
    try {
      const [hgRes, hnRes] = await Promise.all([
        axios.get<HostGroup[]>('/api/inventory/hostgroups'),
        axios.get<Hostname[]>('/api/inventory/hostnames')
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
    
    const payload: IngestionPayload = {
      os: formData.os === 'All' ? undefined : formData.os
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
      if (!formData.day || !formData.month) {
          showToast('Please specify both day and month', 'error');
          setIngesting(false);
          return;
      }
      payload.day = `${formData.day} ${formData.month}`;
    } else if (formData.mode === 'month') {
      if (!formData.month) {
          showToast('Please specify a month', 'error');
          setIngesting(false);
          return;
      }
      payload.month = formData.month;
    }

    try {
      const response = await axios.post('/api/admin/ingest', payload);
      setResults(response.data.results || ['Ingestion completed with no logs.']);
      showToast('Ingestion task completed', 'success');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message: string };
      console.error('Ingestion failed:', error);
      showToast(error.response?.data?.error || 'Ingestion failed', 'error');
      setResults([`Error: ${error.response?.data?.error || error.message}`]);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-10 animate-ease-in">
        {/* Main Controls Card */}
        <div className="modern-card p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            
            {/* 1. Selection Mode */}
            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs text-slate-400 capitalize px-1">
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
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-xl border-2 transition-all text-xs capitalize tracking-wider ${
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

            {/* 2. Filters */}
            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs text-slate-400 capitalize px-1">
                <Layers className="w-3.5 h-3.5" /> Granular Filtering
              </label>
              <div className="space-y-4">
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.hostgroup}
                    onChange={(e) => setFormData({ ...formData, hostgroup: e.target.value, hostname: '' })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-xs capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="">Global Scan (All Groups)</option>
                    {hostgroups.map(hg => (
                      <option key={hg.hostgroup_id} value={hg.hostgroup_id}>{hg.hostgroup}</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.hostname}
                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-xs capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="">Consolidated Scan (All Hosts)</option>
                    {filteredHostnames.map(hn => (
                      <option key={hn.hostname_id} value={hn.hostname}>{hn.hostname}</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.os}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-100 rounded-xl py-4 pl-12 pr-4 text-xs capitalize tracking-tight text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer shadow-inner"
                  >
                    <option value="All">Unified Platforms</option>
                    <option value="RedHat">RedHat Enterprise Linux</option>
                    <option value="Solaris">Oracle Solaris / SunOS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Date Configuration */}
            <div className="space-y-6">
              <label className="flex items-center gap-2.5 text-xs text-slate-400 capitalize px-1">
                <Calendar className="w-3.5 h-3.5" /> Timeline Context
              </label>
              
              <div className="space-y-4 p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 shadow-inner flex flex-col justify-center min-h-[160px]">
                {formData.mode === 'yesterday' && (
                  <div className="text-center py-4 space-y-2">
                    <p className="text-xs text-slate-400 capitalize">Targeting Window</p>
                    <p className="text-sm text-blue-600 capitalize italic animate-pulse">Yesterday's Operational Logs</p>
                  </div>
                )}

                {formData.mode === 'specific' && (
                  <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in duration-300">
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 capitalize ml-1">Day</label>
                        <input
                            type="number"
                            min="1"
                            max="31"
                            placeholder="DD"
                            value={formData.day}
                            onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 capitalize ml-1">Month</label>
                        <select
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                            className="w-full bg-white border border-slate-100 rounded-xl py-3 px-4 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all appearance-none"
                        >
                            <option value="">Select</option>
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2 text-center pt-2">
                      <span className="text-xs text-slate-300 capitalize">Active Cycle: {new Date().getFullYear()}</span>
                    </div>
                  </div>
                )}

                {formData.mode === 'month' && (
                  <div className="space-y-1 animate-in fade-in zoom-in duration-300">
                    <label className="text-[9px] text-slate-400 capitalize ml-1">Archive Month</label>
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full bg-white border border-slate-100 rounded-xl py-4 px-5 text-xs capitalize outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 shadow-sm transition-all appearance-none"
                    >
                      <option value="">Select Target Month</option>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button
                disabled={ingesting || loading}
                onClick={handleStartIngestion}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-300 text-white py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-500/20 disabled:shadow-none capitalize text-xs"
              >
                {ingesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Commencing Ingestion...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Ingestion Cycle
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Results Log Section */}
        <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transition-all">
          <div className="px-10 py-5 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-2.5 h-2.5 rounded-full ${ingesting ? 'bg-blue-500 animate-pulse' : results.length > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
              <span className="text-xs text-slate-400 capitalize">Operational Stream Log</span>
            </div>
            {results.length > 0 && (
              <button 
                onClick={() => setResults([])}
                className="text-xs text-slate-500 hover:text-white transition-all capitalize bg-slate-700/50 px-3 py-1 rounded-xl"
              >
                Flush Log
              </button>
            )}
          </div>
          
          <div className="p-10 font-mono text-[11px] space-y-1.5 overflow-y-auto max-h-[500px] custom-scrollbar">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 py-32 space-y-4">
                <Database className="w-16 h-12 mb-2 opacity-10" />
                <p className="text-xs capitalize opacity-40">System ready for data intake</p>
              </div>
            ) : (
              results.map((line, idx) => (
                <div key={idx} className="flex gap-6 border-b border-slate-800/30 py-2 last:border-0 hover:bg-white/5 transition-all group rounded-xl px-2 -mx-2">
                  <span className="text-slate-600 w-10 text-right select-none font-bold tabular-nums">{(idx + 1).toString().padStart(3, '0')}</span>
                  <span className={`
                    ${line.includes('[Success]') ? 'text-emerald-400 font-bold' : ''}
                    ${line.includes('[Error]') ? 'text-red-400 font-bold bg-red-500/10 px-2 rounded' : ''}
                    ${line.includes('[Skip]') ? 'text-amber-400 font-bold italic opacity-80' : ''}
                    ${line.startsWith('Error') ? 'text-red-500 text-xs' : 'text-slate-300'}
                  `}>
                    {line}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    );
};

export default IngestPage;
