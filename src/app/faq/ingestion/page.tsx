'use client';

import React, { useState } from 'react';
import { Copy, Check, Terminal, Globe, ChevronRight, AlertTriangle, ShieldCheck, Database, Calendar, Clock, Layers, Search } from 'lucide-react';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute right-3 top-3 p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all border border-gray-600"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-gray-400" />}
    </button>
  );
};

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function IngestionDBGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <header className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
          <Database size={14} /> System Reference
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Ingestion Database Guide</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Technical documentation for the SAR log data ingestion pipeline and database architecture.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 1. System Overview */}
        <Section title="1. System Overview">
            <div className="space-y-6">
            {[
                { step: "01", title: "Scanning", desc: "Detects data directories based on Hostgroup.", icon: <Search className="w-4 h-4" /> },
                { step: "02", title: "Filtering", desc: "Uses Regex to locate relevant SAR files.", icon: <Layers className="w-4 h-4" /> },
                { step: "03", title: "Processing", desc: "Standardizes timestamps and deduplicates.", icon: <Clock className="w-4 h-4" /> },
                { step: "04", title: "Persistence", desc: "Writes to optimized partition tables.", icon: <Database className="w-4 h-4" /> },
                { step: "05", title: "Logging", desc: "Audits operation results and logs.", icon: <Terminal className="w-4 h-4" /> },
            ].map((item, idx) => (
                <div key={item.step} className="relative flex gap-6 pb-6 group">
                {idx < 4 && <div className="absolute left-6 top-10 bottom-0 w-px bg-gray-200"></div>}
                
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm z-10 flex-shrink-0 group-hover:border-blue-500 transition-colors">
                    {item.icon}
                </div>
                <div className="pt-1">
                    <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">{item.step}</span>
                    <h4 className="font-bold text-gray-900 text-sm mt-0.5 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-xs leading-relaxed">{item.desc}</p>
                </div>
                </div>
            ))}
            </div>
        </Section>

        {/* 2. Operation Modes */}
        <Section title="2. Operation Modes">
            <div className="space-y-6">
            {[
                { title: 'Yesterday', desc: "Automatically targets files from the previous day.", icon: <Clock className="text-orange-500" /> },
                { title: 'Specific Date', desc: "Manual ingestion for a specific historical date.", icon: <Calendar className="text-blue-500" /> },
                { title: 'Full Month', desc: "Bulk processing for an entire specified month.", icon: <Calendar className="text-emerald-500" /> }
            ].map((mode, idx) => (
                <div key={mode.title} className="relative flex gap-6 pb-8 group">
                {idx < 2 && <div className="absolute left-6 top-10 bottom-0 w-px bg-gray-200"></div>}
                
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shadow-sm z-10 flex-shrink-0 group-hover:border-blue-500 transition-colors">
                    {mode.icon}
                </div>
                <div className="pt-2">
                    <h4 className="font-bold text-gray-900 text-sm mb-1">{mode.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{mode.desc}</p>
                </div>
                </div>
            ))}
            </div>
        </Section>
      </div>

      {/* 3. Usage Interfaces */}
      <Section title="3. Usage Interfaces">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden p-8 space-y-12">
            
            {/* Web UI */}
            <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-3 mb-6"><Globe size={18} className="text-blue-600" /> Web User Interface</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                        { step: "01", label: "Navigate", detail: "Go to User Profile > SAR Management Dashboard > Ingestion." },
                        { step: "02", label: "Configure", detail: "Select Ingestion Mode, Hostgroup, Hostname, and OS." },
                        { step: "03", label: "Set Date", detail: "Provide specific day/month details in the configuration panel." },
                        { step: "04", label: "Execute", detail: "Click 'Start Ingestion' and monitor the process log below." }
                    ].map(item => (
                        <div key={item.step} className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col gap-3">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">{item.step}</div>
                            <p className="font-bold text-gray-900 text-xs">{item.label}</p>
                            <p className="text-gray-500 text-[11px] leading-relaxed">{item.detail}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* CLI & API */}
            <div className="pt-10 border-t border-gray-100 space-y-12">
                <div>
                    <h5 className="text-emerald-600 font-bold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider"><Terminal size={18}/> CLI (Automation)</h5>
                    <div className="space-y-6">
                        {[
                            { desc: "Specific date for Datawarehouse", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --hostgroup Datawarehouse --dataType cpu --day "2026-05-19"' },
                            { desc: "Full Month for all systems", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --dataType mem --month May --year 2026' },
                            { desc: "Yesterday mode for all hosts", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --dataType All' }
                        ].map((ex, i) => (
                            <div key={i} className="relative group">
                                <p className="text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-wide"># {ex.desc}</p>
                                <code className="block bg-gray-900 p-4 rounded-2xl text-gray-100 text-[11px] font-mono shadow-inner">{ex.cmd}</code>
                                <CopyButton text={ex.cmd} />
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h5 className="text-sky-600 font-bold mb-6 flex items-center gap-2 text-xs uppercase tracking-wider"><Globe size={18}/> API Integration</h5>
                    <p className="text-gray-400 text-[10px] mb-4">Endpoint: <code className="bg-gray-800 px-2 py-0.5 rounded text-gray-100">https://localhost/api/admin/ingest</code></p>
                    <div className="space-y-6">
                        {[
                            { desc: "POST Request: Specific Date", payload: '{ "mode": "specific", "date": "2026-05-19", "dataType": "cpu" }' },
                            { desc: "POST Request: Full Month", payload: '{ "mode": "month", "month": "May", "year": "2026", "hostgroup": "Datawarehouse", "dataType": "mem" }' },
                            { desc: "POST Request: Yesterday", payload: '{ "mode": "yesterday", "dataType": "All" }' }
                        ].map((ex, i) => (
                            <div key={i} className="relative group">
                                <p className="text-gray-500 text-[10px] font-bold mb-2 uppercase tracking-wide"># {ex.desc}</p>
                                <code className="block bg-gray-900 p-4 rounded-2xl text-gray-100 text-[11px] font-mono shadow-inner">{ex.payload}</code>
                                <CopyButton text={ex.payload} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </Section>

      {/* 4. Parameter Reference */}
      <Section title="4. Parameter Reference">
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100 text-gray-500 uppercase text-[10px] tracking-wider font-black">
              <tr>
                <th className="px-8 py-5">Parameter</th>
                <th className="px-8 py-5">Accepted Format</th>
                <th className="px-8 py-5 text-right">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {[
                { p: "mode", f: "yesterday, specific, month", d: "Ingestion logic selector" },
                { p: "date", f: "YYYY-MM-DD", d: "Target date for specific mode" },
                { p: "month", f: "Jan - Dec", d: "Target month for month mode" },
                { p: "year", f: "YYYY", d: "Specified year" },
                { p: "hostgroup", f: "String", d: "Server group filter (Omit for All)" },
                { p: "hostname", f: "String", d: "Target hostname" },
                { p: "dataType", f: "cpu, mem, All", d: "Metrics category" },
                { p: "os", f: "RedHat, Solaris, All", d: "Source OS filter" },
              ].map((row) => (
                <tr key={row.p} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-black text-blue-600 text-xs">{row.p}</td>
                  <td className="px-8 py-5 text-gray-900 font-mono text-[10px]">{row.f}</td>
                  <td className="px-8 py-5 text-right text-[11px] font-medium">{row.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 5. Critical Guidelines */}
      <Section title="5. Critical Guidelines">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-amber-50 border border-amber-200 rounded-[32px] p-8 flex gap-6 items-start shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 flex-shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-tight mb-2">Resource Warning</h4>
                    <p className="text-amber-800 text-xs leading-relaxed font-medium">Running a global scan (<b>"All"</b> scope) is resource-intensive. Perform these tasks via <b>CLI</b> or <b>Cron Job</b> during off-peak hours to ensure system stability.</p>
                </div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-[32px] p-8 flex gap-6 items-start shadow-xl">
                <div className="w-12 h-12 rounded-2xl bg-gray-800 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
                    <Clock size={24} />
                </div>
                <div>
                    <h4 className="font-black text-white text-sm uppercase tracking-tight mb-2">Log Retention</h4>
                    <p className="text-gray-400 text-xs leading-relaxed font-medium">Data in <code>insertion_logs</code> is kept for <b>90 days</b>. Please ensure you export necessary historical logs before they are automatically purged.</p>
                </div>
            </div>
        </div>
      </Section>
    </div>
  );
}
