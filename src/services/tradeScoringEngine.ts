/**
 * Trade Scoring Engine
 * 
 * Computes multi-dimensional trade quality scores independent of profitability:
 * 1. Setup Quality
 * 2. Execution Quality
 * 3. Risk Quality
 * 4. Rule Adherence
 * 5. Psychology / Process Quality
 * 
 * Generates an institutional Composite Score and Grade (A+ to F).
 */

import { Trade, TradeQualityScore, ChecklistEvaluationItem } from '../types/domain';
import { ChecklistEngine } from './checklistEngine';

export class TradeScoringEngine {
  /**
   * Computes the complete quality scoring breakdown for a trade
   */
  static evaluateTrade(
    trade: Partial<Trade>,
    checklistItems?: ChecklistEvaluationItem[]
  ): TradeQualityScore {
    const violations: string[] = [];
    const audit = checklistItems && checklistItems.length > 0 
      ? ChecklistEngine.auditChecklist(checklistItems) 
      : undefined;

    if (audit && audit.violations.length > 0) {
      violations.push(...audit.violations);
    }

    // 1. Setup Quality (0 - 100)
    let setupQuality = 50; // Base
    if (audit) {
      // Check confirmation items
      const confirmationItems = checklistItems?.filter(i => i.category === 'CONFIRMATION') || [];
      if (confirmationItems.length > 0) {
        const confChecked = confirmationItems.filter(i => i.isChecked).length;
        setupQuality = (confChecked / confirmationItems.length) * 60;
      } else {
        setupQuality = 60;
      }
    }

    // Confluence bonus
    const confluenceCount = trade.confluences?.length || 0;
    if (confluenceCount >= 3) setupQuality += 25;
    else if (confluenceCount >= 2) setupQuality += 20;
    else if (confluenceCount >= 1) setupQuality += 10;

    // Market context clarity
    if (trade.marketContext?.marketCondition && trade.marketContext?.higherTimeframeTrend) {
      setupQuality += 10;
    }
    if (trade.entryRationale && trade.entryRationale.trim().length > 10) {
      setupQuality += 5;
    }
    setupQuality = Math.min(100, Math.max(0, Math.round(setupQuality)));

    // 2. Execution Quality (0 - 100)
    let executionQuality = 85; // Standard good entry baseline
    if (trade.slippage && trade.slippage > 0) {
      executionQuality -= Math.min(20, Math.round(trade.slippage * 5));
    }
    if (trade.exitRationale && trade.exitRationale.trim().length > 5) {
      executionQuality += 10;
    }
    
    // Check execution mistakes
    const mistakes = trade.psychology?.mistakes || [];
    if (mistakes.includes('Chased Entry')) {
      executionQuality -= 25;
      violations.push('Execution Mistake: Chased Entry');
    }
    if (mistakes.includes('Early Exit')) {
      executionQuality -= 15;
    }
    if (mistakes.includes('Late Entry')) {
      executionQuality -= 15;
    }
    executionQuality = Math.min(100, Math.max(0, Math.round(executionQuality)));

    // 3. Risk Quality (0 - 100)
    let riskQuality = 0;
    // Hard Stop Loss defined
    if (trade.stopLossPrice && trade.stopLossPrice > 0) {
      riskQuality += 40;
    } else {
      violations.push('Critical Risk Breach: No Stop Loss Defined');
    }

    // Planned Risk % evaluation
    const riskPct = trade.plannedRiskPercent ?? 1.0;
    if (riskPct > 0 && riskPct <= 1.0) {
      riskQuality += 35; // Institutional gold standard
    } else if (riskPct <= 2.0) {
      riskQuality += 25; // Acceptable
    } else if (riskPct <= 3.0) {
      riskQuality += 10; // High risk
      violations.push(`Elevated Risk Level: ${riskPct}% risk per trade`);
    } else {
      riskQuality += 0; // Dangerous overleveraging
      violations.push(`Dangerous Overleveraging: ${riskPct}% risk per trade`);
    }

    // Planned R:R Ratio
    const plannedRR = trade.plannedRRRatio ?? 0;
    if (plannedRR >= 2.5) riskQuality += 25;
    else if (plannedRR >= 2.0) riskQuality += 20;
    else if (plannedRR >= 1.5) riskQuality += 15;
    else if (plannedRR >= 1.0) riskQuality += 10;
    else if (trade.stopLossPrice && trade.takeProfitPrice) {
      violations.push('Sub-optimal Reward to Risk (< 1.0 R:R)');
    }

    if (mistakes.includes('Overleveraged')) {
      riskQuality -= 30;
      violations.push('Risk Mistake: Overleveraged position sizing');
    }
    if (mistakes.includes('Moved Stop Loss')) {
      riskQuality -= 30;
      violations.push('Risk Mistake: Moved Stop Loss during active trade');
    }
    riskQuality = Math.min(100, Math.max(0, Math.round(riskQuality)));

    // 4. Rule Adherence (0 - 100)
    let ruleAdherence = 100;
    if (audit) {
      if (!audit.passedRequired) {
        ruleAdherence -= audit.failedRequiredCount * 25;
      }
      if (audit.weightedScore < 100) {
        ruleAdherence -= Math.round((100 - audit.weightedScore) * 0.3);
      }
    }

    if (trade.psychology?.followedTradingPlan === false) {
      ruleAdherence -= 30;
      violations.push('Process Deviation: Failed to follow trading plan');
    }

    const planMistakesCount = mistakes.filter(m => 
      ['Chased Entry', 'Overleveraged', 'Moved Stop Loss', 'Revenge Trade', 'FOMO Entry'].includes(m)
    ).length;
    ruleAdherence -= planMistakesCount * 15;
    ruleAdherence = Math.min(100, Math.max(0, Math.round(ruleAdherence)));

    // 5. Psychology / Process Quality (0 - 100)
    let psychologyQuality = 50;
    const psych = trade.psychology;
    if (psych) {
      // Discipline Score (1 - 10)
      psychologyQuality = (psych.disciplineScore || 5) * 4; // up to 40 pts

      // Plan adherence
      if (psych.followedTradingPlan) psychologyQuality += 20;

      // Emotion state
      const pre = psych.preTradeEmotion;
      if (pre === 'CALM' || pre === 'FOCUSED' || pre === 'CONFIDENT') {
        psychologyQuality += 25;
      } else if (pre === 'EAGER') {
        psychologyQuality += 15;
      } else if (pre === 'ANXIOUS' || pre === 'FATIGUED') {
        psychologyQuality += 5;
      } else if (pre === 'FOMO' || pre === 'REVENGE') {
        psychologyQuality -= 15;
        violations.push(`Psychological Compromise: Entered in ${pre} state`);
      }

      // Stress level (1 to 10)
      const stress = psych.stressLevel || 5;
      if (stress <= 3) psychologyQuality += 15;
      else if (stress <= 6) psychologyQuality += 10;
      else psychologyQuality += 0;
    } else {
      psychologyQuality = 70; // Neutral baseline if not recorded
    }
    psychologyQuality = Math.min(100, Math.max(0, Math.round(psychologyQuality)));

    // Composite Score Calculation (Weighted Aggregate of all 5 Pillars)
    const compositeScore = Math.round(
      (setupQuality * 0.25) +
      (executionQuality * 0.20) +
      (riskQuality * 0.25) +
      (ruleAdherence * 0.20) +
      (psychologyQuality * 0.10)
    );

    // Letter Grade mapping
    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
    if (compositeScore >= 90) grade = 'A+';
    else if (compositeScore >= 80) grade = 'A';
    else if (compositeScore >= 70) grade = 'B';
    else if (compositeScore >= 60) grade = 'C';
    else if (compositeScore >= 50) grade = 'D';
    else grade = 'F';

    // Filter unique violations
    const uniqueViolations = Array.from(new Set(violations));

    return {
      setupQuality,
      executionQuality,
      riskQuality,
      ruleAdherence,
      psychologyQuality,
      compositeScore,
      grade,
      violations: uniqueViolations,
      checklistAudit: audit,
    };
  }
}
