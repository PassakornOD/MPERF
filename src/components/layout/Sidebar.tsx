
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, BarChart3, Database, Package, HelpCircle, Check, LogOut, ChevronDown, ChevronRight, FileBarChart } from 'lucide-react';
import { signOut } from 'next-auth/react';

const Sidebar = () => {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Sarlog': true,
    'Utilization': true,
    'Inventory': true,
    'Reports': true
  });

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

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isActive = (href: string) => pathname === href;
  const isSubActive = (subItems?: { href: string }[]) => subItems?.some(sub => pathname === sub.href);

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen p-4 flex flex-col justify-between overflow-y-auto">
      <div>
        <div className="mb-8 px-2 flex items-center gap-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400 bg-white">
             <img src="/logo/weblogo2.png" alt="Metrisar Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold tracking-wider text-blue-400">METRISAR</h1>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.href ? (
                <Link 
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive(item.href) ? 'bg-blue-600' : 'hover:bg-slate-800'}`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              ) : (
                <button 
                  onClick={() => toggleMenu(item.name)}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded-lg transition-colors ${isSubActive(item.subItems) ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </div>
                  {openMenus[item.name] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
              {item.subItems && openMenus[item.name] && (
                <div className="pl-10 space-y-1 mt-1">
                  {item.subItems.map((sub) => (
                    <Link 
                      key={sub.href} 
                      href={sub.href} 
                      className={`flex items-center justify-between text-sm py-1 transition-colors ${isActive(sub.href) ? 'text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      {sub.label}
                      {isActive(sub.href) && <Check className="w-3 h-3" />}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors w-full mt-8"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
