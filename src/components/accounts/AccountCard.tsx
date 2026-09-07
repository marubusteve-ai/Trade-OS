import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  Archive,
  RefreshCw,
  Copy,
  Sparkles,
  Layers,
  HeartPulse,
  Tag,
  AlertTriangle
} from 'lucide-react';
import { Account, Trade } from '../../types/domain';
import { AccountService } from '../../services/accountService';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AccountCardProps {
  account: Account;
  trades: Trade[];
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onArchiveToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onViewDetails?: () => void;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  account,
  trades,
  isSelected,
  onSelect,
  onEdit,
  onArchiveToggle,
  onDuplicate,
  onDelete,
  onViewDetails,
}) => {
  const accountTrades = trades.filter(t => t.accountId === account.id);
  const metrics = CalculationEngine.calculateMetrics(accountTrades, account.startingBalance);
  const health = AccountService.evaluateAccountHealth(account, accountTrades);

  const isProp = 
    account.accountType?.startsWith('PROP_') || 
    account.accountType === 'CHALLENGE';

  const netPnL = account.currentBalance - account.startingBalance;
  const pnlPercent = account.startingBalance > 0 ? (netPnL / account.startingBalance) * 100 : 0;

  // Health color styling
  const healthBgMap = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    neutral: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };

  const statusVariantMap: Record<string, 'emerald' | 'amber' | 'rose' | 'neutral' | 'blue'> = {
    ACTIVE: 'emerald',
    INACTIVE: 'neutral',
    PAUSED: 'amber',
    PASSED: 'emerald',
    FAILED: 'rose',
    BREACHED: 'rose',
    ARCHIVED: 'neutral',
  };

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isSelected 
          ? 'border-emerald-500/80 bg-zinc-900/95 shadow-lg shadow-emerald-950/20' 
          : account.isArchived
            ? 'opacity-65 border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
            : 'hover:border-zinc-700 bg-zinc-900/70'
      }`}
      onClick={onSelect}
    >
      {/* Top Active Bar */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 shadow-xs shadow-emerald-400" />
      )}

      <div>
        {/* Header: Title, Group, Badges & Action Controls */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-sm text-white tracking-tight truncate max-w-[180px]" title={account.name}>
                {account.name}
              </h3>
              {isSelected && (
                <Badge variant="emerald" size="sm">ACTIVE DESK</Badge>
              )}
              <Badge variant={statusVariantMap[account.status] || 'neutral'} size="sm">
                {account.status}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mt-1 flex-wrap">
              <span>{account.broker}</span>
              <span>•</span>
              <span>{account.platform}</span>
              {account.group && (
                <>
                  <span>•</span>
                  <span className="text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded text-[10px]">
                    {account.group}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7 text-zinc-400 hover:text-white"
              title="Edit Account"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDuplicate}
              className="h-7 w-7 text-zinc-400 hover:text-white"
              title="Duplicate Account"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onArchiveToggle}
              className="h-7 w-7 text-zinc-400 hover:text-amber-400"
              title={account.isArchived ? 'Restore Account' : 'Archive Account'}
            >
              {account.isArchived ? <RefreshCw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-zinc-400 hover:text-rose-400"
              title="Delete Account"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Primary Financial Metric Balance Box */}
        <div className="grid grid-cols-2 gap-3 py-2.5 px-3 rounded-lg bg-zinc-950/80 border border-zinc-800/80 mb-3">
          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Current Balance</span>
            <span className="text-sm sm:text-base font-bold font-mono text-white">
              {formatCurrency(account.currentBalance, account.currency)}
            </span>
            <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
              Eq: {formatCurrency(account.equity, account.currency)}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-zinc-400 block">Realized Return</span>
            <span className={`text-sm sm:text-base font-bold font-mono ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL, account.currency)}
            </span>
            <span className={`text-[10px] font-mono block mt-0.5 ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {formatPercent(pnlPercent)}
            </span>
          </div>
        </div>

        {/* Health Score Pill Banner */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs mb-3 bg-zinc-950/40 border-zinc-800/70">
          <div className="flex items-center gap-1.5">
            <HeartPulse className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-[11px] text-zinc-300 font-medium">Account Health:</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${healthBgMap[health.color]}`}>
              {health.statusLabel} ({health.score}/100)
            </span>
          </div>

          {account.maxRiskPerTradePercent && (
            <span className="text-[10px] font-mono text-zinc-400">
              Risk: {account.maxRiskPerTradePercent}%/trade
            </span>
          )}
        </div>

        {/* Prop Firm Compliance / Objective Gauges */}
        {isProp && (
          <div className="space-y-2.5 mb-3 pt-2 border-t border-zinc-800/80 text-xs">
            {/* Profit Target Progress */}
            {account.profitTarget && account.profitTarget > 0 ? (
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-zinc-400">Profit Target</span>
                  <span className="text-emerald-400 font-semibold">
                    {health.profitTargetProgressPercent}% ({formatCurrency(health.profitTargetAchievedAmount)} / {formatCurrency(account.profitTarget)})
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, health.profitTargetProgressPercent))}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Max Drawdown Remaining Headroom Buffer */}
            {account.maximumLoss && account.maximumLoss > 0 ? (
              <div>
                <div className="flex justify-between text-[11px] mb-1 font-mono">
                  <span className="text-zinc-400">Drawdown Headroom</span>
                  <span className={health.isNearMaxLoss ? 'text-rose-400 font-bold' : 'text-zinc-200'}>
                    {formatCurrency(health.drawdownBufferAmount)} buffer left
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${health.isNearMaxLoss ? 'bg-rose-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, health.drawdownBufferPercent)}%` }}
                  />
                </div>
              </div>
            ) : null}

            {/* Daily Loss Buffer */}
            {account.dailyLossLimit && account.dailyLossLimit > 0 ? (
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-0.5">
                <span>Daily Limit Headroom:</span>
                <span className={health.isNearDailyLimit ? 'text-amber-400 font-bold' : 'text-zinc-300'}>
                  {formatCurrency(health.dailyLossBufferAmount)} / {formatCurrency(account.dailyLossLimit)}
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* Tags */}
        {account.tags && account.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mb-3">
            {account.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                <Tag className="h-2.5 w-2.5 text-zinc-500" />
                {tag}
              </span>
            ))}
            {account.tags.length > 3 && (
              <span className="text-[10px] text-zinc-500">+{account.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Metrics */}
      <div className="flex items-center justify-between pt-2.5 border-t border-zinc-800/60 text-[11px] text-zinc-400 font-mono mt-1">
        <span>{accountTrades.length} Trades</span>
        <span>Win Rate: <strong className="text-zinc-200">{Number(metrics?.winRate || 0)}%</strong></span>
        <span>PF: <strong className="text-zinc-200">{Number(metrics?.profitFactor || 0).toFixed(2)}</strong></span>
      </div>
    </Card>
  );
};
