'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Server, ChevronDown, ChevronRight, Monitor, Folder, Edit, Trash2, X, Save, Settings2, Check, Loader2, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { checkPermission } from '@/lib/permissions';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useToast } from '@/components/common/Toast';
import FloatingInput from '@/components/common/FloatingInput';

const allColumns = [
    { id: 'hostname', label: 'Network Node' },
    { id: 'IP', label: 'IP Address' },
    { id: 'OS', label: 'OS' },
    { id: 'CPU', label: 'CPU' },
    { id: 'mem', label: 'RAM' },
    { id: 'Model', label: 'Model' },
    { id: 'System', label: 'System' },
    { id: 'Location', label: 'Location' },
    { id: 'Disk', label: 'Disk' },
    { id: 'Serial', label: 'Serial' },
    { id: 'MA', label: 'MA' },
    { id: 'Pagesize', label: 'Page' }
];

const ManageAssetsPage = () => {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const user = session?.user as any;
  const queryClient = useQueryClient();

  const canCreate = checkPermission(user?.role, 'create');
  const canUpdate = checkPermission(user?.role, 'update');
  const canDecommission = checkPermission(user?.role, 'delete');
  
  const [expandedGroups, setExpandedGroups] = useState<number[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingHost, setEditingHost] = useState<any>(null);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(['hostname', 'IP', 'OS', 'CPU', 'mem', 'Model', 'System']);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState<{ type: 'group' | 'host', id: number | string } | null>(null);

  // Data State
  const [newGroup, setNewGroup] = useState({ hostgroup: '', owner: '', pg_id: '' });
  const [hostForm, setHostForm] = useState({ 
      hostname: '', hostgroup_id: '', System: '', Location: '', IP: '', 
      Model: '', CPU: '', Disk: '', OS: '', Serial: '', MA: '', mem: '', Pagesize: '4096' 
  });

  const { data: hostGroups = [] } = useQuery({
    queryKey: ['hostgroups-manage-all'],
    queryFn: async () => (await axios.get('/api/inventory/hostgroups')).data
  });

  const { data: hostnames = [] } = useQuery({
    queryKey: ['hostnames-manage-all'],
    queryFn: async () => (await axios.get('/api/inventory/hostnames')).data
  });

  const { data: pgs = [] } = useQuery({
    queryKey: ['pgs-manage-all'],
    queryFn: async () => (await axios.get('/api/admin/permission-groups')).data.pgs
  });

  const groupMutation = useMutation({
    mutationFn: (data: any) => editingGroup ? axios.put('/api/inventory/hostgroups', data) : axios.post('/api/inventory/hostgroups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups-manage-all'] });
      setIsGroupModalOpen(false);
      setEditingGroup(null);
      setNewGroup({ hostgroup: '', owner: '', pg_id: '' });
      showToast(editingGroup ? "Infrastructure Group updated" : "Infrastructure Group created", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to save hostgroup', 'error');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/inventory/hostgroups?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups-manage-all'] });
      showToast("Infrastructure Group deleted successfully", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to delete hostgroup', 'error');
    }
  });

  const hostMutation = useMutation({
    mutationFn: (data: any) => editingHost ? axios.put('/api/inventory/hostnames', data) : axios.post('/api/inventory/hostnames', data),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['hostnames-manage-all'] });
        setIsHostModalOpen(false);
        setEditingHost(null);
        setHostForm({ hostname: '', hostgroup_id: '', System: '', Location: '', IP: '', Model: '', CPU: '', Disk: '', OS: '', Serial: '', MA: '', mem: '', Pagesize: '4096' });
        showToast(editingHost ? "Network Node updated successfully" : "Network Node created successfully", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to save host', 'error');
    }
  });

  const deleteHostMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/inventory/hostnames?id=${id}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['hostnames-manage-all'] });
        showToast("Network Node deleted successfully", 'success');
    },
    onError: (err: any) => {
        showToast(err.response?.data?.error || 'Failed to delete host', 'error');
    }
  });

  const toggleGroup = (id: number) => {
    setExpandedGroups(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleEditHost = (h: any) => {
      setEditingHost(h);
      setHostForm({
          hostname: h.hostname,
          hostgroup_id: String(h.hostgroup_id),
          System: h.System || '',
          Location: h.Location || '',
          IP: h.IP || '',
          Model: h.Model || '',
          CPU: h.CPU || '',
          Disk: h.Disk || '',
          OS: h.OS || '',
          Serial: h.Serial || '',
          MA: h.MA || '',
          mem: String(h.mem || ''),
          Pagesize: String(h.Pagesize || '4096')
      });
      setIsHostModalOpen(true);
  };

  const handleDecommissionClick = (type: 'group' | 'host', id: number | string) => {
      setConfirmData({ type, id });
      setIsConfirmOpen(true);
  };

  const handleConfirmDecommission = () => {
      if (!confirmData) return;
      if (confirmData.type === 'group') {
          deleteGroupMutation.mutate(confirmData.id as number);
      } else {
          deleteHostMutation.mutate(confirmData.id as string);
      }
      setIsConfirmOpen(false);
  };

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return hostGroups;

    return hostGroups.filter((hg: any) => {
        const groupMatch = hg.hostgroup.toLowerCase().includes(term);
        const hostsInGroup = hostnames.filter((h: any) => h.hostgroup_id === hg.hostgroup_id);
        const hostMatch = hostsInGroup.some((h: any) => 
            h.hostname.toLowerCase().includes(term) || 
            (h.IP && h.IP.toLowerCase().includes(term)) ||
            (h.OS && h.OS.toLowerCase().includes(term))
        );
        return groupMatch || hostMatch;
    });
  }, [hostGroups, hostnames, searchTerm]);

  return (
    <div className="space-y-8 animate-ease-in pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
            <h2 className="text-2xl font-black text-slate-900 capitalize italic tracking-tight leading-none">Asset Governance</h2>
            <p className="text-sm font-medium text-slate-400">Structural management of groups and network nodes</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            <div className="relative group w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                <input 
                    type="text"
                    placeholder="Search Infrastructure..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-10 py-3 bg-white border border-slate-100 rounded-xl text-xs font-black capitalize tracking-tight focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-50 rounded-xl transition-all text-slate-300 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
            <div className="relative">
                <button 
                    onClick={() => setShowColumnSelector(!showColumnSelector)} 
                    className={`p-3 rounded-xl border transition-all ${showColumnSelector ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-900 shadow-sm'}`}
                    title="Grid Configuration"
                >
                    <Settings2 className="w-5 h-5" />
                </button>
                {showColumnSelector && (
                    <div className="absolute right-0 mt-4 w-56 bg-white border border-slate-100 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] z-50 p-6 animate-in fade-in zoom-in duration-300">
                        <p className="text-[9px] font-black capitalize  text-slate-400 mb-4 px-2">Data Columns</p>
                        <div className="space-y-1 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                            {allColumns.map(col => (
                                <button 
                                    key={col.id} 
                                    onClick={() => toggleColumn(col.id)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-[11px] font-black capitalize tracking-tight text-slate-600 transition-all border border-transparent hover:border-slate-100"
                                >
                                    {col.label}
                                    {visibleColumns.includes(col.id) && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {canCreate && (
              <div className="flex items-center gap-2">
                <button onClick={() => { setEditingGroup(null); setNewGroup({ hostgroup: '', owner: '', pg_id: '' }); setIsGroupModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xs font-black capitalize  hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Group
                </button>
                <button onClick={() => { setEditingHost(null); setHostForm({ hostname: '', hostgroup_id: '', System: '', Location: '', IP: '', Model: '', CPU: '', Disk: '', OS: '', Serial: '', MA: '', mem: '', Pagesize: '4096' }); setIsHostModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl text-xs font-black capitalize  hover:bg-black transition-all shadow-lg shadow-slate-200 flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Node
                </button>
              </div>
            )}
        </div>
      </div>

      <div className="space-y-4">
        {filteredData.map((hg: any) => {
          const groupHosts = hostnames.filter((h: any) => h.hostgroup_id === hg.hostgroup_id);
          const isProtected = ['admin', 'sysadmin', 'operation'].includes(hg.hostgroup.toLowerCase());
          const isExpanded = expandedGroups.includes(hg.hostgroup_id) || searchTerm !== '';

          return (
            <div key={hg.hostgroup_id} className={`bg-white rounded-[2rem] border transition-all duration-500 group overflow-hidden ${isExpanded ? 'border-blue-100 shadow-xl shadow-blue-500/5' : 'border-slate-100 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:border-slate-200'}`}>
              <div 
                className={`p-6 cursor-pointer flex items-center justify-between gap-6 transition-colors duration-300 ${isExpanded ? 'bg-slate-50/30 border-b border-slate-50' : 'bg-white'}`}
                onClick={() => toggleGroup(hg.hostgroup_id)}
              >
                <div className="flex-1 min-w-0 flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/30 rotate-3' : 'bg-slate-50 text-blue-600 group-hover:bg-blue-50'}`}>
                        <Folder className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-black text-slate-900 text-lg capitalize tracking-tight leading-none">{hg.hostgroup}</h4>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-slate-400 capitalize ">{groupHosts.length} Active Nodes</span>
                            {isProtected && <span className="bg-slate-900 text-white text-[8px] font-black capitalize px-2 py-0.5 rounded-xl tracking-tighter">System Protected</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {canUpdate && !isProtected && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingGroup(hg); setIsGroupModalOpen(true); }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100"><Edit className="w-4.5 h-4.5" /></button>
                    )}
                    {canDecommission && !isProtected && (
                        <button onClick={(e) => { e.stopPropagation(); handleDecommissionClick('group', hg.hostgroup_id); }} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100"><Trash2 className="w-4.5 h-4.5" /></button>
                    )}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${isExpanded ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-300 group-hover:text-slate-500'}`}>
                      <ChevronDown className="w-5 h-5" />
                    </div>
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-8 animate-in fade-in slide-in-from-top-4 duration-500 bg-white">
                    <div className="overflow-x-auto custom-scrollbar border border-slate-100 rounded-xl shadow-inner bg-slate-50/20">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-slate-100">
                                    {visibleColumns.map(colId => (
                                        <th key={colId} className="px-6 py-5 text-[9px] font-black text-slate-400 capitalize  whitespace-nowrap">
                                            {allColumns.find(c => c.id === colId)?.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-5 text-[9px] font-black text-slate-400 capitalize  text-right whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                                {groupHosts.length > 0 ? groupHosts.map((h: any) => (
                                    <tr key={h.hostname_id} className="group/row hover:bg-blue-50/40 transition-all duration-200 border-b border-slate-100/30 last:border-0">
                                        {visibleColumns.map(colId => (
                                            <td key={colId} className="px-6 py-4">
                                                {colId === 'hostname' ? (
                                                    <div className="flex items-center gap-3">
                                                        <Monitor className="w-4 h-4 text-blue-500/50 group-hover/row:text-blue-600 transition-colors" />
                                                        <span className="text-[11px] font-black text-slate-800 capitalize tracking-tight group-hover/row:text-blue-700 transition-colors">{h.hostname}</span>
                                                    </div>
                                                ) : colId === 'mem' ? (
                                                    <span className="text-[11px] font-black text-slate-600 tabular-nums">{h[colId]} <span className="text-[8px] opacity-40">GB</span></span>
                                                ) : (
                                                    <span className="text-[11px] font-bold text-slate-500 truncate max-w-[150px] inline-block">
                                                        {h[colId] || '---'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover/row:opacity-100 transition-all translate-x-4 group-hover/row:translate-x-0">
                                                {canUpdate && (
                                                    <button onClick={() => handleEditHost(h)} className="p-2 bg-white text-slate-400 hover:text-blue-600 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                                )}
                                                {canDecommission && (
                                                    <button onClick={() => handleDecommissionClick('host', h.hostname_id)} className="p-2 bg-white text-slate-400 hover:text-red-500 border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={visibleColumns.length + 1} className="py-20 text-center">
                                            <Monitor className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                                            <p className="text-xs text-slate-300 font-black capitalize  italic">No Nodes registered in this sector</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => { setIsGroupModalOpen(false); setEditingGroup(null); }} title={editingGroup ? "Modify Infrastructure Group Configuration" : "New Infrastructure Group Registration"} maxWidth="max-w-md">
          <div className="space-y-6 pt-2">
            <FloatingInput 
                label="Group Identity Name" 
                value={editingGroup ? editingGroup.hostgroup : newGroup.hostgroup} 
                onChange={e => editingGroup ? setEditingGroup({...editingGroup, hostgroup: e.target.value}) : setNewGroup({...newGroup, hostgroup: e.target.value})} 
            />
            <FloatingInput 
                label="Primary Stakeholder / Owner" 
                value={editingGroup ? editingGroup.owner : newGroup.owner} 
                onChange={e => editingGroup ? setEditingGroup({...editingGroup, owner: e.target.value}) : setNewGroup({...newGroup, owner: e.target.value})} 
            />
            <div className="relative group">
                <select 
                    className="peer w-full border border-slate-100 p-4 pt-7 pb-2 rounded-xl text-xs font-black capitalize tracking-tight bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer shadow-inner" 
                    value={editingGroup ? editingGroup.pg_id : newGroup.pg_id} 
                    onChange={e => editingGroup ? setEditingGroup({...editingGroup, pg_id: e.target.value}) : setNewGroup({...newGroup, pg_id: e.target.value})}
                >
                    <option value="" disabled hidden></option>
                    {pgs.map((p: any) => <option key={p.pg_id} value={p.pg_id}>{p.pg_name}</option>)}
                </select>
                <label className={`absolute left-4 transition-all pointer-events-none font-black capitalize  ${(editingGroup?.pg_id || newGroup.pg_id) ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-slate-400'}`}>Security Association</label>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
            </div>
            <button 
                onClick={() => groupMutation.mutate(editingGroup ? { hostgroup_id: editingGroup.hostgroup_id, hostgroup: editingGroup.hostgroup, owner: editingGroup.owner, pg_id: editingGroup.pg_id } : newGroup)} 
                disabled={groupMutation.isPending}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs capitalize  hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 mt-4 flex items-center justify-center group"
            >
                {groupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                    <>
                        Commit Configuration <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
          </div>
      </Modal>

      {/* Network Node Modal */}
      <Modal isOpen={isHostModalOpen} onClose={() => { setIsHostModalOpen(false); setEditingHost(null); }} title={editingHost ? `Update node: ${editingHost.hostname}` : "New Node Registration"} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {Object.keys(hostForm).map(key => (
                <div key={key} className={key === 'OS' ? 'md:col-span-2' : ''}>
                    {key === 'hostgroup_id' ? (
                        <div className="relative group">
                            <select 
                                value={hostForm.hostgroup_id} 
                                onChange={e => setHostForm({...hostForm, hostgroup_id: e.target.value})} 
                                className="peer w-full border border-slate-100 p-4 pt-7 pb-2 rounded-xl text-xs font-black capitalize tracking-tight bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                            >
                                <option value="" disabled hidden></option>
                                {hostGroups.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup_id}>{g.hostgroup}</option>)}
                            </select>
                            <label className={`absolute left-4 transition-all pointer-events-none font-black capitalize  ${hostForm.hostgroup_id ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-slate-400'}`}>Sector Assignment</label>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                        </div>
                    ) : key === 'OS' ? (
                        <div className="relative group">
                            <select 
                                value={hostForm.OS} 
                                onChange={e => setHostForm({...hostForm, OS: e.target.value})} 
                                className="peer w-full border border-slate-100 p-4 pt-7 pb-2 rounded-xl text-xs font-black capitalize tracking-tight bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all appearance-none cursor-pointer shadow-inner"
                            >
                                <option value="" disabled hidden></option>
                                <option value="Red Hat">Red Hat Enterprise Linux</option>
                                <option value="Solaris">Oracle Solaris / SunOS</option>
                                <option value="AIX">IBM AIX</option>
                                <option value="Ubuntu">Ubuntu Server</option>
                                <option value="Rocky">Rocky Linux</option>
                                <option value="CentOS">CentOS</option>
                                <option value="Other">Standard Linux / Unix</option>
                            </select>
                            <label className={`absolute left-4 transition-all pointer-events-none font-black capitalize  ${hostForm.OS ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-slate-400'}`}>Operating System</label>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                        </div>
                    ) : (
                        <FloatingInput 
                            label={key.replace('_id', '').toUpperCase()} 
                            value={(hostForm as any)[key]} 
                            onChange={e => setHostForm({...hostForm, [key]: e.target.value})} 
                        />
                    )}
                </div>
            ))}
            <button 
                onClick={() => hostMutation.mutate(editingHost ? { ...hostForm, hostname_id: editingHost.hostname_id } : hostForm)} 
                disabled={hostMutation.isPending}
                className="md:col-span-2 bg-slate-900 text-white py-4 rounded-xl font-black text-xs capitalize  hover:bg-black transition-all shadow-xl shadow-slate-200 disabled:opacity-50 mt-4 flex items-center justify-center group"
            >
                {hostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (
                    <>
                        {editingHost ? 'Apply Node Updates' : 'Authorize Node Enrollment'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDecommission}
        title={confirmData?.type === 'group' ? 'Decommission Infrastructure Group' : 'Decommission Network Node'}
        message={
            confirmData?.type === 'group' 
            ? "Are you sure you want to delete this hostgroup? All associated hostnames and their performance data tables will be permanently removed. This action cannot be undone."
            : "Are you sure you want to delete this hostname? All associated performance data tables will be permanently removed. This action cannot be undone."
        }
      />
    </div>
  );
};

export default ManageAssetsPage;
