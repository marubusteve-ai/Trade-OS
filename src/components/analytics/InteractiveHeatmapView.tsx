/**
 * Interactive Trading Performance Heatmaps
 * Day-of-Week vs Hour-of-Day Matrix & Monthly/Yearly Performance Heatmap
 */

import React, { useState, useMemo } from 'react';
import { Trade } from '../../types/domain';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { DayHourHeatmapCell, MonthYearHeatmapCell } from '../../types/analytics';
import { formatCurrency } from '../../lib/utils';
import { 
  Calendar, 
  Clock, 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Info,
  DollarSign,
  Percent,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface InteractiveHeatmapViewProps {
  trades: Trade[];
  currency?: string;
  onDrillDown: (title: string, trades: Trade[], subtitle?: string) => void;
}

type HeatmapMetric = 'PNL' | 'WIN_RATE' | 'VOLUME';

export const InteractiveHeatmapView: React.FC<InteractiveHeatmapViewProps> = ({
  trades,
  currency = 'USD',
  onDrillDown,
}) => {
  const [heatmapType, setHeatmapType] = useState<'DAY_HOUR' | 'MONTH_YEAR'>('DAY_HOUR');
  const [metric, setMetric] = useState<HeatmapMetric>('PNL');
  const [hoveredCellInfo, setHoveredCellInfo] = useState<string | null>(null);

  const dayHourMatrix = useMemo(() => {
    return AnalyticsEngine.generateDayHourHeatmap(trades);
  }, [trades]);

  const monthYearMatrix = useMemo(() => {
    return AnalyticsEngine.generateMonthYearHeatmap(trades);
  }, [trades]);

  const maxAbsPnL = useMemo(() => {
    if (heatmapType === 'DAY_HOUR') {
      const pnls = dayHourMatrix.map((c) => Math.abs(c.netPnL));
      return Math.max(...pnls, 100);
    } else {
      const pnls = monthYearMatrix.map((c) => Math.abs(c.netPnL));
      return Math.max(...pnls, 100);
    }
  }, [heatmapType, dayHourMatrix, monthYearMatrix]);

  const maxVolume = useMemo(() => {
    if (heatmapType === 'DAY_HOUR') {
      return Math.max(...dayHourMatrix.map((c) => c.tradesCount), 1);
    } else {
      return Math.max(...monthYearMatrix.map((c) => c.tradesCount), 1);
    }
  }, [heatmapType, dayHourMatrix, monthYearMatrix]);

  // Color generator for heatmap cells
  const getCellColor = (tradesCount: number, netPnL: number, winRate: number) => {
    if (tradesCount === 0) return 'bg-[#15171A] border-[#22252A] text-[#606773]';

    if (metric === 'PNL') {
      if (netPnL > 0) {
        const intensity = Math.min(1, netPnL / maxAbsPnL);
        if (intensity > 0.6) return 'bg-emerald-500/80 border-emerald-400 text-white font-bold';
        if (intensity > 0.3) return 'bg-emerald-600/50 border-emerald-500/60 text-emerald-100';
        return 'bg-emerald-950/60 border-emerald-800/40 text-emerald-300';
      } else if (netPnL < 0) {
        const intensity = Math.min(1, Math.abs(netPnL) / maxAbsPnL);
        if (intensity > 0.6) return 'bg-rose-500/80 border-rose-400 text-white font-bold';
        if (intensity > 0.3) return 'bg-rose-600/50 border-rose-500/60 text-rose-100';
        return 'bg-rose-950/60 border-rose-800/40 text-rose-300';
      }
      return 'bg-[#1E2228] border-[#2E343F] text-[#848B98]';
    } else if (metric === 'WIN_RATE') {
      if (winRate >= 70) return 'bg-emerald-500/80 border-emerald-400 text-white font-bold';
      if (winRate >= 50) return 'bg-emerald-600/50 border-emerald-500/60 text-emerald-100';
      if (winRate >= 30) return 'bg-amber-600/50 border-amber-500/60 text-amber-100';
      return 'bg-rose-600/50 border-rose-500/60 text-rose-100';
    } else {
      // VOLUME
      const intensity = Math.min(1, tradesCount / maxVolume);
      if (intensity > 0.6) return 'bg-blue-500/80 border-blue-400 text-white font-bold';
      if (intensity > 0.3) return 'bg-blue-600/50 border-blue-500/60 text-blue-100';
      return 'bg-blue-950/60 border-blue-800/40 text-blue-300';
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hoursOfDay = Array.from({ length: 24 }, (_, i) => i);
  const monthsOfYear = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const yearsInMonthMatrix = useMemo(() => {
    return Array.from(new Set(monthYearMatrix.map((c) => c.year))).sort();
  }, [monthYearMatrix]);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <Card className="p-4 bg-[#121417] border border-[#22252A]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Heatmap Type Switcher */}
          <div className="flex items-center gap-1.5 bg-[#181B20] p-1 rounded-xl border border-[#22252A]">
            <button
              onClick={() => setHeatmapType('DAY_HOUR')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                heatmapType === 'DAY_HOUR'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              Day vs Hour Matrix (7x24)
            </button>
            <button
              onClick={() => setHeatmapType('MONTH_YEAR')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                heatmapType === 'MONTH_YEAR'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-[#848B98] hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Monthly / Yearly Grid
            </button>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#848B98]">Metric:</span>
            <div className="flex items-center gap-1 bg-[#181B20] p-1 rounded-xl border border-[#22252A]">
              <button
                onClick={() => setMetric('PNL')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  metric === 'PNL' ? 'bg-[#22252A] text-emerald-400 font-bold' : 'text-[#848B98] hover:text-white'
                }`}
              >
                <DollarSign className="h-3 w-3" />
                Net P&L
              </button>
              <button
                onClick={() => setMetric('WIN_RATE')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  metric === 'WIN_RATE' ? 'bg-[#22252A] text-blue-400 font-bold' : 'text-[#848B98] hover:text-white'
                }`}
              >
                <Percent className="h-3 w-3" />
                Win Rate
              </button>
              <button
                onClick={() => setMetric('VOLUME')}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  metric === 'VOLUME' ? 'bg-[#22252A] text-purple-400 font-bold' : 'text-[#848B98] hover:text-white'
                }`}
              >
                <Layers className="h-3 w-3" />
                Trades Count
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Tooltip Bar */}
        <div className="mt-3 py-2 px-3 bg-[#0C0D0F] border border-[#22252A] rounded-xl text-xs font-mono text-[#848B98] flex items-center justify-between min-h-[36px]">
          {hoveredCellInfo ? (
            <span className="text-white font-medium">{hoveredCellInfo}</span>
          ) : (
            <span>Hover over any matrix cell to inspect performance • Click to drill down into trades</span>
          )}
          <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1">
            <Info className="h-3 w-3" /> Interactive Matrix
          </span>
        </div>
      </Card>

      {/* Heatmap Grid Rendering */}
      {heatmapType === 'DAY_HOUR' ? (
        <Card className="p-4 bg-[#121417] border border-[#22252A] overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Header: Hour Numbers */}
            <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 text-[10px] font-mono text-[#848B98] mb-1.5 text-center">
              <div className="text-left font-bold pl-1">UTC</div>
              {hoursOfDay.map((h) => (
                <div key={h} className="font-semibold">
                  {h < 10 ? `0${h}` : h}
                </div>
              ))}
            </div>

            {/* Rows: Days of Week */}
            <div className="space-y-1">
              {daysOfWeek.map((dayName, dayIdx) => {
                return (
                  <div key={dayName} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center">
                    <div className="text-xs font-bold text-[#D1D5DB] font-mono pl-1">
                      {dayName}
                    </div>

                    {hoursOfDay.map((hour) => {
                      const cell = dayHourMatrix.find((c) => c.dayIndex === dayIdx && c.hour === hour);
                      const count = cell?.tradesCount || 0;
                      const pnl = cell?.netPnL || 0;
                      const winRate = cell?.winRate || 0;
                      const colorClasses = getCellColor(count, pnl, winRate);

                      let cellText = '-';
                      if (count > 0) {
                        if (metric === 'PNL') cellText = pnl >= 0 ? `+$${Math.round(pnl)}` : `-$${Math.round(Math.abs(pnl))}`;
                        else if (metric === 'WIN_RATE') cellText = `${winRate}%`;
                        else cellText = `${count}`;
                      }

                      return (
                        <div
                          key={hour}
                          onMouseEnter={() => {
                            if (cell && count > 0) {
                              setHoveredCellInfo(
                                `${dayName} @ ${hour < 10 ? '0' + hour : hour}:00 UTC — ${count} trades • Net P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, currency)} • Win Rate: ${winRate}% (${cell.winCount}W / ${cell.lossCount}L)`
                              );
                            } else {
                              setHoveredCellInfo(`${dayName} @ ${hour < 10 ? '0' + hour : hour}:00 UTC — No trades executed`);
                            }
                          }}
                          onMouseLeave={() => setHoveredCellInfo(null)}
                          onClick={() => {
                            if (cell && count > 0) {
                              onDrillDown(
                                `Session Heatmap: ${dayName} at ${hour < 10 ? '0' + hour : hour}:00 UTC`,
                                cell.trades,
                                `${count} trades • Net P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, currency)} • Win Rate: ${winRate}%`
                              );
                            }
                          }}
                          className={`h-9 rounded-lg border text-[10px] font-mono flex items-center justify-center transition-all cursor-pointer select-none ${colorClasses} hover:scale-105 hover:z-10 hover:shadow-lg`}
                        >
                          <span className="truncate px-0.5">{cellText}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-[#121417] border border-[#22252A] overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header: Months */}
            <div className="grid grid-cols-[70px_repeat(12,1fr)] gap-2 text-xs font-mono text-[#848B98] mb-2 text-center">
              <div className="text-left font-bold pl-2">YEAR</div>
              {monthsOfYear.map((m) => (
                <div key={m} className="font-semibold">
                  {m}
                </div>
              ))}
            </div>

            {/* Rows: Years */}
            <div className="space-y-2">
              {yearsInMonthMatrix.map((year) => {
                return (
                  <div key={year} className="grid grid-cols-[70px_repeat(12,1fr)] gap-2 items-center">
                    <div className="text-sm font-bold text-white font-mono pl-2">
                      {year}
                    </div>

                    {monthsOfYear.map((_, mIdx) => {
                      const cell = monthYearMatrix.find((c) => c.year === year && c.month === mIdx);
                      const count = cell?.tradesCount || 0;
                      const pnl = cell?.netPnL || 0;
                      const winRate = cell?.winRate || 0;
                      const colorClasses = getCellColor(count, pnl, winRate);

                      let cellText = '-';
                      if (count > 0) {
                        if (metric === 'PNL') cellText = pnl >= 0 ? `+$${Math.round(pnl)}` : `-$${Math.round(Math.abs(pnl))}`;
                        else if (metric === 'WIN_RATE') cellText = `${winRate}%`;
                        else cellText = `${count}T`;
                      }

                      return (
                        <div
                          key={mIdx}
                          onMouseEnter={() => {
                            if (cell && count > 0) {
                              setHoveredCellInfo(
                                `${monthsOfYear[mIdx]} ${year} — ${count} trades • Net P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, currency)} • Win Rate: ${winRate}% (${cell.winCount}W / ${cell.lossCount}L)`
                              );
                            } else {
                              setHoveredCellInfo(`${monthsOfYear[mIdx]} ${year} — No trades recorded`);
                            }
                          }}
                          onMouseLeave={() => setHoveredCellInfo(null)}
                          onClick={() => {
                            if (cell && count > 0) {
                              onDrillDown(
                                `Monthly Matrix: ${monthsOfYear[mIdx]} ${year}`,
                                cell.trades,
                                `${count} trades • Net P&L: ${pnl >= 0 ? '+' : ''}${formatCurrency(pnl, currency)} • Win Rate: ${winRate}%`
                              );
                            }
                          }}
                          className={`h-12 rounded-xl border text-xs font-mono flex flex-col items-center justify-center transition-all cursor-pointer select-none p-1 ${colorClasses} hover:scale-105 hover:z-10 hover:shadow-lg`}
                        >
                          <span className="font-bold">{cellText}</span>
                          {count > 0 && metric !== 'VOLUME' && (
                            <span className="text-[10px] opacity-80">{count} tr</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
