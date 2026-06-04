'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/Toast';
import { ChevronRight, Lock, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        showToast('Authentication failed: Please verify your credentials.', 'error');
      } else {
        router.push('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-background relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_10%,rgba(37,99,235,0.15),transparent_60%)] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-1/4 left-0 w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[440px] px-6 relative z-10"
      >
        <div className="bg-card p-10 sm:p-12 rounded-[2rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col border border-border">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-[2rem] bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default">
              <span className="text-white text-4xl italic">M</span>
            </div>
            <h1 className="text-3xl tracking-tight text-foreground capitalize italic leading-none">Metrisar</h1>
            <p className="text-[10px] text-muted-foreground capitalize  mt-3">Infrastructure Analytics Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground capitalize  ml-4 block mb-1">Username</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. sysadmin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-background border border-border pl-14 pr-6 py-4 rounded-xl text-xs font-bold focus:bg-card focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground capitalize  ml-4 block mb-1">Password</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-background border border-border pl-14 pr-6 py-4 rounded-xl text-xs font-bold focus:bg-card focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                disabled={isLoading}
                className="w-full bg-foreground text-background py-5 rounded-xl text-xl capitalize  hover:opacity-90 transition-all shadow-2xl shadow-foreground/10 active:scale-[0.98] group flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-16 text-center border-t border-border pt-8">
            <p className="text-[9px] text-muted-foreground/60 capitalize  leading-relaxed">
              Metrisar Management Console v2.7.0-CLEO<br />
              &copy; {new Date().getFullYear()} MFEC Infrastructure Services
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
