/**
 * Playbooks Module View
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { BookOpen, Plus, CheckSquare, ShieldCheck, Zap } from 'lucide-react';

export const PlaybooksView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Execution Playbooks & Checklists
            </h1>
            <Badge variant="emerald">EXECUTION ENGINE</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Standardized execution rules, trade entry checklists, and invalidation frameworks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Playbook Template
          </Button>
        </div>
      </div>

      {/* Playbook Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <Card hoverEffect className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">ICT Silver Bullet 10AM</h3>
                <span className="text-[10px] text-[#848B98] font-mono">NQ Futures & FX</span>
              </div>
            </div>
            <Badge variant="emerald">VERIFIED</Badge>
          </div>

          <p className="text-xs text-[#848B98] leading-relaxed">
            Time-based liquidity sweep into Fair Value Gap (FVG) with market structure shift on the 1m/5m timeframe during NY AM session.
          </p>

          <div className="space-y-1.5 bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A] text-xs">
            <div className="text-[11px] font-semibold text-[#D1D5DB] flex items-center gap-1.5 mb-1">
              <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
              <span>Mandatory Checklist Items</span>
            </div>
            <div className="text-[#848B98] space-y-1">
              <p>✓ Sweep of Asian or London session high/low</p>
              <p>✓ Displacement creating clear 5m FVG</p>
              <p>✓ Risk defined strictly at swing high/low</p>
              <p>✓ Min R:R = 2.0</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Opening Range Breakout (ORB)</h3>
                <span className="text-[10px] text-[#848B98] font-mono">ES / NQ 15-Min</span>
              </div>
            </div>
            <Badge variant="neutral">STANDARD</Badge>
          </div>

          <p className="text-xs text-[#848B98] leading-relaxed">
            Breakout from the initial 15-minute cash session range with volume confirmation and retest of the range boundary.
          </p>

          <div className="space-y-1.5 bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A] text-xs">
            <div className="text-[11px] font-semibold text-[#D1D5DB] flex items-center gap-1.5 mb-1">
              <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
              <span>Mandatory Checklist Items</span>
            </div>
            <div className="text-[#848B98] space-y-1">
              <p>✓ Initial 15m range is within ATR bounds</p>
              <p>✓ Volume expansion on candle close outside range</p>
              <p>✓ Trail stop to break-even at 1R target</p>
            </div>
          </div>
        </Card>

        <Card hoverEffect className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mean Reversion VWAP Band</h3>
                <span className="text-[10px] text-[#848B98] font-mono">Equities & Crypto</span>
              </div>
            </div>
            <Badge variant="neutral">CONTRARIAN</Badge>
          </div>

          <p className="text-xs text-[#848B98] leading-relaxed">
            Standard deviation 2.5σ stretch from session Volume Weighted Average Price with RSI divergence and reversal volume taper.
          </p>

          <div className="space-y-1.5 bg-[#0C0D0F] p-3 rounded-lg border border-[#22252A] text-xs">
            <div className="text-[11px] font-semibold text-[#D1D5DB] flex items-center gap-1.5 mb-1">
              <CheckSquare className="h-3.5 w-3.5 text-purple-400" />
              <span>Mandatory Checklist Items</span>
            </div>
            <div className="text-[#848B98] space-y-1">
              <p>✓ Price touches 2.5σ lower/upper VWAP band</p>
              <p>✓ Multi-timeframe trend context alignment</p>
              <p>✓ Invalidation immediate on band expansion</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
