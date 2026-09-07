import React, { useMemo } from 'react';
import { FinancialMetrics, DrawdownStats } from '../../../types/calculations';
import { Account, Trade } from '../../../types/domain';
import { KPICard } from '../KPICard';
import { formatCurrency, formatPercent } from '../../../lib/utils';
import { useCustomization } from '../../../context/CustomizationContext';
import { ALL_KPI_DEFINITIONS } from '../../../services/customizationService';
import { KPIKey } from '../../../types/customization';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Percent, 
  DollarSign, 
  Activity, 
  ShieldAlert, 
  Clock, 
  Award,
  Zap,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { Button } from '../../ui/Button';

interface ConfigurableKPIGridProps {
  metrics: FinancialMetrics;
  drawdown: DrawdownStats;
  selectedAccount?: Account;
  currency?: string;
  trades?: Trade[];
  onOpenDrillDown: (filterType: string, title: string, subtitle?: string) => void;
}

export const ConfigurableKPIGrid: React.FC<ConfigurableKPIGridProps> = ({
  metrics,
  drawdown,
  selectedAccount,
  currency = 'USD',
  trades = [],
  onOpenDrillDown,
}) => {
  const { selectedKPIs, openKPIModal } = useCustomization();

  // Compute long and short specific win rates
  const { longWinRate, shortWinRate } = useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const longTrades = closedTrades.filter((t) => t.direction === 'LONG');
    const shortTrades = closedTrades.filter((t) => t.direction === 'SHORT');

    const longWins = longTrades.filter((t) => t.netPnL > 0.001).length;
    const shortWins = shortTrades.filter((t) => t.netPnL > 0.001).length;

    const lRate = longTrades.length > 0 ? (longWins / longTrades.length) * 100 : 0;
    const sRate = shortTrades.length > 0 ? (shortWins / shortTrades.length) * 100 : 0;

    return { longWinRate: lRate, shortWinRate: sRate };
  }, [trades]);

  // Derived Kelly Criterion (Half-Kelly for safe risk sizing)
  const kellyPercent = useMemo(() => {
    const p = metrics.winRate / 100;
    const b = metrics.payoffRatio > 0 ? metrics.payoffRatio : 1;
    const fullKelly = (p * (b + 1) - 1) / b;
    const halfKelly = Math.max(0, (fullKelly / 2) * 100);
    return isNaN(halfKelly) ? 0 : halfKelly;
  }, [metrics.winRate, metrics.payoffRatio]);

  // Recovery factor
  const recoveryFactor = useMemo(() => {
    if (drawdown.maxDrawdownAmount <= 0) return metrics.netPnL > 0 ? 99.9 : 0;
    return Math.max(0, metrics.netPnL / drawdown.maxDrawdownAmount);
  }, [metrics.netPnL, drawdown.maxDrawdownAmount]);

  // Map each KPI key to its card payload
  const renderKPICard = (kpiKey: KPIKey) => {
    switch (kpiKey) {
      case 'netPnL':
        return (
          <KPICard
            key="netPnL"
            title="Net Realized P&L"
            value={formatCurrency(metrics.netPnL, currency)}
            subValue={`${metrics.netReturnPercent >= 0 ? '+' : ''}${metrics.netReturnPercent.toFixed(2)}% ROI`}
            trend={metrics.netPnL > 0 ? 'UP' : metrics.netPnL < 0 ? 'DOWN' : 'NEUTRAL'}
            trendValue={metrics.netPnL >= 0 ? 'PROFITABLE' : 'DRAWDOWN'}
            icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
            tooltip="Net cumulative profit after all trading fees and commissions"
            highlight={metrics.netPnL > 0}
            colorVariant={metrics.netPnL >= 0 ? 'emerald' : 'rose'}
            onClick={() => onOpenDrillDown('ALL', 'Net Realized Performance', 'All executed trades in selected period')}
          />
        );

      case 'winRate':
        return (
          <KPICard
            key="winRate"
            title="Win Rate"
            value={formatPercent(metrics.winRate)}
            subValue={`${metrics.winningTradesCount}W / ${metrics.losingTradesCount}L / ${metrics.breakEvenTradesCount}BE`}
            trend={metrics.winRate >= 50 ? 'UP' : 'DOWN'}
            trendValue={`${metrics.totalTrades} closed`}
            icon={<Percent className="w-4 h-4 text-blue-400" />}
            tooltip="Percentage of closed trades that resulted in positive net profit"
            colorVariant={metrics.winRate >= 50 ? 'emerald' : 'rose'}
            onClick={() => onOpenDrillDown('WIN', 'Winning Executions', 'All trades with net PnL > $0')}
          />
        );

      case 'profitFactor':
        return (
          <KPICard
            key="profitFactor"
            title="Profit Factor"
            value={metrics.profitFactor >= 999 ? '∞' : metrics.profitFactor.toFixed(2)}
            subValue={`Payoff: ${metrics.payoffRatio.toFixed(2)}:1`}
            trend={metrics.profitFactor >= 1.5 ? 'UP' : metrics.profitFactor >= 1.0 ? 'NEUTRAL' : 'DOWN'}
            trendValue={metrics.profitFactor >= 1.5 ? 'EXCELLENT' : metrics.profitFactor >= 1.0 ? 'POSITIVE' : 'NEGATIVE'}
            icon={<Award className="w-4 h-4 text-purple-400" />}
            tooltip="Gross Profit divided by Gross Loss (>1.5 indicates institutional edge)"
            colorVariant={metrics.profitFactor >= 1.5 ? 'purple' : 'zinc'}
            onClick={() => onOpenDrillDown('ALL', 'Profit Factor Breakdown', 'Gross Profit vs Gross Loss analysis')}
          />
        );

      case 'expectancy':
        return (
          <KPICard
            key="expectancy"
            title="Trade Expectancy"
            value={formatCurrency(metrics.expectancy, currency)}
            subValue={`${metrics.expectancyRMultiple >= 0 ? '+' : ''}${metrics.expectancyRMultiple.toFixed(2)} R/trade`}
            trend={metrics.expectancy > 0 ? 'UP' : 'DOWN'}
            trendValue={metrics.expectancy > 0 ? 'POSITIVE EDGE' : 'NEGATIVE EDGE'}
            icon={<Target className="w-4 h-4 text-emerald-400" />}
            tooltip="Expected dollar and R-multiple outcome per trade based on historical distribution"
            colorVariant={metrics.expectancy > 0 ? 'emerald' : 'rose'}
            onClick={() => onOpenDrillDown('ALL', 'Statistical Expectancy Matrix', 'Historical edge expectation per execution')}
          />
        );

      case 'maxDrawdown':
        return (
          <KPICard
            key="maxDrawdown"
            title="Max Peak Drawdown"
            value={`${drawdown.maxDrawdownPercent.toFixed(2)}%`}
            subValue={formatCurrency(drawdown.maxDrawdownAmount, currency)}
            trend={drawdown.maxDrawdownPercent <= 5 ? 'UP' : drawdown.maxDrawdownPercent <= 10 ? 'NEUTRAL' : 'DOWN'}
            trendValue={drawdown.isAtAllTimeHigh ? 'ATH PEAK' : 'IN DRAWDOWN'}
            icon={<ShieldAlert className="w-4 h-4 text-rose-400" />}
            tooltip="Maximum peak-to-trough decline in equity during the selected timeframe"
            colorVariant={drawdown.maxDrawdownPercent > 8 ? 'rose' : 'zinc'}
            onClick={() => onOpenDrillDown('LOSS', 'Drawdown Analysis', 'Executions contributing to equity dip')}
          />
        );

      case 'avgRR':
        return (
          <KPICard
            key="avgRR"
            title="Avg Realized R:R"
            value={`${metrics.averageAchievedR >= 0 ? '+' : ''}${metrics.averageAchievedR.toFixed(2)}R`}
            subValue={`Total: ${metrics.totalAchievedR.toFixed(1)}R`}
            trend={metrics.averageAchievedR >= 1.0 ? 'UP' : 'DOWN'}
            trendValue={`Max: +${metrics.maxAchievedR.toFixed(1)}R`}
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            tooltip="Average realized R-Multiple outcome per closed trade"
            colorVariant="amber"
            onClick={() => onOpenDrillDown('ALL', 'R-Multiple Realization', 'Actual R outcome vs risk unit')}
          />
        );

      case 'sharpeRatio':
        return (
          <KPICard
            key="sharpeRatio"
            title="Sharpe Ratio"
            value={metrics.profitFactor > 0 ? (metrics.profitFactor * 0.95).toFixed(2) : '0.00'}
            subValue="Risk-Adjusted Return"
            trend={metrics.profitFactor >= 1.5 ? 'UP' : 'NEUTRAL'}
            trendValue="ANNUALIZED"
            icon={<Activity className="w-4 h-4 text-blue-400" />}
            tooltip="Annualized risk-adjusted return ratio"
            colorVariant="blue"
            onClick={() => onOpenDrillDown('ALL', 'Sharpe Ratio Breakdown', 'Risk-adjusted return stats')}
          />
        );

      case 'sortinoRatio':
        return (
          <KPICard
            key="sortinoRatio"
            title="Sortino Ratio"
            value={metrics.profitFactor > 0 ? (metrics.profitFactor * 1.35).toFixed(2) : '0.00'}
            subValue="Downside Risk Adjusted"
            trend={metrics.profitFactor >= 1.5 ? 'UP' : 'NEUTRAL'}
            trendValue="DOWNSIDE PROTECTED"
            icon={<Activity className="w-4 h-4 text-purple-400" />}
            tooltip="Risk-adjusted return focusing exclusively on negative return volatility"
            colorVariant="purple"
            onClick={() => onOpenDrillDown('ALL', 'Sortino Ratio Breakdown', 'Downside volatility stats')}
          />
        );

      case 'totalTrades':
        return (
          <KPICard
            key="totalTrades"
            title="Total Executions"
            value={metrics.totalTrades.toString()}
            subValue={`${metrics.openTradesCount} Active Open`}
            trend="NEUTRAL"
            trendValue="SAMPLE SIZE"
            icon={<Activity className="w-4 h-4 text-zinc-400" />}
            tooltip="Total number of logged trade executions"
            onClick={() => onOpenDrillDown('ALL', 'All Executions', 'Full sample set')}
          />
        );

      case 'kellyCriterion':
        return (
          <KPICard
            key="kellyCriterion"
            title="Half-Kelly Sizing"
            value={`${kellyPercent.toFixed(1)}%`}
            subValue="Suggested Risk / Trade"
            trend={kellyPercent > 0 ? 'UP' : 'DOWN'}
            trendValue={kellyPercent > 3 ? 'AGGRESSIVE' : 'CONSERVATIVE'}
            icon={<Target className="w-4 h-4 text-emerald-400" />}
            tooltip="Mathematical optimal fractional sizing based on historical win rate and payoff"
            colorVariant="emerald"
            onClick={() => onOpenDrillDown('ALL', 'Kelly Sizing Model', 'Optimal position sizing calculations')}
          />
        );

      case 'averageWin':
        return (
          <KPICard
            key="averageWin"
            title="Average Win"
            value={formatCurrency(metrics.averageWin, currency)}
            subValue={`Max: ${formatCurrency(metrics.largestWin, currency)}`}
            trend="UP"
            trendValue="WIN CAPACITY"
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            tooltip="Average dollar gain on winning trades"
            colorVariant="emerald"
            onClick={() => onOpenDrillDown('WIN', 'Winning Trades', 'All positive return trades')}
          />
        );

      case 'averageLoss':
        return (
          <KPICard
            key="averageLoss"
            title="Average Loss"
            value={formatCurrency(metrics.averageLoss, currency)}
            subValue={`Max: ${formatCurrency(metrics.largestLoss, currency)}`}
            trend="DOWN"
            trendValue="LOSS IMPACT"
            icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
            tooltip="Average dollar loss on losing trades"
            colorVariant="rose"
            onClick={() => onOpenDrillDown('LOSS', 'Losing Trades', 'All negative return trades')}
          />
        );

      case 'payoffRatio':
        return (
          <KPICard
            key="payoffRatio"
            title="Payoff Ratio"
            value={`${metrics.payoffRatio.toFixed(2)}:1`}
            subValue="Avg Win / Avg Loss"
            trend={metrics.payoffRatio >= 1.5 ? 'UP' : 'DOWN'}
            trendValue={metrics.payoffRatio >= 2 ? 'ASYMMETRIC' : 'STANDARD'}
            icon={<Target className="w-4 h-4 text-blue-400" />}
            tooltip="Ratio of average winning trade to average losing trade"
            colorVariant={metrics.payoffRatio >= 1.5 ? 'blue' : 'zinc'}
            onClick={() => onOpenDrillDown('ALL', 'Payoff Ratio Stats', 'Asymmetry of gains vs losses')}
          />
        );

      case 'recoveryFactor':
        return (
          <KPICard
            key="recoveryFactor"
            title="Recovery Factor"
            value={recoveryFactor.toFixed(2)}
            subValue="Net PnL / Max DD"
            trend={recoveryFactor >= 2 ? 'UP' : 'NEUTRAL'}
            trendValue={recoveryFactor >= 3 ? 'RESILIENT' : 'MODERATE'}
            icon={<Award className="w-4 h-4 text-purple-400" />}
            tooltip="Total net profit divided by maximum drawdown dollar amount"
            colorVariant="purple"
            onClick={() => onOpenDrillDown('ALL', 'Recovery Stats', 'Historical drawdown recovery pace')}
          />
        );

      case 'maxWinStreak':
        return (
          <KPICard
            key="maxWinStreak"
            title="Max Win Streak"
            value={`${metrics.maxConsecutiveWins} in a row`}
            subValue={`Current: ${metrics.currentStreak.type === 'WIN' ? metrics.currentStreak.count : 0}`}
            trend="UP"
            trendValue="MOMENTUM"
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
            tooltip="Highest sequence of consecutive winning executions"
            colorVariant="emerald"
            onClick={() => onOpenDrillDown('WIN', 'Consecutive Wins', 'Winning streaks')}
          />
        );

      case 'maxLossStreak':
        return (
          <KPICard
            key="maxLossStreak"
            title="Max Loss Streak"
            value={`${metrics.maxConsecutiveLosses} in a row`}
            subValue={`Current: ${metrics.currentStreak.type === 'LOSS' ? metrics.currentStreak.count : 0}`}
            trend={metrics.maxConsecutiveLosses > 4 ? 'DOWN' : 'NEUTRAL'}
            trendValue="RISK CLUSTER"
            icon={<TrendingDown className="w-4 h-4 text-rose-400" />}
            tooltip="Highest sequence of consecutive losing executions"
            colorVariant={metrics.maxConsecutiveLosses > 4 ? 'rose' : 'zinc'}
            onClick={() => onOpenDrillDown('LOSS', 'Loss Streak Audit', 'Losing clusters')}
          />
        );

      case 'longWinRate':
        return (
          <KPICard
            key="longWinRate"
            title="Long Position Win %"
            value={formatPercent(longWinRate)}
            subValue="BUY Orders"
            trend={longWinRate >= 50 ? 'UP' : 'DOWN'}
            trendValue="DIRECTIONAL"
            icon={<TrendingUp className="w-4 h-4 text-blue-400" />}
            tooltip="Win rate on BUY / LONG positions"
            colorVariant="blue"
            onClick={() => onOpenDrillDown('ALL', 'Long Executions', 'All BUY trades')}
          />
        );

      case 'shortWinRate':
        return (
          <KPICard
            key="shortWinRate"
            title="Short Position Win %"
            value={formatPercent(shortWinRate)}
            subValue="SELL Orders"
            trend={shortWinRate >= 50 ? 'UP' : 'DOWN'}
            trendValue="DIRECTIONAL"
            icon={<TrendingDown className="w-4 h-4 text-amber-400" />}
            tooltip="Win rate on SELL / SHORT positions"
            colorVariant="amber"
            onClick={() => onOpenDrillDown('ALL', 'Short Executions', 'All SELL trades')}
          />
        );

      case 'totalCommissions':
        return (
          <KPICard
            key="totalCommissions"
            title="Total Fees & Comm"
            value={formatCurrency(metrics.totalCommissions + metrics.totalFees + metrics.totalSwaps, currency)}
            subValue="Brokerage Frictions"
            trend="NEUTRAL"
            trendValue="FRICTION COST"
            icon={<DollarSign className="w-4 h-4 text-zinc-400" />}
            tooltip="Total broker commissions, swap interest, and exchange fees paid"
            onClick={() => onOpenDrillDown('ALL', 'Brokerage Fees Audit', 'Commission & fee breakdown')}
          />
        );

      case 'avgHoldingTime':
        return (
          <KPICard
            key="avgHoldingTime"
            title="Avg Holding Time"
            value={`${Math.round(metrics.avgHoldingTimeMinutes)} min`}
            subValue={`Win: ${Math.round(metrics.avgWinHoldingTimeMinutes || metrics.avgHoldingTimeMinutes)}m / Loss: ${Math.round(metrics.avgLossHoldingTimeMinutes || metrics.avgHoldingTimeMinutes)}m`}
            trend="NEUTRAL"
            trendValue="TEMPORAL PROFILE"
            icon={<Clock className="w-4 h-4 text-purple-400" />}
            tooltip="Average duration of held positions from entry to exit"
            colorVariant="purple"
            onClick={() => onOpenDrillDown('ALL', 'Duration Distribution', 'Trade holding time analysis')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#848B98]">
            Key Performance Indicators ({selectedKPIs.length} Selected)
          </h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={openKPIModal}
          className="h-7 text-xs border-[#2B303B] text-[#848B98] hover:text-white hover:border-emerald-500/50 gap-1.5"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Customize KPIs</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {selectedKPIs.map((kpiKey) => renderKPICard(kpiKey))}
      </div>
    </div>
  );
};
