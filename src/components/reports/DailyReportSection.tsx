/**
 * Daily Performance & Execution Audit Report Component
 */

import React from 'react';
import { DailyReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { CalendarDays, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface DailyReportSectionProps {
  data: DailyReportData;
}

export const DailyReportSection: React.FC<DailyReportSectionProps> = ({ data }) => {
  const { days, totals, sessionBreakdown, hourlyDistribution } = data;

  return (
    <div className="space-y-6">
      {/* Totals Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Realized Net P&L</span>
          <span className={`text-xl font-bold font-mono ${totals.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.totalNetPnL >= 0 ? '+' : ''}${totals.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Across {totals.totalTradingDays} active trading days</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Day Win Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {totals.dayWinRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">{totals.profitableDays} Green / {totals.lossDays} Red / {totals.breakEvenDays} BE</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Average Daily P&L</span>
          <span className={`text-xl font-bold font-mono ${totals.avgDailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.avgDailyPnL >= 0 ? '+' : ''}${totals.avgDailyPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Expectancy per session</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Best vs Worst Day</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-emerald-400">+${totals.bestDay.netPnL.toFixed(0)}</span>
            <span className="text-[#848B98]">/</span>
            <span className="text-sm font-bold font-mono text-rose-400">-${Math.abs(totals.worstDay.netPnL).toFixed(0)}</span>
          </div>
          <span className="text-[10px] text-[#848B98] block">{totals.bestDay.date} / {totals.worstDay.date}</span>
        </Card>
      </div>

      {/* Daily P&L Chart */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-400" />
              <span>Daily Net P&L Distribution ($)</span>
            </div>
            <span className="text-xs text-[#848B98]">{days.length} Days Recorded</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            {days.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[...days].reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22252A" vertical={false} />
                  <XAxis dataKey="date" stroke="#848B98" fontSize={10} tickLine={false} />
                  <YAxis stroke="#848B98" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C0D0F', borderColor: '#22252A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Net P&L']}
                  />
                  <Bar dataKey="netPnL" radius={[4, 4, 0, 0]}>
                    {[...days].reverse().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.netPnL >= 0 ? '#10B981' : '#F43F5E'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#848B98]">
                No daily records match active filter criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Detailed Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold text-[#F3F4F6]">
            Itemized Daily Audit Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4 text-center">Trades (W/L)</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Gross Profit</th>
                  <th className="py-2.5 px-4 text-right">Gross Loss</th>
                  <th className="py-2.5 px-4 text-right">Commissions</th>
                  <th className="py-2.5 px-4 text-right">Net P&L</th>
                  <th className="py-2.5 px-4 text-center">Primary Asset</th>
                  <th className="py-2.5 px-4 text-center">Discipline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {days.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6] font-mono">{row.date}</td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">
                      {row.tradesCount} ({row.winningCount}W / {row.losingCount}L)
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">+${row.grossProfit.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-${row.grossLoss.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-amber-400">-${row.commissions.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-[#1A1D24] text-[#C5C9D3] font-mono text-[10px] border border-[#2B303B]">
                        {row.primaryAsset}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.disciplineScoreAvg >= 8
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : row.disciplineScoreAvg >= 6
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {row.disciplineScoreAvg}/10
                      </span>
                    </td>
                  </tr>
                ))}
                {days.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#848B98]">No daily trading data found for the selected filters.</td>
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
