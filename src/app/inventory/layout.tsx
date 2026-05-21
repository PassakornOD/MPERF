'use client';

import FolderTabs from '@/components/common/FolderTabs';
import { useSession } from 'next-auth/react';

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const inventoryTabs = [
    { name: 'Server Inventory', href: '/inventory/list', iconKey: 'List' },
    ...(userRole === 'admin' || userRole === 'sysadmin'
      ? [{ name: 'Manage Assets', href: '/inventory/manage/groups', iconKey: 'Settings' }]
      : []),
  ];

  return (
    <FolderTabs tabs={inventoryTabs}>
      {children}
    </FolderTabs>
  );
}
