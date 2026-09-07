import { LocalDatabase } from './localDatabase';
import {
  OfflineMutationRecord,
  OfflineEntityType,
  OfflineMutationType,
  SyncSummary,
  ConflictDetails,
  ConflictResolutionStrategy,
  OfflineFeatureCapability,
} from '../types/pwa';

export const OFFLINE_FEATURE_CAPABILITIES: OfflineFeatureCapability[] = [
  {
    id: 'trades_journal',
    name: 'Trade Journal & Execution Log',
    category: 'JOURNAL',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Create, update, delete, tag, and filter trade records with instantaneous financial PnL & R-Multiple calculations.',
    offlineBehavior: 'All mutations are queued locally and instantly reflected across all views and local storage.',
  },
  {
    id: 'account_management',
    name: 'Multi-Account & Prop Firm Compliance',
    category: 'RISK',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Track multiple accounts, balances, equity curves, daily drawdown thresholds, and max loss limits.',
    offlineBehavior: 'Full compliance evaluations run locally in real-time without needing server round-trips.',
  },
  {
    id: 'analytics_dashboard',
    name: 'Performance Analytics & Visualizations',
    category: 'ANALYTICS',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Institutional metrics (Sharpe, Profit Factor, Win Rate, Expectancy, Streak distributions).',
    offlineBehavior: 'Computes metrics locally using deterministic client-side financial engines.',
  },
  {
    id: 'psychology_tracker',
    name: 'Trading Psychology & Discipline Journal',
    category: 'CORE',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Pre-market and post-market session check-ins, emotional state tracking, and tilt mitigation.',
    offlineBehavior: 'Stored locally with full historical inspection and correlation metrics.',
  },
  {
    id: 'playbook_checklists',
    name: 'Playbooks, Setups & Checklists',
    category: 'JOURNAL',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Custom setup definitions, entry/exit criteria, and pre-trade execution scoring.',
    offlineBehavior: 'Fully persistent and interactive offline with zero latency.',
  },
  {
    id: 'automation_guardrails',
    name: 'Automation & Guardrail Alerts',
    category: 'AUTOMATION',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Rule evaluation engine for risk ceilings, consecutive losses, and auto-tagging.',
    offlineBehavior: 'Evaluates rules against local mutations and fires in-app audio/visual guardrail alerts.',
  },
  {
    id: 'import_export_backup',
    name: 'Local Backup & CSV/JSON Data Export',
    category: 'CORE',
    supportedOffline: true,
    requiresNetwork: false,
    description: 'Create encrypted or structured JSON/CSV data backups of your complete journal.',
    offlineBehavior: 'Generates client-side blob downloads directly from partitioned local database.',
  },
  {
    id: 'gemini_ai_coach',
    name: 'Gemini AI Trade Review & Coaching',
    category: 'AI',
    supportedOffline: false,
    requiresNetwork: true,
    description: 'Generative AI trade synthesis, execution critique, behavioral pattern diagnosis, and interactive chat.',
    offlineBehavior: 'Displays graceful "Requires Network" badge with cached past analyses remaining readable.',
  },
  {
    id: 'live_broker_sync',
    name: 'Live Broker API Integration',
    category: 'CORE',
    supportedOffline: false,
    requiresNetwork: true,
    description: 'Direct WebSocket streaming from broker accounts.',
    offlineBehavior: 'Disabled when offline; prompts to reconnect when network returns.',
  },
];

const SYNC_QUEUE_COLLECTION = 'sync_queue';
const LAST_SYNC_KEY_PREFIX = 'tradeos_v1_last_sync_';

export class SyncRepository {
  /**
   * Enqueues a new mutation record into the persistent offline queue.
   */
  static enqueueMutation<T = any>(
    userId: string,
    params: {
      workspaceId?: string;
      entityType: OfflineEntityType;
      action: OfflineMutationType;
      entityId: string;
      entityName?: string;
      payload: T;
      isOnline?: boolean;
    }
  ): OfflineMutationRecord<T> {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);

    // If an update or delete is queued for an entity that already has a pending create in this session,
    // we can either coalesce or append. Appending ensures full audit history.
    const record: OfflineMutationRecord<T> = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      userId,
      workspaceId: params.workspaceId,
      entityType: params.entityType,
      action: params.action,
      entityId: params.entityId,
      entityName: params.entityName,
      payload: params.payload,
      clientTimestamp: new Date().toISOString(),
      status: params.isOnline ? 'SYNCED' : 'PENDING',
      retryCount: 0,
    };

    queue.unshift(record); // newest first
    // Limit queue size to last 500 records to maintain optimal localStorage quota
    const trimmed = queue.slice(0, 500);
    LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, trimmed);
    return record;
  }

  /**
   * Gets all pending mutations waiting to be synchronized.
   */
  static getPendingMutations(userId: string): OfflineMutationRecord[] {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    return queue.filter((m) => m.status === 'PENDING' || m.status === 'FAILED');
  }

  /**
   * Gets all mutations including pending, synced, and conflicts.
   */
  static getAllMutations(userId: string): OfflineMutationRecord[] {
    return LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
  }

  /**
   * Gets conflicts in the queue.
   */
  static getConflicts(userId: string): OfflineMutationRecord[] {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    return queue.filter((m) => m.status === 'CONFLICT');
  }

  /**
   * Marks a mutation as successfully synced.
   */
  static markMutationSynced(userId: string, mutationId: string): void {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const index = queue.findIndex((m) => m.id === mutationId);
    if (index >= 0) {
      queue[index].status = 'SYNCED';
      queue[index].error = undefined;
      LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, queue);
    }
  }

  /**
   * Marks a mutation with a conflict status.
   */
  static markMutationConflict(userId: string, mutationId: string, conflictDetails: ConflictDetails): void {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const index = queue.findIndex((m) => m.id === mutationId);
    if (index >= 0) {
      queue[index].status = 'CONFLICT';
      queue[index].conflictDetails = conflictDetails;
      LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, queue);
    }
  }

  /**
   * Marks a mutation as failed.
   */
  static markMutationFailed(userId: string, mutationId: string, error: string): void {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const index = queue.findIndex((m) => m.id === mutationId);
    if (index >= 0) {
      queue[index].status = 'FAILED';
      queue[index].error = error;
      queue[index].retryCount = (queue[index].retryCount || 0) + 1;
      LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, queue);
    }
  }

  /**
   * Resolves a conflict with a specific resolution strategy.
   */
  static resolveConflict(
    userId: string,
    mutationId: string,
    strategy: ConflictResolutionStrategy,
    mergedPayload?: any
  ): OfflineMutationRecord | null {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const index = queue.findIndex((m) => m.id === mutationId);
    if (index >= 0) {
      const record = queue[index];
      if (strategy === 'MANUAL_MERGE' && mergedPayload) {
        record.payload = mergedPayload;
      }
      record.status = 'SYNCED';
      if (record.conflictDetails) {
        record.conflictDetails.resolvedStrategy = strategy;
        record.conflictDetails.resolvedAt = new Date().toISOString();
      }
      LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, queue);
      return record;
    }
    return null;
  }

  /**
   * Deletes a mutation record from the queue.
   */
  static deleteMutation(userId: string, mutationId: string): boolean {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const filtered = queue.filter((m) => m.id !== mutationId);
    if (filtered.length !== queue.length) {
      LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, filtered);
      return true;
    }
    return false;
  }

  /**
   * Clears entire queue (used for testing and full reset).
   */
  static clearQueue(userId: string): void {
    LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, []);
  }

  /**
   * Gets entire queue (alias for getAllMutations).
   */
  static getQueue(userId: string): OfflineMutationRecord[] {
    return this.getAllMutations(userId);
  }

  /**
   * Clears old synced mutations from the queue.
   */
  static clearSyncedMutations(userId: string): void {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    const active = queue.filter((m) => m.status === 'PENDING' || m.status === 'CONFLICT');
    LocalDatabase.saveItems(userId, SYNC_QUEUE_COLLECTION, active);
  }

  /**
   * Gets the last successful synchronization timestamp.
   */
  static getLastSyncTime(userId: string): string | null {
    try {
      return localStorage.getItem(`${LAST_SYNC_KEY_PREFIX}${userId}`);
    } catch {
      return null;
    }
  }

  /**
   * Sets the last successful synchronization timestamp.
   */
  static setLastSyncTime(userId: string, timestamp: string): void {
    try {
      localStorage.setItem(`${LAST_SYNC_KEY_PREFIX}${userId}`, timestamp);
    } catch (e) {
      console.error('Failed to set last sync timestamp:', e);
    }
  }

  /**
   * Computes a full sync summary.
   */
  static getSyncSummary(userId: string): SyncSummary {
    const queue = LocalDatabase.getItems<OfflineMutationRecord>(userId, SYNC_QUEUE_COLLECTION);
    let pendingCount = 0;
    let syncedCount = 0;
    let conflictCount = 0;
    let failedCount = 0;
    const errors: Array<{ mutationId: string; entityType: string; message: string; timestamp: string }> = [];

    for (const item of queue) {
      if (item.status === 'PENDING') pendingCount++;
      else if (item.status === 'SYNCED') syncedCount++;
      else if (item.status === 'CONFLICT') conflictCount++;
      else if (item.status === 'FAILED') {
        failedCount++;
        if (item.error) {
          errors.push({
            mutationId: item.id,
            entityType: item.entityType,
            message: item.error,
            timestamp: item.clientTimestamp,
          });
        }
      }
    }

    return {
      pendingCount,
      syncedCount,
      conflictCount,
      failedCount,
      lastSyncTimestamp: this.getLastSyncTime(userId),
      isSyncing: false,
      errors,
    };
  }
}
