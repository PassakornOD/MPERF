'use client';
import React, { useState } from 'react';
import Block from '@/components/common/Block';
import AdminUsersPage from '@/app/admin/users/page';
import ManageUserGroups from '@/app/admin/user-groups/page';
import PermissionGroupsPage from '@/app/admin/permission-groups/page';

const UnifiedAdminDashboard = () => {
  return (
    <Block title="Admin Dashboard" subtitle="Centralized administration for users, groups, and permissions">
      <div className="space-y-8">
        <div className="grid grid-cols-[300px,1fr] gap-8 items-start w-full">
            <div className="w-full">
                <AdminUsersPage />
            </div>
            <div className="w-full">
                <ManageUserGroups />
            </div>
        </div>
        <div className="w-full">
            <PermissionGroupsPage />
        </div>
      </div>
    </Block>
  );
};
export default UnifiedAdminDashboard;
