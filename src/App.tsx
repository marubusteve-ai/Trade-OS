import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SyncProvider } from './context/SyncContext';
import { TradeOSProvider, useTradeOS } from './context/TradeOSContext';
import { CustomizationProvider } from './context/CustomizationContext';

import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { StatusBar } from './components/layout/StatusBar';
import { CommandPalette } from './components/layout/CommandPalette';
import { ToastContainer } from './components/ui/ToastContainer';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { SyncStatusModal } from './components/pwa/SyncStatusModal';

import { AuthModal } from './components/auth/AuthModal';
import { AuthLockScreen } from './components/auth/AuthLockScreen';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { WorkspaceModal } from './components/auth/WorkspaceModal';
import { AccountModal } from './components/accounts/AccountModal';
import { TradeModal } from './components/trades/TradeModal';

import { DashboardView } from './components/dashboard/DashboardView';
import { AccountsView } from './components/accounts/AccountsView';
import { TradesView } from './components/trades/TradesView';
import { StrategiesView } from './components/strategies/StrategiesView';
import { PlaybooksView } from './components/playbooks/PlaybooksView';
import { RiskView } from './components/risk/RiskView';
import { PropFirmsView } from './components/propfirms/PropFirmsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { PsychologyView } from './components/psychology/PsychologyView';
import { ReportsView } from './components/reports/ReportsView';
import { ImportExportView } from './components/importExport/ImportExportView';
import { AIView } from './components/ai/AIView';
import { AutomationView } from './components/automation/AutomationView';
import { IntegrationsView } from './components/integrations/IntegrationsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { TestRunnerView } from './components/tests/TestRunnerView';
import { ArchitectureView } from './components/architecture/ArchitectureView';

import { Account, Trade } from './types/domain';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isAuthModalOpen, closeAuthModal } = useAuth();
  const { 
    activeTab, 
    setActiveTab, 
    createAccount, 
    updateAccount, 
    createTrade, 
    updateTrade 
  } = useTradeOS();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  // Account Modal State
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Trade Modal State
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  // Account Handlers
  const handleOpenNewAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleSaveAccount = async (data: any) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await createAccount(data);
    }
  };

  // Trade Handlers
  const handleOpenNewTrade = () => {
    setEditingTrade(null);
    setIsTradeModalOpen(true);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsTradeModalOpen(true);
  };

  const handleSaveTrade = async (data: any) => {
    if (editingTrade) {
      await updateTrade(editingTrade.id, data);
    } else {
      await createTrade(data);
    }
  };

  // If user is not authenticated, show protected lock screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#0C0D0F] text-[#F3F4F6] font-sans">
        <AuthLockScreen />
        <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-[#F9FAFB] text-[#F3F4F6] dark:text-[#F3F4F6] light:text-[#111827] font-sans">
      {/* Primary Sidebar with responsive drawer */}
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          onOpenNewAccountModal={handleOpenNewAccount}
          onOpenNewTradeModal={handleOpenNewTrade}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onToggleMobileMenu={() => setIsMobileNavOpen(!isMobileNavOpen)}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 bg-[#0C0D0F] dark:bg-[#0C0D0F] light:bg-[#F9FAFB] custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewTradeModal={handleOpenNewTrade}
                onOpenNewAccountModal={handleOpenNewAccount}
                onViewAllTrades={() => setActiveTab('trades')}
              />
            )}

            {activeTab === 'accounts' && (
              <AccountsView
                onOpenNewAccountModal={handleOpenNewAccount}
                onEditAccount={handleEditAccount}
              />
            )}

            {activeTab === 'trades' && (
              <TradesView
                onOpenNewTradeModal={handleOpenNewTrade}
                onEditTrade={handleEditTrade}
              />
            )}

            {activeTab === 'strategies' && (
              <StrategiesView />
            )}

            {activeTab === 'playbooks' && (
              <PlaybooksView />
            )}

            {activeTab === 'risk' && (
              <RiskView />
            )}

            {activeTab === 'prop-firms' && (
              <PropFirmsView />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView />
            )}

            {activeTab === 'psychology' && (
              <PsychologyView />
            )}

            {activeTab === 'reports' && (
              <ReportsView />
            )}

            {activeTab === 'import-export' && (
              <ImportExportView />
            )}

            {activeTab === 'ai' && (
              <AIView />
            )}

            {activeTab === 'automation' && (
              <AutomationView />
            )}

            {activeTab === 'integrations' && (
              <IntegrationsView />
            )}

            {activeTab === 'audit' && (
              <AuditLogView />
            )}

            {activeTab === 'settings' && (
              <SettingsView />
            )}

            {activeTab === 'tests' && (
              <TestRunnerView />
            )}

            {activeTab === 'architecture' && (
              <ArchitectureView />
            )}
          </div>
        </main>

        {/* Bottom Status Bar */}
        <StatusBar />
      </div>

      {/* Global Modals & Utilities */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={closeAuthModal} 
      />

      <UserProfileModal />
      <WorkspaceModal />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewAccountModal={handleOpenNewAccount}
        onOpenNewTradeModal={handleOpenNewTrade}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={handleSaveAccount}
        initialAccount={editingAccount}
      />

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onSave={handleSaveTrade}
        initialTrade={editingTrade}
      />

      {/* PWA & Offline Infrastructure Modals */}
      <OfflineIndicator mode="banner" />
      <SyncStatusModal />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <SyncProvider>
            <TradeOSProvider>
              <CustomizationProvider>
                <MainLayout />
              </CustomizationProvider>
            </TradeOSProvider>
          </SyncProvider>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
