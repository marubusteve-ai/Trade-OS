import React, { useState } from 'react';
import { DailyPnLEntry } from '../../types/calculations';
import { Trade } from '../../types/domain';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { BarChart3, Activity, Calendar, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface PnLDistributionChartProps {
  dailyPnL: DailyPnLEntry[];
  trades: Trade[];
  currency?: string;
  height?: number;
  onDrillDownDay?: (dateStr: string) => void;
  onSelectTrade?: (tradeId: string) => void;
}

export const PnLDistributionChart: React.FC<PnLDistributionChartProps> = ({
  dailyPnL,
  trades,
  currency = 'USD',
  height = 260,
  onDrillDownDay,
  onSelectTrade,
}) => {
  const [viewMode, setViewMode] = useState<'DAILY' | 'TRADE'>('DAILY');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const closedTrades = trades
    .filter(t => t.status === 'CLOSED')
    .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

  const isDaily = viewMode === 'DAILY';
  const dataLength = isDaily ? dailyPnL.length : closedTrades.length;

  if (dataLength === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center border border-dashed border-[#22252A] rounded-xl bg-[#0C0D0F] text-[#848B98] text-xs p-6"
        style={{ height }}
      >
        <Activity className="h-6 w-6 text-[#606773] mb-2" />
        <span className="font-semibold text-white">No P&L distribution data</span>
        <span className="text-[11px] text-[#606773] mt-0.5">Execute and close trades to populate P&L bars.</span>
      </div>
    );
  }

  // Extract values
  const values = isDaily 
    ? dailyPnL.map(d => d.netPnL) 
    : closedTrades.map(t => t.netPnL);

  const maxAbsPnL = Math.max(...values.map(v => Math.abs(v)), 100);
  const ceiling = maxAbsPnL * 1.15;

  const width = 700;
  const chartHeight = height - 55;
  const padding = { top: 15, right: 25, bottom: 25, left: 60 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = chartHeight - padding.top - padding.bottom;
  const zeroY = padding.top + usableHeight / 2;

  const barWidth = Math.max(3, Math.min(24, (usableWidth / dataLength) * 0.7));
  const barGap = usableWidth / dataLength;

  return (
    <div className="relative w-full overflow-hidden select-none space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            P&L Distribution Chart
          </span>
          <Badge variant="zinc">
            {isDaily ? `${dailyPnL.length} trading days` : `${closedTrades.length} closed trades`}
          </Badge>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-[#15171A] p-0.5 rounded-lg border border-[#22252A]">
          <button
            onClick={() => { setViewMode('DAILY'); setHoveredIndex(null); }}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${
              viewMode === 'DAILY' ? 'bg-[#22252A] text-white' : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            <Calendar className="h-2.5 w-2.5" />
            Daily
          </button>
          <button
            onClick={() => { setViewMode('TRADE'); setHoveredIndex(null); }}
            className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${
              viewMode === 'TRADE' ? 'bg-[#22252A] text-white' : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            <Zap className="h-2.5 w-2.5" />
            Per Trade
          </button>
        </div>
      </div>

      {/* Tooltip bar */}
      <div className="h-7 flex items-center justify-between px-3 py-1 bg-[#15171A] rounded-lg border border-[#22252A] text-[11px] font-mono">
        {hoveredIndex !== null ? (
          isDaily ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#848B98]">
                {dailyPnL[hoveredIndex].date} ({dailyPnL[hoveredIndex].tradesCount} trades)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-semibold">{dailyPnL[hoveredIndex].winCount}W</span>
                <span className="text-rose-400 font-semibold">{dailyPnL[hoveredIndex].lossCount}L</span>
                <span className={dailyPnL[hoveredIndex].netPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  Net: {dailyPnL[hoveredIndex].netPnL >= 0 ? '+' : ''}{formatCurrency(dailyPnL[hoveredIndex].netPnL, currency)}
                </span>
                {onDrillDownDay && (
                  <span className="text-[10px] text-blue-400 underline cursor-pointer">Click to inspect</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-[#848B98]">
                #{hoveredIndex + 1} • {closedTrades[hoveredIndex].instrument} ({formatShortDate(closedTrades[hoveredIndex].exitDate || closedTrades[hoveredIndex].entryDate)})
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#D1D5DB]">{closedTrades[hoveredIndex].direction} {closedTrades[hoveredIndex].quantity} units</span>
                <span className={closedTrades[hoveredIndex].netPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {closedTrades[hoveredIndex].netPnL >= 0 ? '+' : ''}{formatCurrency(closedTrades[hoveredIndex].netPnL, currency)}
                </span>
                {onSelectTrade && (
                  <span className="text-[10px] text-blue-400 underline cursor-pointer">Click to inspect</span>
                )}
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-between w-full text-[#848B98]">
            <span>Hover on bars to inspect P&L distribution</span>
            <span>Range: ±{formatCurrency(ceiling, currency, 0)}</span>
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full bg-[#0C0D0F] rounded-xl border border-[#22252A] p-2.5">
        <svg
          viewBox={`0 0 ${width} ${chartHeight}`}
          className="w-full h-auto overflow-visible cursor-pointer"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Zero center-line */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#2A2E35"
            strokeWidth="1.2"
          />
          <text
            x={padding.left - 8}
            y={zeroY + 3}
            fill="#848B98"
            fontSize="9"
            textAnchor="end"
            fontFamily="monospace"
          >
            $0
          </text>

          {/* Upper ceiling line (+max) */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#1F232B"
            strokeDasharray="3 3"
          />
          <text
            x={padding.left - 8}
            y={padding.top + 3}
            fill="#606773"
            fontSize="8.5"
            textAnchor="end"
            fontFamily="monospace"
          >
            +{formatCurrency(ceiling, currency, 0)}
          </text>

          {/* Lower floor line (-max) */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={width - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#1F232B"
            strokeDasharray="3 3"
          />
          <text
            x={padding.left - 8}
            y={chartHeight - padding.bottom + 3}
            fill="#606773"
            fontSize="8.5"
            textAnchor="end"
            fontFamily="monospace"
          >
            -{formatCurrency(ceiling, currency, 0)}
          </text>

          {/* Bars */}
          {values.map((val, idx) => {
            const isWin = val > 0.001;
            const isLoss = val < -0.001;
            const normalizedHeight = (Math.abs(val) / ceiling) * (usableHeight / 2);
            const barH = Math.max(2, normalizedHeight);
            
            const x = padding.left + idx * barGap + (barGap - barWidth) / 2;
            const y = isWin ? zeroY - barH : zeroY;
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => {
                  if (isDaily && onDrillDownDay) {
                    onDrillDownDay(dailyPnL[idx].date);
                  } else if (!isDaily && onSelectTrade && closedTrades[idx]) {
                    onSelectTrade(closedTrades[idx].id);
                  }
                }}
              >
                {/* Hit area */}
                <rect
                  x={padding.left + idx * barGap}
                  y={padding.top}
                  width={barGap}
                  height={usableHeight}
                  fill="transparent"
                />

                {/* Visible Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx="1.5"
                  fill={isWin ? '#10b981' : isLoss ? '#f43f5e' : '#606773'}
                  opacity={isHovered ? 1 : 0.82}
                  className="transition-all duration-75"
                />

                {/* Hover indicator outline */}
                {isHovered && (
                  <rect
                    x={x - 1}
                    y={y - 1}
                    width={barWidth + 2}
                    height={barH + 2}
                    rx="2"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1"
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
