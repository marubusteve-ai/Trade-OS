/**
 * High-Contrast Print-Optimized Institutional Tearsheet
 */

import React from 'react';
import { GeneratedReportData } from '../../types/reports';
import { ShieldCheck, Award } from 'lucide-react';

interface PrintableTearsheetProps {
  reportData: GeneratedReportData;
}

export const PrintableTearsheet: React.FC<PrintableTearsheetProps> = ({ reportData }) => {
  const generatedDate = new Date(reportData.generatedAt).toLocaleString();

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6">
      {/* Header with Title and Metadata */}
      <div className="flex items-start justify-between border-b-2 border-black pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-black">
              TradeOS • Institutional Audit Tearsheet
            </h1>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-0.5">
            {reportData.reportTitle}
          </p>
          <div className="text-xs text-gray-500 mt-1 space-x-3">
            <span>Account: <strong>{reportData.appliedFilters.accountName}</strong></span>
            <span>•</span>
            <span>Date Range: <strong>{reportData.appliedFilters.datePreset}</strong></span>
            <span>•</span>
            <span>Trades Evaluated: <strong>{reportData.tradeCount}</strong></span>
          </div>
        </div>

        <div className="text-right text-xs text-gray-500">
          <div>Report Ref: <strong className="font-mono">{reportData.reportId.slice(0, 16)}</strong></div>
          <div>Generated: {generatedDate}</div>
          <div className="mt-1 font-bold text-emerald-800 uppercase tracking-widest text-[10px]">
            OFFICIAL AUDIT COPY
          </div>
        </div>
      </div>

      {/* Summary Content based on report type */}
      <div className="space-y-4">
        {reportData.reportType === 'EXECUTIVE_SUMMARY' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold uppercase border-b border-gray-300 pb-1">Performance Highlights</h2>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="border p-2">
                <span className="text-gray-500 block">Total Net Realized P&L</span>
                <span className="text-base font-bold font-mono">
                  ${(reportData as any).metrics.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border p-2">
                <span className="text-gray-500 block">Win Rate</span>
                <span className="text-base font-bold font-mono">
                  {(reportData as any).metrics.winRate.toFixed(1)}%
                </span>
              </div>
              <div className="border p-2">
                <span className="text-gray-500 block">Profit Factor</span>
                <span className="text-base font-bold font-mono">
                  {(reportData as any).metrics.profitFactor.toFixed(2)}
                </span>
              </div>
              <div className="border p-2">
                <span className="text-gray-500 block">Sharpe Ratio</span>
                <span className="text-base font-bold font-mono">
                  {(reportData as any).metrics.sharpeRatio.toFixed(2)}
                </span>
              </div>
              <div className="border p-2">
                <span className="text-gray-500 block">Max Drawdown</span>
                <span className="text-base font-bold font-mono">
                  -{(reportData as any).metrics.maxDrawdownPercent.toFixed(2)}% (${(reportData as any).metrics.maxDrawdownAmount.toFixed(0)})
                </span>
              </div>
              <div className="border p-2">
                <span className="text-gray-500 block">Expectancy per Trade</span>
                <span className="text-base font-bold font-mono">
                  ${(reportData as any).metrics.expectancy.toFixed(2)} ({(reportData as any).metrics.expectancyRMultiple.toFixed(2)}R)
                </span>
              </div>
            </div>
          </div>
        )}

        {reportData.reportType === 'PROP_FIRM' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold uppercase border-b border-gray-300 pb-1">Prop Firm Compliance Audit</h2>
            <div className="border p-4 bg-gray-50 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-sm">
                <span>Compliance Result: {(reportData as any).overallCompliance}</span>
                <span>Score: {(reportData as any).complianceScore}/100</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                <div>Profit Progress: ${(reportData as any).currentBalance - (reportData as any).startingBalance} / ${(reportData as any).profitTargetAmount} ({(reportData as any).profitProgressPercent.toFixed(1)}%)</div>
                <div>Daily Loss: ${(reportData as any).todaysLossAmount.toFixed(2)} / Max Limit ${(reportData as any).dailyLossLimitAmount.toFixed(2)}</div>
                <div>Max Drawdown: ${(reportData as any).currentDrawdownAmount.toFixed(2)} ({(reportData as any).currentDrawdownPercent.toFixed(2)}%) / Max Limit ${(reportData as any).maxDrawdownLimitAmount.toFixed(2)}</div>
                <div>Trading Days: {(reportData as any).currentTradingDays} / Min Required {(reportData as any).minTradingDaysRequired} Days</div>
              </div>
            </div>
          </div>
        )}

        {/* Generic Itemized Data Table */}
        <div>
          <h2 className="text-base font-bold uppercase border-b border-gray-300 pb-1 mt-6">Audit Breakdown Ledger</h2>
          <p className="text-xs text-gray-500 mt-1">
            Certified calculation from deterministic trade log database. Zero estimated values.
          </p>
        </div>
      </div>

      {/* Official Sign-off and Disclaimer */}
      <div className="border-t-2 border-black pt-6 mt-12 grid grid-cols-2 gap-8 text-xs">
        <div>
          <span className="font-bold block text-gray-700">AUDITOR / TRADER SIGN-OFF</span>
          <div className="border-b border-black mt-8 mb-1"></div>
          <span className="text-[10px] text-gray-500">Authorized Signature & Date</span>
        </div>
        <div className="text-[10px] text-gray-500 leading-relaxed">
          <span className="font-bold block text-gray-700">COMPLIANCE & RISK DISCLAIMER</span>
          This report is programmatically generated by TradeOS using timestamped transaction ledger entries.
          Metrics including Sharpe ratio, Expectancy, Drawdown, and Win Rates are computed using standard quantitative finance conventions.
        </div>
      </div>
    </div>
  );
};
