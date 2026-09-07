/**
 * Quantitative Analytics Domain & Performance Statistics Types
 * Advanced Statistical, Risk-Adjusted, and Multi-Dimensional Analytics Structures
 */

import { Trade, AssetClass, MarketSession, MarketCondition, TradeDirection } from './domain';

export interface WinLossDetailedStats {
  tradesCount: number;
  totalPnL: number;
  avgPnL: number;
  largestPnL: number;
  smallestPnL: number;
  avgRMultiple: number;
  avgDurationMinutes: number;
  avgMFE: number;
  avgMAE: number;
  avgEntryEfficiency: number;
  avgExitEfficiency: number;
}

export interface AdvancedPerformanceMetrics {
  // Volume & Outcomes
  totalTrades: number;
  openTradesCount: number;
  closedTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  breakEvenTradesCount: number;
  winRate: number; // 0-100%
  lossRate: number; // 0-100%

  // Financial Realization
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  netReturnPercent: number;
  totalCommissions: number;
  totalSwaps: number;
  totalFees: number;

  // Expectancy & Profit Factor
  profitFactor: number;
  payoffRatio: number; // Avg Win / Avg Loss
  expectancy: number; // Realized $ per trade
  expectancyRMultiple: number; // Realized R per trade
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;

  // R-Multiple Analytics
  totalAchievedR: number;
  averageAchievedR: number;
  maxAchievedR: number;
  avgPlannedRiskAmount: number;

  // Statistical Ratios & Downside Volatility
  sharpeRatio: number; // Annualized/trade-based risk-adjusted return
  sortinoRatio: number; // Downside-risk-adjusted return
  calmarRatio: number; // Annualized return / Max DD%
  ulcerIndex: number; // Quadratic mean of drawdowns
  recoveryFactor: number; // Net PnL / Max DD $

  // Drawdown Statistics
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  currentDrawdownAmount: number;
  currentDrawdownPercent: number;
  peakBalance: number;
  startingBalance: number;
  currentBalance: number;

  // Streaks
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };

  // Duration
  avgDurationMinutes: number;
  avgWinDurationMinutes: number;
  avgLossDurationMinutes: number;

  // Excursion & Execution Efficiency
  avgMFE: number; // Maximum Favorable Excursion
  avgMAE: number; // Maximum Adverse Excursion
  avgEntryEfficiency: number; // % (0-100)
  avgExitEfficiency: number; // % (0-100)
  mfeMaeRatio: number;

  // Detailed Win vs Loss Segment Analysis
  winningStats: WinLossDetailedStats;
  losingStats: WinLossDetailedStats;
}

export type AnalyticsDimension =
  | 'ACCOUNT'
  | 'STRATEGY'
  | 'PLAYBOOK'
  | 'SETUP'
  | 'INSTRUMENT'
  | 'ASSET_CLASS'
  | 'TIMEFRAME'
  | 'SESSION'
  | 'TIME_OF_DAY'
  | 'DAY_OF_WEEK'
  | 'MONTH'
  | 'MARKET_CONDITION'
  | 'DIRECTION'
  | 'RISK_LEVEL'
  | 'PSYCHOLOGY'
  | 'MISTAKE_CATEGORY';

export interface DimensionBreakdownItem {
  key: string;
  label: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  maxDrawdown: number;
  avgDurationMinutes: number;
  trades: Trade[];
}

export interface DayHourHeatmapCell {
  dayIndex: number; // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  dayLabel: string;
  hour: number; // 0 to 23
  tradesCount: number;
  winCount: number;
  lossCount: number;
  netPnL: number;
  winRate: number;
  trades: Trade[];
}

export interface MonthYearHeatmapCell {
  year: number;
  month: number; // 0 to 11
  monthLabel: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  netPnL: number;
  winRate: number;
  trades: Trade[];
}

export interface ScatterTradePoint {
  id: string;
  tradeNumber: number;
  instrument: string;
  direction: TradeDirection;
  x: number; // e.g. MAE, Risk, Duration
  y: number; // e.g. MFE, Realized PnL, R-Multiple
  pnl: number;
  isWin: boolean;
  rMultiple?: number;
  durationMinutes: number;
  entryEfficiency: number;
  exitEfficiency: number;
  label: string;
  trade: Trade;
}

export interface HistogramBucket {
  label: string;
  min: number;
  max: number;
  count: number;
  winCount: number;
  lossCount: number;
  netPnL: number;
  percentage: number;
  trades: Trade[];
}

export interface StrategyComparisonItem {
  strategyId: string;
  strategyName: string;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;
  avgDurationMinutes: number;
  metrics: AdvancedPerformanceMetrics;
  trades: Trade[];
}

export interface PlaybookComparisonItem {
  playbookId: string;
  playbookTitle: string;
  strategyName?: string;
  tradesCount: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  expectancy: number;
  averageR: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPercent: number;
  recoveryFactor: number;
  avgDurationMinutes: number;
  metrics: AdvancedPerformanceMetrics;
  trades: Trade[];
}

export interface AnalyticsFilterState {
  accountId: string | 'ALL';
  strategyId: string | 'ALL';
  playbookId: string | 'ALL';
  setupId: string | 'ALL';
  instrument: string | 'ALL';
  assetClass: AssetClass | 'ALL';
  timeframe: string | 'ALL';
  session: MarketSession | 'ALL';
  direction: TradeDirection | 'ALL';
  marketCondition: MarketCondition | 'ALL';
  riskLevel: 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';
  psychologyEmotion: string | 'ALL';
  mistakeCategory: string | 'ALL';
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsDrillDownModalState {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  trades: Trade[];
  metricHighlight?: {
    label: string;
    value: string;
    isPositive?: boolean;
  };
}
