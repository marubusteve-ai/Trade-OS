import React, { useState } from 'react';
import { EquityPoint } from '../../types/calculations';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { TrendingUp, Activity, Layers, Crosshair, Eye } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InteractiveEquityCurveProps {
  data: EquityPoint[];
  startingBalance: number;
  currency?: string;
  height?: number;
  onSelectTrade?: (tradeId: string) => void;
}

export const InteractiveEquityCurve: React.FC<InteractiveEquityCurveProps> = ({
  data,
  startingBalance,
  currency = 'USD',
  height = 280,
  onSelectTrade,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);
  const [showHWM, setShowHWM] = useState<boolean>(true);
  const [showBaseline, setShowBaseline] = useState<boolean>(true);

  if (!data || data.length <= 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center border border-dashed border-[#22252A] rounded-xl bg-[#0C0D0F] text-[#848B98] text-xs p-6"
        style={{ height }}
      >
        <Activity className="h-6 w-6 text-[#606773] mb-2" />
        <span className="font-semibold text-white">No trade executions in selected period</span>
        <span className="text-[11px] text-[#606773] mt-0.5">Adjust filter range or log trades to visualize equity growth curve.</span>
      </div>
    );
  }

  // Calculate scales
  const balances = data.map(d => d.balance);
  const hwms = data.map(d => d.highWaterMark || d.balance);
  const minBalance = Math.min(...balances, startingBalance * 0.95);
  const maxBalance = Math.max(...balances, ...hwms, startingBalance * 1.05);
  const balanceRange = maxBalance - minBalance || 1;

  const width = 800; // internal SVG coordinate space
  const chartHeight = height - 55;
  const padding = { top: 20, right: 30, bottom: 25, left: 65 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * usableWidth;
  };

  const getY = (balance: number) => {
    const normalized = (balance - minBalance) / balanceRange;
    return padding.top + usableHeight - normalized * usableHeight;
  };

  // Balance Line points
  const points = data.map((d, i) => `${getX(i)},${getY(d.balance)}`).join(' ');
  
  // High-water mark line points
  const hwmPoints = data.map((d, i) => `${getX(i)},${getY(d.highWaterMark || d.balance)}`).join(' ');

  // Gradient area path
  const areaPath = `${points} L ${getX(data.length - 1)},${chartHeight - padding.bottom} L ${getX(0)},${chartHeight - padding.bottom} Z`;

  const baselineY = getY(startingBalance);
  const currentPoint = data[data.length - 1];
  const isNetPositive = (currentPoint?.balance || 0) >= startingBalance;
  const netGain = (currentPoint?.balance || 0) - startingBalance;

  return (
    <div className="relative w-full overflow-hidden select-none space-y-3">
      {/* Chart Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Equity & Balance Curve
          </span>
          <Badge variant="zinc">
            {data.length - 1} trades
          </Badge>
          <Badge variant={isNetPositive ? 'emerald' : 'rose'}>
            {isNetPositive ? '+' : ''}{formatCurrency(netGain, currency)}
          </Badge>
        </div>

        {/* Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHWM(!showHWM)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${
              showHWM 
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 font-medium' 
                : 'bg-[#15171A] border-[#22252A] text-[#848B98] hover:text-white'
            }`}
          >
            <Layers className="h-3 w-3" />
            High-Water Mark
          </button>

          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className={`px-2 py-1 text-[10px] rounded border transition-colors flex items-center gap-1 ${
              showBaseline 
                ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-medium' 
                : 'bg-[#15171A] border-[#22252A] text-[#848B98] hover:text-white'
            }`}
          >
            <Crosshair className="h-3 w-3" />
            Starting Baseline
          </button>
        </div>
      </div>

      {/* Real-time Tooltip Inspector Bar */}
      <div className="h-7 flex items-center justify-between px-3 py-1 bg-[#15171A] rounded-lg border border-[#22252A] text-[11px] font-mono">
        {hoveredPoint ? (
          <div className="flex items-center gap-3 overflow-x-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#848B98]">
                #{hoveredPoint.index} • {hoveredPoint.instrument || 'Init'} ({formatShortDate(hoveredPoint.date)})
              </span>
              {hoveredPoint.tradeId && onSelectTrade && (
                <button 
                  onClick={() => onSelectTrade(hoveredPoint.tradeId!)}
                  className="text-[10px] text-blue-400 underline hover:text-blue-300 ml-1"
                >
                  Inspect Trade
                </button>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>Balance: <strong className="text-white">{formatCurrency(hoveredPoint.balance, currency)}</strong></span>
              <span className={hoveredPoint.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                PnL: {hoveredPoint.pnl >= 0 ? '+' : ''}{formatCurrency(hoveredPoint.pnl, currency)}
              </span>
              <span className="text-rose-400 font-semibold">
                DD: -{hoveredPoint.drawdownPercent}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[#848B98]">
            <span>Hover on any execution node to inspect details</span>
            <span>Starting Capital: <strong className="text-[#D1D5DB]">{formatCurrency(startingBalance, currency)}</strong></span>
          </div>
        )}
      </div>

      {/* SVG Coordinate Space */}
      <div className="w-full bg-[#0C0D0F] rounded-xl border border-[#22252A] p-2.5">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isNetPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.28" />
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
                  stroke="#1F232B"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  fill="#606773"
                  fontSize="9.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {formatCurrency(val, currency, 0)}
                </text>
              </g>
            );
          })}

          {/* Starting Baseline */}
          {showBaseline && (
            <g>
              <line
                x1={padding.left}
                y1={baselineY}
                x2={width - padding.right}
                y2={baselineY}
                stroke="#3B82F6"
                strokeWidth="1.2"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <text
                x={width - padding.right + 4}
                y={baselineY + 3}
                fill="#3B82F6"
                fontSize="8.5"
                fontFamily="monospace"
                opacity="0.8"
              >
                BASE
              </text>
            </g>
          )}

          {/* High-water mark step line */}
          {showHWM && (
            <polyline
              fill="none"
              stroke="#A855F7"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              opacity="0.7"
              points={hwmPoints}
            />
          )}

          {/* Area Fill */}
          <path
            d={areaPath}
            fill="url(#eqGrad)"
          />

          {/* Balance Curve Path */}
          <polyline
            fill="none"
            stroke={isNetPositive ? '#10b981' : '#f43f5e'}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data Points Interactive Nodes */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.balance);
            const isHovered = hoveredPoint?.index === d.index;
            const isWin = d.pnl > 0.001;
            const isLoss = d.pnl < -0.001;

            return (
              <g 
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
                onClick={() => d.tradeId && onSelectTrade && onSelectTrade(d.tradeId)}
              >
                {/* Hit area for easy mouse tracking */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="transparent"
                />

                {/* Visible Node */}
                {(data.length <= 40 || isHovered || i === data.length - 1) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5.5 : 2.5}
                    fill={isHovered ? '#FFFFFF' : isWin ? '#10b981' : isLoss ? '#f43f5e' : '#606773'}
                    stroke="#0C0D0F"
                    strokeWidth="1.5"
                    className="transition-all duration-100"
                  />
                )}

                {/* Active vertical crosshair bar */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={chartHeight - padding.bottom}
                    stroke="#FFFFFF"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                    opacity="0.4"
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
