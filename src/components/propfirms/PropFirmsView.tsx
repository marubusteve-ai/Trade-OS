/**
 * Configurable Prop-Firm Engine & Evaluation Center
 * 
 * Provides live compliance evaluation, multi-firm matrix comparisons,
 * custom rule set editing, versioning, and real-time drawdown buffer gauges.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useTradeOS } from '../../context/TradeOSContext';
import { RuleSetModal } from './RuleSetModal';
import { PropFirmModal } from './PropFirmModal';
import { PropFirm, RuleSet, PropFirmEvaluationResult } from '../../types/propFirm';
import { 
  ShieldCheck, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Award, 
  Settings, 
  Layers, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Clock, 
  Percent, 
  Edit3, 
  Copy, 
  Trash2, 
  RotateCcw, 
  ExternalLink,
  Sliders,
  BarChart3
} from 'lucide-react';

export const PropFirmsView: React.FC = () => {
  const { 
    accounts, 
    selectedAccountId, 
    setSelectedAccountId,
    selectedAccount,
    propFirms, 
    ruleSets, 
    activePropEvaluation, 
    multiAccountComparison,
    createPropFirm,
    updatePropFirm,
    deletePropFirm,
    createRuleSet,
    updateRuleSet,
    deleteRuleSet,
    resetPropDefaults,
    updateAccount,
  } = useTradeOS();

  const [activeTab, setActiveTab] = useState<'RADAR' | 'MATRIX' | 'STUDIO'>('RADAR');
  
  // Modals state
  const [isRuleSetModalOpen, setIsRuleSetModalOpen] = useState(false);
  const [editingRuleSet, setEditingRuleSet] = useState<RuleSet | null>(null);
  
  const [isPropFirmModalOpen, setIsPropFirmModalOpen] = useState(false);
  const [editingPropFirm, setEditingPropFirm] = useState<PropFirm | null>(null);

  // Filter prop accounts
  const propAccounts = accounts.filter(a => 
    a.accountType?.startsWith('PROP') || a.accountType === 'CHALLENGE' || a.propFirm || a.ruleSetId
  );

  const currentEvalAccount = propAccounts.find(a => a.id === selectedAccountId) || propAccounts[0] || selectedAccount;

  // Aggregate stats
  const totalEvaluationCapital = propAccounts
    .filter(a => a.accountType === 'PROP_EVALUATION' || a.accountType === 'CHALLENGE')
    .reduce((sum, a) => sum + a.startingBalance, 0);

  const totalFundedCapital = propAccounts
    .filter(a => a.accountType === 'PROP_FUNDED')
    .reduce((sum, a) => sum + a.startingBalance, 0);

  const compliantCount = multiAccountComparison?.passedCount || 0;
  const atRiskCount = multiAccountComparison?.atRiskCount || 0;
  const breachedCount = multiAccountComparison?.breachedCount || 0;

  // Handlers for Rule Sets
  const handleOpenCreateRuleSet = () => {
    setEditingRuleSet(null);
    setIsRuleSetModalOpen(true);
  };

  const handleOpenEditRuleSet = (rs: RuleSet) => {
    setEditingRuleSet(rs);
    setIsRuleSetModalOpen(true);
  };

  const handleCloneRuleSet = async (rs: RuleSet) => {
    const cloneData: Omit<RuleSet, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
      name: `${rs.name} (Copy)`,
      description: `Cloned from ${rs.name}. ${rs.description || ''}`,
      version: `${rs.version || 'v1'}-custom`,
      rules: rs.rules.map(r => ({ ...r, id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
    };
    await createRuleSet(cloneData);
  };

  const handleSaveRuleSet = async (data: Omit<RuleSet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (editingRuleSet) {
      await updateRuleSet(editingRuleSet.id, data);
    } else {
      await createRuleSet(data);
    }
  };

  // Handlers for Prop Firms
  const handleOpenCreatePropFirm = () => {
    setEditingPropFirm(null);
    setIsPropFirmModalOpen(true);
  };

  const handleOpenEditPropFirm = (firm: PropFirm) => {
    setEditingPropFirm(firm);
    setIsPropFirmModalOpen(true);
  };

  const handleSavePropFirm = async (data: Omit<PropFirm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (editingPropFirm) {
      await updatePropFirm(editingPropFirm.id, data);
    } else {
      await createPropFirm(data);
    }
  };

  const handleAssignRuleSet = async (accountId: string, ruleSetId: string) => {
    await updateAccount(accountId, { ruleSetId });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Prop-Firm Compliance & Rules Engine
            </h1>
            <Badge variant="emerald">PHASE 7 ENGINE</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Deterministic rule validation, trailing drawdown buffers, and customizable evaluation profiles.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2">
          <div className="flex bg-[#0C0D0F] p-1 rounded-lg border border-[#22252A]">
            <button
              onClick={() => setActiveTab('RADAR')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'RADAR'
                  ? 'bg-[#1E2228] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Live Radar
            </button>

            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'MATRIX'
                  ? 'bg-[#1E2228] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5 text-blue-400" />
              Multi-Account Matrix
            </button>

            <button
              onClick={() => setActiveTab('STUDIO')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'STUDIO'
                  ? 'bg-[#1E2228] text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-amber-400" />
              Rule Studio ({ruleSets.length})
            </button>
          </div>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">Evaluation Capital</span>
          <span className="text-base font-bold font-mono text-white mt-0.5 block">
            ${(totalEvaluationCapital ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500">
            {propAccounts.filter(a => a.accountType === 'PROP_EVALUATION').length} accounts
          </span>
        </Card>

        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">Funded Capital</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
            ${(totalFundedCapital ?? 0).toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-500">
            {propAccounts.filter(a => a.accountType === 'PROP_FUNDED').length} live funded
          </span>
        </Card>

        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">Compliant / Passed</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-0.5 block">
            {compliantCount}
          </span>
          <span className="text-[10px] text-emerald-500/80">Rules fully met</span>
        </Card>

        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">At-Risk Accounts</span>
          <span className="text-base font-bold font-mono text-amber-400 mt-0.5 block">
            {atRiskCount}
          </span>
          <span className="text-[10px] text-amber-500/80">&gt; 80% loss buffer</span>
        </Card>

        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">Rule Breaches</span>
          <span className="text-base font-bold font-mono text-rose-400 mt-0.5 block">
            {breachedCount}
          </span>
          <span className="text-[10px] text-rose-500/80">Hard/Soft stop</span>
        </Card>

        <Card className="p-3 bg-[#121417]/80">
          <span className="text-[#848B98] block text-[11px]">Active Rule Sets</span>
          <span className="text-base font-bold font-mono text-blue-400 mt-0.5 block">
            {ruleSets.length} Sets
          </span>
          <span className="text-[10px] text-zinc-500">{propFirms.length} Prop Firms</span>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE RADAR VIEW                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'RADAR' && (
        <div className="space-y-6">
          {/* Account Selector Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#121417] rounded-xl border border-[#22252A]">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-[#848B98] whitespace-nowrap">
                Evaluating Account:
              </span>
              {propAccounts.map((acc) => {
                const isSelected = (currentEvalAccount?.id === acc.id);
                return (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                        : 'bg-[#0C0D0F] border border-[#22252A] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{acc.name}</span>
                    <Badge variant={acc.accountType === 'PROP_FUNDED' ? 'emerald' : 'amber'}>
                      {acc.propFirm || 'Prop'}
                    </Badge>
                  </button>
                );
              })}
            </div>

            {/* Rule Set Assignment selector */}
            {currentEvalAccount && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[11px] text-[#848B98]">Active Rule Set:</span>
                <select
                  value={currentEvalAccount.ruleSetId || ''}
                  onChange={(e) => handleAssignRuleSet(currentEvalAccount.id, e.target.value)}
                  className="px-2.5 py-1 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Auto (Firm Default)</option>
                  {ruleSets.map((rs) => (
                    <option key={rs.id} value={rs.id}>
                      {rs.name} ({rs.version})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Active Evaluation Banner & Status */}
          {activePropEvaluation && (
            <>
              <div
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  activePropEvaluation.overallStatus === 'BREACHED' || activePropEvaluation.overallStatus === 'HARD_BREACH' || activePropEvaluation.overallStatus === 'SOFT_BREACH'
                    ? 'bg-rose-500/10 border-rose-500/30'
                    : activePropEvaluation.overallStatus === 'AT_RISK' || activePropEvaluation.overallStatus === 'WARNING'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : activePropEvaluation.overallStatus === 'PASSED'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-[#121417] border-[#22252A]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white">
                      {activePropEvaluation.accountName}
                    </span>
                    <Badge
                      variant={
                        activePropEvaluation.overallStatus === 'BREACHED' || activePropEvaluation.overallStatus === 'HARD_BREACH' || activePropEvaluation.overallStatus === 'SOFT_BREACH'
                          ? 'rose'
                          : activePropEvaluation.overallStatus === 'AT_RISK' || activePropEvaluation.overallStatus === 'WARNING'
                          ? 'amber'
                          : activePropEvaluation.overallStatus === 'PASSED'
                          ? 'emerald'
                          : 'blue'
                      }
                    >
                      STATUS: {activePropEvaluation.overallStatus}
                    </Badge>
                    <span className="text-xs text-[#848B98]">
                      Phase {activePropEvaluation.currentPhaseNumber || 1} • {activePropEvaluation.challengeName || activePropEvaluation.firmName || 'Prop Firm Account'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300">
                    {(activePropEvaluation.overallStatus === 'BREACHED' || activePropEvaluation.overallStatus === 'HARD_BREACH' || activePropEvaluation.overallStatus === 'SOFT_BREACH') && (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <XCircle className="h-4 w-4" />
                        Rule Breached: {activePropEvaluation.activeBreaches?.length ? activePropEvaluation.activeBreaches.join(', ') : 'Limit exceeded'}
                      </span>
                    )}
                    {(activePropEvaluation.overallStatus === 'AT_RISK' || activePropEvaluation.overallStatus === 'WARNING') && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        Approaching threshold limits on active daily or trailing loss limits.
                      </span>
                    )}
                    {activePropEvaluation.overallStatus === 'PASSED' && (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" />
                        All phase objectives achieved! Account is eligible for next phase / funding review.
                      </span>
                    )}
                    {activePropEvaluation.overallStatus === 'ON_TRACK' && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" />
                        All compliance metrics healthy within safe operating boundaries.
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="bg-[#0C0D0F]/70 px-3 py-2 rounded-lg border border-[#22252A]">
                    <span className="text-[#848B98] text-[10px] block">STARTING BALANCE</span>
                    <span className="text-white font-bold">${(activePropEvaluation?.startingBalance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0C0D0F]/70 px-3 py-2 rounded-lg border border-[#22252A]">
                    <span className="text-[#848B98] text-[10px] block">CURRENT EQUITY</span>
                    <span className="text-emerald-400 font-bold">${(activePropEvaluation?.accountEquity ?? activePropEvaluation?.accountBalance ?? 0).toLocaleString()}</span>
                  </div>
                  <div className="bg-[#0C0D0F]/70 px-3 py-2 rounded-lg border border-[#22252A]">
                    <span className="text-[#848B98] text-[10px] block">PEAK HWM</span>
                    <span className="text-blue-400 font-bold">${(activePropEvaluation?.highWaterMark ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* 4 Primary Radar Buffer Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Daily Loss Limit Buffer */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-400" />
                      Daily Loss Limit
                    </span>
                    <Badge variant={activePropEvaluation.dailyLossBuffer?.isBreached ? 'rose' : activePropEvaluation.dailyLossBuffer?.isWarning ? 'amber' : 'emerald'}>
                      {activePropEvaluation.dailyLossBuffer?.isBreached ? 'BREACHED' : `${(activePropEvaluation.dailyLossBuffer?.percentUsed ?? 0).toFixed(1)}% Used`}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Today's Loss:</span>
                      <span className="text-rose-400 font-bold">-${(activePropEvaluation.dailyLossBuffer?.usedAmount ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Daily Limit:</span>
                      <span className="text-white">${(activePropEvaluation.dailyLossBuffer?.limitAmount ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Remaining Buffer:</span>
                      <span className="text-emerald-400 font-bold">${(activePropEvaluation.dailyLossBuffer?.remainingBuffer ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#0C0D0F] h-2 rounded-full overflow-hidden border border-[#22252A]">
                    <div
                      className={`h-full transition-all ${
                        activePropEvaluation.dailyLossBuffer?.isBreached
                          ? 'bg-rose-500'
                          : activePropEvaluation.dailyLossBuffer?.isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, activePropEvaluation.dailyLossBuffer?.percentUsed ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block text-right">
                    Reset daily at market close (5:00 PM EST)
                  </span>
                </Card>

                {/* 2. Trailing / Max Drawdown Buffer */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-rose-400" />
                      {activePropEvaluation.drawdownBuffer?.drawdownType === 'STATIC'
                        ? 'Static Max Loss'
                        : 'Trailing Max Drawdown'}
                    </span>
                    <Badge variant={activePropEvaluation.drawdownBuffer?.isBreached ? 'rose' : activePropEvaluation.drawdownBuffer?.isWarning ? 'amber' : 'emerald'}>
                      {activePropEvaluation.drawdownBuffer?.isBreached ? 'BREACHED' : `${(activePropEvaluation.drawdownBuffer?.percentUsed ?? 0).toFixed(1)}% Used`}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Stop-Out Floor:</span>
                      <span className="text-rose-400 font-bold">
                        ${(
                          activePropEvaluation.drawdownBuffer?.drawdownType === 'STATIC'
                            ? Math.max(0, (activePropEvaluation.startingBalance || 0) - (activePropEvaluation.drawdownBuffer?.limitAmount || 0))
                            : Math.max(0, (activePropEvaluation.drawdownBuffer?.trailingPeak || activePropEvaluation.highWaterMark || 0) - (activePropEvaluation.drawdownBuffer?.limitAmount || 0))
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Current Equity:</span>
                      <span className="text-white">${(activePropEvaluation.accountEquity ?? activePropEvaluation.accountBalance ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Drawdown Buffer:</span>
                      <span className="text-emerald-400 font-bold">${(activePropEvaluation.drawdownBuffer?.remainingBuffer ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#0C0D0F] h-2 rounded-full overflow-hidden border border-[#22252A]">
                    <div
                      className={`h-full transition-all ${
                        activePropEvaluation.drawdownBuffer?.isBreached
                          ? 'bg-rose-500'
                          : activePropEvaluation.drawdownBuffer?.isWarning
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, activePropEvaluation.drawdownBuffer?.percentUsed ?? 0)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block text-right">
                    Peak HWM: ${(activePropEvaluation?.drawdownBuffer?.trailingPeak || activePropEvaluation?.highWaterMark || 0).toLocaleString()}
                  </span>
                </Card>

                {/* 3. Profit Target Milestone */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-400" />
                      Profit Target
                    </span>
                    <Badge variant={activePropEvaluation.profitTargetProgress?.isAchieved ? 'emerald' : 'blue'}>
                      {activePropEvaluation.profitTargetProgress?.isAchieved ? 'ACHIEVED' : `${(activePropEvaluation.profitTargetProgress?.percentAchieved ?? 0).toFixed(1)}%`}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Target Goal:</span>
                      <span className="text-white font-bold">${(activePropEvaluation.profitTargetProgress?.targetAmount ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Net Generated:</span>
                      <span className="text-emerald-400 font-bold">${(activePropEvaluation.profitTargetProgress?.currentProfit ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Remaining to Goal:</span>
                      <span className="text-blue-400 font-bold">${(activePropEvaluation.profitTargetProgress?.remainingAmount ?? 0).toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#0C0D0F] h-2 rounded-full overflow-hidden border border-[#22252A]">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, Math.max(0, activePropEvaluation.profitTargetProgress?.percentAchieved ?? 0))}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block text-right">
                    {activePropEvaluation.profitTargetProgress?.isAchieved ? 'Goal reached!' : 'Required for Phase completion'}
                  </span>
                </Card>

                {/* 4. Consistency & Trading Days */}
                <Card className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      Consistency & Days
                    </span>
                    <Badge variant={activePropEvaluation.tradingDaysProgress?.isMinDaysMet ? 'emerald' : 'zinc'}>
                      {activePropEvaluation.tradingDaysProgress?.completedDays ?? 0}/{activePropEvaluation.tradingDaysProgress?.requiredDays ?? 0} Days
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Trading Days Logged:</span>
                      <span className="text-white font-bold">{activePropEvaluation.tradingDaysProgress?.completedDays ?? 0} Days</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Consistency Cap:</span>
                      <span className="text-purple-400 font-bold">{activePropEvaluation.consistencyMetrics?.maxAllowedRatioPercent ?? 50}%</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#848B98]">Max Day Ratio:</span>
                      <span className={`font-bold ${!(activePropEvaluation.consistencyMetrics?.isCompliant ?? true) ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {(activePropEvaluation.consistencyMetrics?.maxDayProfitRatioPercent ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar for consistency */}
                  <div className="w-full bg-[#0C0D0F] h-2 rounded-full overflow-hidden border border-[#22252A]">
                    <div
                      className={`h-full transition-all ${
                        !(activePropEvaluation.consistencyMetrics?.isCompliant ?? true)
                          ? 'bg-rose-500'
                          : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, ((activePropEvaluation.consistencyMetrics?.maxDayProfitRatioPercent ?? 0) / (activePropEvaluation.consistencyMetrics?.maxAllowedRatioPercent || 100)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block text-right">
                    Best Day: ${(activePropEvaluation.consistencyMetrics?.maxSingleDayProfit ?? 0).toFixed(2)}
                  </span>
                </Card>
              </div>

              {/* Complete Rules Checklist Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Complete Evaluation Rule Checklist ({activePropEvaluation.ruleEvaluations?.length || 0} Rules)</span>
                    </div>
                    <span className="text-xs font-mono text-[#848B98]">
                      Real-Time Automated Validation
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Real-time automated validation of each rule in {activePropEvaluation.challengeName || activePropEvaluation.firmName || 'Prop Firm'}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-[#848B98] uppercase bg-[#0C0D0F]/60 border-y border-[#22252A]">
                        <tr>
                          <th className="py-2.5 px-3">Rule Name & Category</th>
                          <th className="py-2.5 px-3">Limit / Threshold</th>
                          <th className="py-2.5 px-3">Current Live Metric</th>
                          <th className="py-2.5 px-3">Utilization</th>
                          <th className="py-2.5 px-3">Severity</th>
                          <th className="py-2.5 px-3 text-right">Compliance Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#22252A] font-medium">
                        {(activePropEvaluation.ruleEvaluations || []).map((r, idx) => {
                          const isBreached = r.state === 'BREACHED' || !r.isPassed;
                          const isWarning = r.state === 'WARNING';
                          return (
                            <tr key={r.ruleId || idx} className="hover:bg-[#16181D]/60 transition-colors">
                              <td className="py-3 px-3">
                                <div className="space-y-0.5">
                                  <span className="font-bold text-white block">{r.ruleName}</span>
                                  <span className="text-[10px] text-[#848B98]">{r.message}</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-mono text-zinc-300">
                                {r.limitDisplay || 'Configured'}
                              </td>
                              <td className="py-3 px-3 font-mono">
                                <span className={isBreached ? 'text-rose-400 font-bold' : 'text-white'}>
                                  {r.currentValueDisplay || 'N/A'}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono">
                                {r.numericUtilizationPercent !== undefined ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 bg-[#0C0D0F] h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full ${
                                          isBreached ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${Math.min(100, r.numericUtilizationPercent)}%` }}
                                      />
                                    </div>
                                    <span>{r.numericUtilizationPercent.toFixed(1)}%</span>
                                  </div>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <Badge variant={r.severity === 'HARD_BREACH' ? 'rose' : r.severity === 'SOFT_BREACH' ? 'amber' : 'zinc'}>
                                  {r.severity}
                                </Badge>
                              </td>
                              <td className="py-3 px-3 text-right">
                                {isBreached ? (
                                  <Badge variant="rose">BREACHED</Badge>
                                ) : isWarning ? (
                                  <Badge variant="amber">AT RISK</Badge>
                                ) : r.state === 'ACHIEVED' ? (
                                  <Badge variant="emerald">ACHIEVED</Badge>
                                ) : (
                                  <Badge variant="emerald">COMPLIANT</Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-ACCOUNT COMPARISON MATRIX                                    */}
      {/* ========================================================================= */}
      {activeTab === 'MATRIX' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  <span>Unified Prop-Firm Accounts Matrix ({multiAccountComparison?.accountsCount || 0} Accounts)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="emerald">{multiAccountComparison?.passedCount || 0} PASSED</Badge>
                  <Badge variant="amber">{(multiAccountComparison?.warningCount || multiAccountComparison?.atRiskCount || 0)} AT RISK</Badge>
                  <Badge variant="rose">{multiAccountComparison?.breachedCount || 0} BREACHED</Badge>
                </div>
              </CardTitle>
              <CardDescription>
                Cross-firm side-by-side compliance, trailing drawdown buffers, and progress tracking.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] text-[#848B98] uppercase bg-[#0C0D0F]/60 border-y border-[#22252A]">
                    <tr>
                      <th className="py-3 px-3">Account & Firm</th>
                      <th className="py-3 px-3">Stage / Phase</th>
                      <th className="py-3 px-3">Starting Capital</th>
                      <th className="py-3 px-3">Current Equity</th>
                      <th className="py-3 px-3">Daily Buffer</th>
                      <th className="py-3 px-3">Max DD Buffer</th>
                      <th className="py-3 px-3">Target Progress</th>
                      <th className="py-3 px-3">Consistency</th>
                      <th className="py-3 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22252A] font-medium">
                    {multiAccountComparison?.evaluations.map((item) => {
                      const isSelected = selectedAccountId === item.accountId;
                      const dailyBreached = item.dailyLossBuffer?.isBreached ?? false;
                      const dailyWarning = item.dailyLossBuffer?.isWarning ?? false;
                      const ddBreached = item.drawdownBuffer?.isBreached ?? false;
                      const ddWarning = item.drawdownBuffer?.isWarning ?? false;
                      const consistencyBreached = !(item.consistencyMetrics?.isCompliant ?? true);
                      
                      return (
                        <tr
                          key={item.accountId}
                          onClick={() => {
                            setSelectedAccountId(item.accountId);
                            setActiveTab('RADAR');
                          }}
                          className={`hover:bg-[#16181D] cursor-pointer transition-colors ${
                            isSelected ? 'bg-emerald-500/5' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <span className="font-bold text-white block">{item.accountName}</span>
                              <span className="text-[11px] text-[#848B98]">{item.firmName || item.challengeName || 'Custom Desk'}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <Badge variant={item.isFundedStage ? 'emerald' : 'amber'}>
                              {item.isFundedStage ? 'FUNDED' : `PHASE ${item.currentPhaseNumber || 1}`}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-zinc-300">
                            ${(item.startingBalance ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-emerald-400">
                            ${(item.accountEquity ?? item.accountBalance ?? 0).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className={dailyBreached ? 'text-rose-400 font-bold' : dailyWarning ? 'text-amber-400' : 'text-zinc-300'}>
                              ${(item.dailyLossBuffer?.remainingBuffer ?? 0).toFixed(0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className={ddBreached ? 'text-rose-400 font-bold' : ddWarning ? 'text-amber-400' : 'text-zinc-300'}>
                              ${(item.drawdownBuffer?.remainingBuffer ?? 0).toFixed(0)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            {item.profitTargetProgress?.isAchieved ? (
                              <Badge variant="emerald">100% DONE</Badge>
                            ) : (
                              <span>{(item.profitTargetProgress?.percentAchieved ?? 0).toFixed(1)}%</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono">
                            <span className={consistencyBreached ? 'text-rose-400 font-bold' : 'text-zinc-300'}>
                              {(item.consistencyMetrics?.maxDayProfitRatioPercent ?? 0).toFixed(1)}% / {item.consistencyMetrics?.maxAllowedRatioPercent ?? 50}%
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <Badge
                              variant={
                                item.overallStatus === 'BREACHED' || item.overallStatus === 'HARD_BREACH' || item.overallStatus === 'SOFT_BREACH'
                                  ? 'rose'
                                  : item.overallStatus === 'AT_RISK' || item.overallStatus === 'WARNING'
                                  ? 'amber'
                                  : item.overallStatus === 'PASSED'
                                  ? 'emerald'
                                  : 'blue'
                              }
                            >
                              {item.overallStatus}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: RULE STUDIO & PROP FIRMS LIBRARY                                   */}
      {/* ========================================================================= */}
      {activeTab === 'STUDIO' && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#121417] rounded-xl border border-[#22252A]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-emerald-400" />
                Prop Firm & Rule Set Studio
              </h3>
              <p className="text-xs text-[#848B98]">
                Create, customize, clone, and manage versioned rule sets for any prop trading challenge.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={resetPropDefaults}
                className="text-xs text-zinc-300 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                Restore Presets
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreatePropFirm}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                New Prop Firm
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateRuleSet}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create Rule Set
              </Button>
            </div>
          </div>

          {/* Rule Sets Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#848B98] uppercase tracking-wider">
              Configured Rule Sets Library ({ruleSets.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ruleSets.map((rs) => (
                <Card key={rs.id} hoverEffect className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{rs.name}</h4>
                      <span className="text-[11px] font-mono text-emerald-400">
                        {rs.version || 'v1.0'} {rs.isDefault && '• Institutional Preset'}
                      </span>
                    </div>
                    <Badge variant={rs.isDefault ? 'emerald' : 'blue'}>
                      {rs.rules.length} RULES
                    </Badge>
                  </div>

                  <p className="text-xs text-[#848B98] min-h-[32px]">
                    {rs.description || 'Custom configured deterministic prop-firm rule set.'}
                  </p>

                  {/* Rules summary pills */}
                  <div className="flex flex-wrap gap-1">
                    {rs.rules.slice(0, 4).map((r, i) => (
                      <span key={i} className="text-[10px] bg-[#0C0D0F] border border-[#22252A] px-2 py-0.5 rounded text-zinc-300 font-mono">
                        {r.type}: {String(r.threshold)} {r.unit === 'PERCENT_BALANCE' ? '%' : ''}
                      </span>
                    ))}
                    {rs.rules.length > 4 && (
                      <span className="text-[10px] bg-[#0C0D0F] border border-[#22252A] px-1.5 py-0.5 rounded text-zinc-400">
                        +{rs.rules.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#22252A]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCloneRuleSet(rs)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      Clone
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditRuleSet(rs)}
                        className="text-xs"
                      >
                        <Edit3 className="h-3.5 w-3.5 mr-1" />
                        Edit Rules
                      </Button>

                      {!rs.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRuleSet(rs.id)}
                          className="h-8 w-8 p-0 text-rose-400 hover:bg-rose-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Prop Firms Directory */}
          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-bold text-[#848B98] uppercase tracking-wider">
              Registered Prop Firms & Challenge Presets ({propFirms.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {propFirms.map((firm) => (
                <Card key={firm.id} className="space-y-3 bg-[#121417]">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{firm.name}</h4>
                      {firm.website && (
                        <a
                          href={firm.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-400 hover:underline flex items-center gap-1"
                        >
                          {firm.website.replace('https://', '')}
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                    <Badge variant={firm.isCustom ? 'blue' : 'emerald'}>
                      {firm.isCustom ? 'CUSTOM FIRM' : 'VERIFIED'}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#848B98]">{firm.description}</p>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-zinc-400">
                      <span>Supported Platforms:</span>
                      <span className="text-white font-medium">{firm.supportedPlatforms?.join(', ')}</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Challenges Configured:</span>
                      <span className="text-emerald-400 font-bold">{firm.challenges?.length || 0} Challenges</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#22252A]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditPropFirm(firm)}
                      className="text-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5 mr-1" />
                      Configure Challenges
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rule Set Configurator Modal */}
      <RuleSetModal
        isOpen={isRuleSetModalOpen}
        onClose={() => setIsRuleSetModalOpen(false)}
        ruleSet={editingRuleSet}
        onSave={handleSaveRuleSet}
      />

      {/* Prop Firm & Challenge Configurator Modal */}
      <PropFirmModal
        isOpen={isPropFirmModalOpen}
        onClose={() => setIsPropFirmModalOpen(false)}
        firm={editingPropFirm}
        ruleSets={ruleSets}
        onSave={handleSavePropFirm}
      />
    </div>
  );
};
