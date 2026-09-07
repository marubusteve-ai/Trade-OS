/**
 * Supported Adapters & Platform Templates Guide
 * 
 * Instructions on how to export statements from MetaTrader, cTrader, TradingView, 
 * NinjaTrader, Interactive Brokers, and download sample CSV templates.
 */

import React from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  HelpCircle, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  ShieldCheck,
  Terminal,
  Cpu
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useNotification } from '../../context/NotificationContext';

interface AdapterGuideItem {
  id: string;
  name: string;
  category: string;
  description: string;
  exportSteps: string[];
  expectedHeaders: string[];
  sampleCsvContent: string;
}

const ADAPTER_GUIDES: AdapterGuideItem[] = [
  {
    id: 'mt4_mt5',
    name: 'MetaTrader 4 / MetaTrader 5',
    category: 'Retail FX / CFD',
    description: 'Standard statement export from MT4/MT5 History tab.',
    exportSteps: [
      'In MetaTrader Terminal, open the "History" or "Account History" tab.',
      'Right click anywhere in the trade history list and choose "Custom Period" or "All History".',
      'Right click again and select "Report" -> "Open XML" or "Save as Detailed Report / CSV".',
      'Upload the resulting file directly into TradeOS.'
    ],
    expectedHeaders: ['Ticket', 'Open Time', 'Type', 'Size', 'Item', 'Open Price', 'S / L', 'T / P', 'Close Time', 'Close Price', 'Commission', 'Swap', 'Profit'],
    sampleCsvContent: `Ticket,Open Time,Type,Size,Item,Open Price,S / L,T / P,Close Time,Close Price,Commission,Swap,Profit,Comment
200101,2026.08.01 09:30:00,buy,1.00,EURUSD,1.08500,1.08200,1.09100,2026.08.01 14:15:00,1.09050,-5.00,-1.20,550.00,London Continuation
200102,2026.08.02 13:45:00,sell,2.00,NAS100,19850.0,19920.0,19650.0,2026.08.02 16:30:00,19710.0,-10.00,0.00,2800.00,NY Opening Range`
  },
  {
    id: 'ctrader',
    name: 'Spotware cTrader',
    category: 'ECN / STP Broker',
    description: 'Direct CSV statement export from cTrader History tab.',
    exportSteps: [
      'Navigate to the "History" tab in cTrader.',
      'Set your desired date range filter.',
      'Click the "Statement" or "Export to Excel / CSV" icon at the top right.',
      'Select CSV format and save the file.'
    ],
    expectedHeaders: ['Position Id', 'Symbol', 'Direction', 'Volume', 'Entry Time', 'Entry Price', 'Closing Time', 'Closing Price', 'Closing Gross PnL', 'Net PnL', 'Commission', 'Swap'],
    sampleCsvContent: `Position Id,Symbol,Direction,Volume,Entry Time,Entry Price,Closing Time,Closing Price,Closing Gross PnL,Net PnL,Commission,Swap,Stop Loss,Take Profit,Comment
5501,GBPUSD,Buy,100000,2026-08-15 08:30:00,1.27200,2026-08-15 12:00:00,1.27850,650.00,642.00,-6.00,-2.00,1.26800,1.28000,Asian High Sweep
5502,US30,Sell,5,2026-08-16 14:30:00,39400.0,2026-08-16 16:00:00,39250.0,750.00,740.00,-10.00,0.00,39550.0,39100.0,Dow Jones Breakdown`
  },
  {
    id: 'tradingview',
    name: 'TradingView Paper / Broker Connection',
    category: 'Charting & Execution',
    description: 'Trading panel trade log export from TradingView.',
    exportSteps: [
      'Open the bottom "Trading Panel" in TradingView.',
      'Click on "Account History" or "Journal".',
      'Click the three dots or download icon and select "Export Data (CSV)".',
      'Upload the downloaded file into TradeOS.'
    ],
    expectedHeaders: ['Symbol', 'Side', 'Qty', 'Entry Price', 'Exit Price', 'Placing Time', 'Closing Time', 'Realized P&L'],
    sampleCsvContent: `Symbol,Side,Qty,Entry Price,Exit Price,Placing Time,Closing Time,Realized P&L
EURUSD,Buy,100000,1.08500,1.09100,2026-08-10 08:00:00,2026-08-10 12:30:00,600.00
NQ1!,Sell,2,19800.0,19700.0,2026-08-11 14:30:00,2026-08-11 16:00:00,2000.00`
  },
  {
    id: 'ninjatrader',
    name: 'NinjaTrader 8',
    category: 'Futures & Options',
    description: 'Account performance export from NT8 Trade Performance window.',
    exportSteps: [
      'Open New -> Trade Performance in NinjaTrader 8.',
      'Set the Account and Date Range.',
      'Right click the Trades grid and select "Export -> Grid to CSV".',
      'Select comma as the delimiter and save.'
    ],
    expectedHeaders: ['Instrument', 'Account', 'Entry date', 'Exit date', 'Quantity', 'Entry price', 'Exit price', 'Profit', 'Commission'],
    sampleCsvContent: `Instrument,Account,Entry date,Exit date,Quantity,Entry price,Exit price,Profit,Commission
NQ 09-26,Sim101,08/18/2026 09:30:00,08/18/2026 10:15:00,2,19950.25,19985.50,1410.00,4.20
ES 09-26,Sim101,08/19/2026 14:00:00,08/19/2026 15:30:00,4,5540.50,5530.00,-2100.00,8.40`
  },
  {
    id: 'tradeos_generic',
    name: 'TradeOS Universal CSV Schema',
    category: 'Standard Specification',
    description: 'Native full-fidelity specification supporting custom tags, mistakes, confluences, and notes.',
    exportSteps: [
      'Use this template to prepare manual backtest data or custom spreadsheet exports.',
      'Supports all financial fields, risk amounts, mistakes, and multi-factor confluences.',
      'Dates can be ISO-8601 (2026-08-20T14:30:00Z) or standard date strings.'
    ],
    expectedHeaders: ['Instrument', 'Direction', 'EntryDate', 'ExitDate', 'EntryPrice', 'ExitPrice', 'Quantity', 'StopLoss', 'TakeProfit', 'NetPnL', 'GrossPnL', 'Commission', 'Strategy', 'Confluences', 'Mistakes', 'Notes'],
    sampleCsvContent: `Instrument,Direction,EntryDate,ExitDate,EntryPrice,ExitPrice,Quantity,StopLoss,TakeProfit,NetPnL,GrossPnL,Commission,Strategy,Confluences,Mistakes,Notes
EURUSD,LONG,2026-08-20T08:30:00Z,2026-08-20T12:45:00Z,1.0880,1.0940,1.5,1.0850,1.0960,900.00,910.00,10.00,Order Block Retest,Daily Support; 15m FVG,,Clean reaction at London open
NAS100,SHORT,2026-08-21T14:30:00Z,2026-08-21T16:15:00Z,19950.0,19820.0,2.0,20020.0,19700.0,2600.00,2620.00,20.00,FVG Inversion,Bearish Divergence,,Standard NY short execution`
  }
];

export const SupportedAdaptersGuide: React.FC = () => {
  const { notify } = useNotification();

  const handleDownloadTemplate = (guide: AdapterGuideItem) => {
    const blob = new Blob([guide.sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TradeOS_Template_${guide.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    notify.success('Template Downloaded', `Downloaded ${guide.name} sample CSV template.`);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-[#121417] border border-[#22252A] flex items-start gap-3">
        <Cpu className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-bold text-white">Extensible Adapter Architecture</p>
          <p className="text-[#848B98]">
            TradeOS uses heuristic token detection and format normalizers. Download pre-formatted sample templates below to test imports or format your personal journal records.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ADAPTER_GUIDES.map((guide) => (
          <Card key={guide.id} className="flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="emerald">{guide.category}</Badge>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadTemplate(guide)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 h-7 cursor-pointer"
                  >
                    <Download className="h-3 w-3 mr-1" /> Template CSV
                  </Button>
                </div>
                <CardTitle className="text-base mt-2 text-white">{guide.name}</CardTitle>
                <CardDescription className="text-xs">{guide.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <span className="text-[11px] font-bold text-[#848B98] uppercase tracking-wider block mb-2 font-mono">
                    Export Instructions:
                  </span>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-[#D1D5DB]">
                    {guide.exportSteps.map((step, i) => (
                      <li key={i} className="pl-1 leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#848B98] uppercase tracking-wider block mb-1.5 font-mono">
                    Recognized Headers:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {guide.expectedHeaders.map((h, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-[#1A1D21] border border-[#22252A] text-[10px] font-mono text-[#D1D5DB]">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
