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
}

const TabbedModal = ({ isOpen, onClose, title, tabs, activeTab: externalActiveTab, onTabChange }: TabbedModalProps) => {
  const [internalActiveTab, setInternalActiveTab] = useState(0);
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = onTabChange || setInternalActiveTab;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="flex px-5 gap-1 bg-gray-50/50 border-b border-gray-100 pt-3">
            {tabs.map((tab, idx) => (
                <button 
                    key={idx} 
                    onClick={() => setActiveTab(idx)}
                    className={`px-6 py-2.5 text-sm font-black transition-all rounded-t-xl border-t border-x ${
                        activeTab === idx 
                        ? 'bg-white border-gray-100 text-blue-600 -mb-[1px] shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10' 
                        : 'bg-transparent border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {tabs[activeTab].content}
        </div>
      </div>
    </div>
  );
};

export default TabbedModal;
