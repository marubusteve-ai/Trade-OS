/**
 * Psychology, Discipline & Mistake Impact Audit Report Component
 */

import React from 'react';
import { PsychologyReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Brain, AlertOctagon, CheckCircle2, XCircle, Sparkles, TrendingUp } from 'lucide-react';

interface PsychologyReportSectionProps {
  data: PsychologyReportData;
}

export const PsychologyReportSection: React.FC<PsychologyReportSectionProps> = ({ data }) => {
  const { summary, emotionalImpacts, mistakeFrequency, planComplianceImpact } = data;

  return (
    <div className="space-y-6">
      {/* Plan Discipline Impact Hero Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4 bg-[#121418] border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-[#F3F4F6]">Followed Trading Plan</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              DISCIPLINED
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-xl font-bold font-mono ${planComplianceImpact.followedPlanPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {planComplianceImpact.followedPlanPnL >= 0 ? '+' : ''}${planComplianceImpact.followedPlanPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#848B98]">
              {planComplianceImpact.followedPlanCount} Trades ({planComplianceImpact.followedPlanWinRate.toFixed(1)}% WR)
            </span>
          </div>
          <p className="text-[11px] text-[#848B98]">Executions where entry, risk sizing, and rules were strictly respected.</p>
        </Card>

        <Card className="p-4 bg-[#121418] border-rose-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-rose-400" />
              <span className="font-semibold text-[#F3F4F6]">Deviated from Plan / Impulsive</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
              RULE BREACH
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className={`text-xl font-bold font-mono ${planComplianceImpact.deviatedPlanPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {planComplianceImpact.deviatedPlanPnL >= 0 ? '+' : ''}${planComplianceImpact.deviatedPlanPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-[#848B98]">
              {planComplianceImpact.deviatedPlanCount} Trades ({planComplianceImpact.deviatedPlanWinRate.toFixed(1)}% WR)
            </span>
          </div>
          <p className="text-[11px] text-[#848B98]">FOMO, oversized entries, moving stop losses, or revenge executions.</p>
        </Card>
      </div>

      {/* Emotional State Impact Matrix */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-emerald-400" />
              <span>Emotional State vs Execution Quality & P&L</span>
            </div>
            <span className="text-xs text-[#848B98]">{emotionalImpacts.length} Emotional States</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A]">
                <tr>
                  <th className="py-2.5 px-4">Pre-Trade Emotion</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-center">Avg Discipline</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {emotionalImpacts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">
                      <span className="px-2 py-0.5 rounded bg-[#1A1D24] font-mono text-[11px] border border-[#2B303B]">
                        {row.emotion}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        row.avgDiscipline >= 8 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'
                      }`}>
                        {row.avgDiscipline}/10
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {emotionalImpacts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#848B98]">No emotional logs recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Mistakes and Capital Drain */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <AlertOctagon className="h-4 w-4 text-rose-400" />
              <span>Mistake Taxonomy & Capital Drain Attribution</span>
            </div>
            <span className="text-xs text-[#848B98]">{mistakeFrequency.length} Tracked Mistakes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A]">
                <tr>
                  <th className="py-2.5 px-4">Mistake Description</th>
                  <th className="py-2.5 px-4 text-center">Frequency</th>
                  <th className="py-2.5 px-4 text-right">Avg Loss / Occurrence</th>
                  <th className="py-2.5 px-4 text-right">Total Capital Drained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {mistakeFrequency.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">{row.mistake}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-[#848B98]">{row.count} times</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-${row.avgLossPerOccurrence.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                      -${row.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {mistakeFrequency.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#848B98]">Zero mistake patterns logged in selected period! Pristine discipline.</td>
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
