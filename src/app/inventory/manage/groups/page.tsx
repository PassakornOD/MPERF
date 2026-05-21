'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { checkPermission } from '@/lib/permissions';
import InventoryManageSubTabs from '@/components/common/InventoryManageSubTabs';

const InventoryManageGroupsPage = () => {
  const { data: session } = useSession();
  const user = session?.user as any;
  const queryClient = useQueryClient();

  const canCreate = checkPermission(user?.role, 'create');
  const canUpdate = checkPermission(user?.role, 'update');
  const canDelete = checkPermission(user?.role, 'delete');

  const { data: hostgroups } = useQuery({
    queryKey: ['hostgroups-manage'],
    queryFn: async () => (await axios.get('/api/inventory/hostgroups')).data
  });

  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupOwner, setNewGroupOwner] = useState('');

  const groupMutation = useMutation({
    mutationFn: (data: any) => data.hostgroup_id ? axios.put('/api/inventory/hostgroups', data) : axios.post('/api/inventory/hostgroups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostgroups-manage'] });
      setEditingGroup(null);
      setNewGroupName('');
      setNewGroupOwner('');
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (id: number) => axios.delete(`/api/inventory/hostgroups?id=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hostgroups-manage'] }),
    onError: (err: any) => alert(err.response?.data?.error || 'Failed to delete')
  });

  return (
    <div className="space-y-6">
      <InventoryManageSubTabs />
      <h2 className="text-xl font-black text-gray-800">Manage Hostgroups</h2>
      {canCreate && (
        <div className="bg-gray-50 p-4 rounded-lg flex gap-4 items-end">
            <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Group Name</label>
            <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="e.g. BSS" />
            </div>
            <div className="flex-1">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Owner</label>
            <input type="text" value={newGroupOwner} onChange={e => setNewGroupOwner(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="Department/Team" />
            </div>
            <button 
            onClick={() => groupMutation.mutate({ hostgroup: newGroupName, owner: newGroupOwner })}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
            <Plus className="w-4 h-4" /> Add Group
            </button>
        </div>
      )}

      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-3">Group Name</th>
              <th className="px-6 py-3">Owner</th>
              {canUpdate && <th className="px-6 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hostgroups?.map((g: any) => (
              <tr key={g.hostgroup_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">
                  {editingGroup?.hostgroup_id === g.hostgroup_id ? 
                    <input type="text" value={editingGroup.hostgroup} onChange={e => setEditingGroup({...editingGroup, hostgroup: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-full" /> 
                    : g.hostgroup}
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {editingGroup?.hostgroup_id === g.hostgroup_id ? 
                    <input type="text" value={editingGroup.owner} onChange={e => setEditingGroup({...editingGroup, owner: e.target.value})} className="border border-blue-400 rounded px-2 py-1 w-full" /> 
                    : g.owner}
                </td>
                {canUpdate && (
                    <td className="px-6 py-4 text-right space-x-2">
                    {editingGroup?.hostgroup_id === g.hostgroup_id ? (
                        <>
                        <button onClick={() => groupMutation.mutate(editingGroup)} className="text-green-600 hover:text-green-800"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingGroup(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </>
                    ) : (
                        <>
                        <button onClick={() => setEditingGroup(g)} className="text-blue-600 hover:text-blue-800"><Edit className="w-4 h-4" /></button>
                        {canDelete && <button onClick={() => window.confirm('Delete this group?') && deleteGroupMutation.mutate(g.hostgroup_id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>}
                        </>
                    )}
                    </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManageGroupsPage;
