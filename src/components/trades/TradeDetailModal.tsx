import React from 'react';
import { 
  Trade, 
  Account, 
  Strategy 
} from '../../types/domain';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatDate, formatShortDate } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  ShieldAlert, 
  Layers, 
  BrainCircuit, 
  FileText, 
  Image as ImageIcon, 
  Copy, 
  Edit, 
  Trash2, 
  DollarSign, 
  Percent, 
  BarChart2,
  ExternalLink,
  Calendar
} from 'lucide-react';

interface TradeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  account?: Account | null;
  onEdit: (trade: Trade) => void;
  onDuplicate: (tradeId: string) => Promise<void>;
  onDelete: (trade: Trade) => void;
}

export const TradeDetailModal: React.FC<TradeDetailModalProps> = ({
  isOpen,
  onClose,
  trade,
  account,
  onEdit,
  onDuplicate,
  onDelete,
}) => {
  if (!trade) return null;

  const isLong = trade.direction === 'LONG';
  const isClosed = trade.status === 'CLOSED';
  const isWin = trade.netPnL > 0;
  const isLoss = trade.netPnL < 0;
  const isBE = Math.abs(trade.netPnL) <= 0.01;

  const duration = CalculationEngine.calculateHoldingDuration(trade.entryDate, trade.exitDate);
  const totalCosts = (trade.commission || 0) + (trade.swap || 0) + (trade.spreadCost || 0) + (trade.fees || 0) + (trade.slippage || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono text-white">{trade.instrument}</span>
          <Badge variant={isLong ? 'emerald' : 'rose'} size="sm">
            {isLong ? <TrendingUp className="h-3 w-3 mr-1 inline" /> : <TrendingDown className="h-3 w-3 mr-1 inline" />}
            {trade.direction}
          </Badge>
          <Badge 
            variant={isWin ? 'emerald' : isLoss ? 'rose' : isBE ? 'neutral' : 'blue'} 
            size="sm"
          >
            {trade.status === 'OPEN' ? 'OPEN POSITION' : isWin ? 'WIN' : isLoss ? 'LOSS' : 'BREAK-EVEN'}
          </Badge>
        </div>
      }
      description={`Logged under ${account?.name || 'Trading Account'} • Session: ${trade.session}`}
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onDelete(trade);
              }}
              className="text-rose-400 hover:text-rose-300 hover:border-rose-500/50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await onDuplicate(trade.id);
                onClose();
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicate
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onEdit(trade);
              }}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Edit Trade
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 text-xs text-[#D1D5DB]">
        {/* Quantitative Performance Hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Net Realized P&L</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'}`}>
              {isWin ? '+' : ''}{formatCurrency(trade.netPnL)}
            </div>
            <span className="text-[10px] text-[#848B98]">
              {trade.pnlPercentage ? `${trade.pnlPercentage > 0 ? '+' : ''}${trade.pnlPercentage}% return` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Achieved R-Multiple</span>
            <div className={`text-xl font-bold font-mono mt-0.5 ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'}`}>
              {trade.achievedRMultiple !== undefined ? `${trade.achievedRMultiple > 0 ? '+' : ''}${trade.achievedRMultiple}R` : '—'}
            </div>
            <span className="text-[10px] text-[#848B98]">
              Planned: 1:{trade.plannedRRRatio || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Planned Risk</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {trade.plannedRiskAmount ? formatCurrency(trade.plannedRiskAmount) : '—'}
            </div>
            <span className="text-[10px] text-[#848B98]">
              {trade.plannedRiskPercent ? `${trade.plannedRiskPercent}% equity` : '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Holding Duration</span>
            <div className="text-xl font-bold font-mono text-blue-400 mt-0.5">
              {duration.formatted}
            </div>
            <span className="text-[10px] text-[#848B98]">
              {trade.status}
            </span>
          </div>
        </div>

        {/* Execution & Price Breakdown */}
        <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-emerald-400" />
            Execution & Price Parameters
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Entry Price</span>
              <span className="text-sm font-semibold text-white">{trade.entryPrice}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Exit Price</span>
              <span className="text-sm font-semibold text-white">{trade.exitPrice || 'OPEN'}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Stop Loss</span>
              <span className="text-sm font-semibold text-rose-400">{trade.stopLossPrice || 'None'}</span>
            </div>
            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Take Profit</span>
              <span className="text-sm font-semibold text-emerald-400">{trade.takeProfitPrice || 'None'}</span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Volume / Lot Size</span>
              <span className="text-sm font-semibold text-white">{trade.quantity}</span>
              {trade.contractMultiplier && trade.contractMultiplier > 1 ? (
                <span className="text-[10px] text-[#848B98] block font-sans">
                  Multiplier: {trade.contractMultiplier}x
                </span>
              ) : null}
            </div>

            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Gross P&L</span>
              <span className="text-sm font-semibold text-white">
                {trade.grossPnL !== undefined ? formatCurrency(trade.grossPnL) : '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Total Execution Costs</span>
              <span className="text-sm font-semibold text-amber-400">
                -{formatCurrency(totalCosts)}
              </span>
              <span className="text-[9px] text-[#848B98] block font-sans">
                Comm: {formatCurrency(trade.commission || 0)} • Fees: {formatCurrency(trade.fees || 0)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-sans text-[#848B98] block">Asset Class</span>
              <Badge variant="neutral" size="sm" className="mt-1">
                {trade.assetClass}
              </Badge>
            </div>
          </div>
        </div>

        {/* Strategy, Setup & Confluences */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-blue-400" />
              Strategy & Playbook Linkage
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Strategy:</span>
                <span className="font-medium text-white">{trade.strategyName || 'Discretionary'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Setup:</span>
                <span className="font-medium text-white">{trade.setupName || 'Standard Setup'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Playbook:</span>
                <span className="font-medium text-white">{trade.playbookName || 'Core Model'}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#848B98]">Market Condition:</span>
                <span className="font-medium text-white">{trade.marketContext?.marketCondition || 'Trending'}</span>
              </div>
            </div>

            {trade.confluences && trade.confluences.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] text-[#848B98] block mb-1.5 uppercase font-semibold">Identified Confluences</span>
                <div className="flex flex-wrap gap-1.5">
                  {trade.confluences.map((c, i) => (
                    <Badge key={i} variant="neutral" size="sm">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Psychology & Discipline Review */}
          <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
                Psychology & Behavioral Audit
              </h4>
              {trade.psychology?.decisionQuality && (
                <Badge variant={trade.psychology.decisionQuality === 'EXCELLENT' ? 'emerald' : trade.psychology.decisionQuality === 'GOOD' ? 'blue' : 'rose'} size="sm">
                  {trade.psychology.decisionQuality} QUALITY
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-[10px] text-[#848B98] block">Pre-Trade State</span>
                <span className="font-semibold text-white text-xs">
                  {trade.psychology?.preTradeEmotion || 'FOCUSED'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-[10px] text-[#848B98] block">Post-Trade State</span>
                <span className="font-semibold text-white text-xs">
                  {trade.psychology?.postTradeEmotion || 'SATISFIED'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 py-1 border-y border-[#22252A] text-center">
              <div>
                <span className="text-[10px] text-[#848B98] block">Discipline</span>
                <span className="font-bold text-white font-mono text-xs">{trade.psychology?.disciplineScore ?? 9}/10</span>
              </div>
              <div>
                <span className="text-[10px] text-[#848B98] block">Confidence</span>
                <span className="font-bold text-blue-400 font-mono text-xs">{trade.psychology?.confidenceScore ?? 9}/10</span>
              </div>
              <div>
                <span className="text-[10px] text-[#848B98] block">Stress</span>
                <span className="font-bold text-rose-400 font-mono text-xs">{trade.psychology?.stressLevel ?? 2}/10</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-[#848B98]">Plan Adherence:</span>
              <Badge variant={trade.psychology?.followedTradingPlan ? 'emerald' : 'rose'} size="sm">
                {trade.psychology?.followedTradingPlan ? 'YES - STRICT' : 'NO - DEVIATION'}
              </Badge>
            </div>

            {/* Mistakes logged */}
            {trade.psychology?.mistakes && trade.psychology.mistakes.length > 0 && (
              <div className="pt-2 border-t border-[#22252A]">
                <span className="text-[10px] text-rose-400 block mb-1.5 uppercase font-semibold">Identified Execution Mistakes</span>
                <div className="flex flex-wrap gap-1.5">
                  {trade.psychology.mistakes.map((m, i) => (
                    <Badge key={i} variant="rose" size="sm">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Trading Habits */}
            {trade.psychology?.tradingHabits && trade.psychology.tradingHabits.length > 0 && (
              <div className="pt-2 border-t border-[#22252A]">
                <span className="text-[10px] text-emerald-400 block mb-1.5 uppercase font-semibold">Adhered Execution Habits</span>
                <div className="flex flex-wrap gap-1.5">
                  {trade.psychology.tradingHabits.map((h, i) => (
                    <Badge key={i} variant="emerald" size="sm">
                      {h}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rationales & Trade Notes */}
        {(trade.entryRationale || trade.exitRationale || trade.notes) && (
          <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Trade Rationales & Journal Notes
            </h4>

            {trade.entryRationale && (
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#848B98] block mb-1">
                  Entry Rationale & Market Thesis
                </span>
                <p className="text-xs text-[#D1D5DB] leading-relaxed bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A]">
                  {trade.entryRationale}
                </p>
              </div>
            )}

            {trade.exitRationale && (
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#848B98] block mb-1">
                  Exit Rationale & Target Mechanics
                </span>
                <p className="text-xs text-[#D1D5DB] leading-relaxed bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A]">
                  {trade.exitRationale}
                </p>
              </div>
            )}

            {trade.notes && (
              <div>
                <span className="text-[10px] font-semibold uppercase text-[#848B98] block mb-1">
                  General Journal Annotations
                </span>
                <p className="text-xs text-[#848B98] leading-relaxed bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A]">
                  {trade.notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Screenshots & Attachments */}
        {trade.attachments && trade.attachments.length > 0 && (
          <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
              Chart Screenshots & Attachments ({trade.attachments.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {trade.attachments.map((att) => (
                <div key={att.id} className="rounded-lg border border-[#22252A] overflow-hidden bg-[#0C0D0F] group">
                  <div className="aspect-video bg-[#15171A] relative flex items-center justify-center overflow-hidden">
                    <img 
                      src={att.url} 
                      alt={att.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback placeholder if broken url
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-white block truncate text-xs">{att.name}</span>
                      <span className="text-[10px] text-[#848B98]">{att.type}</span>
                    </div>
                    {att.url && (
                      <a 
                        href={att.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-1 rounded text-[#848B98] hover:text-white hover:bg-[#22252A]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps & Custom Metadata */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#848B98] pt-2 border-t border-[#22252A]">
          <div className="flex items-center gap-4">
            <span>Entered: {formatDate(trade.entryDate)}</span>
            {trade.exitDate && <span>Exited: {formatDate(trade.exitDate)}</span>}
          </div>
          <div>
            <span>Trade ID: <span className="font-mono text-zinc-400">{trade.id}</span></span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
