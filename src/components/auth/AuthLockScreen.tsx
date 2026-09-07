/**
 * Auth Lock Screen
 * Displayed when user logs out or is unauthenticated to enforce protected routing.
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Shield, Sparkles, LogIn, TrendingUp, Cpu, Lock } from 'lucide-react';

export const AuthLockScreen: React.FC = () => {
  const { openAuthModal, toggleDemoMode } = useAuth();

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-[#0C0D0F] text-[#F3F4F6] select-none">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl bg-[#15171A] border border-[#22252A] shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/40">
          <TrendingUp className="h-7 w-7" />
        </div>

        {/* Title & Tagline */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">TradeOS</h1>
            <Badge variant="emerald">CORE v1.0</Badge>
          </div>
          <p className="text-xs text-[#848B98] leading-relaxed">
            Quantitative Trading Journal & Deterministic Risk OS. Please authenticate to access your private trading desk and performance analytics.
          </p>
        </div>

        {/* Feature Security Pills */}
        <div className="grid grid-cols-2 gap-2 text-left text-xs bg-[#0C0D0F] p-3 rounded-xl border border-[#22252A]">
          <div className="flex items-center gap-2 text-[#D1D5DB]">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Multi-Tenant Isolated</span>
          </div>
          <div className="flex items-center gap-2 text-[#D1D5DB]">
            <Cpu className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Deterministic Math</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={openAuthModal}
            className="w-full font-semibold shadow-xs"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In / Create Account
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={() => toggleDemoMode(true)}
            className="w-full border-[#2A2E35] text-[#D1D5DB] hover:text-white"
          >
            <Sparkles className="h-4 w-4 mr-2 text-amber-400" />
            Explore as Pro Demo Trader
          </Button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#606773] pt-2">
          <Lock className="h-3 w-3" />
          <span>Protected Route Architecture Active</span>
        </div>
      </div>
    </div>
  );
};
