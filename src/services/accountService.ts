/**
 * Account Service & Health Engine for TradeOS
 * 
 * Provides robust financial validation, account health analytics,
 * multi-tier grouping, and life-cycle operations.
 */

import { Account, AccountType, AccountStatus, Trade } from '../types/domain';
import { CalculationEngine } from './calculationEngine';

export type AccountHealthRating = 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL' | 'BREACHED' | 'ARCHIVED';

export interface AccountHealth {
  score: number; // 0 to 100
  rating: AccountHealthRating;
  color: 'emerald' | 'blue' | 'amber' | 'rose' | 'neutral';
  statusLabel: string;
  summary: string;
  
  // Buffers & Progress
  drawdownBufferAmount: number;
  drawdownBufferPercent: number;
  dailyLossBufferAmount: number;
  dailyLossBufferPercent: number;
  profitTargetAmount: number;
  profitTargetAchievedAmount: number;
  profitTargetProgressPercent: number;
  tradingDaysCurrent: number;
  tradingDaysRequired: number;
  tradingDaysProgressPercent: number;
  
  // Warnings
  isNearDailyLimit: boolean;
  isNearMaxLoss: boolean;
  isDailyLossBreached: boolean;
  isMaxLossBreached: boolean;
  isProfitTargetHit: boolean;
  isTradingDaysMet: boolean;
}

export interface AccountValidationResult {
  isValid: boolean;
  errors: string[];
}

export type AccountGroupBy = 'NONE' | 'TYPE' | 'BROKER' | 'STATUS' | 'CURRENCY' | 'GROUP';

export class AccountService {
  /**
   * Validates account data against strict financial integrity constraints
   */
  static validateAccount(data: Partial<Account>): AccountValidationResult {
    const errors: string[] = [];

    // 1. Basic Required Fields
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Account name is required.');
    }

    if (!data.broker || data.broker.trim().length === 0) {
      errors.push('Broker or firm name is required.');
    }

    if (!data.platform || data.platform.trim().length === 0) {
      errors.push('Trading platform is required.');
    }

    if (!data.currency || data.currency.trim().length === 0) {
      errors.push('Base currency is required.');
    }

    // 2. Financial Balance Integrity
    if (data.startingBalance === undefined || data.startingBalance === null || isNaN(data.startingBalance)) {
      errors.push('Starting balance is required.');
    } else if (data.startingBalance <= 0) {
      errors.push('Starting balance must be strictly greater than $0.00.');
    }

    if (data.currentBalance !== undefined && data.currentBalance !== null) {
      if (isNaN(data.currentBalance) || data.currentBalance < 0) {
        errors.push('Current balance cannot be negative.');
      }
    }

    if (data.equity !== undefined && data.equity !== null) {
      if (isNaN(data.equity) || data.equity < 0) {
        errors.push('Account equity cannot be negative.');
      }
    }

    // 3. Risk & Loss Bounds
    const startingBal = data.startingBalance || 100000;

    if (data.dailyLossLimit !== undefined && data.dailyLossLimit !== null && data.dailyLossLimit > 0) {
      if (data.dailyLossLimit > startingBal) {
        errors.push(`Daily loss limit ($${data.dailyLossLimit.toLocaleString()}) cannot exceed starting balance ($${startingBal.toLocaleString()}).`);
      }
    }

    if (data.maximumLoss !== undefined && data.maximumLoss !== null && data.maximumLoss > 0) {
      if (data.maximumLoss > startingBal) {
        errors.push(`Maximum loss limit ($${data.maximumLoss.toLocaleString()}) cannot exceed starting balance ($${startingBal.toLocaleString()}).`);
      }
      if (data.dailyLossLimit && data.dailyLossLimit > data.maximumLoss) {
        errors.push(`Daily loss limit ($${data.dailyLossLimit.toLocaleString()}) cannot exceed maximum total loss ($${data.maximumLoss.toLocaleString()}).`);
      }
    }

    if (data.trailingDrawdown !== undefined && data.trailingDrawdown !== null && data.trailingDrawdown > 0) {
      if (data.trailingDrawdown > startingBal) {
        errors.push(`Trailing drawdown ($${data.trailingDrawdown.toLocaleString()}) cannot exceed starting balance.`);
      }
    }

    if (data.profitTarget !== undefined && data.profitTarget !== null) {
      if (data.profitTarget < 0) {
        errors.push('Profit target cannot be a negative amount.');
      }
    }

    if (data.minimumTradingDays !== undefined && data.minimumTradingDays !== null) {
      if (data.minimumTradingDays < 0) {
        errors.push('Minimum trading days cannot be negative.');
      }
    }

    if (data.maxRiskPerTradePercent !== undefined && data.maxRiskPerTradePercent !== null) {
      if (data.maxRiskPerTradePercent <= 0 || data.maxRiskPerTradePercent > 100) {
        errors.push('Max risk per trade must be between 0.01% and 100%.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Calculates comprehensive account health metrics, buffer headroom, and status ratings
   */
  static evaluateAccountHealth(account: Account, trades: Trade[]): AccountHealth {
    if (account.isArchived || account.status === 'ARCHIVED') {
      return {
        score: 0,
        rating: 'ARCHIVED',
        color: 'neutral',
        statusLabel: 'ARCHIVED',
        summary: 'Account has been archived and is not actively monitored.',
        drawdownBufferAmount: 0,
        drawdownBufferPercent: 0,
        dailyLossBufferAmount: 0,
        dailyLossBufferPercent: 0,
        profitTargetAmount: account.profitTarget || 0,
        profitTargetAchievedAmount: 0,
        profitTargetProgressPercent: 0,
        tradingDaysCurrent: 0,
        tradingDaysRequired: account.minimumTradingDays || 0,
        tradingDaysProgressPercent: 0,
        isNearDailyLimit: false,
        isNearMaxLoss: false,
        isDailyLossBreached: false,
        isMaxLossBreached: false,
        isProfitTargetHit: false,
        isTradingDaysMet: false,
      };
    }

    const startingBalance = account.startingBalance || 100000;
    const currentBalance = account.currentBalance || startingBalance;
    const netPnL = currentBalance - startingBalance;

    // Evaluate compliance via centralized engine
    const compliance = CalculationEngine.evaluatePropFirmCompliance(account, trades);
    const drawdownStats = CalculationEngine.calculateDrawdown(trades, startingBalance);

    // Calculate Trading Days
    const uniqueDays = new Set(
      trades
        .filter(t => t.status === 'CLOSED' && t.entryDate)
        .map(t => t.entryDate.split('T')[0])
    );
    const tradingDaysCurrent = uniqueDays.size || account.currentTradingDays || 0;
    const tradingDaysRequired = account.minimumTradingDays || 0;
    const tradingDaysProgressPercent = tradingDaysRequired > 0 
      ? Math.min(100, Math.round((tradingDaysCurrent / tradingDaysRequired) * 100))
      : 100;
    const isTradingDaysMet = tradingDaysRequired === 0 || tradingDaysCurrent >= tradingDaysRequired;

    // Check breach flags
    const isDailyLossBreached = compliance.isDailyLossBreached || account.status === 'BREACHED' || account.status === 'FAILED';
    const isMaxLossBreached = compliance.isMaxLossBreached || account.status === 'BREACHED' || account.status === 'FAILED';
    const isNearDailyLimit = compliance.dailyLossWarning;
    const isNearMaxLoss = compliance.maxLossWarning;
    const isProfitTargetHit = compliance.isProfitTargetAchieved || account.status === 'PASSED';

    // Calculate Health Score (0 - 100)
    let score = 100;

    if (isDailyLossBreached || isMaxLossBreached) {
      score = 0;
    } else {
      // Deduct points based on max loss buffer utilization
      const ddUsed = compliance.maxDrawdownUsedPercent || 0;
      score -= Math.min(60, ddUsed * 0.6);

      // Deduct points based on daily loss buffer utilization
      const dailyUsed = compliance.dailyLossUsedPercent || 0;
      score -= Math.min(30, dailyUsed * 0.3);

      // Add bonus for profit target progress if applicable
      if (account.profitTarget && account.profitTarget > 0) {
        const progress = Math.min(100, compliance.profitTargetProgressPercent || 0);
        score += progress * 0.1;
      }

      // Constrain score
      score = Math.max(5, Math.min(100, Math.round(score)));
    }

    // Determine Health Rating and Color
    let rating: AccountHealthRating = 'EXCELLENT';
    let color: 'emerald' | 'blue' | 'amber' | 'rose' | 'neutral' = 'emerald';
    let statusLabel = 'HEALTHY';
    let summary = 'Account operating cleanly with robust risk headroom.';

    if (isDailyLossBreached || isMaxLossBreached) {
      rating = 'BREACHED';
      color = 'rose';
      statusLabel = 'BREACHED';
      summary = isDailyLossBreached ? 'Daily loss limit was breached.' : 'Maximum loss drawdown limit was breached.';
    } else if (isProfitTargetHit && isTradingDaysMet) {
      rating = 'EXCELLENT';
      color = 'emerald';
      statusLabel = 'PASSED';
      summary = 'All challenge objectives and minimum trading days successfully achieved.';
    } else if (isNearDailyLimit || isNearMaxLoss || score < 50) {
      rating = 'CRITICAL';
      color = 'rose';
      statusLabel = 'CRITICAL RISK';
      summary = 'Drawdown is dangerously close to maximum loss boundaries.';
    } else if (score < 75) {
      rating = 'WARNING';
      color = 'amber';
      statusLabel = 'MODERATE DD';
      summary = 'Experiencing moderate drawdown. Monitor open risk exposure.';
    } else if (score < 90) {
      rating = 'GOOD';
      color = 'blue';
      statusLabel = 'STABLE';
      summary = 'Normal market drawdown within safe tolerances.';
    }

    return {
      score,
      rating,
      color,
      statusLabel,
      summary,
      drawdownBufferAmount: compliance.maxDrawdownRemainingBuffer,
      drawdownBufferPercent: Math.max(0, 100 - compliance.maxDrawdownUsedPercent),
      dailyLossBufferAmount: compliance.dailyLossRemainingBuffer,
      dailyLossBufferPercent: Math.max(0, 100 - compliance.dailyLossUsedPercent),
      profitTargetAmount: account.profitTarget || 0,
      profitTargetAchievedAmount: Math.max(0, netPnL),
      profitTargetProgressPercent: compliance.profitTargetProgressPercent || 0,
      tradingDaysCurrent,
      tradingDaysRequired,
      tradingDaysProgressPercent,
      isNearDailyLimit,
      isNearMaxLoss,
      isDailyLossBreached,
      isMaxLossBreached,
      isProfitTargetHit,
      isTradingDaysMet,
    };
  }

  /**
   * Groups a list of accounts by the designated category
   */
  static groupAccounts(accounts: Account[], groupBy: AccountGroupBy): Record<string, Account[]> {
    if (groupBy === 'NONE') {
      return { 'All Accounts': accounts };
    }

    const groups: Record<string, Account[]> = {};

    accounts.forEach(account => {
      let key = 'Other';

      switch (groupBy) {
        case 'TYPE': {
          const typeMap: Record<AccountType, string> = {
            'PROP_EVALUATION': 'Prop Evaluation (Phase 1)',
            'PROP_VERIFICATION': 'Prop Verification (Phase 2)',
            'PROP_FUNDED': 'Prop Funded Master',
            'PERSONAL_LIVE': 'Personal Live Portfolios',
            'PERSONAL_DEMO': 'Personal Demo / Sim',
            'BACKTEST': 'Backtest Portfolios',
            'FORWARD_TEST': 'Forward Test Engines',
            'CHALLENGE': 'Challenge Accounts',
            'CUSTOM': 'Custom Desk Accounts',
          };
          key = typeMap[account.accountType] || account.accountType;
          break;
        }
        case 'BROKER': {
          key = account.propFirm || account.broker || 'Unspecified Provider';
          break;
        }
        case 'STATUS': {
          const statusMap: Record<AccountStatus, string> = {
            'ACTIVE': 'Active Monitored',
            'INACTIVE': 'Inactive / Idle',
            'PAUSED': 'Paused / Resting',
            'PASSED': 'Objectives Passed',
            'FAILED': 'Failed / Closed',
            'BREACHED': 'Rule Breached',
            'ARCHIVED': 'Archived Accounts',
          };
          key = statusMap[account.status] || account.status;
          break;
        }
        case 'CURRENCY': {
          key = `${account.currency || 'USD'} Accounts`;
          break;
        }
        case 'GROUP': {
          key = account.group?.trim() || 'General Desk';
          break;
        }
        default:
          key = 'All Accounts';
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(account);
    });

    return groups;
  }
}
