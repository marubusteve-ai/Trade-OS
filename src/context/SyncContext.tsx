/**
 * TradeOS Sync & Offline Management Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { SyncRepository, OFFLINE_FEATURE_CAPABILITIES } from '../repositories/syncRepository';
import { SyncEngine } from '../services/syncEngine';
import {
  OfflineMutationRecord,
  OfflineEntityType,
  OfflineMutationType,
  ConflictResolutionStrategy,
  SyncResult,
  OfflineFeatureCapability,
} from '../types/pwa';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface SyncContextType {
  isOnline: boolean;
  isReconnecting: boolean;
  latencyMs: number | null;
  isSyncing: boolean;
  pendingCount: number;
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
  lastSyncTimestamp: string | null;
  syncState: {
    isSyncing: boolean;
    pendingCount: number;
    syncedCount: number;
    conflictCount: number;
    failedCount: number;
    lastSyncTimestamp: string | null;
  };
  pendingMutations: OfflineMutationRecord[];
  conflicts: OfflineMutationRecord[];
  allMutations: OfflineMutationRecord[];
  offlineCapabilities: OfflineFeatureCapability[];
  isSyncModalOpen: boolean;
  openSyncModal: () => void;
  closeSyncModal: () => void;
  syncNow: (options?: { remoteConflictSimulator?: boolean }) => Promise<SyncResult>;
  recordMutation: <T>(params: {
    workspaceId?: string;
    entityType: OfflineEntityType;
    action: OfflineMutationType;
    entityId: string;
    entityName?: string;
    payload: T;
  }) => OfflineMutationRecord<T>;
  resolveConflict: (mutationId: string, strategy: ConflictResolutionStrategy, mergedPayload?: any) => Promise<void>;
  discardMutation: (mutationId: string) => void;
  clearSyncedHistory: () => void;
  refreshSyncState: () => void;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, activeWorkspaceId } = useAuth();
  const { isOnline, isReconnecting, latencyMs, checkConnection } = useOnlineStatus();
  const { notify } = useNotification();

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [pendingMutations, setPendingMutations] = useState<OfflineMutationRecord[]>([]);
  const [conflicts, setConflicts] = useState<OfflineMutationRecord[]>([]);
  const [allMutations, setAllMutations] = useState<OfflineMutationRecord[]>([]);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<string | null>(null);
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);

  const userId = currentUser?.id || 'anonymous_user';

  const refreshSyncState = useCallback(() => {
    if (!userId) return;
    const summary = SyncRepository.getSyncSummary(userId);
    const pending = SyncRepository.getPendingMutations(userId);
    const confs = SyncRepository.getConflicts(userId);
    const all = SyncRepository.getAllMutations(userId);

    setPendingMutations(pending);
    setConflicts(confs);
    setAllMutations(all);
    setSyncedCount(summary.syncedCount);
    setFailedCount(summary.failedCount);
    setLastSyncTimestamp(summary.lastSyncTimestamp);
  }, [userId]);

  // Initial load and on user change
  useEffect(() => {
    refreshSyncState();
  }, [refreshSyncState]);

  // Record a mutation
  const recordMutation = useCallback(
    <T,>(params: {
      workspaceId?: string;
      entityType: OfflineEntityType;
      action: OfflineMutationType;
      entityId: string;
      entityName?: string;
      payload: T;
    }): OfflineMutationRecord<T> => {
      const record = SyncRepository.enqueueMutation<T>(userId, {
        workspaceId: params.workspaceId || activeWorkspaceId,
        entityType: params.entityType,
        action: params.action,
        entityId: params.entityId,
        entityName: params.entityName,
        payload: params.payload,
        isOnline,
      });

      refreshSyncState();

      if (!isOnline) {
        notify.info(
          'Saved Offline',
          `${params.entityType} ${params.action.toLowerCase()} recorded locally. Will sync when reconnected.`
        );
      }

      return record;
    },
    [userId, activeWorkspaceId, isOnline, refreshSyncState, notify]
  );

  // Sync now
  const syncNow = useCallback(
    async (options: { remoteConflictSimulator?: boolean } = {}): Promise<SyncResult> => {
      setIsSyncing(true);
      try {
        const result = await SyncEngine.processSyncQueue(userId, options);
        refreshSyncState();

        if (result.conflictCount > 0) {
          notify.warning(
            'Sync Conflicts Detected',
            `${result.conflictCount} items require manual conflict resolution.`
          );
        } else if (result.syncedCount > 0) {
          notify.success(
            'Synchronization Complete',
            `Successfully synced ${result.syncedCount} offline mutations with cloud terminal.`
          );
        }

        return result;
      } catch (err: any) {
        notify.error('Sync Failed', err?.message || 'Unable to sync offline mutations.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [userId, refreshSyncState, notify]
  );

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingMutations.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncNow();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingMutations.length, isSyncing, syncNow]);

  // Resolve a conflict
  const resolveConflict = useCallback(
    async (mutationId: string, strategy: ConflictResolutionStrategy, mergedPayload?: any) => {
      await SyncEngine.resolveConflict(userId, mutationId, strategy, mergedPayload);
      refreshSyncState();
      notify.success('Conflict Resolved', `Applied ${strategy.replace('_', ' ')} resolution strategy.`);
    },
    [userId, refreshSyncState, notify]
  );

  // Discard a mutation
  const discardMutation = useCallback(
    (mutationId: string) => {
      SyncEngine.discardMutation(userId, mutationId);
      refreshSyncState();
      notify.info('Mutation Discarded', 'Removed item from the sync queue.');
    },
    [userId, refreshSyncState, notify]
  );

  // Clear synced history
  const clearSyncedHistory = useCallback(() => {
    SyncRepository.clearSyncedMutations(userId);
    refreshSyncState();
    notify.info('Queue Cleaned', 'Cleared historical synced records.');
  }, [userId, refreshSyncState, notify]);

  const openSyncModal = () => setIsSyncModalOpen(true);
  const closeSyncModal = () => setIsSyncModalOpen(false);

  return (
    <SyncContext.Provider
      value={{
        isOnline,
        isReconnecting,
        latencyMs,
        isSyncing,
        pendingCount: pendingMutations.length,
        syncedCount,
        conflictCount: conflicts.length,
        failedCount,
        lastSyncTimestamp,
        syncState: {
          isSyncing,
          pendingCount: pendingMutations.length,
          syncedCount,
          conflictCount: conflicts.length,
          failedCount,
          lastSyncTimestamp,
        },
        pendingMutations,
        conflicts,
        allMutations,
        offlineCapabilities: OFFLINE_FEATURE_CAPABILITIES,
        isSyncModalOpen,
        openSyncModal,
        closeSyncModal,
        syncNow,
        recordMutation,
        resolveConflict,
        discardMutation,
        clearSyncedHistory,
        refreshSyncState,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
