'use client';

import React from 'react';
import { Terminal, ShieldCheck, Container, FileText, ChevronRight, Check } from 'lucide-react';

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-xs font-bold text-slate-400 capitalize tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function DockerGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-20 animate-ease-in pb-32">
      <header className="mb-24 text-center">
        <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 text-blue-600 text-xs font-black capitalize tracking-[0.2em] mb-8 border border-blue-100 shadow-sm shadow-blue-500/5">
          <ShieldCheck size={16} /> Deployment Architecture
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tight mb-6 capitalize italic">Docker Runtime Guide</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">Standardized instructions for containerizing and deploying the Metrisar infrastructure analytics environment.</p>
      </header>

      {/* 1. Prerequisites */}
      <Section title="Operational Prerequisites" icon={<Container size={18} className="text-blue-600"/>}>
        <div className="modern-card p-10 bg-white">
            <ul className="space-y-6 text-sm text-slate-600 font-bold leading-relaxed">
                <li className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={4} /></div>
                    <span><b>Docker Engine</b> installed and active (v24.0+ recommended)</span>
                </li>
                <li className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={4} /></div>
                    <span><b>Docker Compose</b> plugin integrated (v2.20+)</span>
                </li>
                <li className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5"><Check size={14} strokeWidth={4} /></div>
                    <span>Authorized shell access to the project root directory</span>
                </li>
            </ul>
        </div>
      </Section>

      {/* 2. Build & Run */}
      <Section title="Emission & Orchestration" icon={<Terminal size={18} className="text-blue-600"/>}>
        <div className="bg-slate-950 p-12 rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] text-slate-300 font-mono text-xs border border-slate-800">
            <div className="space-y-10">
                <div className="relative group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <p className="text-slate-500 font-black capitalize tracking-[0.2em] text-xs"># 01. Build production image set</p>
                    </div>
                    <code className="block bg-slate-900/50 p-6 rounded-xl text-blue-400 border border-slate-800/50 shadow-inner group-hover:border-blue-500/30 transition-all duration-300">
                      docker build -t mperf-app .
                    </code>
                </div>
                <div className="relative group">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2 h-2 rounded-full bg-slate-700"></div>
                        <p className="text-slate-500 font-black capitalize tracking-[0.2em] text-xs"># 02. Deploy services via Compose</p>
                    </div>
                    <code className="block bg-slate-900/50 p-6 rounded-xl text-emerald-400 border border-slate-800/50 shadow-inner group-hover:border-emerald-500/30 transition-all duration-300">
                      docker-compose up -d
                    </code>
                </div>
            </div>
        </div>
      </Section>

      {/* 3. Environment Variables */}
      <Section title="Variable Configuration" icon={<FileText size={18} className="text-blue-600"/>}>
        <div className="modern-card p-10 bg-white">
            <div className="flex gap-4 p-5 bg-blue-50/50 rounded-xl border border-blue-100 mb-8 items-center">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0"><FileText size={20} /></div>
                <p className="text-xs text-blue-800 font-bold">Initialize a <code className="bg-white px-2 py-0.5 rounded border border-blue-200">.env</code> file in the project root by cloning <code className="bg-white px-2 py-0.5 rounded border border-blue-200">.env.example</code>.</p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-[2rem] text-slate-600 font-mono text-xs border border-slate-100 shadow-inner">
                <div className="space-y-3">
                    <p className="flex gap-4"><span className="text-slate-300 select-none">01</span> DATABASE_URL=mysql://admin:secret@mperf-db:3306/sarlog</p>
                    <p className="flex gap-4"><span className="text-slate-300 select-none">02</span> NEXTAUTH_URL=http://localhost:3000</p>
                    <p className="flex gap-4"><span className="text-slate-300 select-none">03</span> NEXTAUTH_SECRET=system_cryptographic_seed_0xff</p>
                </div>
            </div>
        </div>
      </Section>
    </div>
  );
}
