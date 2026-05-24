'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, Users, Save, ShieldCheck, Edit2, Trash2, X, UserCircle, ChevronDown, ChevronRight, User, MoreVertical } from 'lucide-react';
import { useToast } from '@/components/common/Toast';
import FloatingInput from '@/components/common/FloatingInput';

const ManageUserGroups = () => {
    const { showToast } = useToast();
    const [data, setData] = useState<{ groups: any[], pgs: any[], users: any[], allHgs: any[] }>({ groups: [], pgs: [], users: [], allHgs: [] });
    const [mappings, setMappings] = useState<{ groupPgs: any[], userGroups: any[], pgh: any[] }>({ groupPgs: [], userGroups: [], pgh: [] });
    const [loading, setLoading] = useState(true);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    const [editingGroup, setEditingGroup] = useState<any>(null);
    const [editFields, setEditFields] = useState({ ug_name: '', member_ids: [] as number[], pg_ids: [] as number[] });
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isAddingPg, setIsAddingPg] = useState(false);
    const [expandedPgs, setExpandedPgs] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [g, p, m1, m2, u, h] = await Promise.all([
                axios.get('/api/admin/user-groups'),
                axios.get('/api/admin/permission-groups'),
                axios.get('/api/admin/user-to-user-groups'),
                axios.get('/api/admin/ug-permission-groups'),
                axios.get('/api/admin/users'),
                axios.get('/api/inventory/hostgroups')
            ]);
            setData({ groups: g.data, pgs: p.data.pgs, users: u.data, allHgs: h.data });
            setMappings({ userGroups: m1.data, groupPgs: m2.data, pgh: p.data.pgh });
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const [createError, setCreateError] = useState('');

    const createGroup = async () => {
        if (!newGroupName) return;
        setCreateError('');
        try {
            await axios.post('/api/admin/user-groups', { ug_name: newGroupName });
            setNewGroupName(''); setIsCreateModalOpen(false); fetchData();
            showToast("Group created successfully", 'success');
        } catch (err: any) {
            setCreateError(err.response?.data?.error || 'Failed to create group');
        }
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

    const deleteGroup = async (ugId: number) => {
        try {
            await axios.post('/api/admin/user-groups/delete', { ug_id: ugId });
            fetchData();
            showToast("Group deleted successfully", 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to delete group', 'error');
        }
    };

    const saveUpdates = async (overrideFields?: any) => {
        const fields = overrideFields || editFields;
        try {
            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...fields });
            fetchData();
            showToast("Group updated successfully", 'success');
        } catch (err: any) {
            showToast(err.response?.data?.error || 'Failed to update group', 'error');
        }
    };

    if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" /></div>;

    return (
        <div className="admin-container bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 text-xs">User Group Management</h3>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-4 gap-4">
                    {data.groups.map((g: any) => {
                        const currentPgs = mappings.groupPgs.filter((m: any) => m.ug_id === g.ug_id);
                        const groupMembers = mappings.userGroups
                            .filter((m: any) => m.ug_id === g.ug_id)
                            .filter((m: any) => data.users.some((u: any) => u.user_id === m.user_id));
                        
                        return (
                            <div key={g.ug_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-green-50 p-2 rounded-lg text-green-600"><Users className="w-4 h-4" /></div>
                                        <h4 className="font-bold text-gray-900 text-xs">{g.ug_name}</h4>
                                    </div>
                                    <div className="relative">
                                        {!['admin', 'sysadmin', 'operation'].includes(g.ug_name.toLowerCase()) && (
                                            <>
                                                <button onClick={() => setActiveMenu(activeMenu === g.ug_id ? null : g.ug_id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                                {activeMenu === g.ug_id && (
                                                    <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 w-24">
                                                        <button onClick={() => {
                                                            setEditingGroup(g);
                                                            setEditFields({
                                                                ug_name: g.ug_name,
                                                                member_ids: groupMembers.map((m: any) => m.user_id),
                                                                pg_ids: currentPgs.map((m: any) => m.pg_id)
                                                            });
                                                            setActiveTab(0);
                                                            setExpandedPgs([]);
                                                            setIsAddingUser(false);
                                                            setIsAddingPg(false);
                                                            setActiveMenu(null);
                                                        }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50">
                                                            <Edit2 className="w-3 h-3" /> Edit
                                                        </button>
                                                        <button onClick={() => { setDeleteTargetId(g.ug_id); setIsDeleteModalOpen(true); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-red-600 hover:bg-red-50">
                                                            <Trash2 className="w-3 h-3" /> Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Members</div>
                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{groupMembers.length}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {groupMembers.slice(0, 5).map((m: any) => {
                                            const user = data.users.find((u: any) => u.user_id === m.user_id);
                                            return user ? <span key={user.user_id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[9px]">{user.username}</span> : null;
                                        })}
                                        {groupMembers.length > 5 && <span className="text-[9px] text-gray-400">+{groupMembers.length - 5}</span>}
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <div className="text-[10px] text-gray-500 font-bold uppercase">Associated</div>
                                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{currentPgs.length}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {currentPgs.map((p: any) => {
                                            const pg = data.pgs.find((item: any) => item.pg_id === (p as any).pg_id);
                                            return pg ? <span key={(pg as any).pg_id} className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-bold text-[9px] uppercase">{pg.pg_name}</span> : null;
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <TabbedModal
                isOpen={!!editingGroup}
                onClose={() => { setEditingGroup(null); setActiveTab(0); }}
                title={`Edit Group: ${editingGroup?.ug_name || ''}`}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    {
                        label: 'General', content: (
                            <div className="space-y-4 pt-2">
                                <FloatingInput
                                    label="Group Name"
                                    value={editFields.ug_name}
                                    onChange={e => setEditFields({ ...editFields, ug_name: e.target.value })}
                                />
                                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                                    <button onClick={() => saveUpdates()} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-[10px] font-bold shadow-sm hover:bg-blue-700 transition-all capitalize">Save Changes</button>
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'Members', content: (
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-[9px] capitalize tracking-wide">
                                        <Plus className="w-3 h-3" /> Add Member
                                    </button>
                                </div>

                                <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                                    <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                                        <Users className="w-3 h-3" /> Group Members
                                    </span>

                                    {editFields.member_ids.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            {editFields.member_ids.map(uId => {
                                                const user = data.users.find((u: any) => u.user_id === uId);
                                                return user ? (
                                                    <div key={uId} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group/item hover:border-blue-200 transition-all overflow-hidden">
                                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                                            <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform flex-shrink-0"><User className="w-3.5 h-3.5 text-blue-600" /></div>
                                                            <span className="text-xs font-bold text-gray-700 truncate">{user.username}</span>
                                                        </div>
                                                        <button onClick={async () => {
                                                            const nextMembers = editFields.member_ids.filter(i => i !== uId);
                                                            setEditFields({ ...editFields, member_ids: nextMembers });
                                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, member_ids: nextMembers });
                                                            fetchData();
                                                        }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <p className="text-xs text-gray-400 font-bold italic">No members in this group.</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingUser && (
                                    <div className="relative border-2 border-dashed border-blue-100 rounded-2xl p-5 pt-7 bg-blue-50/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-blue-600 border-2 border-blue-50 rounded-full shadow-sm flex items-center gap-1.5">
                                            <UserCircle className="w-3 h-3" /> Available Users
                                        </span>
                                        <button onClick={() => setIsAddingUser(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>

                                        {data.users.filter((u: any) => !editFields.member_ids.includes(u.user_id)).length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {data.users.map((u: any) => !editFields.member_ids.includes(u.user_id) && (
                                                    <button key={u.user_id} onClick={async () => {
                                                        const nextMembers = [...editFields.member_ids, u.user_id];
                                                        setEditFields({ ...editFields, member_ids: nextMembers });
                                                        await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, member_ids: nextMembers });
                                                        fetchData();
                                                        setIsAddingUser(false);
                                                    }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                                        <div className="bg-blue-50 p-1.5 rounded-lg group-hover/btn:bg-blue-500 transition-colors"><User className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                                        <span className="text-[10px] font-bold capitalize tracking-tight truncate">{u.username}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-2 text-xs text-gray-400 font-bold italic">All users already members.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        label: 'Associated', content: (
                            <div className="space-y-4 pt-4">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingPg(true)} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-bold text-[9px] capitalize tracking-wide">
                                        <Plus className="w-3 h-3" /> Add Permission Group
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {editFields.pg_ids.length > 0 ? editFields.pg_ids.map(pgId => {
                                        const pg = data.pgs.find((p: any) => p.pg_id === pgId);
                                        const associatedHgs = mappings.pgh.filter((m: any) => m.pg_id === pgId);
                                        const isExpanded = expandedPgs.includes(pgId);
                                        if (!pg) return null;
                                        return (
                                            <div key={pgId} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm bg-white">
                                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setExpandedPgs(prev => isExpanded ? prev.filter(i => i !== pgId) : [...prev, pgId])}>
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="w-4 h-4 text-green-600" />
                                                        <span className="font-bold text-xs text-gray-800">{pg.pg_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold capitalize border border-blue-100">{associatedHgs.length} Hostgroups</span>
                                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                                                        <button onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const nextPgs = editFields.pg_ids.filter(i => i !== pgId);
                                                            setEditFields({ ...editFields, pg_ids: nextPgs });
                                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                                            fetchData();
                                                        }} className="text-gray-400 hover:text-red-500 p-1"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 gap-2">
                                                        {associatedHgs.map((m: any) => {
                                                            const hg = data.allHgs.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                            return <div key={m.hostgroup_id} className="bg-white p-2 rounded-lg border border-gray-100 flex items-center gap-2 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                {(hg as any)?.hostgroup || 'Unknown'}
                                                            </div>;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                                            <p className="text-xs text-gray-400 font-bold italic">No associated permission groups.</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingPg && (
                                    <div className="relative border-2 border-dashed border-green-100 rounded-2xl p-5 pt-7 bg-green-50/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-green-600 border-2 border-green-50 rounded-full shadow-sm flex items-center gap-1.5">
                                            <ShieldCheck className="w-3 h-3" /> Available Permission Groups
                                        </span>
                                        <button onClick={() => setIsAddingPg(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>

                                        {data.pgs.filter((pg: any) => !editFields.pg_ids.includes(pg.pg_id)).length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                {data.pgs.map((pg: any) => !editFields.pg_ids.includes(pg.pg_id) && (
                                                    <button key={pg.pg_id} onClick={async () => {
                                                        const nextPgs = [...editFields.pg_ids, pg.pg_id];
                                                        setEditFields({ ...editFields, pg_ids: nextPgs });
                                                        await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                                        fetchData();
                                                        setIsAddingPg(false);
                                                    }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-green-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                                        <div className="bg-green-50 p-1.5 rounded-lg group-hover/btn:bg-green-500 transition-colors"><ShieldCheck className="w-3.5 h-3.5 text-green-600 group-hover/btn:text-white" /></div>
                                                        <span className="text-[10px] font-bold capitalize tracking-tight truncate">{pg.pg_name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-2 text-xs text-gray-500 italic">All permission groups already assigned.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    },
                ]}
            />

            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }} title="Create New Group" maxWidth="max-w-md">
                <div className="space-y-4 pt-2">
                    <FloatingInput
                        label="Group Name"
                        value={newGroupName}
                        onChange={e => { setNewGroupName(e.target.value); if (createError) setCreateError(''); }}
                        className={createError ? 'border-red-500 ring-1 ring-red-500' : ''}
                    />
                    {createError && <p className="text-[11px] font-bold text-red-500 pl-1">{createError}</p>}
                    <button onClick={createGroup} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs capitalize tracking-wide hover:bg-blue-700 transition-all shadow-md mt-2 flex items-center justify-center">
                        Create Group
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => deleteTargetId && deleteGroup(deleteTargetId)}
                title="Delete Group"
                message="Are you sure you want to delete this group? This action cannot be undone."
            />

        </div>
    );
};
export default ManageUserGroups;
