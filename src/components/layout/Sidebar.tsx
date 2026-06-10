'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Package,
  FileBarChart,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  ShieldCheck,
  ChevronDown,
  Cpu,
  MemoryStick,
  List,
  FileText,
  Activity,
  Check
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const NavItem = ({ item, isCollapsed, pathname, isOpen, onToggle }: { item: any, isCollapsed: boolean, pathname: string, isOpen: boolean, onToggle: () => void }) => {
  const isChildActive = item.subItems?.some((sub: any) => pathname.startsWith(sub.href));
  const isSelfActive = (pathname.startsWith(item.href) && item.href !== '/') || (item.href === '/' && pathname === '/');
  const isActive = isSelfActive || isChildActive;
  const hasSubItems = !!item.subItems;

  const handleClick = (e: React.MouseEvent) => {
    if (hasSubItems) {
      e.preventDefault();
    }
    onToggle();
  };

  const NavContent = (
    <div className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg transition-all duration-300 group ${isActive
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}>
      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-muted-foreground group-hover:text-blue-500'}`} />
      {!isCollapsed && <span className="text-xs font-semibold capitalize">{item.name}</span>}
      {hasSubItems && !isCollapsed && (
        <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      )}
    </div>
  );

  return (
    <div>
      <Link href={item.href} onClick={handleClick}>
        {NavContent}
      </Link>

      {hasSubItems && !isCollapsed && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pl-8 space-y-1 mt-1 overflow-hidden"
            >
              {item.subItems.map((sub: any) => {
                const isSubActive = pathname === sub.href;
                return (
                  <Link
                    key={sub.name}
                    href={sub.href}
                    className={`flex items-center justify-between gap-3 px-4 py-2 text-xs transition-colors rounded-lg ${isSubActive
                      ? 'bg-blue-600/10 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <sub.icon className="w-3 h-3" />
                      {sub.name}
                    </div>
                    {isSubActive}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

const NavGroup = ({ title, items, isCollapsed, pathname, openItem, onToggle }: { title: string, items: any[], isCollapsed: boolean, pathname: string, openItem: string | null, onToggle: (name: string) => void }) => {
  return (
    <div className="space-y-1">
      {!isCollapsed && (
        <div className="px-4 text-[10px]  text-muted-foreground uppercase mb-2">
          {title}
        </div>
      )}
      <div className="space-y-1">
        {items.map((item) => (
          <NavItem
            key={item.name}
            item={item}
            isCollapsed={isCollapsed}
            pathname={pathname}
            isOpen={openItem === item.name}
            onToggle={() => onToggle(item.name)}
          />
        ))}
      </div>
    </div>
  );
};

const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const [openItem, setOpenItem] = useState<string | null>(null);

  const handleToggle = (name: string) => {
    setOpenItem(openItem === name ? null : name);
  };

  const docSubItems = [
    { name: 'Manual', href: '/faq/info', icon: FileText },
    { name: 'Operations', href: '/faq/operations', icon: Activity },
    { name: 'Ingestion DB', href: '/faq/ingestion', icon: Database },
    { name: 'Explorer DB', href: '/faq/explorer', icon: Database },
    { name: 'Admin Guide', href: '/faq/admin', icon: ShieldCheck },
  ].filter(sub => {
    if (userRole === 'admin') return true;
    if (userRole === 'sysadmin') return ['Manual', 'Operations', 'Admin Guide'].includes(sub.name);
    return false;
  });

  const coreItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    {
      name: 'Sarlog', href: '/sarlog/cpu-daily', icon: BarChart3,
      subItems: [
        { name: 'CPU Daily', href: '/sarlog/cpu-daily', icon: Cpu },
        { name: 'CPU Monthly', href: '/sarlog/cpu-monthly', icon: Cpu },
        { name: 'Mem Daily', href: '/sarlog/mem-daily', icon: MemoryStick },
        { name: 'Mem Monthly', href: '/sarlog/mem-monthly', icon: MemoryStick },
      ]
    },
    {
      name: 'Utilization', href: '/utilization/cpu', icon: Database,
      subItems: [
        { name: 'CPU', href: '/utilization/cpu', icon: Cpu },
        { name: 'Mem', href: '/utilization/mem', icon: MemoryStick },
      ]
    },
    {
      name: 'Inventory', href: '/inventory/list', icon: Package,
      subItems: [
        { name: 'Registry', href: '/inventory/list', icon: List },
        { name: 'Manage', href: '/inventory/manage/groups', icon: Settings },
      ]
    },
    {
      name: 'Reports', href: '/report', icon: FileBarChart,
      subItems: [
        { name: 'Generate', href: '/report', icon: FileText },
        { name: 'Batch', href: '/report/batch', icon: FileText },
      ]
    },
    ...(userRole !== 'operation' ? [{
      name: 'Documentation', href: '/faq/info', icon: HelpCircle,
      subItems: docSubItems
    }] : [])
  ];

  const govItems = (userRole === 'admin') ? [
    {
      name: 'Admin', href: '/admin/users', icon: Settings,
      subItems: [
        { name: 'Users', href: '/admin/users', icon: User },
        { name: 'User Groups', href: '/admin/user-groups', icon: Users },
        { name: 'Permissions', href: '/admin/permission-groups', icon: ShieldCheck },
      ]
    },
    {
      name: 'SAR Management', href: '/admin/sar-management/explorer', icon: ShieldCheck,
      subItems: [
        { name: 'Explorer', href: '/admin/sar-management/explorer', icon: BarChart3 },
        { name: 'Ingestion', href: '/admin/sar-management/ingestion', icon: Database },
        { name: 'Logs', href: '/admin/sar-management/logs', icon: FileText },
      ]
    },
  ] : (userRole === 'sysadmin' ? [
    {
      name: 'Admin', href: '/admin/users', icon: Settings,
      subItems: [
        { name: 'Users', href: '/admin/users', icon: User },
        { name: 'User Groups', href: '/admin/user-groups', icon: Users },
        { name: 'Permissions', href: '/admin/permission-groups', icon: ShieldCheck },
      ]
    }
  ] : []);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-card text-foreground transition-all duration-300 z-[100] flex flex-col border-r border-border ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      <div className="h-[70px] flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <Image src="/logo/mperf2.png" alt="Mperf Logo" width={48} height={48} className="object-contain" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        <NavGroup title="Core Analytics" items={coreItems} isCollapsed={isCollapsed} pathname={pathname} openItem={openItem} onToggle={handleToggle} />
        {govItems.length > 0 && <NavGroup title="Settings" items={govItems} isCollapsed={isCollapsed} pathname={pathname} openItem={openItem} onToggle={handleToggle} />}
      </div>

      <div className="p-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2.5 bg-muted hover:bg-accent text-muted-foreground hover:text-foreground rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;