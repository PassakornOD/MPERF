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
        <div className="space-y-6">
            <p className="text-gray-600 font-bold">{message}</p>
            <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm">Cancel</button>
                <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 bg-red-600 hover:text-red-700 text-white py-3 rounded-xl font-bold text-sm">Confirm</button>
            </div>
        </div>
    </Modal>
  );
};

export default ConfirmModal;
