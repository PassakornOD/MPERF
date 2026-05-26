'use client';
import React, { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Modal from '@/components/common/Modal';
import dynamic from 'next/dynamic';
import { ChevronDown, ChevronRight, Loader2, Monitor, Calendar, FileText, Search, CheckCircle2, Clock, Layout, X, PlusCircle, GripVertical, Type } from 'lucide-react';
import { ReportPayload } from '@/types/report';
import FloatingInput from '@/components/common/FloatingInput';

const SarChart = dynamic(() => import('@/components/charts/SarChart'), { ssr: false });
import { getChartOptions } from '@/components/charts/chartUtils';

const ReportExportPage = () => {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [selectedHostnames, setSelectedHostnames] = useState<{ id: string, name: string, group: string, mem?: number }[]>([]);
  const [isExporting, setIsFetchingPDF] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reportTitle, setReportTitle] = useState('Monthly Performance Report');

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

  const filteredGroups = useMemo(() => {
    if (!hostGroupsRaw) return [];
    return hostGroupsRaw
      .map((g: any) => ({ ...g, hostnames: g.hostnames.filter((h: any) => h.hostname.toLowerCase().includes(searchTerm.toLowerCase())) }))
      .filter((g: any) => g.hostnames.length > 0 || g.hostgroup.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a: any, b: any) => a.hostgroup.localeCompare(b.hostgroup));
  }, [hostGroupsRaw, searchTerm]);

  const [activeReports, setActiveReports] = useState([
    { id: 'cpu-daily-average', label: 'CPU Daily (Average)', type: 'cpu-daily', mode: 'Average', enabled: true },
    { id: 'cpu-daily-peak', label: 'CPU Daily (Peak)', type: 'cpu-daily', mode: 'Peak', enabled: true },
    { id: 'cpu-monthly-normal', label: 'CPU Monthly', type: 'cpu-monthly', mode: 'Normal', enabled: true },
    { id: 'mem-daily-normal', label: 'Memory Daily (Normal)', type: 'mem-daily', mode: 'Normal', enabled: true },
  ]);

  const toggleExpand = (groupName: string) => setExpandedGroups(prev => prev.includes(groupName) ? prev.filter(g => g !== groupName) : [...prev, groupName]);
  const toggleGroup = (groupName: string) => {
    const isSelected = selectedGroups.includes(groupName);
    const groupData = hostGroupsRaw?.find((g: any) => g.hostgroup === groupName);
    const groupHostnames = groupData?.hostnames.map((h: any) => ({ id: String(h.hostname_id), name: h.hostname, group: groupName, mem: h.mem })) || [];
    if (isSelected) {
      setSelectedGroups(prev => prev.filter(g => g !== groupName));
      setSelectedHostnames(prev => prev.filter(h => h.group !== groupName));
    } else {
      setSelectedGroups(prev => [...prev, groupName]);
      setSelectedHostnames(prev => [...prev.filter(h => h.group !== groupName), ...groupHostnames]);
    }
  };
  const toggleHostname = (h: any) => setSelectedHostnames(prev => prev.find(p => p.id === h.id) ? prev.filter(p => p.id !== h.id) : [...prev, h]);
  const toggleReport = (id: string) => setActiveReports(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const moveChart = (id: string, direction: 'up' | 'down') => {
    const index = activeReports.findIndex(r => r.id === id);
    const enabled = activeReports.filter(r => r.enabled);
    const currentIdx = enabled.findIndex(r => r.id === id);
    if (direction === 'up' && currentIdx > 0) {
      const newReports = [...activeReports];
      const targetId = enabled[currentIdx - 1].id;
      const targetIndex = newReports.findIndex(r => r.id === targetId);
      [newReports[index], newReports[targetIndex]] = [newReports[targetIndex], newReports[index]];
      setActiveReports(newReports);
    } else if (direction === 'down' && currentIdx < enabled.length - 1) {
      const newReports = [...activeReports];
      const targetId = enabled[currentIdx + 1].id;
      const targetIndex = newReports.findIndex(r => r.id === targetId);
      [newReports[index], newReports[targetIndex]] = [newReports[targetIndex], newReports[index]];
      setActiveReports(newReports);
    }
  };

  const handlePreviewPDF = async () => {
    if (isExporting || selectedHostnames.length === 0) return;
    setIsFetchingPDF(true);
    const selectedReportsList = activeReports.filter(r => r.enabled);

    try {
      const hostgroupsWithData = await Promise.all(Object.values(selectedHostnames.reduce((acc: any, host) => {
        if (!acc[host.group]) acc[host.group] = { name: host.group, hosts: [] };
        acc[host.group].hosts.push(host);
        return acc;
      }, {})).map(async (group: any) => {
        const hostsWithStats = await Promise.all(group.hosts.map(async (host: any) => {
          const summaryRes = await axios.get('/api/metrics/summary', { params: { hostgroup: host.group, hostnameId: host.id, month, year } });
          const rawCharts = await Promise.all(selectedReportsList.map(async (report) => {
            let endpoint = ''; const params: any = { hostgroup: host.group, hostnameId: host.id };
            if (report.type === 'cpu-daily') { endpoint = '/api/metrics/cpu-daily'; params.type = report.mode; params.startDate = startDate; params.endDate = endDate; }
            else if (report.type === 'cpu-monthly') { endpoint = '/api/metrics/monthly'; params.month = month; params.year = year; params.type = 'u'; }
            else if (report.type === 'mem-daily') { endpoint = '/api/metrics/mem-daily'; params.type = report.mode; params.startDate = startDate; params.endDate = endDate; }
            else if (report.type === 'mem-monthly') { endpoint = '/api/metrics/monthly'; params.month = month; params.year = year; params.type = 'r'; }
            const res = await axios.get(endpoint, { params });
            return { label: report.label, metrics: res.data.data || res.data, report: report, reportImage: '' };
          }));
          return { ...host, cpuStats: summaryRes.data.cpuStats, memStats: summaryRes.data.memStats, rawCharts };
        }));
        return { name: group.name, id: group.name, hosts: hostsWithStats };
      }));

      const payload: ReportPayload = {
        reportMonth: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        reportTitle,
        targetMonth: parseInt(month),
        targetYear: parseInt(year),
        generatedDate: new Date().toLocaleDateString(),
        hostgroups: hostgroupsWithData.map((g: any) => ({
          name: g.name,
          id: g.id,
          hosts: g.hosts.map((h: any) => ({
            name: h.name,
            id: h.id,
            cpuStats: h.cpuStats,
            memStats: h.memStats,
            charts: h.rawCharts.map((c: any) => ({ label: c.label, data: c.reportImage || '' }))
          }))
        }))
      };

      console.log('DEBUG: Final Payload:', JSON.stringify(payload));
      const response = await axios.post('/api/export-pdf', payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${new Date().getTime()}.pdf`);
      document.body.appendChild(link);
      link.click();
    } catch (e: any) { console.error(e); alert('Error generating PDF'); }
    finally { setIsFetchingPDF(false); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Performance Report Export</h1>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4 border p-4 rounded-xl">
          <h2 className="font-bold mb-4">Select Hosts</h2>
          <input className="w-full p-2 border rounded-lg mb-2" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          {/* @ts-ignore */}
          {filteredGroups.map(g => (
            <div key={g.hostgroup} className="border-b py-2">
              <div className="flex justify-between cursor-pointer font-semibold text-sm" onClick={() => toggleGroup(g.hostgroup)}>{g.hostgroup} <button onClick={(e) => { e.stopPropagation(); toggleExpand(g.hostgroup); }}>{expandedGroups.includes(g.hostgroup) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</button></div>
              {/* @ts-ignore */}
              {expandedGroups.includes(g.hostgroup) && g.hostnames.map((h: any) => (
                <button key={h.hostname_id} onClick={() => toggleHostname({ id: String(h.hostname_id), name: h.hostname, group: g.hostgroup })} className={`block w-full text-left p-1 text-xs ${selectedHostnames.find(s => s.id === String(h.hostname_id)) ? 'bg-blue-100 font-bold' : ''}`}>{h.hostname}</button>
              ))}
            </div>
          ))}
        </div>

        <div className="col-span-8 space-y-6">
          <div className="p-4 border rounded-xl">
            <h3 className="font-bold mb-2">Configurations</h3>
            <input className="w-full p-2 border rounded-lg mb-2" value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
            <div className="flex gap-2">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="p-2 border rounded-lg" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="p-2 border rounded-lg" />
            </div>
          </div>

          <div className="p-4 border rounded-xl">
            <h3 className="font-bold mb-2">Chart Order</h3>
            <div className="flex flex-col gap-2">
              {activeReports.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{r.label}</span>
                  <div className="flex gap-2">
                    <button onClick={() => toggleReport(r.id)}>{r.enabled ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => moveChart(r.id, 'up')} disabled={i === 0}>↑</button>
                    <button onClick={() => moveChart(r.id, 'down')} disabled={i === activeReports.length - 1}>↓</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handlePreviewPDF} className="w-full p-4 bg-black text-white rounded-xl font-bold">{isExporting ? 'Generating...' : 'GENERATE PDF'}</button>
        </div>
      </div>
    </div>
  );
};

export default ReportExportPage;