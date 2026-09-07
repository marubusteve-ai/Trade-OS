/**
 * Interactive CSV & Trading Data Import Wizard
 * 
 * 4-Step Guided Flow:
 * 1. Upload & Format Detection (Drag & drop, platform preset, target account)
 * 2. Column Mapping & Schema Matching (Interactive mapping with live sample rows)
 * 3. Validation, Duplicate Detection & Pre-Flight Review (Valid/Invalid/Duplicate breakdown)
 * 4. Batch Import Execution & Results Summary
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Layers, 
  FileText, 
  Database, 
  HelpCircle, 
  Sparkles, 
  Eye, 
  Check, 
  AlertCircle,
  Copy,
  Info
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { 
  PlatformPreset, 
  StandardTradeField, 
  FieldMappingConfig, 
  ImportPreviewResult, 
  ImportExecutionOptions, 
  DuplicateHandlingOption,
  ImportBatch
} from '../../types/importExport';
import { AssetClass, MarketSession, Trade } from '../../types/domain';
import { ImportExportEngine } from '../../services/importExportEngine';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Select } from '../ui/Input';

interface ImportWizardProps {
  onComplete?: () => void;
  initialAccountId?: string;
}

const STANDARD_FIELDS: { key: StandardTradeField; label: string; required: boolean; hint: string }[] = [
  { key: 'instrument', label: 'Instrument / Symbol', required: true, hint: 'e.g. EURUSD, NAS100, BTCUSDT' },
  { key: 'direction', label: 'Direction / Side', required: true, hint: 'LONG/SHORT, BUY/SELL' },
  { key: 'entryDate', label: 'Entry Date & Time', required: true, hint: 'ISO, YYYY-MM-DD, or MM/DD/YYYY' },
  { key: 'entryPrice', label: 'Entry Price', required: true, hint: 'Opening execution price' },
  { key: 'quantity', label: 'Quantity / Size', required: true, hint: 'Lots, contracts, or units' },
  { key: 'exitDate', label: 'Exit Date & Time', required: false, hint: 'Closing date & time' },
  { key: 'exitPrice', label: 'Exit Price', required: false, hint: 'Closing execution price' },
  { key: 'stopLossPrice', label: 'Stop Loss (SL)', required: false, hint: 'Stop Loss price level' },
  { key: 'takeProfitPrice', label: 'Take Profit (TP)', required: false, hint: 'Take Profit price level' },
  { key: 'netPnL', label: 'Net PnL ($)', required: false, hint: 'Realized profit or loss' },
  { key: 'grossPnL', label: 'Gross PnL ($)', required: false, hint: 'Profit before fees & commission' },
  { key: 'commission', label: 'Commission ($)', required: false, hint: 'Broker commission charge' },
  { key: 'swap', label: 'Swap / Financing ($)', required: false, hint: 'Overnight interest charge' },
  { key: 'fees', label: 'Fees & Taxes ($)', required: false, hint: 'Exchange fees / regulatory taxes' },
  { key: 'plannedRiskAmount', label: 'Planned Risk ($)', required: false, hint: 'Initial planned stop risk amount' },
  { key: 'strategyName', label: 'Strategy / Model', required: false, hint: 'Strategy tag or trading model' },
  { key: 'notes', label: 'Notes / Journal', required: false, hint: 'Trade comments and notes' },
  { key: 'confluences', label: 'Confluences / Reasons', required: false, hint: 'Comma-separated setup triggers' },
  { key: 'mistakes', label: 'Execution Mistakes', required: false, hint: 'Comma-separated discipline flaws' },
];

export const ImportWizard: React.FC<ImportWizardProps> = ({ onComplete, initialAccountId }) => {
  const { currentUser } = useAuth();
  const { 
    accounts, 
    selectedAccountId, 
    importTradesBatch, 
    strategies,
    setActiveTab 
  } = useTradeOS();
  const { notify } = useNotification();

  // Step state (1: Upload, 2: Mapping, 3: Validation Preview, 4: Results)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // File & raw content
  const [fileName, setFileName] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration options
  const [targetAccountId, setTargetAccountId] = useState<string>(
    initialAccountId || (selectedAccountId !== 'ALL' ? selectedAccountId : accounts[0]?.id || '')
  );
  const [selectedPreset, setSelectedPreset] = useState<PlatformPreset>('AUTO_DETECT');
  const [duplicateHandling, setDuplicateHandling] = useState<DuplicateHandlingOption>('SKIP');
  const [defaultAssetClass, setDefaultAssetClass] = useState<AssetClass>('FOREX');
  const [defaultSession, setDefaultSession] = useState<MarketSession>('NEW_YORK');
  const [strategyId, setStrategyId] = useState<string>('');
  const [customTag, setCustomTag] = useState<string>('');

  // Processing & Preview
  const [previewResult, setPreviewResult] = useState<ImportPreviewResult | null>(null);
  const [customMappings, setCustomMappings] = useState<FieldMappingConfig>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Preview sub-tab
  const [previewTab, setPreviewTab] = useState<'VALID' | 'INVALID' | 'DUPLICATES' | 'ALL'>('VALID');

  // Execution Results
  const [importResult, setImportResult] = useState<{
    batch: ImportBatch;
    importedTrades: Trade[];
    skippedCount: number;
    errorsCount: number;
  } | null>(null);

  // Drag & drop state
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // File Upload Handler
  const handleFileSelect = (file: File) => {
    if (!file) return;
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      notify.error('Invalid File Type', 'Please upload a valid CSV or TXT file.');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      setFileContent(text);
      await generatePreviewData(text, selectedPreset);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const generatePreviewData = async (text: string, preset: PlatformPreset, mappingsOverride?: FieldMappingConfig) => {
    if (!text || !currentUser || !targetAccountId) return;
    setIsLoadingPreview(true);
    try {
      const result = await ImportExportEngine.generatePreview(
        text,
        currentUser.id,
        targetAccountId,
        mappingsOverride || (Object.keys(customMappings).length > 0 ? customMappings : undefined),
        preset
      );
      setPreviewResult(result);
      setCustomMappings(result.mappings);
    } catch (err: any) {
      notify.error('Preview Error', err?.message || 'Failed to parse file.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handlePresetChange = async (newPreset: PlatformPreset) => {
    setSelectedPreset(newPreset);
    if (fileContent) {
      await generatePreviewData(fileContent, newPreset);
    }
  };

  const handleMappingChange = (field: StandardTradeField, columnHeader: string) => {
    const updated = { ...customMappings };
    if (columnHeader === '__UNMAPPED__') {
      delete updated[field];
    } else {
      updated[field] = columnHeader;
    }
    setCustomMappings(updated);
  };

  const handleReapplyMappings = async () => {
    if (!fileContent) return;
    await generatePreviewData(fileContent, selectedPreset, customMappings);
    setStep(3);
  };

  const handleExecuteImport = async () => {
    if (!previewResult || !currentUser || !targetAccountId) {
      notify.error('Import Error', 'Please select a valid account and ensure data is loaded.');
      return;
    }

    if (previewResult.validCount === 0 && previewResult.duplicateCount === 0) {
      notify.error('No Valid Records', 'No valid trades found in this CSV to import.');
      return;
    }

    setIsImporting(true);
    try {
      const options: ImportExecutionOptions = {
        accountId: targetAccountId,
        duplicateHandling,
        defaultAssetClass,
        defaultSession,
        strategyId: strategyId || undefined,
        tag: customTag || undefined,
      };

      const result = await importTradesBatch(fileName || 'import.csv', previewResult, options);
      setImportResult(result);
      setStep(4);
      notify.success(
        'Import Successful', 
        `Imported ${result.importedTrades.length} trades into your account (${result.skippedCount} duplicates skipped).`
      );
    } catch (err: any) {
      notify.error('Import Failed', err?.message || 'Error occurred during batch import.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setFileName('');
    setFileContent('');
    setPreviewResult(null);
    setCustomMappings({});
    setImportResult(null);
  };

  // Sample CSV generator for quick demo
  const handleLoadSampleCSV = async (format: 'METATRADER' | 'CTRADER' | 'GENERIC') => {
    let sample = '';
    let name = '';
    if (format === 'METATRADER') {
      name = 'MetaTrader5_ClosedTrades.csv';
      sample = `Ticket,Open Time,Type,Size,Item,Open Price,S / L,T / P,Close Time,Close Price,Commission,Swap,Profit,Comment\n` +
        `1001024,2026.08.10 09:30:00,buy,1.00,EURUSD,1.08500,1.08200,1.09100,2026.08.10 14:15:00,1.09050,-5.00,-1.20,550.00,London Breakout\n` +
        `1001025,2026.08.11 13:45:00,sell,2.00,NAS100,19850.0,19920.0,19650.0,2026.08.11 16:30:00,19710.0,-10.00,0.00,2800.00,NY Opening Range\n` +
        `1001026,2026.08.12 08:00:00,buy,0.50,XAUUSD,2385.50,2375.00,2405.00,2026.08.12 11:20:00,2374.80,-3.50,-0.80,-535.00,Gold Pullback Hit SL\n` +
        `1001027,2026.08.13 14:00:00,sell,1.50,BTCUSDT,61200.0,62100.0,59000.0,2026.08.13 18:45:00,59850.0,-8.00,-2.50,2025.00,Crypto Liquidity Sweep`;
    } else if (format === 'CTRADER') {
      name = 'cTrader_Statement_Positions.csv';
      sample = `Position Id,Symbol,Direction,Volume,Entry Time,Entry Price,Closing Time,Closing Price,Closing Gross PnL,Net PnL,Commission,Swap,Stop Loss,Take Profit,Comment\n` +
        `5501,GBPUSD,Buy,100000,2026-08-15 08:30:00,1.27200,2026-08-15 12:00:00,1.27850,650.00,642.00,-6.00,-2.00,1.26800,1.28000,Asian High Sweep\n` +
        `5502,US30,Sell,5,2026-08-16 14:30:00,39400.0,2026-08-16 16:00:00,39250.0,750.00,740.00,-10.00,0.00,39550.0,39100.0,Dow Jones Breakdown\n` +
        `5503,USDJPY,Buy,200000,2026-08-17 01:15:00,147.200,2026-08-17 06:45:00,146.900,-408.00,-415.00,-5.00,-2.00,146.850,148.000,Tokyo Session Long`;
    } else {
      name = 'TradeOS_Generic_Trades.csv';
      sample = `Instrument,Direction,EntryDate,ExitDate,EntryPrice,ExitPrice,Quantity,StopLoss,TakeProfit,NetPnL,GrossPnL,Commission,Strategy,Confluences,Mistakes,Notes\n` +
        `EURUSD,LONG,2026-08-20T08:30:00Z,2026-08-20T12:45:00Z,1.0880,1.0940,1.5,1.0850,1.0960,900.00,910.00,10.00,Order Block Retest,Daily Support; 15m FVG; Liquidity Sweep,,Clean reaction at London open\n` +
        `NAS100,SHORT,2026-08-21T14:30:00Z,2026-08-21T16:15:00Z,19950.0,19820.0,2.0,20020.0,19700.0,2600.00,2620.00,20.00,FVG Inversion,Bearish Divergence; Volume Imbalance,,Standard NY short execution\n` +
        `XAUUSD,LONG,2026-08-22T09:00:00Z,2026-08-22T10:15:00Z,2410.0,2402.0,1.0,2400.0,2430.0,-800.00,-790.00,10.00,Break & Retest,Trendline Retest,Chased Entry,Entered late after impulse\n` +
        `BTCUSDT,LONG,2026-08-23T16:00:00Z,2026-08-23T20:30:00Z,62500.0,64200.0,0.5,61800.0,65000.0,850.00,855.00,5.00,Range Expansion,4H S/R Flip; Funding Rate Reset,,Weekend momentum continuation`;
    }

    setFileName(name);
    setFileContent(sample);
    await generatePreviewData(sample, format === 'METATRADER' ? 'METATRADER_4_5' : format === 'CTRADER' ? 'CTRADER' : 'GENERIC_CSV');
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-[#121417] border border-[#22252A]">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto">
          <div className={`flex items-center gap-2 cursor-pointer ${step === 1 ? 'text-emerald-400 font-bold' : step > 1 ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`} onClick={() => step > 1 && setStep(1)}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-emerald-500 text-black' : step > 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#1A1D21] text-[#606773]'}`}>
              {step > 1 ? <Check className="h-3.5 w-3.5" /> : '1'}
            </div>
            <span className="text-xs hidden sm:inline whitespace-nowrap">Upload & Target</span>
          </div>

          <div className="h-px w-6 sm:w-10 bg-[#22252A]" />

          <div className={`flex items-center gap-2 cursor-pointer ${step === 2 ? 'text-emerald-400 font-bold' : step > 2 ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`} onClick={() => previewResult && setStep(2)}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-emerald-500 text-black' : step > 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#1A1D21] text-[#606773]'}`}>
              {step > 2 ? <Check className="h-3.5 w-3.5" /> : '2'}
            </div>
            <span className="text-xs hidden sm:inline whitespace-nowrap">Column Mapping</span>
          </div>

          <div className="h-px w-6 sm:w-10 bg-[#22252A]" />

          <div className={`flex items-center gap-2 cursor-pointer ${step === 3 ? 'text-emerald-400 font-bold' : step > 3 ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`} onClick={() => previewResult && setStep(3)}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-emerald-500 text-black' : step > 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-[#1A1D21] text-[#606773]'}`}>
              {step > 3 ? <Check className="h-3.5 w-3.5" /> : '3'}
            </div>
            <span className="text-xs hidden sm:inline whitespace-nowrap">Pre-Flight Review</span>
          </div>

          <div className="h-px w-6 sm:w-10 bg-[#22252A]" />

          <div className={`flex items-center gap-2 ${step === 4 ? 'text-emerald-400 font-bold' : 'text-[#4B5563]'}`}>
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 4 ? 'bg-emerald-500 text-black' : 'bg-[#1A1D21] text-[#606773]'}`}>
              4
            </div>
            <span className="text-xs hidden sm:inline whitespace-nowrap">Results</span>
          </div>
        </div>

        {step < 4 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-[#848B98]">
            Reset Wizard
          </Button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Upload, Format & Target Account Selection                         */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Drag & Drop Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-emerald-400" />
                  <span>Upload Trading Data File</span>
                </CardTitle>
                <CardDescription>
                  Supports CSV, TXT exports from MetaTrader 4/5, cTrader, TradingView, NinjaTrader, IBKR, DXtrade, or generic journals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]' 
                      : fileName 
                        ? 'border-emerald-500/50 bg-[#121417]' 
                        : 'border-[#2A2E35] bg-[#0C0D0F] hover:border-emerald-500/40 hover:bg-[#14171A]'
                  }`}
                >
                  <div className="mx-auto h-12 w-12 rounded-xl bg-[#1A1D21] border border-[#2A2E35] flex items-center justify-center text-emerald-400 mb-3 shadow-sm">
                    {fileName ? <FileSpreadsheet className="h-6 w-6 text-emerald-400" /> : <Upload className="h-6 w-6 text-[#848B98]" />}
                  </div>

                  {fileName ? (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{fileName}</p>
                      <p className="text-xs text-emerald-400 font-medium">File loaded successfully. Click to replace.</p>
                      {previewResult && (
                        <p className="text-xs text-[#848B98] font-mono mt-2">
                          {previewResult.totalRows} rows parsed • Delimiter: <code className="text-white px-1 bg-[#1A1D21] rounded">"{previewResult.detectedDelimiter}"</code> • Preset: {previewResult.detectedPlatform}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[#D1D5DB]">
                        Click to browse or drag & drop your CSV file here
                      </p>
                      <p className="text-xs text-[#606773]">
                        CSV, TSV, or TXT format (max 50MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Sample File Loaders */}
                <div className="pt-2 border-t border-[#22252A]">
                  <p className="text-xs text-[#848B98] mb-2 flex items-center gap-1.5 font-medium">
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>Or test immediately with verified sample data:</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleLoadSampleCSV('METATRADER')}
                      className="text-xs cursor-pointer"
                    >
                      Load MT4/MT5 Sample
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleLoadSampleCSV('CTRADER')}
                      className="text-xs cursor-pointer"
                    >
                      Load cTrader Sample
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleLoadSampleCSV('GENERIC')}
                      className="text-xs cursor-pointer"
                    >
                      Load TradeOS Generic Sample
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-400" />
                  <span>Target Account & Presets</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    Target Trading Account <span className="text-rose-400">*</span>
                  </label>
                  <Select
                    value={targetAccountId}
                    onChange={(e) => {
                      setTargetAccountId(e.target.value);
                      if (fileContent) generatePreviewData(fileContent, selectedPreset);
                    }}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.accountType} • {acc.currency} {formatCurrency(acc.currentBalance)})
                      </option>
                    ))}
                  </Select>
                  <p className="text-[11px] text-[#606773] mt-1">
                    Trades will be imported into this isolated ledger.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    Platform Format / Schema
                  </label>
                  <Select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value as PlatformPreset)}
                  >
                    <option value="AUTO_DETECT">⚡ Auto-Detect Platform</option>
                    <option value="GENERIC_CSV">TradeOS Generic CSV</option>
                    <option value="METATRADER_4_5">MetaTrader 4 / MetaTrader 5</option>
                    <option value="CTRADER">cTrader Statement</option>
                    <option value="TRADINGVIEW">TradingView Trade Log</option>
                    <option value="NINJATRADER_8">NinjaTrader 8 Performance</option>
                    <option value="INTERACTIVE_BROKERS">Interactive Brokers (IBKR)</option>
                    <option value="TRADELOCKER_DXTRADE">TradeLocker / DXtrade</option>
                    <option value="CRYPTO_EXCHANGE">Crypto (Binance / Bybit)</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    Duplicate Records Handling
                  </label>
                  <Select
                    value={duplicateHandling}
                    onChange={(e) => setDuplicateHandling(e.target.value as DuplicateHandlingOption)}
                  >
                    <option value="SKIP">Skip Duplicates (Recommended)</option>
                    <option value="OVERWRITE">Overwrite Existing Trades</option>
                    <option value="IMPORT_AS_NEW">Import as New Trades</option>
                  </Select>
                  <p className="text-[11px] text-[#606773] mt-1">
                    Detected via instrument, entry time, entry price, and direction fingerprint.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#D1D5DB] mb-1.5">
                    Assign Default Strategy (Optional)
                  </label>
                  <Select
                    value={strategyId}
                    onChange={(e) => setStrategyId(e.target.value)}
                  >
                    <option value="">-- No strategy specified in CSV --</option>
                    {strategies.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.style})</option>
                    ))}
                  </Select>
                </div>

                <div className="pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    disabled={!previewResult || previewResult.totalRows === 0 || isLoadingPreview}
                    onClick={() => setStep(2)}
                    className="w-full flex items-center justify-center gap-2 cursor-pointer font-bold"
                  >
                    <span>Proceed to Column Mapping</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Interactive Column Mapping & Auto-Match                           */}
      {/* ========================================================================= */}
      {step === 2 && previewResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-400" />
                  <span>Column & Field Mapping</span>
                </CardTitle>
                <CardDescription>
                  Map CSV header columns to TradeOS domain fields. Required fields are highlighted with badges.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button variant="primary" size="sm" onClick={handleReapplyMappings}>
                  Validate & Preview <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Detected Platform Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald">{previewResult.detectedPlatform}</Badge>
                  <span className="text-[#848B98]">Detected Delimiter: <code className="text-white font-mono">"{previewResult.detectedDelimiter}"</code></span>
                  <span className="text-[#848B98]">Total File Columns: <strong className="text-white">{previewResult.headers.length}</strong></span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-emerald-400"
                  onClick={() => {
                    const auto = ImportExportEngine.autoMapColumns(previewResult.headers);
                    setCustomMappings(auto);
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Re-apply Auto Match
                </Button>
              </div>

              {/* Column Mapping Grid */}
              <div className="overflow-x-auto rounded-xl border border-[#22252A]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121417] text-[#848B98] uppercase font-mono text-[11px] border-b border-[#22252A]">
                    <tr>
                      <th className="py-3 px-4">TradeOS Domain Field</th>
                      <th className="py-3 px-4">Requirement</th>
                      <th className="py-3 px-4">Mapped CSV Header</th>
                      <th className="py-3 px-4">Sample Values from File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D21] bg-[#0C0D0F]">
                    {STANDARD_FIELDS.map((field) => {
                      const currentMappedHeader = customMappings[field.key] || '';
                      const headerInfo = previewResult.columnHeaders.find(h => h.header === currentMappedHeader);
                      const isMapped = Boolean(currentMappedHeader);

                      return (
                        <tr key={field.key} className="hover:bg-[#14171A] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{field.label}</div>
                            <div className="text-[10px] text-[#606773]">{field.hint}</div>
                          </td>
                          <td className="py-3 px-4">
                            {field.required ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                                REQUIRED
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1A1D21] text-[#848B98]">
                                OPTIONAL
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 min-w-[220px]">
                            <Select
                              value={currentMappedHeader || '__UNMAPPED__'}
                              onChange={(e) => handleMappingChange(field.key, e.target.value)}
                              className={`text-xs ${isMapped ? 'border-emerald-500/50 bg-[#121417]' : field.required ? 'border-rose-500/50' : ''}`}
                            >
                              <option value="__UNMAPPED__">-- Not Mapped --</option>
                              {previewResult.headers.map(h => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </Select>
                          </td>
                          <td className="py-3 px-4 text-[#848B98] font-mono text-[11px] max-w-[280px] truncate">
                            {headerInfo && headerInfo.sampleValues.length > 0 ? (
                              <span className="text-[#D1D5DB]">
                                {headerInfo.sampleValues.slice(0, 2).join(', ')}
                              </span>
                            ) : (
                              <span className="text-[#4B5563] italic">No sample preview</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Pre-Flight Validation, Duplicates & Normalization Preview         */}
      {/* ========================================================================= */}
      {step === 3 && previewResult && (
        <div className="space-y-6">
          {/* Pre-Flight Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#121417] border border-[#22252A]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#848B98] font-medium">Total Rows</span>
                <FileText className="h-4 w-4 text-[#848B98]" />
              </div>
              <p className="text-xl font-bold text-white mt-1">{previewResult.totalRows}</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-400 font-medium">Valid Ready</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xl font-bold text-emerald-400 mt-1">{previewResult.validCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-400 font-medium">Duplicates</span>
                <Copy className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xl font-bold text-amber-400 mt-1">{previewResult.duplicateCount}</p>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-rose-400 font-medium">Invalid Errors</span>
                <XCircle className="h-4 w-4 text-rose-400" />
              </div>
              <p className="text-xl font-bold text-rose-400 mt-1">{previewResult.invalidCount}</p>
            </div>
          </div>

          {/* Validation Warning & Policy Info */}
          {previewResult.duplicateCount > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-400">
                  {previewResult.duplicateCount} Duplicate Records Detected in Account
                </p>
                <p className="text-[#D1D5DB]">
                  Selected Duplicate Action: <strong className="text-white uppercase">{duplicateHandling}</strong>. 
                  {duplicateHandling === 'SKIP' && ' Duplicate rows will be skipped safely without re-inserting.'}
                  {duplicateHandling === 'OVERWRITE' && ' Existing matching trades will be updated with values from this CSV.'}
                  {duplicateHandling === 'IMPORT_AS_NEW' && ' Trades will be inserted as new distinct records.'}
                </p>
              </div>
            </div>
          )}

          {previewResult.invalidCount > 0 && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-rose-400">
                  {previewResult.invalidCount} Malformed Rows Found
                </p>
                <p className="text-[#D1D5DB]">
                  Invalid records will NOT be silently dropped without your awareness. Review the "Invalid Rows" tab below to see exact column errors.
                </p>
              </div>
            </div>
          )}

          {/* Row Review Table Card */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-[#22252A]">
              <div className="flex items-center gap-2">
                <Button 
                  variant={previewTab === 'VALID' ? 'primary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewTab('VALID')}
                  className="text-xs"
                >
                  Valid Trades ({previewResult.validCount})
                </Button>
                <Button 
                  variant={previewTab === 'DUPLICATES' ? 'primary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewTab('DUPLICATES')}
                  className="text-xs text-amber-400"
                >
                  Duplicates ({previewResult.duplicateCount})
                </Button>
                <Button 
                  variant={previewTab === 'INVALID' ? 'primary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewTab('INVALID')}
                  className="text-xs text-rose-400"
                >
                  Invalid Errors ({previewResult.invalidCount})
                </Button>
                <Button 
                  variant={previewTab === 'ALL' ? 'primary' : 'ghost'} 
                  size="sm"
                  onClick={() => setPreviewTab('ALL')}
                  className="text-xs"
                >
                  All Rows ({previewResult.totalRows})
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Edit Mappings
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleExecuteImport}
                  disabled={isImporting || (previewResult.validCount === 0 && previewResult.duplicateCount === 0)}
                  className="cursor-pointer font-bold"
                >
                  {isImporting ? <RefreshCw className="h-4 w-4 animate-spin mr-1.5" /> : <Check className="h-4 w-4 mr-1.5" />}
                  Execute Batch Import
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[420px] custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#121417] text-[#848B98] uppercase font-mono text-[11px] sticky top-0 border-b border-[#22252A] z-10">
                    <tr>
                      <th className="py-2.5 px-3">Row #</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Instrument</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Entry Date</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3">Quantity</th>
                      <th className="py-2.5 px-3">Net PnL</th>
                      <th className="py-2.5 px-3">Validation / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1D21] bg-[#0C0D0F]">
                    {previewResult.rows
                      .filter(r => {
                        if (previewTab === 'VALID') return r.status === 'VALID' || r.status === 'WARNING';
                        if (previewTab === 'DUPLICATES') return r.status === 'DUPLICATE';
                        if (previewTab === 'INVALID') return r.status === 'INVALID';
                        return true;
                      })
                      .map((row) => (
                        <tr key={row.rowIndex} className="hover:bg-[#14171A] transition-colors font-mono">
                          <td className="py-2.5 px-3 text-[#848B98]">#{row.rowIndex + 1}</td>
                          <td className="py-2.5 px-3">
                            {row.status === 'VALID' && (
                              <Badge variant="emerald">VALID</Badge>
                            )}
                            {row.status === 'WARNING' && (
                              <Badge variant="amber">WARNING</Badge>
                            )}
                            {row.status === 'DUPLICATE' && (
                              <Badge variant="amber">DUPLICATE</Badge>
                            )}
                            {row.status === 'INVALID' && (
                              <Badge variant="rose">INVALID</Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-white">
                            {row.mapped.instrument || <span className="text-rose-400">MISSING</span>}
                          </td>
                          <td className="py-2.5 px-3">
                            {row.mapped.direction ? (
                              <span className={row.mapped.direction === 'LONG' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                {row.mapped.direction}
                              </span>
                            ) : (
                              <span className="text-rose-400">MISSING</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-[#D1D5DB]">
                            {row.mapped.entryDate ? formatShortDate(row.mapped.entryDate) : <span className="text-rose-400">INVALID</span>}
                          </td>
                          <td className="py-2.5 px-3 text-[#D1D5DB]">
                            {row.mapped.entryPrice !== undefined ? row.mapped.entryPrice : <span className="text-rose-400">MISSING</span>}
                          </td>
                          <td className="py-2.5 px-3 text-[#848B98]">
                            {row.mapped.exitPrice !== undefined ? row.mapped.exitPrice : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-[#D1D5DB]">
                            {row.mapped.quantity !== undefined ? row.mapped.quantity : <span className="text-rose-400">MISSING</span>}
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {row.mapped.netPnL !== undefined ? (
                              <span className={row.mapped.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                {formatCurrency(row.mapped.netPnL)}
                              </span>
                            ) : (
                              <span className="text-[#606773]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 max-w-[280px]">
                            {row.errors.length > 0 ? (
                              <div className="space-y-0.5">
                                {row.errors.map((err, i) => (
                                  <div key={i} className="text-[11px] text-rose-400 flex items-center gap-1 font-sans">
                                    <XCircle className="h-3 w-3 shrink-0" />
                                    <span>{err.message}</span>
                                  </div>
                                ))}
                              </div>
                            ) : row.warnings.length > 0 ? (
                              <div className="space-y-0.5">
                                {row.warnings.map((w, i) => (
                                  <div key={i} className="text-[11px] text-amber-400 flex items-center gap-1 font-sans">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    <span>{w}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Ready
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Execution Results & Summary                                       */}
      {/* ========================================================================= */}
      {step === 4 && importResult && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg text-white">Import Successfully Completed</CardTitle>
                <CardDescription className="text-emerald-400 font-medium">
                  Batch audit record #{importResult.batch.id.slice(-8)} logged with rollback protection.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-xs text-[#848B98]">Total Processed</span>
                <p className="text-xl font-bold text-white mt-1">{importResult.batch.totalRows}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-xs text-emerald-400">Imported Trades</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{importResult.importedTrades.length}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-xs text-amber-400">Duplicates Skipped</span>
                <p className="text-xl font-bold text-amber-400 mt-1">{importResult.skippedCount}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
                <span className="text-xs text-rose-400">Invalid Skipped</span>
                <p className="text-xl font-bold text-rose-400 mt-1">{importResult.errorsCount}</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#121417] border border-[#22252A] space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Target Account:</span>
                <span className="font-semibold text-white">{importResult.batch.accountName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Source Platform:</span>
                <span className="font-mono text-emerald-400">{importResult.batch.platformPreset}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22252A]">
                <span className="text-[#848B98]">Source Filename:</span>
                <span className="font-mono text-[#D1D5DB]">{importResult.batch.filename}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#848B98]">Audit Batch ID:</span>
                <span className="font-mono text-[#848B98]">{importResult.batch.id}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  if (onComplete) onComplete();
                  setActiveTab('trades');
                }}
                className="cursor-pointer font-bold"
              >
                <Eye className="h-4 w-4 mr-2" /> View Trades in Journal
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  if (onComplete) onComplete();
                  setActiveTab('dashboard');
                }}
                className="cursor-pointer"
              >
                Go to Dashboard
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={handleReset}
                className="text-xs text-[#848B98]"
              >
                Import Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
