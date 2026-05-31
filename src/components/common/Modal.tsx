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
    <div className={`fixed inset-0 z-[99999] flex bg-gray-950/40 ${positionClasses} pointer-events-auto`}>
      <Draggable nodeRef={nodeRef} handle=".modal-handle" bounds="parent">
        <div 
          ref={nodeRef} 
          className={`bg-white rounded-2xl w-full ${maxWidth} flex flex-col shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in duration-300 self-center will-change-transform`}
        >
          <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 modal-handle cursor-move bg-gray-50/50">
            <h2 className="font-black text-xs text-gray-950 tracking-tight">{title}</h2>
            <div className="flex items-center gap-1">
              {onDownload && (
                <button onClick={onDownload} className="p-1 hover:bg-gray-100 rounded-lg transition-all" title="Download PDF">
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-gray-950">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="px-6 py-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
            {children}
          </div>
        </div>
      </Draggable>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
