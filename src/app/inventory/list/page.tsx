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
    <div className="space-y-8 animate-ease-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Server Inventory</h2>
            <p className="text-sm font-medium text-gray-400">Manage and browse your infrastructure assets</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative group">
              <input 
                  type="text" 
                  placeholder="Search Hostgroup or Hostname..."
                  className="bg-white border border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold w-full sm:w-72 shadow-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={expandAll} className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-5 py-3 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors">Expand All</button>
              <button onClick={collapseAll} className="flex-1 sm:flex-none bg-gray-100 text-gray-700 px-5 py-3 rounded-2xl text-xs font-bold hover:bg-gray-200 transition-colors">Collapse All</button>
            </div>
            <div className="relative">
                <button 
                    onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                    className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                    Customize <ChevronDown className={`w-4 h-4 transition-transform ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isColumnDropdownOpen && (
                    <div className="absolute right-0 mt-3 bg-white border border-gray-100 rounded-3xl shadow-2xl p-5 w-64 z-50 grid grid-cols-1 gap-3 animate-ease-in">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Visible Columns</p>
                        <div className="max-h-64 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar">
                          {allColumns.map(col => (
                              <label key={col} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                                  <input 
                                      type="checkbox" 
                                      checked={columns.includes(col)}
                                      onChange={() => toggleColumn(col)}
                                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                                  />
                                  <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-600 capitalize">{col}</span>
                              </label>
                          ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
      </div>
      
      {isFetching ? (
        <div className="text-center py-20 bg-white rounded-[2rem] border border-gray-100 shadow-sm"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-600" /><p className="mt-4 text-sm font-bold text-gray-400">Loading Inventory...</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredHostgroups?.map((hg: any) => (
            <div key={hg.hostgroup_id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm transition-all hover:shadow-xl hover:border-blue-100 group overflow-hidden">
              <div 
                className="p-8 cursor-pointer flex items-center justify-between gap-4"
                onClick={() => toggleGroup(hg.hostgroup_id)}
              >
                <div className="flex-1 min-w-0 flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center transition-colors ${expandedGroupIds.includes(hg.hostgroup_id) ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                        <Server className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900">
                          {hg.hostgroup} <span className="text-gray-400 font-medium text-sm ml-2">ID: {hg.hostgroup_id}</span>
                        </h4>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                              <User className="w-3.5 h-3.5 text-blue-500/70" /> {hg.owner || 'No Owner'}
                          </div>
                          <div className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                            {hg.hostnames?.length || 0} Hosts
                          </div>
                        </div>
                    </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${expandedGroupIds.includes(hg.hostgroup_id) ? 'bg-gray-900 text-white rotate-180' : 'bg-gray-100 text-gray-400'}`}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
              
              {expandedGroupIds.includes(hg.hostgroup_id) && (
                <div className="px-8 pb-8 animate-ease-in">
                    <div className="overflow-x-auto border border-gray-100 rounded-3xl shadow-inner bg-gray-50/30">
                        {hg.hostnames?.length > 0 ? (
                          <table className="w-full text-sm text-left border-collapse">
                              <thead>
                                  <tr className="border-b border-gray-100">
                                      {columns.map(col => (
                                        <th key={col} className="px-6 py-5 text-gray-400 font-bold text-[10px] uppercase tracking-wider">{col}</th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                  {hg.hostnames?.map((h: any) => (
                                      <tr key={h.hostname_id} className="hover:bg-blue-50/30 transition-colors">
                                          {columns.map(col => {
                                              const key = Object.keys(h).find(k => k.toLowerCase() === col.toLowerCase());
                                              return (
                                                <td key={col} className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                                                  {key ? h[key] : '-'}
                                                </td>
                                              );
                                          })}
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                        ) : (
                          <div className="py-12 text-center text-gray-400 font-semibold text-sm">No hosts registered in this group.</div>
                        )}
                    </div>
                </div>
              )}
            </div>
          ))}
          {filteredHostgroups?.length === 0 && (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm">
              <p className="text-gray-400 font-bold">No results found for "{searchTerm}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InventoryList;
