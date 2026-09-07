import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  Edit, 
  Calendar, 
  Tag, 
  BrainCircuit,
  Layers,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  LayoutGrid,
  List,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Percent,
  BarChart3,
  UploadCloud,
  Download
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { Trade, AssetClass, TradeDirection, MarketSession } from '../../types/domain';
import { TradeService, TradeFilters, TradeSortField } from '../../services/tradeService';
import { CalculationEngine } from '../../services/calculationEngine';
import { formatCurrency, formatShortDate, formatDate } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Select } from '../ui/Input';
import { TradeDetailModal } from './TradeDetailModal';
import { TradeDeleteConfirmModal } from './TradeDeleteConfirmModal';
import { ImportModal } from '../importExport/ImportModal';
import { TradeColumnConfigModal } from './TradeColumnConfigModal';
import { TradeTemplatesModal } from './TradeTemplatesModal';
import { useCustomization } from '../../context/CustomizationContext';
import { Columns, Zap } from 'lucide-react';

interface TradesViewProps {
  onOpenNewTradeModal: () => void;
  onEditTrade: (trade: Trade) => void;
}

type DateRangePreset = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH';

export const TradesView: React.FC<TradesViewProps> = ({
  onOpenNewTradeModal,
  onEditTrade,
}) => {
  const { 
    selectedAccountTrades, 
    selectedAccount, 
    selectedAccountId, 
    accounts, 
    strategies,
    deleteTrade,
    duplicateTrade,
    metrics 
  } = useTradeOS();

  // View mode
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState<TradeDirection | 'ALL'>('ALL');
  const [filterOutcome, setFilterOutcome] = useState<'WIN' | 'LOSS' | 'BREAKEVEN' | 'ALL'>('ALL');
  const [filterAssetClass, setFilterAssetClass] = useState<AssetClass | 'ALL'>('ALL');
  const [filterSession, setFilterSession] = useState<MarketSession | 'ALL'>('ALL');
  const [filterStrategyId, setFilterStrategyId] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('ALL');

  // Sorting states
  const [sortField, setSortField] = useState<TradeSortField>('entryDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [deleteTargetTrade, setDeleteTargetTrade] = useState<Trade | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);

  const { openColumnConfigModal } = useCustomization();

  // Compute date bounds for presets
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (datePreset === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      return { startDate: start, endDate: undefined };
    }
    if (datePreset === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (datePreset === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      return { startDate: start, endDate: undefined };
    }
    return { startDate: undefined, endDate: undefined };
  }, [datePreset]);

  // Filtered & Sorted trades via TradeService
  const processedTrades = useMemo(() => {
    const filters: TradeFilters = {
      searchTerm,
      direction: filterDirection,
      outcome: filterOutcome,
      assetClass: filterAssetClass,
      session: filterSession,
      strategyId: filterStrategyId,
      startDate,
      endDate,
    };

    const filtered = TradeService.filterTrades(selectedAccountTrades, filters);
    return TradeService.sortTrades(filtered, sortField, sortDirection);
  }, [
    selectedAccountTrades,
    searchTerm,
    filterDirection,
    filterOutcome,
    filterAssetClass,
    filterSession,
    filterStrategyId,
    startDate,
    endDate,
    sortField,
    sortDirection,
  ]);

  const handleSort = (field: TradeSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetTrade) return;
    setIsDeleting(true);
    try {
      await deleteTrade(deleteTargetTrade.id);
      setDeleteTargetTrade(null);
    } catch (err) {
      console.error('Failed to delete trade:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async (tradeId: string) => {
    try {
      await duplicateTrade(tradeId);
    } catch (err) {
      console.error('Failed to duplicate trade:', err);
    }
  };

  const renderSortIcon = (field: TradeSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-[#606773] ml-1 inline opacity-60 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-emerald-400 ml-1 inline" /> 
      : <ArrowDown className="h-3 w-3 text-emerald-400 ml-1 inline" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Trade Journal & Executions
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Institutional-grade trade execution records, quantitative holding analytics, R-multiples, and confluences for {selectedAccountId === 'ALL' ? 'all active accounts' : selectedAccount?.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-lg bg-[#15171A] border border-[#22252A]">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'TABLE' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'}`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('CARDS')}
              className={`p-1.5 rounded text-xs transition-colors ${viewMode === 'CARDS' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'}`}
              title="Journal Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => setIsTemplatesModalOpen(true)}
            className="text-[#848B98] hover:text-white border-[#22252A]"
          >
            <Zap className="h-4 w-4 mr-1.5 text-amber-400" />
            <span>Templates</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={openColumnConfigModal}
            className="text-[#848B98] hover:text-white border-[#22252A]"
          >
            <Columns className="h-4 w-4 mr-1.5 text-purple-400" />
            <span>Columns</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={() => setIsImportModalOpen(true)}
            className="text-emerald-400 hover:text-emerald-300 border-emerald-500/30"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" />
            <span>Import CSV</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewTradeModal}
            className="shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Log New Trade</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Total Trades</span>
          <div className="text-lg font-bold font-mono text-white mt-0.5">
            {metrics.totalTrades}
          </div>
          <span className="text-[10px] text-[#848B98]">
            {metrics.openTradesCount} active open
          </span>
        </Card>

        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Win Rate</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {metrics.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-[#848B98]">
            {metrics.winningTradesCount}W • {metrics.losingTradesCount}L • {metrics.breakEvenTradesCount}BE
          </span>
        </Card>

        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Profit Factor</span>
          <div className="text-lg font-bold font-mono text-blue-400 mt-0.5">
            {metrics.profitFactor.toFixed(2)}
          </div>
          <span className="text-[10px] text-[#848B98]">
            Payoff: {metrics.payoffRatio.toFixed(2)}
          </span>
        </Card>

        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Net Realized P&L</span>
          <div className={`text-lg font-bold font-mono mt-0.5 ${metrics.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.netPnL >= 0 ? '+' : ''}{formatCurrency(metrics.netPnL)}
          </div>
          <span className="text-[10px] text-[#848B98]">
            Gross: {formatCurrency(metrics.grossProfit)}
          </span>
        </Card>

        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Avg Achieved R</span>
          <div className={`text-lg font-bold font-mono mt-0.5 ${metrics.averageAchievedR >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {metrics.averageAchievedR > 0 ? `+${metrics.averageAchievedR}R` : `${metrics.averageAchievedR}R`}
          </div>
          <span className="text-[10px] text-[#848B98]">
            Max: +{metrics.maxAchievedR}R
          </span>
        </Card>

        <Card className="p-3 bg-[#15171A] border-[#22252A]">
          <span className="text-[10px] uppercase font-sans text-[#848B98] block">Expectancy</span>
          <div className="text-lg font-bold font-mono text-purple-400 mt-0.5">
            {formatCurrency(metrics.expectancy)}
          </div>
          <span className="text-[10px] text-[#848B98]">
            Per executed trade
          </span>
        </Card>
      </div>

      {/* Filter & Search Controls */}
      <div className="p-4 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search instrument, strategy, playbook, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefixElement={<Search className="h-3.5 w-3.5 text-[#848B98]" />}
          />

          <Select
            value={filterDirection}
            onChange={(e) => setFilterDirection(e.target.value as any)}
          >
            <option value="ALL">Direction: All Sides</option>
            <option value="LONG">Long Positions Only</option>
            <option value="SHORT">Short Positions Only</option>
          </Select>

          <Select
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value as any)}
          >
            <option value="ALL">Outcome: All Results</option>
            <option value="WIN">Winners (+P&L)</option>
            <option value="LOSS">Losses (-P&L)</option>
            <option value="BREAKEVEN">Break-Even (±$0)</option>
          </Select>

          <Select
            value={filterAssetClass}
            onChange={(e) => setFilterAssetClass(e.target.value as any)}
          >
            <option value="ALL">Asset: All Classes</option>
            <option value="INDICES">Indices</option>
            <option value="FOREX">Forex</option>
            <option value="COMMODITIES">Commodities</option>
            <option value="CRYPTO">Crypto</option>
            <option value="EQUITIES">Equities</option>
            <option value="FUTURES">Futures</option>
            <option value="OPTIONS">Options</option>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-[#22252A]">
          <Select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value as any)}
          >
            <option value="ALL">Session: All Sessions</option>
            <option value="NEW_YORK">New York</option>
            <option value="LONDON">London</option>
            <option value="LONDON_NY_OVERLAP">London / NY Overlap</option>
            <option value="TOKYO">Tokyo</option>
            <option value="SYDNEY">Sydney</option>
            <option value="OFF_HOURS">Off Hours</option>
          </Select>

          <Select
            value={filterStrategyId}
            onChange={(e) => setFilterStrategyId(e.target.value)}
          >
            <option value="ALL">Strategy: All Strategies</option>
            {strategies.map((strat) => (
              <option key={strat.id} value={strat.id}>
                {strat.name}
              </option>
            ))}
          </Select>

          <Select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as DateRangePreset)}
          >
            <option value="ALL">Date: All Time</option>
            <option value="TODAY">Today Only</option>
            <option value="THIS_WEEK">This Week</option>
            <option value="THIS_MONTH">This Month</option>
          </Select>
        </div>
      </div>

      {/* View Mode: TABLE VIEW */}
      {viewMode === 'TABLE' ? (
        <Card className="overflow-hidden p-0 bg-[#15171A] border-[#22252A]">
          {processedTrades.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#848B98]">
              <BookOpen className="h-10 w-10 text-[#606773] mx-auto mb-3" />
              <p className="font-semibold text-[#D1D5DB]">No matching trade executions found</p>
              <p className="text-[#848B98] mt-1">Adjust filters, search keywords, or log a new trade execution.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#0C0D0F] border-b border-[#22252A] text-[#848B98] text-[11px] uppercase tracking-wider select-none">
                    <th 
                      onClick={() => handleSort('entryDate')}
                      className="py-3 px-4 font-semibold cursor-pointer group hover:text-white"
                    >
                      <span>Date / Instrument</span>
                      {renderSortIcon('entryDate')}
                    </th>
                    <th 
                      onClick={() => handleSort('direction')}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:text-white"
                    >
                      <span>Side</span>
                      {renderSortIcon('direction')}
                    </th>
                    <th className="py-3 px-3 font-semibold">Entry → Exit</th>
                    <th className="py-3 px-3 font-semibold">Size</th>
                    <th className="py-3 px-3 font-semibold">Strategy & Setup</th>
                    <th 
                      onClick={() => handleSort('plannedRiskAmount')}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:text-white"
                    >
                      <span>Planned Risk</span>
                      {renderSortIcon('plannedRiskAmount')}
                    </th>
                    <th 
                      onClick={() => handleSort('achievedRMultiple')}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:text-white"
                    >
                      <span>Achieved R</span>
                      {renderSortIcon('achievedRMultiple')}
                    </th>
                    <th 
                      onClick={() => handleSort('holdingTimeSeconds')}
                      className="py-3 px-3 font-semibold cursor-pointer group hover:text-white"
                    >
                      <span>Duration</span>
                      {renderSortIcon('holdingTimeSeconds')}
                    </th>
                    <th 
                      onClick={() => handleSort('netPnL')}
                      className="py-3 px-4 font-semibold text-right cursor-pointer group hover:text-white"
                    >
                      <span>Net Realized P&L</span>
                      {renderSortIcon('netPnL')}
                    </th>
                    <th className="py-3 px-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22252A]">
                  {processedTrades.map((trade) => {
                    const isLong = trade.direction === 'LONG';
                    const isWin = trade.netPnL > 0;
                    const isLoss = trade.netPnL < 0;
                    const duration = CalculationEngine.calculateHoldingDuration(trade.entryDate, trade.exitDate);

                    return (
                      <tr 
                        key={trade.id} 
                        onClick={() => setDetailTrade(trade)}
                        className="hover:bg-[#1A1D21] transition-colors group cursor-pointer"
                      >
                        {/* Date / Instrument */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm">
                              {trade.instrument}
                            </span>
                            <span className="text-[10px] text-[#848B98] font-sans">
                              {formatShortDate(trade.entryDate)} • {trade.session}
                            </span>
                          </div>
                        </td>

                        {/* Side */}
                        <td className="py-3 px-3">
                          <Badge variant={isLong ? 'emerald' : 'rose'} size="sm">
                            {trade.direction}
                          </Badge>
                        </td>

                        {/* Entry -> Exit */}
                        <td className="py-3 px-3 text-[#D1D5DB]">
                          <div>
                            <span>{trade.entryPrice}</span>
                            <span className="text-[#848B98] mx-1">→</span>
                            <span>{trade.exitPrice !== undefined ? trade.exitPrice : 'OPEN'}</span>
                          </div>
                          {trade.stopLossPrice ? (
                            <span className="text-[10px] text-[#848B98] block font-sans">
                              SL: {trade.stopLossPrice} {trade.takeProfitPrice ? `| TP: ${trade.takeProfitPrice}` : ''}
                            </span>
                          ) : null}
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-3 text-[#D1D5DB]">
                          {trade.quantity}
                          {trade.contractMultiplier && trade.contractMultiplier > 1 ? (
                            <span className="text-[10px] text-[#848B98] block font-sans">
                              ({trade.contractMultiplier}x)
                            </span>
                          ) : null}
                        </td>

                        {/* Strategy & Setup */}
                        <td className="py-3 px-3 max-w-[180px]">
                          <div className="truncate font-sans text-[#F3F4F6] font-medium">
                            {trade.strategyName || 'Discretionary'}
                          </div>
                          {trade.setupName ? (
                            <div className="truncate text-[10px] text-blue-400 font-sans">
                              {trade.setupName}
                            </div>
                          ) : trade.confluences && trade.confluences.length > 0 ? (
                            <div className="truncate text-[10px] text-[#848B98] font-sans">
                              {trade.confluences.join(', ')}
                            </div>
                          ) : null}
                        </td>

                        {/* Planned Risk */}
                        <td className="py-3 px-3 text-[#D1D5DB]">
                          {trade.plannedRiskAmount ? formatCurrency(trade.plannedRiskAmount) : '—'}
                          {trade.plannedRiskPercent ? (
                            <span className="text-[10px] text-[#848B98] block font-sans">
                              {trade.plannedRiskPercent}%
                            </span>
                          ) : null}
                        </td>

                        {/* Achieved R */}
                        <td className="py-3 px-3">
                          {trade.achievedRMultiple !== undefined ? (
                            <span className={`font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'}`}>
                              {trade.achievedRMultiple > 0 ? `+${trade.achievedRMultiple}R` : `${trade.achievedRMultiple}R`}
                            </span>
                          ) : (
                            <span className="text-[#606773]">—</span>
                          )}
                        </td>

                        {/* Holding Duration */}
                        <td className="py-3 px-3 text-zinc-300">
                          <span>{duration.formatted}</span>
                          <span className="text-[10px] text-[#848B98] block font-sans">
                            {trade.status}
                          </span>
                        </td>

                        {/* Net P&L */}
                        <td className="py-3 px-4 text-right">
                          <div className={`font-bold text-sm ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'}`}>
                            {isWin ? '+' : ''}{formatCurrency(trade.netPnL)}
                          </div>
                          <div className="text-[10px] text-[#848B98]">
                            Comm: -{formatCurrency(trade.commission || 0)}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setDetailTrade(trade)}
                              className="p-1 rounded text-[#848B98] hover:text-white hover:bg-[#22252A] transition-colors"
                              title="View Trade Details"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onEditTrade(trade)}
                              className="p-1 rounded text-[#848B98] hover:text-white hover:bg-[#22252A] transition-colors"
                              title="Edit Trade"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDuplicate(trade.id)}
                              className="p-1 rounded text-[#848B98] hover:text-white hover:bg-[#22252A] transition-colors"
                              title="Duplicate Trade"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetTrade(trade)}
                              className="p-1 rounded text-[#848B98] hover:text-rose-400 hover:bg-[#22252A] transition-colors"
                              title="Delete Trade"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : (
        /* View Mode: JOURNAL CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedTrades.length === 0 ? (
            <div className="col-span-full p-12 text-center text-xs text-[#848B98] rounded-xl bg-[#15171A] border border-[#22252A]">
              <BookOpen className="h-10 w-10 text-[#606773] mx-auto mb-3" />
              <p className="font-semibold text-[#D1D5DB]">No matching trade executions found</p>
              <p className="text-[#848B98] mt-1">Adjust filters or log a new trade execution.</p>
            </div>
          ) : (
            processedTrades.map((trade) => {
              const isLong = trade.direction === 'LONG';
              const isWin = trade.netPnL > 0;
              const isLoss = trade.netPnL < 0;
              const duration = CalculationEngine.calculateHoldingDuration(trade.entryDate, trade.exitDate);

              return (
                <Card 
                  key={trade.id} 
                  className="p-4 bg-[#15171A] border-[#22252A] hover:border-[#383C44] transition-all cursor-pointer flex flex-col justify-between"
                  onClick={() => setDetailTrade(trade)}
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold font-mono text-white">{trade.instrument}</span>
                          <Badge variant={isLong ? 'emerald' : 'rose'} size="sm">
                            {trade.direction}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {trade.assetClass}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-[#848B98] block mt-0.5">
                          {formatDate(trade.entryDate)} • {trade.session}
                        </span>
                      </div>

                      <div className="text-right font-mono">
                        <div className={`text-base font-bold ${isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-[#848B98]'}`}>
                          {isWin ? '+' : ''}{formatCurrency(trade.netPnL)}
                        </div>
                        <span className="text-[10px] text-[#848B98]">
                          {trade.achievedRMultiple !== undefined ? `${trade.achievedRMultiple > 0 ? '+' : ''}${trade.achievedRMultiple}R` : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Price Points */}
                    <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] grid grid-cols-3 gap-2 font-mono text-xs text-center">
                      <div>
                        <span className="text-[9px] text-[#848B98] block font-sans">Entry</span>
                        <span className="text-white font-medium">{trade.entryPrice}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#848B98] block font-sans">Exit</span>
                        <span className="text-white font-medium">{trade.exitPrice !== undefined ? trade.exitPrice : 'OPEN'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#848B98] block font-sans">Duration</span>
                        <span className="text-blue-400 font-medium">{duration.formatted}</span>
                      </div>
                    </div>

                    {/* Strategy & Confluences */}
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#848B98]">Strategy:</span>
                        <span className="text-white font-medium">{trade.strategyName || 'Discretionary'}</span>
                      </div>
                      {trade.setupName && (
                        <div className="flex justify-between">
                          <span className="text-[#848B98]">Setup:</span>
                          <span className="text-blue-400">{trade.setupName}</span>
                        </div>
                      )}
                    </div>

                    {/* Entry Rationale preview */}
                    {trade.entryRationale && (
                      <p className="text-[11px] text-[#848B98] line-clamp-2 italic bg-[#0C0D0F]/50 p-2 rounded border border-[#22252A]/50">
                        "{trade.entryRationale}"
                      </p>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-[#22252A] flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-[#848B98]">
                      Risk: {trade.plannedRiskAmount ? formatCurrency(trade.plannedRiskAmount) : '—'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditTrade(trade)}
                        className="p-1.5 rounded text-[#848B98] hover:text-white hover:bg-[#22252A]"
                        title="Edit Trade"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(trade.id)}
                        className="p-1.5 rounded text-[#848B98] hover:text-white hover:bg-[#22252A]"
                        title="Duplicate Trade"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetTrade(trade)}
                        className="p-1.5 rounded text-[#848B98] hover:text-rose-400 hover:bg-[#22252A]"
                        title="Delete Trade"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Trade Detail Modal */}
      <TradeDetailModal
        isOpen={!!detailTrade}
        onClose={() => setDetailTrade(null)}
        trade={detailTrade}
        account={accounts.find(a => a.id === detailTrade?.accountId) || null}
        onEdit={(t) => {
          setDetailTrade(null);
          onEditTrade(t);
        }}
        onDuplicate={handleDuplicate}
        onDelete={(t) => {
          setDetailTrade(null);
          setDeleteTargetTrade(t);
        }}
      />

      {/* Delete Confirmation Modal */}
      <TradeDeleteConfirmModal
        isOpen={!!deleteTargetTrade}
        onClose={() => setDeleteTargetTrade(null)}
        onConfirm={handleDeleteConfirm}
        trade={deleteTargetTrade}
        isLoading={isDeleting}
      />

      {/* Quick Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialAccountId={selectedAccountId !== 'ALL' ? selectedAccountId : undefined}
      />

      {/* Trade Column Visibility & Order Config Modal */}
      <TradeColumnConfigModal />

      {/* Trade Reusable Entry Templates Modal */}
      <TradeTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onApplyTemplate={(template) => {
          setIsTemplatesModalOpen(false);
          onOpenNewTradeModal();
        }}
      />
    </div>
  );
};
