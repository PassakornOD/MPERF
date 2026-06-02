'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Settings } from 'lucide-react';
import React from 'react';

const subTabs = [
  { name: 'Hostgroups', href: '/inventory/manage/groups' },
  { name: 'Hostnames', href: '/inventory/manage/names' },
];

export default function InventoryManageSubTabs() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex gap-2 mb-6 border-b border-slate-200 pb-2">
      {subTabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <button
            key={tab.name}
            onClick={() => router.push(tab.href)}
            className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
              isActive 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
}
