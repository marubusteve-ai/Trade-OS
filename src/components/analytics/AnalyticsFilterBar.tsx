/**
 * Multi-Dimensional Analytics Filter Toolbar
 */

import React from 'react';
import { AnalyticsFilterState } from '../../types/analytics';
import { Account, Strategy, Playbook, Setup, AssetClass, MarketSession, MarketCondition, TradeDirection } from '../../types/domain';
import { Filter, RotateCcw, Calendar, ChevronDown, Check } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface AnalyticsFilterBarProps {
  filters: AnalyticsFilterState;
  onFilterChange: (filters: AnalyticsFilterState) => void;
  onResetFilters: () => void;
  accounts: Account[];
  strategies: Strategy[];
  playbooks: Playbook[];
  setups: Setup[];
  instruments: string[];
  totalTradesCount: number;
  filteredTradesCount: number;
}

export const AnalyticsFilterBar: React.FC<AnalyticsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  accounts,
  strategies,
  playbooks,
  setups,
  instruments,
  totalTradesCount,
  filteredTradesCount,
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const activeFiltersCount = Object.entries(filters).filter(([key, val]) => {
    if (key === 'startDate' || key === 'endDate') return Boolean(val);
    return val !== 'ALL';
  }).length;

  const updateField = (field: keyof AnalyticsFilterState, value: any) => {
    onFilterChange({
      ...filters,
      [field]: value,
    });
  };

  const assetClasses: AssetClass[] = ['FOREX', 'CRYPTO', 'INDICES', 'COMMODITIES', 'EQUITIES', 'FUTURES', 'OPTIONS'];
  const sessions: MarketSession[] = ['SYDNEY', 'TOKYO', 'LONDON', 'NEW_YORK', 'LONDON_NY_OVERLAP', 'OFF_HOURS'];
  const conditions: MarketCondition[] = ['TRENDING_UP', 'TRENDING_DOWN', 'RANGING', 'EXPANSION', 'COMPRESSION', 'HIGH_VOLATILITY', 'LOW_VOLATILITY'];
  const emotions = ['CALM', 'FOCUSED', 'CONFIDENT', 'EAGER', 'ANXIOUS', 'FOMO', 'REVENGE', 'FATIGUED'];
  const commonMistakes = [
    'Early Exit',
    'Chased Entry',
    'Overleveraged',
    'Moved Stop Loss',
    'Revenge Trade',
    'Ignored Rules',
    'Hesitation',
    'Late Exit',
    'No Stop Loss',
  ];

  return (
    <div className="bg-[#121417] border border-[#22252A] rounded-2xl p-4 space-y-3.5 shadow-sm">
      {/* Top Bar: Primary Filters & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#848B98]">
            <Filter className="h-3.5 w-3.5 text-blue-400" />
            <span>Filters:</span>
          </div>

          {/* Account Selector */}
          <select
            value={filters.accountId}
            onChange={(e) => updateField('accountId', e.target.value)}
            className="bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 hover:border-[#323742] transition-colors cursor-pointer"
          >
            <option value="ALL">All Accounts ({accounts.length})</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.broker || a.platform})
              </option>
            ))}
          </select>

          {/* Strategy Selector */}
          <select
            value={filters.strategyId}
            onChange={(e) => updateField('strategyId', e.target.value)}
            className="bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 hover:border-[#323742] transition-colors cursor-pointer"
          >
            <option value="ALL">All Strategies ({strategies.length})</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Direction */}
          <select
            value={filters.direction}
            onChange={(e) => updateField('direction', e.target.value as any)}
            className="bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 hover:border-[#323742] transition-colors cursor-pointer"
          >
            <option value="ALL">All Directions</option>
            <option value="LONG">Long (Buy)</option>
            <option value="SHORT">Short (Sell)</option>
          </select>

          {/* Instrument */}
          <select
            value={filters.instrument}
            onChange={(e) => updateField('instrument', e.target.value)}
            className="bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 hover:border-[#323742] transition-colors cursor-pointer"
          >
            <option value="ALL">All Instruments</option>
            {instruments.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>

          {/* Advanced Filters Button */}
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
              isAdvancedOpen || activeFiltersCount > 0
                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                : 'bg-[#181B20] border-[#22252A] text-[#848B98] hover:text-[#F3F4F6]'
            }`}
          >
            <span>Advanced Filters</span>
            {activeFiltersCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right side: trade count & reset */}
        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-[#848B98]">
            Analyzing <span className="font-bold text-white">{filteredTradesCount}</span> of {totalTradesCount} trades
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Advanced Multi-Dimensional Filter Bar */}
      {isAdvancedOpen && (
        <div className="pt-3 border-t border-[#22252A] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
          {/* Playbook */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Playbook</label>
            <select
              value={filters.playbookId}
              onChange={(e) => updateField('playbookId', e.target.value)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Playbooks ({playbooks.length})</option>
              {playbooks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Setup */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Setup</label>
            <select
              value={filters.setupId}
              onChange={(e) => updateField('setupId', e.target.value)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Setups ({setups.length})</option>
              {setups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Asset Class */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Asset Class</label>
            <select
              value={filters.assetClass}
              onChange={(e) => updateField('assetClass', e.target.value as any)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Asset Classes</option>
              {assetClasses.map((ac) => (
                <option key={ac} value={ac}>
                  {ac}
                </option>
              ))}
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Market Session</label>
            <select
              value={filters.session}
              onChange={(e) => updateField('session', e.target.value as any)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Sessions</option>
              {sessions.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Timeframe</label>
            <select
              value={filters.timeframe}
              onChange={(e) => updateField('timeframe', e.target.value)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Timeframes</option>
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="D">Daily</option>
            </select>
          </div>

          {/* Market Condition */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Market Condition</label>
            <select
              value={filters.marketCondition}
              onChange={(e) => updateField('marketCondition', e.target.value as any)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Conditions</option>
              {conditions.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Level */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Risk Level</label>
            <select
              value={filters.riskLevel}
              onChange={(e) => updateField('riskLevel', e.target.value as any)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Conservative (≤ 1%)</option>
              <option value="MEDIUM">Standard (1% - 2%)</option>
              <option value="HIGH">Aggressive (&gt; 2%)</option>
            </select>
          </div>

          {/* Psychology / Emotion */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Emotional State</label>
            <select
              value={filters.psychologyEmotion}
              onChange={(e) => updateField('psychologyEmotion', e.target.value)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Emotions</option>
              {emotions.map((em) => (
                <option key={em} value={em}>
                  {em}
                </option>
              ))}
            </select>
          </div>

          {/* Mistake Category */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Mistake Category</label>
            <select
              value={filters.mistakeCategory}
              onChange={(e) => updateField('mistakeCategory', e.target.value)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Mistakes</option>
              {commonMistakes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => updateField('startDate', e.target.value || undefined)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[11px] font-semibold text-[#848B98] block mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => updateField('endDate', e.target.value || undefined)}
              className="w-full bg-[#181B20] border border-[#22252A] text-xs font-medium text-[#F3F4F6] rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
};
