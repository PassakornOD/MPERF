'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Plus, FileText, Trash2, Edit2, Clock, X, Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Heading1, Server, BarChart3, Loader2, Calendar, Layout, GripVertical, Monitor, PlusCircle, Zap, Activity, CheckCircle, Download, AlertCircle, MoreVertical, Layers } from 'lucide-react';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import SarChart from '@/components/charts/SarChart';
import { getChartOptions } from '@/components/charts/chartUtils';
import { useToast } from '@/components/common/Toast';
import { useSession } from 'next-auth/react';
import FloatingInput from '@/components/common/FloatingInput';
import HostSelector from '@/components/report/HostSelector';
import ReportConfiguration from '@/components/report/ReportConfiguration';
import ChartLayoutOrder from '@/components/report/ChartLayoutOrder';

interface Template {
    id: number;
    name: string;
    reportTitle: string;
    lastUpdated: string;
    ownerName?: string;
    hosts: { id: string; name: string; group: string; mem: number }[];
    charts: { id: string; label: string; enabled: boolean }[];
}

interface BackgroundJob {
    id: string;
    templateName: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'stale';
    progress: number;
    message: string;
    timestamp: string;
    pdfPath?: string;
}

const BatchReportPage = () => {
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
                        ownerName: t.owner_name,
                        hosts: config.hosts || config.selectedHostnames || [],
                        charts: config.charts || config.activeReports || [],
                        lastUpdated: new Date(t.updated_at || t.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })
                    };
                } catch (e) { return null; }
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
            showToast("Process report generation started", 'success');
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
    const [isDeleteJobConfirmOpen, setIsDeleteJobConfirmOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
    const [jobToDelete, setJobToDelete] = useState<string | null>(null);
    const [generatingTemplate, setGeneratingTemplate] = useState<Template | null>(null);
    const [previewSelectedHosts, setPreviewSelectedHosts] = useState<{ id: string; name: string; group: string; mem?: number }[]>([]);
    const [previewActiveReports, setPreviewActiveReports] = useState<any[]>([]);
    const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');

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
    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

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
    const [renderCharts, setRenderCharts] = useState(false);
    const [hiddenChartsData, setHiddenChartsData] = useState<any[]>([]);

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
    const handleExpandAll = () => {
        if (hostGroupsRaw) {
            setSearchTerm('');
            setExpandedGroups(hostGroupsRaw.map((g: any) => g.hostgroup));
            setSelectedGroups(hostGroupsRaw.map((g: any) => g.hostgroup));
            setSelectedHostnames(hostGroupsRaw.flatMap((g: any) => g.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }))));
            // Update preview states if the generation modal is open
            setPreviewSelectedHosts(hostGroupsRaw.flatMap((g: any) => g.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }))));
        }
    };
    const handleCollapseAll = () => {
        setExpandedGroups([]);
        setSelectedGroups([]);
        setSelectedHostnames([]);
        setPreviewSelectedHosts([]);
    };

    const toggleGroup = (groupName: string) => {
        const isSelected = selectedGroups.includes(groupName);
        const groupData = hostGroupsRaw?.find((g: any) => g.hostgroup === groupName);
        const groupHostnames = groupData?.hostnames.map((h: any) => {
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
        let groupName = h.group;
        const hostId = String(h.id || h.hostname_id);
        
        if (!groupName && hostGroupsRaw) {
            const foundGroup = hostGroupsRaw.find((g: any) => g.hostnames.some((hn: any) => String(hn.hostname_id) === hostId));
            if (foundGroup) groupName = foundGroup.hostgroup;
        }

        setSelectedHostnames(prev => {
            const exists = prev.find(p => p.id === hostId);
            if (exists) {
                return prev.filter(p => p.id !== hostId);
            } else {
                return [...prev, { id: hostId, name: h.name || h.hostname, group: groupName, mem: h.mem }];
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
        setPreviewSelectedHosts(template.hosts);
        setPreviewActiveReports(activeReports.map(r => ({ ...r, enabled: template.charts.some((c: any) => c.id === r.id) })));
        setSelectedGroups(Array.from(new Set(template.hosts.map(h => h.group))));
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
        <div className="max-w-7xl mx-auto space-y-10 animate-ease-in px-4 sm:px-6">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-card p-8 rounded-[2rem] border border-border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700"><FileText size={120} /></div>
                <div className="relative z-10 space-y-2">
                    <h2 className="text-2xl  text-foreground capitalize tracking-tight leading-none">Batch Processing</h2>
                    <p className="text-sm font-medium text-muted-foreground tracking-tight">Deploy pre-configured reporting cycles for global infrastructure visibility</p>
                </div>
                <button onClick={() => { setEditingTemplateId(null); setTemplateName(''); setReportTitle(''); setSelectedHostnames([]); setStep(1); setIsModalOpen(true); }} className="relative z-10 flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-3 rounded-xl  text-xs capitalize  transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 group">
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Create Template
                </button>
            </header>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <Layers className="w-4 h-4" />
                        </div>
                        <h3 className="text-sm  text-foreground capitalize ">Saved Configurations</h3>
                    </div>
                    <span className="bg-slate-100 text-muted-foreground px-3 py-1 rounded-xl text-[9px]  capitalize  border border-slate-50">{templates.length} Units</span>
                </div>
                {isLoadingTemplates ? (
                    <div className="py-32 text-center bg-card rounded-[2rem] border border-border shadow-sm">
                        <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 opacity-20" />
                        <p className="text-xs  text-slate-300 capitalize  mt-8">Synchronizing blueprints...</p>
                    </div>
                ) : templates.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {templates.map((template) => (
                            <div key={template.id} className="flex flex-col lg:flex-row lg:items-center gap-6 bg-card p-6 rounded-xl border border-border shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] hover:border-blue-200 transition-all duration-500 group">
                                {/* Col 1 */}
                                <div className="flex items-center gap-5 min-w-[240px]">
                                    <div className="bg-background p-4 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-inner">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className=" text-foreground text-sm capitalize tracking-tight leading-tight">{template.name}</h4>
                                            <span className="bg-slate-100 text-muted-foreground text-[8px]  capitalize px-2 py-0.5 rounded-xl border border-slate-50 ">#{template.id}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-300" />
                                            <p className="text-xs text-muted-foreground  capitalize  italic">{template.lastUpdated}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div className="flex flex-col gap-2 flex-1">
                                    <div className="flex items-center gap-2 text-blue-700 bg-blue-50/30 px-4 py-1.5 rounded-xl border border-blue-50/50 w-fit shadow-inner">
                                        <Heading1 className="w-3.5 h-3.5 opacity-50" />
                                        <span className="text-xs  capitalize tracking-tight truncate max-w-[300px]">{template.reportTitle || 'NO_HEADING_DEFINED'}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        <span className="bg-card border border-border text-muted-foreground px-4 py-1 rounded-xl text-[9px]  capitalize  flex items-center gap-2 shadow-sm">
                                            <Monitor className="w-3.5 h-3.5 text-blue-500 opacity-40" /> {template.hosts.length} NODES
                                        </span>
                                        <span className="bg-card border border-border text-muted-foreground px-4 py-1 rounded-xl text-[9px]  capitalize  flex items-center gap-2 shadow-sm">
                                            <BarChart3 className="w-3.5 h-3.5 text-emerald-500 opacity-40" /> {template.charts.length} DIMENSIONS
                                        </span>
                                    </div>
                                </div>

                                {/* Col 3 */}
                                <div className="flex flex-wrap items-center gap-3 shrink-0">
                                    <button
                                        onClick={() => handleGenerateReport(template)}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-card text-blue-600 border border-blue-100 px-6 py-2.5 rounded-xl text-xs  capitalize  hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                                    >
                                        <FileText className="w-4 h-4" /> Preview
                                    </button>
                                    <button
                                        onClick={() => { setSelectedTemplateForBg(template); setIsBackgroundModalOpen(true); }}
                                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs  capitalize  hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 group"
                                    >
                                        <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-125 transition-transform" /> Execute
                                    </button>
                                    <div className="relative">
                                        <button onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)} className={`p-2.5 rounded-xl transition-all border ${activeDropdown === template.id ? 'bg-slate-100 border-border text-foreground' : 'bg-card border-border text-slate-300 hover:text-slate-600 shadow-sm'}`}><MoreVertical className="w-4.5 h-4.5" /></button>
                                        {activeDropdown === template.id && (
                                            <div className="absolute right-0 top-full mt-3 w-40 bg-card rounded-xl border border-border shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] z-[60] overflow-hidden p-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <button onClick={() => { handleEditTemplate(template); setActiveDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs  capitalize  text-slate-600 hover:bg-background hover:text-blue-600 rounded-xl transition-all">
                                                    <Edit2 className="w-3.5 h-3.5" /> Modify
                                                </button>
                                                <button onClick={() => { handleDeleteTemplate(template.id); setActiveDropdown(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs  capitalize  text-red-500 hover:bg-red-50 rounded-xl transition-all border-t border-slate-50">
                                                    <Trash2 className="w-3.5 h-3.5" /> Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-card rounded-[3rem] border border-border shadow-sm">
                        <FileText className="w-20 h-20 text-slate-50 mx-auto mb-6" />
                        <p className="text-xs  text-slate-300 capitalize ">No architectural blueprints detected</p>
                    </div>
                )}
            </div>

            {/* Background Jobs Section */}
            <div className="pt-8 space-y-6">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-200">
                            <Activity size={16} />
                        </div>
                        <h3 className="text-sm  text-foreground capitalize  text-center">Batch Processing</h3>
                    </div>
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-[9px]  capitalize  shadow-lg shadow-blue-500/20">{backgroundJobs.length} Monitor Streams</span>
                </div>

                <div className="bg-card rounded-[2rem] border border-border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 text-[9px]  text-muted-foreground capitalize  border-b border-border">
                                    <th className="px-8 py-5">Emission Time</th>
                                    <th className="px-8 py-5">Process Designation</th>
                                    <th className="px-8 py-5">Operational State</th>
                                    <th className="px-8 py-5 text-right whitespace-nowrap">Control Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {backgroundJobs.length > 0 ? (
                                    [...backgroundJobs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((job) => (
                                        <tr key={job.id} className="hover:bg-blue-50/30 transition-all duration-300 group">
                                            <td className="px-8 py-5 text-xs  text-muted-foreground capitalize tracking-tighter tabular-nums">{job.timestamp}</td>
                                            <td className="px-8 py-5">
                                                <p className=" text-foreground text-xs capitalize tracking-tight leading-tight group-hover:text-blue-700 transition-colors">{job.templateName}</p>
                                                <p className="text-[9px] text-slate-300  capitalize  mt-0.5">Stream: {job.id.slice(0, 8)}</p>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-2 min-w-[140px]">
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${job.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                                                (job.status === 'failed' || job.status === 'stale') ? 'bg-red-500' : 'bg-blue-500 animate-pulse'
                                                                }`} />
                                                            <span className={`text-[9px]  capitalize  ${job.status === 'completed' ? 'text-emerald-600' :
                                                                (job.status === 'failed' || job.status === 'stale') ? 'text-red-600' : 'text-blue-600'
                                                                }`}>{job.status}</span>
                                                        </div>
                                                        <span className="text-xs  text-muted-foreground tabular-nums">{job.progress}%</span>
                                                    </div>
                                                    <div className="progress-bar border border-slate-50 shadow-inner">
                                                        <div className={`progress-value ${job.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                                            job.status === 'failed' ? 'bg-red-500' : 'bg-blue-600'
                                                            }`} style={{ width: `${job.progress}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                    {job.status === 'completed' && job.pdfPath ? (
                                                        <>
                                                            <a
                                                                href={`/api/run-report/download?filePath=${encodeURIComponent(job.pdfPath)}`}
                                                                download
                                                                className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px]  capitalize  hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                                                            >
                                                                <Download className="w-3.5 h-3.5" /> Export PDF
                                                            </a>
                                                            <button
                                                                onClick={() => {
                                                                    setJobToDelete(job.id);
                                                                    setIsDeleteJobConfirmOpen(true);
                                                                }}
                                                                className="p-2.5 bg-card text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-border hover:border-red-100 shadow-sm"
                                                                title="Delete Stream Data"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (job.status === 'failed' || job.status === 'stale') ? (
                                                        <>
                                                            <button
                                                                onClick={async () => {
                                                                    try {
                                                                        await axios.post('/api/run-report/retry', { jobId: job.id });
                                                                        showToast("Re-emission sequence started", 'success');
                                                                        queryClient.invalidateQueries({ queryKey: ['background_jobs_status'] });
                                                                    } catch (error: any) {
                                                                        showToast("Failed to re-trigger job", 'error');
                                                                    }
                                                                }}
                                                                className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[9px]  capitalize  hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-sm"
                                                            >
                                                                <Zap className="w-3.5 h-3.5" /> Re-trigger
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setJobToDelete(job.id);
                                                                    setIsDeleteJobConfirmOpen(true);
                                                                }}
                                                                className="p-2.5 bg-card text-slate-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all border border-border hover:border-red-100 shadow-sm"
                                                                title="Delete Stream Data"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="px-4 py-2 bg-background text-muted-foreground rounded-xl text-[9px]  capitalize  border border-border flex items-center gap-2 italic opacity-60">
                                                            <Clock className="w-3.5 h-3.5" /> Processing...
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-16 text-center">
                                            <Activity className="w-12 h-12 text-slate-50 mx-auto mb-4" />
                                            <p className="text-xs  text-slate-200 capitalize ">Operational streams are offline</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Background Config Modal */}
            <Modal
                isOpen={isBackgroundModalOpen}
                onClose={() => setIsBackgroundModalOpen(false)}
                title={`Initiate Background Cycle: ${selectedTemplateForBg?.name}`}
                maxWidth="max-w-md"
            >
                <div className="p-4 space-y-8 animate-ease-in">
                    <div className="bg-blue-50/50 border border-blue-100/50 p-6 rounded-[2rem] flex gap-5 items-start shadow-inner">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                            <Zap className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs  text-blue-900 capitalize  leading-none mb-2">Process Overview</p>
                            <p className="text-xs text-blue-700/70 font-bold leading-relaxed">
                                This engine will execute a consolidated reporting cycle for <span className="text-blue-900  underline underline-offset-4">{selectedTemplateForBg?.hosts.length} infrastructure nodes</span>. Status updates will emit to the monitoring stream.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px]  text-muted-foreground capitalize  ml-2">Target Dimension</label>
                            <div className="relative group">
                                <select
                                    value={month}
                                    onChange={e => setMonth(e.target.value)}
                                    className="w-full bg-background/50 border border-border rounded-xl p-4 text-xs  capitalize tracking-tight outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner appearance-none text-center cursor-pointer"
                                >
                                    {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px]  text-muted-foreground capitalize  ml-2">Fiscal Cycle</label>
                            <input
                                type="number"
                                value={year}
                                onChange={e => setYear(e.target.value)}
                                className="w-full bg-background/50 border border-border rounded-xl p-4 text-xs  outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 transition-all shadow-inner text-center"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex gap-4">
                        <button onClick={() => setIsBackgroundModalOpen(false)} className="flex-1 py-4 rounded-xl  text-xs capitalize text-slate-300 hover:text-foreground transition-all  border border-transparent hover:border-border">Cancel</button>
                        <button
                            onClick={triggerBackgroundJob}
                            className="flex-1 bg-slate-900 text-white py-4 rounded-xl  text-xs capitalize hover:bg-black transition-all shadow-xl shadow-slate-200  flex items-center justify-center gap-3 group active:scale-95"
                        >
                            <Zap className="w-4 h-4 text-yellow-400 group-hover:scale-125 transition-transform duration-500" /> Execute
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTemplateId ? "Modify Template" : "CreateNew Template"} maxWidth="max-w-4xl">
                <div className="space-y-8 p-4">
                    <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-[1.5rem] border border-border/50 inner-shadow">
                        {[
                            { id: 1, label: "Core Identity" },
                            { id: 2, label: "Asset Scope" },
                            { id: 3, label: "Metric Sequence" }
                        ].map(s => (
                            <button
                                key={s.id}
                                onClick={() => setStep(s.id)}
                                className={`flex-1 py-3 text-xs  capitalize  rounded-xl transition-all duration-500 ${step === s.id ? 'bg-card shadow-lg shadow-slate-200 text-blue-600 border border-white' : 'text-muted-foreground hover:text-slate-600'}`}
                            >
                                <span className="opacity-30 mr-1.5">{s.id}.</span> {s.label}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[450px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {step === 1 && (
                            <div className="space-y-10 max-w-xl mx-auto pt-10">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 text-blue-600 px-1">
                                        <Heading1 className="w-5 h-5 opacity-40" />
                                        <h4 className="text-xs  capitalize ">Identification Meta</h4>
                                    </div>
                                    <FloatingInput label="Template Designation (Internal)" value={templateName} onChange={(e) => setTemplateName(e.target.value)} />
                                    <FloatingInput label="Official Report Title (Main Heading)" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} />
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <HostSelector
                                groups={filteredGroups}
                                selectedHosts={selectedHostnames}
                                expandedGroups={expandedGroups}
                                searchTerm={searchTerm}
                                onSearchTermChange={setSearchTerm}
                                onToggleExpand={toggleExpand}
                                onExpandAll={handleExpandAll}
                                onCollapseAll={handleCollapseAll}
                                onToggleGroup={toggleGroup}
                                onToggleHostname={toggleHostname}
                                selectedGroups={selectedGroups}
                            />
                        )}

                        {step === 3 && (
                            <ChartLayoutOrder
                                availableCharts={activeReports.filter(r => !r.enabled)}
                                selectedCharts={activeReports.filter(r => r.enabled)}
                                onToggleReport={toggleReport}
                                onMoveChart={moveChart}
                            />
                        )}
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-border">
                        <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl  text-xs capitalize  text-slate-300 hover:text-foreground transition-all border border-transparent hover:border-border">Abort</button>
                        <div className="flex gap-3">
                            {step > 1 && <button onClick={() => setStep(step - 1)} className="px-8 py-3 rounded-xl  text-xs capitalize  bg-background text-muted-foreground hover:bg-slate-100 border border-border transition-all shadow-sm">Previous</button>}
                            {step < 3 ? (
                                <button onClick={() => setStep(step + 1)} className="px-12 py-3 rounded-xl  text-xs capitalize  bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all flex items-center gap-2 group">Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
                            ) : (
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={!templateName.trim() || selectedHostnames.length === 0 || activeReports.filter(r => r.enabled).length === 0}
                                    className="px-12 py-3 rounded-xl  text-xs capitalize  bg-slate-900 text-white hover:bg-black disabled:opacity-20 transition-all shadow-xl shadow-slate-200 flex items-center gap-3 group"
                                >
                                    Save <CheckCircle className="w-4.5 h-4.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isGenerationModalOpen} onClose={() => setIsGenerationModalOpen(false)} title={`Execute Batch: ${generatingTemplate?.name || ''}`} maxWidth="max-w-6xl">
                {generatingTemplate && (
                    <div className="p-10 space-y-12 animate-ease-in">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
                            <div className="lg:col-span-5 h-full">
                                <HostSelector
                                    groups={filteredGroups}
                                    selectedHosts={previewSelectedHosts}
                                    expandedGroups={expandedGroups}
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    onToggleExpand={toggleExpand}
                                    onExpandAll={handleExpandAll}
                                    onCollapseAll={handleCollapseAll}
                                    onToggleGroup={(groupName) => {
                                        const isSelected = selectedGroups.includes(groupName);
                                        const groupData = hostGroupsRaw?.find((g: any) => g.hostgroup === groupName);
                                        const groupHostnames = groupData?.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: groupName, mem: h.mem })) || [];

                                        if (isSelected) {
                                            setSelectedGroups(prev => prev.filter(g => g !== groupName));
                                            setPreviewSelectedHosts(prev => prev.filter(h => h.group !== groupName));
                                        } else {
                                            setSelectedGroups(prev => [...prev, groupName]);
                                            setPreviewSelectedHosts(prev => [...prev.filter(h => h.group !== groupName), ...groupHostnames]);
                                        }
                                    }}
                                    onToggleHostname={(h) => {
                                        setPreviewSelectedHosts(prev => {
                                            const exists = prev.find(p => p.id === h.id);
                                            if (exists) return prev.filter(p => p.id !== h.id);
                                            return [...prev, h];
                                        });
                                    }}
                                    selectedGroups={selectedGroups}
                                />
                            </div>

                            <div className="lg:col-span-7 space-y-10">
                                <div className="bg-background/50 p-1 rounded-[2rem] border border-border shadow-inner">
                                    <ReportConfiguration
                                        reportTitle={generatingTemplate?.reportTitle || reportTitle}
                                        onReportTitleChange={setReportTitle}
                                        startDate={startDate}
                                        onStartDateChange={setStartDate}
                                        endDate={endDate}
                                        onEndDateChange={setEndDate}
                                        month={month}
                                        onMonthChange={setMonth}
                                        year={year}
                                        onYearChange={setYear}
                                    />
                                </div>

                                <ChartLayoutOrder
                                    availableCharts={[]}
                                    selectedCharts={previewActiveReports.filter(r => r.enabled)}
                                    onToggleReport={(id) => {
                                        setPreviewActiveReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
                                    }}
                                    onMoveChart={(id, direction) => {
                                        const selectedInOrder = previewActiveReports.filter(r => r.enabled);
                                        const index = selectedInOrder.findIndex(r => r.id === id);
                                        if ((direction === 'up' && index > 0) || (direction === 'down' && index < selectedInOrder.length - 1)) {
                                            const newReports = [...previewActiveReports];
                                            const swapIdx = direction === 'up' ? index - 1 : index + 1;
                                            const targetId = selectedInOrder[swapIdx].id;
                                            const currentIndex = newReports.findIndex(r => r.id === id);
                                            const targetIndex = newReports.findIndex(r => r.id === targetId);
                                            [newReports[currentIndex], newReports[targetIndex]] = [newReports[targetIndex], newReports[currentIndex]];
                                            setPreviewActiveReports(newReports);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="pt-8 border-t border-border flex justify-center gap-8">
                            <button
                                onClick={async () => { setGeneratingTemplate(generatingTemplate); setIsGenerationModalOpen(false); setSelectedTemplateForBg(generatingTemplate); setIsBackgroundModalOpen(true); }}
                                className="flex items-center gap-3 bg-slate-900 text-white px-16 py-4 rounded-xl  text-[11px] capitalize  hover:bg-black transition-all shadow-2xl shadow-slate-200 group active:scale-95"
                            >
                                <Zap className="w-5 h-5 text-yellow-400 group-hover:scale-125 transition-transform" /> Execute
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
                {pdfUrl && <iframe src={pdfUrl} className="w-full h-[80vh] rounded-xl border border-border shadow-inner" title="PDF Viewer" />}
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete Template"
                message="Are you sure you want to delete this template? This action cannot be undone."
            />

            <ConfirmModal
                isOpen={isDeleteJobConfirmOpen}
                onClose={() => setIsDeleteJobConfirmOpen(false)}
                onConfirm={async () => {
                    if (jobToDelete) {
                        try {
                            await axios.delete(`/api/run-report/status/${jobToDelete}`);
                            showToast("Job deleted successfully", 'success');
                            queryClient.invalidateQueries({ queryKey: ['background_jobs_status'] });
                        } catch (error: any) {
                            showToast("Failed to delete job", 'error');
                        } finally {
                            setJobToDelete(null);
                            setIsDeleteJobConfirmOpen(false);
                        }
                    }
                }}
                title="Delete Job"
                message="Are you sure you want to delete this job? This action cannot be undone."
            />

            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} title="HOST LIMIT REACHED">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-100 shadow-sm">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl  text-foreground mb-4 capitalize tracking-tight italic">Maximum 50 Hosts</h3>
                    <p className="text-slate-600 font-medium leading-relaxed mb-8">{limitMessage}</p>
                    <button
                        onClick={() => setIsLimitModalOpen(false)}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl  text-sm  transition-all shadow-lg active:scale-[0.98] capitalize"
                    >
                        Understand
                    </button>
                </div>
            </Modal>
        </div>
    );
};
export default BatchReportPage;
