'use client';

import { usePathname, useRouter } from 'next/navigation';
import { HelpCircle, BookOpen, Server, Database, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const username = (session?.user as any)?.name;
  
  // Debug log for troubleshooting
  console.log('FAQ Layout - Current User:', username);
  
  const isAuthorized = username && ['sysreport', 'mfadmin'].includes(username.toLowerCase());

  const tabs = [
    { name: 'Manual', href: '/faq/info', icon: HelpCircle },
    { name: 'Operations', href: '/faq/operations', icon: Server },
    ...(isAuthorized ? [
        { name: 'Ingestion DB', href: '/faq/ingestion', icon: BookOpen },
        { name: 'Explorer DB', href: '/faq/explorer', icon: Database },
    ] : []),
    { name: 'Admin', href: '/faq/admin', icon: ShieldCheck },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Help & Documentation</h1>
          <p className="text-sm font-bold text-gray-400 mt-2">Comprehensive system guides and references</p>
        </div>

        <div className="bg-gray-100 p-1 rounded-2xl flex">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <button
                key={tab.name}
                onClick={() => router.push(tab.href)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-3 h-3" /> {tab.name}
              </button>
            );
          })}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

