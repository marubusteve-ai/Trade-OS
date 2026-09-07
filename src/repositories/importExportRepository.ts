/**
 * Import & Export Repository
 * Manages import batch audit trails and enables clean rollbacks.
 */

import { ImportBatch } from '../types/importExport';
import { LocalDatabase } from './localDatabase';

export class ImportExportRepository {
  private collection = 'import_batches';

  async getBatches(userId: string, accountId?: string): Promise<ImportBatch[]> {
    const all = LocalDatabase.getItems<ImportBatch>(userId, this.collection);
    if (!accountId) return all;
    return all.filter(b => b.accountId === accountId);
  }

  async getBatchById(userId: string, id: string): Promise<ImportBatch | null> {
    return LocalDatabase.getItemById<ImportBatch>(userId, this.collection, id);
  }

  async saveBatch(userId: string, batchData: Omit<ImportBatch, 'id' | 'importedAt' | 'status'>): Promise<ImportBatch> {
    const now = new Date().toISOString();
    const newBatch: ImportBatch = {
      ...batchData,
      id: 'batch_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      importedAt: now,
      status: 'ACTIVE',
    };
    return LocalDatabase.insertItem<ImportBatch>(userId, this.collection, newBatch);
  }

  async updateBatchStatus(userId: string, id: string, status: 'ACTIVE' | 'ROLLED_BACK'): Promise<ImportBatch> {
    return LocalDatabase.updateItem<ImportBatch>(userId, this.collection, id, { status });
  }

  async deleteBatch(userId: string, id: string): Promise<boolean> {
    return LocalDatabase.deleteItem<ImportBatch>(userId, this.collection, id);
  }
}
