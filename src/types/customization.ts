/**
 * Customization, Workspaces, Widgets & Advanced Visualization Types
 * Phase 15: Advanced Customization & Multiple Workspaces Domain Model
 */

import { DashboardFilterState, DashboardWidgetConfig } from './calculations';
import { AssetClass, MarketSession } from './domain';

export type DisplayDensity = 'compact' | 'standard' | 'spacious';

export type ThemePresetId = 'cyberpunk_dark' | 'obsidian_jet' | 'midnight_slate' | 'bloomberg_amber';

export type KPIKey =
  | 'netPnL'
  | 'winRate'
  | 'profitFactor'
  | 'expectancy'
  | 'maxDrawdown'
  | 'sharpeRatio'
  | 'sortinoRatio'
  | 'avgRR'
  | 'totalTrades'
  | 'kellyCriterion'
  | 'averageWin'
  | 'averageLoss'
  | 'payoffRatio'
  | 'recoveryFactor'
  | 'maxWinStreak'
  | 'maxLossStreak'
  | 'longWinRate'
  | 'shortWinRate'
  | 'totalCommissions'
  | 'avgHoldingTime';

export interface KPIDefinition {
  key: KPIKey;
  label: string;
  category: 'FINANCIAL' | 'STATISTICAL' | 'RISK' | 'EXECUTION';
  description: string;
  format: 'CURRENCY' | 'PERCENT' | 'RATIO' | 'NUMBER' | 'DURATION';
}

export interface DashboardWidgetSetting {
  timeframeOverride?: string;
  accountIdOverride?: string;
  chartType?: 'AREA' | 'LINE' | 'BAR' | 'CANDLE' | 'SCATTER' | 'HISTOGRAM';
  showLegend?: boolean;
  height?: 'compact' | 'standard' | 'expanded';
  colSpan?: 1 | 2 | 3 | 4;
  customTitle?: string;
  accentColor?: string;
  selectedMetric?: string;
}

export interface CustomWidgetConfig extends DashboardWidgetConfig {
  colSpan?: 1 | 2 | 3 | 4;
  height?: 'compact' | 'standard' | 'expanded';
  customSettings?: DashboardWidgetSetting;
}

export interface DashboardWorkspace {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  presetType?: string;
  icon?: string;
  widgets: CustomWidgetConfig[];
  kpiSelection: KPIKey[];
  defaultFilters?: Partial<DashboardFilterState>;
  density: DisplayDensity;
  themeId: ThemePresetId;
  createdAt: string;
  updatedAt: string;
}

export interface SavedFilterPreset {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category?: string;
  filters: DashboardFilterState;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedViewPreset {
  id: string;
  userId: string;
  targetView: 'DASHBOARD' | 'ANALYTICS' | 'JOURNAL' | 'RISK' | 'PSYCHOLOGY';
  name: string;
  description?: string;
  workspaceId?: string;
  filters?: DashboardFilterState;
  columnVisibility?: Record<string, boolean>;
  activeSubTab?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeColumnConfig {
  id: string;
  label: string;
  group: 'CORE' | 'PRICING' | 'PNL' | 'RISK' | 'TAGS' | 'ACTIONS';
  visible: boolean;
  order: number;
  minWidth?: number;
}

export interface TradeEntryTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  instrument: string;
  assetClass: AssetClass;
  direction: 'LONG' | 'SHORT';
  quantity?: number;
  plannedRiskPercent?: number;
  plannedRiskAmount?: number;
  plannedRRRatio?: number;
  strategyId?: string;
  playbookId?: string;
  setupId?: string;
  session?: MarketSession;
  defaultTags?: string[];
  defaultNotes?: string;
  isFavorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThemeConfig {
  id: ThemePresetId;
  name: string;
  badge: string;
  description: string;
  primaryAccent: string;
  canvasBg: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  accentText: string;
}
