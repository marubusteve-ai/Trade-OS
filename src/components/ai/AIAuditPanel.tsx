/**
 * TradeOS Structured AI Audit Studio
 * 
 * Provides dedicated workflow generators for all 12 core evaluation modules:
 * Trade Review, Journal Summary, Daily/Weekly/Monthly, Mistakes, Patterns,
 * Strategies, Playbooks, Psychology, Risk, and Coaching.
 */

import React, { useState } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { AIService } from '../../services/aiService';
import { AIReviewType, StructuredAIAnalysisResponse } from '../../types/ai';
import { AIResponseCard } from './AIResponseCard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  Compass,
  ShieldAlert,
  Brain,
  TrendingUp,
  Layers,
  BookOpen,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface AuditTypeOption {
  type: AIReviewType;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const AUDIT_TYPES: AuditTypeOption[] = [
  {
    type: 'TRADE_REVIEW',
    title: 'Trade Review',
    description: 'Post-execution audit of planned vs realized R, slippage, and checklist adherence.',
    icon: FileSpreadsheet,
    color: 'text-blue-400',
  },
  {
    type: 'JOURNAL_SUMMARY',
    title: 'Journal Summary',
    description: 'Synthesizes qualitative trade thoughts, daily check-ins, and execution discipline streaks.',
    icon: BookOpen,
    color: 'text-purple-400',
  },
  {
    type: 'DAILY_REVIEW',
    title: 'Daily Review',
    description: 'Retrospective on today’s executions, win/loss day metrics, and session liquidity capture.',
    icon: Calendar,
    color: 'text-cyan-400',
  },
  {
    type: 'WEEKLY_REVIEW',
    title: 'Weekly Review',
    description: 'Aggregates weekly net P&L, setup efficacy, and macro market regime alignment.',
    icon: TrendingUp,
    color: 'text-emerald-400',
  },
  {
    type: 'MONTHLY_REVIEW',
    title: 'Monthly Review',
    description: 'Comprehensive monthly performance scorecard, drawdown resilience, and alpha shifts.',
    icon: Calendar,
    color: 'text-indigo-400',
  },
  {
    type: 'MISTAKE_ANALYSIS',
    title: 'Mistake Analysis',
    description: 'Quantitative cost-of-error attribution across FOMO, sizing violations, and early exits.',
    icon: AlertTriangle,
    color: 'text-rose-400',
  },
  {
    type: 'PATTERN_DISCOVERY',
    title: 'Pattern Discovery',
    description: 'Multidimensional edge scanner across sessions, holding duration, and setup confluences.',
    icon: Compass,
    color: 'text-amber-400',
  },
  {
    type: 'STRATEGY_REVIEW',
    title: 'Strategy Review',
    description: 'Systematic model alpha breakdown, payoff ratios, and trade frequency vs expectancy.',
    icon: Layers,
    color: 'text-purple-400',
  },
  {
    type: 'PLAYBOOK_REVIEW',
    title: 'Playbook Review',
    description: 'Evaluates rule compliance impact on win rate and isolates commonly skipped criteria.',
    icon: CheckCircle2,
    color: 'text-blue-400',
  },
  {
    type: 'PSYCHOLOGY_REVIEW',
    title: 'Psychology Review',
    description: 'Behavioral discipline audit, tilt identification, and post-loss emotional cascades.',
    icon: Brain,
    color: 'text-pink-400',
  },
  {
    type: 'RISK_REVIEW',
    title: 'Risk Review',
    description: 'Value-at-Risk (VaR), portfolio correlation clusters, and prop compliance safeguards.',
    icon: ShieldAlert,
    color: 'text-rose-400',
  },
  {
    type: 'PERFORMANCE_COACHING',
    title: 'Performance Coaching',
    description: 'Actionable discipline recommendations and prioritized areas for quantitative investigation.',
    icon: Sparkles,
    color: 'text-emerald-400',
  },
];

export const AIAuditPanel: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    trades,
    selectedAccountTrades,
    strategies,
    playbooks,
    sessionCheckIns,
    riskPolicy,
  } = useTradeOS();
  const { notify } = useNotification();

  const [selectedAuditType, setSelectedAuditType] = useState<AIReviewType>('PERFORMANCE_COACHING');
  const [selectedTradeId, setSelectedTradeId] = useState<string>('');
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedAnalysis, setGeneratedAnalysis] = useState<StructuredAIAnalysisResponse | null>(null);

  const activeTrades = selectedAccountId === 'ALL' ? trades : selectedAccountTrades;
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  const handleRunAudit = async () => {
    setIsLoading(true);
    setGeneratedAnalysis(null);

    const specificTrade = activeTrades.find((t) => t.id === selectedTradeId);

    try {
      const result = await AIService.runStructuredReview(
        selectedAuditType,
        activeTrades,
        activeAccount,
        strategies,
        playbooks,
        sessionCheckIns,
        riskPolicy,
        customPrompt,
        specificTrade,
        currentUser?.id || 'user-default'
      );

      setGeneratedAnalysis(result);
      notify.success('Audit Generated', `Successfully produced ${selectedAuditType.replace(/_/g, ' ')} evaluation.`);
    } catch (err: any) {
      console.error('Audit execution failed:', err);
      notify.error('Audit Failed', err?.message || 'Could not generate structured evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header & Audit Selector */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121418] border border-[#22252A] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <span>Structured Audit Studio</span>
            </h2>
            <p className="text-xs text-[#848B98] mt-0.5">
              Select an institutional evaluation category and generate a mathematically grounded review.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Accounts (Consolidated)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumber})
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              onClick={handleRunAudit}
              disabled={isLoading}
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>{isLoading ? 'Computing...' : 'Run Audit'}</span>
            </Button>
          </div>
        </div>

        {/* 12-Module Grid Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {AUDIT_TYPES.map((audit) => {
            const isSelected = selectedAuditType === audit.type;
            const Icon = audit.icon;
            return (
              <button
                key={audit.type}
                onClick={() => setSelectedAuditType(audit.type)}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between space-y-1.5 ${
                  isSelected
                    ? 'bg-purple-600/15 border-purple-500 text-white shadow-lg'
                    : 'bg-[#181B20] border-[#2A2E35] text-[#848B98] hover:border-[#3E434D] hover:text-[#D1D5DB]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`p-1.5 rounded-md ${isSelected ? 'bg-purple-500/20' : 'bg-[#121418]'}`}>
                    <Icon className={`h-4 w-4 ${audit.color}`} />
                  </div>
                  {isSelected && (
                    <Badge variant="purple" className="text-[9px] px-1 py-0 font-mono">
                      SELECTED
                    </Badge>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{audit.title}</div>
                  <div className="text-[10px] text-[#848B98] line-clamp-2 mt-0.5">
                    {audit.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Context Parameters based on chosen Audit Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {selectedAuditType === 'TRADE_REVIEW' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB]">Select Specific Trade to Audit</label>
              <select
                value={selectedTradeId}
                onChange={(e) => setSelectedTradeId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white font-mono focus:outline-none focus:border-purple-500"
              >
                <option value="">Latest Closed Trade (Auto)</option>
                {activeTrades.slice(0, 30).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.instrument} ({t.direction}) | {t.netPnL >= 0 ? '+' : ''}${t.netPnL.toFixed(2)} | {t.exitDate || t.entryDate}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedAuditType === 'STRATEGY_REVIEW' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB]">Filter Strategy Model</label>
              <select
                value={selectedStrategyId}
                onChange={(e) => setSelectedStrategyId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Strategies (Consolidated)</option>
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedAuditType === 'PLAYBOOK_REVIEW' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#D1D5DB]">Filter Playbook Setup</label>
              <select
                value={selectedPlaybookId}
                onChange={(e) => setSelectedPlaybookId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white focus:outline-none focus:border-purple-500"
              >
                <option value="">All Playbooks</option>
                {playbooks.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-[#D1D5DB]">
              Custom Audit Directives / Focus (Optional)
            </label>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus specifically on early exits during London session..."
              className="w-full px-3 py-2 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white placeholder-[#848B98] focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Generated Analysis Render */}
      {generatedAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Generated AI Audit Result
            </span>
          </div>
          <AIResponseCard response={generatedAnalysis} />
        </div>
      )}

      {/* Loading Placeholder */}
      {isLoading && (
        <Card className="p-8 border border-purple-500/30 bg-[#121418] text-center space-y-3">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Running Institutional AI Audit</h3>
          <p className="text-xs text-[#848B98] max-w-md mx-auto">
            Extracting dataset from CalculationEngine, verifying sample sizes, and compiling structured [OBSERVED], [CALCULATED], [INTERPRETATION], and [RECOMMENDATION] sections...
          </p>
        </Card>
      )}
    </div>
  );
};
