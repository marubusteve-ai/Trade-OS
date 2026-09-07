/**
 * TradeOS Risk Management Domain & Engine Types
 * Quantitative Risk Controls, Budgets, Policies & Multi-Asset Calculators
 */

import { AssetClass, TradeDirection } from './domain';

export type RiskWarningState = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface RiskPolicy {
  id: string;
  userId: string;
  accountId?: string; // If undefined or 'GLOBAL', applies globally
  
  // Per-Trade Controls
  maxRiskPerTradePercent: number; // e.g. 1.5%
  maxRiskPerTradeAmount?: number; // Optional hard cap in $
  minRRRatio: number; // e.g. 1.5 R
  requireStopLoss: boolean;
  
  // Period Budgets (% of account starting/current balance)
  maxDailyRiskPercent: number; // e.g. 3.0%
  maxDailyRiskAmount?: number;
  maxWeeklyRiskPercent: number; // e.g. 6.0%
  maxWeeklyRiskAmount?: number;
  maxMonthlyRiskPercent: number; // e.g. 12.0%
  maxMonthlyRiskAmount?: number;
  
  // Drawdown & Capital Preservation
  maxDrawdownLimitPercent: number; // e.g. 8.0%
  maxConsecutiveLosses: number; // e.g. 3
  
  // Exposure Controls
  maxSimultaneousExposurePercent: number; // e.g. 150%
  maxCorrelatedExposurePercent: number; // e.g. 60%
  maxOpenTradesCount: number; // e.g. 5
  
  // Warning Sensitivity
  warningThresholdPercent: number; // e.g. 75% -> triggers WARNING
  criticalThresholdPercent: number; // e.g. 95% -> triggers CRITICAL
  
  updatedAt: string;
}

export interface RiskBudgetPeriod {
  limitAmount: number;
  limitPercent: number;
  usedAmount: number;
  usedPercent: number;
  remainingAmount: number;
  remainingPercent: number;
  state: RiskWarningState;
  realizedLoss: number;
  openRisk: number;
  tradesCount: number;
}

export interface RiskBudgets {
  daily: RiskBudgetPeriod;
  weekly: RiskBudgetPeriod;
  monthly: RiskBudgetPeriod;
  accountEquity: number;
  accountBalance: number;
  overallState: RiskWarningState;
}

export interface CorrelatedExposureGroup {
  groupId: string;
  groupName: string;
  assetClass: AssetClass;
  instruments: string[];
  openTradesCount: number;
  grossNotional: number;
  netNotional: number;
  exposurePercent: number;
  plannedRiskAmount: number;
  state: RiskWarningState;
}

export interface ExposureMetrics {
  openPositionsCount: number;
  grossNotionalExposure: number;
  netNotionalExposure: number;
  longNotionalExposure: number;
  shortNotionalExposure: number;
  grossExposurePercent: number;
  netExposurePercent: number;
  state: RiskWarningState;
  correlatedGroups: CorrelatedExposureGroup[];
}

export interface PositionSizeParams {
  accountCapital: number;
  riskMode: 'PERCENT' | 'AMOUNT';
  riskValue: number; // % or $
  entryPrice: number;
  stopLossPrice: number;
  direction: TradeDirection;
  assetClass: AssetClass;
  contractMultiplier?: number; // e.g. 20 for NQ, 50 for ES, 100 for Gold
  pipSize?: number; // e.g. 0.0001 for EURUSD, 0.01 for USDJPY
  lotStep?: number; // min step e.g. 0.01
}

export interface PositionSizeResult {
  riskAmount: number;
  riskPercent: number;
  positionSizeUnits: number; // Raw units / contracts / shares
  lotSizeFormatted: string; // e.g. "1.50 Lots" or "3 Contracts"
  notionalValue: number;
  priceDistance: number;
  pipsOrPoints: number;
  pipOrPointValue: number;
  isValid: boolean;
  validationError?: string;
}

export interface StopLossParams {
  entryPrice: number;
  direction: TradeDirection;
  mode: 'PRICE' | 'RISK_AMOUNT' | 'PIPS_POINTS' | 'PERCENT';
  value: number; // Target price, risk $, distance in pips/points, or % distance
  accountCapital?: number;
  quantity?: number;
  contractMultiplier?: number;
}

export interface StopLossResult {
  stopLossPrice: number;
  distance: number;
  pipsOrPoints: number;
  riskAmount: number;
  riskPercent: number;
  direction: TradeDirection;
  isValid: boolean;
  validationError?: string;
}

export interface RewardRiskParams {
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  targetRMultiple?: number;
  direction: TradeDirection;
  quantity?: number;
  contractMultiplier?: number;
}

export interface RewardRiskResult {
  rrRatio: number;
  potentialProfit: number;
  potentialLoss: number;
  riskDistance: number;
  rewardDistance: number;
  breakevenWinRatePercent: number; // 1 / (1 + RR) * 100
  targetPriceAt1R: number;
  targetPriceAt2R: number;
  targetPriceAt3R: number;
  targetPriceAt5R: number;
  isValid: boolean;
}

export interface MarginLeverageParams {
  accountEquity: number;
  entryPrice: number;
  quantity: number;
  contractMultiplier?: number;
  leverageOrMarginMode: 'LEVERAGE' | 'MARGIN_PERCENT';
  leverageRatio?: number; // e.g. 30 for 1:30, 100 for 1:100
  marginPercent?: number; // e.g. 3.33%
  maintenanceMarginPercent?: number; // default e.g. 50% of initial
}

export interface MarginLeverageResult {
  positionNotional: number;
  requiredInitialMargin: number;
  maintenanceMargin: number;
  freeMargin: number;
  marginLevelPercent: number;
  effectiveLeverage: number;
  nominalLeverage: number;
  state: RiskWarningState;
  maxSafeNotional: number;
  isValid: boolean;
}

export interface RiskPolicyCheckItem {
  id: string;
  name: string;
  limitDisplay: string;
  currentDisplay: string;
  utilizationPercent: number;
  state: RiskWarningState;
  isHardBreached: boolean;
  message: string;
}

export interface RiskPolicyEvaluation {
  overallState: RiskWarningState;
  remainingRiskCapacityAmount: number;
  remainingRiskCapacityPercent: number;
  isTradeAllowed: boolean;
  checks: RiskPolicyCheckItem[];
  violations: string[];
  warnings: string[];
}
