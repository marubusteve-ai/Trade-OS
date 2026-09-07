/**
 * Psychology & Mistake Taxonomy Repository
 * 
 * Manages configurable mistake categories, taxonomy items, session check-ins,
 * and user behavioral state with persistent storage.
 */

import { LocalDatabase } from './localDatabase';
import { MistakeCategory, MistakeTaxonomyItem, SessionCheckIn } from '../types/psychology';

export const DEFAULT_MISTAKE_CATEGORIES: MistakeCategory[] = [
  {
    id: 'cat_entry_timing',
    name: 'Entry & Timing Execution',
    description: 'Flaws in entry trigger timing, chasing, or anticipation.',
    colorHex: '#3B82F6',
    isCustom: false,
  },
  {
    id: 'cat_risk_sizing',
    name: 'Risk & Position Sizing',
    description: 'Overleveraging, improper stop placement, and risk policy violations.',
    colorHex: '#EF4444',
    isCustom: false,
  },
  {
    id: 'cat_trade_management',
    name: 'Trade Management & Exits',
    description: 'Premature profit taking, moving stops, or failing to honor targets.',
    colorHex: '#F59E0B',
    isCustom: false,
  },
  {
    id: 'cat_psychology_bias',
    name: 'Psychology, Bias & Tilt',
    description: 'Emotional biases including FOMO, revenge trading, and overtrading.',
    colorHex: '#8B5CF6',
    isCustom: false,
  },
  {
    id: 'cat_process_rules',
    name: 'Process & Rule Adherence',
    description: 'Deviations from written playbook rules, setups, and session checklists.',
    colorHex: '#10B981',
    isCustom: false,
  },
];

export const DEFAULT_MISTAKE_TAXONOMY: MistakeTaxonomyItem[] = [
  // Entry & Timing
  {
    id: 'mstk_early_entry',
    categoryId: 'cat_entry_timing',
    categoryName: 'Entry & Timing Execution',
    name: 'Early Entry',
    description: 'Entered prior to structural confirmation or before candle close.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Worse entry price and increased stop-out probability.',
    isCustom: false,
  },
  {
    id: 'mstk_late_entry',
    categoryId: 'cat_entry_timing',
    categoryName: 'Entry & Timing Execution',
    name: 'Late Entry',
    description: 'Chased price after momentum displacement already occurred.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Substantially compressed Reward-to-Risk ratio.',
    isCustom: false,
  },
  {
    id: 'mstk_front_running',
    categoryId: 'cat_entry_timing',
    categoryName: 'Entry & Timing Execution',
    name: 'Front-Running Confirmation',
    description: 'Anticipated pattern completion without waiting for the actual trigger.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Trading opinions instead of price action reality.',
    isCustom: false,
  },

  // Risk & Sizing
  {
    id: 'mstk_oversized_position',
    categoryId: 'cat_risk_sizing',
    categoryName: 'Risk & Position Sizing',
    name: 'Oversized Position',
    description: 'Risked more than authorized account risk parameters (overleveraged).',
    severity: 'SEVERE',
    typicalImpactSummary: 'Disproportionate drawdown and heightened emotional pressure.',
    isCustom: false,
  },
  {
    id: 'mstk_moved_stop',
    categoryId: 'cat_risk_sizing',
    categoryName: 'Risk & Position Sizing',
    name: 'Moved Stop',
    description: 'Widened stop loss away from initial planned invalidation price.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Transformed a controlled R loss into an unmanaged disaster.',
    isCustom: false,
  },
  {
    id: 'mstk_removed_stop',
    categoryId: 'cat_risk_sizing',
    categoryName: 'Risk & Position Sizing',
    name: 'Removed Stop',
    description: 'Completely eliminated the hard stop loss during an active drawdown.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Catastrophic account risk and potential liquidation.',
    isCustom: false,
  },
  {
    id: 'mstk_ignored_risk_rule',
    categoryId: 'cat_risk_sizing',
    categoryName: 'Risk & Position Sizing',
    name: 'Ignored Risk Rule',
    description: 'Violated maximum open exposure or daily loss risk threshold.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Account compliance breaches and capital impairment.',
    isCustom: false,
  },

  // Trade Management & Exits
  {
    id: 'mstk_premature_exit',
    categoryId: 'cat_trade_management',
    categoryName: 'Trade Management & Exits',
    name: 'Premature Exit',
    description: 'Closed a winning trade prematurely out of fear of giving back profit.',
    severity: 'MINOR',
    typicalImpactSummary: 'Left significant positive R-multiples on the table.',
    isCustom: false,
  },
  {
    id: 'mstk_greed_target',
    categoryId: 'cat_trade_management',
    categoryName: 'Trade Management & Exits',
    name: 'Greed / Ignored TP',
    description: 'Held position beyond planned target objective hoping for unrealistic gains.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Watched profitable trades turn into break-even or losses.',
    isCustom: false,
  },
  {
    id: 'mstk_micromanaged',
    categoryId: 'cat_trade_management',
    categoryName: 'Trade Management & Exits',
    name: 'Micromanaged Trade',
    description: 'Stared at lower timeframe noise and tinkered unnecessarily.',
    severity: 'MINOR',
    typicalImpactSummary: 'Elevated cognitive load and suboptimal exit execution.',
    isCustom: false,
  },

  // Psychology & Bias
  {
    id: 'mstk_revenge_trade',
    categoryId: 'cat_psychology_bias',
    categoryName: 'Psychology, Bias & Tilt',
    name: 'Revenge Trade',
    description: 'Instantly re-entered the market to claw back a previous loss.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Compound losses and rapid escalation of tilt.',
    isCustom: false,
  },
  {
    id: 'mstk_fomo',
    categoryId: 'cat_psychology_bias',
    categoryName: 'Psychology, Bias & Tilt',
    name: 'FOMO',
    description: 'Entered out of anxiety over missing an ongoing market move.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Buying tops and selling bottoms right into reversals.',
    isCustom: false,
  },
  {
    id: 'mstk_overtrading',
    categoryId: 'cat_psychology_bias',
    categoryName: 'Psychology, Bias & Tilt',
    name: 'Overtrading',
    description: 'Exceeded planned daily trade quantity; forced trades in chop.',
    severity: 'SEVERE',
    typicalImpactSummary: 'High commission drag and depleted emotional capital.',
    isCustom: false,
  },
  {
    id: 'mstk_fatigue',
    categoryId: 'cat_psychology_bias',
    categoryName: 'Psychology, Bias & Tilt',
    name: 'Trading While Fatigued',
    description: 'Executed orders while tired, distracted, or emotionally compromised.',
    severity: 'MODERATE',
    typicalImpactSummary: 'Slow reaction time and sloppy execution mistakes.',
    isCustom: false,
  },

  // Process & Plan
  {
    id: 'mstk_ignored_setup_rule',
    categoryId: 'cat_process_rules',
    categoryName: 'Process & Rule Adherence',
    name: 'Ignored Setup Rule',
    description: 'Took a trade where mandatory strategy or setup criteria were missing.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Taking negative-expectancy random trades.',
    isCustom: false,
  },
  {
    id: 'mstk_traded_outside_plan',
    categoryId: 'cat_process_rules',
    categoryName: 'Process & Rule Adherence',
    name: 'Traded Outside Plan',
    description: 'Took an unapproved instrument or unplanned impulse bet.',
    severity: 'SEVERE',
    typicalImpactSummary: 'Breaking the feedback loop necessary for systematic edge.',
    isCustom: false,
  },
];

export const DEFAULT_TRADING_HABITS = [
  'Pre-market routine & level mapping completed',
  'Waited for candle close before entering',
  'Hard Stop Loss placed immediately at entry',
  'Respected maximum daily loss threshold',
  'Risk sized to exactly 1.0% or less',
  'No revenge trades taken after losses',
  'Post-trade review and journal completed',
  'Adequate sleep (7+ hours) before session',
  'Took planned break after 2 consecutive trades',
];

export const DEFAULT_SESSION_CHECKINS: Omit<SessionCheckIn, 'id' | 'userId'>[] = [
  {
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    date: new Date().toISOString().slice(0, 10),
    energyLevel: 9,
    focusScore: 9,
    stressLevel: 2,
    primaryMood: 'CALM',
    sleepHours: 8,
    marketPreparedness: 'OPTIMAL',
    sessionGoals: ['Stick strictly to 1% risk per trade', 'Wait for 15m Fair Value Gap confirmation', 'Max 3 trades for NY session'],
    rulesCommittedTo: ['Hard Stop Loss placed immediately at entry', 'Waited for candle close before entering', 'Respected maximum daily loss threshold'],
    notes: 'Well rested, clear mindset. Prepared for NY session volatility. No impulse trades.',
  },
  {
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    energyLevel: 6,
    focusScore: 7,
    stressLevel: 4,
    primaryMood: 'FOCUSED',
    sleepHours: 6.5,
    marketPreparedness: 'THOROUGH',
    sessionGoals: ['Execute London Silver Bullet only', 'Half size risk (0.5%) if chop occurs'],
    rulesCommittedTo: ['Pre-market routine & level mapping completed', 'Hard Stop Loss placed immediately at entry'],
    notes: 'Mild fatigue from late night, reducing position size to 0.5% as a risk safeguard.',
  },
];

export class PsychologyRepository {
  /**
   * Retrieves all categories for the user (default + custom)
   */
  static getCategories(userId: string): MistakeCategory[] {
    const saved = LocalDatabase.getItems<MistakeCategory>(userId, 'mistake_categories');
    if (!saved || saved.length === 0) {
      LocalDatabase.saveItems(userId, 'mistake_categories', DEFAULT_MISTAKE_CATEGORIES);
      return DEFAULT_MISTAKE_CATEGORIES;
    }
    return saved;
  }

  /**
   * Creates a new custom mistake category
   */
  static createCategory(
    userId: string, 
    category: Omit<MistakeCategory, 'id' | 'isCustom'>
  ): MistakeCategory {
    const categories = this.getCategories(userId);
    const newCategory: MistakeCategory = {
      ...category,
      id: `cat_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isCustom: true,
    };
    categories.push(newCategory);
    LocalDatabase.saveItems(userId, 'mistake_categories', categories);
    return newCategory;
  }

  /**
   * Deletes a custom category (cannot delete defaults)
   */
  static deleteCategory(userId: string, categoryId: string): boolean {
    const categories = this.getCategories(userId);
    const target = categories.find(c => c.id === categoryId);
    if (!target || !target.isCustom) return false;

    const filtered = categories.filter(c => c.id !== categoryId);
    LocalDatabase.saveItems(userId, 'mistake_categories', filtered);
    return true;
  }

  /**
   * Retrieves all taxonomy mistakes for the user
   */
  static getTaxonomy(userId: string): MistakeTaxonomyItem[] {
    const saved = LocalDatabase.getItems<MistakeTaxonomyItem>(userId, 'mistake_taxonomy');
    if (!saved || saved.length === 0) {
      LocalDatabase.saveItems(userId, 'mistake_taxonomy', DEFAULT_MISTAKE_TAXONOMY);
      return DEFAULT_MISTAKE_TAXONOMY;
    }
    return saved;
  }

  /**
   * Creates a custom mistake taxonomy item
   */
  static createMistake(
    userId: string,
    mistake: Omit<MistakeTaxonomyItem, 'id' | 'isCustom'>
  ): MistakeTaxonomyItem {
    const taxonomy = this.getTaxonomy(userId);
    const categories = this.getCategories(userId);
    const category = categories.find(c => c.id === mistake.categoryId);

    const newMistake: MistakeTaxonomyItem = {
      ...mistake,
      categoryName: category?.name || mistake.categoryName || 'Custom Category',
      id: `mstk_custom_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      isCustom: true,
    };
    taxonomy.push(newMistake);
    LocalDatabase.saveItems(userId, 'mistake_taxonomy', taxonomy);
    return newMistake;
  }

  /**
   * Deletes a custom mistake item
   */
  static deleteMistake(userId: string, mistakeId: string): boolean {
    const taxonomy = this.getTaxonomy(userId);
    const target = taxonomy.find(m => m.id === mistakeId);
    if (!target || !target.isCustom) return false;

    const filtered = taxonomy.filter(m => m.id !== mistakeId);
    LocalDatabase.saveItems(userId, 'mistake_taxonomy', filtered);
    return true;
  }

  /**
   * Session Check-ins Management
   */
  static getCheckIns(userId: string): SessionCheckIn[] {
    const checkIns = LocalDatabase.getItems<SessionCheckIn>(userId, 'session_checkins');
    if (!checkIns || checkIns.length === 0) {
      const seeded: SessionCheckIn[] = DEFAULT_SESSION_CHECKINS.map((c, idx) => ({
        ...c,
        id: `chk_init_${idx + 1}`,
        userId,
      }));
      LocalDatabase.saveItems(userId, 'session_checkins', seeded);
      return seeded;
    }
    return checkIns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static createCheckIn(
    userId: string,
    checkIn: Omit<SessionCheckIn, 'id' | 'userId' | 'timestamp'>
  ): SessionCheckIn {
    const checkIns = this.getCheckIns(userId);
    const newCheckIn: SessionCheckIn = {
      ...checkIn,
      id: `chk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId,
      timestamp: new Date().toISOString(),
    };
    checkIns.unshift(newCheckIn);
    LocalDatabase.saveItems(userId, 'session_checkins', checkIns);
    return newCheckIn;
  }

  static deleteCheckIn(userId: string, id: string): boolean {
    const checkIns = this.getCheckIns(userId);
    const filtered = checkIns.filter(c => c.id !== id);
    LocalDatabase.saveItems(userId, 'session_checkins', filtered);
    return true;
  }
}
