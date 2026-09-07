/**
 * TradeOS AI Mistake & Execution Leakage Diagnostic
 * 
 * Deep quantitative cost-of-error explorer analyzing cumulative dollar losses,
 * frequency of behavioral mistakes, and actionable prevention checklists.
 */

import React, { useState } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { AIService } from '../../services/aiService';
import { StructuredAIAnalysisResponse } from '../../types/ai';
import { AIResponseCard } from './AIResponseCard';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  AlertTriangle,
  Flame,
  DollarSign,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AIMistakeDiagnostic: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    accounts,
    selectedAccountId,
    trades,
    selectedAccountTrades,
    strategies,
    playbooks,
    sessionCheckIns,
    riskPolicy,
    metrics,
  } = useTradeOS();
  const { notify } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<StructuredAIAnalysisResponse | null>(null);

  const activeTrades = selectedAccountId === 'ALL' ? trades : selectedAccountTrades;
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  // Aggregate mistakes data
  const mistakeMap = new Map<string, { count: number; totalCost: number; trades: typeof activeTrades }>();
  activeTrades.forEach((t) => {
    const mistakes = t.psychology?.mistakes || [];
    if (mistakes.length > 0) {
      mistakes.forEach((tag) => {
        const cost = t.netPnL < 0 ? Math.abs(t.netPnL) : 0;
        const curr = mistakeMap.get(tag) || { count: 0, totalCost: 0, trades: [] };
        curr.count += 1;
        curr.totalCost += cost;
        curr.trades.push(t);
        mistakeMap.set(tag, curr);
      });
    }
  });

  const sortedMistakes = Array.from(mistakeMap.entries())
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      totalCost: data.totalCost,
      trades: data.trades,
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalMistakeCost = sortedMistakes.reduce((sum, m) => sum + m.totalCost, 0);
  const potentialNetPnL = metrics.netPnL + totalMistakeCost;

  const handleRunAiAudit = async () => {
    setIsLoading(true);
    setAiAnalysis(null);

    try {
      const result = await AIService.runStructuredReview(
        'MISTAKE_ANALYSIS',
        activeTrades,
        activeAccount,
        strategies,
        playbooks,
        sessionCheckIns,
        riskPolicy,
        'Deep Execution Leakage & Mistake Diagnostic',
        undefined,
        currentUser?.id || 'user-default'
      );
      setAiAnalysis(result);
      notify.success('Mistake Audit Complete', 'AI analyzed all execution leakage patterns.');
    } catch (err: any) {
      console.error('Mistake audit failed:', err);
      notify.error('Audit Failed', err?.message || 'Could not analyze mistakes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <div className="flex items-center justify-between text-[#848B98] text-xs">
            <span>Total Mistake Cost</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400">
            ${totalMistakeCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#848B98]">
            {sortedMistakes.reduce((sum, m) => sum + m.count, 0)} logged error tags
          </span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <div className="flex items-center justify-between text-[#848B98] text-xs">
            <span>Current Net P&L</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono ${metrics.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.netPnL >= 0 ? '+' : ''}${metrics.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-[#848B98]">Realized across {activeTrades.length} trades</span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <div className="flex items-center justify-between text-[#848B98] text-xs">
            <span>Potential P&L (Zero Errors)</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">
            +${potentialNetPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono">
            +${totalMistakeCost.toFixed(2)} reclaimed edge
          </span>
        </Card>

        <Card className="p-4 bg-[#121418] border-[#22252A] space-y-1">
          <div className="flex items-center justify-between text-[#848B98] text-xs">
            <span>Top Error Leakage</span>
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-white truncate">
            {sortedMistakes[0]?.tag || 'None Logged'}
          </div>
          <span className="text-[10px] text-rose-400 font-mono">
            {sortedMistakes[0] ? `$${sortedMistakes[0].totalCost.toFixed(2)} lost` : 'Zero errors'}
          </span>
        </Card>
      </div>

      {/* Main Breakdown & AI Audit Trigger */}
      <Card className="p-5 bg-[#121418] border-[#22252A] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Behavioral Mistake Taxonomy & Cost Attribution</span>
            </h3>
            <p className="text-xs text-[#848B98] mt-0.5">
              Exact financial breakdown of losses caused by discipline and execution deviations.
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleRunAiAudit}
            disabled={isLoading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>Run AI Mistake Diagnosis</span>
          </Button>
        </div>

        {/* Mistake List */}
        {sortedMistakes.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-[#181B20] border border-[#22252A] text-xs text-[#848B98]">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <span className="font-bold text-white block">No Mistake Tags Logged</span>
            <p className="mt-1">
              Ensure you tag losing trades with mistake categories (e.g. FOMO, Early Exit, Revenge Trading) to unlock institutional cost-of-error diagnostics.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMistakes.map((m, idx) => {
              const costPercent = totalMistakeCost > 0 ? (m.totalCost / totalMistakeCost) * 100 : 0;
              return (
                <div
                  key={m.tag}
                  className="p-4 rounded-lg bg-[#181B20] border border-[#2A2E35] space-y-2.5 hover:border-rose-500/40 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        #{idx + 1}
                      </span>
                      <span className="text-sm font-bold text-white">{m.tag}</span>
                      <Badge variant="neutral" className="text-[10px] font-mono">
                        {m.count} {m.count === 1 ? 'trade' : 'trades'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[#848B98] font-mono">
                        {costPercent.toFixed(1)}% of error losses
                      </span>
                      <span className="text-sm font-bold font-mono text-rose-400">
                        -${m.totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-[#0C0D0F] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(4, costPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-white flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span>AI Execution Leakage Audit</span>
          </span>
          <AIResponseCard response={aiAnalysis} />
        </div>
      )}
    </div>
  );
};
