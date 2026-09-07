import React, { useState } from 'react';
import { Account } from '../../types/domain';
import { DashboardFilterState, DashboardPeriod, FinancialMetrics } from '../../types/calculations';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { 
  Wallet, 
  Calendar, 
  Filter, 
  Sliders, 
  Plus, 
  TrendingUp, 
  RotateCcw,
  Check,
  LayoutDashboard,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useCustomization } from '../../context/CustomizationContext';
import { SavedFiltersDropdown } from './customization/SavedFiltersDropdown';

interface DashboardHeaderProps {
  selectedAccountId: string | 'ALL';
  selectedAccount: Account | null;
  accounts: Account[];
  metrics: FinancialMetrics;
  currentBalance: number;
  startingBalance: number;
  filters: DashboardFilterState;
  onFilterChange: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  isFilterBarOpen: boolean;
  onToggleFilterBar: () => void;
  onOpenWidgetConfig: () => void;
  onOpenNewTradeModal: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  selectedAccountId,
  selectedAccount,
  accounts,
  metrics,
  currentBalance,
  startingBalance,
  filters,
  onFilterChange,
  onResetFilters,
  activeFilterCount,
  isFilterBarOpen,
  onToggleFilterBar,
  onOpenWidgetConfig,
  onOpenNewTradeModal,
}) => {
  const { 
    workspaces, 
    activeWorkspace, 
    switchWorkspace, 
    openWorkspaceModal 
  } = useCustomization();

  const [showCustomDate, setShowCustomDate] = useState<boolean>(filters.period === 'CUSTOM');
  const [isWsDropdownOpen, setIsWsDropdownOpen] = useState<boolean>(false);
  const isNetPositive = metrics.netPnL >= 0;

  const periods: { key: DashboardPeriod; label: string }[] = [
    { key: 'DAILY', label: 'Daily' },
    { key: 'WEEKLY', label: 'Weekly' },
    { key: 'MONTHLY', label: 'Monthly' },
    { key: 'QUARTERLY', label: 'Quarterly' },
    { key: 'YEARLY', label: 'Yearly' },
    { key: 'LIFETIME', label: 'Lifetime' },
    { key: 'CUSTOM', label: 'Custom' },
  ];

  const handlePeriodClick = (p: DashboardPeriod) => {
    if (p === 'CUSTOM') {
      setShowCustomDate(true);
      onFilterChange({ period: 'CUSTOM' });
    } else {
      setShowCustomDate(false);
      onFilterChange({ period: p, customStartDate: undefined, customEndDate: undefined });
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-[#15171A] border border-[#22252A] shadow-xs">
        {/* Account Info & Workspace Switcher */}
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-white tracking-tight">
                {selectedAccountId === 'ALL' ? 'Consolidated Multi-Account Desk' : selectedAccount?.name || 'Trading Desk'}
              </h1>
              {selectedAccount && selectedAccount.accountType && (
                <Badge variant={selectedAccount.accountType.startsWith('PROP') ? 'amber' : 'blue'}>
                  {selectedAccount.accountType.replace('_', ' ')}
                </Badge>
              )}

              {/* Workspace Selector Pill */}
              <div className="relative">
                <button
                  onClick={() => setIsWsDropdownOpen(!isWsDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1F2228] border border-[#2E333C] text-xs font-medium text-emerald-400 hover:bg-[#282C34] transition-all"
                  title="Switch Dashboard Workspace"
                >
                  <LayoutDashboard className="w-3 h-3" />
                  <span>{activeWorkspace.name}</span>
                  <ChevronDown className="w-3 h-3 text-[#848B98]" />
                </button>

                {isWsDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsWsDropdownOpen(false)} />
                    <div className="absolute left-0 mt-1.5 w-64 bg-[#15171A] border border-[#2B303B] rounded-lg shadow-2xl z-50 p-2 space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#848B98] border-b border-[#22252A] flex items-center justify-between">
                        <span>Workspaces</span>
                        <span className="text-emerald-400">{workspaces.length} Available</span>
                      </div>
                      {workspaces.map((ws) => (
                        <div
                          key={ws.id}
                          onClick={() => {
                            switchWorkspace(ws.id);
                            setIsWsDropdownOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            ws.id === activeWorkspace.id
                              ? 'bg-emerald-500/10 text-emerald-300 font-semibold'
                              : 'text-zinc-300 hover:bg-[#1E2128]'
                          }`}
                        >
                          <span className="truncate">{ws.name}</span>
                          {ws.id === activeWorkspace.id && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                      ))}
                      <div className="pt-1.5 border-t border-[#22252A]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsWsDropdownOpen(false);
                            openWorkspaceModal();
                          }}
                          className="w-full text-xs justify-center text-emerald-400 hover:text-white hover:bg-[#1E2128]"
                        >
                          <Sliders className="w-3.5 h-3.5 mr-1.5" />
                          Manage Workspaces
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-[#848B98] mt-0.5">
              {selectedAccount 
                ? `${selectedAccount.broker} • ${selectedAccount.platform} • ${selectedAccount.currency}` 
                : `Aggregating ${accounts.length} active trading books in real-time`}
            </p>
          </div>
        </div>

        {/* Quick Capital & Return Summary */}
        <div className="flex flex-wrap items-center gap-6 border-t lg:border-t-0 lg:border-l border-[#22252A] pt-3 lg:pt-0 lg:pl-6">
          <div>
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Account Balance</span>
            <span className="text-xl font-bold font-mono text-white">
              {formatCurrency(currentBalance, selectedAccount?.currency || 'USD')}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-semibold text-[#848B98] block">Filtered Net P&L</span>
            <span className={`text-xl font-bold font-mono flex items-center gap-1 ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isNetPositive ? '+' : ''}{formatCurrency(metrics.netPnL, selectedAccount?.currency || 'USD')}
              <span className="text-xs font-normal">({formatPercent(metrics.netReturnPercent)})</span>
            </span>
          </div>

          {/* Quick Action Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenNewTradeModal}
            className="text-xs font-semibold shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Log Trade
          </Button>
        </div>
      </div>

      {/* Period Selection & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-2.5 rounded-xl bg-[#121417] border border-[#22252A]">
        {/* Period Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          {periods.map(p => {
            const isActive = filters.period === p.key;
            return (
              <button
                key={p.key}
                onClick={() => handlePeriodClick(p.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#1A1D22]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Action Buttons: Filter Toggle & Layout Customizer */}
        <div className="flex items-center gap-2 shrink-0">
          <SavedFiltersDropdown
            currentFilters={filters}
            onApplyFilter={(applied) => onFilterChange(applied)}
          />

          <Button
            variant={isFilterBarOpen || activeFilterCount > 0 ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleFilterBar}
            className="text-xs text-[#D1D5DB] hover:text-white"
          >
            <Filter className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWidgetConfig}
            className="text-xs text-[#D1D5DB] hover:text-white"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
            Customize Layout
          </Button>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-[#848B98] hover:text-white"
              title="Reset all filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker Bar (if CUSTOM period selected) */}
      {showCustomDate && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#15171A] border border-[#22252A] animate-in fade-in duration-100 text-xs">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-400" />
            Custom Date Range:
          </span>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#848B98]">From:</label>
            <input
              type="date"
              value={filters.customStartDate || ''}
              onChange={(e) => onFilterChange({ customStartDate: e.target.value })}
              className="bg-[#0C0D0F] border border-[#22252A] rounded px-2.5 py-1 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[11px] text-[#848B98]">To:</label>
            <input
              type="date"
              value={filters.customEndDate || ''}
              onChange={(e) => onFilterChange({ customEndDate: e.target.value })}
              className="bg-[#0C0D0F] border border-[#22252A] rounded px-2.5 py-1 text-white text-xs font-mono focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {(filters.customStartDate || filters.customEndDate) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFilterChange({ customStartDate: undefined, customEndDate: undefined })}
              className="text-[11px] text-[#848B98] hover:text-white h-7"
            >
              Clear Range
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
