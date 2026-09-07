/**
 * Multi-Asset Position Size & Lot Sizer
 */

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input, Select } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { AssetClass, TradeDirection } from '../../../types/domain';
import { RiskEngine } from '../../../services/riskEngine';
import { PositionSizeResult } from '../../../types/risk';
import { Calculator, Zap, Shield, ArrowRight, Copy, Check, DollarSign } from 'lucide-react';

interface PositionSizeCalculatorProps {
  accountCapital: number;
  currency?: string;
  onApplyToTrade?: (size: number, riskAmount: number, stopLoss: number) => void;
}

const PRESET_INSTRUMENTS: Array<{
  name: string;
  assetClass: AssetClass;
  price: number;
  slOffset: number;
  multiplier: number;
  pipSize: number;
}> = [
  { name: 'NQ (Nasdaq Futures)', assetClass: 'INDICES', price: 19850.0, slOffset: 50.0, multiplier: 20, pipSize: 0.25 },
  { name: 'ES (S&P 500 Futures)', assetClass: 'INDICES', price: 5650.0, slOffset: 15.0, multiplier: 50, pipSize: 0.25 },
  { name: 'EURUSD (Forex)', assetClass: 'FOREX', price: 1.0850, slOffset: 0.0025, multiplier: 1, pipSize: 0.0001 },
  { name: 'GBPUSD (Forex)', assetClass: 'FOREX', price: 1.3120, slOffset: 0.0030, multiplier: 1, pipSize: 0.0001 },
  { name: 'XAUUSD (Gold)', assetClass: 'COMMODITIES', price: 2510.0, slOffset: 10.0, multiplier: 100, pipSize: 0.01 },
  { name: 'BTCUSDT (Crypto)', assetClass: 'CRYPTO', price: 62500.0, slOffset: 1200.0, multiplier: 1, pipSize: 1.0 },
  { name: 'NVDA (Equities)', assetClass: 'EQUITIES', price: 125.50, slOffset: 3.50, multiplier: 1, pipSize: 0.01 },
];

export const PositionSizeCalculator: React.FC<PositionSizeCalculatorProps> = ({
  accountCapital,
  currency = 'USD',
  onApplyToTrade,
}) => {
  const [capital, setCapital] = useState<number>(accountCapital || 100000);
  const [riskMode, setRiskMode] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [riskValue, setRiskValue] = useState<number>(1.0); // 1.0% or $1000
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [assetClass, setAssetClass] = useState<AssetClass>('INDICES');
  const [entryPrice, setEntryPrice] = useState<number>(19850.0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(19800.0);
  const [contractMultiplier, setContractMultiplier] = useState<number>(20);
  const [pipSize, setPipSize] = useState<number>(0.25);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync capital if external account changes
  useEffect(() => {
    if (accountCapital && accountCapital > 0) {
      setCapital(accountCapital);
    }
  }, [accountCapital]);

  // Calculate live results via RiskEngine
  const result: PositionSizeResult = RiskEngine.calculatePositionSize({
    accountCapital: capital,
    riskMode,
    riskValue,
    entryPrice,
    stopLossPrice,
    direction,
    assetClass,
    contractMultiplier,
    pipSize,
  });

  const handleApplyPreset = (preset: typeof PRESET_INSTRUMENTS[0]) => {
    setAssetClass(preset.assetClass);
    setEntryPrice(preset.price);
    setStopLossPrice(direction === 'LONG' ? preset.price - preset.slOffset : preset.price + preset.slOffset);
    setContractMultiplier(preset.multiplier);
    setPipSize(preset.pipSize);
  };

  const handleCopySummary = () => {
    if (!result.isValid) return;
    const text = `TradeOS Risk Calculation:
Asset: ${assetClass} | Direction: ${direction}
Entry: ${entryPrice} | Stop Loss: ${stopLossPrice} (Distance: ${result.priceDistance})
Calculated Size: ${result.lotSizeFormatted}
Planned Risk: $${(result.riskAmount ?? 0).toLocaleString()} (${result.riskPercent}% of Equity)
Notional Value: $${(result.notionalValue ?? 0).toLocaleString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Institutional Position Sizer & Lot Calculator</CardTitle>
              <CardDescription>
                Precision sizing for Futures contracts, Forex standard lots, Crypto coins, and Equities.
              </CardDescription>
            </div>
          </div>
          <Badge variant="emerald" size="sm">PRACTICE OF PRUDENCE</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preset Quick Selectors */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
            Quick Market Presets
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_INSTRUMENTS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#15171A] hover:bg-[#22252A] text-[#D1D5DB] border border-[#22252A] hover:border-emerald-500/40 transition-all flex items-center gap-1"
              >
                <Zap className="h-3 w-3 text-amber-400" />
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Account Equity */}
          <Input
            label={`Account Equity (${currency}) *`}
            type="number"
            value={capital || ''}
            onChange={(e) => setCapital(parseFloat(e.target.value) || 0)}
          />

          {/* Direction */}
          <Select
            label="Direction *"
            value={direction}
            onChange={(e) => {
              const newDir = e.target.value as TradeDirection;
              setDirection(newDir);
              // Swap SL to preserve validity
              if (newDir === 'LONG' && stopLossPrice >= entryPrice) {
                setStopLossPrice(entryPrice - (Math.abs(stopLossPrice - entryPrice) || 50));
              } else if (newDir === 'SHORT' && stopLossPrice <= entryPrice) {
                setStopLossPrice(entryPrice + (Math.abs(stopLossPrice - entryPrice) || 50));
              }
            }}
          >
            <option value="LONG">LONG (Buy)</option>
            <option value="SHORT">SHORT (Sell)</option>
          </Select>

          {/* Asset Class */}
          <Select
            label="Asset Class *"
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value as AssetClass)}
          >
            <option value="INDICES">Indices / Futures (NQ, ES, YM)</option>
            <option value="FOREX">Forex (Standard Lots 100k)</option>
            <option value="COMMODITIES">Commodities (Gold, Oil)</option>
            <option value="CRYPTO">Crypto (BTC, ETH)</option>
            <option value="EQUITIES">Equities / Shares</option>
          </Select>

          {/* Risk Sizing Mode & Value */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[#D1D5DB]">Risk Sizing *</label>
              <div className="flex rounded-md bg-[#0C0D0F] p-0.5 border border-[#22252A] text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setRiskMode('PERCENT');
                    setRiskValue(1.0);
                  }}
                  className={`px-2 py-0.5 rounded font-bold ${riskMode === 'PERCENT' ? 'bg-emerald-500 text-black' : 'text-[#848B98]'}`}
                >
                  % Equity
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRiskMode('AMOUNT');
                    setRiskValue(Math.round((capital * 0.01) || 1000));
                  }}
                  className={`px-2 py-0.5 rounded font-bold ${riskMode === 'AMOUNT' ? 'bg-emerald-500 text-black' : 'text-[#848B98]'}`}
                >
                  $ Cash
                </button>
              </div>
            </div>

            <Input
              type="number"
              step="any"
              value={riskValue || ''}
              onChange={(e) => setRiskValue(parseFloat(e.target.value) || 0)}
              helperText={riskMode === 'PERCENT' ? `Ceiling: $${(((capital || 0) * (riskValue || 0)) / 100).toLocaleString()}` : `${(((riskValue || 0) / (capital || 1)) * 100).toFixed(2)}% of equity`}
            />

            {/* Quick % Buttons */}
            <div className="flex gap-1 pt-1">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setRiskMode('PERCENT');
                    setRiskValue(pct);
                  }}
                  className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors ${
                    riskMode === 'PERCENT' && riskValue === pct
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : 'bg-[#0C0D0F] border-[#22252A] text-[#848B98] hover:text-white'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          {/* Entry Price */}
          <Input
            label="Entry Price *"
            type="number"
            step="any"
            value={entryPrice || ''}
            onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
          />

          {/* Stop Loss Price */}
          <Input
            label="Stop Loss Price *"
            type="number"
            step="any"
            value={stopLossPrice || ''}
            onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
            helperText={`Distance: ${Math.abs((entryPrice || 0) - (stopLossPrice || 0)).toFixed(4)}`}
          />

          {/* Multiplier / Contract Spec */}
          {(assetClass === 'INDICES' || assetClass === 'FUTURES' || assetClass === 'COMMODITIES') && (
            <Input
              label="Contract Multiplier / Point Value"
              type="number"
              step="any"
              value={contractMultiplier || ''}
              onChange={(e) => setContractMultiplier(parseFloat(e.target.value) || 1)}
              helperText="NQ=20, ES=50, GC=100, CL=1000"
            />
          )}

          {assetClass === 'FOREX' && (
            <Input
              label="Pip Size"
              type="number"
              step="any"
              value={pipSize || ''}
              onChange={(e) => setPipSize(parseFloat(e.target.value) || 0.0001)}
              helperText="0.0001 for EURUSD, 0.01 for USDJPY"
            />
          )}
        </div>

        {/* Real-Time Mathematical Results Display */}
        <div className={`p-4 rounded-xl border ${result.isValid ? 'bg-[#0C0D0F] border-emerald-500/30' : 'bg-rose-950/10 border-rose-500/30'} space-y-4`}>
          {!result.isValid ? (
            <div className="text-xs text-rose-400 flex items-center gap-2">
              <Shield className="h-4 w-4 shrink-0" />
              <span>{result.validationError || 'Invalid calculation parameters.'}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#22252A]">
                <div>
                  <span className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
                    Computed Position & Lot Size
                  </span>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {result.lotSizeFormatted}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopySummary}
                    className="text-xs"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                    {copied ? 'Copied' : 'Copy Spec'}
                  </Button>
                  {onApplyToTrade && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onApplyToTrade(result.positionSizeUnits, result.riskAmount, stopLossPrice)}
                      className="text-xs"
                    >
                      Apply To Trade
                      <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Planned Dollar Risk</span>
                  <span className="text-sm font-bold text-rose-400">
                    ${(result.riskAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    {result.riskPercent ?? 0}% Equity
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Stop Distance</span>
                  <span className="text-sm font-bold text-white">
                    {result.pipsOrPoints} {assetClass === 'FOREX' ? 'Pips' : 'Points'}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    Δ {result.priceDistance}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Total Notional Value</span>
                  <span className="text-sm font-bold text-blue-400">
                    ${(result.notionalValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    {(((result.notionalValue || 0) / (capital || 1)) * 100).toFixed(1)}% Leverage
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] font-sans block">Point / Pip Value</span>
                  <span className="text-sm font-bold text-amber-400">
                    ${result.pipOrPointValue.toFixed(2)} / {assetClass === 'FOREX' ? 'pip' : 'pt'}
                  </span>
                  <span className="text-[10px] text-[#848B98] block">
                    Unit Tick Sensitivity
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
