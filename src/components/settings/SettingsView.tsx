/**
 * Settings & System Management View
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { ConfirmationModal } from '../ui/ConfirmationModal';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { useTradeOS } from '../../context/TradeOSContext';
import { LocalDatabase } from '../../repositories/localDatabase';
import { useSync } from '../../context/SyncContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import {
  User,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Shield,
  Download,
  Upload,
  RefreshCw,
  Database,
  Briefcase,
  Layers,
  Cpu,
  CheckCircle2,
  Trash2,
  Lock,
  Wifi,
  WifiOff,
  Smartphone,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { currentUser, userProfile, updateProfile, isDemoMode, workspaces, activeWorkspaceId, setActiveWorkspaceId, openWorkspaceModal } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { notify } = useNotification();
  const { resetToSampleData, refreshData } = useTradeOS();
  const { syncState, syncNow, openSyncModal } = useSync();
  const { isOnline, latencyMs, effectiveType } = useOnlineStatus();

  const [currency, setCurrency] = useState(userProfile?.defaultCurrency || 'USD');
  const [timezone, setTimezone] = useState(userProfile?.defaultTimezone || 'America/New_York');
  const [riskTolerance, setRiskTolerance] = useState(userProfile?.riskTolerancePercent || 1.0);
  const [experience, setExperience] = useState(userProfile?.experienceLevel || 'ADVANCED');
  const [isSaving, setIsSaving] = useState(false);

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isWipeConfirmOpen, setIsWipeConfirmOpen] = useState(false);

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        defaultCurrency: currency,
        defaultTimezone: timezone,
        riskTolerancePercent: Number(riskTolerance),
        experienceLevel: experience,
      });
      notify.success('Preferences Saved', 'Default risk model and locale settings updated.');
    } catch (e: any) {
      notify.error('Save Failed', e?.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    if (!currentUser) return;
    try {
      const data = {
        user: currentUser,
        profile: userProfile,
        workspaces: LocalDatabase.getItems(currentUser.id, 'workspaces'),
        accounts: LocalDatabase.getItems(currentUser.id, 'accounts'),
        trades: LocalDatabase.getItems(currentUser.id, 'trades'),
        strategies: LocalDatabase.getItems(currentUser.id, 'strategies'),
        exportedAt: new Date().toISOString(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tradeos-backup-${currentUser.id}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify.success('Data Backup Exported', 'Full JSON archive downloaded successfully.');
    } catch (err: any) {
      notify.error('Export Error', err?.message);
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.accounts) LocalDatabase.setCollection(currentUser.id, 'accounts', json.accounts);
        if (json.trades) LocalDatabase.setCollection(currentUser.id, 'trades', json.trades);
        if (json.strategies) LocalDatabase.setCollection(currentUser.id, 'strategies', json.strategies);
        if (json.workspaces) LocalDatabase.setCollection(currentUser.id, 'workspaces', json.workspaces);
        
        await refreshData();
        notify.success('Data Restored', 'Accounts and trade journals imported into your tenant partition.');
      } catch (err: any) {
        notify.error('Import Failed', 'Invalid JSON backup format.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    await resetToSampleData();
    notify.info('Demo Sample Restored', 'Reset standard accounts and verified sample trades.');
  };

  const handleWipeData = async () => {
    if (!currentUser) return;
    LocalDatabase.setCollection(currentUser.id, 'accounts', []);
    LocalDatabase.setCollection(currentUser.id, 'trades', []);
    LocalDatabase.setCollection(currentUser.id, 'strategies', []);
    await refreshData();
    notify.warning('Workspace Cleared', 'All accounts and trades removed for active tenant.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              System Settings & Architecture
            </h1>
            <Badge variant="neutral">PHASE 1 FOUNDATION</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Tenant configuration, quantitative precision boundaries, theme tokens, and storage backup.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Tenant Identity & Theme */}
        <div className="space-y-6">
          {/* User Tenant Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Tenant Isolation Identity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0C0D0F] border border-[#22252A]">
                <div className="h-10 w-10 rounded-lg bg-[#1A1D21] border border-[#2A2E35] flex items-center justify-center font-bold text-sm text-emerald-400">
                  {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser?.displayName}</p>
                  <p className="text-[11px] text-[#848B98] font-mono truncate">{currentUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#22252A]">
                  <span className="text-[#848B98]">Tenant ID:</span>
                  <span className="font-mono text-[#D1D5DB]">{currentUser?.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#22252A]">
                  <span className="text-[#848B98]">Security Mode:</span>
                  <span className="font-semibold text-emerald-400">
                    {isDemoMode ? 'Sandbox Evaluation' : 'Strict Tenant Isolation'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#848B98]">Storage Engine:</span>
                  <span className="font-mono text-[#D1D5DB]">TradeOS LocalDB v1.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Theme & Design Tokens */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Design System & Theme</span>
              </CardTitle>
              <CardDescription>
                Persistent theme tokens with high-contrast surfaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98] hover:text-white'
                  }`}
                >
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98] hover:text-white'
                  }`}
                >
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('system')}
                  className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    theme === 'system'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98] hover:text-white'
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-[11px] text-[#848B98] flex items-center justify-between">
                <span>Active Render Token:</span>
                <span className="font-mono text-emerald-400 uppercase font-semibold">{resolvedTheme}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Trading Defaults & Data Management */}
        <div className="md:col-span-2 space-y-6">
          {/* Trading Parameters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <SettingsIcon className="h-4 w-4 text-blue-400" />
                <span>Quantitative Trading Defaults</span>
              </CardTitle>
              <CardDescription>
                System default parameters applied automatically to newly logged trades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDefaults} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Default Base Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="AUD">AUD ($ - Australian Dollar)</option>
                    <option value="CAD">CAD ($ - Canadian Dollar)</option>
                    <option value="JPY">JPY (¥ - Japanese Yen)</option>
                  </Select>

                  <Select
                    label="Market Timezone"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="UTC">UTC (Universal Time)</option>
                  </Select>

                  <Input
                    label="Default Risk Tolerance (% Equity)"
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    value={riskTolerance}
                    onChange={(e) => setRiskTolerance(parseFloat(e.target.value) || 1.0)}
                    helperText="Default risk ceiling per trade execution."
                  />

                  <Select
                    label="Account Tier"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value as any)}
                  >
                    <option value="BEGINNER">Retail (1-2 years)</option>
                    <option value="INTERMEDIATE">Intermediate (2-4 years)</option>
                    <option value="ADVANCED">Funded / Prop Trader (4+ years)</option>
                    <option value="PRO">Systematic Quantitative</option>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" isLoading={isSaving}>
                    Save Quantitative Defaults
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Workspaces Management */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                  <span>Workspaces & Risk Desks</span>
                </CardTitle>
                <CardDescription>
                  Multi-account trading desks isolated for evaluation or personal portfolios.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openWorkspaceModal}>
                <Layers className="h-3.5 w-3.5 mr-1" />
                Manage Desks
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      ws.id === activeWorkspaceId
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-white'
                        : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{ws.name}</span>
                        {ws.id === activeWorkspaceId && (
                          <Badge variant="emerald">ACTIVE</Badge>
                        )}
                        {ws.isDefault && (
                          <Badge variant="neutral">PRIMARY</Badge>
                        )}
                      </div>
                      {ws.description && (
                        <p className="text-[11px] text-[#848B98] mt-0.5">{ws.description}</p>
                      )}
                    </div>

                    {ws.id !== activeWorkspaceId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setActiveWorkspaceId(ws.id);
                          notify.info('Switched Workspace', ws.name);
                        }}
                      >
                        Set Active
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progressive Web App (PWA) & Offline Workstation */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  <span>Progressive Web App (PWA) & Offline Workstation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="text-[11px] font-mono uppercase text-[#848B98]">
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </CardTitle>
              <CardDescription>
                Zero-install desktop & mobile application with deterministic offline local journal logging and automated cloud sync.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Network Quality Telemetry */}
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#848B98]">
                    <span>Connectivity</span>
                    {isOnline ? (
                      <Wifi className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <WifiOff className="h-3.5 w-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {isOnline ? 'Active Connection' : 'Offline Workstation'}
                  </div>
                  <div className="text-[10px] text-[#606773] font-mono">
                    {isOnline ? `Latency: ~${latencyMs || 24}ms • ${effectiveType?.toUpperCase() || '4G/WIFI'}` : 'Local-First Cache Active'}
                  </div>
                </div>

                {/* Sync Queue Status */}
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#848B98]">
                    <span>Pending Mutations</span>
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {syncState.pendingCount} Queued Actions
                  </div>
                  <div className="text-[10px] text-[#606773] font-mono">
                    {syncState.conflictCount > 0 ? `${syncState.conflictCount} Conflicts Detected` : 'All changes preserved safely'}
                  </div>
                </div>

                {/* Offline Math Engine */}
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#848B98]">
                    <span>Local Resilience</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    100% Offline Math
                  </div>
                  <div className="text-[10px] text-[#606773] font-mono">
                    Trades, Accounts, Risk, Drawdown
                  </div>
                </div>
              </div>

              {/* Install PWA Prompt Banner Card */}
              <PWAInstallButton variant="card" />

              {/* Action Buttons: Sync Inspector and Manual Sync */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSyncModal}
                  className="border-[#2A2E35] text-[#D1D5DB] hover:text-white"
                >
                  <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-400" />
                  Open Sync Queue Inspector
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => syncNow()}
                  disabled={syncState.isSyncing || !isOnline}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
                  {syncState.isSyncing ? 'Synchronizing...' : 'Sync Pending Data Now'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Backup & Disaster Recovery */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-400" />
                <span>Data Backup & Tenant Management</span>
              </CardTitle>
              <CardDescription>
                Export immutable JSON journal backups or restore sample datasets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleExportData}
                  className="w-full justify-start border-[#2A2E35] text-[#D1D5DB] hover:text-white"
                >
                  <Download className="h-4 w-4 mr-2 text-emerald-400" />
                  <span>Export JSON Backup</span>
                </Button>

                <label className="w-full">
                  <span className="sr-only">Import JSON Backup</span>
                  <div className="flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-[#2A2E35] bg-transparent text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white cursor-pointer transition-colors">
                    <Upload className="h-4 w-4 text-blue-400" />
                    <span>Import JSON Backup</span>
                  </div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-3 border-t border-[#22252A] flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  Reset to Sample Data
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsWipeConfirmOpen(true)}
                  className="text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Wipe Tenant Records
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialogs */}
      <ConfirmationModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetData}
        title="Reset to Sample Trading Data?"
        description="This will restore the standard sample accounts (Funded FX Desk & Topstep NQ) with verified historical trades."
        confirmText="Reset Sample Data"
        variant="warning"
      />

      <ConfirmationModal
        isOpen={isWipeConfirmOpen}
        onClose={() => setIsWipeConfirmOpen(false)}
        onConfirm={handleWipeData}
        title="Wipe All Tenant Data?"
        description="This will erase all accounts, trades, and playbooks in your currently active tenant storage partition. This action cannot be undone."
        confirmText="Wipe Everything"
        variant="danger"
      />
    </div>
  );
};
