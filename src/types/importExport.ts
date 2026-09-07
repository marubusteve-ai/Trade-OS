/**
 * Import & Export Domain Types & Platform Adapter Interfaces
 * 
 * Supports CSV/JSON parsing, schema detection, column mapping,
 * validation, duplicate detection, batch import, and safe rollback.
 */

import { Trade, AssetClass, TradeDirection, TradeStatus, MarketSession } from './domain';

export type PlatformPreset = 
  | 'AUTO_DETECT'
  | 'GENERIC_CSV'
  | 'METATRADER_4_5'
  | 'CTRADER'
  | 'TRADINGVIEW'
  | 'NINJATRADER_8'
  | 'INTERACTIVE_BROKERS'
  | 'TRADELOCKER_DXTRADE'
  | 'CRYPTO_EXCHANGE'
  | 'JSON_BACKUP';

export type StandardTradeField = 
  | 'instrument'
  | 'assetClass'
  | 'direction'
  | 'status'
  | 'entryDate'
  | 'exitDate'
  | 'entryPrice'
  | 'exitPrice'
  | 'quantity'
  | 'stopLossPrice'
  | 'takeProfitPrice'
  | 'plannedRiskAmount'
  | 'plannedRiskPercent'
  | 'commission'
  | 'swap'
  | 'spreadCost'
  | 'fees'
  | 'grossPnL'
  | 'netPnL'
  | 'pipsOrPoints'
  | 'strategyName'
  | 'setupName'
  | 'confluences'
  | 'mistakes'
  | 'notes'
  | 'tags'
  | 'session';

export type FieldMappingConfig = {
  [key in StandardTradeField]?: string;
};

export interface ColumnHeaderInfo {
  header: string;
  sampleValues: string[];
  suggestedField?: StandardTradeField;
  isMapped: boolean;
}

export type ImportValidationStatus = 'VALID' | 'INVALID' | 'DUPLICATE' | 'WARNING';

export interface ImportRowError {
  rowNumber: number;
  field?: StandardTradeField | string;
  message: string;
  rawValue?: any;
}

export interface ImportParsedRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: Partial<Trade>;
  status: ImportValidationStatus;
  errors: ImportRowError[];
  warnings: string[];
  isDuplicate: boolean;
  duplicateTradeId?: string;
}

export interface ImportPreviewResult {
  totalRows: number;
  detectedPlatform: PlatformPreset;
  detectedDelimiter: string;
  headers: string[];
  columnHeaders: ColumnHeaderInfo[];
  mappings: FieldMappingConfig;
  rows: ImportParsedRow[];
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  warningCount: number;
}

export type DuplicateHandlingOption = 'SKIP' | 'OVERWRITE' | 'IMPORT_AS_NEW';

export interface ImportExecutionOptions {
  accountId: string;
  duplicateHandling: DuplicateHandlingOption;
  defaultAssetClass?: AssetClass;
  defaultSession?: MarketSession;
  strategyId?: string;
  tag?: string;
}

export interface ImportBatch {
  id: string;
  userId: string;
  accountId: string;
  accountName: string;
  filename: string;
  platformPreset: PlatformPreset;
  importedAt: string;
  totalRows: number;
  importedCount: number;
  skippedDuplicatesCount: number;
  invalidCount: number;
  tradeIds: string[];
  status: 'ACTIVE' | 'ROLLED_BACK';
}

export type ExportFormat = 'CSV' | 'JSON';

export interface ExportFilterConfig {
  accountId?: string;
  assetClass?: AssetClass | 'ALL';
  direction?: TradeDirection | 'ALL';
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'ALL';
  startDate?: string;
  endDate?: string;
  strategyId?: string;
  format: ExportFormat;
  includeMetadata?: boolean;
}

export interface IPlatformImportAdapter {
  name: string;
  preset: PlatformPreset;
  description: string;
  sampleHeaders: string[];
  detectMatch: (headers: string[], firstRows: Record<string, string>[]) => number; // 0 to 1 confidence
  getDefaultMappings: (headers: string[]) => FieldMappingConfig;
  transformRow: (raw: Record<string, string>, mappings: FieldMappingConfig, options?: Partial<ImportExecutionOptions>) => Partial<Trade>;
}
