'use client';

import React from 'react';
import { Package, FileText, ChevronRight, ShieldCheck, Database, Server, Settings, BarChart3, Activity } from 'lucide-react';

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
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
      <Section title="1. Manage Assets" icon={<Package size={16} className="text-blue-500"/>}>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Server size={18} className="text-blue-600"/> Hostgroup & Hostname Management</h4>
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

      {/* 2. Sarlog & Utilization */}
      <Section title="2. Performance Analysis" icon={<Activity size={16} className="text-blue-500"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-emerald-600"/> Sarlog</h4>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">Access daily and monthly performance snapshots for specific servers.</p>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 font-medium">
                    Navigate to <b>Sarlog</b> tab. Select specific Hostgroup, Hostname, and Date Range to generate visualization charts.
                </div>
            </div>
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
                <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><Database size={18} className="text-purple-600"/> Utilization</h4>
                <p className="text-xs text-gray-600 mb-4 leading-relaxed">View long-term utilization statistics to identify resource bottlenecks.</p>
                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 text-[11px] text-purple-800 font-medium">
                    Navigate to <b>Utilization</b> tab. Compare CPU or Memory stats across the last 12 months for selected Hostgroups.
                </div>
            </div>
        </div>
      </Section>

      {/* 3. Generate Report */}
      <Section title="3. Generate Report" icon={<FileText size={16} className="text-blue-500"/>}>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Automated Performance Reporting</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <p className="text-xs text-gray-600 leading-relaxed">Generate PDF reports summarizing CPU and Memory performance metrics over specified time ranges.</p>
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-2">Steps</h5>
                        <ol className="list-decimal pl-5 text-[11px] text-blue-800 space-y-1 font-medium">
                            <li>Go to <b>Report &gt; Generate Report</b>.</li>
                            <li>Select your desired <b>Hostgroups</b> and <b>Hosts</b> from the tree view.</li>
                            <li>Configure <b>Date Ranges</b> or <b>Monthly Periods</b>.</li>
                            <li>Choose and order <b>Charts</b> you wish to include.</li>
                            <li>Click <b>"Generate PDF"</b> to export the final report.</li>
                        </ol>
                    </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Pro Tips</p>
                    <ul className="list-none space-y-3 text-xs text-gray-700">
                        <li className="flex gap-2"><Settings size={14} className="text-blue-500 mt-0.5"/> Save frequent configurations as <b>Templates</b>.</li>
                        <li className="flex gap-2"><Database size={14} className="text-blue-500 mt-0.5"/> Ensure data ingestion is complete for selected periods.</li>
                    </ul>
                </div>
            </div>
        </div>
      </Section>
    </div>
  );
}
