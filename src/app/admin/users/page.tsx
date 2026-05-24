'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, User, Trash2, Edit2, Users, X, ChevronDown, ChevronRight, ShieldCheck, MoreVertical } from 'lucide-react';
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

  useEffect(() => { console.log("DEBUG_GROUPS_STATE:", groups); }, [groups]);

  useEffect(() => { fetchData(); }, []);

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
      console.log("DEBUG_GROUPS:", g.data);
      setUserMappings(m.data);
      setPgs(p.data.pgs);
      setPgh(p.data.pgh);
      setUgPgs(ugpg.data);
      console.log("DEBUG_UGPGS:", ugpg.data);
      setAllHostgroups(hg.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

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
    <div className="admin-container bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-gray-700 text-xs">User Management</h3>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
              <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {users.map(u => {
            const userGroups = userMappings.filter((m: any) => m.user_id === u.user_id);
            return (
              <div key={u.user_id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><User className="w-4 h-4" /></div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-xs">{u.username}</h4>
                      <span className="text-[9px] font-bold text-blue-600 capitalize tracking-wide">{u.role}</span>
                    </div>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveMenu(activeMenu === u.user_id ? null : u.user_id)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {activeMenu === u.user_id && (
                        <div className="absolute right-0 top-6 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-10 w-24">
                            <button onClick={() => { 
                                setEditUser(u); 
                                setEditFields({ role: u.role, group_ids: userMappings.filter((m: any) => m.user_id === u.user_id).map((m: any) => m.ug_id) }); 
                                setActiveTab(0);
                                setIsAddingGroup(false);
                                setActiveMenu(null);
                            }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-gray-700 hover:bg-gray-50">
                                <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            {Number(u.user_id) !== Number((session?.user as any)?.id) && (
                                <button onClick={() => { deleteUser(u.user_id); setActiveMenu(null); }} className="flex items-center gap-2 w-full px-3 py-1.5 text-[10px] text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                        <div className="text-[10px] text-gray-500 font-bold uppercase">Member Of</div>
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[9px] font-bold">{userGroups.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {userGroups.map((m: any) => {
                            const group = groups.find((g: any) => g.ug_id === m.ug_id);
                            return group ? <span key={group.ug_id} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold text-[9px]">{group.ug_name}</span> : null;
                        })}
                        {userGroups.length === 0 && <span className="text-[9px] text-gray-400 italic">None</span>}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <TabbedModal 
        isOpen={!!editUser} 
        onClose={() => { setEditUser(null); setActiveTab(0); }} 
        title={`Edit User: ${editUser?.username || ''}`}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={[
            { label: 'General', content: (
                <div className="space-y-6">
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl items-center border border-gray-100">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-700 shadow-sm"><User className="w-6 h-6" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 capitalize tracking-wide">Username</p>
                            <p className="font-bold text-lg text-gray-900">{editUser?.username}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 capitalize tracking-wide mb-3 ml-1">Select Role</p>
                        <div className="flex gap-2">
                            {roles.map(r => {
                                const isSelf = Number(editUser?.user_id) === Number((session?.user as any)?.id);
                                const isProtected = editUser?.username === 'sysreport' || editUser?.username === 'mfadmin';
                                
                                return (
                                    <button 
                                        key={r.role_id} 
                                        disabled={isProtected || isSelf}
                                        onClick={async () => {
                                            if (isProtected || isSelf) return;
                                            await axios.put('/api/admin/users', { user_id: editUser.user_id, role: r.role_name });
                                            setEditFields({...editFields, role: r.role_name});
                                            fetchData();
                                        }} 
                                        className={`px-5 py-2.5 rounded-xl text-[11px] font-bold capitalize tracking-wide transition-all ${editFields.role === r.role_name ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-gray-50 border border-gray-100 text-gray-400 hover:bg-gray-100'} ${(isProtected || isSelf) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                    >
                                        {r.role_name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            ) },
            { label: 'Member Of', content: (
                <div className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingGroup(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-[10px] capitalize tracking-wide">
                            <Plus className="w-3.5 h-3.5" /> Add Group
                        </button>
                    </div>

                    <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Assigned Groups
                        </span>

                        {editFields.group_ids.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {editFields.group_ids.map(ugId => {
                                    const group = groups.find((g: any) => g.ug_id === ugId);
                                    const isPersonalGroup = group?.ug_name.toLowerCase() === editUser?.username.toLowerCase();

                                    return group ? (
                                        <div key={ugId} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group/item hover:border-blue-200 transition-all overflow-hidden">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform flex-shrink-0"><Users className="w-3.5 h-3.5 text-blue-600" /></div>
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-bold text-gray-700 truncate">{group.ug_name}</span>
                                                    {isPersonalGroup && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-tighter">Personal Group</span>}
                                                </div>
                                            </div>
                                            {!isPersonalGroup && (
                                                <button onClick={async () => { 
                                                    const nextGroups = editFields.group_ids.filter(i => i !== ugId);
                                                    setEditFields({...editFields, group_ids: nextGroups});
                                                    await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                                    fetchData();
                                                }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                            )}
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-gray-400 font-bold italic">No groups assigned to this user.</p>
                            </div>
                        )}
                    </div>

                    {isAddingGroup && (
                        <div className="relative border-2 border-dashed border-blue-100 rounded-2xl p-5 pt-7 bg-blue-50/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-blue-600 border-2 border-blue-50 rounded-full shadow-sm flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> Available Groups
                            </span>
                            <button onClick={() => setIsAddingGroup(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                            
                            {groups.filter((g: any) => !editFields.group_ids.includes(Number(g.ug_id))).length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {groups.map((g: any) => !editFields.group_ids.includes(Number(g.ug_id)) && (
                                        <button key={g.ug_id} onClick={async () => { 
                                            const nextGroups = [...editFields.group_ids, Number(g.ug_id)];
                                            setEditFields({...editFields, group_ids: nextGroups});
                                            await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                            fetchData();
                                            setIsAddingGroup(false); 
                                        }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                            <div className="bg-blue-50 p-1.5 rounded-lg group-hover/btn:bg-blue-500 transition-colors"><Users className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                            <span className="text-[10px] font-bold capitalize tracking-tight truncate">{g.ug_name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-2 text-xs text-gray-400 font-bold italic">All available groups already assigned.</p>
                            )}
                        </div>
                    )}
                </div>
            ) },
            { label: 'Permissions', content: (
                <div className="space-y-8 mt-2">
                    {editFields.group_ids.map(ugId => {
                        const group = groups.find((g: any) => g.ug_id === ugId);
                        const groupPgIds = ugPgs.filter((m: any) => m.ug_id === ugId).map((m: any) => m.pg_id);
                        const groupPgs = pgs.filter((pg: any) => groupPgIds.includes(pg.pg_id));

                        if (groupPgs.length === 0) return null;

                        return (
                            <div key={ugId} className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                                <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-bold capitalize tracking-wide text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                                    <Users className="w-3 h-3" /> {group?.ug_name}
                                </span>
                                <div className="space-y-3">
                                    {groupPgs.map((pg: any) => {
                                        const associatedHgs = pgh.filter((m: any) => m.pg_id === pg.pg_id);
                                        const isExpanded = expandedPgs.includes(pg.pg_id);
                                        return (
                                            <div key={pg.pg_id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPgs(prev => isExpanded ? prev.filter(i => i !== pg.pg_id) : [...prev, pg.pg_id])}>
                                                    <span className="font-bold text-sm text-gray-800">{pg.pg_name}</span>
                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-blue-100">
                                                        {associatedHgs.length} HOSTGROUPS {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                        {associatedHgs.map((m: any) => {
                                                            const hg = allHostgroups.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                            return <div key={m.hostgroup_id} className="bg-white p-1.5 rounded-lg px-3 border border-gray-100 flex items-center gap-2 shadow-sm">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                                {hg?.hostgroup || 'Unknown'}
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
                        <div className="p-10 text-center border-2 border-dashed rounded-2xl border-gray-100">
                            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm font-bold">No groups assigned to this user.</p>
                        </div>
                    )}
                </div>
            ) }
        ]}
      />

      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setCreateError(''); }} title="Add New User" maxWidth="max-w-md">
          <div className="space-y-4 pt-2">
            <FloatingInput 
                label="Username" 
                value={newUser.username} 
                onChange={e => { setNewUser({...newUser, username: e.target.value}); if(createError) setCreateError(''); }} 
            />
            
            <FloatingInput 
                type="password" 
                label="Password" 
                value={newUser.password} 
                onChange={e => setNewUser({...newUser, password: e.target.value})} 
                className={createError ? 'border-red-500 ring-1 ring-red-500' : ''}
            />
            
            <FloatingInput 
                type="password" 
                label="Confirm Password" 
                value={newUser.confirmPassword} 
                onChange={e => setNewUser({...newUser, confirmPassword: e.target.value})} 
                className={createError ? 'border-red-500 ring-1 ring-red-500' : ''}
            />
            {createError && <p className="text-[11px] font-bold text-red-500 pl-1">{createError}</p>}

            <div className="relative">
                <select 
                    className="peer w-full border border-gray-100 p-4 pt-6 pb-2 rounded-xl text-sm font-bold bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none" 
                    value={newUser.role} 
                    onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                    <option value="" disabled hidden></option>
                    {roles.map(r => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
                </select>
                <label className={`absolute left-4 transition-all pointer-events-none font-bold capitalize tracking-tight ${newUser.role ? 'top-1 text-[8px] text-blue-600' : 'top-1/2 -translate-y-1/2 text-[10px] text-gray-400'}`}>Assign Role</label>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>

            <button onClick={handleCreateUser} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-xs capitalize tracking-wide hover:bg-blue-700 transition-all shadow-md mt-2 flex items-center justify-center">
                Create User
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
