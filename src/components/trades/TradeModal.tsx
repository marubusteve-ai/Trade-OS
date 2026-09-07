import React, { useState, useEffect } from 'react';
import { 
  Trade, 
  TradeDirection, 
  AssetClass, 
  MarketSession, 
  MarketCondition, 
  Attachment 
} from '../../types/domain';
import { 
  PreTradeEmotion, 
  PostTradeEmotion, 
  DecisionQuality, 
  MistakeTaxonomyItem 
} from '../../types/psychology';
import { DEFAULT_TRADING_HABITS } from '../../repositories/psychologyRepository';
import { CalculationEngine } from '../../services/calculationEngine';
import { TradeService } from '../../services/tradeService';
import { formatCurrency } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { Input, Select } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useTradeOS } from '../../context/TradeOSContext';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  DollarSign, 
  BrainCircuit, 
  FileText, 
  Image as ImageIcon, 
  Clock, 
  AlertCircle,
  Plus,
  Trash2,
  Settings2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Sliders,
  ShieldCheck
} from 'lucide-react';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tradeData: any) => Promise<void>;
  initialTrade?: Trade | null;
}

type TabType = 'EXECUTION' | 'STRATEGY' | 'COSTS' | 'PSYCHOLOGY' | 'ATTACHMENTS';

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTrade,
}) => {
  const { accounts, selectedAccountId, strategies, riskPolicy, mistakeTaxonomy, mistakeCategories, createTaxonomyMistake } = useTradeOS();

  const [activeTab, setActiveTab] = useState<TabType>('EXECUTION');

  // Form State
  const [formData, setFormData] = useState({
    accountId: selectedAccountId !== 'ALL' ? selectedAccountId : (accounts[0]?.id || ''),
    instrument: 'NQ',
    assetClass: 'INDICES' as AssetClass,
    direction: 'LONG' as TradeDirection,
    status: 'CLOSED' as const,
    
    // Strategy & Playbook Linkage
    strategyId: strategies[0]?.id || '',
    strategyName: strategies[0]?.name || '',
    setupName: 'FVG Retest & Expansion',
    playbookName: 'NY Open Sweep Model',
    timeframe: '15m',
    higherTimeframeTrend: 'BULLISH' as const,
    marketCondition: 'EXPANSION' as MarketCondition,
    
    // Dates & Times
    entryDate: new Date().toISOString().slice(0, 16),
    exitDate: new Date().toISOString().slice(0, 16),
    session: 'NEW_YORK' as MarketSession,
    
    // Prices & Sizing
    entryPrice: 19850.00,
    exitPrice: 19975.00,
    stopLossPrice: 19800.00,
    takeProfitPrice: 19975.00,
    quantity: 2,
    contractMultiplier: 20,
    leverage: 1,
    
    // Costs
    commission: 8.50,
    swap: 0,
    spreadCost: 0,
    slippage: 0,
    fees: 0,
    
    // Rationales & Notes
    entryRationale: 'Clean 15m Fair Value Gap fill following London high liquidity sweep.',
    exitRationale: 'Reached 1:2.5R objective into opposing Asian session liquidity pool.',
    notes: 'Execution was smooth and strictly adhered to trade management rules.',
    confluencesStr: '15m FVG, Liquidity Sweep, 1m MSS, Higher Timeframe Order Block',
    tagsStr: 'A+ Setup, London-NY Overlap, Trend Following',
    
    // Psychology
    preEmotion: 'FOCUSED' as PreTradeEmotion,
    postEmotion: 'SATISFIED' as PostTradeEmotion,
    disciplineScore: 9,
    confidenceScore: 9,
    stressLevel: 2,
    patienceScore: 8,
    fomoTendency: 2,
    revengeTendency: 1,
    impulsivityScore: 2,
    ruleAdherenceScore: 9,
    decisionQuality: 'EXCELLENT' as DecisionQuality,
    followedTradingPlan: true,
    selectedMistakes: [] as string[],
    tradingHabits: ['Pre-market routine & level mapping completed', 'Hard Stop Loss placed immediately at entry'] as string[],
    
    // Attachments & Custom Fields
    attachments: [] as Attachment[],
    customFieldKey: '',
    customFieldValue: '',
    customFields: {} as Record<string, string>,
  });

  const [mistakeSearch, setMistakeSearch] = useState('');
  const [selectedMistakeCat, setSelectedMistakeCat] = useState<string>('ALL');
  const [newCustomMistakeName, setNewCustomMistakeName] = useState('');
  const [showAddCustomMistake, setShowAddCustomMistake] = useState(false);

  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [newAttachmentType, setNewAttachmentType] = useState<Attachment['type']>('ENTRY_CHART');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Find linked account for calculations
  const currentAccount = accounts.find(a => a.id === formData.accountId) || accounts[0];
  const accountCapital = currentAccount?.startingBalance || 100000;

  useEffect(() => {
    if (initialTrade) {
      setFormData({
        accountId: initialTrade.accountId,
        instrument: initialTrade.instrument,
        assetClass: initialTrade.assetClass,
        direction: initialTrade.direction,
        status: initialTrade.status as any,
        
        strategyId: initialTrade.strategyId || '',
        strategyName: initialTrade.strategyName || '',
        setupName: initialTrade.setupName || '',
        playbookName: initialTrade.playbookName || '',
        timeframe: initialTrade.marketContext?.timeframe || '15m',
        higherTimeframeTrend: initialTrade.marketContext?.higherTimeframeTrend || 'BULLISH',
        marketCondition: initialTrade.marketContext?.marketCondition || 'EXPANSION',
        
        entryDate: initialTrade.entryDate ? new Date(initialTrade.entryDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        exitDate: initialTrade.exitDate ? new Date(initialTrade.exitDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        session: initialTrade.session,
        
        entryPrice: initialTrade.entryPrice,
        exitPrice: initialTrade.exitPrice ?? 0,
        stopLossPrice: initialTrade.stopLossPrice ?? 0,
        takeProfitPrice: initialTrade.takeProfitPrice ?? 0,
        quantity: initialTrade.quantity,
        contractMultiplier: initialTrade.contractMultiplier || 1,
        leverage: initialTrade.leverage || 1,
        
        commission: initialTrade.commission,
        swap: initialTrade.swap,
        spreadCost: initialTrade.spreadCost,
        slippage: initialTrade.slippage || 0,
        fees: initialTrade.fees,
        
        entryRationale: initialTrade.entryRationale || '',
        exitRationale: initialTrade.exitRationale || '',
        notes: initialTrade.notes || '',
        confluencesStr: initialTrade.confluences ? initialTrade.confluences.join(', ') : '',
        tagsStr: initialTrade.tags ? initialTrade.tags.join(', ') : '',
        
        preEmotion: (initialTrade.psychology?.preTradeEmotion as PreTradeEmotion) || 'FOCUSED',
        postEmotion: (initialTrade.psychology?.postTradeEmotion as PostTradeEmotion) || 'SATISFIED',
        disciplineScore: initialTrade.psychology?.disciplineScore ?? 9,
        confidenceScore: initialTrade.psychology?.confidenceScore ?? 9,
        stressLevel: initialTrade.psychology?.stressLevel ?? 2,
        patienceScore: initialTrade.psychology?.patienceScore ?? 8,
        fomoTendency: initialTrade.psychology?.fomoTendency ?? 2,
        revengeTendency: initialTrade.psychology?.revengeTendency ?? 1,
        impulsivityScore: initialTrade.psychology?.impulsivityScore ?? 2,
        ruleAdherenceScore: initialTrade.psychology?.ruleAdherenceScore ?? 9,
        decisionQuality: (initialTrade.psychology?.decisionQuality as DecisionQuality) || 'EXCELLENT',
        followedTradingPlan: initialTrade.psychology?.followedTradingPlan ?? true,
        selectedMistakes: initialTrade.psychology?.mistakes || [],
        tradingHabits: initialTrade.psychology?.tradingHabits || ['Pre-market routine & level mapping completed'],
        
        attachments: initialTrade.attachments || [],
        customFieldKey: '',
        customFieldValue: '',
        customFields: (initialTrade.customFields as Record<string, string>) || {},
      });
    } else {
      setFormData({
        accountId: selectedAccountId !== 'ALL' ? selectedAccountId : (accounts[0]?.id || ''),
        instrument: 'NQ',
        assetClass: 'INDICES',
        direction: 'LONG',
        status: 'CLOSED',
        
        strategyId: strategies[0]?.id || '',
        strategyName: strategies[0]?.name || '',
        setupName: 'FVG Retest & Expansion',
        playbookName: 'NY Open Sweep Model',
        timeframe: '15m',
        higherTimeframeTrend: 'BULLISH',
        marketCondition: 'EXPANSION',
        
        entryDate: new Date().toISOString().slice(0, 16),
        exitDate: new Date().toISOString().slice(0, 16),
        session: 'NEW_YORK',
        
        entryPrice: 19850.00,
        exitPrice: 19975.00,
        stopLossPrice: 19800.00,
        takeProfitPrice: 19975.00,
        quantity: 2,
        contractMultiplier: 20,
        leverage: 1,
        
        commission: 8.50,
        swap: 0,
        spreadCost: 0,
        slippage: 0,
        fees: 0,
        
        entryRationale: 'Clean 15m Fair Value Gap fill following London high liquidity sweep.',
        exitRationale: 'Reached 1:2.5R objective into opposing Asian session liquidity pool.',
        notes: 'Execution was smooth and strictly adhered to trade management rules.',
        confluencesStr: '15m FVG, Liquidity Sweep, 1m MSS, Higher Timeframe Order Block',
        tagsStr: 'A+ Setup, London-NY Overlap, Trend Following',
        
        preEmotion: 'FOCUSED',
        postEmotion: 'SATISFIED',
        disciplineScore: 9,
        confidenceScore: 9,
        stressLevel: 2,
        patienceScore: 8,
        fomoTendency: 2,
        revengeTendency: 1,
        impulsivityScore: 2,
        ruleAdherenceScore: 9,
        decisionQuality: 'EXCELLENT',
        followedTradingPlan: true,
        selectedMistakes: [],
        tradingHabits: ['Pre-market routine & level mapping completed', 'Hard Stop Loss placed immediately at entry'],
        
        attachments: [],
        customFieldKey: '',
        customFieldValue: '',
        customFields: {},
      });
    }
  }, [initialTrade, isOpen, selectedAccountId, accounts, strategies]);

  // Real-time live calculation via Centralized Calculation Engine
  const liveFinancials = CalculationEngine.calculateTradeFinancials(
    {
      direction: formData.direction,
      entryPrice: formData.entryPrice,
      exitPrice: formData.exitPrice,
      quantity: formData.quantity,
      contractMultiplier: formData.contractMultiplier,
      stopLossPrice: formData.stopLossPrice,
      takeProfitPrice: formData.takeProfitPrice,
      commission: formData.commission,
      swap: formData.swap,
      spreadCost: formData.spreadCost,
      fees: formData.fees,
      slippage: formData.slippage,
      entryDate: formData.entryDate,
      exitDate: formData.status === 'CLOSED' ? formData.exitDate : undefined,
      status: formData.status,
    },
    accountCapital
  );

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    const newAtt: Attachment = {
      id: 'att_' + Date.now(),
      name: newAttachmentName.trim() || 'Chart Screenshot',
      url: newAttachmentUrl.trim(),
      type: newAttachmentType,
      timestamp: new Date().toISOString(),
    };
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, newAtt],
    }));
    setNewAttachmentUrl('');
    setNewAttachmentName('');
  };

  const handleRemoveAttachment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== id),
    }));
  };

  const handleAddCustomField = () => {
    if (!formData.customFieldKey.trim()) return;
    setFormData(prev => ({
      ...prev,
      customFields: {
        ...prev.customFields,
        [prev.customFieldKey.trim()]: prev.customFieldValue.trim(),
      },
      customFieldKey: '',
      customFieldValue: '',
    }));
  };

  const handleRemoveCustomField = (key: string) => {
    setFormData(prev => {
      const next = { ...prev.customFields };
      delete next[key];
      return { ...prev, customFields: next };
    });
  };

  const handleToggleMistake = (mistakeName: string) => {
    setFormData(prev => {
      const exists = prev.selectedMistakes.includes(mistakeName);
      const next = exists 
        ? prev.selectedMistakes.filter(m => m !== mistakeName)
        : [...prev.selectedMistakes, mistakeName];
      return { ...prev, selectedMistakes: next };
    });
  };

  const handleToggleHabit = (habit: string) => {
    setFormData(prev => {
      const exists = prev.tradingHabits.includes(habit);
      const next = exists
        ? prev.tradingHabits.filter(h => h !== habit)
        : [...prev.tradingHabits, habit];
      return { ...prev, tradingHabits: next };
    });
  };

  const handleAddCustomMistakeDirect = async () => {
    if (!newCustomMistakeName.trim()) return;
    try {
      const created = await createTaxonomyMistake({
        name: newCustomMistakeName.trim(),
        description: 'User created custom mistake',
        categoryId: selectedMistakeCat !== 'ALL' ? selectedMistakeCat : 'cat_psychology_bias',
        categoryName: mistakeCategories.find(c => c.id === selectedMistakeCat)?.name || 'Psychology, Bias & Tilt',
        severity: 'MODERATE',
      });
      setFormData(prev => ({
        ...prev,
        selectedMistakes: [...prev.selectedMistakes, created.name],
      }));
      setNewCustomMistakeName('');
      setShowAddCustomMistake(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const confluences = formData.confluencesStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const tags = formData.tagsStr
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const matchedStrat = strategies.find(s => s.id === formData.strategyId);

    const tradePayload = {
      accountId: formData.accountId,
      instrument: formData.instrument.toUpperCase().trim(),
      assetClass: formData.assetClass,
      direction: formData.direction,
      status: formData.status,
      
      strategyId: formData.strategyId || undefined,
      strategyName: matchedStrat ? matchedStrat.name : formData.strategyName || undefined,
      setupName: formData.setupName.trim() || undefined,
      playbookName: formData.playbookName.trim() || undefined,
      confluences,
      tags,
      
      entryDate: new Date(formData.entryDate).toISOString(),
      exitDate: formData.status === 'CLOSED' ? new Date(formData.exitDate).toISOString() : undefined,
      session: formData.session,
      
      entryPrice: Number(formData.entryPrice),
      exitPrice: formData.status === 'CLOSED' ? Number(formData.exitPrice) : undefined,
      stopLossPrice: formData.stopLossPrice ? Number(formData.stopLossPrice) : undefined,
      takeProfitPrice: formData.takeProfitPrice ? Number(formData.takeProfitPrice) : undefined,
      
      quantity: Number(formData.quantity),
      contractMultiplier: Number(formData.contractMultiplier) || 1,
      leverage: Number(formData.leverage) || 1,
      
      commission: Number(formData.commission) || 0,
      swap: Number(formData.swap) || 0,
      spreadCost: Number(formData.spreadCost) || 0,
      slippage: Number(formData.slippage) || 0,
      fees: Number(formData.fees) || 0,
      
      entryRationale: formData.entryRationale.trim() || undefined,
      exitRationale: formData.exitRationale.trim() || undefined,
      notes: formData.notes.trim() || undefined,
      
      marketContext: {
        timeframe: formData.timeframe,
        higherTimeframeTrend: formData.higherTimeframeTrend,
        marketCondition: formData.marketCondition,
        session: formData.session,
      },
      
      psychology: {
        preTradeEmotion: formData.preEmotion,
        postTradeEmotion: formData.postEmotion,
        disciplineScore: Number(formData.disciplineScore),
        confidenceScore: Number(formData.confidenceScore),
        stressLevel: Number(formData.stressLevel),
        patienceScore: Number(formData.patienceScore),
        fomoTendency: Number(formData.fomoTendency),
        revengeTendency: Number(formData.revengeTendency),
        impulsivityScore: Number(formData.impulsivityScore),
        ruleAdherenceScore: Number(formData.ruleAdherenceScore),
        decisionQuality: formData.decisionQuality,
        followedTradingPlan: formData.followedTradingPlan,
        mistakes: formData.selectedMistakes,
        tradingHabits: formData.tradingHabits,
      },
      
      attachments: formData.attachments,
      customFields: formData.customFields,
    };

    // Strict Validation via TradeService
    const validation = TradeService.validateTrade(tradePayload);
    if (!validation.isValid) {
      setError(validation.errors.join(' '));
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(tradePayload);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save trade execution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTrade ? `Edit Trade: ${initialTrade.instrument}` : 'Log Trade Execution'}
      description="Record institutional-grade trade parameters, execution prices, confluences, and psychology."
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#848B98]">
              Account: <strong className="text-white">{currentAccount?.name || 'None'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit} isLoading={isSubmitting}>
              {initialTrade ? 'Update Trade' : 'Save & Calculate'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Live Calculation Preview Banner */}
        <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A] grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-sans text-[#848B98] block">Planned Risk</span>
              {liveFinancials.plannedRiskPercent > (riskPolicy?.maxRiskPerTradePercent || 1.5) && (
                <span className="text-[8px] font-sans font-bold px-1 rounded bg-rose-500/20 text-rose-400">
                  Exceeds Policy ({riskPolicy?.maxRiskPerTradePercent}%)
                </span>
              )}
            </div>
            <span className={`text-sm font-bold ${liveFinancials.plannedRiskPercent > (riskPolicy?.maxRiskPerTradePercent || 1.5) ? 'text-rose-400' : 'text-[#F3F4F6]'}`}>
              {formatCurrency(liveFinancials.plannedRiskAmount)}
            </span>
            <span className="text-[9px] text-[#848B98] block font-sans">
              {liveFinancials.plannedRiskPercent}% equity
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Planned R:R</span>
            <span className="text-sm font-bold text-blue-400">
              1:{liveFinancials.plannedRRRatio || '—'}
            </span>
            <span className="text-[9px] text-[#848B98] block font-sans">
              Risk/Reward
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Achieved R</span>
            <span className={`text-sm font-bold ${liveFinancials.achievedRMultiple && liveFinancials.achievedRMultiple >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {liveFinancials.achievedRMultiple !== undefined ? `${liveFinancials.achievedRMultiple > 0 ? '+' : ''}${liveFinancials.achievedRMultiple}R` : '—'}
            </span>
            <span className="text-[9px] text-[#848B98] block font-sans">
              Realized
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Net Realized P&L</span>
            <span className={`text-sm font-bold ${liveFinancials.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {liveFinancials.netPnL >= 0 ? '+' : ''}{formatCurrency(liveFinancials.netPnL)}
            </span>
            <span className="text-[9px] text-[#848B98] block font-sans">
              {liveFinancials.pnlPercentage > 0 ? '+' : ''}{liveFinancials.pnlPercentage}% return
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-sans text-[#848B98] block">Holding Duration</span>
            <span className="text-sm font-bold text-zinc-300">
              {liveFinancials.holdingTimeFormatted}
            </span>
            <Badge 
              variant={liveFinancials.outcome === 'WIN' ? 'emerald' : liveFinancials.outcome === 'LOSS' ? 'rose' : 'neutral'} 
              size="sm" 
              className="mt-0.5"
            >
              {liveFinancials.outcome}
            </Badge>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#22252A] gap-2 overflow-x-auto text-xs pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('EXECUTION')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXECUTION'
                ? 'bg-[#22252A] text-white'
                : 'text-[#848B98] hover:text-white hover:bg-[#1A1D21]'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            Execution & Prices
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STRATEGY')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'STRATEGY'
                ? 'bg-[#22252A] text-white'
                : 'text-[#848B98] hover:text-white hover:bg-[#1A1D21]'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-blue-400" />
            Strategy & Context
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('COSTS')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'COSTS'
                ? 'bg-[#22252A] text-white'
                : 'text-[#848B98] hover:text-white hover:bg-[#1A1D21]'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5 text-amber-400" />
            Execution Costs
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PSYCHOLOGY')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'PSYCHOLOGY'
                ? 'bg-[#22252A] text-white'
                : 'text-[#848B98] hover:text-white hover:bg-[#1A1D21]'
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
            Psychology & Notes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ATTACHMENTS')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'ATTACHMENTS'
                ? 'bg-[#22252A] text-white'
                : 'text-[#848B98] hover:text-white hover:bg-[#1A1D21]'
            }`}
          >
            <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
            Charts & Custom Fields ({formData.attachments.length})
          </button>
        </div>

        {/* Tab 1: Execution & Prices */}
        {activeTab === 'EXECUTION' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Trading Account *"
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.broker} • {acc.currency})
                  </option>
                ))}
              </Select>

              <Input
                label="Instrument / Pair *"
                value={formData.instrument}
                onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                placeholder="e.g. NQ, EURUSD, BTCUSDT"
              />

              <Select
                label="Asset Class *"
                value={formData.assetClass}
                onChange={(e) => setFormData({ ...formData, assetClass: e.target.value as AssetClass })}
              >
                <option value="INDICES">Indices (NQ, ES, DAX)</option>
                <option value="FOREX">Forex (EURUSD, GBPJPY)</option>
                <option value="COMMODITIES">Commodities (XAUUSD, Oil)</option>
                <option value="CRYPTO">Crypto (BTC, ETH, SOL)</option>
                <option value="EQUITIES">Equities (NVDA, TSLA, AAPL)</option>
                <option value="FUTURES">Futures</option>
                <option value="OPTIONS">Options</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Trade Direction *"
                value={formData.direction}
                onChange={(e) => setFormData({ ...formData, direction: e.target.value as TradeDirection })}
              >
                <option value="LONG">LONG (Buy / Bullish)</option>
                <option value="SHORT">SHORT (Sell / Bearish)</option>
              </Select>

              <Select
                label="Trade Status *"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="CLOSED">CLOSED (Completed Trade)</option>
                <option value="OPEN">OPEN (Active Position)</option>
              </Select>

              <Select
                label="Market Session *"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value as MarketSession })}
              >
                <option value="NEW_YORK">New York (US Regular)</option>
                <option value="LONDON">London Session</option>
                <option value="LONDON_NY_OVERLAP">London / NY Overlap</option>
                <option value="TOKYO">Tokyo / Asian</option>
                <option value="SYDNEY">Sydney Session</option>
                <option value="OFF_HOURS">Off Hours / Weekend</option>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Entry Date & Time *"
                type="datetime-local"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
              />
              {formData.status === 'CLOSED' ? (
                <Input
                  label="Exit Date & Time *"
                  type="datetime-local"
                  value={formData.exitDate}
                  onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                />
              ) : (
                <div className="flex items-center text-xs text-[#848B98] p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                  <Clock className="h-4 w-4 mr-2 text-blue-400" />
                  Position is actively open. Duration updates continuously.
                </div>
              )}
            </div>

            {/* Price Points */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Entry Price *"
                type="number"
                step="any"
                value={formData.entryPrice || ''}
                onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) || 0 })}
              />

              {formData.status === 'CLOSED' ? (
                <Input
                  label="Exit Price *"
                  type="number"
                  step="any"
                  value={formData.exitPrice || ''}
                  onChange={(e) => setFormData({ ...formData, exitPrice: parseFloat(e.target.value) || 0 })}
                />
              ) : (
                <div className="opacity-50 pointer-events-none">
                  <Input label="Exit Price" value="OPEN" disabled />
                </div>
              )}

              <Input
                label="Stop Loss Price"
                type="number"
                step="any"
                value={formData.stopLossPrice || ''}
                onChange={(e) => setFormData({ ...formData, stopLossPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              <Input
                label="Take Profit Price"
                type="number"
                step="any"
                value={formData.takeProfitPrice || ''}
                onChange={(e) => setFormData({ ...formData, takeProfitPrice: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            {/* Position Sizing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Quantity / Lot Size *"
                type="number"
                step="any"
                value={formData.quantity || ''}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
              />

              <Input
                label="Contract Multiplier"
                type="number"
                step="any"
                value={formData.contractMultiplier || ''}
                onChange={(e) => setFormData({ ...formData, contractMultiplier: parseFloat(e.target.value) || 1 })}
                helperText="e.g., 20 for NQ, 50 for ES, 100 for Gold"
              />

              <Input
                label="Leverage (Optional)"
                type="number"
                step="any"
                value={formData.leverage || 1}
                onChange={(e) => setFormData({ ...formData, leverage: parseFloat(e.target.value) || 1 })}
                placeholder="1"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Strategy & Context */}
        {activeTab === 'STRATEGY' && (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Trading Strategy"
                value={formData.strategyId}
                onChange={(e) => setFormData({ ...formData, strategyId: e.target.value })}
              >
                <option value="">-- Discretionary / No Strategy --</option>
                {strategies.map(strat => (
                  <option key={strat.id} value={strat.id}>
                    {strat.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Setup Pattern Name"
                value={formData.setupName}
                onChange={(e) => setFormData({ ...formData, setupName: e.target.value })}
                placeholder="e.g. FVG Retest, Silver Bullet"
              />

              <Input
                label="Playbook Model"
                value={formData.playbookName}
                onChange={(e) => setFormData({ ...formData, playbookName: e.target.value })}
                placeholder="e.g. NY Morning Invalidation"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Primary Timeframe"
                value={formData.timeframe}
                onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
              >
                <option value="1m">1 Minute (1m)</option>
                <option value="5m">5 Minutes (5m)</option>
                <option value="15m">15 Minutes (15m)</option>
                <option value="1h">1 Hour (1h)</option>
                <option value="4h">4 Hours (4h)</option>
                <option value="D">Daily (D)</option>
              </Select>

              <Select
                label="Higher Timeframe Trend"
                value={formData.higherTimeframeTrend}
                onChange={(e) => setFormData({ ...formData, higherTimeframeTrend: e.target.value as any })}
              >
                <option value="BULLISH">Bullish Trend</option>
                <option value="BEARISH">Bearish Trend</option>
                <option value="NEUTRAL">Neutral / Range</option>
              </Select>

              <Select
                label="Market Condition"
                value={formData.marketCondition}
                onChange={(e) => setFormData({ ...formData, marketCondition: e.target.value as MarketCondition })}
              >
                <option value="EXPANSION">Expansion / Momentum</option>
                <option value="TRENDING_UP">Trending Up</option>
                <option value="TRENDING_DOWN">Trending Down</option>
                <option value="RANGING">Ranging / Consolidation</option>
                <option value="HIGH_VOLATILITY">High Volatility</option>
                <option value="COMPRESSION">Compression</option>
              </Select>
            </div>

            <Input
              label="Confluences (Comma-separated)"
              value={formData.confluencesStr}
              onChange={(e) => setFormData({ ...formData, confluencesStr: e.target.value })}
              placeholder="15m FVG, Liquidity Sweep, 1m MSS, Higher Timeframe OB"
            />

            <Input
              label="Custom Tags (Comma-separated)"
              value={formData.tagsStr}
              onChange={(e) => setFormData({ ...formData, tagsStr: e.target.value })}
              placeholder="A+ Setup, News Trade, Scalp, Swing"
            />
          </div>
        )}

        {/* Tab 3: Execution Costs */}
        {activeTab === 'COSTS' && (
          <div className="space-y-4 pt-1">
            <p className="text-xs text-[#848B98]">
              Accurately account for all frictional costs, spreads, broker commissions, overnight financing swaps, and execution slippage.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input
                label="Commission ($)"
                type="number"
                step="any"
                value={formData.commission || ''}
                onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              <Input
                label="Swap / Overnight ($)"
                type="number"
                step="any"
                value={formData.swap || ''}
                onChange={(e) => setFormData({ ...formData, swap: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              <Input
                label="Spread Cost ($)"
                type="number"
                step="any"
                value={formData.spreadCost || ''}
                onChange={(e) => setFormData({ ...formData, spreadCost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              <Input
                label="Execution Slippage ($)"
                type="number"
                step="any"
                value={formData.slippage || ''}
                onChange={(e) => setFormData({ ...formData, slippage: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />

              <Input
                label="Exchange / Regulatory Fees ($)"
                type="number"
                step="any"
                value={formData.fees || ''}
                onChange={(e) => setFormData({ ...formData, fees: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] flex justify-between items-center text-xs">
              <span className="text-[#848B98]">Total Frictional Execution Cost:</span>
              <span className="font-bold text-amber-400 font-mono">
                -${((formData.commission || 0) + (formData.swap || 0) + (formData.spreadCost || 0) + (formData.slippage || 0) + (formData.fees || 0)).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Psychology & Notes */}
        {activeTab === 'PSYCHOLOGY' && (
          <div className="space-y-5 pt-1">
            {/* Emotional States & Plan Adherence */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <BrainCircuit className="h-3.5 w-3.5 text-purple-400" />
                Emotional State & Execution Quality
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select
                  label="Pre-Trade Emotional State"
                  value={formData.preEmotion}
                  onChange={(e) => setFormData({ ...formData, preEmotion: e.target.value as any })}
                >
                  <option value="CALM">Calm & Centered</option>
                  <option value="FOCUSED">Focused & Prepared</option>
                  <option value="CONFIDENT">Confident</option>
                  <option value="OPTIMISTIC">Optimistic</option>
                  <option value="EAGER">Eager / Excited</option>
                  <option value="ANXIOUS">Anxious / Hesitant</option>
                  <option value="FOMO">FOMO / Chasing</option>
                  <option value="REVENGE">Revenge / Tilted</option>
                  <option value="FATIGUED">Fatigued / Tired</option>
                  <option value="IMPATIENT">Impatient / Rushing</option>
                  <option value="BORED">Bored / Forcing Trade</option>
                </Select>

                <Select
                  label="Post-Trade Emotional State"
                  value={formData.postEmotion}
                  onChange={(e) => setFormData({ ...formData, postEmotion: e.target.value as any })}
                >
                  <option value="SATISFIED">Satisfied</option>
                  <option value="DISCIPLINED">Disciplined (Followed Plan)</option>
                  <option value="PROUD">Proud of Execution</option>
                  <option value="RELIEVED">Relieved</option>
                  <option value="NEUTRAL">Neutral</option>
                  <option value="FRUSTRATED">Frustrated</option>
                  <option value="ANGRY">Angry</option>
                  <option value="REGRETFUL">Regretful (Rule Deviation)</option>
                  <option value="DISAPPOINTED">Disappointed</option>
                  <option value="EUPHORIC">Euphoric / Overexcited</option>
                </Select>

                <Select
                  label="Decision Quality Assessment"
                  value={formData.decisionQuality}
                  onChange={(e) => setFormData({ ...formData, decisionQuality: e.target.value as any })}
                >
                  <option value="EXCELLENT">A+ Execution (Flawless process)</option>
                  <option value="GOOD">Good (Minor non-fatal slippage)</option>
                  <option value="SUB_OPTIMAL">Sub-optimal (Hesitation / early exit)</option>
                  <option value="POOR">Poor (Rule breach / chasing)</option>
                  <option value="IRRATIONAL">Irrational (Pure tilt / revenge)</option>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-[#22252A]">
                <span className="text-xs text-[#848B98]">Strict Trading Plan Followed?</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={formData.followedTradingPlan ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, followedTradingPlan: true })}
                    className="h-7 text-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                    Yes (Strict)
                  </Button>
                  <Button
                    type="button"
                    variant={!formData.followedTradingPlan ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setFormData({ ...formData, followedTradingPlan: false })}
                    className="h-7 text-xs text-rose-400 border-rose-500/30 hover:border-rose-500"
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1 text-rose-400" />
                    Plan Deviation
                  </Button>
                </div>
              </div>
            </div>

            {/* Behavioral Sliders */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-blue-400" />
                Behavioral Quantification Sliders (1-10)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">Discipline Rating</span>
                    <span className="font-bold text-emerald-400 font-mono">{formData.disciplineScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.disciplineScore}
                    onChange={(e) => setFormData({ ...formData, disciplineScore: parseInt(e.target.value) || 9 })}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">Confidence Score</span>
                    <span className="font-bold text-blue-400 font-mono">{formData.confidenceScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.confidenceScore}
                    onChange={(e) => setFormData({ ...formData, confidenceScore: parseInt(e.target.value) || 9 })}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">Stress Level</span>
                    <span className="font-bold text-rose-400 font-mono">{formData.stressLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.stressLevel}
                    onChange={(e) => setFormData({ ...formData, stressLevel: parseInt(e.target.value) || 2 })}
                    className="w-full accent-rose-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">Patience / Waiting</span>
                    <span className="font-bold text-indigo-400 font-mono">{formData.patienceScore}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.patienceScore}
                    onChange={(e) => setFormData({ ...formData, patienceScore: parseInt(e.target.value) || 8 })}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">FOMO Urge</span>
                    <span className="font-bold text-amber-400 font-mono">{formData.fomoTendency}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.fomoTendency}
                    onChange={(e) => setFormData({ ...formData, fomoTendency: parseInt(e.target.value) || 2 })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-[#848B98]">Revenge Urge</span>
                    <span className="font-bold text-red-400 font-mono">{formData.revengeTendency}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData.revengeTendency}
                    onChange={(e) => setFormData({ ...formData, revengeTendency: parseInt(e.target.value) || 1 })}
                    className="w-full accent-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Mistake Taxonomy Multi-Select */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    Mistake Taxonomy & Error Tagging
                  </h4>
                  <p className="text-[11px] text-[#848B98] mt-0.5">
                    Select any execution or psychological errors committed during this trade.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCustomMistake(!showAddCustomMistake)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Custom Mistake
                </Button>
              </div>

              {/* Add Custom Mistake inline form */}
              {showAddCustomMistake && (
                <div className="p-2.5 rounded-lg bg-[#0C0D0F] border border-amber-500/30 flex gap-2 items-center">
                  <Input
                    placeholder="E.g. Distracted by social media news..."
                    value={newCustomMistakeName}
                    onChange={(e) => setNewCustomMistakeName(e.target.value)}
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleAddCustomMistakeDirect}
                    className="h-8 text-xs shrink-0"
                  >
                    Add to Taxonomy
                  </Button>
                </div>
              )}

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedMistakeCat('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    selectedMistakeCat === 'ALL'
                      ? 'bg-zinc-700 text-white'
                      : 'bg-[#0C0D0F] text-[#848B98] hover:text-white border border-[#22252A]'
                  }`}
                >
                  All ({mistakeTaxonomy.length})
                </button>
                {mistakeCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedMistakeCat(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                      selectedMistakeCat === cat.id
                        ? 'bg-zinc-700 text-white'
                        : 'bg-[#0C0D0F] text-[#848B98] hover:text-white border border-[#22252A]'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Available Mistakes Badges */}
              <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                {mistakeTaxonomy
                  .filter(m => selectedMistakeCat === 'ALL' || m.categoryId === selectedMistakeCat)
                  .map(mistake => {
                    const isSelected = formData.selectedMistakes.includes(mistake.name);
                    return (
                      <button
                        key={mistake.id}
                        type="button"
                        onClick={() => handleToggleMistake(mistake.name)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                            : 'bg-[#15171A] text-[#848B98] border-[#22252A] hover:border-zinc-600 hover:text-white'
                        }`}
                        title={mistake.description}
                      >
                        {isSelected ? <CheckCircle2 className="h-3 w-3 text-rose-400" /> : <Plus className="h-3 w-3" />}
                        <span>{mistake.name}</span>
                        {mistake.severity === 'SEVERE' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/30 text-rose-300">High</span>
                        )}
                      </button>
                    );
                  })}
              </div>

              {formData.selectedMistakes.length > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-[#848B98]">Selected Mistakes:</span>
                  {formData.selectedMistakes.map(mName => (
                    <Badge key={mName} variant="rose" size="sm">
                      {mName}
                      <button
                        type="button"
                        onClick={() => handleToggleMistake(mName)}
                        className="ml-1 hover:text-white"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Trading Habits Checklist */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Process & Trading Habits Checklist
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_TRADING_HABITS.map((habit) => {
                  const isChecked = formData.tradingHabits.includes(habit);
                  return (
                    <button
                      key={habit}
                      type="button"
                      onClick={() => handleToggleHabit(habit)}
                      className={`p-2 rounded-lg text-left text-xs transition-colors flex items-center gap-2 border ${
                        isChecked
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#0C0D0F] text-[#848B98] border-[#22252A] hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${isChecked ? 'text-emerald-400' : 'text-zinc-600'}`} />
                      <span className="truncate">{habit}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trade Rationale & Lessons */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                  Entry Rationale & Market Thesis
                </label>
                <textarea
                  value={formData.entryRationale}
                  onChange={(e) => setFormData({ ...formData, entryRationale: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0C0D0F] border border-[#22252A] p-2.5 text-xs text-white placeholder-[#606773] focus:outline-none focus:border-emerald-500"
                  placeholder="What prompted the entry? Mention order flow, levels, or indicator triggers."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                  Exit Rationale & Target Mechanics
                </label>
                <textarea
                  value={formData.exitRationale}
                  onChange={(e) => setFormData({ ...formData, exitRationale: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0C0D0F] border border-[#22252A] p-2.5 text-xs text-white placeholder-[#606773] focus:outline-none focus:border-emerald-500"
                  placeholder="Why did you exit here? Was it TP hit, manual trailing, invalidation, or session close?"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#D1D5DB] mb-1">
                  Journal Notes & Lessons Learned
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg bg-[#0C0D0F] border border-[#22252A] p-2.5 text-xs text-white placeholder-[#606773] focus:outline-none focus:border-emerald-500"
                  placeholder="Any observations, lessons, or psychological adjustments for the future."
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Attachments & Custom Fields */}
        {activeTab === 'ATTACHMENTS' && (
          <div className="space-y-4 pt-1">
            {/* Attachments Section */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-pink-400" />
                Chart Screenshots & Visual Attachments
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Screenshot URL (TradingView, Imgur, etc.)"
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                />
                <Input
                  placeholder="Caption / Description"
                  value={newAttachmentName}
                  onChange={(e) => setNewAttachmentName(e.target.value)}
                />
                <div className="flex gap-2">
                  <Select
                    value={newAttachmentType}
                    onChange={(e) => setNewAttachmentType(e.target.value as any)}
                  >
                    <option value="ENTRY_CHART">Entry Chart</option>
                    <option value="EXIT_CHART">Exit Chart</option>
                    <option value="HIGHER_TIMEFRAME">Higher TF</option>
                    <option value="NOTES_DOC">Notes Doc</option>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddAttachment}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {formData.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {formData.attachments.map((att) => (
                    <div key={att.id} className="p-2 rounded-lg bg-[#0C0D0F] border border-[#22252A] flex items-center justify-between">
                      <div className="truncate mr-2">
                        <span className="font-semibold text-white block text-xs truncate">{att.name}</span>
                        <span className="text-[10px] text-[#848B98] truncate block">{att.url}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        className="p-1 rounded text-[#848B98] hover:text-rose-400 hover:bg-[#22252A]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#848B98] italic">No chart screenshots attached yet.</p>
              )}
            </div>

            {/* Custom Fields Section */}
            <div className="p-3.5 rounded-xl bg-[#15171A] border border-[#22252A] space-y-3">
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="h-3.5 w-3.5 text-emerald-400" />
                Custom Metadata Fields
              </h4>

              <div className="flex gap-2">
                <Input
                  placeholder="Field Key (e.g., NewsEvent, BotVersion)"
                  value={formData.customFieldKey}
                  onChange={(e) => setFormData({ ...formData, customFieldKey: e.target.value })}
                />
                <Input
                  placeholder="Field Value (e.g., CPI Release, v2.4)"
                  value={formData.customFieldValue}
                  onChange={(e) => setFormData({ ...formData, customFieldValue: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustomField}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {Object.keys(formData.customFields).length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {Object.entries(formData.customFields).map(([k, v]) => (
                    <div key={k} className="p-1.5 px-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] flex items-center gap-2 text-xs">
                      <span className="text-[#848B98] font-mono">{k}:</span>
                      <span className="text-white font-medium">{String(v)}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomField(k)}
                        className="text-[#848B98] hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[#848B98] italic">No custom fields added.</p>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
