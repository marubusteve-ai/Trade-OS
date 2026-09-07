/**
 * Workspace Repository Implementation
 */

import { IWorkspaceRepository } from './types';
import { Workspace } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class WorkspaceRepository implements IWorkspaceRepository {
  private collection = 'workspaces';

  async getWorkspaces(userId: string): Promise<Workspace[]> {
    return LocalDatabase.getItems<Workspace>(userId, this.collection);
  }

  async getWorkspaceById(userId: string, id: string): Promise<Workspace | null> {
    return LocalDatabase.getItemById<Workspace>(userId, this.collection, id);
  }

  async createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace> {
    const now = new Date().toISOString();
    const newWs: Workspace = {
      ...data,
      id: 'ws_' + Math.random().toString(36).substring(2, 9),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Workspace>(newWs.userId, this.collection, newWs);
  }

  async updateWorkspace(userId: string, id: string, updates: Partial<Workspace>): Promise<Workspace> {
    return LocalDatabase.updateItem<Workspace>(userId, this.collection, id, updates);
  }
}
