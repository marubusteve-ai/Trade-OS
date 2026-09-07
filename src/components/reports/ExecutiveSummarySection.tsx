/**
 * Executive Summary Tearsheet Component
 */

import React from 'react';
import { ExecutiveSummaryReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Award, Shield, DollarSign, Activity, Target, Zap, Clock } from 'lucide-react';

interface ExecutiveSummarySectionProps {
  data: ExecutiveSummaryReportData;
}

export const ExecutiveSummarySection: React.FC<ExecutiveSummarySectionProps> = ({ data }) => {
  const { metrics, equityCurve, keyHighlights, monthlyReturnSummary, assetBreakdown, riskOverview } = data;

  return (
    <div className="space-y-6">
      {/* Key Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {keyHighlights.map((item, idx) => (
          <Card key={idx} className="p-4 bg-[#121418] border-[#22252A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#848B98]">{item.label}</span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  item.status === 'POSITIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : item.status === 'NEGATIVE'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                }`}
              >
                {item.status}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-[#F3F4F6] tracking-tight">{item.value}</div>
            <p className="text-[11px] text-[#848B98] leading-tight">{item.description}</p>
          </Card>
        ))}
      </div>

      {/* Main Quantitative Matrix Strip */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Institutional Metric Scorecard</span>
            </div>
            <span className="text-xs font-normal text-[#848B98]">
              {data.appliedFilters.accountName} • {data.tradeCount} Trades
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Win Rate</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">{metrics.winRate.toFixed(1)}%</span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">{metrics.winningTradesCount}W / {metrics.losingTradesCount}L</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Profit Factor</span>
              <span className={`text-sm font-bold font-mono ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {metrics.profitFactor.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">Payoff: {metrics.payoffRatio.toFixed(2)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Sharpe / Sortino</span>
              <span className="text-sm font-bold text-purple-400 font-mono">
                {metrics.sharpeRatio.toFixed(2)} / {metrics.sortinoRatio.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">Calmar: {metrics.calmarRatio.toFixed(2)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Expectancy (R)</span>
              <span className={`text-sm font-bold font-mono ${metrics.expectancyRMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.expectancyRMultiple > 0 ? '+' : ''}{metrics.expectancyRMultiple.toFixed(2)}R
              </span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">${metrics.expectancy.toFixed(2)} / trade</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Max Drawdown</span>
              <span className="text-sm font-bold text-rose-400 font-mono">
                -{metrics.maxDrawdownPercent.toFixed(2)}%
              </span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">-${metrics.maxDrawdownAmount.toFixed(0)}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
              <span className="text-[#848B98] block text-[10px]">Average Duration</span>
              <span className="text-sm font-bold text-blue-400 font-mono">
                {metrics.avgDurationMinutes < 60 ? `${metrics.avgDurationMinutes}m` : `${Math.round(metrics.avgDurationMinutes / 60)}h ${metrics.avgDurationMinutes % 60}m`}
              </span>
              <span className="text-[10px] text-[#848B98] block mt-0.5">Commissions: ${metrics.totalCommissions.toFixed(0)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equity & Drawdown Chart Section */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#F3F4F6]">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <span>Cumulative Equity Curve & High-Water Mark ($)</span>
            </CardTitle>
            <span className="text-xs text-[#848B98]">
              Final Capital: <strong className="text-emerald-400 font-mono">${metrics.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            {equityCurve.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22252A" vertical={false} />
                  <XAxis dataKey="date" stroke="#848B98" fontSize={10} tickLine={false} />
                  <YAxis stroke="#848B98" fontSize={10} tickLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C0D0F', borderColor: '#22252A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Equity']}
                  />
                  <Area type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2} fill="url(#equityGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#848B98]">
                No trades match active filter criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Return Matrix & Asset Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Return Table */}
        <Card className="bg-[#121418] border-[#22252A]">
          <CardHeader className="pb-3 border-b border-[#22252A]">
            <CardTitle className="text-sm font-semibold text-[#F3F4F6] flex items-center justify-between">
              <span>Monthly Return Breakdown</span>
              <span className="text-xs text-[#848B98]">{monthlyReturnSummary.length} Periods</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Month</th>
                    <th className="py-2.5 px-4 text-right">Net P&L</th>
                    <th className="py-2.5 px-4 text-right">Return %</th>
                    <th className="py-2.5 px-4 text-right">Win Rate</th>
                    <th className="py-2.5 px-4 text-right">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22252A]">
                  {monthlyReturnSummary.map((m, idx) => (
                    <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">{m.month}</td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${m.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.netPnL >= 0 ? '+' : ''}${m.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono ${m.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {m.returnPercent >= 0 ? '+' : ''}{m.returnPercent.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{m.winRate.toFixed(1)}%</td>
                      <td className="py-2.5 px-4 text-right text-[#848B98]">{m.tradesCount}</td>
                    </tr>
                  ))}
                  {monthlyReturnSummary.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#848B98]">No monthly records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Asset Class Distribution */}
        <Card className="bg-[#121418] border-[#22252A]">
          <CardHeader className="pb-3 border-b border-[#22252A]">
            <CardTitle className="text-sm font-semibold text-[#F3F4F6] flex items-center justify-between">
              <span>Asset Class Allocation & Profitability</span>
              <span className="text-xs text-[#848B98]">{assetBreakdown.length} Classes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-4">Asset Class</th>
                    <th className="py-2.5 px-4 text-right">Net P&L</th>
                    <th className="py-2.5 px-4 text-right">Profit Factor</th>
                    <th className="py-2.5 px-4 text-right">Win Rate</th>
                    <th className="py-2.5 px-4 text-right">Trades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22252A]">
                  {assetBreakdown.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                      <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">{item.label}</td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.netPnL >= 0 ? '+' : ''}${item.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{item.profitFactor.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{item.winRate.toFixed(1)}%</td>
                      <td className="py-2.5 px-4 text-right text-[#848B98]">{item.tradesCount}</td>
                    </tr>
                  ))}
                  {assetBreakdown.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#848B98]">No asset class records</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
