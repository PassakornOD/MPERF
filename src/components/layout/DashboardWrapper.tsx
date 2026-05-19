
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on the login page, don't show Navbar/Footer
  if (pathname === '/login') {
    return <>{children}</>;
  }

  const isSpecialPage = pathname.includes('/inventory');
  const mainClass = `p-8 flex-1 overflow-y-auto bg-gray-50 ${!isSpecialPage ? 'max-w-7xl mx-auto w-full px-12 mt-6' : ''}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className={mainClass}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
