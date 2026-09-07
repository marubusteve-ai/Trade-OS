/**
 * Strategies Module View
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { useTradeOS } from '../../context/TradeOSContext';
import { Target, Plus, TrendingUp, Compass, ArrowUpRight } from 'lucide-react';

export const StrategiesView: React.FC = () => {
  const { strategies, trades, selectedAccountTrades } = useTradeOS();
  const [filterType, setFilterType] = useState<string>('ALL');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Strategy Repository & Edge Framework
            </h1>
            <Badge variant="emerald">CORE DOMAIN</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Systematic edge models, statistical expectancy distributions, and setup tagging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Define Strategy
          </Button>
        </div>
      </div>

      {/* Strategies Grid or Empty State */}
      {strategies.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No Strategies Defined"
          description="Register your trading strategies (e.g. ICT Silver Bullet, Opening Range Breakout, Mean Reversion) to track per-setup expectancy and statistical win rate."
          actionText="Create First Strategy"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategies.map((strat) => {
            const stratTrades = selectedAccountTrades.filter(t => t.strategyId === strat.id);
            const winTrades = stratTrades.filter(t => (t.netPnL || 0) > 0).length;
            const winRate = stratTrades.length > 0 ? (winTrades / stratTrades.length) * 100 : 0;
            const totalPnL = stratTrades.reduce((sum, t) => sum + (t.netPnL || 0), 0);

            return (
              <Card key={strat.id} hoverEffect className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{strat.name}</h3>
                      <p className="text-[11px] text-[#848B98] mt-0.5 line-clamp-2">{strat.description || 'Systematic rule set'}</p>
                    </div>
                    <Badge variant={strat.isArchived ? 'neutral' : 'emerald'}>
                      {strat.isArchived ? 'ARCHIVED' : 'ACTIVE'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-center font-mono">
                    <div>
                      <span className="text-[10px] text-[#848B98] block">Trades</span>
                      <span className="text-xs font-bold text-white">{stratTrades.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                      <span className={`text-xs font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {Number(winRate || 0).toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#848B98] block">Net P&L</span>
                      <span className={`text-xs font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${Number(totalPnL || 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#22252A] flex items-center justify-between text-xs text-[#848B98]">
                  <span>Target R:R: <strong className="text-[#D1D5DB]">1 : 2.5</strong></span>
                  <span className="flex items-center text-emerald-400 font-medium">
                    Playbook Linked <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edge Architecture Reference Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-400" />
            <span>Statistical Edge Architecture Specification</span>
          </CardTitle>
          <CardDescription>
            Deterministic relationship between Strategy definition, Playbook checklists, and Trade execution logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
              <span className="font-bold text-white block">1. Strategy Definition</span>
              <p className="text-[#848B98]">Defines entry condition, exit rules, invalidation level, time windows, and target asset classes.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
              <span className="font-bold text-white block">2. Playbook Checklist</span>
              <p className="text-[#848B98]">Requires interactive pre-trade checklist verification before entry to eliminate emotional deviation.</p>
            </div>
            <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1">
              <span className="font-bold text-white block">3. Performance Tagging</span>
              <p className="text-[#848B98]">Calculates edge expectancy: Expectancy = (Win% × Avg Win) - (Loss% × Avg Loss).</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
