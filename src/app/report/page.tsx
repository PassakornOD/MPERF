'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Block from '@/components/common/Block';
import Modal from '@/components/common/Modal';
import dynamic from 'next/dynamic';
import {
    ChevronDown,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    Loader2,
    Monitor,
    Calendar,
    Layers,
    FileText,
    Search,
    CheckCircle2,
    Clock,
    Layout,
    User,
    X,
    PlusCircle,
    GripVertical,
    Type,
    AlertCircle
} from 'lucide-react';
import { ReportPayload } from '@/types/report';
import FloatingInput from '@/components/common/FloatingInput';

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
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [selectedHostnames, setSelectedHostnames] = useState<{ id: string, name: string, group: string, mem?: number }[]>([]);
    const [isExporting, setIsFetchingPDF] = useState(false);
    const [exportStatus, setExportStatus] = useState('');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [reportTitle, setReportTitle] = useState('Monthly Performance Report');
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

    const { data: hostGroupsRaw } = useQuery({ queryKey: ['hostGroups-batch-report'], queryFn: async () => (await axios.get('/api/host-groups')).data });
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

    const [activeReports, setActiveReports] = useState([
        { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average', enabled: true },
        { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak', enabled: true },
        { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal', enabled: true },
        { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal', enabled: true },
        { id: 'cpu-daily-normal', label: 'CPU Daily (Normal)', type: 'cpu-daily', mode: 'Normal', enabled: false },
        { id: 'mem-daily-peak', label: 'Memory Daily (Peak)', type: 'mem-daily', mode: 'Peak', enabled: false },
        { id: 'mem-monthly-normal', label: 'Memory Monthly', type: 'mem-monthly', mode: 'Normal', enabled: false },
    ]);

    const handlePreviewPDF = async () => {
        if (isExporting || selectedHostnames.length === 0) return;
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
            alert('Error: ' + (e.response?.data?.error || e.message));
        } finally {
            setIsFetchingPDF(false);
            setExportStatus('');
        }
    };

    const availableCharts = useMemo(() => activeReports.filter(r => !r.enabled), [activeReports]);
    const selectedCharts = useMemo(() => activeReports.filter(r => r.enabled), [activeReports]);

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
                <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-2xl border border-blue-100 shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Selected</p>
                        <p className="text-sm font-black text-blue-700 leading-none">{selectedHostnames.length} HOSTS</p>
                    </div>
                </div>
            </header>

            {/* Templates Section */}
            <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm mb-12">
              <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" /> Generate From Template
              </span>
              {isLoadingTemplates ? (
                  <div className="py-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
              ) : (
            <div className="space-y-3">
                {templates.map(template => (
                    <div key={template.id} className="grid grid-cols-12 items-center p-4 bg-white border border-gray-100 rounded-2xl shadow-sm hover:border-blue-200 transition-all gap-4">
                        <div className="col-span-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Layout className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-black text-gray-900 truncate">{template.name}</h4>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{template.lastUpdated}</p>
                            </div>
                        </div>
                        <div className="col-span-5">
                            <h4 className="font-bold text-gray-700 text-sm truncate">{template.reportTitle}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                                {template.hosts.length} HOSTS • {template.charts.length} CHARTS
                            </p>
                        </div>
                        <div className="col-span-3 flex items-center justify-end gap-2">
                            <button 
                                onClick={() => {
                                    setSelectedHostnames(template.hosts);
                                    setReportTitle(template.reportTitle || template.name);
                                    setActiveReports(activeReports.map(r => ({ ...r, enabled: template.charts.some((c: any) => c.id === r.id) })));
                                    const uniqueGroups = Array.from(new Set(template.hosts.map(h => h.group)));
                                    setSelectedGroups(uniqueGroups);
                                    setExpandedGroups(uniqueGroups);
                                }}
                                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-600 hover:text-white transition-all"
                            >
                                LOAD
                            </button>
                            <button 
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this template?')) {
                                        await axios.delete(`/api/report-templates/${template.id}`);
                                    }
                                }}
                                className="px-4 py-2 bg-red-50 text-red-500 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition-all"
                            >
                                DELETE
                            </button>
                        </div>
                    </div>
                ))}
            </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 space-y-6">
                    <div className="relative border border-gray-100 rounded-3xl p-6 pt-10 bg-white shadow-sm">
                        <span className="absolute -top-4 left-6 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                            <Monitor className="w-3.5 h-3.5" /> Select Hosts
                        </span>
                        <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold placeholder:text-gray-400 shadow-inner"
                                placeholder="Search Hostname..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredGroups.map((g: any) => {
                                const isExpanded = expandedGroups.includes(g.hostgroup);
                                return (
                                    <div key={g.hostgroup} className="border border-gray-100 rounded-xl bg-white overflow-hidden mb-1">
                                        <div
                                            className={`flex items-center justify-between p-2 cursor-pointer transition-colors ${selectedGroups.includes(g.hostgroup) ? 'bg-blue-300 text-white' : 'hover:bg-gray-50'}`}
                                            onClick={() => toggleGroup(g.hostgroup)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); toggleExpand(g.hostgroup); }}>
                                                    {isExpanded ? <ChevronDown className={`w-3 h-3 ${selectedGroups.includes(g.hostgroup) ? 'text-white' : 'text-blue-600'}`} /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                </button>
                                                <span className={`text-[10px] font-black uppercase tracking-tight ${selectedGroups.includes(g.hostgroup) ? 'text-white' : 'text-gray-700'}`}>{g.hostgroup}</span>
                                            </div>
                                        </div>
                                        {isExpanded && (
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
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <div className="space-y-8">
                        <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm">
                            <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Configurations
                            </span>

                            <div className="mb-8 space-y-4">
                                <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                                    <Type className="w-4 h-4" />
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Report Metadata</h4>
                                </div>
                                <FloatingInput
                                    label="Report Title"
                                    value={reportTitle}
                                    onChange={e => setReportTitle(e.target.value)}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                                        <Clock className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Daily Reports Range</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">From Date</label>
                                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">To Date</label>
                                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-5">
                                    <div className="flex items-center gap-3 text-blue-600 border-b border-gray-50 pb-2">
                                        <Calendar className="w-4 h-4" />
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.1em]">Monthly Period</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">Target Month</label>
                                            <select value={month} onChange={e => setMonth(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm">
                                                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={String(i + 1)}>{new Date(2000, i).toLocaleString('en-US', { month: 'long' })}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1.5 ml-1">Target Year</label>
                                            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative border border-gray-100 rounded-3xl p-8 pt-10 bg-white shadow-sm">
                            <span className="absolute -top-4 left-8 bg-white px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-2">
                                <Layout className="w-3.5 h-3.5" /> Chart Order & Layout
                            </span>
                            <div className="flex flex-row gap-8 items-start justify-center">
                                {availableCharts.length > 0 && (
                                    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/50 shadow-inner w-[48%]">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-200 pb-3 mb-4">Available Charts</p>
                                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {availableCharts.map((report) => (
                                                <button
                                                    key={report.id}
                                                    onClick={() => toggleReport(report.id)}
                                                    className="w-full flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-100 text-[11px] font-bold hover:border-blue-200 transition-all text-left shadow-sm"
                                                >
                                                    <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                                                    <span className="truncate">{report.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="border border-blue-100 rounded-xl p-5 bg-blue-50/20 shadow-inner w-[48%] min-h-[150px] flex flex-col">
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-blue-100 pb-3 mb-4">Selected Layout</p>
                                    {selectedCharts.length > 0 ? (
                                        <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                            {selectedCharts.map((report, sIdx) => (
                                                <div key={report.id} className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-100 shadow-sm">
                                                    <div className="flex items-center gap-2 text-[11px] font-bold truncate text-gray-700">
                                                        <GripVertical className="w-3.5 h-3.5 text-gray-300" />
                                                        <span className="truncate">{report.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5">
                                                        <button onClick={() => moveChart(report.id, 'up')} disabled={sIdx === 0} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                                                        <button onClick={() => moveChart(report.id, 'down')} disabled={sIdx === selectedCharts.length - 1} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                                                        <button onClick={() => toggleReport(report.id)} className="p-1 hover:bg-red-50 text-red-500 rounded"><X className="w-3 h-3" /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex-1 flex items-center justify-center text-gray-400 text-xs font-bold uppercase tracking-wider h-full">
                                            Please select charts to display.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>


                </div>
            </div>

            {selectedHostnames.length > 0 && (
                <div className="flex items-center justify-center pt-4">
                    <button
                        onClick={handlePreviewPDF}
                        disabled={isExporting || selectedCharts.length === 0}
                        className="px-16 py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xl tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed uppercase flex items-center gap-4"
                    >
                        {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-7 h-7" />}
                        {isExporting ? exportStatus : 'GENERATE REPORT'}
                    </button>
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
        </div>
    );
};
export default ReportExportPage;
