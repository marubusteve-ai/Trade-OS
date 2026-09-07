/**
 * Margin & Leverage Utilization Calculator
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Input, Select } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { RiskEngine } from '../../../services/riskEngine';
import { MarginLeverageResult } from '../../../types/risk';
import { Gauge, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

interface MarginLeverageCalculatorProps {
  accountEquity: number;
}

export const MarginLeverageCalculator: React.FC<MarginLeverageCalculatorProps> = ({ accountEquity }) => {
  const [equity, setEquity] = useState<number>(accountEquity || 100000);
  const [entryPrice, setEntryPrice] = useState<number>(19850.0);
  const [quantity, setQuantity] = useState<number>(2);
  const [contractMultiplier, setContractMultiplier] = useState<number>(20);
  const [mode, setMode] = useState<'LEVERAGE' | 'MARGIN_PERCENT'>('LEVERAGE');
  const [leverageRatio, setLeverageRatio] = useState<number>(30); // 1:30
  const [marginPercent, setMarginPercent] = useState<number>(3.33);

  const result: MarginLeverageResult = RiskEngine.calculateMarginAndLeverage({
    accountEquity: equity,
    entryPrice,
    quantity,
    contractMultiplier,
    leverageOrMarginMode: mode,
    leverageRatio,
    marginPercent,
    maintenanceMarginPercent: 50,
  });

  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Gauge className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Margin & Leverage Safety Analyzer</CardTitle>
              <CardDescription>
                Model required initial margin, maintenance cushion, effective leverage, and margin call safety buffers.
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={result.state === 'CRITICAL' ? 'rose' : result.state === 'WARNING' ? 'amber' : 'emerald'}
            size="sm"
          >
            {result.state === 'CRITICAL' ? 'MARGIN CALL DANGER' : result.state === 'WARNING' ? 'HIGH LEVERAGE' : 'HEALTHY MARGIN'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Account Equity ($) *"
            type="number"
            value={equity || ''}
            onChange={(e) => setEquity(parseFloat(e.target.value) || 0)}
          />

          <Input
            label="Asset Price *"
            type="number"
            step="any"
            value={entryPrice || ''}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
          />

          <Input
            label="Position Quantity / Contracts *"
            type="number"
            step="any"
            value={quantity || ''}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
          />

          <Input
            label="Contract Multiplier"
            type="number"
            step="any"
            value={contractMultiplier || ''}
            onChange={(e) => setContractMultiplier(parseFloat(e.target.value) || 1)}
            helperText="Futures point value / CFD size"
          />

          <Select
            label="Margin Spec Mode *"
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
          >
            <option value="LEVERAGE">Leverage Ratio (1:X)</option>
            <option value="MARGIN_PERCENT">Margin Requirement (%)</option>
          </Select>

          {mode === 'LEVERAGE' ? (
            <Select
              label="Nominal Leverage Ratio *"
              value={leverageRatio}
              onChange={(e) => setLeverageRatio(parseFloat(e.target.value))}
            >
              <option value="1">1:1 (No Leverage / Cash)</option>
              <option value="5">1:5 (Equities Reg T)</option>
              <option value="10">1:10 (Crypto / CFD)</option>
              <option value="20">1:20 (Futures CME)</option>
              <option value="30">1:30 (Retail FX ESMA)</option>
              <option value="50">1:50 (US Forex NFA)</option>
              <option value="100">1:100 (Offshore / Prop)</option>
              <option value="200">1:200 (High Leverage)</option>
              <option value="500">1:500 (Max Leverage)</option>
            </Select>
          ) : (
            <Input
              label="Margin Requirement (%) *"
              type="number"
              step="any"
              value={marginPercent || ''}
              onChange={(e) => setMarginPercent(parseFloat(e.target.value) || 1)}
            />
          )}
        </div>

        {/* Results */}
        <div className={`p-4 rounded-xl border ${
          result.state === 'CRITICAL'
            ? 'bg-rose-950/10 border-rose-500/30'
            : result.state === 'WARNING'
            ? 'bg-amber-950/10 border-amber-500/30'
            : 'bg-[#0C0D0F] border-emerald-500/30'
        } space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
            <div>
              <span className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
                Total Notional Position Value
              </span>
              <div className="text-3xl font-mono font-bold text-white">
                ${(result?.positionNotional ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-[#848B98] block">Effective Portfolio Leverage</span>
                <span className="text-lg font-mono font-bold text-amber-400">
                  {(result?.effectiveLeverage ?? 0).toFixed(2)}x
                </span>
              </div>
              <div className="h-8 w-[1px] bg-[#22252A]" />
              <div>
                <span className="text-[10px] text-[#848B98] block">Margin Level Health</span>
                <span className={`text-lg font-mono font-bold ${
                  (result?.marginLevelPercent ?? 0) > 300 ? 'text-emerald-400' : (result?.marginLevelPercent ?? 0) > 150 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {(result?.marginLevelPercent ?? 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Required Initial Margin</span>
              <span className="text-sm font-bold text-blue-400">
                ${(result?.requiredInitialMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">
                {(((result?.requiredInitialMargin ?? 0) / (equity || 1)) * 100).toFixed(1)}% Equity Locked
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Maintenance Cushion</span>
              <span className="text-sm font-bold text-amber-400">
                ${(result?.maintenanceMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">Liquidation Line</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Free Margin Remaining</span>
              <span className={`text-sm font-bold ${(result?.freeMargin ?? 0) > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${(result?.freeMargin ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">Available Buffer</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Max Safe Notional (85%)</span>
              <span className="text-sm font-bold text-purple-400">
                ${(result?.maxSafeNotional ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">Prudent Ceiling</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
