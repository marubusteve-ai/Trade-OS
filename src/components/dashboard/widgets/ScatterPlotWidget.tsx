import React, { useState, useMemo } from 'react';
import { Trade } from '../../../types/domain';
import { AnalyticsEngine } from '../../../services/analyticsEngine';
import { ScatterTradePoint } from '../../../types/analytics';
import { formatCurrency } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Crosshair, Target, Clock, DollarSign } from 'lucide-react';

interface ScatterPlotWidgetProps {
  trades: Trade[];
  currency?: string;
  onSelectTrade?: (tradeId: string) => void;
  height?: number;
}

type ScatterMode = 'RISK_RETURN' | 'MFE_MAE' | 'DURATION_RETURN';

export const ScatterPlotWidget: React.FC<ScatterPlotWidgetProps> = ({
  trades,
  currency = 'USD',
  onSelectTrade,
  height = 240,
}) => {
  const [mode, setMode] = useState<ScatterMode>('RISK_RETURN');
  const [hoveredPoint, setHoveredPoint] = useState<ScatterTradePoint | null>(null);

  const points: ScatterTradePoint[] = useMemo(() => {
    if (mode === 'RISK_RETURN') {
      return AnalyticsEngine.generateRiskReturnScatter(trades);
    } else if (mode === 'MFE_MAE') {
      return AnalyticsEngine.generateMfeMaeScatter(trades);
    } else {
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
          strategy: t.strategyId,
        };
      });
    }
  }, [trades, mode]);

  // Scaler calculation
  const { minX, maxX, minY, maxY } = useMemo(() => {
    if (points.length === 0) return { minX: 0, maxX: 10, minY: -100, maxY: 100 };
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      minX: Math.min(...xs, 0),
      maxX: Math.max(...xs, 1),
      minY: Math.min(...ys, 0),
      maxY: Math.max(...ys, 1),
    };
  }, [points]);

  const getSvgCoordinates = (x: number, y: number, svgWidth: number, svgHeight: number, padding: number) => {
    const usableW = svgWidth - padding * 2;
    const usableH = svgHeight - padding * 2;

    const xSpan = maxX - minX || 1;
    const ySpan = maxY - minY || 1;

    const px = padding + ((x - minX) / xSpan) * usableW;
    const py = svgHeight - padding - ((y - minY) / ySpan) * usableH;

    return { px, py };
  };

  const svgWidth = 600;
  const svgHeight = height;
  const padding = 32;

  const zeroY = getSvgCoordinates(0, 0, svgWidth, svgHeight, padding).py;
  const zeroX = getSvgCoordinates(0, 0, svgWidth, svgHeight, padding).px;

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[#0F1012] p-0.5 rounded border border-[#22252A]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('RISK_RETURN')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              mode === 'RISK_RETURN' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Target className="w-3 h-3 mr-1 text-emerald-400" />
            Planned vs Return
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('MFE_MAE')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              mode === 'MFE_MAE' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Crosshair className="w-3 h-3 mr-1 text-blue-400" />
            MFE vs MAE
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMode('DURATION_RETURN')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              mode === 'DURATION_RETURN' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 text-purple-400" />
            Duration vs P&L
          </Button>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#848B98]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Win ({points.filter((p) => p.isWin).length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Loss ({points.filter((p) => !p.isWin).length})
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 w-full bg-[#0C0D0F] rounded border border-[#1E2128] overflow-hidden p-2">
        {points.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-[#555C68]">
            No trade execution data available for scatter analysis.
          </div>
        ) : (
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
            {/* Zero axes */}
            {zeroY >= padding && zeroY <= svgHeight - padding && (
              <line
                x1={padding}
                y1={zeroY}
                x2={svgWidth - padding}
                y2={zeroY}
                stroke="#2B303C"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
            {zeroX >= padding && zeroX <= svgWidth - padding && (
              <line
                x1={zeroX}
                y1={padding}
                x2={zeroX}
                y2={svgHeight - padding}
                stroke="#2B303C"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}

            {/* Scatter dots */}
            {points.map((p) => {
              const { px, py } = getSvgCoordinates(p.x, p.y, svgWidth, svgHeight, padding);
              const isHovered = hoveredPoint?.id === p.id;

              return (
                <circle
                  key={p.id}
                  cx={px}
                  cy={py}
                  r={isHovered ? 6.5 : 4}
                  fill={p.isWin ? '#10B981' : '#F43F5E'}
                  fillOpacity={isHovered ? 0.95 : 0.65}
                  stroke={isHovered ? '#FFFFFF' : p.isWin ? '#059669' : '#E11D48'}
                  strokeWidth={isHovered ? 2 : 1}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  onClick={() => onSelectTrade?.(p.id)}
                />
              );
            })}
          </svg>
        )}

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute bottom-2 left-2 pointer-events-none bg-[#16181D] border border-[#2B303C] rounded px-2.5 py-1.5 shadow-xl text-xs flex items-center gap-3 text-white">
            <span className="font-bold text-emerald-400">{hoveredPoint.instrument}</span>
            <Badge variant={hoveredPoint.direction === 'LONG' ? 'emerald' : 'amber'}>
              {hoveredPoint.direction}
            </Badge>
            <span>P&L: <strong className={hoveredPoint.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(hoveredPoint.pnl, currency)}</strong></span>
            {hoveredPoint.rMultiple !== undefined && (
              <span>R: <strong>{hoveredPoint.rMultiple >= 0 ? '+' : ''}{hoveredPoint.rMultiple.toFixed(2)}R</strong></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
