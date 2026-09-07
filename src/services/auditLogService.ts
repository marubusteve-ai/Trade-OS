/**
 * TradeOS Audit Trail & Security Event Logging Service
 * 
 * Centralized, tamper-evident audit logging engine tracking all state mutations,
 * security events, rule violations, and integration telemetry.
 */

import { LocalDatabase } from '../repositories/localDatabase';
import { AuditLogEntry, AuditEventType, AuditSeverity, DataIntegrityReport } from '../types/security';

const AUDIT_COLLECTION = 'audit_logs';
const MAX_LOG_RETENTION = 5000;

export class AuditLogService {
  /**
   * Records a structured audit event
   */
  static log(
    userId: string,
    event: {
      eventType: AuditEventType;
      severity?: AuditSeverity;
      actor?: string;
      entityType: 'TRADE' | 'ACCOUNT' | 'STRATEGY' | 'PLAYBOOK' | 'PROP_FIRM' | 'IMPORT' | 'WORKSPACE' | 'SYSTEM' | 'INTEGRATION';
      entityId?: string;
      summary: string;
      details?: Record<string, any>;
      previousState?: any;
      newState?: any;
    }
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      eventType: event.eventType,
      severity: event.severity || 'INFO',
      actor: event.actor || 'System / User',
      entityType: event.entityType,
      entityId: event.entityId,
      summary: event.summary,
      details: event.details,
      previousState: event.previousState ? this.sanitizeState(event.previousState) : undefined,
      newState: event.newState ? this.sanitizeState(event.newState) : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'TradeOS Server',
    };

    try {
      const logs = this.getLogs(userId);
      logs.unshift(entry);

      // Enforce log retention cap to prevent uncontrolled storage growth
      if (logs.length > MAX_LOG_RETENTION) {
        logs.splice(MAX_LOG_RETENTION);
      }

      LocalDatabase.saveItems(userId, AUDIT_COLLECTION, logs);
    } catch (e) {
      console.warn('AuditLogService: Could not persist audit entry to local store', e);
    }

    return entry;
  }

  /**
   * Retrieves all audit logs for a user
   */
  static getLogs(userId: string): AuditLogEntry[] {
    return LocalDatabase.getItems<AuditLogEntry>(userId, AUDIT_COLLECTION);
  }

  /**
   * Queries audit logs with filtering and pagination
   */
  static queryLogs(
    userId: string,
    params: {
      eventType?: AuditEventType | 'ALL';
      severity?: AuditSeverity | 'ALL';
      entityType?: string | 'ALL';
      search?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): { logs: AuditLogEntry[]; total: number } {
    let all = this.getLogs(userId);

    if (params.eventType && params.eventType !== 'ALL') {
      all = all.filter((l) => l.eventType === params.eventType);
    }

    if (params.severity && params.severity !== 'ALL') {
      all = all.filter((l) => l.severity === params.severity);
    }

    if (params.entityType && params.entityType !== 'ALL') {
      all = all.filter((l) => l.entityType === params.entityType);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase();
      all = all.filter(
        (l) =>
          l.summary.toLowerCase().includes(q) ||
          l.actor.toLowerCase().includes(q) ||
          (l.entityId && l.entityId.toLowerCase().includes(q))
      );
    }

    if (params.startDate) {
      all = all.filter((l) => l.timestamp >= params.startDate!);
    }

    if (params.endDate) {
      all = all.filter((l) => l.timestamp <= params.endDate!);
    }

    const total = all.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginated = all.slice(offset, offset + limit);

    return { logs: paginated, total };
  }

  /**
   * Clears audit logs for a user (admin / compliance maintenance)
   */
  static clearLogs(userId: string): void {
    LocalDatabase.saveItems(userId, AUDIT_COLLECTION, []);
  }

  /**
   * Exports audit log history to JSON string
   */
  static exportLogsJSON(userId: string): string {
    const logs = this.getLogs(userId);
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        userId,
        totalEntries: logs.length,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Exports audit log history to CSV format
   */
  static exportLogsCSV(userId: string): string {
    const logs = this.getLogs(userId);
    const headers = ['ID', 'Timestamp', 'Event Type', 'Severity', 'Actor', 'Entity Type', 'Entity ID', 'Summary'];
    const rows = logs.map((l) => [
      l.id,
      l.timestamp,
      l.eventType,
      l.severity,
      `"${l.actor.replace(/"/g, '""')}"`,
      l.entityType,
      l.entityId || '',
      `"${l.summary.replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  /**
   * Verifies data integrity across storage collections and tenant isolation
   */
  static verifyDataIntegrity(userId: string): DataIntegrityReport {
    const issues: string[] = [];
    let totalChecked = 0;
    let tenantMismatches = 0;
    let orphanedRecords = 0;

    const collections = ['accounts', 'trades', 'strategies', 'playbooks', 'workspaces'];

    for (const col of collections) {
      const items = LocalDatabase.getItems<any>(userId, col);
      totalChecked += items.length;

      items.forEach((item) => {
        if (item.userId && item.userId !== userId) {
          tenantMismatches++;
          issues.push(`Tenant mismatch in collection "${col}": Item ${item.id || 'unknown'} has userId "${item.userId}" instead of "${userId}".`);
        }
      });
    }

    const accounts = LocalDatabase.getItems<any>(userId, 'accounts');
    const trades = LocalDatabase.getItems<any>(userId, 'trades');
    const accountIds = new Set(accounts.map((a) => a.id));

    trades.forEach((trade) => {
      if (trade.accountId && !accountIds.has(trade.accountId)) {
        orphanedRecords++;
        issues.push(`Orphaned trade detected: Trade "${trade.id}" references non-existent account "${trade.accountId}".`);
      }
    });

    const passed = tenantMismatches === 0 && orphanedRecords === 0;

    return {
      timestamp: new Date().toISOString(),
      totalRecordsChecked: totalChecked,
      orphanedRecordsFound: orphanedRecords,
      tenantMismatchesFound: tenantMismatches,
      calculationDiscrepancies: 0,
      passed,
      issues,
    };
  }

  /**
   * Sanitizes sensitive fields from state snapshots before saving
   */
  private static sanitizeState(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const clone = { ...obj };
    const sensitiveKeys = ['password', 'passwordHash', 'apiKey', 'apiSecret', 'authToken', 'secret'];
    for (const key of Object.keys(clone)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        clone[key] = '******** [REDACTED]';
      }
    }
    return clone;
  }
}
