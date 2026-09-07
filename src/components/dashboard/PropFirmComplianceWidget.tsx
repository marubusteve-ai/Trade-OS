import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  HelpCircle 
} from 'lucide-react';
import { PropFirmComplianceStatus } from '../../types/calculations';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface PropFirmComplianceWidgetProps {
  compliance: PropFirmComplianceStatus | null;
  accountName?: string;
}

export const PropFirmComplianceWidget: React.FC<PropFirmComplianceWidgetProps> = ({
  compliance,
  accountName,
}) => {
  if (!compliance) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span>Prop Firm Rules & Objectives</span>
            <Badge variant="zinc">SELECT ACCOUNT</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-[#848B98]">
            Select a specific evaluation or funded account from the top menu to view live compliance limits.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (compliance.overallStatus) {
      case 'PASSED':
        return <Badge variant="emerald">CHALLENGE PASSED</Badge>;
      case 'ON_TRACK':
        return <Badge variant="emerald">ON TRACK</Badge>;
      case 'AT_RISK':
        return <Badge variant="amber">RISK WARNING</Badge>;
      case 'BREACHED':
        return <Badge variant="rose">RULE BREACHED</Badge>;
      default:
        return <Badge variant="zinc">STANDARD ACCOUNT</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-[#22252A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-400" />
            <CardTitle className="text-sm font-semibold text-white">
              Prop Firm Compliance
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-3">
        {/* Profit Target */}
        {compliance.profitTargetAmount ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#848B98]">Profit Target</span>
              <span className="font-semibold text-emerald-400">
                {compliance.profitTargetProgressPercent}% ({formatCurrency(compliance.currentProfitAmount)} / {formatCurrency(compliance.profitTargetAmount)})
              </span>
            </div>
            <div className="h-2 w-full bg-[#0C0D0F] rounded-full overflow-hidden border border-[#22252A]">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, compliance.profitTargetProgressPercent || 0))}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* Daily Loss Limit Buffer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#848B98]">Daily Loss Remaining</span>
            <span className={`font-semibold ${compliance.dailyLossWarning ? 'text-rose-400 font-bold' : 'text-[#D1D5DB]'}`}>
              {formatCurrency(compliance.dailyLossRemainingBuffer)} buffer
            </span>
          </div>
          <div className="h-2 w-full bg-[#0C0D0F] rounded-full overflow-hidden border border-[#22252A]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                compliance.dailyLossWarning ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, 100 - compliance.dailyLossUsedPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#848B98] font-mono">
            <span>Loss today: {formatCurrency(compliance.todaysLossAmount)}</span>
            <span>Limit: {formatCurrency(compliance.dailyLossLimitAmount || 0)}</span>
          </div>
        </div>

        {/* Max Drawdown Limit Buffer */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#848B98]">Max Drawdown Buffer</span>
            <span className={`font-semibold ${compliance.maxLossWarning ? 'text-rose-400 font-bold' : 'text-[#D1D5DB]'}`}>
              {formatCurrency(compliance.maxDrawdownRemainingBuffer)} buffer
            </span>
          </div>
          <div className="h-2 w-full bg-[#0C0D0F] rounded-full overflow-hidden border border-[#22252A]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                compliance.maxLossWarning ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, 100 - compliance.maxDrawdownUsedPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-[#848B98] font-mono">
            <span>Threshold: {formatCurrency(compliance.maxTotalLossThreshold)}</span>
            <span>Max loss: {formatCurrency(compliance.maxLossLimitAmount || 0)}</span>
          </div>
        </div>

        {/* Trading Days requirement */}
        {compliance.minTradingDaysRequired && compliance.minTradingDaysRequired > 0 ? (
          <div className="pt-2 border-t border-[#22252A] flex items-center justify-between text-xs font-mono">
            <span className="text-[#848B98]">Min Trading Days:</span>
            <span className="text-white font-semibold">
              {compliance.tradingDaysCompleted} / {compliance.minTradingDaysRequired} days
              {compliance.isMinTradingDaysPassed && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 inline ml-1" />
              )}
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
