/**
 * Fast Import Modal Dialog
 */

import React from 'react';
import { X, UploadCloud } from 'lucide-react';
import { ImportWizard } from './ImportWizard';
import { Button } from '../ui/Button';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAccountId?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, initialAccountId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#0C0D0F] border border-[#22252A] rounded-2xl max-w-4xl w-full p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between pb-3 border-b border-[#22252A]">
          <div className="flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Import Trading Statement / CSV</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-[#848B98]">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ImportWizard onComplete={onClose} initialAccountId={initialAccountId} />
      </div>
    </div>
  );
};
