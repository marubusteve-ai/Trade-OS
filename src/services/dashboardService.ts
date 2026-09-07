/**
 * Dashboard & Trading Control Center Analytics Service
 * 
 * Central coordinator for multi-dimensional filtering, period aggregations,
 * chart transformations, and layout state persistence.
 */

import { Trade, Strategy, Account } from '../types/domain';
import { 
  DashboardFilterState, 
  DashboardPeriod, 
  DrawdownCurvePoint, 
  TradingCalendarDay, 
  DashboardWidgetConfig 
} from '../types/calculations';

export class DashboardService {
  private static readonly STORAGE_KEY_PREFIX = 'tradeos_dashboard_widgets_v1_';

  /**
   * Resolves the start and end Date boundaries for any given period
   */
  static getDateRangeForPeriod(
    period: DashboardPeriod,
    customStart?: string,
    customEnd?: string,
    referenceDate: Date = new Date()
  ): { start?: Date; end?: Date; label: string } {
    const now = new Date(referenceDate);

    switch (period) {
      case 'DAILY': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        return { start, end, label: 'Today (Daily)' };
      }
      case 'WEEKLY': {
        // Start of current week (Monday)
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const start = new Date(now.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end, label: 'This Week' };
      }
      case 'MONTHLY': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end, label: 'This Month' };
      }
      case 'QUARTERLY': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), currentQuarter * 3, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
        return { start, end, label: `Q${currentQuarter + 1} (${now.getFullYear()})` };
      }
      case 'YEARLY': {
        const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start, end, label: `${now.getFullYear()} (Year-to-Date)` };
      }
      case 'CUSTOM': {
        const start = customStart ? new Date(customStart + 'T00:00:00') : undefined;
        const end = customEnd ? new Date(customEnd + 'T23:59:59') : undefined;
        return { 
          start, 
          end, 
          label: customStart && customEnd ? `${customStart} to ${customEnd}` : 'Custom Range' 
        };
      }
      case 'LIFETIME':
      default:
        return { label: 'Lifetime (All-Time)' };
    }
  }

  /**
   * Applies multi-dimensional filtering across all trade dimensions:
   * Period/Date, Account, Strategy, Playbook, Instrument, Session.
   */
  static filterTrades(trades: Trade[], filters: DashboardFilterState): Trade[] {
    const { start, end } = this.getDateRangeForPeriod(
      filters.period, 
      filters.customStartDate, 
      filters.customEndDate
    );

    return trades.filter(trade => {
      // 1. Account filter
      if (filters.accountId && filters.accountId !== 'ALL') {
        if (trade.accountId !== filters.accountId) return false;
      }

      // 2. Date / Period filter
      if (start || end) {
        const tradeDateStr = trade.exitDate || trade.entryDate;
        const tradeTime = new Date(tradeDateStr).getTime();
        if (isNaN(tradeTime)) return false;

        if (start && tradeTime < start.getTime()) return false;
        if (end && tradeTime > end.getTime()) return false;
      }

      // 3. Strategy filter
      if (filters.strategyId && filters.strategyId !== 'ALL') {
        if (trade.strategyId !== filters.strategyId) return false;
      }

      // 4. Playbook filter
      if (filters.playbookId && filters.playbookId !== 'ALL') {
        if (trade.playbookId !== filters.playbookId) return false;
      }

      // 5. Instrument filter
      if (filters.instrument && filters.instrument !== 'ALL') {
        if (trade.instrument.toUpperCase() !== filters.instrument.toUpperCase()) return false;
      }

      // 6. Session filter
      if (filters.session && filters.session !== 'ALL') {
        if (trade.session !== filters.session) return false;
      }

      return true;
    });
  }

  /**
   * Generates continuous Drawdown Depth Underwater Curve Points
   */
  static generateDrawdownCurve(trades: Trade[], startingBalance: number): DrawdownCurvePoint[] {
    const sortedTrades = [...trades]
      .filter(t => t.status === 'CLOSED')
      .sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());

    const points: DrawdownCurvePoint[] = [
      {
        index: 0,
        date: 'Start',
        drawdownAmount: 0,
        drawdownPercent: 0,
        highWaterMark: startingBalance,
        balance: startingBalance,
        isPeak: true,
      }
    ];

    let runningBalance = startingBalance;
    let peakBalance = startingBalance;

    sortedTrades.forEach((trade, idx) => {
      runningBalance += trade.netPnL;
      const isNewPeak = runningBalance >= peakBalance;
      if (isNewPeak) {
        peakBalance = runningBalance;
      }

      const drawdownAmount = peakBalance - runningBalance;
      const drawdownPercent = peakBalance > 0 ? (drawdownAmount / peakBalance) * 100 : 0;

      points.push({
        index: idx + 1,
        date: trade.exitDate || trade.entryDate,
        tradeId: trade.id,
        instrument: trade.instrument,
        drawdownAmount: Number(drawdownAmount.toFixed(2)),
        drawdownPercent: Number(drawdownPercent.toFixed(2)),
        highWaterMark: Number(peakBalance.toFixed(2)),
        balance: Number(runningBalance.toFixed(2)),
        isPeak: isNewPeak,
      });
    });

    return points;
  }

  /**
   * Generates calendar grid for a given year and month (0-11)
   */
  static generateCalendarMonthData(
    trades: Trade[],
    year: number,
    monthIndex: number
  ): TradingCalendarDay[] {
    const today = new Date();
    const firstDayOfMonth = new Date(year, monthIndex, 1);
    const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

    // Group trades by date string YYYY-MM-DD
    const tradesByDate = new Map<string, Trade[]>();
    trades
      .filter(t => t.status === 'CLOSED')
      .forEach(trade => {
        const dateKey = (trade.exitDate || trade.entryDate).split('T')[0];
        const existing = tradesByDate.get(dateKey) || [];
        existing.push(trade);
        tradesByDate.set(dateKey, existing);
      });

    // Determine calendar starting day (Monday-first index 0-6)
    // Sunday is 0, Monday is 1, etc.
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const days: TradingCalendarDay[] = [];

    // Preceding month padding days
    const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(year, monthIndex - 1, dayNum);
      const dateStr = prevDate.toISOString().split('T')[0];
      const dayTrades = tradesByDate.get(dateStr) || [];
      const netPnL = dayTrades.reduce((acc, t) => acc + t.netPnL, 0);
      const wins = dayTrades.filter(t => t.netPnL > 0.001).length;
      const losses = dayTrades.filter(t => t.netPnL < -0.001).length;
      const be = dayTrades.length - wins - losses;
      const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

      days.push({
        dateString: dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: false,
        tradesCount: dayTrades.length,
        winCount: wins,
        lossCount: losses,
        breakEvenCount: be,
        netPnL: Number(netPnL.toFixed(2)),
        winRate: Number(winRate.toFixed(1)),
        trades: dayTrades,
      });
    }

    // Current month days
    const daysInMonth = lastDayOfMonth.getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, monthIndex, d);
      // Format as YYYY-MM-DD cleanly in local calendar
      const yyyy = year;
      const mm = String(monthIndex + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const isToday = 
        today.getFullYear() === year && 
        today.getMonth() === monthIndex && 
        today.getDate() === d;

      const dayTrades = tradesByDate.get(dateStr) || [];
      const netPnL = dayTrades.reduce((acc, t) => acc + t.netPnL, 0);
      const wins = dayTrades.filter(t => t.netPnL > 0.001).length;
      const losses = dayTrades.filter(t => t.netPnL < -0.001).length;
      const be = dayTrades.length - wins - losses;
      const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

      days.push({
        dateString: dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday,
        tradesCount: dayTrades.length,
        winCount: wins,
        lossCount: losses,
        breakEvenCount: be,
        netPnL: Number(netPnL.toFixed(2)),
        winRate: Number(winRate.toFixed(1)),
        trades: dayTrades,
      });
    }

    // Trailing padding days to fill 35 or 42 grid slots
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let nextDay = 1; nextDay <= remainingSlots; nextDay++) {
      const nextDate = new Date(year, monthIndex + 1, nextDay);
      const dateStr = nextDate.toISOString().split('T')[0];
      const dayTrades = tradesByDate.get(dateStr) || [];
      const netPnL = dayTrades.reduce((acc, t) => acc + t.netPnL, 0);
      const wins = dayTrades.filter(t => t.netPnL > 0.001).length;
      const losses = dayTrades.filter(t => t.netPnL < -0.001).length;
      const be = dayTrades.length - wins - losses;
      const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

      days.push({
        dateString: dateStr,
        dayNumber: nextDay,
        isCurrentMonth: false,
        isToday: false,
        tradesCount: dayTrades.length,
        winCount: wins,
        lossCount: losses,
        breakEvenCount: be,
        netPnL: Number(netPnL.toFixed(2)),
        winRate: Number(winRate.toFixed(1)),
        trades: dayTrades,
      });
    }

    return days;
  }

  /**
   * Default widgets schema covering all 18 requested metrics and views
   */
  static getDefaultWidgetConfigs(): DashboardWidgetConfig[] {
    return [
      {
        id: 'widget_kpi_hero',
        type: 'KPI_HERO_GRID',
        title: 'Core Performance & PnL Metrics',
        enabled: true,
        order: 1,
        gridSpan: { col: 12, row: 1 },
      },
      {
        id: 'widget_equity_balance_curve',
        type: 'EQUITY_BALANCE_CURVE',
        title: 'Interactive Equity & Balance Curve',
        enabled: true,
        order: 2,
        gridSpan: { col: 8, row: 2 },
      },
      {
        id: 'widget_prop_compliance',
        type: 'PROP_COMPLIANCE',
        title: 'Prop Firm Compliance & Risk Controls',
        enabled: true,
        order: 3,
        gridSpan: { col: 4, row: 2 },
      },
      {
        id: 'widget_extended_kpi_grid',
        type: 'EXTENDED_KPI_GRID',
        title: 'Quantitative Edge & Statistical Breakdowns',
        enabled: true,
        order: 4,
        gridSpan: { col: 12, row: 1 },
      },
      {
        id: 'widget_pnl_distribution',
        type: 'PNL_DISTRIBUTION',
        title: 'Daily / Per-Trade P&L Distribution',
        enabled: true,
        order: 5,
        gridSpan: { col: 6, row: 2 },
      },
      {
        id: 'widget_drawdown_underwater',
        type: 'DRAWDOWN_UNDERWATER',
        title: 'Drawdown Depth & Recovery Curve',
        enabled: true,
        order: 6,
        gridSpan: { col: 6, row: 2 },
      },
      {
        id: 'widget_trading_calendar',
        type: 'TRADING_CALENDAR',
        title: 'Interactive Trading Calendar & Heatmap',
        enabled: true,
        order: 7,
        gridSpan: { col: 8, row: 2 },
      },
      {
        id: 'widget_recent_trades',
        type: 'RECENT_TRADES',
        title: 'Recent Executions & Audit Log',
        enabled: true,
        order: 8,
        gridSpan: { col: 4, row: 2 },
      },
    ];
  }

  /**
   * Loads persisted widget layout configuration from storage
   */
  static loadWidgetLayout(userId: string): DashboardWidgetConfig[] {
    try {
      const stored = localStorage.getItem(`${this.STORAGE_KEY_PREFIX}${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.sort((a, b) => a.order - b.order);
        }
      }
    } catch (e) {
      console.warn('Could not load custom dashboard layout, falling back to defaults:', e);
    }
    return this.getDefaultWidgetConfigs();
  }

  /**
   * Persists widget layout configuration to storage
   */
  static saveWidgetLayout(userId: string, configs: DashboardWidgetConfig[]): void {
    try {
      localStorage.setItem(`${this.STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(configs));
    } catch (e) {
      console.error('Failed to save dashboard widget layout:', e);
    }
  }

  /**
   * Resets widget layout configuration to default
   */
  static resetWidgetLayout(userId: string): DashboardWidgetConfig[] {
    const defaults = this.getDefaultWidgetConfigs();
    this.saveWidgetLayout(userId, defaults);
    return defaults;
  }
}
