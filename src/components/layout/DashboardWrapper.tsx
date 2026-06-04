'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import { useModal } from '@/components/context/ModalContext';
import { useState } from 'react';

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isModalOpen } = useModal();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If we are on the login page, don't show Sidebar/Header/Footer
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const sidebarWidth = isSidebarCollapsed ? '80px' : '260px';

  return (
    <div className="min-h-screen flex bg-background selection:bg-blue-600 selection:text-white">
      {!isModalOpen && <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />}
      
      <div 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{ marginLeft: !isModalOpen ? sidebarWidth : '0' }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto px-6 sm:px-12 py-10 w-full max-w-[1400px] mx-auto">
          <div className="animate-ease-in pb-20">
            {children}
          </div>
        </main>
        {!isModalOpen && <Footer />}
      </div>
    </div>
  );
}
