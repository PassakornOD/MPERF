
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

  const mainClass = "flex-1 overflow-y-auto px-6 sm:px-16 lg:px-32 xl:px-44 py-12 w-full max-w-[1450px] mx-auto transition-all duration-300";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50 selection:bg-blue-100 selection:text-blue-700">
      {!isModalOpen && <Navbar />}
      <main className={mainClass}>
        <div className="animate-ease-in">
          {children}
        </div>
      </main>
      {!isModalOpen && <Footer />}
    </div>
  );
}
