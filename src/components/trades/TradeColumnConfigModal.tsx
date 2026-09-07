import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useCustomization } from '../../context/CustomizationContext';
import { 
  Check, 
  ChevronUp, 
  ChevronDown, 
  RotateCcw, 
  Columns, 
  Eye, 
  EyeOff 
} from 'lucide-react';

export const TradeColumnConfigModal: React.FC = () => {
  const {
    tradeColumns,
    toggleColumnVisibility,
    reorderColumns,
    resetTradeColumns,
    isColumnConfigModalOpen,
    closeColumnConfigModal,
  } = useCustomization();

  const moveColumn = (index: number, direction: 'UP' | 'DOWN') => {
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === tradeColumns.length - 1) return;
    reorderColumns(index, direction === 'UP' ? index - 1 : index + 1);
  };

  const visibleCount = tradeColumns.filter((c) => c.visible).length;

  return (
    <Modal
      isOpen={isColumnConfigModalOpen}
      onClose={closeColumnConfigModal}
      title="Customize Trade Table Columns & Field Visibility"
      size="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#848B98]">
          <span>
            <strong className="text-white">{visibleCount}</strong> of {tradeColumns.length} fields visible.
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetTradeColumns}
            className="h-6 text-[11px] text-zinc-400 hover:text-white gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Defaults</span>
          </Button>
        </div>

        {/* Columns Reorder and Toggle List */}
        <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
          {tradeColumns.map((col, index) => (
            <div
              key={col.id}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                col.visible
                  ? 'bg-[#15171A] border-[#22252A]'
                  : 'bg-[#0E1012] border-[#1A1C20] opacity-60'
              }`}
            >
              <div
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => toggleColumnVisibility(col.id)}
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    col.visible
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-[#383D4A] bg-[#0C0D0F]'
                  }`}
                >
                  {col.visible && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <span className="text-xs font-semibold text-white truncate">{col.label}</span>
                <Badge variant="zinc" className="text-[9px] py-0 px-1">
                  {col.group}
                </Badge>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  disabled={index === 0}
                  onClick={() => moveColumn(index, 'UP')}
                  title="Move Column Left / Up"
                  className="p-1 hover:bg-[#2B303B] disabled:opacity-30 rounded text-[#848B98] hover:text-white"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === tradeColumns.length - 1}
                  onClick={() => moveColumn(index, 'DOWN')}
                  title="Move Column Right / Down"
                  className="p-1 hover:bg-[#2B303B] disabled:opacity-30 rounded text-[#848B98] hover:text-white"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-3 border-t border-[#22252A]">
          <Button
            variant="primary"
            size="sm"
            onClick={closeColumnConfigModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4"
          >
            Save Column Preferences
          </Button>
        </div>
      </div>
    </Modal>
  );
};
