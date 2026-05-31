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
    X
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
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase italic underline decoration-blue-500 underline-offset-8">Performance Reports</h2>
                    <p className="text-gray-500 font-medium mt-2">Select hosts and configurations to generate document</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            resetConfiguration();
                            setActiveAction('create-template');
                        }}
                        className={`px-4 py-3 rounded-xl font-black text-xs transition-all ${activeAction === 'create-template' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                        CREATE TEMPLATE
                    </button>
                    <button
                        onClick={() => {
                            resetConfiguration();
                            setActiveAction('quick-gen');
                        }}
                        className={`px-4 py-3 rounded-xl font-black text-xs transition-all ${activeAction === 'quick-gen' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                    >
                        QUICK GEN REPORT
                    </button>
                    <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Selected</p>
                            <p className="text-sm font-black text-blue-700 leading-none">{selectedHostnames.length} HOSTS</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Templates Section */}
            <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm mb-12">
              <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Saved Templates
              </span>
              {isLoadingTemplates ? (
                  <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
              ) : (
            <div className="space-y-3">
                {templates.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">No templates found</div>
                ) : (
                    templates.map(template => (
                        <div key={template.id} className={`grid grid-cols-12 items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all gap-4 ${template.hosts.length > 50 ? 'opacity-50 grayscale' : ''}`}>
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 truncate">{template.name}</h4>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{template.lastUpdated}</p>
                                </div>
                            </div>
                            <div className="col-span-5">
                                <h4 className="font-bold text-gray-700 text-sm truncate flex items-center gap-2">
                                    <FileText className="w-3.5 h-3.5 text-gray-400" />
                                    {template.reportTitle}
                                </h4>
                                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-4 ${template.hosts.length > 50 ? 'text-red-400' : 'text-gray-400'}`}>
                                    <span className="flex items-center gap-1.5"><Monitor className="w-3 h-3" /> {template.hosts.length} HOSTS</span>
                                    <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> {template.charts.length} CHARTS</span>
                                </p>
                            </div>
                            <div className="col-span-3 flex items-center justify-end gap-2">
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
                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${template.hosts.length > 50 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                >
                                    LOAD
                                </button>
                                <button 
                                    onClick={() => {
                                        if (template.hosts.length > 50) return;
                                        setDeleteConfirm({ isOpen: true, templateId: template.id });
                                    }}
                                    className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${template.hosts.length > 50 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-500 hover:bg-red-600 hover:text-white'}`}
                                >
                                    DELETE
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
              )}
            </div>

            {activeAction && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                activeAction === 'create-template' ? 'bg-blue-600 text-white' : 
                                activeAction === 'quick-gen' ? 'bg-slate-900 text-white' : 'bg-amber-500 text-white'
                            }`}>
                                {activeAction === 'create-template' ? <Layers className="w-6 h-6" /> : 
                                 activeAction === 'quick-gen' ? <FileText className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
                                    {activeAction === 'create-template' ? 'Create New Template' : 
                                     activeAction === 'quick-gen' ? 'Quick Report Generation' : 'Edit Template & Generate'}
                                </h3>
                                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Configure your report parameters below</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setActiveAction(null)}
                            className="p-3 bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-2xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {activeAction === 'create-template' && (
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                             <div className="flex items-center gap-3 text-blue-600 border-b border-blue-100 pb-2">
                                <FileText className="w-4 h-4" />
                                <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Template Details</h4>
                            </div>
                            <FloatingInput 
                                label="Template Name"
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="Enter a descriptive name for this template..."
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-4 space-y-6">
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

                        <div className="lg:col-span-8 space-y-8">
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

                    <div className="flex items-center justify-center pt-8 border-t border-gray-100">
                        {activeAction === 'create-template' ? (
                            <button
                                onClick={handleSaveTemplate}
                                disabled={selectedHostnames.length === 0 || !newTemplateName}
                                className="px-16 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-4"
                            >
                                <Layers className="w-7 h-7" />
                                SAVE TEMPLATE
                            </button>
                        ) : (
                            <button
                                onClick={handlePreviewPDF}
                                disabled={isExporting || selectedHostnames.length === 0 || activeReports.filter(r => r.enabled).length === 0}
                                className="px-16 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-4"
                            >
                                {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-7 h-7" />}
                                {isExporting ? exportStatus : 'GENERATE REPORT'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <Modal isOpen={!!pdfUrl} onClose={() => setPdfUrl(null)} title="REPORT PREVIEW" maxWidth="max-w-6xl" onDownload={() => {
                const link = document.createElement('a'); link.href = pdfUrl!; link.download = `MFEC_SAR_REPORT_${Date.now()}.pdf`; link.click();
            }}>
                {pdfUrl && <iframe src={pdfUrl} className="w-full h-[80vh] rounded-2xl border border-gray-100 shadow-inner" title="PDF Viewer" />}
            </Modal>

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

            <ConfirmModal 
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, templateId: null })}
                title="DELETE TEMPLATE"
                message="Are you sure you want to delete this template? This action cannot be undone."
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
