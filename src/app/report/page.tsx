'use client';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Modal from '@/components/common/Modal';
import dynamic from 'next/dynamic';
import {
    Loader2,
    Monitor,
    Layers,
    FileText,
    CheckCircle2,
    AlertCircle,
    X,
    Clock,
    Trash2,
    Activity
} from 'lucide-react';
import { ReportPayload } from '@/types/report';
import HostSelector from '@/components/report/HostSelector';
import ReportConfiguration from '@/components/report/ReportConfiguration';
import ChartLayoutOrder from '@/components/report/ChartLayoutOrder';
import FloatingInput from '@/components/common/FloatingInput';
import { useToast } from '@/components/common/Toast';
import ConfirmModal from '@/components/common/ConfirmModal';

interface Template {
    id: number;
    name: string;
    reportTitle: string;
    lastUpdated: string;
    hosts: { id: string; name: string; group: string; mem: number }[];
    charts: { id: string; label: string; enabled: boolean }[];
}

const SarChart = dynamic(() => import('@/components/charts/SarChart'), { ssr: false });
const Highcharts = typeof window !== 'undefined' ? require('highcharts') : null;

import { getChartOptions } from '@/components/charts/chartUtils';

const ReportExportPage = () => {
    const { showToast } = useToast();
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [selectedHostnames, setSelectedHostnames] = useState<{ id: string, name: string, group: string, mem?: number }[]>([]);
    const [activeAction, setActiveAction] = useState<'create-template' | 'quick-gen' | 'load-template' | null>(null);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [isExporting, setIsFetchingPDF] = useState(false);
    const [exportStatus, setExportStatus] = useState('');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [reportTitle, setReportTitle] = useState('Monthly Performance Report');
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
    const [limitMessage, setLimitMessage] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, templateId: number | null }>({ isOpen: false, templateId: null });

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

    const { data: hostGroupsRaw } = useQuery({ queryKey: ['hostGroups-batch-report'], queryFn: async () => (await axios.get('/api/host-groups')).data });
    const { data: templates = [], isLoading: isLoadingTemplates, refetch: refetchTemplates } = useQuery<Template[]>({
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
                        lastUpdated: new Date(t.updated_at || t.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok', hour12: false })
                    };
                } catch (e) { return null; }
            }).filter((t: any) => t !== null);
        }
    });

    const filteredGroups = useMemo(() => {
        if (!hostGroupsRaw) return [];
        return hostGroupsRaw
            .map((g: any) => ({
                ...g,
                hostnames: g.hostnames.filter((h: any) => h.hostname.toLowerCase().includes(searchTerm.toLowerCase()))
            }))
            .filter((g: any) => g.hostnames.length > 0 || g.hostgroup.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a: any, b: any) => a.hostgroup.localeCompare(b.hostgroup));
    }, [hostGroupsRaw, searchTerm]);

    const toggleExpand = (groupName: string) => {
        setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
    };
    const handleExpandAll = () => {
        if (hostGroupsRaw) {
            setSearchTerm('');
            setExpandedGroups(hostGroupsRaw.map((g: any) => g.hostgroup));
            setSelectedGroups(hostGroupsRaw.map((g: any) => g.hostgroup));
            setSelectedHostnames(hostGroupsRaw.flatMap((g: any) => g.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup, mem: h.mem }))));
        }
    };
    const handleCollapseAll = () => {
        setExpandedGroups([]);
        setSelectedGroups([]);
        setSelectedHostnames([]);
    };

    const toggleHostname = (h: any) => {
        setSelectedHostnames(prev => {
            const exists = prev.find(p => p.id === h.id);
            if (exists) return prev.filter(p => p.id !== h.id);
            if (prev.length >= 50) {
                setLimitMessage('Maximum 50 hosts allowed per report. For larger reports, please use the Templates section.');
                setIsLimitModalOpen(true);
                return prev;
            }
            return [...prev, h];
        });
    };

    const toggleGroup = (groupName: string) => {
        const isSelected = selectedGroups.includes(groupName);
        const groupData = hostGroupsRaw?.find((g: any) => g.hostgroup === groupName);
        const groupHostnames = groupData?.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: groupName, mem: h.mem })) || [];

        if (isSelected) {
            setSelectedGroups(prev => prev.filter(g => g !== groupName));
            setSelectedHostnames(prev => prev.filter(h => h.group !== groupName));
        } else {
            const remainingSlots = 50 - selectedHostnames.length;
            if (groupHostnames.length > remainingSlots) {
                setLimitMessage(`Cannot add ${groupHostnames.length} hosts. Only ${remainingSlots} slots remaining. Maximum 50 hosts allowed.`);
                setIsLimitModalOpen(true);
                return;
            }
            setSelectedGroups(prev => [...prev, groupName]);
            setSelectedHostnames(prev => [...prev.filter(h => h.group !== groupName), ...groupHostnames]);
        }
    };

    const DEFAULT_REPORTS = [
        { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average', enabled: true },
        { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak', enabled: true },
        { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal', enabled: true },
        { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal', enabled: true },
        { id: 'cpu-daily-normal', label: 'CPU Daily (Normal)', type: 'cpu-daily', mode: 'Normal', enabled: false },
        { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak', enabled: false },
        { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal', enabled: false },
    ];

    const [activeReports, setActiveReports] = useState(DEFAULT_REPORTS);

    const resetConfiguration = () => {
        setSelectedHostnames([]);
        setSelectedGroups([]);
        setExpandedGroups([]);
        setActiveReports(DEFAULT_REPORTS);
        setNewTemplateName('');
    };

    const handlePreviewPDF = async () => {
        if (isExporting || selectedHostnames.length === 0) return;
        if (selectedHostnames.length > 50) {
            setLimitMessage('Maximum 50 hosts allowed per report. Please select fewer hosts.');
            setIsLimitModalOpen(true);
            return;
        }
        setIsFetchingPDF(true);
        setExportStatus('Preparing report...');
        const selectedReportsList = activeReports.filter(r => r.enabled);

        try {
            setExportStatus('Fetching performance metrics...');

            const hostgroupsWithData = await Promise.all(Object.values(selectedHostnames.reduce((acc: any, host) => {
                if (!acc[host.group]) acc[host.group] = { name: host.group, hosts: [] };
                acc[host.group].hosts.push(host);
                return acc;
            }, {})).map(async (group: any) => {
                const hostsWithStats = await Promise.all(group.hosts.map(async (host: any) => {
                    // Fetch summary stats for PDF tables
                    const summaryRes = await axios.get('/api/metrics/summary', { params: { hostgroup: host.group, hostnameId: host.id, month, year } });
                    const { cpuStats, memStats } = summaryRes.data;

                    const hostCharts = await Promise.all(selectedReportsList.map(async (report) => {
                        let endpoint = ''; const params: any = { hostgroup: host.group, hostnameId: host.id };
                        if (report.type === 'cpu-daily') { endpoint = '/api/metrics/cpu-daily'; params.type = report.mode; params.startDate = startDate; params.endDate = endDate; }
                        else if (report.type === 'cpu-monthly') { endpoint = '/api/metrics/monthly'; params.month = month; params.year = year; }
                        else if (report.type === 'mem-daily') { endpoint = '/api/metrics/mem-daily'; params.type = report.mode; params.startDate = startDate; params.endDate = endDate; }
                        else if (report.type === 'mem-monthly') { endpoint = '/api/metrics/monthly'; params.month = month; params.year = year; params.type = 'r'; }

                        const res = await axios.get(endpoint, { params });
                        const metrics = res.data.data || res.data;

                        // Return raw data for server-side rendering
                        return {
                            label: report.label,
                            metrics: metrics,
                            report: report,
                            totalAvg: res.data.totalAvg,
                            hostname: host.name,
                            hostMem: host.mem,
                            startDate,
                            endDate,
                            month,
                            year
                        };
                    }));
                    return { id: host.id, name: host.name, mem: host.mem, cpuStats, memStats, charts: hostCharts };
                }));
                return { id: group.name, name: group.name, hosts: hostsWithStats };
            }));

            setExportStatus('Compiling PDF on server...');

            const payload: ReportPayload = {
                reportMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                reportTitle: reportTitle,
                targetMonth: parseInt(month),
                targetYear: parseInt(year),
                generatedDate: new Date().toLocaleDateString(),
                hostgroups: hostgroupsWithData as any
            };

            const response = await axios.post('/api/export-pdf', payload, {
                responseType: 'blob',
                timeout: 300000 // 5 minute timeout for large reports
            });

            setPdfUrl(window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' })));
        } catch (e: any) {
            console.error(e);
            showToast('Error: ' + (e.response?.data?.error || e.message), 'error');
        } finally {
            setIsFetchingPDF(false);
            setExportStatus('');
        }
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateName) {
            showToast('Please enter a template name', 'info');
            return;
        }
        if (selectedHostnames.length > 50) {
            setLimitMessage('Maximum 50 hosts allowed for templates. Please select fewer hosts.');
            setIsLimitModalOpen(true);
            return;
        }
        try {
            await axios.post('/api/report-templates', {
                name: newTemplateName,
                config: JSON.stringify({
                    reportTitle,
                    hosts: selectedHostnames,
                    charts: activeReports.filter(r => r.enabled)
                })
            });
            showToast('Template created successfully!', 'success');
            setNewTemplateName('');
            setActiveAction(null);
            refetchTemplates();
        } catch (e) {
            showToast('Failed to create template', 'error');
        }
    };

    const toggleReport = (id: string) => {
        setActiveReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const moveChart = (id: string, direction: 'up' | 'down') => {
        const index = activeReports.findIndex(r => r.id === id);
        const selectedInOrder = activeReports.filter(r => r.enabled);
        const currentInSelected = selectedInOrder.findIndex(r => r.id === id);

        if (direction === 'up' && currentInSelected > 0) {
            const targetId = selectedInOrder[currentInSelected - 1].id;
            const targetIndex = activeReports.findIndex(r => r.id === targetId);
            const newReports = [...activeReports];
            [newReports[index], newReports[targetIndex]] = [newReports[targetIndex], newReports[index]];
            setActiveReports(newReports);
        } else if (direction === 'down' && currentInSelected < selectedInOrder.length - 1) {
            const targetId = selectedInOrder[currentInSelected + 1].id;
            const targetIndex = activeReports.findIndex(r => r.id === targetId);
            const newReports = [...activeReports];
            [newReports[index], newReports[targetIndex]] = [newReports[targetIndex], newReports[index]];
            setActiveReports(newReports);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-ease-in px-4 sm:px-6">
            <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900 capitalize italic tracking-tight leading-none">Report Generation</h2>
                    <p className="text-sm font-medium text-slate-400 tracking-tight">Configure and export high-fidelity server utilization documents</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl inner-shadow border border-slate-200/50">
                        <button
                            onClick={() => {
                                resetConfiguration();
                                setActiveAction('create-template');
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black capitalize tracking-widest transition-all duration-300 ${activeAction === 'create-template' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Draft Template
                        </button>
                        <button
                            onClick={() => {
                                resetConfiguration();
                                setActiveAction('quick-gen');
                            }}
                            className={`px-5 py-2.5 rounded-xl text-xs font-black capitalize tracking-widest transition-all duration-300 ${activeAction === 'quick-gen' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Direct Export
                        </button>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 capitalize tracking-widest leading-none mb-1">Scope</p>
                            <p className="text-xs font-black text-slate-900 leading-none">{selectedHostnames.length} Nodes</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Templates Section */}
            <div className="relative modern-card p-10 pt-14">
                <span className="absolute -top-4 left-10 bg-blue-600 px-6 py-2 text-xs font-black capitalize tracking-[0.2em] text-white rounded-full shadow-xl shadow-blue-500/20 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Global Templates
                </span>
                {isLoadingTemplates ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 opacity-20" />
                        <p className="text-xs font-black text-slate-300 capitalize tracking-[0.3em] mt-8">Parsing saved configurations...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {templates.length === 0 ? (
                            <div className="py-24 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/20">
                                <Layers className="w-16 h-16 text-slate-100 mx-auto mb-6" />
                                <p className="text-slate-400 font-black text-xs capitalize tracking-[0.2em]">No operational templates found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {templates.map(template => (
                                    <div key={template.id} className={`flex flex-col md:flex-row md:items-center gap-6 p-5 bg-slate-50/50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] transition-all duration-500 group ${template.hosts.length > 50 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                                        <div className="flex-1 flex items-center gap-5 min-w-0">
                                            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500">
                                                <Layers className="w-6 h-6" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-black text-slate-900 text-sm capitalize tracking-tight truncate">{template.name}</h4>
                                                    <span className="bg-slate-100 text-slate-400 text-[8px] font-black capitalize tracking-widest px-2 py-0.5 rounded-lg border border-slate-50">ID:{template.id}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 capitalize tracking-widest italic opacity-70">
                                                    <Clock className="w-3.5 h-3.5" /> Updated {template.lastUpdated}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-white/50 px-4 py-3 rounded-2xl border border-slate-100 inline-flex flex-col gap-1 max-w-full shadow-inner">
                                                <h4 className="font-black text-slate-700 text-xs capitalize tracking-tight truncate flex items-center gap-2">
                                                    <FileText className="w-3.5 h-3.5 text-blue-500/40" />
                                                    {template.reportTitle}
                                                </h4>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-[9px] font-black text-slate-400 capitalize tracking-widest flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5 text-slate-300" /> {template.hosts.length} Nodes</span>
                                                    <span className="text-[9px] font-black text-slate-400 capitalize tracking-widest flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-slate-300" /> {template.charts.length} Dimensions</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-end gap-3 shrink-0">
                                            <button
                                                onClick={() => {
                                                    resetConfiguration();
                                                    setSelectedHostnames(template.hosts);
                                                    setReportTitle(template.reportTitle || template.name);
                                                    setActiveReports(DEFAULT_REPORTS.map(r => ({ ...r, enabled: template.charts.some((c: any) => c.id === r.id) })));
                                                    const uniqueGroups = Array.from(new Set(template.hosts.map(h => h.group)));
                                                    setSelectedGroups(uniqueGroups);
                                                    setExpandedGroups(uniqueGroups);
                                                    setActiveAction('load-template');
                                                }}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs capitalize tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
                                            >
                                                Initialize
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm({ isOpen: true, templateId: template.id })}
                                                className="p-3 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100 rounded-2xl transition-all shadow-sm"
                                                title="Delete Template"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {activeAction && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-10 duration-700 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-8">
                        <div className="flex items-center gap-6">
                            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-all duration-500 ${activeAction === 'create-template' ? 'bg-blue-600 text-white shadow-blue-500/30' :
                                activeAction === 'quick-gen' ? 'bg-slate-900 text-white shadow-slate-900/30' : 'bg-amber-500 text-white shadow-amber-500/30'
                                }`}>
                                {activeAction === 'create-template' ? <Layers size={28} /> :
                                    activeAction === 'quick-gen' ? <FileText size={28} /> : <Monitor size={28} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize italic">
                                    {activeAction === 'create-template' ? 'New Architectural Template' :
                                        activeAction === 'quick-gen' ? 'Ad-hoc Reporting Cycle' : 'Modify & Execute Cycle'}
                                </h3>
                                <p className="text-[11px] font-black text-slate-300 capitalize tracking-[0.2em] mt-1">Configure structural parameters and data scope</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveAction(null)}
                            className="p-3 bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-900 rounded-2xl transition-all border border-slate-100 shadow-inner group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    {activeAction === 'create-template' && (
                        <div className="bg-blue-50/20 p-8 rounded-3xl border border-blue-100/50 space-y-4 animate-in fade-in zoom-in-95 duration-500">
                            <div className="flex items-center gap-3 text-blue-700 mb-2">
                                <FileText className="w-4 h-4" />
                                <h4 className="text-xs font-black capitalize tracking-[0.2em]">Deployment Identity</h4>
                            </div>
                            <FloatingInput
                                label="Designation Name"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="e.g. CORE_CLUSTER_MONTHLY"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start">
                        <div className="xl:col-span-4 h-full">
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
                        </div>

                        <div className="xl:col-span-8 space-y-10">
                            <ReportConfiguration
                                reportTitle={reportTitle}
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
                                availableCharts={activeReports.filter(r => !r.enabled)}
                                selectedCharts={activeReports.filter(r => r.enabled)}
                                onToggleReport={toggleReport}
                                onMoveChart={moveChart}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-center pt-10 border-t border-slate-50">
                        {activeAction === 'create-template' ? (
                            <button
                                onClick={handleSaveTemplate}
                                disabled={selectedHostnames.length === 0 || !newTemplateName}
                                className="px-16 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] capitalize tracking-[0.3em] transition-all shadow-xl shadow-blue-500/20 disabled:opacity-30 flex items-center gap-3 group active:scale-95"
                            >
                                <Layers className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Commit Template
                            </button>
                        ) : (
                            <button
                                onClick={handlePreviewPDF}
                                disabled={isExporting || selectedHostnames.length === 0 || activeReports.filter(r => r.enabled).length === 0}
                                className="px-16 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[11px] capitalize tracking-[0.3em] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-30 flex items-center gap-3 group active:scale-95"
                            >
                                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />}
                                {isExporting ? exportStatus : 'Commence PDF Engine'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="System Intelligence Document Preview" maxWidth="max-w-6xl" onDownload={() => {
                const link = document.createElement('a'); link.href = pdfUrl!; link.download = `Metrisar_Analytics_${Date.now()}.pdf`; link.click();
            }}>
                {pdfUrl && <iframe src={pdfUrl} className="w-full h-[85vh] rounded-[2rem] border border-slate-100 shadow-inner bg-slate-900/5" title="Analytics Viewer" />}
            </Modal>

            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} title="System Payload Limit">
                <div className="p-12 text-center">
                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-10 border-4 border-amber-100 shadow-inner">
                        <AlertCircle className="w-12 h-12 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-6 capitalize tracking-tight italic">Maximum 50 Node Cluster</h3>
                    <p className="text-slate-400 font-medium leading-relaxed mb-12 max-w-md mx-auto text-sm">{limitMessage}</p>
                    <button
                        onClick={() => setIsLimitModalOpen(false)}
                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs capitalize tracking-[0.3em] transition-all shadow-xl active:scale-[0.98]"
                    >
                        Acknowledge Threshold
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, templateId: null })}
                title="Critical Action Override"
                message="This will permanently decommission the selected reporting template from the database. All unique configurations will be lost."
                onConfirm={async () => {
                    if (deleteConfirm.templateId) {
                        try {
                            await axios.delete(`/api/report-templates/${deleteConfirm.templateId}`);
                            showToast('Template successfully decommissioned', 'success');
                            refetchTemplates();
                        } catch (e) {
                            showToast('Failed to purge template', 'error');
                        }
                    }
                }}
            />
        </div>
    );
};
export default ReportExportPage;
