'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import { Loader2, Plus, ShieldCheck, X, ChevronDown, ChevronRight, Server, Search, Trash2, Edit2 } from 'lucide-react';

const PermissionGroupsPage = () => {
  const [data, setData] = useState<any>({ pgs: [], pgh: [] });
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  
  const [editingPg, setEditingPg] = useState<any>(null);
  const [editFields, setEditFields] = useState({ pg_name: '', hostgroup_ids: [] as number[] });
  const [activeTab, setActiveTab] = useState(0);
  const [isAddingHg, setIsAddingHg] = useState(false);
  const [expandedPgId, setExpandedPgId] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pgRes, hgRes] = await Promise.all([
        axios.get('/api/admin/permission-groups'),
        axios.get('/api/inventory/hostgroups')
      ]);
      setData(pgRes.data);
      setHostgroups(hgRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const createGroup = async () => {
    if (!newGroupName) return;
    try {
        await axios.post('/api/admin/permission-groups', { pg_name: newGroupName });
        setNewGroupName(''); setIsCreateModalOpen(false); fetchData();
    } catch (err: any) { alert('Failed to create group'); }
  };

  const savePgUpdates = async (overrideFields?: any) => {
    const fields = overrideFields || editFields;
    try {
        await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...fields });
        fetchData();
    } catch (err) { alert('Failed to update group'); }
  };

  const deletePg = async (e: React.MouseEvent, pgId: number) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this permission group?')) return;
    try {
        await axios.post('/api/admin/permission-groups/delete', { pg_id: pgId });
        fetchData();
    } catch (err) { alert('Failed to delete group'); }
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

  const toggleExpand = (pgId: number) => {
    setExpandedPgId(prev => prev === pgId ? null : pgId);
  };

  const assignedHostgroupIds = new Set(data.pgh.map((p: any) => p.hostgroup_id));
  const availableHostgroups = hostgroups.filter(hg => !assignedHostgroupIds.has(hg.hostgroup_id));

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" /></div>;

  return (
    <div className="space-y-8">
      {/* Top Section: Permission Groups (2 columns) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-green-600 p-2 rounded-lg text-white shadow-sm"><ShieldCheck className="w-5 h-5" /></div>
                    <h3 className="font-bold text-gray-700">Permission Groups</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-all shadow-sm">
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                {data.pgs.map((pg: any) => {
                    const groupHgs = data.pgh.filter((m: any) => m.pg_id === pg.pg_id);
                    const isExpanded = expandedPgId === pg.pg_id;

                    if (isExpanded) {
                        return (
                            <div key={pg.pg_id} 
                                onClick={() => toggleExpand(pg.pg_id)}
                                className="relative border-2 border-gray-100 rounded-2xl p-5 pt-10 bg-white shadow-md cursor-pointer animate-in zoom-in-95 duration-200 h-fit"
                            >
                                <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-green-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5 z-10">
                                    <ShieldCheck className="w-3 h-3" /> {pg.pg_name}
                                </span>
                                
                                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                                    <button onClick={(e) => openEdit(e, pg, groupHgs)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors shadow-sm">
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={(e) => deletePg(e, pg.pg_id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors shadow-sm">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                                    {groupHgs.length > 0 ? (
                                        groupHgs.map((m: any) => {
                                            const hg = hostgroups.find((h: any) => h.hostgroup_id === m.hostgroup_id);
                                            return (
                                                <div key={m.hostgroup_id} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                                                    <div className="bg-white p-1.5 rounded-lg shadow-sm flex-shrink-0"><Server className="w-3 h-3 text-blue-500" /></div>
                                                    <span className="text-[10px] font-bold text-gray-700 truncate">{hg?.hostgroup || 'Unknown'}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="col-span-full text-center py-4 text-[10px] text-gray-400 font-bold italic">No hostgroups assigned.</p>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={pg.pg_id} 
                            onClick={() => toggleExpand(pg.pg_id)}
                            className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-green-200 transition-all group cursor-pointer"
                        >
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="bg-white p-3 rounded-full text-green-600 shadow-sm group-hover:scale-110 transition-transform flex-shrink-0"><ShieldCheck className="w-5 h-5" /></div>
                                <div className="overflow-hidden">
                                    <h4 className="font-bold text-gray-900 truncate">{pg.pg_name}</h4>
                                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">{groupHgs.length} Items</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button onClick={(e) => openEdit(e, pg, groupHgs)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => deletePg(e, pg.pg_id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>

      {/* Bottom Section: Unassigned Hostgroups */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-orange-500 p-2 rounded-lg text-white shadow-sm"><Server className="w-5 h-5" /></div>
                    <h3 className="font-bold text-gray-700">Unassigned Hostgroups</h3>
                </div>
                <div className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black border border-orange-100 uppercase tracking-widest">
                    {availableHostgroups.length} Items Remaining
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {availableHostgroups.length > 0 ? (
                    availableHostgroups.map(hg => (
                        <div key={hg.hostgroup_id} className="bg-gray-50/50 p-3 rounded-xl border border-gray-100 flex items-center gap-3 hover:border-orange-200 transition-all group/item overflow-hidden">
                            <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform text-orange-500 flex-shrink-0"><Server className="w-4 h-4" /></div>
                            <span className="text-xs font-bold text-gray-700 truncate">{hg.hostgroup}</span>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl border-gray-100">
                        <ShieldCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                        <p className="text-gray-400 text-sm font-bold">All hostgroups are currently assigned to groups.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Permission Group">
        <div className="space-y-4">
            <input className="w-full border border-gray-100 p-3.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" placeholder="Enter group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
            <button onClick={createGroup} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md">Create Group</button>
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
                <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Group Name</label>
                         <input className="w-full bg-white border border-gray-100 p-3 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={editFields.pg_name} onChange={e => setEditFields({...editFields, pg_name: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button onClick={() => savePgUpdates()} className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-black shadow-md hover:bg-blue-700 transition-all">SAVE CHANGES</button>
                    </div>
                </div>
            ) },
            { label: 'Hostgroups', content: (
                <div className="space-y-4 pt-4">
                    <div className="flex justify-end">
                        <button onClick={() => setIsAddingHg(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-black text-[10px] uppercase tracking-widest">
                            <Plus className="w-3.5 h-3.5" /> Add Hostgroup
                        </button>
                    </div>

                    <div className="relative border-2 border-gray-100 rounded-2xl p-5 pt-7 bg-white shadow-sm">
                        <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-gray-100 rounded-full shadow-sm flex items-center gap-1.5">
                            <Server className="w-3 h-3" /> Assigned Hostgroups
                        </span>

                        {editFields.hostgroup_ids.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                                {editFields.hostgroup_ids.map(hgId => {
                                    const hg = hostgroups.find((h: any) => h.hostgroup_id === hgId);
                                    return hg ? (
                                        <div key={hgId} className="flex items-center justify-between p-2.5 bg-gray-50 border border-gray-100 rounded-xl group/item hover:border-blue-200 transition-all overflow-hidden">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="bg-white p-2 rounded-lg shadow-sm group-hover/item:scale-110 transition-transform flex-shrink-0"><Server className="w-3.5 h-3.5 text-blue-600" /></div>
                                                <span className="text-xs font-bold text-gray-700 truncate">{hg.hostgroup}</span>
                                            </div>
                                            <button onClick={async () => { 
                                                const nextHgs = editFields.hostgroup_ids.filter(i => i !== hgId);
                                                setEditFields({...editFields, hostgroup_ids: nextHgs});
                                                await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                                fetchData();
                                            }} className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <p className="text-xs text-gray-400 font-bold italic">No hostgroups in this group.</p>
                            </div>
                        )}
                    </div>

                    {isAddingHg && (
                        <div className="relative border-2 border-dashed border-blue-100 rounded-2xl p-5 pt-7 bg-blue-50/10 mt-6 animate-in fade-in slide-in-from-top-2 duration-200">
                            <span className="absolute -top-3 left-4 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-600 border-2 border-blue-50 rounded-full shadow-sm flex items-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Available Hostgroups
                            </span>
                            <button onClick={() => setIsAddingHg(false)} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"><X className="w-4 h-4" /></button>
                            
                            {availableHostgroups.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2">
                                    {availableHostgroups.map(hg => (
                                        <button key={hg.hostgroup_id} onClick={async () => { 
                                            const nextHgs = [...editFields.hostgroup_ids, hg.hostgroup_id];
                                            setEditFields({...editFields, hostgroup_ids: nextHgs});
                                            await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                            fetchData();
                                            setIsAddingHg(false); 
                                        }} className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-blue-600 hover:text-white border border-gray-100 rounded-xl transition-all shadow-sm group/btn overflow-hidden text-left">
                                            <div className="bg-blue-50 p-1.5 rounded-lg group-hover/btn:bg-blue-500 transition-colors"><Server className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate">{hg.hostgroup}</span>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center py-2 text-xs text-gray-400 font-bold italic">All hostgroups are already assigned.</p>
                            )}
                        </div>
                    )}
                </div>
            ) }
        ]}
      />
    </div>
  );
};

export default PermissionGroupsPage;
