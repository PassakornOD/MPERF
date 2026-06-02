'use client';
import React from 'react';
import Modal from './Modal';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
        <div className="space-y-8 animate-ease-in">
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-sm">
                  <AlertCircle size={32} />
                </div>
                <p className="text-slate-600 font-medium text-center leading-relaxed text-sm">{message}</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <button onClick={onClose} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-colors text-sm font-semibold">Cancel</button>
                <button onClick={() => { onConfirm(); onClose(); }} className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm font-semibold shadow-sm">Confirm Action</button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmModal;
