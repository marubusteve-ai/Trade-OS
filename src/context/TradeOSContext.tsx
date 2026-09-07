/**
 * TradeOS Primary Application State & Reactive Calculation Provider
 * 
 * Central coordinator syncing Accounts, Trades, Strategies, and Financial Analytics.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Account, Trade, Strategy, Playbook, Workspace } from '../types/domain';
import { AccountPerformanceSummary, FinancialMetrics, PropFirmComplianceStatus, DrawdownStats } from '../types/calculations';
import { RiskPolicy, RiskBudgets, ExposureMetrics, RiskPolicyEvaluation } from '../types/risk';
import { PropFirm, RuleSet, PropFirmEvaluationResult, MultiAccountPropComparison, Challenge } from '../types/propFirm';
import { MistakeCategory, MistakeTaxonomyItem, SessionCheckIn, PsychologyAnalyticsReport } from '../types/psychology';
import { ImportBatch, ImportPreviewResult, ImportExecutionOptions } from '../types/importExport';
import { AutomationRule, NotificationPreferences, AutomationExecutionLog, AutomationTriggerEvent } from '../types/automation';
import { AccountRepository } from '../repositories/accountRepository';
import { TradeRepository } from '../repositories/tradeRepository';
import { StrategyRepository } from '../repositories/strategyRepository';
import { PlaybookRepository } from '../repositories/playbookRepository';
import { WorkspaceRepository } from '../repositories/workspaceRepository';
import { PropFirmRepository } from '../repositories/propFirmRepository';
import { PsychologyRepository } from '../repositories/psychologyRepository';
import { ImportExportRepository } from '../repositories/importExportRepository';
import { AutomationRepository } from '../repositories/automationRepository';
import { CalculationEngine } from '../services/calculationEngine';
import { RiskEngine } from '../services/riskEngine';
import { PropFirmEngine } from '../services/propFirmEngine';
import { PsychologyEngine } from '../services/psychologyEngine';
import { ImportExportEngine } from '../services/importExportEngine';
import { AutomationEngine } from '../services/automationEngine';
import { SeedService } from '../services/seedService';
import { AccountService } from '../services/accountService';
import { TradeService } from '../services/tradeService';
import { SyncRepository } from '../repositories/syncRepository';
import { useNotification } from './NotificationContext';

interface TradeOSContextType {
  // Accounts
  accounts: Account[];
  selectedAccountId: string | 'ALL';
  selectedAccount: Account | null;
  setSelectedAccountId: (id: string | 'ALL') => void;
  createAccount: (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<boolean>;
  archiveAccount: (id: string) => Promise<Account>;
  restoreAccount: (id: string) => Promise<Account>;
  duplicateAccount: (id: string, newName?: string) => Promise<Account>;
  toggleAccountFavorite: (id: string) => Promise<Account>;
  
  // Trades
  trades: Trade[];
  selectedAccountTrades: Trade[];
  createTrade: (tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>) => Promise<Trade>;
  updateTrade: (id: string, updates: Partial<Trade>) => Promise<Trade>;
  deleteTrade: (id: string) => Promise<boolean>;
  duplicateTrade: (id: string) => Promise<Trade>;
  
  // Strategies & Playbooks
  strategies: Strategy[];
  playbooks: Playbook[];
  createStrategy: (strategyData: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>) => Promise<Strategy>;
  createPlaybook: (playbookData: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Playbook>;
  
  // Workspaces
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  
  // Calculated Analytics & Summary
  metrics: FinancialMetrics;
  drawdown: DrawdownStats;
  compliance: PropFirmComplianceStatus | null;
  summary: AccountPerformanceSummary | null;

  // Quantitative Risk Management & Policy
  riskPolicy: RiskPolicy;
  riskBudgets: RiskBudgets;
  exposureMetrics: ExposureMetrics;
  riskEvaluation: RiskPolicyEvaluation;
  updateRiskPolicy: (updates: Partial<RiskPolicy>) => void;
  resetRiskPolicy: () => void;

  // Configurable Prop-Firm Engine
  propFirms: PropFirm[];
  ruleSets: RuleSet[];
  activePropEvaluation: PropFirmEvaluationResult | null;
  multiAccountComparison: MultiAccountPropComparison;
  createPropFirm: (firmData: Omit<PropFirm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<PropFirm>;
  updatePropFirm: (id: string, updates: Partial<PropFirm>) => Promise<PropFirm>;
  deletePropFirm: (id: string) => Promise<boolean>;
  createRuleSet: (ruleSetData: Omit<RuleSet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<RuleSet>;
  updateRuleSet: (id: string, updates: Partial<RuleSet>) => Promise<RuleSet>;
  deleteRuleSet: (id: string) => Promise<boolean>;
  resetPropDefaults: () => Promise<void>;
  
  // Psychology & Mistake Management Subsystem
  mistakeCategories: MistakeCategory[];
  mistakeTaxonomy: MistakeTaxonomyItem[];
  sessionCheckIns: SessionCheckIn[];
  psychologyReport: PsychologyAnalyticsReport;
  createMistakeCategory: (categoryData: Omit<MistakeCategory, 'id' | 'isCustom'>) => Promise<MistakeCategory>;
  deleteMistakeCategory: (id: string) => Promise<boolean>;
  createTaxonomyMistake: (mistakeData: Omit<MistakeTaxonomyItem, 'id' | 'isCustom'>) => Promise<MistakeTaxonomyItem>;
  deleteTaxonomyMistake: (id: string) => Promise<boolean>;
  createSessionCheckIn: (checkInData: Omit<SessionCheckIn, 'id' | 'userId' | 'timestamp'>) => Promise<SessionCheckIn>;
  deleteSessionCheckIn: (id: string) => Promise<boolean>;

  // Import / Export Engine
  importBatches: ImportBatch[];
  refreshImportBatches: () => Promise<void>;
  importTradesBatch: (filename: string, previewResult: ImportPreviewResult, options: ImportExecutionOptions) => Promise<{ batch: ImportBatch; importedTrades: Trade[]; skippedCount: number; errorsCount: number }>;
  rollbackImportBatch: (batchId: string) => Promise<{ success: boolean; deletedCount: number; batch: ImportBatch }>;
  deleteImportBatchRecord: (batchId: string) => Promise<boolean>;
  exportTradesToCsv: (customTrades?: Trade[]) => string;
  exportTradesToJson: (customTrades?: Trade[]) => string;

  // Automation & Notification Subsystem
  automationRules: AutomationRule[];
  notificationPreferences: NotificationPreferences;
  automationLogs: AutomationExecutionLog[];
  createAutomationRule: (ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'triggerCount'>) => Promise<AutomationRule>;
  updateAutomationRule: (id: string, updates: Partial<AutomationRule>) => Promise<AutomationRule>;
  deleteAutomationRule: (id: string) => Promise<boolean>;
  toggleAutomationRule: (id: string) => Promise<AutomationRule | null>;
  resetAutomationDefaults: () => Promise<void>;
  updateNotificationPreferences: (updates: Partial<NotificationPreferences>) => Promise<NotificationPreferences>;
  evaluateAutomationRules: (event?: AutomationTriggerEvent, targetTrade?: Trade) => Promise<AutomationExecutionLog[]>;
  clearAutomationLogs: () => Promise<void>;

  // State
  isLoading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  refreshData: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
}

const TradeOSContext = createContext<TradeOSContextType | undefined>(undefined);

const accountRepo = new AccountRepository();
const tradeRepo = new TradeRepository();
const strategyRepo = new StrategyRepository();
const playbookRepo = new PlaybookRepository();
const workspaceRepo = new WorkspaceRepository();
const propFirmRepo = new PropFirmRepository();
const importExportRepo = new ImportExportRepository();

export const TradeOSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { notify } = useNotification();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [propFirms, setPropFirms] = useState<PropFirm[]>([]);
  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [mistakeCategories, setMistakeCategories] = useState<MistakeCategory[]>([]);
  const [mistakeTaxonomy, setMistakeTaxonomy] = useState<MistakeTaxonomyItem[]>([]);
  const [sessionCheckIns, setSessionCheckIns] = useState<SessionCheckIn[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(() =>
    AutomationRepository.getPreferences(currentUser?.id || 'anonymous')
  );
  const [automationLogs, setAutomationLogs] = useState<AutomationExecutionLog[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [riskPolicy, setRiskPolicy] = useState<RiskPolicy>(() => 
    RiskEngine.loadPolicy(currentUser?.id || 'anonymous', undefined)
  );

  const userId = currentUser?.id || 'anonymous';
  const activeWorkspace = workspaces[0] || null;
  const workspaceId = activeWorkspace?.id || `ws_${userId.slice(0, 6)}`;

  // Reload risk policy whenever user or selected account changes
  useEffect(() => {
    const accId = selectedAccountId === 'ALL' ? undefined : selectedAccountId;
    setRiskPolicy(RiskEngine.loadPolicy(userId, accId));
  }, [userId, selectedAccountId]);

  const updateRiskPolicy = (updates: Partial<RiskPolicy>) => {
    const merged: RiskPolicy = {
      ...riskPolicy,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    setRiskPolicy(merged);
    RiskEngine.savePolicy(merged);
  };

  const resetRiskPolicy = () => {
    const accId = selectedAccountId === 'ALL' ? undefined : selectedAccountId;
    const defaults = RiskEngine.resetPolicy(userId, accId);
    setRiskPolicy(defaults);
  };

  // Load user data whenever auth user changes
  const loadData = useCallback(async () => {
    if (!currentUser) {
      setAccounts([]);
      setTrades([]);
      setStrategies([]);
      setPlaybooks([]);
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let wsList = await workspaceRepo.getWorkspaces(userId);
      if (wsList.length === 0) {
        const newWs = await workspaceRepo.createWorkspace({
          userId,
          name: 'Primary Trading Desk',
          isDefault: true,
        });
        wsList = [newWs];
      }
      setWorkspaces(wsList);

      const accList = await accountRepo.getAccounts(userId);
      setAccounts(accList);

      // Auto-select first account if not set or set to ALL
      if (accList.length > 0 && selectedAccountId === 'ALL') {
        setSelectedAccountId(accList[0].id);
      } else if (accList.length === 0) {
        setSelectedAccountId('ALL');
      }

      const trList = await tradeRepo.getTrades(userId);
      setTrades(trList);

      const stratList = await strategyRepo.getStrategies(userId);
      setStrategies(stratList);

      const pbList = await playbookRepo.getPlaybooks(userId);
      setPlaybooks(pbList);

      const firmsList = propFirmRepo.getFirms(userId);
      setPropFirms(firmsList);

      const rulesList = propFirmRepo.getRuleSets(userId);
      setRuleSets(rulesList);

      const categories = PsychologyRepository.getCategories(userId);
      setMistakeCategories(categories);

      const taxonomy = PsychologyRepository.getTaxonomy(userId);
      setMistakeTaxonomy(taxonomy);

      const checkIns = PsychologyRepository.getCheckIns(userId);
      setSessionCheckIns(checkIns);

      const batches = await importExportRepo.getBatches(userId);
      setImportBatches(batches);

      const rules = AutomationRepository.getRules(userId);
      setAutomationRules(rules);

      const prefs = AutomationRepository.getPreferences(userId);
      setNotificationPreferences(prefs);

      const logs = AutomationRepository.getExecutionLogs(userId);
      setAutomationLogs(logs);
    } catch (e) {
      console.error('Error loading TradeOS data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, userId, selectedAccountId]);


  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  // Selected Account details
  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || null;

  // Filter trades for selected account or all
  const selectedAccountTrades = selectedAccountId === 'ALL'
    ? trades
    : trades.filter(t => t.accountId === selectedAccountId);

  // Synchronized Financial Calculations
  const startingBalance = selectedAccount ? selectedAccount.startingBalance : accounts.reduce((acc, a) => acc + a.startingBalance, 0) || 100000;
  
  const metrics = CalculationEngine.calculateMetrics(selectedAccountTrades, startingBalance);
  const drawdown = CalculationEngine.calculateDrawdown(selectedAccountTrades, startingBalance);
  const compliance = selectedAccount 
    ? CalculationEngine.evaluatePropFirmCompliance(selectedAccount, selectedAccountTrades)
    : null;

  const summary = selectedAccount
    ? CalculationEngine.buildAccountSummary(selectedAccount, selectedAccountTrades)
    : null;

  // Real-Time Risk Budgets, Exposure & Policy Evaluations
  const riskBudgets = RiskEngine.calculateRiskBudgets(selectedAccount, selectedAccountTrades, riskPolicy);
  const openTrades = selectedAccountTrades.filter(t => t.status === 'OPEN');
  const exposureMetrics = RiskEngine.calculateExposure(selectedAccount, openTrades, riskPolicy);
  const riskEvaluation = RiskEngine.evaluatePolicy(selectedAccount, selectedAccountTrades, riskPolicy);

  // Real-Time Configurable Prop-Firm Evaluations
  const allChallenges = propFirms.flatMap(f => f.challenges || []);
  const ruleSetsMap = new Map<string, RuleSet>(ruleSets.map(r => [r.id, r]));
  const challengesMap = new Map<string, Challenge>(allChallenges.map(c => [c.id, c]));
  
  const tradesMap = new Map<string, Trade[]>();
  accounts.forEach(acc => {
    tradesMap.set(acc.id, trades.filter(t => t.accountId === acc.id));
  });

  const multiAccountComparison = PropFirmEngine.compareMultiAccounts(
    accounts,
    tradesMap,
    ruleSetsMap,
    challengesMap
  );

  const activeRuleSet = selectedAccount?.ruleSetId
    ? ruleSetsMap.get(selectedAccount.ruleSetId) || ruleSets[0] || null
    : ruleSets.find(r => selectedAccount?.propFirm && r.name.toLowerCase().includes(selectedAccount.propFirm.toLowerCase())) || ruleSets[0] || null;

  const activeChallenge = selectedAccount?.challengeId
    ? challengesMap.get(selectedAccount.challengeId) || null
    : allChallenges.find(c => selectedAccount?.propFirm && c.name.toLowerCase().includes(selectedAccount.propFirm.toLowerCase())) || null;

  const activePropEvaluation = (selectedAccount && activeRuleSet)
    ? PropFirmEngine.evaluateAccount(
        selectedAccount,
        selectedAccountTrades,
        activeRuleSet,
        activeChallenge,
        selectedAccount.challengePhase || 1
      )
    : null;

  // Prop Firm Operations
  const createPropFirm = async (firmData: Omit<PropFirm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<PropFirm> => {
    const newFirm: PropFirm = {
      ...firmData,
      id: `firm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = propFirmRepo.saveFirm(userId, newFirm);
    setPropFirms(prev => [...prev, saved]);
    return saved;
  };

  const updatePropFirm = async (id: string, updates: Partial<PropFirm>): Promise<PropFirm> => {
    const updated = propFirmRepo.updateFirm(userId, id, updates);
    setPropFirms(prev => prev.map(f => f.id === id ? updated : f));
    return updated;
  };

  const deletePropFirm = async (id: string): Promise<boolean> => {
    const success = propFirmRepo.deleteFirm(userId, id);
    if (success) {
      setPropFirms(prev => prev.filter(f => f.id !== id));
    }
    return success;
  };

  const createRuleSet = async (ruleSetData: Omit<RuleSet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>): Promise<RuleSet> => {
    const newSet: RuleSet = {
      ...ruleSetData,
      id: `ruleset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = propFirmRepo.saveRuleSet(userId, newSet);
    setRuleSets(prev => [...prev, saved]);
    return saved;
  };

  const updateRuleSet = async (id: string, updates: Partial<RuleSet>): Promise<RuleSet> => {
    const updated = propFirmRepo.updateRuleSet(userId, id, updates);
    setRuleSets(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const deleteRuleSet = async (id: string): Promise<boolean> => {
    const success = propFirmRepo.deleteRuleSet(userId, id);
    if (success) {
      setRuleSets(prev => prev.filter(r => r.id !== id));
    }
    return success;
  };

  const resetPropDefaults = async () => {
    const res = propFirmRepo.resetToDefaults(userId);
    setPropFirms(res.firms);
    setRuleSets(res.ruleSets);
  };

  // Psychology & Mistake Operations
  const psychologyReport: PsychologyAnalyticsReport = PsychologyEngine.generateFullReport(
    selectedAccountTrades,
    sessionCheckIns,
    mistakeTaxonomy
  );

  const createMistakeCategory = async (data: Omit<MistakeCategory, 'id' | 'isCustom'>): Promise<MistakeCategory> => {
    const created = PsychologyRepository.createCategory(userId, data);
    setMistakeCategories(PsychologyRepository.getCategories(userId));
    return created;
  };

  const deleteMistakeCategory = async (id: string): Promise<boolean> => {
    const success = PsychologyRepository.deleteCategory(userId, id);
    if (success) {
      setMistakeCategories(PsychologyRepository.getCategories(userId));
    }
    return success;
  };

  const createTaxonomyMistake = async (data: Omit<MistakeTaxonomyItem, 'id' | 'isCustom'>): Promise<MistakeTaxonomyItem> => {
    const created = PsychologyRepository.createMistake(userId, data);
    setMistakeTaxonomy(PsychologyRepository.getTaxonomy(userId));
    return created;
  };

  const deleteTaxonomyMistake = async (id: string): Promise<boolean> => {
    const success = PsychologyRepository.deleteMistake(userId, id);
    if (success) {
      setMistakeTaxonomy(PsychologyRepository.getTaxonomy(userId));
    }
    return success;
  };

  const createSessionCheckIn = async (data: Omit<SessionCheckIn, 'id' | 'userId' | 'timestamp'>): Promise<SessionCheckIn> => {
    const created = PsychologyRepository.createCheckIn(userId, data);
    setSessionCheckIns(PsychologyRepository.getCheckIns(userId));
    return created;
  };

  const deleteSessionCheckIn = async (id: string): Promise<boolean> => {
    const success = PsychologyRepository.deleteCheckIn(userId, id);
    if (success) {
      setSessionCheckIns(PsychologyRepository.getCheckIns(userId));
    }
    return success;
  };

  // Account Operations
  const createAccount = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>): Promise<Account> => {
    const validation = AccountService.validateAccount(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const newAcc = await accountRepo.createAccount({
      ...data,
      userId,
      workspaceId,
      currentBalance: data.currentBalance !== undefined ? data.currentBalance : data.startingBalance,
      equity: data.equity !== undefined ? data.equity : (data.currentBalance !== undefined ? data.currentBalance : data.startingBalance),
      highWaterMark: Math.max(data.startingBalance, data.currentBalance || data.startingBalance),
      isArchived: data.isArchived || false,
      isFavorite: data.isFavorite || false,
      status: data.status || 'ACTIVE',
    });
    setAccounts(prev => [...prev, newAcc]);
    setSelectedAccountId(newAcc.id);

    SyncRepository.enqueueMutation(userId, {
      entityType: 'ACCOUNT',
      action: 'CREATE',
      entityId: newAcc.id,
      entityName: newAcc.name,
      payload: newAcc,
    });
    return newAcc;
  };

  const updateAccount = async (id: string, updates: Partial<Account>): Promise<Account> => {
    const existing = accounts.find(a => a.id === id);
    if (!existing) {
      throw new Error(`Account ${id} not found`);
    }

    const merged = { ...existing, ...updates };
    const validation = AccountService.validateAccount(merged);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const updated = await accountRepo.updateAccount(userId, id, updates);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));

    SyncRepository.enqueueMutation(userId, {
      entityType: 'ACCOUNT',
      action: 'UPDATE',
      entityId: id,
      entityName: updated.name,
      payload: updated,
    });
    return updated;
  };

  const deleteAccount = async (id: string): Promise<boolean> => {
    const success = await accountRepo.deleteAccount(userId, id);
    if (success) {
      setAccounts(prev => prev.filter(a => a.id !== id));
      if (selectedAccountId === id) {
        const remaining = accounts.filter(a => a.id !== id);
        setSelectedAccountId(remaining.length > 0 ? remaining[0].id : 'ALL');
      }

      SyncRepository.enqueueMutation(userId, {
        entityType: 'ACCOUNT',
        action: 'DELETE',
        entityId: id,
        payload: { id },
      });
    }
    return success;
  };

  const archiveAccount = async (id: string): Promise<Account> => {
    const updated = await accountRepo.archiveAccount(userId, id);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));
    if (selectedAccountId === id) {
      const activeRem = accounts.filter(a => a.id !== id && !a.isArchived);
      if (activeRem.length > 0) {
        setSelectedAccountId(activeRem[0].id);
      }
    }
    return updated;
  };

  const restoreAccount = async (id: string): Promise<Account> => {
    const updated = await accountRepo.restoreAccount(userId, id);
    setAccounts(prev => prev.map(a => a.id === id ? updated : a));
    return updated;
  };

  const duplicateAccount = async (id: string, newName?: string): Promise<Account> => {
    const duplicated = await accountRepo.duplicateAccount(userId, id, newName);
    setAccounts(prev => [...prev, duplicated]);
    return duplicated;
  };

  const toggleAccountFavorite = async (id: string): Promise<Account> => {
    const acc = accounts.find(a => a.id === id);
    if (!acc) throw new Error(`Account ${id} not found`);
    return updateAccount(id, { isFavorite: !acc.isFavorite });
  };

  // Trade Operations
  const createTrade = async (data: Omit<Trade, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>): Promise<Trade> => {
    // 1. Validation
    const validation = TradeService.validateTrade(data);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    // 2. Account baseline determination
    const targetAccount = accounts.find(a => a.id === data.accountId);
    const accountCapital = targetAccount?.startingBalance || startingBalance || 100000;

    // 3. Centralized Financial Calculations
    const financials = CalculationEngine.calculateTradeFinancials(data, accountCapital);

    const newTrade = await tradeRepo.createTrade({
      ...data,
      userId,
      workspaceId,
      grossPnL: data.status === 'CLOSED' ? financials.grossPnL : 0,
      netPnL: data.status === 'CLOSED' ? financials.netPnL : 0,
      pnlPercentage: data.status === 'CLOSED' ? financials.pnlPercentage : 0,
      plannedRiskAmount: financials.plannedRiskAmount,
      plannedRiskPercent: financials.plannedRiskPercent,
      plannedRRRatio: financials.plannedRRRatio,
      achievedRMultiple: data.status === 'CLOSED' ? financials.achievedRMultiple : undefined,
      holdingTimeSeconds: financials.holdingTimeSeconds,
      outcome: data.status === 'CLOSED' ? financials.outcome : 'OPEN',
    });

    setTrades(prev => [newTrade, ...prev]);

    // Record offline mutation for PWA Sync
    SyncRepository.enqueueMutation(userId, {
      entityType: 'TRADE',
      action: 'CREATE',
      entityId: newTrade.id,
      entityName: `${newTrade.direction} ${newTrade.instrument}`,
      payload: newTrade,
    });

    // 4. Automatically sync Account Balance & High-Water Mark if closed trade
    if (data.status === 'CLOSED' && targetAccount) {
      const newBalance = Number((targetAccount.currentBalance + financials.netPnL).toFixed(2));
      const newHWM = Math.max(targetAccount.highWaterMark, newBalance);
      await updateAccount(targetAccount.id, {
        currentBalance: newBalance,
        equity: newBalance,
        highWaterMark: newHWM,
      });
    }

    // 5. Evaluate Automation Rules reactively
    setTimeout(() => {
      evaluateAutomationRules('ON_TRADE_CREATED', newTrade);
      if (newTrade.status === 'CLOSED') {
        evaluateAutomationRules('ON_TRADE_CLOSED', newTrade);
      }
    }, 50);

    return newTrade;
  };

  const updateTrade = async (id: string, updates: Partial<Trade>): Promise<Trade> => {
    const existingTrade = trades.find(t => t.id === id);
    if (!existingTrade) throw new Error(`Trade ${id} not found`);

    const merged = { ...existingTrade, ...updates };
    const validation = TradeService.validateTrade(merged);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const targetAccount = accounts.find(a => a.id === merged.accountId);
    const accountCapital = targetAccount?.startingBalance || startingBalance || 100000;
    const financials = CalculationEngine.calculateTradeFinancials(merged, accountCapital);

    const fullUpdates: Partial<Trade> = {
      ...updates,
      grossPnL: merged.status === 'CLOSED' ? financials.grossPnL : 0,
      netPnL: merged.status === 'CLOSED' ? financials.netPnL : 0,
      pnlPercentage: merged.status === 'CLOSED' ? financials.pnlPercentage : 0,
      plannedRiskAmount: financials.plannedRiskAmount,
      plannedRiskPercent: financials.plannedRiskPercent,
      plannedRRRatio: financials.plannedRRRatio,
      achievedRMultiple: merged.status === 'CLOSED' ? financials.achievedRMultiple : undefined,
      holdingTimeSeconds: financials.holdingTimeSeconds,
      outcome: merged.status === 'CLOSED' ? financials.outcome : 'OPEN',
    };

    const updated = await tradeRepo.updateTrade(userId, id, fullUpdates);
    setTrades(prev => prev.map(t => t.id === id ? updated : t));

    SyncRepository.enqueueMutation(userId, {
      entityType: 'TRADE',
      action: 'UPDATE',
      entityId: id,
      entityName: `${updated.direction} ${updated.instrument}`,
      payload: updated,
    });

    // Recalculate account balance impact if netPnL changed on closed trade
    if (targetAccount && existingTrade.status === 'CLOSED' && updated.status === 'CLOSED') {
      const pnlDiff = updated.netPnL - existingTrade.netPnL;
      if (Math.abs(pnlDiff) > 0.001) {
        const newBalance = Number((targetAccount.currentBalance + pnlDiff).toFixed(2));
        const newHWM = Math.max(targetAccount.highWaterMark, newBalance);
        await updateAccount(targetAccount.id, {
          currentBalance: newBalance,
          equity: newBalance,
          highWaterMark: newHWM,
        });
      }
    }

    // Evaluate Automation Rules reactively
    setTimeout(() => {
      evaluateAutomationRules('ON_TRADE_UPDATED', updated);
      if (updated.status === 'CLOSED' && existingTrade.status !== 'CLOSED') {
        evaluateAutomationRules('ON_TRADE_CLOSED', updated);
      }
    }, 50);

    return updated;
  };

  const deleteTrade = async (id: string): Promise<boolean> => {
    const existingTrade = trades.find(t => t.id === id);
    const success = await tradeRepo.deleteTrade(userId, id);
    if (success) {
      setTrades(prev => prev.filter(t => t.id !== id));

      SyncRepository.enqueueMutation(userId, {
        entityType: 'TRADE',
        action: 'DELETE',
        entityId: id,
        payload: { id },
      });
      // Revert balance if deleted trade was closed
      if (existingTrade && existingTrade.status === 'CLOSED' && existingTrade.accountId) {
        const targetAcc = accounts.find(a => a.id === existingTrade.accountId);
        if (targetAcc) {
          const newBalance = Number((targetAcc.currentBalance - existingTrade.netPnL).toFixed(2));
          await updateAccount(targetAcc.id, {
            currentBalance: newBalance,
            equity: newBalance,
          });
        }
      }
    }
    return success;
  };

  const duplicateTrade = async (id: string): Promise<Trade> => {
    const trade = trades.find(t => t.id === id);
    if (!trade) throw new Error(`Trade with ID ${id} not found`);

    const { id: _id, createdAt: _created, updatedAt: _updated, userId: _u, workspaceId: _w, ...rest } = trade;
    return createTrade({
      ...rest,
      entryDate: new Date().toISOString(),
      exitDate: rest.status === 'CLOSED' ? new Date().toISOString() : undefined,
      notes: rest.notes ? `[Copy of #${id.slice(-4)}] ${rest.notes}` : `[Copy of #${id.slice(-4)}]`,
    });
  };

  // Strategy & Playbook Operations
  const createStrategy = async (data: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'workspaceId'>): Promise<Strategy> => {
    const newStrat = await strategyRepo.createStrategy({
      ...data,
      userId,
      workspaceId,
    });
    setStrategies(prev => [...prev, newStrat]);
    return newStrat;
  };

  const createPlaybook = async (data: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playbook> => {
    const newPlaybook = await playbookRepo.createPlaybook({
      ...data,
      userId,
      workspaceId,
    });
    setPlaybooks(prev => [...prev, newPlaybook]);
    return newPlaybook;
  };

  // Import / Export Operations
  const refreshImportBatches = async () => {
    if (!currentUser) return;
    const batches = await importExportRepo.getBatches(userId);
    setImportBatches(batches);
  };

  const importTradesBatch = async (
    filename: string, 
    previewResult: ImportPreviewResult, 
    options: ImportExecutionOptions
  ): Promise<{ batch: ImportBatch; importedTrades: Trade[]; skippedCount: number; errorsCount: number }> => {
    if (!currentUser) throw new Error('User must be authenticated to import data');

    const targetAccount = accounts.find(a => a.id === options.accountId);
    const accountName = targetAccount?.name || 'Primary Account';

    const result = await ImportExportEngine.executeImport(
      userId,
      accountName,
      filename,
      previewResult,
      options
    );

    // Refresh all state
    await loadData();

    // Dynamically update target account balance based on newly imported closed trades
    if (targetAccount && result.importedTrades.length > 0) {
      const allAccTrades = await tradeRepo.getTrades(userId, targetAccount.id);
      const totalNetPnL = allAccTrades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const newBalance = Number((targetAccount.startingBalance + totalNetPnL).toFixed(2));
      const newHighWater = Math.max(targetAccount.highWaterMark, newBalance);
      await updateAccount(targetAccount.id, {
        currentBalance: newBalance,
        equity: newBalance,
        highWaterMark: newHighWater,
      });
    }

    return result;
  };

  const rollbackImportBatch = async (batchId: string): Promise<{ success: boolean; deletedCount: number; batch: ImportBatch }> => {
    if (!currentUser) throw new Error('User must be authenticated to rollback data');
    const batch = await importExportRepo.getBatchById(userId, batchId);
    if (!batch) throw new Error('Batch not found');

    const result = await ImportExportEngine.rollbackBatch(userId, batchId);

    // Refresh all state
    await loadData();

    // Recompute account balance
    const targetAccount = accounts.find(a => a.id === batch.accountId);
    if (targetAccount) {
      const allAccTrades = await tradeRepo.getTrades(userId, targetAccount.id);
      const totalNetPnL = allAccTrades.filter(t => t.status === 'CLOSED').reduce((sum, t) => sum + (t.netPnL || 0), 0);
      const newBalance = Number((targetAccount.startingBalance + totalNetPnL).toFixed(2));
      await updateAccount(targetAccount.id, {
        currentBalance: newBalance,
        equity: newBalance,
      });
    }

    return result;
  };

  const deleteImportBatchRecord = async (batchId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const success = await importExportRepo.deleteBatch(userId, batchId);
    if (success) {
      setImportBatches(prev => prev.filter(b => b.id !== batchId));
    }
    return success;
  };

  const exportTradesToCsv = (customTrades?: Trade[]): string => {
    const list = customTrades || selectedAccountTrades;
    return ImportExportEngine.exportTradesToCsv(list);
  };

  const exportTradesToJson = (customTrades?: Trade[]): string => {
    const list = customTrades || selectedAccountTrades;
    const acc = selectedAccount ? { id: selectedAccount.id, name: selectedAccount.name, startingBalance: selectedAccount.startingBalance } : undefined;
    return ImportExportEngine.exportTradesToJson(list, { account: acc });
  };

  const resetToSampleData = async () => {
    if (!currentUser) return;
    SeedService.seedInitialData(currentUser.id);
    await loadData();
  };

  // Automation Operations
  const createAutomationRule = async (
    data: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'triggerCount'>
  ): Promise<AutomationRule> => {
    const newRule: AutomationRule = {
      ...data,
      id: 'rule_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId,
      triggerCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const saved = AutomationRepository.saveRule(userId, newRule);
    setAutomationRules(prev => [saved, ...prev]);
    return saved;
  };

  const updateAutomationRule = async (id: string, updates: Partial<AutomationRule>): Promise<AutomationRule> => {
    const existing = automationRules.find(r => r.id === id);
    if (!existing) throw new Error(`Automation rule ${id} not found`);
    const merged = { ...existing, ...updates };
    const saved = AutomationRepository.saveRule(userId, merged);
    setAutomationRules(prev => prev.map(r => r.id === id ? saved : r));
    return saved;
  };

  const deleteAutomationRule = async (id: string): Promise<boolean> => {
    const success = AutomationRepository.deleteRule(userId, id);
    if (success) {
      setAutomationRules(prev => prev.filter(r => r.id !== id));
    }
    return success;
  };

  const toggleAutomationRule = async (id: string): Promise<AutomationRule | null> => {
    const updated = AutomationRepository.toggleRule(userId, id);
    if (updated) {
      setAutomationRules(prev => prev.map(r => r.id === id ? updated : r));
    }
    return updated;
  };

  const resetAutomationDefaults = async () => {
    const defaults = AutomationRepository.resetToDefaultRules(userId);
    setAutomationRules(defaults);
  };

  const updateNotificationPreferences = async (updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
    const saved = AutomationRepository.savePreferences(userId, updates);
    setNotificationPreferences(saved);
    return saved;
  };

  const evaluateAutomationRules = async (
    event: AutomationTriggerEvent = 'MANUAL_EVALUATION',
    targetTrade?: Trade
  ): Promise<AutomationExecutionLog[]> => {
    const evalLogs = await AutomationEngine.evaluateAllRules(
      userId,
      {
        accounts,
        targetAccount: selectedAccount,
        trades: selectedAccountTrades,
        targetTrade: targetTrade || (selectedAccountTrades.length > 0 ? selectedAccountTrades[0] : null),
        metrics,
        drawdown,
        riskBudgets,
        riskPolicy,
        propFirmEvaluation: activePropEvaluation,
        event,
        timestamp: new Date().toISOString(),
      },
      {
        notify: (type, title, message) => {
          notify[type](title, message);
        },
        updateTrade: async (tradeId, updates) => {
          return await updateTrade(tradeId, updates);
        },
      }
    );

    if (evalLogs.length > 0) {
      setAutomationLogs(AutomationRepository.getExecutionLogs(userId));
      setAutomationRules(AutomationRepository.getRules(userId));
    }
    return evalLogs;
  };

  const clearAutomationLogs = async () => {
    AutomationRepository.clearExecutionLogs(userId);
    setAutomationLogs([]);
  };

  return (
    <TradeOSContext.Provider
      value={{
        accounts,
        selectedAccountId,
        selectedAccount,
        setSelectedAccountId,
        createAccount,
        updateAccount,
        deleteAccount,
        archiveAccount,
        restoreAccount,
        duplicateAccount,
        toggleAccountFavorite,
        trades,
        selectedAccountTrades,
        createTrade,
        updateTrade,
        deleteTrade,
        duplicateTrade,
        strategies,
        playbooks,
        createStrategy,
        createPlaybook,
        workspaces,
        activeWorkspace,
        metrics,
        drawdown,
        compliance,
        summary,
        riskPolicy,
        riskBudgets,
        exposureMetrics,
        riskEvaluation,
        updateRiskPolicy,
        resetRiskPolicy,
        propFirms,
        ruleSets,
        activePropEvaluation,
        multiAccountComparison,
        createPropFirm,
        updatePropFirm,
        deletePropFirm,
        createRuleSet,
        updateRuleSet,
        deleteRuleSet,
        resetPropDefaults,
        mistakeCategories,
        mistakeTaxonomy,
        sessionCheckIns,
        psychologyReport,
        createMistakeCategory,
        deleteMistakeCategory,
        createTaxonomyMistake,
        deleteTaxonomyMistake,
        createSessionCheckIn,
        deleteSessionCheckIn,
        importBatches,
        refreshImportBatches,
        importTradesBatch,
        rollbackImportBatch,
        deleteImportBatchRecord,
        exportTradesToCsv,
        exportTradesToJson,
        automationRules,
        notificationPreferences,
        automationLogs,
        createAutomationRule,
        updateAutomationRule,
        deleteAutomationRule,
        toggleAutomationRule,
        resetAutomationDefaults,
        updateNotificationPreferences,
        evaluateAutomationRules,
        clearAutomationLogs,
        isLoading,
        activeTab,
        setActiveTab,
        refreshData: loadData,
        resetToSampleData,
      }}
    >
      {children}
    </TradeOSContext.Provider>
  );
};

export const useTradeOS = () => {
  const context = useContext(TradeOSContext);
  if (!context) {
    throw new Error('useTradeOS must be used within a TradeOSProvider');
  }
  return context;
};
