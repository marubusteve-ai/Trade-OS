/**
 * Repository for Prop Firms, Rule Sets, and Challenges
 * 
 * Provides local database persistence, template initialization, and custom rule editing.
 */

import { LocalDatabase } from './localDatabase';
import { PropFirm, RuleSet, Challenge, PropFirmRule, ScalingMilestone } from '../types/propFirm';

export class PropFirmRepository {
  private collectionFirms = 'prop_firms';
  private collectionRuleSets = 'rule_sets';

  /**
   * Get all prop firms for user (with defaults initialized if empty)
   */
  getFirms(userId: string): PropFirm[] {
    let firms = LocalDatabase.getItems<PropFirm>(userId, this.collectionFirms);
    if (!firms || firms.length === 0) {
      firms = this.getDefaultPropFirms(userId);
      LocalDatabase.saveItems(userId, this.collectionFirms, firms);
    }
    return firms;
  }

  /**
   * Get firm by ID
   */
  getFirmById(userId: string, id: string): PropFirm | null {
    const firms = this.getFirms(userId);
    return firms.find(f => f.id === id) || null;
  }

  /**
   * Save / Insert a Prop Firm
   */
  saveFirm(userId: string, firm: PropFirm): PropFirm {
    return LocalDatabase.insertItem<PropFirm>(userId, this.collectionFirms, firm);
  }

  /**
   * Update a Prop Firm
   */
  updateFirm(userId: string, id: string, updates: Partial<PropFirm>): PropFirm {
    return LocalDatabase.updateItem<PropFirm>(userId, this.collectionFirms, id, updates);
  }

  /**
   * Delete a Prop Firm
   */
  deleteFirm(userId: string, id: string): boolean {
    return LocalDatabase.deleteItem(userId, this.collectionFirms, id);
  }

  /**
   * Get all Rule Sets for user
   */
  getRuleSets(userId: string): RuleSet[] {
    let sets = LocalDatabase.getItems<RuleSet>(userId, this.collectionRuleSets);
    if (!sets || sets.length === 0) {
      sets = this.getDefaultRuleSets(userId);
      LocalDatabase.saveItems(userId, this.collectionRuleSets, sets);
    }
    return sets;
  }

  /**
   * Get Rule Set by ID
   */
  getRuleSetById(userId: string, id: string): RuleSet | null {
    const sets = this.getRuleSets(userId);
    return sets.find(s => s.id === id) || null;
  }

  /**
   * Save / Insert Rule Set
   */
  saveRuleSet(userId: string, ruleSet: RuleSet): RuleSet {
    return LocalDatabase.insertItem<RuleSet>(userId, this.collectionRuleSets, ruleSet);
  }

  /**
   * Update Rule Set
   */
  updateRuleSet(userId: string, id: string, updates: Partial<RuleSet>): RuleSet {
    return LocalDatabase.updateItem<RuleSet>(userId, this.collectionRuleSets, id, updates);
  }

  /**
   * Delete Rule Set
   */
  deleteRuleSet(userId: string, id: string): boolean {
    return LocalDatabase.deleteItem(userId, this.collectionRuleSets, id);
  }

  /**
   * Reset to institutional default presets
   */
  resetToDefaults(userId: string): { firms: PropFirm[]; ruleSets: RuleSet[] } {
    const defaultFirms = this.getDefaultPropFirms(userId);
    const defaultRuleSets = this.getDefaultRuleSets(userId);
    LocalDatabase.saveItems(userId, this.collectionFirms, defaultFirms);
    LocalDatabase.saveItems(userId, this.collectionRuleSets, defaultRuleSets);
    return { firms: defaultFirms, ruleSets: defaultRuleSets };
  }

  // =========================================================================
  // Institutional Presets & Factory Defaults
  // =========================================================================

  getDefaultRuleSets(userId: string): RuleSet[] {
    const now = new Date().toISOString();

    const ftmoPhase1Rules: PropFirmRule[] = [
      {
        id: 'rule_ftmo_p1_target',
        type: 'PROFIT_TARGET',
        name: 'Profit Target (10%)',
        description: 'Reach a 10% net profit target on the starting balance.',
        category: 'OBJECTIVE',
        threshold: 10,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
        sourceMetadata: { docUrl: 'https://ftmo.com/en/trading-objectives/', clauseNumber: 'Obj-1' },
      },
      {
        id: 'rule_ftmo_p1_daily_loss',
        type: 'DAILY_LOSS',
        name: 'Maximum Daily Loss (5%)',
        description: 'Total daily loss based on starting balance of that day cannot exceed 5%.',
        category: 'DRAWDOWN',
        threshold: 5,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
        sourceMetadata: { docUrl: 'https://ftmo.com/en/trading-objectives/', clauseNumber: 'Obj-2' },
      },
      {
        id: 'rule_ftmo_p1_max_loss',
        type: 'MAX_DRAWDOWN',
        name: 'Maximum Overall Loss (10%)',
        description: 'Account equity cannot drop below 90% of the initial account balance at any point.',
        category: 'DRAWDOWN',
        threshold: 10,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
        sourceMetadata: { docUrl: 'https://ftmo.com/en/trading-objectives/', clauseNumber: 'Obj-3' },
      },
      {
        id: 'rule_ftmo_p1_min_days',
        type: 'MIN_TRADING_DAYS',
        name: 'Minimum Trading Days (4 Days)',
        description: 'Trade on at least 4 individual calendar trading days.',
        category: 'OBJECTIVE',
        threshold: 4,
        unit: 'DAYS',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 50,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_p1_weekend',
        type: 'WEEKEND_RESTRICTION',
        name: 'Weekend Holding (Swing Mode Allowed)',
        description: 'Holding positions over the weekend is allowed on Swing accounts.',
        category: 'TRADING_STYLE',
        threshold: true,
        unit: 'BOOLEAN',
        calculationMethod: 'BOOLEAN_FLAG',
        warningThreshold: 100,
        violationThreshold: 100,
        severity: 'SOFT_BREACH',
        isEnabled: false,
        version: 'v2026.1',
      },
    ];

    const ftmoPhase2Rules: PropFirmRule[] = [
      {
        id: 'rule_ftmo_p2_target',
        type: 'PROFIT_TARGET',
        name: 'Profit Target (5%)',
        description: 'Reach a 5% net profit target on the starting balance.',
        category: 'OBJECTIVE',
        threshold: 5,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_p2_daily_loss',
        type: 'DAILY_LOSS',
        name: 'Maximum Daily Loss (5%)',
        description: 'Daily loss cannot exceed 5% of starting equity.',
        category: 'DRAWDOWN',
        threshold: 5,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_p2_max_loss',
        type: 'MAX_DRAWDOWN',
        name: 'Maximum Overall Loss (10%)',
        description: 'Overall loss cannot exceed 10% of starting balance.',
        category: 'DRAWDOWN',
        threshold: 10,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_p2_min_days',
        type: 'MIN_TRADING_DAYS',
        name: 'Minimum Trading Days (4 Days)',
        description: 'Minimum 4 active trading days required.',
        category: 'OBJECTIVE',
        threshold: 4,
        unit: 'DAYS',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 50,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
    ];

    const ftmoFundedRules: PropFirmRule[] = [
      {
        id: 'rule_ftmo_fn_daily_loss',
        type: 'DAILY_LOSS',
        name: 'Maximum Daily Loss (5%)',
        description: 'Daily loss cannot exceed 5% of starting equity.',
        category: 'DRAWDOWN',
        threshold: 5,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_fn_max_loss',
        type: 'MAX_DRAWDOWN',
        name: 'Maximum Overall Loss (10%)',
        description: 'Account balance cannot drop 10% below initial balance.',
        category: 'DRAWDOWN',
        threshold: 10,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_fn_scaling',
        type: 'SCALING_RULE',
        name: 'Capital Scaling Plan (+25% every 4 months)',
        description: 'Generate 10% net profit over 4 consecutive months with min 2 payouts to receive a 25% balance increase.',
        category: 'PAYOUT_SCALING',
        threshold: 10,
        unit: 'PERCENT_BALANCE',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_ftmo_fn_payout',
        type: 'PAYOUT_RULE',
        name: 'Profit Split & Payout (80%-90%)',
        description: 'Default 80% profit split, escalates to 90% upon successful scaling milestone.',
        category: 'PAYOUT_SCALING',
        threshold: 80,
        unit: 'PERCENT_OF_PROFIT',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 100,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
    ];

    const apexFuturesRules: PropFirmRule[] = [
      {
        id: 'rule_apex_target',
        type: 'PROFIT_TARGET',
        name: 'Profit Target ($3,000 on 50k)',
        description: 'Achieve $3,000 profit for 50k account.',
        category: 'OBJECTIVE',
        threshold: 3000,
        unit: 'CURRENCY',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_apex_trailing_dd',
        type: 'TRAILING_DRAWDOWN',
        name: 'Intraday Trailing Threshold ($2,500)',
        description: 'Trailing drawdown calculated intraday from highest unrealized equity peak until starting balance + $100.',
        category: 'DRAWDOWN',
        threshold: 2500,
        unit: 'CURRENCY',
        calculationMethod: 'TRAILING_HIGH_WATER_MARK',
        warningThreshold: 75,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_apex_contracts',
        type: 'POSITION_SIZE_RESTRICTION',
        name: 'Max Contracts Limit (10 Contracts)',
        description: 'Maximum 10 full contracts (or 100 micro contracts) open at any time.',
        category: 'RISK_MANAGEMENT',
        threshold: 10,
        unit: 'CONTRACTS',
        calculationMethod: 'MAX_LOTS_TOTAL',
        warningThreshold: 90,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_apex_min_days',
        type: 'MIN_TRADING_DAYS',
        name: 'Minimum Trading Days (7 Days)',
        description: 'Trade a minimum of 7 distinct days before qualifying.',
        category: 'OBJECTIVE',
        threshold: 7,
        unit: 'DAYS',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 50,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_apex_consistency',
        type: 'CONSISTENCY_RULE',
        name: 'Consistency Rule (Max 30% on Single Day for Payouts)',
        description: 'No single trading day can account for more than 30% of total generated profit.',
        category: 'TRADING_STYLE',
        threshold: 30,
        unit: 'PERCENT_OF_PROFIT',
        calculationMethod: 'MAX_DAILY_PROFIT_RATIO',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'WARNING_ONLY',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_apex_overnight',
        type: 'OVERNIGHT_RESTRICTION',
        name: 'No Overnight Positions',
        description: 'All positions must be flattened by 4:59 PM ET daily market close.',
        category: 'TRADING_STYLE',
        threshold: true,
        unit: 'BOOLEAN',
        calculationMethod: 'BOOLEAN_FLAG',
        warningThreshold: 100,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
    ];

    const topstepRules: PropFirmRule[] = [
      {
        id: 'rule_topstep_target',
        type: 'PROFIT_TARGET',
        name: 'Trading Combine Profit Target ($3,000 on 50k)',
        description: 'Target $3,000 profit to earn funded express.',
        category: 'OBJECTIVE',
        threshold: 3000,
        unit: 'CURRENCY',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_topstep_daily_loss',
        type: 'DAILY_LOSS',
        name: 'Daily Loss Limit ($1,000 on 50k)',
        description: 'Net loss in a single trading session cannot hit or exceed $1,000.',
        category: 'DRAWDOWN',
        threshold: 1000,
        unit: 'CURRENCY',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 75,
        violationThreshold: 100,
        severity: 'SOFT_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_topstep_max_loss',
        type: 'MAX_DRAWDOWN',
        name: 'Maximum Loss Limit ($2,000 EOD Trailing)',
        description: 'Trailing Maximum Loss trails end-of-day balance until initial starting balance.',
        category: 'DRAWDOWN',
        threshold: 2000,
        unit: 'CURRENCY',
        calculationMethod: 'TRAILING_EOD',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'HARD_BREACH',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_topstep_consistency',
        type: 'CONSISTENCY_RULE',
        name: '50% Consistency Target',
        description: 'Best trading day should not exceed 50% of the total cumulative profit.',
        category: 'TRADING_STYLE',
        threshold: 50,
        unit: 'PERCENT_OF_PROFIT',
        calculationMethod: 'MAX_DAILY_PROFIT_RATIO',
        warningThreshold: 80,
        violationThreshold: 100,
        severity: 'WARNING_ONLY',
        isEnabled: true,
        version: 'v2026.1',
      },
      {
        id: 'rule_topstep_min_days',
        type: 'MIN_TRADING_DAYS',
        name: 'Minimum Trading Days (2 Days)',
        description: 'Must log at least 2 distinct trading days.',
        category: 'OBJECTIVE',
        threshold: 2,
        unit: 'DAYS',
        calculationMethod: 'STATIC_BALANCE',
        warningThreshold: 50,
        violationThreshold: 100,
        severity: 'INFO',
        isEnabled: true,
        version: 'v2026.1',
      },
    ];

    return [
      {
        id: 'ruleset_ftmo_p1',
        userId,
        name: 'FTMO Standard - Phase 1 (Evaluation)',
        description: '10% Target, 5% Daily Loss, 10% Max Drawdown, Min 4 Trading Days.',
        version: 'v2026.1',
        isTemplate: true,
        rules: ftmoPhase1Rules,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ruleset_ftmo_p2',
        userId,
        name: 'FTMO Standard - Phase 2 (Verification)',
        description: '5% Target, 5% Daily Loss, 10% Max Drawdown, Min 4 Trading Days.',
        version: 'v2026.1',
        isTemplate: true,
        rules: ftmoPhase2Rules,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ruleset_ftmo_funded',
        userId,
        name: 'FTMO Standard - Funded Stage (Live Trader)',
        description: '5% Daily Loss, 10% Max Drawdown, 80-90% Profit Split, +25% 4-Month Scaling.',
        version: 'v2026.1',
        isTemplate: true,
        rules: ftmoFundedRules,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ruleset_apex_50k',
        userId,
        name: 'Apex Trader Funding - 50k Full Evaluation',
        description: '$3,000 Target, $2,500 Intraday Trailing Threshold, 10 Max Contracts, Min 7 Days, 30% Consistency.',
        version: 'v2026.1',
        isTemplate: true,
        rules: apexFuturesRules,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ruleset_topstep_50k',
        userId,
        name: 'Topstep Trading Combine - 50k Futures',
        description: '$3,000 Target, $1,000 Daily Loss Limit, $2,000 EOD Trailing Max Loss, 50% Consistency.',
        version: 'v2026.1',
        isTemplate: true,
        rules: topstepRules,
        createdAt: now,
        updatedAt: now,
      },
    ];
  }

  getDefaultPropFirms(userId: string): PropFirm[] {
    const now = new Date().toISOString();

    const ftmoScalingPlan: ScalingMilestone[] = [
      {
        level: 1,
        profitTargetPercent: 10,
        newBalanceMultiplier: 1.25,
        newBalance: 125000,
        newProfitSplitPercent: 90,
        isAchieved: false,
        notes: 'First milestone: +25% capital allocation and 90% payout split.',
      },
      {
        level: 2,
        profitTargetPercent: 10,
        newBalanceMultiplier: 1.5,
        newBalance: 156250,
        newProfitSplitPercent: 90,
        isAchieved: false,
        notes: 'Second milestone: Scale to $156k.',
      },
      {
        level: 3,
        profitTargetPercent: 10,
        newBalanceMultiplier: 2.0,
        newBalance: 200000,
        newProfitSplitPercent: 90,
        isAchieved: false,
        notes: 'Institutional allocation tier ($200k max capital allocation).',
      },
    ];

    const ftmoFirm: PropFirm = {
      id: 'firm_ftmo',
      userId,
      name: 'FTMO',
      website: 'https://ftmo.com',
      description: 'Leading Forex & CFD prop trading firm with 2-step evaluations and institutional scaling.',
      supportedPlatforms: ['MetaTrader 4', 'MetaTrader 5', 'cTrader', 'DXtrade'],
      assetClasses: ['FOREX', 'INDICES', 'COMMODITIES', 'CRYPTO', 'EQUITIES'],
      payoutSpeedDays: 14,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      challenges: [
        {
          id: 'chal_ftmo_100k_2step',
          firmId: 'firm_ftmo',
          name: 'FTMO 100k Standard 2-Step',
          initialBalance: 100000,
          currency: 'USD',
          challengeType: 'TWO_STEP',
          createdAt: now,
          updatedAt: now,
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1 - FTMO Challenge',
              ruleSetId: 'ruleset_ftmo_p1',
              targetProfitPercent: 10,
              maxDailyLossPercent: 5,
              maxTotalLossPercent: 10,
              minTradingDays: 4,
              isFundedStage: false,
            },
            {
              phaseNumber: 2,
              name: 'Phase 2 - Verification',
              ruleSetId: 'ruleset_ftmo_p2',
              targetProfitPercent: 5,
              maxDailyLossPercent: 5,
              maxTotalLossPercent: 10,
              minTradingDays: 4,
              isFundedStage: false,
            },
            {
              phaseNumber: 3,
              name: 'Phase 3 - FTMO Trader (Funded)',
              ruleSetId: 'ruleset_ftmo_funded',
              maxDailyLossPercent: 5,
              maxTotalLossPercent: 10,
              profitSplitPercent: 80,
              isFundedStage: true,
              scalingPlan: ftmoScalingPlan,
              payoutTerms: {
                minProfitBufferAmount: 0,
                minTradingDaysBeforeFirstPayout: 14,
                minDaysBetweenPayouts: 14,
                defaultProfitSplitPercent: 80,
                consistencyCheckRequired: false,
              },
            },
          ],
        },
      ],
    };

    const apexFirm: PropFirm = {
      id: 'firm_apex',
      userId,
      name: 'Apex Trader Funding',
      website: 'https://apextraderfunding.com',
      description: 'Futures prop firm with 1-step evaluations, trailing threshold intraday, and 100% first $25k profit split.',
      supportedPlatforms: ['NinjaTrader', 'Rithmic', 'Tradovate', 'Quantower'],
      assetClasses: ['FUTURES'],
      payoutSpeedDays: 14,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      challenges: [
        {
          id: 'chal_apex_50k_eval',
          firmId: 'firm_apex',
          name: 'Apex 50k Full Evaluation',
          initialBalance: 50000,
          currency: 'USD',
          challengeType: 'ONE_STEP',
          createdAt: now,
          updatedAt: now,
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1 - Evaluation',
              ruleSetId: 'ruleset_apex_50k',
              targetProfitPercent: 6,
              minTradingDays: 7,
              isFundedStage: false,
            },
            {
              phaseNumber: 2,
              name: 'Phase 2 - PA (Funded Performance Account)',
              ruleSetId: 'ruleset_apex_50k',
              profitSplitPercent: 90,
              isFundedStage: true,
              payoutTerms: {
                minProfitBufferAmount: 2600, // Safety threshold $52,600
                minTradingDaysBeforeFirstPayout: 10,
                minDaysBetweenPayouts: 14,
                defaultProfitSplitPercent: 90,
                maxPayoutCapAmount: 2000,
                consistencyCheckRequired: true,
              },
            },
          ],
        },
      ],
    };

    const topstepFirm: PropFirm = {
      id: 'firm_topstep',
      userId,
      name: 'Topstep',
      website: 'https://topstep.com',
      description: 'Futures Trading Combine with daily loss limit, EOD trailing max loss, and Express Funded accounts.',
      supportedPlatforms: ['TopstepX', 'NinjaTrader', 'Tradovate', 'TradingView'],
      assetClasses: ['FUTURES'],
      payoutSpeedDays: 5,
      isCustom: false,
      createdAt: now,
      updatedAt: now,
      challenges: [
        {
          id: 'chal_topstep_50k_combine',
          firmId: 'firm_topstep',
          name: 'Topstep 50k Trading Combine',
          initialBalance: 50000,
          currency: 'USD',
          challengeType: 'ONE_STEP',
          createdAt: now,
          updatedAt: now,
          phases: [
            {
              phaseNumber: 1,
              name: 'Trading Combine (Evaluation)',
              ruleSetId: 'ruleset_topstep_50k',
              targetProfitPercent: 6,
              minTradingDays: 2,
              isFundedStage: false,
            },
            {
              phaseNumber: 2,
              name: 'Express Funded Account',
              ruleSetId: 'ruleset_topstep_50k',
              profitSplitPercent: 90,
              isFundedStage: true,
              payoutTerms: {
                minProfitBufferAmount: 2000,
                minTradingDaysBeforeFirstPayout: 5,
                minDaysBetweenPayouts: 5,
                defaultProfitSplitPercent: 90,
                consistencyCheckRequired: true,
              },
            },
          ],
        },
      ],
    };

    return [ftmoFirm, apexFirm, topstepFirm];
  }
}
