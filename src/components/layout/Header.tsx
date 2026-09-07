import React, { useState } from 'react';
import { 
  ChevronDown, 
  Plus, 
  Search, 
  Command, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  User as UserIcon, 
  Layers, 
  Wallet,
  CheckCircle2,
  Bell,
  Sun,
  Moon,
  Briefcase,
  Menu,
  Sliders
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { formatCurrency } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NotificationDropdown } from '../ui/NotificationDropdown';
import { OfflineIndicator } from '../pwa/OfflineIndicator';
import { PWAInstallButton } from '../pwa/PWAInstallButton';

interface HeaderProps {
  onOpenNewAccountModal: () => void;
  onOpenNewTradeModal: () => void;
  onOpenCommandPalette: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewAccountModal,
  onOpenNewTradeModal,
  onOpenCommandPalette,
  onToggleMobileMenu,
}) => {
  const { 
    accounts, 
    selectedAccountId, 
    selectedAccount, 
    setSelectedAccountId, 
    resetToSampleData 
  } = useTradeOS();
  
  const {
    currentUser,
    isDemoMode,
    signOut,
    toggleDemoMode,
    openAuthModal,
    openProfileModal,
    openWorkspaceModal,
    activeWorkspace,
    workspaces,
    setActiveWorkspaceId,
  } = useAuth();

  const { theme, resolvedTheme, toggleTheme } = useTheme();
  const { unreadCount } = useNotification();
  
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const getAccountTypeBadge = (type?: string) => {
    if (!type) return null;
    if (type.startsWith('PROP_EVALUATION')) return <Badge variant="amber" size="sm">EVALUATION</Badge>;
    if (type.startsWith('PROP_FUNDED')) return <Badge variant="emerald" size="sm">FUNDED</Badge>;
    if (type === 'PERSONAL_LIVE') return <Badge variant="blue" size="sm">LIVE</Badge>;
    if (type === 'BACKTEST') return <Badge variant="purple" size="sm">BACKTEST</Badge>;
    return <Badge variant="zinc" size="sm">{type.replace('_', ' ')}</Badge>;
  };

  return (
    <header className="h-14 border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F]/90 dark:bg-[#0C0D0F]/90 light:bg-white/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between gap-3 z-20 select-none">
      {/* Left: Mobile hamburger & Account/Workspace Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="p-1.5 rounded-lg text-[#848B98] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] md:hidden cursor-pointer"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Account & Workspace Selector Button */}
        <div className="relative">
          <button
            onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
            className="flex items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#15171A] dark:bg-[#15171A] light:bg-[#F9FAFB] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#D1D5DB] transition-colors text-left cursor-pointer"
          >
            <Wallet className="h-4 w-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-semibold text-white dark:text-white light:text-[#111827] max-w-[120px] sm:max-w-[180px] truncate">
                  {selectedAccountId === 'ALL' ? 'All Accounts (Consolidated)' : selectedAccount?.name || 'Select Account'}
                </span>
                {selectedAccount && <span className="hidden sm:inline">{getAccountTypeBadge(selectedAccount.accountType)}</span>}
              </div>
              {selectedAccount && (
                <span className="text-[11px] font-mono font-medium text-emerald-400">
                  {formatCurrency(selectedAccount.currentBalance, selectedAccount.currency)}
                </span>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#848B98] shrink-0 ml-0.5 sm:ml-1" />
          </button>

          {/* Account & Workspace Switcher Dropdown */}
          {isAccountMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsAccountMenuOpen(false)} 
              />
              <div className="absolute left-0 mt-1.5 w-80 rounded-xl border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#E5E7EB] bg-[#15171A] dark:bg-[#15171A] light:bg-white shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Workspaces Section */}
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#848B98] dark:text-[#848B98] light:text-[#6B7280] flex items-center justify-between border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB]">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3 w-3 text-emerald-400" />
                    Trading Desk / Workspace
                  </span>
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      openWorkspaceModal();
                    }}
                    className="text-emerald-400 hover:underline cursor-pointer text-[10px]"
                  >
                    Manage
                  </button>
                </div>

                <div className="py-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      onClick={() => {
                        setActiveWorkspaceId(ws.id);
                        setIsAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                        ws.id === activeWorkspace?.id
                          ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 font-medium'
                          : 'text-[#9CA3AF] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] hover:text-white dark:hover:text-white light:hover:text-[#111827]'
                      }`}
                    >
                      <span className="truncate">{ws.name}</span>
                      {ws.id === activeWorkspace?.id && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Accounts Section */}
                <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#848B98] dark:text-[#848B98] light:text-[#6B7280] flex items-center justify-between border-t border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] mt-1">
                  <span>Trading Accounts</span>
                  <span className="text-[10px] text-[#606773] font-mono">{accounts.length} total</span>
                </div>

                <div className="space-y-0.5 max-h-48 overflow-y-auto pt-1">
                  {/* Consolidated View Option */}
                  <button
                    onClick={() => {
                      setSelectedAccountId('ALL');
                      setIsAccountMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                      selectedAccountId === 'ALL' 
                        ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 font-medium' 
                        : 'text-[#9CA3AF] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] hover:text-white dark:hover:text-white light:hover:text-[#111827]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="h-3.5 w-3.5 text-emerald-400" />
                      <span>All Accounts (Consolidated)</span>
                    </div>
                    {selectedAccountId === 'ALL' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                  </button>

                  {/* Individual Accounts */}
                  {accounts.map(acc => (
                    <button
                      key={acc.id}
                      onClick={() => {
                        setSelectedAccountId(acc.id);
                        setIsAccountMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left cursor-pointer transition-colors ${
                        selectedAccountId === acc.id 
                          ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 font-medium' 
                          : 'text-[#9CA3AF] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] hover:text-white dark:hover:text-white light:hover:text-[#111827]'
                      }`}
                    >
                      <div className="flex flex-col truncate pr-2">
                        <span className="truncate font-medium text-white dark:text-white light:text-[#111827]">{acc.name}</span>
                        <span className="text-[10px] text-[#606773] dark:text-[#606773] light:text-[#9CA3AF] font-mono">
                          {acc.broker} • {acc.currency}
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-mono text-emerald-400 font-medium">
                          {formatCurrency(acc.currentBalance, acc.currency)}
                        </span>
                        {getAccountTypeBadge(acc.accountType)}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="border-t border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] mt-1 pt-1">
                  <button
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenNewAccountModal();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 cursor-pointer transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Create New Trading Account...</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Middle: Command Palette Quick Search */}
      <div className="flex-1 max-w-md hidden lg:flex items-center">
        <button
          onClick={onOpenCommandPalette}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#15171A] dark:bg-[#15171A] light:bg-[#F9FAFB] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] border border-[#22252A] dark:border-[#22252A] light:border-[#D1D5DB] text-xs text-[#848B98] dark:text-[#848B98] light:text-[#4B5563] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-[#606773]" />
            <span>Search trades, accounts, strategies, metrics...</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px] bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-[#E5E7EB] px-1.5 py-0.5 rounded text-[#848B98] dark:text-[#848B98] light:text-[#4B5563] border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#D1D5DB]">
            <Command className="h-3 w-3" />
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Actions, Notifications, Theme, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Offline & Sync Status Pill */}
        <OfflineIndicator mode="header-badge" />

        {/* PWA Install Button (shows when installable) */}
        <PWAInstallButton variant="compact" />

        {/* Quick Log Trade Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenNewTradeModal}
          className="shadow-xs font-semibold shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Log Trade</span>
        </Button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-[#848B98] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#15171A] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] border border-transparent hover:border-[#2A2E35] transition-colors cursor-pointer"
          title={`Theme: ${theme} (Click to toggle)`}
          aria-label="Toggle dark/light theme"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-blue-500" />
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="p-2 rounded-lg text-[#848B98] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#15171A] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] border border-transparent hover:border-[#2A2E35] transition-colors cursor-pointer relative"
            aria-label="View notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
          />
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-lg hover:bg-[#15171A] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer border border-transparent hover:border-[#2A2E35]"
          >
            <div className="h-7 w-7 rounded-lg bg-[#1A1D21] dark:bg-[#1A1D21] light:bg-[#E5E7EB] border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#D1D5DB] flex items-center justify-center font-bold text-xs text-emerald-400">
              {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="text-xs font-medium hidden md:inline max-w-[90px] truncate text-white dark:text-white light:text-[#111827]">
              {currentUser?.displayName || 'Trader'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#606773]" />
          </button>

          {isUserMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsUserMenuOpen(false)} 
              />
              <div className="absolute right-0 mt-1.5 w-64 rounded-xl border border-[#2A2E35] dark:border-[#2A2E35] light:border-[#E5E7EB] bg-[#15171A] dark:bg-[#15171A] light:bg-white shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-2 border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB]">
                  <p className="text-xs font-semibold text-white dark:text-white light:text-[#111827] truncate">
                    {currentUser?.displayName}
                  </p>
                  <p className="text-[11px] text-[#848B98] truncate font-mono">
                    {currentUser?.email}
                  </p>
                  <div className="mt-1">
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {isDemoMode ? 'SANDBOX DEMO' : 'ISOLATED TENANT'}
                    </span>
                  </div>
                </div>

                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openProfileModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] text-left cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5 text-[#848B98]" />
                    <span>Trader Profile & Preferences</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openWorkspaceModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] text-left cursor-pointer"
                  >
                    <Briefcase className="h-3.5 w-3.5 text-[#848B98]" />
                    <span>Switch Trading Desk / Workspace</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      openAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] text-left cursor-pointer"
                  >
                    <UserIcon className="h-3.5 w-3.5 text-[#848B98]" />
                    <span>Switch User / Account</span>
                  </button>

                  <button
                    onClick={() => {
                      toggleDemoMode(!isDemoMode);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] text-left cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                    <span>{isDemoMode ? 'Exit Demo Mode' : 'Enter Demo Mode'}</span>
                  </button>
                </div>

                <div className="border-t border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] pt-1">
                  <button
                    onClick={() => {
                      signOut();
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 text-left cursor-pointer font-medium"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out Session</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
