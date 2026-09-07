/**
 * Psychology & Behavioral Analytics Engine
 * 
 * Deep statistical evaluation of trading psychology, mistake drag,
 * consecutive loss behavior, tilt probabilities, and habit adherence.
 */

import { Trade } from '../types/domain';
import { 
  PsychologyAnalyticsReport, 
  EmotionPerformanceMetric, 
  MistakeLossMetric, 
  MistakeCostAnalysis, 
  ConsecutiveLossImpact, 
  RuleAdherenceComparison, 
  PsychologyDailySummary, 
  BehavioralRadarScores, 
  TiltCircuitBreakerStatus, 
  SessionCheckIn, 
  MistakeTaxonomyItem, 
  PreTradeEmotion, 
  PostTradeEmotion 
} from '../types/psychology';
import { DEFAULT_MISTAKE_TAXONOMY, DEFAULT_TRADING_HABITS } from '../repositories/psychologyRepository';

export class PsychologyEngine {
  /**
   * Generates the complete multi-dimensional psychology and behavior report
   */
  static generateFullReport(
    trades: Trade[],
    checkIns: SessionCheckIn[] = [],
    taxonomy: MistakeTaxonomyItem[] = DEFAULT_MISTAKE_TAXONOMY
  ): PsychologyAnalyticsReport {
    const closedTrades = trades.filter(t => t.status === 'CLOSED');

    const emotions = this.analyzeEmotions(closedTrades);
    const mistakesBreakdown = this.analyzeMistakes(closedTrades, taxonomy);
    const costAnalysis = this.calculateCostOfMistakes(closedTrades);
    const consecutiveLossImpact = this.analyzeConsecutiveLosses(closedTrades);
    const ruleAdherence = this.analyzeRuleAdherence(closedTrades);
    const dailyCalendar = this.generateDailyPsychologyCalendar(closedTrades, checkIns);
    const radar = this.calculateBehavioralRadar(closedTrades);
    const tiltMonitor = this.evaluateTiltCircuitBreaker(trades);
    const tradingHabitsSummary = this.analyzeTradingHabits(closedTrades);

    return {
      radar,
      tiltMonitor,
      emotionsPre: emotions.emotionsPre,
      emotionsPost: emotions.emotionsPost,
      mistakeLossMetrics: mistakesBreakdown.mistakeLossMetrics,
      costAnalysis,
      consecutiveLossImpact,
      ruleAdherence,
      dailyCalendar,
      topMistakesByCost: mistakesBreakdown.topMistakesByCost,
      topMistakesByFrequency: mistakesBreakdown.topMistakesByFrequency,
      tradingHabitsSummary,
    };
  }

  /**
   * Evaluates Win Rate, Total PnL, Profit Factor, and Avg R for all emotional states
   */
  static analyzeEmotions(trades: Trade[]): { 
    emotionsPre: EmotionPerformanceMetric[]; 
    emotionsPost: EmotionPerformanceMetric[] 
  } {
    const preGroups = new Map<string, Trade[]>();
    const postGroups = new Map<string, Trade[]>();

    for (const t of trades) {
      const pre = t.psychology?.preTradeEmotion || 'CALM';
      if (!preGroups.has(pre)) preGroups.set(pre, []);
      preGroups.get(pre)!.push(t);

      const post = t.psychology?.postTradeEmotion || 'NEUTRAL';
      if (!postGroups.has(post)) postGroups.set(post, []);
      postGroups.get(post)!.push(t);
    }

    const computeMetrics = (groupMap: Map<string, Trade[]>): EmotionPerformanceMetric[] => {
      const results: EmotionPerformanceMetric[] = [];

      groupMap.forEach((gTrades, emotionKey) => {
        const tradesCount = gTrades.length;
        const winning = gTrades.filter(t => (t.netPnL || 0) > 0.001);
        const losing = gTrades.filter(t => (t.netPnL || 0) < -0.001);
        const winCount = winning.length;
        const lossCount = losing.length;
        const winRate = tradesCount > 0 ? Number(((winCount / tradesCount) * 100).toFixed(1)) : 0;

        const totalNetPnL = gTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
        const avgPnL = tradesCount > 0 ? totalNetPnL / tradesCount : 0;

        const rValues = gTrades.filter(t => t.achievedRMultiple !== undefined).map(t => t.achievedRMultiple!);
        const avgRMultiple = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;

        const grossProfit = winning.reduce((sum, t) => sum + (t.netPnL || 0), 0);
        const grossLoss = Math.abs(losing.reduce((sum, t) => sum + (t.netPnL || 0), 0));
        const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99 : 0;

        results.push({
          emotion: emotionKey,
          label: emotionKey.replace(/_/g, ' '),
          tradesCount,
          winCount,
          lossCount,
          winRate,
          totalNetPnL: Number(totalNetPnL.toFixed(2)),
          avgPnL: Number(avgPnL.toFixed(2)),
          avgRMultiple: Number(avgRMultiple.toFixed(2)),
          profitFactor,
        });
      });

      return results.sort((a, b) => b.tradesCount - a.tradesCount);
    };

    return {
      emotionsPre: computeMetrics(preGroups),
      emotionsPost: computeMetrics(postGroups),
    };
  }

  /**
   * Evaluates mistake occurrences, losses associated with mistake types, and frequency
   */
  static analyzeMistakes(
    trades: Trade[],
    taxonomy: MistakeTaxonomyItem[] = DEFAULT_MISTAKE_TAXONOMY
  ): {
    mistakeLossMetrics: MistakeLossMetric[];
    topMistakesByCost: MistakeLossMetric[];
    topMistakesByFrequency: MistakeLossMetric[];
  } {
    const mistakeMap = new Map<string, {
      id: string;
      name: string;
      category: string;
      severity: 'MINOR' | 'MODERATE' | 'SEVERE';
      trades: Trade[];
    }>();

    // Map by name or id
    for (const trade of trades) {
      const mistakes = trade.psychology?.mistakes || [];
      const mistakeDetails = trade.psychology?.mistakeDetails || [];

      // Combine string mistakes and structured mistakes
      const allMistakeNames = new Set<string>();
      mistakes.forEach(m => allMistakeNames.add(m));
      mistakeDetails.forEach(md => allMistakeNames.add(md.mistakeName || md.mistakeId));

      allMistakeNames.forEach(mName => {
        const taxItem = taxonomy.find(
          item => item.name.toLowerCase() === mName.toLowerCase() || item.id === mName
        );
        const key = taxItem ? taxItem.name : mName;

        if (!mistakeMap.has(key)) {
          mistakeMap.set(key, {
            id: taxItem?.id || key,
            name: key,
            category: taxItem?.categoryName || 'General Execution',
            severity: taxItem?.severity || 'MODERATE',
            trades: [],
          });
        }
        mistakeMap.get(key)!.trades.push(trade);
      });
    }

    const totalTradesCount = trades.length || 1;
    const metrics: MistakeLossMetric[] = [];

    mistakeMap.forEach((entry) => {
      const mTrades = entry.trades;
      const count = mTrades.length;
      const frequencyPercent = Number(((count / totalTradesCount) * 100).toFixed(1));

      const losses = mTrades.filter(t => (t.netPnL || 0) < 0);
      const totalLossPnL = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL || 0), 0));
      const avgLossPnL = losses.length > 0 ? totalLossPnL / losses.length : 0;

      const wins = mTrades.filter(t => (t.netPnL || 0) > 0);
      const winRateWhenCommitted = count > 0 ? Number(((wins.length / count) * 100).toFixed(1)) : 0;
      const totalNetPnL = mTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

      metrics.push({
        mistakeId: entry.id,
        mistakeName: entry.name,
        categoryName: entry.category,
        severity: entry.severity,
        occurrencesCount: count,
        frequencyPercent,
        totalLossPnL: Number(totalLossPnL.toFixed(2)),
        avgLossPnL: Number(avgLossPnL.toFixed(2)),
        winRateWhenCommitted,
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
        trades: mTrades,
      });
    });

    const topMistakesByCost = [...metrics].sort((a, b) => b.totalLossPnL - a.totalLossPnL);
    const topMistakesByFrequency = [...metrics].sort((a, b) => b.occurrencesCount - a.occurrencesCount);

    return {
      mistakeLossMetrics: metrics,
      topMistakesByCost,
      topMistakesByFrequency,
    };
  }

  /**
   * Computes the "Cost of Mistakes" (Financial Impact of Discipline Deviations)
   */
  static calculateCostOfMistakes(trades: Trade[]): MistakeCostAnalysis {
    const totalTrades = trades.length;
    const cleanTrades = trades.filter(t => {
      const mistakesCount = (t.psychology?.mistakes?.length || 0) + (t.psychology?.mistakeDetails?.length || 0);
      return mistakesCount === 0;
    });
    const mistakeTrades = trades.filter(t => {
      const mistakesCount = (t.psychology?.mistakes?.length || 0) + (t.psychology?.mistakeDetails?.length || 0);
      return mistakesCount > 0;
    });

    const cleanTradesCount = cleanTrades.length;
    const mistakeTradesCount = mistakeTrades.length;

    const cleanNetPnL = cleanTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const mistakeNetPnL = mistakeTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

    const cleanWins = cleanTrades.filter(t => (t.netPnL || 0) > 0).length;
    const cleanWinRate = cleanTradesCount > 0 ? Number(((cleanWins / cleanTradesCount) * 100).toFixed(1)) : 0;

    const mistakeWins = mistakeTrades.filter(t => (t.netPnL || 0) > 0).length;
    const mistakeWinRate = mistakeTradesCount > 0 ? Number(((mistakeWins / mistakeTradesCount) * 100).toFixed(1)) : 0;

    const cleanRValues = cleanTrades.filter(t => t.achievedRMultiple !== undefined).map(t => t.achievedRMultiple!);
    const cleanAvgR = cleanRValues.length > 0 ? Number((cleanRValues.reduce((a, b) => a + b, 0) / cleanRValues.length).toFixed(2)) : 0;

    const mistakeRValues = mistakeTrades.filter(t => t.achievedRMultiple !== undefined).map(t => t.achievedRMultiple!);
    const mistakeAvgR = mistakeRValues.length > 0 ? Number((mistakeRValues.reduce((a, b) => a + b, 0) / mistakeRValues.length).toFixed(2)) : 0;

    // Profit Factors
    const cleanGrossWin = cleanTrades.filter(t => (t.netPnL || 0) > 0).reduce((s, t) => s + (t.netPnL || 0), 0);
    const cleanGrossLoss = Math.abs(cleanTrades.filter(t => (t.netPnL || 0) < 0).reduce((s, t) => s + (t.netPnL || 0), 0));
    const cleanProfitFactor = cleanGrossLoss > 0 ? Number((cleanGrossWin / cleanGrossLoss).toFixed(2)) : cleanGrossWin > 0 ? 99 : 0;

    const mistakeGrossWin = mistakeTrades.filter(t => (t.netPnL || 0) > 0).reduce((s, t) => s + (t.netPnL || 0), 0);
    const mistakeGrossLoss = Math.abs(mistakeTrades.filter(t => (t.netPnL || 0) < 0).reduce((s, t) => s + (t.netPnL || 0), 0));
    const mistakeProfitFactor = mistakeGrossLoss > 0 ? Number((mistakeGrossWin / mistakeGrossLoss).toFixed(2)) : mistakeGrossWin > 0 ? 99 : 0;

    // Financial drag = Losses incurred strictly on mistake trades + hypothetical difference if mistake trades traded at clean average
    const avoidableLosses = Math.abs(mistakeTrades.filter(t => (t.netPnL || 0) < 0).reduce((sum, t) => sum + (t.netPnL || 0), 0));
    
    // Dollar drag: how much better off the account would be if mistake trades were executed cleanly
    const cleanAvgPnL = cleanTradesCount > 0 ? cleanNetPnL / cleanTradesCount : 0;
    const hypotheticalCleanPnLForMistakeTrades = mistakeTradesCount * cleanAvgPnL;
    const totalCostOfMistakesDrag = Math.max(avoidableLosses, hypotheticalCleanPnLForMistakeTrades - mistakeNetPnL);

    return {
      totalTrades,
      cleanTradesCount,
      mistakeTradesCount,
      cleanNetPnL: Number(cleanNetPnL.toFixed(2)),
      mistakeNetPnL: Number(mistakeNetPnL.toFixed(2)),
      cleanWinRate,
      mistakeWinRate,
      cleanAvgR,
      mistakeAvgR,
      cleanProfitFactor,
      mistakeProfitFactor,
      totalCostOfMistakesDrag: Number(totalCostOfMistakesDrag.toFixed(2)),
      avoidableLossesAmount: Number(avoidableLosses.toFixed(2)),
    };
  }

  /**
   * Evaluates trader behavior and performance after consecutive losses
   * (Reveals Revenge Trading, Overleveraging after losses, and Tilt Triggers)
   */
  static analyzeConsecutiveLosses(trades: Trade[]): ConsecutiveLossImpact[] {
    if (trades.length < 2) return [];

    // Sort chronologically
    const sorted = [...trades].sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    const tier1Trades: { trade: Trade; prevLossCount: number; sizeChange: number; intervalMins: number }[] = [];
    const tier2Trades: { trade: Trade; prevLossCount: number; sizeChange: number; intervalMins: number }[] = [];
    const tier3Trades: { trade: Trade; prevLossCount: number; sizeChange: number; intervalMins: number }[] = [];

    let currentLossStreak = 0;

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i];
      const pnl = current.netPnL || 0;

      if (i > 0) {
        const prev = sorted[i - 1];
        const prevPnl = prev.netPnL || 0;

        if (currentLossStreak > 0) {
          // Calculate interval in minutes
          const prevExitTime = new Date(prev.exitDate || prev.entryDate).getTime();
          const currentEntryTime = new Date(current.entryDate).getTime();
          const intervalMins = Math.max(1, Math.round((currentEntryTime - prevExitTime) / 60000));

          // Calculate risk/size change relative to previous trade
          const prevRisk = prev.plannedRiskAmount || (prev.quantity * (prev.entryPrice || 1));
          const currRisk = current.plannedRiskAmount || (current.quantity * (current.entryPrice || 1));
          const sizeChangePct = prevRisk > 0 ? ((currRisk - prevRisk) / prevRisk) * 100 : 0;

          const record = {
            trade: current,
            prevLossCount: currentLossStreak,
            sizeChange: sizeChangePct,
            intervalMins,
          };

          if (currentLossStreak === 1) tier1Trades.push(record);
          else if (currentLossStreak === 2) tier2Trades.push(record);
          else if (currentLossStreak >= 3) tier3Trades.push(record);
        }
      }

      // Update streak
      if (pnl < -0.001) {
        currentLossStreak++;
      } else if (pnl > 0.001) {
        currentLossStreak = 0;
      }
    }

    const computeTier = (
      tierLabel: string, 
      lossCount: number, 
      records: { trade: Trade; sizeChange: number; intervalMins: number }[]
    ): ConsecutiveLossImpact => {
      const count = records.length;
      if (count === 0) {
        return {
          consecutiveLossTier: tierLabel,
          lossesCount: lossCount,
          sampleTradesCount: 0,
          winRate: 0,
          avgAchievedR: 0,
          avgNetPnL: 0,
          avgRiskChangePercent: 0,
          avgIntervalMinutes: 0,
        };
      }

      const wins = records.filter(r => (r.trade.netPnL || 0) > 0).length;
      const winRate = Number(((wins / count) * 100).toFixed(1));

      const totalPnL = records.reduce((sum, r) => sum + (r.trade.netPnL || 0), 0);
      const avgNetPnL = Number((totalPnL / count).toFixed(2));

      const rValues = records.filter(r => r.trade.achievedRMultiple !== undefined).map(r => r.trade.achievedRMultiple!);
      const avgAchievedR = rValues.length > 0 ? Number((rValues.reduce((a, b) => a + b, 0) / rValues.length).toFixed(2)) : 0;

      const avgRiskChange = Number((records.reduce((sum, r) => sum + r.sizeChange, 0) / count).toFixed(1));
      const avgInterval = Math.round(records.reduce((sum, r) => sum + r.intervalMins, 0) / count);

      return {
        consecutiveLossTier: tierLabel,
        lossesCount: lossCount,
        sampleTradesCount: count,
        winRate,
        avgAchievedR,
        avgNetPnL,
        avgRiskChangePercent: avgRiskChange,
        avgIntervalMinutes: avgInterval,
      };
    };

    return [
      computeTier('After 1 Loss', 1, tier1Trades),
      computeTier('After 2 Consecutive Losses', 2, tier2Trades),
      computeTier('After 3+ Consecutive Losses', 3, tier3Trades),
    ];
  }

  /**
   * Compares disciplined trades that followed the trading plan vs rule-deviating trades
   */
  static analyzeRuleAdherence(trades: Trade[]): RuleAdherenceComparison {
    const compliantTrades = trades.filter(t => {
      const followed = t.psychology?.followedTradingPlan !== false;
      const discipline = t.psychology?.disciplineScore ?? 8;
      const mistakesCount = t.psychology?.mistakes?.length || 0;
      return followed && discipline >= 7 && mistakesCount === 0;
    });

    const nonCompliantTrades = trades.filter(t => {
      const followed = t.psychology?.followedTradingPlan === false;
      const discipline = (t.psychology?.disciplineScore ?? 8) < 7;
      const mistakesCount = (t.psychology?.mistakes?.length || 0) > 0;
      return followed || discipline || mistakesCount;
    });

    const computeMetrics = (gTrades: Trade[]) => {
      const count = gTrades.length;
      if (count === 0) {
        return { count: 0, winRate: 0, totalPnL: 0, avgR: 0, profitFactor: 0 };
      }
      const wins = gTrades.filter(t => (t.netPnL || 0) > 0).length;
      const winRate = Number(((wins / count) * 100).toFixed(1));
      const totalPnL = gTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      
      const rValues = gTrades.filter(t => t.achievedRMultiple !== undefined).map(t => t.achievedRMultiple!);
      const avgR = rValues.length > 0 ? Number((rValues.reduce((a, b) => a + b, 0) / rValues.length).toFixed(2)) : 0;

      const grossWin = gTrades.filter(t => (t.netPnL || 0) > 0).reduce((s, t) => s + (t.netPnL || 0), 0);
      const grossLoss = Math.abs(gTrades.filter(t => (t.netPnL || 0) < 0).reduce((s, t) => s + (t.netPnL || 0), 0));
      const profitFactor = grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 99 : 0;

      return { count, winRate, totalPnL: Number(totalPnL.toFixed(2)), avgR, profitFactor };
    };

    const comp = computeMetrics(compliantTrades);
    const nonComp = computeMetrics(nonCompliantTrades);

    return {
      compliantTradesCount: comp.count,
      nonCompliantTradesCount: nonComp.count,
      compliantWinRate: comp.winRate,
      nonCompliantWinRate: nonComp.winRate,
      compliantNetPnL: comp.totalPnL,
      nonCompliantNetPnL: nonComp.totalPnL,
      compliantAvgR: comp.avgR,
      nonCompliantAvgR: nonComp.avgR,
      compliantProfitFactor: comp.profitFactor,
      nonCompliantProfitFactor: nonComp.profitFactor,
    };
  }

  /**
   * Generates a daily psychology summary / behavioral calendar log
   */
  static generateDailyPsychologyCalendar(
    trades: Trade[],
    checkIns: SessionCheckIn[] = []
  ): PsychologyDailySummary[] {
    const dayMap = new Map<string, { trades: Trade[]; checkIns: SessionCheckIn[] }>();

    // Index trades by YYYY-MM-DD
    for (const t of trades) {
      const dateStr = t.entryDate ? t.entryDate.split('T')[0] : new Date().toISOString().split('T')[0];
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { trades: [], checkIns: [] });
      }
      dayMap.get(dateStr)!.trades.push(t);
    }

    // Index check-ins
    for (const c of checkIns) {
      const dateStr = c.date || (c.timestamp ? c.timestamp.split('T')[0] : new Date().toISOString().split('T')[0]);
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { trades: [], checkIns: [] });
      }
      dayMap.get(dateStr)!.checkIns.push(c);
    }

    const summaries: PsychologyDailySummary[] = [];

    dayMap.forEach((data, dateStr) => {
      const dTrades = data.trades;
      const dCheckIns = data.checkIns;
      const tradesCount = dTrades.length;
      const wins = dTrades.filter(t => (t.netPnL || 0) > 0).length;
      const losses = dTrades.filter(t => (t.netPnL || 0) < 0).length;
      const netPnL = Number(dTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0).toFixed(2));

      // Averages
      let totalDiscipline = 0;
      let totalStress = 0;
      let totalPatience = 0;
      let totalConfidence = 0;
      const emotionCounts = new Map<PreTradeEmotion, number>();
      const mistakesList: string[] = [];

      dTrades.forEach(t => {
        const psych = t.psychology;
        totalDiscipline += psych?.disciplineScore ?? 8;
        totalStress += psych?.stressLevel ?? 4;
        totalPatience += psych?.patienceScore ?? 8;
        totalConfidence += psych?.confidenceScore ?? 8;

        const emotion = (psych?.preTradeEmotion || 'CALM') as PreTradeEmotion;
        emotionCounts.set(emotion, (emotionCounts.get(emotion) || 0) + 1);

        if (psych?.mistakes) {
          mistakesList.push(...psych.mistakes);
        }
      });

      // Factor in check-ins if no trades or blending
      if (dCheckIns.length > 0 && tradesCount === 0) {
        dCheckIns.forEach(c => {
          totalStress += c.stressLevel || 4;
          totalConfidence += c.focusScore || 8;
          emotionCounts.set(c.primaryMood, (emotionCounts.get(c.primaryMood) || 0) + 1);
        });
      }

      const divisor = tradesCount > 0 ? tradesCount : (dCheckIns.length || 1);
      const avgDiscipline = Math.round((totalDiscipline / (tradesCount || 1)) * 10) / 10;
      const avgStress = Math.round((totalStress / divisor) * 10) / 10;
      const avgPatience = Math.round((totalPatience / (tradesCount || 1)) * 10) / 10;
      const avgConfidence = Math.round((totalConfidence / divisor) * 10) / 10;

      // Find predominant emotion
      let primaryEmotion: PreTradeEmotion = 'CALM';
      let maxCount = 0;
      emotionCounts.forEach((count, emotion) => {
        if (count > maxCount) {
          maxCount = count;
          primaryEmotion = emotion;
        }
      });

      const dayDate = new Date(dateStr);
      const dayLabel = !isNaN(dayDate.getTime())
        ? dayDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        : dateStr;

      summaries.push({
        date: dateStr,
        dayLabel,
        tradesCount,
        winCount: wins,
        lossCount: losses,
        netPnL,
        avgDiscipline,
        avgStress,
        avgPatience,
        avgConfidence,
        primaryEmotion,
        mistakeCount: mistakesList.length,
        mistakesList: Array.from(new Set(mistakesList)),
        checkIns: dCheckIns,
        trades: dTrades,
      });
    });

    return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Computes the 6-pillar Behavioral Radar (0-100 scales)
   */
  static calculateBehavioralRadar(trades: Trade[]): BehavioralRadarScores {
    if (trades.length === 0) {
      return {
        discipline: 80,
        patience: 80,
        confidence: 80,
        stressControl: 75,
        impulsivityControl: 80,
        ruleAdherence: 85,
        overallDisciplineIndex: 80,
      };
    }

    let totalDiscipline = 0;
    let totalPatience = 0;
    let totalConfidence = 0;
    let totalStress = 0;
    let totalImpulsivity = 0;
    let totalRuleAdherence = 0;

    for (const t of trades) {
      const psych = t.psychology;
      const disc = psych?.disciplineScore ?? 8;
      const pat = psych?.patienceScore ?? 8;
      const conf = psych?.confidenceScore ?? 8;
      const stress = psych?.stressLevel ?? 4;
      const imp = psych?.impulsivityScore ?? (psych?.mistakes?.includes('Chased Entry') ? 7 : 3);
      
      let ruleAdh = 90;
      if (psych?.followedTradingPlan === false) ruleAdh -= 30;
      if (psych?.mistakes && psych.mistakes.length > 0) ruleAdh -= Math.min(40, psych.mistakes.length * 15);
      ruleAdh = Math.max(10, Math.min(100, ruleAdh));

      totalDiscipline += disc * 10;
      totalPatience += pat * 10;
      totalConfidence += conf * 10;
      totalStress += stress * 10;
      totalImpulsivity += imp * 10;
      totalRuleAdherence += ruleAdh;
    }

    const count = trades.length;
    const discipline = Math.round(totalDiscipline / count);
    const patience = Math.round(totalPatience / count);
    const confidence = Math.round(totalConfidence / count);
    // Stress control is inverted: low stress (e.g. 20) -> high control (80)
    const stressControl = Math.round(Math.max(0, Math.min(100, 100 - (totalStress / count))));
    // Impulsivity control is inverted: low impulsivity -> high control
    const impulsivityControl = Math.round(Math.max(0, Math.min(100, 100 - (totalImpulsivity / count))));
    const ruleAdherence = Math.round(totalRuleAdherence / count);

    // Weighted composite
    const overallDisciplineIndex = Math.round(
      (discipline * 0.25) +
      (patience * 0.20) +
      (ruleAdherence * 0.25) +
      (stressControl * 0.15) +
      (impulsivityControl * 0.15)
    );

    return {
      discipline,
      patience,
      confidence,
      stressControl,
      impulsivityControl,
      ruleAdherence,
      overallDisciplineIndex,
    };
  }

  /**
   * Real-time Tilt Detection and Circuit Breaker Assessment
   * Monitors recent trades for rapid loss clusters, elevated stress, revenge tags, and size spikes
   */
  static evaluateTiltCircuitBreaker(trades: Trade[]): TiltCircuitBreakerStatus {
    const recentClosed = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 5);

    if (recentClosed.length === 0) {
      return {
        status: 'CALM',
        tiltProbabilityPercent: 5,
        warningSignals: [],
        suggestedAction: 'Mindset optimal. Proceed with standard execution protocol.',
        recentConsecutiveLosses: 0,
        recentElevatedStress: false,
        recentMistakeSpike: false,
        cooldownActive: false,
      };
    }

    let consecutiveLosses = 0;
    for (const t of recentClosed) {
      if ((t.netPnL || 0) < -0.001) {
        consecutiveLosses++;
      } else {
        break;
      }
    }

    const warningSignals: string[] = [];
    let tiltScore = 10; // Baseline

    // Check consecutive losses
    if (consecutiveLosses >= 3) {
      tiltScore += 45;
      warningSignals.push(`${consecutiveLosses} consecutive losses in recent session`);
    } else if (consecutiveLosses === 2) {
      tiltScore += 25;
      warningSignals.push('2 consecutive recent losses');
    }

    // Check stress and revenge tags
    const highStressCount = recentClosed.filter(t => (t.psychology?.stressLevel || 0) >= 7).length;
    if (highStressCount >= 2) {
      tiltScore += 30;
      warningSignals.push('Sustained elevated stress levels reported (≥ 7/10)');
    }

    const revengeCount = recentClosed.filter(t => 
      t.psychology?.preTradeEmotion === 'REVENGE' || 
      t.psychology?.mistakes?.includes('Revenge Trade') ||
      t.psychology?.preTradeEmotion === 'FOMO' ||
      t.psychology?.mistakes?.includes('FOMO')
    ).length;

    if (revengeCount > 0) {
      tiltScore += 35;
      warningSignals.push('FOMO / Revenge impulses detected in recent trades');
    }

    // Check rapid re-entries (< 5 mins between consecutive trades)
    for (let i = 0; i < recentClosed.length - 1; i++) {
      const t1 = recentClosed[i];
      const t2 = recentClosed[i + 1];
      const diffMs = Math.abs(new Date(t1.entryDate).getTime() - new Date(t2.entryDate).getTime());
      if (diffMs < 300000 && (t2.netPnL || 0) < 0) { // under 5 minutes after a loss
        tiltScore += 20;
        warningSignals.push('Rapid re-entry (< 5 mins) executed immediately following a loss');
        break;
      }
    }

    tiltScore = Math.min(100, Math.max(0, tiltScore));

    let status: 'CALM' | 'CAUTION' | 'TILT_WARNING' | 'CIRCUIT_BREAKER_TRIPPED' = 'CALM';
    let suggestedAction = 'Mindset optimal. Proceed with standard execution protocol.';
    let cooldownActive = false;
    let cooldownRemainingMinutes: number | undefined = undefined;

    if (tiltScore >= 75) {
      status = 'CIRCUIT_BREAKER_TRIPPED';
      suggestedAction = 'CIRCUIT BREAKER: Step away from screens for a mandatory 30-minute cognitive reset.';
      cooldownActive = true;
      cooldownRemainingMinutes = 30;
    } else if (tiltScore >= 50) {
      status = 'TILT_WARNING';
      suggestedAction = 'TILT RISK ELEVATED: Cut position size by 50% and require double checklist confirmation.';
    } else if (tiltScore >= 30) {
      status = 'CAUTION';
      suggestedAction = 'Heightened vigilance: Take a 5-minute breather and review trading plan.';
    }

    return {
      status,
      tiltProbabilityPercent: tiltScore,
      warningSignals,
      suggestedAction,
      recentConsecutiveLosses: consecutiveLosses,
      recentElevatedStress: highStressCount > 0,
      recentMistakeSpike: revengeCount > 0,
      cooldownActive,
      cooldownRemainingMinutes,
    };
  }

  /**
   * Evaluates trader compliance across standard and custom trading habits
   */
  static analyzeTradingHabits(trades: Trade[]): { habit: string; adherenceRate: number; count: number }[] {
    const habitStats = new Map<string, { adhered: number; total: number }>();

    DEFAULT_TRADING_HABITS.forEach(h => {
      habitStats.set(h, { adhered: 0, total: 0 });
    });

    for (const trade of trades) {
      const habits = trade.psychology?.tradingHabits || [];
      
      DEFAULT_TRADING_HABITS.forEach(h => {
        const stat = habitStats.get(h)!;
        stat.total++;
        if (habits.includes(h)) {
          stat.adhered++;
        }
      });
    }

    const results: { habit: string; adherenceRate: number; count: number }[] = [];
    habitStats.forEach((stat, habit) => {
      const rate = stat.total > 0 ? Math.round((stat.adhered / stat.total) * 100) : 0;
      results.push({
        habit,
        adherenceRate: rate,
        count: stat.adhered,
      });
    });

    return results.sort((a, b) => b.adherenceRate - a.adherenceRate);
  }
}
