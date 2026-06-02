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
    <h3 className="text-xs font-bold text-gray-400 capitalize tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function IngestionDBGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 animate-ease-in pb-32">
      <header className="mb-24 text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-black capitalize tracking-[0.2em] mb-8 border border-blue-100 shadow-sm shadow-blue-500/5">
          <Database size={16} /> Technical Architecture
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-6 capitalize italic">Ingestion Pipeline</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">Deep documentation for the SAR autonomous extraction engine and multi-dimensional database schema.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* 1. System Overview */}
        <Section title="Processing sequence" icon={<Database size={18} className="text-blue-600"/>}>
            <div className="space-y-6">
            {[
                { step: "01", title: "Autonomous Scanning", desc: "Recursive directory detection powered by sector-based hostgroup mapping.", icon: <Search className="w-5 h-5" /> },
                { step: "02", title: "Regular Filtering", desc: "Advanced Regex resolution for high-fidelity SAR object location.", icon: <Layers className="w-5 h-5" /> },
                { step: "03", title: "Metric Normalization", desc: "Temporal standardization and cryptographic deduplication sequence.", icon: <Clock className="w-5 h-5" /> },
                { step: "04", title: "Transactional Persistence", desc: "High-throughput writes into optimized partition-level tables.", icon: <Database className="w-5 h-5" /> },
                { step: "05", title: "Audit Traceability", desc: "Granular logging of emission results into the global audit stream.", icon: <Terminal className="w-5 h-5" /> },
            ].map((item, idx) => (
                <div key={item.step} className="relative flex gap-8 pb-10 group last:pb-0">
                {idx < 4 && <div className="absolute left-[31px] top-14 bottom-0 w-1 bg-slate-100 rounded-full"></div>}
                
                <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm z-10 flex-shrink-0 group-hover:border-blue-500 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/10">
                    {item.icon}
                </div>
                <div className="pt-2">
                    <span className="text-blue-600 font-black text-xs capitalize tracking-[0.2em]">{item.step} Stage</span>
                    <h4 className="font-black text-slate-900 text-base mt-1 mb-2 capitalize tracking-tight">{item.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">{item.desc}</p>
                </div>
                </div>
            ))}
            </div>
        </Section>

        {/* 2. Operation Modes */}
        <Section title="Execution Strategies" icon={<Terminal size={18} className="text-blue-600"/>}>
            <div className="space-y-6">
            {[
                { title: 'Rolling Yesterday', desc: "Autonomous target resolution for nodes emitted in the previous 24h cycle.", icon: <Clock className="text-orange-500 w-5 h-5" />, color: 'orange' },
                { title: 'Targeted Date', desc: "Manual surgical ingestion for specific historical chronological points.", icon: <Calendar className="text-blue-500 w-5 h-5" />, color: 'blue' },
                { title: 'Full Cycle Archival', desc: "Consolidated bulk processing for an entire specified fiscal month.", icon: <Calendar className="text-emerald-500 w-5 h-5" />, color: 'emerald' }
            ].map((mode, idx) => (
                <div key={mode.title} className="relative flex gap-8 pb-12 group last:pb-0">
                {idx < 2 && <div className="absolute left-[31px] top-14 bottom-0 w-1 bg-slate-100 rounded-full"></div>}
                
                <div className={`w-16 h-16 rounded-[1.25rem] bg-white border border-slate-100 flex items-center justify-center shadow-sm z-10 flex-shrink-0 group-hover:border-${mode.color}-500 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg`}>
                    {mode.icon}
                </div>
                <div className="pt-3">
                    <h4 className="font-black text-slate-900 text-base mb-2 capitalize tracking-tight">{mode.title}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed font-medium">{mode.desc}</p>
                </div>
                </div>
            ))}
            </div>
        </Section>
      </div>

      {/* 3. Usage Interfaces */}
      <Section title="Interaction Interfaces" icon={<Globe size={18} className="text-blue-600"/>}>
        <div className="modern-card overflow-hidden p-12 space-y-20">
            
            {/* Web UI */}
            <div>
                <div className="flex items-center justify-between mb-10">
                    <h4 className="font-black text-slate-900 text-xl flex items-center gap-4 capitalize italic tracking-tight"><Globe size={24} className="text-blue-600" /> Web Console</h4>
                    <span className="bg-slate-100 text-slate-400 px-4 py-1 rounded-full text-xs font-black capitalize tracking-widest border border-slate-200 shadow-inner">Operational UI</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {[
                        { step: "01", label: "Navigation", detail: "Authorized Profile > SAR Management Dashboard > Pipeline Ingestion." },
                        { step: "02", label: "Parameters", detail: "Configure Ingestion Strategy, Sector, Node target, and OS type." },
                        { step: "03", label: "Context", detail: "Specify chronological points (day/month) in the logic panel." },
                        { step: "04", label: "Emission", detail: "Authorize 'Start Ingestion' and monitor the real-time stream log." }
                    ].map(item => (
                        <div key={item.step} className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col gap-5 shadow-inner transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-xs font-black group-hover:bg-blue-600 transition-colors shadow-lg">{item.step}</div>
                            <div className="space-y-2">
                                <p className="font-black text-slate-900 text-xs capitalize tracking-widest">{item.label}</p>
                                <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{item.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CLI & API */}
            <div className="pt-16 border-t border-slate-100 space-y-16">
                <div>
                    <h5 className="text-emerald-600 font-black mb-8 flex items-center gap-3 text-sm capitalize tracking-[0.3em]"><Terminal size={24}/> CLI Core (Automation)</h5>
                    <div className="space-y-8">
                        {[
                            { desc: "Specific target for Datawarehouse cluster", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --hostgroup Datawarehouse --dataType cpu --day "2026-05-19"' },
                            { desc: "Consolidated monthly archival for global fleet", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --dataType mem --month May --year 2026' },
                            { desc: "Autonomous rolling yesterday for unified metrics", cmd: 'npx ts-node MPERF/scripts/ingest_sar.ts --dataType All' }
                        ].map((ex, i) => (
                            <div key={i} className="relative group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    <p className="text-slate-400 text-xs font-black capitalize tracking-[0.2em]"># {ex.desc}</p>
                                </div>
                                <code className="block bg-slate-950 p-6 rounded-[1.5rem] text-blue-400 text-xs font-mono shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-800 group-hover:border-emerald-500/30 transition-all duration-500">{ex.cmd}</code>
                                <div className="absolute right-4 top-[52px]">
                                    <CopyButton text={ex.cmd} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <h5 className="text-sky-600 font-black mb-8 flex items-center gap-3 text-sm capitalize tracking-[0.3em]"><Globe size={24}/> API REST Integration</h5>
                    <div className="flex gap-4 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 mb-8 items-center max-w-fit">
                        <span className="text-xs font-black text-blue-400 capitalize tracking-widest">ENDPOINT</span>
                        <code className="bg-white px-4 py-1 rounded-xl border border-blue-200 text-blue-600 font-black text-xs">/api/admin/ingest</code>
                    </div>
                    <div className="space-y-8">
                        {[
                            { desc: "POST Payload: Chronological Point", payload: '{ "mode": "specific", "date": "2026-05-19", "dataType": "cpu" }' },
                            { desc: "POST Payload: Consolidated Sector Cycle", payload: '{ "mode": "month", "month": "May", "year": "2026", "hostgroup": "Datawarehouse", "dataType": "mem" }' }
                        ].map((ex, i) => (
                            <div key={i} className="relative group">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                                    <p className="text-slate-400 text-xs font-black capitalize tracking-[0.2em]"># {ex.desc}</p>
                                </div>
                                <code className="block bg-slate-950 p-6 rounded-[1.5rem] text-sky-400 text-xs font-mono shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-800 group-hover:border-sky-500/30 transition-all duration-500">{ex.payload}</code>
                                <div className="absolute right-4 top-[52px]">
                                    <CopyButton text={ex.payload} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </Section>

      {/* 4. Parameter Reference */}
      <Section title="Schema Reference" icon={<Layers size={18} className="text-blue-600"/>}>
        <div className="modern-card overflow-hidden bg-white">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-100">
                <tr className="text-slate-400 capitalize text-[9px] tracking-[0.2em] font-black">
                    <th className="px-10 py-6">Key Indicator</th>
                    <th className="px-10 py-6">Validated Format</th>
                    <th className="px-10 py-6 text-right">Functional Description</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-600">
                {[
                    { p: "mode", f: "yesterday | specific | month", d: "Core logic selection for target resolution" },
                    { p: "date", f: "YYYY-MM-DD", d: "Historical point for specific surgical mode" },
                    { p: "month", f: "Jan - Dec", d: "Target fiscal period for monthly archival" },
                    { p: "year", f: "YYYY", d: "Fiscal cycle resolution" },
                    { p: "hostgroup", f: "Identity String", d: "Infrastructure sector filter (Omit for Global)" },
                    { p: "dataType", f: "cpu | mem | All", d: "Primary resource dimension" },
                    { p: "os", f: "RedHat | Solaris | All", d: "Platform architecture filter" },
                ].map((row) => (
                    <tr key={row.p} className="hover:bg-blue-50/30 transition-all duration-200 group">
                    <td className="px-10 py-5 font-black text-blue-600 text-xs capitalize tracking-tight group-hover:translate-x-1 transition-transform">{row.p}</td>
                    <td className="px-10 py-5 text-slate-400 font-mono text-xs bg-slate-50/30">{row.f}</td>
                    <td className="px-10 py-5 text-right text-[11px] font-bold text-slate-500">{row.d}</td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* 5. Critical Guidelines */}
      <Section title="Operational Protocols" icon={<ShieldCheck size={18} className="text-blue-600"/>}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="bg-amber-50/30 border border-amber-100 rounded-[2.5rem] p-10 flex gap-8 items-start shadow-sm transition-all hover:shadow-xl hover:shadow-amber-500/5 group">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm border border-amber-100 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 group-hover:bg-amber-500 group-hover:text-white">
                    <AlertTriangle size={28} />
                </div>
                <div>
                    <h4 className="font-black text-amber-900 text-base capitalize tracking-tight mb-3 italic">Resource Threshold</h4>
                    <p className="text-amber-800/70 text-xs leading-relaxed font-bold capitalize tracking-tight">Global fleet scans (<b>"Global"</b> scope) are computationally intensive. Delegate these tasks to the <b>CLI Engine</b> during off-peak windows.</p>
                </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex gap-8 items-start shadow-2xl transition-all hover:shadow-blue-900/20 group">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0 group-hover:scale-110 transition-transform duration-500 group-hover:bg-blue-600 group-hover:text-white">
                    <Clock size={28} />
                </div>
                <div>
                    <h4 className="font-black text-white text-base capitalize tracking-tight mb-3 italic">Retention Lifecycle</h4>
                    <p className="text-slate-400 text-xs leading-relaxed font-bold capitalize tracking-tight">Audit logs in <code>insertion_logs</code> are purged after <b>90 cycles</b>. Synchronize critical audit data with external archives periodically.</p>
                </div>
            </div>
        </div>
      </Section>
    </div>
  );
}
