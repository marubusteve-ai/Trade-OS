/**
 * Customization, Workspaces, Widgets & User Personalization Service
 * TradeOS Phase 15 Service Layer
 */

import { LocalDatabase } from '../repositories/localDatabase';
import {
  DashboardWorkspace,
  CustomWidgetConfig,
  KPIKey,
  KPIDefinition,
  SavedFilterPreset,
  SavedViewPreset,
  TradeColumnConfig,
  TradeEntryTemplate,
  ThemeConfig,
  ThemePresetId,
  DisplayDensity,
} from '../types/customization';
import { DashboardFilterState } from '../types/calculations';

const WORKSPACES_COLLECTION = 'custom_workspaces';
const SAVED_FILTERS_COLLECTION = 'saved_filters';
const SAVED_VIEWS_COLLECTION = 'saved_views';
const TRADE_TEMPLATES_COLLECTION = 'trade_templates';
const COLUMN_CONFIG_COLLECTION = 'trade_column_configs';
const USER_PREFS_KEY_PREFIX = 'tradeos_user_custom_prefs_';

export const ALL_KPI_DEFINITIONS: KPIDefinition[] = [
  {
    key: 'netPnL',
    label: 'Net P&L',
    category: 'FINANCIAL',
    description: 'Total realized net profit and loss after all fees, commissions, and swaps.',
    format: 'CURRENCY',
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    category: 'STATISTICAL',
    description: 'Percentage of closed trades that resulted in positive net profit.',
    format: 'PERCENT',
  },
  {
    key: 'profitFactor',
    label: 'Profit Factor',
    category: 'STATISTICAL',
    description: 'Gross Profit divided by absolute Gross Loss. Above 1.5 indicates institutional edge.',
    format: 'RATIO',
  },
  {
    key: 'expectancy',
    label: 'Expectancy ($)',
    category: 'STATISTICAL',
    description: 'Expected dollar return per trade based on historical edge.',
    format: 'CURRENCY',
  },
  {
    key: 'maxDrawdown',
    label: 'Max Drawdown',
    category: 'RISK',
    description: 'Maximum peak-to-trough decline in account equity.',
    format: 'PERCENT',
  },
  {
    key: 'sharpeRatio',
    label: 'Sharpe Ratio',
    category: 'STATISTICAL',
    description: 'Annualized risk-adjusted return ratio. Above 2.0 indicates superior quality.',
    format: 'RATIO',
  },
  {
    key: 'sortinoRatio',
    label: 'Sortino Ratio',
    category: 'STATISTICAL',
    description: 'Risk-adjusted return focusing exclusively on downside volatility.',
    format: 'RATIO',
  },
  {
    key: 'avgRR',
    label: 'Avg Realized R:R',
    category: 'EXECUTION',
    description: 'Average realized R-Multiple outcome across all closed executions.',
    format: 'RATIO',
  },
  {
    key: 'totalTrades',
    label: 'Total Executions',
    category: 'EXECUTION',
    description: 'Total number of logged trades in the selected dataset.',
    format: 'NUMBER',
  },
  {
    key: 'kellyCriterion',
    label: 'Kelly Sizing %',
    category: 'RISK',
    description: 'Optimal fractional betting sizing percentage derived from win rate and payoff ratio.',
    format: 'PERCENT',
  },
  {
    key: 'averageWin',
    label: 'Average Win',
    category: 'FINANCIAL',
    description: 'Mean dollar profit of all winning trades.',
    format: 'CURRENCY',
  },
  {
    key: 'averageLoss',
    label: 'Average Loss',
    category: 'FINANCIAL',
    description: 'Mean dollar loss of all losing trades.',
    format: 'CURRENCY',
  },
  {
    key: 'payoffRatio',
    label: 'Payoff Ratio',
    category: 'STATISTICAL',
    description: 'Ratio of Average Win to Average Loss.',
    format: 'RATIO',
  },
  {
    key: 'recoveryFactor',
    label: 'Recovery Factor',
    category: 'RISK',
    description: 'Net P&L divided by maximum drawdown dollar amount.',
    format: 'RATIO',
  },
  {
    key: 'maxWinStreak',
    label: 'Max Win Streak',
    category: 'EXECUTION',
    description: 'Highest consecutive winning trade sequence.',
    format: 'NUMBER',
  },
  {
    key: 'maxLossStreak',
    label: 'Max Loss Streak',
    category: 'EXECUTION',
    description: 'Highest consecutive losing trade sequence.',
    format: 'NUMBER',
  },
  {
    key: 'longWinRate',
    label: 'Long Win Rate',
    category: 'EXECUTION',
    description: 'Win rate exclusively on BUY / LONG positions.',
    format: 'PERCENT',
  },
  {
    key: 'shortWinRate',
    label: 'Short Win Rate',
    category: 'EXECUTION',
    description: 'Win rate exclusively on SELL / SHORT positions.',
    format: 'PERCENT',
  },
  {
    key: 'totalCommissions',
    label: 'Total Fees & Comm',
    category: 'FINANCIAL',
    description: 'Total cumulative brokerage commissions, slippage, and swap charges.',
    format: 'CURRENCY',
  },
  {
    key: 'avgHoldingTime',
    label: 'Avg Duration',
    category: 'EXECUTION',
    description: 'Average holding time duration per position.',
    format: 'DURATION',
  },
];

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'cyberpunk_dark',
    name: 'Cyberpunk Emerald',
    badge: 'DEFAULT',
    description: 'Deep obsidian dark canvas with high-contrast emerald & cyan neon accents.',
    primaryAccent: '#10B981',
    canvasBg: '#0C0D0F',
    cardBg: '#15171A',
    cardBorder: '#22252A',
    headerBg: '#111315',
    accentText: 'text-emerald-400',
  },
  {
    id: 'obsidian_jet',
    name: 'Obsidian Jet',
    badge: 'HIGH CONTRAST',
    description: 'Pitch black OLED canvas with surgical crisp borders and pure white displays.',
    primaryAccent: '#3B82F6',
    canvasBg: '#000000',
    cardBg: '#0F0F12',
    cardBorder: '#26262B',
    headerBg: '#0A0A0C',
    accentText: 'text-blue-400',
  },
  {
    id: 'midnight_slate',
    name: 'Midnight Slate',
    badge: 'PRO TRADER',
    description: 'Refined deep indigo slate canvas with violet and sapphire indicators.',
    primaryAccent: '#8B5CF6',
    canvasBg: '#0B0D14',
    cardBg: '#121622',
    cardBorder: '#1E2438',
    headerBg: '#0E111B',
    accentText: 'text-purple-400',
  },
  {
    id: 'bloomberg_amber',
    name: 'Bloomberg Terminal',
    badge: 'QUANT',
    description: 'Classic institutional terminal theme with amber, carbon, and monospaced clarity.',
    primaryAccent: '#F59E0B',
    canvasBg: '#0D0C0A',
    cardBg: '#171512',
    cardBorder: '#2B261F',
    headerBg: '#13110E',
    accentText: 'text-amber-400',
  },
];

export const DEFAULT_TRADE_COLUMNS: TradeColumnConfig[] = [
  { id: 'entryDate', label: 'Entry Date/Time', group: 'CORE', visible: true, order: 1, minWidth: 140 },
  { id: 'instrument', label: 'Symbol / Pair', group: 'CORE', visible: true, order: 2, minWidth: 110 },
  { id: 'direction', label: 'Side', group: 'CORE', visible: true, order: 3, minWidth: 80 },
  { id: 'assetClass', label: 'Asset Class', group: 'CORE', visible: true, order: 4, minWidth: 100 },
  { id: 'quantity', label: 'Size / Lots', group: 'PRICING', visible: true, order: 5, minWidth: 90 },
  { id: 'entryPrice', label: 'Entry Price', group: 'PRICING', visible: true, order: 6, minWidth: 100 },
  { id: 'exitPrice', label: 'Exit Price', group: 'PRICING', visible: true, order: 7, minWidth: 100 },
  { id: 'stopLoss', label: 'Stop Loss', group: 'PRICING', visible: true, order: 8, minWidth: 95 },
  { id: 'takeProfit', label: 'Take Profit', group: 'PRICING', visible: true, order: 9, minWidth: 95 },
  { id: 'grossPnL', label: 'Gross P&L', group: 'PNL', visible: false, order: 10, minWidth: 100 },
  { id: 'commission', label: 'Comm/Fee', group: 'PNL', visible: false, order: 11, minWidth: 90 },
  { id: 'netPnL', label: 'Net P&L ($)', group: 'PNL', visible: true, order: 12, minWidth: 115 },
  { id: 'pnlPercent', label: 'Return %', group: 'PNL', visible: true, order: 13, minWidth: 90 },
  { id: 'achievedRMultiple', label: 'Realized R', group: 'RISK', visible: true, order: 14, minWidth: 95 },
  { id: 'plannedRRRatio', label: 'Planned R:R', group: 'RISK', visible: false, order: 15, minWidth: 95 },
  { id: 'holdingTime', label: 'Duration', group: 'CORE', visible: true, order: 16, minWidth: 95 },
  { id: 'strategy', label: 'Strategy', group: 'TAGS', visible: true, order: 17, minWidth: 110 },
  { id: 'playbook', label: 'Playbook', group: 'TAGS', visible: false, order: 18, minWidth: 110 },
  { id: 'session', label: 'Session', group: 'TAGS', visible: true, order: 19, minWidth: 95 },
  { id: 'status', label: 'Status', group: 'CORE', visible: true, order: 20, minWidth: 90 },
  { id: 'actions', label: 'Actions', group: 'ACTIONS', visible: true, order: 21, minWidth: 80 },
];

export class CustomizationService {
  /**
   * Generates system default workspaces for a given user
   */
  static getDefaultWorkspaces(userId: string): DashboardWorkspace[] {
    const now = new Date().toISOString();

    return [
      {
        id: `ws_overview_${userId}`,
        userId,
        name: 'Executive Overview',
        description: 'Comprehensive command center with KPI summary, interactive equity curve, calendar returns, and recent trades.',
        isDefault: true,
        presetType: 'OVERVIEW',
        icon: 'LayoutDashboard',
        density: 'standard',
        themeId: 'cyberpunk_dark',
        kpiSelection: ['netPnL', 'winRate', 'profitFactor', 'expectancy', 'maxDrawdown', 'avgRR'],
        widgets: [
          {
            id: 'widget_kpi_hero',
            type: 'KPI_HERO_GRID',
            title: 'Primary Performance Indicators',
            enabled: true,
            order: 1,
            colSpan: 3,
            height: 'standard',
          },
          {
            id: 'widget_equity_balance_curve',
            type: 'EQUITY_BALANCE_CURVE',
            title: 'Interactive Equity & Balance Curve',
            enabled: true,
            order: 2,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_prop_compliance',
            type: 'PROP_COMPLIANCE',
            title: 'Prop Firm Compliance & Risk Radar',
            enabled: true,
            order: 3,
            colSpan: 1,
            height: 'standard',
          },
          {
            id: 'widget_pnl_distribution',
            type: 'PNL_DISTRIBUTION',
            title: 'Daily & Per-Trade P&L Distribution',
            enabled: true,
            order: 4,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_drawdown_underwater',
            type: 'DRAWDOWN_UNDERWATER',
            title: 'Underwater Drawdown Depth Chart',
            enabled: true,
            order: 5,
            colSpan: 1,
            height: 'standard',
          },
          {
            id: 'widget_trading_calendar',
            type: 'TRADING_CALENDAR',
            title: 'Interactive Calendar Heatmap',
            enabled: true,
            order: 6,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_recent_trades',
            type: 'RECENT_TRADES',
            title: 'Execution Log & Audit Trail',
            enabled: true,
            order: 7,
            colSpan: 1,
            height: 'standard',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `ws_prop_audit_${userId}`,
        userId,
        name: 'Prop Firm Audit Station',
        description: 'Strict drawdown boundaries, daily loss limits, profit target milestones, and trailing stop guardrails.',
        isDefault: false,
        presetType: 'PROP_AUDIT',
        icon: 'ShieldCheck',
        density: 'standard',
        themeId: 'cyberpunk_dark',
        kpiSelection: ['netPnL', 'maxDrawdown', 'winRate', 'profitFactor', 'recoveryFactor', 'maxLossStreak'],
        widgets: [
          {
            id: 'widget_kpi_hero',
            type: 'KPI_HERO_GRID',
            title: 'Prop Compliance Metrics',
            enabled: true,
            order: 1,
            colSpan: 3,
            height: 'standard',
          },
          {
            id: 'widget_prop_compliance',
            type: 'PROP_COMPLIANCE',
            title: 'Account Rule Evaluations',
            enabled: true,
            order: 2,
            colSpan: 3,
            height: 'expanded',
          },
          {
            id: 'widget_drawdown_underwater',
            type: 'DRAWDOWN_UNDERWATER',
            title: 'Drawdown Depth & High-Water Mark',
            enabled: true,
            order: 3,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_trading_calendar',
            type: 'TRADING_CALENDAR',
            title: 'Trading Days Consistency Calendar',
            enabled: true,
            order: 4,
            colSpan: 1,
            height: 'standard',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `ws_quant_radar_${userId}`,
        userId,
        name: 'Quantitative Edge Radar',
        description: 'Advanced statistical analytics, Sharpe/Sortino ratios, R-Multiple histograms, and correlation matrices.',
        isDefault: false,
        presetType: 'QUANT_RADAR',
        icon: 'BarChart3',
        density: 'compact',
        themeId: 'obsidian_jet',
        kpiSelection: ['sharpeRatio', 'sortinoRatio', 'expectancy', 'payoffRatio', 'kellyCriterion', 'avgRR'],
        widgets: [
          {
            id: 'widget_kpi_hero',
            type: 'KPI_HERO_GRID',
            title: 'Statistical Edge Indicators',
            enabled: true,
            order: 1,
            colSpan: 3,
            height: 'compact',
          },
          {
            id: 'widget_scatter_risk_reward',
            type: 'SCATTER_RISK_REWARD',
            title: 'Planned R:R vs Realized Excursion Scatter',
            enabled: true,
            order: 2,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_r_multiple_histogram',
            type: 'R_MULTIPLE_HISTOGRAM',
            title: 'R-Multiple Outcome Distribution',
            enabled: true,
            order: 3,
            colSpan: 1,
            height: 'standard',
          },
          {
            id: 'widget_correlation_matrix',
            type: 'CORRELATION_MATRIX',
            title: 'Multi-Asset & Strategy Correlation Matrix',
            enabled: true,
            order: 4,
            colSpan: 2,
            height: 'standard',
          },
          {
            id: 'widget_cohort_analysis',
            type: 'COHORT_ANALYSIS',
            title: 'Session & Day of Week Cohort Heatmap',
            enabled: true,
            order: 5,
            colSpan: 1,
            height: 'standard',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `ws_strategy_lab_${userId}`,
        userId,
        name: 'Strategy & Playbook Lab',
        description: 'Side-by-side strategy and playbook comparative analysis with execution efficiency metrics.',
        isDefault: false,
        presetType: 'STRATEGY_LAB',
        icon: 'Layers',
        density: 'standard',
        themeId: 'midnight_slate',
        kpiSelection: ['netPnL', 'winRate', 'profitFactor', 'totalTrades', 'averageWin', 'averageLoss'],
        widgets: [
          {
            id: 'widget_strategy_comparison',
            type: 'STRATEGY_COMPARISON',
            title: 'Strategy Comparative Performance Matrix',
            enabled: true,
            order: 1,
            colSpan: 2,
            height: 'expanded',
          },
          {
            id: 'widget_cohort_analysis',
            type: 'COHORT_ANALYSIS',
            title: 'Market Condition & Session Breakdown',
            enabled: true,
            order: 2,
            colSpan: 1,
            height: 'expanded',
          },
          {
            id: 'widget_equity_balance_curve',
            type: 'EQUITY_BALANCE_CURVE',
            title: 'Multi-Strategy Cumulative Growth',
            enabled: true,
            order: 3,
            colSpan: 3,
            height: 'standard',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // ==========================================
  // Workspace CRUD & State Management
  // ==========================================

  static getWorkspaces(userId: string): DashboardWorkspace[] {
    const stored = LocalDatabase.getItems<DashboardWorkspace>(userId, WORKSPACES_COLLECTION);
    if (!stored || stored.length === 0) {
      const defaults = this.getDefaultWorkspaces(userId);
      LocalDatabase.saveItems(userId, WORKSPACES_COLLECTION, defaults);
      return defaults;
    }
    return stored;
  }

  static getActiveWorkspace(userId: string): DashboardWorkspace {
    const workspaces = this.getWorkspaces(userId);
    const activeId = localStorage.getItem(`${USER_PREFS_KEY_PREFIX}${userId}_active_workspace`);
    const found = workspaces.find((w) => w.id === activeId);
    return found || workspaces.find((w) => w.isDefault) || workspaces[0];
  }

  static setActiveWorkspace(userId: string, workspaceId: string): void {
    localStorage.setItem(`${USER_PREFS_KEY_PREFIX}${userId}_active_workspace`, workspaceId);
  }

  static saveWorkspace(userId: string, workspace: DashboardWorkspace): DashboardWorkspace {
    const workspaces = this.getWorkspaces(userId);
    const index = workspaces.findIndex((w) => w.id === workspace.id);
    const updated = {
      ...workspace,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      workspaces[index] = updated;
    } else {
      workspaces.push(updated);
    }

    LocalDatabase.saveItems(userId, WORKSPACES_COLLECTION, workspaces);
    return updated;
  }

  static createWorkspace(
    userId: string,
    params: {
      name: string;
      description?: string;
      presetType?: string;
      density?: DisplayDensity;
      themeId?: ThemePresetId;
    }
  ): DashboardWorkspace {
    const defaults = this.getDefaultWorkspaces(userId);
    const template = defaults.find((d) => d.presetType === params.presetType) || defaults[0];

    const newWs: DashboardWorkspace = {
      ...template,
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      name: params.name,
      description: params.description || template.description,
      isDefault: false,
      density: params.density || template.density,
      themeId: params.themeId || template.themeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveWorkspace(userId, newWs);
  }

  static duplicateWorkspace(userId: string, workspaceId: string): DashboardWorkspace {
    const workspaces = this.getWorkspaces(userId);
    const target = workspaces.find((w) => w.id === workspaceId) || workspaces[0];

    const duplicated: DashboardWorkspace = {
      ...target,
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: `${target.name} (Copy)`,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveWorkspace(userId, duplicated);
  }

  static deleteWorkspace(userId: string, workspaceId: string): boolean {
    const workspaces = this.getWorkspaces(userId);
    if (workspaces.length <= 1) return false; // Prevent deleting last workspace

    const filtered = workspaces.filter((w) => w.id !== workspaceId);
    if (filtered.length !== workspaces.length) {
      // If deleted was default, make first remaining default
      if (!filtered.some((w) => w.isDefault)) {
        filtered[0].isDefault = true;
      }
      LocalDatabase.saveItems(userId, WORKSPACES_COLLECTION, filtered);

      // Reset active if needed
      const currentActiveId = localStorage.getItem(`${USER_PREFS_KEY_PREFIX}${userId}_active_workspace`);
      if (currentActiveId === workspaceId) {
        this.setActiveWorkspace(userId, filtered[0].id);
      }
      return true;
    }
    return false;
  }

  static resetWorkspacesToDefault(userId: string): DashboardWorkspace[] {
    const defaults = this.getDefaultWorkspaces(userId);
    LocalDatabase.saveItems(userId, WORKSPACES_COLLECTION, defaults);
    this.setActiveWorkspace(userId, defaults[0].id);
    return defaults;
  }

  // ==========================================
  // Saved Filters & Saved Views
  // ==========================================

  static getSavedFilters(userId: string): SavedFilterPreset[] {
    const stored = LocalDatabase.getItems<SavedFilterPreset>(userId, SAVED_FILTERS_COLLECTION);
    if (!stored || stored.length === 0) {
      const defaults: SavedFilterPreset[] = [
        {
          id: `flt_wins_${userId}`,
          userId,
          name: 'High-Conviction Winning Trades',
          description: 'Closed trades with positive net returns',
          category: 'PERFORMANCE',
          isFavorite: true,
          filters: {
            period: 'LIFETIME',
            accountId: 'ALL',
            strategyId: 'ALL',
            playbookId: 'ALL',
            instrument: 'ALL',
            session: 'ALL',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `flt_ny_session_${userId}`,
          userId,
          name: 'New York Session Executions',
          description: 'Trades taken during the NY regular trading hours',
          category: 'SESSION',
          isFavorite: false,
          filters: {
            period: 'LIFETIME',
            accountId: 'ALL',
            strategyId: 'ALL',
            playbookId: 'ALL',
            instrument: 'ALL',
            session: 'NEW_YORK',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `flt_ytd_${userId}`,
          userId,
          name: 'Current Year-to-Date (YTD)',
          description: 'All executions from Jan 1 of current year',
          category: 'TIMEFRAME',
          isFavorite: true,
          filters: {
            period: 'YEARLY',
            accountId: 'ALL',
            strategyId: 'ALL',
            playbookId: 'ALL',
            instrument: 'ALL',
            session: 'ALL',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      LocalDatabase.saveItems(userId, SAVED_FILTERS_COLLECTION, defaults);
      return defaults;
    }
    return stored;
  }

  static saveFilterPreset(userId: string, preset: Omit<SavedFilterPreset, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): SavedFilterPreset {
    const filters = this.getSavedFilters(userId);
    const now = new Date().toISOString();
    const id = preset.id || `flt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const saved: SavedFilterPreset = {
      ...preset,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const index = filters.findIndex((f) => f.id === id);
    if (index >= 0) {
      filters[index] = saved;
    } else {
      filters.unshift(saved);
    }

    LocalDatabase.saveItems(userId, SAVED_FILTERS_COLLECTION, filters);
    return saved;
  }

  static deleteFilterPreset(userId: string, filterId: string): boolean {
    const filters = this.getSavedFilters(userId);
    const remaining = filters.filter((f) => f.id !== filterId);
    if (remaining.length !== filters.length) {
      LocalDatabase.saveItems(userId, SAVED_FILTERS_COLLECTION, remaining);
      return true;
    }
    return false;
  }

  // ==========================================
  // Trade Column Visibility & Preferences
  // ==========================================

  static getTradeColumns(userId: string): TradeColumnConfig[] {
    const stored = LocalDatabase.getItems<TradeColumnConfig>(userId, COLUMN_CONFIG_COLLECTION);
    if (!stored || stored.length === 0) {
      LocalDatabase.saveItems(userId, COLUMN_CONFIG_COLLECTION, DEFAULT_TRADE_COLUMNS);
      return DEFAULT_TRADE_COLUMNS;
    }
    return stored.sort((a, b) => a.order - b.order);
  }

  static saveTradeColumns(userId: string, columns: TradeColumnConfig[]): void {
    LocalDatabase.saveItems(userId, COLUMN_CONFIG_COLLECTION, columns);
  }

  static resetTradeColumns(userId: string): TradeColumnConfig[] {
    LocalDatabase.saveItems(userId, COLUMN_CONFIG_COLLECTION, DEFAULT_TRADE_COLUMNS);
    return DEFAULT_TRADE_COLUMNS;
  }

  // ==========================================
  // Trade Entry Templates
  // ==========================================

  static getTradeTemplates(userId: string): TradeEntryTemplate[] {
    const stored = LocalDatabase.getItems<TradeEntryTemplate>(userId, TRADE_TEMPLATES_COLLECTION);
    if (!stored || stored.length === 0) {
      const defaults: TradeEntryTemplate[] = [
        {
          id: `tmpl_nq_scalp_${userId}`,
          userId,
          name: 'NQ 1-Min Scalp (1% Risk, 2R)',
          description: 'High-frequency momentum scalp on Nasdaq Futures',
          instrument: 'NQ',
          assetClass: 'FUTURES',
          direction: 'LONG',
          plannedRiskPercent: 1.0,
          plannedRRRatio: 2.0,
          session: 'NEW_YORK',
          defaultTags: ['Scalp', 'OpeningDrive', 'HighVolume'],
          defaultNotes: 'Confirmed via 1-min fair value gap and order block retest.',
          isFavorite: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `tmpl_eurusd_day_${userId}`,
          userId,
          name: 'EURUSD London Breakout',
          description: 'London open high/low liquidity sweep with 2.5R target',
          instrument: 'EURUSD',
          assetClass: 'FOREX',
          direction: 'LONG',
          plannedRiskPercent: 0.5,
          plannedRRRatio: 2.5,
          session: 'LONDON',
          defaultTags: ['LondonOpen', 'LiquiditySweep', 'JudasSwing'],
          isFavorite: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `tmpl_btc_swing_${userId}`,
          userId,
          name: 'BTC Spot Swing (3R Target)',
          description: '4-Hour trend continuation swing with structured stops',
          instrument: 'BTCUSDT',
          assetClass: 'CRYPTO',
          direction: 'LONG',
          plannedRiskPercent: 1.5,
          plannedRRRatio: 3.0,
          defaultTags: ['CryptoSwing', '4H_OB', 'BullishTrend'],
          isFavorite: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      LocalDatabase.saveItems(userId, TRADE_TEMPLATES_COLLECTION, defaults);
      return defaults;
    }
    return stored;
  }

  static saveTradeTemplate(userId: string, template: Omit<TradeEntryTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): TradeEntryTemplate {
    const templates = this.getTradeTemplates(userId);
    const now = new Date().toISOString();
    const id = template.id || `tmpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const saved: TradeEntryTemplate = {
      ...template,
      id,
      userId,
      createdAt: now,
      updatedAt: now,
    };

    const index = templates.findIndex((t) => t.id === id);
    if (index >= 0) {
      templates[index] = saved;
    } else {
      templates.unshift(saved);
    }

    LocalDatabase.saveItems(userId, TRADE_TEMPLATES_COLLECTION, templates);
    return saved;
  }

  static deleteTradeTemplate(userId: string, templateId: string): boolean {
    const templates = this.getTradeTemplates(userId);
    const remaining = templates.filter((t) => t.id !== templateId);
    if (remaining.length !== templates.length) {
      LocalDatabase.saveItems(userId, TRADE_TEMPLATES_COLLECTION, remaining);
      return true;
    }
    return false;
  }

  // ==========================================
  // Layout Export & Import
  // ==========================================

  static exportWorkspacesJSON(userId: string): string {
    const workspaces = this.getWorkspaces(userId);
    const savedFilters = this.getSavedFilters(userId);
    const templates = this.getTradeTemplates(userId);
    const columns = this.getTradeColumns(userId);

    const backup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userId,
      workspaces,
      savedFilters,
      templates,
      columns,
    };

    return JSON.stringify(backup, null, 2);
  }

  static importWorkspacesJSON(userId: string, jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.workspaces && Array.isArray(parsed.workspaces)) {
        const sanitized = parsed.workspaces.map((w: any) => ({
          ...w,
          userId,
          id: w.id || `ws_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }));
        LocalDatabase.saveItems(userId, WORKSPACES_COLLECTION, sanitized);
      }
      if (parsed.savedFilters && Array.isArray(parsed.savedFilters)) {
        LocalDatabase.saveItems(userId, SAVED_FILTERS_COLLECTION, parsed.savedFilters);
      }
      if (parsed.templates && Array.isArray(parsed.templates)) {
        LocalDatabase.saveItems(userId, TRADE_TEMPLATES_COLLECTION, parsed.templates);
      }
      if (parsed.columns && Array.isArray(parsed.columns)) {
        LocalDatabase.saveItems(userId, COLUMN_CONFIG_COLLECTION, parsed.columns);
      }
      return true;
    } catch (e) {
      console.error('Failed to import layout package:', e);
      return false;
    }
  }
}
