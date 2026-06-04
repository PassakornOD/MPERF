'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TabbedModal from '@/components/common/TabbedModal';
import Modal from '@/components/common/Modal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { Loader2, Plus, ShieldCheck, X, ChevronDown, ChevronRight, Server, Search, Trash2, Edit2, Users, MoreVertical, PlusCircle } from 'lucide-react';
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

    useEffect(() => { fetchData(); }, []);

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
        <div className="space-y-8 animate-ease-in">
            <div className="bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
                <div className="p-8 space-y-8">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg shadow-blue-500/20"><ShieldCheck className="w-6 h-6" /></div>
                            <div>
                                <h3 className="text-sm text-foreground capitalize">Resource Permissions</h3>
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">Map server hostgroups to access levels</p>
                            </div>
                        </div>
                        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary flex items-center gap-2 group">
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                            <span className="text-xs capitalize">Create Access Group</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar border border-border rounded-xl shadow-inner bg-background/20">
                        <table className="w-full text-xs text-left border-collapse">
                            <thead>
                                <tr className="bg-card border-b border-border">
                                    <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize">Access Group</th>
                                    <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize">Associations</th>
                                    <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize">Secured Assets</th>
                                    <th className="px-8 py-5 text-[9px] text-muted-foreground capitalize text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50 bg-card">
                                {data.pgs.map((pg: any) => {
                                    const groupHgs = data.pgh.filter((m: any) => m.pg_id === pg.pg_id);
                                    const associatedGroupsCount = data.ugPgs.filter((m: any) => m.pg_id === pg.pg_id).length;

                                    return (
                                        <tr key={pg.pg_id} className="group/row hover:bg-blue-50/40 transition-all duration-200 border-b border-border/30 last:border-0">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-blue-600 shadow-sm group-hover/row:scale-105 transition-all">
                                                        <ShieldCheck className="w-5 h-5" />
                                                    </div>
                                                    <p className="text-foreground text-sm capitalize tracking-tight group-hover/row:text-blue-700 transition-colors">{pg.pg_name}</p>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-wrap gap-2 max-w-[240px]">
                                                    {data.ugPgs.filter((m: any) => m.pg_id === pg.pg_id).slice(0, 2).map((m: any) => {
                                                        const ug = data.ugs.find((u: any) => u.ug_id === m.ug_id);
                                                        return ug ? <span key={m.ug_id} className="bg-card border border-border text-muted-foreground px-2.5 py-1 rounded-xl font-bold text-[9px] shadow-sm whitespace-nowrap">{ug.ug_name}</span> : null;
                                                    })}
                                                    {associatedGroupsCount > 2 && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-xl text-[9px] shadow-sm border border-blue-100">+{associatedGroupsCount - 2}</span>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                                        <Server className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-[11px] text-slate-600 tabular-nums">{groupHgs.length} <span className="text-[8px] text-slate-300 uppercase">Sectors</span></span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="relative flex justify-end">
                                                    <button
                                                        onClick={() => setActiveMenu(activeMenu === pg.pg_id ? null : pg.pg_id)}
                                                        className={`p-2.5 rounded-xl transition-all border ${activeMenu === pg.pg_id ? 'bg-card shadow-md text-foreground border-border' : 'text-slate-300 hover:text-slate-600 border-transparent hover:bg-card hover:shadow-sm hover:border-border'}`}
                                                    >
                                                        <MoreVertical className="w-4.5 h-4.5" />
                                                    </button>
                                                    {activeMenu === pg.pg_id && (
                                                        <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] py-2 z-[100] w-44 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                            <button onClick={(e) => { openEdit(e, pg, groupHgs); setActiveMenu(null); }} className="flex items-center gap-3 w-full px-5 py-3 text-[11px] text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all capitalize text-left">
                                                                <Edit2 className="w-4 h-4" /> Edit
                                                            </button>
                                                            <button onClick={(e) => { deletePg(e, pg.pg_id); setActiveMenu(null); }} className="flex items-center gap-3 w-full px-5 py-3 text-red-500 hover:bg-red-50 transition-all border-t border-slate-50 capitalize text-left">
                                                                <Trash2 className="w-4 h-4" /> Delete
                                                            </button>
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

                    {availableHostgroups.length > 0 && (
                        <div className="mt-12 border-t border-border pt-10">
                            <div className="flex justify-between items-center mb-6 px-2">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20"><Server className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-sm text-foreground capitalize">Unprotected Assets</h3>
                                        <p className="text-xs font-bold text-muted-foreground capitalize mt-0.5">Hostgroups not yet mapped to any permission group</p>
                                    </div>
                                </div>
                                <div className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-[9px] border border-orange-100 capitalize shadow-sm">
                                    {availableHostgroups.length} Assets Remaining
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 p-6 bg-background/30 rounded-[2rem] border border-border shadow-inner">
                                {availableHostgroups.map(hg => (
                                    <div key={hg.hostgroup_id} className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center gap-2.5 shadow-sm hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-default group/item">
                                        <Server className="w-3.5 h-3.5 text-orange-400 group-hover/item:text-orange-500 transition-colors" />
                                        <span className="text-xs text-slate-600 capitalize tracking-tight truncate max-w-[150px]">{hg.hostgroup}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal isOpen={isCreateModalOpen} onClose={() => { setIsCreateModalOpen(false); setCreateError(""); }} title="New Permission Group Enrollment" maxWidth="max-w-md">
                <div className="space-y-6 pt-2">
                    <FloatingInput
                        label="Access Designation Name"
                        value={newGroupName}
                        onChange={e => { setNewGroupName(e.target.value); if (createError) setCreateError(""); }}
                        className={createError ? "border-red-500 ring-4 ring-red-500/10" : ""}
                    />
                    {createError && <p className="text-xs font-bold text-red-500 pl-1 italic">{createError}</p>}
                    <button onClick={createGroup} className="w-full bg-blue-600 text-white py-4 rounded-xl text-xs capitalize hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 mt-4 flex items-center justify-center group">
                        Register Access Group <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </Modal>

            {/* Edit Tabbed Modal */}
            <TabbedModal
                isOpen={!!editingPg}
                onClose={() => { setEditingPg(null); setActiveTab(0); }}
                title={`Configure Permission Group`}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={[
                    {
                        label: 'General', content: (
                            <div className="space-y-8 pt-2">
                                <div className="flex gap-4 p-6 bg-background/50 rounded-xl items-center border border-border shadow-inner">
                                    <div className="bg-card p-4 rounded-xl text-blue-600 shadow-sm border border-border"><ShieldCheck className="w-8 h-8" /></div>
                                    <div>
                                        <p className="text-xs text-muted-foreground capitalize mb-0.5">Configuration</p>
                                        <p className="text-xl text-foreground tracking-tight">{editingPg?.pg_name}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <FloatingInput
                                        label="Modify Group Name"
                                        value={editFields.pg_name}
                                        onChange={e => setEditFields({ ...editFields, pg_name: e.target.value })}
                                    />
                                    <div className="flex justify-end pt-4 border-t border-slate-50">
                                        <button onClick={() => savePgUpdates()} className="bg-blue-600 text-white px-8 py-3 rounded-xl text-xs capitalize shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Save Changes</button>
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    {
                        label: 'Associated', content: (
                            <div className="space-y-4 pt-2">
                                {editingPg && data.ugPgs && data.ugPgs.filter((m: any) => m.pg_id === editingPg.pg_id).length > 0 ? data.ugPgs.filter((m: any) => m.pg_id === editingPg.pg_id).map((m: any) => {
                                    const ug = data.ugs.find((u: any) => u.ug_id === m.ug_id);
                                    if (!ug) return null;
                                    const members = ugUsers.filter((uu: any) => uu.ug_id === ug.ug_id);
                                    const isExpanded = expandedPgId === `ug-${ug.ug_id}`;
                                    return (
                                        <div key={m.ug_id} className="border border-border rounded-xl overflow-hidden shadow-sm bg-card hover:border-blue-100 transition-all">
                                            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-background transition-colors" onClick={() => setExpandedPgId(isExpanded ? null : `ug-${ug.ug_id}`)}>
                                                <div className="flex items-center gap-4">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                    <span className="text-xs text-foreground tracking-tight">{ug.ug_name}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl text-[9px] capitalize tracking-tighter border border-blue-100">{members.length} Enrolled Users</span>
                                                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-300" /> : <ChevronRight className="w-4 h-4 text-slate-300" />}
                                                </div>
                                            </div>
                                            {isExpanded && (
                                                <div className="p-4 bg-background/50 border-t border-slate-50 text-xs text-slate-600 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2 duration-200">
                                                    {members.map((mem: any) => {
                                                        const user = data.users?.find((u: any) => u.user_id === mem.user_id);
                                                        return <div key={mem.user_id} className="bg-card p-2.5 rounded-xl border border-border flex items-center gap-2.5 shadow-sm">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-sm shadow-blue-100" />
                                                            <span className="font-bold truncate">{user?.username || 'Unknown'}</span>
                                                        </div>;
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="py-20 text-center border border-border rounded-[2rem] bg-background/30">
                                        <Users className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                        <p className="text-xs text-slate-300 capitalize italic">No associated user groups</p>
                                    </div>
                                )}
                            </div>
                        )
                    },
                    {
                        label: 'Hostgroups', content: (
                            <div className="space-y-6 pt-2">
                                <div className="flex justify-end">
                                    <button onClick={() => setIsAddingHg(true)} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-xs capitalize transition-all">
                                        <PlusCircle className="w-4 h-4" /> Assign Hostgroup
                                    </button>
                                </div>

                                <div className="relative border border-border rounded-xl p-6 pt-10 bg-background/20 shadow-inner">
                                    <span className="absolute -top-3 left-6 bg-card px-4 py-1.5 text-[9px] capitalize text-blue-600 border border-border rounded-full shadow-sm flex items-center gap-2">
                                        <Server className="w-3.5 h-3.5" /> Secured Assets
                                    </span>

                                    {editFields.hostgroup_ids.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {editFields.hostgroup_ids.map(hgId => {
                                                const hg = hostgroups.find((h: any) => h.hostgroup_id === hgId);
                                                const hostCount = allHostnames.filter((h: any) => h.hostgroup_id === hgId).length;
                                                return hg ? (
                                                    <div key={hgId} className="bg-card p-3 rounded-xl border border-border flex items-center justify-between shadow-sm group/item hover:border-blue-200 transition-all">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <div className="bg-background p-2 rounded-xl group-hover/item:scale-110 transition-transform flex-shrink-0"><Server className="w-4 h-4 text-blue-600" /></div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-[11px] text-slate-700 truncate capitalize tracking-tight">{hg.hostgroup}</span>
                                                                <span className="text-[8px] text-muted-foreground capitalize">{hostCount} Hosts</span>
                                                            </div>
                                                        </div>
                                                        <button onClick={async () => {
                                                            const nextHgs = editFields.hostgroup_ids.filter(i => i !== hgId);
                                                            setEditFields({ ...editFields, hostgroup_ids: nextHgs });
                                                            await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                                            fetchData();
                                                        }} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : null;
                                            })}
                                        </div>
                                    ) : (
                                        <div className="py-12 text-center">
                                            <Server className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                                            <p className="text-xs text-slate-300 capitalize italic">No assets assigned to this group</p>
                                        </div>
                                    )}
                                </div>

                                {isAddingHg && (
                                    <div className="relative border-2 border-dashed border-blue-100 rounded-xl p-6 pt-10 bg-blue-50/20 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <span className="absolute -top-3 left-6 bg-card px-4 py-1.5 text-[9px] capitalize text-blue-600 border border-blue-100 rounded-full shadow-sm flex items-center gap-2">
                                            <Plus className="w-3.5 h-3.5" /> Available Assets
                                        </span>
                                        <button onClick={() => setIsAddingHg(false)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>

                                        {availableHostgroups.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                {availableHostgroups.map(hg => {
                                                    const hostCount = allHostnames.filter((h: any) => h.hostgroup_id === hg.hostgroup_id).length;
                                                    return (
                                                        <button key={hg.hostgroup_id} onClick={async () => {
                                                            const nextHgs = [...editFields.hostgroup_ids, hg.hostgroup_id];
                                                            setEditFields({ ...editFields, hostgroup_ids: nextHgs });
                                                            await axios.post('/api/admin/permission-groups/update', { pg_id: editingPg.pg_id, ...editFields, hostgroup_ids: nextHgs });
                                                            fetchData();
                                                        }} className="bg-card p-3 rounded-xl border border-border flex items-center gap-3 shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-left group/btn">
                                                            <div className="bg-background p-1.5 rounded-xl group-hover/btn:bg-blue-500 transition-colors shadow-inner"><Plus className="w-3.5 h-3.5 text-blue-600 group-hover/btn:text-white" /></div>
                                                            <div className="flex flex-col truncate">
                                                                <span className="text-xs capitalize tracking-tight truncate">{hg.hostgroup}</span>
                                                                <span className="text-[8px] font-bold opacity-60 capitalize">{hostCount} Hosts</span>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-center py-4 text-xs text-slate-300 capitalize italic">All assets already secured</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    }
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
