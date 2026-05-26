
'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/Toast';
import Image from 'next/image';

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
    <div className="flex flex-col justify-center items-center min-h-screen bg-slate-900">
      <form onSubmit={handleSubmit} className="bg-white p-10 rounded-2xl shadow-2xl w-96 flex flex-col items-center">
        <div className="mb-8 bg-white p-2 rounded-lg">
          <Image 
            src="/logo/weblogo2.png"
            alt="Metrisar Logo" 
            width={192}
            height={64}
            className="w-48 h-auto object-contain"
          />
        </div>



        <p className="text-gray-500 mb-8 font-medium">Sign in to your dashboard</p>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 p-3 mb-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-3 mb-6 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
          Login
        </button>
      </form>
    </div>
  );
}
