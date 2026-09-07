/**
 * TradeOS AI Intelligence Layer Domain Types
 * 
 * Strict contracts for AI Reviews, Coach Interactions, Grounded Data Packets,
 * Observed/Calculated Badging, and Review History Persistence.
 */

import { FinancialMetrics, DrawdownStats } from './calculations';
import { RiskBudgets } from './risk';
import { Trade } from './domain';

export type AIReviewType =
  | 'TRADE_REVIEW'
  | 'JOURNAL_SUMMARY'
  | 'DAILY_REVIEW'
  | 'WEEKLY_REVIEW'
  | 'MONTHLY_REVIEW'
  | 'MISTAKE_ANALYSIS'
  | 'PATTERN_DISCOVERY'
  | 'STRATEGY_REVIEW'
  | 'PLAYBOOK_REVIEW'
  | 'PSYCHOLOGY_REVIEW'
  | 'RISK_REVIEW'
  | 'PERFORMANCE_COACHING'
  | 'CUSTOM_INQUIRY';

export type DataCategoryBadge = 'OBSERVED_DATA' | 'CALCULATED_METRIC' | 'INTERPRETATION' | 'RECOMMENDATION';

export interface GroundedObservedDataPoint {
  label: string;
  value: string | number;
  source: string; // e.g. "Trade Ledger #TRD-019", "Session Logs 2026-08-14"
  context?: string;
}

export interface GroundedCalculatedMetricPoint {
  metric: string;
  value: string | number;
  formulaOrSource: string; // e.g. "Gross Profit / Gross Loss", "RiskEngine 95% Parametric VaR"
  benchmark?: string;
}

export type GroundedCalculatedMetric = GroundedCalculatedMetricPoint;

export interface GroundedInterpretationPoint {
  title: string;
  text: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  supportingDataKeys?: string[];
}

export type GroundedInterpretation = GroundedInterpretationPoint;

export interface GroundedRecommendationPoint {
  action: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
  category: 'RISK' | 'EXECUTION' | 'PSYCHOLOGY' | 'PLAYBOOK' | 'ROUTINE' | 'STRATEGY';
}

export type GroundedRecommendation = GroundedRecommendationPoint;

export interface InsufficientDataWarning {
  field: string;
  observedCount: number;
  requiredMinimum: number;
  warningMessage: string;
}

export interface StructuredAIAnalysisResponse {
  reviewType: AIReviewType;
  title: string;
  summary: string;
  observedData: GroundedObservedDataPoint[];
  calculatedMetrics: GroundedCalculatedMetricPoint[];
  interpretations: GroundedInterpretationPoint[];
  recommendations: GroundedRecommendationPoint[];
  insufficientDataWarnings: InsufficientDataWarning[];
  disclaimer: string;
  generatedAt: string;
  executionTimeMs?: number;
  modelUsed: string;
}

export interface AICoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  structuredResponse?: StructuredAIAnalysisResponse;
  groundedContextSummary?: {
    accountName?: string;
    tradeCount: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
  };
}

export interface StoredAIReview {
  id: string;
  userId: string;
  workspaceId?: string;
  accountId?: string;
  reviewType: AIReviewType;
  title: string;
  prompt: string;
  response: StructuredAIAnalysisResponse;
  groundedMetricsSnapshot?: {
    tradeCount: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
    maxDrawdownPercent: number;
  };
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
}

export interface AICoachContextPayload {
  accountId?: string;
  strategyId?: string;
  playbookId?: string;
  datePreset?: string;
  startDate?: string;
  endDate?: string;
  customPrompt?: string;
  targetTradeId?: string;
}

export interface AIPresetQuestion {
  id: string;
  question: string;
  category: 'SETUPS' | 'MISTAKES' | 'CONDITIONS' | 'SESSIONS' | 'LOSING_STREAKS' | 'PLAYBOOK' | 'MONTHLY_SHIFTS' | 'INVESTIGATION';
  reviewType: AIReviewType;
  iconName: string;
  description: string;
}

export interface ComprehensiveGroundedDataset {
  accountId: string;
  accountName: string;
  currency: string;
  tradeCount: number;
  openTradeCount: number;
  timeHorizon: {
    startDate: string;
    endDate: string;
  };
  metrics: FinancialMetrics;
  drawdown: DrawdownStats;
  riskBudgets: RiskBudgets;
  sessions: {
    sessionName: string;
    tradeCount: number;
    winRate: number;
    netPnL: number;
    expectancyR: number;
  }[];
  daysOfWeek: {
    dayName: string;
    tradeCount: number;
    winRate: number;
    netPnL: number;
  }[];
  setups: {
    setupName: string;
    tradeCount: number;
    winRate: number;
    netPnL: number;
    profitFactor: number;
    expectancyR: number;
  }[];
  mistakes: {
    mistakeTag: string;
    frequency: number;
    cumulativeCost: number;
    percentageOfLosses: number;
  }[];
  ruleAdherence: {
    compliantTradeCount: number;
    compliantWinRate: number;
    compliantNetPnL: number;
    compliantAvgR: number;
    nonCompliantTradeCount: number;
    nonCompliantWinRate: number;
    nonCompliantNetPnL: number;
    nonCompliantAvgR: number;
    winRateDelta: number;
    frequentlySkippedRules: string[];
  };
  psychology: {
    preTradeEmotions: any[];
    postTradeEmotions: any[];
    tiltRiskScore: number;
    tiltWarningTriggered: boolean;
    consecutiveLossImpact: {
      lossStreakCount: number;
      winRateAfterLossStreak: number;
      avgRiskMultiplierAfterLosses: number;
    };
    averageDisciplineScore: number;
  };
  recentTrades: Trade[];
}
