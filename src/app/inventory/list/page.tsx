'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Server, User, ChevronDown, ChevronUp, Search, Monitor, Settings2 } from 'lucide-react';

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
    <div className="space-y-10 animate-ease-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-2xl text-foreground capitalize tracking-tight leading-none">Asset Registry</h2>
          <p className="text-sm font-medium text-muted-foreground tracking-tight">Full-stack visibility of managed infrastructure nodes</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="Search Node or Group..."
              className="bg-card border border-border rounded-xl pl-12 pr-6 py-3.5 text-xs capitalize tracking-tight w-full sm:w-80 shadow-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={expandAll} className="flex-1 sm:flex-none bg-slate-900 text-white px-6 py-3.5 rounded-xl text-xs capitalize  hover:bg-black transition-all shadow-lg shadow-slate-200">Expand All</button>
            <button onClick={collapseAll} className="flex-1 sm:flex-none bg-background text-muted-foreground border border-border px-6 py-3.5 rounded-xl text-xs capitalize  hover:bg-card hover:text-slate-600 transition-all shadow-sm">Collapse</button>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
              className={`p-3 rounded-xl border transition-all ${isColumnDropdownOpen ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-card border-border text-muted-foreground hover:bg-background hover:text-foreground shadow-sm'}`}
              title="Grid Configuration"
            >
              <Settings2 className="w-5 h-5" />
            </button>
            {isColumnDropdownOpen && (
              <div className="absolute right-0 mt-4 bg-card border border-border rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] p-8 w-72 z-50 animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] text-muted-foreground capitalize  mb-6 px-2">Visibility Engine</p>
                <div className="max-h-72 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                  {allColumns.map(col => (
                    <label key={col} className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/50 cursor-pointer transition-all group border border-transparent hover:border-blue-100">
                      <span className="text-xs text-slate-600 capitalize tracking-tight group-hover:text-blue-600 transition-colors">{col}</span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={columns.includes(col)}
                          onChange={() => toggleColumn(col)}
                          className="checkbox"
                        />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isFetching ? (
        <div className="text-center py-40 bg-card rounded-xl border border-border shadow-sm">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-blue-600 opacity-20" />
          <p className="mt-8 text-xs text-slate-300 capitalize ">Synching with Infrastructure...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredHostgroups?.map((hg: any) => {
            const isExpanded = expandedGroupIds.includes(hg.hostgroup_id);
            return (
              <div key={hg.hostgroup_id} className={`bg-card rounded-xl border transition-all duration-500 group overflow-hidden ${isExpanded ? 'border-blue-100 shadow-xl shadow-blue-500/5' : 'border-border shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-border'}`}>
                <div
                  className={`p-6 cursor-pointer flex items-center justify-between gap-6 transition-colors duration-300 ${isExpanded ? 'bg-background/30 border-b border-slate-50' : 'bg-card'}`}
                  onClick={() => toggleGroup(hg.hostgroup_id)}
                >
                  <div className="flex-1 min-w-0 flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 rotate-3' : 'bg-background text-blue-600 group-hover:bg-blue-50'}`}>
                      <Server className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-foreground text-lg capitalize tracking-tight leading-none">
                        {hg.hostgroup} <span className="text-slate-300 text-xs ml-3">ID: {hg.hostgroup_id}</span>
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground capitalize ">
                          <User className="w-3.5 h-3.5 text-blue-500 opacity-50" /> {hg.owner || '-'}
                        </div>
                        <div className="h-3 w-px bg-slate-200"></div>
                        <div className="text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-xl border border-blue-100 capitalize tracking-tighter">
                          {hg.hostnames?.length || 0} Nodes Enrolled
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-background text-slate-300 group-hover:text-muted-foreground'}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 bg-card border-t border-slate-50 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="overflow-x-auto custom-scrollbar border border-border rounded-xl shadow-inner bg-background/20">
                      {hg.hostnames?.length > 0 ? (
                        <table className="w-full text-xs text-left border-collapse">
                          <thead>
                            <tr className="bg-blue-50/50 border-b border-blue-100">
                              {columns.map(col => (
                                <th key={col} className="px-6 py-5 text-blue-800 text-xs capitalize  whitespace-nowrap">{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-blue-50">
                            {hg.hostnames?.map((h: any) => (
                              <tr key={h.hostname_id} className="hover:bg-blue-100/50 transition-all duration-200 group/row">
                                {columns.map(col => {
                                  const key = Object.keys(h).find(k => k.toLowerCase() === col.toLowerCase());
                                  const isMain = col.toLowerCase() === 'hostname' || col.toLowerCase() === 'ip';
                                  return (
                                    <td key={col} className={`px-6 py-4 whitespace-nowrap transition-colors ${isMain ? 'text-blue-900 group-hover/row:text-blue-900' : 'text-slate-600'}`}>
                                      {key ? h[key] : '---'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="py-16 text-center">
                          <Monitor className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                          <p className="text-xs text-slate-300 capitalize  italic">No Nodes registered in this sector</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {filteredHostgroups?.length === 0 && (
            <div className="py-40 text-center bg-card rounded-xl border border-border shadow-sm">
              <Search className="w-16 h-16 text-slate-100 mx-auto mb-6" />
              <p className="text-sm text-slate-300 capitalize ">No match found for query: "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryList;
