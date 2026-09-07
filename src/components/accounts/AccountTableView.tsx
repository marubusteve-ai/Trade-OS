import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  CheckCircle2, 
  ShieldAlert, 
  Edit, 
  Trash2, 
  Archive, 
  RefreshCw, 
  Copy, 
  HeartPulse,
  Tag
} from 'lucide-react';
import { Account, Trade } from '../../types/domain';
import { AccountService } from '../../services/accountService';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AccountTableViewProps {
  accounts: Account[];
  trades: Trade[];
  selectedAccountId: string | 'ALL';
  onSelect: (id: string) => void;
  onEdit: (account: Account) => void;
  onArchiveToggle: (account: Account) => void;
  onDuplicate: (account: Account) => void;
  onDelete: (account: Account) => void;
}

type SortField = 'name' | 'type' | 'balance' | 'netPnL' | 'health' | 'status';

export const AccountTableView: React.FC<AccountTableViewProps> = ({
  accounts,
  trades,
  selectedAccountId,
  onSelect,
  onEdit,
  onArchiveToggle,
  onDuplicate,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    let comp = 0;
    if (sortField === 'name') comp = a.name.localeCompare(b.name);
    else if (sortField === 'type') comp = a.accountType.localeCompare(b.accountType);
    else if (sortField === 'balance') comp = a.currentBalance - b.currentBalance;
    else if (sortField === 'netPnL') {
      const pnlA = a.currentBalance - a.startingBalance;
      const pnlB = b.currentBalance - b.startingBalance;
      comp = pnlA - pnlB;
    } else if (sortField === 'status') comp = a.status.localeCompare(b.status);
    else if (sortField === 'health') {
      const hA = AccountService.evaluateAccountHealth(a, trades.filter(t => t.accountId === a.id)).score;
      const hB = AccountService.evaluateAccountHealth(b, trades.filter(t => t.accountId === b.id)).score;
      comp = hA - hB;
    }
    return sortAsc ? comp : -comp;
  });

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
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-md">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
            <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
              <div className="flex items-center gap-1.5">
                <span>Account & Desk</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('type')}>
              <div className="flex items-center gap-1.5">
                <span>Type / Broker</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
              <div className="flex items-center gap-1.5">
                <span>Status</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => handleSort('health')}>
              <div className="flex items-center gap-1.5">
                <span>Health Score</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('balance')}>
              <div className="flex items-center justify-end gap-1.5">
                <span>Balance / Equity</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 cursor-pointer hover:text-white text-right" onClick={() => handleSort('netPnL')}>
              <div className="flex items-center justify-end gap-1.5">
                <span>Net Return</span>
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </th>
            <th className="py-3 px-3 text-right">Drawdown Buffer</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 font-mono">
          {sortedAccounts.map(account => {
            const isSelected = selectedAccountId === account.id;
            const accTrades = trades.filter(t => t.accountId === account.id);
            const health = AccountService.evaluateAccountHealth(account, accTrades);
            const netPnL = account.currentBalance - account.startingBalance;
            const pnlPercent = account.startingBalance > 0 ? (netPnL / account.startingBalance) * 100 : 0;

            return (
              <tr 
                key={account.id}
                onClick={() => onSelect(account.id)}
                className={`transition-colors cursor-pointer hover:bg-zinc-800/40 ${
                  isSelected ? 'bg-emerald-950/20 border-l-2 border-l-emerald-500' : ''
                } ${account.isArchived ? 'opacity-60 bg-zinc-950/40' : ''}`}
              >
                {/* Name & Desk */}
                <td className="py-3 px-4 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tracking-tight">{account.name}</span>
                    {isSelected && (
                      <Badge variant="emerald" size="sm">ACTIVE</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono mt-0.5">
                    {account.accountNumber ? `${account.accountNumber} • ` : ''}
                    <span>{account.platform}</span>
                    {account.group && (
                      <span className="text-zinc-300 bg-zinc-800 px-1 py-0.2 rounded text-[10px]">
                        {account.group}
                      </span>
                    )}
                  </div>
                </td>

                {/* Type & Broker */}
                <td className="py-3 px-3 font-sans">
                  <div className="text-zinc-200 font-medium text-xs">{account.accountType}</div>
                  <div className="text-[11px] text-zinc-400 font-mono">{account.propFirm || account.broker}</div>
                </td>

                {/* Status */}
                <td className="py-3 px-3 font-sans">
                  <Badge variant={statusVariantMap[account.status] || 'neutral'} size="sm">
                    {account.status}
                  </Badge>
                </td>

                {/* Health Score */}
                <td className="py-3 px-3 font-sans">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border inline-flex items-center gap-1 ${healthBgMap[health.color]}`}>
                    <HeartPulse className="h-3 w-3" />
                    {health.statusLabel} ({health.score})
                  </span>
                </td>

                {/* Balance & Equity */}
                <td className="py-3 px-3 text-right">
                  <div className="text-white font-bold">{formatCurrency(account.currentBalance, account.currency)}</div>
                  <div className="text-[10px] text-zinc-400">Eq: {formatCurrency(account.equity, account.currency)}</div>
                </td>

                {/* Net Return */}
                <td className="py-3 px-3 text-right">
                  <div className={`font-bold ${netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netPnL >= 0 ? '+' : ''}{formatCurrency(netPnL, account.currency)}
                  </div>
                  <div className={`text-[10px] ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatPercent(pnlPercent)}
                  </div>
                </td>

                {/* Drawdown Buffer Headroom */}
                <td className="py-3 px-3 text-right">
                  {account.maximumLoss ? (
                    <div>
                      <div className={`text-xs font-semibold ${health.isNearMaxLoss ? 'text-rose-400' : 'text-zinc-200'}`}>
                        {formatCurrency(health.drawdownBufferAmount)}
                      </div>
                      <div className="text-[10px] text-zinc-400">
                        {health.drawdownBufferPercent.toFixed(1)}% buffer left
                      </div>
                    </div>
                  ) : (
                    <span className="text-zinc-500 text-[11px] font-sans">Unconstrained</span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-center font-sans" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(account)}
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                      title="Edit Account"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDuplicate(account)}
                      className="h-7 w-7 text-zinc-400 hover:text-white"
                      title="Duplicate Account"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onArchiveToggle(account)}
                      className="h-7 w-7 text-zinc-400 hover:text-amber-400"
                      title={account.isArchived ? 'Restore' : 'Archive'}
                    >
                      {account.isArchived ? <RefreshCw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(account)}
                      className="h-7 w-7 text-zinc-400 hover:text-rose-400"
                      title="Delete Account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
