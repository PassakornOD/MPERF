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

const IngestPage = () => {
  const { showToast } = useToast();
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [hostnames, setHostnames] = useState<any[]>([]);
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
        {/* Main Controls Card */}
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 transition-all hover:shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* 1. Selection Mode */}
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

            {/* 2. Filters */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <Layers className="w-3 h-3" /> Target Filter
              </label>
              <div className="space-y-3">
                <div className="relative group">
                  <Layers className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.hostgroup}
                    onChange={(e) => setFormData({ ...formData, hostgroup: e.target.value, hostname: '' })}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Hostgroups</option>
                    {hostgroups.map(hg => (
                      <option key={hg.hostgroup_id} value={hg.hostgroup_id}>{hg.hostgroup}</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <Server className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.hostname}
                    onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Hostnames</option>
                    {filteredHostnames.map(hn => (
                      <option key={hn.hostname_id} value={hn.hostname}>{hn.hostname}</option>
                    ))}
                  </select>
                </div>

                <div className="relative group">
                  <Database className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <select
                    value={formData.os}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl py-3.5 pl-12 pr-4 text-xs font-bold text-gray-900 outline-none focus:border-blue-200 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="All">All Operating Systems</option>
                    <option value="RedHat">RedHat Only</option>
                    <option value="Solaris">Solaris Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Date Configuration */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
                <Calendar className="w-3 h-3" /> Date Configuration
              </label>
              
              <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                {formData.mode === 'yesterday' && (
                  <div className="text-center py-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Targeting</p>
                    <p className="text-sm font-black text-blue-600 uppercase tracking-tight">Yesterday's SAR Files</p>
                  </div>
                )}

                {formData.mode === 'specific' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      placeholder="Day"
                      value={formData.day}
                      onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                      className="w-full bg-white border-2 border-gray-100 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-200"
                    />
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full bg-white border-2 border-gray-100 rounded-xl py-2 px-3 text-xs font-bold outline-none focus:border-blue-200"
                    >
                      <option value="">Month</option>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <div className="col-span-2 text-center py-2">
                      <span className="text-[10px] font-bold text-gray-400">Year: {new Date().getFullYear()}</span>
                    </div>
                  </div>
                )}

                {formData.mode === 'month' && (
                  <div className="space-y-2">
                    <select
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full bg-white border-2 border-gray-100 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-blue-200"
                    >
                      <option value="">Select Month</option>
                      {months.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <button
                disabled={ingesting || loading}
                onClick={handleStartIngestion}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200 disabled:shadow-none uppercase tracking-widest text-xs"
              >
                {ingesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Ingesting Data...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> Start Ingestion
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

        {/* Results Log Section */}
        <div className="bg-gray-900 rounded-[32px] border border-gray-800 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
          <div className="px-8 py-4 bg-gray-800/50 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Process Log</span>
            </div>
            {results.length > 0 && (
              <button 
                onClick={() => setResults([])}
                className="text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase"
              >
                Clear Log
              </button>
            )}
          </div>
          
          <div className="p-6 font-mono text-[11px] space-y-1 overflow-y-auto max-h-[500px]">
            {results.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 py-20">
                <Database className="w-12 h-12 mb-4 opacity-20" />
                <p>Waiting for ingestion task to start...</p>
              </div>
            ) : (
              results.map((line, idx) => (
                <div key={idx} className="flex gap-4 border-b border-gray-800/50 py-1 last:border-0 hover:bg-white/5 transition-colors group">
                  <span className="text-gray-600 w-8 text-right select-none">{idx + 1}</span>
                  <span className={`
                    ${line.includes('[Success]') ? 'text-green-400' : ''}
                    ${line.includes('[Error]') ? 'text-red-400' : ''}
                    ${line.includes('[Skip]') ? 'text-amber-400 font-bold' : ''}
                    ${line.startsWith('Error') ? 'text-red-500 font-black text-xs' : 'text-gray-300'}
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
