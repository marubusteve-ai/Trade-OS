/**
 * Centralized Financial & Quantitative Calculation Engine
 * 
 * Single Source of Truth for all TradeOS financial metrics, risk ratios, 
 * performance statistics, and Prop Firm compliance calculations.
 */

import { Account, Trade } from '../types/domain';
import { 
  FinancialMetrics, 
  DrawdownStats, 
  DailyPnLEntry, 
  EquityPoint, 
  PropFirmComplianceStatus, 
  AccountPerformanceSummary 
} from '../types/calculations';
import { 
  RiskPolicy, 
  RiskBudgets, 
  ExposureMetrics, 
  PositionSizeParams, 
  PositionSizeResult, 
  StopLossParams, 
  StopLossResult, 
  RewardRiskParams, 
  RewardRiskResult, 
  MarginLeverageParams, 
  MarginLeverageResult, 
  RiskPolicyEvaluation 
} from '../types/risk';
import { RiskEngine } from './riskEngine';

export class CalculationEngine {
  // Deterministic LRU calculation cache
  private static metricsCache = new Map<string, { timestamp: number; metrics: FinancialMetrics }>();
  private static readonly METRICS_CACHE_MAX = 50;

  /**
   * Generates a stable cache key from trade array and balance
   */
  private static getCacheKey(trades: Trade[], startingBalance: number): string {
    const closedCount = trades.filter((t) => t.status === 'CLOSED').length;
    const lastTrade = trades[trades.length - 1];
    const lastId = lastTrade ? lastTrade.id : 'empty';
    const lastDate = lastTrade ? lastTrade.updatedAt || lastTrade.exitDate || lastTrade.entryDate : '0';
    return `m_${trades.length}_${closedCount}_${startingBalance}_${lastId}_${lastDate}`;
  }

  /**
   * Calculates gross PnL for a single trade
   */
  static calculateGrossPnL(
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    exitPrice: number,
    quantity: number,
    contractMultiplier: number = 1
  ): number {
    if (!exitPrice || !entryPrice || !quantity) return 0;
    const priceDiff = direction === 'LONG' ? exitPrice - entryPrice : entryPrice - exitPrice;
    return Number((priceDiff * quantity * contractMultiplier).toFixed(2));
  }

  /**
   * Calculates net PnL subtracting all commissions, swaps, spread, slippage, and fees
   */
  static calculateNetPnL(
    grossPnL: number,
    commission: number = 0,
    swap: number = 0,
    spreadCost: number = 0,
    fees: number = 0,
    slippage: number = 0
  ): number {
    const totalCosts = (commission || 0) + (swap || 0) + (spreadCost || 0) + (fees || 0) + (slippage || 0);
    return Number((grossPnL - totalCosts).toFixed(2));
  }

  /**
   * Calculates PnL percentage relative to account balance / equity baseline
   */
  static calculatePnLPercentage(netPnL: number, accountCapital: number): number {
    if (!accountCapital || accountCapital <= 0) return 0;
    return Number(((netPnL / accountCapital) * 100).toFixed(2));
  }

  /**
   * Calculates planned risk percentage relative to account balance / equity baseline
   */
  static calculateRiskPercentage(plannedRiskAmount: number, accountCapital: number): number {
    if (!accountCapital || accountCapital <= 0 || !plannedRiskAmount) return 0;
    return Number(((plannedRiskAmount / accountCapital) * 100).toFixed(2));
  }

  /**
   * Calculates trade holding duration in seconds and produces a human-readable format
   */
  static calculateHoldingDuration(
    entryDate: string,
    exitDate?: string
  ): { seconds: number; formatted: string } {
    if (!entryDate) return { seconds: 0, formatted: '0s' };
    const startMs = new Date(entryDate).getTime();
    if (isNaN(startMs)) return { seconds: 0, formatted: '0s' };

    const endMs = exitDate ? new Date(exitDate).getTime() : Date.now();
    if (isNaN(endMs) || endMs < startMs) return { seconds: 0, formatted: '0s' };

    const diffSeconds = Math.floor((endMs - startMs) / 1000);
    
    if (diffSeconds < 60) {
      return { seconds: diffSeconds, formatted: `${diffSeconds}s` };
    }
    
    const minutes = Math.floor(diffSeconds / 60);
    if (minutes < 60) {
      const remSecs = diffSeconds % 60;
      return { 
        seconds: diffSeconds, 
        formatted: remSecs > 0 ? `${minutes}m ${remSecs}s` : `${minutes}m` 
      };
    }
    
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    if (hours < 24) {
      return { 
        seconds: diffSeconds, 
        formatted: remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h` 
      };
    }
    
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return { 
      seconds: diffSeconds, 
      formatted: remHours > 0 ? `${days}d ${remHours}h` : `${days}d` 
    };
  }

  /**
   * Determines trade outcome state based on realized net PnL and trade status
   */
  static determineTradeOutcome(
    netPnL: number,
    status: 'OPEN' | 'CLOSED' | 'PENDING' | 'CANCELLED' = 'CLOSED'
  ): 'WIN' | 'LOSS' | 'BREAKEVEN' | 'OPEN' {
    if (status === 'OPEN' || status === 'PENDING') return 'OPEN';
    if (Math.abs(netPnL) <= 0.01) return 'BREAKEVEN';
    return netPnL > 0 ? 'WIN' : 'LOSS';
  }

  /**
   * Consolidated single-trade financial calculator
   * Computes all quantitative outputs deterministically
   */
  static calculateTradeFinancials(
    tradeInput: Partial<Trade>,
    accountCapital: number = 100000
  ) {
    const direction = tradeInput.direction || 'LONG';
    const entryPrice = Number(tradeInput.entryPrice) || 0;
    const exitPrice = tradeInput.exitPrice !== undefined && tradeInput.exitPrice !== null && !isNaN(Number(tradeInput.exitPrice))
      ? Number(tradeInput.exitPrice)
      : entryPrice;
    const quantity = Number(tradeInput.quantity) || 0;
    const multiplier = Number(tradeInput.contractMultiplier) || 1;
    const stopLoss = Number(tradeInput.stopLossPrice) || 0;
    const takeProfit = Number(tradeInput.takeProfitPrice) || 0;

    const commission = Number(tradeInput.commission) || 0;
    const swap = Number(tradeInput.swap) || 0;
    const spreadCost = Number(tradeInput.spreadCost) || 0;
    const fees = Number(tradeInput.fees) || 0;
    const slippage = Number(tradeInput.slippage) || 0;

    const grossPnL = this.calculateGrossPnL(direction, entryPrice, exitPrice, quantity, multiplier);
    const netPnL = this.calculateNetPnL(grossPnL, commission, swap, spreadCost, fees, slippage);
    const pnlPercentage = this.calculatePnLPercentage(netPnL, accountCapital);

    const plannedRiskAmount = this.calculatePlannedRisk(direction, entryPrice, stopLoss, quantity, multiplier);
    const plannedRiskPercent = this.calculateRiskPercentage(plannedRiskAmount, accountCapital);
    const plannedRRRatio = this.calculatePlannedRR(direction, entryPrice, stopLoss || undefined, takeProfit || undefined);
    const achievedRMultiple = this.calculateAchievedR(netPnL, plannedRiskAmount);

    const duration = this.calculateHoldingDuration(tradeInput.entryDate || new Date().toISOString(), tradeInput.exitDate);
    const outcome = this.determineTradeOutcome(netPnL, tradeInput.status || 'CLOSED');

    return {
      grossPnL,
      netPnL,
      pnlPercentage,
      plannedRiskAmount,
      plannedRiskPercent,
      plannedRRRatio,
      achievedRMultiple,
      holdingTimeSeconds: duration.seconds,
      holdingTimeFormatted: duration.formatted,
      outcome,
    };
  }

  /**
   * Calculates planned risk amount based on entry price and stop loss
   */
  static calculatePlannedRisk(
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    stopLossPrice: number,
    quantity: number,
    contractMultiplier: number = 1
  ): number {
    if (!entryPrice || !stopLossPrice || !quantity) return 0;
    const riskDistance = direction === 'LONG' ? entryPrice - stopLossPrice : stopLossPrice - entryPrice;
    return Math.max(0, Number((riskDistance * quantity * contractMultiplier).toFixed(2)));
  }

  /**
   * Calculates Planned Risk-to-Reward ratio
   */
  static calculatePlannedRR(
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    stopLossPrice?: number,
    takeProfitPrice?: number
  ): number | undefined {
    if (!entryPrice || !stopLossPrice || !takeProfitPrice) return undefined;
    const risk = direction === 'LONG' ? entryPrice - stopLossPrice : stopLossPrice - entryPrice;
    const reward = direction === 'LONG' ? takeProfitPrice - entryPrice : entryPrice - takeProfitPrice;
    if (risk <= 0 || reward <= 0) return undefined;
    return Number((reward / risk).toFixed(2));
  }

  /**
   * Calculates Achieved R-Multiple (Net PnL / Planned Risk)
   */
  static calculateAchievedR(netPnL: number, plannedRiskAmount: number): number | undefined {
    if (!plannedRiskAmount || plannedRiskAmount <= 0) return undefined;
    return Number((netPnL / plannedRiskAmount).toFixed(2));
  }

  /**
   * Calculates position size / quantity for a given risk amount
   */
  static calculatePositionSize(
    direction: 'LONG' | 'SHORT',
    entryPrice: number,
    stopLossPrice: number,
    riskAmount: number,
    contractMultiplier: number = 1
  ): number {
    if (!entryPrice || !stopLossPrice || !riskAmount) return 0;
    const distance = Math.abs(entryPrice - stopLossPrice);
    if (distance === 0) return 0;
    const size = riskAmount / (distance * contractMultiplier);
    return Number(size.toFixed(2));
  }

  /**
   * Aggregates comprehensive quantitative metrics from a list of trades
   */
  static calculateMetrics(trades: Trade[], startingBalance: number = 100000): FinancialMetrics {
    const cacheKey = this.getCacheKey(trades, startingBalance);
    const cached = this.metricsCache.get(cacheKey);
    if (cached) {
      return cached.metrics;
    }

    const closedTrades = trades.filter(t => t.status === 'CLOSED');
    const openTrades = trades.filter(t => t.status === 'OPEN');
    
    if (closedTrades.length === 0) {
      return {
        totalTrades: trades.length,
        openTradesCount: openTrades.length,
        winningTradesCount: 0,
        losingTradesCount: 0,
        breakEvenTradesCount: 0,
        grossProfit: 0,
        grossLoss: 0,
        netPnL: 0,
        netReturnPercent: 0,
        totalCommissions: 0,
        totalSwaps: 0,
        totalFees: 0,
        winRate: 0,
        lossRate: 0,
        profitFactor: 0,
        payoffRatio: 0,
        expectancy: 0,
        expectancyRMultiple: 0,
        averageWin: 0,
        averageLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        totalAchievedR: 0,
        averageAchievedR: 0,
        maxAchievedR: 0,
        avgPlannedRiskAmount: 0,
        maxConsecutiveWins: 0,
        maxConsecutiveLosses: 0,
        currentStreak: { type: 'NONE', count: 0 },
        avgHoldingTimeMinutes: 0,
        avgWinHoldingTimeMinutes: 0,
        avgLossHoldingTimeMinutes: 0,
      };
    }

    let winningTradesCount = 0;
    let losingTradesCount = 0;
    let breakEvenTradesCount = 0;
    
    let grossProfit = 0;
    let grossLoss = 0;
    let totalNetPnL = 0;
    let totalCommissions = 0;
    let totalSwaps = 0;
    let totalFees = 0;
    
    let largestWin = 0;
    let largestLoss = 0;
    
    let totalAchievedR = 0;
    let achievedRCount = 0;
    let maxAchievedR = 0;
    let totalPlannedRisk = 0;
    
    let totalHoldingSeconds = 0;
    let winHoldingSeconds = 0;
    let lossHoldingSeconds = 0;
    
    // Streaks tracking (trades sorted chronologically)
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );
    
    let maxConsecWins = 0;
    let maxConsecLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    for (const trade of sortedTrades) {
      const pnl = trade.netPnL;
      totalNetPnL += pnl;
      totalCommissions += trade.commission || 0;
      totalSwaps += trade.swap || 0;
      totalFees += (trade.fees || 0) + (trade.spreadCost || 0);
      
      if (trade.plannedRiskAmount) {
        totalPlannedRisk += trade.plannedRiskAmount;
      }
      
      if (trade.achievedRMultiple !== undefined) {
        totalAchievedR += trade.achievedRMultiple;
        achievedRCount++;
        if (trade.achievedRMultiple > maxAchievedR) {
          maxAchievedR = trade.achievedRMultiple;
        }
      }

      if (trade.holdingTimeSeconds) {
        totalHoldingSeconds += trade.holdingTimeSeconds;
      }

      if (pnl > 0.001) {
        winningTradesCount++;
        grossProfit += pnl;
        if (pnl > largestWin) largestWin = pnl;
        
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxConsecWins) maxConsecWins = currentWinStreak;
        
        if (trade.holdingTimeSeconds) winHoldingSeconds += trade.holdingTimeSeconds;
      } else if (pnl < -0.001) {
        losingTradesCount++;
        grossLoss += Math.abs(pnl);
        if (pnl < largestLoss) largestLoss = pnl;
        
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxConsecLosses) maxConsecLosses = currentLossStreak;
        
        if (trade.holdingTimeSeconds) lossHoldingSeconds += trade.holdingTimeSeconds;
      } else {
        breakEvenTradesCount++;
        currentWinStreak = 0;
        currentLossStreak = 0;
      }
    }

    const totalDecisiveTrades = winningTradesCount + losingTradesCount;
    const winRate = totalDecisiveTrades > 0 ? (winningTradesCount / totalDecisiveTrades) * 100 : 0;
    const lossRate = totalDecisiveTrades > 0 ? (losingTradesCount / totalDecisiveTrades) * 100 : 0;
    
    const averageWin = winningTradesCount > 0 ? grossProfit / winningTradesCount : 0;
    const averageLoss = losingTradesCount > 0 ? grossLoss / losingTradesCount : 0;
    
    const profitFactor = grossLoss > 0 
      ? Number((grossProfit / grossLoss).toFixed(2)) 
      : (grossProfit > 0 ? 99.99 : 0);
      
    const payoffRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : 0;
    
    // Expectancy: (Win% * AvgWin) - (Loss% * AvgLoss)
    const winProb = winRate / 100;
    const lossProb = lossRate / 100;
    const expectancy = Number((winProb * averageWin - lossProb * averageLoss).toFixed(2));
    
    const averageAchievedR = achievedRCount > 0 ? Number((totalAchievedR / achievedRCount).toFixed(2)) : 0;
    const expectancyRMultiple = totalPlannedRisk > 0 && achievedRCount > 0
      ? Number(((winProb * (averageWin / (totalPlannedRisk / closedTrades.length))) - (lossProb * 1)).toFixed(2))
      : 0;

    const netReturnPercent = startingBalance > 0 ? Number(((totalNetPnL / startingBalance) * 100).toFixed(2)) : 0;

    let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
    let currentStreakCount = 0;
    if (currentWinStreak > 0) {
      currentStreakType = 'WIN';
      currentStreakCount = currentWinStreak;
    } else if (currentLossStreak > 0) {
      currentStreakType = 'LOSS';
      currentStreakCount = currentLossStreak;
    }

    const metrics: FinancialMetrics = {
      totalTrades: trades.length,
      openTradesCount: openTrades.length,
      winningTradesCount,
      losingTradesCount,
      breakEvenTradesCount,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      netPnL: Number(totalNetPnL.toFixed(2)),
      netReturnPercent,
      totalCommissions: Number(totalCommissions.toFixed(2)),
      totalSwaps: Number(totalSwaps.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      lossRate: Number(lossRate.toFixed(1)),
      profitFactor,
      payoffRatio,
      expectancy,
      expectancyRMultiple,
      averageWin: Number(averageWin.toFixed(2)),
      averageLoss: Number(averageLoss.toFixed(2)),
      largestWin: Number(largestWin.toFixed(2)),
      largestLoss: Number(largestLoss.toFixed(2)),
      totalAchievedR: Number(totalAchievedR.toFixed(2)),
      averageAchievedR,
      maxAchievedR: Number(maxAchievedR.toFixed(2)),
      avgPlannedRiskAmount: closedTrades.length > 0 ? Number((totalPlannedRisk / closedTrades.length).toFixed(2)) : 0,
      maxConsecutiveWins: maxConsecWins,
      maxConsecutiveLosses: maxConsecLosses,
      currentStreak: { type: currentStreakType, count: currentStreakCount },
      avgHoldingTimeMinutes: closedTrades.length > 0 ? Math.round((totalHoldingSeconds / closedTrades.length) / 60) : 0,
      avgWinHoldingTimeMinutes: winningTradesCount > 0 ? Math.round((winHoldingSeconds / winningTradesCount) / 60) : 0,
      avgLossHoldingTimeMinutes: losingTradesCount > 0 ? Math.round((lossHoldingSeconds / losingTradesCount) / 60) : 0,
    };

    // Store in cache (capped to avoid memory leaks)
    if (this.metricsCache.size > this.METRICS_CACHE_MAX) {
      const firstKey = this.metricsCache.keys().next().value;
      if (firstKey) this.metricsCache.delete(firstKey);
    }
    this.metricsCache.set(cacheKey, { timestamp: Date.now(), metrics });

    return metrics;
  }

  /**
   * Computes high-water mark, maximum drawdown, and current drawdown metrics
   */
  static calculateDrawdown(trades: Trade[], startingBalance: number): DrawdownStats {
    let peakBalance = startingBalance;
    let runningBalance = startingBalance;
    let maxDrawdownAmount = 0;
    let maxDrawdownPercent = 0;

    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    for (const trade of sortedTrades) {
      runningBalance += trade.netPnL;
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
      
      const currentDDAmount = peakBalance - runningBalance;
      const currentDDPercent = peakBalance > 0 ? (currentDDAmount / peakBalance) * 100 : 0;
      
      if (currentDDAmount > maxDrawdownAmount) {
        maxDrawdownAmount = currentDDAmount;
      }
      if (currentDDPercent > maxDrawdownPercent) {
        maxDrawdownPercent = currentDDPercent;
      }
    }

    const currentDrawdownAmount = Math.max(0, peakBalance - runningBalance);
    const currentDrawdownPercent = peakBalance > 0 ? (currentDrawdownAmount / peakBalance) * 100 : 0;

    return {
      startingBalance,
      peakBalance: Number(peakBalance.toFixed(2)),
      currentBalance: Number(runningBalance.toFixed(2)),
      equity: Number(runningBalance.toFixed(2)), // In future: runningBalance + sum(open trade unrealized PnL)
      maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      currentDrawdownAmount: Number(currentDrawdownAmount.toFixed(2)),
      currentDrawdownPercent: Number(currentDrawdownPercent.toFixed(2)),
      highWaterMark: Number(peakBalance.toFixed(2)),
      isAtAllTimeHigh: runningBalance >= peakBalance,
    };
  }

  /**
   * Generates step-by-step equity curve points for charting
   */
  static generateEquityCurve(trades: Trade[], startingBalance: number): EquityPoint[] {
    const points: EquityPoint[] = [
      {
        index: 0,
        date: 'Start',
        balance: startingBalance,
        equity: startingBalance,
        pnl: 0,
        cumulativePnL: 0,
        drawdownPercent: 0,
        highWaterMark: startingBalance,
      }
    ];

    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    let runningBalance = startingBalance;
    let cumulativePnL = 0;
    let peakBalance = startingBalance;

    sortedTrades.forEach((trade, idx) => {
      runningBalance += trade.netPnL;
      cumulativePnL += trade.netPnL;
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }
      
      const ddPercent = peakBalance > 0 ? ((peakBalance - runningBalance) / peakBalance) * 100 : 0;

      points.push({
        index: idx + 1,
        date: trade.exitDate || trade.entryDate,
        tradeId: trade.id,
        instrument: trade.instrument,
        balance: Number(runningBalance.toFixed(2)),
        equity: Number(runningBalance.toFixed(2)),
        pnl: trade.netPnL,
        cumulativePnL: Number(cumulativePnL.toFixed(2)),
        drawdownPercent: Number(ddPercent.toFixed(2)),
        highWaterMark: Number(peakBalance.toFixed(2)),
      });
    });

    return points;
  }

  /**
   * Downsamples large equity curve datasets using Largest-Triangle-Three-Buckets (LTTB)
   * or equidistant bucket sampling for high-frequency chart performance.
   */
  static downsampleEquityPoints(points: EquityPoint[], threshold: number = 200): EquityPoint[] {
    if (!points || points.length <= threshold || threshold <= 2) {
      return points;
    }

    const sampled: EquityPoint[] = [];
    sampled.push(points[0]); // Always include start

    const bucketSize = (points.length - 2) / (threshold - 2);

    for (let i = 0; i < threshold - 2; i++) {
      const startIdx = Math.floor((i + 1) * bucketSize);
      const endIdx = Math.min(Math.floor((i + 2) * bucketSize), points.length - 1);
      
      // Select the point with maximum excursion (peak or trough) in this bucket
      let maxPoint = points[startIdx];
      let maxDeviation = 0;

      for (let j = startIdx; j < endIdx; j++) {
        const pt = points[j];
        const dev = Math.abs(pt.drawdownPercent);
        if (dev > maxDeviation) {
          maxDeviation = dev;
          maxPoint = pt;
        }
      }

      if (maxPoint && maxPoint.index !== sampled[sampled.length - 1].index) {
        sampled.push(maxPoint);
      }
    }

    sampled.push(points[points.length - 1]); // Always include finish
    return sampled;
  }

  /**
   * Reconciles trade ledger sum against account balance
   */
  static reconcileLedgerBalance(
    initialBalance: number,
    trades: Trade[],
    targetBalance: number
  ): { reconciled: boolean; ledgerSum: number; expectedBalance: number; discrepancy: number } {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const ledgerSum = Number(closedTrades.reduce((acc, t) => acc + t.netPnL, 0).toFixed(2));
    const expectedBalance = Number((initialBalance + ledgerSum).toFixed(2));
    const discrepancy = Number((targetBalance - expectedBalance).toFixed(2));

    return {
      reconciled: Math.abs(discrepancy) < 0.01,
      ledgerSum,
      expectedBalance,
      discrepancy,
    };
  }

  /**
   * Groups closed trades by calendar day for daily PnL breakdown
   */
  static generateDailyPnL(trades: Trade[], startingBalance: number): DailyPnLEntry[] {
    const dailyMap = new Map<string, { pnl: number; count: number; wins: number; losses: number }>();
    
    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    for (const trade of sortedTrades) {
      const dateKey = (trade.exitDate || trade.entryDate).split('T')[0];
      const existing = dailyMap.get(dateKey) || { pnl: 0, count: 0, wins: 0, losses: 0 };
      existing.pnl += trade.netPnL;
      existing.count++;
      if (trade.netPnL > 0) existing.wins++;
      if (trade.netPnL < 0) existing.losses++;
      dailyMap.set(dateKey, existing);
    }

    const result: DailyPnLEntry[] = [];
    let runningBalance = startingBalance;

    Array.from(dailyMap.entries()).sort().forEach(([date, data]) => {
      runningBalance += data.pnl;
      result.push({
        date,
        netPnL: Number(data.pnl.toFixed(2)),
        tradesCount: data.count,
        winCount: data.wins,
        lossCount: data.losses,
        balanceAfter: Number(runningBalance.toFixed(2)),
      });
    });

    return result;
  }

  /**
   * Evaluates Prop Firm Compliance Rules in real time
   */
  static evaluatePropFirmCompliance(account: Account, trades: Trade[]): PropFirmComplianceStatus {
    const isProp = Boolean(account?.accountType?.startsWith('PROP_') || account?.accountType === 'CHALLENGE');
    const isFunded = account?.accountType === 'PROP_FUNDED';
    const isEvaluation = account?.accountType === 'PROP_EVALUATION' || account?.accountType === 'PROP_VERIFICATION' || account?.accountType === 'CHALLENGE';
    
    const startingBalance = account.startingBalance || 100000;
    const currentBalance = account.currentBalance || startingBalance;
    const equity = account.equity || currentBalance;
    const currentProfit = currentBalance - startingBalance;

    // 1. Profit Target Check
    const profitTargetAmount = account.profitTarget;
    let profitTargetProgressPercent = 0;
    let isProfitTargetAchieved = false;

    if (profitTargetAmount && profitTargetAmount > 0) {
      profitTargetProgressPercent = Math.min(100, Math.max(0, (currentProfit / profitTargetAmount) * 100));
      isProfitTargetAchieved = currentProfit >= profitTargetAmount;
    }

    // 2. Daily Loss Limit Check (Trades closed today)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTrades = trades.filter(t => {
      const tradeDate = (t.exitDate || t.entryDate).split('T')[0];
      return tradeDate === todayStr && t.status === 'CLOSED';
    });
    const todaysPnL = todayTrades.reduce((acc, t) => acc + t.netPnL, 0);
    const todaysLoss = todaysPnL < 0 ? Math.abs(todaysPnL) : 0;

    const dailyLossLimitAmount = account.dailyLossLimit || (startingBalance * 0.05); // default 5%
    const dailyLossRemainingBuffer = Math.max(0, dailyLossLimitAmount - todaysLoss);
    const dailyLossUsedPercent = dailyLossLimitAmount > 0 ? (todaysLoss / dailyLossLimitAmount) * 100 : 0;
    const isDailyLossBreached = todaysLoss >= dailyLossLimitAmount;
    const dailyLossWarning = dailyLossUsedPercent >= 80;

    // 3. Max Drawdown / Total Loss Check
    const maxLossLimitAmount = account.maximumLoss || (startingBalance * 0.10); // default 10%
    const maxTotalLossThreshold = startingBalance - maxLossLimitAmount;
    const totalDrawdownFromStart = Math.max(0, startingBalance - currentBalance);
    const maxDrawdownRemainingBuffer = Math.max(0, currentBalance - maxTotalLossThreshold);
    const maxDrawdownUsedPercent = maxLossLimitAmount > 0 ? (totalDrawdownFromStart / maxLossLimitAmount) * 100 : 0;
    const isMaxLossBreached = currentBalance <= maxTotalLossThreshold;
    const maxLossWarning = maxDrawdownUsedPercent >= 80;

    // 4. Minimum Trading Days
    const minDays = account.minimumTradingDays || 0;
    const uniqueDays = new Set(
      trades
        .filter(t => t.status === 'CLOSED')
        .map(t => (t.exitDate || t.entryDate).split('T')[0])
    ).size;
    const tradingDaysRemaining = Math.max(0, minDays - uniqueDays);
    const isMinTradingDaysPassed = uniqueDays >= minDays;

    // Overall Status
    const breachReasons: string[] = [];
    if (isDailyLossBreached) breachReasons.push('Daily Loss Limit Breached');
    if (isMaxLossBreached) breachReasons.push('Maximum Drawdown / Total Loss Limit Breached');

    let overallStatus: 'PASSED' | 'ON_TRACK' | 'AT_RISK' | 'BREACHED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';

    if (isProp) {
      if (isDailyLossBreached || isMaxLossBreached) {
        overallStatus = 'BREACHED';
      } else if (dailyLossWarning || maxLossWarning) {
        overallStatus = 'AT_RISK';
      } else if (isEvaluation && isProfitTargetAchieved && isMinTradingDaysPassed) {
        overallStatus = 'PASSED';
      } else {
        overallStatus = 'ON_TRACK';
      }
    }

    return {
      accountId: account.id,
      accountName: account.name,
      accountType: account.accountType,
      propFirmName: account.propFirm,
      isFunded,
      isEvaluation,
      startingBalance,
      currentBalance,
      equity,
      profitTargetAmount,
      currentProfitAmount: Number(currentProfit.toFixed(2)),
      profitTargetProgressPercent: Number(profitTargetProgressPercent.toFixed(1)),
      isProfitTargetAchieved,
      dailyLossLimitAmount,
      todaysLossAmount: Number(todaysLoss.toFixed(2)),
      dailyLossRemainingBuffer: Number(dailyLossRemainingBuffer.toFixed(2)),
      dailyLossUsedPercent: Number(dailyLossUsedPercent.toFixed(1)),
      isDailyLossBreached,
      dailyLossWarning,
      maxLossLimitAmount,
      maxTotalLossThreshold,
      maxDrawdownRemainingBuffer: Number(maxDrawdownRemainingBuffer.toFixed(2)),
      maxDrawdownUsedPercent: Number(maxDrawdownUsedPercent.toFixed(1)),
      isMaxLossBreached,
      maxLossWarning,
      minTradingDaysRequired: minDays,
      tradingDaysCompleted: uniqueDays,
      tradingDaysRemaining,
      isMinTradingDaysPassed,
      overallStatus,
      breachReasons,
    };
  }

  /**
   * Builds the complete unified account summary
   */
  static buildAccountSummary(account: Account, trades: Trade[]): AccountPerformanceSummary {
    const accountTrades = trades.filter(t => t.accountId === account.id);
    const metrics = this.calculateMetrics(accountTrades, account.startingBalance);
    const drawdown = this.calculateDrawdown(accountTrades, account.startingBalance);
    const compliance = this.evaluatePropFirmCompliance(account, accountTrades);
    const equityCurve = this.generateEquityCurve(accountTrades, account.startingBalance);
    const dailyPnL = this.generateDailyPnL(accountTrades, account.startingBalance);
    const recentTrades = [...accountTrades]
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 10);

    return {
      account,
      metrics,
      drawdown,
      compliance,
      equityCurve,
      dailyPnL,
      recentTrades,
    };
  }

  // =========================================================================
  // Risk Management & Quantitative Safety Methods
  // =========================================================================

  /**
   * Calculates position size, lots, notional value and pip metrics
   */
  static calculatePositionSizeParams(params: PositionSizeParams): PositionSizeResult {
    return RiskEngine.calculatePositionSize(params);
  }

  /**
   * Multi-mode stop loss price level calculator
   */
  static calculateStopLossParams(params: StopLossParams): StopLossResult {
    return RiskEngine.calculateStopLoss(params);
  }

  /**
   * Reward-to-Risk ratio and breakeven probability calculator
   */
  static calculateRewardRiskParams(params: RewardRiskParams): RewardRiskResult {
    return RiskEngine.calculateRewardRisk(params);
  }

  /**
   * Margin requirement, free margin, and leverage calculator
   */
  static calculateMarginAndLeverageParams(params: MarginLeverageParams): MarginLeverageResult {
    return RiskEngine.calculateMarginAndLeverage(params);
  }

  /**
   * Period risk budgets (Daily, Weekly, Monthly) and consumption tracking
   */
  static calculateRiskBudgets(account: Account | null, trades: Trade[], policy: RiskPolicy): RiskBudgets {
    return RiskEngine.calculateRiskBudgets(account, trades, policy);
  }

  /**
   * Open exposure and correlated asset cluster metrics
   */
  static calculateExposureMetrics(account: Account | null, openTrades: Trade[], policy: RiskPolicy): ExposureMetrics {
    return RiskEngine.calculateExposure(account, openTrades, policy);
  }

  /**
   * Evaluates comprehensive risk policy compliance
   */
  static evaluateRiskPolicy(account: Account | null, trades: Trade[], policy: RiskPolicy): RiskPolicyEvaluation {
    return RiskEngine.evaluatePolicy(account, trades, policy);
  }
}
