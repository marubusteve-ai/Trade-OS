/**
 * Reusable Confirmation Modal
 * Used for critical user actions (delete account, delete trade, reset data, sign out)
 */

import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="sm">
      <div className="text-center py-2 space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827]">
            {title}
          </h3>
          <p className="text-xs text-[#848B98] dark:text-[#848B98] light:text-[#4B5563] px-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="w-1/2"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={async () => {
              await onConfirm();
              onClose();
            }}
            isLoading={isLoading}
            className="w-1/2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
