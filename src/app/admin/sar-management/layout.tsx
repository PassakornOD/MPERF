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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">SAR Management</h1>
          <p className="text-sm font-bold text-gray-400 mt-2">Centralized administration for SAR data explorer and ingestion</p>
        </div>

        <div className="bg-gray-100 p-1 rounded-2xl flex">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <button
                key={tab.name}
                onClick={() => router.push(tab.href)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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
