/**
 * Configurable Prop-Firm Engine Domain Types & Rule Models
 * 
 * Supports customizable firms, versioned rule sets, challenges, multi-step phases,
 * trailing/static drawdowns, daily loss, consistency, scaling, and payout rules.
 */

export type PropFirmRuleType =
  | 'PROFIT_TARGET'
  | 'DAILY_LOSS'
  | 'MAX_DRAWDOWN'
  | 'TRAILING_DRAWDOWN'
  | 'CONSISTENCY_RULE'
  | 'MIN_TRADING_DAYS'
  | 'MAX_TRADING_DAYS'
  | 'NEWS_RESTRICTION'
  | 'OVERNIGHT_RESTRICTION'
  | 'WEEKEND_RESTRICTION'
  | 'POSITION_SIZE_RESTRICTION'
  | 'RISK_RESTRICTION'
  | 'SCALING_RULE'
  | 'PAYOUT_RULE'
  | 'CUSTOM_RESTRICTION';

export type RuleCategory =
  | 'OBJECTIVE'
  | 'DRAWDOWN'
  | 'TRADING_STYLE'
  | 'RISK_MANAGEMENT'
  | 'PAYOUT_SCALING';

export type RuleUnit =
  | 'CURRENCY'
  | 'PERCENT_BALANCE'
  | 'PERCENT_EQUITY'
  | 'PERCENT_OF_PROFIT'
  | 'DAYS'
  | 'TRADES'
  | 'MINUTES'
  | 'CONTRACTS'
  | 'LOTS'
  | 'BOOLEAN'
  | 'RATIO';

export type RuleCalculationMethod =
  | 'STATIC_BALANCE'
  | 'CURRENT_EQUITY'
  | 'TRAILING_HIGH_WATER_MARK'
  | 'TRAILING_EOD'
  | 'ROLLING_WINDOW'
  | 'MAX_DAILY_PROFIT_RATIO'
  | 'MAX_LOTS_TOTAL'
  | 'MAX_RISK_PER_TRADE'
  | 'TIME_WINDOW'
  | 'BOOLEAN_FLAG'
  | 'CUSTOM_EVAL';

export type RuleSeverity = 'HARD_BREACH' | 'SOFT_BREACH' | 'WARNING_ONLY' | 'INFO';

export type RuleEvaluationState = 'HEALTHY' | 'WARNING' | 'BREACHED' | 'ACHIEVED' | 'SKIPPED';

export type ChallengeType = 'ONE_STEP' | 'TWO_STEP' | 'THREE_STEP' | 'INSTANT_FUNDED' | 'CUSTOM';

export type PropFirmOverallStatus = 'PASSED' | 'ON_TRACK' | 'WARNING' | 'HARD_BREACH' | 'SOFT_BREACH';

export interface PropFirmRule {
  id: string;
  ruleSetId?: string;
  type: PropFirmRuleType;
  name: string;
  description: string;
  category: RuleCategory;
  threshold: number | boolean | string;
  unit: RuleUnit;
  calculationMethod: RuleCalculationMethod;
  warningThreshold: number; // e.g. 80% of threshold
  violationThreshold: number; // e.g. 100% of threshold
  severity: RuleSeverity;
  isEnabled: boolean;
  effectiveDate?: string;
  version: string;
  notes?: string;
  sourceMetadata?: {
    docUrl?: string;
    clauseNumber?: string;
    lastVerifiedDate?: string;
  };
  customExpression?: string;
}

export interface RuleSet {
  id: string;
  userId: string;
  firmId?: string;
  name: string;
  description: string;
  version: string;
  isTemplate?: boolean;
  rules: PropFirmRule[];
  createdAt: string;
  updatedAt: string;
}

export interface ScalingMilestone {
  level: number;
  profitTargetPercent: number; // e.g. 10%
  profitTargetAmount?: number;
  newBalanceMultiplier: number; // e.g. 1.25 (+25%)
  newBalance: number;
  newMaxDrawdownPercent?: number;
  newProfitSplitPercent: number; // e.g. 90%
  isAchieved: boolean;
  achievedAt?: string;
  notes?: string;
}

export interface PayoutTerms {
  minProfitBufferAmount: number;
  minTradingDaysBeforeFirstPayout: number;
  minDaysBetweenPayouts: number;
  defaultProfitSplitPercent: number;
  maxPayoutCapAmount?: number;
  consistencyCheckRequired: boolean;
}

export interface ChallengePhase {
  phaseNumber: number; // 1, 2, 3...
  name: string; // e.g. "Phase 1 - Student Evaluation", "Phase 2 - Verification", "Phase 3 - Funded Trader"
  ruleSetId: string;
  targetProfitPercent?: number;
  maxDailyLossPercent?: number;
  maxTotalLossPercent?: number;
  minTradingDays?: number;
  maxTradingDays?: number;
  profitSplitPercent?: number;
  isFundedStage?: boolean;
  scalingPlan?: ScalingMilestone[];
  payoutTerms?: PayoutTerms;
}

export interface Challenge {
  id: string;
  firmId: string;
  name: string; // e.g. "100k Standard 2-Step", "50k Futures Express"
  initialBalance: number;
  currency: string;
  challengeType: ChallengeType;
  phases: ChallengePhase[];
  createdAt: string;
  updatedAt: string;
}

export interface PropFirm {
  id: string;
  userId: string;
  name: string;
  website?: string;
  logoUrl?: string;
  description?: string;
  supportedPlatforms: string[]; // ['NinjaTrader', 'Rithmic', 'MetaTrader 5', 'cTrader', 'TradingView']
  assetClasses: string[]; // ['FUTURES', 'FOREX', 'CRYPTO', 'INDICES']
  payoutSpeedDays?: number;
  isCustom: boolean;
  challenges: Challenge[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleEvaluationDetail {
  ruleId: string;
  ruleName: string;
  ruleType: PropFirmRuleType;
  category: RuleCategory;
  severity: RuleSeverity;
  limitDisplay: string;
  currentValueDisplay: string;
  numericUtilizationPercent: number; // 0 to 100+
  state: RuleEvaluationState;
  message: string;
  isPassed: boolean;
}

export interface PropFirmEvaluationResult {
  accountId: string;
  accountName: string;
  accountBalance: number;
  accountEquity: number;
  startingBalance: number;
  highWaterMark: number;
  currency: string;
  
  firmId?: string;
  firmName: string;
  challengeId?: string;
  challengeName: string;
  currentPhaseNumber: number;
  phaseName: string;
  totalPhases: number;
  isFundedStage: boolean;
  
  overallStatus: PropFirmOverallStatus;
  overallProgressPercent: number;
  
  dailyLossBuffer: {
    limitAmount: number;
    usedAmount: number;
    remainingBuffer: number;
    percentUsed: number;
    isBreached: boolean;
    isWarning: boolean;
  };
  
  drawdownBuffer: {
    limitAmount: number;
    usedAmount: number;
    remainingBuffer: number;
    percentUsed: number;
    trailingPeak: number;
    isBreached: boolean;
    isWarning: boolean;
    drawdownType: 'STATIC' | 'TRAILING_INTRADAY' | 'TRAILING_EOD';
  };
  
  profitTargetProgress: {
    targetAmount: number;
    currentProfit: number;
    remainingAmount: number;
    percentAchieved: number;
    isAchieved: boolean;
  };
  
  tradingDaysProgress: {
    requiredDays: number;
    maxDaysAllowed?: number;
    completedDays: number;
    remainingDays: number;
    isMinDaysMet: boolean;
    isMaxDaysBreached: boolean;
  };
  
  consistencyMetrics: {
    maxSingleDayProfit: number;
    totalNetProfit: number;
    maxDayProfitRatioPercent: number; // e.g. 35% of total
    maxAllowedRatioPercent: number; // e.g. 50%
    isCompliant: boolean;
  };
  
  ruleEvaluations: RuleEvaluationDetail[];
  activeBreaches: string[];
  activeWarnings: string[];
  
  scalingStatus?: {
    currentLevel: number;
    milestones: ScalingMilestone[];
    nextMilestone: ScalingMilestone | null;
    progressToNextPercent: number;
  };
  
  payoutReadiness?: {
    isEligible: boolean;
    profitShareAmount: number;
    reasonsNotEligible: string[];
    nextPayoutDate?: string;
  };
}

export interface MultiAccountPropComparison {
  accountsCount: number;
  totalFundedCapital: number;
  totalEvaluationCapital: number;
  passedCount: number;
  onTrackCount: number;
  warningCount: number;
  breachedCount: number;
  evaluations: PropFirmEvaluationResult[];
}
