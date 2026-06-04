'use client';

import Link from 'next/link';
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
      ? 'text-white'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}>
      <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
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
                    className={`flex items-center justify-between gap-3 px-4 py-2 text-xs transition-colors rounded-lg ${isSubActive ? 'bg-white/10 text-white ' : 'text-slate-500 hover:text-white'
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
        <div className="px-4 text-[10px]  text-slate-500 uppercase mb-2">
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
  ] : [];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-950 text-slate-300 transition-all duration-300 z-[100] flex flex-col border-r border-slate-800 ${isCollapsed ? 'w-[80px]' : 'w-[260px]'}`}
    >
      <div className="h-[70px] flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white  text-lg italic">M</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-bold tracking-tight text-white capitalize">Metrisar</h1>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6">
        <NavGroup title="Core Analytics" items={coreItems} isCollapsed={isCollapsed} pathname={pathname} openItem={openItem} onToggle={handleToggle} />
        {govItems.length > 0 && <NavGroup title="Settings" items={govItems} isCollapsed={isCollapsed} pathname={pathname} openItem={openItem} onToggle={handleToggle} />}
      </div>

      <div className="p-3 border-t border-slate-800 space-y-2">
        {!isCollapsed && (
          <div className="px-2 mb-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
                <User className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[11px]  text-white truncate">{session?.user?.name || 'Operator'}</p>
                <p className="text-[9px] font-bold text-slate-500 capitalize">{userRole || 'Guest'}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="ml-auto p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-white rounded-lg transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;