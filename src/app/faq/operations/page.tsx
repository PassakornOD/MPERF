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
        <button onClick={handleCopy} className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-slate-600" title="Copy to clipboard">
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-slate-400" />}
        </button>
    );
};

const Section = ({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: React.ElementType }) => (
    <section className="mb-16">
        <h3 className="text-slate-400 capitalize text-xl mb-8 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                {Icon ? <Icon size={18} /> : <ChevronRight size={18} />}
            </div>
            {title}
        </h3>
        {children}
    </section>
);

export default function OperationsPage() {
    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20 animate-ease-in pb-32">
            <header className="mb-20 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-xs border border-blue-100 shadow-sm capitalize ">
                    <ShieldCheck size={16} /> System Documentation
                </div>
                <h1 className="text-5xl text-slate-900 tracking-tight capitalize italic">Operations Guide</h1>
                <p className="text-slate-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-medium">Manage your server assets, analyze performance, and generate comprehensive reports.</p>
            </header>

            {/* 1. Manage Assets */}
            <Section title="Manage Assets" icon={Package}>
                <div className="modern-card p-8 sm:p-10">
                    <h4 className="text-lg text-slate-900 mb-6 flex items-center gap-3 capitalize tracking-tight"><Server size={24} className="text-blue-600" /> Hostgroup & Hostname Management</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">The Asset Management module allows you to organize your server infrastructure into logical <b>Hostgroups</b> and define individual <b>Hostnames</b> with detailed hardware configurations.</p>
                            <ul className="space-y-3">
                                {[
                                    { label: "Create/Edit Hostgroups", desc: "Group servers for easier access and permission management." },
                                    { label: "Manage Hostnames", desc: "Register new servers and define specs (OS, CPU, RAM, Disk)." },
                                    { label: "Dynamic Discovery", desc: "Newly registered hosts are prepared for automated SAR data collection." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} /></div>
                                        <div className="text-sm text-slate-500"><b>{item.label}:</b> {item.desc}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col justify-center shadow-inner">
                            <p className="text-slate-400 capitalize  text-[9px] mb-4">Quick Access Path</p>
                            <p className="text-base text-slate-800 mb-3 capitalize italic tracking-tight">Navigate to:</p>
                            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-blue-600 flex items-center gap-2 shadow-sm">
                                Inventory <ChevronRight size={14} className="text-slate-300" /> Manage Assets
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* 2. Performance Analysis */}
            <Section title="Performance Analysis" icon={Activity}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="modern-card p-8 sm:p-10 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <BarChart3 size={24} />
                        </div>
                        <h4 className="text-xl text-slate-900 mb-4 capitalize italic tracking-tight">Sarlog</h4>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">Access daily and monthly performance snapshots for specific servers with high-resolution interactive charts.</p>
                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 text-[10px] text-emerald-800 uppercase ">
                            Navigate to <b>Sarlog</b> tab. Select specific Hostgroup, Hostname, and Date Range.
                        </div>
                    </div>
                    <div className="modern-card p-8 sm:p-10 transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Database size={24} />
                        </div>
                        <h4 className="text-xl text-slate-900 mb-4 capitalize italic tracking-tight">Utilization</h4>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed font-medium">View long-term utilization statistics to identify resource bottlenecks and plan for capacity upgrades.</p>
                        <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 text-[10px] text-purple-800 uppercase ">
                            Navigate to <b>Utilization</b> tab. Compare CPU or Memory stats across the last 12 months.
                        </div>
                    </div>
                </div>
            </Section>

            {/* 3. Automated Performance Reporting */}
            <Section title="Automated Performance Reporting" icon={FileText}>
                <div className="modern-card p-8 sm:p-10 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20} /></div>
                                <h4 className="text-lg text-slate-900 capitalize italic tracking-tight">Generate Report (Manual)</h4>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Ad-hoc report generation for specific timeframes or host selection.</p>
                            <ol className="space-y-3">
                                {[
                                    "Navigate to Report > Generate Report",
                                    "Click Quick Gen Report button",
                                    "Select hostgroup/hosts from tree",
                                    "Configure date/time range",
                                    "Click Generate PDF"
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 font-bold">
                                        <span className="text-blue-300">0{i + 1}.</span> {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Zap size={20} /></div>
                                <h4 className="text-lg text-slate-900 capitalize italic tracking-tight">Batch Report (Automated)</h4>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">Recurring, large-scale reports based on pre-configured templates.</p>
                            <ol className="space-y-3">
                                {[
                                    "Navigate to Report > Batch Report",
                                    "Select template, month, and year",
                                    "Click Start Batch to trigger background job",
                                    "Monitor job status in the table"
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-600 font-bold">
                                        <span className="text-amber-300">0{i + 1}.</span> {step}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    </div>

                    {/* Template Creation */}
                    <div className="pt-10 border-t border-slate-50">
                        <h4 className="text-xl text-slate-900 mb-8 flex items-center gap-3 capitalize italic tracking-tight"><Layout size={24} className="text-indigo-600" /> Creating Report Templates</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { step: "Initialize", desc: "In 'Batch Report', click the '+ Create New Template' button." },
                                { step: "Define Meta", desc: "Enter a unique template name and PDF header title." },
                                { step: "Scope Selection", desc: "Choose target hostgroups and specific hosts from the tree." },
                                { step: "Chart Layout", desc: "Select and order metrics (CPU/Mem) to define the report layout." },
                            ].map((item, idx) => (
                                <div key={idx} className="bg-indigo-50/50 p-6 rounded-[1.5rem] border border-indigo-100 flex flex-col justify-between group hover:bg-indigo-600 transition-all duration-300 shadow-inner">
                                    <div className="text-slate-400 capitalize  text-[9px] mb-4 group-hover:text-indigo-200">Step 0{idx + 1}</div>
                                    <div>
                                        <p className="text-sm text-indigo-900 mb-2 group-hover:text-white capitalize italic tracking-tight">{item.step}</p>
                                        <p className="text-xs text-indigo-700 font-medium leading-relaxed group-hover:text-indigo-100">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Technical Deep Dive */}
                    <div className="pt-10 border-t border-slate-50">
                        <h4 className="text-xl text-slate-900 mb-8 capitalize italic tracking-tight">Execution & Automation</h4>
                        <div className="bg-slate-900 p-8 rounded-[2rem] text-slate-300 font-mono text-[11px] shadow-2xl overflow-hidden relative border border-slate-800">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Terminal size={100} /></div>
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-3">
                                    <p className="text-slate-400 capitalize  text-[9px] flex items-center justify-between">
                                        CLI Trigger <CopyButton text="npm run generate-monthly-report -- --templateId=5 --jobId=manual_run_001" />
                                    </p>
                                    <code className="block bg-black/40 p-4 rounded-xl border border-white/5 text-slate-300">npm run generate-monthly-report -- --templateId=5 --jobId=manual_run_001</code>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-slate-400 capitalize  text-[9px] flex items-center justify-between">
                                        Cron Automation <CopyButton text="0 3 1 * * docker exec mperf-app npm run generate-monthly-report -- --templateId=5 --jobId=cron_id_$(date +%Y%m%d)" />
                                    </p>
                                    <code className="block bg-black/40 p-4 rounded-xl border border-white/5 text-slate-300 leading-relaxed whitespace-pre-wrap text-[10px]">0 3 1 * * docker exec mperf-app npm run generate-monthly-report -- --templateId=5 --jobId=cron_job_$(date +%Y%m%d_%H%M%S)</code>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </div>
    );
}
