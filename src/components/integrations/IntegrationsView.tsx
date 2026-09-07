import React, { useState, useEffect, useMemo } from 'react';
import {
  Cable,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Settings2,
  Calendar,
  Bell,
  Shield,
  ExternalLink,
  Sliders,
  Terminal,
  Clock,
  Radio,
  Zap,
  Check,
  Send,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { IntegrationService } from '../../services/integrations/integrationService';
import {
  IntegrationConfig,
  IntegrationProviderId,
  IntegrationCategory,
  ConnectionHealthCheckResult,
  MacroeconomicEvent,
} from '../../types/integrations';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Select } from '../ui/Input';
import { formatShortDate, formatDate } from '../../lib/utils';

export const IntegrationsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { notify } = useNotification();
  const userId = currentUser?.id || 'anonymous_user';

  const [configs, setConfigs] = useState<IntegrationConfig[]>(() =>
    IntegrationService.getConfigs(userId)
  );
  const [activeCategory, setActiveCategory] = useState<IntegrationCategory | 'ALL'>('ALL');
  const [selectedConfig, setSelectedConfig] = useState<IntegrationConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Testing states
  const [testingProvider, setTestingProvider] = useState<IntegrationProviderId | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionHealthCheckResult>>({});

  // Economic News Feed
  const [economicEvents, setEconomicEvents] = useState<MacroeconomicEvent[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    setIsLoadingNews(true);
    try {
      const cal = IntegrationService.getEconomicCalendar();
      const events = await cal.getUpcomingEvents('', '', 'HIGH');
      setEconomicEvents(events);
    } catch (e) {
      console.warn('Could not load economic calendar feed', e);
    } finally {
      setIsLoadingNews(false);
    }
  };

  const handleRefreshConfigs = () => {
    setConfigs(IntegrationService.getConfigs(userId));
  };

  const handleTestConnection = async (providerId: IntegrationProviderId) => {
    setTestingProvider(providerId);
    try {
      const res = await IntegrationService.testConnection(userId, providerId);
      setTestResults((prev) => ({ ...prev, [providerId]: res }));
      handleRefreshConfigs();

      if (res.status === 'CONNECTED') {
        notify.success('Connected', res.message);
      } else if (res.status === 'CONFIG_REQUIRED') {
        notify.warning('Configuration Needed', res.message);
      } else {
        notify.info('Status Check', res.message);
      }
    } catch (e: any) {
      notify.error('Connection Test Failed', e?.message || 'Unknown error');
    } finally {
      setTestingProvider(null);
    }
  };

  const handleOpenConfig = (config: IntegrationConfig) => {
    setSelectedConfig({ ...config });
    setIsConfigModalOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig) return;

    IntegrationService.saveConfig(userId, selectedConfig);
    handleRefreshConfigs();
    setIsConfigModalOpen(false);
    notify.success('Settings Saved', `${selectedConfig.name} configuration updated.`);
  };

  const filteredConfigs = useMemo(() => {
    if (activeCategory === 'ALL') return configs;
    return configs.filter((c) => c.category === activeCategory);
  }, [configs, activeCategory]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Connected</Badge>;
      case 'CONNECTING':
      case 'SYNCING':
        return <Badge variant="warning" className="gap-1"><RefreshCw className="h-3 w-3 animate-spin" /> Syncing</Badge>;
      case 'CONFIG_REQUIRED':
        return <Badge variant="neutral" className="gap-1 text-amber-400 border-amber-500/30"><Sliders className="h-3 w-3" /> Config Required</Badge>;
      case 'ERROR':
      case 'UNAUTHORIZED':
        return <Badge variant="danger" className="gap-1"><AlertTriangle className="h-3 w-3" /> Error</Badge>;
      default:
        return <Badge variant="neutral" className="gap-1 text-[#848B98]"><XCircle className="h-3 w-3" /> Disconnected</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22252A] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cable className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              Integrations & External Adapters
            </h1>
            <Badge variant="primary" className="text-[10px] uppercase font-sans">
              Production Architecture
            </Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Standardized bridge adapters for MetaTrader, cTrader, Interactive Brokers, macroeconomic news feeds, and webhook alert channels.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="flex items-center space-x-1.5 bg-[#15171A] p-1 rounded-lg border border-[#22252A]">
          {(['ALL', 'BROKER', 'ECONOMIC_CALENDAR', 'NOTIFICATIONS'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#22252A] text-white shadow-sm'
                  : 'text-[#848B98] hover:text-white'
              }`}
            >
              {cat === 'ALL'
                ? 'All Services'
                : cat === 'BROKER'
                ? 'Brokers'
                : cat === 'ECONOMIC_CALENDAR'
                ? 'Macro News'
                : 'Webhooks & Alerts'}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConfigs.map((cfg) => {
          const isTesting = testingProvider === cfg.providerId;
          const testRes = testResults[cfg.providerId];

          return (
            <Card
              key={cfg.id}
              className="p-4 bg-[#15171A] border-[#22252A] hover:border-[#2A2E35] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-[#1A1D21] border border-[#22252A] text-emerald-400">
                      {cfg.category === 'BROKER' ? (
                        <Server className="h-5 w-5" />
                      ) : cfg.category === 'ECONOMIC_CALENDAR' ? (
                        <Calendar className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Bell className="h-5 w-5 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white font-mono">{cfg.name}</h3>
                      <span className="text-[11px] text-[#848B98] block uppercase">
                        {cfg.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(cfg.status)}
                </div>

                {/* Details & State */}
                <div className="mt-4 p-2.5 bg-[#0C0D0F] rounded border border-[#22252A] space-y-1.5 text-xs font-mono">
                  {cfg.serverHost && (
                    <div className="flex justify-between text-[#848B98]">
                      <span>Host Socket:</span>
                      <span className="text-white">{cfg.serverHost}:{cfg.serverPort || 'N/A'}</span>
                    </div>
                  )}
                  {cfg.accountId && (
                    <div className="flex justify-between text-[#848B98]">
                      <span>Account ID:</span>
                      <span className="text-white">{cfg.accountId}</span>
                    </div>
                  )}
                  {cfg.webhookUrl && (
                    <div className="flex justify-between text-[#848B98]">
                      <span>Target Endpoint:</span>
                      <span className="text-emerald-400 truncate max-w-[150px]">{cfg.webhookUrl}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#848B98]">
                    <span>Environment:</span>
                    <span className="text-[#D1D5DB]">{cfg.environment}</span>
                  </div>
                  {cfg.latencyMs !== undefined && cfg.latencyMs > 0 && (
                    <div className="flex justify-between text-[#848B98]">
                      <span>Last Ping Latency:</span>
                      <span className="text-emerald-400">{cfg.latencyMs} ms</span>
                    </div>
                  )}
                </div>

                {/* Test Diagnosis Feedback */}
                {testRes && (
                  <div className={`mt-2.5 p-2 rounded text-[11px] font-mono ${
                    testRes.status === 'CONNECTED'
                      ? 'bg-emerald-950/30 border border-emerald-500/20 text-emerald-300'
                      : 'bg-[#1A1D21] border border-[#22252A] text-[#9CA3AF]'
                  }`}>
                    <span className="font-semibold block">{testRes.message}</span>
                    <span className="text-[10px] text-[#606773] mt-0.5 block">
                      Ping: {formatDate(testRes.timestamp)} • Latency: {testRes.latencyMs}ms
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-[#22252A] flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenConfig(cfg)}
                  className="text-xs border-[#22252A] text-[#848B98] hover:text-white"
                >
                  <Settings2 className="h-3.5 w-3.5 mr-1" />
                  <span>Configure</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isTesting}
                  onClick={() => handleTestConnection(cfg.providerId)}
                  className="text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isTesting ? 'animate-spin text-emerald-400' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Macroeconomic News Live Stream Preview */}
      <Card className="p-4 bg-[#15171A] border-[#22252A]">
        <div className="flex items-center justify-between mb-3 border-b border-[#22252A] pb-2">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white font-mono">
              High-Impact Macroeconomic News Stream
            </h3>
            <Badge variant="warning" className="text-[10px]">Active Feed</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadNews}
            disabled={isLoadingNews}
            className="text-xs border-[#22252A]"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingNews ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#0C0D0F] text-[#848B98] uppercase text-[10px] border-b border-[#22252A]">
                <th className="py-2.5 px-3">Date / Time</th>
                <th className="py-2.5 px-3">Currency</th>
                <th className="py-2.5 px-3">Event Title</th>
                <th className="py-2.5 px-3">Impact</th>
                <th className="py-2.5 px-3">Forecast</th>
                <th className="py-2.5 px-3">Previous</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22252A]">
              {economicEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-[#1A1D21] transition-colors">
                  <td className="py-2.5 px-3 text-[#D1D5DB]">
                    {formatShortDate(evt.timestamp)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-white">
                    {evt.currency}
                  </td>
                  <td className="py-2.5 px-3 text-white font-sans">
                    {evt.title}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                      HIGH
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-bold">
                    {evt.forecastValue || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[#848B98]">
                    {evt.previousValue || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Configuration Modal */}
      {isConfigModalOpen && selectedConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg bg-[#15171A] border-[#22252A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#22252A] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Sliders className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Configure {selectedConfig.name}
                </h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-[#848B98] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 bg-[#0C0D0F] rounded border border-[#22252A]">
                <div>
                  <span className="font-semibold text-white block">Enable Adapter</span>
                  <span className="text-[11px] text-[#848B98]">Allow TradeOS to poll or dispatch via this service</span>
                </div>
                <input
                  type="checkbox"
                  checked={selectedConfig.enabled}
                  onChange={(e) =>
                    setSelectedConfig({ ...selectedConfig, enabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-[#22252A] bg-[#15171A] text-emerald-500 focus:ring-emerald-500"
                />
              </div>

              {selectedConfig.category === 'BROKER' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Server / Socket Host"
                      value={selectedConfig.serverHost || ''}
                      onChange={(e) =>
                        setSelectedConfig({ ...selectedConfig, serverHost: e.target.value })
                      }
                      placeholder="127.0.0.1"
                    />
                    <Input
                      label="Bridge Port"
                      type="number"
                      value={selectedConfig.serverPort || ''}
                      onChange={(e) =>
                        setSelectedConfig({ ...selectedConfig, serverPort: Number(e.target.value) })
                      }
                      placeholder="5555"
                    />
                  </div>
                  <Input
                    label="Account Login / ID"
                    value={selectedConfig.accountId || ''}
                    onChange={(e) =>
                      setSelectedConfig({ ...selectedConfig, accountId: e.target.value })
                    }
                    placeholder="e.g. 10928371"
                  />
                </>
              )}

              {selectedConfig.category === 'NOTIFICATIONS' && (
                <Input
                  label="Webhook URL Endpoint"
                  value={selectedConfig.webhookUrl || ''}
                  onChange={(e) =>
                    setSelectedConfig({ ...selectedConfig, webhookUrl: e.target.value })
                  }
                  placeholder="https://discord.com/api/webhooks/..."
                />
              )}

              <Select
                label="Target Environment"
                value={selectedConfig.environment}
                onChange={(e) =>
                  setSelectedConfig({
                    ...selectedConfig,
                    environment: e.target.value as 'SANDBOX' | 'LIVE',
                  })
                }
                options={[
                  { value: 'LIVE', label: 'Live Production' },
                  { value: 'SANDBOX', label: 'Demo / Sandbox Simulator' },
                ]}
              />

              <div className="pt-4 border-t border-[#22252A] flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setIsConfigModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Save Adapter Settings
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
