'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Block from '@/components/common/Block';
import { Loader2, Save } from 'lucide-react';

const AdminRolesPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [hostgroups, setHostgroups] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedHostgroups, setSelectedHostgroups] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesRes, hostgroupsRes] = await Promise.all([
          axios.get('/api/admin/roles'),
          axios.get('/api/host-groups')
        ]);
        setRoles(rolesRes.data.roles);
        setMappings(rolesRes.data.mappings);
        setHostgroups(hostgroupsRes.data);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      // Refresh mappings
      const res = await axios.get('/api/admin/roles');
      setMappings(res.data.mappings);
    } catch (err) {
      alert('Update failed');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

  return (
    <Block title="Manage Role Permissions" subtitle="Assign hostgroups to specific roles">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4 text-gray-700">Select Role</h3>
          {roles.map(r => (
            <button 
              key={r.role_id}
              onClick={() => handleRoleSelect(r.role_id)}
              className={`block w-full text-left px-4 py-2 rounded-lg mb-1 ${selectedRole === r.role_id ? 'bg-sky-600 text-white' : 'hover:bg-sky-50'}`}
            >
              {r.role_name}
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold mb-4 text-gray-700">Assign Hostgroups</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {hostgroups.map(hg => (
              <label key={hg.hostgroup_id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
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
            className="flex items-center gap-2 bg-sky-600 text-white px-6 py-2 rounded-full font-bold hover:bg-sky-700 disabled:bg-gray-300"
          >
            <Save className="w-4 h-4" /> Save Permissions
          </button>
        </div>
      </div>
    </Block>
  );
};

export default AdminRolesPage;
