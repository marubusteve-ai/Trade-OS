/**
 * Account Repository Implementation
 */

import { IAccountRepository } from './types';
import { Account } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class AccountRepository implements IAccountRepository {
  private collection = 'accounts';

  async getAccounts(userId: string, workspaceId?: string): Promise<Account[]> {
    const all = LocalDatabase.getItems<Account>(userId, this.collection);
    if (!workspaceId) return all;
    return all.filter(acc => acc.workspaceId === workspaceId);
  }

  async getAccountById(userId: string, id: string): Promise<Account | null> {
    return LocalDatabase.getItemById<Account>(userId, this.collection, id);
  }

  async createAccount(accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const now = new Date().toISOString();
    const newAccount: Account = {
      ...accountData,
      id: 'acc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Account>(newAccount.userId, this.collection, newAccount);
  }

  async updateAccount(userId: string, id: string, updates: Partial<Account>): Promise<Account> {
    return LocalDatabase.updateItem<Account>(userId, this.collection, id, updates);
  }

  async deleteAccount(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<Account>(userId, this.collection, id);
  }

  async archiveAccount(userId: string, id: string): Promise<Account> {
    return this.updateAccount(userId, id, { isArchived: true, status: 'ARCHIVED' });
  }

  async restoreAccount(userId: string, id: string): Promise<Account> {
    return this.updateAccount(userId, id, { isArchived: false, status: 'ACTIVE' });
  }

  async duplicateAccount(userId: string, id: string, newName?: string): Promise<Account> {
    const existing = await this.getAccountById(userId, id);
    if (!existing) {
      throw new Error(`Account ${id} not found to duplicate`);
    }
    const { id: _, createdAt: __, updatedAt: ___, ...accountData } = existing;
    return this.createAccount({
      ...accountData,
      name: newName || `${existing.name} (Copy)`,
      currentBalance: existing.startingBalance,
      equity: existing.startingBalance,
      highWaterMark: existing.startingBalance,
      isArchived: false,
      status: 'ACTIVE',
    });
  }
}
