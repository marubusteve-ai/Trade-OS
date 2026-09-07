/**
 * Psychology & Behavioral Trading Domain Models
 * Advanced behavioral quantification, mistake taxonomy, tilt detection, and habit tracking.
 */

import { Trade } from './domain';

export type PreTradeEmotion = 
  | 'CALM' 
  | 'FOCUSED' 
  | 'CONFIDENT' 
  | 'EAGER' 
  | 'ANXIOUS' 
  | 'FOMO' 
  | 'REVENGE' 
  | 'FATIGUED'
  | 'OPTIMISTIC'
  | 'OVERCONFIDENT'
  | 'IMPATIENT'
  | 'BORED';

export type PostTradeEmotion = 
  | 'SATISFIED' 
  | 'DISCIPLINED' 
  | 'PROUD' 
  | 'NEUTRAL' 
  | 'FRUSTRATED' 
  | 'ANGRY' 
  | 'REGRETFUL'
  | 'RELIEVED'
  | 'EUPHORIC'
  | 'DISAPPOINTED';

export type DecisionQuality = 
  | 'EXCELLENT' 
  | 'GOOD' 
  | 'SUB_OPTIMAL' 
  | 'POOR' 
  | 'IRRATIONAL';

export type MistakeSeverity = 'MINOR' | 'MODERATE' | 'SEVERE';

export interface MistakeCategory {
  id: string;
  name: string;
  description: string;
  colorHex: string;
  isCustom?: boolean;
}

export interface MistakeTaxonomyItem {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  description: string;
  severity: MistakeSeverity;
  typicalImpactSummary?: string;
  isCustom?: boolean;
}

export interface SessionCheckIn {
  id: string;
  userId: string;
  timestamp: string;
  date: string; // YYYY-MM-DD
  energyLevel: number; // 1-10
  focusScore: number; // 1-10
  stressLevel: number; // 1-10
  primaryMood: PreTradeEmotion;
  sleepHours?: number;
  marketPreparedness: 'UNPREPARED' | 'BASIC' | 'THOROUGH' | 'OPTIMAL';
  sessionGoals?: string[];
  rulesCommittedTo?: string[];
  notes?: string;
}

// Analytics Aggregate Models

export interface EmotionPerformanceMetric {
  emotion: string;
  label: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  winRate: number; // 0-100%
  totalNetPnL: number;
  avgPnL: number;
  avgRMultiple: number;
  profitFactor: number;
}

export interface MistakeLossMetric {
  mistakeId: string;
  mistakeName: string;
  categoryName: string;
  severity: MistakeSeverity;
  occurrencesCount: number;
  frequencyPercent: number; // % of all analyzed trades
  totalLossPnL: number; // absolute negative sum
  avgLossPnL: number;
  winRateWhenCommitted: number;
  totalNetPnL: number;
  trades: Trade[];
}

export interface MistakeCostAnalysis {
  totalTrades: number;
  cleanTradesCount: number;
  mistakeTradesCount: number;
  cleanNetPnL: number;
  mistakeNetPnL: number;
  cleanWinRate: number;
  mistakeWinRate: number;
  cleanAvgR: number;
  mistakeAvgR: number;
  cleanProfitFactor: number;
  mistakeProfitFactor: number;
  totalCostOfMistakesDrag: number; // Dollar difference
  avoidableLossesAmount: number;
}

export interface ConsecutiveLossImpact {
  consecutiveLossTier: string; // 'After 1 Loss', 'After 2 Losses', 'After 3+ Losses'
  lossesCount: number;
  sampleTradesCount: number;
  winRate: number;
  avgAchievedR: number;
  avgNetPnL: number;
  avgRiskChangePercent: number; // +% means revenge sizing / martingale tendency
  avgIntervalMinutes: number; // Speed of re-entry (smaller = more impulsive)
}

export interface RuleAdherenceComparison {
  compliantTradesCount: number;
  nonCompliantTradesCount: number;
  compliantWinRate: number;
  nonCompliantWinRate: number;
  compliantNetPnL: number;
  nonCompliantNetPnL: number;
  compliantAvgR: number;
  nonCompliantAvgR: number;
  compliantProfitFactor: number;
  nonCompliantProfitFactor: number;
}

export interface PsychologyDailySummary {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  tradesCount: number;
  winCount: number;
  lossCount: number;
  netPnL: number;
  avgDiscipline: number;
  avgStress: number;
  avgPatience: number;
  avgConfidence: number;
  primaryEmotion: PreTradeEmotion;
  mistakeCount: number;
  mistakesList: string[];
  checkIns: SessionCheckIn[];
  trades: Trade[];
}

export interface BehavioralRadarScores {
  discipline: number; // 0-100
  patience: number; // 0-100
  confidence: number; // 0-100
  stressControl: number; // 0-100 (higher = calmer/lower stress)
  impulsivityControl: number; // 0-100 (higher = less impulsive)
  ruleAdherence: number; // 0-100
  overallDisciplineIndex: number; // 0-100 weighted index
}

export type TiltStatusLevel = 'CALM' | 'CAUTION' | 'TILT_WARNING' | 'CIRCUIT_BREAKER_TRIPPED';

export interface TiltCircuitBreakerStatus {
  status: TiltStatusLevel;
  tiltProbabilityPercent: number;
  warningSignals: string[];
  suggestedAction: string;
  recentConsecutiveLosses: number;
  recentElevatedStress: boolean;
  recentMistakeSpike: boolean;
  cooldownActive: boolean;
  cooldownRemainingMinutes?: number;
}

export interface PsychologyAnalyticsReport {
  radar: BehavioralRadarScores;
  tiltMonitor: TiltCircuitBreakerStatus;
  emotionsPre: EmotionPerformanceMetric[];
  emotionsPost: EmotionPerformanceMetric[];
  mistakeLossMetrics: MistakeLossMetric[];
  costAnalysis: MistakeCostAnalysis;
  consecutiveLossImpact: ConsecutiveLossImpact[];
  ruleAdherence: RuleAdherenceComparison;
  dailyCalendar: PsychologyDailySummary[];
  topMistakesByCost: MistakeLossMetric[];
  topMistakesByFrequency: MistakeLossMetric[];
  tradingHabitsSummary: { habit: string; adherenceRate: number; count: number }[];
}
