
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/Toast';
import { ChevronRight } from 'lucide-react';

export default function LoginPage() {
  const { showToast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      showToast('Invalid username or password', 'error');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(37,99,235,0.1),transparent_70%)] pointer-events-none"></div>
      
      <form onSubmit={handleSubmit} className="bg-white p-12 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] w-[420px] flex flex-col items-center relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 rotate-3 transition-transform hover:rotate-0 duration-500">
            <span className="text-white font-black text-3xl italic">M</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 capitalize italic">Metrisar</h1>
            <p className="text-xs font-black text-slate-400 capitalize tracking-[0.3em] mt-1">Infrastructure Platform</p>
          </div>
        </div>

        <div className="w-full space-y-5">
            <div className="relative group">
                <input
                    type="text"
                    placeholder="OPERATOR_ID"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black capitalize tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
                />
            </div>
            <div className="relative group">
                <input
                    type="password"
                    placeholder="ACCESS_TOKEN"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black capitalize tracking-widest focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-200 outline-none transition-all shadow-inner"
                />
            </div>
            
            <div className="pt-4">
                <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] capitalize tracking-[0.4em] hover:bg-black transition-all shadow-2xl shadow-slate-200 active:scale-[0.98] group flex items-center justify-center gap-3">
                    Authorize Access <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>

        <div className="mt-12 text-center">
            <p className="text-[9px] font-black text-slate-300 capitalize tracking-widest leading-relaxed">
                Metrisar Management Console v2.6.0<br/>
                &copy; 2026 MFEC Infrastructure Services
            </p>
        </div>
      </form>
    </div>
  );
}
