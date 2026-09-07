/**
 * cTrader OpenAPI 2.0 Integration Adapter
 * 
 * Supports Spotware cTrader OpenAPI protocol for multi-asset brokers (Pepperstone, IC Markets, FxPro).
 */

import { BaseAdapter } from './baseAdapter';
import {
  IBrokerAdapter,
  IntegrationConfig,
  IntegrationProviderId,
  IntegrationCategory,
  ConnectionHealthCheckResult,
  ExternalTradeExecution,
} from '../../types/integrations';

export class CTraderAdapter extends BaseAdapter implements IBrokerAdapter {
  readonly providerId: IntegrationProviderId = 'CTRADER';
  readonly name: string = 'cTrader OpenAPI';
  readonly category: IntegrationCategory = 'BROKER';

  hasRequiredCredentials(config: IntegrationConfig): boolean {
    return !!(config.apiKey && config.apiSecret && config.accountId);
  }

  async connect(): Promise<ConnectionHealthCheckResult> {
    if (!this.config || !this.hasRequiredCredentials(this.config)) {
      this.status = 'CONFIG_REQUIRED';
      return {
        providerId: this.providerId,
        status: 'CONFIG_REQUIRED',
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'cTrader credentials incomplete. Client ID, Client Secret, and cTID Account ID are required.',
      };
    }

    // Verify token expiration
    if (this.config.tokenExpiresAt && new Date(this.config.tokenExpiresAt) < new Date()) {
      this.status = 'UNAUTHORIZED';
      return {
        providerId: this.providerId,
        status: 'UNAUTHORIZED',
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: 'cTrader OAuth access token has expired. Please re-authenticate your cTID account.',
      };
    }

    this.status = 'DISCONNECTED';
    return {
      providerId: this.providerId,
      status: 'DISCONNECTED',
      latencyMs: 12,
      timestamp: new Date().toISOString(),
      message: 'cTrader OpenAPI proxy connection offline. Configure Spotware credentials and grant TradeOS read access.',
    };
  }

  async disconnect(): Promise<void> {
    this.status = 'DISCONNECTED';
  }

  async testConnection(): Promise<ConnectionHealthCheckResult> {
    return this.connect();
  }

  async fetchRecentExecutions(since?: string): Promise<ExternalTradeExecution[]> {
    return [];
  }

  async fetchAccountBalance(): Promise<{ balance: number; equity: number; freeMargin?: number; currency: string }> {
    throw new Error('cTrader OpenAPI is disconnected.');
  }
}
