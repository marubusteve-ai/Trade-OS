/**
 * TradeOS Automation & Notification Architecture Domain Types
 * 
 * Configurable "WHEN condition IS TRUE THEN action" engine contracts.
 * Enforces risk alerts, daily-loss warnings, drawdown monitors, prop-firm compliance buffers,
 * goal reminders, journal prompts, AI review schedules, auto-tagging, auto-categorization,
 * and report-generation triggers.
 */

import { Account, Trade } from './domain';
import { FinancialMetrics, DrawdownStats } from './calculations';
import { RiskPolicy, RiskBudgets } from './risk';
import { PropFirmEvaluationResult } from './propFirm';
import { AIReviewType } from './ai';
import { ReportType } from './reports';

export type ReportFormat = 'PDF' | 'CSV' | 'JSON' | 'HTML' | 'EXCEL';

export type AutomationCategory =
  | 'RISK'
  | 'DAILY_LOSS'
  | 'DRAWDOWN'
  | 'PROP_FIRM'
  | 'GOALS'
  | 'JOURNAL'
  | 'AI_REVIEW'
  | 'RECURRING'
  | 'AUTO_TAGGING'
  | 'AUTO_CATEGORIZATION'
  | 'REPORT_TRIGGER';

export type AutomationTriggerEvent =
  | 'ON_TRADE_CREATED'
  | 'ON_TRADE_UPDATED'
  | 'ON_TRADE_CLOSED'
  | 'ON_METRICS_CALCULATED'
  | 'ON_SCHEDULED_TICK'
  | 'MANUAL_EVALUATION';

export type AutomationConditionType =
  | 'DAILY_LOSS_EXCEEDED'
  | 'DRAWDOWN_EXCEEDED'
  | 'RISK_PER_TRADE_EXCEEDED'
  | 'PROP_FIRM_LIMIT_WARNING'
  | 'CONSECUTIVE_LOSSES_EXCEEDED'
  | 'OPEN_EXPOSURE_EXCEEDED'
  | 'UNFILLED_JOURNAL_LOGS'
  | 'GOAL_PROGRESS_BEHIND'
  | 'AI_REVIEW_PENDING'
  | 'RECURRING_SCHEDULE'
  | 'TRADE_ATTRIBUTE_MATCH'
  | 'CUSTOM_EXPRESSION';

export type AutomationActionType =
  | 'SEND_NOTIFICATION'
  | 'AUTO_TAG_TRADE'
  | 'AUTO_CATEGORIZE_TRADE'
  | 'TRIGGER_REPORT_GENERATION'
  | 'TRIGGER_AI_REVIEW'
  | 'LOCKOUT_WARNING'
  | 'SET_ACCOUNT_STATUS';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';

export interface AutomationCondition {
  type: AutomationConditionType;
  operator: 'GREATER_THAN' | 'GREATER_EQUAL' | 'LESS_THAN' | 'LESS_EQUAL' | 'EQUALS' | 'CONTAINS' | 'BETWEEN';
  field?: string; // e.g., 'dailyLossPercent', 'drawdownPercent', 'achievedRMultiple', 'holdingTimeMinutes'
  value: number | string | boolean;
  secondaryValue?: number | string; // For BETWEEN operators
  timeWindowHours?: number;
  params?: Record<string, any>;
}

export interface AutomationAction {
  id: string;
  type: AutomationActionType;
  title: string;
  messageTemplate: string;
  severity: NotificationSeverity;
  // Action specific payloads:
  tagsToAdd?: string[];
  strategyId?: string;
  playbookId?: string;
  mistakeTag?: string;
  setupName?: string;
  reportType?: ReportType;
  reportFormat?: ReportFormat;
  aiReviewType?: AIReviewType;
  lockoutDurationMinutes?: number;
  targetAccountStatus?: 'ACTIVE' | 'RESTRICTED' | 'ARCHIVED';
}

export interface AutomationRule {
  id: string;
  userId: string;
  workspaceId?: string;
  name: string;
  description: string;
  category: AutomationCategory;
  isEnabled: boolean;
  accountScope: 'ALL' | string[]; // 'ALL' or specific account IDs
  triggerEvents: AutomationTriggerEvent[];
  condition: AutomationCondition;
  actions: AutomationAction[];
  cooldownMinutes: number; // Anti-fatigue cooldown timer
  lastTriggeredAt?: string;
  lastTriggerResult?: string;
  triggerCount: number;
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuietHoursConfig {
  enabled: boolean;
  startTime: string; // "22:00"
  endTime: string;   // "07:00"
  allowCritical: boolean; // Bypass quiet hours for critical risk/prop firm limit breaches
  timezone: string;
}

export interface RateLimitingConfig {
  maxPerMinute: number;
  cooldownPeriodSeconds: number;
  deduplicateSimilarMinutes: number;
}

export interface NotificationPreferences {
  userId: string;
  enabled: boolean;
  soundEnabled: boolean;
  inAppToast: boolean;
  notificationCenter: boolean;
  minimumSeverity: NotificationSeverity;
  categorySubscriptions: Record<AutomationCategory, boolean>;
  accountScope: 'ALL' | string[];
  quietHours: QuietHoursConfig;
  rateLimiting: RateLimitingConfig;
  updatedAt: string;
}

export interface AutomationExecutionDetail {
  actionId: string;
  actionType: AutomationActionType;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED_QUIET_HOURS' | 'SKIPPED_COOLDOWN' | 'SKIPPED_PREFERENCE' | 'SKIPPED_RATE_LIMIT';
  detail?: string;
}

export interface AutomationExecutionLog {
  id: string;
  userId: string;
  ruleId: string;
  ruleName: string;
  category: AutomationCategory;
  triggerEvent: AutomationTriggerEvent;
  accountId?: string;
  accountName?: string;
  tradeId?: string;
  instrument?: string;
  conditionSnapshot: {
    conditionType: AutomationConditionType;
    evaluatedMetric: string;
    actualValue: any;
    thresholdValue: any;
    matched: boolean;
  };
  actionsExecuted: AutomationExecutionDetail[];
  severity: NotificationSeverity;
  triggeredAt: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'SKIPPED';
}

export interface AutomationEvaluationContext {
  accounts: Account[];
  targetAccount?: Account | null;
  trades: Trade[];
  targetTrade?: Trade | null;
  metrics?: FinancialMetrics;
  drawdown?: DrawdownStats;
  riskBudgets?: RiskBudgets;
  riskPolicy?: RiskPolicy;
  propFirmEvaluation?: PropFirmEvaluationResult | null;
  event: AutomationTriggerEvent;
  timestamp?: string;
}
