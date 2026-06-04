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
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] pointer-events-auto transition-all`}>
      <Draggable nodeRef={nodeRef} handle=".modal-handle" bounds="parent">
        <div 
          ref={nodeRef} 
          className={`bg-card rounded-xl w-full ${maxWidth} flex flex-col shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 self-center will-change-transform`}
        >
          <div className="flex justify-between items-center px-6 py-4 border-b border-border modal-handle cursor-grab active:cursor-grabbing">
            <h2 className="text-lg font-semibold text-foreground leading-none">{title}</h2>
            <div className="flex items-center gap-2">
              {onDownload && (
                <button onClick={onDownload} className="p-1.5 text-muted-foreground hover:text-blue-600 transition-colors" title="Download">
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </Draggable>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
