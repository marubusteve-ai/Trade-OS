/**
 * Risk Policy & Guardrails Configuration Modal
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { RiskPolicy } from '../../types/risk';
import { ShieldCheck, RotateCcw, Save, AlertTriangle } from 'lucide-react';

interface RiskPolicyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: RiskPolicy;
  onSave: (policy: Partial<RiskPolicy>) => void;
  onReset: () => void;
}

export const RiskPolicyConfigModal: React.FC<RiskPolicyConfigModalProps> = ({
  isOpen,
  onClose,
  policy,
  onSave,
  onReset,
}) => {
  const [formData, setFormData] = useState<RiskPolicy>(policy);

  useEffect(() => {
    setFormData(policy);
  }, [policy, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset risk policy parameters to institutional defaults (1.5% per trade, 3.0% daily, 8.0% max drawdown)?')) {
      onReset();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Institutional Risk Policy & Guardrails"
      description="Configure strict capital preservation constraints and multi-tiered loss circuit breakers."
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Per-Trade Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              1. Single-Execution Guardrails
            </span>
            <Badge variant="emerald" size="sm">PER-TRADE</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Max Risk Per Trade (%) *"
              type="number"
              step="0.1"
              value={formData.maxRiskPerTradePercent}
              onChange={(e) => setFormData({ ...formData, maxRiskPerTradePercent: parseFloat(e.target.value) || 0 })}
              helperText="Suggested: 1.0% - 2.0%"
            />

            <Input
              label="Minimum Required R:R Ratio *"
              type="number"
              step="0.1"
              value={formData.minRRRatio}
              onChange={(e) => setFormData({ ...formData, minRRRatio: parseFloat(e.target.value) || 0 })}
              helperText="Suggested: 1.5R - 2.0R"
            />

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-[#D1D5DB]">Hard Stop Loss Mandate</label>
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="req_sl_policy"
                  checked={formData.requireStopLoss}
                  onChange={(e) => setFormData({ ...formData, requireStopLoss: e.target.checked })}
                  className="rounded border-[#22252A] bg-[#15171A] text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="req_sl_policy" className="text-xs text-[#848B98] cursor-pointer">
                  Strictly require Stop Loss on entry
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Period Risk Budgets */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              2. Multi-Tiered Loss Budgets (% Account Equity)
            </span>
            <Badge variant="blue" size="sm">BUDGETS</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Max Daily Loss Budget (%) *"
              type="number"
              step="0.1"
              value={formData.maxDailyRiskPercent}
              onChange={(e) => setFormData({ ...formData, maxDailyRiskPercent: parseFloat(e.target.value) || 0 })}
              helperText="Daily circuit breaker limit"
            />

            <Input
              label="Max Weekly Loss Budget (%) *"
              type="number"
              step="0.1"
              value={formData.maxWeeklyRiskPercent}
              onChange={(e) => setFormData({ ...formData, maxWeeklyRiskPercent: parseFloat(e.target.value) || 0 })}
              helperText="Weekly drawdown ceiling"
            />

            <Input
              label="Max Monthly Loss Budget (%) *"
              type="number"
              step="0.1"
              value={formData.maxMonthlyRiskPercent}
              onChange={(e) => setFormData({ ...formData, maxMonthlyRiskPercent: parseFloat(e.target.value) || 0 })}
              helperText="Monthly survival limit"
            />
          </div>
        </div>

        {/* Portfolio Exposure & Drawdown Limits */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              3. Portfolio Leverage & Drawdown Barriers
            </span>
            <Badge variant="purple" size="sm">EXPOSURE</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Max Total Account Drawdown (%) *"
              type="number"
              step="0.1"
              value={formData.maxDrawdownLimitPercent}
              onChange={(e) => setFormData({ ...formData, maxDrawdownLimitPercent: parseFloat(e.target.value) || 0 })}
              helperText="Peak-to-trough preservation limit"
            />

            <Input
              label="Max Simultaneous Exposure (%) *"
              type="number"
              step="5"
              value={formData.maxSimultaneousExposurePercent}
              onChange={(e) => setFormData({ ...formData, maxSimultaneousExposurePercent: parseFloat(e.target.value) || 0 })}
              helperText="Gross portfolio leverage cap"
            />

            <Input
              label="Max Correlated Cluster Exp (%) *"
              type="number"
              step="5"
              value={formData.maxCorrelatedExposurePercent}
              onChange={(e) => setFormData({ ...formData, maxCorrelatedExposurePercent: parseFloat(e.target.value) || 0 })}
              helperText="Concentration risk limit per asset class"
            />

            <Input
              label="Max Concurrent Open Trades *"
              type="number"
              step="1"
              value={formData.maxOpenTradesCount}
              onChange={(e) => setFormData({ ...formData, maxOpenTradesCount: parseInt(e.target.value) || 1 })}
              helperText="Positions limit"
            />

            <Input
              label="Max Consecutive Losses Breaker *"
              type="number"
              step="1"
              value={formData.maxConsecutiveLosses}
              onChange={(e) => setFormData({ ...formData, maxConsecutiveLosses: parseInt(e.target.value) || 1 })}
              helperText="Triggers cooldown reminder"
            />
          </div>
        </div>

        {/* Warning Sensitivity Thresholds */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#22252A]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              4. Alert Sensitivity Thresholds
            </span>
            <Badge variant="amber" size="sm">ALERTS</Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Warning State Trigger (% of Budget) *"
              type="number"
              step="1"
              value={formData.warningThresholdPercent}
              onChange={(e) => setFormData({ ...formData, warningThresholdPercent: parseFloat(e.target.value) || 75 })}
              helperText="Standard: 75% budget consumption"
            />

            <Input
              label="Critical Alert Trigger (% of Budget) *"
              type="number"
              step="1"
              value={formData.criticalThresholdPercent}
              onChange={(e) => setFormData({ ...formData, criticalThresholdPercent: parseFloat(e.target.value) || 95 })}
              helperText="Standard: 95% budget consumption"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#22252A]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-[#848B98] hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save Risk Policy
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
