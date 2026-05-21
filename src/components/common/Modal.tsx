'use client';
import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useModal } from '@/components/context/ModalContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onDownload?: () => void;
  maxWidth?: string;
  position?: 'center' | 'top-right';
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onDownload, 
  maxWidth = "max-w-4xl",
  position = 'center' 
}: ModalProps) => {
  const { setModalOpen } = useModal();

  useEffect(() => {
    setModalOpen(isOpen);
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; 
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, setModalOpen]);

  if (!isOpen) return null;

  const positionClasses = position === 'top-right' 
    ? 'items-start justify-end p-6 pt-20' 
    : 'items-center justify-center p-6';

  return (
    <div className={`fixed inset-0 z-[99999] flex bg-gray-950/20 backdrop-blur-sm ${positionClasses}`}>
      <div className={`bg-white rounded-[32px] w-full ${maxWidth} flex flex-col shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in duration-300`}>
        <div className="flex justify-between items-center px-8 py-7 border-b border-gray-100">
          <h2 className="font-black text-2xl text-gray-950 tracking-tight">{title}</h2>
          <div className="flex items-center gap-2">
            {onDownload && (
              <button onClick={onDownload} className="p-3 hover:bg-gray-100 rounded-2xl transition-all" title="Download PDF">
                <Download className="w-5 h-5 text-blue-600" />
              </button>
            )}
            <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-gray-950">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="px-8 py-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

