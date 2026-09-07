/**
 * TradeOS Quantitative Risk Engine
 * 
 * Centralized Mathematical Authority for Position Sizing, Lot Allocation,
 * Multi-Asset Stop Loss Calculation, Reward-to-Risk Ratios, Margin & Leverage,
 * Real-Time Risk Budgets, Exposure Radar & Policy Enforcement.
 */

import { Trade, Account, AssetClass, TradeDirection } from '../types/domain';
import {
  RiskPolicy,
  RiskBudgets,
  RiskBudgetPeriod,
  ExposureMetrics,
  CorrelatedExposureGroup,
  PositionSizeParams,
  PositionSizeResult,
  StopLossParams,
  StopLossResult,
  RewardRiskParams,
  RewardRiskResult,
  MarginLeverageParams,
  MarginLeverageResult,
  RiskPolicyEvaluation,
  RiskPolicyCheckItem,
  RiskWarningState,
} from '../types/risk';
import { LocalDatabase } from '../repositories/localDatabase';

const STORAGE_RISK_POLICY_PREFIX = 'tradeos_risk_policy_';

export class RiskEngine {
  /**
   * Default institutional-grade risk policy
   */
  static getDefaultPolicy(userId: string, accountId?: string): RiskPolicy {
    return {
      id: `policy_${userId}_${accountId || 'global'}`,
      userId,
      accountId: accountId || 'GLOBAL',
      maxRiskPerTradePercent: 1.5, // 1.5% max risk per execution
      minRRRatio: 1.5, // Minimum 1:1.5 R:R
      requireStopLoss: true,
      maxDailyRiskPercent: 3.0, // 3.0% max daily risk allocation
      maxWeeklyRiskPercent: 6.0, // 6.0% max weekly loss limit
      maxMonthlyRiskPercent: 12.0, // 12.0% max monthly drawdown limit
      maxDrawdownLimitPercent: 8.0, // 8.0% peak-to-trough preservation barrier
      maxConsecutiveLosses: 3, // 3 consecutive losses circuit breaker
      maxSimultaneousExposurePercent: 150.0, // 150% notional equity exposure
      maxCorrelatedExposurePercent: 60.0, // 60% max cluster correlation
      maxOpenTradesCount: 5,
      warningThresholdPercent: 75.0, // Warning triggered at 75% budget consumption
      criticalThresholdPercent: 95.0, // Critical alert triggered at 95% budget consumption
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Loads risk policy from local persistent storage or returns default
   */
  static loadPolicy(userId: string, accountId?: string): RiskPolicy {
    const targetId = accountId || 'global';
    const stored = LocalDatabase.getItemById<RiskPolicy & { id: string }>(userId, 'risk_policies', targetId);
    if (stored) return stored;
    return this.getDefaultPolicy(userId, accountId);
  }

  /**
   * Saves risk policy to local persistent storage
   */
  static savePolicy(policy: RiskPolicy): void {
    const targetId = policy.accountId || 'global';
    LocalDatabase.insertItem<RiskPolicy & { id: string }>(policy.userId, 'risk_policies', {
      ...policy,
      id: targetId,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Resets policy to institutional defaults
   */
  static resetPolicy(userId: string, accountId?: string): RiskPolicy {
    const defaults = this.getDefaultPolicy(userId, accountId);
    this.savePolicy(defaults);
    return defaults;
  }

  // =========================================================================
  // 1. POSITION SIZING & LOT SIZE CALCULATOR
  // =========================================================================

  /**
   * Calculates deterministic position size, lot units, and notional value
   */
  static calculatePositionSize(params: PositionSizeParams): PositionSizeResult {
    const {
      accountCapital,
      riskMode,
      riskValue,
      entryPrice,
      stopLossPrice,
      direction,
      assetClass,
      contractMultiplier = 1,
      pipSize = 0.0001,
      lotStep = 0.01,
    } = params;

    if (!accountCapital || accountCapital <= 0 || !entryPrice || !stopLossPrice || !riskValue || riskValue <= 0) {
      return {
        riskAmount: 0,
        riskPercent: 0,
        positionSizeUnits: 0,
        lotSizeFormatted: '0.00',
        notionalValue: 0,
        priceDistance: 0,
        pipsOrPoints: 0,
        pipOrPointValue: 0,
        isValid: false,
        validationError: 'Please provide valid account capital, entry price, stop loss, and risk parameters.',
      };
    }

    // Directional validation
    if (direction === 'LONG' && stopLossPrice >= entryPrice) {
      return {
        riskAmount: 0,
        riskPercent: 0,
        positionSizeUnits: 0,
        lotSizeFormatted: '0.00',
        notionalValue: 0,
        priceDistance: 0,
        pipsOrPoints: 0,
        pipOrPointValue: 0,
        isValid: false,
        validationError: 'For LONG positions, Stop Loss must be strictly below Entry Price.',
      };
    }

    if (direction === 'SHORT' && stopLossPrice <= entryPrice) {
      return {
        riskAmount: 0,
        riskPercent: 0,
        positionSizeUnits: 0,
        lotSizeFormatted: '0.00',
        notionalValue: 0,
        priceDistance: 0,
        pipsOrPoints: 0,
        pipOrPointValue: 0,
        isValid: false,
        validationError: 'For SHORT positions, Stop Loss must be strictly above Entry Price.',
      };
    }

    const priceDistance = Math.abs(entryPrice - stopLossPrice);
    if (priceDistance <= 0) {
      return {
        riskAmount: 0,
        riskPercent: 0,
        positionSizeUnits: 0,
        lotSizeFormatted: '0.00',
        notionalValue: 0,
        priceDistance: 0,
        pipsOrPoints: 0,
        pipOrPointValue: 0,
        isValid: false,
        validationError: 'Price distance between Entry and Stop Loss cannot be zero.',
      };
    }

    // Determine target dollar risk
    let targetRiskAmount = 0;
    let targetRiskPercent = 0;

    if (riskMode === 'PERCENT') {
      targetRiskPercent = riskValue;
      targetRiskAmount = Number(((accountCapital * riskValue) / 100).toFixed(2));
    } else {
      targetRiskAmount = riskValue;
      targetRiskPercent = Number(((riskValue / accountCapital) * 100).toFixed(2));
    }

    // Effective dollar risk per 1 unit/contract
    const riskPerUnit = priceDistance * contractMultiplier;
    let rawUnits = targetRiskAmount / riskPerUnit;

    let formattedLot = '';
    let pipsOrPoints = 0;
    let pipOrPointValue = 0;
    let notionalValue = 0;

    if (assetClass === 'FOREX') {
      // Standard Forex: 1 Standard Lot = 100,000 base currency units
      const effectivePipSize = pipSize || (entryPrice > 50 ? 0.01 : 0.0001);
      pipsOrPoints = Number((priceDistance / effectivePipSize).toFixed(1));
      
      // Standard lots = rawUnits / 100000
      const standardLots = rawUnits / 100000;
      // Step quantization
      const steppedLots = Math.max(lotStep, Math.floor(standardLots / lotStep) * lotStep);
      rawUnits = steppedLots * 100000;
      formattedLot = `${steppedLots.toFixed(2)} Standard Lots (${rawUnits.toLocaleString()} units)`;
      pipOrPointValue = Number((steppedLots * 10).toFixed(2)); // ~$10/pip per standard lot for USD quote
      notionalValue = Number((rawUnits * entryPrice).toFixed(2));
    } else if (assetClass === 'FUTURES' || assetClass === 'INDICES') {
      pipsOrPoints = Number(priceDistance.toFixed(2));
      const contracts = Math.max(1, Math.floor(rawUnits)); // Integer contracts for futures
      rawUnits = contracts;
      formattedLot = `${contracts} ${contracts === 1 ? 'Contract' : 'Contracts'}`;
      pipOrPointValue = Number((contracts * contractMultiplier).toFixed(2));
      notionalValue = Number((contracts * entryPrice * contractMultiplier).toFixed(2));
    } else if (assetClass === 'CRYPTO') {
      pipsOrPoints = Number(priceDistance.toFixed(4));
      rawUnits = Number(rawUnits.toFixed(4));
      formattedLot = `${rawUnits} Coins / Units`;
      pipOrPointValue = rawUnits;
      notionalValue = Number((rawUnits * entryPrice).toFixed(2));
    } else {
      // Equities / CFDs / Commodities
      pipsOrPoints = Number(priceDistance.toFixed(2));
      const shares = Math.max(1, Math.floor(rawUnits));
      rawUnits = shares;
      formattedLot = `${shares.toLocaleString()} Shares / Units`;
      pipOrPointValue = shares * contractMultiplier;
      notionalValue = Number((shares * entryPrice * contractMultiplier).toFixed(2));
    }

    return {
      riskAmount: targetRiskAmount,
      riskPercent: targetRiskPercent,
      positionSizeUnits: rawUnits,
      lotSizeFormatted: formattedLot,
      notionalValue,
      priceDistance: Number(priceDistance.toFixed(4)),
      pipsOrPoints,
      pipOrPointValue,
      isValid: true,
    };
  }

  // =========================================================================
  // 2. MULTI-MODE STOP LOSS CALCULATOR
  // =========================================================================

  /**
   * Calculates stop loss price level from price, dollar risk, points, or percentage distance
   */
  static calculateStopLoss(params: StopLossParams): StopLossResult {
    const {
      entryPrice,
      direction,
      mode,
      value,
      accountCapital = 100000,
      quantity = 1,
      contractMultiplier = 1,
    } = params;

    if (!entryPrice || entryPrice <= 0 || !value || value <= 0) {
      return {
        stopLossPrice: 0,
        distance: 0,
        pipsOrPoints: 0,
        riskAmount: 0,
        riskPercent: 0,
        direction,
        isValid: false,
        validationError: 'Please provide a valid entry price and stop loss parameter.',
      };
    }

    let calculatedSL = 0;
    let distance = 0;

    switch (mode) {
      case 'PRICE': {
        calculatedSL = value;
        distance = Math.abs(entryPrice - calculatedSL);
        break;
      }
      case 'RISK_AMOUNT': {
        // value is dollar risk amount ($)
        const unitMultiplier = Math.max(0.0001, quantity * contractMultiplier);
        distance = value / unitMultiplier;
        calculatedSL = direction === 'LONG' ? entryPrice - distance : entryPrice + distance;
        break;
      }
      case 'PIPS_POINTS': {
        // value is direct points or pips distance
        distance = value;
        calculatedSL = direction === 'LONG' ? entryPrice - distance : entryPrice + distance;
        break;
      }
      case 'PERCENT': {
        // value is percentage price distance from entry
        distance = entryPrice * (value / 100);
        calculatedSL = direction === 'LONG' ? entryPrice - distance : entryPrice + distance;
        break;
      }
    }

    // Directional integrity check
    if (direction === 'LONG' && calculatedSL >= entryPrice) {
      return {
        stopLossPrice: Number(calculatedSL.toFixed(4)),
        distance: 0,
        pipsOrPoints: 0,
        riskAmount: 0,
        riskPercent: 0,
        direction,
        isValid: false,
        validationError: 'For LONG trades, calculated Stop Loss must be strictly below Entry Price.',
      };
    }

    if (direction === 'SHORT' && calculatedSL <= entryPrice) {
      return {
        stopLossPrice: Number(calculatedSL.toFixed(4)),
        distance: 0,
        pipsOrPoints: 0,
        riskAmount: 0,
        riskPercent: 0,
        direction,
        isValid: false,
        validationError: 'For SHORT trades, calculated Stop Loss must be strictly above Entry Price.',
      };
    }

    const calculatedRiskAmount = Number((distance * quantity * contractMultiplier).toFixed(2));
    const calculatedRiskPercent = accountCapital > 0
      ? Number(((calculatedRiskAmount / accountCapital) * 100).toFixed(2))
      : 0;

    return {
      stopLossPrice: Number(calculatedSL.toFixed(4)),
      distance: Number(distance.toFixed(4)),
      pipsOrPoints: Number(distance.toFixed(2)),
      riskAmount: calculatedRiskAmount,
      riskPercent: calculatedRiskPercent,
      direction,
      isValid: true,
    };
  }

  // =========================================================================
  // 3. REWARD / RISK (R:R) & BREAKEVEN PROBABILITY CALCULATOR
  // =========================================================================

  /**
   * Calculates reward-to-risk multiple, dollar payoffs, and required breakeven win rate
   */
  static calculateRewardRisk(params: RewardRiskParams): RewardRiskResult {
    const {
      entryPrice,
      stopLossPrice,
      takeProfitPrice,
      targetRMultiple,
      direction,
      quantity = 1,
      contractMultiplier = 1,
    } = params;

    if (!entryPrice || !stopLossPrice || entryPrice <= 0 || stopLossPrice <= 0) {
      return {
        rrRatio: 0,
        potentialProfit: 0,
        potentialLoss: 0,
        riskDistance: 0,
        rewardDistance: 0,
        breakevenWinRatePercent: 0,
        targetPriceAt1R: 0,
        targetPriceAt2R: 0,
        targetPriceAt3R: 0,
        targetPriceAt5R: 0,
        isValid: false,
      };
    }

    const riskDistance = Math.abs(entryPrice - stopLossPrice);
    if (riskDistance <= 0) {
      return {
        rrRatio: 0,
        potentialProfit: 0,
        potentialLoss: 0,
        riskDistance: 0,
        rewardDistance: 0,
        breakevenWinRatePercent: 0,
        targetPriceAt1R: 0,
        targetPriceAt2R: 0,
        targetPriceAt3R: 0,
        targetPriceAt5R: 0,
        isValid: false,
      };
    }

    let rewardDistance = 0;
    let finalTakeProfit = takeProfitPrice || 0;

    if (takeProfitPrice && takeProfitPrice > 0) {
      rewardDistance = direction === 'LONG'
        ? takeProfitPrice - entryPrice
        : entryPrice - takeProfitPrice;
    } else if (targetRMultiple && targetRMultiple > 0) {
      rewardDistance = riskDistance * targetRMultiple;
      finalTakeProfit = direction === 'LONG'
        ? entryPrice + rewardDistance
        : entryPrice - rewardDistance;
    }

    const effectiveRewardDistance = Math.max(0, rewardDistance);
    const rrRatio = riskDistance > 0 ? Number((effectiveRewardDistance / riskDistance).toFixed(2)) : 0;

    const potentialLoss = Number((riskDistance * quantity * contractMultiplier).toFixed(2));
    const potentialProfit = Number((effectiveRewardDistance * quantity * contractMultiplier).toFixed(2));

    // Breakeven Win Rate Formula: 1 / (1 + RR) * 100
    const breakevenWinRatePercent = rrRatio > 0
      ? Number(((1 / (1 + rrRatio)) * 100).toFixed(1))
      : 50.0;

    // Fixed R Multiple Target Price Projections
    const targetPriceAt1R = direction === 'LONG' ? entryPrice + riskDistance : entryPrice - riskDistance;
    const targetPriceAt2R = direction === 'LONG' ? entryPrice + (2 * riskDistance) : entryPrice - (2 * riskDistance);
    const targetPriceAt3R = direction === 'LONG' ? entryPrice + (3 * riskDistance) : entryPrice - (3 * riskDistance);
    const targetPriceAt5R = direction === 'LONG' ? entryPrice + (5 * riskDistance) : entryPrice - (5 * riskDistance);

    return {
      rrRatio,
      potentialProfit,
      potentialLoss,
      riskDistance: Number(riskDistance.toFixed(4)),
      rewardDistance: Number(effectiveRewardDistance.toFixed(4)),
      breakevenWinRatePercent,
      targetPriceAt1R: Number(targetPriceAt1R.toFixed(4)),
      targetPriceAt2R: Number(targetPriceAt2R.toFixed(4)),
      targetPriceAt3R: Number(targetPriceAt3R.toFixed(4)),
      targetPriceAt5R: Number(targetPriceAt5R.toFixed(4)),
      isValid: true,
    };
  }

  // =========================================================================
  // 4. MARGIN & LEVERAGE CALCULATOR
  // =========================================================================

  /**
   * Computes initial margin, free margin, effective leverage, and margin health level
   */
  static calculateMarginAndLeverage(params: MarginLeverageParams): MarginLeverageResult {
    const {
      accountEquity,
      entryPrice,
      quantity,
      contractMultiplier = 1,
      leverageOrMarginMode,
      leverageRatio = 30,
      marginPercent = 3.33,
      maintenanceMarginPercent = 50,
    } = params;

    if (!accountEquity || accountEquity <= 0 || !entryPrice || !quantity) {
      return {
        positionNotional: 0,
        requiredInitialMargin: 0,
        maintenanceMargin: 0,
        freeMargin: 0,
        marginLevelPercent: 0,
        effectiveLeverage: 0,
        nominalLeverage: 1,
        state: 'HEALTHY',
        maxSafeNotional: 0,
        isValid: false,
      };
    }

    const positionNotional = Number((quantity * entryPrice * contractMultiplier).toFixed(2));
    
    let nominalLeverage = 1;
    let requiredInitialMargin = 0;

    if (leverageOrMarginMode === 'LEVERAGE') {
      nominalLeverage = Math.max(1, leverageRatio);
      requiredInitialMargin = Number((positionNotional / nominalLeverage).toFixed(2));
    } else {
      const validMarginPct = Math.max(0.01, marginPercent);
      nominalLeverage = Number((100 / validMarginPct).toFixed(1));
      requiredInitialMargin = Number(((positionNotional * validMarginPct) / 100).toFixed(2));
    }

    const maintenanceMargin = Number(((requiredInitialMargin * (maintenanceMarginPercent / 100))).toFixed(2));
    const freeMargin = Number((accountEquity - requiredInitialMargin).toFixed(2));
    
    const marginLevelPercent = requiredInitialMargin > 0
      ? Number(((accountEquity / requiredInitialMargin) * 100).toFixed(1))
      : 999.9;

    const effectiveLeverage = accountEquity > 0
      ? Number((positionNotional / accountEquity).toFixed(2))
      : 0;

    const maxSafeNotional = Number((accountEquity * nominalLeverage * 0.85).toFixed(2)); // 85% safe cap

    let state: RiskWarningState = 'HEALTHY';
    if (freeMargin < 0 || marginLevelPercent <= 100 || effectiveLeverage >= nominalLeverage) {
      state = 'CRITICAL';
    } else if (marginLevelPercent < 200 || effectiveLeverage >= nominalLeverage * 0.7) {
      state = 'WARNING';
    }

    return {
      positionNotional,
      requiredInitialMargin,
      maintenanceMargin,
      freeMargin,
      marginLevelPercent,
      effectiveLeverage,
      nominalLeverage,
      state,
      maxSafeNotional,
      isValid: true,
    };
  }

  // =========================================================================
  // 5. PERIOD RISK BUDGETS & CAPACITY TRACKER
  // =========================================================================

  /**
   * Evaluates Daily, Weekly, and Monthly risk budget consumption and remaining capacity
   */
  static calculateRiskBudgets(
    account: Account | null,
    allTrades: Trade[],
    policy: RiskPolicy
  ): RiskBudgets {
    const accountBalance = account ? account.currentBalance : 100000;
    const accountEquity = account ? account.equity : accountBalance;
    const baselineCapital = account ? account.startingBalance : 100000;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate start of current week (Monday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const startOfWeekStr = monday.toISOString().split('T')[0];

    // Calculate start of current month (1st of month)
    const startOfMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const openTrades = allTrades.filter(t => t.status === 'OPEN');
    const closedTrades = allTrades.filter(t => t.status === 'CLOSED');

    // 1. Daily Calculation
    const todayClosedTrades = closedTrades.filter(t => {
      const d = (t.exitDate || t.entryDate).split('T')[0];
      return d === todayStr;
    });
    const todayOpenTrades = openTrades.filter(t => {
      const d = t.entryDate.split('T')[0];
      return d === todayStr;
    });

    const realizedLossToday = todayClosedTrades.reduce((acc, t) => t.netPnL < 0 ? acc + Math.abs(t.netPnL) : acc, 0);
    const openRiskToday = todayOpenTrades.reduce((acc, t) => acc + (t.plannedRiskAmount || 0), 0);
    const usedDailyAmount = realizedLossToday + openRiskToday;

    const dailyLimitAmount = policy.maxDailyRiskAmount || (baselineCapital * (policy.maxDailyRiskPercent / 100));
    const dailyUsedPercent = dailyLimitAmount > 0 ? (usedDailyAmount / dailyLimitAmount) * 100 : 0;
    const dailyRemainingAmount = Math.max(0, dailyLimitAmount - usedDailyAmount);
    const dailyRemainingPercent = baselineCapital > 0 ? (dailyRemainingAmount / baselineCapital) * 100 : 0;

    let dailyState: RiskWarningState = 'HEALTHY';
    if (dailyUsedPercent >= policy.criticalThresholdPercent) dailyState = 'CRITICAL';
    else if (dailyUsedPercent >= policy.warningThresholdPercent) dailyState = 'WARNING';

    const dailyBudget: RiskBudgetPeriod = {
      limitAmount: Number(dailyLimitAmount.toFixed(2)),
      limitPercent: policy.maxDailyRiskPercent,
      usedAmount: Number(usedDailyAmount.toFixed(2)),
      usedPercent: Number(dailyUsedPercent.toFixed(1)),
      remainingAmount: Number(dailyRemainingAmount.toFixed(2)),
      remainingPercent: Number(dailyRemainingPercent.toFixed(2)),
      state: dailyState,
      realizedLoss: Number(realizedLossToday.toFixed(2)),
      openRisk: Number(openRiskToday.toFixed(2)),
      tradesCount: todayClosedTrades.length + todayOpenTrades.length,
    };

    // 2. Weekly Calculation
    const weekClosedTrades = closedTrades.filter(t => {
      const d = (t.exitDate || t.entryDate).split('T')[0];
      return d >= startOfWeekStr;
    });
    const weekOpenTrades = openTrades.filter(t => {
      const d = t.entryDate.split('T')[0];
      return d >= startOfWeekStr;
    });

    const realizedLossThisWeek = weekClosedTrades.reduce((acc, t) => t.netPnL < 0 ? acc + Math.abs(t.netPnL) : acc, 0);
    const openRiskThisWeek = weekOpenTrades.reduce((acc, t) => acc + (t.plannedRiskAmount || 0), 0);
    const usedWeeklyAmount = realizedLossThisWeek + openRiskThisWeek;

    const weeklyLimitAmount = policy.maxWeeklyRiskAmount || (baselineCapital * (policy.maxWeeklyRiskPercent / 100));
    const weeklyUsedPercent = weeklyLimitAmount > 0 ? (usedWeeklyAmount / weeklyLimitAmount) * 100 : 0;
    const weeklyRemainingAmount = Math.max(0, weeklyLimitAmount - usedWeeklyAmount);
    const weeklyRemainingPercent = baselineCapital > 0 ? (weeklyRemainingAmount / baselineCapital) * 100 : 0;

    let weeklyState: RiskWarningState = 'HEALTHY';
    if (weeklyUsedPercent >= policy.criticalThresholdPercent) weeklyState = 'CRITICAL';
    else if (weeklyUsedPercent >= policy.warningThresholdPercent) weeklyState = 'WARNING';

    const weeklyBudget: RiskBudgetPeriod = {
      limitAmount: Number(weeklyLimitAmount.toFixed(2)),
      limitPercent: policy.maxWeeklyRiskPercent,
      usedAmount: Number(usedWeeklyAmount.toFixed(2)),
      usedPercent: Number(weeklyUsedPercent.toFixed(1)),
      remainingAmount: Number(weeklyRemainingAmount.toFixed(2)),
      remainingPercent: Number(weeklyRemainingPercent.toFixed(2)),
      state: weeklyState,
      realizedLoss: Number(realizedLossThisWeek.toFixed(2)),
      openRisk: Number(openRiskThisWeek.toFixed(2)),
      tradesCount: weekClosedTrades.length + weekOpenTrades.length,
    };

    // 3. Monthly Calculation
    const monthClosedTrades = closedTrades.filter(t => {
      const d = (t.exitDate || t.entryDate).split('T')[0];
      return d >= startOfMonthStr;
    });
    const monthOpenTrades = openTrades.filter(t => {
      const d = t.entryDate.split('T')[0];
      return d >= startOfMonthStr;
    });

    const realizedLossThisMonth = monthClosedTrades.reduce((acc, t) => t.netPnL < 0 ? acc + Math.abs(t.netPnL) : acc, 0);
    const openRiskThisMonth = monthOpenTrades.reduce((acc, t) => acc + (t.plannedRiskAmount || 0), 0);
    const usedMonthlyAmount = realizedLossThisMonth + openRiskThisMonth;

    const monthlyLimitAmount = policy.maxMonthlyRiskAmount || (baselineCapital * (policy.maxMonthlyRiskPercent / 100));
    const monthlyUsedPercent = monthlyLimitAmount > 0 ? (usedMonthlyAmount / monthlyLimitAmount) * 100 : 0;
    const monthlyRemainingAmount = Math.max(0, monthlyLimitAmount - usedMonthlyAmount);
    const monthlyRemainingPercent = baselineCapital > 0 ? (monthlyRemainingAmount / baselineCapital) * 100 : 0;

    let monthlyState: RiskWarningState = 'HEALTHY';
    if (monthlyUsedPercent >= policy.criticalThresholdPercent) monthlyState = 'CRITICAL';
    else if (monthlyUsedPercent >= policy.warningThresholdPercent) monthlyState = 'WARNING';

    const monthlyBudget: RiskBudgetPeriod = {
      limitAmount: Number(monthlyLimitAmount.toFixed(2)),
      limitPercent: policy.maxMonthlyRiskPercent,
      usedAmount: Number(usedMonthlyAmount.toFixed(2)),
      usedPercent: Number(monthlyUsedPercent.toFixed(1)),
      remainingAmount: Number(monthlyRemainingAmount.toFixed(2)),
      remainingPercent: Number(monthlyRemainingPercent.toFixed(2)),
      state: monthlyState,
      realizedLoss: Number(realizedLossThisMonth.toFixed(2)),
      openRisk: Number(openRiskThisMonth.toFixed(2)),
      tradesCount: monthClosedTrades.length + monthOpenTrades.length,
    };

    let overallState: RiskWarningState = 'HEALTHY';
    if (dailyState === 'CRITICAL' || weeklyState === 'CRITICAL' || monthlyState === 'CRITICAL') {
      overallState = 'CRITICAL';
    } else if (dailyState === 'WARNING' || weeklyState === 'WARNING' || monthlyState === 'WARNING') {
      overallState = 'WARNING';
    }

    return {
      daily: dailyBudget,
      weekly: weeklyBudget,
      monthly: monthlyBudget,
      accountEquity: Number(accountEquity.toFixed(2)),
      accountBalance: Number(accountBalance.toFixed(2)),
      overallState,
    };
  }

  // =========================================================================
  // 6. EXPOSURE MONITORING & CORRELATION RADAR
  // =========================================================================

  /**
   * Computes open positions notional exposure and groups by asset correlations
   */
  static calculateExposure(
    account: Account | null,
    openTrades: Trade[],
    policy: RiskPolicy
  ): ExposureMetrics {
    const accountEquity = account ? account.equity : 100000;

    let grossNotional = 0;
    let longNotional = 0;
    let shortNotional = 0;

    // Cluster map for correlated assets
    const clusters: Record<string, {
      name: string;
      assetClass: AssetClass;
      instruments: Set<string>;
      count: number;
      grossNotional: number;
      netNotional: number;
      plannedRisk: number;
    }> = {
      US_TECH_INDICES: {
        name: 'US Equity Indices (NQ, ES, YM, RTY)',
        assetClass: 'INDICES',
        instruments: new Set(['NQ', 'ES', 'YM', 'RTY', 'MNQ', 'MES', 'QQQ', 'SPY', 'NAS100', 'US30', 'US500']),
        count: 0,
        grossNotional: 0,
        netNotional: 0,
        plannedRisk: 0,
      },
      USD_FX_PAIRS: {
        name: 'USD Major Currencies (EURUSD, GBPUSD, USDJPY)',
        assetClass: 'FOREX',
        instruments: new Set(['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'USDJPY', 'USDCAD', 'USDCHF', 'DXY']),
        count: 0,
        grossNotional: 0,
        netNotional: 0,
        plannedRisk: 0,
      },
      PRECIOUS_METALS: {
        name: 'Precious Metals & Commodities (Gold, Silver, Oil)',
        assetClass: 'COMMODITIES',
        instruments: new Set(['XAUUSD', 'GOLD', 'XAGUSD', 'SILVER', 'CL', 'OIL', 'WTI', 'BRENT']),
        count: 0,
        grossNotional: 0,
        netNotional: 0,
        plannedRisk: 0,
      },
      CRYPTO_ASSETS: {
        name: 'Digital Assets (BTC, ETH, SOL)',
        assetClass: 'CRYPTO',
        instruments: new Set(['BTC', 'BTCUSDT', 'ETH', 'ETHUSDT', 'SOL', 'SOLUSDT', 'BNB', 'XRP']),
        count: 0,
        grossNotional: 0,
        netNotional: 0,
        plannedRisk: 0,
      },
      SINGLE_EQUITIES: {
        name: 'Individual Equities & Stocks',
        assetClass: 'EQUITIES',
        instruments: new Set(['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD']),
        count: 0,
        grossNotional: 0,
        netNotional: 0,
        plannedRisk: 0,
      },
    };

    openTrades.forEach(trade => {
      const multiplier = trade.contractMultiplier || 1;
      const notional = trade.quantity * trade.entryPrice * multiplier;
      
      grossNotional += notional;
      if (trade.direction === 'LONG') {
        longNotional += notional;
      } else {
        shortNotional += notional;
      }

      // Check which cluster it fits into
      const cleanInst = (trade.instrument || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      let assignedClusterKey = 'OTHER';

      for (const [key, cluster] of Object.entries(clusters)) {
        if (cluster.instruments.has(cleanInst) || cluster.assetClass === trade.assetClass) {
          assignedClusterKey = key;
          break;
        }
      }

      if (!clusters[assignedClusterKey]) {
        clusters[assignedClusterKey] = {
          name: `${trade.assetClass || 'General'} Assets`,
          assetClass: trade.assetClass || 'EQUITIES',
          instruments: new Set([cleanInst]),
          count: 0,
          grossNotional: 0,
          netNotional: 0,
          plannedRisk: 0,
        };
      }

      const cl = clusters[assignedClusterKey];
      cl.count++;
      cl.instruments.add(cleanInst);
      cl.grossNotional += notional;
      cl.netNotional += (trade.direction === 'LONG' ? notional : -notional);
      cl.plannedRisk += (trade.plannedRiskAmount || 0);
    });

    const netNotional = longNotional - shortNotional;
    const grossExposurePercent = accountEquity > 0
      ? Number(((grossNotional / accountEquity) * 100).toFixed(1))
      : 0;
    const netExposurePercent = accountEquity > 0
      ? Number(((netNotional / accountEquity) * 100).toFixed(1))
      : 0;

    let overallState: RiskWarningState = 'HEALTHY';
    if (grossExposurePercent >= policy.maxSimultaneousExposurePercent) {
      overallState = 'CRITICAL';
    } else if (grossExposurePercent >= policy.maxSimultaneousExposurePercent * (policy.warningThresholdPercent / 100)) {
      overallState = 'WARNING';
    }

    const correlatedGroups: CorrelatedExposureGroup[] = Object.entries(clusters)
      .filter(([_, cl]) => cl.count > 0)
      .map(([key, cl]) => {
        const expPct = accountEquity > 0 ? (cl.grossNotional / accountEquity) * 100 : 0;
        let grpState: RiskWarningState = 'HEALTHY';
        if (expPct >= policy.maxCorrelatedExposurePercent) {
          grpState = 'CRITICAL';
        } else if (expPct >= policy.maxCorrelatedExposurePercent * (policy.warningThresholdPercent / 100)) {
          grpState = 'WARNING';
        }

        return {
          groupId: key,
          groupName: cl.name,
          assetClass: cl.assetClass,
          instruments: Array.from(cl.instruments),
          openTradesCount: cl.count,
          grossNotional: Number(cl.grossNotional.toFixed(2)),
          netNotional: Number(cl.netNotional.toFixed(2)),
          exposurePercent: Number(expPct.toFixed(1)),
          plannedRiskAmount: Number(cl.plannedRisk.toFixed(2)),
          state: grpState,
        };
      });

    return {
      openPositionsCount: openTrades.length,
      grossNotionalExposure: Number(grossNotional.toFixed(2)),
      netNotionalExposure: Number(netNotional.toFixed(2)),
      longNotionalExposure: Number(longNotional.toFixed(2)),
      shortNotionalExposure: Number(shortNotional.toFixed(2)),
      grossExposurePercent,
      netExposurePercent,
      state: overallState,
      correlatedGroups,
    };
  }

  // =========================================================================
  // 7. RISK POLICY EVALUATOR & TRADE PERMISSION GUARD
  // =========================================================================

  /**
   * Performs real-time compliance audit of all risk policies against current account state
   */
  static evaluatePolicy(
    account: Account | null,
    trades: Trade[],
    policy: RiskPolicy
  ): RiskPolicyEvaluation {
    const accountCapital = account ? account.startingBalance : 100000;
    const accountEquity = account ? account.equity : accountCapital;
    const currentBalance = account ? account.currentBalance : accountCapital;

    const budgets = this.calculateRiskBudgets(account, trades, policy);
    const openTrades = trades.filter(t => t.status === 'OPEN');
    const exposure = this.calculateExposure(account, openTrades, policy);

    // Current drawdown
    const highWaterMark = account ? Math.max(account.highWaterMark, account.startingBalance, currentBalance) : accountCapital;
    const currentDrawdownAmount = Math.max(0, highWaterMark - currentBalance);
    const currentDrawdownPercent = highWaterMark > 0 ? (currentDrawdownAmount / highWaterMark) * 100 : 0;
    const maxAllowedDrawdownAmount = (highWaterMark * (policy.maxDrawdownLimitPercent / 100));
    const drawdownRemainingBuffer = Math.max(0, maxAllowedDrawdownAmount - currentDrawdownAmount);
    const drawdownUsedPercent = maxAllowedDrawdownAmount > 0 ? (currentDrawdownAmount / maxAllowedDrawdownAmount) * 100 : 0;

    const checks: RiskPolicyCheckItem[] = [];
    const violations: string[] = [];
    const warnings: string[] = [];

    // 1. Daily Budget Check
    const dailyCheckState = budgets.daily.state;
    checks.push({
      id: 'check_daily_budget',
      name: 'Daily Risk Budget Allocation',
      limitDisplay: `$${budgets.daily.limitAmount.toLocaleString()} (${policy.maxDailyRiskPercent}%)`,
      currentDisplay: `$${budgets.daily.usedAmount.toLocaleString()} (${budgets.daily.usedPercent}%)`,
      utilizationPercent: budgets.daily.usedPercent,
      state: dailyCheckState,
      isHardBreached: budgets.daily.usedPercent >= 100,
      message: dailyCheckState === 'CRITICAL'
        ? 'Daily risk budget has reached or exceeded critical policy threshold.'
        : dailyCheckState === 'WARNING'
        ? 'Approaching maximum allowable daily loss budget limit.'
        : 'Daily risk usage is well within capital preservation guardrails.',
    });
    if (dailyCheckState === 'CRITICAL') violations.push('Daily Risk Budget Breached / Exhausted');
    else if (dailyCheckState === 'WARNING') warnings.push('Daily Risk Budget > 75% Consumed');

    // 2. Weekly Budget Check
    const weeklyCheckState = budgets.weekly.state;
    checks.push({
      id: 'check_weekly_budget',
      name: 'Weekly Risk Budget Limit',
      limitDisplay: `$${budgets.weekly.limitAmount.toLocaleString()} (${policy.maxWeeklyRiskPercent}%)`,
      currentDisplay: `$${budgets.weekly.usedAmount.toLocaleString()} (${budgets.weekly.usedPercent}%)`,
      utilizationPercent: budgets.weekly.usedPercent,
      state: weeklyCheckState,
      isHardBreached: budgets.weekly.usedPercent >= 100,
      message: weeklyCheckState === 'CRITICAL'
        ? 'Weekly risk capacity exhausted.'
        : weeklyCheckState === 'WARNING'
        ? 'Approaching weekly loss preservation limit.'
        : 'Weekly risk consumption is within safe operational boundaries.',
    });
    if (weeklyCheckState === 'CRITICAL') violations.push('Weekly Risk Capacity Exhausted');
    else if (weeklyCheckState === 'WARNING') warnings.push('Weekly Risk > 75% Utilized');

    // 3. Drawdown Limit Check
    let ddState: RiskWarningState = 'HEALTHY';
    if (drawdownUsedPercent >= policy.criticalThresholdPercent) ddState = 'CRITICAL';
    else if (drawdownUsedPercent >= policy.warningThresholdPercent) ddState = 'WARNING';

    checks.push({
      id: 'check_drawdown_limit',
      name: 'Maximum Account Drawdown Ceiling',
      limitDisplay: `-${policy.maxDrawdownLimitPercent.toFixed(1)}% ($${maxAllowedDrawdownAmount.toFixed(0)})`,
      currentDisplay: `-${currentDrawdownPercent.toFixed(2)}% ($${currentDrawdownAmount.toFixed(0)})`,
      utilizationPercent: Number(drawdownUsedPercent.toFixed(1)),
      state: ddState,
      isHardBreached: currentDrawdownPercent >= policy.maxDrawdownLimitPercent,
      message: ddState === 'CRITICAL'
        ? 'Account drawdown has breached or is dangerously near the maximum allowable risk limit.'
        : ddState === 'WARNING'
        ? 'Account is in a drawdown warning zone. Recommend reducing position size.'
        : 'Drawdown levels are healthy.',
    });
    if (ddState === 'CRITICAL') violations.push('Drawdown Preservation Threshold Breached');
    else if (ddState === 'WARNING') warnings.push('Drawdown Warning Threshold Active');

    // 4. Simultaneous Exposure Check
    const expState = exposure.state;
    checks.push({
      id: 'check_gross_exposure',
      name: 'Simultaneous Gross Portfolio Exposure',
      limitDisplay: `${policy.maxSimultaneousExposurePercent}% Equity ($${(accountEquity * (policy.maxSimultaneousExposurePercent / 100)).toLocaleString()})`,
      currentDisplay: `${exposure.grossExposurePercent}% ($${exposure.grossNotionalExposure.toLocaleString()})`,
      utilizationPercent: Number(((exposure.grossExposurePercent / policy.maxSimultaneousExposurePercent) * 100).toFixed(1)),
      state: expState,
      isHardBreached: exposure.grossExposurePercent >= policy.maxSimultaneousExposurePercent,
      message: expState === 'CRITICAL'
        ? 'Simultaneous portfolio exposure exceeds maximum allowable notional leverage.'
        : expState === 'WARNING'
        ? 'Approaching maximum concurrent portfolio exposure.'
        : 'Portfolio exposure is balanced.',
    });
    if (expState === 'CRITICAL') violations.push('Maximum Simultaneous Portfolio Exposure Exceeded');

    // 5. Open Positions Count Check
    const openCount = openTrades.length;
    let countState: RiskWarningState = 'HEALTHY';
    if (openCount >= policy.maxOpenTradesCount) countState = 'CRITICAL';
    else if (openCount >= policy.maxOpenTradesCount - 1) countState = 'WARNING';

    checks.push({
      id: 'check_open_trades_count',
      name: 'Max Concurrent Open Positions',
      limitDisplay: `${policy.maxOpenTradesCount} Trades`,
      currentDisplay: `${openCount} Open Trades`,
      utilizationPercent: Number(((openCount / policy.maxOpenTradesCount) * 100).toFixed(1)),
      state: countState,
      isHardBreached: openCount >= policy.maxOpenTradesCount,
      message: countState === 'CRITICAL'
        ? 'Maximum concurrent trade capacity reached.'
        : 'Open position count within allowed limit.',
    });
    if (countState === 'CRITICAL') violations.push(`Max Concurrent Positions (${policy.maxOpenTradesCount}) Reached`);

    // Remaining Risk Capacity is the bottleneck across daily budget, drawdown buffer, and risk per trade
    const remainingRiskCapacityAmount = Math.max(0, Math.min(
      budgets.daily.remainingAmount,
      drawdownRemainingBuffer
    ));
    const remainingRiskCapacityPercent = accountCapital > 0
      ? Number(((remainingRiskCapacityAmount / accountCapital) * 100).toFixed(2))
      : 0;

    let overallState: RiskWarningState = 'HEALTHY';
    if (violations.length > 0) overallState = 'CRITICAL';
    else if (warnings.length > 0) overallState = 'WARNING';

    const isTradeAllowed = overallState !== 'CRITICAL' && remainingRiskCapacityAmount > 0;

    return {
      overallState,
      remainingRiskCapacityAmount: Number(remainingRiskCapacityAmount.toFixed(2)),
      remainingRiskCapacityPercent,
      isTradeAllowed,
      checks,
      violations,
      warnings,
    };
  }
}
