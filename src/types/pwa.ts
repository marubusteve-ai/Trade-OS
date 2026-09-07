/**
 * TradeOS PWA & Offline Domain Types
 */

export type ConnectivityStatus = 'ONLINE' | 'OFFLINE' | 'RECONNECTING';

export type SyncStatus = 'IDLE' | 'SYNCING' | 'SYNCED' | 'ERROR' | 'CONFLICT';

export type OfflineMutationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_IMPORT';

export type OfflineEntityType =
  | 'TRADE'
  | 'ACCOUNT'
  | 'STRATEGY'
  | 'PLAYBOOK'
  | 'SETUP'
  | 'PSYCHOLOGY_CHECKIN'
  | 'AUTOMATION_RULE'
  | 'RISK_POLICY'
  | 'SETTINGS';

export type ConflictResolutionStrategy = 'CLIENT_WINS' | 'SERVER_WINS' | 'MANUAL_MERGE';

export interface ConflictDetails {
  serverVersion?: any;
  clientVersion?: any;
  conflictReason: string;
  detectedAt: string;
  resolvedStrategy?: ConflictResolutionStrategy;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface OfflineMutationRecord<T = any> {
  id: string;
  userId: string;
  workspaceId?: string;
  entityType: OfflineEntityType;
  action: OfflineMutationType;
  entityId: string;
  entityName?: string;
  payload: T;
  clientTimestamp: string;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  retryCount: number;
  error?: string;
  conflictDetails?: ConflictDetails;
}

export interface OfflineFeatureCapability {
  id: string;
  name: string;
  category: 'CORE' | 'JOURNAL' | 'RISK' | 'ANALYTICS' | 'AUTOMATION' | 'AI';
  supportedOffline: boolean;
  requiresNetwork: boolean;
  description: string;
  offlineBehavior: string;
}

export interface SyncSummary {
  pendingCount: number;
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
  lastSyncTimestamp: string | null;
  isSyncing: boolean;
  errors: Array<{ mutationId: string; entityType: string; message: string; timestamp: string }>;
}

export interface SyncResult {
  success: boolean;
  processedCount: number;
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
  timestamp: string;
  conflicts: OfflineMutationRecord[];
  errors: string[];
}

export type SyncMutation<T = any> = OfflineMutationRecord<T>;
export type SyncConflict = ConflictDetails;
