/**
 * Risk Policy Compliance & Audit Checklist
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { RiskPolicyEvaluation, RiskPolicy } from '../../types/risk';
import { ShieldCheck, AlertTriangle, XCircle, CheckCircle2, Lock } from 'lucide-react';

interface RiskAuditViewProps {
  evaluation: RiskPolicyEvaluation;
  policy: RiskPolicy;
}

export const RiskAuditView: React.FC<RiskAuditViewProps> = ({ evaluation, policy }) => {
  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${
              evaluation.overallState === 'CRITICAL'
                ? 'bg-rose-500/10 text-rose-400'
                : evaluation.overallState === 'WARNING'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Real-Time Risk Policy & Circuit Breaker Audit</CardTitle>
              <CardDescription>
                Continuous quantitative audit of active account metrics against configured risk policies.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant={evaluation.isTradeAllowed ? 'emerald' : 'rose'}
              size="sm"
            >
              {evaluation.isTradeAllowed ? 'EXECUTION PERMITTED' : 'EXECUTION RESTRICTED'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Violations / Warnings Banner */}
        {evaluation.violations.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <XCircle className="h-4 w-4 shrink-0" />
              <span>ACTIVE RISK POLICY VIOLATIONS (CIRCUIT BREAKER ENGAGED)</span>
            </div>
            <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
              {evaluation.violations.map((v, i) => (
                <li key={i}>{v}</li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.warnings.length > 0 && evaluation.violations.length === 0 && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>ELEVATED RISK NOTIFICATIONS</span>
            </div>
            <ul className="list-disc list-inside text-xs text-amber-300 space-y-1">
              {evaluation.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Audit Checklist Table */}
        <div className="space-y-3">
          {evaluation.checks.map((check) => {
            const isCrit = check.state === 'CRITICAL';
            const isWarn = check.state === 'WARNING';

            return (
              <div
                key={check.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCrit
                    ? 'bg-rose-950/10 border-rose-500/40'
                    : isWarn
                    ? 'bg-amber-950/10 border-amber-500/40'
                    : 'bg-[#15171A] border-[#22252A]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    {isCrit ? (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0" />
                    ) : isWarn ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="text-xs font-bold text-white">{check.name}</span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-[#848B98]">Limit: {check.limitDisplay}</span>
                    <span className="text-[#22252A]">|</span>
                    <span className={`font-bold ${isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>
                      Current: {check.currentDisplay}
                    </span>
                    <Badge
                      variant={isCrit ? 'rose' : isWarn ? 'amber' : 'emerald'}
                      size="sm"
                    >
                      {check.state}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="h-1.5 w-full rounded-full bg-[#0C0D0F] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, check.utilizationPercent))}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#848B98] pt-1">
                    {check.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
