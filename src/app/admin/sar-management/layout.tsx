'use client';

import { useState } from 'react';
import { BarChart3, Database, FileText } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function SarManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { name: 'Explorer', href: '/admin/sar-management/explorer', icon: BarChart3 },
    { name: 'Ingestion', href: '/admin/sar-management/ingestion', icon: Database },
    { name: 'Logs', href: '/admin/sar-management/logs', icon: FileText },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sar Management</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">Centralized administration for data explorer and ingestion</p>
        </div>

        <div className="bg-slate-100 p-1 rounded-xl flex w-fit">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <button
                key={tab.name}
                onClick={() => router.push(tab.href)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black capitalize  transition-all flex items-center gap-2 ${
                  isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className="w-3 h-3" /> {tab.name}
              </button>
            );
          })}
        </div>
      </div>
      {children}
    </div>
  );
}
