'use client';

import FolderTabs from '@/components/common/FolderTabs';
import { useSession } from 'next-auth/react';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const tabs = [
    { name: 'Generate Report', href: '/report', iconKey: 'BarChart3' },
    ...(userRole === 'admin' || userRole === 'sysadmin' 
      ? [{ name: 'Templates', href: '/report/templates', iconKey: 'List' }] 
      : []),
  ];
  
  return (
    <FolderTabs tabs={tabs}>
      {children}
    </FolderTabs>
  );
}
