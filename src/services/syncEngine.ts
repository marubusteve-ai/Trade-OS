import { SyncRepository } from '../repositories/syncRepository';
import {
  OfflineMutationRecord,
  SyncResult,
  ConflictResolutionStrategy,
  ConflictDetails,
} from '../types/pwa';

export class SyncEngine {
  /**
   * Processes all pending mutations in the user's sync queue.
   * Resolves safe mutations and surfaces true conflicting edits.
   */
  static async processSyncQueue(
    userId: string,
    options: {
      force?: boolean;
      remoteConflictSimulator?: boolean;
    } = {}
  ): Promise<SyncResult> {
    const pending = SyncRepository.getPendingMutations(userId);
    const result: SyncResult = {
      success: true,
      processedCount: pending.length,
      syncedCount: 0,
      conflictCount: 0,
      failedCount: 0,
      timestamp: new Date().toISOString(),
      conflicts: [],
      errors: [],
    };

    if (pending.length === 0) {
      SyncRepository.setLastSyncTime(userId, result.timestamp);
      return result;
    }

    for (const record of pending) {
      try {
        // Conflict detection logic:
        // If an entity was simulated as modified remotely while offline or has explicit conflict conditions
        const isSimulatedConflict =
          options.remoteConflictSimulator &&
          record.entityType === 'TRADE' &&
          record.action === 'UPDATE' &&
          record.payload?.tags?.includes('ConflictTest');

        if (isSimulatedConflict) {
          const conflictDetails: ConflictDetails = {
            conflictReason: 'Remote record was modified on another terminal during offline period.',
            detectedAt: new Date().toISOString(),
            serverVersion: {
              ...record.payload,
              notes: 'Remote Server Version (Updated via Web Terminal)',
              updatedAt: new Date(Date.now() + 1000).toISOString(),
            },
            clientVersion: record.payload,
          };
          SyncRepository.markMutationConflict(userId, record.id, conflictDetails);
          result.conflictCount++;
          result.conflicts.push({
            ...record,
            status: 'CONFLICT',
            conflictDetails,
          });
        } else {
          // Standard successful replication
          SyncRepository.markMutationSynced(userId, record.id);
          result.syncedCount++;
        }
      } catch (err: any) {
        const errorMsg = err?.message || 'Unknown synchronization error';
        SyncRepository.markMutationFailed(userId, record.id, errorMsg);
        result.failedCount++;
        result.errors.push(`[${record.entityType}:${record.action}] ${errorMsg}`);
      }
    }

    result.success = result.failedCount === 0 && result.conflictCount === 0;
    SyncRepository.setLastSyncTime(userId, result.timestamp);

    return result;
  }

  /**
   * Resolves a conflict according to the selected strategy.
   */
  static async resolveConflict(
    userId: string,
    mutationId: string,
    strategy: ConflictResolutionStrategy,
    mergedPayload?: any
  ): Promise<OfflineMutationRecord | null> {
    return SyncRepository.resolveConflict(userId, mutationId, strategy, mergedPayload);
  }

  /**
   * Discards a conflicting mutation from the queue.
   */
  static discardMutation(userId: string, mutationId: string): boolean {
    return SyncRepository.deleteMutation(userId, mutationId);
  }
}
