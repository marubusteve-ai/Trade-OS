/**
 * TradeOS Core Domain Model & Type Definitions
 * Professional Trading Journal & Quantitative Trading Performance OS
 */

// ==========================================
// 1. Identity, Auth & Multi-Tenancy
// ==========================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface UserProfile {
  id?: string;
  userId: string;
  defaultCurrency: string;
  defaultTimezone: string;
  riskTolerancePercent: number;
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'PRO';
  themePreference: 'dark' | 'light' | 'terminal';
  enableSoundEffects: boolean;
  activeWorkspaceId: string;
}

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. Accounts & Prop-Firms
// ==========================================

export type AccountType = 
  | 'PERSONAL_LIVE' 
  | 'PERSONAL_DEMO' 
  | 'PROP_EVALUATION' 
  | 'PROP_VERIFICATION' 
  | 'PROP_FUNDED' 
  | 'BACKTEST' 
  | 'FORWARD_TEST' 
  | 'CHALLENGE' 
  | 'CUSTOM';

export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'PASSED' | 'FAILED' | 'BREACHED' | 'ARCHIVED' | 'PAUSED';

export interface PropFirmRule {
  id: string;
  name: string;
  type: 'MAX_DAILY_LOSS' | 'MAX_TOTAL_LOSS' | 'PROFIT_TARGET' | 'TRAILING_DRAWDOWN' | 'MIN_TRADING_DAYS' | 'MAX_LEVERAGE' | 'NEWS_RESTRICTION' | 'WEEKEND_HOLD_RESTRICTION' | 'CUSTOM';
  thresholdValue: number;
  thresholdUnit: 'PERCENTAGE' | 'CURRENCY' | 'DAYS' | 'RATIO';
  isHardBreach: boolean;
  description?: string;
}

export interface PropFirmRuleSet {
  id: string;
  propFirmName: string;
  challengeName: string;
  phase: number;
  startingBalance: number;
  profitTargetPercent?: number;
  dailyLossLimitPercent?: number;
  maxTotalLossPercent?: number;
  trailingDrawdownPercent?: number;
  minTradingDays?: number;
  maxTradingDays?: number;
  rules: PropFirmRule[];
}

export interface Account {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  accountNumber?: string;
  accountType: AccountType;
  broker: string;
  propFirm?: string;
  platform: string; // MT4, MT5, cTrader, TradingView, NinjaTrader, Sierra Chart, DXtrade, Interactive Brokers, TradeLocker, Binance, etc.
  currency: string;
  timezone: string;
  
  // Financial Baselines
  startingBalance: number;
  currentBalance: number;
  equity: number;
  highWaterMark: number;
  status: AccountStatus;
  
  // Prop Firm & Challenge Parameters
  propFirmId?: string;
  challengeId?: string;
  ruleSetId?: string;
  challengePhase?: number; // 1 = Phase 1, 2 = Phase 2, 3 = Funded
  profitTarget?: number; // Absolute currency amount
  dailyLossLimit?: number; // Absolute currency amount or computed %
  maximumLoss?: number; // Absolute currency amount (e.g., 10% limit)
  trailingDrawdown?: number; // Max trailing drawdown amount
  minimumTradingDays?: number;
  currentTradingDays?: number;
  
  // Risk Bounds & Rules
  maxRiskPerTradePercent?: number;
  maxOpenTrades?: number;
  maxDailyTrades?: number;
  
  // Metadata & Grouping
  group?: string; // e.g. "Core Desk", "Evaluation Cohort", "Swing Book"
  tags?: string[];
  customMetadata?: Record<string, string | number | boolean>;
  isArchived: boolean;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. Trade Domain Model
// ==========================================

export type TradeDirection = 'LONG' | 'SHORT';
export type TradeStatus = 'OPEN' | 'CLOSED' | 'PENDING' | 'CANCELLED';
export type AssetClass = 'FOREX' | 'CRYPTO' | 'INDICES' | 'COMMODITIES' | 'EQUITIES' | 'FUTURES' | 'OPTIONS';
export type MarketSession = 'SYDNEY' | 'TOKYO' | 'LONDON' | 'NEW_YORK' | 'LONDON_NY_OVERLAP' | 'OFF_HOURS';
export type MarketCondition = 'TRENDING_UP' | 'TRENDING_DOWN' | 'RANGING' | 'EXPANSION' | 'COMPRESSION' | 'HIGH_VOLATILITY' | 'LOW_VOLATILITY';

export interface TradeExecution {
  id: string;
  tradeId: string;
  type: 'ENTRY' | 'SCALE_IN' | 'PARTIAL_EXIT' | 'FULL_EXIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
  timestamp: string;
  price: number;
  quantity: number; // lots, contracts, or units
  fees: number;
  commission: number;
  slippage?: number;
  notes?: string;
}

export interface MarketContext {
  timeframe: string; // 1m, 5m, 15m, 1h, 4h, D, W
  higherTimeframeTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  marketCondition: MarketCondition;
  session: MarketSession;
  keyLevelsIdentified?: string[];
  newsEventsImpacting?: string[];
  volatilityIndex?: number;
}

export interface PsychologyEntry {
  preTradeEmotion: 'CALM' | 'FOCUSED' | 'CONFIDENT' | 'EAGER' | 'ANXIOUS' | 'FOMO' | 'REVENGE' | 'FATIGUED' | 'OPTIMISTIC' | 'OVERCONFIDENT' | 'IMPATIENT' | 'BORED';
  postTradeEmotion?: 'SATISFIED' | 'DISCIPLINED' | 'PROUD' | 'NEUTRAL' | 'FRUSTRATED' | 'ANGRY' | 'REGRETFUL' | 'RELIEVED' | 'EUPHORIC' | 'DISAPPOINTED';
  disciplineScore: number; // 1 to 10
  confidenceScore: number; // 1 to 10
  stressLevel: number; // 1 to 10
  patienceScore?: number; // 1 to 10
  fomoTendency?: number; // 1 to 10
  revengeTendency?: number; // 1 to 10
  impulsivityScore?: number; // 1 to 10
  ruleAdherenceScore?: number; // 1 to 10
  followedTradingPlan: boolean;
  decisionQuality?: 'EXCELLENT' | 'GOOD' | 'SUB_OPTIMAL' | 'POOR' | 'IRRATIONAL';
  tradingHabits?: string[];
  mistakes: string[]; // e.g. "Early Exit", "Overleveraged", "Chased Entry", "Moved Stop Loss"
  mistakeDetails?: Array<{
    mistakeId: string;
    mistakeName: string;
    category: string;
    severity: 'MINOR' | 'MODERATE' | 'SEVERE';
    estimatedCost?: number;
    notes?: string;
  }>;
  lessonsLearned?: string;
  tiltWarningTriggered?: boolean;
}

export interface Attachment {
  id: string;
  tradeId?: string;
  type: 'ENTRY_CHART' | 'EXIT_CHART' | 'HIGHER_TIMEFRAME' | 'NOTES_DOC';
  url: string;
  name: string;
  caption?: string;
  timestamp: string;
}

export interface Trade {
  id: string;
  userId: string;
  workspaceId: string;
  accountId: string;
  
  // Identification & Context
  instrument: string; // EURUSD, BTCUSDT, NAS100, XAUUSD, ES, NQ, NVDA, AAPL
  assetClass: AssetClass;
  direction: TradeDirection;
  status: TradeStatus;
  
  // Strategy & Confluence Linkage
  strategyId?: string;
  strategyName?: string;
  setupId?: string;
  setupName?: string;
  playbookId?: string;
  playbookName?: string;
  confluences?: string[]; // e.g. ["Daily Support", "FVG Retest", "Liquidity Sweep", "RSI Divergence"]
  tags?: string[];
  
  // Timing
  entryDate: string;
  exitDate?: string;
  holdingTimeSeconds?: number;
  session: MarketSession;
  
  // Price Points
  entryPrice: number;
  exitPrice?: number;
  stopLossPrice?: number;
  takeProfitPrice?: number;
  
  // Position Sizing & Risk
  quantity: number; // Lot size, contracts or shares
  contractMultiplier?: number;
  leverage?: number;
  plannedRiskAmount: number; // Amount at risk if stop loss is hit
  plannedRiskPercent: number; // % of account equity at risk
  plannedRRRatio?: number; // Planned Reward/Risk
  
  // Execution Costs
  commission: number;
  swap: number;
  spreadCost: number;
  fees: number;
  slippage?: number;
  
  // Quantitative Performance
  grossPnL: number;
  netPnL: number;
  pnlPercentage: number;
  achievedRMultiple?: number;
  pipsOrPoints?: number;
  mae?: number; // Maximum Adverse Excursion
  mfe?: number; // Maximum Favorable Excursion
  maxAdverseExcursion?: number;
  maxFavorableExcursion?: number;
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN';
  
  // Market & Qualitative Context
  marketContext?: MarketContext;
  psychology?: PsychologyEntry;
  executions?: TradeExecution[];
  attachments?: Attachment[];
  customFields?: Record<string, string | number | boolean>;
  
  // Qualitative & Performance Scoring
  qualityScore?: TradeQualityScore;
  evaluatedChecklist?: ChecklistEvaluationItem[];

  // Annotations
  entryRationale?: string;
  exitRationale?: string;
  notes?: string;
  
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. Checklist & Trade Quality Scoring Engine
// ==========================================

export type ChecklistCategory = 
  | 'CONFIRMATION' 
  | 'RULE' 
  | 'CONFLUENCE' 
  | 'INVALIDATION' 
  | 'MANAGEMENT' 
  | 'NO_TRADE';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
  category: ChecklistCategory;
  isRequired: boolean; // If true, failure causes whole checklist to fail
  weight: number; // 1 to 5
}

export interface ChecklistEvaluationItem {
  itemId: string;
  label: string;
  category: ChecklistCategory;
  isRequired: boolean;
  weight: number;
  isChecked: boolean;
  notes?: string;
}

export interface ChecklistAuditResult {
  totalItems: number;
  checkedItems: number;
  passedRequired: boolean;
  failedRequiredCount: number;
  violations: string[]; // List of broken mandatory rules
  weightedScore: number; // 0 to 100
  isOverallPass: boolean;
}

export interface TradeQualityScore {
  setupQuality: number; // 0 to 100
  executionQuality: number; // 0 to 100
  riskQuality: number; // 0 to 100
  ruleAdherence: number; // 0 to 100
  psychologyQuality: number; // 0 to 100
  compositeScore: number; // 0 to 100 (weighted aggregate of the 5 pillars, never purely based on profit)
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  violations: string[];
  checklistAudit?: ChecklistAuditResult;
}

// ==========================================
// 5. Strategies, Setups & Playbooks
// ==========================================

export type StrategyStatus = 'ACTIVE' | 'INACTIVE' | 'TESTING' | 'ARCHIVED';

export interface Strategy {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  description: string;
  assetClasses: AssetClass[];
  instruments?: string[]; // e.g. ["EURUSD", "NQ", "BTCUSDT"]
  timeframes: string[]; // e.g. ["1m", "5m", "15m", "1h", "4h", "D"]
  sessions?: MarketSession[]; // e.g. ["NEW_YORK", "LONDON"]
  marketConditions?: MarketCondition[]; // Conditions this strategy thrives in
  rules: string[]; // Strict core rules
  checklist?: string[]; // Legacy quick list
  checklists?: ChecklistItem[]; // Weighted structured checklist items
  notes?: string;
  targetWinRate?: number;
  targetRiskRewardRatio?: number;
  colorHex?: string;
  status?: StrategyStatus;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setup {
  id: string;
  userId: string;
  workspaceId: string;
  strategyId: string;
  strategyName?: string;
  playbookId?: string;
  playbookName?: string;
  name: string;
  description: string;
  requiredConfirmations: string[];
  idealMarketCondition: MarketCondition;
  timeframe?: string;
  winRateTarget?: number;
  riskRewardTarget?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PlaybookEntryModel {
  type: 'MARKET' | 'LIMIT_RETEST' | 'STOP_BREAKOUT' | 'CONFIRMATION_CLOSE';
  triggers: string[];
  optimalEntryZone?: string;
  timeframes?: string[];
}

export interface PlaybookExitModel {
  stopLossRule: string;
  takeProfitRule: string;
  trailingRule?: string;
  timeStopRule?: string;
}

export interface Playbook {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  strategyId?: string;
  strategyName?: string;
  setupId?: string;
  setupName?: string;
  description?: string;
  thesis: string;
  
  // Execution Models
  entryModel: PlaybookEntryModel;
  exitModel: PlaybookExitModel;
  
  // Structured Checklists & Rule Engine
  confirmationChecklist: ChecklistItem[];
  ruleChecklist: ChecklistItem[];
  confluenceChecklist: ChecklistItem[];
  invalidationRules: string[];
  managementRules: string[];
  noTradeConditions: string[];
  
  // Examples & Documentation
  exampleScreenshots: Attachment[];
  notes?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'TESTING';
  
  // Legacy compatibility
  entryTriggers?: string[];
  takeProfitRules?: string[];
  
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. Goals, Milestones, Metrics & Payouts
// ==========================================

export interface Goal {
  id: string;
  userId: string;
  workspaceId: string;
  title: string;
  category: 'PROFIT' | 'DISCIPLINE' | 'PROCESS' | 'CONSISTENCY' | 'RISK_MANAGEMENT';
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
}

export interface Payout {
  id: string;
  userId: string;
  accountId: string;
  amount: number;
  requestedDate: string;
  approvedDate?: string;
  status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REJECTED';
  profitSplitPercent: number;
  payoutMethod: string;
  notes?: string;
}

// ==========================================
// 6. Dashboard, Widgets & Saved Views
// ==========================================

export type WidgetType = 
  | 'KPI_OVERVIEW' 
  | 'EQUITY_CURVE' 
  | 'DRAWDOWN_CHART' 
  | 'WIN_LOSS_DONUT' 
  | 'DAILY_PNL_CALENDAR' 
  | 'RECENT_TRADES' 
  | 'PROP_COMPLIANCE' 
  | 'STRATEGY_PERFORMANCE' 
  | 'PSYCHOLOGY_RADAR' 
  | 'RISK_GAUGE';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  gridSpan: { col: number; row: number }; // Grid col-span and row-span
  config: Record<string, any>;
}

export interface DashboardConfig {
  id: string;
  userId: string;
  workspaceId: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'ACCOUNT' | 'TRADE' | 'STRATEGY' | 'SETTINGS';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface AIInsight {
  id: string;
  userId: string;
  accountId?: string;
  category: 'EDGE' | 'MISTAKE_PATTERN' | 'RISK_WARNING' | 'OPPORTUNITY' | 'PSYCHOLOGY';
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  title: string;
  summary: string;
  actionableAdvice: string;
  generatedAt: string;
}
