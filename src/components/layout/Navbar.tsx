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
    <nav ref={navbarRef} className="sticky top-0 z-[50] bg-white border-b border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
      <div className="max-w-[1800px] mx-auto px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <div className="flex flex-col leading-none">
              <h1 className="text-[14px] font-black tracking-[0.1em] text-gray-900 uppercase">METRISAR</h1>
              <span className="text-[9px] font-bold text-gray-400 tracking-[0.2em] uppercase">Infrastructure</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${pathname.startsWith(item.href) && item.href !== '/' || (item.href === '/' && pathname === '/') ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="w-4 h-4" /> {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 border px-2 py-2 rounded-full transition-all duration-300 ${isProfileOpen ? 'bg-gray-50 border-gray-200' : 'bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200'}`}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-50 text-blue-600">
              {session?.user?.image ? (
                <img src={session.user.image} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-3 h-3" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute right-0 top-[calc(100%+0.5rem)] w-64 bg-white border border-gray-100 rounded-3xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] z-[110] p-3"
              >
                <div className="p-4 bg-gray-50 rounded-2xl mb-2 space-y-2 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm mb-1">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Signed in as</p>
                  <div className="flex flex-col gap-1.5 items-center">
                    <p className="text-sm font-black text-gray-900">{session?.user?.name || 'User'}</p>
                    <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-200">{userRole || 'Guest'}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {(userRole === 'admin' || userRole === 'sysadmin') && (
                    <>
                      <Link href="/admin/sar-management" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all font-bold text-xs">
                        <Database className="w-4 h-4" /> SAR Management
                      </Link>
                      <Link href="/admin/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all font-bold text-xs">
                        <Settings className="w-4 h-4" /> Admin Panel
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-xs"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
