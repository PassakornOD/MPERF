
'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';

const Header = () => {
  const { data: session } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const userRole = (session?.user as any)?.role;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Click outside logic to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <header className="h-[70px] bg-card border-b border-border flex items-center justify-end px-6 sticky top-0 z-[50]">
      <div className="flex items-center gap-6">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-accent transition-all group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <User className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-sm font-bold text-foreground">{session?.user?.name || 'Administrator'}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{userRole || 'Guest'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-popover border border-border shadow-2xl rounded-2xl z-[1000] py-2 animate-ease-in">
              <div className="px-4 py-6 border-b border-border mb-1 flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-md">
                  <User className="w-8 h-8" />
                </div>
                <div className="flex flex-col min-w-0 w-full">
                  <p className="text-base font-bold text-foreground truncate">{session?.user?.name || 'Administrator'}</p>
                  <div className="flex items-center justify-center gap-2 mt-0.5">
                    <span className="px-2 py-0.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {userRole || 'Guest'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-2 py-1 space-y-0.5">
                <button
                  onClick={() => setTheme(isDark ? 'light' : 'dark')}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors rounded-xl group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${isDark ? 'bg-slate-800 text-yellow-500' : 'bg-slate-100 text-slate-700'}`}>
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </div>
                    <span className="font-semibold">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${isDark ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${isDark ? 'left-6' : 'left-1'}`} />
                  </div>
                </button>

                <div className="h-px bg-border mx-2 my-1" />

                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-semibold rounded-xl"
                >
                  <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4" />
                  </div>
                  Logout Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
