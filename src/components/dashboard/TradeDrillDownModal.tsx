import React from 'react';
import { Trade } from '../../types/domain';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatShortDate, formatPercent } from '../../lib/utils';
import { 
  X, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Calendar,
  Clock,
  Target,
  FileSpreadsheet
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TradeDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  trades: Trade[];
  currency?: string;
  onSelectTrade?: (trade: Trade) => void;
}

export const TradeDrillDownModal: React.FC<TradeDrillDownModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  trades,
  currency = 'USD',
  onSelectTrade,
}) => {
  if (!isOpen) return null;

  const startingBalance = 100000;
  const metrics = CalculationEngine.calculateMetrics(trades, startingBalance);
  const totalNet = trades.reduce((acc, t) => acc + (t.status === 'CLOSED' ? t.netPnL : 0), 0);
  const isNetPositive = totalNet >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#121417] border border-[#22252A] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#22252A] bg-[#15171A]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                {title}
              </h2>
              <Badge variant="blue">
                {trades.length} {trades.length === 1 ? 'Trade' : 'Trades'}
              </Badge>
            </div>
            {subtitle && (
              <p className="text-xs text-[#848B98] mt-0.5">{subtitle}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#848B98] hover:text-white hover:bg-[#22252A] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Aggregated Subset Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#0C0D0F] border-b border-[#22252A] text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Subset Net P&L</span>
            <span className={`text-base font-bold ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isNetPositive ? '+' : ''}{formatCurrency(totalNet, currency)}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Subset Win Rate</span>
            <span className="text-base font-bold text-white">
              {metrics.winRate}%
              <span className="text-xs text-[#848B98] font-normal ml-1">
                ({metrics.winningTradesCount}W/{metrics.losingTradesCount}L)
              </span>
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Profit Factor</span>
            <span className="text-base font-bold text-blue-400">
              {metrics.profitFactor > 0 ? metrics.profitFactor.toString() : '0.00'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Total Achieved R</span>
            <span className="text-base font-bold text-purple-400">
              {metrics.totalAchievedR > 0 ? `+${metrics.totalAchievedR}R` : `${metrics.totalAchievedR}R`}
            </span>
          </div>
        </div>

        {/* Scrollable Trades Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#848B98]">
              No trades match the selected drill-down criteria.
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map((trade) => {
                const isWin = trade.netPnL > 0.001;
                const isLoss = trade.netPnL < -0.001;

                return (
                  <div
                    key={trade.id}
                    onClick={() => {
                      if (onSelectTrade) {
                        onSelectTrade(trade);
                      }
                    }}
                    className="p-3 rounded-xl bg-[#15171A] border border-[#22252A] hover:border-[#3B82F6]/50 hover:bg-[#1A1D22] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Direction, Symbol, Strategy & Date */}
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-xs font-mono shrink-0 ${
                        trade.direction === 'LONG' 
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' 
                          : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                      }`}>
                        {trade.direction === 'LONG' ? 'BUY' : 'SELL'}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-white">
                            {trade.instrument}
                          </span>
                          {trade.strategyName && (
                            <Badge variant="purple" size="sm">
                              {trade.strategyName}
                            </Badge>
                          )}
                          {trade.playbookName && (
                            <Badge variant="zinc" size="sm">
                              {trade.playbookName}
                            </Badge>
                          )}
                          {trade.session && (
                            <Badge variant="blue" size="sm">
                              {trade.session}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-[#848B98] mt-0.5 font-mono">
                          <span>{formatShortDate(trade.entryDate)}</span>
                          <span>•</span>
                          <span>Qty: {trade.quantity}</span>
                          <span>•</span>
                          <span>Entry: {trade.entryPrice}</span>
                          {trade.exitPrice && <span>→ Exit: {trade.exitPrice}</span>}
                          {trade.holdingTimeFormatted && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 text-[#606773]">
                                <Clock className="h-2.5 w-2.5" />
                                {trade.holdingTimeFormatted}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Net P&L and R Multiple */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-[#22252A] pt-2 sm:pt-0">
                      {trade.achievedRMultiple !== undefined && (
                        <div className="text-right">
                          <span className="text-[10px] text-[#848B98] uppercase block">Achieved R</span>
                          <span className={`text-xs font-mono font-bold ${
                            trade.achievedRMultiple > 0 ? 'text-purple-400' : 'text-[#848B98]'
                          }`}>
                            {trade.achievedRMultiple > 0 ? `+${trade.achievedRMultiple}R` : `${trade.achievedRMultiple}R`}
                          </span>
                        </div>
                      )}

                      <div className="text-right">
                        <span className="text-[10px] text-[#848B98] uppercase block">Net P&L</span>
                        <span className={`text-sm font-bold font-mono ${
                          isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'
                        }`}>
                          {isWin ? '+' : ''}{formatCurrency(trade.netPnL, currency)}
                        </span>
                      </div>

                      <ExternalLink className="h-4 w-4 text-[#606773] hover:text-white shrink-0 hidden sm:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#22252A] bg-[#15171A] flex items-center justify-between">
          <span className="text-xs text-[#848B98]">
            Click on any trade card to open full trade review
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
