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
    { id: 'hostname', label: 'Hostname' },
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
  const canDelete = checkPermission(user?.role, 'delete');
  
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
      showToast(editingGroup ? "Hostgroup updated" : "Hostgroup created", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to save hostgroup', 'error');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/inventory/hostgroups?id=${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups-manage-all'] });
      showToast("Hostgroup deleted successfully", 'success');
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
        showToast(editingHost ? "Hostname updated successfully" : "Hostname created successfully", 'success');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.error || 'Failed to save host', 'error');
    }
  });

  const deleteHostMutation = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/inventory/hostnames?id=${id}`),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['hostnames-manage-all'] });
        showToast("Hostname deleted successfully", 'success');
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

  const handleDeleteClick = (type: 'group' | 'host', id: number | string) => {
      setConfirmData({ type, id });
      setIsConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Manage Assets</h2>
        <div className="flex gap-3 items-center">
            <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text"
                    placeholder="Search groups or hosts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-gray-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm"
                />
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-400">
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>
            <div className="relative">
                <button 
                    onClick={() => setShowColumnSelector(!showColumnSelector)} 
                    className="p-2 bg-white border border-gray-100 rounded-xl hover:bg-gray-50 transition-all text-gray-400 hover:text-gray-900"
                    title="Customize Columns"
                >
                    <Settings2 className="w-4 h-4" />
                </button>
                {showColumnSelector && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-3 animate-in fade-in zoom-in duration-200">
                        <p className="text-[10px] font-black uppercase text-gray-400 mb-2 px-1">Visible Columns</p>
                        <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {allColumns.map(col => (
                                <button 
                                    key={col.id} 
                                    onClick={() => toggleColumn(col.id)}
                                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-[11px] font-bold text-gray-700 transition-all"
                                >
                                    {col.label}
                                    {visibleColumns.includes(col.id) && <Check className="w-3 h-3 text-blue-600" />}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            {canCreate && (
              <>
                <button onClick={() => { setEditingGroup(null); setNewGroup({ hostgroup: '', owner: '', pg_id: '' }); setIsGroupModalOpen(true); }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Create Hostgroup
                </button>
                <button onClick={() => { setEditingHost(null); setHostForm({ hostname: '', hostgroup_id: '', System: '', Location: '', IP: '', Model: '', CPU: '', Disk: '', OS: '', Serial: '', MA: '', mem: '', Pagesize: '4096' }); setIsHostModalOpen(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Create Hostname
                </button>
              </>
            )}
        </div>
      </div>

      <div className="space-y-3">
        {filteredData.map((hg: any) => {
          const groupHosts = hostnames.filter((h: any) => h.hostgroup_id === hg.hostgroup_id);
          const isProtected = ['admin', 'sysadmin', 'operation'].includes(hg.hostgroup.toLowerCase());
          const isExpanded = expandedGroups.includes(hg.hostgroup_id) || searchTerm !== '';

          return (
            <div key={hg.hostgroup_id} className="border border-gray-100 rounded-2xl bg-white shadow-sm overflow-hidden">
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleGroup(hg.hostgroup_id)}
              >
                <div className="flex items-center gap-3">
                    <button>{isExpanded ? <ChevronDown className="w-4 h-4 text-blue-600" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}</button>
                    <Folder className="w-5 h-5 text-blue-500" />
                    <div>
                        <h4 className="font-bold text-gray-900">{hg.hostgroup}</h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{groupHosts.length} Hosts</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {canUpdate && !isProtected && (
                        <button onClick={(e) => { e.stopPropagation(); setEditingGroup(hg); setIsGroupModalOpen(true); }} className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition-all"><Edit className="w-4 h-4" /></button>
                    )}
                    {canDelete && !isProtected && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick('group', hg.hostgroup_id); }} className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    )}
                </div>
              </div>
              
              {isExpanded && (
                <div className="border-t border-gray-50 bg-gray-50/20 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100/50">
                                {visibleColumns.map(colId => (
                                    <th key={colId} className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {allColumns.find(c => c.id === colId)?.label}
                                    </th>
                                ))}
                                <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {groupHosts.length > 0 ? groupHosts.map((h: any) => (
                                <tr key={h.hostname_id} className="group/row hover:bg-white transition-colors border-b border-gray-100/30 last:border-0">
                                    {visibleColumns.map(colId => (
                                        <td key={colId} className="px-4 py-3">
                                            {colId === 'hostname' ? (
                                                <div className="flex items-center gap-2">
                                                    <Monitor className="w-3.5 h-3.5 text-blue-500" />
                                                    <span className="text-[11px] font-black text-gray-700">{h.hostname}</span>
                                                </div>
                                            ) : colId === 'mem' ? (
                                                <span className="text-[11px] font-bold text-gray-600">{h[colId]} GB</span>
                                            ) : (
                                                <span className="text-[11px] font-bold text-gray-500 truncate max-w-[150px] inline-block">
                                                    {h[colId] || '-'}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                            {canUpdate && (
                                                <button onClick={() => handleEditHost(h)} className="text-gray-400 hover:text-blue-600 p-1.5 hover:bg-blue-50 rounded-lg transition-all"><Edit className="w-3.5 h-3.5" /></button>
                                            )}
                                            {canDelete && (
                                                <button onClick={() => handleDeleteClick('host', h.hostname_id)} className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={visibleColumns.length + 1} className="px-8 py-4 text-xs text-gray-400 italic">No hosts in this group.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Group Modal */}
      <Modal isOpen={isGroupModalOpen} onClose={() => { setIsGroupModalOpen(false); setEditingGroup(null); }} title={editingGroup ? "Edit Hostgroup" : "Create New Hostgroup"} maxWidth="max-w-md">
          <div className="space-y-4 pt-2">
            <FloatingInput 
                label="Group Name" 
                value={editingGroup ? editingGroup.hostgroup : newGroup.hostgroup} 
                onChange={e => editingGroup ? setEditingGroup({...editingGroup, hostgroup: e.target.value}) : setNewGroup({...newGroup, hostgroup: e.target.value})} 
            />
            <FloatingInput 
                label="Owner" 
                value={editingGroup ? editingGroup.owner : newGroup.owner} 
                onChange={e => editingGroup ? setEditingGroup({...editingGroup, owner: e.target.value}) : setNewGroup({...newGroup, owner: e.target.value})} 
            />
            <div className="relative group">
                <select 
                    className="peer w-full border border-gray-100 p-4 pt-6 pb-2 rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none" 
                    value={editingGroup ? editingGroup.pg_id : newGroup.pg_id} 
                    onChange={e => editingGroup ? setEditingGroup({...editingGroup, pg_id: e.target.value}) : setNewGroup({...newGroup, pg_id: e.target.value})}
                >
                    <option value="" disabled hidden></option>
                    {pgs.map((p: any) => <option key={p.pg_id} value={p.pg_id}>{p.pg_name}</option>)}
                </select>                <label className={`absolute left-4 transition-all pointer-events-none font-black uppercase tracking-tight ${(editingGroup?.pg_id || newGroup.pg_id) ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-gray-400'}`}>Permission Group</label>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button 
                onClick={() => groupMutation.mutate(editingGroup ? { hostgroup_id: editingGroup.hostgroup_id, hostgroup: editingGroup.hostgroup, owner: editingGroup.owner, pg_id: editingGroup.pg_id } : newGroup)} 
                disabled={groupMutation.isPending}
                className="w-full bg-blue-600 text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
                {groupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Hostgroup'}
            </button>
          </div>
      </Modal>

      {/* Hostname Modal */}
      <Modal isOpen={isHostModalOpen} onClose={() => { setIsHostModalOpen(false); setEditingHost(null); }} title={editingHost ? `Edit: ${editingHost.hostname}` : "Create New Hostname"} maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-4 pt-2">
            {Object.keys(hostForm).map(key => (
                <div key={key} className={key === 'OS' ? 'col-span-2' : ''}>
                    {key === 'hostgroup_id' ? (
                        <div className="relative">
                            <select 
                                value={hostForm.hostgroup_id} 
                                onChange={e => setHostForm({...hostForm, hostgroup_id: e.target.value})} 
                                className="peer w-full border border-gray-100 bg-gray-50 p-4 pt-6 pb-2 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                            >
                                <option value="" disabled hidden></option>
                                {hostGroups.map((g: any) => <option key={g.hostgroup_id} value={g.hostgroup_id}>{g.hostgroup}</option>)}
                            </select>
                            <label className={`absolute left-4 transition-all pointer-events-none font-black uppercase tracking-tight ${hostForm.hostgroup_id ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-gray-400'}`}>Hostgroup</label>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    ) : key === 'OS' ? (
                        <div className="relative">
                            <select 
                                value={hostForm.OS} 
                                onChange={e => setHostForm({...hostForm, OS: e.target.value})} 
                                className="peer w-full border border-gray-100 bg-gray-50 p-4 pt-6 pb-2 rounded-xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none"
                            >
                                <option value="" disabled hidden></option>
                                <option value="Red Hat">Red Hat</option>
                                <option value="Solaris">Solaris</option>
                                <option value="AIX">AIX</option>
                                <option value="Ubuntu">Ubuntu</option>
                                <option value="Rocky">Rocky</option>
                                <option value="CentOS">CentOS</option>
                                <option value="Other">Other</option>
                            </select>
                            <label className={`absolute left-4 transition-all pointer-events-none font-black uppercase tracking-tight ${hostForm.OS ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-gray-400'}`}>Operating System</label>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    ) : (
                        <FloatingInput 
                            label={key} 
                            value={(hostForm as any)[key]} 
                            onChange={e => setHostForm({...hostForm, [key]: e.target.value})} 
                        />
                    )}
                </div>
            ))}
            <button 
                onClick={() => hostMutation.mutate(editingHost ? { ...hostForm, hostname_id: editingHost.hostname_id } : hostForm)} 
                disabled={hostMutation.isPending}
                className="col-span-2 bg-slate-900 text-white p-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl disabled:opacity-50 mt-2"
            >
                {hostMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingHost ? 'Update Hostname' : 'Save Hostname'}
            </button>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete}
        title={confirmData?.type === 'group' ? 'Delete Hostgroup' : 'Delete Hostname'}
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
