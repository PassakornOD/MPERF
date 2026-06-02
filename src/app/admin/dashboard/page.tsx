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
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900 capitalize italic tracking-tight leading-none">Admin Control</h1>
          <p className="text-sm font-medium text-slate-400">Centralized governance for users, groups, and resource permissions</p>
        </div>
        
        {/* Tabs */}
        <div className="bg-slate-100 p-1 rounded-2xl inner-shadow flex w-fit border border-slate-200/50">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black capitalize tracking-widest transition-all duration-300 flex items-center gap-2.5 ${
                  isActive ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} /> {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="animate-ease-in">
        {activeTab === 'users' && <AdminUsersPage />}
        {activeTab === 'groups' && <ManageUserGroups />}
        {activeTab === 'permissions' && <PermissionGroupsPage />}
      </div>
    </div>
  );
};
export default UnifiedAdminDashboard;
