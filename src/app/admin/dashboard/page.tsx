'use client';
import React, { useState } from 'react';
import { Users, ShieldCheck, Layers } from 'lucide-react';
import AdminUsersPage from '@/app/admin/users/page';
import ManageUserGroups from '@/app/admin/user-groups/page';
import PermissionGroupsPage from '@/app/admin/permission-groups/page';

const UnifiedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'groups' | 'permissions'>('users');

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'groups', label: 'User Groups', icon: Layers },
    { id: 'permissions', label: 'Permission Groups', icon: ShieldCheck }
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">Centralized administration for users, groups, and permissions</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-gray-100 p-1 rounded-2xl flex w-fit shadow-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'users' && <AdminUsersPage />}
        {activeTab === 'groups' && <ManageUserGroups />}
        {activeTab === 'permissions' && <PermissionGroupsPage />}
      </div>
    </div>
  );
};
export default UnifiedAdminDashboard;
