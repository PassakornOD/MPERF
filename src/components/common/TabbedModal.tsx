'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';

interface TabbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  tabs: { label: string; content: React.ReactNode }[];
  activeTab?: number;
  onTabChange?: (index: number) => void;
  maxWidth?: string;
}

const TabbedModal = ({ 
  isOpen, 
  onClose, 
  title, 
  tabs, 
  activeTab: externalActiveTab, 
  onTabChange,
  maxWidth = "max-w-lg"
}: TabbedModalProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(0);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-[2px]">
      <div className={`bg-white rounded-3xl w-full ${maxWidth} flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200`}>
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-50 bg-slate-50/50">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex px-6 gap-1 bg-slate-50/30 border-b border-slate-50 pt-3">
            {tabs.map((tab, idx) => (
                <button 
                    key={idx} 
                    onClick={() => setActiveTab(idx)}
                    className={`px-5 py-2.5 text-xs font-black capitalize tracking-widest transition-all rounded-t-xl border-t border-x ${
                        activeTab === idx 
                        ? 'bg-white border-slate-100 text-blue-600 -mb-[1px] shadow-[0_-2px_10px_rgba(0,0,0,0.03)] z-10' 
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div className="animate-ease-in">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedModal;
