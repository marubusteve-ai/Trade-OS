/**
 * Interactive Quantitative Scatter Plot & Excursion Analysis
 * MFE vs MAE, Risk vs Return, and Holding Duration vs Realized PnL
 */

import React, { useState, useMemo } from 'react';
import { Trade } from '../../types/domain';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { ScatterTradePoint } from '../../types/analytics';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { 
  Crosshair, 
  Target, 
  Clock, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Info,
  ExternalLink
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface ScatterPlotViewProps {
  trades: Trade[];
  currency?: string;
  onDrillDownTrade: (trade: Trade) => void;
}

type ScatterMode = 'MFE_MAE' | 'RISK_RETURN' | 'DURATION_RETURN';

export const ScatterPlotView: React.FC<ScatterPlotViewProps> = ({
  trades,
  currency = 'USD',
  onDrillDownTrade,
}) => {
  const [mode, setMode] = useState<ScatterMode>('MFE_MAE');
  const [hoveredPoint, setHoveredPoint] = useState<ScatterTradePoint | null>(null);

  const points: ScatterTradePoint[] = useMemo(() => {
    if (mode === 'MFE_MAE') {
      return AnalyticsEngine.generateMfeMaeScatter(trades);
    } else if (mode === 'RISK_RETURN') {
      return AnalyticsEngine.generateRiskReturnScatter(trades);
    } else {
      // DURATION_RETURN
      const closed = trades.filter((t) => t.status === 'CLOSED');
      return closed.map((t, idx) => {
        const pnl = t.netPnL || 0;
        const dur = Math.round((t.holdingTimeSeconds || 0) / 60);
        return {
          id: t.id,
          tradeNumber: idx + 1,
          instrument: t.instrument,
          direction: t.direction,
          x: dur,
          y: pnl,
          pnl,
          isWin: pnl > 0.001,
          rMultiple: t.achievedRMultiple,
          durationMinutes: dur,
          entryEfficiency: 50,
          exitEfficiency: pnl > 0 ? 80 : 0,
          label: `${t.instrument} - Duration: ${dur}m, P&L: $${pnl.toFixed(2)}`,
          trade: t,
        };
      });
    }
  }, [mode, trades]);

  if (points.length === 0) {
    return (
      <Card className="p-8 text-center bg-[#121417] border border-[#22252A]">
        <Activity className="h-8 w-8 text-[#848B98] mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-white">No trade data available for scatter plot</h3>
        <p className="text-xs text-[#848B98] mt-1">
          Execute and close trades to generate excursion (MFE vs MAE) and risk-return distributions.
        </p>
      </Card>
    );
  }

  // SVG Chart Dimensions
  const width = 760;
  const height = 380;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };

  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;

  // Domain scaling calculations
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);

  let minX = Math.min(...xValues, 0);
  let maxX = Math.max(...xValues, 10);
  if (maxX === minX) maxX += 10;
  maxX *= 1.1;

  let minY = Math.min(...yValues, 0);
  let maxY = Math.max(...yValues, 10);
  if (maxY === minY) maxY += 10;
  const absMaxY = Math.max(Math.abs(minY), Math.abs(maxY)) * 1.15;

  // Zero-crossing coordinates
  const scaleX = (val: number) => {
    return padding.left + ((val - minX) / (maxX - minX)) * usableWidth;
  };

  const scaleY = (val: number) => {
    if (mode === 'MFE_MAE') {
      // Both MFE and MAE are positive magnitude >= 0
      return padding.top + usableHeight - (val / maxY) * usableHeight;
    } else {
      // Y can be positive or negative ($ PnL)
      const zeroY = padding.top + usableHeight / 2;
      return zeroY - (val / absMaxY) * (usableHeight / 2);
    }
  };

  const zeroY = mode === 'MFE_MAE' ? padding.top + usableHeight : padding.top + usableHeight / 2;

  // Correlation & Summary Calculation
  const avgX = xValues.reduce((a, b) => a + b, 0) / points.length;
  const avgY = yValues.reduce((a, b) => a + b, 0) / points.length;

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Crosshair className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Interactive Excursion & Scatter Analysis</h3>
              <p className="text-[11px] text-[#848B98]">
                Hover over individual trade dots or click to inspect trade details
              </p>
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-[#181B20] p-1 rounded-xl border border-[#22252A]">
            <button
              onClick={() => { setMode('MFE_MAE'); setHoveredPoint(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'MFE_MAE' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              MFE vs MAE (Excursions)
            </button>
            <button
              onClick={() => { setMode('RISK_RETURN'); setHoveredPoint(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'RISK_RETURN' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <DollarSign className="h-3.5 w-3.5" />
              Risk vs Realized P&L
            </button>
            <button
              onClick={() => { setMode('DURATION_RETURN'); setHoveredPoint(null); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                mode === 'DURATION_RETURN' ? 'bg-blue-600 text-white font-semibold shadow-xs' : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Duration vs Realized P&L
            </button>
          </div>
        </div>

        {/* Dynamic Tooltip & Trade Indicator */}
        <div className="mt-3 py-2 px-3 bg-[#0C0D0F] border border-[#22252A] rounded-xl text-xs font-mono flex items-center justify-between min-h-[38px]">
          {hoveredPoint ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Badge variant={hoveredPoint.direction === 'LONG' ? 'emerald' : 'rose'}>
                  {hoveredPoint.direction}
                </Badge>
                <span className="font-bold text-white">{hoveredPoint.instrument}</span>
                <span className="text-[#848B98]">({formatShortDate(hoveredPoint.trade.entryDate)})</span>
              </div>
              <div className="flex items-center gap-3">
                {mode === 'MFE_MAE' && (
                  <>
                    <span className="text-emerald-400">MFE: +${hoveredPoint.y.toFixed(2)}</span>
                    <span className="text-rose-400">MAE: -${hoveredPoint.x.toFixed(2)}</span>
                    <span className="text-blue-400">Exit Eff: {hoveredPoint.exitEfficiency}%</span>
                  </>
                )}
                {mode === 'RISK_RETURN' && (
                  <>
                    <span className="text-[#848B98]">Risk: ${hoveredPoint.x.toFixed(2)}</span>
                    <span className={hoveredPoint.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      PnL: {hoveredPoint.pnl >= 0 ? '+' : ''}${hoveredPoint.pnl.toFixed(2)}
                    </span>
                  </>
                )}
                {mode === 'DURATION_RETURN' && (
                  <>
                    <span className="text-[#848B98]">Duration: {hoveredPoint.durationMinutes} mins</span>
                    <span className={hoveredPoint.pnl >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      PnL: {hoveredPoint.pnl >= 0 ? '+' : ''}${hoveredPoint.pnl.toFixed(2)}
                    </span>
                  </>
                )}
                <span className="text-blue-400 underline cursor-pointer text-[10px]">Click to inspect</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full text-[#848B98]">
              <span>
                {mode === 'MFE_MAE'
                  ? 'Showing Maximum Favorable Excursion vs Adverse Excursion for all closed trades'
                  : mode === 'RISK_RETURN'
                  ? 'Showing Planned Sized Risk ($) vs Actual Realized Return ($)'
                  : 'Showing Trade Holding Duration (mins) vs Actual Realized Return ($)'}
              </span>
              <span>Total Points: {points.length}</span>
            </div>
          )}
        </div>
      </Card>

      {/* SVG Scatter Plot Canvas */}
      <Card className="p-4 bg-[#121417] border border-[#22252A] overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Background Grid */}
          <line
            x1={padding.left}
            y1={zeroY}
            x2={width - padding.right}
            y2={zeroY}
            stroke="#2A2E35"
            strokeWidth="1.2"
          />
          <line
            x1={scaleX(0)}
            y1={padding.top}
            x2={scaleX(0)}
            y2={height - padding.bottom}
            stroke="#2A2E35"
            strokeWidth="1.2"
          />

          {/* 1:1 Diagonal Reference line for MFE vs MAE */}
          {mode === 'MFE_MAE' && (
            <line
              x1={scaleX(0)}
              y1={scaleY(0)}
              x2={scaleX(Math.min(maxX, maxY))}
              y2={scaleY(Math.min(maxX, maxY))}
              stroke="#3B82F6"
              strokeDasharray="4 4"
              strokeOpacity="0.4"
              strokeWidth="1.2"
            />
          )}

          {/* Y Axis Labels */}
          {mode === 'MFE_MAE' ? (
            <>
              <text x={padding.left - 10} y={padding.top + 8} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                +${Math.round(maxY)}
              </text>
              <text x={padding.left - 10} y={padding.top + usableHeight / 2} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                +${Math.round(maxY / 2)}
              </text>
              <text x={padding.left - 10} y={padding.top + usableHeight} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                $0
              </text>
            </>
          ) : (
            <>
              <text x={padding.left - 10} y={padding.top + 8} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                +${Math.round(absMaxY)}
              </text>
              <text x={padding.left - 10} y={zeroY + 3} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                $0
              </text>
              <text x={padding.left - 10} y={height - padding.bottom} fill="#848B98" fontSize="9" textAnchor="end" fontFamily="monospace">
                -${Math.round(absMaxY)}
              </text>
            </>
          )}

          {/* X Axis Labels */}
          <text x={scaleX(0)} y={height - padding.bottom + 16} fill="#848B98" fontSize="9" textAnchor="middle" fontFamily="monospace">
            0
          </text>
          <text x={scaleX(maxX / 2)} y={height - padding.bottom + 16} fill="#848B98" fontSize="9" textAnchor="middle" fontFamily="monospace">
            {mode === 'DURATION_RETURN' ? `${Math.round(maxX / 2)}m` : `$${Math.round(maxX / 2)}`}
          </text>
          <text x={scaleX(maxX)} y={height - padding.bottom + 16} fill="#848B98" fontSize="9" textAnchor="middle" fontFamily="monospace">
            {mode === 'DURATION_RETURN' ? `${Math.round(maxX)}m` : `$${Math.round(maxX)}`}
          </text>

          {/* Axis Titles */}
          <text
            x={width / 2}
            y={height - 8}
            fill="#848B98"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            {mode === 'MFE_MAE' ? 'Maximum Adverse Excursion (MAE Drawdown $)' : mode === 'RISK_RETURN' ? 'Planned Trade Risk ($)' : 'Holding Duration (Minutes)'}
          </text>
          <text
            x={-height / 2}
            y={18}
            transform="rotate(-90)"
            fill="#848B98"
            fontSize="10"
            fontWeight="600"
            textAnchor="middle"
          >
            {mode === 'MFE_MAE' ? 'Maximum Favorable Excursion (MFE Peak $)' : 'Realized Net P&L ($)'}
          </text>

          {/* Scatter Points */}
          {points.map((pt) => {
            const cx = Math.max(padding.left, Math.min(width - padding.right, scaleX(pt.x)));
            const cy = Math.max(padding.top, Math.min(height - padding.bottom, scaleY(pt.y)));
            const isHovered = hoveredPoint?.id === pt.id;

            return (
              <g
                key={pt.id}
                onMouseEnter={() => setHoveredPoint(pt)}
                onClick={() => onDrillDownTrade(pt.trade)}
                className="cursor-pointer"
              >
                {/* Outer Glow on hover */}
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill={pt.isWin ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}
                    stroke={pt.isWin ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.5"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? '5' : '3.5'}
                  fill={pt.isWin ? '#10b981' : '#f43f5e'}
                  opacity={isHovered ? 1 : 0.82}
                  stroke="#121417"
                  strokeWidth="1"
                  className="transition-all duration-75"
                />
              </g>
            );
          })}
        </svg>
      </Card>
    </div>
  );
};
