'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Block from '@/components/common/Block';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { useSession } from 'next-auth/react';

const AdminRolesPage = () => {
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
      alert('Updated successfully!');
      fetchData();
    } catch (err) {
      alert('Update failed');
    }
  };

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  return (
    <Block title="Role Permission Management" subtitle="Assign hostgroup access to roles">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4">Roles</h3>
          <div className="space-y-1">
          {roles.map(r => (
            <button 
              key={r.role_id}
              onClick={() => handleRoleSelect(r.role_id)}
              className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm ${selectedRole === r.role_id ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'}`}
            >
              {r.role_name}
            </button>
          ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Allowed Hostgroups</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {hostgroups.map(hg => (
              <label key={hg.hostgroup_id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  checked={selectedHostgroups.includes(hg.hostgroup_id)}
                  onChange={() => toggleHostgroup(hg.hostgroup_id)}
                  className="rounded text-sky-600"
                />
                {hg.hostgroup}
              </label>
            ))}
          </div>
          <button 
            onClick={savePermissions}
            disabled={!selectedRole}
            className="bg-blue-600 text-white px-6 py-2 rounded font-bold flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" /> Save Permissions
          </button>
        </div>
      </div>
    </Block>
  );
};

export default AdminRolesPage;
