'use client';
import React, { useState } from 'react';
import Block from '@/components/common/Block';
import AdminUsersPage from '@/app/admin/users/page';
import ManageUserGroups from '@/app/admin/user-groups/page';
import PermissionGroupsPage from '@/app/admin/permission-groups/page';

const UnifiedAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'users_groups' | 'permissions'>('users_groups');

  const tabs = [
    { id: 'users_groups', label: 'Users & Groups', icon: '👤' },
    { id: 'permissions', label: 'Permission Groups', icon: '🛡️' },
  ];

  return (
    <Block title="Admin Dashboard" subtitle="Centralized administration for users, groups, and permissions">
      <div className="flex gap-1 mb-8 border-b border-gray-100 bg-gray-50/50 p-1 px-4 rounded-t-2xl">
        {tabs.map(tab => (
            <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-black text-sm transition-all rounded-t-xl border-t border-x ${
                    activeTab === tab.id 
                    ? 'bg-white border-gray-100 text-blue-600 -mb-[5px] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10' 
                    : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                }`}
            >
                {tab.icon} {tab.label}
            </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === 'users_groups' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="h-full">
            <AdminUsersPage />
        </div>
        <div className="h-full">
            <ManageUserGroups />
        </div>
      </div>
        )}
        {activeTab === 'permissions' && <PermissionGroupsPage />}
      </div>
    </Block>
  );
};
export default UnifiedAdminDashboard;
