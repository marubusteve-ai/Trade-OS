/**
 * Export Center Component
 * 
 * Provides flexible CSV and JSON data export with account filters,
 * date bounds, outcome segmentation, and metadata preservation.
 */

import React, { useState, useMemo } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  FileJson, 
  Filter, 
  CheckCircle2, 
  Layers, 
  Database, 
  Calendar, 
  Tag, 
  TrendingUp,
  Copy,
  Check
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useNotification } from '../../context/NotificationContext';
import { Trade, AssetClass, TradeDirection } from '../../types/domain';
import { ExportFormat } from '../../types/importExport';
import { formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Select, Input } from '../ui/Input';

export const ExportCenter: React.FC = () => {
  const { 
    trades, 
    accounts, 
    selectedAccountId, 
    strategies,
    exportTradesToCsv,
    exportTradesToJson 
  } = useTradeOS();
  const { notify } = useNotification();

  // Filters
  const [filterAccount, setFilterAccount] = useState<string>(selectedAccountId || 'ALL');
  const [filterOutcome, setFilterOutcome] = useState<'WIN' | 'LOSS' | 'BREAKEVEN' | 'ALL'>('ALL');
  const [filterAssetClass, setFilterAssetClass] = useState<AssetClass | 'ALL'>('ALL');
  const [filterDirection, setFilterDirection] = useState<TradeDirection | 'ALL'>('ALL');
  const [filterStrategyId, setFilterStrategyId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Export options
  const [exportFormat, setExportFormat] = useState<ExportFormat>('CSV');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Compute filtered subset
  const filteredTrades = useMemo(() => {
    return trades.filter(t => {
      if (filterAccount !== 'ALL' && t.accountId !== filterAccount) return false;
      if (filterOutcome !== 'ALL' && t.outcome !== filterOutcome) return false;
      if (filterAssetClass !== 'ALL' && t.assetClass !== filterAssetClass) return false;
      if (filterDirection !== 'ALL' && t.direction !== filterDirection) return false;
      if (filterStrategyId !== 'ALL' && t.strategyId !== filterStrategyId) return false;
      if (startDate && new Date(t.entryDate) < new Date(startDate)) return false;
      if (endDate && new Date(t.entryDate) > new Date(endDate)) return false;
      return true;
    });
  }, [trades, filterAccount, filterOutcome, filterAssetClass, filterDirection, filterStrategyId, startDate, endDate]);

  const totalNetPnL = filteredTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
  const winCount = filteredTrades.filter(t => t.outcome === 'WIN').length;
  const winRate = filteredTrades.length > 0 ? (winCount / filteredTrades.length) * 100 : 0;

  const handleDownloadExport = () => {
    try {
      let content = '';
      let mimeType = '';
      let extension = '';

      const accountName = filterAccount !== 'ALL' 
        ? (accounts.find(a => a.id === filterAccount)?.name || 'account').replace(/\s+/g, '_')
        : 'All_Accounts';

      const dateTag = new Date().toISOString().split('T')[0];

      if (exportFormat === 'CSV') {
        content = exportTradesToCsv(filteredTrades);
        mimeType = 'text/csv;charset=utf-8;';
        extension = 'csv';
      } else {
        content = exportTradesToJson(filteredTrades);
        mimeType = 'application/json;charset=utf-8;';
        extension = 'json';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TradeOS_${accountName}_${dateTag}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      notify.success(
        'Export Generated', 
        `Downloaded ${filteredTrades.length} trades in ${exportFormat} format.`
      );
    } catch (err: any) {
      notify.error('Export Failed', err?.message || 'Error creating export file.');
    }
  };

  const handleCopyToClipboard = () => {
    try {
      const content = exportFormat === 'CSV' 
        ? exportTradesToCsv(filteredTrades)
        : exportTradesToJson(filteredTrades);

      navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      notify.info('Copied to Clipboard', `Copied ${filteredTrades.length} records.`);
    } catch {
      notify.error('Copy Failed', 'Could not copy to clipboard.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Filters & Scope */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4 text-emerald-400" />
              <span>Export Scope & Filter Engine</span>
            </CardTitle>
            <CardDescription>
              Select accounts, date range, strategy tags, and trade outcome criteria to export.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  Trading Account
                </label>
                <Select
                  value={filterAccount}
                  onChange={(e) => setFilterAccount(e.target.value)}
                >
                  <option value="ALL">All Trading Accounts (Global Desk)</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  Outcome Segment
                </label>
                <Select
                  value={filterOutcome}
                  onChange={(e) => setFilterOutcome(e.target.value as any)}
                >
                  <option value="ALL">All Outcomes (Wins, Losses, Breakeven)</option>
                  <option value="WIN">Winners Only (Net PnL &gt; $0)</option>
                  <option value="LOSS">Losses Only (Net PnL &lt; $0)</option>
                  <option value="BREAKEVEN">Breakeven Only</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  Asset Class
                </label>
                <Select
                  value={filterAssetClass}
                  onChange={(e) => setFilterAssetClass(e.target.value as any)}
                >
                  <option value="ALL">All Asset Classes</option>
                  <option value="FOREX">Forex</option>
                  <option value="INDICES">Indices / Futures</option>
                  <option value="COMMODITIES">Commodities (Gold/Oil)</option>
                  <option value="CRYPTO">Crypto</option>
                  <option value="EQUITIES">Equities</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  Direction
                </label>
                <Select
                  value={filterDirection}
                  onChange={(e) => setFilterDirection(e.target.value as any)}
                >
                  <option value="ALL">Both Directions (Long & Short)</option>
                  <option value="LONG">Longs Only</option>
                  <option value="SHORT">Shorts Only</option>
                </Select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                  End Date
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Reset */}
            <div className="pt-2 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterAccount('ALL');
                  setFilterOutcome('ALL');
                  setFilterAssetClass('ALL');
                  setFilterDirection('ALL');
                  setFilterStrategyId('ALL');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-[#848B98]"
              >
                Reset All Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview of matched trades */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Matched Dataset Sample ({filteredTrades.length} trades)</span>
              <span className="text-xs font-mono font-normal text-[#848B98]">Showing first 5 rows</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#121417] text-[#848B98] uppercase text-[11px] border-b border-[#22252A]">
                  <tr>
                    <th className="py-2.5 px-3">Symbol</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3">Entry Date</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Net PnL</th>
                    <th className="py-2.5 px-3">R-Mult</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1A1D21] bg-[#0C0D0F]">
                  {filteredTrades.slice(0, 5).map(t => (
                    <tr key={t.id} className="hover:bg-[#14171A]">
                      <td className="py-2 px-3 font-bold text-white">{t.instrument}</td>
                      <td className="py-2 px-3">
                        <span className={t.direction === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#D1D5DB]">{t.entryDate.slice(0, 10)}</td>
                      <td className="py-2 px-3 text-[#D1D5DB]">{t.entryPrice}</td>
                      <td className="py-2 px-3 text-[#D1D5DB]">{t.quantity}</td>
                      <td className="py-2 px-3 font-bold">
                        <span className={t.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {formatCurrency(t.netPnL)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#848B98]">{t.achievedRMultiple ? `${t.achievedRMultiple}R` : '-'}</td>
                    </tr>
                  ))}
                  {filteredTrades.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#606773] font-sans">
                        No trades match the current filter selection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Format Selection & Download Trigger */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="h-4 w-4 text-emerald-400" />
              <span>Download Archive</span>
            </CardTitle>
            <CardDescription>
              Select your desired file format.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format toggle pills */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => setExportFormat('CSV')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  exportFormat === 'CSV'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#22252A] bg-[#0C0D0F] hover:border-[#2A2E35]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileSpreadsheet className={`h-4 w-4 ${exportFormat === 'CSV' ? 'text-emerald-400' : 'text-[#848B98]'}`} />
                  <span className="text-xs font-bold text-white">RFC-4180 CSV</span>
                </div>
                <p className="text-[11px] text-[#848B98]">Universal spreadsheet format for Excel, Sheets, or custom quant backtesting.</p>
              </div>

              <div 
                onClick={() => setExportFormat('JSON')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  exportFormat === 'JSON'
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-[#22252A] bg-[#0C0D0F] hover:border-[#2A2E35]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileJson className={`h-4 w-4 ${exportFormat === 'JSON' ? 'text-emerald-400' : 'text-[#848B98]'}`} />
                  <span className="text-xs font-bold text-white">Full JSON Archive</span>
                </div>
                <p className="text-[11px] text-[#848B98]">Complete hierarchical schema including custom mistakes, confluences, and context.</p>
              </div>
            </div>

            {/* Scope Summary */}
            <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98] font-sans">Matched Records:</span>
                <span className="text-white font-bold">{filteredTrades.length} trades</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98] font-sans">Net PnL Sum:</span>
                <span className={totalNetPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {formatCurrency(totalNetPnL)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98] font-sans">Win Rate:</span>
                <span className="text-white">{winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#848B98] font-sans">Estimated Size:</span>
                <span className="text-[#848B98]">~{Math.round(filteredTrades.length * (exportFormat === 'CSV' ? 0.35 : 0.85))} KB</span>
              </div>
            </div>

            {/* Download Actions */}
            <div className="space-y-2 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleDownloadExport}
                disabled={filteredTrades.length === 0}
                className="w-full flex items-center justify-center gap-2 cursor-pointer font-bold"
              >
                <Download className="h-4 w-4" />
                <span>Download {exportFormat} File</span>
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyToClipboard}
                disabled={filteredTrades.length === 0}
                className="w-full flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{isCopied ? 'Copied Content!' : 'Copy to Clipboard'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
