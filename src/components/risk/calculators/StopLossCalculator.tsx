/**
 * Multi-Mode Stop Loss & Invalidation Level Calculator
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input, Select } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { TradeDirection } from '../../../types/domain';
import { RiskEngine } from '../../../services/riskEngine';
import { StopLossResult } from '../../../types/risk';
import { ShieldAlert, Crosshair, ArrowDownRight, ArrowUpRight, Check, Copy } from 'lucide-react';

interface StopLossCalculatorProps {
  accountCapital: number;
}

export const StopLossCalculator: React.FC<StopLossCalculatorProps> = ({ accountCapital }) => {
  const [entryPrice, setEntryPrice] = useState<number>(5650.0);
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [mode, setMode] = useState<'PRICE' | 'RISK_AMOUNT' | 'PIPS_POINTS' | 'PERCENT'>('RISK_AMOUNT');
  const [value, setValue] = useState<number>(500); // e.g. $500 risk or 20 points
  const [quantity, setQuantity] = useState<number>(2); // 2 contracts / lots
  const [contractMultiplier, setContractMultiplier] = useState<number>(50); // ES = $50/pt
  const [copied, setCopied] = useState<boolean>(false);

  const result: StopLossResult = RiskEngine.calculateStopLoss({
    entryPrice,
    direction,
    mode,
    value,
    accountCapital,
    quantity,
    contractMultiplier,
  });

  const handleCopy = () => {
    if (!result.isValid) return;
    navigator.clipboard.writeText(result.stopLossPrice.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Multi-Mode Stop Loss & Invalidation Engine</CardTitle>
              <CardDescription>
                Reverse engineer stop loss coordinates from dollar risk budget, ATR pips/points, or percentage volatility.
              </CardDescription>
            </div>
          </div>
          <Badge variant="rose" size="sm">CAPITAL PRESERVATION</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Mode Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { key: 'RISK_AMOUNT', label: 'Dollar Risk ($)', desc: 'From fixed cash risk' },
            { key: 'PIPS_POINTS', label: 'Pips / Points', desc: 'From technical distance' },
            { key: 'PERCENT', label: 'Percentage (%)', desc: 'From % volatility' },
            { key: 'PRICE', label: 'Exact Price', desc: 'Direct price level' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => {
                setMode(m.key as any);
                if (m.key === 'RISK_AMOUNT') setValue(500);
                if (m.key === 'PIPS_POINTS') setValue(15);
                if (m.key === 'PERCENT') setValue(1.0);
                if (m.key === 'PRICE') setValue(direction === 'LONG' ? entryPrice - 15 : entryPrice + 15);
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                mode === m.key
                  ? 'bg-rose-500/10 border-rose-500/50 text-white'
                  : 'bg-[#15171A] border-[#22252A] text-[#848B98] hover:border-[#323740]'
              }`}
            >
              <span className="text-xs font-bold block text-white">{m.label}</span>
              <span className="text-[10px] text-[#848B98]">{m.desc}</span>
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="Entry Price *"
            type="number"
            step="any"
            value={entryPrice || ''}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
          />

          <Select
            label="Direction *"
            value={direction}
            onChange={(e) => setDirection(e.target.value as TradeDirection)}
          >
            <option value="LONG">LONG (Buy)</option>
            <option value="SHORT">SHORT (Sell)</option>
          </Select>

          <Input
            label={
              mode === 'RISK_AMOUNT'
                ? 'Target Dollar Risk ($) *'
                : mode === 'PIPS_POINTS'
                ? 'Distance (Pips/Points) *'
                : mode === 'PERCENT'
                ? 'Distance (% of Price) *'
                : 'Direct Stop Price *'
            }
            type="number"
            step="any"
            value={value || ''}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
          />

          <Input
            label="Position Size / Quantity *"
            type="number"
            step="any"
            value={quantity || ''}
            onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
          />

          <Input
            label="Contract Multiplier ($/pt)"
            type="number"
            step="any"
            value={contractMultiplier || ''}
            onChange={(e) => setContractMultiplier(parseFloat(e.target.value) || 1)}
            helperText="ES=50, NQ=20, Gold=100, Stocks=1"
          />
        </div>

        {/* Results */}
        <div className={`p-4 rounded-xl border ${result.isValid ? 'bg-[#0C0D0F] border-rose-500/30' : 'bg-rose-950/10 border-rose-500/30'} space-y-4`}>
          {!result.isValid ? (
            <div className="text-xs text-rose-400">
              {result.validationError || 'Invalid stop loss configuration.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#22252A]">
                <div>
                  <span className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
                    Calculated Stop Loss Level
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-mono font-bold text-rose-400">
                      {result.stopLossPrice.toFixed(4)}
                    </span>
                    {direction === 'LONG' ? (
                      <Badge variant="rose" size="sm">
                        <ArrowDownRight className="h-3 w-3 mr-1" />
                        Below Entry
                      </Badge>
                    ) : (
                      <Badge variant="rose" size="sm">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Above Entry
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="text-xs self-start sm:self-auto"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? 'Copied Level' : 'Copy Price'}
                </Button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Total Monetary Risk</span>
                  <span className="text-sm font-bold text-rose-400">
                    ${(result?.riskAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    {result?.riskPercent ?? 0}% of Equity
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Invalidation Distance</span>
                  <span className="text-sm font-bold text-white">
                    {result.pipsOrPoints} Points / Pips
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    Δ {result.distance.toFixed(4)}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Loss Per Contract</span>
                  <span className="text-sm font-bold text-amber-400">
                    ${((result.distance * contractMultiplier) || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    Unit Tick Exposure
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
