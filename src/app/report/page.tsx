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
        <div className="max-w-7xl mx-auto space-y-10 pb-20 animate-ease-in">
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 px-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Performance Reports</h2>
                    <p className="text-sm font-medium text-gray-400">Configure and generate professional server utilization documents</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                resetConfiguration();
                                setActiveAction('create-template');
                            }}
                            className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all shadow-sm ${activeAction === 'create-template' ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'}`}
                        >
                            Create Template
                        </button>
                        <button
                            onClick={() => {
                                resetConfiguration();
                                setActiveAction('quick-gen');
                            }}
                            className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all shadow-sm ${activeAction === 'quick-gen' ? 'bg-gray-900 text-white shadow-gray-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'}`}
                        >
                            Quick Report
                        </button>
                    </div>
                    <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-gray-100 shadow-sm">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-0.5">Selection</p>
                            <p className="text-xs font-bold text-gray-900 leading-none">{selectedHostnames.length} Hosts</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Templates Section */}
            <div className="relative border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 pt-12 sm:pt-14 bg-white shadow-sm mb-12 group transition-all hover:shadow-md">
                <span className="absolute -top-4 left-8 bg-blue-600 px-5 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-white rounded-full shadow-lg shadow-blue-100 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Saved Templates
                </span>
                {isLoadingTemplates ? (
                    <div className="py-20 text-center"><Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600 opacity-20" /></div>
                ) : (
                    <div className="space-y-4">
                        {templates.length === 0 ? (
                            <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                                <Layers className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold text-sm">No saved templates found</p>
                            </div>
                        ) : (
                        templates.map(template => (
                                <div key={template.id} className={`flex flex-col md:flex-row md:items-center gap-4 p-4 bg-gray-50/50 border border-gray-100 rounded-xl hover:bg-white hover:border-blue-100 hover:shadow transition-all duration-300 ${template.hosts.length > 50 ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="flex-1 flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 text-xs truncate mb-0.5">{template.name}</h4>
                                            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-gray-400">
                                                <Clock className="w-3 h-3" /> {template.lastUpdated}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white border border-gray-100 px-3 py-2 rounded-lg inline-flex flex-col gap-0.5 max-w-full">
                                            <h4 className="font-bold text-gray-700 text-[10px] truncate flex items-center gap-1.5">
                                                <FileText className="w-3 h-3 text-blue-500/50" />
                                                {template.reportTitle}
                                            </h4>
                                            <div className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-3 ${template.hosts.length > 50 ? 'text-red-500' : 'text-gray-400'}`}>
                                                <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {template.hosts.length} Hosts</span>
                                                <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {template.charts.length} Charts</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 shrink-0">
                                        <button
                                            onClick={() => {
                                                if (template.hosts.length > 50) {
                                                    setLimitMessage('This template has ' + template.hosts.length + ' hosts, which exceeds the maximum limit of 50. Please create a new template with fewer hosts.');
                                                    setIsLimitModalOpen(true);
                                                    return;
                                                }
                                                resetConfiguration();
                                                setSelectedHostnames(template.hosts);
                                                setReportTitle(template.reportTitle || template.name);
                                                setActiveReports(DEFAULT_REPORTS.map(r => ({ ...r, enabled: template.charts.some((c: any) => c.id === r.id) })));
                                                const uniqueGroups = Array.from(new Set(template.hosts.map(h => h.group)));
                                                setSelectedGroups(uniqueGroups);
                                                setExpandedGroups(uniqueGroups);
                                                setActiveAction('load-template');
                                            }}
                                            className={`px-4 py-2 rounded-lg font-bold text-[10px] transition-all ${template.hosts.length > 50 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                        >
                                            Load
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (template.hosts.length > 50) return;
                                                setDeleteConfirm({ isOpen: true, templateId: template.id });
                                            }}
                                            className={`p-2 rounded-lg transition-all ${template.hosts.length > 50 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100'}`}
                                            title="Delete Template"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {activeAction && (
                <div className="space-y-6 animate-ease-in bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${activeAction === 'create-template' ? 'bg-blue-600 text-white' :
                                activeAction === 'quick-gen' ? 'bg-gray-900 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                {activeAction === 'create-template' ? <Layers size={20} /> :
                                    activeAction === 'quick-gen' ? <FileText size={20} /> : <Monitor size={20} />}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                                    {activeAction === 'create-template' ? 'Create New Template' :
                                        activeAction === 'quick-gen' ? 'Quick Report Generation' : 'Edit Template & Generate'}
                                </h3>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">Configure report parameters and host selection.</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActiveAction(null)}
                            className="p-2 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-all border border-gray-100"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {activeAction === 'create-template' && (
                        <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                            <div className="flex items-center gap-2 text-blue-700">
                                <FileText className="w-3.5 h-3.5" />
                                <h4 className="text-[10px] font-bold uppercase tracking-wider">Template Identification</h4>
                            </div>
                            <FloatingInput
                                label="New Template Name"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="e.g., Monthly Batch - App Group A"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                        <div className="xl:col-span-4">
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

                        <div className="xl:col-span-8 space-y-6">
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

                    <div className="flex items-center justify-center pt-4 border-t border-gray-100">
                        {activeAction === 'create-template' ? (
                            <button
                                onClick={handleSaveTemplate}
                                disabled={selectedHostnames.length === 0 || !newTemplateName}
                                className="px-10 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                <Layers className="w-4 h-4" /> Save Template
                            </button>
                        ) : (
                            <button
                                onClick={handlePreviewPDF}
                                disabled={isExporting || selectedHostnames.length === 0 || activeReports.filter(r => r.enabled).length === 0}
                                className="px-10 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                            >
                                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                                {isExporting ? exportStatus : 'Generate Report'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="Report Preview" maxWidth="max-w-6xl" onDownload={() => {
                const link = document.createElement('a'); link.href = pdfUrl!; link.download = `Metrisar_Report_${Date.now()}.pdf`; link.click();
            }}>
                {pdfUrl && <iframe src={pdfUrl} className="w-full h-[80vh] rounded-3xl border border-gray-100 shadow-inner" title="PDF Viewer" />}
            </Modal>

            <Modal isOpen={isLimitModalOpen} onClose={() => setIsLimitModalOpen(false)} title="Host Limit Reached">
                <div className="p-10 text-center">
                    <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-amber-100 shadow-inner">
                        <AlertCircle className="w-12 h-12 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Maximum 50 Hosts Allowed</h3>
                    <p className="text-gray-500 font-medium leading-relaxed mb-10 max-w-md mx-auto">{limitMessage}</p>
                    <button
                        onClick={() => setIsLimitModalOpen(false)}
                        className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-base transition-all shadow-xl shadow-gray-200 active:scale-[0.98]"
                    >
                        I Understand
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, templateId: null })}
                title="Delete Template"
                message="Are you sure you want to delete this template? This action cannot be undone and will remove all saved configurations."
                onConfirm={async () => {
                    if (deleteConfirm.templateId) {
                        try {
                            await axios.delete(`/api/report-templates/${deleteConfirm.templateId}`);
                            showToast('Template deleted successfully', 'success');
                            refetchTemplates();
                        } catch (e) {
                            showToast('Failed to delete template', 'error');
                        }
                    }
                }}
            />
        </div>
    );
};
export default ReportExportPage;
