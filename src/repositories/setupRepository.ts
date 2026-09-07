/**
 * Setup Repository Implementation
 */

import { ISetupRepository } from './types';
import { Setup } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class SetupRepository implements ISetupRepository {
  private collection = 'setups';

  async getSetups(userId: string, workspaceId?: string): Promise<Setup[]> {
    const all = LocalDatabase.getItems<Setup>(userId, this.collection);
    if (!workspaceId) return all;
    return all.filter(s => s.workspaceId === workspaceId);
  }

  async getSetupById(userId: string, id: string): Promise<Setup | null> {
    return LocalDatabase.getItemById<Setup>(userId, this.collection, id);
  }

  async getSetupsByStrategy(userId: string, strategyId: string): Promise<Setup[]> {
    const all = await this.getSetups(userId);
    return all.filter(s => s.strategyId === strategyId);
  }

  async createSetup(data: Omit<Setup, 'id' | 'createdAt' | 'updatedAt'>): Promise<Setup> {
    const now = new Date().toISOString();
    const newSetup: Setup = {
      ...data,
      requiredConfirmations: data.requiredConfirmations || [],
      id: 'setup_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Setup>(newSetup.userId, this.collection, newSetup);
  }

  async updateSetup(userId: string, id: string, updates: Partial<Setup>): Promise<Setup> {
    return LocalDatabase.updateItem<Setup>(userId, this.collection, id, updates);
  }

  async deleteSetup(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<Setup>(userId, this.collection, id);
  }
}
