/**
 * Playbook Execution & Setup Discipline Audit Report Component
 */

import React from 'react';
import { PlaybookReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { BookOpen, CheckCircle, Target, Sparkles, TrendingUp } from 'lucide-react';

interface PlaybookReportSectionProps {
  data: PlaybookReportData;
}

export const PlaybookReportSection: React.FC<PlaybookReportSectionProps> = ({ data }) => {
  const { playbooks, checklistComplianceStats } = data;

  return (
    <div className="space-y-6">
      {/* Checklist Compliance Impact Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Mean Checklist Adherence</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {checklistComplianceStats.avgScorePercent.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">Across {checklistComplianceStats.totalEvaluatedTrades} evaluated setups</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">High Adherence P&L (Score ≥ 80%)</span>
          <span className={`text-xl font-bold font-mono ${checklistComplianceStats.pnlWithHighChecklist >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {checklistComplianceStats.pnlWithHighChecklist >= 0 ? '+' : ''}${checklistComplianceStats.pnlWithHighChecklist.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">{checklistComplianceStats.fullChecklistTradesCount} Disciplined Trades</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Low Adherence P&L (Score &lt; 80%)</span>
          <span className={`text-xl font-bold font-mono ${checklistComplianceStats.pnlWithLowChecklist >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {checklistComplianceStats.pnlWithLowChecklist >= 0 ? '+' : ''}${checklistComplianceStats.pnlWithLowChecklist.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Rule deviations & premature entries</span>
        </Card>
      </div>

      {/* Playbooks Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-400" />
              <span>Playbook Execution & Setup Discipline Ledger</span>
            </div>
            <span className="text-xs text-[#848B98]">{playbooks.length} Playbooks Active</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Playbook Title</th>
                  <th className="py-2.5 px-4">Market Phase</th>
                  <th className="py-2.5 px-4 text-center">Setups</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Avg Achieved R</th>
                  <th className="py-2.5 px-4 text-center">Checklist Adherence</th>
                  <th className="py-2.5 px-4 text-right">Net Realized P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {playbooks.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">
                      {row.playbookTitle}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1A1D24] text-[#C5C9D3] text-[10px] border border-[#2B303B]">
                        {row.marketPhase}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.setupsCount}</td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className={`py-2.5 px-4 text-right font-mono ${row.averageAchievedR > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.averageAchievedR > 0 ? '+' : ''}{row.averageAchievedR.toFixed(2)}R
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          row.checklistAdherenceRate >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {row.checklistAdherenceRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {playbooks.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-[#848B98]">No playbook records available.</td>
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
