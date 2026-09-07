/**
 * Centralized Integration Orchestration Service
 * 
 * Manages adapter registries, configuration persistence, automated health checks,
 * sync interval dispatchers, and live connection states.
 */

import { LocalDatabase } from '../../repositories/localDatabase';
import {
  IntegrationConfig,
  IntegrationProviderId,
  ConnectionHealthCheckResult,
  ConnectionStatus,
  IBrokerAdapter,
  IEconomicCalendarProvider,
  INotificationProvider,
} from '../../types/integrations';
import { MetaTraderAdapter } from './metaTraderAdapter';
import { CTraderAdapter } from './cTraderAdapter';
import { InteractiveBrokersAdapter } from './interactiveBrokersAdapter';
import { EconomicCalendarAdapter } from './economicCalendarAdapter';
import { NotificationAdapter } from './notificationAdapter';
import { AuditLogService } from '../auditLogService';

const INTEGRATIONS_COLLECTION = 'integrations';

export class IntegrationService {
  private static adapters: Map<IntegrationProviderId, any> = new Map();

  static initializeAdapters(): void {
    if (this.adapters.size > 0) return;

    this.adapters.set('METATRADER_4', new MetaTraderAdapter('MT4'));
    this.adapters.set('METATRADER_5', new MetaTraderAdapter('MT5'));
    this.adapters.set('CTRADER', new CTraderAdapter());
    this.adapters.set('INTERACTIVE_BROKERS', new InteractiveBrokersAdapter());
    this.adapters.set('FOREX_FACTORY_CALENDAR', new EconomicCalendarAdapter());
    this.adapters.set('DISCORD_WEBHOOK', new NotificationAdapter('DISCORD_WEBHOOK'));
    this.adapters.set('SLACK_WEBHOOK', new NotificationAdapter('SLACK_WEBHOOK'));
    this.adapters.set('TELEGRAM_BOT', new NotificationAdapter('TELEGRAM_BOT'));
  }

  static getConfigs(userId: string): IntegrationConfig[] {
    const stored = LocalDatabase.getItems<IntegrationConfig>(userId, INTEGRATIONS_COLLECTION);
    if (!stored || stored.length === 0) {
      const defaults = this.getDefaultConfigs(userId);
      LocalDatabase.saveItems(userId, INTEGRATIONS_COLLECTION, defaults);
      return defaults;
    }
    return stored;
  }

  static getConfig(userId: string, providerId: IntegrationProviderId): IntegrationConfig | null {
    const configs = this.getConfigs(userId);
    return configs.find((c) => c.providerId === providerId) || null;
  }

  static saveConfig(userId: string, config: Partial<IntegrationConfig> & { providerId: IntegrationProviderId }): IntegrationConfig {
    const configs = this.getConfigs(userId);
    const index = configs.findIndex((c) => c.providerId === config.providerId);
    const now = new Date().toISOString();

    const previousConfig = index >= 0 ? configs[index] : null;

    const updated: IntegrationConfig = {
      ...(previousConfig || this.createDefaultConfig(userId, config.providerId)),
      ...config,
      userId,
      updatedAt: now,
    };

    if (index >= 0) {
      configs[index] = updated;
    } else {
      configs.push(updated);
    }

    LocalDatabase.saveItems(userId, INTEGRATIONS_COLLECTION, configs);

    AuditLogService.log(userId, {
      eventType: 'INTEGRATION_CONFIG_UPDATE',
      severity: 'INFO',
      actor: 'User',
      entityType: 'INTEGRATION',
      entityId: config.providerId,
      summary: `Updated integration settings for ${updated.name}`,
      previousState: previousConfig,
      newState: updated,
    });

    return updated;
  }

  static async testConnection(userId: string, providerId: IntegrationProviderId): Promise<ConnectionHealthCheckResult> {
    this.initializeAdapters();
    const adapter = this.adapters.get(providerId);
    const config = this.getConfig(userId, providerId);

    if (!adapter) {
      return {
        providerId,
        status: 'ERROR',
        latencyMs: 0,
        timestamp: new Date().toISOString(),
        message: `No adapter registered for provider ${providerId}`,
      };
    }

    if (config) {
      await adapter.initialize(config);
    }

    const result = await adapter.testConnection();

    // Update config status
    if (config) {
      this.saveConfig(userId, {
        providerId,
        status: result.status,
        lastConnectedAt: result.status === 'CONNECTED' ? new Date().toISOString() : config.lastConnectedAt,
        lastError: result.status !== 'CONNECTED' ? result.message : undefined,
        latencyMs: result.latencyMs,
      });
    }

    return result;
  }

  static getEconomicCalendar(): IEconomicCalendarProvider {
    this.initializeAdapters();
    return this.adapters.get('FOREX_FACTORY_CALENDAR') as IEconomicCalendarProvider;
  }

  static async broadcastNotification(
    userId: string,
    payload: { title: string; message: string; severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL' }
  ): Promise<void> {
    this.initializeAdapters();
    const configs = this.getConfigs(userId).filter((c) => c.category === 'NOTIFICATIONS' && c.enabled);

    for (const cfg of configs) {
      const adapter = this.adapters.get(cfg.providerId) as INotificationProvider;
      if (adapter) {
        await (adapter as any).initialize(cfg);
        await adapter.sendNotification(payload);
      }
    }
  }

  private static getDefaultConfigs(userId: string): IntegrationConfig[] {
    const providers: IntegrationProviderId[] = [
      'METATRADER_5',
      'METATRADER_4',
      'CTRADER',
      'INTERACTIVE_BROKERS',
      'FOREX_FACTORY_CALENDAR',
      'DISCORD_WEBHOOK',
      'SLACK_WEBHOOK',
      'TELEGRAM_BOT',
    ];

    return providers.map((p) => this.createDefaultConfig(userId, p));
  }

  private static createDefaultConfig(userId: string, providerId: IntegrationProviderId): IntegrationConfig {
    const now = new Date().toISOString();
    switch (providerId) {
      case 'METATRADER_5':
        return {
          id: `int_mt5_${userId}`,
          userId,
          providerId: 'METATRADER_5',
          name: 'MetaTrader 5 Bridge',
          category: 'BROKER',
          enabled: false,
          status: 'DISCONNECTED',
          environment: 'LIVE',
          serverHost: '127.0.0.1',
          serverPort: 5555,
          createdAt: now,
          updatedAt: now,
        };
      case 'METATRADER_4':
        return {
          id: `int_mt4_${userId}`,
          userId,
          providerId: 'METATRADER_4',
          name: 'MetaTrader 4 Bridge',
          category: 'BROKER',
          enabled: false,
          status: 'DISCONNECTED',
          environment: 'LIVE',
          serverHost: '127.0.0.1',
          serverPort: 4444,
          createdAt: now,
          updatedAt: now,
        };
      case 'CTRADER':
        return {
          id: `int_ctrader_${userId}`,
          userId,
          providerId: 'CTRADER',
          name: 'cTrader OpenAPI',
          category: 'BROKER',
          enabled: false,
          status: 'CONFIG_REQUIRED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
      case 'INTERACTIVE_BROKERS':
        return {
          id: `int_ibkr_${userId}`,
          userId,
          providerId: 'INTERACTIVE_BROKERS',
          name: 'Interactive Brokers Gateway',
          category: 'BROKER',
          enabled: false,
          status: 'DISCONNECTED',
          environment: 'LIVE',
          serverHost: '127.0.0.1',
          serverPort: 5000,
          createdAt: now,
          updatedAt: now,
        };
      case 'FOREX_FACTORY_CALENDAR':
        return {
          id: `int_calendar_${userId}`,
          userId,
          providerId: 'FOREX_FACTORY_CALENDAR',
          name: 'Macroeconomic News Feed',
          category: 'ECONOMIC_CALENDAR',
          enabled: true,
          status: 'CONNECTED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
      case 'DISCORD_WEBHOOK':
        return {
          id: `int_discord_${userId}`,
          userId,
          providerId: 'DISCORD_WEBHOOK',
          name: 'Discord Risk Alerts',
          category: 'NOTIFICATIONS',
          enabled: false,
          status: 'CONFIG_REQUIRED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
      case 'SLACK_WEBHOOK':
        return {
          id: `int_slack_${userId}`,
          userId,
          providerId: 'SLACK_WEBHOOK',
          name: 'Slack Alerts Channel',
          category: 'NOTIFICATIONS',
          enabled: false,
          status: 'CONFIG_REQUIRED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
      case 'TELEGRAM_BOT':
        return {
          id: `int_telegram_${userId}`,
          userId,
          providerId: 'TELEGRAM_BOT',
          name: 'Telegram Bot Alerts',
          category: 'NOTIFICATIONS',
          enabled: false,
          status: 'CONFIG_REQUIRED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
      default:
        return {
          id: `int_gen_${userId}_${providerId}`,
          userId,
          providerId,
          name: 'External Service',
          category: 'BROKER',
          enabled: false,
          status: 'DISCONNECTED',
          environment: 'LIVE',
          createdAt: now,
          updatedAt: now,
        };
    }
  }
}
