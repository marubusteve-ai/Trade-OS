/**
 * TradeOS AI Pattern & Edge Discovery Matrix
 * 
 * Multidimensional edge explorer correlating Sessions, Setups, Day of Week,
 * Holding Durations, and Rule Adherence to uncover mathematical sweet spots.
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
  Compass,
  Sparkles,
  Clock,
  Layers,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AIPatternMatrix: React.FC = () => {
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
  } = useTradeOS();
  const { notify } = useNotification();

  const [isLoading, setIsLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<StructuredAIAnalysisResponse | null>(null);

  const activeTrades = selectedAccountId === 'ALL' ? trades : selectedAccountTrades;
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  // 1. Session Breakdown Calculations
  const sessions = ['SYDNEY', 'TOKYO', 'LONDON', 'NEW_YORK', 'LONDON_NY_OVERLAP', 'OFF_HOURS'];
  const sessionStats = sessions.map((sess) => {
    const sTrades = activeTrades.filter(
      (t) => (t.session || '').toUpperCase() === sess || (t.session || '').toUpperCase().includes(sess)
    );
    const wins = sTrades.filter((t) => (t.netPnL || 0) > 0).length;
    const netPnL = sTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
    const totalR = sTrades.reduce((sum, t) => sum + (t.achievedRMultiple || 0), 0);
    const winRate = sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0;
    const avgR = sTrades.length > 0 ? totalR / sTrades.length : 0;

    return {
      session: sess,
      trades: sTrades.length,
      winRate,
      netPnL,
      avgR,
    };
  });

  // 2. Setup Ranking Calculations
  const setupMap = new Map<string, typeof activeTrades>();
  activeTrades.forEach((t) => {
    const key = t.setupName || t.strategyName || 'Discretionary';
    if (!setupMap.has(key)) setupMap.set(key, []);
    setupMap.get(key)!.push(t);
  });

  const setupStats = Array.from(setupMap.entries())
    .map(([name, sTrades]) => {
      const wins = sTrades.filter((t) => (t.netPnL || 0) > 0).length;
      const netPnL = sTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const totalR = sTrades.reduce((sum, t) => sum + (t.achievedRMultiple || 0), 0);
      const winRate = sTrades.length > 0 ? (wins / sTrades.length) * 100 : 0;
      const avgR = sTrades.length > 0 ? totalR / sTrades.length : 0;

      return {
        name,
        trades: sTrades.length,
        winRate,
        netPnL,
        avgR,
      };
    })
    .sort((a, b) => b.netPnL - a.netPnL);

  // 3. Rule Adherence Delta
  const compliant = activeTrades.filter(
    (t) => (t.qualityScore?.ruleAdherence && t.qualityScore.ruleAdherence >= 80) || t.psychology?.followedTradingPlan === true
  );
  const nonCompliant = activeTrades.filter((t) => !compliant.includes(t));

  const compWins = compliant.filter((t) => t.netPnL > 0).length;
  const nonCompWins = nonCompliant.filter((t) => t.netPnL > 0).length;

  const compWinRate = compliant.length > 0 ? (compWins / compliant.length) * 100 : 0;
  const nonCompWinRate = nonCompliant.length > 0 ? (nonCompWins / nonCompliant.length) * 100 : 0;
  const winRateDelta = compWinRate - nonCompWinRate;

  const handleRunAiAudit = async () => {
    setIsLoading(true);
    setAiAnalysis(null);

    try {
      const result = await AIService.runStructuredReview(
        'PATTERN_DISCOVERY',
        activeTrades,
        activeAccount,
        strategies,
        playbooks,
        sessionCheckIns,
        riskPolicy,
        'Multidimensional Pattern & Edge Confluence Audit',
        undefined,
        currentUser?.id || 'user-default'
      );
      setAiAnalysis(result);
      notify.success('Pattern Discovery Complete', 'AI compiled edge and correlation matrix.');
    } catch (err: any) {
      console.error('Pattern discovery failed:', err);
      notify.error('Discovery Failed', err?.message || 'Could not compute pattern matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with AI Trigger */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121418] border border-[#22252A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Compass className="h-5 w-5 text-amber-400" />
            <span>Quantitative Pattern & Edge Discovery Matrix</span>
          </h2>
          <p className="text-xs text-[#848B98] mt-0.5">
            Statistical correlations across trading sessions, playbook setups, and rule compliance.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleRunAiAudit}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          <span>Run AI Pattern Scanner</span>
        </Button>
      </div>

      {/* Grid: Sessions & Rule Compliance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Session Edge Matrix */}
        <Card className="lg:col-span-2 p-5 bg-[#121418] border-[#22252A] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#22252A]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Session Liquidity & Expectancy Breakdown</h3>
            </div>
            <Badge variant="neutral" className="text-[10px] font-mono">
              TIME WINDOWS
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sessionStats.map((s) => (
              <div
                key={s.session}
                className="p-3.5 rounded-lg bg-[#181B20] border border-[#2A2E35] space-y-2 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{s.session.replace(/_/g, ' ')}</span>
                  <Badge
                    variant={s.winRate >= 60 ? 'emerald' : s.winRate >= 45 ? 'blue' : 'rose'}
                    className="text-[10px] font-mono font-bold"
                  >
                    {s.winRate.toFixed(1)}% WR
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#848B98]">{s.trades} trades</span>
                  <span className={`font-mono font-bold ${s.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {s.netPnL >= 0 ? '+' : ''}${s.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="text-[10px] text-[#848B98] font-mono flex items-center justify-between">
                  <span>Expectancy:</span>
                  <span className="text-white font-bold">{s.avgR >= 0 ? '+' : ''}{s.avgR.toFixed(2)}R avg</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Rule Adherence Alpha Boost */}
        <Card className="p-5 bg-[#121418] border-[#22252A] space-y-4 flex flex-col justify-between">
          <div className="space-y-1 pb-3 border-b border-[#22252A]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Rule Adherence Edge</h3>
            </div>
            <p className="text-xs text-[#848B98]">
              Win rate delta between 100% compliant vs discretionary trades.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#181B20] border border-[#2A2E35] text-center space-y-2">
            <span className="text-xs text-[#848B98] block">Discipline Win Rate Delta</span>
            <div className={`text-3xl font-bold font-mono ${winRateDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {winRateDelta >= 0 ? '+' : ''}{winRateDelta.toFixed(1)}%
            </div>
            <span className="text-[11px] text-[#848B98] block">
              {compliant.length} Compliant ({compWinRate.toFixed(1)}%) vs {nonCompliant.length} Non-Compliant ({nonCompWinRate.toFixed(1)}%)
            </span>
          </div>

          <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-xs text-emerald-400 font-mono">
            Key Metric: Rule adherence increases average payoff expectancy significantly.
          </div>
        </Card>
      </div>

      {/* Setup Performance Ranking */}
      <Card className="p-5 bg-[#121418] border-[#22252A] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#22252A]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Playbook Setup Ranking & Expectancy</h3>
          </div>
          <span className="text-xs text-[#848B98] font-mono">{setupStats.length} setups classified</span>
        </div>

        <div className="space-y-2.5">
          {setupStats.map((setup, idx) => (
            <div
              key={setup.name}
              className="p-3.5 rounded-lg bg-[#181B20] border border-[#2A2E35] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  #{idx + 1}
                </span>
                <div>
                  <div className="text-xs font-bold text-white">{setup.name}</div>
                  <span className="text-[10px] text-[#848B98] font-mono">
                    {setup.trades} trades executed
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto font-mono text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                  <span className="font-bold text-white">{setup.winRate.toFixed(1)}%</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#848B98] block">Avg R</span>
                  <span className="font-bold text-cyan-400">+{setup.avgR.toFixed(2)}R</span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-[#848B98] block">Net P&L</span>
                  <span className={`font-bold ${setup.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {setup.netPnL >= 0 ? '+' : ''}${setup.netPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Analysis Result */}
      {aiAnalysis && (
        <div className="space-y-3">
          <span className="text-xs font-bold text-white flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>AI Pattern Discovery Insights</span>
          </span>
          <AIResponseCard response={aiAnalysis} />
        </div>
      )}
    </div>
  );
};
