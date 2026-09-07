import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useCustomization } from '../../context/CustomizationContext';
import { TradeEntryTemplate } from '../../types/customization';
import { AssetClass, MarketSession } from '../../types/domain';
import { 
  FileCode, 
  Plus, 
  Trash2, 
  Check, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

interface TradeTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate?: (template: TradeEntryTemplate) => void;
}

export const TradeTemplatesModal: React.FC<TradeTemplatesModalProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  const { tradeTemplates, saveTradeTemplate, deleteTradeTemplate } = useCustomization();
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instrument, setInstrument] = useState('');
  const [assetClass, setAssetClass] = useState<AssetClass>('FUTURES');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  const [plannedRiskPercent, setPlannedRiskPercent] = useState<number>(1.0);
  const [plannedRRRatio, setPlannedRRRatio] = useState<number>(2.0);
  const [session, setSession] = useState<MarketSession>('NEW_YORK');
  const [defaultNotes, setDefaultNotes] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instrument.trim()) return;

    saveTradeTemplate({
      name: name.trim(),
      description: description.trim(),
      instrument: instrument.trim().toUpperCase(),
      assetClass,
      direction,
      plannedRiskPercent,
      plannedRRRatio,
      session,
      defaultNotes: defaultNotes.trim(),
    });

    setName('');
    setDescription('');
    setInstrument('');
    setDefaultNotes('');
    setIsCreating(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade Entry Templates" size="md">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#22252A]">
          <span className="text-xs text-[#848B98]">
            Standardize your executions with reusable pre-configured setups.
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreating(!isCreating)}
            className="h-7 text-xs border-[#2B303B] text-emerald-400 hover:text-white hover:border-emerald-500 gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </Button>
        </div>

        {/* Create Form */}
        {isCreating && (
          <form onSubmit={handleCreate} className="p-3 bg-[#0C0D0F] border border-emerald-500/40 rounded-lg space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Create Execution Template
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-[#848B98] mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., NQ Opening Breakout"
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#848B98] mb-1">Symbol / Pair *</label>
                <input
                  type="text"
                  required
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  placeholder="e.g., NQ, EURUSD, BTC"
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#848B98] mb-1">Asset Class</label>
                <select
                  value={assetClass}
                  onChange={(e) => setAssetClass(e.target.value as AssetClass)}
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="FUTURES">Futures</option>
                  <option value="FOREX">Forex</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="EQUITIES">Equities</option>
                  <option value="OPTIONS">Options</option>
                  <option value="COMMODITIES">Commodities</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#848B98] mb-1">Side</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as 'LONG' | 'SHORT')}
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="LONG">BUY / LONG</option>
                  <option value="SHORT">SELL / SHORT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#848B98] mb-1">Target R:R</label>
                <input
                  type="number"
                  step="0.1"
                  value={plannedRRRatio}
                  onChange={(e) => setPlannedRRRatio(parseFloat(e.target.value) || 2)}
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Save Template
              </Button>
            </div>
          </form>
        )}

        {/* Templates List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {tradeTemplates.map((t) => (
            <div
              key={t.id}
              className="p-3 bg-[#15171A] border border-[#22252A] rounded-lg hover:border-[#2E333C] transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{t.name}</span>
                  <Badge variant={t.direction === 'LONG' ? 'emerald' : 'amber'}>
                    {t.direction}
                  </Badge>
                  <span className="text-xs font-mono font-bold text-emerald-400">{t.instrument}</span>
                </div>
                <div className="text-[11px] text-[#848B98] mt-1 flex items-center gap-3">
                  <span>Target: {t.plannedRRRatio || 2}:1 R:R</span>
                  <span>Risk: {t.plannedRiskPercent || 1}%</span>
                  <span>{t.assetClass}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {onApplyTemplate && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      onApplyTemplate(t);
                      onClose();
                    }}
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Apply</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTradeTemplate(t.id)}
                  className="h-7 w-7 p-0 text-[#555C68] hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
