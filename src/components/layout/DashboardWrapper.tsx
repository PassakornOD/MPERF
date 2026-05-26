
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import { useModal } from '@/components/context/ModalContext';

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isModalOpen } = useModal();

  // If we are on the login page, don't show Navbar/Footer
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const mainClass = "p-8 flex-1 overflow-y-auto max-w-7xl mx-auto w-full";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      {!isModalOpen && <Navbar />}
      <main className={mainClass}>
        {children}
      </main>
      {!isModalOpen && <Footer />}
    </div>
  );
}
