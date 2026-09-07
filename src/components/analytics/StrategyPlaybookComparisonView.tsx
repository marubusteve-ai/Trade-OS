/**
 * Strategy & Playbook Comparative Analysis View
 * Multi-Strategy & Multi-Playbook Head-to-Head Performance Ranking
 */

import React, { useState, useMemo } from 'react';
import { Strategy, Playbook, Trade } from '../../types/domain';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { StrategyComparisonItem, PlaybookComparisonItem } from '../../types/analytics';
import { formatCurrency } from '../../lib/utils';
import { 
  Target, 
  BookOpen, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ExternalLink, 
  Award, 
  ShieldAlert,
  ArrowUpDown,
  Search
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface StrategyPlaybookComparisonViewProps {
  strategies: Strategy[];
  playbooks: Playbook[];
  trades: Trade[];
  currency?: string;
  onDrillDown: (title: string, trades: Trade[], subtitle?: string) => void;
}

export const StrategyPlaybookComparisonView: React.FC<StrategyPlaybookComparisonViewProps> = ({
  strategies,
  playbooks,
  trades,
  currency = 'USD',
  onDrillDown,
}) => {
  const [viewType, setViewType] = useState<'STRATEGY' | 'PLAYBOOK'>('STRATEGY');
  const [searchQuery, setSearchQuery] = useState('');

  const strategyComparisons: StrategyComparisonItem[] = useMemo(() => {
    return AnalyticsEngine.compareStrategies(strategies, trades);
  }, [strategies, trades]);

  const playbookComparisons: PlaybookComparisonItem[] = useMemo(() => {
    return AnalyticsEngine.comparePlaybooks(playbooks, trades);
  }, [playbooks, trades]);

  const isStrategyView = viewType === 'STRATEGY';

  const filteredStrategies = useMemo(() => {
    if (!searchQuery.trim()) return strategyComparisons;
    return strategyComparisons.filter((s) => s.strategyName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [strategyComparisons, searchQuery]);

  const filteredPlaybooks = useMemo(() => {
    if (!searchQuery.trim()) return playbookComparisons;
    return playbookComparisons.filter((p) => p.playbookTitle.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [playbookComparisons, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Award className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Systematic Edge Comparison</h3>
              <p className="text-[11px] text-[#848B98]">
                Compare profitability, expectancy, and risk-adjusted efficiency across playbooks and strategies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#181B20] p-1 rounded-xl border border-[#22252A]">
              <button
                onClick={() => { setViewType('STRATEGY'); setSearchQuery(''); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  isStrategyView ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Strategies ({strategies.length})
              </button>
              <button
                onClick={() => { setViewType('PLAYBOOK'); setSearchQuery(''); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  !isStrategyView ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Playbooks ({playbooks.length})
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="bg-[#121417] border border-[#22252A] overflow-hidden">
        <div className="p-3.5 border-b border-[#22252A] bg-[#15171A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#848B98]" />
            <input
              type="text"
              placeholder={`Search ${isStrategyView ? 'strategies' : 'playbooks'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#181B20] border border-[#22252A] text-xs text-[#F3F4F6] rounded-xl px-3 py-1.5 focus:outline-none focus:border-blue-500 w-52"
            />
          </div>

          <span className="text-xs text-[#848B98] font-mono">
            Click any row to drill down into strategy trades
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#22252A] bg-[#0E1013] text-[#848B98] text-[11px]">
                <th className="py-2.5 px-4 font-semibold">{isStrategyView ? 'STRATEGY' : 'PLAYBOOK'}</th>
                <th className="py-2.5 px-3 font-semibold">TRADES</th>
                <th className="py-2.5 px-3 font-semibold">WIN RATE</th>
                <th className="py-2.5 px-3 font-semibold">NET P&L</th>
                <th className="py-2.5 px-3 font-semibold">PROFIT FACTOR</th>
                <th className="py-2.5 px-3 font-semibold">EXPECTANCY</th>
                <th className="py-2.5 px-3 font-semibold">SHARPE</th>
                <th className="py-2.5 px-3 font-semibold">MAX DD (%)</th>
                <th className="py-2.5 px-3 font-semibold">RECOVERY</th>
                <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1D22]">
              {isStrategyView ? (
                filteredStrategies.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#848B98] text-xs">
                      No strategy data found.
                    </td>
                  </tr>
                ) : (
                  filteredStrategies.map((s) => {
                    const isPositive = s.netPnL >= 0;
                    return (
                      <tr
                        key={s.strategyId}
                        onClick={() =>
                          onDrillDown(
                            `Strategy: ${s.strategyName}`,
                            s.trades,
                            `${s.tradesCount} trades • Net P&L: ${isPositive ? '+' : ''}${formatCurrency(s.netPnL, currency)} • Win Rate: ${s.winRate}%`
                          )
                        }
                        className="hover:bg-[#181B20] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-white font-sans">
                          <span className="group-hover:text-blue-400 transition-colors">
                            {s.strategyName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[#D1D5DB]">
                          {s.tradesCount}
                          <span className="text-[10px] text-[#848B98] block">
                            ({s.metrics.winningTradesCount}W/{s.metrics.losingTradesCount}L)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${s.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {s.winRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? '+' : ''}{formatCurrency(s.netPnL, currency)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white font-semibold">
                          {s.profitFactor}
                        </td>
                        <td className="py-3 px-3">
                          <span className={s.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {s.expectancy >= 0 ? '+' : ''}{formatCurrency(s.expectancy, currency)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-purple-400 font-semibold">
                          {s.sharpeRatio.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-rose-400">
                          -{s.maxDrawdownPercent}%
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          {s.recoveryFactor}x
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 group-hover:underline font-semibold">
                            <span>Drill Down</span>
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                filteredPlaybooks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#848B98] text-xs">
                      No playbook data found.
                    </td>
                  </tr>
                ) : (
                  filteredPlaybooks.map((p) => {
                    const isPositive = p.netPnL >= 0;
                    return (
                      <tr
                        key={p.playbookId}
                        onClick={() =>
                          onDrillDown(
                            `Playbook: ${p.playbookTitle}`,
                            p.trades,
                            `${p.tradesCount} trades • Net P&L: ${isPositive ? '+' : ''}${formatCurrency(p.netPnL, currency)} • Win Rate: ${p.winRate}%`
                          )
                        }
                        className="hover:bg-[#181B20] transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-white font-sans">
                          <span className="group-hover:text-blue-400 transition-colors block">
                            {p.playbookTitle}
                          </span>
                          {p.strategyName && (
                            <span className="text-[10px] text-[#848B98] font-mono">
                              Strategy: {p.strategyName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-[#D1D5DB]">
                          {p.tradesCount}
                          <span className="text-[10px] text-[#848B98] block">
                            ({p.metrics.winningTradesCount}W/{p.metrics.losingTradesCount}L)
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`font-bold ${p.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {p.winRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? '+' : ''}{formatCurrency(p.netPnL, currency)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-white font-semibold">
                          {p.profitFactor}
                        </td>
                        <td className="py-3 px-3">
                          <span className={p.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                            {p.expectancy >= 0 ? '+' : ''}{formatCurrency(p.expectancy, currency)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-purple-400 font-semibold">
                          {p.sharpeRatio.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-rose-400">
                          -{p.maxDrawdownPercent}%
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-semibold">
                          {p.recoveryFactor}x
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 group-hover:underline font-semibold">
                            <span>Drill Down</span>
                            <ExternalLink className="h-3 w-3" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
