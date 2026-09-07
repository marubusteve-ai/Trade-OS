import React, { useState, useEffect } from 'react';
import { Account, AccountType, AccountStatus } from '../../types/domain';
import { AccountService } from '../../services/accountService';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Layers, ShieldCheck, DollarSign, Tag, Info, AlertCircle } from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: any) => Promise<void>;
  initialAccount?: Account | null;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'financial' | 'prop' | 'meta'>('general');
  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    accountType: 'PROP_EVALUATION' as AccountType,
    status: 'ACTIVE' as AccountStatus,
    broker: 'FTMO',
    propFirm: 'FTMO',
    platform: 'MT5 / TradeLocker',
    currency: 'USD',
    timezone: 'America/New_York',
    group: 'Evaluation Cohort',
    startingBalance: 100000,
    currentBalance: 100000,
    equity: 100000,
    challengePhase: 1,
    profitTarget: 10000,
    dailyLossLimit: 5000,
    maximumLoss: 10000,
    trailingDrawdown: 10000,
    minimumTradingDays: 4,
    maxRiskPerTradePercent: 1.0,
    maxOpenTrades: 3,
    maxDailyTrades: 10,
    tagsInput: 'Phase1, FX, Indices',
    notes: '',
    isFavorite: false,
    isArchived: false,
    customMetadataStr: '{"riskModel": "conservative", "payoutSplit": 80}',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (initialAccount) {
      setFormData({
        name: initialAccount.name,
        accountNumber: initialAccount.accountNumber || '',
        accountType: initialAccount.accountType,
        status: initialAccount.status || (initialAccount.isArchived ? 'ARCHIVED' : 'ACTIVE'),
        broker: initialAccount.broker,
        propFirm: initialAccount.propFirm || '',
        platform: initialAccount.platform,
        currency: initialAccount.currency,
        timezone: initialAccount.timezone,
        group: initialAccount.group || '',
        startingBalance: initialAccount.startingBalance,
        currentBalance: initialAccount.currentBalance,
        equity: initialAccount.equity,
        challengePhase: initialAccount.challengePhase || 1,
        profitTarget: initialAccount.profitTarget || 0,
        dailyLossLimit: initialAccount.dailyLossLimit || 0,
        maximumLoss: initialAccount.maximumLoss || 0,
        trailingDrawdown: initialAccount.trailingDrawdown || 0,
        minimumTradingDays: initialAccount.minimumTradingDays || 0,
        maxRiskPerTradePercent: initialAccount.maxRiskPerTradePercent || 1.0,
        maxOpenTrades: initialAccount.maxOpenTrades || 5,
        maxDailyTrades: initialAccount.maxDailyTrades || 15,
        tagsInput: (initialAccount.tags || []).join(', '),
        notes: initialAccount.notes || '',
        isFavorite: initialAccount.isFavorite || false,
        isArchived: initialAccount.isArchived || false,
        customMetadataStr: initialAccount.customMetadata 
          ? JSON.stringify(initialAccount.customMetadata, null, 2) 
          : '',
      });
    } else {
      setFormData({
        name: 'FTMO $100K Evaluation',
        accountNumber: '',
        accountType: 'PROP_EVALUATION',
        status: 'ACTIVE',
        broker: 'FTMO',
        propFirm: 'FTMO',
        platform: 'MT5 / TradeLocker',
        currency: 'USD',
        timezone: 'America/New_York',
        group: 'Evaluation Cohort',
        startingBalance: 100000,
        currentBalance: 100000,
        equity: 100000,
        challengePhase: 1,
        profitTarget: 10000,
        dailyLossLimit: 5000,
        maximumLoss: 10000,
        trailingDrawdown: 10000,
        minimumTradingDays: 4,
        maxRiskPerTradePercent: 1.0,
        maxOpenTrades: 3,
        maxDailyTrades: 10,
        tagsInput: 'Phase1, Futures, SMC',
        notes: '',
        isFavorite: false,
        isArchived: false,
        customMetadataStr: '{"payoutSplit": 80}',
      });
    }
    setValidationErrors([]);
    setActiveTab('general');
  }, [initialAccount, isOpen]);

  // Preset Auto-fill based on Account Type
  const handleAccountTypeChange = (type: AccountType) => {
    let propFirmVal = formData.propFirm;
    let profitTargetVal = formData.profitTarget;
    let dailyLossLimitVal = formData.dailyLossLimit;
    let maximumLossVal = formData.maximumLoss;
    let phaseVal = formData.challengePhase;
    let groupVal = formData.group;

    if (type === 'PROP_EVALUATION') {
      propFirmVal = propFirmVal || 'FTMO';
      profitTargetVal = 10000;
      dailyLossLimitVal = 5000;
      maximumLossVal = 10000;
      phaseVal = 1;
      groupVal = groupVal || 'Prop Challenges';
    } else if (type === 'PROP_VERIFICATION') {
      propFirmVal = propFirmVal || 'FTMO';
      profitTargetVal = 5000;
      dailyLossLimitVal = 5000;
      maximumLossVal = 10000;
      phaseVal = 2;
      groupVal = groupVal || 'Prop Verification';
    } else if (type === 'PROP_FUNDED') {
      propFirmVal = propFirmVal || 'FTMO';
      profitTargetVal = 0;
      dailyLossLimitVal = 5000;
      maximumLossVal = 10000;
      phaseVal = 3;
      groupVal = groupVal || 'Funded Masters';
    } else if (type === 'PERSONAL_LIVE') {
      propFirmVal = '';
      profitTargetVal = 0;
      dailyLossLimitVal = 0;
      maximumLossVal = 0;
      groupVal = groupVal || 'Personal Live Desk';
    }

    setFormData(prev => ({
      ...prev,
      accountType: type,
      propFirm: propFirmVal,
      profitTarget: profitTargetVal,
      dailyLossLimit: dailyLossLimitVal,
      maximumLoss: maximumLossVal,
      challengePhase: phaseVal,
      group: groupVal,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse Tags
    const tags = formData.tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    // Parse Custom Metadata
    let customMetadata: Record<string, any> | undefined = undefined;
    if (formData.customMetadataStr.trim()) {
      try {
        customMetadata = JSON.parse(formData.customMetadataStr);
      } catch {
        setValidationErrors(['Custom metadata is not valid JSON format.']);
        setActiveTab('meta');
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      accountNumber: formData.accountNumber.trim() || undefined,
      accountType: formData.accountType,
      status: formData.status,
      broker: formData.broker.trim(),
      propFirm: formData.propFirm.trim() || undefined,
      platform: formData.platform.trim(),
      currency: formData.currency,
      timezone: formData.timezone,
      group: formData.group.trim() || undefined,
      startingBalance: Number(formData.startingBalance),
      currentBalance: Number(formData.currentBalance),
      equity: Number(formData.equity),
      challengePhase: formData.challengePhase ? Number(formData.challengePhase) : undefined,
      profitTarget: formData.profitTarget ? Number(formData.profitTarget) : undefined,
      dailyLossLimit: formData.dailyLossLimit ? Number(formData.dailyLossLimit) : undefined,
      maximumLoss: formData.maximumLoss ? Number(formData.maximumLoss) : undefined,
      trailingDrawdown: formData.trailingDrawdown ? Number(formData.trailingDrawdown) : undefined,
      minimumTradingDays: formData.minimumTradingDays ? Number(formData.minimumTradingDays) : undefined,
      maxRiskPerTradePercent: formData.maxRiskPerTradePercent ? Number(formData.maxRiskPerTradePercent) : undefined,
      maxOpenTrades: formData.maxOpenTrades ? Number(formData.maxOpenTrades) : undefined,
      maxDailyTrades: formData.maxDailyTrades ? Number(formData.maxDailyTrades) : undefined,
      tags: tags.length > 0 ? tags : undefined,
      customMetadata,
      notes: formData.notes.trim() || undefined,
      isFavorite: formData.isFavorite,
      isArchived: formData.status === 'ARCHIVED' || formData.isArchived,
    };

    // Client-side Validation Check
    const validation = AccountService.validateAccount(payload);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);

    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setValidationErrors([err?.message || 'Failed to save account']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPropAccount = 
    formData.accountType?.startsWith('PROP_') || 
    formData.accountType === 'CHALLENGE';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? `Edit Account: ${initialAccount.name}` : 'Create Trading Account'}
      description="Configure capital parameters, broker connectivity profile, and prop firm compliance thresholds."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-zinc-300 font-mono">
            {formData.accountType} • {formData.currency}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              {initialAccount ? 'Save Account Changes' : 'Create Account'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Validation Error Banner */}
        {validationErrors.length > 0 && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Please resolve the following validation issues:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'general'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>General & Platform</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'financial'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            <span>Capital & Risk</span>
          </button>

          {isPropAccount && (
            <button
              type="button"
              onClick={() => setActiveTab('prop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === 'prop'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Prop Rules & Limits</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('meta')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'meta'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span>Metadata & Tags</span>
          </button>
        </div>

        {/* Tab 1: General & Platform */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Account Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. FTMO $100K Phase 1"
                required
              />

              <Select
                label="Account Type *"
                value={formData.accountType}
                onChange={(e) => handleAccountTypeChange(e.target.value as AccountType)}
              >
                <option value="PROP_EVALUATION">Prop Evaluation (Phase 1)</option>
                <option value="PROP_VERIFICATION">Verification (Phase 2)</option>
                <option value="PROP_FUNDED">Funded Account</option>
                <option value="PERSONAL_LIVE">Personal Live</option>
                <option value="PERSONAL_DEMO">Personal Demo</option>
                <option value="BACKTEST">Backtest Portfolio</option>
                <option value="FORWARD_TEST">Forward Test / Sim</option>
                <option value="CHALLENGE">Challenge</option>
                <option value="CUSTOM">Custom</option>
              </Select>

              <Select
                label="Account Status *"
                value={formData.status}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  status: e.target.value as AccountStatus,
                  isArchived: e.target.value === 'ARCHIVED'
                })}
              >
                <option value="ACTIVE">ACTIVE (Monitored)</option>
                <option value="INACTIVE">INACTIVE (Idle)</option>
                <option value="PAUSED">PAUSED (Resting)</option>
                <option value="PASSED">PASSED (Target Achieved)</option>
                <option value="FAILED">FAILED (Evaluation Closed)</option>
                <option value="BREACHED">BREACHED (Rule Violation)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </Select>

              <Input
                label="Desk / Group"
                value={formData.group}
                onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                placeholder="e.g. Core Desk, Evaluation Cohort"
              />

              <Input
                label="Broker / Provider *"
                value={formData.broker}
                onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                placeholder="e.g. FTMO, Interactive Brokers, IC Markets"
                required
              />

              {isPropAccount && (
                <Input
                  label="Prop Firm Name"
                  value={formData.propFirm}
                  onChange={(e) => setFormData({ ...formData, propFirm: e.target.value })}
                  placeholder="e.g. FTMO, FundedNext, The5ers, MFF"
                />
              )}

              <Input
                label="Trading Platform *"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                placeholder="e.g. MT5, cTrader, TradeLocker, NinjaTrader, TradingView"
                required
              />

              <Select
                label="Base Currency *"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="USD">USD ($ - US Dollar)</option>
                <option value="EUR">EUR (€ - Euro)</option>
                <option value="GBP">GBP (£ - British Pound)</option>
                <option value="CAD">CAD ($ - Canadian Dollar)</option>
                <option value="AUD">AUD ($ - Australian Dollar)</option>
                <option value="JPY">JPY (¥ - Japanese Yen)</option>
                <option value="CHF">CHF (Fr - Swiss Franc)</option>
                <option value="NZD">NZD ($ - New Zealand Dollar)</option>
                <option value="USDT">USDT (Tether USD)</option>
              </Select>

              <Select
                label="Account Timezone *"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="America/New_York">New York (EST/EDT - UTC-5/4)</option>
                <option value="America/Chicago">Chicago (CST/CDT - UTC-6/5)</option>
                <option value="Europe/London">London (GMT/BST - UTC+0/1)</option>
                <option value="Europe/Berlin">Frankfurt / Berlin (CET - UTC+1/2)</option>
                <option value="Europe/Prague">Prague / CE(S)T (FTMO Server Time)</option>
                <option value="Asia/Tokyo">Tokyo (JST - UTC+9)</option>
                <option value="Australia/Sydney">Sydney (AEST - UTC+10)</option>
                <option value="UTC">UTC (Coordinated Universal Time)</option>
              </Select>

              <Input
                label="Account / Login Number (Optional)"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g. 8839210"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Capital & Risk */}
        {activeTab === 'financial' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                type="number"
                label="Starting Balance *"
                prefixElement="$"
                value={formData.startingBalance}
                onChange={(e) => setFormData({ ...formData, startingBalance: parseFloat(e.target.value) || 0 })}
                helperText="Baseline opening capital"
                required
              />

              <Input
                type="number"
                label="Current Balance"
                prefixElement="$"
                value={formData.currentBalance}
                onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                helperText="Realized cash balance"
              />

              <Input
                type="number"
                label="Live Equity"
                prefixElement="$"
                value={formData.equity}
                onChange={(e) => setFormData({ ...formData, equity: parseFloat(e.target.value) || 0 })}
                helperText="Balance + floating P&L"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-3">
                Risk Management Limits
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  type="number"
                  label="Max Risk / Trade (%)"
                  suffixElement="%"
                  step="0.1"
                  value={formData.maxRiskPerTradePercent}
                  onChange={(e) => setFormData({ ...formData, maxRiskPerTradePercent: parseFloat(e.target.value) || 1 })}
                  helperText="Default risk threshold per setup"
                />

                <Input
                  type="number"
                  label="Max Open Positions"
                  value={formData.maxOpenTrades}
                  onChange={(e) => setFormData({ ...formData, maxOpenTrades: parseInt(e.target.value) || 0 })}
                  helperText="Simultaneous trade cap"
                />

                <Input
                  type="number"
                  label="Max Daily Trades"
                  value={formData.maxDailyTrades}
                  onChange={(e) => setFormData({ ...formData, maxDailyTrades: parseInt(e.target.value) || 0 })}
                  helperText="Overtrading daily circuit-breaker"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Prop Firm Rules & Limits */}
        {isPropAccount && activeTab === 'prop' && (
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                These rules feed TradeOS's deterministic compliance engine to calculate real-time drawdown buffer headroom, daily loss ceilings, and objective progress.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Challenge Phase"
                value={formData.challengePhase}
                onChange={(e) => setFormData({ ...formData, challengePhase: parseInt(e.target.value) || 1 })}
              >
                <option value="1">Phase 1 (Evaluation - e.g. 10% Target)</option>
                <option value="2">Phase 2 (Verification - e.g. 5% Target)</option>
                <option value="3">Phase 3 / Master (Funded Account)</option>
              </Select>

              <Input
                type="number"
                label="Profit Target ($)"
                prefixElement="$"
                value={formData.profitTarget}
                onChange={(e) => setFormData({ ...formData, profitTarget: parseFloat(e.target.value) || 0 })}
                helperText="Required net gain to pass phase"
              />

              <Input
                type="number"
                label="Daily Loss Limit ($)"
                prefixElement="$"
                value={formData.dailyLossLimit}
                onChange={(e) => setFormData({ ...formData, dailyLossLimit: parseFloat(e.target.value) || 0 })}
                helperText="Max allowable single-day drawdown"
              />

              <Input
                type="number"
                label="Maximum Total Loss ($)"
                prefixElement="$"
                value={formData.maximumLoss}
                onChange={(e) => setFormData({ ...formData, maximumLoss: parseFloat(e.target.value) || 0 })}
                helperText="Max overall loss from starting capital"
              />

              <Input
                type="number"
                label="Trailing Drawdown ($)"
                prefixElement="$"
                value={formData.trailingDrawdown}
                onChange={(e) => setFormData({ ...formData, trailingDrawdown: parseFloat(e.target.value) || 0 })}
                helperText="Trailing loss ceiling from high-water mark"
              />

              <Input
                type="number"
                label="Minimum Trading Days"
                value={formData.minimumTradingDays}
                onChange={(e) => setFormData({ ...formData, minimumTradingDays: parseInt(e.target.value) || 0 })}
                helperText="Unique calendar execution days required"
              />
            </div>
          </div>
        )}

        {/* Tab 4: Metadata & Tags */}
        {activeTab === 'meta' && (
          <div className="space-y-4">
            <Input
              label="Tags (Comma separated)"
              value={formData.tagsInput}
              onChange={(e) => setFormData({ ...formData, tagsInput: e.target.value })}
              placeholder="e.g. Evaluation, Swing, Automated, LondonBreakout"
              helperText="Separate tags with commas"
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Trading Rules & Execution Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                placeholder="e.g. No trading during CPI or FOMC minutes. Risk must not exceed 0.5% after 2 consecutive losses."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-1.5">
                Custom Metadata (JSON)
              </label>
              <textarea
                value={formData.customMetadataStr}
                onChange={(e) => setFormData({ ...formData, customMetadataStr: e.target.value })}
                rows={3}
                className="w-full font-mono text-[11px] rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-emerald-400 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                placeholder='{"payoutCycle": "bi-weekly", "maxLeverage": 100}'
              />
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
