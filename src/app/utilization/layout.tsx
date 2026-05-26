'use client';

import FolderTabs from '@/components/common/FolderTabs';
import { Cpu, MemoryStick } from 'lucide-react';

export default function UtilizationLayout({ children }: { children: React.ReactNode }) {
  const tabs = [
    { name: 'CPU Utilization', href: '/utilization/cpu', iconKey: 'Cpu' },
    { name: 'Memory Utilization', href: '/utilization/mem', iconKey: 'MemoryStick' },
  ];

  return (
    <FolderTabs tabs={tabs}>
      {children}
    </FolderTabs>
  );
}
