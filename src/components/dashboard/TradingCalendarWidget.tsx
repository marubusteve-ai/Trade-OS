import React, { useState } from 'react';
import { Trade } from '../../types/domain';
import { TradingCalendarDay } from '../../types/calculations';
import { DashboardService } from '../../services/dashboardService';
import { formatCurrency } from '../../lib/utils';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  TrendingDown,
  Layers,
  CalendarCheck
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface TradingCalendarWidgetProps {
  trades: Trade[];
  currency?: string;
  onSelectDate?: (dateStr: string) => void;
}

export const TradingCalendarWidget: React.FC<TradingCalendarWidgetProps> = ({
  trades,
  currency = 'USD',
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();

  const calendarDays: TradingCalendarDay[] = DashboardService.generateCalendarMonthData(
    trades,
    year,
    monthIndex
  );

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, monthIndex - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, monthIndex + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Month Statistics
  const monthDays = calendarDays.filter(d => d.isCurrentMonth && d.tradesCount > 0);
  const totalMonthTrades = monthDays.reduce((acc, d) => acc + d.tradesCount, 0);
  const totalMonthPnL = monthDays.reduce((acc, d) => acc + d.netPnL, 0);
  const greenDaysCount = monthDays.filter(d => d.netPnL > 0.001).length;
  const redDaysCount = monthDays.filter(d => d.netPnL < -0.001).length;
  const beDaysCount = monthDays.filter(d => Math.abs(d.netPnL) <= 0.001).length;

  const dayWinRate = greenDaysCount + redDaysCount > 0 
    ? (greenDaysCount / (greenDaysCount + redDaysCount)) * 100 
    : 0;

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-3">
      {/* Calendar Header & Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <CalendarIcon className="h-4 w-4 text-emerald-400" />
            Trading Calendar Heatmap
          </span>
          <Badge variant={totalMonthPnL >= 0 ? 'emerald' : 'rose'}>
            Month Net: {totalMonthPnL >= 0 ? '+' : ''}{formatCurrency(totalMonthPnL, currency)}
          </Badge>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0 text-[#848B98] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="font-bold text-white text-xs px-2 min-w-[120px] text-center">
            {monthNames[monthIndex]} {year}
          </span>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0 text-[#848B98] hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="h-7 text-[10px] px-2 text-[#D1D5DB] hover:text-white ml-1"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#0C0D0F] rounded-xl border border-[#22252A] p-2.5 overflow-x-auto">
        <div className="min-w-[500px]">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
            {dayLabels.map((lbl, idx) => (
              <div 
                key={lbl} 
                className={`text-[10px] font-semibold py-1 uppercase tracking-wider ${
                  idx >= 5 ? 'text-[#606773]' : 'text-[#848B98]'
                }`}
              >
                {lbl}
              </div>
            ))}
          </div>

          {/* Days Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((day, idx) => {
              const hasTrades = day.tradesCount > 0;
              const isProfit = day.netPnL > 0.001;
              const isLoss = day.netPnL < -0.001;

              return (
                <div
                  key={`${day.dateString}-${idx}`}
                  onClick={() => {
                    if (onSelectDate && hasTrades) {
                      onSelectDate(day.dateString);
                    }
                  }}
                  className={`
                    min-h-[64px] p-1.5 rounded-lg border transition-all flex flex-col justify-between
                    ${!day.isCurrentMonth ? 'opacity-35 bg-[#121417]/50 border-transparent' : 'bg-[#15171A] border-[#22252A]'}
                    ${day.isToday ? 'ring-1 ring-blue-500/60' : ''}
                    ${hasTrades ? 'cursor-pointer hover:border-blue-500/60 hover:shadow-md' : 'cursor-default'}
                    ${hasTrades && isProfit ? 'bg-emerald-950/20 border-emerald-900/40 hover:bg-emerald-950/30' : ''}
                    ${hasTrades && isLoss ? 'bg-rose-950/20 border-rose-900/40 hover:bg-rose-950/30' : ''}
                  `}
                >
                  {/* Day header: number & trade count pill */}
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[11px] font-mono font-medium ${
                      day.isToday ? 'text-blue-400 font-bold' : day.isCurrentMonth ? 'text-[#D1D5DB]' : 'text-[#606773]'
                    }`}>
                      {day.dayNumber}
                    </span>

                    {hasTrades && (
                      <span className={`text-[9.5px] px-1 py-0.2 rounded font-mono font-medium ${
                        isProfit ? 'bg-emerald-500/20 text-emerald-300' : isLoss ? 'bg-rose-500/20 text-rose-300' : 'bg-[#2A2E35] text-[#848B98]'
                      }`}>
                        {day.tradesCount}t
                      </span>
                    )}
                  </div>

                  {/* Net P&L & stats */}
                  {hasTrades ? (
                    <div className="mt-1">
                      <div className={`text-xs font-mono font-bold tracking-tight truncate ${
                        isProfit ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'
                      }`}>
                        {isProfit ? '+' : ''}{formatCurrency(day.netPnL, currency, 0)}
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-mono text-[#848B98] mt-0.5">
                        <span className="text-emerald-400">{day.winCount}W</span>
                        <span>/</span>
                        <span className="text-rose-400">{day.lossCount}L</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-[#2A2E35] font-mono select-none">—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Month Summary Footer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#15171A] border border-[#22252A] text-xs font-mono">
        <div className="flex items-center gap-4 text-[#848B98]">
          <span>
            Active Days: <strong className="text-white">{monthDays.length}</strong>
          </span>
          <span>
            Executed Trades: <strong className="text-white">{totalMonthTrades}</strong>
          </span>
          <span>
            Win Days: <strong className="text-emerald-400">{greenDaysCount}</strong> | Loss Days: <strong className="text-rose-400">{redDaysCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[#848B98]">
            Day Win Rate: <strong className="text-white">{dayWinRate.toFixed(0)}%</strong>
          </span>
          <span className={`font-bold ${totalMonthPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalMonthPnL >= 0 ? '+' : ''}{formatCurrency(totalMonthPnL, currency)}
          </span>
        </div>
      </div>
    </div>
  );
};
