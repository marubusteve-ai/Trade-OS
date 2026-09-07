import React from 'react';
import { Account, Strategy, Playbook, Trade } from '../../types/domain';
import { DashboardFilterState } from '../../types/calculations';
import { 
  X, 
  RotateCcw, 
  Filter, 
  Layers, 
  BookOpen, 
  TrendingUp, 
  Clock, 
  Wallet 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface DashboardFilterBarProps {
  isOpen: boolean;
  filters: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  accounts: Account[];
  strategies: Strategy[];
  playbooks?: Playbook[];
  trades: Trade[];
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  isOpen,
  filters,
  onFilterChange,
  onResetFilters,
  accounts,
  strategies,
  playbooks = [],
  trades,
}) => {
  if (!isOpen) return null;

  // Extract unique instruments from all trades
  const uniqueInstruments = Array.from(new Set(trades.map(t => t.instrument).filter(Boolean))).sort();

  // Sessions list
  const sessions = ['NEW_YORK', 'LONDON', 'ASIA', 'TOKYO', 'SYDNEY', 'OFF_HOURS'];

  const hasActiveFilters = 
    filters.accountId !== 'ALL' ||
    filters.strategyId !== 'ALL' ||
    filters.playbookId !== 'ALL' ||
    filters.instrument !== 'ALL' ||
    filters.session !== 'ALL';

  return (
    <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-4 animate-in slide-in-from-top-2 duration-150 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Multi-Dimensional Trade Filters
          </span>
          <span className="text-xs text-[#848B98]">
            (Synchronized across all widgets, charts, and metrics)
          </span>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-7"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Filters
          </Button>
        )}
      </div>

      {/* Filter Select Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* 1. Account Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#848B98] flex items-center gap-1">
            <Wallet className="h-3 w-3" /> Account
          </label>
          <select
            value={filters.accountId}
            onChange={(e) => onFilterChange({ accountId: e.target.value })}
            className="w-full bg-[#0C0D0F] border border-[#22252A] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Accounts (Consolidated)</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Strategy Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#848B98] flex items-center gap-1">
            <Layers className="h-3 w-3" /> Strategy
          </label>
          <select
            value={filters.strategyId}
            onChange={(e) => onFilterChange({ strategyId: e.target.value })}
            className="w-full bg-[#0C0D0F] border border-[#22252A] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Strategies</option>
            {strategies.map(strat => (
              <option key={strat.id} value={strat.id}>
                {strat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Playbook Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#848B98] flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Playbook
          </label>
          <select
            value={filters.playbookId}
            onChange={(e) => onFilterChange({ playbookId: e.target.value })}
            className="w-full bg-[#0C0D0F] border border-[#22252A] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Playbooks</option>
            {playbooks.map(pb => (
              <option key={pb.id} value={pb.id}>
                {pb.title}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Instrument Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#848B98] flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Instrument
          </label>
          <select
            value={filters.instrument}
            onChange={(e) => onFilterChange({ instrument: e.target.value })}
            className="w-full bg-[#0C0D0F] border border-[#22252A] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Instruments</option>
            {uniqueInstruments.map(inst => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Session Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#848B98] flex items-center gap-1">
            <Clock className="h-3 w-3" /> Session
          </label>
          <select
            value={filters.session}
            onChange={(e) => onFilterChange({ session: e.target.value })}
            className="w-full bg-[#0C0D0F] border border-[#22252A] rounded-lg px-2.5 py-1.5 text-white font-medium text-xs focus:border-blue-500 focus:outline-hidden"
          >
            <option value="ALL">All Sessions</option>
            {sessions.map(s => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Pills Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#22252A]">
          <span className="text-[11px] text-[#848B98] font-medium">Active:</span>

          {filters.accountId !== 'ALL' && (
            <Badge variant="blue" className="flex items-center gap-1 text-[10px]">
              Account: {accounts.find(a => a.id === filters.accountId)?.name || filters.accountId}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange({ accountId: 'ALL' })} />
            </Badge>
          )}

          {filters.strategyId !== 'ALL' && (
            <Badge variant="purple" className="flex items-center gap-1 text-[10px]">
              Strategy: {strategies.find(s => s.id === filters.strategyId)?.name || filters.strategyId}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange({ strategyId: 'ALL' })} />
            </Badge>
          )}

          {filters.playbookId !== 'ALL' && (
            <Badge variant="zinc" className="flex items-center gap-1 text-[10px]">
              Playbook: {playbooks.find(p => p.id === filters.playbookId)?.title || filters.playbookId}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange({ playbookId: 'ALL' })} />
            </Badge>
          )}

          {filters.instrument !== 'ALL' && (
            <Badge variant="emerald" className="flex items-center gap-1 text-[10px]">
              Symbol: {filters.instrument}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange({ instrument: 'ALL' })} />
            </Badge>
          )}

          {filters.session !== 'ALL' && (
            <Badge variant="amber" className="flex items-center gap-1 text-[10px]">
              Session: {filters.session.replace('_', ' ')}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFilterChange({ session: 'ALL' })} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
