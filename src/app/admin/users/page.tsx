'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Block from '@/components/common/Block';
import { Loader2, Save } from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          axios.get('/api/admin/users'),
          axios.get('/api/admin/roles')
        ]);
        setUsers(usersRes.data);
        setRoles(rolesRes.data.roles);
      } catch (err) {
        console.error('Failed to load data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateRole = async (userId: number, newRole: string) => {
    try {
      await axios.post('/api/admin/users', { user_id: userId, role: newRole });
      setUsers(users.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      alert('Role updated!');
    } catch (err) {
      alert('Failed to update role');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>;

  return (
    <Block title="Manage User Roles" subtitle="Assign roles to system users">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-6 py-3 text-left">Username</th>
              <th className="px-6 py-3 text-left">Current Role</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id} className="border-t border-gray-100">
                <td className="px-6 py-4 font-semibold">{u.username}</td>
                <td className="px-6 py-4">{u.role}</td>
                <td className="px-6 py-4">
                  <select 
                    value={u.role}
                    onChange={(e) => updateRole(u.user_id, e.target.value)}
                    className="border border-gray-200 rounded-full px-4 py-1 text-xs"
                  >
                    {roles.map(r => (
                      <option key={r.role_id} value={r.role_name}>{r.role_name}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
};

export default AdminUsersPage;
