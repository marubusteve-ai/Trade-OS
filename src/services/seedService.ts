/**
 * Seed Service for Demo Mode & Initial System Initialization
 * Generates realistic quantitative accounts, strategies, and trades.
 */

import { Account, Trade, Strategy, Playbook, Setup, Workspace, UserProfile } from '../types/domain';
import { CalculationEngine } from './calculationEngine';
import { TradeScoringEngine } from './tradeScoringEngine';
import { LocalDatabase } from '../repositories/localDatabase';

export class SeedService {
  static seedInitialData(userId: string): {
    workspace: Workspace;
    accounts: Account[];
    strategies: Strategy[];
    playbooks: Playbook[];
    setups: Setup[];
    trades: Trade[];
  } {
    const now = new Date();
    const wsId = 'ws_primary_' + userId.slice(0, 6);
    
    // 1. Workspace
    const workspace: Workspace = {
      id: wsId,
      userId,
      name: 'Alpha Quant Trading Desk',
      description: 'Primary active multi-asset trading workspace',
      isDefault: true,
      createdAt: new Date(now.getTime() - 60 * 86400000).toISOString(),
      updatedAt: now.toISOString(),
    };
    LocalDatabase.insertItem(userId, 'workspaces', workspace);

    // 2. User Profile
    const profile: UserProfile = {
      userId,
      defaultCurrency: 'USD',
      defaultTimezone: 'America/New_York',
      riskTolerancePercent: 1.0,
      experienceLevel: 'PRO',
      themePreference: 'dark',
      enableSoundEffects: true,
      activeWorkspaceId: wsId,
    };
    LocalDatabase.insertItem(userId, 'profile', { id: userId, ...profile });

    // 3. Strategies
    const strategies: Strategy[] = [
      {
        id: 'strat_ict_fvg',
        userId,
        workspaceId: wsId,
        name: 'ICT / SMC Liquidity & FVG',
        description: 'New York Open liquidity sweep into 15m Fair Value Gap with 1m market structure shift confirmation.',
        assetClasses: ['INDICES', 'FOREX', 'COMMODITIES'],
        instruments: ['NQ', 'ES', 'EURUSD', 'XAUUSD'],
        timeframes: ['15m', '5m', '1m'],
        sessions: ['NEW_YORK', 'LONDON'],
        marketConditions: ['TRENDING_UP', 'TRENDING_DOWN', 'EXPANSION'],
        rules: [
          'Wait for 9:30 AM NY Open sweep before engaging',
          'Confirm MSS with displacement on 1m chart',
          'Risk strictly 1% per trade with predefined hard stop loss',
          'Target 1:2.5 minimum planned Reward to Risk',
        ],
        checklist: [
          'Asian/London high/low swept',
          'Displacement candle creates clear FVG',
          'OB / Key institutional level confluence',
          'No high impact red news in next 15m',
        ],
        checklists: [
          { id: 'c1', label: 'Asian/London High or Low Swept', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'c2', label: '1m Market Structure Shift with Displacement', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'c3', label: 'Clean 5m or 15m Fair Value Gap created', category: 'CONFIRMATION', isRequired: true, weight: 2 },
          { id: 'c4', label: 'Risk <= 1.0% with Hard Stop Loss', category: 'RULE', isRequired: true, weight: 4 },
          { id: 'c5', label: 'Key HTF Order Block Confluence', category: 'CONFLUENCE', isRequired: false, weight: 2 },
        ],
        targetWinRate: 62,
        targetRiskRewardRatio: 2.5,
        colorHex: '#10b981',
        status: 'ACTIVE',
        isArchived: false,
        createdAt: new Date(now.getTime() - 45 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'strat_trend_pullback',
        userId,
        workspaceId: wsId,
        name: 'Volume Profile & VWAP Pullback',
        description: 'Trend continuation following value area breakouts and VWAP mean-reversion retests.',
        assetClasses: ['INDICES', 'CRYPTO', 'EQUITIES'],
        instruments: ['BTCUSDT', 'ETHUSDT', 'NAS100', 'NVDA'],
        timeframes: ['1h', '15m', '5m'],
        sessions: ['NEW_YORK', 'OFF_HOURS'],
        marketConditions: ['TRENDING_UP', 'TRENDING_DOWN'],
        rules: [
          'Identify daily trend bias using 4H/Daily EMAs',
          'Enter on Session VWAP or POC retest',
          'Stop placed beyond local swing high/low',
          'Trail stop to break-even after 1.5R achieved',
        ],
        checklist: [
          'Clear higher timeframe trend structure',
          'Volume delta confirms buyer/seller initiative',
          'Risk within daily loss limit constraints',
        ],
        checklists: [
          { id: 'tp1', label: 'Higher Timeframe Trend Direction Match', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'tp2', label: 'VWAP or Point of Control (POC) Tagged', category: 'CONFIRMATION', isRequired: true, weight: 2 },
          { id: 'tp3', label: 'Delta Volume Expansion Confirmation', category: 'CONFLUENCE', isRequired: false, weight: 2 },
          { id: 'tp4', label: 'Hard Stop Placed at Swing Extremum', category: 'RULE', isRequired: true, weight: 3 },
        ],
        targetWinRate: 55,
        targetRiskRewardRatio: 2.0,
        colorHex: '#3b82f6',
        status: 'ACTIVE',
        isArchived: false,
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'strat_range_reversal',
        userId,
        workspaceId: wsId,
        name: 'Asian Range Fade & Deviation',
        description: 'Mean reversion fade after Asian session range deviation and failure to hold higher/lower prices.',
        assetClasses: ['FOREX', 'INDICES'],
        instruments: ['EURUSD', 'GBPUSD', 'AUDUSD'],
        timeframes: ['15m', '5m'],
        sessions: ['LONDON', 'NEW_YORK'],
        marketConditions: ['RANGING'],
        rules: [
          'Identify Asian Range High & Low (00:00 - 06:00 UTC)',
          'Wait for London session to sweep range by 10-25 pips',
          'Look for immediate candle rejection and close back inside range',
          'Target opposite Asian range boundary',
        ],
        checklist: [
          'Asian range between 20-40 pips total width',
          'Clear liquidity grab above/below boundary',
          'RSI divergence on 5m chart',
        ],
        targetWinRate: 65,
        targetRiskRewardRatio: 1.8,
        colorHex: '#8b5cf6',
        status: 'ACTIVE',
        isArchived: false,
        createdAt: new Date(now.getTime() - 30 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      }
    ];
    strategies.forEach(s => LocalDatabase.insertItem(userId, 'strategies', s));

    // 4. Setups
    const setups: Setup[] = [
      {
        id: 'setup_silver_bullet',
        userId,
        workspaceId: wsId,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        name: 'NY 10 AM Silver Bullet',
        description: 'Specific 10:00 AM - 11:00 AM NY time window setup hunting liquidity sweeps into 1m/5m FVG.',
        requiredConfirmations: ['10:00 - 11:00 AM Execution Window', 'Liquidity Sweep', 'Displacement FVG', '1m MSS'],
        idealMarketCondition: 'EXPANSION',
        timeframe: '5m',
        winRateTarget: 68,
        riskRewardTarget: 2.5,
        tags: ['Silver Bullet', 'NY AM', 'High Probability'],
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'setup_vwap_bounce',
        userId,
        workspaceId: wsId,
        strategyId: 'strat_trend_pullback',
        strategyName: 'Volume Profile & VWAP Pullback',
        name: 'First VWAP Pullback',
        description: 'First pullback to daily session VWAP after morning impulse breakout.',
        requiredConfirmations: ['Morning Trend Established', 'First Touch of VWAP', 'Rejection Wick Formation'],
        idealMarketCondition: 'TRENDING_UP',
        timeframe: '15m',
        winRateTarget: 58,
        riskRewardTarget: 2.0,
        tags: ['VWAP', 'Trend Following'],
        createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      }
    ];
    setups.forEach(s => LocalDatabase.insertItem(userId, 'setups', s));

    // 5. Playbooks
    const playbooks: Playbook[] = [
      {
        id: 'pb_silver_bullet_nq',
        userId,
        workspaceId: wsId,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        setupId: 'setup_silver_bullet',
        setupName: 'NY 10 AM Silver Bullet',
        title: 'ICT Silver Bullet 10:00 AM Execution Blueprint',
        description: 'Systematic execution playbook for NQ/ES morning liquidity run and algorithmic delivery.',
        thesis: 'Between 10:00 AM and 11:00 AM EST, the market delivers price to opposing liquidity pools. Entering upon the first 1m FVG following a high/low sweep yields asymmetric risk to reward.',
        entryModel: {
          type: 'LIMIT_RETEST',
          triggers: [
            'Sweep of Previous Session High/Low or Initial Balance',
            'Sharp 1m displacement candle leaving FVG imbalance',
            'Limit order placed at the premium/discount threshold of the FVG',
          ],
          optimalEntryZone: 'Upper 50% (Consequent Encroachment) of Fair Value Gap',
          timeframes: ['1m', '5m'],
        },
        exitModel: {
          stopLossRule: 'Strictly 2 ticks above the displacement candle swing high/low',
          takeProfitRule: 'Opposite session liquidity pool or static 2.5R multiple',
          trailingRule: 'Move stop to breakeven once 1.5R is reached and 1m market structure forms a new swing point',
          timeStopRule: 'Close all open positions by 11:15 AM EST if target has not reached',
        },
        confirmationChecklist: [
          { id: 'pb_c1', label: 'Time is strictly between 10:00 AM and 11:00 AM EST', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'pb_c2', label: 'Prior session high/low or key swing liquidity swept', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'pb_c3', label: 'Clear 1m Market Structure Shift with energetic displacement', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'pb_c4', label: 'Well-defined Fair Value Gap formed inside displacement leg', category: 'CONFIRMATION', isRequired: true, weight: 2 },
        ],
        ruleChecklist: [
          { id: 'pb_r1', label: 'Risk strictly <= 1.0% of account equity', category: 'RULE', isRequired: true, weight: 4 },
          { id: 'pb_r2', label: 'Hard Stop Loss entered directly on order submission', category: 'RULE', isRequired: true, weight: 4 },
          { id: 'pb_r3', label: 'No entry if high-impact FOMC / CPI release in next 10 minutes', category: 'RULE', isRequired: true, weight: 3 },
          { id: 'pb_r4', label: 'Never average down into a losing position', category: 'RULE', isRequired: true, weight: 4 },
        ],
        confluenceChecklist: [
          { id: 'pb_cf1', label: '15m Higher Timeframe Order Block confluence', category: 'CONFLUENCE', isRequired: false, weight: 2 },
          { id: 'pb_cf2', label: 'SMT Divergence against ES / YM correlated index', category: 'CONFLUENCE', isRequired: false, weight: 2 },
          { id: 'pb_cf3', label: 'Trading in direction of Daily Institutional Bias', category: 'CONFLUENCE', isRequired: false, weight: 1 },
        ],
        invalidationRules: [
          'Candle closes fully beyond the origin of the displacement leg',
          'Price takes more than 15 minutes to reach the FVG without taking liquidity',
          'Opposing high-volume news event triggers unexpected volatility spike',
        ],
        managementRules: [
          'Do not touch stop loss until price moves at least 1.5R into profit',
          'Take 50% partial profit at internal liquidity target (1.5R - 2.0R)',
          'Let runner target opposing external draw on liquidity',
        ],
        noTradeConditions: [
          'Bank Holidays (US Federal Holidays)',
          'Within 15 minutes before or after FOMC Rate Decision / Non-Farm Payrolls',
          'Daily Drawdown exceeding 3% on current trading account',
        ],
        exampleScreenshots: [],
        notes: 'Best performed on NQ Futures or EURUSD. Focus on clean displacement wicks and energetic reaction candles.',
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 40 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'pb_vwap_trend_master',
        userId,
        workspaceId: wsId,
        strategyId: 'strat_trend_pullback',
        strategyName: 'Volume Profile & VWAP Pullback',
        setupId: 'setup_vwap_bounce',
        setupName: 'First VWAP Pullback',
        title: 'Session VWAP Institutional Pullback System',
        description: 'Systematic mean-reversion continuation along institutional volume benchmarks.',
        thesis: 'Strong trend days test VWAP and Point of Control during mid-day consolidation, providing institutional re-entry points at high value prices.',
        entryModel: {
          type: 'CONFIRMATION_CLOSE',
          triggers: [
            'Price pulls back to Session VWAP or POC line',
            '5m reversal candle forms with strong rejection shadow',
            'Entry on candle close confirming continuation direction',
          ],
          optimalEntryZone: 'VWAP +/- 1 Standard Deviation Band',
          timeframes: ['5m', '15m'],
        },
        exitModel: {
          stopLossRule: 'Beyond the opposite side of VWAP plus 1.5x ATR buffer',
          takeProfitRule: 'Prior swing high / Value Area High (VAH) or 2.0R',
          trailingRule: 'Trail behind 15m candle lows once 1.0R achieved',
        },
        confirmationChecklist: [
          { id: 'vp_c1', label: 'Clear higher timeframe directional trend established', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'vp_c2', label: 'Price test of Session VWAP or POC', category: 'CONFIRMATION', isRequired: true, weight: 3 },
          { id: 'vp_c3', label: 'Rejection candle confirms buyers/sellers stepping in', category: 'CONFIRMATION', isRequired: true, weight: 2 },
        ],
        ruleChecklist: [
          { id: 'vp_r1', label: 'Max 1.0% account risk with hard stop loss', category: 'RULE', isRequired: true, weight: 4 },
          { id: 'vp_r2', label: 'Minimum 1:1.5 planned reward to risk', category: 'RULE', isRequired: true, weight: 3 },
        ],
        confluenceChecklist: [
          { id: 'vp_cf1', label: 'Cumulative Volume Delta (CVD) divergence confirmation', category: 'CONFLUENCE', isRequired: false, weight: 2 },
          { id: 'vp_cf2', label: 'Confluence with Prior Day Value Area High/Low', category: 'CONFLUENCE', isRequired: false, weight: 2 },
        ],
        invalidationRules: [
          'Full 15m candle close cleanly through VWAP against trade direction',
          'Breakdown of Higher Timeframe trend structure',
        ],
        managementRules: [
          'Scale 50% at prior swing high',
          'Trail stop loss aggressively behind 5m higher lows',
        ],
        noTradeConditions: [
          'Choppy sideways markets where VWAP is flat',
          'Late afternoon session after 15:30 EST',
        ],
        exampleScreenshots: [],
        notes: 'Highly effective on BTC and index futures during clear directional trending days.',
        status: 'ACTIVE',
        createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      }
    ];
    playbooks.forEach(p => LocalDatabase.insertItem(userId, 'playbooks', p));

    // 6. Accounts
    const accounts: Account[] = [
      {
        id: 'acc_ftmo_100k',
        userId,
        workspaceId: wsId,
        name: 'FTMO $100K Evaluation',
        accountNumber: 'FTMO-884920',
        accountType: 'PROP_EVALUATION',
        broker: 'FTMO',
        propFirm: 'FTMO',
        platform: 'MT5 / TradeLocker',
        currency: 'USD',
        timezone: 'America/New_York',
        startingBalance: 100000,
        currentBalance: 106420,
        equity: 106420,
        highWaterMark: 106850,
        status: 'ACTIVE',
        challengePhase: 1,
        profitTarget: 10000, // 10% target ($10,000)
        dailyLossLimit: 5000, // 5% daily ($5,000)
        maximumLoss: 10000, // 10% max total loss ($10,000)
        trailingDrawdown: 10000,
        minimumTradingDays: 4,
        currentTradingDays: 6,
        maxRiskPerTradePercent: 1.0,
        isArchived: false,
        isFavorite: true,
        notes: 'Target $110,000 for Phase 1 pass. Currently +$6,420 (64.2% completed). Keep discipline on NY open.',
        createdAt: new Date(now.getTime() - 20 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'acc_funded_50k',
        userId,
        workspaceId: wsId,
        name: 'FundedNext $50K Master',
        accountNumber: 'FN-302194',
        accountType: 'PROP_FUNDED',
        broker: 'FundedNext',
        propFirm: 'FundedNext',
        platform: 'cTrader',
        currency: 'USD',
        timezone: 'America/New_York',
        startingBalance: 50000,
        currentBalance: 53180,
        equity: 53180,
        highWaterMark: 53400,
        status: 'ACTIVE',
        challengePhase: 3,
        dailyLossLimit: 2500, // 5%
        maximumLoss: 5000, // 10%
        trailingDrawdown: 5000,
        maxRiskPerTradePercent: 0.75,
        isArchived: false,
        isFavorite: true,
        notes: 'Live Funded Master Account. Next payout eligibility in 12 days. Max risk 0.75% per setup.',
        createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      },
      {
        id: 'acc_personal_live',
        userId,
        workspaceId: wsId,
        name: 'Interactive Brokers Main',
        accountNumber: 'U7839482',
        accountType: 'PERSONAL_LIVE',
        broker: 'Interactive Brokers',
        platform: 'TWS / TradingView',
        currency: 'USD',
        timezone: 'America/New_York',
        startingBalance: 25000,
        currentBalance: 28450,
        equity: 28450,
        highWaterMark: 28900,
        status: 'ACTIVE',
        maxRiskPerTradePercent: 1.5,
        isArchived: false,
        isFavorite: false,
        notes: 'Personal equities and futures portfolio swing book.',
        createdAt: new Date(now.getTime() - 50 * 86400000).toISOString(),
        updatedAt: now.toISOString(),
      }
    ];
    accounts.forEach(a => LocalDatabase.insertItem(userId, 'accounts', a));

    // 7. Realistic Trades with Playbook Linkage and Quality Scores
    const tradeDataRaw = [
      {
        instrument: 'NQ',
        assetClass: 'INDICES' as const,
        direction: 'LONG' as const,
        entryPrice: 19840.50,
        exitPrice: 19965.25,
        stopLossPrice: 19790.00,
        takeProfitPrice: 19965.00,
        quantity: 2,
        multiplier: 20,
        commission: 8.50,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        playbookId: 'pb_silver_bullet_nq',
        playbookName: 'ICT Silver Bullet 10:00 AM Execution Blueprint',
        setupId: 'setup_silver_bullet',
        setupName: 'NY 10 AM Silver Bullet',
        daysAgo: 8,
        confluences: ['London High Sweep', '15m FVG Inversion', 'Bullish Order Flow'],
        preEmotion: 'FOCUSED' as const,
        postEmotion: 'SATISFIED' as const,
        discipline: 10,
        entryRationale: 'Clean 15m Fair value gap filled during 9:45 AM NY morning session.',
      },
      {
        instrument: 'XAUUSD',
        assetClass: 'COMMODITIES' as const,
        direction: 'SHORT' as const,
        entryPrice: 2415.80,
        exitPrice: 2402.30,
        stopLossPrice: 2422.00,
        takeProfitPrice: 2398.00,
        quantity: 1.5,
        multiplier: 100,
        commission: 12.00,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        playbookId: 'pb_silver_bullet_nq',
        playbookName: 'ICT Silver Bullet 10:00 AM Execution Blueprint',
        setupId: 'setup_silver_bullet',
        setupName: 'NY 10 AM Silver Bullet',
        daysAgo: 6,
        confluences: ['Daily Resistance Test', 'Liquidity Grab', '1m Market Structure Shift'],
        preEmotion: 'CONFIDENT' as const,
        postEmotion: 'DISCIPLINED' as const,
        discipline: 9,
        entryRationale: 'Asia high sweep followed by aggressive sell imbalance into London fix.',
      },
      {
        instrument: 'EURUSD',
        assetClass: 'FOREX' as const,
        direction: 'LONG' as const,
        entryPrice: 1.0880,
        exitPrice: 1.0855,
        stopLossPrice: 1.0855,
        takeProfitPrice: 1.0940,
        quantity: 5,
        multiplier: 100000,
        commission: 15.00,
        strategyId: 'strat_trend_pullback',
        strategyName: 'Volume Profile & VWAP Pullback',
        playbookId: 'pb_vwap_trend_master',
        playbookName: 'Session VWAP Institutional Pullback System',
        setupId: 'setup_vwap_bounce',
        setupName: 'First VWAP Pullback',
        daysAgo: 5,
        confluences: ['4H Trendline', 'Oversold RSI'],
        preEmotion: 'EAGER' as const,
        postEmotion: 'NEUTRAL' as const,
        discipline: 8,
        entryRationale: 'Attempted pullback entry at 4H support. Stopped out cleanly at planned SL without hesitation.',
      },
      {
        instrument: 'NAS100',
        assetClass: 'INDICES' as const,
        direction: 'LONG' as const,
        entryPrice: 19910.00,
        exitPrice: 20085.00,
        stopLossPrice: 19850.00,
        takeProfitPrice: 20080.00,
        quantity: 2,
        multiplier: 20,
        commission: 8.50,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        playbookId: 'pb_silver_bullet_nq',
        playbookName: 'ICT Silver Bullet 10:00 AM Execution Blueprint',
        setupId: 'setup_silver_bullet',
        setupName: 'NY 10 AM Silver Bullet',
        daysAgo: 3,
        confluences: ['NY Reversal Pattern', '15m Bullish FVG', 'Tech Sector Relative Strength'],
        preEmotion: 'CALM' as const,
        postEmotion: 'PROUD' as const,
        discipline: 10,
        entryRationale: 'CPI day afternoon continuation setup after morning consolidation.',
      },
      {
        instrument: 'BTCUSDT',
        assetClass: 'CRYPTO' as const,
        direction: 'LONG' as const,
        entryPrice: 63200.00,
        exitPrice: 64850.00,
        stopLossPrice: 62400.00,
        takeProfitPrice: 65000.00,
        quantity: 0.5,
        multiplier: 1,
        commission: 6.20,
        strategyId: 'strat_trend_pullback',
        strategyName: 'Volume Profile & VWAP Pullback',
        playbookId: 'pb_vwap_trend_master',
        playbookName: 'Session VWAP Institutional Pullback System',
        setupId: 'setup_vwap_bounce',
        setupName: 'First VWAP Pullback',
        daysAgo: 2,
        confluences: ['Daily VWAP Bounce', 'Spot Delta Surge'],
        preEmotion: 'FOCUSED' as const,
        postEmotion: 'SATISFIED' as const,
        discipline: 9,
        entryRationale: 'Weekly value area low defended by aggressive limit orders.',
      },
      {
        instrument: 'ES',
        assetClass: 'INDICES' as const,
        direction: 'SHORT' as const,
        entryPrice: 5625.00,
        exitPrice: 5632.50,
        stopLossPrice: 5632.50,
        takeProfitPrice: 5600.00,
        quantity: 2,
        multiplier: 50,
        commission: 8.50,
        strategyId: 'strat_ict_fvg',
        strategyName: 'ICT / SMC Liquidity & FVG',
        playbookId: 'pb_silver_bullet_nq',
        playbookName: 'ICT Silver Bullet 10:00 AM Execution Blueprint',
        setupId: 'setup_silver_bullet',
        setupName: 'NY 10 AM Silver Bullet',
        daysAgo: 1,
        confluences: ['1h Bearish OB'],
        preEmotion: 'ANXIOUS' as const,
        postEmotion: 'FRUSTRATED' as const,
        discipline: 7,
        entryRationale: 'Entered slightly early before full 1m MSS confirmation. Accepted standard planned stop loss.',
      },
    ];

    const trades: Trade[] = tradeDataRaw.map((t, idx) => {
      const entryTime = new Date(now.getTime() - (t.daysAgo * 86400000) + (idx * 3600000));
      const exitTime = new Date(entryTime.getTime() + 45 * 60000 + idx * 1800000);
      
      const grossPnL = CalculationEngine.calculateGrossPnL(
        t.direction,
        t.entryPrice,
        t.exitPrice,
        t.quantity,
        t.multiplier
      );

      const netPnL = CalculationEngine.calculateNetPnL(grossPnL, t.commission, 0, 0, 0);
      const plannedRisk = CalculationEngine.calculatePlannedRisk(
        t.direction,
        t.entryPrice,
        t.stopLossPrice,
        t.quantity,
        t.multiplier
      );
      const achievedR = CalculationEngine.calculateAchievedR(netPnL, plannedRisk);
      const plannedRR = CalculationEngine.calculatePlannedRR(
        t.direction,
        t.entryPrice,
        t.stopLossPrice,
        t.takeProfitPrice
      );

      const outcome = CalculationEngine.determineTradeOutcome(netPnL, 'CLOSED');

      const psych = {
        preTradeEmotion: t.preEmotion,
        postTradeEmotion: t.postEmotion,
        disciplineScore: t.discipline,
        confidenceScore: 9,
        stressLevel: 3,
        followedTradingPlan: t.discipline >= 8,
        mistakes: t.discipline < 8 ? ['Early Entry'] : [],
      };

      const tradePartial: Partial<Trade> = {
        direction: t.direction,
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        stopLossPrice: t.stopLossPrice,
        takeProfitPrice: t.takeProfitPrice,
        plannedRiskPercent: Number(((plannedRisk / 100000) * 100).toFixed(2)),
        plannedRRRatio: plannedRR,
        achievedRMultiple: achievedR,
        confluences: t.confluences,
        entryRationale: t.entryRationale,
        psychology: psych,
        marketContext: {
          timeframe: '5m',
          higherTimeframeTrend: 'BULLISH',
          marketCondition: 'TRENDING_UP',
          session: 'NEW_YORK',
        },
      };

      const qualityScore = TradeScoringEngine.evaluateTrade(tradePartial);

      return {
        id: `tr_seed_${idx + 1}`,
        userId,
        workspaceId: wsId,
        accountId: 'acc_ftmo_100k',
        instrument: t.instrument,
        assetClass: t.assetClass,
        direction: t.direction,
        status: 'CLOSED',
        strategyId: t.strategyId,
        strategyName: t.strategyName,
        playbookId: t.playbookId,
        playbookName: t.playbookName,
        setupId: t.setupId,
        setupName: t.setupName,
        confluences: t.confluences,
        tags: ['A+ Setup', 'New York Session'],
        entryDate: entryTime.toISOString(),
        exitDate: exitTime.toISOString(),
        holdingTimeSeconds: Math.round((exitTime.getTime() - entryTime.getTime()) / 1000),
        session: 'NEW_YORK',
        entryPrice: t.entryPrice,
        exitPrice: t.exitPrice,
        stopLossPrice: t.stopLossPrice,
        takeProfitPrice: t.takeProfitPrice,
        quantity: t.quantity,
        contractMultiplier: t.multiplier,
        plannedRiskAmount: plannedRisk,
        plannedRiskPercent: Number(((plannedRisk / 100000) * 100).toFixed(2)),
        plannedRRRatio: plannedRR,
        commission: t.commission,
        swap: 0,
        spreadCost: 0,
        fees: 0,
        grossPnL,
        netPnL,
        pnlPercentage: Number(((netPnL / 100000) * 100).toFixed(2)),
        achievedRMultiple: achievedR,
        outcome,
        entryRationale: t.entryRationale,
        psychology: psych,
        qualityScore,
        createdAt: entryTime.toISOString(),
        updatedAt: exitTime.toISOString(),
      };
    });

    trades.forEach(tr => LocalDatabase.insertItem(userId, 'trades', tr));

    return {
      workspace,
      accounts,
      strategies,
      playbooks,
      setups,
      trades,
    };
  }
}

