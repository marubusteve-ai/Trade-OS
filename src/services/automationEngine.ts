/**
 * TradeOS Deterministic Automation & Notification Engine
 * 
 * Configurable WHEN condition IS TRUE THEN action execution processor.
 * 
 * Features:
 * - Condition Evaluator across Risk, Prop Firm, Metrics, Drawdown, Psychology, and Trades.
 * - Multi-action Dispatcher (Notifications, Auto-Tagging, Auto-Categorization, AI/Report Triggers).
 * - Anti-fatigue Deduplication, Sliding Window Rate Limiting, and Quiet Hours Engine.
 * - Comprehensive Audit Logging.
 */

import { Account, Trade } from '../types/domain';
import { FinancialMetrics, DrawdownStats } from '../types/calculations';
import { RiskPolicy, RiskBudgets } from '../types/risk';
import { PropFirmEvaluationResult } from '../types/propFirm';
import {
  AutomationRule,
  AutomationCondition,
  AutomationAction,
  NotificationPreferences,
  AutomationExecutionLog,
  AutomationExecutionDetail,
  AutomationTriggerEvent,
  AutomationEvaluationContext,
  NotificationSeverity,
} from '../types/automation';
import { AutomationRepository } from '../repositories/automationRepository';
import { CalculationEngine } from './calculationEngine';

export interface AutomationExecutionCallbacks {
  notify?: (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => void;
  updateTrade?: (tradeId: string, updates: Partial<Trade>) => Promise<Trade> | Trade | void;
  triggerAIReview?: (reviewType: string, trade?: Trade) => void;
  triggerReport?: (reportType: string, format: string) => void;
}

// In-memory sliding window for rate limiting
interface RateLimitTracker {
  timestamps: number[];
  lastTriggeredByKey: Map<string, number>;
}

const userRateLimits = new Map<string, RateLimitTracker>();

export class AutomationEngine {
  /**
   * Helper: Formats string templates with contextual variables
   */
  static interpolateTemplate(
    template: string,
    context: {
      account?: Account | null;
      trade?: Trade | null;
      actualValue?: any;
      thresholdValue?: any;
      [key: string]: any;
    }
  ): string {
    let result = template;
    const { account, trade, actualValue, thresholdValue } = context;

    if (account) {
      result = result.replace(/\{accountName\}/g, account.name || 'Account');
      result = result.replace(/\{accountBalance\}/g, `$${account.currentBalance?.toFixed(2) || '0.00'}`);
      result = result.replace(/\{accountId\}/g, account.id || '');
    }

    if (trade) {
      result = result.replace(/\{instrument\}/g, trade.instrument || 'Asset');
      result = result.replace(/\{tradeId\}/g, trade.id ? trade.id.substring(0, 8) : '');
      result = result.replace(/\{direction\}/g, trade.direction || '');
      result = result.replace(/\{plannedRiskPercent\}/g, trade.plannedRiskPercent ? trade.plannedRiskPercent.toFixed(2) : '0.00');
      result = result.replace(/\{achievedRMultiple\}/g, trade.achievedRMultiple ? trade.achievedRMultiple.toFixed(2) : '0.00');
      result = result.replace(/\{netPnL\}/g, trade.netPnL !== undefined ? `${trade.netPnL >= 0 ? '+' : ''}$${trade.netPnL.toFixed(2)}` : '$0.00');
      result = result.replace(/\{strategyName\}/g, trade.strategyName || 'Discretionary');
    }

    if (actualValue !== undefined) {
      result = result.replace(/\{actualValue\}/g, typeof actualValue === 'number' ? actualValue.toFixed(2) : String(actualValue));
    }

    if (thresholdValue !== undefined) {
      result = result.replace(/\{thresholdValue\}/g, String(thresholdValue));
    }

    return result;
  }

  /**
   * Checks if current time is within user's Quiet Hours
   */
  static isQuietHoursActive(preferences: NotificationPreferences, now: Date = new Date()): boolean {
    if (!preferences.quietHours || !preferences.quietHours.enabled) {
      return false;
    }

    try {
      const { startTime, endTime } = preferences.quietHours;
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);

      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentMinutesTotal = currentHour * 60 + currentMin;
      const startMinutesTotal = startHour * 60 + startMin;
      const endMinutesTotal = endHour * 60 + endMin;

      if (startMinutesTotal < endMinutesTotal) {
        // Same day quiet hours (e.g. 13:00 to 17:00)
        return currentMinutesTotal >= startMinutesTotal && currentMinutesTotal <= endMinutesTotal;
      } else {
        // Overnight quiet hours (e.g. 22:00 to 07:00)
        return currentMinutesTotal >= startMinutesTotal || currentMinutesTotal <= endMinutesTotal;
      }
    } catch (e) {
      console.warn('Failed to parse quiet hours, defaulting to false:', e);
      return false;
    }
  }

  /**
   * Evaluates if rate limit threshold has been exceeded in the sliding 60-second window
   */
  static checkRateLimit(userId: string, preferences: NotificationPreferences, now: number = Date.now()): boolean {
    if (!userRateLimits.has(userId)) {
      userRateLimits.set(userId, { timestamps: [], lastTriggeredByKey: new Map() });
    }

    const tracker = userRateLimits.get(userId)!;
    const windowMs = 60 * 1000;
    const maxAllowed = preferences.rateLimiting?.maxPerMinute || 6;

    // Prune timestamps older than window
    tracker.timestamps = tracker.timestamps.filter((ts) => now - ts < windowMs);

    if (tracker.timestamps.length >= maxAllowed) {
      return true; // Exceeded rate limit
    }

    tracker.timestamps.push(now);
    return false;
  }

  /**
   * Checks if duplicate notification was recently sent within deduplication window
   */
  static isDeduplicateBlocked(
    userId: string,
    dedupKey: string,
    dedupMinutes: number = 30,
    now: number = Date.now()
  ): boolean {
    if (!userRateLimits.has(userId)) {
      userRateLimits.set(userId, { timestamps: [], lastTriggeredByKey: new Map() });
    }

    const tracker = userRateLimits.get(userId)!;
    const lastSent = tracker.lastTriggeredByKey.get(dedupKey);

    if (lastSent && now - lastSent < dedupMinutes * 60 * 1000) {
      return true; // Blocked duplicate
    }

    tracker.lastTriggeredByKey.set(dedupKey, now);
    return false;
  }

  /**
   * Evaluates an individual AutomationCondition against runtime data
   */
  static evaluateCondition(
    condition: AutomationCondition,
    context: AutomationEvaluationContext
  ): { matched: boolean; actualValue: any; thresholdValue: any; evaluatedMetric: string } {
    const { targetAccount, trades, targetTrade, metrics, drawdown, propFirmEvaluation } = context;
    const { type, operator, value, field } = condition;

    let actualValue: any = null;
    let thresholdValue: any = value;
    let evaluatedMetric = field || type;

    switch (type) {
      case 'RISK_PER_TRADE_EXCEEDED': {
        evaluatedMetric = 'Planned Risk (%)';
        if (targetTrade) {
          actualValue = targetTrade.plannedRiskPercent || 0;
        } else if (trades.length > 0) {
          actualValue = trades[trades.length - 1].plannedRiskPercent || 0;
        } else {
          actualValue = 0;
        }
        break;
      }

      case 'DAILY_LOSS_EXCEEDED': {
        evaluatedMetric = 'Daily Drawdown Consumption (%)';
        const activeBal = targetAccount?.startingBalance || 100000;
        // Compute today's realized loss
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysTrades = trades.filter((t) => (t.exitDate || t.entryDate || '').startsWith(todayStr));
        const todaysPnL = todaysTrades.reduce((sum, t) => sum + t.netPnL, 0);

        if (todaysPnL < 0) {
          const lossAmt = Math.abs(todaysPnL);
          const lossPercentOfBal = (lossAmt / activeBal) * 100;
          actualValue = Number(lossPercentOfBal.toFixed(2));
        } else {
          actualValue = 0;
        }
        break;
      }

      case 'DRAWDOWN_EXCEEDED': {
        evaluatedMetric = 'Peak-to-Trough Drawdown (%)';
        actualValue = drawdown ? drawdown.maxDrawdownPercent : 0;
        break;
      }

      case 'PROP_FIRM_LIMIT_WARNING': {
        evaluatedMetric = 'Prop Firm Trailing DD Proximity (%)';
        if (propFirmEvaluation) {
          actualValue = propFirmEvaluation.drawdownBuffer?.percentUsed || 0;
        } else if (drawdown) {
          actualValue = (drawdown.maxDrawdownPercent / 10.0) * 100; // Simulated buffer
        } else {
          actualValue = 0;
        }
        break;
      }

      case 'CONSECUTIVE_LOSSES_EXCEEDED': {
        evaluatedMetric = 'Consecutive Losses Streak';
        actualValue = metrics
          ? metrics.currentStreak?.type === 'LOSS'
            ? metrics.currentStreak.count
            : metrics.maxConsecutiveLosses || 0
          : 0;
        break;
      }

      case 'OPEN_EXPOSURE_EXCEEDED': {
        evaluatedMetric = 'Open Trade Count';
        actualValue = trades.filter((t) => t.status === 'OPEN').length;
        break;
      }

      case 'UNFILLED_JOURNAL_LOGS': {
        evaluatedMetric = 'Journal Completion Status';
        const tradeToCheck = targetTrade || trades[trades.length - 1];
        if (tradeToCheck && tradeToCheck.status === 'CLOSED') {
          const hasNotes = Boolean(tradeToCheck.notes && tradeToCheck.notes.trim().length > 0);
          const hasEmotion = Boolean(tradeToCheck.psychology?.preTradeEmotion || tradeToCheck.psychology?.postTradeEmotion);
          const isComplete = hasNotes || hasEmotion;
          actualValue = isComplete;
        } else {
          actualValue = true; // No uncompleted closed trade
        }
        break;
      }

      case 'GOAL_PROGRESS_BEHIND': {
        evaluatedMetric = 'Discipline / Compliance Score';
        const compliantCount = trades.filter(
          (t) => (t.qualityScore?.ruleAdherence && t.qualityScore.ruleAdherence >= 80) || t.psychology?.followedTradingPlan
        ).length;
        actualValue = trades.length > 0 ? (compliantCount / trades.length) * 100 : 100;
        break;
      }

      case 'AI_REVIEW_PENDING': {
        evaluatedMetric = 'Closed Trades Since Last Review';
        actualValue = trades.filter((t) => t.status === 'CLOSED').length;
        break;
      }

      case 'RECURRING_SCHEDULE': {
        evaluatedMetric = 'Weekly Trade Count';
        actualValue = trades.length;
        break;
      }

      case 'TRADE_ATTRIBUTE_MATCH': {
        evaluatedMetric = field || 'tradeAttribute';
        const tradeToCheck = targetTrade || trades[trades.length - 1];
        if (tradeToCheck && field) {
          actualValue = (tradeToCheck as any)[field];
        }
        break;
      }

      case 'CUSTOM_EXPRESSION':
      default: {
        evaluatedMetric = field || 'CustomMetric';
        if (targetTrade && field && (targetTrade as any)[field] !== undefined) {
          actualValue = (targetTrade as any)[field];
        } else if (metrics && field && (metrics as any)[field] !== undefined) {
          actualValue = (metrics as any)[field];
        }
        break;
      }
    }

    // Comparison Logic
    let matched = false;
    switch (operator) {
      case 'GREATER_THAN':
        matched = Number(actualValue) > Number(value);
        break;
      case 'GREATER_EQUAL':
        matched = Number(actualValue) >= Number(value);
        break;
      case 'LESS_THAN':
        matched = Number(actualValue) < Number(value);
        break;
      case 'LESS_EQUAL':
        matched = Number(actualValue) <= Number(value);
        break;
      case 'EQUALS':
        matched = String(actualValue).toLowerCase() === String(value).toLowerCase();
        break;
      case 'CONTAINS':
        if (typeof value === 'string' && typeof actualValue === 'string') {
          const searchTokens = value.split(',').map((s) => s.trim().toUpperCase());
          matched = searchTokens.some((token) => actualValue.toUpperCase().includes(token));
        } else {
          matched = String(actualValue).toLowerCase().includes(String(value).toLowerCase());
        }
        break;
      case 'BETWEEN':
        if (condition.secondaryValue !== undefined) {
          matched = Number(actualValue) >= Number(value) && Number(actualValue) <= Number(condition.secondaryValue);
        }
        break;
    }

    return {
      matched,
      actualValue,
      thresholdValue,
      evaluatedMetric,
    };
  }

  /**
   * Executes an Automation Action with preference filtering and safety guardrails
   */
  static async executeAction(
    action: AutomationAction,
    rule: AutomationRule,
    context: AutomationEvaluationContext,
    preferences: NotificationPreferences,
    callbacks: AutomationExecutionCallbacks,
    conditionSnapshot: { actualValue: any; thresholdValue: any }
  ): Promise<AutomationExecutionDetail> {
    const { targetAccount, targetTrade, trades } = context;
    const tradeToActOn = targetTrade || (trades.length > 0 ? trades[trades.length - 1] : null);

    // 1. Check if category is enabled in user preferences
    if (preferences.categorySubscriptions && preferences.categorySubscriptions[rule.category] === false) {
      return {
        actionId: action.id,
        actionType: action.type,
        status: 'SKIPPED_PREFERENCE',
        detail: `Category ${rule.category} disabled in notification preferences.`,
      };
    }

    // 2. Check Severity Threshold
    const severityRank: Record<NotificationSeverity, number> = {
      INFO: 1,
      SUCCESS: 1,
      WARNING: 2,
      CRITICAL: 3,
    };
    const prefMinRank = severityRank[preferences.minimumSeverity] || 1;
    const actionRank = severityRank[action.severity] || 1;

    if (actionRank < prefMinRank) {
      return {
        actionId: action.id,
        actionType: action.type,
        status: 'SKIPPED_PREFERENCE',
        detail: `Severity ${action.severity} below user threshold ${preferences.minimumSeverity}.`,
      };
    }

    // 3. Check Quiet Hours (Critical alerts can bypass if allowCritical is true)
    const inQuietHours = this.isQuietHoursActive(preferences);
    if (inQuietHours) {
      const isCriticalBypass = action.severity === 'CRITICAL' && preferences.quietHours.allowCritical;
      if (!isCriticalBypass) {
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SKIPPED_QUIET_HOURS',
          detail: 'Quiet hours currently active.',
        };
      }
    }

    // 4. Dispatch based on Action Type
    switch (action.type) {
      case 'SEND_NOTIFICATION': {
        // Check rate limiting
        const isRateLimited = this.checkRateLimit(rule.userId, preferences);
        if (isRateLimited) {
          return {
            actionId: action.id,
            actionType: action.type,
            status: 'SKIPPED_RATE_LIMIT',
            detail: 'Exceeded maximum notifications per minute limit.',
          };
        }

        // Format message
        const title = this.interpolateTemplate(action.title, {
          account: targetAccount,
          trade: tradeToActOn,
          actualValue: conditionSnapshot.actualValue,
          thresholdValue: conditionSnapshot.thresholdValue,
        });

        const message = this.interpolateTemplate(action.messageTemplate, {
          account: targetAccount,
          trade: tradeToActOn,
          actualValue: conditionSnapshot.actualValue,
          thresholdValue: conditionSnapshot.thresholdValue,
        });

        const notifyType: 'success' | 'error' | 'warning' | 'info' =
          action.severity === 'CRITICAL'
            ? 'error'
            : action.severity === 'WARNING'
            ? 'warning'
            : action.severity === 'SUCCESS'
            ? 'success'
            : 'info';

        if (callbacks.notify && preferences.enabled) {
          callbacks.notify(notifyType, title, message);
        }

        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SUCCESS',
          detail: `Notification sent: "${title}"`,
        };
      }

      case 'AUTO_TAG_TRADE': {
        if (tradeToActOn && action.tagsToAdd && action.tagsToAdd.length > 0 && callbacks.updateTrade) {
          const existingTags = tradeToActOn.tags || [];
          const newTags = Array.from(new Set([...existingTags, ...action.tagsToAdd]));
          await callbacks.updateTrade(tradeToActOn.id, { tags: newTags });

          return {
            actionId: action.id,
            actionType: action.type,
            status: 'SUCCESS',
            detail: `Attached tags: ${action.tagsToAdd.join(', ')} to trade #${tradeToActOn.id.substring(0, 6)}`,
          };
        }
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SKIPPED_PREFERENCE',
          detail: 'No target trade available for auto-tagging.',
        };
      }

      case 'AUTO_CATEGORIZE_TRADE': {
        if (tradeToActOn && callbacks.updateTrade) {
          const updates: Partial<Trade> = {};
          if (action.strategyId) updates.strategyId = action.strategyId;
          if (action.playbookId) updates.playbookId = action.playbookId;
          if (action.setupName) updates.setupName = action.setupName;

          await callbacks.updateTrade(tradeToActOn.id, updates);
          return {
            actionId: action.id,
            actionType: action.type,
            status: 'SUCCESS',
            detail: `Categorized trade to setup: ${action.setupName || action.strategyId}`,
          };
        }
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SKIPPED_PREFERENCE',
          detail: 'No target trade available for categorization.',
        };
      }

      case 'TRIGGER_REPORT_GENERATION': {
        if (callbacks.triggerReport) {
          callbacks.triggerReport(action.reportType || 'WEEKLY', action.reportFormat || 'PDF');
        }
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SUCCESS',
          detail: `Queued ${action.reportType} report generation`,
        };
      }

      case 'TRIGGER_AI_REVIEW': {
        if (callbacks.triggerAIReview) {
          callbacks.triggerAIReview(action.aiReviewType || 'MISTAKE_ANALYSIS', tradeToActOn || undefined);
        }
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SUCCESS',
          detail: `Triggered AI ${action.aiReviewType} workflow`,
        };
      }

      case 'LOCKOUT_WARNING': {
        if (callbacks.notify) {
          callbacks.notify('error', 'Discipline Lockout Initiated', action.messageTemplate);
        }
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SUCCESS',
          detail: `Cooling-off lockout triggered (${action.lockoutDurationMinutes || 30}m)`,
        };
      }

      default:
        return {
          actionId: action.id,
          actionType: action.type,
          status: 'SUCCESS',
          detail: 'Action processed',
        };
    }
  }

  /**
   * Evaluates a single rule and executes its actions if triggered
   */
  static async evaluateRule(
    rule: AutomationRule,
    context: AutomationEvaluationContext,
    preferences: NotificationPreferences,
    callbacks: AutomationExecutionCallbacks
  ): Promise<AutomationExecutionLog | null> {
    if (!rule.isEnabled) return null;

    // Check Trigger Event Filter
    if (rule.triggerEvents && rule.triggerEvents.length > 0 && !rule.triggerEvents.includes(context.event)) {
      return null;
    }

    // Check Account Scope Filter
    if (rule.accountScope !== 'ALL' && context.targetAccount) {
      if (!rule.accountScope.includes(context.targetAccount.id)) {
        return null;
      }
    }

    // Evaluate Condition
    const conditionResult = this.evaluateCondition(rule.condition, context);
    if (!conditionResult.matched) {
      return null;
    }

    // Check Rule Cooldown (prevents repeat firings within rule.cooldownMinutes)
    const now = Date.now();
    const lastTriggered = rule.lastTriggeredAt ? new Date(rule.lastTriggeredAt).getTime() : 0;
    const cooldownMs = (rule.cooldownMinutes || 5) * 60 * 1000;

    if (now - lastTriggered < cooldownMs) {
      // Cooldown active, skip duplicate execution
      return null;
    }

    // Execute Actions
    const executedActions: AutomationExecutionDetail[] = [];
    for (const action of rule.actions) {
      try {
        const detail = await this.executeAction(
          action,
          rule,
          context,
          preferences,
          callbacks,
          conditionResult
        );
        executedActions.push(detail);
      } catch (err: any) {
        executedActions.push({
          actionId: action.id,
          actionType: action.type,
          status: 'FAILED',
          detail: err?.message || 'Action failed during execution',
        });
      }
    }

    // Determine highest severity
    const primarySeverity = rule.actions[0]?.severity || 'INFO';

    // Build Execution Log
    const log: AutomationExecutionLog = {
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      userId: rule.userId,
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      triggerEvent: context.event,
      accountId: context.targetAccount?.id,
      accountName: context.targetAccount?.name,
      tradeId: context.targetTrade?.id,
      instrument: context.targetTrade?.instrument,
      conditionSnapshot: {
        conditionType: rule.condition.type,
        evaluatedMetric: conditionResult.evaluatedMetric,
        actualValue: conditionResult.actualValue,
        thresholdValue: conditionResult.thresholdValue,
        matched: true,
      },
      actionsExecuted: executedActions,
      severity: primarySeverity,
      triggeredAt: new Date().toISOString(),
      status: executedActions.some((a) => a.status === 'SUCCESS') ? 'SUCCESS' : 'SKIPPED',
    };

    // Update Rule State
    rule.lastTriggeredAt = new Date().toISOString();
    rule.lastTriggerResult = `Triggered: ${conditionResult.evaluatedMetric} = ${conditionResult.actualValue}`;
    rule.triggerCount = (rule.triggerCount || 0) + 1;
    AutomationRepository.saveRule(rule.userId, rule);

    // Save Log
    AutomationRepository.logExecution(rule.userId, log);

    return log;
  }

  /**
   * Evaluates all active automation rules for a given event and context
   */
  static async evaluateAllRules(
    userId: string,
    context: AutomationEvaluationContext,
    callbacks: AutomationExecutionCallbacks
  ): Promise<AutomationExecutionLog[]> {
    const rules = AutomationRepository.getRules(userId);
    const preferences = AutomationRepository.getPreferences(userId);
    const logs: AutomationExecutionLog[] = [];

    for (const rule of rules) {
      if (!rule.isEnabled) continue;
      const log = await this.evaluateRule(rule, context, preferences, callbacks);
      if (log) {
        logs.push(log);
      }
    }

    return logs;
  }
}
