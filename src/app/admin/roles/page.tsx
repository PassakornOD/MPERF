'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Block from '@/components/common/Block';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/common/Toast';

const AdminRolesPage = () => {
  const { showToast } = useToast();
  const { data: session, status } = useSession();
  const [roles, setRoles] = useState<any[]>([]);
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedHostgroups, setSelectedHostgroups] = useState<number[]>([]);

  useEffect(() => {
    if (status === 'authenticated') {
        fetchData();
    } else if (status === 'unauthenticated') {
        setLoading(false);
    }
  }, [status]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, hostgroupsRes] = await Promise.all([
        axios.get('/api/admin/roles'),
        axios.get('/api/inventory/hostgroups')
      ]);
      setRoles(rolesRes.data.roles);
      setMappings(rolesRes.data.mappings);
      setHostgroups(hostgroupsRes.data);
    } catch (err: any) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (roleId: number) => {
    setSelectedRole(roleId);
    const currentMappings = mappings
      .filter(m => m.role_id === roleId)
      .map(m => m.hostgroup_id);
    setSelectedHostgroups(currentMappings);
  };

  const toggleHostgroup = (hgId: number) => {
    setSelectedHostgroups(prev => 
      prev.includes(hgId) ? prev.filter(id => id !== hgId) : [...prev, hgId]
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) return;
    try {
      await axios.post('/api/admin/roles', {
        role_id: selectedRole,
        hostgroup_ids: selectedHostgroups
      });
      showToast('Updated successfully!', 'success');
      fetchData();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  return (
    <Block title="Authorization Framework" subtitle="Global role-to-resource mapping governance">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 animate-ease-in">
        <div className="lg:col-span-1 space-y-6">
          <label className="text-xs text-slate-400 capitalize  ml-2 block">System Roles</label>
          <div className="bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm space-y-1">
          {roles.map(r => (
            <button 
              key={r.role_id}
              onClick={() => handleRoleSelect(r.role_id)}
              className={`block w-full text-left px-5 py-4 rounded-xl text-xs capitalize tracking-tight transition-all duration-300 ${selectedRole === r.role_id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              {r.role_name}
            </button>
          ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <label className="text-xs text-slate-400 capitalize  flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Resource Matrix Authorization
            </label>
            {selectedRole && <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-[9px] capitalize border border-blue-100 shadow-sm">Scope: {selectedHostgroups.length} Assets</span>}
          </div>
          
          <div className="bg-white p-10 rounded-[2rem] border border-slate-100 shadow-sm min-h-[400px] flex flex-col">
            {!selectedRole ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-4">
                    <ShieldCheck size={64} className="opacity-10" />
                    <p className="text-xs capitalize ">Select a role to begin mapping</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar p-1">
                        {hostgroups.map(hg => {
                            const isChecked = selectedHostgroups.includes(hg.hostgroup_id);
                            return (
                                <label key={hg.hostgroup_id} className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all group ${isChecked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 shadow-inner'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className={`w-2 h-2 rounded-full shrink-0 ${isChecked ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
                                        <span className={`text-[11px] capitalize tracking-tight truncate ${isChecked ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`}>{hg.hostgroup}</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={isChecked}
                                        onChange={() => toggleHostgroup(hg.hostgroup_id)}
                                        className="w-4 h-4 rounded-xl border-slate-200 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                                    />
                                </label>
                            )
                        })}
                    </div>
                    <div className="mt-auto pt-8 border-t border-slate-50 flex justify-end">
                        <button 
                            onClick={savePermissions}
                            className="bg-slate-900 text-white px-10 py-4 rounded-xl text-xs capitalize  flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-200 group active:scale-95"
                        >
                            <Save className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" /> Commit Permissions
                        </button>
                    </div>
                </>
            )}
          </div>
        </div>
      </div>
    </Block>
  );
};

export default AdminRolesPage;
