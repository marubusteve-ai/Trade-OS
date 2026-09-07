/**
 * Comprehensive Itemized Trade Ledger Audit Report Component
 */

import React, { useState } from 'react';
import { TradeHistoryReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { ListOrdered, Search, ArrowUpRight, ArrowDownRight, Tag } from 'lucide-react';

interface TradeHistoryReportSectionProps {
  data: TradeHistoryReportData;
}

export const TradeHistoryReportSection: React.FC<TradeHistoryReportSectionProps> = ({ data }) => {
  const { trades, summary } = data;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrades = trades.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(term) ||
      t.strategyName.toLowerCase().includes(term) ||
      t.direction.toLowerCase().includes(term) ||
      t.assetClass.toLowerCase().includes(term) ||
      (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(term)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Ledger Totals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Realized Net P&L</span>
          <span className={`text-xl font-bold font-mono ${summary.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {summary.totalNetPnL >= 0 ? '+' : ''}${summary.totalNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">{summary.totalTrades} Executed Trades</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Win Rate</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            {summary.winRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-[#848B98] block">{summary.winningTrades} Winners / {summary.losingTrades} Losers</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Profit Factor</span>
          <span className="text-xl font-bold font-mono text-purple-400">
            {summary.profitFactor.toFixed(2)}
          </span>
          <span className="text-[10px] text-[#848B98] block">Avg R: {summary.avgRMultiple > 0 ? '+' : ''}{summary.avgRMultiple.toFixed(2)}R</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <span className="text-[11px] text-[#848B98] block">Total Commissions & Fees</span>
          <span className="text-xl font-bold font-mono text-amber-400">
            ${summary.totalCommissions.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-[#848B98] block">Execution friction</span>
        </Card>
      </div>

      {/* Ledger Table */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-3 border-b border-[#22252A]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-[#F3F4F6]">
              <ListOrdered className="h-4 w-4 text-emerald-400" />
              <span>Full Itemized Transaction Ledger</span>
            </CardTitle>
            <div className="w-full sm:w-64 relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#848B98]" />
              <Input
                type="text"
                placeholder="Filter symbol, strategy, tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 py-1 text-xs bg-[#0C0D0F] border-[#22252A]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0C0D0F] text-[#848B98] text-[10px] uppercase font-semibold border-b border-[#22252A] sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Open Date</th>
                  <th className="py-2.5 px-4">Symbol</th>
                  <th className="py-2.5 px-4 text-center">Side</th>
                  <th className="py-2.5 px-4 text-right">Quantity</th>
                  <th className="py-2.5 px-4 text-right">Entry</th>
                  <th className="py-2.5 px-4 text-right">Exit</th>
                  <th className="py-2.5 px-4 text-right">R-Multiple</th>
                  <th className="py-2.5 px-4 text-right">Net P&L</th>
                  <th className="py-2.5 px-4">Strategy</th>
                  <th className="py-2.5 px-4">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {filteredTrades.map((t) => {
                  const isLong = t.direction === 'LONG';
                  const isWin = t.netPnL > 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#1A1D24] transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-[#C5C9D3] whitespace-nowrap">
                        {t.openDate}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-[#F3F4F6] font-mono">
                        {t.symbol}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isLong ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {isLong ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#F3F4F6]">
                        {t.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#848B98]">
                        ${t.entryPrice.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#848B98]">
                        ${t.exitPrice ? t.exitPrice.toFixed(2) : '—'}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-semibold ${t.rMultiple && t.rMultiple > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.rMultiple !== undefined ? `${t.rMultiple > 0 ? '+' : ''}${t.rMultiple.toFixed(2)}R` : '—'}
                      </td>
                      <td className={`py-2.5 px-4 text-right font-mono font-bold ${isWin ? 'text-emerald-400' : t.netPnL < 0 ? 'text-rose-400' : 'text-[#848B98]'}`}>
                        {t.netPnL >= 0 ? '+' : ''}${t.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-4 text-[#848B98] truncate max-w-[120px]">
                        {t.strategyName}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {t.tags && t.tags.length > 0 ? (
                            t.tags.map((tag, idx) => (
                              <span key={idx} className="px-1.5 py-0.5 rounded bg-[#1A1D24] text-[#848B98] text-[9px] border border-[#2B303B]">
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#848B98]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredTrades.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-[#848B98]">
                      No trades matched the criteria or search filter.
                    </td>
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
