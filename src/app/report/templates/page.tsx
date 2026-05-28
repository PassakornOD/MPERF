'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Highcharts from 'highcharts';
import { Plus, FileText, Trash2, Edit2, Clock, X, Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Heading1, Server, BarChart3, Loader2, Calendar, Layout, GripVertical, Monitor, PlusCircle, Zap } from 'lucide-react';
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

const ReportTemplatesPage = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  console.log('Current user session:', user);
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<Template[]>({
    queryKey: ['report_templates'],
    queryFn: async () => {
      console.log('Fetching templates...');
      const res = await axios.get('/api/report-templates');
      console.log('Templates received:', res.data);
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
          console.error('Error parsing template config:', t.config, e);
          return null;
        }
      }).filter((t: any) => t !== null);
    },
    enabled: !!user
  });

  const saveTemplateMutation = useMutation({
    mutationFn: (data: any) => {
      console.log('Saving template:', data);
      return editingTemplateId 
        ? axios.put(`/api/report-templates/${editingTemplateId}`, data) 
        : axios.post('/api/report-templates', data);
    },
    onSuccess: () => {
      console.log('Template saved successfully, invalidating query...');
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
      setIsModalOpen(false);
      showToast(editingTemplateId ? "Template updated" : "Template created", 'success');
    },
    onError: (err: any) => {
      console.error('Failed to save template:', err);
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
  const [selectedAutomationGroups, setSelectedAutomationGroups] = useState<string[]>([]);
  const [selectedAutomationHosts, setSelectedAutomationHosts] = useState<Record<string, string[]>>({});

  const [templateName, setTemplateName] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHostnames, setSelectedHostnames] = useState<{ id: string; name: string; group: string }[]>([]);
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
                    chartsData.push({
                      hostId: host.id,
                      reportId: report.id,
                      hostname: host.name,
                      hostMem: host.mem,
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
    const groupHostnames = groupData?.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: groupName })) || [];
    if (isSelected) {
      setSelectedGroups(prev => prev.filter(g => g !== groupName));
      setSelectedHostnames(prev => prev.filter(h => h.group !== groupName));
    } else {
      setSelectedGroups(prev => [...prev, groupName]);
      setSelectedHostnames(prev => [...prev.filter(h => h.group !== groupName), ...groupHostnames]);
    }
  };

  const toggleHostname = (h: any) => {
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
            return [...prev, { id: String(h.hostname_id), name: h.hostname, group: groupName }];
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
      hosts: selectedHostnames, 
      charts: activeReports.filter(r => r.enabled) 
    };
    saveTemplateMutation.mutate({ name: templateName || 'Untitled', config });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-black text-gray-800">Report Templates</h2>
          <p className="text-gray-500 font-medium mt-1 text-xs">Organize and manage your report generation configurations.</p>
        </div>
        <button onClick={() => { setEditingTemplateId(null); setTemplateName(''); setReportTitle(''); setSelectedHostnames([]); setStep(1); setIsModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:bg-slate-800 shadow-sm">
          <Plus className="w-4 h-4" /> Add New Template
        </button>
      </div>

      <div className="grid gap-3">
        {isLoadingTemplates ? (
          <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
        ) : templates.length > 0 ? templates.map((template) => (
          <div key={template.id} className="grid grid-cols-[300px_1fr_auto] items-center bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:border-blue-100 transition-all group">
            
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-xl text-blue-600 transition-colors">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-bold text-gray-800 text-sm">{template.name}</h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  <Clock className="w-3 h-3" /> Updated: {template.lastUpdated}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 px-6">
                <p className="text-xs text-blue-600 font-bold capitalize flex items-center gap-1.5"><Heading1 className="w-3 h-3" /> Title: {template.reportTitle}</p>
                <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Server className="w-3 h-3" /> {template.hosts.length} Hosts</span>
                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><BarChart3 className="w-3 h-3" /> {template.charts.length} Charts</span>
                </div>
            </div>

            <div className="flex items-center gap-1">
                <button onClick={() => handleGenerateReport(template)} className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all" title="Generate Report"><FileText className="w-4 h-4" /></button>
                <button onClick={() => handleEditTemplate(template)} className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-all" title="Edit Template"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => handleDeleteTemplate(template.id)} className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all" title="Delete Template"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-bold text-sm italic">No templates found. Create your first one!</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTemplateId ? "Edit Template" : "Add New Template"} maxWidth="max-w-3xl">
        <div className="space-y-6 p-2">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setStep(1)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${step === 1 ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Details</button>
                <button onClick={() => setStep(2)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${step === 2 ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Select Hosts</button>
                <button onClick={() => setStep(3)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${step === 3 ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}>Chart Order</button>
            </div>
            
            {step === 1 && (
                <div className="space-y-4 pt-2">
                    <FloatingInput 
                        label="Template Name"
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)} 
                    />
                    <FloatingInput 
                        label="Report Heading"
                        value={reportTitle} 
                        onChange={(e) => setReportTitle(e.target.value)} 
                    />
                </div>
            )}

            {step === 2 ? (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-lg text-xs font-bold shadow-sm outline-none" placeholder="Search hosts..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="h-[250px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                        {(() => {
                        const sortedGroups = [...filteredGroups].sort((a, b) => a.hostgroup.toLowerCase().localeCompare(b.hostgroup.toLowerCase()));
                        return sortedGroups.map((g: any) => (
                        <div key={g.hostgroup} className="border border-gray-100 rounded-lg bg-white overflow-hidden">
                        <div 
                            className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${selectedGroups.includes(g.hostgroup) ? 'bg-blue-300 text-white' : 'hover:bg-gray-50'}`}
                            onClick={() => toggleGroup(g.hostgroup)}
                        >
                            <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); toggleExpand(g.hostgroup); }}>
                                    {expandedGroups.includes(g.hostgroup) ? <ChevronDown className={selectedGroups.includes(g.hostgroup) ? 'text-white' : 'text-blue-600'} /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                </button>
                                <span className={`text-[10px] font-black uppercase tracking-tight ${selectedGroups.includes(g.hostgroup) ? 'text-white' : 'text-gray-700'}`}>{g.hostgroup}</span>
                            </div>
                        </div>
                        {expandedGroups.includes(g.hostgroup) && (
                            <div className="p-1 space-y-0.5 bg-gray-50/50">
                                {g.hostnames.map((h: any) => (
                                    <button 
                                        key={h.hostname_id}
                                        onClick={(e) => { e.stopPropagation(); toggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }); }}
                                        className={`w-full flex items-center gap-3 p-2.5 ml-4 border-l border-gray-200 rounded-lg text-[10px] font-medium transition-all ${selectedHostnames.find(s => s.id === String(h.hostname_id)) ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    >
                                        {h.hostname}
                                    </button>
                                ))}
                            </div>
                        )}
                        </div>
                        ));
                        })()}

                    </div>
                </div>
            ) : step === 3 ? (
                <div className="grid grid-cols-2 gap-4 h-[400px]">
                    <div className="border border-gray-100 rounded-xl p-4 bg-gray-50/50 flex flex-col overflow-hidden">
                        <p className="font-bold text-[10px] text-gray-400 uppercase mb-3 px-1 tracking-widest">Available Charts</p>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {availableCharts.map(r => (
                                <button 
                                    key={r.id} 
                                    onClick={() => toggleReport(r.id)} 
                                    className="w-full flex items-start gap-2.5 p-3 bg-white rounded-xl border border-gray-100 text-[11px] font-bold hover:border-blue-200 hover:bg-blue-50/10 transition-all text-left shadow-sm group"
                                >
                                    <PlusCircle className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="leading-tight">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/20 flex flex-col overflow-hidden">
                        <p className="font-bold text-[10px] text-blue-600 uppercase mb-3 px-1 tracking-widest">Selected Order</p>
                        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                            {selectedCharts.map((r, i) => (
                                <div key={r.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100 shadow-sm animate-in slide-in-from-right-2 duration-200">
                                    <div className="flex items-start gap-2.5 text-[11px] font-bold text-gray-700">
                                        <GripVertical className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />
                                        <span className="leading-tight">{r.label}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 ml-2">
                                        <button onClick={() => moveChart(r.id, 'up')} disabled={i === 0} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ArrowUp className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => moveChart(r.id, 'down')} disabled={i === selectedCharts.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20 transition-colors"><ArrowDown className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => toggleReport(r.id)} className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors ml-1"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                            {selectedCharts.length === 0 && (
                                <div className="h-full flex items-center justify-center text-center p-4">
                                    <p className="text-[10px] font-black text-gray-400 uppercase italic">No charts selected</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="flex justify-between pt-6 mt-2 border-t border-gray-100">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 rounded-lg font-bold text-xs text-gray-500 hover:bg-gray-100">Cancel</button>
                <div className="flex gap-2">
                    {step > 1 && <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-lg font-bold text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">Back</button>}
                    {step < 3 ? <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-lg font-bold text-xs bg-blue-600 text-white hover:bg-blue-700">Next</button> : <button onClick={handleSaveTemplate} disabled={!templateName.trim() || selectedHostnames.length === 0 || selectedCharts.length === 0} className="px-6 py-2.5 rounded-lg font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50">Save Template</button>}
                </div>
            </div>
        </div>
      </Modal>

      <Modal isOpen={isGenerationModalOpen} onClose={() => setIsGenerationModalOpen(false)} title={`Generate: ${generatingTemplate?.name || ''}`} maxWidth="max-w-6xl">
          {generatingTemplate && (
              <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left Column: Selected Hosts Tree */}
                      <div className="lg:col-span-5 space-y-6">
                          <div className="border border-gray-100 rounded-3xl p-6 bg-white shadow-sm">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 flex items-center gap-2">
                                <Monitor className="w-3.5 h-3.5" /> Selected Hosts
                              </h4>
                              <div className="max-h-[500px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
                                  {Object.entries(selectedHostnames.reduce((acc: any, h) => {
                                      if (!acc[h.group]) acc[h.group] = [];
                                      acc[h.group].push(h);
                                      return acc;
                                  }, {})).map(([group, hosts]: [string, any]) => (
                                      <div key={group} className="space-y-1">
                                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">{group}</p>
                                          {hosts.map((h: any) => (
                                              <div key={h.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-[10px] font-bold text-gray-700 ml-2">
                                                  {h.name}
                                                  <X className="w-3 h-3 cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setSelectedHostnames(prev => prev.filter(p => p.id !== h.id))} />
                                              </div>
                                          ))}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      {/* Right Column: Configurations & Chart Layout */}
                      <div className="lg:col-span-7 space-y-6">
                          <div className="border border-gray-100 rounded-3xl p-6 bg-white shadow-sm space-y-6">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Configurations
                              </h4>
                              <div className="space-y-4">
                                  <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Daily Reports Range</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-[9px] font-black text-gray-400 uppercase">Monthly Period</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold">
                                            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                                        </select>
                                        <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs font-bold" />
                                    </div>
                                  </div>
                              </div>
                          </div>
                          
                          <div className="border border-gray-100 rounded-3xl p-6 bg-white shadow-sm">
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4 flex items-center gap-2">
                                <Layout className="w-3.5 h-3.5" /> Chart Layout
                              </h4>
                              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                  {activeReports.filter(r => r.enabled).map((r, i) => (
                                      <div key={r.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                          <div className="text-[11px] font-bold text-gray-700 flex items-center gap-2">
                                              <GripVertical className="w-3.5 h-3.5 text-gray-300" /> {r.label}
                                          </div>
                                          <div className="flex gap-1">
                                              <button onClick={() => moveChart(r.id, 'up')} disabled={i === 0} className="p-1 hover:bg-white rounded disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                              <button onClick={() => moveChart(r.id, 'down')} disabled={i === activeReports.filter(r => r.enabled).length - 1} className="p-1 hover:bg-white rounded disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex justify-center">
                      <button onClick={async () => { await handlePreviewPDF(); setIsGenerationModalOpen(false); }} className="flex items-center gap-4 bg-slate-900 text-white px-16 py-4 rounded-2xl font-black text-xl tracking-[0.2em] hover:bg-slate-800 transition-all uppercase">
                          {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
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
          {pdfUrl && <iframe src={pdfUrl} className="w-full h-[80vh] rounded-2xl border border-gray-100 shadow-inner" title="PDF Viewer" />}
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Template" 
        message="Are you sure you want to delete this template? This action cannot be undone."
      />

      {/* Server-Side Automation Section */}
      <div className="border border-gray-100 rounded-3xl p-8 bg-white shadow-sm space-y-6 mt-8">
          <h3 className="text-xl font-black text-gray-900 flex items-center gap-2"><Zap className="text-yellow-500" /> Server-Side Report Automation</h3>
          
          <div className="flex gap-4">
              <FloatingInput label="Month" value={month} onChange={e => setMonth(e.target.value)} type="number" />
              <FloatingInput label="Year" value={year} onChange={e => setYear(e.target.value)} type="number" />
          </div>

          <div className="space-y-4">
              <p className="text-xs font-bold text-gray-700 uppercase">Select Hostgroups & Hosts</p>
              <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {hostGroupsRaw?.map((g: any) => (
                    <div key={g.hostgroup} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-800 mb-2">
                            <input 
                                type="checkbox" 
                                checked={selectedAutomationGroups.includes(g.hostgroup)}
                                onChange={(e) => {
                                    if (e.target.checked) setSelectedAutomationGroups([...selectedAutomationGroups, g.hostgroup]);
                                    else setSelectedAutomationGroups(selectedAutomationGroups.filter(x => x !== g.hostgroup));
                                }}
                            />
                            {g.hostgroup}
                        </label>
                        <div className="pl-6 space-y-1">
                            {g.hostnames.map((h: any) => (
                                <label key={h.hostname_id} className="flex items-center gap-2 text-[10px] text-gray-600">
                                    <input 
                                        type="checkbox"
                                        checked={(selectedAutomationHosts[g.hostgroup] || []).includes(h.hostname)}
                                        onChange={(e) => {
                                            const groupHosts = selectedAutomationHosts[g.hostgroup] || [];
                                            setSelectedAutomationHosts({
                                                ...selectedAutomationHosts,
                                                [g.hostgroup]: e.target.checked ? [...groupHosts, h.hostname] : groupHosts.filter(x => x !== h.hostname)
                                            });
                                        }}
                                    />
                                    {h.hostname}
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
              </div>
          </div>

          <button 
              onClick={async () => {
                  const filterString = selectedAutomationGroups.map(g => `${g}:${(selectedAutomationHosts[g] || []).join(',')}`).join('|');
                  alert('Triggering background report...');
                  await axios.post('/api/run-report', { month, year, filters: filterString });
              }} 
              className="w-full px-6 py-4 bg-slate-900 text-white font-bold rounded-xl text-xs uppercase hover:bg-slate-800 shadow-sm"
          >
              Trigger Background Run
          </button>
      </div>
    </div>
  );
};
export default ReportTemplatesPage;
