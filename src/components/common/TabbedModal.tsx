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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] transition-all">
      <div className={`bg-card rounded-xl w-full ${maxWidth} flex flex-col shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
        <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-card">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h2>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex px-6 gap-1 bg-background border-b border-border">
            {tabs.map((tab, idx) => (
                <button 
                    key={idx} 
                    onClick={() => setActiveTab(idx)}
                    className={`px-4 py-2.5 text-xs font-semibold transition-all border-b-2 ${
                        activeTab === idx 
                        ? 'border-blue-600 text-blue-600 bg-card shadow-sm' 
                        : 'border-transparent text-muted-foreground hover:text-slate-700 hover:bg-slate-100'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="animate-ease-in">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabbedModal;
