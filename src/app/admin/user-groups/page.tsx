'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, Users, Save, ShieldCheck, Edit2, Trash2, X, UserCircle, ChevronDown, ChevronRight, User, MoreVertical, PlusCircle } from 'lucide-react';
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
        <div className="space-y-8 animate-ease-in">
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 capitalize tracking-widest">Group Governance</h3>
                                <p className="text-xs font-bold text-slate-400 capitalize mt-0.5">Organize users into logical administrative units</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 group">
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-xs font-black capitalize tracking-widest">Create Group</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {data.groups.map((g: any) => {
                            const currentPgs = mappings.groupPgs.filter((m: any) => m.ug_id === g.ug_id);
                            const groupMembers = mappings.userGroups
                                .filter((m: any) => m.ug_id === g.ug_id)
                                .filter((m: any) => data.users.some((u: any) => u.user_id === m.user_id));
                            
                            return (
                                <div key={g.ug_id} className="bg-slate-50/30 rounded-[1.5rem] border border-slate-100 p-6 flex flex-col gap-5 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <h4 className="font-black text-slate-900 text-xs truncate max-w-[140px]">{g.ug_name}</h4>
                                        </div>
                                        <div className="relative">
                                            {!['admin', 'sysadmin', 'operation'].includes(g.ug_name.toLowerCase()) && (
                                                <>
                                                    <button 
                                                        onClick={() => setActiveMenu(activeMenu === g.ug_id ? null : g.ug_id)} 
                                                        className={`p-2 rounded-xl transition-all ${activeMenu === g.ug_id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-300 hover:text-slate-600 hover:bg-white hover:shadow-sm'}`}
                                                    >
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                    {activeMenu === g.ug_id && (
                                                        <div className="absolute right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] py-2 z-20 w-32 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
                                                            }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all">
                                                                <Edit2 className="w-3.5 h-3.5" /> Edit Group
                                                            </button>
                                                            <button onClick={() => { setDeleteTargetId(g.ug_id); setIsDeleteModalOpen(true); setActiveMenu(null); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-all border-t border-slate-50">
                                                                <Trash2 className="w-3.5 h-3.5" /> Remove Group
                                                            </button>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4 pt-4 border-t border-slate-100/50 mt-auto">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 capitalize tracking-widest">Enrolled Users</span>
                                                <span className="bg-slate-200/50 text-slate-600 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tighter">{groupMembers.length}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {groupMembers.length > 0 ? groupMembers.slice(0, 3).map((m: any) => {
                                                    const user = data.users.find((u: any) => u.user_id === m.user_id);
                                                    return user ? <span key={user.user_id} className="bg-white border border-slate-100 text-slate-500 px-2 py-1 rounded-lg font-bold text-[9px] shadow-sm">{user.username}</span> : null;
                                                }) : <span className="text-[9px] font-bold text-slate-300 capitalize tracking-wider italic">No Members</span>}
                                                {groupMembers.length > 3 && <span className="text-[9px] font-black text-blue-600 ml-1">+{groupMembers.length - 3} more</span>}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] font-black text-slate-400 capitalize tracking-widest">Permissions</span>
                                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-tighter">{currentPgs.length} Active</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {currentPgs.length > 0 ? currentPgs.map((p: any) => {
                                                    const pg = data.pgs.find((item: any) => item.pg_id === (p as any).pg_id);
                                                    return pg ? <span key={(pg as any).pg_id} className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-1 rounded-lg font-black text-[8px] capitalize tracking-tighter shadow-sm">{pg.pg_name}</span> : null;
                                                }) : <span className="text-[9px] font-bold text-slate-300 capitalize tracking-wider italic">None Assigned</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <TabbedModal
                isOpen={!!editingGroup}
                onClose={() => { setEditingGroup(null); setActiveTab(0); }}
                title={`Edit User Group`}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    {
                        label: 'General', content: (
                            <div className="space-y-8">
                                <div className="flex gap-4 p-6 bg-slate-50/50 rounded-2xl items-center border border-slate-100 shadow-inner">
                                    <div className="bg-white p-4 rounded-2xl text-emerald-600 shadow-sm border border-slate-100"><Users className="w-8 h-8" /></div>
                                    <div>
                                        <p className="text-xs font-black text-slate-400 capitalize tracking-widest mb-0.5">Identification</p>
                                        <p className="font-black text-xl text-slate-900 tracking-tight">{editingGroup?.ug_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-4 pt-2">
                                    <FloatingInput
                                        label="Modify Group Name"
                                        value={editFields.ug_name}
                                        onChange={e => setEditFields({ ...editFields, ug_name: e.target.value })}
                                    />
                                    <div className="flex justify-end pt-4 border-t border-slate-50">
                                        <button onClick={() => saveUpdates()} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs font-black capitalize tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'Members', content: (
                            <div className="space-y-6 pt-2">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-black text-xs capitalize tracking-widest transition-all">
                                        <PlusCircle className="w-4 h-4" /> Add Member
                                    </button>
                                </div>

                                <div className="relative border border-slate-100 rounded-3xl p-6 pt-10 bg-slate-50/20 shadow-inner">
                                    <span className="absolute -top-3 left-6 bg-white px-4 py-1.5 text-[9px] font-black capitalize tracking-widest text-blue-600 border border-slate-100 rounded-full shadow-sm flex items-center gap-2">
                                        <User className="w-3.5 h-3.5" /> Group Members
                                    </span>

                                    {editFields.member_ids.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {editFields.member_ids.map(uId => {
                                                const user = data.users.find((u: any) => u.user_id === uId);
                                                return user ? (
                                                    <div key={uId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-2xl group/item hover:border-blue-200 transition-all shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-slate-50 p-2 rounded-xl group-hover/item:scale-110 transition-transform flex-shrink-0"><User className="w-4 h-4 text-blue-600" /></div>
                                                            <span className="text-xs font-black text-slate-700 truncate">{user.username}</span>
                                                        </div>
                                                        <button onClick={async () => {
                                                            const nextMembers = editFields.member_ids.filter(i => i !== uId);
                                                            setEditFields({ ...editFields, member_ids: nextMembers });
                                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, member_ids: nextMembers });
                                                            fetchData();
                                                        }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all flex-shrink-0"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <User className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                            <p className="text-xs text-slate-300 font-black capitalize tracking-widest italic">No members in this group</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingUser && (
                                    <div className="relative border-2 border-dashed border-blue-100 rounded-3xl p-6 pt-10 bg-blue-50/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <span className="absolute -top-3 left-6 bg-white px-4 py-1.5 text-[9px] font-black capitalize tracking-widest text-blue-600 border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" /> Available Users
                                        </span>
                                        <button onClick={() => setIsAddingUser(false)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-4 h-4" /></button>

                                        {data.users.filter((u: any) => !editFields.member_ids.includes(u.user_id)).length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {data.users.map((u: any) => !editFields.member_ids.includes(u.user_id) && (
                                                    <button key={u.user_id} onClick={async () => {
                                                        const nextMembers = [...editFields.member_ids, u.user_id];
                                                        setEditFields({ ...editFields, member_ids: nextMembers });
                                                        await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, member_ids: nextMembers });
                                                        fetchData();
                                                        setIsAddingUser(false);
                                                    }} className="flex items-center gap-3 p-3 bg-white hover:bg-blue-600 hover:text-white border border-slate-100 rounded-2xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                                        <div className="bg-slate-50 p-2 rounded-xl group-hover/btn:bg-blue-500 transition-colors shadow-inner"><User className="w-4 h-4 text-blue-600 group-hover/btn:text-white" /></div>
                                                        <span className="text-xs font-black capitalize tracking-tight truncate">{u.username}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-4 text-xs text-slate-300 font-black capitalize tracking-widest italic">All users enrolled</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        label: 'Associated', content: (
                            <div className="space-y-6 pt-2">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingPg(true)} className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-black text-xs capitalize tracking-widest transition-all">
                                        <PlusCircle className="w-4 h-4" /> Add Permission
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {editFields.pg_ids.length > 0 ? editFields.pg_ids.map(pgId => {
                                        const pg = data.pgs.find((p: any) => p.pg_id === pgId);
                                        const associatedHgs = mappings.pgh.filter((m: any) => m.pg_id === pgId);
                                        const isExpanded = expandedPgs.includes(pgId);
                                        if (!pg) return null;
                                        return (
                                            <div key={pgId} className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-sm bg-white hover:border-emerald-100 transition-all">
                                                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-50" onClick={() => setExpandedPgs(prev => isExpanded ? prev.filter(i => i !== pgId) : [...prev, pgId])}>
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                        <span className="font-black text-xs text-slate-800 tracking-tight">{pg.pg_name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg text-[9px] font-black capitalize tracking-tighter border border-emerald-100">{associatedHgs.length} Hostgroups</span>
                                                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-300" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-300" />}
                                                        <button onClick={async (e) => {
                                                            e.stopPropagation();
                                                            const nextPgs = editFields.pg_ids.filter(i => i !== pgId);
                                                            setEditFields({ ...editFields, pg_ids: nextPgs });
                                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                                            fetchData();
                                                        }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all ml-1"><X className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-xs text-slate-600 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                                        {associatedHgs.map((m: any) => {
                                                            const hg = data.allHgs.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                            return <div key={m.hostgroup_id} className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center gap-2 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                <span className="font-bold truncate">{(hg as any)?.hostgroup || 'Unknown'}</span>
                                                            </div>;
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }) : (
                                        <div className="py-20 text-center border border-slate-100 rounded-[2rem] bg-slate-50/30">
                                            <ShieldCheck className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                            <p className="text-xs text-slate-300 font-black capitalize tracking-widest italic">No associated permissions</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingPg && (
                                    <div className="relative border-2 border-dashed border-emerald-100 rounded-3xl p-6 pt-10 bg-emerald-50/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <span className="absolute -top-3 left-6 bg-white px-4 py-1.5 text-[9px] font-black capitalize tracking-widest text-emerald-600 border border-emerald-100 rounded-full shadow-sm flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" /> Available Permissions
                                        </span>
                                        <button onClick={() => setIsAddingPg(false)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-slate-900 transition-colors"><X className="w-4 h-4" /></button>

                                        {data.pgs.filter((pg: any) => !editFields.pg_ids.includes(pg.pg_id)).length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {data.pgs.map((pg: any) => !editFields.pg_ids.includes(pg.pg_id) && (
                                                    <button key={pg.pg_id} onClick={async () => {
                                                        const nextPgs = [...editFields.pg_ids, pg.pg_id];
                                                        setEditFields({ ...editFields, pg_ids: nextPgs });
                                                        await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                                        fetchData();
                                                        setIsAddingPg(false);
                                                    }} className="flex items-center gap-3 p-3 bg-white hover:bg-emerald-600 hover:text-white border border-slate-100 rounded-2xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                                        <div className="bg-emerald-50 p-2 rounded-xl group-hover/btn:bg-emerald-500 transition-colors shadow-inner"><ShieldCheck className="w-4 h-4 text-emerald-600 group-hover/btn:text-white" /></div>
                                                        <span className="text-xs font-black capitalize tracking-tight truncate">{pg.pg_name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-4 text-xs text-slate-300 font-black capitalize tracking-widest italic">All permissions assigned</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    },
                ]}
            />

            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(''); }} title="New Group Registration" maxWidth="max-w-md">
                <div className="space-y-6 pt-2">
                    <FloatingInput
                        label="Group Designation Name"
                        value={newGroupName}
                        onChange={e => { setNewGroupName(e.target.value); if (createError) setCreateError(''); }}
                        className={createError ? 'border-red-500 ring-4 ring-red-500/10' : ''}
                    />
                    {createError && <p className="text-xs font-bold text-red-500 pl-1 italic">{createError}</p>}
                    <button onClick={createGroup} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs capitalize tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center group">
                        Register Group <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
