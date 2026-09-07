import React, { useState, useMemo, useEffect } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { useCustomization } from '../../context/CustomizationContext';
import { CalculationEngine } from '../../services/calculationEngine';
import { DashboardService } from '../../services/dashboardService';
import { 
  DashboardFilterState, 
  DrawdownCurvePoint 
} from '../../types/calculations';
import { CustomWidgetConfig } from '../../types/customization';
import { Trade } from '../../types/domain';
import { DashboardHeader } from './DashboardHeader';
import { DashboardFilterBar } from './DashboardFilterBar';
import { ConfigurableKPIGrid } from './widgets/ConfigurableKPIGrid';
import { WidgetContainer } from './widgets/WidgetContainer';
import { InteractiveEquityCurve } from './InteractiveEquityCurve';
import { PnLDistributionChart } from './PnLDistributionChart';
import { DrawdownChart } from './DrawdownChart';
import { TradingCalendarWidget } from './TradingCalendarWidget';
import { PropFirmComplianceWidget } from './PropFirmComplianceWidget';
import { RecentTradesWidget } from './RecentTradesWidget';
import { ScatterPlotWidget } from './widgets/ScatterPlotWidget';
import { RMultipleHistogramWidget } from './widgets/RMultipleHistogramWidget';
import { CorrelationMatrixWidget } from './widgets/CorrelationMatrixWidget';
import { CohortAnalysisWidget } from './widgets/CohortAnalysisWidget';
import { StrategyComparisonWidget } from './widgets/StrategyComparisonWidget';
import { TradeDrillDownModal } from './TradeDrillDownModal';
import { WidgetConfigModal } from './WidgetConfigModal';
import { WorkspaceManagerModal } from './customization/WorkspaceManagerModal';
import { KPISelectorModal } from './customization/KPISelectorModal';
import { TradeDetailModal } from '../trades/TradeDetailModal';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  Plus, 
  Sparkles, 
  Sliders, 
  Layers, 
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewTradeModal: () => void;
  onOpenNewAccountModal: () => void;
  onViewAllTrades: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTradeModal,
  onOpenNewAccountModal,
  onViewAllTrades,
}) => {
  const { currentUser } = useAuth();
  const { 
    selectedAccount, 
    selectedAccountId, 
    setSelectedAccountId,
    accounts, 
    trades,
    strategies,
    playbooks,
    setActiveTab,
    duplicateTrade,
    deleteTrade
  } = useTradeOS();

  const {
    activeWorkspace,
    activeWidgets,
    openWorkspaceModal,
    openKPIModal,
  } = useCustomization();

  const userId = currentUser?.id || 'anonymous';

  // 1. Multi-Dimensional Filter State
  const [filters, setFilters] = useState<DashboardFilterState>(() => ({
    period: 'LIFETIME',
    accountId: selectedAccountId || 'ALL',
    strategyId: 'ALL',
    playbookId: 'ALL',
    instrument: 'ALL',
    session: 'ALL',
  }));

  // Keep filter accountId in sync with selectedAccountId when changed from top nav
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      accountId: selectedAccountId || 'ALL'
    }));
  }, [selectedAccountId]);

  // 2. Filter Bar visibility toggle
  const [isFilterBarOpen, setIsFilterBarOpen] = useState<boolean>(false);

  // 3. Widget Customizer Modal State
  const [isWidgetConfigOpen, setIsWidgetConfigOpen] = useState<boolean>(false);

  // 4. Drill-Down Modal State
  const [drillDownState, setDrillDownState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    trades: Trade[];
  }>({
    isOpen: false,
    title: '',
    trades: [],
  });

  // 5. Detailed Trade View / Inspector Modal
  const [inspectedTrade, setInspectedTrade] = useState<Trade | null>(null);

  // Synchronized Multi-Dimensional Filter Application
  const filteredTrades = useMemo(() => {
    return DashboardService.filterTrades(trades, filters);
  }, [trades, filters]);

  // Active target account baseline determination
  const targetAccount = useMemo(() => {
    if (filters.accountId !== 'ALL') {
      return accounts.find(a => a.id === filters.accountId) || selectedAccount;
    }
    return selectedAccount;
  }, [filters.accountId, accounts, selectedAccount]);

  const startingBalance = useMemo(() => {
    if (targetAccount) return targetAccount.startingBalance;
    if (accounts.length > 0) return accounts.reduce((acc, a) => acc + a.startingBalance, 0);
    return 100000;
  }, [targetAccount, accounts]);

  const currentCapital = useMemo(() => {
    if (targetAccount) return targetAccount.currentBalance;
    if (accounts.length > 0) return accounts.reduce((acc, a) => acc + a.currentBalance, 0);
    return startingBalance;
  }, [targetAccount, accounts, startingBalance]);

  // Centralized Financial Calculations computed on filtered trade dataset
  const metrics = useMemo(() => {
    return CalculationEngine.calculateMetrics(filteredTrades, startingBalance);
  }, [filteredTrades, startingBalance]);

  const drawdown = useMemo(() => {
    return CalculationEngine.calculateDrawdown(filteredTrades, startingBalance);
  }, [filteredTrades, startingBalance]);

  const equityCurve = useMemo(() => {
    return CalculationEngine.generateEquityCurve(filteredTrades, startingBalance);
  }, [filteredTrades, startingBalance]);

  const dailyPnL = useMemo(() => {
    return CalculationEngine.generateDailyPnL(filteredTrades, startingBalance);
  }, [filteredTrades, startingBalance]);

  const drawdownCurve = useMemo(() => {
    return DashboardService.generateDrawdownCurve(filteredTrades, startingBalance);
  }, [filteredTrades, startingBalance]);

  const compliance = useMemo(() => {
    if (targetAccount) {
      return CalculationEngine.evaluatePropFirmCompliance(targetAccount, filteredTrades);
    }
    return null;
  }, [targetAccount, filteredTrades]);

  // Filter actions
  const handleFilterChange = (updates: Partial<DashboardFilterState>) => {
    setFilters(prev => {
      const next = { ...prev, ...updates };
      if (updates.accountId !== undefined && updates.accountId !== selectedAccountId) {
        setSelectedAccountId(updates.accountId);
      }
      return next;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      period: 'LIFETIME',
      accountId: selectedAccountId || 'ALL',
      strategyId: 'ALL',
      playbookId: 'ALL',
      instrument: 'ALL',
      session: 'ALL',
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.period !== 'LIFETIME') count++;
    if (filters.accountId !== 'ALL') count++;
    if (filters.strategyId !== 'ALL') count++;
    if (filters.playbookId !== 'ALL') count++;
    if (filters.instrument !== 'ALL') count++;
    if (filters.session !== 'ALL') count++;
    return count;
  }, [filters]);

  // Drill-down dispatcher
  const handleOpenDrillDown = (filterType: string, title: string, subtitle?: string) => {
    let subset: Trade[] = [];

    switch (filterType) {
      case 'WIN':
        subset = filteredTrades.filter(t => t.status === 'CLOSED' && t.netPnL > 0.001);
        break;
      case 'LOSS':
        subset = filteredTrades.filter(t => t.status === 'CLOSED' && t.netPnL < -0.001);
        break;
      case 'BREAKEVEN':
        subset = filteredTrades.filter(t => t.status === 'CLOSED' && Math.abs(t.netPnL) <= 0.001);
        break;
      case 'OPEN':
        subset = filteredTrades.filter(t => t.status === 'OPEN');
        break;
      case 'LARGEST_WIN': {
        const sorted = [...filteredTrades.filter(t => t.status === 'CLOSED')].sort((a, b) => b.netPnL - a.netPnL);
        subset = sorted.length > 0 ? [sorted[0]] : [];
        break;
      }
      case 'LARGEST_LOSS': {
        const sorted = [...filteredTrades.filter(t => t.status === 'CLOSED')].sort((a, b) => a.netPnL - b.netPnL);
        subset = sorted.length > 0 ? [sorted[0]] : [];
        break;
      }
      case 'ALL':
      default:
        subset = filteredTrades;
        break;
    }

    setDrillDownState({
      isOpen: true,
      title,
      subtitle,
      trades: subset,
    });
  };

  const handleDrillDownDay = (dateStr: string) => {
    const dayTrades = filteredTrades.filter(t => {
      const d = (t.exitDate || t.entryDate).split('T')[0];
      return d === dateStr;
    });

    setDrillDownState({
      isOpen: true,
      title: `Trading Day: ${dateStr}`,
      subtitle: `${dayTrades.length} trade executions recorded on this calendar day`,
      trades: dayTrades,
    });
  };

  const handleSelectTradeById = (tradeId: string) => {
    const found = trades.find(t => t.id === tradeId);
    if (found) {
      setInspectedTrade(found);
    }
  };

  // Helper to render widget by type
  const renderWidget = (w: CustomWidgetConfig) => {
    if (!w.enabled) return null;

    switch (w.type) {
      case 'KPI_HERO_GRID':
        return (
          <div key={w.id} className="col-span-1 lg:col-span-3">
            <ConfigurableKPIGrid
              metrics={metrics}
              drawdown={drawdown}
              selectedAccount={targetAccount}
              currency={targetAccount?.currency || 'USD'}
              trades={filteredTrades}
              onOpenDrillDown={handleOpenDrillDown}
            />
          </div>
        );

      case 'EQUITY_BALANCE_CURVE':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Interactive Equity Curve">
            <InteractiveEquityCurve
              data={equityCurve}
              startingBalance={startingBalance}
              currency={targetAccount?.currency || 'USD'}
              height={w.height === 'expanded' ? 380 : w.height === 'compact' ? 200 : 280}
              onSelectTrade={handleSelectTradeById}
            />
          </WidgetContainer>
        );

      case 'PROP_COMPLIANCE':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Prop Firm Compliance Radar">
            <PropFirmComplianceWidget
              compliance={compliance}
              accountName={targetAccount?.name}
            />
          </WidgetContainer>
        );

      case 'PNL_DISTRIBUTION':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="P&L Distribution & Daily Returns">
            <PnLDistributionChart
              dailyPnL={dailyPnL}
              trades={filteredTrades}
              currency={targetAccount?.currency || 'USD'}
              height={w.height === 'expanded' ? 360 : 250}
              onDrillDownDay={handleDrillDownDay}
              onSelectTrade={handleSelectTradeById}
            />
          </WidgetContainer>
        );

      case 'DRAWDOWN_UNDERWATER':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Underwater Drawdown Depth Chart">
            <DrawdownChart
              data={drawdownCurve}
              maxDrawdownPercent={drawdown.maxDrawdownPercent}
              maxDrawdownAmount={drawdown.maxDrawdownAmount}
              currentDrawdownPercent={drawdown.currentDrawdownPercent}
              currency={targetAccount?.currency || 'USD'}
              height={w.height === 'expanded' ? 360 : 250}
              onSelectTrade={handleSelectTradeById}
            />
          </WidgetContainer>
        );

      case 'TRADING_CALENDAR':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Interactive Trading Calendar Heatmap">
            <TradingCalendarWidget
              trades={filteredTrades}
              currency={targetAccount?.currency || 'USD'}
              onSelectDate={handleDrillDownDay}
            />
          </WidgetContainer>
        );

      case 'RECENT_TRADES':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Recent Executions & Audit Log">
            <RecentTradesWidget
              trades={filteredTrades}
              onOpenNewTradeModal={onOpenNewTradeModal}
              onViewAllTrades={onViewAllTrades}
            />
          </WidgetContainer>
        );

      case 'SCATTER_RISK_REWARD':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Excursion & Risk-Return Scatter Plot">
            <ScatterPlotWidget
              trades={filteredTrades}
              currency={targetAccount?.currency || 'USD'}
              height={w.height === 'expanded' ? 360 : 240}
              onSelectTrade={handleSelectTradeById}
            />
          </WidgetContainer>
        );

      case 'R_MULTIPLE_HISTOGRAM':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="R-Multiple Distribution Histogram">
            <RMultipleHistogramWidget
              trades={filteredTrades}
              height={w.height === 'expanded' ? 360 : 240}
            />
          </WidgetContainer>
        );

      case 'CORRELATION_MATRIX':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Multi-Asset Correlation Matrix">
            <CorrelationMatrixWidget trades={filteredTrades} />
          </WidgetContainer>
        );

      case 'COHORT_ANALYSIS':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Session & Day Cohort Matrix">
            <CohortAnalysisWidget trades={filteredTrades} currency={targetAccount?.currency || 'USD'} />
          </WidgetContainer>
        );

      case 'STRATEGY_COMPARISON':
        return (
          <WidgetContainer key={w.id} widget={w} defaultTitle="Strategy Comparative Edge">
            <StrategyComparisonWidget
              trades={filteredTrades}
              strategies={strategies}
              playbooks={playbooks}
              currency={targetAccount?.currency || 'USD'}
            />
          </WidgetContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Primary Header & Filter Toolbar */}
      <DashboardHeader
        selectedAccountId={selectedAccountId}
        selectedAccount={targetAccount}
        accounts={accounts}
        metrics={metrics}
        currentBalance={currentCapital}
        startingBalance={startingBalance}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        activeFilterCount={activeFilterCount}
        isFilterBarOpen={isFilterBarOpen}
        onToggleFilterBar={() => setIsFilterBarOpen(!isFilterBarOpen)}
        onOpenWidgetConfig={openWorkspaceModal}
        onOpenNewTradeModal={onOpenNewTradeModal}
      />

      {/* 2. Expandable Multi-Dimensional Filter Bar */}
      <DashboardFilterBar
        isOpen={isFilterBarOpen}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        accounts={accounts}
        strategies={strategies}
        playbooks={playbooks}
        trades={trades}
      />

      {/* 3. Dynamic Multi-Widget Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {activeWidgets.map((w) => renderWidget(w))}
      </div>

      {/* 4. Modals & Dialogs */}
      <WorkspaceManagerModal />
      <KPISelectorModal />

      {/* Drill Down Modal */}
      <TradeDrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={() => setDrillDownState(prev => ({ ...prev, isOpen: false }))}
        title={drillDownState.title}
        subtitle={drillDownState.subtitle}
        trades={drillDownState.trades}
        currency={targetAccount?.currency || 'USD'}
        onSelectTrade={(t) => {
          setDrillDownState(prev => ({ ...prev, isOpen: false }));
          setInspectedTrade(t);
        }}
      />

      {/* Trade Inspector Modal */}
      {inspectedTrade && (
        <TradeDetailModal
          isOpen={Boolean(inspectedTrade)}
          onClose={() => setInspectedTrade(null)}
          trade={inspectedTrade}
          account={accounts.find(a => a.id === inspectedTrade.accountId)}
          onEdit={() => {}}
          onDuplicate={() => duplicateTrade(inspectedTrade.id)}
          onDelete={() => {
            deleteTrade(inspectedTrade.id);
            setInspectedTrade(null);
          }}
        />
      )}
    </div>
  );
};
