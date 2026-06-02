'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  BarChart3,
  Database,
  Package,
  FileBarChart,
  HelpCircle,
  Settings,
  Menu
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);
  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sarlog', href: '/sarlog/cpu-daily', icon: BarChart3 },
    { name: 'Utilization', href: '/utilization/cpu', icon: Database },
    { name: 'Inventory', href: '/inventory/list', icon: Package },
    { name: 'Reports', href: '/report', icon: FileBarChart },
    ...(userRole === 'admin' ? [{ name: 'Manual', href: '/faq', icon: HelpCircle }] : []),
  ];

  return (
    <nav ref={navbarRef} className="sticky top-0 z-[50] bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_20px_-5px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1450px] mx-auto px-6 sm:px-16 lg:px-32 xl:px-44 h-[80px] flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-blue-700 flex items-center justify-center shadow-lg shadow-blue-700/20 transition-transform group-hover:scale-105 duration-300">
              <span className="text-white font-black text-xl italic">M</span>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-black tracking-tight text-slate-900 capitalize italic">Metrisar</h1>
              <span className="text-xs font-black text-muted capitalize ">Infrastructure</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const isActive = (pathname.startsWith(item.href) && item.href !== '/') || (item.href === '/' && pathname === '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black capitalize  transition-all duration-300 ${isActive ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/20' : 'text-muted hover:bg-blue-50 hover:text-blue-700'}`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} /> {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 p-1 rounded-xl border transition-all duration-300 ${isProfileOpen ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-blue-50 border-blue-100 shadow-sm'}`}
            >
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-white flex items-center justify-center bg-blue-100 text-blue-700 shadow-sm">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.95 }}
                  className="absolute right-0 top-[calc(100%+1rem)] w-72 bg-white border border-blue-100 rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(30,58,138,0.15)] z-[110] p-5"
                >
                  <div className="p-6 bg-blue-50/50 rounded-[2rem] mb-4 space-y-4 flex flex-col items-center justify-center text-center border border-blue-100">
                    <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center border border-blue-100 shadow-sm transition-transform hover:rotate-3">
                      <User className="w-10 h-10 text-blue-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-blue-400 capitalize ">Operator</p>
                      <p className="text-base font-black text-slate-900 leading-tight">{session?.user?.name || 'Guest User'}</p>
                      <div className="inline-block px-4 py-1 rounded-full bg-blue-700 text-white text-[9px] font-black capitalize  border border-blue-800 shadow-md shadow-blue-200 mt-2">
                        {userRole || 'Guest'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(userRole === 'admin' || userRole === 'sysadmin') && (
                      <>
                        <Link href="/admin/sar-management" onClick={() => setIsProfileOpen(false)} className="flex items-center justify-between px-5 py-4 text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all font-bold text-xs group">
                          <div className="flex items-center gap-3">
                            <Database className="w-4 h-4 group-hover:text-blue-700 transition-colors" /> SAR Management
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                        <Link href="/admin/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center justify-between px-5 py-4 text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-all font-bold text-xs group">
                          <div className="flex items-center gap-3">
                            <Settings className="w-4 h-4 group-hover:text-blue-700 transition-colors" /> Admin Panel
                          </div>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                        </Link>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        await signOut({ redirect: false });
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-3 px-5 py-4 text-red-600 hover:bg-red-50 rounded-xl transition-all font-black capitalize  text-xs mt-2 border border-transparent hover:border-red-100"
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-3 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-50 bg-white overflow-hidden"
          >
            <div className="px-6 py-8 space-y-2">
              {navItems.map(item => {
                const isActive = (pathname.startsWith(item.href) && item.href !== '/') || (item.href === '/' && pathname === '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-6 py-5 rounded-xl text-sm font-black capitalize  transition-all ${isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} /> {item.name}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
