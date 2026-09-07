import React, { useMemo } from 'react';
import { Trade, Strategy, Playbook } from '../../../types/domain';
import { formatCurrency, formatPercent } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';
import { Layers } from 'lucide-react';

interface StrategyComparisonWidgetProps {
  trades: Trade[];
  strategies: Strategy[];
  playbooks: Playbook[];
  currency?: string;
}

export const StrategyComparisonWidget: React.FC<StrategyComparisonWidgetProps> = ({
  trades,
  strategies,
  playbooks,
  currency = 'USD',
}) => {
  const strategyStats = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');

    const list = strategies.map((strat) => {
      const matching = closed.filter((t) => t.strategyId === strat.id);
      const wins = matching.filter((t) => t.netPnL > 0.001);
      const losses = matching.filter((t) => t.netPnL < -0.001);
      const netPnL = matching.reduce((acc, t) => acc + t.netPnL, 0);
      const grossProfit = wins.reduce((acc, t) => acc + t.netPnL, 0);
      const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
      const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
      const winRate = matching.length > 0 ? (wins.length / matching.length) * 100 : 0;
      const expectancy = matching.length > 0 ? netPnL / matching.length : 0;

      return {
        id: strat.id,
        name: strat.name,
        color: strat.color || '#10B981',
        count: matching.length,
        wins: wins.length,
        losses: losses.length,
        winRate,
        profitFactor: pf,
        expectancy,
        netPnL,
      };
    });

    // Also include Untagged if any
    const untagged = closed.filter((t) => !t.strategyId);
    if (untagged.length > 0) {
      const wins = untagged.filter((t) => t.netPnL > 0.001);
      const losses = untagged.filter((t) => t.netPnL < -0.001);
      const netPnL = untagged.reduce((acc, t) => acc + t.netPnL, 0);
      const grossProfit = wins.reduce((acc, t) => acc + t.netPnL, 0);
      const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.netPnL, 0));
      const pf = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 99.9 : 0;
      const winRate = (wins.length / untagged.length) * 100;

      list.push({
        id: 'untagged',
        name: 'Unassigned Strategy',
        color: '#64748B',
        count: untagged.length,
        wins: wins.length,
        losses: losses.length,
        winRate,
        profitFactor: pf,
        expectancy: netPnL / untagged.length,
        netPnL,
      });
    }

    return list.sort((a, b) => b.netPnL - a.netPnL);
  }, [trades, strategies]);

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#848B98]">Strategy Edge & Expectancy Ranking</span>
        <Badge variant="purple">PLAYBOOK LAB</Badge>
      </div>

      <div className="flex-1 bg-[#0C0D0F] rounded border border-[#1E2128] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1C1F26] text-[#848B98] bg-[#111316]">
              <th className="p-2.5 font-medium">Strategy Model</th>
              <th className="p-2.5 font-medium text-center">Trades</th>
              <th className="p-2.5 font-medium text-center">Win Rate</th>
              <th className="p-2.5 font-medium text-center">Profit Factor</th>
              <th className="p-2.5 font-medium text-right">Net Realized</th>
            </tr>
          </thead>
          <tbody>
            {strategyStats.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-[#555C68]">
                  No strategy executions logged yet.
                </td>
              </tr>
            ) : (
              strategyStats.map((item) => (
                <tr key={item.id} className="border-b border-[#1C1F26]/60 hover:bg-[#14161C] transition-colors">
                  <td className="p-2.5 font-medium text-white flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate">{item.name}</span>
                  </td>
                  <td className="p-2.5 text-center font-mono text-[#848B98]">{item.count}</td>
                  <td className="p-2.5 text-center">
                    <span
                      className={`font-mono font-semibold ${
                        item.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.count > 0 ? formatPercent(item.winRate) : '—'}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono text-zinc-300">
                    {item.count > 0 ? (item.profitFactor >= 99 ? '∞' : item.profitFactor.toFixed(2)) : '—'}
                  </td>
                  <td className="p-2.5 text-right font-mono font-semibold">
                    <span className={item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {formatCurrency(item.netPnL, currency)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
