/**
 * Quantitative Analytics Metrics Overview Grid
 * Professional Risk-Adjusted Ratios, Expectancy, Excursion & Efficiency Metrics
 */

import React from 'react';
import { AdvancedPerformanceMetrics } from '../../types/analytics';
import { formatCurrency } from '../../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  ShieldAlert, 
  Zap, 
  Clock, 
  Percent, 
  BarChart2, 
  Activity, 
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Crosshair,
  Gauge
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface AnalyticsMetricsOverviewProps {
  metrics: AdvancedPerformanceMetrics;
  currency?: string;
}

export const AnalyticsMetricsOverview: React.FC<AnalyticsMetricsOverviewProps> = ({
  metrics,
  currency = 'USD',
}) => {
  const isNetPositive = metrics.netPnL >= 0;

  return (
    <div className="space-y-4">
      {/* Tier 1: Primary Quantitative Edge & Return Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Net P&L & Return */}
        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-[#15171A] to-[#111316]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848B98] uppercase tracking-wider">Net Realized P&L</span>
            <div className={`p-1.5 rounded-lg ${isNetPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isNetPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isNetPositive ? '+' : ''}{formatCurrency(metrics.netPnL, currency)}
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#848B98]">
            <span>Net Return: <strong className="text-white font-mono">{metrics.netReturnPercent >= 0 ? '+' : ''}{metrics.netReturnPercent}%</strong></span>
            <span>Total: <strong className="text-white font-mono">{metrics.closedTradesCount} trades</strong></span>
          </div>
        </Card>

        {/* Expectancy Matrix ($ & R) */}
        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-[#15171A] to-[#111316]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848B98] uppercase tracking-wider">Trade Expectancy</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 flex items-baseline gap-2">
            <span className={metrics.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {metrics.expectancy >= 0 ? '+' : ''}{formatCurrency(metrics.expectancy, currency)}
            </span>
            <span className="text-xs font-normal text-purple-400 font-mono">
              ({metrics.expectancyRMultiple >= 0 ? '+' : ''}{metrics.expectancyRMultiple}R)
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#848B98]">
            <span>Avg R: <strong className="text-purple-400 font-mono">+{metrics.averageAchievedR}R</strong></span>
            <span>Max R: <strong className="text-purple-400 font-mono">+{metrics.maxAchievedR}R</strong></span>
          </div>
        </Card>

        {/* Win Rate & Payoff */}
        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-[#15171A] to-[#111316]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848B98] uppercase tracking-wider">Win Rate & Payoff</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {metrics.winRate}%
            <span className="text-xs font-normal text-[#848B98] ml-2">
              ({metrics.winningTradesCount}W / {metrics.losingTradesCount}L)
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#848B98]">
            <span>Profit Factor: <strong className="text-emerald-400 font-mono">{metrics.profitFactor}</strong></span>
            <span>Payoff: <strong className="text-blue-400 font-mono">{metrics.payoffRatio}:1</strong></span>
          </div>
        </Card>

        {/* Risk-Adjusted Sharpe & Sortino */}
        <Card className="p-4 relative overflow-hidden bg-gradient-to-br from-[#15171A] to-[#111316]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#848B98] uppercase tracking-wider">Sharpe / Sortino</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2 flex items-baseline gap-2">
            <span className={metrics.sharpeRatio >= 1.5 ? 'text-emerald-400' : metrics.sharpeRatio >= 1 ? 'text-blue-400' : 'text-amber-400'}>
              {metrics.sharpeRatio.toFixed(2)}
            </span>
            <span className="text-xs font-normal text-[#848B98]">Sharpe</span>
            <span className="text-sm font-semibold font-mono text-emerald-400 ml-1">
              {metrics.sortinoRatio.toFixed(2)} <span className="text-[10px] text-[#848B98]">Sortino</span>
            </span>
          </div>
          <div className="flex items-center justify-between mt-2 text-[11px] text-[#848B98]">
            <span>Calmar: <strong className="text-white font-mono">{metrics.calmarRatio}</strong></span>
            <span>Recovery: <strong className="text-white font-mono">{metrics.recoveryFactor}x</strong></span>
          </div>
        </Card>
      </div>

      {/* Tier 2: Advanced Statistical Ratios, Drawdowns, Excursions & Holding Durations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Risk, Drawdown & Downside Volatility */}
        <Card className="p-4 bg-[#121417]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Drawdown & Downside Risk
            </span>
            <Badge variant="rose">SAFETY</Badge>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Max Drawdown ($)</span>
              <span className="text-rose-400 font-bold">-{formatCurrency(metrics.maxDrawdownAmount, currency)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Max Drawdown (%)</span>
              <span className="text-rose-400 font-bold">-{metrics.maxDrawdownPercent}%</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Current Drawdown</span>
              <span className={metrics.currentDrawdownAmount === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {metrics.currentDrawdownAmount === 0 ? 'At All-Time High' : `-${formatCurrency(metrics.currentDrawdownAmount, currency)} (${metrics.currentDrawdownPercent}%)`}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Ulcer Index (UI)</span>
              <span className="text-white font-bold">{metrics.ulcerIndex}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#848B98]">Recovery Factor</span>
              <span className="text-emerald-400 font-bold">{metrics.recoveryFactor}x</span>
            </div>
          </div>
        </Card>

        {/* Excursion & Execution Efficiency (MFE / MAE) */}
        <Card className="p-4 bg-[#121417]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Crosshair className="h-3.5 w-3.5 text-blue-400" />
              Excursions & Efficiency
            </span>
            <Badge variant="blue">EXECUTION</Badge>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Avg MFE (Max Favorable)</span>
              <span className="text-emerald-400 font-bold">+{formatCurrency(metrics.avgMFE, currency)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Avg MAE (Max Adverse)</span>
              <span className="text-rose-400 font-bold">-{formatCurrency(metrics.avgMAE, currency)}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">MFE / MAE Ratio</span>
              <span className="text-purple-400 font-bold">{metrics.mfeMaeRatio}:1</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Entry Efficiency</span>
              <span className="text-blue-400 font-bold">{metrics.avgEntryEfficiency}%</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#848B98]">Exit Efficiency</span>
              <span className="text-emerald-400 font-bold">{metrics.avgExitEfficiency}%</span>
            </div>
          </div>
        </Card>

        {/* Durations, Streaks & Cost Drag */}
        <Card className="p-4 bg-[#121417]">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              Holding Durations & Streaks
            </span>
            <Badge variant="amber">TEMPORAL</Badge>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Avg Trade Duration</span>
              <span className="text-white font-bold">{metrics.avgDurationMinutes} mins</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Avg Win Duration</span>
              <span className="text-emerald-400 font-bold">{metrics.avgWinDurationMinutes} mins</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Avg Loss Duration</span>
              <span className="text-rose-400 font-bold">{metrics.avgLossDurationMinutes} mins</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1A1D22]">
              <span className="text-[#848B98]">Max Win Streak / Loss Streak</span>
              <span className="text-white font-bold">
                <span className="text-emerald-400">{metrics.maxConsecutiveWins}W</span> / <span className="text-rose-400">{metrics.maxConsecutiveLosses}L</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-[#848B98]">Total Commission & Fees</span>
              <span className="text-amber-400 font-bold">
                {formatCurrency(metrics.totalCommissions + metrics.totalFees + metrics.totalSwaps, currency)}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
