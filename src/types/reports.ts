/**
 * Professional Reporting Engine Types & Data Contracts
 * 
 * Defines schema for 11 institutional report types, filter states, 
 * metric aggregations, and multi-format exports.
 */

import { Trade, Account, Strategy, Playbook, AssetClass, TradeDirection } from './domain';
import { FinancialMetrics, DrawdownStats, PropFirmComplianceStatus } from './calculations';
import { AdvancedPerformanceMetrics, DimensionBreakdownItem } from './analytics';
import { PropFirmEvaluationResult, PropFirmOverallStatus } from './propFirm';
import { PsychologyAnalyticsReport } from './psychology';
import { RiskPolicyEvaluation, ExposureMetrics, RiskBudgets } from './risk';

export type ReportType =
  | 'EXECUTIVE_SUMMARY'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'ACCOUNT'
  | 'STRATEGY'
  | 'PLAYBOOK'
  | 'PROP_FIRM'
  | 'PSYCHOLOGY'
  | 'RISK'
  | 'TRADE_HISTORY';

export type DateRangePreset =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'LAST_WEEK'
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'LAST_30_DAYS'
  | 'LAST_90_DAYS'
  | 'YEAR_TO_DATE'
  | 'ALL_TIME'
  | 'CUSTOM';

export interface ReportFilterState {
  accountId: string | 'ALL';
  datePreset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  strategyId?: string | 'ALL';
  playbookId?: string | 'ALL';
  instrument?: string | 'ALL';
  assetClass?: AssetClass | 'ALL';
}

export type ReportExportFormat = 'PRINT' | 'PDF' | 'CSV' | 'JSON' | 'SPREADSHEET';

// =========================================================================
// REPORT-SPECIFIC DATA STRUCTURES
// =========================================================================

export interface BaseReportMetadata {
  reportId: string;
  reportType: ReportType;
  reportTitle: string;
  generatedAt: string;
  generatedBy: string;
  version: string;
  appliedFilters: {
    accountName: string;
    accountId: string;
    dateRangeLabel: string;
    datePreset?: string;
    startDate?: string;
    endDate?: string;
    strategyName?: string;
    playbookName?: string;
    instrument?: string;
  };
  tradeCount: number;
  totalVolume: number;
}

// 1. Executive Summary Report
export interface ExecutiveSummaryReportData extends BaseReportMetadata {
  reportType: 'EXECUTIVE_SUMMARY';
  metrics: AdvancedPerformanceMetrics;
  equityCurve: { date: string; equity: number; netPnL: number; drawdownPercent: number }[];
  keyHighlights: {
    label: string;
    value: string;
    status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
    description: string;
  }[];
  monthlyReturnSummary: { month: string; netPnL: number; returnPercent: number; tradesCount: number; winRate: number }[];
  assetBreakdown: DimensionBreakdownItem[];
  riskOverview: {
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    expectancyR: number;
    recoveryFactor: number;
  };
}

// 2. Daily Report
export interface DailyReportRow {
  date: string;
  tradesCount: number;
  winningCount: number;
  losingCount: number;
  winRate: number;
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  commissions: number;
  totalVolume: number;
  avgDurationMinutes: number;
  bestTradePnL: number;
  worstTradePnL: number;
  disciplineScoreAvg: number;
  primaryAsset: string;
}

export interface DailyReportData extends BaseReportMetadata {
  reportType: 'DAILY';
  days: DailyReportRow[];
  totals: {
    totalTradingDays: number;
    profitableDays: number;
    lossDays: number;
    breakEvenDays: number;
    dayWinRate: number;
    avgDailyPnL: number;
    bestDay: { date: string; netPnL: number };
    worstDay: { date: string; netPnL: number };
    totalNetPnL: number;
    totalTrades: number;
  };
  sessionBreakdown: DimensionBreakdownItem[];
  hourlyDistribution: { hour: string; tradesCount: number; netPnL: number; winRate: number }[];
}

// 3. Weekly Report
export interface WeeklyReportRow {
  weekNumber: number;
  weekLabel: string;
  startDate: string;
  endDate: string;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  cumPnL: number;
  avgRMultiple: number;
  bestTrade: number;
  worstTrade: number;
}

export interface WeeklyReportData extends BaseReportMetadata {
  reportType: 'WEEKLY';
  weeks: WeeklyReportRow[];
  totals: {
    totalWeeks: number;
    profitableWeeks: number;
    lossWeeks: number;
    weeklyWinRate: number;
    avgWeeklyPnL: number;
    bestWeek: { weekLabel: string; netPnL: number };
    worstWeek: { weekLabel: string; netPnL: number };
    totalNetPnL: number;
  };
}

// 4. Monthly Report
export interface MonthlyReportRow {
  yearMonth: string;
  monthName: string;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  returnPercent: number;
  sharpeRatio: number;
  maxDrawdownPercent: number;
  cumPnL: number;
}

export interface MonthlyReportData extends BaseReportMetadata {
  reportType: 'MONTHLY';
  months: MonthlyReportRow[];
  totals: {
    totalMonths: number;
    profitableMonths: number;
    lossMonths: number;
    monthlyWinRate: number;
    avgMonthlyPnL: number;
    annualizedReturnPercent: number;
    totalNetPnL: number;
  };
  yearlyMatrix: {
    year: number;
    months: (number | null)[];
    totalPnL: number;
    returnPercent: number;
  }[];
}

// 5. Account Report
export interface AccountPerformanceRow {
  accountId: string;
  accountName: string;
  accountType: string;
  broker: string;
  currency: string;
  startingBalance: number;
  currentBalance: number;
  netPnL: number;
  returnPercent: number;
  tradesCount: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  totalCommissions: number;
  status: string;
}

export interface AccountReportData extends BaseReportMetadata {
  reportType: 'ACCOUNT';
  accounts: AccountPerformanceRow[];
  aggregateTotals: {
    totalAccounts: number;
    totalCapital: number;
    totalNetPnL: number;
    blendedReturnPercent: number;
    totalTrades: number;
    totalCommissions: number;
  };
}

// 6. Strategy Report
export interface StrategyPerformanceRow {
  strategyId: string;
  strategyName: string;
  type: string;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  payoffRatio: number;
  expectancyR: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  maxConsecutiveLosses: number;
  avgDurationMinutes: number;
}

export interface StrategyReportData extends BaseReportMetadata {
  reportType: 'STRATEGY';
  strategies: StrategyPerformanceRow[];
  topPerformer: { name: string; netPnL: number; winRate: number } | null;
  underPerformer: { name: string; netPnL: number; winRate: number } | null;
}

// 7. Playbook Report
export interface PlaybookPerformanceRow {
  playbookId: string;
  playbookTitle: string;
  marketPhase: string;
  setupsCount: number;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  averageAchievedR: number;
  checklistAdherenceRate: number;
}

export interface PlaybookReportData extends BaseReportMetadata {
  reportType: 'PLAYBOOK';
  playbooks: PlaybookPerformanceRow[];
  checklistComplianceStats: {
    totalEvaluatedTrades: number;
    fullChecklistTradesCount: number;
    avgScorePercent: number;
    pnlWithHighChecklist: number;
    pnlWithLowChecklist: number;
  };
}

// 8. Prop-Firm Report
export interface PropFirmReportData extends BaseReportMetadata {
  reportType: 'PROP_FIRM';
  accountName: string;
  accountType: string;
  firmName: string;
  ruleSetName: string;
  startingBalance: number;
  currentBalance: number;
  highWaterMark: number;
  profitTargetAmount: number;
  profitTargetPercent: number;
  profitTargetReached: boolean;
  profitProgressPercent: number;
  dailyLossLimitAmount: number;
  dailyLossLimitPercent: number;
  todaysLossAmount: number;
  todaysLossPercent: number;
  dailyLossViolated: boolean;
  maxDrawdownLimitAmount: number;
  maxDrawdownLimitPercent: number;
  currentDrawdownAmount: number;
  currentDrawdownPercent: number;
  maxDrawdownViolated: boolean;
  minTradingDaysRequired: number;
  currentTradingDays: number;
  minDaysMet: boolean;
  overallCompliance: 'COMPLIANT' | 'WARNING' | 'BREACHED' | 'PASSED';
  complianceScore: number;
  dailyDrawdownHistory: { date: string; balance: number; dailyPnL: number; drawdownPercent: number }[];
}

// 9. Psychology Report
export interface PsychologyReportData extends BaseReportMetadata {
  reportType: 'PSYCHOLOGY';
  summary: PsychologyAnalyticsReport;
  emotionalImpacts: {
    emotion: string;
    tradesCount: number;
    winRate: number;
    netPnL: number;
    avgDiscipline: number;
    profitFactor: number;
  }[];
  mistakeFrequency: {
    mistake: string;
    count: number;
    totalCost: number;
    avgLossPerOccurrence: number;
    category: string;
  }[];
  planComplianceImpact: {
    followedPlanCount: number;
    followedPlanWinRate: number;
    followedPlanPnL: number;
    deviatedPlanCount: number;
    deviatedPlanWinRate: number;
    deviatedPlanPnL: number;
  };
}

// 10. Risk Report
export interface RiskReportData extends BaseReportMetadata {
  reportType: 'RISK';
  summary: {
    maxDrawdownPercent: number;
    maxDrawdownAmount: number;
    dailyVaR95: number;
    avgRiskPerTrade: number;
    avgRiskPercentPerTrade: number;
    maxRiskViolationPercent: number;
  };
  riskBudgetUsage: {
    daily: { budget: number; used: number; percentUsed: number; status: string };
    weekly: { budget: number; used: number; percentUsed: number; status: string };
    monthly: { budget: number; used: number; percentUsed: number; status: string };
  };
  riskPerTradeDistribution: {
    riskRange: string;
    tradesCount: number;
    winRate: number;
    profitFactor: number;
    netPnL: number;
  }[];
  correlationCluster: {
    clusterName: string;
    exposurePercent: number;
    openTradesCount: number;
  }[];
}

// 11. Trade History Report
export interface TradeHistoryReportData extends BaseReportMetadata {
  reportType: 'TRADE_HISTORY';
  trades: {
    id: string;
    openDate: string;
    closeDate?: string;
    symbol: string;
    direction: TradeDirection;
    quantity: number;
    entryPrice: number;
    exitPrice?: number;
    rMultiple?: number;
    netPnL: number;
    strategyName: string;
    assetClass: string;
    tags?: string[];
  }[];
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    breakEvenTrades: number;
    winRate: number;
    totalGrossPnL: number;
    totalNetPnL: number;
    totalCommissions: number;
    totalFees: number;
    profitFactor: number;
    avgPnL: number;
    avgRMultiple: number;
    avgDurationMinutes: number;
  };
}

// Unified Union of Report Data Objects
export type GeneratedReportData =
  | ExecutiveSummaryReportData
  | DailyReportData
  | WeeklyReportData
  | MonthlyReportData
  | AccountReportData
  | StrategyReportData
  | PlaybookReportData
  | PropFirmReportData
  | PsychologyReportData
  | RiskReportData
  | TradeHistoryReportData;
