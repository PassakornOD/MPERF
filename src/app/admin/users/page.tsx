'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, User, Trash2, Edit2, Users, X, ChevronDown, ChevronRight, ShieldCheck, MoreVertical, PlusCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/common/Toast';
import FloatingInput from '@/components/common/FloatingInput';

const AdminUsersPage = () => {
    const { data: session } = useSession();
    const { showToast } = useToast();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [roles, setRoles] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [userMappings, setUserMappings] = useState<any[]>([]);
    const [pgs, setPgs] = useState<any[]>([]);
    const [pgh, setPgh] = useState<any[]>([]);
    const [ugPgs, setUgPgs] = useState<any[]>([]);
    const [allHostgroups, setAllHostgroups] = useState<any[]>([]);

    const [newUser, setNewUser] = useState({ username: '', password: '', confirmPassword: '', role: 'sysadmin' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<number | null>(null);
    const [editUser, setEditUser] = useState<any>(null);
    const [editFields, setEditFields] = useState({ role: '', group_ids: [] as number[] });
    const [isAddingGroup, setIsAddingGroup] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [expandedPgs, setExpandedPgs] = useState<number[]>([]);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [u, r, g, m, p, ugpg, hg] = await Promise.all([
                axios.get('/api/admin/users'),
                axios.get('/api/admin/roles'),
                axios.get('/api/admin/user-groups'),
                axios.get('/api/admin/user-to-user-groups'),
                axios.get('/api/admin/permission-groups'),
                axios.get('/api/admin/ug-permission-groups'),
                axios.get('/api/inventory/hostgroups')
            ]);
            setUsers(u.data);
            setRoles(r.data.roles);
            setGroups(g.data);
            setUserMappings(m.data);
            setPgs(p.data.pgs);
            setPgh(p.data.pgh);
            setUgPgs(ugpg.data);
            setAllHostgroups(hg.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => { }, [groups]);

    const deleteUser = async (userId: number) => {
        if (userId === Number((session?.user as any)?.id)) {
            showToast("You cannot delete your own account.", 'error');
            return;
        }
        setUserToDelete(userId);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            await axios.delete(`/api/admin/users?user_id=${userToDelete}`);
            setUsers(users.filter(u => u.user_id !== userToDelete));
            showToast("User deleted successfully", 'success');
        } catch (err: any) { showToast(err.response?.data?.error || 'Failed to delete user', 'error'); }
        finally { setUserToDelete(null); }
    };

    const [createError, setCreateError] = useState('');

    const handleCreateUser = async () => {
        setCreateError('');
        if (newUser.password !== newUser.confirmPassword) {
            setCreateError('Passwords do not match');
            return;
        }
        try {
            await axios.post('/api/admin/users', { username: newUser.username, password: newUser.password, role: newUser.role });
            setNewUser({ username: '', password: '', confirmPassword: '', role: 'sysadmin' });
            setIsModalOpen(false);
            fetchData();
            showToast("User created successfully", 'success');
        } catch (err: any) {
            setCreateError(err.response?.data?.error || 'Failed to create user');
        }
    };

    if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" /></div>;

    return (
        <div className="space-y-8 animate-ease-in">
            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-sm text-foreground capitalize ">User Profile</h3>
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">Manage system access and global roles</p>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-all shadow-md flex items-center gap-2 group">
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-xs capitalize ">Create User</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar border border-border rounded-xl shadow-inner bg-background/20">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-card border-b border-border">
                                    <th className="px-8 py-5 text-xs text-muted-foreground capitalize ">Identity</th>
                                    <th className="px-8 py-5 text-xs text-muted-foreground capitalize ">Role Authority</th>
                                    <th className="px-8 py-5 text-xs text-muted-foreground capitalize ">Memberships</th>
                                    <th className="px-8 py-5 text-xs text-muted-foreground capitalize  text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 bg-card">
                                {users.map(u => {
                                    const userGroups = userMappings.filter((m: any) => m.user_id === u.user_id);
                                    const isSelf = Number(u.user_id) === Number((session?.user as any)?.id);

                                    return (
                                        <tr key={u.user_id} className="group/row hover:bg-blue-50/40 transition-all duration-200 border-b border-border/30 last:border-0">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-blue-600 shadow-sm group-hover/row:scale-105 transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-foreground text-sm capitalize tracking-tight leading-none mb-1 group-hover/row:text-blue-700 transition-colors">{u.username}</p>
                                                        {isSelf && <span className="bg-emerald-50 text-emerald-600 text-[8px] capitalize px-1.5 py-0.5 rounded-xl border border-emerald-100 shadow-sm">Current Session</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[9px] capitalize  border ${u.role === 'admin' ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20' :
                                                    u.role === 'sysadmin' ? 'bg-slate-900 text-white border-slate-800' :
                                                        'bg-slate-100 text-slate-600 border-border shadow-inner'
                                                    }`}>{u.role}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-2 max-w-[280px]">
                                                    {userGroups.length > 0 ? userGroups.slice(0, 2).map((m: any) => {
                                                        const group = groups.find((g: any) => g.ug_id === m.ug_id);
                                                        return group ? <span key={group.ug_id} className="bg-card border border-border text-muted-foreground px-2.5 py-1 rounded-xl font-bold text-[9px] shadow-sm whitespace-nowrap">{group.ug_name}</span> : null;
                                                    }) : <span className="text-[9px] font-bold text-slate-300 capitalize  italic">No Active Groups</span>}
                                                    {userGroups.length > 2 && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-xl text-[9px] shadow-sm border border-blue-100">+{userGroups.length - 2}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="relative flex justify-end">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === u.user_id ? null : u.user_id)}
                                                        className={`p-2.5 rounded-xl transition-all border ${activeMenu === u.user_id ? 'bg-card shadow-md text-foreground border-border' : 'text-slate-300 hover:text-slate-600 border-transparent hover:bg-card hover:shadow-sm hover:border-border'}`}
                                                    >
                                                        <MoreVertical className="w-4.5 h-4.5" />
                                                    </button>
                                                    {activeMenu === u.user_id && (
                                                        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] py-2 z-[100] w-44 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <button onClick={() => {
                                                                setEditUser(u);
                                                                setEditFields({ role: u.role, group_ids: userMappings.filter((m: any) => m.user_id === u.user_id).map((m: any) => m.ug_id) });
                                                                setActiveTab(0);
                                                                setIsAddingGroup(false);
                                                                setActiveMenu(null);
                                                            }} className="flex items-center gap-3 w-full px-5 py-3 text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all capitalize ">
                                                                <Edit2 className="w-4 h-4" /> Edit
                                                            </button>
                                                            {!isSelf && !['sysreport', 'mfadmin'].includes(u.username) && (
                                                                <button onClick={() => { deleteUser(u.user_id); setActiveMenu(null); }} className="flex items-center gap-3 w-full px-5 py-3 text-[11px] text-red-500 hover:bg-red-50 transition-all border-t border-slate-50 capitalize ">
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <TabbedModal
                isOpen={!!editUser}
                onClose={() => { setEditUser(null); setActiveTab(0); }}
                title={`Edit User Profile`}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    {
                        label: 'General', content: (
                            <div className="space-y-8">
                                <div className="flex gap-4 p-6 bg-background/50 rounded-xl items-center border border-border shadow-inner">
                                    <div className="bg-card p-4 rounded-xl text-blue-600 shadow-sm border border-border"><User className="w-8 h-8" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground capitalize  mb-0.5">Identification</p>
                                        <p className="text-xl text-foreground tracking-tight">{editUser?.username}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground capitalize  mb-4 ml-1">Assigned Role</p>
                                    <div className="grid grid-cols-3 gap-3">
                                        {roles.map(r => {
                                            const isSelf = Number(editUser?.user_id) === Number((session?.user as any)?.id);
                                            const isProtected = editUser?.username === 'sysreport' || editUser?.username === 'mfadmin';
                                            const isSelected = editFields.role === r.role_name;

                                            return (
                                                <button
                                                    key={r.role_id}
                                                    disabled={isProtected || isSelf}
                                                    onClick={async () => {
                                                        if (isProtected || isSelf) return;
                                                        await axios.put('/api/admin/users', { user_id: editUser.user_id, role: r.role_name });
                                                        setEditFields({ ...editFields, role: r.role_name });
                                                        fetchData();
                                                    }}
                                                    className={`px-4 py-3 rounded-xl text-xs capitalize  transition-all duration-300 border ${isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20'
                                                        : 'bg-card border-border text-muted-foreground hover:border-slate-300 hover:text-slate-600 shadow-sm'
                                                        } ${(isProtected || isSelf) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                                >
                                                    {r.role_name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'Member Of', content: (
                            <div className="space-y-6 pt-2">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingGroup(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs capitalize  transition-all">
                                        <PlusCircle className="w-4 h-4" /> Add to Group
                                    </button>
                                </div>

                                <div className="relative border border-border rounded-xl p-6 pt-10 bg-background/20 shadow-inner">
                                    <span className="absolute -top-3 left-6 bg-card px-4 py-1.5 text-[9px] capitalize  text-blue-600 border border-border rounded-full shadow-sm flex items-center gap-2">
                                        <Users className="w-3.5 h-3.5" /> Active Memberships
                                    </span>

                                    {editFields.group_ids.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {editFields.group_ids.map(ugId => {
                                                const group = groups.find((g: any) => g.ug_id === ugId);
                                                const isPersonalGroup = group?.ug_name.toLowerCase() === editUser?.username.toLowerCase();

                                                return group ? (
                                                    <div key={ugId} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl group/item hover:border-blue-200 transition-all shadow-sm">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-background p-2 rounded-xl group-hover/item:scale-110 transition-transform flex-shrink-0"><Users className="w-4 h-4 text-blue-600" /></div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-xs text-slate-700 truncate">{group.ug_name}</span>
                                                                {isPersonalGroup && <span className="text-[8px] text-blue-500 capitalize ">Personal Group</span>}
                                                            </div>
                                                        </div>
                                                        {!isPersonalGroup && (
                                                            <button onClick={async () => {
                                                                const nextGroups = editFields.group_ids.filter(i => i !== ugId);
                                                                setEditFields({ ...editFields, group_ids: nextGroups });
                                                                await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                                                fetchData();
                                                            }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                                        )}
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <Users className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                            <p className="text-xs text-slate-300 capitalize  italic">No active memberships</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingGroup && (
                                    <div className="relative border-2 border-dashed border-blue-100 rounded-xl p-6 pt-10 bg-blue-50/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <span className="absolute -top-3 left-6 bg-card px-4 py-1.5 text-[9px] capitalize  text-blue-600 border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" /> Available Groups
                                        </span>
                                        <button onClick={() => setIsAddingGroup(false)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>

                                        {groups.filter((g: any) => !editFields.group_ids.includes(Number(g.ug_id))).length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {groups.map((g: any) => !editFields.group_ids.includes(Number(g.ug_id)) && (
                                                    <button key={g.ug_id} onClick={async () => {
                                                        const nextGroups = [...editFields.group_ids, Number(g.ug_id)];
                                                        setEditFields({ ...editFields, group_ids: nextGroups });
                                                        await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                                        fetchData();
                                                        setIsAddingGroup(false);
                                                    }} className="flex items-center gap-3 p-3 bg-card hover:bg-blue-600 hover:text-white border border-border rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                                        <div className="bg-background p-2 rounded-xl group-hover/btn:bg-blue-500 transition-colors shadow-inner"><Users className="w-4 h-4 text-blue-600 group-hover/btn:text-white" /></div>
                                                        <span className="text-xs capitalize tracking-tight truncate">{g.ug_name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-center py-4 text-xs text-slate-300 capitalize  italic">All available groups assigned</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        label: 'Permissions', content: (
                            <div className="space-y-8 mt-2">
                                {editFields.group_ids.map(ugId => {
                                    const group = groups.find((g: any) => g.ug_id === ugId);
                                    const groupPgIds = ugPgs.filter((m: any) => m.ug_id === ugId).map((m: any) => m.pg_id);
                                    const groupPgs = pgs.filter((pg: any) => groupPgIds.includes(pg.pg_id));

                                    if (groupPgs.length === 0) return null;

                                    return (
                                        <div key={ugId} className="relative border border-border rounded-xl p-6 pt-10 bg-background/10">
                                            <span className="absolute -top-3 left-6 bg-card px-4 py-1.5 text-[9px] capitalize  text-muted-foreground border border-border rounded-full shadow-sm flex items-center gap-2 italic">
                                                Inherited from: {group?.ug_name}
                                            </span>
                                            <div className="space-y-3">
                                                {groupPgs.map((pg: any) => {
                                                    const associatedHgs = pgh.filter((m: any) => m.pg_id === pg.pg_id);
                                                    const isExpanded = expandedPgs.includes(pg.pg_id);
                                                    return (
                                                        <div key={pg.pg_id} className="border border-border rounded-xl overflow-hidden shadow-sm bg-card hover:border-blue-100 transition-all">
                                                            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-background" onClick={() => setExpandedPgs(prev => isExpanded ? prev.filter(i => i !== pg.pg_id) : [...prev, pg.pg_id])}>
                                                                <div className="flex items-center gap-3">
                                                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                                    <span className="text-xs text-foreground tracking-tight">{pg.pg_name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl text-[9px] capitalize tracking-tighter border border-emerald-100">
                                                                        {associatedHgs.length} Hostgroups
                                                                    </span>
                                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                                                                </div>
                                                            </div>
                                                            {isExpanded && (
                                                                <div className="p-4 bg-background/50 border-t border-slate-50 text-xs text-slate-600 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                                                    {associatedHgs.map((m: any) => {
                                                                        const hg = allHostgroups.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                                        return <div key={m.hostgroup_id} className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2 shadow-sm">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                            <span className="font-bold truncate">{hg?.hostgroup || 'Unknown'}</span>
                                                                        </div>;
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                {editFields.group_ids.length === 0 && (
                                    <div className="py-20 text-center border border-border rounded-xl bg-background/30">
                                        <ShieldCheck className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                        <p className="text-xs text-slate-300 capitalize  italic">No groups or permissions found</p>
                                    </div>
                                )}
                            </div>
                        )
                    }
                ]}
            />

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCreateError(''); }} title="New User Enrollment" maxWidth="max-w-md">
                <div className="space-y-5 pt-2">
                    <FloatingInput
                        label="Login Username"
                        value={newUser.username}
                        onChange={e => { setNewUser({ ...newUser, username: e.target.value }); if (createError) setCreateError(''); }}
                    />

                    <div className="grid grid-cols-1 gap-5">
                        <FloatingInput
                            type="password"
                            label="Access Password"
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            className={createError ? 'border-red-500 ring-4 ring-red-500/10' : ''}
                        />

                        <FloatingInput
                            type="password"
                            label="Verify Password"
                            value={newUser.confirmPassword}
                            onChange={e => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                            className={createError ? 'border-red-500 ring-4 ring-red-500/10' : ''}
                        />
                    </div>

                    {createError && <p className="text-xs font-bold text-red-500 pl-1 italic">{createError}</p>}

                    <div className="relative group">
                        <select
                            className="peer w-full border border-border p-4 pt-7 pb-2 rounded-xl text-xs font-bold bg-background/50 focus:bg-card focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all appearance-none"
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                        >
                            <option value="" disabled hidden></option>
                            {roles.map(r => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
                        </select>
                        <label className={`absolute left-4 transition-all pointer-events-none capitalize  ${newUser.role ? 'top-2 text-[9px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-xs text-muted-foreground'}`}>Assign Global Role</label>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 pointer-events-none transition-colors" />
                    </div>

                    <button onClick={handleCreateUser} className="w-full bg-blue-600 text-white py-4 rounded-xl text-xs capitalize  hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center group">
                        Register Account <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </Modal>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />
        </div>
    );
};
export default AdminUsersPage;
