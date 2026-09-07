/**
 * Prop Firm Compliance Tearsheet & Audit Certificate Component
 */

import React from 'react';
import { PropFirmReportData } from '../../types/reports';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Award, ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Scale, Target, Calendar } from 'lucide-react';

interface PropFirmReportSectionProps {
  data: PropFirmReportData;
}

export const PropFirmReportSection: React.FC<PropFirmReportSectionProps> = ({ data }) => {
  const {
    accountName,
    firmName,
    ruleSetName,
    startingBalance,
    currentBalance,
    highWaterMark,
    profitTargetAmount,
    profitTargetPercent,
    profitTargetReached,
    profitProgressPercent,
    dailyLossLimitAmount,
    dailyLossLimitPercent,
    todaysLossAmount,
    todaysLossPercent,
    dailyLossViolated,
    maxDrawdownLimitAmount,
    maxDrawdownLimitPercent,
    currentDrawdownAmount,
    currentDrawdownPercent,
    maxDrawdownViolated,
    minTradingDaysRequired,
    currentTradingDays,
    minDaysMet,
    overallCompliance,
    complianceScore,
    dailyDrawdownHistory,
  } = data;

  return (
    <div className="space-y-6">
      {/* Compliance Certificate Banner */}
      <div className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        overallCompliance === 'PASSED'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : overallCompliance === 'COMPLIANT'
          ? 'bg-blue-500/10 border-blue-500/30'
          : overallCompliance === 'WARNING'
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-rose-500/10 border-rose-500/30'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            overallCompliance === 'PASSED'
              ? 'bg-emerald-500/20 text-emerald-400'
              : overallCompliance === 'COMPLIANT'
              ? 'bg-blue-500/20 text-blue-400'
              : overallCompliance === 'WARNING'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {overallCompliance === 'PASSED' ? (
              <Award className="h-6 w-6" />
            ) : overallCompliance === 'COMPLIANT' ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : overallCompliance === 'WARNING' ? (
              <AlertTriangle className="h-6 w-6" />
            ) : (
              <XCircle className="h-6 w-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#F3F4F6]">{accountName} — {firmName}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                overallCompliance === 'PASSED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : overallCompliance === 'COMPLIANT'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : overallCompliance === 'WARNING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                STATUS: {overallCompliance}
              </span>
            </div>
            <p className="text-xs text-[#848B98] mt-0.5">
              Rule Framework: <strong className="text-[#C5C9D3]">{ruleSetName}</strong> • Compliance Score: <strong className="text-emerald-400">{complianceScore}/100</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-[10px] text-[#848B98] block uppercase tracking-wider">Account Equity</span>
            <span className="text-lg font-bold font-mono text-[#F3F4F6]">
              ${currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Core Prop Rule Checkpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Profit Target */}
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-emerald-400" />
              <span>Profit Target</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              profitTargetReached ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {profitTargetReached ? 'REACHED' : 'IN PROGRESS'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F3F4F6]">
            ${(currentBalance - startingBalance).toFixed(2)} / ${profitTargetAmount.toFixed(0)} ({profitTargetPercent}%)
          </div>
          <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${profitTargetReached ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, profitProgressPercent))}%` }}
            />
          </div>
          <span className="text-[10px] text-[#848B98] block">{profitProgressPercent.toFixed(1)}% Completed</span>
        </Card>

        {/* 2. Daily Loss Limit */}
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              <span>Daily Loss Limit</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              dailyLossViolated ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {dailyLossViolated ? 'BREACHED' : 'SAFE'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F3F4F6]">
            ${todaysLossAmount.toFixed(2)} / ${dailyLossLimitAmount.toFixed(0)} ({dailyLossLimitPercent}%)
          </div>
          <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${dailyLossViolated ? 'bg-rose-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, (todaysLossAmount / dailyLossLimitAmount) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#848B98] block">Today's Loss: {todaysLossPercent.toFixed(2)}%</span>
        </Card>

        {/* 3. Max Total Drawdown */}
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <Scale className="h-3.5 w-3.5 text-rose-400" />
              <span>Max Total Drawdown</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              maxDrawdownViolated ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              {maxDrawdownViolated ? 'BREACHED' : 'SAFE'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F3F4F6]">
            ${currentDrawdownAmount.toFixed(2)} / ${maxDrawdownLimitAmount.toFixed(0)} ({maxDrawdownLimitPercent}%)
          </div>
          <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${maxDrawdownViolated ? 'bg-rose-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min(100, (currentDrawdownAmount / maxDrawdownLimitAmount) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#848B98] block">Current DD: {currentDrawdownPercent.toFixed(2)}% (HWM: ${highWaterMark.toFixed(0)})</span>
        </Card>

        {/* 4. Minimum Trading Days */}
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#848B98] flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-400" />
              <span>Min Trading Days</span>
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              minDaysMet ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
            }`}>
              {minDaysMet ? 'MET' : 'PENDING'}
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-[#F3F4F6]">
            {currentTradingDays} / {minTradingDaysRequired} Days
          </div>
          <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full ${minDaysMet ? 'bg-emerald-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (currentTradingDays / (minTradingDaysRequired || 1)) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-[#848B98] block">
            {minTradingDaysRequired - currentTradingDays > 0 ? `${minTradingDaysRequired - currentTradingDays} days remaining` : 'Requirement satisfied'}
          </span>
        </Card>
      </div>

      {/* Drawdown Curve Chart */}
      <Card className="bg-[#121418] border-[#22252A]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center justify-between text-[#F3F4F6]">
            <span>Prop Firm Drawdown vs High-Water Mark Progression</span>
            <span className="text-xs text-[#848B98]">Allowed Max DD: {maxDrawdownLimitPercent}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full">
            {dailyDrawdownHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyDrawdownHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22252A" vertical={false} />
                  <XAxis dataKey="date" stroke="#848B98" fontSize={10} tickLine={false} />
                  <YAxis stroke="#848B98" fontSize={10} tickLine={false} domain={[0, maxDrawdownLimitPercent * 1.2]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0C0D0F', borderColor: '#22252A', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(val: number) => [`${val.toFixed(2)}%`, 'Drawdown %']}
                  />
                  <Area type="monotone" dataKey="drawdownPercent" stroke="#F43F5E" strokeWidth={2} fill="url(#drawdownGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#848B98]">
                No drawdown history available.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
