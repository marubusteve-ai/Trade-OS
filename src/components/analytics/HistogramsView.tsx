/**
 * Interactive Quantitative Distributions & Histograms
 * PnL, R-Multiple, Holding Duration, and Execution Efficiency Bins
 */

import React, { useState, useMemo } from 'react';
import { Trade } from '../../types/domain';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { HistogramBucket } from '../../types/analytics';
import { formatCurrency } from '../../lib/utils';
import { 
  BarChart3, 
  DollarSign, 
  Target, 
  Clock, 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  ExternalLink,
  Layers
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface HistogramsViewProps {
  trades: Trade[];
  currency?: string;
  onDrillDown: (title: string, trades: Trade[], subtitle?: string) => void;
}

type HistogramType = 'PNL' | 'R_MULTIPLE' | 'DURATION' | 'EFFICIENCY';

export const HistogramsView: React.FC<HistogramsViewProps> = ({
  trades,
  currency = 'USD',
  onDrillDown,
}) => {
  const [histType, setHistType] = useState<HistogramType>('PNL');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const buckets: HistogramBucket[] = useMemo(() => {
    return AnalyticsEngine.generateHistogram(trades, histType);
  }, [trades, histType]);

  const maxCount = useMemo(() => {
    const counts = buckets.map((b) => b.count);
    return Math.max(...counts, 1);
  }, [buckets]);

  // Chart Layout Dimensions
  const width = 740;
  const height = 280;
  const padding = { top: 20, right: 25, bottom: 40, left: 45 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  const barGap = usableWidth / Math.max(1, buckets.length);
  const barWidth = Math.max(16, barGap * 0.65);

  return (
    <div className="space-y-4">
      {/* Header & Mode Switcher */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Quantitative Distributions & Histograms</h3>
              <p className="text-[11px] text-[#848B98]">
                Analyze statistical dispersion, skewness, and frequency buckets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-[#181B20] p-1 rounded-xl border border-[#22252A]">
            <button
              onClick={() => { setHistType('PNL'); setHoveredIndex(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                histType === 'PNL' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              P&L Bins ($)
            </button>
            <button
              onClick={() => { setHistType('R_MULTIPLE'); setHoveredIndex(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                histType === 'R_MULTIPLE' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              R-Multiple Bins
            </button>
            <button
              onClick={() => { setHistType('DURATION'); setHoveredIndex(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                histType === 'DURATION' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Duration Bins
            </button>
            <button
              onClick={() => { setHistType('EFFICIENCY'); setHoveredIndex(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                histType === 'EFFICIENCY' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Gauge className="h-3.5 w-3.5" />
              Efficiency Bins
            </button>
          </div>
        </div>

        {/* Dynamic Tooltip */}
        <div className="mt-3 py-2 px-3 bg-[#0C0D0F] border border-[#22252A] rounded-xl text-xs font-mono text-[#848B98] flex items-center justify-between min-h-[38px]">
          {hoveredIndex !== null && buckets[hoveredIndex] ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-white font-bold">
                {buckets[hoveredIndex].label} — {buckets[hoveredIndex].count} trades ({buckets[hoveredIndex].percentage}%)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-emerald-400 font-semibold">{buckets[hoveredIndex].winCount} Wins</span>
                <span className="text-rose-400 font-semibold">{buckets[hoveredIndex].lossCount} Losses</span>
                <span className={buckets[hoveredIndex].netPnL >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  Net P&L: {buckets[hoveredIndex].netPnL >= 0 ? '+' : ''}{formatCurrency(buckets[hoveredIndex].netPnL, currency)}
                </span>
                <span className="text-blue-400 underline cursor-pointer text-[10px]">Click to inspect</span>
              </div>
            </div>
          ) : (
            <span>Hover over histogram bars to view bucket distribution • Click bar to drill down</span>
          )}
        </div>
      </Card>

      {/* SVG Histogram Chart */}
      <Card className="p-4 bg-[#121417] border border-[#22252A] overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-pointer overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Baseline Zero Grid */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#2A2E35"
            strokeWidth="1.2"
          />

          {/* Y Axis Grid lines & values */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="#1F232B"
            strokeDasharray="3 3"
          />
          <text x={padding.left - 8} y={padding.top + 3} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
            {maxCount}
          </text>

          <line
            x1={padding.left}
            y1={padding.top + usableHeight / 2}
            x2={width - padding.right}
            y2={padding.top + usableHeight / 2}
            stroke="#1F232B"
            strokeDasharray="3 3"
          />
          <text x={padding.left - 8} y={padding.top + usableHeight / 2 + 3} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
            {Math.round(maxCount / 2)}
          </text>

          <text x={padding.left - 8} y={height - padding.bottom + 3} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
            0
          </text>

          {/* Buckets Bars */}
          {buckets.map((b, idx) => {
            const x = padding.left + idx * barGap + (barGap - barWidth) / 2;
            const totalH = (b.count / maxCount) * usableHeight;
            const winH = b.count > 0 ? (b.winCount / maxCount) * usableHeight : 0;
            const lossH = b.count > 0 ? (b.lossCount / maxCount) * usableHeight : 0;

            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => {
                  if (b.count > 0) {
                    onDrillDown(
                      `Histogram: ${b.label}`,
                      b.trades,
                      `${b.count} trades (${b.percentage}%) • Net P&L: ${b.netPnL >= 0 ? '+' : ''}${formatCurrency(b.netPnL, currency)}`
                    );
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

                {/* Loss segment (bottom) */}
                {lossH > 0 && (
                  <rect
                    x={x}
                    y={height - padding.bottom - lossH}
                    width={barWidth}
                    height={lossH}
                    fill="#f43f5e"
                    opacity={isHovered ? 1 : 0.8}
                    rx="1"
                  />
                )}

                {/* Win segment (stacked on top of loss) */}
                {winH > 0 && (
                  <rect
                    x={x}
                    y={height - padding.bottom - lossH - winH}
                    width={barWidth}
                    height={winH}
                    fill="#10b981"
                    opacity={isHovered ? 1 : 0.85}
                    rx="1.5"
                  />
                )}

                {/* Zero trades indicator */}
                {b.count === 0 && (
                  <line
                    x1={x}
                    y1={height - padding.bottom - 1}
                    x2={x + barWidth}
                    y2={height - padding.bottom - 1}
                    stroke="#404652"
                    strokeWidth="2"
                  />
                )}

                {/* Hover Outline */}
                {isHovered && totalH > 0 && (
                  <rect
                    x={x - 1}
                    y={height - padding.bottom - totalH - 1}
                    width={barWidth + 2}
                    height={totalH + 2}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.2"
                    rx="2"
                  />
                )}

                {/* Count Badge on top of bar */}
                {b.count > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={height - padding.bottom - totalH - 5}
                    fill={isHovered ? '#FFFFFF' : '#848B98'}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {b.count}
                  </text>
                )}

                {/* Bucket X-Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 14}
                  fill={isHovered ? '#FFFFFF' : '#848B98'}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="transition-colors"
                >
                  {b.label.split(' ')[0]}
                </text>
              </g>
            );
          })}
        </svg>
      </Card>

      {/* Bucket Summary Cards Table */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
        {buckets.map((b, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (b.count > 0) {
                onDrillDown(
                  `Histogram Bucket: ${b.label}`,
                  b.trades,
                  `${b.count} trades • Net P&L: ${b.netPnL >= 0 ? '+' : ''}${formatCurrency(b.netPnL, currency)}`
                );
              }
            }}
            className="p-2.5 rounded-xl bg-[#121417] border border-[#22252A] hover:border-blue-500/50 hover:bg-[#181B20] transition-all cursor-pointer text-xs"
          >
            <span className="text-[10px] text-[#848B98] block truncate font-mono">{b.label}</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-white font-mono">{b.count} tr</span>
              <span className="text-[10px] text-[#848B98]">{b.percentage}%</span>
            </div>
            <div className="mt-1 font-mono text-[11px] font-semibold">
              <span className={b.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {b.netPnL >= 0 ? '+' : ''}{formatCurrency(b.netPnL, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
