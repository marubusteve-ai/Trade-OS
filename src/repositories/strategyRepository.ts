/**
 * Strategy Repository Implementation
 */

import { IStrategyRepository } from './types';
import { Strategy } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class StrategyRepository implements IStrategyRepository {
  private collection = 'strategies';

  async getStrategies(userId: string, workspaceId?: string): Promise<Strategy[]> {
    const all = LocalDatabase.getItems<Strategy>(userId, this.collection);
    if (!workspaceId) return all;
    return all.filter(s => s.workspaceId === workspaceId);
  }

  async getStrategyById(userId: string, id: string): Promise<Strategy | null> {
    return LocalDatabase.getItemById<Strategy>(userId, this.collection, id);
  }

  async createStrategy(data: Omit<Strategy, 'id' | 'createdAt' | 'updatedAt'>): Promise<Strategy> {
    const now = new Date().toISOString();
    const newStrategy: Strategy = {
      ...data,
      status: data.status || (data.isArchived ? 'ARCHIVED' : 'ACTIVE'),
      isArchived: data.isArchived ?? false,
      rules: data.rules || [],
      checklist: data.checklist || [],
      checklists: data.checklists || [],
      id: 'strat_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Strategy>(newStrategy.userId, this.collection, newStrategy);
  }

  async updateStrategy(userId: string, id: string, updates: Partial<Strategy>): Promise<Strategy> {
    return LocalDatabase.updateItem<Strategy>(userId, this.collection, id, updates);
  }

  async deleteStrategy(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<Strategy>(userId, this.collection, id);
  }

  async duplicateStrategy(userId: string, id: string, newName?: string): Promise<Strategy> {
    const original = await this.getStrategyById(userId, id);
    if (!original) throw new Error(`Strategy ${id} not found`);

    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;
    return this.createStrategy({
      ...rest,
      name: newName || `${original.name} (Copy)`,
    });
  }

  async archiveStrategy(userId: string, id: string): Promise<Strategy> {
    return this.updateStrategy(userId, id, {
      isArchived: true,
      status: 'ARCHIVED',
    });
  }

  async restoreStrategy(userId: string, id: string): Promise<Strategy> {
    return this.updateStrategy(userId, id, {
      isArchived: false,
      status: 'ACTIVE',
    });
  }
}
