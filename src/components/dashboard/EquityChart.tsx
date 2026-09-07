import React, { useState } from 'react';
import { EquityPoint } from '../../types/calculations';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { TrendingUp, Activity } from 'lucide-react';

interface EquityChartProps {
  data: EquityPoint[];
  startingBalance: number;
  currency?: string;
  height?: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({
  data,
  startingBalance,
  currency = 'USD',
  height = 240,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);

  if (!data || data.length <= 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center border border-dashed border-[#22252A] rounded-xl bg-[#0C0D0F] text-[#848B98] text-xs p-6"
        style={{ height }}
      >
        <Activity className="h-6 w-6 text-[#606773] mb-2" />
        <span>No closed trade history to render equity curve yet.</span>
        <span className="text-[11px] text-[#606773] mt-0.5">Log trades to visualize capital growth.</span>
      </div>
    );
  }

  // Calculate scales
  const balances = data.map(d => d.balance);
  const minBalance = Math.min(...balances, startingBalance * 0.95);
  const maxBalance = Math.max(...balances, startingBalance * 1.05);
  const balanceRange = maxBalance - minBalance || 1;

  const width = 800; // SVG internal coordinate space
  const chartHeight = height - 40;
  const padding = { top: 20, right: 30, bottom: 25, left: 60 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * usableWidth;
  };

  const getY = (balance: number) => {
    const normalized = (balance - minBalance) / balanceRange;
    return padding.top + usableHeight - normalized * usableHeight;
  };

  // Generate SVG path points
  const points = data.map((d, i) => `${getX(i)},${getY(d.balance)}`).join(' ');
  const baselineY = getY(startingBalance);

  // Gradient area path
  const areaPath = `${points} L ${getX(data.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z`;

  const isNetPositive = (data[data.length - 1]?.balance || 0) >= startingBalance;

  return (
    <div className="relative w-full overflow-hidden select-none">
      {/* Chart Header Meta */}
      <div className="flex items-center justify-between text-xs mb-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Equity Growth Curve
          </span>
          <span className="text-[11px] font-mono text-[#848B98]">
            ({data.length - 1} executed trades)
          </span>
        </div>

        {hoveredPoint ? (
          <div className="flex items-center gap-3 text-[11px] font-mono bg-[#15171A] px-2.5 py-1 rounded-md border border-[#22252A] animate-in fade-in duration-100">
            <span className="text-[#D1D5DB]">
              Trade #{hoveredPoint.index} ({hoveredPoint.instrument || 'Init'}):
            </span>
            <span className="text-white font-bold">
              {formatCurrency(hoveredPoint.balance, currency)}
            </span>
            <span className={hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {hoveredPoint.pnl >= 0 ? '+' : ''}{formatCurrency(hoveredPoint.pnl, currency)}
            </span>
          </div>
        ) : (
          <div className="text-[11px] font-mono text-[#848B98]">
            Baseline: <strong className="text-[#D1D5DB]">{formatCurrency(startingBalance, currency)}</strong>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full bg-[#0C0D0F] rounded-xl border border-[#22252A] p-2">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
              <stop offset="100%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = minBalance + ratio * balanceRange;
            const y = getY(val);
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#22252A"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  fill="#848B98"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatCurrency(val, currency, 0)}
                </text>
              </g>
            );
          })}

          {/* Starting Baseline */}
          <line
            x1={padding.left}
            y1={baselineY}
            x2={width - padding.right}
            y2={baselineY}
            stroke="#606773"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />

          {/* Gradient Area Fill */}
          <path d={areaPath} fill="url(#equityGrad)" />

          {/* Main Equity Line */}
          <polyline
            fill="none"
            stroke={isNetPositive ? '#10b981' : '#f43f5e'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.balance);
            const isHovered = hoveredPoint?.index === d.index;
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5 : 3}
                  fill={d.balance >= startingBalance ? '#10b981' : '#f43f5e'}
                  stroke="#0C0D0F"
                  strokeWidth="2"
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredPoint(d)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={chartHeight - padding.bottom}
                    stroke="#848B98"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
