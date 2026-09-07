/**
 * Reward-to-Risk (R:R), Payoff & Breakeven Edge Calculator
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../ui/Card';
import { Input, Select } from '../../ui/Input';
import { Badge } from '../../ui/Badge';
import { TradeDirection } from '../../../types/domain';
import { RiskEngine } from '../../../services/riskEngine';
import { RewardRiskResult } from '../../../types/risk';
import { Scale, TrendingUp, Percent, Target } from 'lucide-react';

export const RewardRiskCalculator: React.FC = () => {
  const [entryPrice, setEntryPrice] = useState<number>(100.0);
  const [stopLossPrice, setStopLossPrice] = useState<number>(95.0);
  const [takeProfitPrice, setTakeProfitPrice] = useState<number>(115.0);
  const [direction, setDirection] = useState<TradeDirection>('LONG');
  const [quantity, setQuantity] = useState<number>(100);
  const [contractMultiplier, setContractMultiplier] = useState<number>(1);

  const result: RewardRiskResult = RiskEngine.calculateRewardRisk({
    entryPrice,
    stopLossPrice,
    takeProfitPrice,
    direction,
    quantity,
    contractMultiplier,
  });

  const handleSelectRMultiple = (rMult: number) => {
    const riskDist = Math.abs(entryPrice - stopLossPrice);
    if (riskDist <= 0) return;
    const newTP = direction === 'LONG'
      ? entryPrice + (riskDist * rMult)
      : entryPrice - (riskDist * rMult);
    setTakeProfitPrice(Number(newTP.toFixed(4)));
  };

  return (
    <Card className="border-[#22252A]">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Reward-to-Risk (R:R) & Edge Matrix</CardTitle>
              <CardDescription>
                Calculate mathematical asymmetric payoff, breakeven required win rate, and multi-R target ladders.
              </CardDescription>
            </div>
          </div>
          <Badge variant="blue" size="sm">ASYMMETRIC EDGE</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
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
            onChange={(e) => {
              const newDir = e.target.value as TradeDirection;
              setDirection(newDir);
              if (newDir === 'LONG') {
                if (stopLossPrice >= entryPrice) setStopLossPrice(entryPrice - 5);
                if (takeProfitPrice <= entryPrice) setTakeProfitPrice(entryPrice + 15);
              } else {
                if (stopLossPrice <= entryPrice) setStopLossPrice(entryPrice + 5);
                if (takeProfitPrice >= entryPrice) setTakeProfitPrice(entryPrice - 15);
              }
            }}
          >
            <option value="LONG">LONG (Buy)</option>
            <option value="SHORT">SHORT (Sell)</option>
          </Select>

          <Input
            label="Stop Loss Price *"
            type="number"
            step="any"
            value={stopLossPrice || ''}
            onChange={(e) => setStopLossPrice(parseFloat(e.target.value) || 0)}
            helperText={`Risk Dist: ${result.riskDistance}`}
          />

          <Input
            label="Take Profit Price *"
            type="number"
            step="any"
            value={takeProfitPrice || ''}
            onChange={(e) => setTakeProfitPrice(parseFloat(e.target.value) || 0)}
            helperText={`Reward Dist: ${result.rewardDistance}`}
          />

          <Input
            label="Quantity / Units"
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
          />
        </div>

        {/* Quick R Multiple Targets */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
            Set Target by Fixed R-Multiple
          </label>
          <div className="flex flex-wrap gap-2">
            {[1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleSelectRMultiple(r)}
                className="px-3 py-1.5 rounded-lg bg-[#15171A] hover:bg-[#22252A] border border-[#22252A] text-xs font-mono font-medium text-[#D1D5DB] hover:text-white transition-all flex items-center gap-1.5"
              >
                <Target className="h-3.5 w-3.5 text-blue-400" />
                1 : {r.toFixed(1)} R
              </button>
            ))}
          </div>
        </div>

        {/* Results Matrix */}
        <div className="p-4 rounded-xl bg-[#0C0D0F] border border-[#22252A] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
            <div>
              <span className="text-[11px] font-semibold text-[#848B98] uppercase tracking-wider block">
                Calculated Payoff Ratio
              </span>
              <div className="text-3xl font-mono font-bold text-blue-400">
                1 : {result.rrRatio.toFixed(2)} R
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#15171A] border border-[#22252A] flex items-center gap-3">
              <Percent className="h-5 w-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[10px] text-[#848B98] block">Required Breakeven Win Rate</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  {result.breakevenWinRatePercent}%
                </span>
                <span className="text-[10px] text-[#848B98] block">
                  {result.breakevenWinRatePercent < 40 ? 'High Positive Expectancy' : 'Standard Edge Required'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Potential Loss</span>
              <span className="text-sm font-bold text-rose-400">
                -${(result?.potentialLoss ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">1.0 R Risk</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Potential Gain</span>
              <span className="text-sm font-bold text-emerald-400">
                +${(result?.potentialProfit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#848B98] block">{result?.rrRatio ?? 0} R Reward</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Target at 2.0 R</span>
              <span className="text-sm font-bold text-white">
                {result?.targetPriceAt2R ?? 0}
              </span>
              <span className="text-[10px] text-[#848B98] block">+${(((result?.potentialLoss || 0) * 2)).toLocaleString()}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-[#15171A] border border-[#22252A]">
              <span className="text-[10px] text-[#848B98] font-sans block">Target at 3.0 R</span>
              <span className="text-sm font-bold text-white">
                {result?.targetPriceAt3R ?? 0}
              </span>
              <span className="text-[10px] text-[#848B98] block">+${(((result?.potentialLoss || 0) * 3)).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
