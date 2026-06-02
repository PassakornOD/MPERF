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
  ShieldCheck
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isCollapsed, onToggle }: { isCollapsed: boolean, onToggle: () => void }) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sarlog', href: '/sarlog/cpu-daily', icon: BarChart3 },
    { name: 'Utilization', href: '/utilization/cpu', icon: Database },
    { name: 'Inventory', href: '/inventory/list', icon: Package },
    { name: 'Reports', href: '/report', icon: FileBarChart },
    ...(userRole === 'admin' ? [{ name: 'Manual', href: '/faq', icon: HelpCircle }] : []),
  ];

  const adminItems = (userRole === 'admin' || userRole === 'sysadmin') ? [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: Settings },
    { name: 'SAR Management', href: '/admin/sar-management', icon: ShieldCheck },
  ] : [];

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-slate-300 transition-all duration-300 z-[100] flex flex-col shadow-2xl ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}
    >
      {/* Branding */}
      <div className="h-[80px] flex items-center px-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <span className="text-white font-black text-xl italic">M</span>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col leading-tight animate-in fade-in duration-300">
              <h1 className="text-lg font-black tracking-tight text-white capitalize italic">Metrisar</h1>
              <span className="text-[10px] font-black text-slate-500 capitalize ">Infrastructure</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-8 px-4 space-y-8">
        <div className="space-y-1">
          {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase  mb-4">Core Analytics</p>}
          {navItems.map((item) => {
            const isActive = (pathname.startsWith(item.href) && item.href !== '/') || (item.href === '/' && pathname === '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                  : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`} />
                {!isCollapsed && <span className="text-xs font-black capitalize  animate-in fade-in duration-300">{item.name}</span>}
                {isActive && !isCollapsed && <motion.div layoutId="activeHighlight" className="ml-auto w-1 h-4 bg-white/40 rounded-full" />}
              </Link>
            );
          })}
        </div>

        {adminItems.length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase  mb-4">Governance</p>}
            {adminItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                    : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                  {!isCollapsed && <span className="text-xs font-black capitalize  animate-in fade-in duration-300">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer / Toggle */}
      <div className="p-4 border-t border-slate-800/50 space-y-2">
        {!isCollapsed && (
          <div className="px-2 mb-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                    <p className="text-[11px] font-black text-white truncate">{session?.user?.name || 'Operator'}</p>
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
          className="w-full flex items-center justify-center py-3 bg-slate-800/30 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
