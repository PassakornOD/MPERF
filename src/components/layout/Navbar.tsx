'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User, 
  LogOut, 
  ChevronDown, 
  LayoutDashboard, 
  BarChart3, 
  Database, 
  Package, 
  FileBarChart, 
  HelpCircle 
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Sarlog', icon: BarChart3, subItems: [
        { href: '/sarlog/cpu-daily', label: 'CPU Daily' },
        { href: '/sarlog/cpu-monthly', label: 'CPU Monthly' },
        { href: '/sarlog/mem-daily', label: 'Mem Daily' },
        { href: '/sarlog/mem-monthly', label: 'Mem Monthly' },
    ]},
    { name: 'Utilization', icon: Database, subItems: [
        { href: '/utilization/cpu', label: 'CPU Stats' },
        { href: '/utilization/mem', label: 'Mem Stats' },
    ]},
    { name: 'Inventory', icon: Package, subItems: [
        { href: '/inventory/list', label: 'Server Inventory' },
        { href: '/inventory/manage', label: 'Manage Assets' },
    ]},
    { name: 'Reports', icon: FileBarChart, subItems: [
        { href: '/report', label: 'Export PDF' },
    ]},
    { name: 'FAQ', href: '/faq', icon: HelpCircle },
  ];

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
    setUserMenuOpen(false);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    setOpenDropdown(null);
  };

  return (
    <nav ref={navbarRef} className="bg-[#005B9E] text-white p-4 border-b border-[#00ADDC] shadow-md flex items-center justify-between px-8 z-[100]">
      <div className="flex items-center gap-6">
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#00ADDC] bg-white">
           <img src="/logo/weblogo2.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-xl font-bold tracking-wider text-white">METRISAR</h1>
      </div>
      
      <div className="flex items-center justify-center gap-2">
            {navItems.map(item => (
                <div key={item.name} className="relative">
                    {item.href ? (
                        <Link href={item.href} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${pathname === item.href ? 'bg-[#00ADDC] text-white' : 'hover:bg-[#0089c2]'}`}>
                            <item.icon className="w-4 h-4" /> {item.name}
                        </Link>
                    ) : (
                        <button 
                          onClick={() => toggleDropdown(item.name)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${openDropdown === item.name ? 'bg-[#00ADDC]' : 'hover:bg-[#0089c2]'}`}
                        >
                            <item.icon className="w-4 h-4" /> {item.name} <ChevronDown className="w-4 h-4" />
                        </button>
                    )}
                    <AnimatePresence>
                      {item.subItems && openDropdown === item.name && (
                          <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 5 }}
                              className="absolute top-full left-0 mt-2 w-56 bg-white border border-sky-100 text-slate-700 rounded-2xl shadow-2xl z-[100] py-2 overflow-hidden"
                          >
                              {item.subItems.map(sub => (
                                  <Link 
                                    key={sub.href} 
                                    href={sub.href} 
                                    onClick={() => setOpenDropdown(null)}
                                    className={`block px-5 py-2.5 hover:bg-sky-50 text-sm font-medium ${pathname === sub.href ? 'text-[#005B9E] font-bold bg-sky-50' : 'text-slate-600'}`}
                                  >
                                    {sub.label}
                                  </Link>
                              ))}

                          </motion.div>
                      )}
                    </AnimatePresence>
                </div>
            ))}
      </div>
      
      <div className="relative">
        <button onClick={() => { setUserMenuOpen(!userMenuOpen); setOpenDropdown(null); }} className="flex items-center gap-2 text-sm font-semibold text-white hover:bg-[#0089c2] px-4 py-2 rounded-full transition-colors">
            <User className="w-5 h-5 text-[#00ADDC]" />
            {session?.user?.name || 'Admin'}
            <ChevronDown className="w-4 h-4" />
        </button>
        <AnimatePresence>
          {userMenuOpen && (
              <motion.button 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                onClick={() => signOut({ callbackUrl: '/login' })} 
                className="absolute right-0 mt-2 bg-white text-rose-600 px-6 py-2.5 rounded-2xl shadow-2xl border border-rose-50 text-sm font-semibold flex items-center gap-2 hover:bg-rose-50 z-[100]"
              >
                  <LogOut className="w-4 h-4" /> Logout
              </motion.button>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
