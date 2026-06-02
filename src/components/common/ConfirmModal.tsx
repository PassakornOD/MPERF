'use client';
import React from 'react';
import Modal from './Modal';

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
        <div className="space-y-10 animate-ease-in">
            <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 shadow-inner">
                <p className="text-slate-500 font-bold text-center leading-relaxed">{message}</p>
            </div>
            <div className="flex gap-4">
                <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-2xl font-black text-xs capitalize tracking-[0.2em] transition-all">Abort Action</button>
                <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-xs capitalize tracking-[0.2em] transition-all shadow-xl shadow-red-500/20">Execute Purge</button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmModal;
