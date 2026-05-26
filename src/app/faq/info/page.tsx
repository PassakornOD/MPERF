'use client';

import React from 'react';
import { Terminal, ShieldCheck, Container, FileText, ChevronRight, Check } from 'lucide-react';

const Section = ({ title, children, icon }: { title: string, children: React.ReactNode, icon?: React.ReactNode }) => (
  <section className="mb-16">
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8 flex items-center gap-2">
      {icon ? icon : <ChevronRight size={16} className="text-blue-500" />} {title}
    </h3>
    {children}
  </section>
);

export default function DockerGuidePage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <header className="mb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-blue-100 shadow-sm">
          <ShieldCheck size={14} /> Deployment Guide
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-4">Docker Build Guide</h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">Instructions for containerizing and deploying the MPERF application environment.</p>
      </header>

      {/* 1. Prerequisites */}
      <Section title="1. Prerequisites" icon={<Container size={16} className="text-blue-500"/>}>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <ul className="list-disc pl-5 space-y-4 text-xs text-gray-600 font-medium leading-relaxed">
                <li><b>Docker Desktop</b> or <b>Docker Engine</b> installed (v20.10+).</li>
                <li><b>Docker Compose</b> (v2.0+).</li>
                <li>Ensure access to the project root directory.</li>
            </ul>
        </div>
      </Section>

      {/* 2. Build & Run */}
      <Section title="2. Build & Run" icon={<Terminal size={16} className="text-blue-500"/>}>
        <div className="bg-[#0f172a] p-10 rounded-[40px] shadow-2xl text-gray-300 font-mono text-[11px]">
            <div className="space-y-8">
                <div className="relative group">
                    <p className="text-gray-500 mb-2 font-bold uppercase tracking-wide"># 1. Build the production image</p>
                    <code className="block bg-[#1e293b] p-4 rounded-2xl text-gray-100 border border-gray-800/50">docker build -t mperf-web .</code>
                </div>
                <div className="relative group">
                    <p className="text-gray-500 mb-2 font-bold uppercase tracking-wide"># 2. Start services with Docker Compose</p>
                    <code className="block bg-[#1e293b] p-4 rounded-2xl text-gray-100 border border-gray-800/50">docker-compose up -d</code>
                </div>
            </div>
        </div>
      </Section>

      {/* 3. Environment Variables */}
      <Section title="3. Environment Setup" icon={<FileText size={16} className="text-blue-500"/>}>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-8">
            <p className="text-xs text-gray-600 mb-6">Create a <code>.env</code> file in the project root based on <code>.env.example</code>.</p>
            <div className="bg-gray-900 p-6 rounded-2xl text-gray-300 font-mono text-[11px]">
                <p>DATABASE_URL=mysql://user:password@db_host:3306/sarlog</p>
                <p>NEXTAUTH_URL=http://localhost:3000</p>
                <p>NEXTAUTH_SECRET=your_random_secret_string</p>
            </div>
        </div>
      </Section>
    </div>
  );
}
