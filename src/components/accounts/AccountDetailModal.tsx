import React from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  Layers, 
  HeartPulse, 
  Tag, 
  Copy, 
  CheckCircle2, 
  Activity,
  Edit,
  Archive,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { Account, Trade } from '../../types/domain';
import { AccountService } from '../../services/accountService';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface AccountDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  trades: Trade[];
  onEdit: (account: Account) => void;
  onArchiveToggle: (account: Account) => void;
  onDuplicate: (account: Account) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  isOpen,
  onClose,
  account,
  trades,
  onEdit,
  onArchiveToggle,
  onDuplicate,
}) => {
  if (!account) return null;

  const accountTrades = trades.filter(t => t.accountId === account.id);
  const metrics = CalculationEngine.calculateMetrics(accountTrades, account.startingBalance);
  const health = AccountService.evaluateAccountHealth(account, accountTrades);

  const netPnL = account.currentBalance - account.startingBalance;
  const pnlPercent = account.startingBalance > 0 ? (netPnL / account.startingBalance) * 100 : 0;
  const isProp = account.accountType?.startsWith('PROP_') || account.accountType === 'CHALLENGE';

  const healthBgMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account.name}
      description={`${account.broker} • ${account.platform} • ${account.accountType}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                onDuplicate(account);
                onClose();
              }}
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Duplicate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                onArchiveToggle(account);
                onClose();
              }}
            >
              {account.isArchived ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                  Restore
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5 mr-1 text-amber-400" />
                  Archive
                </>
              )}
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
                onEdit(account);
                onClose();
              }}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit Account
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Health & Status Headline */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg border ${healthBgMap[health.color]}`}>
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Health Score: {health.score} / 100</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${healthBgMap[health.color]}`}>
                  {health.statusLabel}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">{health.summary}</p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-4">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Current Status</span>
            <Badge variant={account.status === 'ACTIVE' ? 'emerald' : account.status === 'BREACHED' ? 'rose' : 'neutral'} size="md">
              {account.status}
            </Badge>
          </div>
        </div>

        {/* Financial Balances */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Starting Capital</span>
            <span className="text-sm font-bold font-mono text-white mt-1 block">
              {formatCurrency(account.startingBalance, account.currency)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Current Balance</span>
            <span className="text-sm font-bold font-mono text-white mt-1 block">
              {formatCurrency(account.currentBalance, account.currency)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Live Equity</span>
            <span className="text-sm font-bold font-mono text-white mt-1 block">
              {formatCurrency(account.equity, account.currency)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Realized Return</span>
            <span className={`text-sm font-bold font-mono mt-1 block ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL, account.currency)} ({formatPercent(pnlPercent)})
            </span>
          </div>
        </div>

        {/* Prop Firm Compliance Objectives & Risk Limits */}
        {isProp && (
          <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                <span>Prop Firm Compliance & Rule Limits</span>
              </h4>
              {account.challengePhase && (
                <Badge variant="amber" size="sm">Phase {account.challengePhase}</Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Profit Target */}
              {account.profitTarget ? (
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-zinc-400">Profit Target Progress</span>
                    <span className="text-emerald-400 font-bold">
                      {health.profitTargetProgressPercent}% ({formatCurrency(health.profitTargetAchievedAmount)} / {formatCurrency(account.profitTarget)})
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, health.profitTargetProgressPercent))}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Max Drawdown */}
              {account.maximumLoss ? (
                <div>
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-zinc-400">Max Loss Headroom</span>
                    <span className={health.isNearMaxLoss ? 'text-rose-400 font-bold' : 'text-zinc-200'}>
                      {formatCurrency(health.drawdownBufferAmount)} buffer left
                    </span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${health.isNearMaxLoss ? 'bg-rose-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(100, health.drawdownBufferPercent)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Daily Loss Limit</span>
                <span className="text-zinc-200 font-bold">
                  {account.dailyLossLimit ? formatCurrency(account.dailyLossLimit) : 'None'}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  Buffer: {formatCurrency(health.dailyLossBufferAmount)}
                </span>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Trailing Drawdown</span>
                <span className="text-zinc-200 font-bold">
                  {account.trailingDrawdown ? formatCurrency(account.trailingDrawdown) : 'None'}
                </span>
              </div>

              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block font-sans">Trading Days Met</span>
                <span className="text-zinc-200 font-bold">
                  {health.tradingDaysCurrent} / {health.tradingDaysRequired || 'N/A'} days
                </span>
                <span className="text-[10px] text-emerald-400 block">
                  {health.isTradingDaysMet ? 'Target Satisfied' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Execution Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">Total Trades</span>
            <span className="text-white font-bold">{accountTrades.length}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">Win Rate</span>
            <span className="text-emerald-400 font-bold">{Number(metrics?.winRate || 0)}%</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">Profit Factor</span>
            <span className="text-emerald-400 font-bold">{Number(metrics?.profitFactor || 0).toFixed(2)}</span>
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800">
            <span className="text-zinc-400 text-[10px] block font-sans">Avg Achieved R</span>
            <span className="text-white font-bold">{Number(metrics?.averageAchievedR || 0).toFixed(2)}R</span>
          </div>
        </div>

        {/* Tags & Rules Notes */}
        {(account.notes || (account.tags && account.tags.length > 0)) && (
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs">
            {account.tags && account.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-400 text-[11px]">Tags:</span>
                {account.tags.map((tag, i) => (
                  <span key={i} className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-mono">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {account.notes && (
              <div className="pt-2 border-t border-zinc-800">
                <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Trading Protocol Notes:</span>
                <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded border border-zinc-800/60">
                  {account.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
