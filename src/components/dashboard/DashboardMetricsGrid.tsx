import React from 'react';
import { FinancialMetrics, DrawdownStats } from '../../types/calculations';
import { Account, Trade } from '../../types/domain';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { KPICard } from './KPICard';
import { 
  DollarSign, 
  Percent, 
  Scale, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Award, 
  ShieldAlert, 
  Flame, 
  Activity, 
  BarChart, 
  Zap, 
  Layers 
} from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DashboardMetricsGridProps {
  metrics: FinancialMetrics;
  drawdown: DrawdownStats;
  selectedAccount: Account | null;
  currency?: string;
  onOpenDrillDown: (filterType: string, title: string, subtitle?: string) => void;
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({
  metrics,
  drawdown,
  selectedAccount,
  currency = 'USD',
  onOpenDrillDown,
}) => {
  const isNetPositive = metrics.netPnL >= 0;
  const currBalance = drawdown.currentBalance;
  const equityVal = drawdown.equity;

  return (
    <div className="space-y-4">
      {/* 1. Primary Hero KPI Grid (6 Top Core Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Account Balance */}
        <KPICard
          title="Account Balance"
          value={formatCurrency(currBalance, currency)}
          subValue={`Base: ${formatCurrency(drawdown.startingBalance, currency)}`}
          icon={<DollarSign className="h-4 w-4 text-emerald-400" />}
          highlight={true}
          onClick={() => onOpenDrillDown('ALL', 'All Filtered Executions', 'All trades contributing to current capital balance')}
        />

        {/* 2. Equity */}
        <KPICard
          title="Account Equity"
          value={formatCurrency(equityVal, currency)}
          subValue={`Peak: ${formatCurrency(drawdown.highWaterMark, currency)}`}
          icon={<Zap className="h-4 w-4 text-blue-400" />}
          onClick={() => onOpenDrillDown('ALL', 'Portfolio Equity Basis', 'Realized & active trade positions')}
        />

        {/* 3. Net P&L */}
        <KPICard
          title="Net P&L"
          value={formatCurrency(metrics.netPnL, currency)}
          trend={isNetPositive ? 'UP' : 'DOWN'}
          trendValue={formatPercent(metrics.netReturnPercent)}
          subValue={`Gross Profit: ${formatCurrency(metrics.grossProfit, currency)}`}
          icon={<TrendingUp className={`h-4 w-4 ${isNetPositive ? 'text-emerald-400' : 'text-rose-400'}`} />}
          colorVariant={isNetPositive ? 'emerald' : 'rose'}
          onClick={() => onOpenDrillDown('ALL', 'Net Realized P&L Trades', 'All closed trade outcomes')}
        />

        {/* 4. Win Rate */}
        <KPICard
          title="Win Rate"
          value={`${metrics.winRate}%`}
          subValue={`${metrics.winningTradesCount}W / ${metrics.losingTradesCount}L / ${metrics.breakEvenTradesCount}BE`}
          icon={<Percent className="h-4 w-4 text-emerald-400" />}
          onClick={() => onOpenDrillDown('WIN', 'Winning Trades', `${metrics.winningTradesCount} winning executions logged`)}
        />

        {/* 5. Profit Factor */}
        <KPICard
          title="Profit Factor"
          value={metrics.profitFactor > 0 ? metrics.profitFactor.toString() : '0.00'}
          subValue={`Payoff: ${metrics.payoffRatio}x`}
          icon={<Scale className="h-4 w-4 text-purple-400" />}
          onClick={() => onOpenDrillDown('ALL', 'Profit Factor Contributors', `Gross Gains ${formatCurrency(metrics.grossProfit)} vs Losses ${formatCurrency(metrics.grossLoss)}`)}
        />

        {/* 6. Expectancy */}
        <KPICard
          title="Expectancy"
          value={formatCurrency(metrics.expectancy, currency)}
          subValue={`Edge: ${metrics.expectancyRMultiple}R / trade`}
          icon={<Target className="h-4 w-4 text-amber-400" />}
          onClick={() => onOpenDrillDown('ALL', 'Mathematical Expectancy Breakdown', 'Quantitative expected outcome per trade')}
        />
      </div>

      {/* 2. Secondary Quantitative & Statistical Edge Grid (12 Specialized Widgets) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 7. Gross P&L */}
        <KPICard
          title="Gross P&L"
          value={`+${formatCurrency(metrics.grossProfit, currency)}`}
          subValue={`Losses: -${formatCurrency(metrics.grossLoss, currency)}`}
          icon={<BarChart className="h-4 w-4 text-[#848B98]" />}
          onClick={() => onOpenDrillDown('ALL', 'Gross P&L Breakdown', 'Total gross gains and losses prior to fees')}
        />

        {/* 8. Trade Count */}
        <KPICard
          title="Trade Count"
          value={metrics.totalTrades.toString()}
          subValue={`Open: ${metrics.openTradesCount} | Closed: ${metrics.winningTradesCount + metrics.losingTradesCount + metrics.breakEvenTradesCount}`}
          icon={<Activity className="h-4 w-4 text-blue-400" />}
          onClick={() => onOpenDrillDown('ALL', 'All Executions', `Complete registry of ${metrics.totalTrades} trades`)}
        />

        {/* 9. Average Win */}
        <KPICard
          title="Average Win"
          value={formatCurrency(metrics.averageWin, currency)}
          subValue={`Largest Win: ${formatCurrency(metrics.largestWin, currency)}`}
          icon={<Award className="h-4 w-4 text-emerald-400" />}
          colorVariant="emerald"
          onClick={() => onOpenDrillDown('WIN', 'Winning Trades', 'Inspect all profitable trade setups')}
        />

        {/* 10. Average Loss */}
        <KPICard
          title="Average Loss"
          value={`-${formatCurrency(metrics.averageLoss, currency)}`}
          subValue={`Largest Loss: ${formatCurrency(metrics.largestLoss, currency)}`}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          colorVariant="rose"
          onClick={() => onOpenDrillDown('LOSS', 'Losing Trades', 'Inspect losing trade executions and risk management')}
        />

        {/* 11. Average R */}
        <KPICard
          title="Average R"
          value={metrics.averageAchievedR !== 0 ? `${metrics.averageAchievedR}R` : '0.0R'}
          subValue={`Max R: +${metrics.maxAchievedR}R`}
          icon={<Target className="h-4 w-4 text-purple-400" />}
          colorVariant="purple"
          onClick={() => onOpenDrillDown('ALL', 'R-Multiple Performance', `Total R captured: ${metrics.totalAchievedR}R`)}
        />

        {/* 12. Largest Win */}
        <KPICard
          title="Largest Win"
          value={`+${formatCurrency(metrics.largestWin, currency)}`}
          subValue="Single best execution"
          icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
          colorVariant="emerald"
          onClick={() => onOpenDrillDown('LARGEST_WIN', 'Largest Win Trade', 'Highest monetary gain')}
        />

        {/* 13. Largest Loss */}
        <KPICard
          title="Largest Loss"
          value={formatCurrency(metrics.largestLoss, currency)}
          subValue="Single worst execution"
          icon={<TrendingDown className="h-4 w-4 text-rose-400" />}
          colorVariant="rose"
          onClick={() => onOpenDrillDown('LARGEST_LOSS', 'Largest Loss Trade', 'Maximum single trade loss')}
        />

        {/* 14. Maximum Drawdown */}
        <KPICard
          title="Max Drawdown"
          value={`-${drawdown.maxDrawdownPercent}%`}
          subValue={`-${formatCurrency(drawdown.maxDrawdownAmount, currency)}`}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
          colorVariant="rose"
          onClick={() => onOpenDrillDown('ALL', 'Max Drawdown Trades', 'Trades during historical capital pullback')}
        />

        {/* 15. Current Drawdown */}
        <KPICard
          title="Current Drawdown"
          value={drawdown.currentDrawdownPercent === 0 ? '0.0% (Peak)' : `-${drawdown.currentDrawdownPercent}%`}
          subValue={drawdown.currentDrawdownPercent === 0 ? 'At All-Time High' : `-${formatCurrency(drawdown.currentDrawdownAmount, currency)}`}
          icon={<TrendingDown className="h-4 w-4 text-amber-400" />}
          colorVariant={drawdown.currentDrawdownPercent === 0 ? 'emerald' : 'amber'}
          onClick={() => onOpenDrillDown('ALL', 'Current Drawdown State', 'Active capital distance from high-water mark')}
        />

        {/* 16. Consecutive Wins */}
        <KPICard
          title="Consecutive Wins"
          value={`${metrics.maxConsecutiveWins} in a row`}
          subValue={metrics.currentStreak.type === 'WIN' ? `Current: ${metrics.currentStreak.count}W streak` : 'Current: 0'}
          icon={<Flame className="h-4 w-4 text-emerald-400" />}
          colorVariant="emerald"
          onClick={() => onOpenDrillDown('WIN', 'Consecutive Win Sequences', 'Winning streaks')}
        />

        {/* 17. Consecutive Losses */}
        <KPICard
          title="Consecutive Losses"
          value={`${metrics.maxConsecutiveLosses} in a row`}
          subValue={metrics.currentStreak.type === 'LOSS' ? `Current: ${metrics.currentStreak.count}L streak` : 'Current: 0'}
          icon={<Flame className="h-4 w-4 text-rose-400" />}
          colorVariant="rose"
          onClick={() => onOpenDrillDown('LOSS', 'Consecutive Loss Sequences', 'Loss streaks')}
        />

        {/* 18. Average Holding Time */}
        <KPICard
          title="Avg Holding Time"
          value={`${metrics.avgHoldingTimeMinutes} min`}
          subValue={`Wins: ${metrics.avgWinHoldingTimeMinutes}m | Losses: ${metrics.avgLossHoldingTimeMinutes}m`}
          icon={<Clock className="h-4 w-4 text-blue-400" />}
          onClick={() => onOpenDrillDown('ALL', 'Holding Duration Analytics', 'Trade durations')}
        />
      </div>
    </div>
  );
};
