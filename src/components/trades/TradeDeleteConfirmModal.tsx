import React from 'react';
import { Trade } from '../../types/domain';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { AlertTriangle } from 'lucide-react';

interface TradeDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  trade: Trade | null;
  isLoading?: boolean;
}

export const TradeDeleteConfirmModal: React.FC<TradeDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  trade,
  isLoading = false,
}) => {
  if (!trade) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="h-5 w-5" />
          <span>Confirm Trade Deletion</span>
        </div>
      }
      description="This action is irreversible and will update account balances and equity curves."
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Permanently Delete Trade
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-xs text-[#D1D5DB]">
        <p>
          Are you sure you want to delete the trade execution record for{' '}
          <strong className="text-white font-mono">{trade.instrument}</strong> ({trade.direction})?
        </p>

        <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-[#848B98]">Trade ID:</span>
            <span className="text-white">{trade.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#848B98]">Net P&L:</span>
            <span className={trade.netPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {formatCurrency(trade.netPnL)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#848B98]">Strategy:</span>
            <span className="text-white font-sans">{trade.strategyName || 'Discretionary'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#848B98]">Status:</span>
            <span className="text-white">{trade.status}</span>
          </div>
        </div>

        <p className="text-[11px] text-[#848B98]">
          Note: If this trade was closed, its realized P&L will be automatically adjusted from the linked account balance.
        </p>
      </div>
    </Modal>
  );
};
