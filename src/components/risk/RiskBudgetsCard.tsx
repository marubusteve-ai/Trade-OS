/**
 * Real-Time Period Risk Budgets & Capacity Tracker
 * Daily, Weekly, Monthly Budgets, Drawdown Buffer & Remaining Risk Capacity
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RiskBudgets, RiskBudgetPeriod, RiskPolicy } from '../../types/risk';
import { DrawdownStats } from '../../types/calculations';
import { Shield, Clock, Calendar, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface RiskBudgetsCardProps {
  budgets: RiskBudgets;
  drawdown: DrawdownStats;
  policy: RiskPolicy;
}

export const RiskBudgetsCard: React.FC<RiskBudgetsCardProps> = ({
  budgets,
  drawdown,
  policy,
}) => {
  const renderBudgetGauge = (title: string, period: RiskBudgetPeriod, icon: React.ReactNode) => {
    const isCritical = period.state === 'CRITICAL';
    const isWarning = period.state === 'WARNING';

    const barColor = isCritical
      ? 'bg-rose-500'
      : isWarning
      ? 'bg-amber-500'
      : 'bg-emerald-500';

    return (
      <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isCritical ? 'bg-rose-500/10 text-rose-400' : isWarning ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              {icon}
            </div>
            <div>
              <span className="text-xs font-bold text-white block">{title}</span>
              <span className="text-[10px] text-[#848B98]">
                Cap: {period?.limitPercent ?? 0}% (${(period?.limitAmount ?? 0).toLocaleString()})
              </span>
            </div>
          </div>

          <Badge
            variant={isCritical ? 'rose' : isWarning ? 'amber' : 'emerald'}
            size="sm"
          >
            {isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'HEALTHY'}
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-[#848B98]">Budget Consumed</span>
            <span className={`font-bold ${isCritical ? 'text-rose-400' : isWarning ? 'text-amber-400' : 'text-white'}`}>
              {period?.usedPercent ?? 0}% (${(period?.usedAmount ?? 0).toLocaleString()})
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#0C0D0F] overflow-hidden p-0.5 border border-[#22252A]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(100, Math.max(0, period?.usedPercent ?? 0))}%` }}
            />
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#22252A]/60 text-[10px] font-mono">
          <div>
            <span className="text-[#848B98] block">Remaining Room:</span>
            <span className={`font-bold ${(period?.remainingAmount ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${(period?.remainingAmount ?? 0).toLocaleString()} ({period?.remainingPercent ?? 0}%)
            </span>
          </div>
          <div>
            <span className="text-[#848B98] block">Realized Loss:</span>
            <span className="text-[#D1D5DB]">
              ${(period?.realizedLoss ?? 0).toLocaleString()} ({period?.tradesCount ?? 0} trades)
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Tiered Risk Budgets & Loss Ceilings</CardTitle>
              <CardDescription>
                Dynamic capital preservation guardrails computed against account balance in real-time.
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#848B98]">Warning Threshold:</span>
            <Badge variant="outline" size="sm">{policy?.warningThresholdPercent ?? 75}%</Badge>
            <span className="text-xs text-[#848B98]">Critical:</span>
            <Badge variant="rose" size="sm">{policy?.criticalThresholdPercent ?? 90}%</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {renderBudgetGauge('Daily Risk Budget', budgets?.daily, <Clock className="h-4 w-4" />)}
          {renderBudgetGauge('Weekly Risk Budget', budgets?.weekly, <Calendar className="h-4 w-4" />)}
          {renderBudgetGauge('Monthly Risk Budget', budgets?.monthly, <Calendar className="h-4 w-4" />)}
        </div>

        {/* Drawdown & Remaining Capacity Banner */}
        <div className="p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${drawdown?.isDrawdownCritical ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
                Account Drawdown Status
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono font-bold text-white">
                  -{(drawdown?.currentDrawdownPercent ?? 0).toFixed(2)}%
                </span>
                <span className="text-xs text-[#848B98]">
                  (-${(drawdown?.currentDrawdownAmount ?? 0).toLocaleString()} from Peak ${(drawdown?.highWaterMark ?? 0).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-[10px] text-[#848B98] uppercase tracking-wider block">Drawdown Limit</span>
              <span className="text-sm font-mono font-bold text-rose-400">
                -{(policy?.maxDrawdownLimitPercent ?? 10).toFixed(1)}%
              </span>
            </div>
            <div className="h-8 w-[1px] bg-[#22252A]" />
            <div className="text-right">
              <span className="text-[10px] text-[#848B98] uppercase tracking-wider block">Safe Remaining Capacity</span>
              <span className={`text-base font-mono font-bold ${(budgets?.daily?.remainingAmount ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${(budgets?.daily?.remainingAmount ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
