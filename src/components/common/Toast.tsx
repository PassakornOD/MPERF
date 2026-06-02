'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<{
  showToast: (message: string, type: ToastType) => void;
} | undefined>(undefined);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-center gap-4 px-4 py-3 rounded-sm shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] border bg-white ${toast.type === 'success' ? 'border-emerald-100' :
                toast.type === 'error' ? 'border-red-100' :
                  'border-blue-100'
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                toast.type === 'error' ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                {toast.type === 'success' && <CheckCircle className="w-6 h-6" />}
                {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
                {toast.type === 'info' && <Info className="w-6 h-6" />}
              </div>
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-black capitalize ${toast.type === 'success' ? 'text-emerald-600' :
                  toast.type === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }`}>{toast.type}</span>
                <p className="text-xs font-black text-slate-900 leading-tight pr-6">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-auto p-1.5 hover:bg-slate-50 rounded-sm text-slate-300 hover:text-slate-900 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
