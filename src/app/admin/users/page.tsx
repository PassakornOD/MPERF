'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import { Loader2, Plus, User, Trash2, Edit2, Users, X, ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [userMappings, setUserMappings] = useState<any[]>([]);
  const [pgs, setPgs] = useState<any[]>([]);
  const [pgh, setPgh] = useState<any[]>([]);
  const [ugPgs, setUgPgs] = useState<any[]>([]);
  const [allHostgroups, setAllHostgroups] = useState<any[]>([]);
  
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'sysadmin' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [editFields, setEditFields] = useState({ role: '', group_ids: [] as number[] });
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [expandedPgs, setExpandedPgs] = useState<number[]>([]);

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
      setUserMappings(m.data);
      setPgs(p.data.pgs);
      setPgh(p.data.pgh);
      setUgPgs(ugpg.data);
      setAllHostgroups(hg.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/api/admin/users?user_id=${userId}`);
      setUsers(users.filter(u => u.user_id !== userId));
    } catch (err) { alert('Failed to delete user'); }
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('/api/admin/users', newUser);
      setNewUser({ username: '', password: '', role: 'sysadmin' });
      setIsModalOpen(false);
      fetchData();
    } catch (err) { alert('Failed to create user'); }
  };

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-700">User Management</h3>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {users.map(u => (
            <div key={u.user_id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-200 transition-all group">
              <div className="flex items-center gap-4">
                  <div className="bg-white p-3 rounded-full text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><User className="w-5 h-5" /></div>
                  <div>
                      <h4 className="font-bold text-gray-900">{u.username}</h4>
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{u.role}</span>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                    <button onClick={() => { 
                        setEditUser(u); 
                        setEditFields({ role: u.role, group_ids: userMappings.filter((m: any) => m.user_id === u.user_id).map((m: any) => m.ug_id) }); 
                        setActiveTab(0);
                        setIsAddingGroup(false);
                    }} className="text-blue-500 hover:bg-blue-50 p-2.5 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteUser(u.user_id)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
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
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-xl items-center">
                        <div className="bg-blue-100 p-3 rounded-full text-blue-700"><User className="w-6 h-6" /></div>
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</p>
                            <p className="font-bold text-lg text-gray-900">{editUser?.username}</p>
                        </div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-600 mb-3">Select Role</p>
                        <div className="flex gap-2">
                            {roles.map(r => {
                                const isProtected = editUser?.username === 'sysreport' || editUser?.username === 'mfadmin';
                                const isDisabled = isProtected && r.role_name === 'admin';
                                return (
                                    <button 
                                        key={r.role_id} 
                                        disabled={isProtected}
                                        onClick={async () => {
                                            if (isProtected) return;
                                            setEditFields({...editFields, role: r.role_name});
                                            await axios.put('/api/admin/users', { user_id: editUser.user_id, role: r.role_name });
                                            fetchData();
                                        }} 
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${editFields.role === r.role_name ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 hover:bg-gray-200'} ${isProtected ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
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
                        <button onClick={() => setIsAddingGroup(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest">
                            <Plus className="w-3.5 h-3.5" /> Add Group
                        </button>
                    </div>

                    <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                            <Users className="w-3 h-3" /> Assigned Groups
                        </span>

                        {editFields.group_ids.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {editFields.group_ids.map(ugId => {
                                    const group = groups.find((g: any) => g.ug_id === ugId);
                                    return group ? (
                                        <div key={ugId} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group/item hover:border-blue-200 transition-all overflow-hidden">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform flex-shrink-0"><Users className="w-3.5 h-3.5 text-blue-600" /></div>
                                                <span className="text-xs font-bold text-gray-700 truncate">{group.ug_name}</span>
                                            </div>
                                            <button onClick={async () => { 
                                                const nextGroups = editFields.group_ids.filter(i => i !== ugId);
                                                setEditFields({...editFields, group_ids: nextGroups});
                                                await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                                fetchData();
                                            }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
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
                            <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-blue-50 rounded-full shadow-sm flex items-center gap-1.5">
                                <Users className="w-3 h-3" /> Available Groups
                            </span>
                            <button onClick={() => setIsAddingGroup(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                            
                            {groups.filter((g: any) => !editFields.group_ids.includes(g.ug_id)).length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {groups.map((g: any) => !editFields.group_ids.includes(g.ug_id) && (
                                        <button key={g.ug_id} onClick={async () => { 
                                            const nextGroups = [...editFields.group_ids, g.ug_id];
                                            setEditFields({...editFields, group_ids: nextGroups});
                                            await axios.post('/api/admin/user-group-mapping', { user_id: editUser.user_id, group_ids: nextGroups, type: 'user_to_group' });
                                            fetchData();
                                            setIsAddingGroup(false); 
                                        }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden">
                                            <div className="bg-blue-50 p-1.5 rounded-lg group-hover/btn:bg-blue-500 transition-colors"><Users className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{g.ug_name}</span>
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
                                <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
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
                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 border border-blue-100">
                                                        {associatedHgs.length} HOSTGROUPS {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                    </span>
                                                </div>
                                                {isExpanded && (
                                                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                        {associatedHgs.map((m: any) => {
                                                            const hg = allHostgroups.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                            return <div key={m.hostgroup_id} className="bg-white p-1.5 rounded-lg px-3 border border-gray-100 flex items-center gap-2">
                                                                <div className="w-1 h-1 rounded-full bg-blue-400" />
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New User">
          <div className="space-y-4">
            <input placeholder="Username" className="w-full border p-2.5 rounded-lg text-sm" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
            <input type="password" placeholder="Password" className="w-full border p-2.5 rounded-lg text-sm" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
            <select className="w-full border p-2.5 rounded-lg text-sm bg-white" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                {roles.map(r => <option key={r.role_id} value={r.role_name}>{r.role_name}</option>)}
            </select>
            <button onClick={handleCreateUser} className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-bold hover:bg-blue-700">Create</button>
          </div>
      </Modal>
    </div>
  );
};
export default AdminUsersPage;
