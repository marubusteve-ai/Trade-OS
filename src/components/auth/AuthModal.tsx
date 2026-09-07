/**
 * Authentication Modal
 * Supports Sign In, Sign Up, and 1-click Pro Demo Trader
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Sparkles, Shield, User, Mail, ArrowRight, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp, toggleDemoMode, currentUser } = useAuth();
  const { notify } = useNotification();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setError('Please enter your trader display name.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, displayName || undefined);
        notify.success('Session Authenticated', `Welcome back, ${email}`);
      } else {
        await signUp(email, displayName);
        notify.success('Account Created', `Welcome to TradeOS, ${displayName}!`);
      }
      closeAuthModal();
      setEmail('');
      setDisplayName('');
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = () => {
    toggleDemoMode(true);
    notify.info('Demo Mode Active', 'Loaded pre-configured funded evaluation and sample journal data.');
    closeAuthModal();
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
      title={currentUser ? 'Switch Trader Account' : 'Authenticate Session'}
      description="Secure local multi-tenant storage with zero cross-tenant data leakage."
      maxWidth="md"
    >
      <div className="space-y-5 py-1">
        {/* Auth Mode Tabs */}
        <div className="grid grid-cols-2 p-1 bg-[#0C0D0F] rounded-lg border border-[#22252A]">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'signin'
                ? 'bg-[#1A1D21] text-white shadow-xs border border-[#2A2E35]'
                : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-[#1A1D21] text-white shadow-xs border border-[#2A2E35]'
                : 'text-[#848B98] hover:text-[#D1D5DB]'
            }`}
          >
            Create New Account
          </button>
        </div>

        {/* Demo Fast Access Option */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-300">1-Click Pro Demo Trader</h4>
              <p className="text-[11px] text-[#848B98]">Pre-loaded with prop accounts & verified trades</p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDemoLogin}
            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/15"
          >
            Explore Demo
          </Button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="w-full border-t border-[#22252A]"></div>
          <span className="absolute bg-[#15171A] px-3 text-[10px] font-mono uppercase text-[#606773]">
            Or Private Workspace
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'signup' && (
            <Input
              label="Trader Display Name"
              placeholder="e.g., Sarah Chen (Alpha Trader)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              prefixElement={<User className="h-3.5 w-3.5 text-[#848B98]" />}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="trader@quantdesk.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            prefixElement={<Mail className="h-3.5 w-3.5 text-[#848B98]" />}
            helperText="Used as your isolated tenant partition key."
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full font-semibold shadow-xs"
            >
              <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Isolated Account'}</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#606773]">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span>Local storage multi-tenant data encryption active</span>
        </div>
      </div>
    </Modal>
  );
};
