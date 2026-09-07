/**
 * Comprehensive Winning vs. Losing Trades Comparative Analysis
 * Detailed Execution, Excursion, Efficiency, and Holding Duration Breakdown
 */

import React from 'react';
import { AdvancedPerformanceMetrics, WinLossDetailedStats } from '../../types/analytics';
import { Trade } from '../../types/domain';
import { formatCurrency } from '../../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Crosshair, 
  Gauge, 
  DollarSign, 
  ExternalLink,
  Award,
  ShieldAlert
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface WinLossComparisonViewProps {
  metrics: AdvancedPerformanceMetrics;
  trades: Trade[];
  currency?: string;
  onDrillDown: (title: string, trades: Trade[], subtitle?: string) => void;
}

export const WinLossComparisonView: React.FC<WinLossComparisonViewProps> = ({
  metrics,
  trades,
  currency = 'USD',
  onDrillDown,
}) => {
  const winStats = metrics.winningStats;
  const lossStats = metrics.losingStats;

  const winTrades = trades.filter((t) => (t.netPnL || 0) > 0.001);
  const lossTrades = trades.filter((t) => (t.netPnL || 0) < -0.001);

  const comparisonRows: {
    label: string;
    winVal: string | number;
    lossVal: string | number;
    winNum: number;
    lossNum: number;
    unit?: string;
    isHigherBetter?: boolean;
    description: string;
  }[] = [
    {
      label: 'Trades Count',
      winVal: winStats.tradesCount,
      lossVal: lossStats.tradesCount,
      winNum: winStats.tradesCount,
      lossNum: lossStats.tradesCount,
      unit: 'trades',
      isHigherBetter: true,
      description: 'Total number of decisive trades in segment',
    },
    {
      label: 'Total Realized P&L',
      winVal: `+${formatCurrency(winStats.totalPnL, currency)}`,
      lossVal: `-${formatCurrency(lossStats.totalPnL, currency)}`,
      winNum: winStats.totalPnL,
      lossNum: lossStats.totalPnL,
      isHigherBetter: true,
      description: 'Gross cumulative profit or loss generated',
    },
    {
      label: 'Average P&L per Trade',
      winVal: `+${formatCurrency(winStats.avgPnL, currency)}`,
      lossVal: `-${formatCurrency(lossStats.avgPnL, currency)}`,
      winNum: winStats.avgPnL,
      lossNum: lossStats.avgPnL,
      isHigherBetter: true,
      description: 'Mean dollar return per executed position',
    },
    {
      label: 'Largest Single Trade',
      winVal: `+${formatCurrency(winStats.largestPnL, currency)}`,
      lossVal: `-${formatCurrency(lossStats.largestPnL, currency)}`,
      winNum: winStats.largestPnL,
      lossNum: lossStats.largestPnL,
      isHigherBetter: true,
      description: 'Peak single winning trade vs maximum single loss',
    },
    {
      label: 'Average R-Multiple',
      winVal: `+${winStats.avgRMultiple}R`,
      lossVal: `-${lossStats.avgRMultiple || 1.0}R`,
      winNum: winStats.avgRMultiple,
      lossNum: lossStats.avgRMultiple || 1.0,
      isHigherBetter: true,
      description: 'Average reward-to-risk multiple achieved',
    },
    {
      label: 'Average Holding Duration',
      winVal: `${winStats.avgDurationMinutes} mins`,
      lossVal: `${lossStats.avgDurationMinutes} mins`,
      winNum: winStats.avgDurationMinutes,
      lossNum: lossStats.avgDurationMinutes,
      unit: 'mins',
      description: 'Holding time in minutes from open to close',
    },
    {
      label: 'Average MFE (Max Favorable Excursion)',
      winVal: `+${formatCurrency(winStats.avgMFE, currency)}`,
      lossVal: `+${formatCurrency(lossStats.avgMFE, currency)}`,
      winNum: winStats.avgMFE,
      lossNum: lossStats.avgMFE,
      isHigherBetter: true,
      description: 'Peak unrealized profit excursion reached during trade',
    },
    {
      label: 'Average MAE (Max Adverse Excursion)',
      winVal: `-${formatCurrency(winStats.avgMAE, currency)}`,
      lossVal: `-${formatCurrency(lossStats.avgMAE, currency)}`,
      winNum: winStats.avgMAE,
      lossNum: lossStats.avgMAE,
      isHigherBetter: false,
      description: 'Maximum unrealized drawdown experienced before close',
    },
    {
      label: 'Entry Efficiency',
      winVal: `${winStats.avgEntryEfficiency}%`,
      lossVal: `${lossStats.avgEntryEfficiency}%`,
      winNum: winStats.avgEntryEfficiency,
      lossNum: lossStats.avgEntryEfficiency,
      unit: '%',
      isHigherBetter: true,
      description: 'MFE / (MFE + MAE) entry precision index',
    },
    {
      label: 'Exit Efficiency',
      winVal: `${winStats.avgExitEfficiency}%`,
      lossVal: `${lossStats.avgExitEfficiency}%`,
      winNum: winStats.avgExitEfficiency,
      lossNum: lossStats.avgExitEfficiency,
      unit: '%',
      isHigherBetter: true,
      description: 'Realized gain captured as percentage of MFE',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Winning Trades Card */}
        <Card
          onClick={() =>
            onDrillDown(
              'Winning Trades Breakdown',
              winTrades,
              `${winStats.tradesCount} winning trades • Total Gross Profit: +${formatCurrency(winStats.totalPnL, currency)}`
            )
          }
          className="p-4 bg-[#121417] border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Winning Positions ({metrics.winRate}%)
                </span>
                <span className="text-xs text-[#848B98] block">
                  {winStats.tradesCount} winning trades
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">
                +{formatCurrency(winStats.totalPnL, currency)}
              </span>
              <span className="text-[10px] text-blue-400 block group-hover:underline">
                Click to inspect
              </span>
            </div>
          </div>
        </Card>

        {/* Losing Trades Card */}
        <Card
          onClick={() =>
            onDrillDown(
              'Losing Trades Breakdown',
              lossTrades,
              `${lossStats.tradesCount} losing trades • Total Gross Loss: -${formatCurrency(lossStats.totalPnL, currency)}`
            )
          }
          className="p-4 bg-[#121417] border border-rose-500/30 hover:border-rose-500/60 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <span className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                  Losing Positions ({metrics.lossRate}%)
                </span>
                <span className="text-xs text-[#848B98] block">
                  {lossStats.tradesCount} losing trades
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-rose-400">
                -{formatCurrency(lossStats.totalPnL, currency)}
              </span>
              <span className="text-[10px] text-blue-400 block group-hover:underline">
                Click to inspect
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Side-by-Side Detailed Comparison Table */}
      <Card className="bg-[#121417] border border-[#22252A] overflow-hidden">
        <div className="p-3.5 border-b border-[#22252A] bg-[#15171A] flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-400" />
            Detailed Head-to-Head Quantitative Breakdown
          </span>
          <span className="text-xs text-[#848B98] font-mono">
            Payoff Ratio: <strong className="text-blue-400">{metrics.payoffRatio}:1</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-[#22252A] bg-[#0E1013] text-[#848B98] text-[11px]">
                <th className="py-2.5 px-4 font-semibold w-1/3">METRIC</th>
                <th className="py-2.5 px-4 font-semibold text-emerald-400 w-1/4">
                  WINNING TRADES ({winStats.tradesCount})
                </th>
                <th className="py-2.5 px-4 font-semibold text-rose-400 w-1/4">
                  LOSING TRADES ({lossStats.tradesCount})
                </th>
                <th className="py-2.5 px-4 font-semibold text-right text-[#848B98] hidden sm:table-cell">
                  DELTA / RATIO
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1D22]">
              {comparisonRows.map((row, idx) => {
                const total = row.winNum + row.lossNum || 1;
                const winPercent = Math.min(100, Math.max(0, (row.winNum / total) * 100));

                return (
                  <tr key={idx} className="hover:bg-[#181B20] transition-colors">
                    {/* Metric Name & Description */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{row.label}</span>
                      <span className="text-[10px] text-[#848B98] font-sans block mt-0.5">
                        {row.description}
                      </span>
                    </td>

                    {/* Winning Value */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-400 text-sm block">
                        {row.winVal}
                      </span>
                      {/* Mini bar */}
                      <div className="w-24 bg-[#22252A] h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${winPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Losing Value */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-rose-400 text-sm block">
                        {row.lossVal}
                      </span>
                      {/* Mini bar */}
                      <div className="w-24 bg-[#22252A] h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${100 - winPercent}%` }}
                        />
                      </div>
                    </td>

                    {/* Delta / Comparison Ratio */}
                    <td className="py-3 px-4 text-right hidden sm:table-cell">
                      {row.lossNum > 0 ? (
                        <span className="text-white font-semibold">
                          {(row.winNum / row.lossNum).toFixed(2)}x
                        </span>
                      ) : (
                        <span className="text-[#848B98]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
