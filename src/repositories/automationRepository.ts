/**
 * Automation & Notification Repository
 * 
 * Manages persistent storage for Automation Rules, Notification Preferences,
 * and Execution Audit Logs partitioned by user and workspace.
 */

import { LocalDatabase } from './localDatabase';
import {
  AutomationRule,
  NotificationPreferences,
  AutomationExecutionLog,
  AutomationCategory,
} from '../types/automation';

export class AutomationRepository {
  private static readonly RULES_COLLECTION = 'automation_rules';
  private static readonly PREFERENCES_COLLECTION = 'notification_preferences';
  private static readonly LOGS_COLLECTION = 'automation_logs';

  /**
   * Returns default notification preferences for a new user
   */
  static getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      enabled: true,
      soundEnabled: true,
      inAppToast: true,
      notificationCenter: true,
      minimumSeverity: 'INFO',
      categorySubscriptions: {
        RISK: true,
        DAILY_LOSS: true,
        DRAWDOWN: true,
        PROP_FIRM: true,
        GOALS: true,
        JOURNAL: true,
        AI_REVIEW: true,
        RECURRING: true,
        AUTO_TAGGING: true,
        AUTO_CATEGORIZATION: true,
        REPORT_TRIGGER: true,
      },
      accountScope: 'ALL',
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '07:00',
        allowCritical: true, // Allow critical risk / prop breaches through quiet hours
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      },
      rateLimiting: {
        maxPerMinute: 6,
        cooldownPeriodSeconds: 60,
        deduplicateSimilarMinutes: 30,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Initializes standard institutional default automation rules
   */
  static getDefaultRules(userId: string): AutomationRule[] {
    const now = new Date().toISOString();
    return [
      {
        id: 'rule_risk_trade_limit',
        userId,
        name: 'Single Trade Risk Ceiling Warning',
        description: 'WHEN a trade is logged with planned risk exceeding 2.0% of balance THEN dispatch a Critical Risk Warning notification.',
        category: 'RISK',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CREATED', 'ON_TRADE_UPDATED'],
        condition: {
          type: 'RISK_PER_TRADE_EXCEEDED',
          operator: 'GREATER_THAN',
          field: 'plannedRiskPercent',
          value: 2.0,
        },
        actions: [
          {
            id: 'act_risk_warn',
            type: 'SEND_NOTIFICATION',
            title: 'Risk Policy Threshold Exceeded',
            messageTemplate: 'Trade on {instrument} was opened with {plannedRiskPercent}% risk, surpassing your institutional 2.0% limit.',
            severity: 'CRITICAL',
          },
          {
            id: 'act_risk_tag',
            type: 'AUTO_TAG_TRADE',
            title: 'Tag Over-Risk',
            messageTemplate: 'Tagged trade with Overleveraged',
            severity: 'WARNING',
            tagsToAdd: ['Overleveraged', 'High Risk'],
          },
        ],
        cooldownMinutes: 5,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_daily_loss_budget',
        userId,
        name: 'Daily Loss 75% Budget Warning',
        description: 'WHEN realized or floating daily loss crosses 75% of your daily loss limit THEN send a Warning notification to protect equity.',
        category: 'DAILY_LOSS',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED', 'ON_METRICS_CALCULATED'],
        condition: {
          type: 'DAILY_LOSS_EXCEEDED',
          operator: 'GREATER_EQUAL',
          field: 'dailyLossPercent',
          value: 75.0, // 75% of allowed daily loss consumed
        },
        actions: [
          {
            id: 'act_daily_loss_warn',
            type: 'SEND_NOTIFICATION',
            title: 'Daily Loss Limit Approaching (75% Consumed)',
            messageTemplate: 'Account {accountName} has consumed 75% of its daily drawdown allowance (${actualValue}). Consider closing terminal for the day.',
            severity: 'WARNING',
          },
        ],
        cooldownMinutes: 30,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_drawdown_monitor',
        userId,
        name: 'Peak Drawdown 5.0% Guardrail',
        description: 'WHEN high-water mark drawdown reaches 5.0% THEN notify and recommend risk budget downsizing.',
        category: 'DRAWDOWN',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED', 'ON_METRICS_CALCULATED'],
        condition: {
          type: 'DRAWDOWN_EXCEEDED',
          operator: 'GREATER_EQUAL',
          field: 'maxDrawdownPercent',
          value: 5.0,
        },
        actions: [
          {
            id: 'act_drawdown_warn',
            type: 'SEND_NOTIFICATION',
            title: 'Account Drawdown Guardrail Breached',
            messageTemplate: 'Drawdown has reached {actualValue}%. Automated risk engine recommends sizing down to 0.5% per trade.',
            severity: 'CRITICAL',
          },
        ],
        cooldownMinutes: 60,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_prop_firm_buffer',
        userId,
        name: 'Prop Firm Trailing DD 80% Proximity Alert',
        description: 'WHEN account equity comes within 20% buffer of maximum prop firm trailing drawdown threshold THEN trigger immediate alert.',
        category: 'PROP_FIRM',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED', 'ON_METRICS_CALCULATED'],
        condition: {
          type: 'PROP_FIRM_LIMIT_WARNING',
          operator: 'GREATER_EQUAL',
          field: 'trailingDrawdownProximityPercent',
          value: 80.0,
        },
        actions: [
          {
            id: 'act_prop_alert',
            type: 'SEND_NOTIFICATION',
            title: 'Prop Firm Rule Warning: Trailing Drawdown Near Limit',
            messageTemplate: 'Account {accountName} is at {actualValue}% of maximum trailing stop distance. Stop trading immediately to preserve evaluation pass status.',
            severity: 'CRITICAL',
          },
        ],
        cooldownMinutes: 30,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_tilt_consecutive_losses',
        userId,
        name: 'Tilt Circuit Breaker: 3 Consecutive Losses',
        description: 'WHEN 3 consecutive losses occur in a single session THEN suggest cooling off and prompt an AI Mistake Diagnostic.',
        category: 'AI_REVIEW',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED'],
        condition: {
          type: 'CONSECUTIVE_LOSSES_EXCEEDED',
          operator: 'GREATER_EQUAL',
          field: 'consecutiveLosses',
          value: 3,
        },
        actions: [
          {
            id: 'act_tilt_notice',
            type: 'SEND_NOTIFICATION',
            title: 'Tilt Risk Alert: 3 Consecutive Stop-Outs',
            messageTemplate: '3 losses in succession detected. Take a 30-minute mental reset before executing any subsequent setups.',
            severity: 'WARNING',
          },
          {
            id: 'act_tilt_ai_trigger',
            type: 'TRIGGER_AI_REVIEW',
            title: 'Launch Mistake Diagnostic',
            messageTemplate: 'Triggered AI Mistake Analysis',
            severity: 'INFO',
            aiReviewType: 'MISTAKE_ANALYSIS',
          },
        ],
        cooldownMinutes: 45,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_journal_missing_notes',
        userId,
        name: 'Post-Trade Journal Completion Reminder',
        description: 'WHEN a trade is closed without post-trade notes or emotions logged THEN dispatch a gentle journal reminder.',
        category: 'JOURNAL',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED'],
        condition: {
          type: 'UNFILLED_JOURNAL_LOGS',
          operator: 'EQUALS',
          field: 'isJournalComplete',
          value: false,
        },
        actions: [
          {
            id: 'act_journal_prompt',
            type: 'SEND_NOTIFICATION',
            title: 'Trade Journal Incomplete',
            messageTemplate: 'Trade #{tradeId} on {instrument} was closed without notes or mistake categorization. Complete your review while memory is fresh.',
            severity: 'INFO',
          },
        ],
        cooldownMinutes: 15,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_auto_tag_runner',
        userId,
        name: 'Auto-Tag 3R+ High Multiplier Trades',
        description: 'WHEN a trade reaches an achieved R-Multiple >= 3.0R THEN automatically attach "3R+ Runner" and "A+ Execution" tags.',
        category: 'AUTO_TAGGING',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED', 'ON_TRADE_CREATED'],
        condition: {
          type: 'TRADE_ATTRIBUTE_MATCH',
          operator: 'GREATER_EQUAL',
          field: 'achievedRMultiple',
          value: 3.0,
        },
        actions: [
          {
            id: 'act_tag_runner',
            type: 'AUTO_TAG_TRADE',
            title: 'Tag High-R Trade',
            messageTemplate: 'Auto-tagged with 3R+ Runner & A+ Execution',
            severity: 'SUCCESS',
            tagsToAdd: ['3R+ Runner', 'A+ Execution'],
          },
          {
            id: 'act_runner_notify',
            type: 'SEND_NOTIFICATION',
            title: 'Target Multiplier Reached (+{achievedRMultiple}R)',
            messageTemplate: 'Great execution on {instrument}! Trade closed with +{achievedRMultiple}R achieved gain.',
            severity: 'SUCCESS',
          },
        ],
        cooldownMinutes: 1,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_auto_categorize_futures',
        userId,
        name: 'Auto-Categorize Index Futures (NQ/ES/YM/RTY)',
        description: 'WHEN trade instrument contains NQ, ES, YM, or RTY THEN automatically assign Setup to "Index Futures Momentum".',
        category: 'AUTO_CATEGORIZATION',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CREATED'],
        condition: {
          type: 'TRADE_ATTRIBUTE_MATCH',
          operator: 'CONTAINS',
          field: 'instrument',
          value: 'NQ,ES,YM,RTY',
        },
        actions: [
          {
            id: 'act_categorize_futures',
            type: 'AUTO_CATEGORIZE_TRADE',
            title: 'Assign Index Futures Setup',
            messageTemplate: 'Assigned setup name "Index Futures Momentum"',
            severity: 'INFO',
            setupName: 'Index Futures Momentum',
          },
        ],
        cooldownMinutes: 1,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_report_trigger_weekly',
        userId,
        name: 'End-of-Week Retrospective & Report Trigger',
        description: 'WHEN weekly trading closes or 10 trades are completed in a cycle THEN generate a Weekly Performance Statement.',
        category: 'REPORT_TRIGGER',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_METRICS_CALCULATED'],
        condition: {
          type: 'RECURRING_SCHEDULE',
          operator: 'GREATER_EQUAL',
          field: 'weeklyTradeCount',
          value: 10,
        },
        actions: [
          {
            id: 'act_gen_report',
            type: 'TRIGGER_REPORT_GENERATION',
            title: 'Generate Weekly Statement',
            messageTemplate: 'Triggered Weekly Performance Report generation.',
            severity: 'INFO',
            reportType: 'WEEKLY',
            reportFormat: 'PDF',
          },
          {
            id: 'act_report_notify',
            type: 'SEND_NOTIFICATION',
            title: 'Weekly Performance Report Ready',
            messageTemplate: 'Your automated weekly report has been assembled and is available in Reports & Statements.',
            severity: 'INFO',
          },
        ],
        cooldownMinutes: 1440, // Once every 24 hours
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'rule_goal_consistency_check',
        userId,
        name: 'Account Goal Pace & Discipline Tracker',
        description: 'WHEN rule adherence score falls below 80% THEN dispatch a goal reminder to protect long-term account compounding.',
        category: 'GOALS',
        isEnabled: true,
        accountScope: 'ALL',
        triggerEvents: ['ON_TRADE_CLOSED', 'ON_METRICS_CALCULATED'],
        condition: {
          type: 'GOAL_PROGRESS_BEHIND',
          operator: 'LESS_THAN',
          field: 'disciplineScore',
          value: 80,
        },
        actions: [
          {
            id: 'act_goal_remind',
            type: 'SEND_NOTIFICATION',
            title: 'Discipline Score Below Target (80%)',
            messageTemplate: 'Recent execution compliance is at {actualValue}%. Re-align with your playbook criteria to stay on track for monthly milestones.',
            severity: 'WARNING',
          },
        ],
        cooldownMinutes: 60,
        triggerCount: 0,
        isSystemDefault: true,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  // --- Rule Operations ---

  static getRules(userId: string): AutomationRule[] {
    let rules = LocalDatabase.getItems<AutomationRule>(userId, this.RULES_COLLECTION);
    if (!rules || rules.length === 0) {
      rules = this.getDefaultRules(userId);
      LocalDatabase.saveItems(userId, this.RULES_COLLECTION, rules);
    }
    return rules;
  }

  static getRuleById(userId: string, ruleId: string): AutomationRule | null {
    const rules = this.getRules(userId);
    return rules.find((r) => r.id === ruleId) || null;
  }

  static saveRule(userId: string, rule: AutomationRule): AutomationRule {
    const rules = this.getRules(userId);
    const existingIndex = rules.findIndex((r) => r.id === rule.id);
    const updatedRule = {
      ...rule,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      rules[existingIndex] = updatedRule;
    } else {
      rules.unshift(updatedRule);
    }

    LocalDatabase.saveItems(userId, this.RULES_COLLECTION, rules);
    return updatedRule;
  }

  static toggleRule(userId: string, ruleId: string): AutomationRule | null {
    const rules = this.getRules(userId);
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return null;

    rule.isEnabled = !rule.isEnabled;
    rule.updatedAt = new Date().toISOString();
    LocalDatabase.saveItems(userId, this.RULES_COLLECTION, rules);
    return rule;
  }

  static deleteRule(userId: string, ruleId: string): boolean {
    const rules = this.getRules(userId);
    const filtered = rules.filter((r) => r.id !== ruleId);
    if (filtered.length !== rules.length) {
      LocalDatabase.saveItems(userId, this.RULES_COLLECTION, filtered);
      return true;
    }
    return false;
  }

  static resetToDefaultRules(userId: string): AutomationRule[] {
    const defaults = this.getDefaultRules(userId);
    LocalDatabase.saveItems(userId, this.RULES_COLLECTION, defaults);
    return defaults;
  }

  // --- Notification Preferences ---

  static getPreferences(userId: string): NotificationPreferences {
    const prefs = LocalDatabase.getItems<NotificationPreferences>(userId, this.PREFERENCES_COLLECTION);
    if (!prefs || prefs.length === 0) {
      const defaultPrefs = this.getDefaultPreferences(userId);
      LocalDatabase.saveItems(userId, this.PREFERENCES_COLLECTION, [defaultPrefs]);
      return defaultPrefs;
    }
    return prefs[0];
  }

  static savePreferences(userId: string, updates: Partial<NotificationPreferences>): NotificationPreferences {
    const current = this.getPreferences(userId);
    const merged: NotificationPreferences = {
      ...current,
      ...updates,
      userId,
      updatedAt: new Date().toISOString(),
    };
    LocalDatabase.saveItems(userId, this.PREFERENCES_COLLECTION, [merged]);
    return merged;
  }

  // --- Audit Execution Logs ---

  static getExecutionLogs(userId: string, limit = 100): AutomationExecutionLog[] {
    const logs = LocalDatabase.getItems<AutomationExecutionLog>(userId, this.LOGS_COLLECTION);
    return logs.sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()).slice(0, limit);
  }

  static logExecution(userId: string, log: AutomationExecutionLog): void {
    const logs = LocalDatabase.getItems<AutomationExecutionLog>(userId, this.LOGS_COLLECTION);
    const updatedLogs = [log, ...logs].slice(0, 200); // Retain last 200 execution logs
    LocalDatabase.saveItems(userId, this.LOGS_COLLECTION, updatedLogs);
  }

  static clearExecutionLogs(userId: string): void {
    LocalDatabase.saveItems(userId, this.LOGS_COLLECTION, []);
  }
}
