
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LayoutDashboard, BarChart3, Database, Package, ChevronRight, Monitor } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const { data: hostGroups } = useQuery({
    queryKey: ['hostGroups', user?.id],
    queryFn: async () => {
        if (!user) return [];
        return (await axios.get('/api/host-groups')).data;
    },
    enabled: !!user
  });

  const toggleGroup = (id: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedGroups = hostGroups?.filter((g: any) => selectedGroupIds.includes(g.hostgroup_id)) || [];

  return (
    <div className="space-y-12 animate-ease-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-slate-900 capitalize italic tracking-tight">Dashboard Overview</h1>
        <p className="text-sm font-medium text-slate-400">Quick access to infrastructure monitoring and reporting tools</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { href: "/sarlog/cpu-daily", title: "Sarlog", desc: "Interactive performance charts", icon: BarChart3, color: "blue" },
          { href: "/utilization/cpu", title: "Utilization", desc: "Long-term usage statistics", icon: Database, color: "emerald" },
          { href: "/inventory/list", title: "Inventory", desc: "Asset management & browsing", icon: Package, color: "purple" }
        ].map((item) => (
          <Link key={item.title} href={item.href} className="modern-card p-8 flex flex-col gap-5 group">
            <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 text-${item.color}-600 flex items-center justify-center shadow-sm group-hover:bg-${item.color}-600 group-hover:text-white transition-all duration-300`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 capitalize tracking-tight">{item.title}</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">{item.desc}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-black text-blue-600 capitalize  mt-auto opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
              Open Module <ChevronRight className="w-3 h-3" strokeWidth={3} />
            </div>
          </Link>
        ))}
      </div>

      {/* Hostgroup Selector */}
      <Block title="Hostgroup Explorer" subtitle="Aggregate hostnames by group selection">
        <div className="flex flex-wrap gap-2.5 mb-10">
          {hostGroups?.map((g: any) => {
            const isActive = selectedGroupIds.includes(g.hostgroup_id);
            return (
              <button
                key={g.hostgroup_id}
                onClick={() => toggleGroup(g.hostgroup_id)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black capitalize  transition-all duration-300 border ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600 shadow-sm'
                }`}
              >
                {g.hostgroup}
              </button>
            );
          })}
        </div>

        {/* Display Filtered Hostnames */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {selectedGroups.map((group: any) => (
            <div key={group.hostgroup_id} className="bg-slate-50/50 rounded-xl border border-slate-100 p-6 flex flex-col gap-4 animate-ease-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-black text-slate-800 capitalize tracking-tight text-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {group.hostgroup}
                </h4>
                <span className="text-xs font-black text-slate-400 bg-white px-2 py-0.5 rounded-xl border border-slate-100">{group.hostnames.length} Hosts</span>
              </div>
              <ul className="grid grid-cols-1 gap-2">
                {group.hostnames.map((h: any) => (
                  <li key={h.hostname_id} className="text-xs font-bold text-slate-500 flex items-center gap-2 hover:text-blue-600 transition-colors cursor-default group/item">
                    <Monitor className="w-3.5 h-3.5 opacity-30 group-hover/item:opacity-100 transition-opacity" />
                    {h.hostname}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {selectedGroupIds.length === 0 && (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-xl">
              <Package className="w-12 h-12 text-slate-100 mx-auto mb-4" />
              <p className="text-sm font-bold text-slate-300 capitalize ">No groups selected to explore</p>
            </div>
          )}
        </div>
      </Block>
    </div>
  );
}
