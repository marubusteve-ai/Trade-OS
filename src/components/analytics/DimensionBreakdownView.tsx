/**
 * Multi-Dimensional Quantitative Segmentation Analysis View
 * Dissects trading performance across 16 dimensions with interactive drill-down
 */

import React, { useState, useMemo } from 'react';
import { AnalyticsDimension, DimensionBreakdownItem } from '../../types/analytics';
import { Trade, Strategy, Playbook, Setup, Account } from '../../types/domain';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { formatCurrency } from '../../lib/utils';
import { 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  ArrowUpDown, 
  Search, 
  BarChart3,
  Calendar,
  Clock,
  Target,
  Shield,
  Activity,
  Sliders
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface DimensionBreakdownViewProps {
  trades: Trade[];
  currency?: string;
  accounts?: Account[];
  strategies?: Strategy[];
  playbooks?: Playbook[];
  setups?: Setup[];
  onDrillDown: (title: string, trades: Trade[], subtitle?: string) => void;
}

export const DimensionBreakdownView: React.FC<DimensionBreakdownViewProps> = ({
  trades,
  currency = 'USD',
  accounts = [],
  strategies = [],
  playbooks = [],
  setups = [],
  onDrillDown,
}) => {
  const [selectedDimension, setSelectedDimension] = useState<AnalyticsDimension>('STRATEGY');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'PNL' | 'WIN_RATE' | 'TRADES' | 'PROFIT_FACTOR' | 'EXPECTANCY' | 'AVG_R'>('PNL');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');

  const dimensionOptions: { id: AnalyticsDimension; label: string; icon: string }[] = [
    { id: 'STRATEGY', label: 'Strategy', icon: '🎯' },
    { id: 'PLAYBOOK', label: 'Playbook', icon: '📖' },
    { id: 'SETUP', label: 'Setup', icon: '⚡' },
    { id: 'INSTRUMENT', label: 'Instrument / Symbol', icon: '📈' },
    { id: 'ASSET_CLASS', label: 'Asset Class', icon: '💼' },
    { id: 'SESSION', label: 'Market Session', icon: '🌍' },
    { id: 'TIME_OF_DAY', label: 'Time of Day', icon: '⏰' },
    { id: 'DAY_OF_WEEK', label: 'Day of Week', icon: '📅' },
    { id: 'MONTH', label: 'Month of Year', icon: '🗓️' },
    { id: 'TIMEFRAME', label: 'Timeframe', icon: '⏱️' },
    { id: 'MARKET_CONDITION', label: 'Market Condition', icon: '🌊' },
    { id: 'DIRECTION', label: 'Direction (Long / Short)', icon: '↔️' },
    { id: 'RISK_LEVEL', label: 'Risk Sizing Level', icon: '🛡️' },
    { id: 'PSYCHOLOGY', label: 'Emotional State', icon: '🧠' },
    { id: 'MISTAKE_CATEGORY', label: 'Mistake Category', icon: '⚠️' },
    { id: 'ACCOUNT', label: 'Account', icon: '🏦' },
  ];

  const breakdownItems: DimensionBreakdownItem[] = useMemo(() => {
    return AnalyticsEngine.analyzeByDimension(selectedDimension, trades, {
      strategies,
      playbooks,
      setups,
      accounts,
    });
  }, [selectedDimension, trades, strategies, playbooks, setups, accounts]);

  const filteredAndSortedItems = useMemo(() => {
    let result = breakdownItems;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.label.toLowerCase().includes(q));
    }

    return [...result].sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'PNL':
          valA = a.netPnL;
          valB = b.netPnL;
          break;
        case 'WIN_RATE':
          valA = a.winRate;
          valB = b.winRate;
          break;
        case 'TRADES':
          valA = a.tradesCount;
          valB = b.tradesCount;
          break;
        case 'PROFIT_FACTOR':
          valA = a.profitFactor;
          valB = b.profitFactor;
          break;
        case 'EXPECTANCY':
          valA = a.expectancy;
          valB = b.expectancy;
          break;
        case 'AVG_R':
          valA = a.averageR;
          valB = b.averageR;
          break;
      }

      return sortOrder === 'DESC' ? valB - valA : valA - valB;
    });
  }, [breakdownItems, searchQuery, sortBy, sortOrder]);

  const maxAbsPnL = useMemo(() => {
    const pnlList = breakdownItems.map((item) => Math.abs(item.netPnL));
    return Math.max(...pnlList, 100);
  }, [breakdownItems]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dimension Selector Pills */}
      <div className="bg-[#121417] border border-[#22252A] rounded-2xl p-3">
        <div className="text-xs font-semibold text-[#848B98] mb-2 px-1 flex items-center justify-between">
          <span>Select Analytical Dimension (16 Segments):</span>
          <span className="text-[11px] font-mono text-blue-400">
            Current: {dimensionOptions.find((d) => d.id === selectedDimension)?.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {dimensionOptions.map((dim) => {
            const isSelected = selectedDimension === dim.id;
            return (
              <button
                key={dim.id}
                onClick={() => {
                  setSelectedDimension(dim.id);
                  setSearchQuery('');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-semibold'
                    : 'bg-[#181B20] text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#20242B] border border-[#22252A]'
                }`}
              >
                <span>{dim.icon}</span>
                <span>{dim.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Breakdown Data Container */}
      <Card className="bg-[#121417] border border-[#22252A] overflow-hidden">
        {/* Table Controls */}
        <div className="p-3.5 border-b border-[#22252A] bg-[#15171A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#848B98]" />
              <input
                type="text"
                placeholder="Search dimension items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#181B20] border border-[#22252A] text-xs text-[#F3F4F6] rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
              />
            </div>
            <Badge variant="zinc">
              {filteredAndSortedItems.length} {filteredAndSortedItems.length === 1 ? 'Segment' : 'Segments'}
            </Badge>
          </div>

          <div className="text-xs text-[#848B98] font-mono">
            Click any row to drill down into filtered trades
          </div>
        </div>

        {/* Breakdown Items List / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#22252A] bg-[#0E1013] text-[#848B98] font-mono text-[11px]">
                <th className="py-2.5 px-4 font-semibold">SEGMENT</th>
                <th
                  onClick={() => toggleSort('TRADES')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>TRADES</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('WIN_RATE')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>WIN RATE</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('PNL')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>NET P&L</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('PROFIT_FACTOR')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden md:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>PROFIT FACTOR</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('EXPECTANCY')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>EXPECTANCY</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('AVG_R')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:text-white transition-colors hidden lg:table-cell"
                >
                  <div className="flex items-center gap-1">
                    <span>AVG R</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold hidden xl:table-cell">AVG DURATION</th>
                <th className="py-2.5 px-4 font-semibold text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1D22]">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#848B98] text-xs">
                    No trades match the current dimension or search query.
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const isPositive = item.netPnL >= 0;
                  const pnlBarWidth = Math.min(100, Math.max(4, (Math.abs(item.netPnL) / maxAbsPnL) * 100));

                  return (
                    <tr
                      key={item.key}
                      onClick={() =>
                        onDrillDown(
                          `${dimensionOptions.find((d) => d.id === selectedDimension)?.label}: ${item.label}`,
                          item.trades,
                          `${item.tradesCount} trades • Net P&L: ${isPositive ? '+' : ''}${formatCurrency(item.netPnL, currency)} • Win Rate: ${item.winRate}%`
                        )
                      }
                      className="hover:bg-[#181B20] transition-colors cursor-pointer group"
                    >
                      {/* Segment Name & Mini PnL Visual Bar */}
                      <td className="py-3 px-4 font-medium text-white max-w-[200px]">
                        <div className="flex flex-col">
                          <span className="truncate group-hover:text-blue-400 transition-colors font-semibold">
                            {item.label}
                          </span>
                          <div className="w-full bg-[#22252A] h-1.5 rounded-full mt-1.5 overflow-hidden flex">
                            {isPositive ? (
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${pnlBarWidth}%` }}
                              />
                            ) : (
                              <div
                                className="bg-rose-500 h-full rounded-full"
                                style={{ width: `${pnlBarWidth}%` }}
                              />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Trades Count */}
                      <td className="py-3 px-3 font-mono text-[#D1D5DB]">
                        <span className="font-semibold">{item.tradesCount}</span>
                        <span className="text-[10px] text-[#848B98] block">
                          ({item.winCount}W / {item.lossCount}L)
                        </span>
                      </td>

                      {/* Win Rate */}
                      <td className="py-3 px-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold ${
                              item.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.winRate}%
                          </span>
                        </div>
                      </td>

                      {/* Net P&L */}
                      <td className="py-3 px-3 font-mono font-bold">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? '+' : ''}
                          {formatCurrency(item.netPnL, currency)}
                        </span>
                      </td>

                      {/* Profit Factor */}
                      <td className="py-3 px-3 font-mono hidden md:table-cell">
                        <span
                          className={`font-semibold ${
                            item.profitFactor >= 1.5
                              ? 'text-emerald-400'
                              : item.profitFactor >= 1.0
                              ? 'text-blue-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {item.profitFactor}
                        </span>
                      </td>

                      {/* Expectancy */}
                      <td className="py-3 px-3 font-mono hidden lg:table-cell">
                        <span className={item.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.expectancy >= 0 ? '+' : ''}
                          {formatCurrency(item.expectancy, currency)}
                        </span>
                      </td>

                      {/* Avg R */}
                      <td className="py-3 px-3 font-mono hidden lg:table-cell text-purple-400 font-semibold">
                        {item.averageR > 0 ? `+${item.averageR}R` : `${item.averageR}R`}
                      </td>

                      {/* Avg Duration */}
                      <td className="py-3 px-3 font-mono text-[#848B98] hidden xl:table-cell">
                        {item.avgDurationMinutes} mins
                      </td>

                      {/* Action Drill Down */}
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 group-hover:underline font-semibold">
                          <span>Inspect</span>
                          <ExternalLink className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
