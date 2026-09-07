/**
 * Trade Service & Financial Business Logic for TradeOS
 * 
 * Provides trade validation, filtering, multi-field sorting, 
 * and orchestration for trade calculations via CalculationEngine.
 */

import { Trade, AssetClass, TradeDirection, TradeStatus, MarketSession } from '../types/domain';
import { CalculationEngine } from './calculationEngine';

export interface TradeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface TradeFilters {
  searchTerm?: string;
  accountId?: string;
  direction?: TradeDirection | 'ALL';
  outcome?: 'WIN' | 'LOSS' | 'BREAKEVEN' | 'ALL';
  assetClass?: AssetClass | 'ALL';
  session?: MarketSession | 'ALL';
  strategyId?: string | 'ALL';
  status?: TradeStatus | 'ALL';
  tag?: string;
  startDate?: string;
  endDate?: string;
}

export type TradeSortField = 
  | 'entryDate' 
  | 'instrument' 
  | 'direction' 
  | 'netPnL' 
  | 'achievedRMultiple' 
  | 'plannedRiskAmount' 
  | 'holdingTimeSeconds'
  | 'pnlPercentage';

export class TradeService {
  /**
   * Validates trade input against domain and financial integrity constraints
   */
  static validateTrade(data: Partial<Trade>): TradeValidationResult {
    const errors: string[] = [];

    // 1. Account linkage
    if (!data.accountId || data.accountId.trim().length === 0) {
      errors.push('A valid trading account must be selected.');
    }

    // 2. Instrument / Asset
    if (!data.instrument || data.instrument.trim().length === 0) {
      errors.push('Instrument symbol is required (e.g. EURUSD, NQ, BTCUSDT).');
    }

    // 3. Direction
    if (!data.direction || (data.direction !== 'LONG' && data.direction !== 'SHORT')) {
      errors.push('Trade direction must be LONG or SHORT.');
    }

    // 4. Asset Class
    if (!data.assetClass) {
      errors.push('Asset class is required.');
    }

    // 5. Entry Price
    if (data.entryPrice === undefined || data.entryPrice === null || isNaN(Number(data.entryPrice)) || Number(data.entryPrice) <= 0) {
      errors.push('Entry price must be a positive number greater than zero.');
    }

    // 6. Quantity / Volume
    if (data.quantity === undefined || data.quantity === null || isNaN(Number(data.quantity)) || Number(data.quantity) <= 0) {
      errors.push('Quantity / Volume must be greater than zero.');
    }

    // 7. Multiplier
    if (data.contractMultiplier !== undefined && (isNaN(Number(data.contractMultiplier)) || Number(data.contractMultiplier) <= 0)) {
      errors.push('Contract multiplier must be positive.');
    }

    // 8. Stop Loss & Take Profit logic
    if (data.stopLossPrice && Number(data.stopLossPrice) > 0 && data.entryPrice && Number(data.entryPrice) > 0) {
      const ep = Number(data.entryPrice);
      const sl = Number(data.stopLossPrice);
      if (data.direction === 'LONG' && sl >= ep) {
        errors.push('For LONG positions, Stop Loss must be strictly below Entry Price.');
      } else if (data.direction === 'SHORT' && sl <= ep) {
        errors.push('For SHORT positions, Stop Loss must be strictly above Entry Price.');
      }
    }

    if (data.takeProfitPrice && Number(data.takeProfitPrice) > 0 && data.entryPrice && Number(data.entryPrice) > 0) {
      const ep = Number(data.entryPrice);
      const tp = Number(data.takeProfitPrice);
      if (data.direction === 'LONG' && tp <= ep) {
        errors.push('For LONG positions, Take Profit must be strictly above Entry Price.');
      } else if (data.direction === 'SHORT' && tp >= ep) {
        errors.push('For SHORT positions, Take Profit must be strictly below Entry Price.');
      }
    }

    // 9. Dates
    if (!data.entryDate) {
      errors.push('Entry date and time is required.');
    } else {
      const entryTime = new Date(data.entryDate).getTime();
      if (isNaN(entryTime)) {
        errors.push('Invalid entry date format.');
      }
      if (data.exitDate) {
        const exitTime = new Date(data.exitDate).getTime();
        if (isNaN(exitTime)) {
          errors.push('Invalid exit date format.');
        } else if (exitTime < entryTime) {
          errors.push('Exit date/time cannot precede Entry date/time.');
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Delegates trade financial metrics computation directly to CalculationEngine
   */
  static computeTradeFinancials(trade: Partial<Trade>, accountStartingBalance: number = 100000) {
    return CalculationEngine.calculateTradeFinancials(trade, accountStartingBalance);
  }

  /**
   * Comprehensive multi-parameter filtering for trades
   */
  static filterTrades(trades: Trade[], filters: TradeFilters): Trade[] {
    return trades.filter((trade) => {
      // 1. Account Filter
      if (filters.accountId && filters.accountId !== 'ALL' && trade.accountId !== filters.accountId) {
        return false;
      }

      // 2. Direction Filter
      if (filters.direction && filters.direction !== 'ALL' && trade.direction !== filters.direction) {
        return false;
      }

      // 3. Outcome Filter
      if (filters.outcome && filters.outcome !== 'ALL') {
        const outcome = trade.outcome || CalculationEngine.determineTradeOutcome(trade.netPnL, trade.status);
        if (filters.outcome === 'WIN' && outcome !== 'WIN') return false;
        if (filters.outcome === 'LOSS' && outcome !== 'LOSS') return false;
        if (filters.outcome === 'BREAKEVEN' && outcome !== 'BREAKEVEN') return false;
      }

      // 4. Asset Class Filter
      if (filters.assetClass && filters.assetClass !== 'ALL' && trade.assetClass !== filters.assetClass) {
        return false;
      }

      // 5. Session Filter
      if (filters.session && filters.session !== 'ALL' && trade.session !== filters.session) {
        return false;
      }

      // 6. Strategy Filter
      if (filters.strategyId && filters.strategyId !== 'ALL') {
        if (trade.strategyId !== filters.strategyId) return false;
      }

      // 7. Status Filter
      if (filters.status && filters.status !== 'ALL' && trade.status !== filters.status) {
        return false;
      }

      // 8. Tag Filter
      if (filters.tag && filters.tag.trim() !== '') {
        const queryTag = filters.tag.toLowerCase().trim();
        const hasTag = trade.tags?.some((t) => t.toLowerCase() === queryTag);
        const hasConfluence = trade.confluences?.some((c) => c.toLowerCase().includes(queryTag));
        if (!hasTag && !hasConfluence) return false;
      }

      // 9. Date Range
      if (filters.startDate) {
        const tradeTime = new Date(trade.entryDate).getTime();
        const startTime = new Date(filters.startDate).getTime();
        if (!isNaN(tradeTime) && !isNaN(startTime) && tradeTime < startTime) return false;
      }

      if (filters.endDate) {
        const tradeTime = new Date(trade.entryDate).getTime();
        const endTime = new Date(filters.endDate).getTime();
        if (!isNaN(tradeTime) && !isNaN(endTime) && tradeTime > endTime) return false;
      }

      // 10. Search Term (Instrument, Strategy, Setup, Playbook, Notes, Rationales, Confluences)
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        const term = filters.searchTerm.toLowerCase().trim();
        const matchInstrument = trade.instrument.toLowerCase().includes(term);
        const matchStrategy = trade.strategyName?.toLowerCase().includes(term);
        const matchSetup = trade.setupName?.toLowerCase().includes(term);
        const matchPlaybook = trade.playbookName?.toLowerCase().includes(term);
        const matchNotes = trade.notes?.toLowerCase().includes(term);
        const matchEntryRat = trade.entryRationale?.toLowerCase().includes(term);
        const matchExitRat = trade.exitRationale?.toLowerCase().includes(term);
        const matchConfluence = trade.confluences?.some((c) => c.toLowerCase().includes(term));
        const matchTags = trade.tags?.some((t) => t.toLowerCase().includes(term));

        if (
          !matchInstrument &&
          !matchStrategy &&
          !matchSetup &&
          !matchPlaybook &&
          !matchNotes &&
          !matchEntryRat &&
          !matchExitRat &&
          !matchConfluence &&
          !matchTags
        ) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sorts trades by any standard quantitative or chronological metric
   */
  static sortTrades(
    trades: Trade[],
    sortField: TradeSortField = 'entryDate',
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Trade[] {
    return [...trades].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'entryDate':
          comparison = new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
          break;
        case 'instrument':
          comparison = a.instrument.localeCompare(b.instrument);
          break;
        case 'direction':
          comparison = a.direction.localeCompare(b.direction);
          break;
        case 'netPnL':
          comparison = a.netPnL - b.netPnL;
          break;
        case 'achievedRMultiple':
          comparison = (a.achievedRMultiple ?? -999) - (b.achievedRMultiple ?? -999);
          break;
        case 'plannedRiskAmount':
          comparison = a.plannedRiskAmount - b.plannedRiskAmount;
          break;
        case 'holdingTimeSeconds':
          comparison = (a.holdingTimeSeconds ?? 0) - (b.holdingTimeSeconds ?? 0);
          break;
        case 'pnlPercentage':
          comparison = a.pnlPercentage - b.pnlPercentage;
          break;
        default:
          comparison = 0;
      }

      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }
}
