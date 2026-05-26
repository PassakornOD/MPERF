
import UtilizationStats from '@/components/stats/UtilizationStats';
import FolderTabs from '@/components/common/FolderTabs';

const tabs = [
  { name: 'CPU Stats', href: '/utilization/cpu', iconKey: 'Cpu' },
  { name: 'Mem Stats', href: '/utilization/mem', iconKey: 'MemoryStick' },
];

export default function CpuUtilizationPage() {
  return (
    <UtilizationStats type="CPU" />
  );
}
