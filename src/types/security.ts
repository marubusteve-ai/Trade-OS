/**
 * TradeOS Security, Tenant Isolation, and Audit Trail Types
 * 
 * Defines schemas for role-based access control, security policies, 
 * audit event tracking, session verification, and data sanitization.
 */

export type UserRole = 'TRADER' | 'RISK_MANAGER' | 'ADMIN' | 'READONLY_AUDITOR';

export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_FAILED_ATTEMPT'
  | 'TRADE_CREATE'
  | 'TRADE_UPDATE'
  | 'TRADE_DELETE'
  | 'TRADE_DUPLICATE'
  | 'ACCOUNT_CREATE'
  | 'ACCOUNT_UPDATE'
  | 'ACCOUNT_DELETE'
  | 'ACCOUNT_BALANCE_ADJUST'
  | 'RULE_BREACH'
  | 'PROP_EVALUATION'
  | 'IMPORT_EXECUTE'
  | 'EXPORT_EXECUTE'
  | 'WORKSPACE_SAVE'
  | 'SECURITY_POLICY_UPDATE'
  | 'INTEGRATION_CONNECT'
  | 'INTEGRATION_DISCONNECT'
  | 'INTEGRATION_CONFIG_UPDATE';

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'SECURITY';

export interface AuditLogEntry {
  id: string;
  userId: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;
  actor: string;
  entityType: 'TRADE' | 'ACCOUNT' | 'STRATEGY' | 'PLAYBOOK' | 'PROP_FIRM' | 'IMPORT' | 'WORKSPACE' | 'SYSTEM' | 'INTEGRATION';
  entityId?: string;
  summary: string;
  details?: Record<string, any>;
  previousState?: any;
  newState?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface SecuritySession {
  sessionId: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
  isLocked: boolean;
  mfaVerified?: boolean;
}

export interface SecurityPolicyConfig {
  maxFailedLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  requireStrongPasswords: boolean;
  enableAuditLogging: boolean;
  preventCrossUserAccess: boolean;
  sanitizeHtmlInputs: boolean;
}

export interface DataIntegrityReport {
  timestamp: string;
  totalRecordsChecked: number;
  orphanedRecordsFound: number;
  tenantMismatchesFound: number;
  calculationDiscrepancies: number;
  passed: boolean;
  issues: string[];
}
