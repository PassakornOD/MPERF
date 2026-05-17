
'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Block from '@/components/common/Block';
import { Plus, Edit, Trash2, Save, X, Search, Filter, Settings2, Check } from 'lucide-react';

const InventoryManagePage = () => {
  const [activeTab, setActiveTab] = useState<'groups' | 'names'>('groups');
  const queryClient = useQueryClient();

  // --- Column Visibility State ---
  const allColumns = [
    { key: 'hostname', label: 'Hostname' },
    { key: 'hostgroup', label: 'Hostgroup' },
    { key: 'System', label: 'System' },
    { key: 'Location', label: 'Location' },
    { key: 'IP', label: 'IP Address' },
    { key: 'Model', label: 'Model' },
    { key: 'CPU', label: 'CPU' },
    { key: 'Disk', label: 'Disk' },
    { key: 'OS', label: 'OS' },
    { key: 'Serial', label: 'Serial' },
    { key: 'MA', label: 'MA' },
    { key: 'mem', label: 'RAM' },
    { key: 'Pagesize', label: 'Pagesize' },
  ];

  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'hostname', 'hostgroup', 'Location', 'IP', 'Model', 'OS', 'Serial'
  ]);
  const [showColumnConfig, setShowColumnSettings] = useState(false);

  // --- Filters State ---
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [filterHostname, setFilterHostname] = useState<string>('');

  // --- Hostgroup Logic ---
  const { data: hostgroups } = useQuery({
    queryKey: ['hostgroups-manage'],
    queryFn: async () => (await axios.get('/api/inventory/hostgroups')).data
  });

  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupOwner, setNewGroupOwner] = useState('');

  const groupMutation = useMutation({
    mutationFn: (data: any) => data.hostgroup_id ? axios.put('/api/inventory/hostgroups', data) : axios.post('/api/inventory/hostgroups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups-manage'] });
      setEditingGroup(null);
      setNewGroupName('');
      setNewGroupOwner('');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/inventory/hostgroups?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostgroups-manage'] }),
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to delete')
  });

  // --- Hostname Logic ---
  const { data: hostnames } = useQuery({
    queryKey: ['hostnames-manage'],
    queryFn: async () => (await axios.get('/api/inventory/hostnames')).data
  });

  const initialNameForm = {
    hostname: '', hostgroup_id: '', System: '', Location: '', IP: '', Model: '', CPU: '', Disk: '', OS: '', Serial: '', MA: '', mem: '', Pagesize: '4096'
  };

  const [editingName, setEditingName] = useState<any>(null);
  const [nameForm, setNameForm] = useState<any>(initialNameForm);

  const nameMutation = useMutation({
    mutationFn: (data: any) => data.hostname_id ? axios.put('/api/inventory/hostnames', data) : axios.post('/api/inventory/hostnames', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostnames-manage'] });
      setEditingName(null);
      setNameForm(initialNameForm);
    },
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to save hostname')
  });

  const deleteNameMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/inventory/hostnames?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostnames-manage'] })
  });

  const isNameFormValid = (form: any) => {
    return form && form.hostname !== '' && form.hostgroup_id !== '' && form.OS !== '' && form.mem !== '' && form.Pagesize !== '';
  };

  const filteredHostnames = useMemo(() => {
    if (!hostnames) return [];
    return hostnames.filter((h: any) => {
      const matchGroup = filterGroup === '' || String(h.hostgroup_id) === filterGroup;
      const matchName = filterHostname === '' || h.hostname.toLowerCase().includes(filterHostname.toLowerCase());
      return matchGroup && matchName;
    });
  }, [hostnames, filterGroup, filterHostname]);

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  return (
    <Block title="Inventory Management" subtitle="Add, Update or Delete Server Assets">
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button 
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'groups' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('groups')}
        >
          Hostgroups
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'names' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('names')}
        >
          Hostnames
        </button>
      </div>

      {activeTab === 'groups' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Group Name</label>
              <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. BSS" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Owner</label>
              <input type="text" value={newGroupOwner} onChange={e => setNewGroupOwner(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Department/Team" />
            </div>
            <button 
              onClick={() => groupMutation.mutate({ hostgroup: newGroupName, owner: newGroupOwner })}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Group
            </button>
          </div>

          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3">Group Name</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hostgroups?.map((g: any) => (
                  <tr key={g.hostgroup_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {editingGroup?.hostgroup_id === g.hostgroup_id ? 
                        <input type="text" value={editingGroup.hostgroup} onChange={e => setEditingGroup({...editingGroup, hostgroup: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-full" /> 
                        : g.hostgroup}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {editingGroup?.hostgroup_id === g.hostgroup_id ? 
                        <input type="text" value={editingGroup.owner} onChange={e => setEditingGroup({...editingGroup, owner: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-full" /> 
                        : g.owner}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {editingGroup?.hostgroup_id === g.hostgroup_id ? (
                        <>
                          <button onClick={() => groupMutation.mutate(editingGroup)} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                          <button onClick={() => setEditingGroup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingGroup(g)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => window.confirm('Delete this group?') && deleteGroupMutation.mutate(g.hostgroup_id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'names' && (
        <div className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg grid grid-cols-4 gap-4 shadow-sm border border-gray-100">
             <div className="col-span-4 mb-2"><h3 className="text-sm font-bold text-gray-700">Quick Add Hostname</h3></div>
             {allColumns.map(col => (
               <div key={col.key} className="col-span-1">
                 <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                   {col.label} {['hostname', 'hostgroup', 'OS', 'mem', 'Pagesize'].includes(col.key) && <span className="text-red-500">*</span>}
                 </label>
                 {col.key === 'hostgroup' ? (
                    <select value={nameForm.hostgroup_id} onChange={e => setNameForm({...nameForm, hostgroup_id: e.target.value})} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white">
                        <option value="">Select Group</option>
                        {hostgroups?.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup_id}>{g.hostgroup}</option>)}
                    </select>
                 ) : (
                    <input 
                        type={['mem', 'Pagesize'].includes(col.key) ? 'number' : 'text'} 
                        value={nameForm[col.key === 'mem' ? 'mem' : col.key]} 
                        onChange={e => setNameForm({...nameForm, [col.key === 'mem' ? 'mem' : col.key]: e.target.value})} 
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm bg-white" 
                    />
                 )}
               </div>
             ))}
             <div className="col-span-4 flex justify-end mt-2">
                <button 
                    onClick={() => nameMutation.mutate(nameForm)}
                    disabled={!isNameFormValid(nameForm) || nameMutation.isPending}
                    className={`px-8 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${!isNameFormValid(nameForm) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
                >
                    <Plus className="w-4 h-4" /> Save New Hostname
                </button>
             </div>
          </div>

          <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end gap-4">
                  <div className="flex gap-4 items-end bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex-1">
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1"><Search className="w-3 h-3" /> Hostname</label>
                        <input type="text" value={filterHostname} onChange={e => setFilterHostname(e.target.value)} placeholder="Search..." className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>
                    <div className="flex-1 relative">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase flex items-center gap-1"><Filter className="w-3 h-3" /> Group</label>
                        <select value={filterGroup} onChange={e => setFilterGroup(e.target.value)} className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20">
                            <option value="">All Groups</option>
                            {hostgroups?.map((g: any) => <option key={g.hostgroup_id} value={String(g.hostgroup_id)}>{g.hostgroup}</option>)}
                        </select>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button 
                        onClick={() => setShowColumnSettings(!showColumnConfig)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${showColumnConfig ? 'bg-blue-50 border-blue-300 text-blue-700 ring-4 ring-blue-50' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Settings2 className="w-4 h-4" /> Columns
                    </button>
                    {showColumnConfig && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-xl z-50 p-4">
                            <div className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">Display Columns</div>
                            <div className="grid grid-cols-1 gap-1">
                                {allColumns.map(col => (
                                    <button 
                                        key={col.key} 
                                        onClick={() => toggleColumn(col.key)}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 text-sm group text-left"
                                    >
                                        <span className={visibleColumns.includes(col.key) ? 'text-blue-700 font-medium' : 'text-gray-600'}>{col.label}</span>
                                        {visibleColumns.includes(col.key) && <Check className="w-4 h-4 text-blue-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                  </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 uppercase font-bold sticky top-0">
                    <tr>
                      {allColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                        <th key={col.key} className="px-4 py-3 whitespace-nowrap">{col.label}</th>
                      ))}
                      <th className="px-4 py-3 text-right sticky right-0 bg-gray-50 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredHostnames.map((h: any) => (
                      <tr key={h.hostname_id} className="hover:bg-blue-50/30 transition-colors">
                        {allColumns.filter(c => visibleColumns.includes(c.key)).map(col => (
                          <td key={col.key} className="px-4 py-3 whitespace-nowrap text-gray-700 max-w-[200px] truncate">
                            {editingName?.hostname_id === h.hostname_id ? (
                                col.key === 'hostgroup' ? (
                                    <select value={editingName.hostgroup_id} onChange={e => setEditingName({...editingName, hostgroup_id: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-full text-xs">
                                        {hostgroups?.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup_id}>{g.hostgroup}</option>)}
                                    </select>
                                ) : (
                                    <input 
                                        type={['mem', 'Pagesize'].includes(col.key) ? 'number' : 'text'}
                                        value={editingName[col.key]} 
                                        onChange={e => setEditingName({...editingName, [col.key]: e.target.value})} 
                                        className="border border-blue-400 rounded px-2 py-1 w-full text-xs" 
                                    />
                                )
                            ) : (
                                col.key === 'hostgroup' ? hostgroups?.find((g: any) => g.hostgroup_id === h.hostgroup_id)?.hostgroup :
                                col.key === 'mem' ? `${h.mem}G` : h[col.key]
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right space-x-2 sticky right-0 bg-white group-hover:bg-blue-50/30 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">
                            {editingName?.hostname_id === h.hostname_id ? (
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => nameMutation.mutate(editingName)} className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-50"><Save className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingName(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-50"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingName(h)} className="text-blue-600 hover:text-blue-800 p-1 rounded-md hover:bg-blue-50"><Edit className="w-4 h-4" /></button>
                                    <button onClick={() => window.confirm('Delete this host?') && deleteNameMutation.mutate(h.hostname_id)} className="text-red-600 hover:text-red-800 p-1 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
      )}
    </Block>
  );
};

export default InventoryManagePage;
