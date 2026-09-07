import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cpu, 
  Clock, 
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency, formatPercent } from '../../lib/utils';

export const StatusBar: React.FC = () => {
  const { selectedAccount, metrics, trades, selectedAccountId } = useTradeOS();
  const { activeWorkspace, isDemoMode } = useAuth();
  const { resolvedTheme } = useTheme();
  const [timeUtc, setTimeUtc] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(now.toUTCString().split(' ')[4] + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="h-7 border-t border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-[#F9FAFB] px-3 flex items-center justify-between text-[11px] font-mono text-[#848B98] dark:text-[#848B98] light:text-[#6B7280] select-none z-20 overflow-x-auto shrink-0">
      {/* Left: Engine & Database State */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <Cpu className="h-3 w-3" />
          <span className="text-[10px]">QUANT_ENGINE: 2.4.0</span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-[#848B98]">
          <Database className="h-3 w-3 text-[#606773]" />
          <span className="text-[10px]">ISOLATED_STORAGE: READY</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-[#848B98]">
          <Briefcase className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] truncate max-w-[120px]">
            DESK: {activeWorkspace?.name || 'PRIMARY'}
          </span>
        </div>
      </div>

      {/* Right: Active Quantitative Highlights & Time */}
      <div className="flex items-center gap-4 shrink-0">
        {selectedAccount && (
          <div className="flex items-center gap-2">
            <span className="text-[#606773]">EQUITY:</span>
            <span className="font-semibold text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827]">
              {formatCurrency(selectedAccount.equity, selectedAccount.currency)}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-[#606773]">P&L:</span>
          <span
            className={`font-semibold ${
              (metrics?.netPnL || 0) > 0
                ? 'text-emerald-400'
                : (metrics?.netPnL || 0) < 0
                ? 'text-rose-400'
                : 'text-[#848B98]'
            }`}
          >
            {(metrics?.netPnL || 0) >= 0 ? '+' : ''}${Number(metrics?.netPnL || 0).toFixed(2)} ({formatPercent(metrics?.netReturnPercent || 0)})
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-2">
          <span className="text-[#606773]">WIN_RATE:</span>
          <span className="font-semibold text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827]">
            {formatPercent(metrics?.winRate || 0)}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[#606773] dark:text-[#606773] light:text-[#9CA3AF]">
          <Clock className="h-3 w-3" />
          <span>{timeUtc}</span>
        </div>
      </div>
    </footer>
  );
};
