'use client';

import React, { useState } from 'react';
import { Package, FileText, ChevronRight, ShieldCheck, Database, Server, Settings, BarChart3, Activity, Zap, Terminal, Layout, Copy, Check } from 'lucide-react';

const CopyButton = ({ text }: { text: string }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button onClick={handleCopy} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all border border-gray-600" title="Copy to clipboard">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
        </button>
    );
};

const Section = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: React.ElementType }) => (
    <section className="mb-16">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
            {Icon ? <Icon size={16} className="text-blue-500" /> : <ChevronRight size={16} className="text-blue-500" />} {title}
        </h3>
        {children}
    </section>
);

export default function OperationsPage() {
    return (
        <div className="max-w-5xl mx-auto px-6 py-16">
            <header className="mb-20 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
                    <ShieldCheck size={14} /> System Documentation
                </div>
                <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Operations Guide</h1>
                <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Manage your server assets, analyze performance, and generate comprehensive reports.</p>
            </header>

            {/* 1. Manage Assets */}
            <Section title="1. Manage Assets" icon={Package}>
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Server size={18} className="text-blue-600" /> Hostgroup & Hostname Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <p className="text-xs text-gray-600 leading-relaxed">The Asset Management module allows you to organize your server infrastructure into logical <b>Hostgroups</b> and define individual <b>Hostnames</b> with detailed hardware configurations.</p>
                            <ul className="list-disc pl-5 space-y-2 text-[11px] text-gray-500 font-medium">
                                <li><b>Create/Edit Hostgroups:</b> Group servers for easier access and permission management.</li>
                                <li><b>Manage Hostnames:</b> Register new servers and define specs (OS, CPU, RAM, Disk).</li>
                                <li><b>Dynamic Discovery:</b> Newly registered hosts are prepared for automated SAR data collection.</li>
                            </ul>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Quick Access</p>
                            <p className="text-xs font-bold text-gray-800 mb-2">Navigate to:</p>
                            <code className="block bg-white p-3 rounded-lg border border-gray-200 text-[11px] font-mono text-blue-600">Inventory &gt; Manage Assets</code>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 2. Performance Analysis */}
            <Section title="2. Performance Analysis" icon={Activity}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600" /> Sarlog</h4>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">Access daily and monthly performance snapshots for specific servers.</p>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium">
                            Navigate to <b>Sarlog</b> tab. Select specific Hostgroup, Hostname, and Date Range to generate visualization charts.
                        </div>
                    </div>
                    <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Database size={18} className="text-purple-600" /> Utilization</h4>
                        <p className="text-xs text-gray-600 mb-4 leading-relaxed">View long-term utilization statistics to identify resource bottlenecks.</p>
                        <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-[11px] text-purple-800 font-medium">
                            Navigate to <b>Utilization</b> tab. Compare CPU or Memory stats across the last 12 months for selected Hostgroups.
                        </div>
                    </div>
                </div>
            </Section>

            {/* 3. Automated Performance Reporting */}
            <Section title="3. Automated Performance Reporting" icon={FileText}>
                <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8 space-y-12">

                    {/* Generate Report vs Batch Report */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileText size={18} className="text-blue-600" /> Generate Report (Manual)</h4>
                            <p className="text-xs text-gray-600 mb-4">Ad-hoc report generation for specific timeframes or host selection.</p>
                            <ol className="list-decimal pl-5 text-[11px] text-gray-700 space-y-2 font-medium">
                                <li>Navigate to <b>Report &gt; Generate Report</b>.</li>
                                <li>Click the <b>"Quick Gen Report"</b> button to start.</li>
                                <li>Select hostgroup/hosts from tree.</li>
                                <li>Configure date/time range.</li>
                                <li>Select and order charts.</li>
                                <li>Click "Generate PDF".</li>
                            </ol>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-2xl">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Zap size={18} className="text-yellow-600" /> Batch Report (Automated)</h4>
                            <p className="text-xs text-gray-600 mb-4">Recurring, large-scale reports based on pre-configured templates.</p>
                            <ol className="list-decimal pl-5 text-[11px] text-gray-700 space-y-2 font-medium">
                                <li>Navigate to <b>Report &gt; Batch Report</b>.</li>
                                <li>Select template, month, and year.</li>
                                <li>Click "Start Batch" to trigger background job.</li>
                                <li>Monitor job status in the table below.</li>
                            </ol>
                        </div>
                    </div>

                    {/* Template Creation Step-by-Step */}
                    <div className="pt-8 border-t border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Layout size={18} className="text-indigo-600" /> How to Create a Report Template</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { step: "01. Initialize", desc: "In 'Batch Report', click the '+ Create New Template' button." },
                                { step: "02. Define Meta", desc: "Enter a unique template name and PDF header title." },
                                { step: "03. Scope Selection", desc: "Choose target hostgroups and specific hosts from the interactive tree." },
                                { step: "04. Chart Configuration", desc: "Select and drag-and-drop metrics (CPU/Mem/etc.) to define the report layout." },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <div className="text-[10px] font-black text-indigo-700 mb-2">{item.step}</div>
                                    <p className="text-[11px] text-indigo-900 font-medium">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Batch Execution & Developer Details */}
                    <div className="pt-8 border-t border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-6">Execution & Technical Deep Dive</h4>
                        <div className="bg-gray-900 p-6 rounded-2xl text-gray-300 font-mono text-[10px]">
                            <p className="text-emerald-400 font-black uppercase text-[9px] mb-2 flex justify-between">
                                CLI Trigger (with JobID) <CopyButton text="npm run generate-monthly-report -- --templateId=5 --jobId=manual_run_001" />
                            </p>
                            <p className="mb-4">npm run generate-monthly-report -- --templateId=5 --jobId=manual_run_001</p>
                            <p className="text-amber-400 font-black uppercase text-[9px] mb-2 flex justify-between">
                                Cron Automation (Dynamic JobID) <CopyButton text="0 3 1 * * docker exec mperf-app npm run generate-monthly-report -- --templateId=5 --jobId=cron_id_YYYYMMDD" />
                            </p>
                            <p className="mb-2 text-gray-400 italic"># Use unique JobID for tracking in Dashboard:</p>
                            <p>0 3 1 * * docker exec mperf-app npm run generate-monthly-report -- --templateId=5 --jobId=cron_job_$(date +%Y%m%d_%H%M%S)</p>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
