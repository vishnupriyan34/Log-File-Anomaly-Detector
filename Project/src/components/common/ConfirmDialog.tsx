import React from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

interface ConfirmDialogProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  id = 'confirm-dialog',
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger',
  isLoading = false
}) => {
  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      title={
        <div className="flex items-center gap-2 text-red-400">
          <ShieldAlert className="w-5 h-5 text-red-400" />
          <span>{title}</span>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
          <button
            id={`${id}-cancel-btn`}
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            {cancelText}
          </button>
          <button
            id={`${id}-confirm-btn`}
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all flex items-center gap-2"
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
