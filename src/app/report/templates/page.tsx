'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Highcharts from 'highcharts';
import { Plus, FileText, Trash2, Edit2, Clock, X, Search, ChevronDown, ChevronRight, ArrowUp, ArrowDown, Heading1, Server, BarChart3, Loader2, Calendar, Layout, GripVertical, Monitor, PlusCircle, Zap, Activity, CheckCircle, Download, AlertCircle, MoreVertical } from 'lucide-react';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ReportPayload } from '@/types/report';
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
                        ownerName: t.owner_name,
                        hosts: config.hosts || config.selectedHostnames || [],
                        charts: config.charts || config.activeReports || [],
                        lastUpdated: new Date(t.updated_at || t.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })
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
    const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
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
    const [isExporting, setIsFetchingPDF] = useState(false);
    const [exportStatus, setExportStatus] = useState('');
    const [renderCharts, setRenderCharts] = useState(false);
    const [hiddenChartsData, setHiddenChartsData] = useState<any[]>([]);

    const handlePreviewPDF = async () => {
        if (isExporting || previewSelectedHosts.length === 0) return;
        setIsFetchingPDF(true); setExportStatus('Preparing report...');
        const selectedReportsList = previewActiveReports.filter(r => r.enabled);

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
                    previewSelectedHosts.reduce((acc: any, host) => {
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

            <div className="space-y-4">
                {isLoadingTemplates ? (
                    <div className="py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" /></div>
                ) : templates.length > 0 ? templates.map((template) => (
                    <div key={template.id} className="flex items-center gap-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                        {/* Col 1 */}
                        <div className="flex items-center gap-4 min-w-[250px]">
                            <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h4 className="font-black text-gray-900 text-sm truncate">{template.name}</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{template.lastUpdated}</p>
                                    {user?.role === 'admin' && template.ownerName && (
                                        <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                                            Owner: {template.ownerName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Col 2 */}
                        <div className="flex flex-col gap-2 flex-1">
                            <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 w-fit">
                                <Heading1 className="w-5 h-5" /> {template.reportTitle || 'No Title'}
                            </span>
                            <div className="flex gap-4">
                                <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                    <Server className="w-4 h-4" /> {template.hosts.length} Hosts
                                </span>
                                <span className="bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" /> {template.charts.length} Charts
                                </span>
                            </div>
                        </div>

                        {/* Col 3 */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleGenerateReport(template)}
                                className="flex items-center gap-2 bg-blue-50 text-blue-600 border border-blue-100 px-5 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all"
                            >
                                <FileText className="w-4 h-4" /> Preview
                            </button>
                            <button
                                onClick={() => { setSelectedTemplateForBg(template); setIsBackgroundModalOpen(true); }}
                                className="flex items-center gap-2 bg-slate-100 text-slate-600 border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-slate-800 hover:text-white transition-all"
                            >
                                <Zap className="w-4 h-4 text-yellow-500" /> Start Job
                            </button>
                        </div>

                        {/* Col 4: Dropdown */}
                        <div className="relative">
                            <button onClick={() => setActiveDropdown(activeDropdown === template.id ? null : template.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><MoreVertical className="w-5 h-5 text-gray-400" /></button>
                            {activeDropdown === template.id && (
                                <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-2xl border border-gray-100 shadow-xl z-10 overflow-hidden">
                                    <button onClick={() => { handleEditTemplate(template); setActiveDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all">
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                    <button onClick={() => { handleDeleteTemplate(template.id); setActiveDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-3 text-[10px] font-bold text-red-600 hover:bg-red-50 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-20 text-gray-400 font-black uppercase tracking-widest text-xs">No templates found</div>
                )}
            </div>

            {/* Background Jobs Section */}
            <div className="pt-10 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-gray-900 flex items-center gap-3 uppercase italic tracking-tight underline decoration-yellow-400 underline-offset-8">
                        <Activity className="text-yellow-500" /> Job Status
                    </h3>
                    <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{backgroundJobs.length} Recent Jobs</span>
                </div>

                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                                <th className="px-8 py-5">Request Time</th>
                                <th className="px-8 py-5">Template Name</th>
                                <th className="px-8 py-5">Status / Progress</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {backgroundJobs.length > 0 ? (
                                [...backgroundJobs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((job) => (
                                    <tr key={job.id} className="hover:bg-gray-50/30 transition-colors">
                                        <td className="px-8 py-5 text-xs font-bold text-gray-500">{job.timestamp}</td>
                                        <td className="px-8 py-5">
                                            <p className="font-black text-gray-900 text-sm leading-none mb-1">{job.templateName}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">ID: {job.id.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex items-center gap-2">
                                                    {job.status === 'processing' && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />}
                                                    {job.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                                                    {job.status === 'failed' && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${job.status === 'completed' ? 'text-green-600' :
                                                        job.status === 'failed' ? 'text-red-600' : 'text-blue-600'
                                                        }`}>{job.status === 'processing' ? `Processing ${job.progress}%` : job.status}</span>
                                                </div>
                                                <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                                    <div className={`h-full transition-all duration-500 ${job.status === 'completed' ? 'bg-green-500' :
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
                                                                showToast("ลบไฟล์เรียบร้อยแล้ว", 'success');
                                                                queryClient.invalidateQueries({ queryKey: ['background_jobs_status'] });
                                                            } catch (error: any) {
                                                                console.error("Delete failed:", error.response?.data || error);
                                                                showToast("ลบไฟล์ไม่สำเร็จ: " + (error.response?.data?.error || "Unknown error"), 'error');
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
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <Activity className="w-10 h-10 text-gray-100 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">No jobs found in the last 24 hours</p>
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
                title={`Trigger Run: ${selectedTemplateForBg?.name}`}
                maxWidth="max-w-md"
            >
                <div className="p-4 space-y-6">
                    <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex gap-4 items-start">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-yellow-800 uppercase tracking-tight">Processing</p>
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
                            <HostSelector
                                groups={filteredGroups}
                                selectedHosts={selectedHostnames}
                                expandedGroups={expandedGroups}
                                searchTerm={searchTerm}
                                onSearchTermChange={setSearchTerm}
                                onToggleExpand={toggleExpand}
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

                    <div className="flex justify-between pt-8 border-t border-gray-100">
                        <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition-all">Cancel</button>
                        <div className="flex gap-3">
                            {step > 1 && <button onClick={() => setStep(step - 1)} className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">Back</button>}
                            {step < 3 ? (
                                <button onClick={() => setStep(step + 1)} className="px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all">Continue</button>
                            ) : (
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={!templateName.trim() || selectedHostnames.length === 0 || activeReports.filter(r => r.enabled).length === 0}
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
                                <HostSelector
                                    groups={filteredGroups}
                                    selectedHosts={previewSelectedHosts}
                                    expandedGroups={expandedGroups}
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    onToggleExpand={toggleExpand}
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

                            <div className="lg:col-span-7 space-y-8">
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

                        <div className="pt-10 border-t border-gray-100 flex justify-center gap-6">
                            <button
                                onClick={async () => { setGeneratingTemplate(generatingTemplate); setIsGenerationModalOpen(false); setSelectedTemplateForBg(generatingTemplate); setIsBackgroundModalOpen(true); }}
                                className="flex items-center gap-4 bg-slate-100 text-slate-700 px-10 py-5 rounded-3xl font-black text-base tracking-[0.1em] hover:bg-slate-200 transition-all uppercase"
                            >
                                <Zap className="w-5 h-5 text-yellow-500" /> Start Job
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

            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} title="HOST LIMIT REACHED">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-amber-100 shadow-sm">
                        <AlertCircle className="w-10 h-10 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-4 uppercase tracking-tight italic">Maximum 50 Hosts</h3>
                    <p className="text-gray-600 font-medium leading-relaxed mb-8">{limitMessage}</p>
                    <button
                        onClick={() => setIsLimitModalOpen(false)}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm tracking-widest transition-all shadow-lg active:scale-[0.98] uppercase"
                    >
                        Understand
                    </button>
                </div>
            </Modal>
        </div>
    );
};
export default ReportTemplatesPage;
