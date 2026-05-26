'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Server, User, ChevronDown, ChevronUp } from 'lucide-react';

const InventoryList = () => {
  const { data: hostgroups, isFetching } = useQuery({
    queryKey: ['hostgroups-inventory'],
    queryFn: async () => (await axios.get('/api/inventory/hostgroups')).data
  });

  const [expandedGroupIds, setExpandedGroupIds] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const allColumns = ['hostname', 'IP', 'OS', 'Model', 'CPU', 'Disk', 'Serial', 'System', 'Location', 'MA', 'Mem', 'Pagesize', 'hostname_id', 'hostgroup_id', 'Time'];
  const [columns, setColumns] = useState(['hostname', 'IP', 'OS', 'Model', 'CPU', 'Disk', 'Serial']);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const filteredHostgroups = useMemo(() => {
    if (!hostgroups) return [];
    const term = searchTerm.toLowerCase();
    return hostgroups
        .map((hg: any) => ({
            ...hg,
            hostnames: hg.hostnames?.filter((h: any) => 
                h.hostname?.toLowerCase().includes(term) || h.IP?.toLowerCase().includes(term)
            ) || []
        }))
        .filter((hg: any) => 
            hg.hostgroup.toLowerCase().includes(term) || hg.hostnames.length > 0
        );
  }, [hostgroups, searchTerm]);

  const toggleGroup = (id: number) => {
    setExpandedGroupIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const expandAll = () => setExpandedGroupIds(hostgroups?.map((hg: any) => hg.hostgroup_id) || []);
  const collapseAll = () => setExpandedGroupIds([]);

  const toggleColumn = (col: string) => {
    setColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 uppercase">Server Inventory</h2>
          <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Search Hostgroup or Hostname..."
                className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-xs font-bold w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button onClick={expandAll} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200">Expand All</button>
            <button onClick={collapseAll} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-gray-200">Collapse All</button>
            <div className="relative">
                <button 
                    onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2"
                >
                    Customize <ChevronDown className="w-3 h-3" />
                </button>
                {isColumnDropdownOpen && (
                    <div className="absolute right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-48 z-20 grid grid-cols-1 gap-2">
                        {allColumns.map(col => (
                            <label key={col} className="flex items-center gap-2 text-[10px] font-bold text-gray-700 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={columns.includes(col)}
                                    onChange={() => toggleColumn(col)}
                                    className="accent-blue-600"
                                />
                                {col}
                            </label>
                        ))}
                    </div>
                )}
            </div>
          </div>
      </div>
      
      {isFetching ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>
      ) : (
        <div className="space-y-4">
          {filteredHostgroups?.map((hg: any) => (
            <div key={hg.hostgroup_id} className="bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div 
                className="p-6 cursor-pointer flex items-center justify-between"
                onClick={() => toggleGroup(hg.hostgroup_id)}
              >
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-gray-900 truncate">
                      {hg.hostgroup} <span className="text-gray-400 font-medium text-sm">({hg.hostgroup_id})</span>
                    </h3>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <User className="w-3 h-3 text-blue-500" /> {hg.owner || '-'}
                    </div>
                </div>
                {expandedGroupIds.includes(hg.hostgroup_id) ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </div>
              
              {expandedGroupIds.includes(hg.hostgroup_id) && hg.hostnames?.length > 0 && (
                <div className="px-6 pb-6 animate-in slide-in-from-top-2">
                    <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-gray-50">
                                <tr className="text-gray-400 font-black uppercase text-[10px]">
                                    {columns.map(col => <th key={col} className="px-6 py-4">{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {hg.hostnames?.map((h: any) => (
                                    <tr key={h.hostname_id} className="border-t border-gray-50 hover:bg-gray-50/50">
                                        {columns.map(col => {
                                            const key = Object.keys(h).find(k => k.toLowerCase() === col.toLowerCase());
                                            return <td key={col} className="px-6 py-3 font-bold text-gray-700">{key ? h[key] : '-'}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InventoryList;
