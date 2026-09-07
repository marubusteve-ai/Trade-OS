/**
 * TradeOS AI Quantitative Intelligence & Coaching Hub
 * 
 * Central operating cockpit integrating:
 * 1. Conversational AI Coach with preset inquiry chips
 * 2. 12-Module Structured Audit Studio
 * 3. Mistake & Execution Leakage Diagnostic
 * 4. Multidimensional Pattern & Edge Matrix
 * 5. Review History Ledger & Saved Insights
 */

import React, { useState } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { AICoachChat } from './AICoachChat';
import { AIAuditPanel } from './AIAuditPanel';
import { AIMistakeDiagnostic } from './AIMistakeDiagnostic';
import { AIPatternMatrix } from './AIPatternMatrix';
import { AIReviewHistory } from './AIReviewHistory';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { NetworkRequirementBadge } from '../pwa/NetworkRequirementBadge';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import {
  Sparkles,
  Bot,
  Layers,
  AlertTriangle,
  Compass,
  History,
  ShieldCheck,
  Cpu,
  Zap,
  WifiOff,
} from 'lucide-react';

type AITab = 'COACH' | 'AUDIT_STUDIO' | 'MISTAKES' | 'PATTERNS' | 'HISTORY';

export const AIView: React.FC = () => {
  const { accounts, selectedAccountId, setSelectedAccountId, trades, selectedAccountTrades } = useTradeOS();
  const [activeTab, setActiveTab] = useState<AITab>('COACH');
  const { isOnline } = useOnlineStatus();

  const activeTrades = selectedAccountId === 'ALL' ? trades : selectedAccountTrades;
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#22252A]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>TradeOS AI Intelligence</span>
            </h1>
            <Badge variant="purple" className="flex items-center gap-1 font-mono text-[10px]">
              <Sparkles className="h-3 w-3" />
              GEMINI 3.8 FLASH
            </Badge>
            <Badge variant="emerald" className="font-mono text-[10px]">
              GROUNDED DATA ENGINE
            </Badge>
            <NetworkRequirementBadge />
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Deterministic quantitative trade reviews, behavioral mistake diagnosis, and disciplined performance coaching.
          </p>
        </div>

        {/* Global Account Context Selector */}
        <div className="flex items-center gap-2 self-start lg:self-auto">
          <div className="flex items-center gap-1.5 text-xs text-[#848B98]">
            <Layers className="h-3.5 w-3.5" />
            <span>Scope:</span>
          </div>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#121418] border border-[#2A2E35] rounded-lg text-white font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Accounts ({trades.length} trades)</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.accountNumber})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Offline Alert Warning */}
      {!isOnline && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-200">
          <WifiOff className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-semibold text-amber-300">Offline Workstation Active: AI Model Generation Paused</p>
            <p className="text-amber-200/80">
              Gemini AI interactive coaching and real-time generation require an active network connection. All your trade logs, local math metrics, risk calculations, and offline mutations remain fully available and will synchronize once your internet connection is restored.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-[#22252A]">
        <button
          onClick={() => setActiveTab('COACH')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'COACH'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
              : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#181B20]'
          }`}
        >
          <Bot className="h-4 w-4" />
          <span>AI Coach & Q&A</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_STUDIO')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'AUDIT_STUDIO'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
              : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#181B20]'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          <span>Audit Studio (12 Modules)</span>
        </button>

        <button
          onClick={() => setActiveTab('MISTAKES')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'MISTAKES'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
              : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#181B20]'
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>Mistakes & Leakage</span>
        </button>

        <button
          onClick={() => setActiveTab('PATTERNS')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'PATTERNS'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
              : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#181B20]'
          }`}
        >
          <Compass className="h-4 w-4 text-amber-400" />
          <span>Pattern & Edge Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'HISTORY'
              ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40'
              : 'text-[#848B98] hover:text-[#D1D5DB] hover:bg-[#181B20]'
          }`}
        >
          <History className="h-4 w-4 text-cyan-400" />
          <span>Review History Ledger</span>
        </button>
      </div>

      {/* Main Tab View Contents */}
      {activeTab === 'COACH' && <AICoachChat />}
      {activeTab === 'AUDIT_STUDIO' && <AIAuditPanel />}
      {activeTab === 'MISTAKES' && <AIMistakeDiagnostic />}
      {activeTab === 'PATTERNS' && <AIPatternMatrix />}
      {activeTab === 'HISTORY' && <AIReviewHistory />}
    </div>
  );
};
