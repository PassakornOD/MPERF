'use client';
import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
}

const Modal = ({ isOpen, onClose, title, children, onDownload }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="font-bold text-lg text-gray-800">{title}</h2>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button onClick={onDownload} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Download PDF">
                <Download className="w-5 h-5 text-blue-600" />
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
