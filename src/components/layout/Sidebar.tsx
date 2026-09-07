import React from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  BookOpen, 
  Target, 
  ShieldAlert, 
  Award, 
  BrainCircuit, 
  BarChart3, 
  Settings, 
  Layers, 
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BookMarked,
  FileText,
  Sparkles,
  UploadCloud,
  Zap,
  Cable,
  Shield,
  X
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { OfflineIndicator } from '../pwa/OfflineIndicator';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  setIsMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen = false,
  setIsMobileOpen,
}) => {
  const { activeTab, setActiveTab, accounts, trades, strategies } = useTradeOS();
  const { activeWorkspace } = useAuth();

  const coreModules = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: Wallet,
      badge: accounts.length.toString(),
    },
    {
      id: 'trades',
      label: 'Trades & Journal',
      icon: BookOpen,
      badge: trades.length.toString(),
    },
    {
      id: 'strategies',
      label: 'Strategies & Setups',
      icon: Target,
      badge: strategies.length > 0 ? strategies.length.toString() : null,
    },
    {
      id: 'playbooks',
      label: 'Execution Playbooks',
      icon: BookMarked,
      badge: null,
    },
    {
      id: 'risk',
      label: 'Risk & Exposure',
      icon: ShieldAlert,
      badge: null,
    },
    {
      id: 'prop-firms',
      label: 'Prop Compliance',
      icon: Award,
      badge: accounts.some(a => a?.accountType?.startsWith('PROP')) ? 'RULES' : null,
    },
    {
      id: 'analytics',
      label: 'Quant Analytics',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'psychology',
      label: 'Psychology & Tilt',
      icon: BrainCircuit,
      badge: null,
    },
    {
      id: 'reports',
      label: 'Reports & Statements',
      icon: FileText,
      badge: null,
    },
    {
      id: 'import-export',
      label: 'Import / Export Engine',
      icon: UploadCloud,
      badge: 'CSV',
    },
    {
      id: 'ai',
      label: 'AI Copilot & Audits',
      icon: Sparkles,
      badge: 'AI',
      highlightBadge: true,
    },
    {
      id: 'automation',
      label: 'Automation & Guardrails',
      icon: Zap,
      badge: 'RULES',
    },
    {
      id: 'integrations',
      label: 'Integrations & Adapters',
      icon: Cable,
      badge: 'ADAPTERS',
    },
    {
      id: 'audit',
      label: 'Audit & Telemetry',
      icon: Shield,
      badge: 'LOGS',
    },
    {
      id: 'settings',
      label: 'Settings & Storage',
      icon: Settings,
      badge: null,
    },
  ];

  const systemTools = [
    {
      id: 'tests',
      label: 'QA Test Suite',
      icon: FlaskConical,
      badge: 'VERIFIED',
      highlightBadge: true,
    },
    {
      id: 'architecture',
      label: 'Architecture Spec',
      icon: Layers,
      badge: 'SPEC',
    },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (setIsMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-white text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827]">
      {/* Brand & Header */}
      <div className="flex h-14 items-center justify-between px-3.5 border-b border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold shadow-xs">
            <TrendingUp className="h-4 w-4" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-white dark:text-white light:text-[#111827] flex items-center gap-1.5">
                TradeOS
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1A1D21] dark:bg-[#1A1D21] light:bg-[#F3F4F6] text-emerald-400 border border-emerald-500/20">
                  CORE
                </span>
              </span>
              <span className="text-[10px] text-[#848B98] font-medium tracking-wide uppercase truncate max-w-[130px]">
                {activeWorkspace?.name || 'Trading Desk'}
              </span>
            </div>
          )}
        </div>

        {/* Mobile close button or Desktop collapse toggle */}
        {isMobileOpen ? (
          <button
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
            className="p-1.5 rounded-md text-[#848B98] hover:text-white hover:bg-[#1A1D21] transition-colors md:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 rounded-md text-[#848B98] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#1A1D21] dark:hover:bg-[#1A1D21] light:hover:bg-[#F3F4F6] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
        <div>
          {(!isCollapsed || isMobileOpen) && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#848B98] dark:text-[#848B98] light:text-[#6B7280]">
              Application Modules
            </p>
          )}
          <nav className="space-y-0.5">
            {coreModules.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer group',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/25 shadow-xs font-semibold'
                      : 'text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#15171A] dark:hover:bg-[#15171A] light:hover:bg-[#F3F4F6]'
                  )}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-[#606773] dark:text-[#606773] light:text-[#9CA3AF] group-hover:text-[#D1D5DB]'
                    )}
                  />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.highlightBadge ? 'emerald' : isActive ? 'emerald' : 'zinc'}
                          size="sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Verification & System Tools */}
        <div>
          {(!isCollapsed || isMobileOpen) && (
            <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#848B98] dark:text-[#848B98] light:text-[#6B7280]">
              Verification & Architecture
            </p>
          )}
          <nav className="space-y-0.5">
            {systemTools.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer group',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/25 shadow-xs font-semibold'
                      : 'text-[#9CA3AF] dark:text-[#9CA3AF] light:text-[#4B5563] hover:text-white dark:hover:text-white light:hover:text-[#111827] hover:bg-[#15171A] dark:hover:bg-[#15171A] light:hover:bg-[#F3F4F6]'
                  )}
                  title={isCollapsed && !isMobileOpen ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0 transition-colors',
                      isActive ? 'text-emerald-400' : 'text-[#606773] dark:text-[#606773] light:text-[#9CA3AF] group-hover:text-[#D1D5DB]'
                    )}
                  />
                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex flex-1 items-center justify-between truncate">
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <Badge
                          variant={item.highlightBadge ? 'emerald' : 'zinc'}
                          size="sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Engine Status & PWA Bottom Badges */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="p-3 border-t border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-[#F9FAFB] space-y-2">
          {/* PWA Install Banner Button */}
          <PWAInstallButton variant="sidebar" />

          {/* Sync & Offline Status */}
          <OfflineIndicator mode="sidebar-status" />

          {/* Quant Engine Status */}
          <div className="rounded-lg border border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#15171A] dark:bg-[#15171A] light:bg-white p-2.5 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#848B98]">Quant Engine</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-mono font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
            <div className="text-[10px] text-[#606773] dark:text-[#606773] light:text-[#9CA3AF]">
              Deterministic TS Math & Multi-Tenant
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r border-[#22252A] dark:border-[#22252A] light:border-[#E5E7EB] bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-white transition-all duration-300 z-30 select-none shrink-0 h-screen',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen && setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
