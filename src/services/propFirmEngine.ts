/**
 * Configurable Prop-Firm Evaluation & Quantitative Compliance Engine
 * 
 * Evaluates any trading account and trade history against versioned prop-firm rule sets,
 * computing deterministic daily loss buffers, trailing/static drawdown thresholds, consistency ratios,
 * restriction adherence, scaling progress, and payout eligibility.
 */

import { Account, Trade } from '../types/domain';
import {
  PropFirm,
  RuleSet,
  PropFirmRule,
  Challenge,
  ChallengePhase,
  PropFirmEvaluationResult,
  RuleEvaluationDetail,
  MultiAccountPropComparison,
  RuleEvaluationState,
  PropFirmOverallStatus,
  ScalingMilestone,
} from '../types/propFirm';

export class PropFirmEngine {
  /**
   * Evaluates an account and its trades against a designated or resolved RuleSet
   */
  static evaluateAccount(
    account: Account,
    trades: Trade[],
    ruleSet: RuleSet,
    challenge?: Challenge | null,
    phaseNumber: number = 1
  ): PropFirmEvaluationResult {
    const startingBalance = account.startingBalance || 100000;
    const currentBalance = account.currentBalance || startingBalance;
    const currentEquity = account.equity || currentBalance;
    const highWaterMark = Math.max(account.highWaterMark || startingBalance, currentEquity, currentBalance, startingBalance);
    const currency = account.currency || 'USD';

    // Identify Phase parameters if challenge is provided
    const phase: ChallengePhase | undefined = challenge?.phases?.find(p => p.phaseNumber === phaseNumber) || challenge?.phases?.[0];
    const isFundedStage = phase?.isFundedStage || account.accountType === 'PROP_FUNDED';
    const phaseName = phase?.name || (isFundedStage ? 'Funded Account Stage' : `Evaluation Phase ${phaseNumber}`);

    // Filter closed vs open trades
    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const openTrades = trades.filter(t => t.status === 'OPEN');

    // 1. Group closed trades by calendar day (YYYY-MM-DD)
    const dailyPnLMap = new Map<string, number>();
    const tradingDaysSet = new Set<string>();

    closedTrades.forEach(t => {
      if (!t.exitDate && !t.entryDate) return;
      const dateStr = (t.exitDate || t.entryDate).split('T')[0];
      tradingDaysSet.add(dateStr);
      const current = dailyPnLMap.get(dateStr) || 0;
      dailyPnLMap.set(dateStr, current + (t.netPnL || 0));
    });

    // Also include open trades entry date in active trading days
    openTrades.forEach(t => {
      if (t.entryDate) {
        tradingDaysSet.add(t.entryDate.split('T')[0]);
      }
    });

    const completedTradingDays = tradingDaysSet.size;

    // Determine today's date in ISO
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRealizedPnL = dailyPnLMap.get(todayStr) || 0;
    // Today's open planned risk / unrealized loss
    const openPlannedRisk = openTrades.reduce((sum, t) => sum + (t.plannedRiskAmount || 0), 0);
    const todaysLossAmount = Math.max(0, -todayRealizedPnL) + openPlannedRisk;

    // Cumulative net PnL from trades
    const totalNetProfit = closedTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const currentProfitFromStarting = Math.max(0, currentEquity - startingBalance);

    // Rule evaluation collection
    const ruleEvaluations: RuleEvaluationDetail[] = [];
    const activeBreaches: string[] = [];
    const activeWarnings: string[] = [];

    // Temporary buffers for high-level summary
    let dailyLossLimitAmount = 0;
    let dailyLossBreached = false;
    let dailyLossWarning = false;
    let dailyLossUsedPct = 0;

    let maxDrawdownLimitAmount = 0;
    let maxDrawdownBreached = false;
    let maxDrawdownWarning = false;
    let maxDrawdownUsedPct = 0;
    let drawdownPeak = highWaterMark;
    let drawdownType: 'STATIC' | 'TRAILING_INTRADAY' | 'TRAILING_EOD' = 'STATIC';

    let profitTargetAmount = 0;
    let isProfitTargetAchieved = false;
    let profitTargetAchievedPct = 0;

    let requiredTradingDays = 0;
    let maxTradingDaysAllowed: number | undefined = undefined;

    let maxAllowedProfitRatio = 50;

    // 2. Iterate through each rule in the RuleSet
    const enabledRules = ruleSet.rules.filter(r => r.isEnabled);

    for (const rule of enabledRules) {
      const evaluation = this.evaluateSingleRule({
        rule,
        account,
        startingBalance,
        currentBalance,
        currentEquity,
        highWaterMark,
        closedTrades,
        openTrades,
        dailyPnLMap,
        completedTradingDays,
        todaysLossAmount,
        totalNetProfit,
        currentProfitFromStarting,
      });

      ruleEvaluations.push(evaluation);

      if (evaluation.state === 'BREACHED') {
        if (rule.severity === 'HARD_BREACH' || rule.severity === 'SOFT_BREACH') {
          activeBreaches.push(`[${rule.name}] ${evaluation.message}`);
        } else {
          activeWarnings.push(`[${rule.name}] ${evaluation.message}`);
        }
      } else if (evaluation.state === 'WARNING') {
        activeWarnings.push(`[${rule.name}] ${evaluation.message}`);
      }

      // Populate summary fields based on rule type
      if (rule.type === 'DAILY_LOSS') {
        dailyLossLimitAmount = this.resolveNumericThreshold(rule.threshold, rule.unit, startingBalance);
        dailyLossUsedPct = evaluation.numericUtilizationPercent;
        dailyLossBreached = evaluation.state === 'BREACHED';
        dailyLossWarning = evaluation.state === 'WARNING';
      } else if (rule.type === 'MAX_DRAWDOWN' || rule.type === 'TRAILING_DRAWDOWN') {
        maxDrawdownLimitAmount = this.resolveNumericThreshold(rule.threshold, rule.unit, startingBalance);
        maxDrawdownUsedPct = evaluation.numericUtilizationPercent;
        maxDrawdownBreached = evaluation.state === 'BREACHED';
        maxDrawdownWarning = evaluation.state === 'WARNING';
        if (rule.calculationMethod === 'TRAILING_HIGH_WATER_MARK') {
          drawdownType = 'TRAILING_INTRADAY';
          drawdownPeak = highWaterMark;
        } else if (rule.calculationMethod === 'TRAILING_EOD') {
          drawdownType = 'TRAILING_EOD';
          drawdownPeak = highWaterMark;
        } else {
          drawdownType = 'STATIC';
          drawdownPeak = startingBalance;
        }
      } else if (rule.type === 'PROFIT_TARGET') {
        profitTargetAmount = this.resolveNumericThreshold(rule.threshold, rule.unit, startingBalance);
        profitTargetAchievedPct = evaluation.numericUtilizationPercent;
        isProfitTargetAchieved = evaluation.isPassed;
      } else if (rule.type === 'MIN_TRADING_DAYS') {
        requiredTradingDays = Number(rule.threshold) || 0;
      } else if (rule.type === 'MAX_TRADING_DAYS') {
        maxTradingDaysAllowed = Number(rule.threshold) || undefined;
      } else if (rule.type === 'CONSISTENCY_RULE') {
        maxAllowedProfitRatio = Number(rule.threshold) || 50;
      }
    }

    // 3. Consistency Calculations
    let maxSingleDayProfit = 0;
    dailyPnLMap.forEach((pnl) => {
      if (pnl > maxSingleDayProfit) {
        maxSingleDayProfit = pnl;
      }
    });

    const netProfitsPositive = totalNetProfit > 0 ? totalNetProfit : (currentProfitFromStarting > 0 ? currentProfitFromStarting : 0);
    const maxDayProfitRatioPercent = netProfitsPositive > 0 
      ? Number(((maxSingleDayProfit / netProfitsPositive) * 100).toFixed(1))
      : 0;
    const isConsistencyCompliant = maxDayProfitRatioPercent <= maxAllowedProfitRatio || netProfitsPositive === 0;

    // 4. Determine Overall Status
    let overallStatus: PropFirmOverallStatus = 'ON_TRACK';

    if (activeBreaches.length > 0) {
      overallStatus = ruleEvaluations.some(r => r.state === 'BREACHED' && r.severity === 'HARD_BREACH')
        ? 'HARD_BREACH'
        : 'SOFT_BREACH';
    } else if (activeWarnings.length > 0) {
      overallStatus = 'WARNING';
    } else if (isProfitTargetAchieved && completedTradingDays >= requiredTradingDays && isConsistencyCompliant) {
      overallStatus = 'PASSED';
    }

    // Overall progress towards target/completion
    let overallProgressPercent = 0;
    if (profitTargetAmount > 0) {
      overallProgressPercent = Math.min(100, Math.max(0, (currentProfitFromStarting / profitTargetAmount) * 100));
    } else if (isFundedStage) {
      overallProgressPercent = 100;
    }

    // 5. Scaling Plan status if funded stage
    let scalingStatus: PropFirmEvaluationResult['scalingStatus'] = undefined;
    if (phase?.scalingPlan && phase.scalingPlan.length > 0) {
      const milestones = phase.scalingPlan.map((m) => {
        const reqAmount = m.profitTargetAmount || (startingBalance * (m.profitTargetPercent / 100));
        const achieved = currentProfitFromStarting >= reqAmount;
        return {
          ...m,
          profitTargetAmount: reqAmount,
          isAchieved: achieved,
        };
      });

      const nextMilestone = milestones.find(m => !m.isAchieved) || null;
      let progressToNext = 0;
      if (nextMilestone && nextMilestone.profitTargetAmount) {
        progressToNext = Math.min(100, Math.max(0, (currentProfitFromStarting / nextMilestone.profitTargetAmount) * 100));
      }

      scalingStatus = {
        currentLevel: milestones.filter(m => m.isAchieved).length,
        milestones,
        nextMilestone,
        progressToNextPercent: Number(progressToNext.toFixed(1)),
      };
    }

    // 6. Payout Readiness status
    let payoutReadiness: PropFirmEvaluationResult['payoutReadiness'] = undefined;
    if (isFundedStage && phase?.payoutTerms) {
      const terms = phase.payoutTerms;
      const reasonsNotEligible: string[] = [];

      if (completedTradingDays < terms.minTradingDaysBeforeFirstPayout) {
        reasonsNotEligible.push(`Requires ${terms.minTradingDaysBeforeFirstPayout} active trading days (Current: ${completedTradingDays}).`);
      }
      if (currentProfitFromStarting <= terms.minProfitBufferAmount) {
        reasonsNotEligible.push(`Account profit (${currency} ${currentProfitFromStarting.toLocaleString()}) must exceed safety buffer (${currency} ${terms.minProfitBufferAmount.toLocaleString()}).`);
      }
      if (terms.consistencyCheckRequired && !isConsistencyCompliant) {
        reasonsNotEligible.push(`Consistency rule not met: single day generated ${maxDayProfitRatioPercent}% (Max allowed: ${maxAllowedProfitRatio}%).`);
      }
      if (activeBreaches.length > 0) {
        reasonsNotEligible.push('Account has active rule breach.');
      }

      const distributableProfit = Math.max(0, currentProfitFromStarting - terms.minProfitBufferAmount);
      const splitPct = phase.profitSplitPercent || terms.defaultProfitSplitPercent || 80;
      const profitShare = (distributableProfit * splitPct) / 100;
      const cappedShare = terms.maxPayoutCapAmount ? Math.min(profitShare, terms.maxPayoutCapAmount) : profitShare;

      payoutReadiness = {
        isEligible: reasonsNotEligible.length === 0 && cappedShare > 0,
        profitShareAmount: Number(cappedShare.toFixed(2)),
        reasonsNotEligible,
      };
    }

    // Calculate Remaining Drawdown Buffer
    const currentDrawdownAmount = Math.max(0, drawdownPeak - currentEquity);
    const drawdownRemainingBuffer = Math.max(0, maxDrawdownLimitAmount - currentDrawdownAmount);

    // Calculate Remaining Daily Loss Buffer
    const dailyLossRemainingBuffer = Math.max(0, dailyLossLimitAmount - todaysLossAmount);

    return {
      accountId: account.id,
      accountName: account.name,
      accountBalance: currentBalance,
      accountEquity: currentEquity,
      startingBalance,
      highWaterMark,
      currency,
      firmId: challenge?.firmId || account.propFirmId,
      firmName: account.propFirm || 'Prop Firm Account',
      challengeId: challenge?.id || account.challengeId,
      challengeName: challenge?.name || 'Custom Challenge',
      currentPhaseNumber: phaseNumber,
      phaseName,
      totalPhases: challenge?.phases?.length || 1,
      isFundedStage,
      overallStatus,
      overallProgressPercent: Number(overallProgressPercent.toFixed(1)),
      dailyLossBuffer: {
        limitAmount: dailyLossLimitAmount,
        usedAmount: todaysLossAmount,
        remainingBuffer: dailyLossRemainingBuffer,
        percentUsed: Number(dailyLossUsedPct.toFixed(1)),
        isBreached: dailyLossBreached,
        isWarning: dailyLossWarning,
      },
      drawdownBuffer: {
        limitAmount: maxDrawdownLimitAmount,
        usedAmount: currentDrawdownAmount,
        remainingBuffer: drawdownRemainingBuffer,
        percentUsed: Number(maxDrawdownUsedPct.toFixed(1)),
        trailingPeak: drawdownPeak,
        isBreached: maxDrawdownBreached,
        isWarning: maxDrawdownWarning,
        drawdownType,
      },
      profitTargetProgress: {
        targetAmount: profitTargetAmount,
        currentProfit: currentProfitFromStarting,
        remainingAmount: Math.max(0, profitTargetAmount - currentProfitFromStarting),
        percentAchieved: Number(profitTargetAchievedPct.toFixed(1)),
        isAchieved: isProfitTargetAchieved,
      },
      tradingDaysProgress: {
        requiredDays: requiredTradingDays,
        maxDaysAllowed: maxTradingDaysAllowed,
        completedDays: completedTradingDays,
        remainingDays: Math.max(0, requiredTradingDays - completedTradingDays),
        isMinDaysMet: completedTradingDays >= requiredTradingDays,
        isMaxDaysBreached: maxTradingDaysAllowed ? (completedTradingDays > maxTradingDaysAllowed && !isProfitTargetAchieved) : false,
      },
      consistencyMetrics: {
        maxSingleDayProfit,
        totalNetProfit: netProfitsPositive,
        maxDayProfitRatioPercent,
        maxAllowedRatioPercent: maxAllowedProfitRatio,
        isCompliant: isConsistencyCompliant,
      },
      ruleEvaluations,
      activeBreaches,
      activeWarnings,
      scalingStatus,
      payoutReadiness,
    };
  }

  /**
   * Evaluates a single specific rule deterministically
   */
  private static evaluateSingleRule(ctx: {
    rule: PropFirmRule;
    account: Account;
    startingBalance: number;
    currentBalance: number;
    currentEquity: number;
    highWaterMark: number;
    closedTrades: Trade[];
    openTrades: Trade[];
    dailyPnLMap: Map<string, number>;
    completedTradingDays: number;
    todaysLossAmount: number;
    totalNetProfit: number;
    currentProfitFromStarting: number;
  }): RuleEvaluationDetail {
    const {
      rule,
      startingBalance,
      currentEquity,
      highWaterMark,
      dailyPnLMap,
      completedTradingDays,
      todaysLossAmount,
      currentProfitFromStarting,
      openTrades,
    } = ctx;

    const limitAmount = this.resolveNumericThreshold(rule.threshold, rule.unit, startingBalance);
    const currency = ctx.account.currency || 'USD';

    switch (rule.type) {
      case 'PROFIT_TARGET': {
        const achievedPct = limitAmount > 0 ? (currentProfitFromStarting / limitAmount) * 100 : 0;
        const isPassed = currentProfitFromStarting >= limitAmount;
        let state: RuleEvaluationState = isPassed ? 'ACHIEVED' : 'HEALTHY';
        if (!isPassed && achievedPct >= rule.warningThreshold) {
          state = 'ACHIEVED';
        }

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `${currency} ${limitAmount.toLocaleString()} (${rule.threshold}${rule.unit === 'PERCENT_BALANCE' ? '%' : ''})`,
          currentValueDisplay: `${currency} ${currentProfitFromStarting.toLocaleString()} (${achievedPct.toFixed(1)}%)`,
          numericUtilizationPercent: Number(achievedPct.toFixed(1)),
          state,
          message: isPassed
            ? `Profit target of ${currency} ${limitAmount.toLocaleString()} reached!`
            : `${currency} ${Math.max(0, limitAmount - currentProfitFromStarting).toLocaleString()} remaining to target.`,
          isPassed,
        };
      }

      case 'DAILY_LOSS': {
        const lossPercent = limitAmount > 0 ? (todaysLossAmount / limitAmount) * 100 : 0;
        const isBreached = todaysLossAmount >= (limitAmount * (rule.violationThreshold / 100));
        const isWarning = !isBreached && lossPercent >= rule.warningThreshold;

        const state: RuleEvaluationState = isBreached ? 'BREACHED' : isWarning ? 'WARNING' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `${currency} ${limitAmount.toLocaleString()} (${rule.threshold}${rule.unit === 'PERCENT_BALANCE' ? '%' : ''})`,
          currentValueDisplay: `${currency} ${todaysLossAmount.toLocaleString()} (${lossPercent.toFixed(1)}% of limit)`,
          numericUtilizationPercent: Number(lossPercent.toFixed(1)),
          state,
          message: isBreached
            ? `Daily loss limit of ${currency} ${limitAmount.toLocaleString()} breached (-${currency} ${todaysLossAmount.toLocaleString()})!`
            : isWarning
            ? `Daily loss warning: ${lossPercent.toFixed(1)}% of daily limit consumed.`
            : `${currency} ${(limitAmount - todaysLossAmount).toLocaleString()} daily risk buffer remaining.`,
          isPassed: !isBreached,
        };
      }

      case 'MAX_DRAWDOWN':
      case 'TRAILING_DRAWDOWN': {
        const isTrailing = rule.calculationMethod === 'TRAILING_HIGH_WATER_MARK' || rule.calculationMethod === 'TRAILING_EOD' || rule.type === 'TRAILING_DRAWDOWN';
        const peak = isTrailing ? highWaterMark : startingBalance;
        const currentDrawdown = Math.max(0, peak - currentEquity);
        const drawdownPct = limitAmount > 0 ? (currentDrawdown / limitAmount) * 100 : 0;

        const isBreached = currentDrawdown >= (limitAmount * (rule.violationThreshold / 100));
        const isWarning = !isBreached && drawdownPct >= rule.warningThreshold;
        const state: RuleEvaluationState = isBreached ? 'BREACHED' : isWarning ? 'WARNING' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `${currency} ${limitAmount.toLocaleString()} (${isTrailing ? 'Trailing' : 'Static'})`,
          currentValueDisplay: `${currency} ${currentDrawdown.toLocaleString()} from Peak ${currency} ${peak.toLocaleString()} (${drawdownPct.toFixed(1)}%)`,
          numericUtilizationPercent: Number(drawdownPct.toFixed(1)),
          state,
          message: isBreached
            ? `Maximum loss threshold of ${currency} ${limitAmount.toLocaleString()} breached!`
            : isWarning
            ? `Elevated drawdown warning: ${drawdownPct.toFixed(1)}% of loss limit used.`
            : `${currency} ${(limitAmount - currentDrawdown).toLocaleString()} drawdown buffer safe.`,
          isPassed: !isBreached,
        };
      }

      case 'MIN_TRADING_DAYS': {
        const requiredDays = Number(rule.threshold) || 1;
        const isPassed = completedTradingDays >= requiredDays;
        const daysPct = (completedTradingDays / requiredDays) * 100;
        const state: RuleEvaluationState = isPassed ? 'ACHIEVED' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `${requiredDays} Days`,
          currentValueDisplay: `${completedTradingDays} Completed Days`,
          numericUtilizationPercent: Number(Math.min(100, daysPct).toFixed(1)),
          state,
          message: isPassed
            ? `Minimum trading days requirement (${requiredDays} days) satisfied.`
            : `${requiredDays - completedTradingDays} trading days remaining.`,
          isPassed,
        };
      }

      case 'MAX_TRADING_DAYS': {
        const maxDays = Number(rule.threshold) || 30;
        const isBreached = completedTradingDays > maxDays && currentProfitFromStarting < (startingBalance * 0.1);
        const daysPct = (completedTradingDays / maxDays) * 100;
        const state: RuleEvaluationState = isBreached ? 'BREACHED' : daysPct >= rule.warningThreshold ? 'WARNING' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `${maxDays} Days Maximum`,
          currentValueDisplay: `${completedTradingDays} Days Logged`,
          numericUtilizationPercent: Number(daysPct.toFixed(1)),
          state,
          message: isBreached
            ? `Maximum challenge duration of ${maxDays} days exceeded.`
            : `${Math.max(0, maxDays - completedTradingDays)} days remaining before deadline.`,
          isPassed: !isBreached,
        };
      }

      case 'CONSISTENCY_RULE': {
        let maxSingleDay = 0;
        let positiveDaysSum = 0;
        dailyPnLMap.forEach((pnl) => {
          if (pnl > 0) {
            positiveDaysSum += pnl;
            if (pnl > maxSingleDay) maxSingleDay = pnl;
          }
        });

        const maxAllowedRatio = Number(rule.threshold) || 50;
        const ratioPct = positiveDaysSum > 0 ? (maxSingleDay / positiveDaysSum) * 100 : 0;
        const isBreached = positiveDaysSum > 0 && ratioPct > maxAllowedRatio;
        const isWarning = !isBreached && ratioPct >= (maxAllowedRatio * 0.8);
        const state: RuleEvaluationState = isBreached ? 'WARNING' : isWarning ? 'WARNING' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `Max ${maxAllowedRatio}% of Total Profit in 1 Day`,
          currentValueDisplay: `Best Day: ${ratioPct.toFixed(1)}% (${currency} ${maxSingleDay.toLocaleString()})`,
          numericUtilizationPercent: Number(ratioPct.toFixed(1)),
          state,
          message: isBreached
            ? `Single day generated ${ratioPct.toFixed(1)}% of profit (Cap is ${maxAllowedRatio}%). Additional profit needed to balance consistency.`
            : `Consistency ratio within safe bounds (${ratioPct.toFixed(1)}% / ${maxAllowedRatio}%).`,
          isPassed: !isBreached,
        };
      }

      case 'POSITION_SIZE_RESTRICTION': {
        const maxContracts = Number(rule.threshold) || 10;
        const currentOpenContracts = openTrades.reduce((sum, t) => sum + (t.quantity || 0), 0);
        const contractPct = (currentOpenContracts / maxContracts) * 100;
        const isBreached = currentOpenContracts > maxContracts;
        const isWarning = !isBreached && contractPct >= rule.warningThreshold;
        const state: RuleEvaluationState = isBreached ? 'BREACHED' : isWarning ? 'WARNING' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: `Max ${maxContracts} ${rule.unit}`,
          currentValueDisplay: `${currentOpenContracts} Active ${rule.unit}`,
          numericUtilizationPercent: Number(contractPct.toFixed(1)),
          state,
          message: isBreached
            ? `Position size limit exceeded: ${currentOpenContracts} contracts active (Max: ${maxContracts}).`
            : `${maxContracts - currentOpenContracts} contracts remaining capacity.`,
          isPassed: !isBreached,
        };
      }

      case 'RISK_RESTRICTION': {
        const openWithoutSL = openTrades.filter(t => !t.stopLossPrice);
        const isBreached = openWithoutSL.length > 0;
        const state: RuleEvaluationState = isBreached ? 'BREACHED' : 'HEALTHY';

        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: 'Hard Stop Loss Mandatory',
          currentValueDisplay: openWithoutSL.length === 0 ? 'All Positions Protected' : `${openWithoutSL.length} Unprotected`,
          numericUtilizationPercent: openWithoutSL.length > 0 ? 100 : 0,
          state,
          message: isBreached
            ? `${openWithoutSL.length} active trade(s) missing mandatory stop loss!`
            : 'All active executions have verified stop losses.',
          isPassed: !isBreached,
        };
      }

      case 'OVERNIGHT_RESTRICTION':
      case 'WEEKEND_RESTRICTION':
      case 'NEWS_RESTRICTION':
      case 'SCALING_RULE':
      case 'PAYOUT_RULE':
      case 'CUSTOM_RESTRICTION':
      default: {
        return {
          ruleId: rule.id,
          ruleName: rule.name,
          ruleType: rule.type,
          category: rule.category,
          severity: rule.severity,
          limitDisplay: String(rule.threshold),
          currentValueDisplay: 'Compliant',
          numericUtilizationPercent: 0,
          state: 'HEALTHY',
          message: rule.description || 'Active compliance condition satisfied.',
          isPassed: true,
        };
      }
    }
  }

  /**
   * Resolves numeric limit based on threshold and unit (% of balance vs static currency)
   */
  private static resolveNumericThreshold(threshold: number | boolean | string, unit: string, baseCapital: number): number {
    const num = typeof threshold === 'number' ? threshold : parseFloat(String(threshold)) || 0;
    if (unit === 'PERCENT_BALANCE' || unit === 'PERCENT_EQUITY') {
      return (baseCapital * num) / 100;
    }
    return num;
  }

  /**
   * Multi-Account Prop-Firm Comparison Aggregator
   */
  static compareMultiAccounts(
    accounts: Account[],
    tradesMap: Map<string, Trade[]>,
    ruleSetsMap: Map<string, RuleSet>,
    challengesMap: Map<string, Challenge>
  ): MultiAccountPropComparison {
    const propAccounts = accounts.filter(a => 
      a.accountType?.startsWith('PROP') || 
      a.accountType === 'PERSONAL_LIVE' || 
      a.propFirm || 
      a.ruleSetId
    );

    const evaluations: PropFirmEvaluationResult[] = [];
    let totalFunded = 0;
    let totalEval = 0;
    let passedCount = 0;
    let onTrackCount = 0;
    let warningCount = 0;
    let breachedCount = 0;

    for (const acc of propAccounts) {
      const accTrades = tradesMap.get(acc.id) || [];
      const ruleSet = (acc.ruleSetId ? ruleSetsMap.get(acc.ruleSetId) : null) ||
        Array.from(ruleSetsMap.values())[0];
      const challenge = acc.challengeId ? challengesMap.get(acc.challengeId) : null;

      if (ruleSet) {
        const evalResult = this.evaluateAccount(acc, accTrades, ruleSet, challenge, acc.challengePhase || 1);
        evaluations.push(evalResult);

        if (acc.accountType === 'PROP_FUNDED') {
          totalFunded += acc.startingBalance || 0;
        } else {
          totalEval += acc.startingBalance || 0;
        }

        if (evalResult.overallStatus === 'PASSED') passedCount++;
        else if (evalResult.overallStatus === 'ON_TRACK') onTrackCount++;
        else if (evalResult.overallStatus === 'WARNING') warningCount++;
        else if (evalResult.overallStatus === 'HARD_BREACH' || evalResult.overallStatus === 'SOFT_BREACH') breachedCount++;
      }
    }

    return {
      accountsCount: propAccounts.length,
      totalFundedCapital: totalFunded,
      totalEvaluationCapital: totalEval,
      passedCount,
      onTrackCount,
      warningCount,
      breachedCount,
      evaluations,
    };
  }

  /**
   * Helper utility for computing static vs trailing drawdown thresholds and remaining safety buffers
   */
  static calculateDrawdownMetric(
    startingBalance: number,
    currentEquity: number,
    highWaterMark: number,
    thresholdValue: number,
    unit: 'CURRENCY' | 'PERCENT_BALANCE',
    method: 'STATIC_BALANCE' | 'TRAILING_HIGH_WATER_MARK' | 'TRAILING_EOD'
  ): {
    thresholdFloor: number;
    currentDrawdown: number;
    remainingBuffer: number;
    drawdownLimitAmount: number;
    isBreached: boolean;
  } {
    const drawdownLimitAmount = unit === 'PERCENT_BALANCE'
      ? (startingBalance * (thresholdValue / 100))
      : thresholdValue;

    const isTrailing = method === 'TRAILING_HIGH_WATER_MARK' || method === 'TRAILING_EOD';
    const peak = isTrailing ? Math.max(highWaterMark, startingBalance, currentEquity) : startingBalance;
    const thresholdFloor = peak - drawdownLimitAmount;
    const currentDrawdown = Math.max(0, peak - currentEquity);
    const remainingBuffer = Math.max(0, currentEquity - thresholdFloor);
    const isBreached = currentEquity <= thresholdFloor;

    return {
      thresholdFloor,
      currentDrawdown,
      remainingBuffer,
      drawdownLimitAmount,
      isBreached,
    };
  }
}
