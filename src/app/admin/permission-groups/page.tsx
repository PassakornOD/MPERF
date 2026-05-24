'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, ShieldCheck, X, ChevronDown, ChevronRight, Server, Search, Trash2, Edit2, Users, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import FloatingInput from '@/components/common/FloatingInput';

const PermissionGroupsPage = () => {
  const { showToast } = useToast();
  const [data, setData] = useState<any>({ pgs: [], pgh: [] });
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [editingPg, setEditingPg] = useState<any>(null);
  const [ugUsers, setUgUsers] = useState<any[]>([]);
  const [allHostnames, setAllHostnames] = useState<any[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pgToDelete, setPgToDelete] = useState<number | null>(null);
  const [editFields, setEditFields] = useState({ pg_name: '', hostgroup_ids: [] as number[] });
  const [activeTab, setActiveTab] = useState(0);
  const [isAddingHg, setIsAddingHg] = useState(false);
  const [expandedPgId, setExpandedPgId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pgRes, hgRes, ugRes, ugPgRes, uuRes, usersRes, hostnamesRes] = await Promise.all([
        axios.get('/api/admin/permission-groups'),
        axios.get('/api/inventory/hostgroups'),
        axios.get('/api/admin/user-groups'),
        axios.get('/api/admin/ug-permission-groups'),
        axios.get('/api/admin/user-to-user-groups'),
        axios.get('/api/admin/users'),
        axios.get('/api/inventory/hostnames')
      ]);
      setData({ ...pgRes.data, ugs: ugRes.data || [], ugPgs: ugPgRes.data || [], users: usersRes.data || [] });
      setHostgroups(hgRes.data);
      setUgUsers(uuRes.data || []);
      setAllHostnames(hostnamesRes.data || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const [createError, setCreateError] = useState("");

  const createGroup = async () => {
    if (!newGroupName) return;
    setCreateError("");
    try {
        await axios.post("/api/admin/permission-groups", { pg_name: newGroupName });
        setNewGroupName(""); setIsCreateModalOpen(false); fetchData();
        showToast("Permission group created successfully", "success");
    } catch (err: any) {
        setCreateError(err.response?.data?.error || "Failed to create group");
    }
  };

  const deletePg = async (e: React.MouseEvent, pgId: number) => {
    e.stopPropagation();
    setPgToDelete(pgId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pgToDelete) return;
    try {
        await axios.post('/api/admin/permission-groups/delete', { pg_id: pgToDelete });
        fetchData();
        showToast("Permission group deleted successfully", 'success');
    } catch (err: any) {
        showToast(err.response?.data?.error || 'Failed to delete group', 'error');
    } finally {
        setPgToDelete(null);
    }
  };

  const savePgUpdates = async (overrideFields?: any) => {
    const fields = overrideFields || editFields;
    try {
        await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...fields });
        fetchData();
        showToast("Permission group updated successfully", 'success');
    } catch (err: any) {
        setEditingPg(null);
        showToast(err.response?.data?.error || 'Failed to update group', 'error');
    }
  };

  const openEdit = (e: React.MouseEvent, pg: any, hgs: any[]) => {
    e.stopPropagation();
    setEditingPg(pg);
    setEditFields({
        pg_name: pg.pg_name,
        hostgroup_ids: hgs.map((m: any) => m.hostgroup_id)
    });
    setActiveTab(0);
    setIsAddingHg(false);
  };

  const toggleExpand = (pgId: string) => {
    setExpandedPgId(prev => prev === pgId ? null : pgId);
  };

  const assignedHostgroupIds = new Set(data.pgh.map((p: any) => p.hostgroup_id));
  const availableHostgroups = hostgroups.filter(hg => !assignedHostgroupIds.has(hg.hostgroup_id));

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" /></div>;

  return (
    <div className="admin-container space-y-8">
      {/* Top Section: Permission Groups (2 columns) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-1.5 rounded-lg text-white shadow-sm"><ShieldCheck className="w-4 h-4" /></div>
                    <h3 className="font-bold text-gray-700 text-xs">Permission Groups</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4 items-start">
                {data.pgs.map((pg: any) => {
                    const groupHgs = data.pgh.filter((m: any) => m.pg_id === pg.pg_id);
                    return (
                        <div key={pg.pg_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="bg-green-50 p-2 rounded-lg text-green-600"><ShieldCheck className="w-4 h-4" /></div>
                                    <h4 className="font-bold text-gray-900 text-xs">{pg.pg_name}</h4>
                                </div>
                                <div className="relative">
                                    <button onClick={() => setActiveMenu(activeMenu === pg.pg_id ? null : pg.pg_id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                    {activeMenu === pg.pg_id && (
                                        <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 w-24">
                                            <button onClick={(e) => { openEdit(e, pg, groupHgs); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50">
                                                <Edit2 className="w-3 h-3" /> Edit
                                            </button>
                                            <button onClick={(e) => { deletePg(e, pg.pg_id); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-red-600 hover:bg-red-50">
                                                <Trash2 className="w-3 h-3" /> Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Associated</div>
                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{data.ugPgs.filter((m: any) => m.pg_id === pg.pg_id).length}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {data.ugPgs.filter((m: any) => m.pg_id === pg.pg_id).map((m: any) => {
                                        const ug = data.ugs.find((u: any) => u.ug_id === m.ug_id);
                                        return ug ? <span key={m.ug_id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[9px]">{ug.ug_name}</span> : null;
                                    })}
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mb-2">
                                    <div className="text-[10px] text-gray-500 font-bold uppercase">Hostgroups</div>
                                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{groupHgs.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {groupHgs.slice(0, 5).map((m: any) => {
                                        const hg = hostgroups.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                        return hg ? <span key={m.hostgroup_id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[9px]">{hg.hostgroup}</span> : null;
                                    })}
                                    {groupHgs.length > 5 && <span className="text-[9px] text-gray-400">+{groupHgs.length - 5}</span>}
                                    {groupHgs.length === 0 && <span className="text-[9px] text-gray-400 italic">None</span>}
                                </div>
                            </div>                        </div>
                    );
                })}
            </div>
            
            {availableHostgroups.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500 p-1.5 rounded-lg text-white shadow-sm"><Server className="w-4 h-4" /></div>
                            <h3 className="font-bold text-gray-700 text-xs">Unassigned Hostgroups</h3>
                        </div>
                        <div className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-[9px] font-black border border-orange-100 uppercase tracking-widest">
                            {availableHostgroups.length} Remaining
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {availableHostgroups.map(hg => (
                            <div key={hg.hostgroup_id} className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 shadow-sm hover:border-orange-200 transition-all">
                                <Server className="w-2.5 h-2.5 text-orange-500" />
                                <span className="text-[9px] font-bold text-gray-700 truncate">{hg.hostgroup}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(""); }} title="Create New Permission Group" maxWidth="max-w-md">
        <div className="space-y-4 pt-2">
            <FloatingInput 
                label="Group Name"
                value={newGroupName} 
                onChange={e => { setNewGroupName(e.target.value); if(createError) setCreateError(""); }} 
                className={createError ? "border-red-500 ring-1 ring-red-500" : ""}
            />
            {createError && <p className="text-[11px] font-bold text-red-500 pl-1">{createError}</p>}
            <button onClick={createGroup} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-xs capitalize hover:bg-slate-800 transition-all shadow-md mt-2 flex items-center justify-center">
                Create Group
            </button>
        </div>
      </Modal>

      {/* Edit Tabbed Modal */}
      <TabbedModal
        isOpen={!!editingPg}
        onClose={() => { setEditingPg(null); setActiveTab(0); }}
        title={`Edit Permission Group: ${editingPg?.pg_name || ''}`}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
            { label: 'General', content: (
                <div className="space-y-4 pt-2">
                    <FloatingInput 
                        label="Group Name"
                        value={editFields.pg_name} 
                        onChange={e => setEditFields({...editFields, pg_name: e.target.value})} 
                    />
                    <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <button onClick={() => savePgUpdates()} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all capitalize">Save Changes</button>
                    </div>
                </div>
            ) },
            { label: 'Associated', content: (
                <div className="space-y-3 pt-4">
                    {editingPg && data.ugPgs && data.ugPgs.filter((m: any) => m.pg_id === editingPg.pg_id).length > 0 ? data.ugPgs.filter((m: any) => m.pg_id === editingPg.pg_id).map((m: any) => {
                        const ug = data.ugs.find((u: any) => u.ug_id === m.ug_id);
                        if (!ug) return null;
                        const members = ugUsers.filter((uu: any) => uu.ug_id === ug.ug_id);
                        const isExpanded = expandedPgId === `ug-${ug.ug_id}`;
                        return (
                            <div key={m.ug_id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedPgId(isExpanded ? null : `ug-${ug.ug_id}`)}>
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4 text-green-600" />
                                        <span className="font-bold text-xs text-gray-800">{ug.ug_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-blue-100">{members.length} USERS</span>
                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                    </div>
                                </div>
                                {isExpanded && (
                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 gap-2">
                                        {members.map((mem: any) => {
                                            const user = data.users?.find((u: any) => u.user_id === mem.user_id);
                                            return <div key={mem.user_id} className="bg-white p-2 rounded-lg border border-gray-100 flex items-center gap-2 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                {user?.username || 'Unknown'}
                                            </div>;
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-xs text-gray-400 font-bold italic">No associated user groups.</p>
                        </div>
                    )}
                </div>
            ) },
            { label: 'Hostgroups', content: (
                <div className="space-y-3 pt-3">
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingHg(true)} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold text-[9px] capitalize">
                            <Plus className="w-3 h-3" /> Add Hostgroup
                        </button>
                    </div>

                    <div className="relative border border-gray-100 rounded-lg p-3 pt-5 bg-white shadow-sm">
                        <span className="absolute -top-2 left-3 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-gray-100 rounded-full shadow-sm flex items-center gap-1">
                            <Server className="w-3 h-3" /> Assigned Hostgroups
                            <span className="bg-blue-50 text-blue-600 px-1.5 rounded-full text-[9px] font-black">{editFields.hostgroup_ids.length}</span>
                        </span>

                        {editFields.hostgroup_ids.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {editFields.hostgroup_ids.map(hgId => {
                                    const hg = hostgroups.find((h: any) => h.hostgroup_id === hgId);
                                    const hostCount = allHostnames.filter((h: any) => h.hostgroup_id === hgId).length;
                                    return hg ? (
                                        <div key={hgId} className="bg-white px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 shadow-sm hover:border-blue-200 transition-all">
                                            <Server className="w-2.5 h-2.5 text-blue-600" />
                                            <span className="text-[10px] font-bold text-gray-700">{hg.hostgroup}</span>
                                            <span className="text-[9px] bg-gray-100 text-gray-500 px-1 rounded-full font-black">{hostCount}</span>
                                            <button onClick={async () => { 
                                                const nextHgs = editFields.hostgroup_ids.filter(i => i !== hgId);
                                                setEditFields({...editFields, hostgroup_ids: nextHgs});
                                                await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                                fetchData();
                                            }} className="text-gray-400 hover:text-red-500 ml-1"><X className="w-3 h-3" /></button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-[10px] text-gray-400 font-bold italic">No hostgroups assigned.</p>
                            </div>
                        )}
                    </div>

                    {isAddingHg && (
                        <div className="relative border border-dashed border-blue-100 rounded-lg p-3 pt-6 bg-blue-50/10 mt-8 animate-in fade-in slide-in-from-top-1 duration-200">
                            <span className="absolute -top-2 left-3 bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-50 rounded-full shadow-sm flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Available Hostgroups
                                <span className="bg-blue-100 text-blue-700 px-1.5 rounded-full text-[9px] font-black">{availableHostgroups.length}</span>
                            </span>
                            <button onClick={() => setIsAddingHg(false)} className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-3 h-3" /></button>
                            
                            {availableHostgroups.length > 0 ? (
                                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">
                                    {availableHostgroups.map(hg => {
                                        const hostCount = allHostnames.filter((h: any) => h.hostgroup_id === hg.hostgroup_id).length;
                                        return (
                                        <button key={hg.hostgroup_id} onClick={async () => { 
                                            const nextHgs = [...editFields.hostgroup_ids, hg.hostgroup_id];
                                            setEditFields({...editFields, hostgroup_ids: nextHgs});
                                            await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                            fetchData();
                                        }} className="bg-white px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1.5 shadow-sm hover:border-blue-300 transition-all">
                                            <Plus className="w-2.5 h-2.5 text-blue-600" />
                                            <span className="text-[9px] font-black uppercase tracking-tight text-gray-700">{hg.hostgroup}</span>
                                            <span className="text-[8px] bg-gray-100 text-gray-500 px-1 rounded-full font-black">{hostCount}</span>
                                        </button>
                                    )})}
                                </div>
                            ) : (
                                <p className="text-center py-1 text-[10px] text-gray-400 font-bold italic">All assigned.</p>
                            )}
                        </div>
                    )}
                </div>
            ) }
        ]}
      />

      <ConfirmModal 
        isOpen={isConfirmOpen} 
        onClose={() => setIsConfirmOpen(false)} 
        onConfirm={handleConfirmDelete} 
        title="Delete Permission Group" 
        message="Are you sure you want to delete this permission group? This action cannot be undone."
      />
    </div>
  );
};

export default PermissionGroupsPage;
