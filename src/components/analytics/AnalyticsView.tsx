/**
 * Advanced Quantitative Performance Analytics Workspace
 * Master Hub coordinating Multi-Dimensional Filters, Statistical Metrics,
 * Heatmaps, Excursions (MFE/MAE), Histograms, Equity/Drawdown, and Trade Drill-Downs.
 */

import React, { useState, useMemo } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { AnalyticsEngine } from '../../services/analyticsEngine';
import { AnalyticsFilterState, AdvancedPerformanceMetrics } from '../../types/analytics';
import { Trade } from '../../types/domain';
import { AnalyticsFilterBar } from './AnalyticsFilterBar';
import { AnalyticsMetricsOverview } from './AnalyticsMetricsOverview';
import { DimensionBreakdownView } from './DimensionBreakdownView';
import { InteractiveHeatmapView } from './InteractiveHeatmapView';
import { ScatterPlotView } from './ScatterPlotView';
import { HistogramsView } from './HistogramsView';
import { EquityDrawdownAnalyticsView } from './EquityDrawdownAnalyticsView';
import { WinLossComparisonView } from './WinLossComparisonView';
import { StrategyPlaybookComparisonView } from './StrategyPlaybookComparisonView';
import { TradeDrillDownModal } from '../dashboard/TradeDrillDownModal';
import { 
  BarChart3, 
  Layers, 
  Flame, 
  Crosshair, 
  Activity, 
  TrendingUp, 
  Award, 
  BookOpen,
  PieChart,
  Target,
  Sparkles
} from 'lucide-react';
import { Badge } from '../ui/Badge';

type AnalyticsSubTab =
  | 'OVERVIEW'
  | 'DIMENSIONS'
  | 'HEATMAPS'
  | 'SCATTER'
  | 'HISTOGRAMS'
  | 'EQUITY_DRAWDOWN'
  | 'WIN_VS_LOSS'
  | 'STRATEGIES_PLAYBOOKS';

export const AnalyticsView: React.FC = () => {
  const {
    trades,
    accounts,
    strategies,
    playbooks,
    selectedAccountId,
    selectedAccount,
    setActiveTab,
  } = useTradeOS();

  // Active Sub-Tab
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>('OVERVIEW');

  // Filter State
  const [filters, setFilters] = useState<AnalyticsFilterState>({
    accountId: selectedAccountId || 'ALL',
    strategyId: 'ALL',
    playbookId: 'ALL',
    setupId: 'ALL',
    instrument: 'ALL',
    assetClass: 'ALL',
    timeframe: 'ALL',
    session: 'ALL',
    direction: 'ALL',
    marketCondition: 'ALL',
    riskLevel: 'ALL',
    psychologyEmotion: 'ALL',
    mistakeCategory: 'ALL',
  });

  // Drill-Down Modal State
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    trades: Trade[];
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    trades: [],
  });

  // Unique instruments list
  const uniqueInstruments = useMemo(() => {
    return Array.from(new Set(trades.map((t) => t.instrument))).filter(Boolean).sort();
  }, [trades]);

  // Unique setups list
  const setupsList = useMemo(() => {
    return strategies.flatMap((s) => s.setups || []);
  }, [strategies]);

  // Apply filters to get active dataset
  const filteredTrades = useMemo(() => {
    return AnalyticsEngine.filterTrades(trades, filters);
  }, [trades, filters]);

  // Starting capital baseline
  const startingCapital = selectedAccount
    ? selectedAccount.startingBalance
    : accounts.reduce((acc, a) => acc + a.startingBalance, 0) || 100000;

  // Calculate advanced metrics on filtered trades
  const advancedMetrics: AdvancedPerformanceMetrics = useMemo(() => {
    return AnalyticsEngine.calculateAdvancedMetrics(filteredTrades, startingCapital);
  }, [filteredTrades, startingCapital]);

  const handleResetFilters = () => {
    setFilters({
      accountId: 'ALL',
      strategyId: 'ALL',
      playbookId: 'ALL',
      setupId: 'ALL',
      instrument: 'ALL',
      assetClass: 'ALL',
      timeframe: 'ALL',
      session: 'ALL',
      direction: 'ALL',
      marketCondition: 'ALL',
      riskLevel: 'ALL',
      psychologyEmotion: 'ALL',
      mistakeCategory: 'ALL',
    });
  };

  const handleOpenDrillDown = (title: string, subsetTrades: Trade[], subtitle?: string) => {
    setDrillDownModal({
      isOpen: true,
      title,
      subtitle,
      trades: subsetTrades,
    });
  };

  const handleSelectTrade = (trade: Trade) => {
    // Navigate to trade journal or open drill-down
    setDrillDownModal({
      isOpen: true,
      title: `Trade #${trade.id.slice(-5)}: ${trade.instrument} (${trade.direction})`,
      subtitle: `Entry: ${trade.entryPrice} • Exit: ${trade.exitPrice || 'Open'} • P&L: $${trade.netPnL?.toFixed(2)}`,
      trades: [trade],
    });
  };

  const navTabs: { id: AnalyticsSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW', label: 'Executive Overview', icon: <Activity className="h-3.5 w-3.5" /> },
    { id: 'DIMENSIONS', label: '16-D Segmentation', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'HEATMAPS', label: 'Timing Heatmaps', icon: <Flame className="h-3.5 w-3.5" /> },
    { id: 'SCATTER', label: 'Excursions (MFE/MAE)', icon: <Crosshair className="h-3.5 w-3.5" /> },
    { id: 'HISTOGRAMS', label: 'Distributions & Bins', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'EQUITY_DRAWDOWN', label: 'Equity & Drawdown', icon: <TrendingUp className="h-3.5 w-3.5" /> },
    { id: 'WIN_VS_LOSS', label: 'Win vs Loss Matrix', icon: <Award className="h-3.5 w-3.5" /> },
    { id: 'STRATEGIES_PLAYBOOKS', label: 'Strategy Comparison', icon: <BookOpen className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-10">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Quantitative Analytics & Performance Engine
            </h1>
            <Badge variant="emerald">PHASE 8</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Institutional-grade statistical metrics, Sharpe/Sortino ratios, MFE/MAE excursions, and 16-dimensional segmentations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="blue">
            {filteredTrades.length} Filtered Trades
          </Badge>
          <Badge variant="purple">
            16 Dimensions
          </Badge>
        </div>
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <AnalyticsFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        accounts={accounts}
        strategies={strategies}
        playbooks={playbooks}
        setups={setupsList}
        instruments={uniqueInstruments}
        totalTradesCount={trades.length}
        filteredTradesCount={filteredTrades.length}
      />

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#22252A]">
        {navTabs.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/20'
                  : 'bg-[#121417] text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#181B20] border border-[#22252A]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div className="transition-all duration-150">
        {activeSubTab === 'OVERVIEW' && (
          <div className="space-y-4">
            <AnalyticsMetricsOverview
              metrics={advancedMetrics}
              currency={selectedAccount?.currency || 'USD'}
            />
            {/* Embedded Quick Breakdown & Excursion Highlight */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <DimensionBreakdownView
                trades={filteredTrades}
                currency={selectedAccount?.currency || 'USD'}
                accounts={accounts}
                strategies={strategies}
                playbooks={playbooks}
                setups={setupsList}
                onDrillDown={handleOpenDrillDown}
              />
              <ScatterPlotView
                trades={filteredTrades}
                currency={selectedAccount?.currency || 'USD'}
                onDrillDownTrade={handleSelectTrade}
              />
            </div>
          </div>
        )}

        {activeSubTab === 'DIMENSIONS' && (
          <DimensionBreakdownView
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            accounts={accounts}
            strategies={strategies}
            playbooks={playbooks}
            setups={setupsList}
            onDrillDown={handleOpenDrillDown}
          />
        )}

        {activeSubTab === 'HEATMAPS' && (
          <InteractiveHeatmapView
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            onDrillDown={handleOpenDrillDown}
          />
        )}

        {activeSubTab === 'SCATTER' && (
          <ScatterPlotView
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            onDrillDownTrade={handleSelectTrade}
          />
        )}

        {activeSubTab === 'HISTOGRAMS' && (
          <HistogramsView
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            onDrillDown={handleOpenDrillDown}
          />
        )}

        {activeSubTab === 'EQUITY_DRAWDOWN' && (
          <EquityDrawdownAnalyticsView
            trades={filteredTrades}
            startingBalance={startingCapital}
            currency={selectedAccount?.currency || 'USD'}
            onSelectTrade={handleSelectTrade}
          />
        )}

        {activeSubTab === 'WIN_VS_LOSS' && (
          <WinLossComparisonView
            metrics={advancedMetrics}
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            onDrillDown={handleOpenDrillDown}
          />
        )}

        {activeSubTab === 'STRATEGIES_PLAYBOOKS' && (
          <StrategyPlaybookComparisonView
            strategies={strategies}
            playbooks={playbooks}
            trades={filteredTrades}
            currency={selectedAccount?.currency || 'USD'}
            onDrillDown={handleOpenDrillDown}
          />
        )}
      </div>

      {/* Trade Drill-Down Modal */}
      <TradeDrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal((prev) => ({ ...prev, isOpen: false }))}
        title={drillDownModal.title}
        subtitle={drillDownModal.subtitle}
        trades={drillDownModal.trades}
        currency={selectedAccount?.currency || 'USD'}
        onSelectTrade={(trade) => {
          setDrillDownModal((prev) => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
};
