/**
 * Weekly Performance Rollup & Consistency Report Component
 */

import React from 'react';
import { WeeklyReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CalendarRange, TrendingUp, CheckCircle, Award } from 'lucide-react';

interface WeeklyReportSectionProps {
  data: WeeklyReportData;
}

export const WeeklyReportSection: React.FC<WeeklyReportSectionProps> = ({ data }) => {
  const { weeks, totals } = data;

  return (
    <div className="space-y-6">
      {/* Weekly Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Weekly Net P&L</span>
          <span className={`text-xl font-bold font-mono ${totals.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.totalNetPnL >= 0 ? '+' : ''}${totals.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">{totals.totalWeeks} Active Trading Weeks</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Weekly Win Consistency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {totals.weeklyWinRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">{totals.profitableWeeks} Profitable / {totals.lossWeeks} Losing Weeks</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Average Weekly P&L</span>
          <span className={`text-xl font-bold font-mono ${totals.avgWeeklyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.avgWeeklyPnL >= 0 ? '+' : ''}${totals.avgWeeklyPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Mean weekly return</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Best vs Worst Week</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold font-mono text-emerald-400">+${totals.bestWeek.netPnL.toFixed(0)}</span>
            <span className="text-[#848B98]">/</span>
            <span className="text-sm font-bold font-mono text-rose-400">-${Math.abs(totals.worstWeek.netPnL).toFixed(0)}</span>
          </div>
          <span className="text-[10px] text-[#848B98] block truncate">{totals.bestWeek.weekLabel}</span>
        </Card>
      </div>

      {/* Cumulative Weekly P&L Chart */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-emerald-400" />
              <span>Cumulative Weekly Return Progression ($)</span>
            </div>
            <span className="text-xs text-[#848B98]">{weeks.length} Weeks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            {weeks.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...weeks].reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22252A" vertical={false} />
                  <XAxis dataKey="startDate" stroke="#848B98" fontSize={10} tickLine={false} />
                  <YAxis stroke="#848B98" fontSize={10} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C0D0F', borderColor: '#22252A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Cumulative P&L']}
                  />
                  <Line type="monotone" dataKey="cumPnL" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#848B98]">
                No weekly records match active filter criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold text-[#F3F4F6]">
            Weekly Consistency Ledger
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Week Interval</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Gross Profit</th>
                  <th className="py-2.5 px-4 text-right">Gross Loss</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Net P&L</th>
                  <th className="py-2.5 px-4 text-right">Avg R</th>
                  <th className="py-2.5 px-4 text-right">Cumulative</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {weeks.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">
                      <span className="font-mono">{row.startDate}</span> to <span className="font-mono">{row.endDate}</span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">+${row.grossProfit.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-${row.grossLoss.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono ${row.avgRMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.avgRMultiple > 0 ? '+' : ''}{row.avgRMultiple.toFixed(2)}R
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-semibold ${row.cumPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${row.cumPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {weeks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#848B98]">No weekly trading periods found.</td>
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
