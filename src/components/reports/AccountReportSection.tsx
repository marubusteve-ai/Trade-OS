/**
 * Multi-Account Performance & Capital Allocation Audit Report Component
 */

import React from 'react';
import { AccountReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Briefcase, DollarSign, Percent, ShieldCheck, Wallet } from 'lucide-react';

interface AccountReportSectionProps {
  data: AccountReportData;
}

export const AccountReportSection: React.FC<AccountReportSectionProps> = ({ data }) => {
  const { accounts, aggregateTotals } = data;

  return (
    <div className="space-y-6">
      {/* Aggregate Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Combined Capital</span>
          <span className="text-xl font-bold font-mono text-[#F3F4F6]">
            ${aggregateTotals.totalCapital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">{aggregateTotals.totalAccounts} Managed Accounts</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Consolidated Net P&L</span>
          <span className={`text-xl font-bold font-mono ${aggregateTotals.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {aggregateTotals.totalNetPnL >= 0 ? '+' : ''}${aggregateTotals.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Blended Return: {aggregateTotals.blendedReturnPercent >= 0 ? '+' : ''}{aggregateTotals.blendedReturnPercent.toFixed(2)}%</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Trades Executed</span>
          <span className="text-xl font-bold font-mono text-blue-400">
            {aggregateTotals.totalTrades}
          </span>
          <span className="text-[10px] text-[#848B98] block">Across all accounts</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Friction & Commissions</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            ${aggregateTotals.totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Brokerage & swap costs</span>
        </Card>
      </div>

      {/* Accounts Breakdown Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-emerald-400" />
              <span>Multi-Account Audit Breakdown</span>
            </div>
            <span className="text-xs text-[#848B98]">{accounts.length} Accounts Listed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Account Name</th>
                  <th className="py-2.5 px-4">Type / Broker</th>
                  <th className="py-2.5 px-4 text-right">Starting</th>
                  <th className="py-2.5 px-4 text-right">Current Equity</th>
                  <th className="py-2.5 px-4 text-right">Net P&L</th>
                  <th className="py-2.5 px-4 text-right">Return %</th>
                  <th className="py-2.5 px-4 text-center">Trades</th>
                  <th className="py-2.5 px-4 text-right">Win Rate</th>
                  <th className="py-2.5 px-4 text-right">Profit Factor</th>
                  <th className="py-2.5 px-4 text-right">Max DD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {accounts.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#1A1D24] transition-colors">
                    <td className="py-2.5 px-4 font-medium text-[#F3F4F6]">
                      {row.accountName}
                      <span className="block text-[10px] text-[#848B98] font-mono">{row.accountId}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#1A1D24] text-[#C5C9D3] text-[10px] border border-[#2B303B]">
                        {row.accountType} • {row.broker}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#848B98]">
                      ${row.startingBalance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-[#F3F4F6]">
                      ${row.currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono font-bold ${row.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.netPnL >= 0 ? '+' : ''}${row.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`py-2.5 px-4 text-right font-mono ${row.returnPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {row.returnPercent >= 0 ? '+' : ''}{row.returnPercent.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-4 text-center text-[#848B98]">{row.tradesCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.winRate.toFixed(1)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">{row.profitFactor.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-400">-{row.maxDrawdownPercent.toFixed(2)}%</td>
                  </tr>
                ))}
                {accounts.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#848B98]">No account records found.</td>
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
