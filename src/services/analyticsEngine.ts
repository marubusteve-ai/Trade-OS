/**
 * Centralized Advanced Quantitative Analytics Engine
 * Single Source of Truth for Professional Trading Performance Statistics,
 * Multi-Dimensional Segmentations, Risk-Adjusted Ratios, and Excursion Metrics.
 */

import { Trade, Strategy, Playbook, Setup, Account } from '../types/domain';
import {
  AdvancedPerformanceMetrics,
  WinLossDetailedStats,
  AnalyticsDimension,
  DimensionBreakdownItem,
  DayHourHeatmapCell,
  MonthYearHeatmapCell,
  ScatterTradePoint,
  HistogramBucket,
  StrategyComparisonItem,
  PlaybookComparisonItem,
  AnalyticsFilterState,
} from '../types/analytics';

export class AnalyticsEngine {
  /**
   * Filter trades according to multi-dimensional filter criteria
   */
  static filterTrades(trades: Trade[], filters: Partial<AnalyticsFilterState>): Trade[] {
    return trades.filter((trade) => {
      // Account filter
      if (filters.accountId && filters.accountId !== 'ALL' && trade.accountId !== filters.accountId) {
        return false;
      }
      // Strategy filter
      if (filters.strategyId && filters.strategyId !== 'ALL' && trade.strategyId !== filters.strategyId) {
        return false;
      }
      // Playbook filter
      if (filters.playbookId && filters.playbookId !== 'ALL' && trade.playbookId !== filters.playbookId) {
        return false;
      }
      // Setup filter
      if (filters.setupId && filters.setupId !== 'ALL' && trade.setupId !== filters.setupId) {
        return false;
      }
      // Instrument filter
      if (filters.instrument && filters.instrument !== 'ALL' && trade.instrument !== filters.instrument) {
        return false;
      }
      // Asset Class filter
      if (filters.assetClass && filters.assetClass !== 'ALL' && trade.assetClass !== filters.assetClass) {
        return false;
      }
      // Direction filter
      if (filters.direction && filters.direction !== 'ALL' && trade.direction !== filters.direction) {
        return false;
      }
      // Session filter
      if (filters.session && filters.session !== 'ALL' && trade.session !== filters.session) {
        return false;
      }
      // Timeframe filter
      if (filters.timeframe && filters.timeframe !== 'ALL' && trade.marketContext?.timeframe !== filters.timeframe) {
        return false;
      }
      // Market Condition filter
      if (filters.marketCondition && filters.marketCondition !== 'ALL' && trade.marketContext?.marketCondition !== filters.marketCondition) {
        return false;
      }
      // Risk level filter (e.g. Low <1%, Medium 1-2%, High >2%)
      if (filters.riskLevel && filters.riskLevel !== 'ALL') {
        const riskPct = trade.plannedRiskPercent || 0;
        if (filters.riskLevel === 'LOW' && riskPct > 1) return false;
        if (filters.riskLevel === 'MEDIUM' && (riskPct <= 1 || riskPct > 2)) return false;
        if (filters.riskLevel === 'HIGH' && riskPct <= 2) return false;
      }
      // Psychology emotion
      if (filters.psychologyEmotion && filters.psychologyEmotion !== 'ALL') {
        const emotion = trade.psychology?.preTradeEmotion;
        if (emotion !== filters.psychologyEmotion) return false;
      }
      // Mistake category
      if (filters.mistakeCategory && filters.mistakeCategory !== 'ALL') {
        const mistakes = trade.psychology?.mistakes || [];
        if (!mistakes.includes(filters.mistakeCategory)) return false;
      }
      // Date range filter
      if (filters.startDate) {
        const tradeDate = (trade.exitDate || trade.entryDate).split('T')[0];
        if (tradeDate < filters.startDate) return false;
      }
      if (filters.endDate) {
        const tradeDate = (trade.exitDate || trade.entryDate).split('T')[0];
        if (tradeDate > filters.endDate) return false;
      }

      return true;
    });
  }

  /**
   * Calculates individual trade execution excursion & efficiency metrics
   */
  static calculateExcursionMetrics(trade: Trade): {
    mfe: number;
    mae: number;
    entryEfficiency: number;
    exitEfficiency: number;
    edgeDecayAmount: number;
  } {
    const pnl = trade.netPnL || 0;
    const isWin = pnl > 0.001;
    const mfe = trade.maxFavorableExcursion !== undefined ? trade.maxFavorableExcursion : (trade.mfe !== undefined ? trade.mfe : (isWin ? Math.abs(pnl) * 1.25 : Math.abs(pnl) * 0.4));
    const mae = trade.maxAdverseExcursion !== undefined ? trade.maxAdverseExcursion : (trade.mae !== undefined ? trade.mae : (!isWin ? Math.abs(pnl) * 1.1 : Math.abs(pnl) * 0.3));

    const entryEfficiency = (mfe + mae) > 0 ? Number(((mfe / (mfe + mae)) * 100).toFixed(2)) : 50;
    const exitEfficiency = mfe > 0 ? Number((Math.min(100, Math.max(0, (Math.max(0, pnl) / mfe) * 100))).toFixed(2)) : 0;
    const edgeDecayAmount = Number(Math.max(0, mfe - Math.max(0, pnl)).toFixed(2));

    return {
      mfe,
      mae,
      entryEfficiency,
      exitEfficiency,
      edgeDecayAmount,
    };
  }

  /**
   * Alias for analyzeByDimension
   */
  static generateDimensionBreakdown(
    trades: Trade[],
    dimension: AnalyticsDimension,
    context?: {
      strategies?: Strategy[];
      playbooks?: Playbook[];
      setups?: Setup[];
      accounts?: Account[];
    }
  ): DimensionBreakdownItem[] {
    return this.analyzeByDimension(dimension, trades, context);
  }

  /**
   * Calculates comprehensive advanced quantitative performance metrics
   */
  static calculateAdvancedMetrics(
    trades: Trade[],
    startingBalance: number = 100000
  ): AdvancedPerformanceMetrics {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const openTrades = trades.filter((t) => t.status === 'OPEN');

    const winningTrades = closedTrades.filter((t) => (t.netPnL || 0) > 0.001);
    const losingTrades = closedTrades.filter((t) => (t.netPnL || 0) < -0.001);
    const breakEvenTrades = closedTrades.filter((t) => Math.abs(t.netPnL || 0) <= 0.001);

    const winningTradesCount = winningTrades.length;
    const losingTradesCount = losingTrades.length;
    const breakEvenTradesCount = breakEvenTrades.length;
    const totalDecisiveTrades = winningTradesCount + losingTradesCount;

    const winRate = totalDecisiveTrades > 0 ? Number(((winningTradesCount / totalDecisiveTrades) * 100).toFixed(1)) : 0;
    const lossRate = totalDecisiveTrades > 0 ? Number(((losingTradesCount / totalDecisiveTrades) * 100).toFixed(1)) : 0;

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

    let totalMFE = 0;
    let totalMAE = 0;
    let mfeCount = 0;
    let maeCount = 0;
    let totalEntryEfficiency = 0;
    let totalExitEfficiency = 0;
    let efficiencyCount = 0;

    // Streaks tracking (chronological)
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    );

    let maxConsecWins = 0;
    let maxConsecLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    // Drawdown calculation tracking
    let peakBalance = startingBalance;
    let runningBalance = startingBalance;
    let maxDrawdownAmount = 0;
    let maxDrawdownPercent = 0;
    const drawdownPctArray: number[] = [];

    // Return series for Sharpe & Sortino (trade returns relative to starting balance)
    const returnSeries: number[] = [];

    for (const trade of sortedTrades) {
      const pnl = trade.netPnL || 0;
      totalNetPnL += pnl;
      totalCommissions += trade.commission || 0;
      totalSwaps += trade.swap || 0;
      totalFees += (trade.fees || 0) + (trade.spreadCost || 0);

      const tradeReturn = startingBalance > 0 ? pnl / startingBalance : 0;
      returnSeries.push(tradeReturn);

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

      const holdingSecs = trade.holdingTimeSeconds || 0;
      totalHoldingSeconds += holdingSecs;

      // Excursions and Efficiency
      const mfe = trade.mfe !== undefined ? trade.mfe : (pnl > 0 ? Math.abs(pnl) * 1.25 : Math.abs(pnl) * 0.4);
      const mae = trade.mae !== undefined ? trade.mae : (pnl < 0 ? Math.abs(pnl) * 1.1 : Math.abs(pnl) * 0.3);

      totalMFE += mfe;
      totalMAE += mae;
      mfeCount++;
      maeCount++;

      // Entry efficiency: MFE / (MFE + MAE)
      const entryEff = (mfe + mae) > 0 ? (mfe / (mfe + mae)) * 100 : 50;
      // Exit efficiency: for wins = pnl / MFE, for losses = (MFE - loss) / MFE capped
      const exitEff = mfe > 0 ? Math.min(100, Math.max(0, (Math.max(0, pnl) / mfe) * 100)) : 0;

      totalEntryEfficiency += entryEff;
      totalExitEfficiency += exitEff;
      efficiencyCount++;

      if (pnl > 0.001) {
        grossProfit += pnl;
        if (pnl > largestWin) largestWin = pnl;
        winHoldingSeconds += holdingSecs;

        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxConsecWins) maxConsecWins = currentWinStreak;
      } else if (pnl < -0.001) {
        grossLoss += Math.abs(pnl);
        if (Math.abs(pnl) > largestLoss) largestLoss = Math.abs(pnl);
        lossHoldingSeconds += holdingSecs;

        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxConsecLosses) maxConsecLosses = currentLossStreak;
      } else {
        currentWinStreak = 0;
        currentLossStreak = 0;
      }

      runningBalance += pnl;
      if (runningBalance > peakBalance) {
        peakBalance = runningBalance;
      }

      const currentDDAmount = peakBalance - runningBalance;
      const currentDDPct = peakBalance > 0 ? (currentDDAmount / peakBalance) * 100 : 0;
      drawdownPctArray.push(currentDDPct);

      if (currentDDAmount > maxDrawdownAmount) {
        maxDrawdownAmount = currentDDAmount;
      }
      if (currentDDPct > maxDrawdownPercent) {
        maxDrawdownPercent = currentDDPct;
      }
    }

    const currentDrawdownAmount = Math.max(0, peakBalance - runningBalance);
    const currentDrawdownPercent = peakBalance > 0 ? (currentDrawdownAmount / peakBalance) * 100 : 0;

    const averageWin = winningTradesCount > 0 ? grossProfit / winningTradesCount : 0;
    const averageLoss = losingTradesCount > 0 ? grossLoss / losingTradesCount : 0;

    const profitFactor = grossLoss > 0
      ? Number((grossProfit / grossLoss).toFixed(2))
      : (grossProfit > 0 ? 99.99 : 0);

    const payoffRatio = averageLoss > 0 ? Number((averageWin / averageLoss).toFixed(2)) : 0;

    const winProb = winRate / 100;
    const lossProb = lossRate / 100;
    const expectancy = Number((winProb * averageWin - lossProb * averageLoss).toFixed(2));

    const averageAchievedR = achievedRCount > 0 ? Number((totalAchievedR / achievedRCount).toFixed(2)) : 0;
    const avgPlannedRisk = closedTrades.length > 0 ? totalPlannedRisk / closedTrades.length : 0;
    const expectancyRMultiple = avgPlannedRisk > 0 && achievedRCount > 0
      ? Number(((winProb * (averageWin / avgPlannedRisk)) - (lossProb * 1)).toFixed(2))
      : (totalDecisiveTrades > 0 ? Number(((winProb * (averageWin > 0 && averageLoss > 0 ? averageWin / averageLoss : 1.5)) - lossProb).toFixed(2)) : 0);

    const netReturnPercent = startingBalance > 0 ? Number(((totalNetPnL / startingBalance) * 100).toFixed(2)) : 0;

    // Ulcer Index: quadratic mean of drawdown percentages
    let ulcerIndex = 0;
    if (drawdownPctArray.length > 0) {
      const sumSquaredDD = drawdownPctArray.reduce((sum, dd) => sum + (dd * dd), 0);
      ulcerIndex = Number(Math.sqrt(sumSquaredDD / drawdownPctArray.length).toFixed(2));
    }

    // Recovery Factor: Net Profit / Max Drawdown Amount
    const recoveryFactor = maxDrawdownAmount > 0
      ? Number((totalNetPnL / maxDrawdownAmount).toFixed(2))
      : (totalNetPnL > 0 ? 99.99 : 0);

    // Sharpe Ratio & Sortino Ratio
    let sharpeRatio = 0;
    let sortinoRatio = 0;

    if (returnSeries.length > 1) {
      const meanReturn = returnSeries.reduce((a, b) => a + b, 0) / returnSeries.length;
      const variance = returnSeries.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returnSeries.length - 1);
      const stdDev = Math.sqrt(variance);

      // Downside variance (only negative returns relative to target return 0)
      const downsideSquared = returnSeries.reduce((sum, r) => sum + (r < 0 ? Math.pow(r, 2) : 0), 0);
      const downsideDeviation = Math.sqrt(downsideSquared / returnSeries.length);

      const annualizationFactor = Math.sqrt(Math.min(252, Math.max(1, returnSeries.length)));

      if (stdDev > 0.00001) {
        sharpeRatio = Number(((meanReturn / stdDev) * annualizationFactor).toFixed(2));
      }
      if (downsideDeviation > 0.00001) {
        sortinoRatio = Number(((meanReturn / downsideDeviation) * annualizationFactor).toFixed(2));
      }
    }

    // Calmar Ratio: Net Return % / Max Drawdown %
    const calmarRatio = maxDrawdownPercent > 0
      ? Number((netReturnPercent / maxDrawdownPercent).toFixed(2))
      : (netReturnPercent > 0 ? 99.99 : 0);

    // Excursion averages
    const avgMFE = mfeCount > 0 ? Number((totalMFE / mfeCount).toFixed(2)) : 0;
    const avgMAE = maeCount > 0 ? Number((totalMAE / maeCount).toFixed(2)) : 0;
    const avgEntryEfficiency = efficiencyCount > 0 ? Number((totalEntryEfficiency / efficiencyCount).toFixed(1)) : 0;
    const avgExitEfficiency = efficiencyCount > 0 ? Number((totalExitEfficiency / efficiencyCount).toFixed(1)) : 0;
    const mfeMaeRatio = avgMAE > 0 ? Number((avgMFE / avgMAE).toFixed(2)) : (avgMFE > 0 ? 99.99 : 0);

    // Detailed Winning Stats
    const winningStats = this.calculateSegmentStats(winningTrades, 'WIN');
    // Detailed Losing Stats
    const losingStats = this.calculateSegmentStats(losingTrades, 'LOSS');

    let currentStreakType: 'WIN' | 'LOSS' | 'NONE' = 'NONE';
    let currentStreakCount = 0;
    if (currentWinStreak > 0) {
      currentStreakType = 'WIN';
      currentStreakCount = currentWinStreak;
    } else if (currentLossStreak > 0) {
      currentStreakType = 'LOSS';
      currentStreakCount = currentLossStreak;
    }

    return {
      totalTrades: trades.length,
      openTradesCount: openTrades.length,
      closedTradesCount: closedTrades.length,
      winningTradesCount,
      losingTradesCount,
      breakEvenTradesCount,
      winRate,
      lossRate,
      grossProfit: Number(grossProfit.toFixed(2)),
      grossLoss: Number(grossLoss.toFixed(2)),
      netPnL: Number(totalNetPnL.toFixed(2)),
      netReturnPercent,
      totalCommissions: Number(totalCommissions.toFixed(2)),
      totalSwaps: Number(totalSwaps.toFixed(2)),
      totalFees: Number(totalFees.toFixed(2)),
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
      avgPlannedRiskAmount: Number(avgPlannedRisk.toFixed(2)),
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      ulcerIndex,
      recoveryFactor,
      maxDrawdownAmount: Number(maxDrawdownAmount.toFixed(2)),
      maxDrawdownPercent: Number(maxDrawdownPercent.toFixed(2)),
      currentDrawdownAmount: Number(currentDrawdownAmount.toFixed(2)),
      currentDrawdownPercent: Number(currentDrawdownPercent.toFixed(2)),
      peakBalance: Number(peakBalance.toFixed(2)),
      startingBalance: Number(startingBalance.toFixed(2)),
      currentBalance: Number(runningBalance.toFixed(2)),
      maxConsecutiveWins: maxConsecWins,
      maxConsecutiveLosses: maxConsecLosses,
      currentStreak: { type: currentStreakType, count: currentStreakCount },
      avgDurationMinutes: closedTrades.length > 0 ? Math.round((totalHoldingSeconds / closedTrades.length) / 60) : 0,
      avgWinDurationMinutes: winningTradesCount > 0 ? Math.round((winHoldingSeconds / winningTradesCount) / 60) : 0,
      avgLossDurationMinutes: losingTradesCount > 0 ? Math.round((lossHoldingSeconds / losingTradesCount) / 60) : 0,
      avgMFE,
      avgMAE,
      avgEntryEfficiency,
      avgExitEfficiency,
      mfeMaeRatio,
      winningStats,
      losingStats,
    };
  }

  /**
   * Helper for calculating detailed stats for winning vs losing subsets
   */
  private static calculateSegmentStats(trades: Trade[], type: 'WIN' | 'LOSS'): WinLossDetailedStats {
    if (trades.length === 0) {
      return {
        tradesCount: 0,
        totalPnL: 0,
        avgPnL: 0,
        largestPnL: 0,
        smallestPnL: 0,
        avgRMultiple: 0,
        avgDurationMinutes: 0,
        avgMFE: 0,
        avgMAE: 0,
        avgEntryEfficiency: 0,
        avgExitEfficiency: 0,
      };
    }

    const totalPnL = trades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const avgPnL = totalPnL / trades.length;

    const pnlValues = trades.map((t) => Math.abs(t.netPnL || 0));
    const largestPnL = Math.max(...pnlValues);
    const smallestPnL = Math.min(...pnlValues);

    const rValues = trades.filter((t) => t.achievedRMultiple !== undefined).map((t) => t.achievedRMultiple!);
    const avgRMultiple = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;

    const totalSecs = trades.reduce((sum, t) => sum + (t.holdingTimeSeconds || 0), 0);
    const avgDurationMinutes = Math.round((totalSecs / trades.length) / 60);

    const totalMFE = trades.reduce((sum, t) => sum + (t.mfe !== undefined ? t.mfe : Math.abs(t.netPnL || 0) * (type === 'WIN' ? 1.25 : 0.4)), 0);
    const totalMAE = trades.reduce((sum, t) => sum + (t.mae !== undefined ? t.mae : Math.abs(t.netPnL || 0) * (type === 'LOSS' ? 1.1 : 0.3)), 0);

    const avgMFE = totalMFE / trades.length;
    const avgMAE = totalMAE / trades.length;

    const entryEff = (avgMFE + avgMAE) > 0 ? (avgMFE / (avgMFE + avgMAE)) * 100 : 50;
    const exitEff = type === 'WIN' && avgMFE > 0 ? Math.min(100, Math.max(0, (Math.abs(avgPnL) / avgMFE) * 100)) : 0;

    return {
      tradesCount: trades.length,
      totalPnL: Number(totalPnL.toFixed(2)),
      avgPnL: Number(avgPnL.toFixed(2)),
      largestPnL: Number(largestPnL.toFixed(2)),
      smallestPnL: Number(smallestPnL.toFixed(2)),
      avgRMultiple: Number(avgRMultiple.toFixed(2)),
      avgDurationMinutes,
      avgMFE: Number(avgMFE.toFixed(2)),
      avgMAE: Number(avgMAE.toFixed(2)),
      avgEntryEfficiency: Number(entryEff.toFixed(1)),
      avgExitEfficiency: Number(exitEff.toFixed(1)),
    };
  }

  /**
   * Groups trades by any of the 16 analytical dimensions and produces rich aggregations
   */
  static analyzeByDimension(
    dimension: AnalyticsDimension,
    trades: Trade[],
    context?: {
      strategies?: Strategy[];
      playbooks?: Playbook[];
      setups?: Setup[];
      accounts?: Account[];
    }
  ): DimensionBreakdownItem[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const groups = new Map<string, { label: string; trades: Trade[] }>();

    for (const trade of closedTrades) {
      let key = 'UNKNOWN';
      let label = 'Unknown / Unassigned';

      switch (dimension) {
        case 'ACCOUNT': {
          key = trade.accountId || 'unassigned';
          const acc = context?.accounts?.find((a) => a.id === trade.accountId);
          label = acc ? `${acc.name} (${acc.broker})` : trade.accountId || 'Unknown Account';
          break;
        }
        case 'STRATEGY': {
          key = trade.strategyId || 'unassigned';
          const strat = context?.strategies?.find((s) => s.id === trade.strategyId);
          label = strat?.name || trade.strategyName || (trade.strategyId ? trade.strategyId : 'No Strategy');
          break;
        }
        case 'PLAYBOOK': {
          key = trade.playbookId || 'unassigned';
          const pb = context?.playbooks?.find((p) => p.id === trade.playbookId);
          label = pb?.title || trade.playbookName || (trade.playbookId ? trade.playbookId : 'No Playbook');
          break;
        }
        case 'SETUP': {
          key = trade.setupId || 'unassigned';
          const st = context?.setups?.find((s) => s.id === trade.setupId);
          label = st?.name || trade.setupName || (trade.setupId ? trade.setupId : 'No Setup');
          break;
        }
        case 'INSTRUMENT': {
          key = trade.instrument || 'UNKNOWN';
          label = trade.instrument || 'Unknown Instrument';
          break;
        }
        case 'ASSET_CLASS': {
          key = trade.assetClass || 'UNKNOWN';
          label = trade.assetClass || 'Unknown Asset';
          break;
        }
        case 'TIMEFRAME': {
          key = trade.marketContext?.timeframe || '15m';
          label = trade.marketContext?.timeframe || '15m (Default)';
          break;
        }
        case 'SESSION': {
          key = trade.session || 'OFF_HOURS';
          label = trade.session ? trade.session.replace(/_/g, ' ') : 'Off Hours';
          break;
        }
        case 'TIME_OF_DAY': {
          const date = new Date(trade.entryDate);
          const hour = !isNaN(date.getTime()) ? date.getUTCHours() : 12;
          const bucket = hour < 6 ? '00:00 - 06:00 (Asian Open)' : hour < 12 ? '06:00 - 12:00 (London Session)' : hour < 18 ? '12:00 - 18:00 (NY Open & PM)' : '18:00 - 24:00 (Late Session)';
          key = `hour_bucket_${Math.floor(hour / 6)}`;
          label = bucket;
          break;
        }
        case 'DAY_OF_WEEK': {
          const date = new Date(trade.entryDate);
          const dayIdx = !isNaN(date.getTime()) ? date.getUTCDay() : 1;
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          key = `day_${dayIdx}`;
          label = dayNames[dayIdx];
          break;
        }
        case 'MONTH': {
          const date = new Date(trade.entryDate);
          const monthIdx = !isNaN(date.getTime()) ? date.getUTCMonth() : 0;
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          key = `month_${monthIdx}`;
          label = monthNames[monthIdx];
          break;
        }
        case 'MARKET_CONDITION': {
          key = trade.marketContext?.marketCondition || 'RANGING';
          label = (trade.marketContext?.marketCondition || 'RANGING').replace(/_/g, ' ');
          break;
        }
        case 'DIRECTION': {
          key = trade.direction || 'LONG';
          label = trade.direction === 'LONG' ? 'Long Trades (Buy)' : 'Short Trades (Sell)';
          break;
        }
        case 'RISK_LEVEL': {
          const riskPct = trade.plannedRiskPercent || 1;
          if (riskPct <= 1) {
            key = 'RISK_LOW';
            label = 'Conservative (≤ 1.0% Risk)';
          } else if (riskPct <= 2) {
            key = 'RISK_MEDIUM';
            label = 'Standard (1.1% - 2.0% Risk)';
          } else {
            key = 'RISK_HIGH';
            label = 'Aggressive (> 2.0% Risk)';
          }
          break;
        }
        case 'PSYCHOLOGY': {
          const emotion = trade.psychology?.preTradeEmotion || 'CALM';
          key = emotion;
          label = emotion.replace(/_/g, ' ');
          break;
        }
        case 'MISTAKE_CATEGORY': {
          const mistakes = trade.psychology?.mistakes;
          if (mistakes && mistakes.length > 0) {
            for (const mistake of mistakes) {
              const existing = groups.get(mistake) || { label: mistake, trades: [] };
              existing.trades.push(trade);
              groups.set(mistake, existing);
            }
            continue;
          } else {
            key = 'NO_MISTAKES';
            label = 'Flawless Execution (No Mistakes)';
          }
          break;
        }
      }

      const existing = groups.get(key) || { label, trades: [] };
      existing.trades.push(trade);
      groups.set(key, existing);
    }

    const items: DimensionBreakdownItem[] = [];

    groups.forEach((data, key) => {
      const gTrades = data.trades;
      const metrics = this.calculateAdvancedMetrics(gTrades);

      items.push({
        key,
        label: data.label,
        tradesCount: gTrades.length,
        winCount: metrics.winningTradesCount,
        lossCount: metrics.losingTradesCount,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        expectancy: metrics.expectancy,
        averageR: metrics.averageAchievedR,
        maxDrawdown: metrics.maxDrawdownAmount,
        avgDurationMinutes: metrics.avgDurationMinutes,
        trades: gTrades,
      });
    });

    // Sort by Net PnL descending
    return items.sort((a, b) => b.netPnL - a.netPnL);
  }

  /**
   * Generates a 7x24 Day-of-Week vs Hour-of-Day Heatmap Matrix
   */
  static generateDayHourHeatmap(trades: Trade[]): DayHourHeatmapCell[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize 7 x 24 matrix
    const matrix: DayHourHeatmapCell[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        matrix.push({
          dayIndex: day,
          dayLabel: dayNames[day],
          hour,
          tradesCount: 0,
          winCount: 0,
          lossCount: 0,
          netPnL: 0,
          winRate: 0,
          trades: [],
        });
      }
    }

    const cellMap = new Map<string, DayHourHeatmapCell>();
    matrix.forEach((cell) => cellMap.set(`${cell.dayIndex}_${cell.hour}`, cell));

    for (const trade of closedTrades) {
      const date = new Date(trade.entryDate);
      if (isNaN(date.getTime())) continue;

      const day = date.getUTCDay();
      const hour = date.getUTCHours();
      const key = `${day}_${hour}`;

      const cell = cellMap.get(key);
      if (cell) {
        cell.tradesCount++;
        cell.netPnL += trade.netPnL || 0;
        if ((trade.netPnL || 0) > 0.001) cell.winCount++;
        if ((trade.netPnL || 0) < -0.001) cell.lossCount++;
        cell.trades.push(trade);
      }
    }

    matrix.forEach((cell) => {
      cell.netPnL = Number(cell.netPnL.toFixed(2));
      const decisive = cell.winCount + cell.lossCount;
      cell.winRate = decisive > 0 ? Number(((cell.winCount / decisive) * 100).toFixed(1)) : 0;
    });

    return matrix;
  }

  /**
   * Generates Month vs Year Heatmap Grid
   */
  static generateMonthYearHeatmap(trades: Trade[]): MonthYearHeatmapCell[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const years = Array.from(
      new Set(
        closedTrades.map((t) => {
          const d = new Date(t.entryDate);
          return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
        })
      )
    ).sort();

    if (years.length === 0) years.push(new Date().getFullYear());

    const result: MonthYearHeatmapCell[] = [];
    const map = new Map<string, MonthYearHeatmapCell>();

    for (const year of years) {
      for (let m = 0; m < 12; m++) {
        const cell: MonthYearHeatmapCell = {
          year,
          month: m,
          monthLabel: monthNames[m],
          tradesCount: 0,
          winCount: 0,
          lossCount: 0,
          netPnL: 0,
          winRate: 0,
          trades: [],
        };
        result.push(cell);
        map.set(`${year}_${m}`, cell);
      }
    }

    for (const trade of closedTrades) {
      const d = new Date(trade.exitDate || trade.entryDate);
      if (isNaN(d.getTime())) continue;
      const y = d.getFullYear();
      const m = d.getMonth();
      const cell = map.get(`${y}_${m}`);
      if (cell) {
        cell.tradesCount++;
        cell.netPnL += trade.netPnL || 0;
        if ((trade.netPnL || 0) > 0.001) cell.winCount++;
        if ((trade.netPnL || 0) < -0.001) cell.lossCount++;
        cell.trades.push(trade);
      }
    }

    result.forEach((cell) => {
      cell.netPnL = Number(cell.netPnL.toFixed(2));
      const decisive = cell.winCount + cell.lossCount;
      cell.winRate = decisive > 0 ? Number(((cell.winCount / decisive) * 100).toFixed(1)) : 0;
    });

    return result;
  }

  /**
   * Generates MFE vs MAE Scatter Plot Trade Points
   */
  static generateMfeMaeScatter(trades: Trade[]): ScatterTradePoint[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    return closedTrades.map((trade, idx) => {
      const pnl = trade.netPnL || 0;
      const isWin = pnl > 0.001;
      const mfe = trade.mfe !== undefined ? trade.mfe : (isWin ? Math.abs(pnl) * 1.25 : Math.abs(pnl) * 0.4);
      const mae = trade.mae !== undefined ? trade.mae : (!isWin ? Math.abs(pnl) * 1.1 : Math.abs(pnl) * 0.3);

      const entryEff = (mfe + mae) > 0 ? (mfe / (mfe + mae)) * 100 : 50;
      const exitEff = mfe > 0 ? Math.min(100, Math.max(0, (Math.max(0, pnl) / mfe) * 100)) : 0;

      return {
        id: trade.id,
        tradeNumber: idx + 1,
        instrument: trade.instrument,
        direction: trade.direction,
        x: Number(mae.toFixed(2)),
        y: Number(mfe.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        isWin,
        rMultiple: trade.achievedRMultiple,
        durationMinutes: Math.round((trade.holdingTimeSeconds || 0) / 60),
        entryEfficiency: Number(entryEff.toFixed(1)),
        exitEfficiency: Number(exitEff.toFixed(1)),
        label: `${trade.instrument} (${trade.direction}) - PnL: $${pnl.toFixed(2)}`,
        trade,
      };
    });
  }

  /**
   * Generates Risk vs Return Scatter Plot Trade Points
   */
  static generateRiskReturnScatter(trades: Trade[]): ScatterTradePoint[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');

    return closedTrades.map((trade, idx) => {
      const pnl = trade.netPnL || 0;
      const isWin = pnl > 0.001;
      const plannedRisk = trade.plannedRiskAmount || (Math.abs(pnl) * 0.8) || 500;

      return {
        id: trade.id,
        tradeNumber: idx + 1,
        instrument: trade.instrument,
        direction: trade.direction,
        x: Number(plannedRisk.toFixed(2)),
        y: Number(pnl.toFixed(2)),
        pnl: Number(pnl.toFixed(2)),
        isWin,
        rMultiple: trade.achievedRMultiple,
        durationMinutes: Math.round((trade.holdingTimeSeconds || 0) / 60),
        entryEfficiency: 50,
        exitEfficiency: isWin ? 80 : 0,
        label: `${trade.instrument} - Risk: $${plannedRisk.toFixed(2)}, Return: $${pnl.toFixed(2)}`,
        trade,
      };
    });
  }

  /**
   * Generates PnL or R-Multiple Histogram Buckets
   */
  static generateHistogram(
    trades: Trade[],
    type: 'PNL' | 'R_MULTIPLE' | 'DURATION' | 'EFFICIENCY'
  ): HistogramBucket[] {
    const closedTrades = trades.filter((t) => t.status === 'CLOSED');
    if (closedTrades.length === 0) return [];

    let bucketsConfig: { label: string; min: number; max: number }[] = [];

    switch (type) {
      case 'PNL': {
        bucketsConfig = [
          { label: '< -$1,000', min: -Infinity, max: -1000 },
          { label: '-$1,000 to -$500', min: -1000, max: -500 },
          { label: '-$500 to -$100', min: -500, max: -100 },
          { label: '-$100 to +$100 (BE)', min: -100, max: 100 },
          { label: '+$100 to +$500', min: 100, max: 500 },
          { label: '+$500 to +$1,500', min: 500, max: 1500 },
          { label: '> +$1,500', min: 1500, max: Infinity },
        ];
        break;
      }
      case 'R_MULTIPLE': {
        bucketsConfig = [
          { label: '< -1.2R (Slip)', min: -Infinity, max: -1.2 },
          { label: '-1.0R (Planned SL)', min: -1.2, max: -0.8 },
          { label: '-0.8R to 0R (Small Loss)', min: -0.8, max: -0.1 },
          { label: '0R (Break Even)', min: -0.1, max: 0.1 },
          { label: '0R to +1.5R (Base Win)', min: 0.1, max: 1.5 },
          { label: '+1.5R to +3.0R (Target)', min: 1.5, max: 3.0 },
          { label: '> +3.0R (Runners)', min: 3.0, max: Infinity },
        ];
        break;
      }
      case 'DURATION': {
        bucketsConfig = [
          { label: '< 5 Mins (Scalp)', min: 0, max: 5 },
          { label: '5 - 15 Mins', min: 5, max: 15 },
          { label: '15 - 60 Mins', min: 15, max: 60 },
          { label: '1 - 4 Hours (Intraday)', min: 60, max: 240 },
          { label: '4 - 24 Hours (Day Swing)', min: 240, max: 1440 },
          { label: '> 24 Hours (Multi-Day)', min: 1440, max: Infinity },
        ];
        break;
      }
      case 'EFFICIENCY': {
        bucketsConfig = [
          { label: '0% - 20% (Low)', min: 0, max: 20 },
          { label: '20% - 40%', min: 20, max: 40 },
          { label: '40% - 60% (Moderate)', min: 40, max: 60 },
          { label: '60% - 80%', min: 60, max: 80 },
          { label: '80% - 100% (High)', min: 80, max: 100 },
        ];
        break;
      }
    }

    const buckets: HistogramBucket[] = bucketsConfig.map((b) => ({
      label: b.label,
      min: b.min,
      max: b.max,
      count: 0,
      winCount: 0,
      lossCount: 0,
      netPnL: 0,
      percentage: 0,
      trades: [],
    }));

    for (const trade of closedTrades) {
      let value = 0;

      if (type === 'PNL') {
        value = trade.netPnL || 0;
      } else if (type === 'R_MULTIPLE') {
        value = trade.achievedRMultiple !== undefined ? trade.achievedRMultiple : ((trade.netPnL || 0) > 0 ? 1.5 : -1.0);
      } else if (type === 'DURATION') {
        value = Math.round((trade.holdingTimeSeconds || 0) / 60);
      } else if (type === 'EFFICIENCY') {
        const pnl = trade.netPnL || 0;
        const mfe = trade.mfe !== undefined ? trade.mfe : (pnl > 0 ? Math.abs(pnl) * 1.25 : Math.abs(pnl) * 0.4);
        const mae = trade.mae !== undefined ? trade.mae : (pnl < 0 ? Math.abs(pnl) * 1.1 : Math.abs(pnl) * 0.3);
        value = (mfe + mae) > 0 ? (mfe / (mfe + mae)) * 100 : 50;
      }

      for (const bucket of buckets) {
        if (value >= bucket.min && value < bucket.max) {
          bucket.count++;
          bucket.netPnL += trade.netPnL || 0;
          if ((trade.netPnL || 0) > 0.001) bucket.winCount++;
          if ((trade.netPnL || 0) < -0.001) bucket.lossCount++;
          bucket.trades.push(trade);
          break;
        }
      }
    }

    buckets.forEach((b) => {
      b.netPnL = Number(b.netPnL.toFixed(2));
      b.percentage = closedTrades.length > 0 ? Number(((b.count / closedTrades.length) * 100).toFixed(1)) : 0;
    });

    return buckets;
  }

  /**
   * Comparative Strategy Engine
   */
  static compareStrategies(strategies: Strategy[], allTrades: Trade[]): StrategyComparisonItem[] {
    return strategies.map((strategy) => {
      const stratTrades = allTrades.filter((t) => t.strategyId === strategy.id);
      const metrics = this.calculateAdvancedMetrics(stratTrades);

      return {
        strategyId: strategy.id,
        strategyName: strategy.name,
        tradesCount: stratTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        expectancy: metrics.expectancy,
        averageR: metrics.averageAchievedR,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        recoveryFactor: metrics.recoveryFactor,
        avgDurationMinutes: metrics.avgDurationMinutes,
        metrics,
        trades: stratTrades,
      };
    }).sort((a, b) => b.netPnL - a.netPnL);
  }

  /**
   * Comparative Playbook Engine
   */
  static comparePlaybooks(playbooks: Playbook[], allTrades: Trade[]): PlaybookComparisonItem[] {
    return playbooks.map((playbook) => {
      const pbTrades = allTrades.filter((t) => t.playbookId === playbook.id);
      const metrics = this.calculateAdvancedMetrics(pbTrades);

      return {
        playbookId: playbook.id,
        playbookTitle: playbook.title,
        strategyName: playbook.strategyName,
        tradesCount: pbTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        expectancy: metrics.expectancy,
        averageR: metrics.averageAchievedR,
        sharpeRatio: metrics.sharpeRatio,
        sortinoRatio: metrics.sortinoRatio,
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        recoveryFactor: metrics.recoveryFactor,
        avgDurationMinutes: metrics.avgDurationMinutes,
        metrics,
        trades: pbTrades,
      };
    }).sort((a, b) => b.netPnL - a.netPnL);
  }
}
