'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Cpu, MemoryStick, List, Settings, BarChart3 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

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
  const [animateKey, setAnimateKey] = useState(0);

  // Trigger animation whenever children (path) change
  useEffect(() => {
    setAnimateKey(prev => prev + 1);
  }, [pathname]);

  return (
    <div className="w-full">
      <style jsx global>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-ease-in {
          animation: slideDown 0.3s ease-in-out forwards;
        }
      `}</style>
      
      {/* Tab Container */}
      <div className="flex items-center gap-1.5 px-4">
        {tabs.map((tab) => {
          const normalizedPathname = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
          const normalizedHref = tab.href.endsWith('/') && tab.href.length > 1 ? tab.href.slice(0, -1) : tab.href;
          const isActive = normalizedPathname === normalizedHref;
          const IconComponent = IconMap[tab.iconKey];
          return (
            <button
              key={tab.name}
              onClick={() => router.push(tab.href)}
              className={`group flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-bold transition-all duration-200 relative z-10 
                rounded-t-2xl border-t border-x skew-x-[-15deg]
                ${isActive 
                  ? 'bg-white border-gray-300 text-blue-600 shadow-[0_-4px_12px_rgba(0,0,0,0.1)] translate-y-[1px] border-b-2 border-b-white' 
                  : 'bg-gray-200 border-transparent text-gray-600 hover:bg-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 skew-x-[15deg]">
                {IconComponent && <IconComponent className={`w-4 h-4 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />}
                {tab.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div 
        key={animateKey}
        className="relative bg-white p-8 rounded-b-3xl rounded-tr-3xl border border-gray-300 shadow-[0_4px_20px_rgba(0,0,0,0.08)] animate-ease-in"
      >
        {children}
      </div>
    </div>
  );
}
