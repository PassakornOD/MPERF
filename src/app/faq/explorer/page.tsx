'use client';

import React from 'react';
import { Database, Search, Trash2, ChevronRight, ShieldCheck, AlertTriangle, Terminal, Globe, Copy, Check } from 'lucide-react';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute right-3 top-3 p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-slate-600"
      title="Copy to clipboard"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-muted-foreground" />}
    </button>
  );
};

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-muted-foreground capitalize  text-xl mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function ExplorerGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs capitalize  mb-6 border border-purple-100 shadow-sm">
          <ShieldCheck size={14} /> Database Reference
        </div>
        <h1 className="text-5xl text-foreground capitalize italic tracking-tight mb-4">Explorer DB Guide</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">Technical reference for querying performance metrics and managing database maintenance operations.</p>
      </header>

      {/* 1. Querying & Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Section title="1. Querying Data" icon={<Search size={16} className="text-purple-500" />}>
          <div className="modern-card p-8 h-full">
            <h4 className="text-foreground mb-6 flex items-center gap-2 capitalize italic tracking-tight"><Database size={18} className="text-purple-600" /> Interactive Query Workflow</h4>
            <ol className="list-decimal pl-5 space-y-4 text-xs text-slate-600 font-medium leading-relaxed">
              <li>Navigate to <b>User Profile &gt; SAR Management Dashboard &gt; Explorer</b>.</li>
              <li>Select <b>Metric Type</b> (CPU/Memory).</li>
              <li>Configure the <b>Filter Level</b> (Year/Month/Day) and select the specific <b>Hostgroup</b> and <b>Hostname</b>.</li>
              <li>Click <b>"Query"</b> to view the results in the dashboard's data table.</li>
            </ol>
          </div>
        </Section>

        <Section title="2. Maintenance" icon={<Trash2 size={16} className="text-red-500" />}>
          <div className="modern-card p-8 h-full">
            <h4 className="text-foreground mb-6 flex items-center gap-2 capitalize italic tracking-tight"><Trash2 size={18} className="text-red-600" /> Data Deletion & Purging</h4>
            <div className="bg-red-50 p-6 rounded-xl border border-red-100 mb-6">
              <div className="text-[11px] text-red-900 leading-relaxed flex gap-2">
                <AlertTriangle className="flex-shrink-0 text-red-600 w-4 h-4" />
                <span><b>Warning:</b> All deletion operations are permanent.</span>
              </div>
            </div>
            <div className="space-y-4">
              <h5 className="text-muted-foreground capitalize  text-[9px]">Methods</h5>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-600">
                <li><b>Individual Records:</b> Delete specific entries from the query result table.</li>
                <li><b>Bulk Maintenance:</b> Use the dashboard control panel to purge data by criteria (e.g., Year, Hostgroup).</li>
                <li><b>Automated:</b> System logs (<code>insertion_logs</code>) are automatically purged every 90 days.</li>
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* 3. API Integration */}
      <Section title="3. API Integration" icon={<Globe size={16} className="text-sky-500" />}>
        <div className="bg-[#0f172a] p-10 rounded-[2rem] shadow-2xl text-slate-300 font-mono text-[11px]">
          <div className="grid grid-cols-1 md:grid-row-2 gap-12">
            <div>
              <h5 className="text-sky-400 mb-6 flex items-center gap-2 text-xs capitalize "><Globe size={18} /> Data Retrieval</h5>
              <p className="text-muted-foreground text-xs mb-4">Endpoint: <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-100">GET /api/admin/sar-data</code></p>
              <div className="relative group">
                <code className="block bg-[#1e293b] p-4 rounded-xl text-slate-100 border border-slate-800/50">curl -X GET "https://localhost/api/admin/sar-data?hostgroup=Datawarehouse&type=cpu&level=year&year=2026"</code>
                <CopyButton text='curl -X GET "https://localhost/api/admin/sar-data?hostgroup=Datawarehouse&type=cpu&level=year&year=2026"' />
              </div>
            </div>
            <div>
              <h5 className="text-red-400 mb-6 flex items-center gap-2 text-xs capitalize "><Trash2 size={18} /> Data Deletion</h5>
              <p className="text-muted-foreground text-xs mb-4">Endpoint: <code className="bg-slate-800 px-2 py-0.5 rounded text-slate-100">POST /api/admin/sar-data/delete</code></p>
              <div className="relative group">
                <code className="block bg-[#1e293b] p-4 rounded-xl text-slate-100 border border-slate-800/50">{`{ "hostgroup": "Datawarehouse", "type": "cpu", "level": "year", "year": "2026" }`}</code>
                <CopyButton text='{ "hostgroup": "Datawarehouse", "type": "cpu", "level": "year", "year": "2026" }' />
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 4. Parameter Reference */}
      <Section title="4. Parameter Reference">
        <div className="modern-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background/80 border-b border-border text-muted-foreground capitalize text-xs">
              <tr>
                <th className="px-8 py-5">Parameter</th>
                <th className="px-8 py-5">Format</th>
                <th className="px-8 py-5 text-right">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-600">
              {[
                { p: "type", f: "cpu, mem", d: "Metric category" },
                { p: "level", f: "year, month, day, all", d: "Query/Maintenance scope" },
                { p: "hostgroup", f: "String", d: "Target server group" },
                { p: "hostname_id", f: "Integer", d: "Server ID (Optional)" },
                { p: "year", f: "YYYY", d: "Required if level != all" },
                { p: "month", f: "01 - 12", d: "Required for month/day" },
                { p: "day", f: "01 - 31", d: "Required for day level" },
              ].map((row) => (
                <tr key={row.p} className="hover:bg-background/50 transition-colors">
                  <td className="px-8 py-5 text-purple-600 text-xs tracking-tight">{row.p}</td>
                  <td className="px-8 py-5 text-foreground font-mono text-xs">{row.f}</td>
                  <td className="px-8 py-5 text-right text-[11px] font-bold text-muted-foreground">{row.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
