'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Cpu, MemoryStick, List, Settings, BarChart3, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const IconMap: { [key: string]: any } = {
  Cpu: Cpu,
  MemoryStick: MemoryStick,
  List: List,
  Settings: Settings,
  BarChart3: BarChart3,
  FileText: FileText
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
  const [animateKey, setAnimateKey] = useState(0);

  // Trigger animation whenever children (path) change
  useEffect(() => {
    setAnimateKey(prev => prev + 1);
  }, [pathname]);

  return (
    <div className="w-full">
      {/* Tab Container */}
      <div className="flex items-center gap-1.5 px-6">
        {tabs.map((tab) => {
          const normalizedPathname = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
          const normalizedHref = tab.href.endsWith('/') && tab.href.length > 1 ? tab.href.slice(0, -1) : tab.href;
          const isActive = normalizedPathname === normalizedHref;
          const IconComponent = IconMap[tab.iconKey];
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`group flex items-center justify-center gap-3 px-10 py-4 text-xm font-black capitalize tracking-widest transition-all duration-300 relative z-10 
                rounded-t-[1.25rem] border-t border-x skew-x-[-12deg]
                ${isActive
                  ? 'bg-white border-slate-200 text-blue-600 shadow-[0_-8px_20px_-4px_rgba(0,0,0,0.05)] translate-y-[1px] border-b-2 border-b-white'
                  : 'bg-slate-200/50 border-transparent text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                }`}
            >
              <div className="flex items-center gap-2.5 skew-x-[12deg]">
                {IconComponent && <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />}
                {tab.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div
        key={animateKey}
        className="relative bg-white p-10 rounded-b-[2rem] rounded-tr-[2rem] border border-slate-200 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] animate-ease-in"
      >
        {children}
      </div>
    </div>
  );
}
