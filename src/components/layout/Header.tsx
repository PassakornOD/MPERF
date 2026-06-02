
'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const Header = () => {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 relative">
      <div className="text-xl font-bold text-slate-800">System Performance Monitor</div>
      
      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 focus:outline-none transition-colors"
        >
          <User className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">{session?.user?.name || 'Administrator'}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 shadow-lg rounded-xl z-[1000] py-2">
            <button 
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
