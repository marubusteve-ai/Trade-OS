/**
 * Playbook Repository Implementation
 */

import { IPlaybookRepository } from './types';
import { Playbook } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class PlaybookRepository implements IPlaybookRepository {
  private collection = 'playbooks';

  async getPlaybooks(userId: string, workspaceId?: string): Promise<Playbook[]> {
    const all = LocalDatabase.getItems<Playbook>(userId, this.collection);
    if (!workspaceId) return all;
    return all.filter(p => p.workspaceId === workspaceId);
  }

  async getPlaybookById(userId: string, id: string): Promise<Playbook | null> {
    return LocalDatabase.getItemById<Playbook>(userId, this.collection, id);
  }

  async getPlaybooksByStrategy(userId: string, strategyId: string): Promise<Playbook[]> {
    const all = await this.getPlaybooks(userId);
    return all.filter(p => p.strategyId === strategyId);
  }

  async createPlaybook(data: Omit<Playbook, 'id' | 'createdAt' | 'updatedAt'>): Promise<Playbook> {
    const now = new Date().toISOString();
    const newPlaybook: Playbook = {
      ...data,
      confirmationChecklist: data.confirmationChecklist || [],
      ruleChecklist: data.ruleChecklist || [],
      confluenceChecklist: data.confluenceChecklist || [],
      invalidationRules: data.invalidationRules || [],
      managementRules: data.managementRules || [],
      noTradeConditions: data.noTradeConditions || [],
      exampleScreenshots: data.exampleScreenshots || [],
      status: data.status || 'ACTIVE',
      id: 'pb_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Playbook>(newPlaybook.userId, this.collection, newPlaybook);
  }

  async updatePlaybook(userId: string, id: string, updates: Partial<Playbook>): Promise<Playbook> {
    return LocalDatabase.updateItem<Playbook>(userId, this.collection, id, updates);
  }

  async deletePlaybook(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<Playbook>(userId, this.collection, id);
  }

  async duplicatePlaybook(userId: string, id: string, newTitle?: string): Promise<Playbook> {
    const original = await this.getPlaybookById(userId, id);
    if (!original) throw new Error(`Playbook ${id} not found`);

    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = original;
    return this.createPlaybook({
      ...rest,
      title: newTitle || `${original.title} (Copy)`,
    });
  }
}
