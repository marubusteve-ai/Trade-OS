/**
 * Import / Export Engine & Platform Adapters
 * 
 * Provides RFC-4180 CSV parsing, schema auto-detection, column mapping heuristics,
 * multi-platform adapters (MT4/5, cTrader, TradingView, NinjaTrader, IBKR, Crypto),
 * validation, duplicate detection, batch execution, and safe rollback mechanics.
 */

import { Trade, AssetClass, TradeDirection, TradeStatus, MarketSession } from '../types/domain';
import { 
  PlatformPreset, 
  StandardTradeField, 
  FieldMappingConfig, 
  ColumnHeaderInfo,
  ImportParsedRow,
  ImportPreviewResult,
  ImportRowError,
  ImportValidationStatus,
  ImportExecutionOptions,
  ImportBatch,
  ExportFilterConfig,
  IPlatformImportAdapter
} from '../types/importExport';
import { TradeRepository } from '../repositories/tradeRepository';
import { ImportExportRepository } from '../repositories/importExportRepository';
import { CalculationEngine } from './calculationEngine';

export class ImportExportEngine {
  private static tradeRepo = new TradeRepository();
  private static importExportRepo = new ImportExportRepository();

  // =========================================================================
  // 1. RFC-4180 CSV Parsing & Delimiter Detection
  // =========================================================================

  /**
   * Detects delimiter from raw CSV text (, ; \t |)
   */
  static detectDelimiter(rawText: string): string {
    const firstLines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0).slice(0, 5);
    if (firstLines.length === 0) return ',';

    const candidates = [',', ';', '\t', '|'];
    let bestDelimiter = ',';
    let maxCount = -1;

    for (const d of candidates) {
      let count = 0;
      for (const line of firstLines) {
        // Count non-quoted occurrences
        const matches = line.split(d).length - 1;
        count += matches;
      }
      if (count > maxCount) {
        maxCount = count;
        bestDelimiter = d;
      }
    }

    return bestDelimiter;
  }

  /**
   * Parses CSV string into headers and raw rows with RFC-4180 quote handling
   */
  static parseCsv(rawText: string, explicitDelimiter?: string): { headers: string[]; rows: Record<string, string>[]; delimiter: string } {
    if (!rawText || rawText.trim().length === 0) {
      return { headers: [], rows: [], delimiter: ',' };
    }

    const delimiter = explicitDelimiter || this.detectDelimiter(rawText);
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    // Normalize text
    const text = rawText.replace(/^\uFEFF/, ''); // Strip BOM

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of cell
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        // End of row
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n
        }
        currentRow.push(currentCell.trim());
        // Only push non-empty rows
        if (currentRow.some(cell => cell.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // Push trailing cell & row
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        lines.push(currentRow);
      }
    }

    if (lines.length === 0) {
      return { headers: [], rows: [], delimiter };
    }

    const headers = lines[0].map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let r = 1; r < lines.length; r++) {
      const rowData: Record<string, string> = {};
      const rowValues = lines[r];
      let hasData = false;

      for (let c = 0; c < headers.length; c++) {
        const header = headers[c];
        const val = rowValues[c] !== undefined ? rowValues[c] : '';
        rowData[header] = val;
        if (val.length > 0) hasData = true;
      }

      if (hasData) {
        rows.push(rowData);
      }
    }

    return { headers, rows, delimiter };
  }

  // =========================================================================
  // 2. Data Sanitization & Flexible Type Parsers
  // =========================================================================

  /**
   * Parses flexible date string into standard ISO format
   */
  static parseFlexibleDate(dateStr: string): string | null {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const clean = dateStr.trim();
    if (!clean) return null;

    // Check if it's already ISO
    const directDate = new Date(clean);
    if (!isNaN(directDate.getTime()) && clean.includes('-') && clean.length >= 10) {
      return directDate.toISOString();
    }

    // Unix timestamp (seconds or ms)
    if (/^\d{10,13}$/.test(clean)) {
      const num = parseInt(clean, 10);
      const ms = clean.length === 10 ? num * 1000 : num;
      const d = new Date(ms);
      if (!isNaN(d.getTime())) return d.toISOString();
    }

    // Format: YYYY.MM.DD HH:mm:ss or YYYY.MM.DD HH:mm (MetaTrader format)
    const mtMatch = clean.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (mtMatch) {
      const [_, y, m, d, hh = '0', mm = '0', ss = '0'] = mtMatch;
      const date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    // Format: YYYY-MM-DD HH:mm:ss
    const isoSpaceMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (isoSpaceMatch) {
      const [_, y, m, d, hh = '0', mm = '0', ss = '0'] = isoSpaceMatch;
      const date = new Date(Date.UTC(+y, +m - 1, +d, +hh, +mm, +ss));
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    // Format: MM/DD/YYYY HH:mm:ss or DD/MM/YYYY HH:mm:ss
    const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (slashMatch) {
      const [_, p1, p2, y, hh = '0', mm = '0', ss = '0'] = slashMatch;
      let m = +p1;
      let d = +p2;
      // If p1 > 12, it must be DD/MM/YYYY
      if (m > 12 && d <= 12) {
        const temp = m;
        m = d;
        d = temp;
      }
      const date = new Date(Date.UTC(+y, m - 1, d, +hh, +mm, +ss));
      if (!isNaN(date.getTime())) return date.toISOString();
    }

    // Fallback Date constructor
    const parsed = new Date(clean);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  /**
   * Cleans and parses numeric strings (handles currencies, commas, percentages, brackets)
   */
  static parseCleanNumber(val: any): number | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;

    let s = String(val).trim();
    if (!s) return null;

    // Check for negative in parentheses: (120.50) -> -120.50
    const isParenthesesNegative = /^\(.*\)$/.test(s);
    s = s.replace(/[()]/g, '');

    // Strip currency symbols and whitespace
    s = s.replace(/[\$\€\£\¥\₹\s\,]/g, '');
    // Strip trailing percentage
    s = s.replace(/%$/, '');

    const num = parseFloat(s);
    if (isNaN(num)) return null;

    return isParenthesesNegative ? -Math.abs(num) : num;
  }

  /**
   * Normalizes trade direction (BUY, LONG, CALL -> LONG; SELL, SHORT, PUT -> SHORT)
   */
  static parseDirection(val: any): TradeDirection | null {
    if (!val) return null;
    const s = String(val).trim().toUpperCase();
    if (['BUY', 'LONG', 'B', 'CALL', '1'].includes(s)) return 'LONG';
    if (['SELL', 'SHORT', 'S', 'PUT', '-1', '2'].includes(s)) return 'SHORT';
    return null;
  }

  /**
   * Infers asset class from instrument symbol
   */
  static inferAssetClass(symbol: string): AssetClass {
    const s = (symbol || '').toUpperCase().trim();
    if (/^(BTC|ETH|SOL|XRP|BNB|DOGE|ADA|AVAX|DOT|LINK|LTC|USDT)/.test(s) || s.endsWith('USDT') || s.endsWith('PERP')) {
      return 'CRYPTO';
    }
    if (/^(EUR|GBP|USD|JPY|AUD|CAD|NZD|CHF)[A-Z]{3}$/.test(s) || /^(EUR|GBP|USD|JPY|AUD|CAD|NZD|CHF)\/(EUR|GBP|USD|JPY|AUD|CAD|NZD|CHF)$/.test(s)) {
      return 'FOREX';
    }
    if (['US30', 'NAS100', 'SPX500', 'GER40', 'UK100', 'DAX', 'NQ', 'ES', 'YM', 'RTY', 'NDX', 'SPY', 'QQQ', 'US500'].includes(s)) {
      return 'INDICES';
    }
    if (['XAUUSD', 'XAGUSD', 'GOLD', 'SILVER', 'USOIL', 'UKOIL', 'WTI', 'BRENT', 'CL', 'NG', 'GC', 'SI'].includes(s)) {
      return 'COMMODITIES';
    }
    if (['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX', 'AMD', 'INTC'].includes(s)) {
      return 'EQUITIES';
    }
    return 'FOREX';
  }

  /**
   * Infers market session from date timestamp (UTC hour)
   */
  static inferMarketSession(dateStr: string): MarketSession {
    try {
      const d = new Date(dateStr);
      const hour = d.getUTCHours();
      if (hour >= 21 || hour < 6) return 'SYDNEY';
      if (hour >= 0 && hour < 9) return 'TOKYO';
      if (hour >= 8 && hour < 12) return 'LONDON';
      if (hour >= 12 && hour < 16) return 'LONDON_NY_OVERLAP';
      if (hour >= 16 && hour < 21) return 'NEW_YORK';
      return 'NEW_YORK';
    } catch {
      return 'NEW_YORK';
    }
  }

  // =========================================================================
  // 3. Platform Adapters
  // =========================================================================

  static readonly ADAPTERS: IPlatformImportAdapter[] = [
    {
      name: 'TradeOS Standard CSV',
      preset: 'GENERIC_CSV',
      description: 'Standard TradeOS format with full qualitative and quantitative fields.',
      sampleHeaders: ['Instrument', 'Direction', 'EntryDate', 'ExitDate', 'EntryPrice', 'ExitPrice', 'Quantity', 'StopLoss', 'TakeProfit', 'NetPnL'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().replace(/[\s_\-]/g, ''));
        let score = 0;
        if (lower.includes('instrument') || lower.includes('symbol')) score += 0.3;
        if (lower.includes('direction') || lower.includes('side')) score += 0.2;
        if (lower.includes('entryprice') || lower.includes('openprice')) score += 0.2;
        if (lower.includes('netpnl') || lower.includes('pnl')) score += 0.2;
        if (lower.includes('tradeos') || lower.includes('r-multiple') || lower.includes('confluences')) score += 0.3;
        return Math.min(score, 1.0);
      },
      getDefaultMappings: (headers) => ImportExportEngine.autoMapColumns(headers),
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'MetaTrader 4 / 5 Report',
      preset: 'METATRADER_4_5',
      description: 'Exported trade history statement from MT4 or MT5 terminal (CSV / Report).',
      sampleHeaders: ['Ticket', 'Open Time', 'Type', 'Size', 'Item', 'Open Price', 'S / L', 'T / P', 'Close Time', 'Close Price', 'Commission', 'Taxes', 'Swap', 'Profit', 'Comment'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const mtHeaders = ['ticket', 'open time', 'type', 'size', 'item', 'open price', 'close time', 'close price', 'profit', 's / l', 't / p', 'swap'];
        for (const h of mtHeaders) {
          if (lower.includes(h) || lower.some(x => x.replace(/\s+/g, '') === h.replace(/\s+/g, ''))) {
            matches++;
          }
        }
        return matches >= 4 ? 0.95 : matches >= 2 ? 0.5 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\/]/g, '');
          if (clean === 'item' || clean === 'symbol') map.instrument = h;
          if (clean === 'type') map.direction = h;
          if (clean === 'opentime' || clean === 'time') map.entryDate = h;
          if (clean === 'closetime') map.exitDate = h;
          if (clean === 'openprice' || clean === 'price') map.entryPrice = h;
          if (clean === 'closeprice') map.exitPrice = h;
          if (clean === 'size' || clean === 'volume' || clean === 'lots') map.quantity = h;
          if (clean === 'sl' || clean === 'stoploss') map.stopLossPrice = h;
          if (clean === 'tp' || clean === 'takeprofit') map.takeProfitPrice = h;
          if (clean === 'commission') map.commission = h;
          if (clean === 'swap') map.swap = h;
          if (clean === 'taxes') map.fees = h;
          if (clean === 'profit' || clean === 'netprofit') map.netPnL = h;
          if (clean === 'comment') map.notes = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'cTrader History Statement',
      preset: 'CTRADER',
      description: 'Exported closed positions statement from cTrader.',
      sampleHeaders: ['Position Id', 'Symbol', 'Direction', 'Volume', 'Entry Time', 'Entry Price', 'Closing Time', 'Closing Price', 'Closing Gross PnL', 'Net PnL', 'Commission', 'Swap', 'Stop Loss', 'Take Profit', 'Comment'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const ctraderHeaders = ['position id', 'closing gross pnl', 'closing time', 'closing price', 'entry price', 'entry time'];
        for (const h of ctraderHeaders) {
          if (lower.includes(h) || lower.some(x => x.replace(/\s+/g, '') === h.replace(/\s+/g, ''))) {
            matches++;
          }
        }
        return matches >= 3 ? 0.95 : matches >= 2 ? 0.6 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\/]/g, '');
          if (clean === 'symbol') map.instrument = h;
          if (clean === 'direction' || clean === 'entrytype') map.direction = h;
          if (clean === 'entrytime') map.entryDate = h;
          if (clean === 'closingtime' || clean === 'closetime') map.exitDate = h;
          if (clean === 'entryprice') map.entryPrice = h;
          if (clean === 'closingprice' || clean === 'closeprice') map.exitPrice = h;
          if (clean === 'volume' || clean === 'quantity') map.quantity = h;
          if (clean === 'stoploss' || clean === 'sl') map.stopLossPrice = h;
          if (clean === 'takeprofit' || clean === 'tp') map.takeProfitPrice = h;
          if (clean === 'commission') map.commission = h;
          if (clean === 'swap') map.swap = h;
          if (clean === 'closinggrosspnl' || clean === 'grosspnl') map.grossPnL = h;
          if (clean === 'netpnl' || clean === 'netprofit') map.netPnL = h;
          if (clean === 'comment') map.notes = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'TradingView Trade History',
      preset: 'TRADINGVIEW',
      description: 'Exported trade log from TradingView broker or paper trading panel.',
      sampleHeaders: ['Symbol', 'Side', 'Qty', 'Price', 'Exit Price', 'Time', 'Closed Time', 'P&L', 'Profit', 'SL', 'TP', 'Strategy'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const tvHeaders = ['symbol', 'side', 'qty', 'price', 'exit price', 'closed time', 'p&l'];
        for (const h of tvHeaders) {
          if (lower.includes(h)) matches++;
        }
        return matches >= 4 ? 0.9 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\/]/g, '');
          if (clean === 'symbol') map.instrument = h;
          if (clean === 'side') map.direction = h;
          if (clean === 'time' || clean === 'opentime') map.entryDate = h;
          if (clean === 'closedtime' || clean === 'exittime') map.exitDate = h;
          if (clean === 'price' || clean === 'entryprice') map.entryPrice = h;
          if (clean === 'exitprice' || clean === 'closeprice') map.exitPrice = h;
          if (clean === 'qty' || clean === 'quantity' || clean === 'size') map.quantity = h;
          if (clean === 'sl' || clean === 'stoploss') map.stopLossPrice = h;
          if (clean === 'tp' || clean === 'takeprofit') map.takeProfitPrice = h;
          if (clean === 'p&l' || clean === 'profit' || clean === 'pl') map.netPnL = h;
          if (clean === 'strategy') map.strategyName = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'NinjaTrader 8 Trade Performance',
      preset: 'NINJATRADER_8',
      description: 'Trade Performance grid export from NinjaTrader 8.',
      sampleHeaders: ['Trade #', 'Instrument', 'Account', 'Strategy', 'Market pos.', 'Qty', 'Entry price', 'Exit price', 'Entry time', 'Exit time', 'Profit', 'Commission', 'MAE', 'MFE'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const ntHeaders = ['trade #', 'market pos.', 'entry time', 'exit time', 'mae', 'mfe'];
        for (const h of ntHeaders) {
          if (lower.includes(h) || lower.some(x => x.replace(/\s+/g, '') === h.replace(/\s+/g, ''))) matches++;
        }
        return matches >= 3 ? 0.95 : matches >= 2 ? 0.6 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\#\.]/g, '');
          if (clean === 'instrument' || clean === 'symbol') map.instrument = h;
          if (clean === 'marketpos' || clean === 'position') map.direction = h;
          if (clean === 'entrytime') map.entryDate = h;
          if (clean === 'exittime') map.exitDate = h;
          if (clean === 'entryprice') map.entryPrice = h;
          if (clean === 'exitprice') map.exitPrice = h;
          if (clean === 'qty' || clean === 'quantity') map.quantity = h;
          if (clean === 'profit' || clean === 'pnl') map.netPnL = h;
          if (clean === 'commission') map.commission = h;
          if (clean === 'strategy') map.strategyName = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'Interactive Brokers (IBKR)',
      preset: 'INTERACTIVE_BROKERS',
      description: 'Interactive Brokers Activity statement or Flex trade log CSV.',
      sampleHeaders: ['Symbol', 'Date/Time', 'Quantity', 'T. Price', 'C. Price', 'Proceeds', 'Comm/Fee', 'Basis', 'Realized P/L', 'Code'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const ibHeaders = ['t. price', 'c. price', 'proceeds', 'comm/fee', 'realized p/l'];
        for (const h of ibHeaders) {
          if (lower.includes(h)) matches++;
        }
        return matches >= 2 ? 0.9 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\/\.]/g, '');
          if (clean === 'symbol') map.instrument = h;
          if (clean === 'datetime' || clean === 'date') map.entryDate = h;
          if (clean === 'tprice' || clean === 'tradeprice') map.entryPrice = h;
          if (clean === 'cprice' || clean === 'closeprice') map.exitPrice = h;
          if (clean === 'quantity' || clean === 'qty') map.quantity = h;
          if (clean === 'commfee' || clean === 'commission') map.commission = h;
          if (clean === 'realizedpl' || clean === 'realizedpnl') map.netPnL = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => {
        const t = ImportExportEngine.applyDefaultTransform(raw, mappings, options);
        // In IBKR, quantity can be negative for sell orders
        if (mappings.quantity && raw[mappings.quantity]) {
          const rawQty = ImportExportEngine.parseCleanNumber(raw[mappings.quantity]);
          if (rawQty !== null) {
            t.quantity = Math.abs(rawQty);
            if (!t.direction) {
              t.direction = rawQty < 0 ? 'SHORT' : 'LONG';
            }
          }
        }
        return t;
      },
    },
    {
      name: 'TradeLocker / DXtrade',
      preset: 'TRADELOCKER_DXTRADE',
      description: 'Trade history statement from TradeLocker or DXtrade prop-firm platform.',
      sampleHeaders: ['Order ID', 'Symbol', 'Side', 'Volume', 'Open Price', 'Close Price', 'Open Time', 'Close Time', 'Net Profit', 'Gross Profit', 'SL', 'TP', 'Fees'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const tlHeaders = ['order id', 'net profit', 'gross profit', 'open time', 'close time', 'open price', 'close price'];
        for (const h of tlHeaders) {
          if (lower.includes(h)) matches++;
        }
        return matches >= 4 ? 0.9 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\/]/g, '');
          if (clean === 'symbol') map.instrument = h;
          if (clean === 'side') map.direction = h;
          if (clean === 'opentime') map.entryDate = h;
          if (clean === 'closetime') map.exitDate = h;
          if (clean === 'openprice') map.entryPrice = h;
          if (clean === 'closeprice') map.exitPrice = h;
          if (clean === 'volume' || clean === 'quantity') map.quantity = h;
          if (clean === 'sl' || clean === 'stoploss') map.stopLossPrice = h;
          if (clean === 'tp' || clean === 'takeprofit') map.takeProfitPrice = h;
          if (clean === 'fees' || clean === 'commission') map.fees = h;
          if (clean === 'netprofit') map.netPnL = h;
          if (clean === 'grossprofit') map.grossPnL = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => ImportExportEngine.applyDefaultTransform(raw, mappings, options),
    },
    {
      name: 'Crypto Exchange (Binance / Bybit)',
      preset: 'CRYPTO_EXCHANGE',
      description: 'Spot / Futures trade log export from Binance, Bybit, or OKX.',
      sampleHeaders: ['Date(UTC)', 'Pair', 'Market', 'Type', 'Price', 'Amount', 'Fee', 'Realized Profit', 'Total'],
      detectMatch: (headers) => {
        const lower = headers.map(h => h.toLowerCase().trim());
        let matches = 0;
        const cryptoHeaders = ['date(utc)', 'pair', 'market', 'realized profit', 'amount'];
        for (const h of cryptoHeaders) {
          if (lower.includes(h)) matches++;
        }
        return matches >= 3 ? 0.9 : 0;
      },
      getDefaultMappings: (headers) => {
        const map: FieldMappingConfig = {};
        for (const h of headers) {
          const clean = h.toLowerCase().replace(/[\s_\-\(\)\/]/g, '');
          if (clean === 'pair' || clean === 'market' || clean === 'symbol') map.instrument = h;
          if (clean === 'type' || clean === 'side') map.direction = h;
          if (clean === 'dateutc' || clean === 'date' || clean === 'time') map.entryDate = h;
          if (clean === 'price') map.entryPrice = h;
          if (clean === 'amount' || clean === 'executed' || clean === 'qty') map.quantity = h;
          if (clean === 'fee') map.fees = h;
          if (clean === 'realizedprofit' || clean === 'realizedpnl') map.netPnL = h;
        }
        return map;
      },
      transformRow: (raw, mappings, options) => {
        const t = ImportExportEngine.applyDefaultTransform(raw, mappings, options);
        t.assetClass = 'CRYPTO';
        return t;
      },
    },
  ];

  // =========================================================================
  // 4. Heuristic Column Auto-Mapping
  // =========================================================================

  /**
   * Auto-maps CSV headers to TradeOS standard fields using synonym heuristics
   */
  static autoMapColumns(headers: string[]): FieldMappingConfig {
    const mappings: FieldMappingConfig = {};

    const synonyms: Record<StandardTradeField, string[]> = {
      instrument: ['instrument', 'symbol', 'pair', 'ticker', 'item', 'asset', 'contract', 'market'],
      assetClass: ['assetclass', 'asset_class', 'asset_type', 'type_class', 'market_type'],
      direction: ['direction', 'side', 'type', 'position', 'market_pos', 'action', 'buy_sell'],
      status: ['status', 'state', 'trade_status'],
      entryDate: ['entrydate', 'entry_date', 'opentime', 'open_time', 'date', 'time', 'entry_time', 'datetime', 'date_utc', 'opened'],
      exitDate: ['exitdate', 'exit_date', 'closetime', 'close_time', 'exittime', 'exit_time', 'closed_time', 'closed'],
      entryPrice: ['entryprice', 'entry_price', 'openprice', 'open_price', 'price', 'entry', 't_price', 'avg_price'],
      exitPrice: ['exitprice', 'exit_price', 'closeprice', 'close_price', 'c_price', 'exit', 'closing_price'],
      quantity: ['quantity', 'qty', 'volume', 'size', 'lots', 'contracts', 'shares', 'units', 'amount'],
      stopLossPrice: ['stoplossprice', 'stop_loss', 'sl', 'stop', 'stop_loss_price', 's_l'],
      takeProfitPrice: ['takeprofitprice', 'take_profit', 'tp', 'target', 'take_profit_price', 't_p'],
      plannedRiskAmount: ['plannedriskamount', 'risk_amount', 'risk_$', 'planned_risk', 'risk_usd'],
      plannedRiskPercent: ['plannedriskpercent', 'risk_percent', 'risk_%', 'risk_pct'],
      commission: ['commission', 'comm', 'comm_fee', 'broker_fee', 'commissions'],
      swap: ['swap', 'financing', 'rollover', 'overnight'],
      spreadCost: ['spreadcost', 'spread_cost', 'spread'],
      fees: ['fees', 'fee', 'taxes', 'exchange_fee', 'other_fees'],
      grossPnL: ['grosspnl', 'gross_pnl', 'gross_profit', 'closing_gross_pnl', 'gross_pl'],
      netPnL: ['netpnl', 'net_pnl', 'net_profit', 'profit', 'pnl', 'p_l', 'realized_pnl', 'realized_pl', 'net_gain'],
      pipsOrPoints: ['pipsorpoints', 'pips', 'points', 'ticks', 'gain_pips'],
      strategyName: ['strategyname', 'strategy', 'setup', 'system', 'model'],
      setupName: ['setupname', 'setup_name', 'sub_setup'],
      confluences: ['confluences', 'confluence', 'triggers', 'reasons'],
      mistakes: ['mistakes', 'errors', 'violations', 'flaws'],
      notes: ['notes', 'note', 'comment', 'rationale', 'journal', 'description'],
      tags: ['tags', 'tag', 'labels', 'categories'],
      session: ['session', 'market_session', 'trading_session'],
    };

    const usedHeaders = new Set<string>();

    for (const field of Object.keys(synonyms) as StandardTradeField[]) {
      const matchTargets = synonyms[field];
      for (const header of headers) {
        if (usedHeaders.has(header)) continue;
        const normalized = header.toLowerCase().replace(/[\s_\-\/\.\(\)\#]/g, '');
        if (matchTargets.some(t => normalized === t.replace(/[\s_\-\/\.]/g, ''))) {
          mappings[field] = header;
          usedHeaders.add(header);
          break;
        }
      }
    }

    return mappings;
  }

  /**
   * Applies standard field transformations from mapped row
   */
  static applyDefaultTransform(
    raw: Record<string, string>, 
    mappings: FieldMappingConfig, 
    options?: Partial<ImportExecutionOptions>
  ): Partial<Trade> {
    const t: Partial<Trade> = {};

    // 1. Instrument
    if (mappings.instrument && raw[mappings.instrument]) {
      t.instrument = raw[mappings.instrument].trim().toUpperCase();
    }

    // 2. Asset Class
    if (mappings.assetClass && raw[mappings.assetClass]) {
      t.assetClass = raw[mappings.assetClass].trim().toUpperCase() as AssetClass;
    } else if (t.instrument) {
      t.assetClass = options?.defaultAssetClass || this.inferAssetClass(t.instrument);
    }

    // 3. Direction
    if (mappings.direction && raw[mappings.direction]) {
      const dir = this.parseDirection(raw[mappings.direction]);
      if (dir) t.direction = dir;
    }

    // 4. Dates
    if (mappings.entryDate && raw[mappings.entryDate]) {
      const entry = this.parseFlexibleDate(raw[mappings.entryDate]);
      if (entry) t.entryDate = entry;
    }
    if (mappings.exitDate && raw[mappings.exitDate]) {
      const exit = this.parseFlexibleDate(raw[mappings.exitDate]);
      if (exit) t.exitDate = exit;
    }

    // 5. Prices
    if (mappings.entryPrice && raw[mappings.entryPrice]) {
      const p = this.parseCleanNumber(raw[mappings.entryPrice]);
      if (p !== null) t.entryPrice = p;
    }
    if (mappings.exitPrice && raw[mappings.exitPrice]) {
      const p = this.parseCleanNumber(raw[mappings.exitPrice]);
      if (p !== null) t.exitPrice = p;
    }
    if (mappings.stopLossPrice && raw[mappings.stopLossPrice]) {
      const p = this.parseCleanNumber(raw[mappings.stopLossPrice]);
      if (p !== null) t.stopLossPrice = p;
    }
    if (mappings.takeProfitPrice && raw[mappings.takeProfitPrice]) {
      const p = this.parseCleanNumber(raw[mappings.takeProfitPrice]);
      if (p !== null) t.takeProfitPrice = p;
    }

    // 6. Quantity
    if (mappings.quantity && raw[mappings.quantity]) {
      const q = this.parseCleanNumber(raw[mappings.quantity]);
      if (q !== null) t.quantity = Math.abs(q);
    }

    // 7. Costs
    t.commission = mappings.commission && raw[mappings.commission] ? Math.abs(this.parseCleanNumber(raw[mappings.commission]) || 0) : 0;
    t.swap = mappings.swap && raw[mappings.swap] ? (this.parseCleanNumber(raw[mappings.swap]) || 0) : 0;
    t.fees = mappings.fees && raw[mappings.fees] ? Math.abs(this.parseCleanNumber(raw[mappings.fees]) || 0) : 0;
    t.spreadCost = mappings.spreadCost && raw[mappings.spreadCost] ? Math.abs(this.parseCleanNumber(raw[mappings.spreadCost]) || 0) : 0;

    // 8. PnL
    const rawNet = mappings.netPnL && raw[mappings.netPnL] ? this.parseCleanNumber(raw[mappings.netPnL]) : null;
    const rawGross = mappings.grossPnL && raw[mappings.grossPnL] ? this.parseCleanNumber(raw[mappings.grossPnL]) : null;

    if (rawNet !== null) {
      t.netPnL = rawNet;
      t.grossPnL = rawGross !== null ? rawGross : (rawNet + t.commission + Math.abs(t.swap) + t.fees);
    } else if (rawGross !== null) {
      t.grossPnL = rawGross;
      t.netPnL = rawGross - t.commission - Math.abs(t.swap) - t.fees;
    }

    // 9. Planned Risk
    if (mappings.plannedRiskAmount && raw[mappings.plannedRiskAmount]) {
      const r = this.parseCleanNumber(raw[mappings.plannedRiskAmount]);
      if (r !== null) t.plannedRiskAmount = Math.abs(r);
    }
    if (mappings.plannedRiskPercent && raw[mappings.plannedRiskPercent]) {
      const r = this.parseCleanNumber(raw[mappings.plannedRiskPercent]);
      if (r !== null) t.plannedRiskPercent = Math.abs(r);
    }

    // 10. Strategy & Categorization
    if (mappings.strategyName && raw[mappings.strategyName]) {
      t.strategyName = raw[mappings.strategyName].trim();
    }
    if (mappings.setupName && raw[mappings.setupName]) {
      t.setupName = raw[mappings.setupName].trim();
    }
    if (mappings.notes && raw[mappings.notes]) {
      t.notes = raw[mappings.notes].trim();
    }

    // Confluences & mistakes (split by comma or pipe)
    if (mappings.confluences && raw[mappings.confluences]) {
      t.confluences = raw[mappings.confluences].split(/[,|;]/).map(s => s.trim()).filter(Boolean);
    }
    if (mappings.mistakes && raw[mappings.mistakes]) {
      const mistakeList = raw[mappings.mistakes].split(/[,|;]/).map(s => s.trim()).filter(Boolean);
      t.psychology = {
        preTradeEmotion: 'CALM',
        disciplineScore: 8,
        confidenceScore: 8,
        stressLevel: 3,
        followedTradingPlan: mistakeList.length === 0,
        mistakes: mistakeList,
      };
    }
    if (mappings.tags && raw[mappings.tags]) {
      t.tags = raw[mappings.tags].split(/[,|;]/).map(s => s.trim()).filter(Boolean);
    }

    // 11. Session
    if (mappings.session && raw[mappings.session]) {
      t.session = raw[mappings.session].trim().toUpperCase() as MarketSession;
    } else if (t.entryDate) {
      t.session = options?.defaultSession || this.inferMarketSession(t.entryDate);
    }

    // 12. Status
    if (mappings.status && raw[mappings.status]) {
      const s = raw[mappings.status].trim().toUpperCase();
      if (['OPEN', 'CLOSED', 'PENDING', 'CANCELLED'].includes(s)) {
        t.status = s as TradeStatus;
      }
    }

    return t;
  }

  // =========================================================================
  // 5. Schema Detection & Adapter Matching
  // =========================================================================

  /**
   * Detects the best matching platform adapter for the provided headers and rows
   */
  static detectPlatform(headers: string[], firstRows: Record<string, string>[] = []): { preset: PlatformPreset; confidence: number; adapter: IPlatformImportAdapter } {
    let bestAdapter = this.ADAPTERS[0];
    let highestConfidence = -1;

    for (const adapter of this.ADAPTERS) {
      const conf = adapter.detectMatch(headers, firstRows);
      if (conf > highestConfidence) {
        highestConfidence = conf;
        bestAdapter = adapter;
      }
    }

    return {
      preset: bestAdapter.preset,
      confidence: Math.max(highestConfidence, 0),
      adapter: bestAdapter,
    };
  }

  // =========================================================================
  // 6. Validation & Duplicate Detection Engine
  // =========================================================================

  /**
   * Infers contract multiplier for futures and commodities
   */
  static inferContractMultiplier(instrument: string, assetClass?: AssetClass): number {
    const inst = (instrument || '').toUpperCase();
    if (inst.includes('NQ') || inst.includes('MNQ')) return 20;
    if (inst.includes('ES') || inst.includes('MES')) return 50;
    if (inst.includes('YM') || inst.includes('MYM')) return 5;
    if (inst.includes('XAU') || inst.includes('GOLD')) return 100;
    if (inst.includes('CL') || inst.includes('OIL')) return 1000;
    if (assetClass === 'FUTURES') return 20;
    return 1;
  }

  /**
   * Generates a deterministic signature for duplicate checking
   */
  static getTradeSignature(trade: { accountId?: string; instrument?: string; direction?: string; entryDate?: string; entryPrice?: number; quantity?: number }): string {
    const acc = trade.accountId || 'acc';
    const inst = (trade.instrument || '').toUpperCase().trim();
    const dir = trade.direction || '';
    // Use date up to minute precision to tolerate minor timestamp seconds drift
    const dateKey = (trade.entryDate || '').slice(0, 16);
    const priceKey = trade.entryPrice !== undefined ? Number(trade.entryPrice).toFixed(4) : '';
    const qtyKey = trade.quantity !== undefined ? Number(trade.quantity).toFixed(2) : '';

    return `${acc}::${inst}::${dir}::${dateKey}::${priceKey}::${qtyKey}`;
  }

  /**
   * Alias for getTradeSignature
   */
  static generateTradeSignature(accountId: string, instrument: string, direction: string, entryDate: string, entryPrice: number, quantity: number): string {
    return this.getTradeSignature({ accountId, instrument, direction, entryDate, entryPrice, quantity });
  }

  /**
   * Validates a transformed row against business constraints
   */
  static validateRow(
    trade: Partial<Trade>, 
    rowIndex: number, 
    raw: Record<string, string>
  ): { status: ImportValidationStatus; errors: ImportRowError[]; warnings: string[] } {
    const errors: ImportRowError[] = [];
    const warnings: string[] = [];

    // Required fields check
    if (!trade.instrument) {
      errors.push({
        rowNumber: rowIndex + 1,
        field: 'instrument',
        message: 'Instrument / Symbol is required (e.g. EURUSD, NAS100, BTCUSDT).',
      });
    }

    if (!trade.direction) {
      errors.push({
        rowNumber: rowIndex + 1,
        field: 'direction',
        message: 'Direction is required (LONG, SHORT, BUY, SELL).',
      });
    }

    if (!trade.entryDate) {
      errors.push({
        rowNumber: rowIndex + 1,
        field: 'entryDate',
        message: 'Valid Entry Date/Time is required.',
      });
    }

    if (trade.entryPrice === undefined || trade.entryPrice === null || isNaN(trade.entryPrice) || trade.entryPrice <= 0) {
      errors.push({
        rowNumber: rowIndex + 1,
        field: 'entryPrice',
        message: 'Entry price must be a positive valid number.',
        rawValue: trade.entryPrice,
      });
    }

    if (trade.quantity === undefined || trade.quantity === null || isNaN(trade.quantity) || trade.quantity <= 0) {
      errors.push({
        rowNumber: rowIndex + 1,
        field: 'quantity',
        message: 'Quantity / Position size must be a positive number greater than 0.',
        rawValue: trade.quantity,
      });
    }

    // Warnings & soft checks
    if (!trade.stopLossPrice) {
      warnings.push('No Stop Loss price defined. Planned risk calculated as 0.');
    } else if (trade.entryPrice && trade.direction) {
      if (trade.direction === 'LONG' && trade.stopLossPrice >= trade.entryPrice) {
        warnings.push('Long Stop Loss is higher than or equal to Entry Price.');
      } else if (trade.direction === 'SHORT' && trade.stopLossPrice <= trade.entryPrice) {
        warnings.push('Short Stop Loss is lower than or equal to Entry Price.');
      }
    }

    if (trade.netPnL === undefined && trade.grossPnL === undefined && trade.exitPrice !== undefined && trade.entryPrice !== undefined) {
      warnings.push('PnL was not supplied in CSV and will be derived from price differential.');
    }

    const status: ImportValidationStatus = errors.length > 0 ? 'INVALID' : (warnings.length > 0 ? 'WARNING' : 'VALID');

    return { status, errors, warnings };
  }

  /**
   * Normalizes a valid or warning trade, filling all computed quantitative fields
   */
  static normalizeTrade(
    partial: Partial<Trade>, 
    options: ImportExecutionOptions, 
    userId: string
  ): Omit<Trade, 'id' | 'createdAt' | 'updatedAt'> {
    const entryDate = partial.entryDate || new Date().toISOString();
    const entryPrice = partial.entryPrice || 0;
    const exitPrice = partial.exitPrice;
    const quantity = partial.quantity || 1;
    const direction = partial.direction || 'LONG';
    const instrument = (partial.instrument || 'UNKNOWN').toUpperCase();
    const assetClass = partial.assetClass || options.defaultAssetClass || this.inferAssetClass(instrument);

    // Derived costs
    const commission = partial.commission || 0;
    const swap = partial.swap || 0;
    const spreadCost = partial.spreadCost || 0;
    const fees = partial.fees || 0;

    // Derived Net / Gross PnL
    let grossPnL = partial.grossPnL;
    let netPnL = partial.netPnL;

    if (grossPnL === undefined && netPnL === undefined && exitPrice !== undefined) {
      const mult = partial.contractMultiplier || this.inferContractMultiplier(instrument, assetClass);
      grossPnL = CalculationEngine.calculateGrossPnL(direction, entryPrice, exitPrice, quantity, mult);
      netPnL = grossPnL - commission - Math.abs(swap) - spreadCost - fees;
    } else if (netPnL !== undefined && grossPnL === undefined) {
      grossPnL = netPnL + commission + Math.abs(swap) + spreadCost + fees;
    } else if (grossPnL !== undefined && netPnL === undefined) {
      netPnL = grossPnL - commission - Math.abs(swap) - spreadCost - fees;
    } else if (netPnL === undefined && grossPnL === undefined) {
      grossPnL = 0;
      netPnL = 0;
    }

    // Status
    const status: TradeStatus = partial.status || (exitPrice !== undefined || partial.exitDate !== undefined ? 'CLOSED' : 'OPEN');

    // Outcome
    let outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN' = 'OPEN';
    if (status === 'CLOSED') {
      if ((netPnL || 0) > 0.001) outcome = 'WIN';
      else if ((netPnL || 0) < -0.001) outcome = 'LOSS';
      else outcome = 'BREAKEVEN';
    }

    // Holding duration
    let holdingTimeSeconds: number | undefined;
    if (partial.exitDate && partial.entryDate) {
      const start = new Date(partial.entryDate).getTime();
      const end = new Date(partial.exitDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        holdingTimeSeconds = Math.round((end - start) / 1000);
      }
    }

    // Planned Risk
    let plannedRiskAmount = partial.plannedRiskAmount || 0;
    if (!plannedRiskAmount && partial.stopLossPrice && entryPrice > 0) {
      const mult = partial.contractMultiplier || this.inferContractMultiplier(instrument, assetClass);
      plannedRiskAmount = CalculationEngine.calculatePlannedRisk(direction, entryPrice, partial.stopLossPrice, quantity, mult);
    }

    // Achieved R-Multiple
    let achievedRMultiple: number | undefined;
    if (plannedRiskAmount > 0 && netPnL !== undefined) {
      achievedRMultiple = Number((netPnL / plannedRiskAmount).toFixed(2));
    }

    return {
      userId,
      workspaceId: 'ws_default',
      accountId: options.accountId,
      instrument,
      assetClass,
      direction,
      status,
      entryDate,
      exitDate: partial.exitDate,
      holdingTimeSeconds,
      session: partial.session || options.defaultSession || this.inferMarketSession(entryDate),
      entryPrice,
      exitPrice,
      stopLossPrice: partial.stopLossPrice,
      takeProfitPrice: partial.takeProfitPrice,
      quantity,
      contractMultiplier: partial.contractMultiplier || this.inferContractMultiplier(instrument, assetClass),
      plannedRiskAmount,
      plannedRiskPercent: partial.plannedRiskPercent || 1.0,
      commission,
      swap,
      spreadCost,
      fees,
      grossPnL: Number((grossPnL || 0).toFixed(2)),
      netPnL: Number((netPnL || 0).toFixed(2)),
      pnlPercentage: Number(((netPnL || 0) / (entryPrice * quantity || 1) * 100).toFixed(2)),
      achievedRMultiple,
      outcome,
      strategyId: options.strategyId || partial.strategyId,
      strategyName: partial.strategyName,
      setupName: partial.setupName,
      confluences: partial.confluences || [],
      tags: options.tag ? [...(partial.tags || []), options.tag] : (partial.tags || []),
      notes: partial.notes,
      psychology: partial.psychology,
    };
  }

  // =========================================================================
  // 7. Preview & Full Pipeline Generation
  // =========================================================================

  /**
   * Generates complete preview analysis from CSV text
   */
  static async generatePreview(
    rawText: string, 
    userId: string, 
    accountId: string, 
    customMappings?: FieldMappingConfig, 
    explicitPreset?: PlatformPreset
  ): Promise<ImportPreviewResult> {
    const { headers, rows, delimiter } = this.parseCsv(rawText);

    if (headers.length === 0 || rows.length === 0) {
      return {
        totalRows: 0,
        detectedPlatform: 'GENERIC_CSV',
        detectedDelimiter: delimiter,
        headers: [],
        columnHeaders: [],
        mappings: {},
        rows: [],
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
        warningCount: 0,
      };
    }

    // Platform detection
    const { preset, adapter } = explicitPreset && explicitPreset !== 'AUTO_DETECT'
      ? { preset: explicitPreset, adapter: this.ADAPTERS.find(a => a.preset === explicitPreset) || this.ADAPTERS[0] }
      : this.detectPlatform(headers, rows.slice(0, 5));

    const mappings = customMappings || adapter.getDefaultMappings(headers);

    // Column headers metadata
    const columnHeaders: ColumnHeaderInfo[] = headers.map(h => {
      const sampleVals = rows.slice(0, 3).map(r => r[h] || '').filter(Boolean);
      // Find mapped standard field
      const standardKey = (Object.keys(mappings) as StandardTradeField[]).find(k => mappings[k] === h);
      return {
        header: h,
        sampleValues: sampleVals,
        suggestedField: standardKey,
        isMapped: !!standardKey,
      };
    });

    // Existing trades for duplicate detection
    const existingTrades = await this.tradeRepo.getTrades(userId, accountId);
    const existingSignatures = new Map<string, string>(); // signature -> tradeId
    for (const ext of existingTrades) {
      const sig = this.getTradeSignature(ext);
      existingSignatures.set(sig, ext.id);
    }

    // Parse each row
    const parsedRows: ImportParsedRow[] = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    let warningCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const transformed = adapter.transformRow(raw, mappings, { accountId });
      const validation = this.validateRow(transformed, i, raw);

      // Check duplicate
      const rowSig = this.getTradeSignature({ ...transformed, accountId });
      const duplicateTradeId = existingSignatures.get(rowSig);
      const isDuplicate = !!duplicateTradeId;

      let finalStatus = validation.status;
      if (isDuplicate) {
        duplicateCount++;
        finalStatus = 'DUPLICATE';
      } else if (validation.status === 'VALID') {
        validCount++;
      } else if (validation.status === 'WARNING') {
        warningCount++;
      } else if (validation.status === 'INVALID') {
        invalidCount++;
      }

      parsedRows.push({
        rowIndex: i,
        raw,
        mapped: transformed,
        status: finalStatus,
        errors: validation.errors,
        warnings: validation.warnings,
        isDuplicate,
        duplicateTradeId,
      });
    }

    return {
      totalRows: rows.length,
      detectedPlatform: preset,
      detectedDelimiter: delimiter,
      headers,
      columnHeaders,
      mappings,
      rows: parsedRows,
      validCount,
      invalidCount,
      duplicateCount,
      warningCount,
    };
  }

  // =========================================================================
  // 8. Batch Import Execution & Safe Rollback Mechanics
  // =========================================================================

  /**
   * Executes batch import and preserves historical audit batch for rollback
   */
  static async executeImport(
    userId: string,
    accountName: string,
    filename: string,
    previewResult: ImportPreviewResult,
    options: ImportExecutionOptions
  ): Promise<{ batch: ImportBatch; importedTrades: Trade[]; skippedCount: number; errorsCount: number }> {
    const importedTrades: Trade[] = [];
    const createdTradeIds: string[] = [];
    let skippedCount = 0;
    let invalidCount = 0;

    for (const row of previewResult.rows) {
      if (row.status === 'INVALID') {
        invalidCount++;
        continue;
      }

      if (row.isDuplicate) {
        if (options.duplicateHandling === 'SKIP') {
          skippedCount++;
          continue;
        } else if (options.duplicateHandling === 'OVERWRITE' && row.duplicateTradeId) {
          const normalized = this.normalizeTrade(row.mapped, options, userId);
          const updated = await this.tradeRepo.updateTrade(userId, row.duplicateTradeId, normalized);
          importedTrades.push(updated);
          createdTradeIds.push(updated.id);
          continue;
        }
      }

      // Standard insert
      const normalized = this.normalizeTrade(row.mapped, options, userId);
      const created = await this.tradeRepo.createTrade(normalized);
      importedTrades.push(created);
      createdTradeIds.push(created.id);
    }

    // Save batch record for rollback
    const batch = await this.importExportRepo.saveBatch(userId, {
      userId,
      accountId: options.accountId,
      accountName,
      filename,
      platformPreset: previewResult.detectedPlatform,
      totalRows: previewResult.totalRows,
      importedCount: createdTradeIds.length,
      skippedDuplicatesCount: skippedCount,
      invalidCount,
      tradeIds: createdTradeIds,
    });

    return {
      batch,
      importedTrades,
      skippedCount,
      errorsCount: invalidCount,
    };
  }

  /**
   * Safely rolls back an imported batch by deleting all trades created by this batch
   */
  static async rollbackBatch(userId: string, batchId: string): Promise<{ success: boolean; deletedCount: number; batch: ImportBatch }> {
    const batch = await this.importExportRepo.getBatchById(userId, batchId);
    if (!batch) {
      throw new Error(`Import batch ${batchId} not found.`);
    }

    if (batch.status === 'ROLLED_BACK') {
      throw new Error(`Import batch ${batchId} has already been rolled back.`);
    }

    let deletedCount = 0;
    for (const tradeId of batch.tradeIds) {
      const deleted = await this.tradeRepo.deleteTrade(userId, tradeId);
      if (deleted) deletedCount++;
    }

    const updatedBatch = await this.importExportRepo.updateBatchStatus(userId, batchId, 'ROLLED_BACK');

    return {
      success: true,
      deletedCount,
      batch: updatedBatch,
    };
  }

  // =========================================================================
  // 9. Exporters: Clean CSV & Full JSON Backup
  // =========================================================================

  /**
   * Exports trade list to clean standard RFC-4180 CSV
   */
  static exportTradesToCsv(trades: Trade[]): string {
    const headers = [
      'Trade ID',
      'Instrument',
      'Asset Class',
      'Direction',
      'Status',
      'Entry Date',
      'Exit Date',
      'Entry Price',
      'Exit Price',
      'Stop Loss',
      'Take Profit',
      'Quantity',
      'Contract Multiplier',
      'Planned Risk ($)',
      'Planned Risk (%)',
      'Gross PnL ($)',
      'Net PnL ($)',
      'PnL (%)',
      'Achieved R',
      'Outcome',
      'Session',
      'Commission',
      'Swap',
      'Spread Cost',
      'Fees',
      'Holding Time (s)',
      'Strategy',
      'Setup',
      'Confluences',
      'Mistakes',
      'Tags',
      'Notes'
    ];

    const escape = (val: any): string => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows = trades.map(t => [
      t.id,
      t.instrument,
      t.assetClass,
      t.direction,
      t.status,
      t.entryDate,
      t.exitDate || '',
      t.entryPrice,
      t.exitPrice !== undefined ? t.exitPrice : '',
      t.stopLossPrice !== undefined ? t.stopLossPrice : '',
      t.takeProfitPrice !== undefined ? t.takeProfitPrice : '',
      t.quantity,
      t.contractMultiplier || 1,
      t.plannedRiskAmount || 0,
      t.plannedRiskPercent || 0,
      t.grossPnL,
      t.netPnL,
      t.pnlPercentage,
      t.achievedRMultiple !== undefined ? t.achievedRMultiple : '',
      t.outcome || '',
      t.session,
      t.commission || 0,
      t.swap || 0,
      t.spreadCost || 0,
      t.fees || 0,
      t.holdingTimeSeconds || '',
      t.strategyName || '',
      t.setupName || '',
      (t.confluences || []).join('; '),
      (t.psychology?.mistakes || []).join('; '),
      (t.tags || []).join('; '),
      t.notes || ''
    ].map(escape).join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Exports trade list to JSON format
   */
  static exportTradesToJson(trades: Trade[], metadata?: Record<string, any>): string {
    const payload = {
      version: '1.0.0',
      schema: 'TradeOS_Trade_Journal',
      exportedAt: new Date().toISOString(),
      tradeCount: trades.length,
      metadata: metadata || {},
      trades,
    };
    return JSON.stringify(payload, null, 2);
  }
}
