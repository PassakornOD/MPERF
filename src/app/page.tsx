
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Block from '@/components/common/Block';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LayoutDashboard, BarChart3, Database, Package } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/sarlog/cpu-daily" className="p-6 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all group">
          <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" /> Sarlog
          </h3>
          <p className="text-sm text-blue-600 mt-2">View performance charts.</p>
        </Link>
        <Link href="/utilization/cpu" className="p-6 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-all group">
          <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
            <Database className="w-6 h-6" /> Utilization
          </h3>
          <p className="text-sm text-green-600 mt-2">Check utilization stats.</p>
        </Link>
        <Link href="/inventory/list" className="p-6 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-all group">
          <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
            <Package className="w-6 h-6" /> Inventory
          </h3>
          <p className="text-sm text-purple-600 mt-2">Manage server inventory.</p>
        </Link>
      </div>

      {/* Hostgroup Selector */}
      <Block title="Hostgroup Selector" subtitle="Select multiple groups to view hostnames">
        <div className="flex flex-wrap gap-3 mb-6">
          {hostGroups?.map((g: any) => (
            <button
              key={g.hostgroup_id}
              onClick={() => toggleGroup(g.hostgroup_id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedGroupIds.includes(g.hostgroup_id) 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {g.hostgroup}
            </button>
          ))}
        </div>

        {/* Display Filtered Hostnames */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {selectedGroups.map((group: any) => (
            <div key={group.hostgroup_id} className="border rounded-md p-4 bg-white">
              <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">{group.hostgroup}</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {group.hostnames.map((h: any) => (
                  <li key={h.hostname_id} className="hover:text-blue-600">• {h.hostname}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Block>
    </div>
  );
}
