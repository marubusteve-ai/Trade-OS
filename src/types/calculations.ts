/**
 * Quantitative Financial Engine Types
 * Professional Trading Metrics & Prop-Firm Compliance Structures
 */

import { Account, Trade } from './domain';

export interface FinancialMetrics {
  // PnL & Returns
  totalTrades: number;
  openTradesCount: number;
  winningTradesCount: number;
  losingTradesCount: number;
  breakEvenTradesCount: number;
  
  grossProfit: number;
  grossLoss: number;
  netPnL: number;
  netReturnPercent: number;
  
  totalCommissions: number;
  totalSwaps: number;
  totalFees: number;
  
  // Statistical Edge & Quality
  winRate: number; // Percentage (e.g. 58.5)
  lossRate: number;
  profitFactor: number; // Gross Profit / Abs(Gross Loss)
  payoffRatio: number; // Avg Win / Avg Loss
  expectancy: number; // Expected $ return per trade
  expectancyRMultiple: number; // Expected R per trade
  
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  // R-Multiple Analytics
  totalAchievedR: number;
  averageAchievedR: number;
  maxAchievedR: number;
  avgPlannedRiskAmount: number;
  
  // Streaks
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  currentStreak: { type: 'WIN' | 'LOSS' | 'NONE'; count: number };
  
  // Holding & Duration
  avgHoldingTimeMinutes: number;
  avgWinHoldingTimeMinutes: number;
  avgLossHoldingTimeMinutes: number;
}

export interface DrawdownStats {
  startingBalance: number;
  peakBalance: number;
  currentBalance: number;
  equity: number;
  
  maxDrawdownAmount: number;
  maxDrawdownPercent: number;
  currentDrawdownAmount: number;
  currentDrawdownPercent: number;
  
  highWaterMark: number;
  isAtAllTimeHigh: boolean;
}

export interface DailyPnLEntry {
  date: string; // YYYY-MM-DD
  netPnL: number;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  balanceAfter: number;
}

export interface EquityPoint {
  index: number;
  date: string;
  tradeId?: string;
  instrument?: string;
  balance: number;
  equity: number;
  pnl: number;
  cumulativePnL: number;
  drawdownPercent: number;
  highWaterMark: number;
}

export interface PropFirmComplianceStatus {
  accountId: string;
  accountName: string;
  accountType: string;
  propFirmName?: string;
  
  isFunded: boolean;
  isEvaluation: boolean;
  
  // Targets & Limits
  startingBalance: number;
  currentBalance: number;
  equity: number;
  
  // Profit Target
  profitTargetAmount?: number;
  currentProfitAmount: number;
  profitTargetProgressPercent?: number;
  isProfitTargetAchieved: boolean;
  
  // Daily Loss Limit
  dailyLossLimitAmount?: number;
  todaysLossAmount: number;
  dailyLossRemainingBuffer: number;
  dailyLossUsedPercent: number;
  isDailyLossBreached: boolean;
  dailyLossWarning: boolean; // > 80% used
  
  // Max Drawdown / Total Loss Limit
  maxLossLimitAmount?: number;
  maxTotalLossThreshold: number; // Min allowed balance before breach
  maxDrawdownRemainingBuffer: number;
  maxDrawdownUsedPercent: number;
  isMaxLossBreached: boolean;
  maxLossWarning: boolean;
  
  // Minimum Trading Days
  minTradingDaysRequired?: number;
  tradingDaysCompleted: number;
  tradingDaysRemaining: number;
  isMinTradingDaysPassed: boolean;
  
  // Overall Health
  overallStatus: 'PASSED' | 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'NOT_APPLICABLE';
  breachReasons: string[];
}

export interface AccountPerformanceSummary {
  account: Account;
  metrics: FinancialMetrics;
  drawdown: DrawdownStats;
  compliance: PropFirmComplianceStatus;
  equityCurve: EquityPoint[];
  dailyPnL: DailyPnLEntry[];
  recentTrades: Trade[];
}

export type DashboardPeriod = 
  | 'DAILY' 
  | 'WEEKLY' 
  | 'MONTHLY' 
  | 'QUARTERLY' 
  | 'YEARLY' 
  | 'LIFETIME' 
  | 'CUSTOM';

export interface DashboardFilterState {
  period: DashboardPeriod;
  customStartDate?: string;
  customEndDate?: string;
  accountId: string | 'ALL';
  strategyId: string | 'ALL';
  playbookId: string | 'ALL';
  instrument: string | 'ALL';
  session: string | 'ALL';
}

export interface DrawdownCurvePoint {
  index: number;
  date: string;
  tradeId?: string;
  instrument?: string;
  drawdownAmount: number;
  drawdownPercent: number;
  highWaterMark: number;
  balance: number;
  isPeak: boolean;
}

export interface TradingCalendarDay {
  dateString: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  breakEvenCount: number;
  netPnL: number;
  winRate: number;
  trades: Trade[];
}

export interface DashboardWidgetConfig {
  id: string;
  type: string;
  title: string;
  enabled: boolean;
  order: number;
  gridSpan?: { col: number; row: number };
  settings?: Record<string, any>;
}

