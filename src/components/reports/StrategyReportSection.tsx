/**
 * Strategy Alpha Attribution & Performance Leaderboard Component
 */

import React from 'react';
import { StrategyReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Layers, Award, Target, TrendingUp, Zap } from 'lucide-react';

interface StrategyReportSectionProps {
  data: StrategyReportData;
}

export const StrategyReportSection: React.FC<StrategyReportSectionProps> = ({ data }) => {
  const { strategies, topPerformer, underPerformer } = data;

  return (
    <div className="space-y-6">
      {/* Top / Bottom Leaders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-400" />
              <span>Top Generating Strategy Alpha</span>
            </span>
            <div className="text-lg font-bold text-[#F3F4F6]">{topPerformer?.name || 'None'}</div>
            <span className="text-xs font-mono text-emerald-400">
              {topPerformer ? `+$${topPerformer.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${topPerformer.winRate.toFixed(1)}% WR)` : '—'}
            </span>
          </div>
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            ALPHA LEADER
          </span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-amber-400" />
              <span>Strategy Requiring Review / Optimization</span>
            </span>
            <div className="text-lg font-bold text-[#F3F4F6]">{underPerformer?.name || 'None'}</div>
            <span className={`text-xs font-mono ${(underPerformer?.netPnL || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {underPerformer ? `${underPerformer.netPnL >= 0 ? '+' : ''}$${underPerformer.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${underPerformer.winRate.toFixed(1)}% WR)` : '—'}
            </span>
          </div>
          <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold">
            AUDIT
          </span>
        </Card>
      </div>

      {/* Strategies Leaderboard Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Strategy Attribution & Expectancy Leaderboard</span>
            </div>
            <span className="text-xs text-[#848B98]">{strategies.length} Strategies Evaluated</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Strategy Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Expectancy (R)</th>
                  <th className="py-2.5 px-4 text-right">Avg Win</th>
                  <th className="py-2.5 px-4 text-right">Avg Loss</th>
                  <th className="py-2.5 px-4 text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {strategies.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">
                      {row.strategyName}
                      <span className="block text-[10px] text-[#848B98]">{row.strategyId}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1A1D24] text-[#C5C9D3] text-[10px] border border-[#2B303B]">
                        {row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-semibold ${row.expectancyR > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.expectancyR > 0 ? '+' : ''}{row.expectancyR.toFixed(2)}R
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">+${row.averageWin.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-${Math.abs(row.averageLoss).toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {strategies.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#848B98]">No strategy records found for the applied filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
