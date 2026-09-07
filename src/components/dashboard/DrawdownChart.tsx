import React, { useState } from 'react';
import { DrawdownCurvePoint } from '../../types/calculations';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { TrendingDown, Activity, Percent, DollarSign, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface DrawdownChartProps {
  data: DrawdownCurvePoint[];
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  currentDrawdownPercent: number;
  currency?: string;
  height?: number;
  onSelectTrade?: (tradeId: string) => void;
}

export const DrawdownChart: React.FC<DrawdownChartProps> = ({
  data,
  maxDrawdownPercent,
  maxDrawdownAmount,
  currentDrawdownPercent,
  currency = 'USD',
  height = 260,
  onSelectTrade,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<DrawdownCurvePoint | null>(null);
  const [unitMode, setUnitMode] = useState<'PERCENT' | 'DOLLAR'>('PERCENT');

  if (!data || data.length <= 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center border border-dashed border-[#22252A] rounded-xl bg-[#0C0D0F] text-[#848B98] text-xs p-6"
        style={{ height }}
      >
        <Activity className="h-6 w-6 text-[#606773] mb-2" />
        <span className="font-semibold text-white">No drawdown data recorded</span>
        <span className="text-[11px] text-[#606773] mt-0.5">Execute closed trades to analyze drawdown depth & recovery.</span>
      </div>
    );
  }

  const isPercent = unitMode === 'PERCENT';
  const maxDD = isPercent 
    ? Math.max(...data.map(d => d.drawdownPercent), 5) 
    : Math.max(...data.map(d => d.drawdownAmount), 500);

  const ceiling = maxDD * 1.15;

  const width = 700;
  const chartHeight = height - 55;
  const padding = { top: 20, right: 25, bottom: 25, left: 60 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;

  const getX = (index: number) => {
    return padding.left + (index / (data.length - 1)) * usableWidth;
  };

  const getY = (val: number) => {
    const normalized = Math.min(1, Math.max(0, val / ceiling));
    return padding.top + normalized * usableHeight;
  };

  // SVG Path for drawdown line (0 is top padding)
  const linePoints = data.map((d, i) => {
    const val = isPercent ? d.drawdownPercent : d.drawdownAmount;
    return `${getX(i)},${getY(val)}`;
  }).join(' ');

  // Gradient area path (anchored to top waterline)
  const areaPath = `M ${getX(0)},${padding.top} L ${linePoints} L ${getX(data.length - 1)},${padding.top} Z`;

  return (
    <div className="relative w-full overflow-hidden select-none space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <TrendingDown className="h-4 w-4 text-rose-400" />
            Underwater Drawdown Chart
          </span>
          <Badge variant="rose">
            Max DD: -{maxDrawdownPercent}% ({formatCurrency(maxDrawdownAmount, currency)})
          </Badge>
          <Badge variant={currentDrawdownPercent === 0 ? 'emerald' : 'amber'}>
            Current: {currentDrawdownPercent === 0 ? 'At High (0%)' : `-${currentDrawdownPercent}%`}
          </Badge>
        </div>

        {/* Unit toggle */}
        <div className="flex items-center gap-1 bg-[#15171A] p-0.5 rounded-lg border border-[#22252A]">
          <button
            onClick={() => setUnitMode('PERCENT')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${
              isPercent ? 'bg-[#22252A] text-white' : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            <Percent className="h-2.5 w-2.5" />
            Percent
          </button>
          <button
            onClick={() => setUnitMode('DOLLAR')}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${
              !isPercent ? 'bg-[#22252A] text-white' : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            <DollarSign className="h-2.5 w-2.5" />
            Amount
          </button>
        </div>
      </div>

      {/* Tooltip bar */}
      <div className="h-7 flex items-center justify-between px-3 py-1 bg-[#15171A] rounded-lg border border-[#22252A] text-[11px] font-mono">
        {hoveredPoint ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-[#848B98]">
              #{hoveredPoint.index} • {hoveredPoint.instrument || 'Init'} ({formatShortDate(hoveredPoint.date)})
            </span>
            <div className="flex items-center gap-4">
              <span>Peak: <strong className="text-white">{formatCurrency(hoveredPoint.highWaterMark, currency)}</strong></span>
              <span className="text-rose-400 font-bold">
                DD: -{hoveredPoint.drawdownPercent}% (-{formatCurrency(hoveredPoint.drawdownAmount, currency)})
              </span>
              {hoveredPoint.isPeak && (
                <span className="text-emerald-400 font-semibold text-[10px]">ALL-TIME HIGH</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[#848B98]">
            <span>Underwater profile tracking peak-to-trough capital pullbacks</span>
            <span>Scale: 0% to -{isPercent ? `${ceiling.toFixed(1)}%` : formatCurrency(ceiling, currency, 0)}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full bg-[#0C0D0F] rounded-xl border border-[#22252A] p-2.5">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Top 0% Waterline */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#10b981"
            strokeWidth="1.5"
          />
          <text
            x={padding.left - 8}
            y={padding.top + 3.5}
            fill="#10b981"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            0% (Peak)
          </text>

          {/* Grid lines (downward steps: 25%, 50%, 75%, 100%) */}
          {[0.33, 0.66, 1].map((ratio) => {
            const val = ratio * ceiling;
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
                  fontSize="8.5"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  -{isPercent ? `${val.toFixed(1)}%` : formatCurrency(val, currency, 0)}
                </text>
              </g>
            );
          })}

          {/* Underwater Area */}
          <path
            d={areaPath}
            fill="url(#ddGrad)"
          />

          {/* Drawdown Curve Line */}
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={linePoints}
          />

          {/* Nodes & Interaction */}
          {data.map((d, i) => {
            const val = isPercent ? d.drawdownPercent : d.drawdownAmount;
            const cx = getX(i);
            const cy = getY(val);
            const isHovered = hoveredPoint?.index === d.index;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(d)}
                onClick={() => d.tradeId && onSelectTrade && onSelectTrade(d.tradeId)}
              >
                {/* Hit area */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="10"
                  fill="transparent"
                />

                {/* Node */}
                {(data.length <= 40 || isHovered || d.isPeak) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 5 : d.isPeak ? 3.5 : 2}
                    fill={d.isPeak ? '#10b981' : '#f43f5e'}
                    stroke="#0C0D0F"
                    strokeWidth="1.5"
                  />
                )}

                {/* Vertical crosshair */}
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
