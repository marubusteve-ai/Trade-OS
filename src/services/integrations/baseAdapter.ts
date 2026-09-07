/**
 * Base Abstract Integration Adapter
 * 
 * Provides standard lifecycle management, state machine transitions, 
 * health check monitoring, and telemetry logging for all external service bridges.
 */

import {
  IntegrationConfig,
  IntegrationProviderId,
  IntegrationCategory,
  ConnectionStatus,
  ConnectionHealthCheckResult,
} from '../../types/integrations';
import { AuditLogService } from '../auditLogService';

export abstract class BaseAdapter {
  abstract readonly providerId: IntegrationProviderId;
  abstract readonly name: string;
  abstract readonly category: IntegrationCategory;

  protected config: IntegrationConfig | null = null;
  protected status: ConnectionStatus = 'DISCONNECTED';
  protected lastLatencyMs: number = 0;

  async initialize(config: IntegrationConfig): Promise<void> {
    this.config = config;
    if (!config.enabled) {
      this.status = 'DISCONNECTED';
    } else if (!this.hasRequiredCredentials(config)) {
      this.status = 'CONFIG_REQUIRED';
    } else {
      this.status = config.status || 'DISCONNECTED';
    }
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  getConfig(): IntegrationConfig | null {
    return this.config;
  }

  abstract hasRequiredCredentials(config: IntegrationConfig): boolean;

  abstract connect(): Promise<ConnectionHealthCheckResult>;

  abstract disconnect(): Promise<void>;

  abstract testConnection(): Promise<ConnectionHealthCheckResult>;

  protected logAuditEvent(
    userId: string,
    eventType: 'INTEGRATION_CONNECT' | 'INTEGRATION_DISCONNECT' | 'INTEGRATION_CONFIG_UPDATE',
    summary: string,
    details?: Record<string, any>
  ): void {
    AuditLogService.log(userId, {
      eventType,
      severity: eventType === 'INTEGRATION_CONNECT' ? 'INFO' : 'WARNING',
      actor: this.name,
      entityType: 'INTEGRATION',
      entityId: this.providerId,
      summary,
      details,
    });
  }
}
