/**
 * Professional Centralized Reporting Engine
 * 
 * Generates 11 institutional-grade audit reports, tearsheets, compliance records, 
 * and multi-format exports (Print/PDF, CSV, JSON, Spreadsheet TSV) using TradeOS's
 * centralized calculation and analytics engines.
 */

import { Trade, Account, Strategy, Playbook, Setup, AssetClass } from '../types/domain';
import {
  ReportType,
  ReportFilterState,
  DateRangePreset,
  BaseReportMetadata,
  ExecutiveSummaryReportData,
  DailyReportData,
  DailyReportRow,
  WeeklyReportData,
  WeeklyReportRow,
  MonthlyReportData,
  MonthlyReportRow,
  AccountReportData,
  AccountPerformanceRow,
  StrategyReportData,
  StrategyPerformanceRow,
  PlaybookReportData,
  PlaybookPerformanceRow,
  PropFirmReportData,
  PsychologyReportData,
  RiskReportData,
  TradeHistoryReportData,
  GeneratedReportData,
} from '../types/reports';
import { CalculationEngine } from './calculationEngine';
import { AnalyticsEngine } from './analyticsEngine';
import { RiskEngine } from './riskEngine';
import { PropFirmEngine } from './propFirmEngine';
import { PsychologyEngine } from './psychologyEngine';
import { PropFirmRuleSet } from '../types/domain';
import { RiskPolicy } from '../types/risk';

export class ReportingEngine {
  /**
   * Helper to resolve Date Range bounds from Preset
   */
  static resolveDateRange(
    preset: DateRangePreset,
    customStart?: string,
    customEnd?: string
  ): { startDate?: string; endDate?: string; label: string } {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    switch (preset) {
      case 'TODAY':
        return { startDate: todayStr, endDate: todayStr, label: 'Today' };
      case 'YESTERDAY': {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        const yStr = y.toISOString().split('T')[0];
        return { startDate: yStr, endDate: yStr, label: 'Yesterday' };
      }
      case 'THIS_WEEK': {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const monday = new Date(d.setDate(diff));
        return { startDate: monday.toISOString().split('T')[0], endDate: todayStr, label: 'This Week' };
      }
      case 'LAST_WEEK': {
        const d = new Date(now);
        const day = d.getDay();
        const prevMonday = new Date(d.setDate(d.getDate() - day - 6));
        const prevSunday = new Date(d.setDate(d.getDate() + 6));
        return {
          startDate: prevMonday.toISOString().split('T')[0],
          endDate: prevSunday.toISOString().split('T')[0],
          label: 'Last Week',
        };
      }
      case 'THIS_MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        return { startDate: start.toISOString().split('T')[0], endDate: todayStr, label: 'This Month' };
      }
      case 'LAST_MONTH': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          label: 'Last Month',
        };
      }
      case 'LAST_30_DAYS': {
        const d = new Date(now);
        d.setDate(d.getDate() - 30);
        return { startDate: d.toISOString().split('T')[0], endDate: todayStr, label: 'Last 30 Days' };
      }
      case 'LAST_90_DAYS': {
        const d = new Date(now);
        d.setDate(d.getDate() - 90);
        return { startDate: d.toISOString().split('T')[0], endDate: todayStr, label: 'Last 90 Days' };
      }
      case 'YEAR_TO_DATE': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { startDate: start.toISOString().split('T')[0], endDate: todayStr, label: 'Year To Date' };
      }
      case 'CUSTOM':
        return {
          startDate: customStart,
          endDate: customEnd,
          label: customStart && customEnd ? `${customStart} to ${customEnd}` : 'Custom Range',
        };
      case 'ALL_TIME':
      default:
        return { startDate: undefined, endDate: undefined, label: 'All Time' };
    }
  }

  /**
   * Builds standardized base report metadata
   */
  private static createMetadata(
    reportType: ReportType,
    reportTitle: string,
    filters: ReportFilterState,
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[]
  ): BaseReportMetadata {
    const acc = accounts.find((a) => a.id === filters.accountId);
    const accountName =
      filters.accountId === 'ALL'
        ? 'All Accounts (Consolidated)'
        : acc
        ? `${acc.name} (${acc.broker})`
        : 'Selected Account';
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const strat = strategies.find((s) => s.id === filters.strategyId);
    const pb = playbooks.find((p) => p.id === filters.playbookId);

    const totalVolume = trades.reduce((sum, t) => sum + (t.quantity || 0), 0);
    const reportId = `REP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    return {
      reportId,
      reportType,
      reportTitle,
      generatedAt: new Date().toISOString(),
      generatedBy: 'TradeOS Professional Reporting Engine',
      version: '11.0.0-PRO',
      appliedFilters: {
        accountName,
        accountId: filters.accountId,
        dateRangeLabel: dateRange.label,
        datePreset: filters.datePreset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        strategyName: strat?.name || (filters.strategyId !== 'ALL' ? filters.strategyId : undefined),
        playbookName: pb?.title || (filters.playbookId !== 'ALL' ? filters.playbookId : undefined),
        instrument: filters.instrument !== 'ALL' ? filters.instrument : undefined,
      },
      tradeCount: trades.length,
      totalVolume: Number(totalVolume.toFixed(2)),
    };
  }

  // =========================================================================
  // 1. EXECUTIVE SUMMARY REPORT
  // =========================================================================

  static generateExecutiveSummary(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): ExecutiveSummaryReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const activeAcc = accounts.find((a) => a.id === filters.accountId);
    const startingBalance = activeAcc
      ? activeAcc.startingBalance
      : accounts.reduce((s, a) => s + (a.startingBalance || 0), 0) || 100000;

    const metrics = AnalyticsEngine.calculateAdvancedMetrics(filteredTrades, startingBalance);
    const baseMeta = this.createMetadata(
      'EXECUTIVE_SUMMARY',
      'Executive Performance Summary & Audit Tearsheet',
      filters,
      filteredTrades,
      accounts,
      strategies,
      playbooks
    );

    // Equity Curve
    const equityCurvePoints = CalculationEngine.generateEquityCurve(filteredTrades, startingBalance);
    const equityCurve = equityCurvePoints.map((pt) => ({
      date: pt.date,
      equity: pt.equity,
      netPnL: pt.pnl,
      drawdownPercent: pt.drawdownPercent,
    }));

    // Highlights
    const keyHighlights: {
      label: string;
      value: string;
      status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
      description: string;
    }[] = [
      {
        label: 'Net Realized P&L',
        value: `${metrics.netPnL >= 0 ? '+' : ''}$${metrics.netPnL.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        status: metrics.netPnL >= 0 ? 'POSITIVE' : 'NEGATIVE',
        description: `Total return of ${metrics.netReturnPercent >= 0 ? '+' : ''}${metrics.netReturnPercent}% on starting capital.`,
      },
      {
        label: 'Win Rate & Quality',
        value: `${metrics.winRate.toFixed(1)}%`,
        status: metrics.winRate >= 50 ? 'POSITIVE' : metrics.winRate >= 40 ? 'NEUTRAL' : 'NEGATIVE',
        description: `Profit factor: ${metrics.profitFactor.toFixed(2)} with payoff ratio: ${metrics.payoffRatio.toFixed(2)}.`,
      },
      {
        label: 'Max Peak Drawdown',
        value: `-${metrics.maxDrawdownPercent.toFixed(2)}%`,
        status: metrics.maxDrawdownPercent <= 5 ? 'POSITIVE' : metrics.maxDrawdownPercent <= 10 ? 'NEUTRAL' : 'NEGATIVE',
        description: `Maximum peak-to-trough decline of $${metrics.maxDrawdownAmount.toLocaleString('en-US', {
          maximumFractionDigits: 0,
        })}.`,
      },
      {
        label: 'Expectancy per Execution',
        value: `${metrics.expectancyRMultiple >= 0 ? '+' : ''}${metrics.expectancyRMultiple.toFixed(2)}R`,
        status: metrics.expectancyRMultiple > 0 ? 'POSITIVE' : 'NEGATIVE',
        description: `Expected monetary return: $${metrics.expectancy.toFixed(2)} per executed trade.`,
      },
    ];

    // Monthly returns breakdown
    const monthMap = new Map<string, { pnl: number; count: number; wins: number; total: number }>();
    filteredTrades
      .filter((t) => t.status === 'CLOSED')
      .forEach((t) => {
        const ym = (t.exitDate || t.entryDate || '').slice(0, 7);
        if (!ym) return;
        const entry = monthMap.get(ym) || { pnl: 0, count: 0, wins: 0, total: 0 };
        entry.pnl += t.netPnL || 0;
        entry.count++;
        if ((t.netPnL || 0) > 0.001) entry.wins++;
        monthMap.set(ym, entry);
      });

    const monthlyReturnSummary = Array.from(monthMap.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, d]) => ({
        month,
        netPnL: Number(d.pnl.toFixed(2)),
        returnPercent: startingBalance > 0 ? Number(((d.pnl / startingBalance) * 100).toFixed(2)) : 0,
        tradesCount: d.count,
        winRate: d.count > 0 ? Number(((d.wins / d.count) * 100).toFixed(1)) : 0,
      }));

    // Asset breakdown
    const assetBreakdown = AnalyticsEngine.generateDimensionBreakdown(
      filteredTrades,
      'ASSET_CLASS',
      { strategies, playbooks, accounts }
    );

    return {
      ...baseMeta,
      reportType: 'EXECUTIVE_SUMMARY',
      metrics,
      equityCurve,
      keyHighlights,
      monthlyReturnSummary,
      assetBreakdown,
      riskOverview: {
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        sharpeRatio: metrics.sharpeRatio,
        profitFactor: metrics.profitFactor,
        expectancyR: metrics.expectancyRMultiple,
        recoveryFactor: metrics.recoveryFactor,
      },
    };
  }

  // =========================================================================
  // 2. DAILY REPORT
  // =========================================================================

  static generateDailyReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): DailyReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const baseMeta = this.createMetadata('DAILY', 'Daily Execution & Session Performance Audit', filters, filteredTrades, accounts, strategies, playbooks);

    // Group by Day
    const dayMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const d = (t.exitDate || t.entryDate || '').split('T')[0];
      if (!d) return;
      if (!dayMap.has(d)) dayMap.set(d, []);
      dayMap.get(d)!.push(t);
    });

    const sortedDates = Array.from(dayMap.keys()).sort().reverse();
    const days: DailyReportRow[] = [];

    let profitableDays = 0;
    let lossDays = 0;
    let breakEvenDays = 0;
    let bestDay = { date: 'N/A', netPnL: 0 };
    let worstDay = { date: 'N/A', netPnL: 0 };

    for (const date of sortedDates) {
      const dayTrades = dayMap.get(date)!;
      const closed = dayTrades.filter((t) => t.status === 'CLOSED');
      const wins = closed.filter((t) => (t.netPnL || 0) > 0.001);
      const losses = closed.filter((t) => (t.netPnL || 0) < -0.001);

      const netPnL = closed.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossProfit = wins.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL || 0), 0));
      const commissions = dayTrades.reduce((sum, t) => sum + (t.commission || 0) + (t.fees || 0) + (t.swap || 0), 0);
      const totalVolume = dayTrades.reduce((sum, t) => sum + (t.quantity || 0), 0);

      const totalSecs = closed.reduce((sum, t) => sum + (t.holdingTimeSeconds || 0), 0);
      const avgDuration = closed.length > 0 ? Math.round(totalSecs / closed.length / 60) : 0;

      const pnlArr = closed.map((t) => t.netPnL || 0);
      const bestTrade = pnlArr.length > 0 ? Math.max(...pnlArr) : 0;
      const worstTrade = pnlArr.length > 0 ? Math.min(...pnlArr) : 0;

      const discArr = dayTrades.filter((t) => t.psychology?.disciplineScore).map((t) => t.psychology!.disciplineScore);
      const avgDisc = discArr.length > 0 ? discArr.reduce((a, b) => a + b, 0) / discArr.length : 10;

      const instMap = new Map<string, number>();
      dayTrades.forEach((t) => instMap.set(t.instrument, (instMap.get(t.instrument) || 0) + 1));
      const primaryAsset = Array.from(instMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'MULTI';

      if (netPnL > 0.01) profitableDays++;
      else if (netPnL < -0.01) lossDays++;
      else breakEvenDays++;

      if (netPnL > bestDay.netPnL || bestDay.date === 'N/A') bestDay = { date, netPnL };
      if (netPnL < worstDay.netPnL || worstDay.date === 'N/A') worstDay = { date, netPnL };

      days.push({
        date,
        tradesCount: dayTrades.length,
        winningCount: wins.length,
        losingCount: losses.length,
        winRate: closed.length > 0 ? Number(((wins.length / closed.length) * 100).toFixed(1)) : 0,
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        netPnL: Number(netPnL.toFixed(2)),
        commissions: Number(commissions.toFixed(2)),
        totalVolume: Number(totalVolume.toFixed(2)),
        avgDurationMinutes: avgDuration,
        bestTradePnL: Number(bestTrade.toFixed(2)),
        worstTradePnL: Number(worstTrade.toFixed(2)),
        disciplineScoreAvg: Number(avgDisc.toFixed(1)),
        primaryAsset,
      });
    }

    const totalDays = days.length;
    const totalNetPnL = days.reduce((sum, d) => sum + d.netPnL, 0);
    const dayWinRate = totalDays > 0 ? Number(((profitableDays / totalDays) * 100).toFixed(1)) : 0;
    const avgDailyPnL = totalDays > 0 ? Number((totalNetPnL / totalDays).toFixed(2)) : 0;

    // Session breakdown
    const sessionBreakdown = AnalyticsEngine.generateDimensionBreakdown(filteredTrades, 'SESSION', { strategies, playbooks, accounts });

    // Hourly distribution
    const hourMap = new Map<number, { count: number; pnl: number; wins: number; closedCount: number }>();
    filteredTrades.forEach((t) => {
      const dt = new Date(t.entryDate);
      const hr = dt.getHours();
      const hData = hourMap.get(hr) || { count: 0, pnl: 0, wins: 0, closedCount: 0 };
      hData.count++;
      if (t.status === 'CLOSED') {
        hData.pnl += t.netPnL || 0;
        hData.closedCount++;
        if ((t.netPnL || 0) > 0.001) hData.wins++;
      }
      hourMap.set(hr, hData);
    });

    const hourlyDistribution = Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, h]) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        tradesCount: h.count,
        netPnL: Number(h.pnl.toFixed(2)),
        winRate: h.closedCount > 0 ? Number(((h.wins / h.closedCount) * 100).toFixed(1)) : 0,
      }));

    return {
      ...baseMeta,
      reportType: 'DAILY',
      days,
      totals: {
        totalTradingDays: totalDays,
        profitableDays,
        lossDays,
        breakEvenDays,
        dayWinRate,
        avgDailyPnL,
        bestDay: { date: bestDay.date, netPnL: Number(bestDay.netPnL.toFixed(2)) },
        worstDay: { date: worstDay.date, netPnL: Number(worstDay.netPnL.toFixed(2)) },
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
        totalTrades: filteredTrades.length,
      },
      sessionBreakdown,
      hourlyDistribution,
    };
  }

  // =========================================================================
  // 3. WEEKLY REPORT
  // =========================================================================

  static generateWeeklyReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): WeeklyReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const baseMeta = this.createMetadata('WEEKLY', 'Weekly Portfolio Performance & R-Multiple Attribution', filters, filteredTrades, accounts, strategies, playbooks);

    // Group by ISO week (Monday)
    const weekMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const d = new Date(t.exitDate || t.entryDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      const key = monday.toISOString().split('T')[0];
      if (!weekMap.has(key)) weekMap.set(key, []);
      weekMap.get(key)!.push(t);
    });

    const sortedWeekKeys = Array.from(weekMap.keys()).sort();
    const weeks: WeeklyReportRow[] = [];

    let cumPnL = 0;
    let profitableWeeks = 0;
    let lossWeeks = 0;
    let bestWeek = { weekLabel: 'N/A', netPnL: 0 };
    let worstWeek = { weekLabel: 'N/A', netPnL: 0 };

    sortedWeekKeys.forEach((startMon, idx) => {
      const wTrades = weekMap.get(startMon)!;
      const closed = wTrades.filter((t) => t.status === 'CLOSED');
      const wins = closed.filter((t) => (t.netPnL || 0) > 0.001);
      const losses = closed.filter((t) => (t.netPnL || 0) < -0.001);

      const netPnL = closed.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossProfit = wins.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL || 0), 0));
      const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.99 : 0;
      cumPnL += netPnL;

      const monDate = new Date(startMon);
      const sunDate = new Date(monDate);
      sunDate.setDate(sunDate.getDate() + 6);
      const endSun = sunDate.toISOString().split('T')[0];
      const weekLabel = `W${idx + 1} (${startMon.slice(5)} to ${endSun.slice(5)})`;

      const rList = closed.filter((t) => t.achievedRMultiple !== undefined).map((t) => t.achievedRMultiple!);
      const avgR = rList.length > 0 ? rList.reduce((a, b) => a + b, 0) / rList.length : 0;

      const pnlArr = closed.map((t) => t.netPnL || 0);
      const bestTrade = pnlArr.length > 0 ? Math.max(...pnlArr) : 0;
      const worstTrade = pnlArr.length > 0 ? Math.min(...pnlArr) : 0;

      if (netPnL > 0.01) profitableWeeks++;
      else if (netPnL < -0.01) lossWeeks++;

      if (netPnL > bestWeek.netPnL || bestWeek.weekLabel === 'N/A') bestWeek = { weekLabel, netPnL };
      if (netPnL < worstWeek.netPnL || worstWeek.weekLabel === 'N/A') worstWeek = { weekLabel, netPnL };

      weeks.push({
        weekNumber: idx + 1,
        weekLabel,
        startDate: startMon,
        endDate: endSun,
        tradesCount: wTrades.length,
        winRate: closed.length > 0 ? Number(((wins.length / closed.length) * 100).toFixed(1)) : 0,
        netPnL: Number(netPnL.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        profitFactor,
        cumPnL: Number(cumPnL.toFixed(2)),
        avgRMultiple: Number(avgR.toFixed(2)),
        bestTrade: Number(bestTrade.toFixed(2)),
        worstTrade: Number(worstTrade.toFixed(2)),
      });
    });

    weeks.reverse();

    const totalWeeks = weeks.length;
    const totalNetPnL = weeks.reduce((sum, w) => sum + w.netPnL, 0);
    const weeklyWinRate = totalWeeks > 0 ? Number(((profitableWeeks / totalWeeks) * 100).toFixed(1)) : 0;
    const avgWeeklyPnL = totalWeeks > 0 ? Number((totalNetPnL / totalWeeks).toFixed(2)) : 0;

    return {
      ...baseMeta,
      reportType: 'WEEKLY',
      weeks,
      totals: {
        totalWeeks,
        profitableWeeks,
        lossWeeks,
        weeklyWinRate,
        avgWeeklyPnL,
        bestWeek: { weekLabel: bestWeek.weekLabel, netPnL: Number(bestWeek.netPnL.toFixed(2)) },
        worstWeek: { weekLabel: worstWeek.weekLabel, netPnL: Number(worstWeek.netPnL.toFixed(2)) },
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
      },
    };
  }

  // =========================================================================
  // 4. MONTHLY REPORT
  // =========================================================================

  static generateMonthlyReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): MonthlyReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const activeAcc = accounts.find((a) => a.id === filters.accountId);
    const startingBalance = activeAcc
      ? activeAcc.startingBalance
      : accounts.reduce((s, a) => s + (a.startingBalance || 0), 0) || 100000;

    const baseMeta = this.createMetadata('MONTHLY', 'Monthly Performance Matrix & Returns Tearsheet', filters, filteredTrades, accounts, strategies, playbooks);

    // Group by YYYY-MM
    const monthMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const ym = (t.exitDate || t.entryDate || '').slice(0, 7);
      if (!ym) return;
      if (!monthMap.has(ym)) monthMap.set(ym, []);
      monthMap.get(ym)!.push(t);
    });

    const sortedMonthKeys = Array.from(monthMap.keys()).sort();
    const months: MonthlyReportRow[] = [];

    let cumPnL = 0;
    let profitableMonths = 0;
    let lossMonths = 0;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (const ym of sortedMonthKeys) {
      const mTrades = monthMap.get(ym)!;
      const closed = mTrades.filter((t) => t.status === 'CLOSED');
      const wins = closed.filter((t) => (t.netPnL || 0) > 0.001);
      const losses = closed.filter((t) => (t.netPnL || 0) < -0.001);

      const netPnL = closed.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossProfit = wins.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL || 0), 0));
      const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.99 : 0;
      cumPnL += netPnL;

      const [yStr, mStr] = ym.split('-');
      const mIdx = parseInt(mStr, 10) - 1;
      const monthName = `${monthNames[mIdx]} ${yStr}`;

      const monthMetrics = AnalyticsEngine.calculateAdvancedMetrics(mTrades, startingBalance);
      const returnPercent = startingBalance > 0 ? Number(((netPnL / startingBalance) * 100).toFixed(2)) : 0;

      if (netPnL > 0.01) profitableMonths++;
      else if (netPnL < -0.01) lossMonths++;

      months.push({
        yearMonth: ym,
        monthName,
        tradesCount: mTrades.length,
        winRate: closed.length > 0 ? Number(((wins.length / closed.length) * 100).toFixed(1)) : 0,
        netPnL: Number(netPnL.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
        grossLoss: Number(grossLoss.toFixed(2)),
        profitFactor,
        returnPercent,
        sharpeRatio: monthMetrics.sharpeRatio,
        maxDrawdownPercent: monthMetrics.maxDrawdownPercent,
        cumPnL: Number(cumPnL.toFixed(2)),
      });
    }

    months.reverse();

    // Yearly Matrix
    const yearGroups = new Map<number, (number | null)[]>();
    for (const m of months) {
      const year = parseInt(m.yearMonth.split('-')[0], 10);
      const monthIdx = parseInt(m.yearMonth.split('-')[1], 10) - 1;
      if (!yearGroups.has(year)) {
        yearGroups.set(year, new Array(12).fill(null));
      }
      yearGroups.get(year)![monthIdx] = m.netPnL;
    }

    const yearlyMatrix = Array.from(yearGroups.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, mList]) => {
        const totalPnL = mList.reduce((sum: number, val) => sum + (val || 0), 0);
        const returnPercent = startingBalance > 0 ? Number(((totalPnL / startingBalance) * 100).toFixed(2)) : 0;
        return {
          year,
          months: mList,
          totalPnL: Number(totalPnL.toFixed(2)),
          returnPercent,
        };
      });

    const totalMonths = months.length;
    const totalNetPnL = months.reduce((sum, m) => sum + m.netPnL, 0);
    const monthlyWinRate = totalMonths > 0 ? Number(((profitableMonths / totalMonths) * 100).toFixed(1)) : 0;
    const avgMonthlyPnL = totalMonths > 0 ? Number((totalNetPnL / totalMonths).toFixed(2)) : 0;
    const annualizedReturnPercent =
      startingBalance > 0 && totalMonths > 0
        ? Number((((totalNetPnL / startingBalance) / (totalMonths / 12)) * 100).toFixed(2))
        : 0;

    return {
      ...baseMeta,
      reportType: 'MONTHLY',
      months,
      totals: {
        totalMonths,
        profitableMonths,
        lossMonths,
        monthlyWinRate,
        avgMonthlyPnL,
        annualizedReturnPercent,
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
      },
      yearlyMatrix,
    };
  }

  // =========================================================================
  // 5. ACCOUNT REPORT
  // =========================================================================

  static generateAccountReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): AccountReportData {
    const baseMeta = this.createMetadata('ACCOUNT', 'Multi-Account Audit & Capital Allocation Report', filters, trades, accounts, strategies, playbooks);

    const accountRows: AccountPerformanceRow[] = [];
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);

    for (const acc of accounts) {
      if (filters.accountId !== 'ALL' && acc.id !== filters.accountId) continue;

      const accTrades = trades.filter((t) => t.accountId === acc.id);
      const filteredAccTrades = AnalyticsEngine.filterTrades(accTrades, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        strategyId: filters.strategyId,
        playbookId: filters.playbookId,
        instrument: filters.instrument,
      });

      const metrics = AnalyticsEngine.calculateAdvancedMetrics(filteredAccTrades, acc.startingBalance || 100000);
      const returnPercent = acc.startingBalance > 0 ? Number(((metrics.netPnL / acc.startingBalance) * 100).toFixed(2)) : 0;

      accountRows.push({
        accountId: acc.id,
        accountName: acc.name,
        accountType: acc.accountType || 'PERSONAL_LIVE',
        broker: acc.broker,
        currency: acc.currency,
        startingBalance: acc.startingBalance || 100000,
        currentBalance: acc.currentBalance || 100000,
        netPnL: metrics.netPnL,
        returnPercent,
        tradesCount: filteredAccTrades.length,
        winRate: metrics.winRate,
        profitFactor: metrics.profitFactor,
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        totalCommissions: metrics.totalCommissions + metrics.totalFees,
        status: acc.status || 'ACTIVE',
      });
    }

    const totalCapital = accountRows.reduce((sum, a) => sum + a.startingBalance, 0);
    const totalNetPnL = accountRows.reduce((sum, a) => sum + a.netPnL, 0);
    const totalTrades = accountRows.reduce((sum, a) => sum + a.tradesCount, 0);
    const totalCommissions = accountRows.reduce((sum, a) => sum + a.totalCommissions, 0);
    const blendedReturnPercent = totalCapital > 0 ? Number(((totalNetPnL / totalCapital) * 100).toFixed(2)) : 0;

    return {
      ...baseMeta,
      reportType: 'ACCOUNT',
      accounts: accountRows,
      aggregateTotals: {
        totalAccounts: accountRows.length,
        totalCapital: Number(totalCapital.toFixed(2)),
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
        blendedReturnPercent,
        totalTrades,
        totalCommissions: Number(totalCommissions.toFixed(2)),
      },
    };
  }

  // =========================================================================
  // 6. STRATEGY REPORT
  // =========================================================================

  static generateStrategyReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): StrategyReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const baseMeta = this.createMetadata('STRATEGY', 'Strategy Alpha & Model Performance Attribution Report', filters, filteredTrades, accounts, strategies, playbooks);

    // Group by strategy
    const stratMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const key = t.strategyId || 'unassigned';
      if (!stratMap.has(key)) stratMap.set(key, []);
      stratMap.get(key)!.push(t);
    });

    const strategyRows: StrategyPerformanceRow[] = [];

    // Evaluate known strategies
    for (const strat of strategies) {
      if (filters.strategyId !== 'ALL' && strat.id !== filters.strategyId) continue;
      const sTrades = stratMap.get(strat.id) || [];
      const metrics = AnalyticsEngine.calculateAdvancedMetrics(sTrades, 100000);

      strategyRows.push({
        strategyId: strat.id,
        strategyName: strat.name,
        type: strat.assetClasses?.join(', ') || 'SYSTEMATIC',
        tradesCount: sTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        payoffRatio: metrics.payoffRatio,
        expectancyR: metrics.expectancyRMultiple,
        averageWin: metrics.averageWin,
        averageLoss: metrics.averageLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        maxConsecutiveLosses: metrics.maxConsecutiveLosses,
        avgDurationMinutes: metrics.avgDurationMinutes,
      });
    }

    // Check for unassigned trades
    if (stratMap.has('unassigned') && (filters.strategyId === 'ALL' || filters.strategyId === 'unassigned')) {
      const unassignedTrades = stratMap.get('unassigned')!;
      const metrics = AnalyticsEngine.calculateAdvancedMetrics(unassignedTrades, 100000);
      strategyRows.push({
        strategyId: 'unassigned',
        strategyName: 'Unassigned / Discretionary',
        type: 'MANUAL',
        tradesCount: unassignedTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        payoffRatio: metrics.payoffRatio,
        expectancyR: metrics.expectancyRMultiple,
        averageWin: metrics.averageWin,
        averageLoss: metrics.averageLoss,
        largestWin: metrics.largestWin,
        largestLoss: metrics.largestLoss,
        maxConsecutiveLosses: metrics.maxConsecutiveLosses,
        avgDurationMinutes: metrics.avgDurationMinutes,
      });
    }

    strategyRows.sort((a, b) => b.netPnL - a.netPnL);

    const topPerformer = strategyRows.length > 0 ? { name: strategyRows[0].strategyName, netPnL: strategyRows[0].netPnL, winRate: strategyRows[0].winRate } : null;
    const underPerformer = strategyRows.length > 1 ? { name: strategyRows[strategyRows.length - 1].strategyName, netPnL: strategyRows[strategyRows.length - 1].netPnL, winRate: strategyRows[strategyRows.length - 1].winRate } : null;

    return {
      ...baseMeta,
      reportType: 'STRATEGY',
      strategies: strategyRows,
      topPerformer,
      underPerformer,
    };
  }

  // =========================================================================
  // 7. PLAYBOOK REPORT
  // =========================================================================

  static generatePlaybookReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): PlaybookReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    });

    const baseMeta = this.createMetadata('PLAYBOOK', 'Playbook Execution & Setup Discipline Audit Report', filters, filteredTrades, accounts, strategies, playbooks);

    const pbMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const key = t.playbookId || 'unassigned';
      if (!pbMap.has(key)) pbMap.set(key, []);
      pbMap.get(key)!.push(t);
    });

    const playbookRows: PlaybookPerformanceRow[] = [];

    for (const pb of playbooks) {
      if (filters.playbookId !== 'ALL' && pb.id !== filters.playbookId) continue;
      const pTrades = pbMap.get(pb.id) || [];
      const metrics = AnalyticsEngine.calculateAdvancedMetrics(pTrades, 100000);

      // Checklist adherence from trade qualityScore
      const tradesWithScore = pTrades.filter((t) => t.qualityScore !== undefined);
      const avgAdherence = tradesWithScore.length > 0
        ? tradesWithScore.reduce((sum, t) => sum + (t.qualityScore?.ruleAdherence || t.qualityScore?.compositeScore || 0), 0) / tradesWithScore.length
        : 85;

      const checklistItemsCount = (pb.confirmationChecklist?.length || 0) + (pb.ruleChecklist?.length || 0) + (pb.confluenceChecklist?.length || 0);

      playbookRows.push({
        playbookId: pb.id,
        playbookTitle: pb.title,
        marketPhase: pb.thesis?.slice(0, 30) || 'ALL_MARKETS',
        setupsCount: checklistItemsCount > 0 ? checklistItemsCount : 1,
        tradesCount: pTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        profitFactor: metrics.profitFactor,
        averageAchievedR: metrics.averageAchievedR,
        checklistAdherenceRate: Number(avgAdherence.toFixed(1)),
      });
    }

    // Checklist compliance impact
    const evaluatedTrades = filteredTrades.filter((t) => t.qualityScore !== undefined);
    const highChecklistTrades = evaluatedTrades.filter((t) => (t.qualityScore?.compositeScore || 0) >= 75);
    const lowChecklistTrades = evaluatedTrades.filter((t) => (t.qualityScore?.compositeScore || 0) < 75);

    const pnlHigh = highChecklistTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const pnlLow = lowChecklistTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const avgScore = evaluatedTrades.length > 0
      ? evaluatedTrades.reduce((sum, t) => sum + (t.qualityScore?.compositeScore || 0), 0) / evaluatedTrades.length
      : 85;

    return {
      ...baseMeta,
      reportType: 'PLAYBOOK',
      playbooks: playbookRows.sort((a, b) => b.netPnL - a.netPnL),
      checklistComplianceStats: {
        totalEvaluatedTrades: evaluatedTrades.length,
        fullChecklistTradesCount: highChecklistTrades.length,
        avgScorePercent: Number(avgScore.toFixed(1)),
        pnlWithHighChecklist: Number(pnlHigh.toFixed(2)),
        pnlWithLowChecklist: Number(pnlLow.toFixed(2)),
      },
    };
  }

  // =========================================================================
  // 8. PROP-FIRM REPORT
  // =========================================================================

  static generatePropFirmReport(
    trades: Trade[],
    accounts: Account[],
    propFirmRules: PropFirmRuleSet[] = [],
    filters: ReportFilterState
  ): PropFirmReportData {
    const activeAcc = accounts.find((a) => a.id === filters.accountId) || accounts[0] || ({
      id: 'mock_acc',
      name: 'Prop Evaluation Account',
      accountType: 'PROP_EVALUATION',
      startingBalance: 100000,
      currentBalance: 106500,
      equity: 106500,
      highWaterMark: 106500,
      broker: 'FTMO',
      currency: 'USD',
      profitTarget: 10000,
      dailyLossLimit: 5000,
      maximumLoss: 10000,
      minimumTradingDays: 5,
      currentTradingDays: 6,
    } as Account);

    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const accTrades = trades.filter((t) => t.accountId === activeAcc.id);
    const filteredTrades = AnalyticsEngine.filterTrades(accTrades, {
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    const compliance = CalculationEngine.evaluatePropFirmCompliance(activeAcc, filteredTrades);
    const baseMeta = this.createMetadata('PROP_FIRM', 'Prop Firm Compliance Tearsheet & Audit Certificate', filters, filteredTrades, accounts, [], []);

    // Drawdown history
    const dailyPnLEntries = CalculationEngine.generateDailyPnL(filteredTrades, activeAcc.startingBalance || 100000);
    let peak = activeAcc.startingBalance || 100000;
    const dailyDrawdownHistory = dailyPnLEntries.map((d) => {
      if (d.balanceAfter > peak) peak = d.balanceAfter;
      const ddPct = peak > 0 ? ((peak - d.balanceAfter) / peak) * 100 : 0;
      return {
        date: d.date,
        balance: d.balanceAfter,
        dailyPnL: d.netPnL,
        drawdownPercent: Number(ddPct.toFixed(2)),
      };
    });

    const overallStatus: 'COMPLIANT' | 'WARNING' | 'BREACHED' | 'PASSED' =
      compliance.overallStatus === 'PASSED'
        ? 'PASSED'
        : compliance.overallStatus === 'BREACHED'
        ? 'BREACHED'
        : compliance.overallStatus === 'AT_RISK'
        ? 'WARNING'
        : 'COMPLIANT';
    const complianceScore =
      overallStatus === 'PASSED' ? 100 : overallStatus === 'COMPLIANT' ? 95 : overallStatus === 'WARNING' ? 70 : 0;

    const profitTargetPercent =
      activeAcc.startingBalance && compliance.profitTargetAmount
        ? Number(((compliance.profitTargetAmount / activeAcc.startingBalance) * 100).toFixed(1))
        : 10;
    const dailyLossLimitPercent =
      activeAcc.startingBalance && compliance.dailyLossLimitAmount
        ? Number(((compliance.dailyLossLimitAmount / activeAcc.startingBalance) * 100).toFixed(1))
        : 5;
    const maxDrawdownLimitPercent =
      activeAcc.startingBalance && compliance.maxLossLimitAmount
        ? Number(((compliance.maxLossLimitAmount / activeAcc.startingBalance) * 100).toFixed(1))
        : 10;

    const currentDrawdownAmount = Math.max(0, (activeAcc.highWaterMark || activeAcc.startingBalance) - activeAcc.currentBalance);
    const currentDrawdownPercent =
      activeAcc.highWaterMark && activeAcc.highWaterMark > 0
        ? Number(((currentDrawdownAmount / activeAcc.highWaterMark) * 100).toFixed(2))
        : 0;

    return {
      ...baseMeta,
      reportType: 'PROP_FIRM',
      accountName: activeAcc.name,
      accountType: activeAcc.accountType || 'PROP_EVALUATION',
      firmName: activeAcc.propFirm || activeAcc.broker || 'Institutional Prop Partner',
      ruleSetName: activeAcc.group || 'Standard 2-Step Evaluation',
      startingBalance: activeAcc.startingBalance || 100000,
      currentBalance: activeAcc.currentBalance || 100000,
      highWaterMark: activeAcc.highWaterMark || activeAcc.currentBalance || 100000,
      profitTargetAmount: compliance.profitTargetAmount || 0,
      profitTargetPercent,
      profitTargetReached: compliance.isProfitTargetAchieved,
      profitProgressPercent: compliance.profitTargetProgressPercent,
      dailyLossLimitAmount: compliance.dailyLossLimitAmount,
      dailyLossLimitPercent,
      todaysLossAmount: compliance.todaysLossAmount,
      todaysLossPercent: compliance.dailyLossUsedPercent,
      dailyLossViolated: compliance.isDailyLossBreached,
      maxDrawdownLimitAmount: compliance.maxLossLimitAmount,
      maxDrawdownLimitPercent,
      currentDrawdownAmount,
      currentDrawdownPercent,
      maxDrawdownViolated: compliance.isMaxLossBreached,
      minTradingDaysRequired: compliance.minTradingDaysRequired,
      currentTradingDays: compliance.tradingDaysCompleted,
      minDaysMet: compliance.isMinTradingDaysPassed,
      overallCompliance: overallStatus,
      complianceScore,
      dailyDrawdownHistory,
    };
  }

  // =========================================================================
  // 9. PSYCHOLOGY REPORT
  // =========================================================================

  static generatePsychologyReport(
    trades: Trade[],
    accounts: Account[],
    filters: ReportFilterState
  ): PsychologyReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
    });

    const baseMeta = this.createMetadata('PSYCHOLOGY', 'Behavioral Psychology, Discipline & Mistake Impact Report', filters, filteredTrades, accounts, [], []);
    const summary = PsychologyEngine.generateFullReport(filteredTrades);

    // Emotional Impacts
    const emotionMap = new Map<string, Trade[]>();
    filteredTrades.forEach((t) => {
      const emotion = t.psychology?.preTradeEmotion || 'CALM';
      if (!emotionMap.has(emotion)) emotionMap.set(emotion, []);
      emotionMap.get(emotion)!.push(t);
    });

    const emotionalImpacts = Array.from(emotionMap.entries()).map(([emotion, eTrades]) => {
      const metrics = AnalyticsEngine.calculateAdvancedMetrics(eTrades, 100000);
      const discArr = eTrades.filter((t) => t.psychology?.disciplineScore).map((t) => t.psychology!.disciplineScore);
      const avgDisc = discArr.length > 0 ? discArr.reduce((a, b) => a + b, 0) / discArr.length : 10;
      return {
        emotion,
        tradesCount: eTrades.length,
        winRate: metrics.winRate,
        netPnL: metrics.netPnL,
        avgDiscipline: Number(avgDisc.toFixed(1)),
        profitFactor: metrics.profitFactor,
      };
    }).sort((a, b) => b.netPnL - a.netPnL);

    // Mistake frequency & cost
    const mistakeCostMap = new Map<string, { count: number; totalCost: number; category: string }>();
    filteredTrades.forEach((t) => {
      const mistakes = t.psychology?.mistakes || [];
      const loss = (t.netPnL || 0) < 0 ? Math.abs(t.netPnL || 0) : 0;
      mistakes.forEach((m) => {
        if (!m || m === 'None') return;
        if (!mistakeCostMap.has(m)) mistakeCostMap.set(m, { count: 0, totalCost: 0, category: 'EXECUTION' });
        const entry = mistakeCostMap.get(m)!;
        entry.count++;
        entry.totalCost += loss;
      });
    });

    const mistakeFrequency = Array.from(mistakeCostMap.entries()).map(([mistake, data]) => ({
      mistake,
      count: data.count,
      totalCost: Number(data.totalCost.toFixed(2)),
      avgLossPerOccurrence: data.count > 0 ? Number((data.totalCost / data.count).toFixed(2)) : 0,
      category: data.category,
    })).sort((a, b) => b.totalCost - a.totalCost);

    // Plan adherence comparison
    const followedTrades = filteredTrades.filter((t) => t.psychology?.followedTradingPlan === true);
    const deviatedTrades = filteredTrades.filter((t) => t.psychology?.followedTradingPlan === false);

    const fMetrics = AnalyticsEngine.calculateAdvancedMetrics(followedTrades, 100000);
    const dMetrics = AnalyticsEngine.calculateAdvancedMetrics(deviatedTrades, 100000);

    return {
      ...baseMeta,
      reportType: 'PSYCHOLOGY',
      summary,
      emotionalImpacts,
      mistakeFrequency,
      planComplianceImpact: {
        followedPlanCount: followedTrades.length,
        followedPlanWinRate: fMetrics.winRate,
        followedPlanPnL: fMetrics.netPnL,
        deviatedPlanCount: deviatedTrades.length,
        deviatedPlanWinRate: dMetrics.winRate,
        deviatedPlanPnL: dMetrics.netPnL,
      },
    };
  }

  // =========================================================================
  // 10. RISK REPORT
  // =========================================================================

  static generateRiskReport(
    trades: Trade[],
    accounts: Account[],
    riskPolicy?: RiskPolicy,
    filters: ReportFilterState = { accountId: 'ALL', datePreset: 'ALL_TIME' }
  ): RiskReportData {
    const activeAcc = accounts.find((a) => a.id === filters.accountId) || accounts[0] || null;
    const policy = riskPolicy || RiskEngine.getDefaultPolicy('default_user', activeAcc?.id);

    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      instrument: filters.instrument,
    });

    const baseMeta = this.createMetadata('RISK', 'Quantitative Risk Exposure & Policy Compliance Audit', filters, filteredTrades, accounts, [], []);
    const budgets = RiskEngine.calculateRiskBudgets(activeAcc, filteredTrades, policy);
    const openTrades = filteredTrades.filter((t) => t.status === 'OPEN');
    const exposure = RiskEngine.calculateExposure(activeAcc, openTrades, policy);

    const metrics = AnalyticsEngine.calculateAdvancedMetrics(filteredTrades, activeAcc?.startingBalance || 100000);

    const risks = filteredTrades.map((t) => t.plannedRiskAmount || 0).filter((r) => r > 0);
    const avgRisk = risks.length > 0 ? risks.reduce((a, b) => a + b, 0) / risks.length : 1000;
    const riskPercents = filteredTrades.map((t) => t.plannedRiskPercent || 0).filter((r) => r > 0);
    const avgRiskPct = riskPercents.length > 0 ? riskPercents.reduce((a, b) => a + b, 0) / riskPercents.length : 1.0;
    const maxRiskViolation = riskPercents.length > 0 ? Math.max(...riskPercents) : 1.5;

    // Daily VaR 95%
    const returns = filteredTrades.map((t) => (t.netPnL || 0) / (activeAcc?.startingBalance || 100000));
    const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 1 ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1) : 0;
    const stdDev = Math.sqrt(variance);
    const dailyVaR95 = Math.abs((1.65 * stdDev - meanReturn) * (activeAcc?.startingBalance || 100000));

    // Risk per trade distribution buckets
    const bucketRanges = [
      { label: '< 0.5%', min: 0, max: 0.5 },
      { label: '0.5% - 1.0%', min: 0.5, max: 1.0 },
      { label: '1.0% - 1.5%', min: 1.0, max: 1.5 },
      { label: '1.5% - 2.0%', min: 1.5, max: 2.0 },
      { label: '> 2.0%', min: 2.0, max: 999 },
    ];

    const riskPerTradeDistribution = bucketRanges.map((b) => {
      const bTrades = filteredTrades.filter((t) => {
        const rp = t.plannedRiskPercent || 1.0;
        return rp >= b.min && (b.max === 999 ? true : rp < b.max);
      });
      const bClosed = bTrades.filter((t) => t.status === 'CLOSED');
      const bWins = bClosed.filter((t) => (t.netPnL || 0) > 0.001);
      const bGrossProfit = bWins.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const bGrossLoss = Math.abs(bClosed.filter((t) => (t.netPnL || 0) < -0.001).reduce((sum, t) => sum + (t.netPnL || 0), 0));
      const bPf = bGrossLoss > 0 ? Number((bGrossProfit / bGrossLoss).toFixed(2)) : bGrossProfit > 0 ? 99.99 : 0;
      const bNet = bClosed.reduce((sum, t) => sum + (t.netPnL || 0), 0);

      return {
        riskRange: b.label,
        tradesCount: bTrades.length,
        winRate: bClosed.length > 0 ? Number(((bWins.length / bClosed.length) * 100).toFixed(1)) : 0,
        profitFactor: bPf,
        netPnL: Number(bNet.toFixed(2)),
      };
    });

    const correlationCluster = exposure.correlatedGroups.map((g) => ({
      clusterName: g.groupName,
      exposurePercent: g.exposurePercent,
      openTradesCount: g.openTradesCount,
    }));

    return {
      ...baseMeta,
      reportType: 'RISK',
      summary: {
        maxDrawdownPercent: metrics.maxDrawdownPercent,
        maxDrawdownAmount: metrics.maxDrawdownAmount,
        dailyVaR95: Number(dailyVaR95.toFixed(2)),
        avgRiskPerTrade: Number(avgRisk.toFixed(2)),
        avgRiskPercentPerTrade: Number(avgRiskPct.toFixed(2)),
        maxRiskViolationPercent: Number(maxRiskViolation.toFixed(2)),
      },
      riskBudgetUsage: {
        daily: {
          budget: budgets.daily.limitAmount,
          used: budgets.daily.usedAmount,
          percentUsed: budgets.daily.usedPercent,
          status: budgets.daily.state === 'CRITICAL' ? 'BREACHED' : 'COMPLIANT',
        },
        weekly: {
          budget: budgets.weekly.limitAmount,
          used: budgets.weekly.usedAmount,
          percentUsed: budgets.weekly.usedPercent,
          status: budgets.weekly.state === 'CRITICAL' ? 'BREACHED' : 'COMPLIANT',
        },
        monthly: {
          budget: budgets.monthly.limitAmount,
          used: budgets.monthly.usedAmount,
          percentUsed: budgets.monthly.usedPercent,
          status: budgets.monthly.state === 'CRITICAL' ? 'BREACHED' : 'COMPLIANT',
        },
      },
      riskPerTradeDistribution,
      correlationCluster,
    };
  }

  // =========================================================================
  // 11. TRADE HISTORY REPORT
  // =========================================================================

  static generateTradeHistoryReport(
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    filters: ReportFilterState
  ): TradeHistoryReportData {
    const dateRange = this.resolveDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const filteredTrades = AnalyticsEngine.filterTrades(trades, {
      accountId: filters.accountId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      strategyId: filters.strategyId,
      playbookId: filters.playbookId,
      instrument: filters.instrument,
      assetClass: filters.assetClass,
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

    const baseMeta = this.createMetadata('TRADE_HISTORY', 'Itemized Trade Execution Journal & Audit Ledger', filters, filteredTrades, accounts, strategies, playbooks);

    const closed = filteredTrades.filter((t) => t.status === 'CLOSED');
    const wins = closed.filter((t) => (t.netPnL || 0) > 0.001);
    const losses = closed.filter((t) => (t.netPnL || 0) < -0.001);
    const bes = closed.filter((t) => Math.abs(t.netPnL || 0) <= 0.001);

    const totalGrossPnL = closed.reduce((sum, t) => sum + (t.grossPnL || t.netPnL || 0), 0);
    const totalNetPnL = closed.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const totalCommissions = filteredTrades.reduce((sum, t) => sum + (t.commission || 0) + (t.swap || 0), 0);
    const totalFees = filteredTrades.reduce((sum, t) => sum + (t.fees || 0) + (t.spreadCost || 0), 0);

    const rValues = closed.filter((t) => t.achievedRMultiple !== undefined).map((t) => t.achievedRMultiple!);
    const avgR = rValues.length > 0 ? rValues.reduce((a, b) => a + b, 0) / rValues.length : 0;

    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.netPnL || 0), 0));
    const grossProfit = wins.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const profitFactor = grossLoss > 0 ? Number((grossProfit / grossLoss).toFixed(2)) : grossProfit > 0 ? 99.99 : 0;

    const totalSecs = closed.reduce((sum, t) => sum + (t.holdingTimeSeconds || 0), 0);
    const avgDurationMinutes = closed.length > 0 ? Math.round(totalSecs / closed.length / 60) : 0;

    const mappedTrades = filteredTrades.map((t) => ({
      id: t.id,
      openDate: t.entryDate,
      closeDate: t.exitDate,
      symbol: t.instrument,
      direction: t.direction,
      quantity: t.quantity,
      entryPrice: t.entryPrice,
      exitPrice: t.exitPrice,
      rMultiple: t.achievedRMultiple,
      netPnL: t.netPnL || 0,
      strategyName: t.strategyName || 'Discretionary',
      assetClass: t.assetClass,
      tags: t.tags,
    }));

    return {
      ...baseMeta,
      reportType: 'TRADE_HISTORY',
      trades: mappedTrades,
      summary: {
        totalTrades: filteredTrades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        breakEvenTrades: bes.length,
        winRate: closed.length > 0 ? Number(((wins.length / closed.length) * 100).toFixed(1)) : 0,
        totalGrossPnL: Number(totalGrossPnL.toFixed(2)),
        totalNetPnL: Number(totalNetPnL.toFixed(2)),
        totalCommissions: Number(totalCommissions.toFixed(2)),
        totalFees: Number(totalFees.toFixed(2)),
        profitFactor,
        avgPnL: closed.length > 0 ? Number((totalNetPnL / closed.length).toFixed(2)) : 0,
        avgRMultiple: Number(avgR.toFixed(2)),
        avgDurationMinutes,
      },
    };
  }

  // =========================================================================
  // CENTRAL DISPATCHER
  // =========================================================================

  static generateReport(
    type: ReportType,
    trades: Trade[],
    accounts: Account[],
    strategies: Strategy[],
    playbooks: Playbook[],
    propFirmRules: PropFirmRuleSet[] = [],
    filters: ReportFilterState = { accountId: 'ALL', datePreset: 'ALL_TIME' },
    riskPolicy?: RiskPolicy
  ): GeneratedReportData {
    switch (type) {
      case 'EXECUTIVE_SUMMARY':
        return this.generateExecutiveSummary(trades, accounts, strategies, playbooks, filters);
      case 'DAILY':
        return this.generateDailyReport(trades, accounts, strategies, playbooks, filters);
      case 'WEEKLY':
        return this.generateWeeklyReport(trades, accounts, strategies, playbooks, filters);
      case 'MONTHLY':
        return this.generateMonthlyReport(trades, accounts, strategies, playbooks, filters);
      case 'ACCOUNT':
        return this.generateAccountReport(trades, accounts, strategies, playbooks, filters);
      case 'STRATEGY':
        return this.generateStrategyReport(trades, accounts, strategies, playbooks, filters);
      case 'PLAYBOOK':
        return this.generatePlaybookReport(trades, accounts, strategies, playbooks, filters);
      case 'PROP_FIRM':
        return this.generatePropFirmReport(trades, accounts, propFirmRules, filters);
      case 'PSYCHOLOGY':
        return this.generatePsychologyReport(trades, accounts, filters);
      case 'RISK':
        return this.generateRiskReport(trades, accounts, riskPolicy, filters);
      case 'TRADE_HISTORY':
        return this.generateTradeHistoryReport(trades, accounts, strategies, playbooks, filters);
      default:
        return this.generateExecutiveSummary(trades, accounts, strategies, playbooks, filters);
    }
  }

  // =========================================================================
  // EXPORT UTILITIES: CSV, JSON, SPREADSHEET (TSV)
  // =========================================================================

  /**
   * Serializes any generated report into clean RFC-4180 CSV
   */
  static exportReportToCsv(report: GeneratedReportData): string {
    const lines: string[] = [];

    // Header metadata block
    lines.push(`"# REPORT: ${report.reportTitle}"`);
    lines.push(`"# Generated At: ${report.generatedAt}"`);
    lines.push(`"# Account: ${report.appliedFilters.accountName}"`);
    lines.push(`"# Date Range: ${report.appliedFilters.dateRangeLabel}"`);
    lines.push(`"# Total Trades Evaluated: ${report.tradeCount}"`);
    lines.push('');

    switch (report.reportType) {
      case 'DAILY': {
        lines.push('Date,Trades Count,Winning Trades,Losing Trades,Win Rate (%),Gross Profit ($),Gross Loss ($),Net PnL ($),Commissions ($),Volume,Avg Duration (min),Discipline Score,Primary Instrument');
        for (const row of report.days) {
          lines.push(
            [
              row.date,
              row.tradesCount,
              row.winningCount,
              row.losingCount,
              row.winRate,
              row.grossProfit,
              row.grossLoss,
              row.netPnL,
              row.commissions,
              row.totalVolume,
              row.avgDurationMinutes,
              row.disciplineScoreAvg,
              `"${row.primaryAsset}"`,
            ].join(',')
          );
        }
        break;
      }
      case 'WEEKLY': {
        lines.push('Week Label,Start Date,End Date,Trades Count,Win Rate (%),Net PnL ($),Gross Profit ($),Gross Loss ($),Profit Factor,Cumulative PnL ($),Avg R Multiple');
        for (const row of report.weeks) {
          lines.push(
            [
              `"${row.weekLabel}"`,
              row.startDate,
              row.endDate,
              row.tradesCount,
              row.winRate,
              row.netPnL,
              row.grossProfit,
              row.grossLoss,
              row.profitFactor,
              row.cumPnL,
              row.avgRMultiple,
            ].join(',')
          );
        }
        break;
      }
      case 'MONTHLY': {
        lines.push('Year-Month,Month Name,Trades Count,Win Rate (%),Net PnL ($),Gross Profit ($),Gross Loss ($),Profit Factor,Return (%),Sharpe Ratio,Max DD (%),Cumulative PnL ($)');
        for (const row of report.months) {
          lines.push(
            [
              row.yearMonth,
              `"${row.monthName}"`,
              row.tradesCount,
              row.winRate,
              row.netPnL,
              row.grossProfit,
              row.grossLoss,
              row.profitFactor,
              row.returnPercent,
              row.sharpeRatio,
              row.maxDrawdownPercent,
              row.cumPnL,
            ].join(',')
          );
        }
        break;
      }
      case 'ACCOUNT': {
        lines.push('Account ID,Account Name,Type,Broker,Currency,Starting Balance,Current Balance,Net PnL ($),Return (%),Trades,Win Rate (%),Profit Factor,Max DD (%)');
        for (const row of report.accounts) {
          lines.push(
            [
              row.accountId,
              `"${row.accountName}"`,
              row.accountType,
              `"${row.broker}"`,
              row.currency,
              row.startingBalance,
              row.currentBalance,
              row.netPnL,
              row.returnPercent,
              row.tradesCount,
              row.winRate,
              row.profitFactor,
              row.maxDrawdownPercent,
            ].join(',')
          );
        }
        break;
      }
      case 'STRATEGY': {
        lines.push('Strategy Name,Type,Trades Count,Win Rate (%),Net PnL ($),Profit Factor,Payoff Ratio,Expectancy (R),Average Win ($),Average Loss ($),Largest Win ($),Largest Loss ($)');
        for (const row of report.strategies) {
          lines.push(
            [
              `"${row.strategyName}"`,
              row.type,
              row.tradesCount,
              row.winRate,
              row.netPnL,
              row.profitFactor,
              row.payoffRatio,
              row.expectancyR,
              row.averageWin,
              row.averageLoss,
              row.largestWin,
              row.largestLoss,
            ].join(',')
          );
        }
        break;
      }
      case 'TRADE_HISTORY': {
        lines.push('Trade ID,Symbol,Side,Quantity,Entry Price,Exit Price,Net PnL ($),R-Multiple,Open Date,Close Date,Strategy,Asset Class');
        for (const t of report.trades) {
          lines.push(
            [
              t.id,
              t.symbol,
              t.direction,
              t.quantity,
              t.entryPrice,
              t.exitPrice || '',
              t.netPnL,
              t.rMultiple !== undefined ? t.rMultiple : '',
              t.openDate,
              t.closeDate || '',
              `"${t.strategyName}"`,
              t.assetClass,
            ].join(',')
          );
        }
        break;
      }
      default: {
        lines.push('Metric,Value');
        if ('metrics' in report) {
          const m = (report as ExecutiveSummaryReportData).metrics;
          lines.push(`Total Net PnL,$${m.netPnL}`);
          lines.push(`Total Trades,${m.totalTrades}`);
          lines.push(`Win Rate,${m.winRate}%`);
          lines.push(`Profit Factor,${m.profitFactor}`);
          lines.push(`Sharpe Ratio,${m.sharpeRatio}`);
          lines.push(`Max Drawdown,${m.maxDrawdownPercent}%`);
          lines.push(`Expectancy,${m.expectancyRMultiple}R`);
        }
        break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Serializes report data into structured JSON format
   */
  static exportReportToJson(report: GeneratedReportData): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Formats report table as Tab-Separated Values (TSV) for instant pasting into Excel / Google Sheets
   */
  static exportReportToSpreadsheetData(report: GeneratedReportData): string {
    const csv = this.exportReportToCsv(report);
    return csv
      .split('\n')
      .map((line) => {
        if (line.startsWith('"#')) return line.replace(/^"#/, '').replace(/"$/, '');
        return line.split(',').map((cell) => cell.replace(/^"(.*)"$/, '$1')).join('\t');
      })
      .join('\n');
  }
}
