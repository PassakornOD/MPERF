'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import { Loader2, Plus, Users, Save, ShieldCheck, Edit2, Trash2, X, UserCircle, ChevronDown, ChevronRight, User } from 'lucide-react';

const ManageUserGroups = () => {
  const [data, setData] = useState<{groups: any[], pgs: any[], users: any[], allHgs: any[]}>({ groups: [], pgs: [], users: [], allHgs: [] });
  const [mappings, setMappings] = useState<{groupPgs: any[], userGroups: any[], pgh: any[]}>({ groupPgs: [], userGroups: [], pgh: [] });
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editFields, setEditFields] = useState({ ug_name: '', member_ids: [] as number[], pg_ids: [] as number[] });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isAddingPg, setIsAddingPg] = useState(false);
  const [expandedPgs, setExpandedPgs] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState(0);

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

  const createGroup = async () => {
    if (!newGroupName) return;
    await axios.post('/api/admin/user-groups', { ug_name: newGroupName });
    setNewGroupName(''); setIsCreateModalOpen(false); fetchData();
  };

  const deleteGroup = async (ugId: number) => {
    if (!confirm('Are you sure?')) return;
    await axios.post('/api/admin/user-groups/delete', { ug_id: ugId }); 
    fetchData();
  };

  const saveUpdates = async (overrideFields?: any) => {
    const fields = overrideFields || editFields;
    await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...fields });
    fetchData();
  };

  if (loading) return <div className="p-4 text-center"><Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" /></div>;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-gray-700">User Group Management</h3>
          <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800">
              <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {data.groups.map((g: any) => {
              const currentPgs = mappings.groupPgs.filter((m: any) => m.ug_id === g.ug_id);
              return (
                  <div key={g.ug_id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-green-200 transition-all group">
                      <div className="flex items-center gap-4">
                          <div className="bg-white p-3 rounded-full text-green-600 shadow-sm group-hover:scale-110 transition-transform"><Users className="w-5 h-5" /></div>
                          <div>
                              <h4 className="font-bold text-gray-900">{g.ug_name}</h4>
                              <div className="flex flex-wrap gap-2 mt-1">
                                  {currentPgs.map((p: any) => {
                                      const pg = data.pgs.find((item: any) => item.pg_id === (p as any).pg_id);
                                      return pg ? <span key={(pg as any).pg_id} className="text-[10px] bg-white text-green-700 px-2 py-0.5 rounded font-black border border-green-100 uppercase tracking-tighter">{(pg as any).pg_name}</span> : null;
                                  })}
                              </div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button onClick={() => { 
                              setEditingGroup(g); 
                              setEditFields({
                                  ug_name: g.ug_name,
                                  member_ids: mappings.userGroups.filter((m: any) => m.ug_id === g.ug_id).map((m: any) => m.user_id),
                                  pg_ids: currentPgs.map((m: any) => m.pg_id)
                              }); 
                              setActiveTab(0);
                              setExpandedPgs([]);
                              setIsAddingUser(false);
                              setIsAddingPg(false);
                          }} className="text-green-600 hover:bg-green-50 p-2.5 rounded-lg">
                              <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteGroup(g.ug_id)} className="text-red-500 hover:bg-red-50 p-2.5 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                          </button>
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
            { label: 'General', content: (
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Group Name</label>
                         <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editFields.ug_name} onChange={e => setEditFields({...editFields, ug_name: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => saveUpdates()} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-blue-700 transition-all">SAVE CHANGES</button>
                    </div>
                </div>
            ) },
            { label: 'Members', content: (
                <div className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest">
                            <Plus className="w-3.5 h-3.5" /> Add Member
                        </button>
                    </div>

                    <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
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
                                                setEditFields({...editFields, member_ids: nextMembers});
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
                            <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-blue-50 rounded-full shadow-sm flex items-center gap-1.5">
                                <UserCircle className="w-3 h-3" /> Available Users
                            </span>
                            <button onClick={() => setIsAddingUser(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                            
                            {data.users.filter((u: any) => !editFields.member_ids.includes(u.user_id)).length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {data.users.map((u: any) => !editFields.member_ids.includes(u.user_id) && (
                                        <button key={u.user_id} onClick={async () => { 
                                            const nextMembers = [...editFields.member_ids, u.user_id];
                                            setEditFields({...editFields, member_ids: nextMembers});
                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, member_ids: nextMembers });
                                            fetchData();
                                            setIsAddingUser(false); 
                                        }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden">
                                            <div className="bg-blue-50 p-1.5 rounded-lg group-hover/btn:bg-blue-500 transition-colors"><User className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{u.username}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-2 text-xs text-gray-400 font-bold italic">All users already members.</p>
                            )}
                        </div>
                    )}
                </div>
            ) },
            { label: 'Member Of', content: (
                <div className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingPg(true)} className="flex items-center gap-1.5 text-green-600 hover:text-green-700 font-black text-[10px] uppercase tracking-widest">
                            <Plus className="w-3.5 h-3.5" /> Add Permission Group
                        </button>
                    </div>

                    <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3" /> Permission Groups
                        </span>

                        {editFields.pg_ids.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {editFields.pg_ids.map(pgId => {
                                    const pg = data.pgs.find((p: any) => p.pg_id === pgId);
                                    return pg ? (
                                        <div key={pgId} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group/item hover:border-green-200 transition-all overflow-hidden">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform flex-shrink-0"><ShieldCheck className="w-3.5 h-3.5 text-green-600" /></div>
                                                <span className="text-xs font-bold text-gray-700 truncate">{pg.pg_name}</span>
                                            </div>
                                            <button onClick={async () => {
                                                const nextPgs = editFields.pg_ids.filter(i => i !== pgId);
                                                setEditFields({...editFields, pg_ids: nextPgs});
                                                await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                                fetchData();
                                            }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-gray-400 font-bold italic">No permission groups assigned.</p>
                            </div>
                        )}
                    </div>

                    {isAddingPg && (
                        <div className="relative border-2 border-dashed border-green-100 rounded-2xl p-5 pt-7 bg-green-50/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border-2 border-green-50 rounded-full shadow-sm flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3" /> Available PGs
                            </span>
                            <button onClick={() => setIsAddingPg(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>

                            {data.pgs.filter((pg: any) => !editFields.pg_ids.includes(pg.pg_id)).length > 0 ? (
                                <div className="grid grid-cols-2 gap-3">
                                    {data.pgs.map((pg: any) => !editFields.pg_ids.includes(pg.pg_id) && (
                                        <button key={pg.pg_id} onClick={async () => { 
                                            const nextPgs = [...editFields.pg_ids, pg.pg_id];
                                            setEditFields({...editFields, pg_ids: nextPgs});
                                            await axios.post('/api/admin/user-groups/update', { ug_id: editingGroup.ug_id, ...editFields, pg_ids: nextPgs });
                                            fetchData();
                                            setIsAddingPg(false); 
                                        }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-green-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                            <div className="bg-green-50 p-1.5 rounded-lg group-hover/btn:bg-green-500 transition-colors"><ShieldCheck className="w-3.5 h-3.5 text-green-600 group-hover/btn:text-white" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{pg.pg_name}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-2 text-xs text-gray-500 italic">All permission groups already assigned.</p>
                            )}
                        </div>
                    )}
                </div>
            ) },
            { label: 'Permissions', content: (
                <div className="space-y-4 mt-2">
                    {editFields.pg_ids.length > 0 ? (
                        <div className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm space-y-3">
                            {editFields.pg_ids.map(pgId => {
                                const pg = data.pgs.find((p: any) => p.pg_id === pgId);
                                const associatedHgs = mappings.pgh.filter((m: any) => m.pg_id === pgId);
                                const isExpanded = expandedPgs.includes(pgId);
                                return pg ? (
                                    <div key={pgId} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                        <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedPgs(prev => isExpanded ? prev.filter(i => i !== pgId) : [...prev, pgId])}>
                                            <span className="font-bold text-sm text-gray-800">{(pg as any).pg_name}</span>
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 border border-blue-100 uppercase tracking-tighter">
                                                {!isExpanded ? (
                                                    <>{associatedHgs.length} HOSTGROUPS <ChevronRight className="w-3 h-3" /></>
                                                ) : (
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                            </span>
                                        </div>
                                        {isExpanded && (
                                            <div className="p-3 bg-gray-50/30 border-t border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 gap-2 animate-in slide-in-from-top-1 duration-200">
                                                {associatedHgs.map((m: any) => {
                                                    const hg = data.allHgs.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                                    return <div key={m.hostgroup_id} className="bg-white p-1.5 rounded-lg px-3 border border-gray-100 flex items-center gap-2 shadow-sm">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                                        {(hg as any)?.hostgroup || 'Unknown'}
                                                    </div>;
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ) : null;
                            })}
                        </div>
                    ) : (
                        <div className="p-10 text-center border-2 border-dashed rounded-2xl border-gray-100 bg-gray-50/50">
                            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm font-bold">No permission groups assigned.</p>
                        </div>
                    )}
                </div>
            ) }
        ]}
      />

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Group">
        <div className="space-y-4">
            <input className="w-full border p-3.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <button onClick={createGroup} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">Create</button>
        </div>
      </Modal>
    </div>
  );
};
export default ManageUserGroups;
