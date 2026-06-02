'use client';
import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Download } from 'lucide-react';
import { useModal } from '@/components/context/ModalContext';
import Draggable from 'react-draggable';

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
  const [mounted, setMounted] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    setMounted(true);
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

  if (!mounted || !isOpen) return null;

  const positionClasses = position === 'top-right' 
    ? 'items-start justify-end p-6 pt-20' 
    : 'items-center justify-center p-6';

  const modalContent = (
    <div className={`fixed inset-0 z-[99999] flex bg-slate-950/40 backdrop-blur-[2px] ${positionClasses} pointer-events-auto`}>
      <Draggable nodeRef={nodeRef} handle=".modal-handle" bounds="parent">
        <div 
          ref={nodeRef} 
          className={`bg-white rounded-3xl w-full ${maxWidth} flex flex-col shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300 self-center will-change-transform`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50 modal-handle cursor-grab active:cursor-grabbing bg-slate-50/50">
            <h2 className="text-xs font-black text-slate-900 capitalize tracking-widest leading-none">{title}</h2>
            <div className="flex items-center gap-2">
              {onDownload && (
                <button onClick={onDownload} className="p-2 hover:bg-white text-blue-600 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100" title="Download Report">
                  <Download className="w-4 h-4" />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white text-slate-400 hover:text-slate-900 rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="px-8 py-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </Draggable>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
