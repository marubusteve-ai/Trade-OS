/**
 * Monthly Performance Statement & Yearly Matrix Component
 */

import React from 'react';
import { MonthlyReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Calendar, TrendingUp, DollarSign, Percent, ShieldCheck } from 'lucide-react';

interface MonthlyReportSectionProps {
  data: MonthlyReportData;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const MonthlyReportSection: React.FC<MonthlyReportSectionProps> = ({ data }) => {
  const { months, totals, yearlyMatrix } = data;

  return (
    <div className="space-y-6">
      {/* Monthly Summary Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Realized Return</span>
          <span className={`text-xl font-bold font-mono ${totals.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.totalNetPnL >= 0 ? '+' : ''}${totals.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">{totals.totalMonths} Closed Accounting Months</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Monthly Win Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {totals.monthlyWinRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">{totals.profitableMonths} Profitable / {totals.lossMonths} Loss</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Average Monthly Return</span>
          <span className={`text-xl font-bold font-mono ${totals.avgMonthlyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.avgMonthlyPnL >= 0 ? '+' : ''}${totals.avgMonthlyPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Mean monthly net P&L</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Annualized Yield Estimate</span>
          <span className={`text-xl font-bold font-mono ${totals.annualizedReturnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totals.annualizedReturnPercent >= 0 ? '+' : ''}{totals.annualizedReturnPercent.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">Extrapolated CAGR</span>
        </Card>
      </div>

      {/* Yearly Matrix Heatmap */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Yearly Monthly Performance Heatmap Matrix</span>
            </div>
            <span className="text-xs text-[#848B98]">P&L ($)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="border-b border-[#22252A] text-[#848B98] text-[10px] uppercase">
                  <th className="py-2 px-3 text-left">Year</th>
                  {MONTH_ABBR.map((m) => (
                    <th key={m} className="py-2 px-2">{m}</th>
                  ))}
                  <th className="py-2 px-3 text-right">Year Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {yearlyMatrix.map((yRow) => (
                  <tr key={yRow.year} className="hover:bg-[#1A1D24]">
                    <td className="py-3 px-3 text-left font-bold font-mono text-[#F3F4F6]">{yRow.year}</td>
                    {yRow.months.map((val, mIdx) => {
                      let cellClass = 'bg-[#0C0D0F] text-[#848B98]';
                      if (val !== null) {
                        if (val > 0) {
                          cellClass = val > 2000 ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'bg-emerald-500/10 text-emerald-400';
                        } else if (val < 0) {
                          cellClass = val < -2000 ? 'bg-rose-500/20 text-rose-300 font-bold' : 'bg-rose-500/10 text-rose-400';
                        } else {
                          cellClass = 'bg-[#16181D] text-[#848B98]';
                        }
                      }
                      return (
                        <td key={mIdx} className="p-1">
                          <div className={`py-2 px-1 rounded font-mono text-[11px] ${cellClass}`}>
                            {val !== null ? `${val >= 0 ? '+' : ''}$${val.toFixed(0)}` : '—'}
                          </div>
                        </td>
                      );
                    })}
                    <td className={`py-3 px-3 text-right font-mono font-bold ${yRow.totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {yRow.totalPnL >= 0 ? '+' : ''}${yRow.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {yearlyMatrix.length === 0 && (
                  <tr>
                    <td colSpan={14} className="py-6 text-center text-[#848B98]">No yearly matrix records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Statement Breakdown Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold text-[#F3F4F6]">
            Monthly Performance Statements & Risk Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Period</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Gross Profit</th>
                  <th className="py-2.5 px-4 text-right">Gross Loss</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Net P&L</th>
                  <th className="py-2.5 px-4 text-right">Return %</th>
                  <th className="py-2.5 px-4 text-right">Sharpe</th>
                  <th className="py-2.5 px-4 text-right">Max DD %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {months.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">{row.monthName}</td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-400">+${row.grossProfit.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-${row.grossLoss.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono ${row.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.returnPercent >= 0 ? '+' : ''}{row.returnPercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-purple-400">{row.sharpeRatio.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-{row.maxDrawdownPercent.toFixed(2)}%</td>
                  </tr>
                ))}
                {months.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#848B98]">No monthly statements available.</td>
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
