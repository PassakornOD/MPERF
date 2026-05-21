'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Cpu, MemoryStick, List, Settings, BarChart3 } from 'lucide-react';
import React from 'react';

const IconMap: { [key: string]: any } = {
  Cpu: Cpu,
  MemoryStick: MemoryStick,
  List: List,
  Settings: Settings,
  BarChart3: BarChart3
};

interface Tab {
  name: string;
  href: string;
  iconKey: string;
}

interface FolderTabsProps {
  tabs: Tab[];
  children: React.ReactNode;
}

export default function FolderTabs({ tabs, children }: FolderTabsProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="w-full">
      {/* Tab Container - Removed explicit z-index to stay in normal stacking context */}
      <div className="flex items-center gap-1.5 px-1">
        {tabs.map((tab) => {
          const isActive = tab.href === '/report' 
            ? pathname === '/report' 
            : pathname.startsWith(tab.href);
          const IconComponent = IconMap[tab.iconKey];
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`group flex items-center gap-2.5 px-6 py-3.5 text-sm font-bold transition-all duration-200 rounded-t-2xl border-t border-x ${
                isActive 
                  ? 'bg-white border-gray-200 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] translate-y-[1px]' 
                  : 'bg-gray-100/60 border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                {IconComponent && <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-600'}`} />}
                {tab.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="relative bg-white p-8 rounded-b-3xl rounded-tr-3xl border border-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        {children}
      </div>
    </div>
  );
}
