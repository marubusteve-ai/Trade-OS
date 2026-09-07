import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Plus, 
  Wallet, 
  BookOpen, 
  LayoutDashboard, 
  FlaskConical, 
  Layers, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Brain,
  Smile,
  Zap,
  X
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { useSync } from '../../context/SyncContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { formatCurrency } from '../../lib/utils';
import { Smartphone, RefreshCw, Wifi, Cable, Shield } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewAccountModal: () => void;
  onOpenNewTradeModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewAccountModal,
  onOpenNewTradeModal,
}) => {
  const { 
    accounts, 
    setSelectedAccountId, 
    setActiveTab, 
    trades, 
    resetToSampleData 
  } = useTradeOS();
  const { toggleDemoMode, isDemoMode } = useAuth();
  const { openSyncModal, syncNow, syncState } = useSync();
  const { isInstallable, install } = usePWAInstall();
  
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredAccounts = accounts.filter(a => 
    a.name.toLowerCase().includes(query.toLowerCase()) || 
    a.broker.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTrades = trades.filter(t => 
    t.instrument.toLowerCase().includes(query.toLowerCase()) || 
    (t.strategyName && t.strategyName.toLowerCase().includes(query.toLowerCase()))
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 animate-in fade-in duration-100">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Palette Container */}
      <div className="relative w-full max-w-xl rounded-xl border border-[#2A2E35] bg-[#15171A] shadow-2xl overflow-hidden z-10 text-[#F3F4F6] flex flex-col">
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-[#22252A] bg-[#0C0D0F]">
          <Search className="h-4 w-4 text-[#848B98] shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search accounts, trades, actions..."
            className="h-12 w-full bg-transparent text-sm text-[#F3F4F6] placeholder:text-[#606773] focus:outline-none font-sans"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded text-[#848B98] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Actions */}
          <div>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#848B98]">
              Quick Actions
            </div>
            <div className="space-y-0.5 mt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewTradeModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Log New Trade Execution</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Create Trade</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenNewAccountModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="h-4 w-4 text-blue-400" />
                  <span className="font-medium">Create New Trading Account</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">New Account</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('psychology');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Smile className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">Log Mindset Check-in / Psychology Hub</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Psychology</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('automation');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span className="font-medium">Automation & Notification Guardrails</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Automation</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  openSyncModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <RefreshCw className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Offline Sync Queue & Status Inspector</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">
                  {syncState.pendingCount > 0 ? `${syncState.pendingCount} Pending` : 'Synced'}
                </span>
              </button>

              {isInstallable && (
                <button
                  onClick={() => {
                    onClose();
                    install();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="h-4 w-4 text-purple-400" />
                    <span className="font-medium">Install TradeOS Native Desktop/Mobile App</span>
                  </div>
                  <span className="text-[10px] text-purple-400 font-mono">PWA App</span>
                </button>
              )}

              <button
                onClick={() => {
                  setActiveTab('integrations');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Cable className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Integrations & External Adapters</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Brokers & Webhooks</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('audit');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium">Audit Trail & Security Telemetry</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Logs & Integrity</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('tests');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  <span className="font-medium">Run QA Test Suite (Verification)</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Tests</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('architecture');
                  onClose();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span className="font-medium">View System Architecture & Domain Model</span>
                </div>
                <span className="text-[10px] text-[#606773] font-mono">Docs</span>
              </button>
            </div>
          </div>

          {/* Accounts */}
          {filteredAccounts.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#848B98]">
                Switch Account
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredAccounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setActiveTab('dashboard');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className="h-3.5 w-3.5 text-[#848B98]" />
                      <span className="font-medium">{acc.name}</span>
                      <span className="text-[10px] text-[#606773] font-mono">{acc.broker}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-medium">
                      {formatCurrency(acc.currentBalance, acc.currency)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Matching Trades */}
          {query.trim().length > 0 && filteredTrades.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#848B98]">
                Matching Trades
              </div>
              <div className="space-y-0.5 mt-1">
                {filteredTrades.map(tr => (
                  <button
                    key={tr.id}
                    onClick={() => {
                      setActiveTab('trades');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-[#D1D5DB] hover:bg-[#1A1D21] hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-white">{tr.instrument}</span>
                      <span className={tr.direction === 'LONG' ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                        {tr.direction}
                      </span>
                      {tr.strategyName && (
                        <span className="text-[#606773] text-[11px] truncate max-w-[150px]">
                          • {tr.strategyName}
                        </span>
                      )}
                    </div>
                    <span className={`font-mono font-medium ${tr.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(tr.netPnL)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-[#22252A] bg-[#0C0D0F] flex items-center justify-between text-[11px] text-[#606773] font-mono">
          <span>Navigation: ↑ ↓ to navigate, ESC to close</span>
          <span className="text-emerald-400">TradeOS Engine</span>
        </div>
      </div>
    </div>
  );
};
