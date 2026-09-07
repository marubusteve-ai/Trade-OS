/**
 * Trade Repository Implementation
 */

import { ITradeRepository } from './types';
import { Trade } from '../types/domain';
import { LocalDatabase } from './localDatabase';

export class TradeRepository implements ITradeRepository {
  private collection = 'trades';

  async getTrades(userId: string, accountId?: string): Promise<Trade[]> {
    const all = LocalDatabase.getItems<Trade>(userId, this.collection);
    if (!accountId) return all;
    return all.filter(t => t.accountId === accountId);
  }

  async getTradeById(userId: string, id: string): Promise<Trade | null> {
    return LocalDatabase.getItemById<Trade>(userId, this.collection, id);
  }

  async createTrade(tradeData: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trade> {
    const now = new Date().toISOString();
    const newTrade: Trade = {
      ...tradeData,
      id: 'tr_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      createdAt: now,
      updatedAt: now,
    };
    return LocalDatabase.insertItem<Trade>(newTrade.userId, this.collection, newTrade);
  }

  async updateTrade(userId: string, id: string, updates: Partial<Trade>): Promise<Trade> {
    return LocalDatabase.updateItem<Trade>(userId, this.collection, id, updates);
  }

  async deleteTrade(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<Trade>(userId, this.collection, id);
  }

  async batchImportTrades(userId: string, tradesData: Array<Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Trade[]> {
    const created: Trade[] = [];
    for (const data of tradesData) {
      const trade = await this.createTrade(data);
      created.push(trade);
    }
    return created;
  }
}
