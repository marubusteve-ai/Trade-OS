/**
 * TradeOS AI Service Subsystem
 * 
 * Separates AI intelligence and quantitative coaching from core domain calculations.
 * Interacts with server-side Gemini API endpoints and provides instant deterministic
 * mathematical fallback to prevent hallucinations or broken states.
 */

import { Trade, Account, Strategy, Playbook } from '../types/domain';
import { RiskPolicy } from '../types/risk';
import { SessionCheckIn } from '../types/psychology';
import {
  AIReviewType,
  StructuredAIAnalysisResponse,
  AICoachMessage,
  StoredAIReview,
  AIPresetQuestion,
} from '../types/ai';
import { AIGroundedDataContext } from './aiGroundedDataContext';
import { AIReviewRepository } from '../repositories/aiReviewRepository';

export const AI_PRESET_QUESTIONS: AIPresetQuestion[] = [
  {
    id: 'pq_highest_setups',
    question: 'What are my highest-performing setups?',
    category: 'SETUPS',
    reviewType: 'PATTERN_DISCOVERY',
    iconName: 'Sparkles',
    description: 'Ranks setups by win rate, expectancy, and net dollar contribution.',
  },
  {
    id: 'pq_costliest_mistakes',
    question: 'What mistakes cost me the most?',
    category: 'MISTAKES',
    reviewType: 'MISTAKE_ANALYSIS',
    iconName: 'AlertTriangle',
    description: 'Quantifies cumulative dollar losses from FOMO, sizing, and early exits.',
  },
  {
    id: 'pq_best_conditions',
    question: 'What conditions produce my best trades?',
    category: 'CONDITIONS',
    reviewType: 'PATTERN_DISCOVERY',
    iconName: 'Compass',
    description: 'Discovers high-probability confluences across session, day of week, and asset class.',
  },
  {
    id: 'pq_best_sessions',
    question: 'Which sessions perform best?',
    category: 'SESSIONS',
    reviewType: 'PATTERN_DISCOVERY',
    iconName: 'Clock',
    description: 'Compares NY Morning, London, Asia, and NY Afternoon expectancy.',
  },
  {
    id: 'pq_consecutive_losses',
    question: 'What happens after consecutive losses?',
    category: 'LOSING_STREAKS',
    reviewType: 'PSYCHOLOGY_REVIEW',
    iconName: 'Flame',
    description: 'Audits post-drawdown revenge trading behavior and risk deviation.',
  },
  {
    id: 'pq_playbook_violations',
    question: 'Which playbook rules do I violate?',
    category: 'PLAYBOOK',
    reviewType: 'PLAYBOOK_REVIEW',
    iconName: 'BookOpen',
    description: 'Lists the most frequently skipped checklist confirmations and their impact.',
  },
  {
    id: 'pq_rule_adherence_pnl',
    question: 'How does rule adherence relate to performance?',
    category: 'PLAYBOOK',
    reviewType: 'PLAYBOOK_REVIEW',
    iconName: 'CheckCircle2',
    description: 'Measures win rate and R-multiple delta between compliant and non-compliant trades.',
  },
  {
    id: 'pq_monthly_shifts',
    question: 'What changed this month?',
    category: 'MONTHLY_SHIFTS',
    reviewType: 'MONTHLY_REVIEW',
    iconName: 'TrendingUp',
    description: 'Evaluates month-over-month shifts in win rate, volume, and drawdown resilience.',
  },
  {
    id: 'pq_investigation_areas',
    question: 'Which areas deserve further investigation?',
    category: 'INVESTIGATION',
    reviewType: 'PERFORMANCE_COACHING',
    iconName: 'Search',
    description: 'Identifies statistically anomalous execution leaks requiring attention.',
  },
];

export class AIService {
  private static repository = new AIReviewRepository();

  /**
   * Universal runner for all structured AI evaluations.
   */
  static async runStructuredReview(
    reviewType: AIReviewType,
    trades: Trade[],
    account?: Account | null,
    strategies: Strategy[] = [],
    playbooks: Playbook[] = [],
    checkIns: SessionCheckIn[] = [],
    riskPolicy?: RiskPolicy,
    customQuery?: string,
    specificTrade?: Trade,
    userId: string = 'user-default'
  ): Promise<StructuredAIAnalysisResponse> {
    const startTime = Date.now();
    const dataset = AIGroundedDataContext.extractDataset(
      trades,
      account,
      strategies,
      playbooks,
      checkIns,
      riskPolicy
    );

    // Try calling server-side Gemini endpoint first
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewType,
          dataset,
          customQuery,
          specificTradeId: specificTrade?.id,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json && json.success && json.analysis) {
          const analysisResult: StructuredAIAnalysisResponse = {
            ...json.analysis,
            executionTimeMs: Date.now() - startTime,
            modelUsed: json.model || 'gemini-3.8-flash (Server-Side Grounded)',
          };

          // Store review automatically in background
          await this.repository.saveReview(userId, {
            userId,
            reviewType,
            title: analysisResult.title,
            prompt: customQuery || `Structured ${reviewType} Audit`,
            accountId: account?.id,
            response: analysisResult,
            groundedMetricsSnapshot: {
              tradeCount: dataset.tradeCount,
              winRate: dataset.metrics.winRate,
              netPnL: dataset.metrics.netPnL,
              profitFactor: dataset.metrics.profitFactor,
              maxDrawdownPercent: dataset.drawdown.maxDrawdownPercent,
            },
            tags: [reviewType, account?.name || 'All Accounts', 'AI_AUDIT'],
            isFavorite: false,
          });

          return analysisResult;
        }
      }
    } catch (err) {
      console.warn('Server-side Gemini generation unavailable or offline; using TradeOS deterministic grounded engine:', err);
    }

    // Fallback: Guaranteed deterministic, fully grounded analysis
    const deterministicAnalysis = AIGroundedDataContext.generateDeterministicAnalysis(
      reviewType,
      dataset,
      customQuery,
      specificTrade
    );
    deterministicAnalysis.executionTimeMs = Date.now() - startTime;

    // Persist generated review
    await this.repository.saveReview(userId, {
      userId,
      reviewType,
      title: deterministicAnalysis.title,
      prompt: customQuery || `Structured ${reviewType} Audit`,
      accountId: account?.id,
      response: deterministicAnalysis,
      groundedMetricsSnapshot: {
        tradeCount: dataset.tradeCount,
        winRate: dataset.metrics.winRate,
        netPnL: dataset.metrics.netPnL,
        profitFactor: dataset.metrics.profitFactor,
        maxDrawdownPercent: dataset.drawdown.maxDrawdownPercent,
      },
      tags: [reviewType, account?.name || 'All Accounts', 'DETERMINISTIC_AUDIT'],
      isFavorite: false,
    });

    return deterministicAnalysis;
  }

  /**
   * Interactive AI Coach Question & Answer Handler
   */
  static async askCoach(
    question: string,
    trades: Trade[],
    account?: Account | null,
    strategies: Strategy[] = [],
    playbooks: Playbook[] = [],
    checkIns: SessionCheckIn[] = [],
    riskPolicy?: RiskPolicy,
    userId: string = 'user-default'
  ): Promise<AICoachMessage> {
    const dataset = AIGroundedDataContext.extractDataset(
      trades,
      account,
      strategies,
      playbooks,
      checkIns,
      riskPolicy
    );

    // Determine relevant review type from question text or matching preset
    let reviewType: AIReviewType = 'CUSTOM_INQUIRY';
    const lower = question.toLowerCase();
    if (lower.includes('mistake') || lower.includes('cost') || lower.includes('leakage') || lower.includes('fomo')) {
      reviewType = 'MISTAKE_ANALYSIS';
    } else if (lower.includes('setup') || lower.includes('condition') || lower.includes('session') || lower.includes('pattern')) {
      reviewType = 'PATTERN_DISCOVERY';
    } else if (lower.includes('rule') || lower.includes('playbook') || lower.includes('checklist') || lower.includes('adherence')) {
      reviewType = 'PLAYBOOK_REVIEW';
    } else if (lower.includes('loss') || lower.includes('psychology') || lower.includes('emotion') || lower.includes('revenge')) {
      reviewType = 'PSYCHOLOGY_REVIEW';
    } else if (lower.includes('risk') || lower.includes('var') || lower.includes('drawdown') || lower.includes('prop')) {
      reviewType = 'RISK_REVIEW';
    } else if (lower.includes('month') || lower.includes('week') || lower.includes('day')) {
      reviewType = 'MONTHLY_REVIEW';
    }

    const structured = await this.runStructuredReview(
      reviewType,
      trades,
      account,
      strategies,
      playbooks,
      checkIns,
      riskPolicy,
      question,
      undefined,
      userId
    );

    const message: AICoachMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      role: 'assistant',
      content: structured.summary,
      timestamp: new Date().toISOString(),
      structuredResponse: structured,
      groundedContextSummary: {
        accountName: dataset.accountName,
        tradeCount: dataset.tradeCount,
        winRate: dataset.metrics.winRate,
        netPnL: dataset.metrics.netPnL,
        profitFactor: dataset.metrics.profitFactor,
      },
    };

    return message;
  }

  /**
   * Repository proxy methods
   */
  static async getStoredReviews(userId: string, accountId?: string): Promise<StoredAIReview[]> {
    return this.repository.getReviews(userId, accountId);
  }

  static async deleteStoredReview(userId: string, reviewId: string): Promise<boolean> {
    return this.repository.deleteReview(userId, reviewId);
  }

  static async toggleFavoriteReview(userId: string, reviewId: string): Promise<StoredAIReview | null> {
    return this.repository.toggleFavorite(userId, reviewId);
  }

  static async getChatHistory(userId: string): Promise<AICoachMessage[]> {
    return this.repository.getChatHistory(userId);
  }

  static async saveChatHistory(userId: string, messages: AICoachMessage[]): Promise<void> {
    return this.repository.saveChatHistory(userId, messages);
  }

  static async clearChatHistory(userId: string): Promise<void> {
    return this.repository.clearChatHistory(userId);
  }
}
