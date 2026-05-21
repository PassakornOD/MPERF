'use client';

import FolderTabs from '@/components/common/FolderTabs';

const tabs = [
  { name: 'CPU Daily', href: '/sarlog/cpu-daily', iconKey: 'BarChart3' },
  { name: 'CPU Monthly', href: '/sarlog/cpu-monthly', iconKey: 'BarChart3' },
  { name: 'Mem Daily', href: '/sarlog/mem-daily', iconKey: 'BarChart3' },
  { name: 'Mem Monthly', href: '/sarlog/mem-monthly', iconKey: 'BarChart3' },
];

export default function SarlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <FolderTabs tabs={tabs}>
      {children}
    </FolderTabs>
  );
}
