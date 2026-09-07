/**
 * Repository Interfaces for TradeOS Data Access
 * 
 * Provides clean inversion of control so persistence can seamlessly evolve
 * between Local IndexedDB/LocalStorage and Cloud Firestore without breaking UI logic.
 */

import { Account, Trade, Strategy, Playbook, Setup, Workspace, User, UserProfile, Goal, AIInsight } from '../types/domain';

export interface IAccountRepository {
  getAccounts(userId: string, workspaceId?: string): Promise<Account[]>;
  getAccountById(userId: string, id: string): Promise<Account | null>;
  createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
  updateAccount(userId: string, id: string, updates: Partial<Account>): Promise<Account>;
  deleteAccount(userId: string, id: string): Promise<boolean>;
  archiveAccount(userId: string, id: string): Promise<Account>;
  restoreAccount(userId: string, id: string): Promise<Account>;
  duplicateAccount(userId: string, id: string, newName?: string): Promise<Account>;
}

export interface ITradeRepository {
  getTrades(userId: string, accountId?: string): Promise<Trade[]>;
  getTradeById(userId: string, id: string): Promise<Trade | null>;
  createTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trade>;
  updateTrade(userId: string, id: string, updates: Partial<Trade>): Promise<Trade>;
  deleteTrade(userId: string, id: string): Promise<boolean>;
  batchImportTrades(userId: string, trades: Array<Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Trade[]>;
}

export interface IStrategyRepository {
  getStrategies(userId: string, workspaceId?: string): Promise<Strategy[]>;
  getStrategyById(userId: string, id: string): Promise<Strategy | null>;
  createStrategy(strategy: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy>;
  updateStrategy(userId: string, id: string, updates: Partial<Strategy>): Promise<Strategy>;
  deleteStrategy(userId: string, id: string): Promise<boolean>;
  duplicateStrategy(userId: string, id: string, newName?: string): Promise<Strategy>;
  archiveStrategy(userId: string, id: string): Promise<Strategy>;
  restoreStrategy(userId: string, id: string): Promise<Strategy>;
}

export interface IPlaybookRepository {
  getPlaybooks(userId: string, workspaceId?: string): Promise<Playbook[]>;
  getPlaybookById(userId: string, id: string): Promise<Playbook | null>;
  getPlaybooksByStrategy(userId: string, strategyId: string): Promise<Playbook[]>;
  createPlaybook(playbook: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playbook>;
  updatePlaybook(userId: string, id: string, updates: Partial<Playbook>): Promise<Playbook>;
  deletePlaybook(userId: string, id: string): Promise<boolean>;
  duplicatePlaybook(userId: string, id: string, newTitle?: string): Promise<Playbook>;
}

export interface ISetupRepository {
  getSetups(userId: string, workspaceId?: string): Promise<Setup[]>;
  getSetupById(userId: string, id: string): Promise<Setup | null>;
  getSetupsByStrategy(userId: string, strategyId: string): Promise<Setup[]>;
  createSetup(setup: Omit<Setup, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setup>;
  updateSetup(userId: string, id: string, updates: Partial<Setup>): Promise<Setup>;
  deleteSetup(userId: string, id: string): Promise<boolean>;
}

export interface IWorkspaceRepository {
  getWorkspaces(userId: string): Promise<Workspace[]>;
  getWorkspaceById(userId: string, id: string): Promise<Workspace | null>;
  createWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>;
  updateWorkspace(userId: string, id: string, updates: Partial<Workspace>): Promise<Workspace>;
}

export interface IUserRepository {
  getUser(id: string): Promise<User | null>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
}
