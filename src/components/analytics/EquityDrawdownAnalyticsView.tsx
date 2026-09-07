/**
 * Cumulative Equity Curve & Underwater Drawdown Analysis
 * High-Water Mark Line, Peak-to-Trough Metrics, and Ulcer Index
 */

import React, { useState, useMemo } from 'react';
import { Trade } from '../../types/domain';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Activity, 
  Award, 
  ArrowDownRight,
  Maximize2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface EquityDrawdownAnalyticsViewProps {
  trades: Trade[];
  startingBalance?: number;
  currency?: string;
  onSelectTrade?: (trade: Trade) => void;
}

export const EquityDrawdownAnalyticsView: React.FC<EquityDrawdownAnalyticsViewProps> = ({
  trades,
  startingBalance = 100000,
  currency = 'USD',
  onSelectTrade,
}) => {
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const equityData = useMemo(() => {
    return CalculationEngine.generateEquityCurve(trades, startingBalance);
  }, [trades, startingBalance]);

  const drawdownStats = useMemo(() => {
    return CalculationEngine.calculateDrawdown(equityData, startingBalance);
  }, [equityData, startingBalance]);

  const closedTrades = trades.filter((t) => t.status === 'CLOSED');

  if (equityData.length <= 1) {
    return (
      <Card className="p-8 text-center bg-[#121417] border border-[#22252A]">
        <Activity className="h-8 w-8 text-[#848B98] mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">Insufficient equity curve history</h3>
        <p className="text-xs text-[#848B98] mt-1">
          Execute and close multiple trades to generate the cumulative equity curve and underwater drawdown chart.
        </p>
      </Card>
    );
  }

  // Calculate High-Water Mark series & Underwater DD series
  let currentPeak = startingBalance;
  const equityPointsWithPeak = equityData.map((pt) => {
    if (pt.balance > currentPeak) {
      currentPeak = pt.balance;
    }
    const ddAmount = currentPeak - pt.balance;
    const ddPct = currentPeak > 0 ? (ddAmount / currentPeak) * 100 : 0;

    return {
      ...pt,
      peak: currentPeak,
      ddAmount,
      ddPct,
    };
  });

  // Calculate UI Ulcer Index
  const sumSquaredDD = equityPointsWithPeak.reduce((sum, p) => sum + p.ddPct * p.ddPct, 0);
  const ulcerIndex = Number(Math.sqrt(sumSquaredDD / equityPointsWithPeak.length).toFixed(2));

  // Chart Layout
  const width = 760;
  const height = 240;
  const ddHeight = 110;
  const padding = { top: 20, right: 30, bottom: 25, left: 65 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  const usableDDHeight = ddHeight - padding.top - padding.bottom;

  const minBalance = Math.min(...equityPointsWithPeak.map((p) => p.balance), startingBalance * 0.95);
  const maxBalance = Math.max(...equityPointsWithPeak.map((p) => p.peak), startingBalance * 1.05);
  const balanceRange = maxBalance - minBalance || 1;

  const maxDDPct = Math.max(...equityPointsWithPeak.map((p) => p.ddPct), 5) * 1.15;

  const scaleX = (index: number) => {
    return padding.left + (index / (equityPointsWithPeak.length - 1)) * usableWidth;
  };

  const scaleBalanceY = (val: number) => {
    return padding.top + usableHeight - ((val - minBalance) / balanceRange) * usableHeight;
  };

  const scaleDDY = (ddPct: number) => {
    return padding.top + (ddPct / maxDDPct) * usableDDHeight;
  };

  // Build SVG Path strings
  const equityPath = equityPointsWithPeak
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleBalanceY(p.balance)}`)
    .join(' ');

  const peakPath = equityPointsWithPeak
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleBalanceY(p.peak)}`)
    .join(' ');

  const equityAreaPath = `${equityPath} L ${scaleX(equityPointsWithPeak.length - 1)} ${padding.top + usableHeight} L ${scaleX(0)} ${padding.top + usableHeight} Z`;

  const ddAreaPath = `${equityPointsWithPeak
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleDDY(p.ddPct)}`)
    .join(' ')} L ${scaleX(equityPointsWithPeak.length - 1)} ${padding.top} L ${scaleX(0)} ${padding.top} Z`;

  const currentEquity = equityPointsWithPeak[equityPointsWithPeak.length - 1].balance;
  const totalNet = currentEquity - startingBalance;
  const totalReturnPct = ((totalNet / startingBalance) * 100).toFixed(2);

  const hoveredPoint = hoveredPointIndex !== null ? equityPointsWithPeak[hoveredPointIndex] : null;

  return (
    <div className="space-y-4">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 bg-[#121417] border border-[#22252A]">
          <span className="text-[10px] text-[#848B98] uppercase font-semibold block">Max Drawdown</span>
          <span className="text-base font-bold text-rose-400 font-mono mt-0.5 block">
            -{drawdownStats.maxDrawdownPercent}%
          </span>
          <span className="text-[10px] text-[#848B98] font-mono">
            -${formatCurrency(drawdownStats.maxDrawdownAmount, currency, 0)}
          </span>
        </Card>

        <Card className="p-3.5 bg-[#121417] border border-[#22252A]">
          <span className="text-[10px] text-[#848B98] uppercase font-semibold block">Ulcer Index (UI)</span>
          <span className="text-base font-bold text-white font-mono mt-0.5 block">
            {ulcerIndex}
          </span>
          <span className="text-[10px] text-[#848B98]">Quadratic Drawdown Volatility</span>
        </Card>

        <Card className="p-3.5 bg-[#121417] border border-[#22252A]">
          <span className="text-[10px] text-[#848B98] uppercase font-semibold block">Peak All-Time High</span>
          <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">
            {formatCurrency(drawdownStats.peakBalance, currency, 0)}
          </span>
          <span className="text-[10px] text-[#848B98]">High-Water Mark</span>
        </Card>

        <Card className="p-3.5 bg-[#121417] border border-[#22252A]">
          <span className="text-[10px] text-[#848B98] uppercase font-semibold block">Current Drawdown</span>
          <span className={`text-base font-bold font-mono mt-0.5 block ${
            drawdownStats.currentDrawdownAmount === 0 ? 'text-emerald-400' : 'text-amber-400'
          }`}>
            {drawdownStats.currentDrawdownAmount === 0 ? 'At Peak (0.0%)' : `-${drawdownStats.currentDrawdownPercent}%`}
          </span>
          <span className="text-[10px] text-[#848B98] font-mono">
            {drawdownStats.currentDrawdownAmount > 0 ? `-$${formatCurrency(drawdownStats.currentDrawdownAmount, currency, 0)}` : 'Clean Equity Peak'}
          </span>
        </Card>
      </div>

      {/* Cumulative Equity Chart Card */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-[#22252A]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              Cumulative Equity Curve & High-Water Mark
            </span>
            <Badge variant="zinc">{equityPointsWithPeak.length} Points</Badge>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1 text-[#848B98]">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Realized Equity
            </span>
            <span className="flex items-center gap-1 text-[#848B98]">
              <span className="h-1.5 w-3 bg-amber-400/60 rounded-xs" /> High-Water Mark
            </span>
          </div>
        </div>

        {/* Hover Readout */}
        <div className="h-7 flex items-center justify-between px-3 bg-[#0C0D0F] rounded-lg border border-[#22252A] text-xs font-mono mb-2">
          {hoveredPoint ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#848B98]">
                {formatShortDate(hoveredPoint.date)} • Trade #{hoveredPointIndex}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold">Balance: {formatCurrency(hoveredPoint.balance, currency)}</span>
                <span className="text-amber-400 font-semibold">Peak: {formatCurrency(hoveredPoint.peak, currency)}</span>
                <span className={hoveredPoint.ddPct > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                  DD: -{hoveredPoint.ddPct.toFixed(1)}%
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-[#848B98]">
              <span>Hover anywhere across the curve to inspect historic balance levels</span>
              <span>Net: {totalNet >= 0 ? '+' : ''}{formatCurrency(totalNet, currency)} ({totalReturnPct}%)</span>
            </div>
          )}
        </div>

        {/* SVG Equity Canvas */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={padding.left}
            y1={scaleBalanceY(startingBalance)}
            x2={width - padding.right}
            y2={scaleBalanceY(startingBalance)}
            stroke="#2A2E35"
            strokeDasharray="3 3"
          />
          <text x={padding.left - 8} y={scaleBalanceY(startingBalance) + 3} fill="#848B98" fontSize="8.5" textAnchor="end" fontFamily="monospace">
            ${Math.round(startingBalance / 1000)}k
          </text>

          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#1F232B"
          />
          <text x={padding.left - 8} y={padding.top + 3} fill="#848B98" fontSize="8.5" textAnchor="end" fontFamily="monospace">
            ${Math.round(maxBalance / 1000)}k
          </text>

          {/* Shaded Area Under Equity Curve */}
          <path d={equityAreaPath} fill="url(#equityGrad)" />

          {/* High-Water Mark Step Line */}
          <path d={peakPath} fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 2" opacity="0.65" />

          {/* Realized Equity Line */}
          <path d={equityPath} fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Hover Vertical Cursor */}
          {hoveredPointIndex !== null && (
            <line
              x1={scaleX(hoveredPointIndex)}
              y1={padding.top}
              x2={scaleX(hoveredPointIndex)}
              y2={padding.top + usableHeight}
              stroke="#FFFFFF"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}

          {/* Data Points overlay & hit areas */}
          {equityPointsWithPeak.map((p, idx) => {
            const cx = scaleX(idx);
            const cy = scaleBalanceY(p.balance);
            const isHovered = hoveredPointIndex === idx;

            return (
              <g key={idx} onMouseEnter={() => setHoveredPointIndex(idx)}>
                <rect
                  x={cx - (usableWidth / equityPointsWithPeak.length) / 2}
                  y={padding.top}
                  width={usableWidth / equityPointsWithPeak.length}
                  height={usableHeight}
                  fill="transparent"
                />
                {isHovered && (
                  <circle cx={cx} cy={cy} r="4.5" fill="#10b981" stroke="#FFFFFF" strokeWidth="1.5" />
                )}
              </g>
            );
          })}
        </svg>
      </Card>

      {/* Underwater Drawdown Percentage Chart */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#22252A]">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-rose-400" />
            Underwater Drawdown (% from Peak)
          </span>
          <span className="text-xs text-rose-400 font-mono font-bold">
            Max: -{drawdownStats.maxDrawdownPercent}%
          </span>
        </div>

        <svg
          viewBox={`0 0 ${width} ${ddHeight}`}
          className="w-full h-auto select-none overflow-visible"
        >
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Zero baseline */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#2A2E35"
            strokeWidth="1.2"
          />
          <text x={padding.left - 8} y={padding.top + 3} fill="#848B98" fontSize="8.5" textAnchor="end" fontFamily="monospace">
            0%
          </text>

          {/* Max DD line */}
          <line
            x1={padding.left}
            y1={ddHeight - padding.bottom}
            x2={width - padding.right}
            y2={ddHeight - padding.bottom}
            stroke="#1F232B"
            strokeDasharray="2 2"
          />
          <text x={padding.left - 8} y={ddHeight - padding.bottom + 3} fill="#f43f5e" fontSize="8.5" textAnchor="end" fontFamily="monospace">
            -{Math.round(maxDDPct)}%
          </text>

          {/* Underwater Shaded Area */}
          <path d={ddAreaPath} fill="url(#ddGrad)" />

          {/* Underwater Line */}
          <path
            d={equityPointsWithPeak
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i)} ${scaleDDY(p.ddPct)}`)
              .join(' ')}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.6"
          />
        </svg>
      </Card>
    </div>
  );
};
