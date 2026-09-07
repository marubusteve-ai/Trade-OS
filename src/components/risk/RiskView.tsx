/**
 * Quantitative Risk Management Center
 * 
 * Dynamic capital preservation, multi-asset risk calculators (Position sizing, 
 * Lot size, Stop loss, Reward/Risk, Margin/Leverage), period loss budgets 
 * (Daily/Weekly/Monthly), exposure radar, and customizable risk policies.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { useTradeOS } from '../../context/TradeOSContext';
import { PositionSizeCalculator } from './calculators/PositionSizeCalculator';
import { StopLossCalculator } from './calculators/StopLossCalculator';
import { RewardRiskCalculator } from './calculators/RewardRiskCalculator';
import { MarginLeverageCalculator } from './calculators/MarginLeverageCalculator';
import { RiskBudgetsCard } from './RiskBudgetsCard';
import { ExposureRadarCard } from './ExposureRadarCard';
import { RiskAuditView } from './RiskAuditView';
import { RiskPolicyConfigModal } from './RiskPolicyConfigModal';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Calculator,
  Compass,
  Sliders,
  RotateCcw,
  Scale,
  Gauge,
  TrendingDown,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const RiskView: React.FC = () => {
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    selectedAccount,
    selectedAccountTrades,
    metrics,
    drawdown,
    riskPolicy,
    riskBudgets,
    exposureMetrics,
    riskEvaluation,
    updateRiskPolicy,
    resetRiskPolicy,
  } = useTradeOS();

  const [activeSubTab, setActiveSubTab] = useState<'budgets' | 'calculators' | 'exposure' | 'audit'>('budgets');
  const [activeCalculator, setActiveCalculator] = useState<'position' | 'stoploss' | 'rewardrisk' | 'margin'>('position');
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState<boolean>(false);

  const accountEquity = selectedAccount ? selectedAccount.equity : accounts.reduce((acc, a) => acc + a.equity, 0) || 100000;
  const currency = selectedAccount?.currency || 'USD';
  const openTrades = selectedAccountTrades.filter(t => t.status === 'OPEN');

  const isCritical = riskEvaluation.overallState === 'CRITICAL';
  const isWarning = riskEvaluation.overallState === 'WARNING';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Account Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Risk Management Center
            </h1>
            <Badge
              variant={isCritical ? 'rose' : isWarning ? 'amber' : 'emerald'}
              size="md"
            >
              {isCritical ? 'CRITICAL RISK LEVEL' : isWarning ? 'ELEVATED RISK WARNING' : 'HEALTHY RISK BOUNDS'}
            </Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Real-time loss budgets, exposure correlation radar, multi-asset calculators & customizable risk guardrails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Account Selector */}
          <div className="min-w-[180px]">
            <Select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="py-1.5 text-xs"
            >
              <option value="ALL">All Trading Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} (${(acc.currentBalance ?? 0).toLocaleString()} {acc.currency || 'USD'})
                </option>
              ))}
            </Select>
          </div>

          {/* Policy Settings Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPolicyModalOpen(true)}
            className="text-xs border-[#22252A] hover:border-emerald-500/50"
          >
            <Sliders className="h-3.5 w-3.5 mr-1.5 text-emerald-400" />
            Configure Risk Policy
          </Button>
        </div>
      </div>

      {/* Primary KPI & Health Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <Card className="p-4 border-[#22252A] bg-[#15171A]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-sans font-semibold text-[#848B98] uppercase tracking-wider">
              Remaining Risk Capacity
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-bold ${(riskEvaluation?.remainingRiskCapacityAmount ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${(riskEvaluation?.remainingRiskCapacityAmount ?? 0).toLocaleString()}
          </div>
          <p className="text-[10px] text-[#848B98] mt-1 font-sans">
            {riskEvaluation?.remainingRiskCapacityPercent ?? 0}% Daily Risk Buffer Room
          </p>
        </Card>

        <Card className="p-4 border-[#22252A] bg-[#15171A]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-sans font-semibold text-[#848B98] uppercase tracking-wider">
              Current Drawdown
            </span>
            <TrendingDown className={`h-4 w-4 ${drawdown?.isDrawdownCritical ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${drawdown?.isDrawdownCritical ? 'text-rose-400' : 'text-amber-400'}`}>
            -{(drawdown?.currentDrawdownPercent ?? 0).toFixed(2)}%
          </div>
          <p className="text-[10px] text-[#848B98] mt-1 font-sans">
            Limit: -{riskPolicy?.maxDrawdownLimitPercent ?? 10}% (${(drawdown?.currentDrawdownAmount ?? 0).toLocaleString()} from Peak)
          </p>
        </Card>

        <Card className="p-4 border-[#22252A] bg-[#15171A]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-sans font-semibold text-[#848B98] uppercase tracking-wider">
              Active Gross Exposure
            </span>
            <Compass className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {exposureMetrics?.grossExposurePercent ?? 0}%
          </div>
          <p className="text-[10px] text-[#848B98] mt-1 font-sans">
            ${(exposureMetrics?.grossNotionalExposure ?? 0).toLocaleString()} across {exposureMetrics?.openPositionsCount ?? 0} positions
          </p>
        </Card>

        <Card className="p-4 border-[#22252A] bg-[#15171A]">
          <div className="flex items-center justify-between pb-1">
            <span className="text-[11px] font-sans font-semibold text-[#848B98] uppercase tracking-wider">
              Execution Permission
            </span>
            <Shield className={`h-4 w-4 ${riskEvaluation.isTradeAllowed ? 'text-emerald-400' : 'text-rose-400'}`} />
          </div>
          <div className={`text-2xl font-bold ${riskEvaluation.isTradeAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {riskEvaluation.isTradeAllowed ? 'PASSED' : 'RESTRICTED'}
          </div>
          <p className="text-[10px] text-[#848B98] mt-1 font-sans">
            {riskEvaluation.violations.length > 0 ? `${riskEvaluation.violations.length} Guardrail Breaches` : 'All Policies Healthy'}
          </p>
        </Card>
      </div>

      {/* Main Section Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-[#22252A] pb-px overflow-x-auto text-xs font-semibold">
        {[
          { id: 'budgets', label: 'Risk Budgets & Drawdown', icon: Shield },
          { id: 'calculators', label: 'Multi-Calculator Suite', icon: Calculator },
          { id: 'exposure', label: 'Exposure & Correlation Radar', icon: Compass },
          { id: 'audit', label: 'Risk Policy Compliance Audit', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all border-b-2 font-medium whitespace-nowrap ${
                isActive
                  ? 'border-emerald-500 text-white bg-[#15171A]'
                  : 'border-transparent text-[#848B98] hover:text-white hover:bg-[#15171A]/50'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-[#848B98]'}`} />
              <span>{tab.label}</span>
              {tab.id === 'budgets' && isCritical && (
                <span className="h-2 w-2 rounded-full bg-rose-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Risk Budgets & Drawdown */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-6">
          <RiskBudgetsCard
            budgets={riskBudgets}
            drawdown={drawdown}
            policy={riskPolicy}
          />
        </div>
      )}

      {/* Tab 2: Multi-Calculator Suite */}
      {activeSubTab === 'calculators' && (
        <div className="space-y-6">
          {/* Sub-Calculator Switcher */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'position', label: 'Position & Lot Sizer', icon: Calculator, desc: 'Per-trade contract sizing' },
              { id: 'stoploss', label: 'Stop Loss Calculator', icon: ShieldAlert, desc: 'Technical & cash invalidation' },
              { id: 'rewardrisk', label: 'Reward / Risk & Edge', icon: Scale, desc: 'Asymmetric payoff matrix' },
              { id: 'margin', label: 'Margin & Leverage', icon: Gauge, desc: 'Margin call buffer model' },
            ].map((calc) => {
              const Icon = calc.icon;
              const isSelected = activeCalculator === calc.id;
              return (
                <button
                  key={calc.id}
                  onClick={() => setActiveCalculator(calc.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-[#15171A] border-emerald-500/50 shadow-sm'
                      : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98] hover:border-[#323740]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-emerald-400' : 'text-[#848B98]'}`} />
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#D1D5DB]'}`}>
                      {calc.label}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#848B98] block">{calc.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Render Active Calculator */}
          {activeCalculator === 'position' && (
            <PositionSizeCalculator
              accountCapital={accountEquity}
              currency={currency}
            />
          )}

          {activeCalculator === 'stoploss' && (
            <StopLossCalculator
              accountCapital={accountEquity}
            />
          )}

          {activeCalculator === 'rewardrisk' && (
            <RewardRiskCalculator />
          )}

          {activeCalculator === 'margin' && (
            <MarginLeverageCalculator
              accountEquity={accountEquity}
            />
          )}
        </div>
      )}

      {/* Tab 3: Exposure & Correlation Radar */}
      {activeSubTab === 'exposure' && (
        <div className="space-y-6">
          <ExposureRadarCard
            exposure={exposureMetrics}
            openTrades={openTrades}
            policy={riskPolicy}
          />
        </div>
      )}

      {/* Tab 4: Policy Compliance Audit */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
          <RiskAuditView
            evaluation={riskEvaluation}
            policy={riskPolicy}
          />
        </div>
      )}

      {/* Modal for Risk Policy Customization */}
      <RiskPolicyConfigModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        policy={riskPolicy}
        onSave={updateRiskPolicy}
        onReset={resetRiskPolicy}
      />
    </div>
  );
};
