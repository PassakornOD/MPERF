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
      <div className="max-w-[1450px] mx-auto px-6 sm:px-16 lg:px-32 xl:px-44 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-bold tracking-tight text-gray-900">Metrisar</h1>
              <span className="text-[10px] font-semibold text-gray-400 tracking-normal">Infrastructure Analytics</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {navItems.map(item => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${pathname.startsWith(item.href) && item.href !== '/' || (item.href === '/' && pathname === '/') ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                <item.icon className="w-4 h-4" /> {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 p-1.5 rounded-full border transition-all duration-300 ${isProfileOpen ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-gray-100'}`}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-50 text-blue-600 shadow-sm">
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
                  className="absolute right-0 top-[calc(100%+0.75rem)] w-72 bg-white border border-gray-100 rounded-[2rem] shadow-2xl z-[110] p-4"
                >
                  <div className="p-5 bg-gray-50 rounded-[1.5rem] mb-3 space-y-3 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                      <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Logged in as</p>
                      <p className="text-base font-bold text-gray-900">{session?.user?.name || 'Guest User'}</p>
                      <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200">
                        {userRole || 'Guest'}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {(userRole === 'admin' || userRole === 'sysadmin') && (
                      <>
                        <Link href="/admin/sar-management" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all font-semibold text-sm">
                          <Database className="w-4 h-4" /> SAR Management
                        </Link>
                        <Link href="/admin/dashboard" onClick={() => setIsProfileOpen(false)} className="flex items-center gap-3 px-4 py-3.5 text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-2xl transition-all font-semibold text-sm">
                          <Settings className="w-4 h-4" /> Admin Panel
                        </Link>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        await signOut({ redirect: false });
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-semibold text-sm mt-1"
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
            className="lg:hidden p-2.5 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
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
            className="lg:hidden border-t border-gray-50 bg-white overflow-hidden"
          >
            <div className="px-6 py-6 space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-base font-semibold transition-all ${pathname.startsWith(item.href) && item.href !== '/' || (item.href === '/' && pathname === '/') ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <item.icon className="w-5 h-5" /> {item.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
