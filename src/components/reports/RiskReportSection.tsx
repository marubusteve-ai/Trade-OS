/**
 * Quantitative Risk & Exposure Audit Report Component
 */

import React from 'react';
import { RiskReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { ShieldAlert, AlertTriangle, Scale, Activity, Zap } from 'lucide-react';

interface RiskReportSectionProps {
  data: RiskReportData;
}

export const RiskReportSection: React.FC<RiskReportSectionProps> = ({ data }) => {
  const { summary, riskBudgetUsage, riskPerTradeDistribution, correlationCluster } = data;

  return (
    <div className="space-y-6">
      {/* Risk Metrics Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Max Historical Drawdown</span>
          <span className="text-xl font-bold font-mono text-rose-400">
            -{summary.maxDrawdownPercent.toFixed(2)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">-${summary.maxDrawdownAmount.toFixed(0)} peak-to-valley</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Value-at-Risk (95% Daily VaR)</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            ${summary.dailyVaR95.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">1-day 95% confidence threshold</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Avg Risk Per Trade (R$)</span>
          <span className="text-xl font-bold font-mono text-blue-400">
            ${summary.avgRiskPerTrade.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Avg {summary.avgRiskPercentPerTrade.toFixed(2)}% of equity</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Max Risk Violation</span>
          <span className="text-xl font-bold font-mono text-rose-400">
            {summary.maxRiskViolationPercent.toFixed(2)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">Single trade peak risk</span>
        </Card>
      </div>

      {/* Risk Budget Utilization */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-400" />
              <span>Multi-Timeframe Risk Budget Utilization</span>
            </div>
            <span className="text-xs text-[#848B98]">Risk Governance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Daily */}
            <div className="p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F3F4F6]">Daily Risk Budget</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskBudgetUsage.daily.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {riskBudgetUsage.daily.status}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-[#F3F4F6]">
                ${riskBudgetUsage.daily.used.toFixed(0)} / ${riskBudgetUsage.daily.budget.toFixed(0)}
              </div>
              <div className="w-full bg-[#1A1D24] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${riskBudgetUsage.daily.percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, riskBudgetUsage.daily.percentUsed)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#848B98] block">{riskBudgetUsage.daily.percentUsed.toFixed(1)}% utilized</span>
            </div>

            {/* Weekly */}
            <div className="p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F3F4F6]">Weekly Risk Budget</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskBudgetUsage.weekly.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {riskBudgetUsage.weekly.status}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-[#F3F4F6]">
                ${riskBudgetUsage.weekly.used.toFixed(0)} / ${riskBudgetUsage.weekly.budget.toFixed(0)}
              </div>
              <div className="w-full bg-[#1A1D24] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${riskBudgetUsage.weekly.percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, riskBudgetUsage.weekly.percentUsed)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#848B98] block">{riskBudgetUsage.weekly.percentUsed.toFixed(1)}% utilized</span>
            </div>

            {/* Monthly */}
            <div className="p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#F3F4F6]">Monthly Risk Budget</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  riskBudgetUsage.monthly.status === 'COMPLIANT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                }`}>
                  {riskBudgetUsage.monthly.status}
                </span>
              </div>
              <div className="text-base font-bold font-mono text-[#F3F4F6]">
                ${riskBudgetUsage.monthly.used.toFixed(0)} / ${riskBudgetUsage.monthly.budget.toFixed(0)}
              </div>
              <div className="w-full bg-[#1A1D24] h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full ${riskBudgetUsage.monthly.percentUsed > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, riskBudgetUsage.monthly.percentUsed)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#848B98] block">{riskBudgetUsage.monthly.percentUsed.toFixed(1)}% utilized</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Sizing Distribution Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Risk Per Trade Bucket Analysis</span>
            </div>
            <span className="text-xs text-[#848B98]">Execution sizing distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A]">
                <tr>
                  <th className="py-2.5 px-4">Risk Range (% Equity)</th>
                  <th className="py-2.5 px-4 text-center">Trades Count</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {riskPerTradeDistribution.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">{row.riskRange}</td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
