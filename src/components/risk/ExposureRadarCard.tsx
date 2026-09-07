/**
 * Exposure Radar & Correlated Clusters Monitor
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ExposureMetrics, RiskPolicy } from '../../types/risk';
import { Trade } from '../../types/domain';
import { Layers, Activity, AlertCircle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

interface ExposureRadarCardProps {
  exposure: ExposureMetrics;
  openTrades: Trade[];
  policy: RiskPolicy;
}

export const ExposureRadarCard: React.FC<ExposureRadarCardProps> = ({
  exposure,
  openTrades,
  policy,
}) => {
  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Exposure Radar & Correlated Asset Clusters</CardTitle>
              <CardDescription>
                Gross and net leverage monitoring with cluster-based risk concentration limits.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={exposure.state === 'CRITICAL' ? 'rose' : exposure.state === 'WARNING' ? 'amber' : 'emerald'}
            size="sm"
          >
            {exposure.state === 'CRITICAL' ? 'EXPOSURE CEILING BREACH' : exposure.state === 'WARNING' ? 'ELEVATED HEAT' : 'BALANCED EXPOSURE'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Top Exposure Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] text-[#848B98] font-sans block">Gross Portfolio Exposure</span>
            <span className="text-base font-bold text-purple-400">
              ${(exposure?.grossNotionalExposure ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#848B98] block">
              {exposure?.grossExposurePercent ?? 0}% Equity (Max {policy?.maxSimultaneousExposurePercent ?? 100}%)
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] text-[#848B98] font-sans block">Net Directional Bias</span>
            <span className={`text-base font-bold ${(exposure?.netNotionalExposure ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {(exposure?.netNotionalExposure ?? 0) >= 0 ? '+' : ''}${(exposure?.netNotionalExposure ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#848B98] block">
              {(exposure?.netExposurePercent ?? 0) >= 0 ? 'Net Long' : 'Net Short'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] text-[#848B98] font-sans block">Long Notional</span>
            <span className="text-base font-bold text-emerald-400">
              ${(exposure?.longNotionalExposure ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#848B98] block">Buy Orders Active</span>
          </div>

          <div className="p-3 rounded-xl bg-[#15171A] border border-[#22252A]">
            <span className="text-[10px] text-[#848B98] font-sans block">Short Notional</span>
            <span className="text-base font-bold text-rose-400">
              ${(exposure?.shortNotionalExposure ?? 0).toLocaleString()}
            </span>
            <span className="text-[10px] text-[#848B98] block">Sell Orders Active</span>
          </div>
        </div>

        {/* Correlated Groups Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Correlated Asset Concentration Groups
            </span>
            <span className="text-[11px] text-[#848B98]">
              Cluster Limit: Max {policy.maxCorrelatedExposurePercent}% Equity
            </span>
          </div>

          {exposure.correlatedGroups.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#0C0D0F] border border-[#22252A] text-center text-xs text-[#848B98]">
              No active open positions. Portfolio has zero open correlation risk.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exposure.correlatedGroups.map((group) => {
                const isGroupCritical = group.state === 'CRITICAL';
                const isGroupWarning = group.state === 'WARNING';

                return (
                  <div
                    key={group.groupId}
                    className={`p-3.5 rounded-xl border ${
                      isGroupCritical
                        ? 'bg-rose-950/10 border-rose-500/40'
                        : isGroupWarning
                        ? 'bg-amber-950/10 border-amber-500/40'
                        : 'bg-[#15171A] border-[#22252A]'
                    } space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[220px]">
                        {group.groupName}
                      </span>
                      <Badge
                        variant={isGroupCritical ? 'rose' : isGroupWarning ? 'amber' : 'emerald'}
                        size="sm"
                      >
                        {group.exposurePercent}% Equity
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#848B98]">
                      <span>Gross: ${(group?.grossNotional ?? 0).toLocaleString()}</span>
                      <span>Risk: ${(group?.plannedRiskAmount ?? 0).toLocaleString()}</span>
                      <span>{group.openTradesCount} Active {group.openTradesCount === 1 ? 'Trade' : 'Trades'}</span>
                    </div>

                    {/* Progress */}
                    <div className="h-1.5 w-full rounded-full bg-[#0C0D0F] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isGroupCritical ? 'bg-rose-500' : isGroupWarning ? 'bg-amber-500' : 'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, (group.exposurePercent / (policy?.maxCorrelatedExposurePercent || 1)) * 100)}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {group.instruments.map((inst) => (
                        <span key={inst} className="px-1.5 py-0.5 rounded bg-[#0C0D0F] text-[10px] font-mono text-[#848B98] border border-[#22252A]">
                          {inst}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Open Positions Table */}
        {openTrades.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Active Open Positions & Risk Allocations
            </span>
            <div className="overflow-x-auto rounded-xl border border-[#22252A]">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#15171A] text-[#848B98] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Instrument</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Entry Price</th>
                    <th className="py-2.5 px-3">Stop Loss</th>
                    <th className="py-2.5 px-3">Planned Risk</th>
                    <th className="py-2.5 px-3">Notional</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22252A] bg-[#0C0D0F]">
                  {openTrades.map((t) => (
                    <tr key={t.id} className="hover:bg-[#15171A]/50">
                      <td className="py-2 px-3 font-bold text-white">{t.instrument}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center ${t.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.direction === 'LONG' ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                          {t.direction}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-[#D1D5DB]">{t.quantity}</td>
                      <td className="py-2 px-3 text-[#D1D5DB]">${(t.entryPrice ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-rose-400">
                        {t.stopLoss !== undefined && t.stopLoss !== null ? `$${t.stopLoss.toLocaleString()}` : 'None'}
                      </td>
                      <td className="py-2 px-3 text-amber-400 font-bold">
                        ${((t.plannedRiskAmount || 0)).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-purple-400">
                        ${(((t.quantity || 0) * (t.entryPrice || 0) * (t.contractMultiplier || 1))).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
