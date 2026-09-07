/**
 * Import History & Audit Log with Rollback Subsystem
 * 
 * Tracks all historical import batches, enabling one-click deterministic rollback,
 * audit inspection, and target account ledger synchronization.
 */

import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Database, 
  Calendar,
  AlertCircle,
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useNotification } from '../../context/NotificationContext';
import { ImportBatch } from '../../types/importExport';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const ImportHistoryView: React.FC = () => {
  const { 
    importBatches, 
    rollbackImportBatch, 
    deleteImportBatchRecord,
    refreshImportBatches 
  } = useTradeOS();
  const { notify } = useNotification();

  const [selectedBatchForRollback, setSelectedBatchForRollback] = useState<ImportBatch | null>(null);
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleConfirmRollback = async () => {
    if (!selectedBatchForRollback) return;
    setIsRollingBack(true);
    try {
      const result = await rollbackImportBatch(selectedBatchForRollback.id);
      notify.success(
        'Rollback Executed', 
        `Removed ${result.deletedCount} imported trades and restored account balance.`
      );
      setSelectedBatchForRollback(null);
    } catch (err: any) {
      notify.error('Rollback Failed', err?.message || 'Error executing batch rollback.');
    } finally {
      setIsRollingBack(false);
    }
  };

  const handleDeleteRecord = async (batchId: string) => {
    setIsDeletingId(batchId);
    try {
      await deleteImportBatchRecord(batchId);
      notify.info('Audit Log Removed', 'The batch record has been removed.');
    } catch (err: any) {
      notify.error('Delete Failed', err?.message || 'Error deleting batch record.');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-400" />
              <span>Import Audit Trail & Rollback Control</span>
            </CardTitle>
            <CardDescription>
              Deterministic record of all trade import batches. Rollback safely removes all trades created in a specific batch.
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshImportBatches} className="text-xs text-[#848B98]">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh History
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#121417] text-[#848B98] uppercase text-[11px] border-b border-[#22252A]">
                <tr>
                  <th className="py-3 px-4">Batch ID / Date</th>
                  <th className="py-3 px-4">Source File</th>
                  <th className="py-3 px-4">Target Account</th>
                  <th className="py-3 px-4">Platform Preset</th>
                  <th className="py-3 px-4">Imported</th>
                  <th className="py-3 px-4">Duplicates</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1D21] bg-[#0C0D0F]">
                {importBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-[#14171A] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">#{batch.id.slice(-8)}</div>
                      <div className="text-[10px] text-[#606773]">{formatShortDate(batch.importedAt)}</div>
                    </td>
                    <td className="py-3 px-4 text-[#D1D5DB] max-w-[180px] truncate">
                      <span className="flex items-center gap-1.5 font-sans">
                        <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{batch.filename}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#D1D5DB] font-sans">
                      {batch.accountName}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral">{batch.platformPreset}</Badge>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {batch.successCount} trades
                    </td>
                    <td className="py-3 px-4 text-amber-400">
                      {batch.duplicateCount}
                    </td>
                    <td className="py-3 px-4">
                      {batch.status === 'COMPLETED' && (
                        <Badge variant="emerald">ACTIVE</Badge>
                      )}
                      {batch.status === 'ROLLED_BACK' && (
                        <Badge variant="rose">ROLLED BACK</Badge>
                      )}
                      {batch.status === 'FAILED' && (
                        <Badge variant="rose">FAILED</Badge>
                      )}
                      {batch.status === 'PENDING' && (
                        <Badge variant="amber">PENDING</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2 font-sans">
                        {batch.status === 'COMPLETED' && batch.tradeIds.length > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedBatchForRollback(batch)}
                            className="text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer h-7"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Rollback
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isDeletingId === batch.id}
                          onClick={() => handleDeleteRecord(batch.id)}
                          className="text-[11px] text-[#848B98] hover:text-rose-400 h-7"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {importBatches.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#606773] font-sans">
                      <History className="h-8 w-8 mx-auto mb-2 text-[#4B5563]" />
                      <p className="text-sm font-semibold text-[#D1D5DB]">No import batches logged yet</p>
                      <p className="text-xs text-[#606773] mt-1">Imported files and their audit logs will appear here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Modal for Rollback */}
      {selectedBatchForRollback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#121417] border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Batch Rollback</h3>
                <p className="text-xs text-amber-400 font-mono">Batch #{selectedBatchForRollback.id.slice(-8)}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-2 text-xs">
              <p className="text-[#D1D5DB]">
                This action will delete <strong className="text-white">{selectedBatchForRollback.tradeIds.length} trades</strong> that were imported from <strong className="text-white font-mono">{selectedBatchForRollback.filename}</strong>.
              </p>
              <p className="text-[#848B98]">
                Account balances and equity watermarks for <strong className="text-white">{selectedBatchForRollback.accountName}</strong> will automatically be re-calculated.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedBatchForRollback(null)}
                disabled={isRollingBack}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmRollback}
                disabled={isRollingBack}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold"
              >
                {isRollingBack ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <RotateCcw className="h-4 w-4 mr-1.5" />}
                Confirm Rollback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
