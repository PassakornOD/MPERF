'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Highcharts from 'highcharts';
import { Plus, FileText, Trash2, Edit2, Clock, X, Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Heading1, Server, BarChart3, Loader2, Calendar, Layout, GripVertical, Monitor, PlusCircle, Zap, Activity, CheckCircle, Download, AlertCircle } from 'lucide-react';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ReportPayload } from '@/types/report';
import SarChart from '@/components/charts/SarChart';
import { getChartOptions } from '@/components/charts/chartUtils';
import { useToast } from '@/components/common/Toast';
import { useSession } from 'next-auth/react';
import { checkPermission } from '@/lib/permissions';
import FloatingInput from '@/components/common/FloatingInput';

interface Template {
  id: number;
  name: string;
  reportTitle: string;
  lastUpdated: string;
  hosts: { id: string; name: string; group: string; mem: number }[];
  charts: { id: string; label: string; enabled: boolean }[];
}

interface BackgroundJob {
  id: string;
  templateName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  timestamp: string;
  pdfPath?: string;
}

const ReportTemplatesPage = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Background Jobs State
  const [backgroundJobs, setBackgroundJobs] = useState<BackgroundJob[]>([]);
  const [isBackgroundModalOpen, setIsBackgroundModalOpen] = useState(false);
  const [selectedTemplateForBg, setSelectedTemplateForBg] = useState<Template | null>(null);

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['report_templates'],
    queryFn: async () => {
      const res = await axios.get('/api/report-templates');
      return res.data.map((t: any) => {
        try {
          const config = typeof t.config === 'string' ? JSON.parse(t.config) : t.config;
          return {
            id: t.id,
            name: t.name,
            reportTitle: config.reportTitle || '',
            hosts: config.hosts || config.selectedHostnames || [],
            charts: config.charts || config.activeReports || [],
            lastUpdated: new Date(t.updated_at || t.created_at).toLocaleString('en-GB')
          };
        } catch (e) {
          return null;
        }
      }).filter((t: any) => t !== null);
    },
    enabled: !!user
  });

  const { data: jobStatusData } = useQuery({
    queryKey: ['background_jobs_status'],
    queryFn: async () => {
      const res = await axios.get('/api/run-report/status');
      return res.data as BackgroundJob[];
    },
    refetchInterval: 5000,
    enabled: !!user
  });

  useEffect(() => {
    if (jobStatusData) setBackgroundJobs(jobStatusData);
  }, [jobStatusData]);

  const triggerBackgroundJob = async () => {
    if (!selectedTemplateForBg) return;
    try {
      await axios.post('/api/run-report', {
        templateId: selectedTemplateForBg.id,
        month,
        year
      });
      showToast("Background report generation started", 'success');
      setIsBackgroundModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['background_jobs_status'] });
    } catch (e: any) {
      showToast(e.response?.data?.error || "Failed to start background job", 'error');
    }
  };

  const saveTemplateMutation = useMutation({
    mutationFn: (data: any) => {
      return editingTemplateId 
        ? axios.put(`/api/report-templates/${editingTemplateId}`, data) 
        : axios.post('/api/report-templates', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
      setIsModalOpen(false);
      showToast(editingTemplateId ? "Template updated" : "Template created", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || "Failed to save template", 'error');
    }
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/report-templates/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
      showToast("Template deleted", 'success');
    },
    onError: (err: any) => showToast(err.response?.data?.error || "Failed to delete template", 'error')
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerationModalOpen, setIsGenerationModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [generatingTemplate, setGeneratingTemplate] = useState<Template | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);

  const getPrevMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { start: format(firstDay), end: format(lastDay), month: String(firstDay.getMonth() + 1), year: String(firstDay.getFullYear()) };
  };

  const datesObj = getPrevMonthDates();
  const [startDate, setStartDate] = useState(datesObj.start);
  const [endDate, setEndDate] = useState(datesObj.end);
  const [month, setMonth] = useState<string>(datesObj.month);
  const [year, setYear] = useState<string>(datesObj.year);

  const [templateName, setTemplateName] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHostnames, setSelectedHostnames] = useState<{ id: string; name: string; group: string; mem?: number }[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  
  const [activeReports, setActiveReports] = useState([
    { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average', enabled: true },
    { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak', enabled: true },
    { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal', enabled: true },
    { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal', enabled: true },
    { id: 'cpu-daily-normal', label: 'CPU Daily (Normal)', type: 'cpu-daily', mode: 'Normal', enabled: false },
    { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak', enabled: false },
    { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal', enabled: false },
  ]);

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isExporting, setIsFetchingPDF] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [renderCharts, setRenderCharts] = useState(false);
  const [hiddenChartsData, setHiddenChartsData] = useState<any[]>([]);

  const handlePreviewPDF = async () => {
    if (isExporting || selectedHostnames.length === 0) return;
    setIsFetchingPDF(true); setExportStatus('Preparing report...');
    const selectedReportsList = activeReports.filter(r => r.enabled);

    const getChartSVG = (id: string) => {
      const el = document.getElementById(id);
      if (!el) return "";
      const chart = (Highcharts as any).charts.find((c: any) => c && (c.renderTo === el?.querySelector('.highcharts-container')?.parentElement || el?.contains(c.renderTo)));
      if (!chart) return "";
      try {
        const svg = chart.getSVG({ chart: { backgroundColor: '#ffffff', style: { fontFamily: 'sans-serif' } } });
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      } catch (e) { return ""; }
    };

    try {
      setExportStatus('Fetching performance metrics...');
      const chartsData: any[] = [];
      const hostgroupsWithData = await Promise.all(
        Object.values(
          selectedHostnames.reduce((acc: any, host) => {
            let groupName = host.group;
            if (!groupName && hostGroupsRaw) {
              const foundGroup = hostGroupsRaw.find((g: any) =>
                g.hostnames.some((h: any) => String(h.hostname_id) === String(host.id))
              );
              if (foundGroup) groupName = foundGroup.hostgroup;
            }
            if (!groupName) return acc;
            if (!acc[groupName]) acc[groupName] = { name: groupName, hosts: [] };
            acc[groupName].hosts.push({ ...host, group: groupName });
            return acc;
          }, {})
        )
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
          .map(async (group: any) => {
            const hostsWithStats = await Promise.all(
              group.hosts.map(async (host: any) => {
                const apiParams = {
                  hostgroup: group.name,
                  hostnameId: String(host.id),
                  month: String(month),
                  year: String(year),
                };
                const summaryRes = await axios.get('/api/metrics/summary', { params: apiParams });
                const { cpuStats, memStats } = summaryRes.data;

                const hostCharts = await Promise.all(
                  selectedReportsList.map(async (report) => {
                    let endpoint = '';
                    const params: any = { hostgroup: group.name, hostnameId: host.id, month, year };

                    if (report.type === 'cpu-daily') {
                      endpoint = '/api/metrics/cpu-daily';
                      params.type = report.mode;
                      params.startDate = startDate;
                      params.endDate = endDate;
                    } else if (report.type === 'cpu-monthly') {
                      endpoint = '/api/metrics/monthly';
                    } else if (report.type === 'mem-daily') {
                      endpoint = '/api/metrics/mem-daily';
                      params.type = report.mode;
                      params.startDate = startDate;
                      params.endDate = endDate;
                    } else if (report.type === 'mem-monthly') {
                      endpoint = '/api/metrics/monthly';
                      params.type = 'r';
                    }
                    const res = await axios.get(endpoint, { params });
                    const metrics = res.data.data || res.data;
                    console.log(`[PreviewPDF] host=${host.name}, host.mem=${host.mem}, report=${report.id}`);
                    chartsData.push({
                      hostId: host.id,
                      reportId: report.id,
                      hostname: host.name,
                      hostMem: host.mem || 0, // Fallback to 0 if undefined
                      metrics,
                      report,
                      totalAvg: res.data.totalAvg,
                    });
                    return { label: report.label, metrics };
                  })
                );
                return { id: host.id, name: host.name, mem: host.mem, cpuStats, memStats, hostCharts };
              })
            );
            return { id: group.name, name: group.name, hosts: hostsWithStats };
          })
      );

      setExportStatus('Rendering chart visualisations...');
      setHiddenChartsData(chartsData); setRenderCharts(true);
      await new Promise(r => setTimeout(r, 5000));

      setExportStatus('Compiling PDF document...');
      const finalHostgroups = hostgroupsWithData.map((group: any) => ({
        id: group.id || group.name,
        name: group.name,
        hosts: group.hosts.map((host: any) => ({
          id: host.id,
          name: host.name,
          mem: host.mem,
          cpuStats: host.cpuStats,
          memStats: host.memStats,
          charts: selectedReportsList.map(report => ({ label: report.label, data: getChartSVG(`host-item-${host.id}-${report.id}`) }))
        }))
      }));

      const payload: ReportPayload = {
        reportMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        reportTitle: generatingTemplate?.reportTitle || reportTitle,
        targetMonth: parseInt(month), targetYear: parseInt(year), generatedDate: new Date().toLocaleDateString(),
        hostgroups: finalHostgroups as any
      };

      const response = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      setPdfUrl(window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
    } catch (e: any) { 
        setIsGenerationModalOpen(false);
        showToast('Error: ' + e.message, 'error'); 
    }
    finally { setIsFetchingPDF(false); setExportStatus(''); setRenderCharts(false); setHiddenChartsData([]); }
  };

  const availableCharts = useMemo(() => activeReports.filter(r => !r.enabled), [activeReports]);
  const selectedCharts = useMemo(() => activeReports.filter(r => r.enabled), [activeReports]);

  const toggleReport = (id: string) => setActiveReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const moveChart = (id: string, direction: 'up' | 'down') => {
    const selectedInOrder = activeReports.filter(r => r.enabled);
    const index = selectedInOrder.findIndex(r => r.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < selectedInOrder.length - 1)) {
        const newReports = [...activeReports];
        const swapIdx = direction === 'up' ? index - 1 : index + 1;
        const targetId = selectedInOrder[swapIdx].id;
        const currentIndex = newReports.findIndex(r => r.id === id);
        const targetIndex = newReports.findIndex(r => r.id === targetId);
        [newReports[currentIndex], newReports[targetIndex]] = [newReports[targetIndex], newReports[currentIndex]];
        setActiveReports(newReports);
    }
  };

  const { data: hostGroupsRaw } = useQuery({ queryKey: ['hostGroups-templates'], queryFn: async () => (await axios.get('/api/host-groups')).data });

  const filteredGroups = useMemo(() => {
    if (!hostGroupsRaw) return [];
    return hostGroupsRaw
        .filter((g: any) => g.hostgroup)
        .map((g: any) => ({ ...g, hostnames: g.hostnames.filter((h: any) => h.hostname.toLowerCase().includes(searchTerm.toLowerCase())) }))
        .filter((g: any) => g.hostnames.length > 0 || g.hostgroup.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a: any, b: any) => a.hostgroup.toLowerCase().localeCompare(b.hostgroup.toLowerCase()));
  }, [hostGroupsRaw, searchTerm]);

  const toggleExpand = (groupName: string) => setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);

  const toggleGroup = (groupName: string) => {
    const isSelected = selectedGroups.includes(groupName);
    const groupData = hostGroupsRaw?.find((g: any) => g.hostgroup === groupName);
    const groupHostnames = groupData?.hostnames.map((h: any) => {
        console.log(`[Debug] Host in group: ${h.hostname}, mem: ${h.mem}`);
        return { id: String(h.hostname_id), name: h.hostname, group: groupName, mem: h.mem };
    }) || [];
    if (isSelected) {
      setSelectedGroups(prev => prev.filter(g => g !== groupName));
      setSelectedHostnames(prev => prev.filter(h => h.group !== groupName));
    } else {
      setSelectedGroups(prev => [...prev, groupName]);
      setSelectedHostnames(prev => [...prev.filter(h => h.group !== groupName), ...groupHostnames]);
    }
  };

  const toggleHostname = (h: any) => {
    console.log(`[Debug] Toggling host: ${h.hostname}, mem: ${h.mem}`);
    let groupName = h.group;
    if (!groupName && hostGroupsRaw) {
        const foundGroup = hostGroupsRaw.find((g: any) => g.hostnames.some((hn: any) => String(hn.hostname_id) === String(h.hostname_id)));
        if (foundGroup) groupName = foundGroup.hostgroup;
    }

    setSelectedHostnames(prev => {
        const exists = prev.find(p => p.id === String(h.hostname_id));
        if (exists) {
            return prev.filter(p => p.id !== String(h.hostname_id));
        } else {
            return [...prev, { id: String(h.hostname_id), name: h.hostname, group: groupName, mem: h.mem }];
        }
    });
  };

  const handleDeleteTemplate = (id: number) => {
    setTemplateToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!templateToDelete) return;
    deleteTemplateMutation.mutate(templateToDelete, {
      onSuccess: () => {
        setTemplateToDelete(null);
        setIsConfirmOpen(false);
      }
    });
  };

  const handleEditTemplate = (template: any) => {
    setEditingTemplateId(template.id);
    setTemplateName(template.name);
    setReportTitle(template.reportTitle || '');
    setSelectedHostnames(template.hosts);
    setActiveReports(activeReports.map(r => ({ ...r, enabled: template.charts.some((c: any) => c.id === r.id) })));
    setStep(1);
    setIsModalOpen(true);
  };

  const handleGenerateReport = (template: Template) => {
      setGeneratingTemplate(template);
      setSelectedHostnames(template.hosts);
      setIsGenerationModalOpen(true);
  };

  const handleSaveTemplate = () => {
    const config = { 
      reportTitle, 
      hosts: selectedHostnames.map(host => ({
          ...host,
          mem: host.mem || 0
      })), 
      charts: activeReports.filter(r => r.enabled) 
    };
    saveTemplateMutation.mutate({ name: templateName || 'Untitled', config });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-blue-500 underline-offset-8">Report Templates</h2>
          <p className="text-gray-500 font-medium mt-4 text-sm">Organize and manage your high-volume report generation configurations.</p>
        </div>
        <button onClick={() => { setEditingTemplateId(null); setTemplateName(''); setReportTitle(''); setSelectedHostnames([]); setStep(1); setIsModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all hover:bg-slate-800 shadow-lg group">
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Create New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingTemplates ? (
          <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" /></div>
        ) : templates.length > 0 ? templates.map((template) => (
          <div key={template.id} className="flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group overflow-hidden">
            <div className="p-6 flex-1 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => handleEditTemplate(template)} className="text-gray-400 hover:text-blue-600 p-2 rounded-xl hover:bg-blue-50 transition-all"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTemplate(template.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>

                <div>
                    <h4 className="font-black text-gray-900 text-lg leading-tight truncate">{template.name}</h4>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Updated: {template.lastUpdated}</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"><Server className="w-3.5 h-3.5" /> {template.hosts.length} Hosts</span>
                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> {template.charts.length} Charts</span>
                </div>
            </div>

            <div className="p-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-2">
                <button 
                    onClick={() => handleGenerateReport(template)} 
                    className="flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-100 py-3 rounded-xl text-xs font-black uppercase hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                >
                    <FileText className="w-4 h-4" /> Preview
                </button>
                <button 
                    onClick={() => { setSelectedTemplateForBg(template); setIsBackgroundModalOpen(true); }}
                    className="flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl text-xs font-black uppercase hover:bg-slate-800 transition-all shadow-md"
                >
                    <Zap className="w-4 h-4 text-yellow-400" /> Background
                </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-40 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
            <FileText className="w-20 h-20 text-gray-100 mx-auto mb-6" />
            <p className="text-gray-400 font-black text-lg italic uppercase tracking-widest">No templates found</p>
            <button onClick={() => setIsModalOpen(true)} className="mt-6 text-blue-600 font-black uppercase text-sm hover:underline tracking-widest flex items-center gap-2 mx-auto">Create your first one <PlusCircle className="w-4 h-4" /></button>
          </div>
        )}
      </div>

      {/* Background Jobs Section */}
      <div className="pt-10 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase italic tracking-tight underline decoration-yellow-400 underline-offset-8">
                <Activity className="text-yellow-500" /> Background Job Status
            </h3>
            <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{backgroundJobs.length} Recent Jobs</span>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                        <th className="px-8 py-5">Template Name</th>
                        <th className="px-8 py-5">Request Time</th>
                        <th className="px-8 py-5">Status / Progress</th>
                        <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {backgroundJobs.length > 0 ? backgroundJobs.map((job) => (
                        <tr key={job.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-8 py-5">
                                <p className="font-black text-gray-900 text-sm leading-none mb-1">{job.templateName}</p>
                                <p className="text-[10px] text-gray-400 font-medium">ID: {job.id.slice(0, 8)}...</p>
                            </td>
                            <td className="px-8 py-5 text-xs font-bold text-gray-500">{job.timestamp}</td>
                            <td className="px-8 py-5">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {job.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                                        {job.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                        {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                                        <span className={`text-[10px] font-black uppercase tracking-wider ${
                                            job.status === 'completed' ? 'text-green-600' : 
                                            job.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                                        }`}>{job.status === 'processing' ? `Processing ${job.progress}%` : job.status}</span>
                                    </div>
                                    <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                        <div className={`h-full transition-all duration-500 ${
                                            job.status === 'completed' ? 'bg-green-500' : 
                                            job.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'
                                        }`} style={{ width: `${job.progress}%` }}></div>
                                    </div>
                                    {job.message && <p className="text-[9px] text-gray-400 font-medium truncate w-64 italic">{job.message}</p>}
                                </div>
                            </td>
                            <td className="px-8 py-5 text-right flex justify-end gap-2">
                                {job.status === 'completed' && job.pdfPath ? (
                                    <>
                                        <a 
                                            href={`/api/run-report/download?filePath=${encodeURIComponent(job.pdfPath)}`} 
                                            download 
                                            className="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-600 hover:text-white transition-all border border-green-100"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download PDF
                                        </a>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const response = await axios.delete('/api/run-report/delete-file', { data: { filePath: job.pdfPath } });
                                                    console.log(response.data.message);
                                                    alert("ลบไฟล์เรียบร้อยแล้ว");
                                                    window.location.reload();
                                                } catch (error: any) {
                                                    console.error("Delete failed:", error.response?.data || error);
                                                    alert("ลบไฟล์ไม่สำเร็จ: " + (error.response?.data?.error || "Unknown error"));
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all border border-red-100"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                        </button>
                                    </>
                                ) : (
                                    <button disabled className="inline-flex items-center gap-2 bg-gray-50 text-gray-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase opacity-50 border border-gray-100">
                                        <FileText className="w-3.5 h-3.5" /> Pending
                                    </button>
                                )}
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                                <Activity className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No background jobs found in the last 24 hours</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Background Config Modal */}
      <Modal 
        isOpen={isBackgroundModalOpen} 
        onClose={() => setIsBackgroundModalOpen(false)} 
        title={`Trigger Background Run: ${selectedTemplateForBg?.name}`}
        maxWidth="max-w-md"
      >
        <div className="p-4 space-y-6">
            <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-yellow-800 uppercase tracking-tight">Background Processing</p>
                    <p className="text-[10px] text-yellow-700 font-medium mt-1 leading-relaxed">
                        This job will run on the server and generate a consolidated PDF for <b>{selectedTemplateForBg?.hosts.length} hosts</b>. You can track the progress in the status section below.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Target Month</label>
                    <select 
                        value={month} 
                        onChange={e => setMonth(e.target.value)} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
                    >
                        {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Target Year</label>
                    <input 
                        type="number" 
                        value={year} 
                        onChange={e => setYear(e.target.value)} 
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner" 
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex gap-3">
                <button onClick={() => setIsBackgroundModalOpen(false)} className="flex-1 py-4 rounded-2xl font-black text-xs uppercase text-gray-500 hover:bg-gray-100 transition-all tracking-widest">Cancel</button>
                <button 
                    onClick={triggerBackgroundJob}
                    className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-slate-800 transition-all shadow-lg tracking-widest flex items-center justify-center gap-2"
                >
                    <Zap className="w-4 h-4 text-yellow-400" /> Start Job
                </button>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTemplateId ? "Edit Template" : "Add New Template"} maxWidth="max-w-4xl">
        <div className="space-y-6 p-4">
            <div className="flex gap-2 bg-gray-100/50 p-2 rounded-2xl border border-gray-100 shadow-inner">
                <button onClick={() => setStep(1)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${step === 1 ? 'bg-white shadow-md text-blue-600 border border-blue-50' : 'text-gray-400 hover:text-gray-900'}`}>1. Template Info</button>
                <button onClick={() => setStep(2)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${step === 2 ? 'bg-white shadow-md text-blue-600 border border-blue-50' : 'text-gray-400 hover:text-gray-900'}`}>2. Select Hosts</button>
                <button onClick={() => setStep(3)} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${step === 3 ? 'bg-white shadow-md text-blue-600 border border-blue-50' : 'text-gray-400 hover:text-gray-900'}`}>3. Chart Order</button>
            </div>
            
            <div className="min-h-[400px]">
                {step === 1 && (
                    <div className="space-y-6 max-w-xl mx-auto pt-6">
                        <FloatingInput label="Template Name (Internal)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                        <FloatingInput label="PDF Report Title (Main Heading)" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 pt-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input className="w-full pl-11 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search hosts or groups..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="h-[400px] overflow-y-auto pr-2 custom-scrollbar border border-gray-100 rounded-3xl bg-white p-2">
                            {(() => {
                            const sortedGroups = [...filteredGroups].sort((a, b) => a.hostgroup.toLowerCase().localeCompare(b.hostgroup.toLowerCase()));
                            if (sortedGroups.length === 0) {
                                return (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 italic">
                                        <Monitor className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-xs">No hosts found matching your search</p>
                                    </div>
                                );
                            }
                            return sortedGroups.map((g: any) => {
                                const groupHosts = g.hostnames || [];
                                const selectedInGroup = groupHosts.filter((h: any) => selectedHostnames.some(s => s.id === String(h.hostname_id)));
                                const isAllSelected = groupHosts.length > 0 && selectedInGroup.length === groupHosts.length;
                                const isPartialSelected = selectedInGroup.length > 0 && selectedInGroup.length < groupHosts.length;

                                return (
                                    <div key={g.hostgroup} className="mb-1">
                                        <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-xl transition-colors group/row">
                                            <button 
                                                onClick={() => toggleExpand(g.hostgroup)}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-400"
                                            >
                                                {expandedGroups.includes(g.hostgroup) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            </button>
                                            
                                            <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleGroup(g.hostgroup)}>
                                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isAllSelected ? 'bg-blue-600 border-blue-600' : isPartialSelected ? 'bg-blue-100 border-blue-400' : 'bg-white border-gray-300'}`}>
                                                    {isAllSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                                    {isPartialSelected && <div className="w-2 h-0.5 bg-blue-600 rounded-full" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black uppercase tracking-wider text-gray-800">{g.hostgroup}</span>
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{selectedInGroup.length} / {groupHosts.length} Selected</span>
                                                </div>
                                            </div>
                                        </div>

                                        {expandedGroups.includes(g.hostgroup) && (
                                            <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-50 pl-2">
                                                {groupHosts.map((h: any) => {
                                                    const isSelected = selectedHostnames.some(s => s.id === String(h.hostname_id));
                                                    return (
                                                        <div 
                                                            key={h.hostname_id}
                                                            onClick={() => toggleHostname({ id: String(h.hostname_id), hostname: h.hostname, group: g.hostgroup, mem: h.mem })}
                                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                                        >
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                                                                {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                                                            </div>
                                                            <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>{h.hostname}</span>
                                                            <span className="text-[9px] text-gray-300 font-medium ml-auto">{h.mem}GB</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                            })()}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="grid grid-cols-2 gap-8 pt-4">
                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 flex flex-col h-[400px]">
                            <p className="font-black text-[10px] text-gray-400 uppercase mb-4 px-1 tracking-widest flex items-center gap-2"><Layout className="w-3.5 h-3.5" /> Available Charts</p>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {availableCharts.map(r => (
                                    <button 
                                        key={r.id} 
                                        onClick={() => toggleReport(r.id)} 
                                        className="w-full flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-gray-100 text-[11px] font-black hover:border-blue-200 hover:shadow-md transition-all text-left group"
                                    >
                                        <PlusCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                        <span className="leading-tight text-gray-700">{r.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/30 flex flex-col h-[400px] shadow-inner">
                            <p className="font-black text-[10px] text-blue-600 uppercase mb-4 px-1 tracking-widest flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Selected Order</p>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {selectedCharts.map((r, i) => (
                                    <div key={r.id} className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-blue-200 shadow-sm animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-start gap-3 text-[11px] font-black text-gray-800">
                                            <GripVertical className="w-4 h-4 text-gray-300 mt-0.5" />
                                            <span className="leading-tight">{r.label}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => moveChart(r.id, 'up')} disabled={i === 0} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ArrowUp className="w-4 h-4" /></button>
                                            <button onClick={() => moveChart(r.id, 'down')} disabled={i === selectedCharts.length - 1} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ArrowDown className="w-4 h-4" /></button>
                                            <button onClick={() => toggleReport(r.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-1"><X className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {selectedCharts.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-center p-8">
                                        <p className="text-[10px] font-black text-gray-400 uppercase italic tracking-widest">No charts selected</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-8 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                <div className="flex gap-3">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">Back</button>}
                    {step < 3 ? (
                        <button onClick={() => setStep(step + 1)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Continue</button>
                    ) : (
                        <button 
                            onClick={handleSaveTemplate} 
                            disabled={!templateName.trim() || selectedHostnames.length === 0 || selectedCharts.length === 0} 
                            className="px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl"
                        >
                            Save Template
                        </button>
                    )}
                </div>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isGenerationModalOpen} onClose={() => setIsGenerationModalOpen(false)} title={`Generate: ${generatingTemplate?.name || ''}`} maxWidth="max-w-6xl">
          {generatingTemplate && (
              <div className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-5 space-y-6">
                          <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm h-full flex flex-col">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                                <Monitor className="w-4 h-4" /> Selected Hosts ({selectedHostnames.length})
                              </h4>
                              <div className="flex-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                                  {Object.entries(selectedHostnames.reduce((acc: any, h) => {
                                      if (!acc[h.group]) acc[h.group] = [];
                                      acc[h.group].push(h);
                                      return acc;
                                  }, {})).sort((a,b) => a[0].localeCompare(b[0])).map(([group, hosts]: [string, any]) => (
                                      <div key={group} className="space-y-2">
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full"></span> {group}
                                          </p>
                                          <div className="grid grid-cols-1 gap-1 pl-3">
                                            {hosts.map((h: any) => (
                                                <div key={h.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-colors">
                                                    {h.name}
                                                    <X className="w-3.5 h-3.5 cursor-pointer text-gray-300 hover:text-red-500 transition-colors" onClick={() => setSelectedHostnames(prev => prev.filter(p => p.id !== h.id))} />
                                                </div>
                                            ))}
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="lg:col-span-7 space-y-8">
                          <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm space-y-8">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Configurations
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                  <div className="space-y-4">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2"><Clock className="w-3 h-3" /> Daily Reports Range</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase mb-1 block ml-1">From</label>
                                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold shadow-inner" />
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase mb-1 block ml-1">To</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold shadow-inner" />
                                        </div>
                                    </div>
                                  </div>
                                  <div className="space-y-4">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2 flex items-center gap-2"><Calendar className="w-3 h-3" /> Monthly Period</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase mb-1 block ml-1">Month</label>
                                            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold shadow-inner">
                                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-gray-400 uppercase mb-1 block ml-1">Year</label>
                                            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold shadow-inner" />
                                        </div>
                                    </div>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm flex-1">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-6 flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Selected Chart Layout ({activeReports.filter(r => r.enabled).length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                  {activeReports.filter(r => r.enabled).map((r, i) => (
                                      <div key={r.id} className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 shadow-sm">
                                          <div className="text-[10px] font-black text-gray-700 flex items-center gap-3 truncate">
                                              <GripVertical className="w-4 h-4 text-blue-200" /> <span className="truncate">{r.label}</span>
                                          </div>
                                          <div className="flex gap-1">
                                              <button onClick={() => moveChart(r.id, 'up')} disabled={i === 0} className="p-1 hover:bg-white rounded-lg disabled:opacity-20 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                                              <button onClick={() => moveChart(r.id, 'down')} disabled={i === activeReports.filter(r => r.enabled).length - 1} className="p-1 hover:bg-white rounded-lg disabled:opacity-20 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="pt-10 border-t border-gray-100 flex justify-center gap-6">
                      <button 
                        onClick={async () => { setGeneratingTemplate(generatingTemplate); setIsGenerationModalOpen(false); setSelectedTemplateForBg(generatingTemplate); setIsBackgroundModalOpen(true); }} 
                        className="flex items-center gap-4 bg-slate-100 text-slate-700 px-10 py-5 rounded-3xl font-black text-base tracking-[0.1em] hover:bg-slate-200 transition-all uppercase"
                      >
                          <Zap className="w-5 h-5 text-yellow-500" /> Run in Background
                      </button>
                      <button 
                        onClick={async () => { await handlePreviewPDF(); }} 
                        className="flex items-center gap-4 bg-slate-900 text-white px-20 py-5 rounded-3xl font-black text-xl tracking-[0.2em] hover:bg-slate-800 transition-all uppercase shadow-2xl"
                      >
                          {isExporting ? <Loader2 className="w-7 h-7 animate-spin" /> : <FileText className="w-7 h-7" />}
                          {isExporting ? exportStatus : 'Generate PDF'}
                      </button>
                  </div>
              </div>
          )}
      </Modal>

      {renderCharts && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -1 }}>
          {hiddenChartsData.map((item, idx) => (
            <div key={`${item.hostId}-${item.reportId}-${idx}`} id={`host-item-${item.hostId}-${item.reportId}`} style={{ width: '800px', height: '400px' }}>
              <SarChart options={getChartOptions(item.metrics, item.report, item.hostname, item.hostMem, startDate, endDate, month, year, item.totalAvg)} />
            </div>
          ))}
        </div>
      )}

      {/* PDF Preview Modal */}
      <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="REPORT PREVIEW" maxWidth="max-w-6xl" onDownload={() => {
          const link = document.createElement('a'); link.href = pdfUrl!; link.download = `MFEC_SAR_REPORT_${Date.now()}.pdf`; link.click();
      }}>
          {pdfUrl && <iframe src={pdfUrl} className="w-full h-[80vh] rounded-3xl border border-gray-100 shadow-inner" title="PDF Viewer" />}
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Template" 
        message="Are you sure you want to delete this template? This action cannot be undone."
      />
    </div>
  );
};
export default ReportTemplatesPage;
