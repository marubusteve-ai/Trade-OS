/**
 * TradeOS Integration Architecture & External Service Interfaces
 * 
 * Formal contracts and schemas for broker bridges (MetaTrader 4/5, cTrader, Interactive Brokers),
 * market data feeds, macroeconomic calendars, and notification dispatchers.
 */

export type IntegrationCategory = 'BROKER' | 'MARKET_DATA' | 'ECONOMIC_CALENDAR' | 'NOTIFICATIONS';

export type IntegrationProviderId = 
  | 'METATRADER_4'
  | 'METATRADER_5'
  | 'CTRADER'
  | 'INTERACTIVE_BROKERS'
  | 'TRADOVATE'
  | 'RITHMIC'
  | 'BINANCE'
  | 'COINBASE'
  | 'TRADINGVIEW_WEBHOOK'
  | 'FINANCIAL_MODELING_PREP'
  | 'FOREX_FACTORY_CALENDAR'
  | 'DISCORD_WEBHOOK'
  | 'SLACK_WEBHOOK'
  | 'TELEGRAM_BOT'
  | 'GENERIC_WEBHOOK';

export type ConnectionStatus = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'ERROR'
  | 'UNAUTHORIZED'
  | 'CONFIG_REQUIRED'
  | 'SYNCING';

export interface IntegrationConfig {
  id: string;
  userId: string;
  providerId: IntegrationProviderId;
  name: string;
  category: IntegrationCategory;
  enabled: boolean;
  status: ConnectionStatus;
  lastConnectedAt?: string;
  lastSyncAt?: string;
  lastError?: string;
  latencyMs?: number;
  environment: 'SANDBOX' | 'LIVE';
  
  // Connection Parameters
  serverHost?: string;
  serverPort?: number;
  accountId?: string;
  apiKey?: string;
  apiSecret?: string;
  authToken?: string;
  tokenExpiresAt?: string;
  webhookUrl?: string;
  symbolMappings?: Record<string, string>;
  syncScheduleMinutes?: number;
  autoSyncTrades?: boolean;
  metadata?: Record<string, any>;
  
  createdAt: string;
  updatedAt: string;
}

export interface ExternalTradeExecution {
  externalId: string;
  providerId: IntegrationProviderId;
  brokerAccountId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  fillPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  commission: number;
  swap: number;
  openTime: string;
  closeTime?: string;
  rawPayload?: any;
}

export interface MacroeconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW' | 'HOLIDAY';
  timestamp: string;
  previousValue?: string;
  forecastValue?: string;
  actualValue?: string;
  revisedValue?: string;
}

export interface MarketQuote {
  symbol: string;
  bid: number;
  ask: number;
  last: number;
  timestamp: string;
  volume24h?: number;
  change24hPercent?: number;
}

export interface NotificationPayload {
  recipientId?: string;
  title: string;
  message: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ConnectionHealthCheckResult {
  providerId: IntegrationProviderId;
  status: ConnectionStatus;
  latencyMs: number;
  timestamp: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Standard Broker Adapter Contract
 */
export interface IBrokerAdapter {
  readonly providerId: IntegrationProviderId;
  readonly name: string;
  readonly category: IntegrationCategory;
  
  initialize(config: IntegrationConfig): Promise<void>;
  connect(): Promise<ConnectionHealthCheckResult>;
  disconnect(): Promise<void>;
  getStatus(): ConnectionStatus;
  testConnection(): Promise<ConnectionHealthCheckResult>;
  fetchRecentExecutions(since?: string): Promise<ExternalTradeExecution[]>;
  fetchAccountBalance(): Promise<{ balance: number; equity: number; freeMargin?: number; currency: string }>;
}

/**
 * Market Data Feed Contract
 */
export interface IMarketDataProvider {
  readonly providerId: IntegrationProviderId;
  getQuote(symbol: string): Promise<MarketQuote | null>;
  getQuotes(symbols: string[]): Promise<Record<string, MarketQuote>>;
  testConnection(): Promise<ConnectionHealthCheckResult>;
}

/**
 * Economic Calendar Provider Contract
 */
export interface IEconomicCalendarProvider {
  readonly providerId: IntegrationProviderId;
  getUpcomingEvents(start: string, end: string, minImpact?: 'HIGH' | 'MEDIUM' | 'LOW'): Promise<MacroeconomicEvent[]>;
  getTodaysHighImpactEvents(): Promise<MacroeconomicEvent[]>;
  testConnection(): Promise<ConnectionHealthCheckResult>;
}

/**
 * Notification Dispatcher Contract
 */
export interface INotificationProvider {
  readonly providerId: IntegrationProviderId;
  sendNotification(payload: NotificationPayload): Promise<boolean>;
  testConnection(): Promise<ConnectionHealthCheckResult>;
}
