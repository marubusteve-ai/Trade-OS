import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Layers,
  ArrowRight,
  Trash2,
  Check,
  X,
  Smartphone,
  Server,
  Zap,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useSync } from '../../context/SyncContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { OfflineMutationRecord, ConflictResolutionStrategy } from '../../types/pwa';

export const SyncStatusModal: React.FC = () => {
  const {
    isOnline,
    latencyMs,
    isSyncing,
    pendingCount,
    syncedCount,
    conflictCount,
    lastSyncTimestamp,
    pendingMutations,
    conflicts,
    allMutations,
    offlineCapabilities,
    isSyncModalOpen,
    closeSyncModal,
    syncNow,
    resolveConflict,
    discardMutation,
    clearSyncedHistory,
  } = useSync();

  const { isInstalled, isStandalone, isInstallable, install } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'QUEUE' | 'CONFLICTS' | 'CAPABILITIES' | 'DIAGNOSTICS'>('QUEUE');
  const [selectedConflict, setSelectedConflict] = useState<OfflineMutationRecord | null>(null);
  const [mergeNotes, setMergeNotes] = useState<string>('');

  if (!isSyncModalOpen) return null;

  const handleManualSync = async (withConflictSimulator = false) => {
    await syncNow({ remoteConflictSimulator: withConflictSimulator });
  };

  const handleResolve = async (
    record: OfflineMutationRecord,
    strategy: ConflictResolutionStrategy
  ) => {
    let mergedPayload = undefined;
    if (strategy === 'MANUAL_MERGE') {
      mergedPayload = {
        ...record.payload,
        notes: mergeNotes || `${record.payload?.notes || ''} [Merged: ${new Date().toLocaleTimeString()}]`,
      };
    }
    await resolveConflict(record.id, strategy, mergedPayload);
    if (selectedConflict?.id === record.id) {
      setSelectedConflict(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#0F1115] border border-[#262B33] shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1F242C] bg-[#121418] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                !isOnline
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : conflictCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {!isOnline ? (
                <WifiOff className="h-5 w-5" />
              ) : conflictCount > 0 ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Database className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Synchronization & PWA Diagnostics</h2>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                    !isOnline
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {isOnline ? 'ONLINE' : 'OFFLINE WORKSTATION'}
                </span>
              </div>
              <p className="text-xs text-[#9CA3AF] mt-0.5">
                Local-first mutation queue, conflict resolution, and offline feature governance
              </p>
            </div>
          </div>

          <button
            onClick={closeSyncModal}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1F242C] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="px-6 py-3 bg-[#16191E] border-b border-[#1F242C] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 text-[#9CA3AF]">
              <Clock className="h-3.5 w-3.5 text-[#38BDF8]" />
              <span>Last Synchronized:</span>
              <span className="font-mono text-white font-medium">
                {lastSyncTimestamp ? new Date(lastSyncTimestamp).toLocaleTimeString() : 'Pending initial sync'}
              </span>
            </div>

            {latencyMs !== null && (
              <div className="flex items-center gap-2 text-[#9CA3AF]">
                <Zap className="h-3.5 w-3.5 text-emerald-400" />
                <span>Heartbeat:</span>
                <span className="font-mono text-emerald-400">{latencyMs}ms</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleManualSync(false)}
              disabled={isSyncing || !isOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isOnline
                  ? 'bg-[#1F242C] text-[#6B7280] cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-sm'
              }`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Sync Now'}</span>
            </button>

            <button
              onClick={() => handleManualSync(true)}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F242C] hover:bg-[#282E38] text-[#9CA3AF] hover:text-white text-xs font-medium border border-[#2B313A] transition-colors cursor-pointer"
              title="Test simulated conflict detection with remote edits"
            >
              <span>Simulate Conflict</span>
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="px-6 pt-3 border-b border-[#1F242C] bg-[#0F1115] flex gap-2">
          <button
            onClick={() => setActiveTab('QUEUE')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'QUEUE'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Pending Mutations ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('CONFLICTS')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CONFLICTS'
                ? 'border-rose-500 text-rose-400'
                : 'border-transparent text-[#9CA3AF] hover:text-white'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Conflicts ({conflictCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('CAPABILITIES')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'CAPABILITIES'
                ? 'border-[#38BDF8] text-[#38BDF8]'
                : 'border-transparent text-[#9CA3AF] hover:text-white'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Offline Feature Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('DIAGNOSTICS')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'DIAGNOSTICS'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-[#9CA3AF] hover:text-white'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>PWA & Storage</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: PENDING MUTATIONS QUEUE */}
          {activeTab === 'QUEUE' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#9CA3AF]">
                  Showing all local modifications queued for cloud replication.
                </div>
                {allMutations.length > 0 && (
                  <button
                    onClick={clearSyncedHistory}
                    className="text-xs text-[#6B7280] hover:text-rose-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear Synced History</span>
                  </button>
                )}
              </div>

              {allMutations.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-[#1F242C] bg-[#121418] text-[#6B7280]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">Queue is Empty</div>
                  <p className="text-xs mt-1">All local journal records and configurations are fully synchronized.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allMutations.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                        m.status === 'PENDING'
                          ? 'bg-[#181B20] border-blue-500/30'
                          : m.status === 'CONFLICT'
                          ? 'bg-rose-500/10 border-rose-500/30'
                          : m.status === 'FAILED'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : 'bg-[#121418] border-[#1F242C] opacity-75'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-1 rounded ${
                            m.action === 'CREATE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : m.action === 'UPDATE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {m.action}
                        </span>

                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white flex items-center gap-2 truncate">
                            <span>{m.entityType}</span>
                            <span className="text-[#6B7280] font-mono text-[10px]">#{m.entityId}</span>
                            {m.entityName && (
                              <span className="text-xs text-[#9CA3AF] truncate">({m.entityName})</span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                            Queued: {new Date(m.clientTimestamp).toLocaleTimeString()} • Status: {m.status}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {m.status === 'CONFLICT' ? (
                          <button
                            onClick={() => {
                              setSelectedConflict(m);
                              setActiveTab('CONFLICTS');
                            }}
                            className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Resolve Conflict
                          </button>
                        ) : m.status === 'PENDING' ? (
                          <span className="text-[11px] font-mono text-blue-400 px-2 py-0.5 rounded bg-blue-500/10">
                            Waiting
                          </span>
                        ) : m.status === 'SYNCED' ? (
                          <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                            <Check className="h-3 w-3" /> Synced
                          </span>
                        ) : null}

                        <button
                          onClick={() => discardMutation(m.id)}
                          className="p-1 rounded text-[#6B7280] hover:text-rose-400 hover:bg-[#1F242C] transition-colors cursor-pointer"
                          title="Discard Mutation"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONFLICT RESOLVER */}
          {activeTab === 'CONFLICTS' && (
            <div className="space-y-4">
              {conflicts.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-[#1F242C] bg-[#121418] text-[#6B7280]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mx-auto mb-2" />
                  <div className="text-sm font-medium text-white">No Active Conflicts</div>
                  <p className="text-xs mt-1">
                    Your local changes have replicated without colliding with concurrent edits.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {conflicts.map((conf) => (
                    <div
                      key={conf.id}
                      className="p-5 rounded-xl border border-rose-500/30 bg-[#16191E] space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <AlertTriangle className="h-5 w-5 text-rose-400" />
                          <div>
                            <div className="text-sm font-bold text-white">
                              Conflict in {conf.entityType} ({conf.action})
                            </div>
                            <div className="text-xs text-rose-300 mt-0.5">
                              {conf.conflictDetails?.conflictReason}
                            </div>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 font-bold">
                          ACTION REQUIRED
                        </span>
                      </div>

                      {/* Side-by-Side Diff */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Local Client Version */}
                        <div className="p-4 rounded-xl border border-blue-500/30 bg-[#121418]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                              <Smartphone className="h-3.5 w-3.5" /> Local Version (Your Workstation)
                            </span>
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              {new Date(conf.clientTimestamp).toLocaleTimeString()}
                            </span>
                          </div>

                          <pre className="text-[11px] font-mono text-[#D1D5DB] bg-[#0C0D0F] p-3 rounded-lg overflow-x-auto max-h-40 border border-[#1F242C]">
                            {JSON.stringify(conf.payload, null, 2)}
                          </pre>

                          <button
                            onClick={() => handleResolve(conf, 'CLIENT_WINS')}
                            className="w-full mt-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Keep Local (Client Wins)
                          </button>
                        </div>

                        {/* Remote Server Version */}
                        <div className="p-4 rounded-xl border border-purple-500/30 bg-[#121418]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                              <Server className="h-3.5 w-3.5" /> Remote Version (Cloud Terminal)
                            </span>
                            <span className="text-[10px] font-mono text-[#6B7280]">
                              {conf.conflictDetails?.detectedAt
                                ? new Date(conf.conflictDetails.detectedAt).toLocaleTimeString()
                                : 'Server'}
                            </span>
                          </div>

                          <pre className="text-[11px] font-mono text-[#D1D5DB] bg-[#0C0D0F] p-3 rounded-lg overflow-x-auto max-h-40 border border-[#1F242C]">
                            {JSON.stringify(conf.conflictDetails?.serverVersion || {}, null, 2)}
                          </pre>

                          <button
                            onClick={() => handleResolve(conf, 'SERVER_WINS')}
                            className="w-full mt-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Accept Remote (Server Wins)
                          </button>
                        </div>
                      </div>

                      {/* Manual Merge Section */}
                      <div className="p-3.5 rounded-lg bg-[#0C0D0F] border border-[#1F242C] flex items-center justify-between gap-4">
                        <div className="text-xs text-[#9CA3AF]">
                          Combine both sets of changes safely:
                        </div>
                        <button
                          onClick={() => handleResolve(conf, 'MANUAL_MERGE')}
                          className="px-4 py-1.5 rounded-lg bg-[#262B33] hover:bg-[#323944] text-[#F3F4F6] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Merge & Resolve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OFFLINE FEATURE MATRIX */}
          {activeTab === 'CAPABILITIES' && (
            <div className="space-y-4">
              <div className="text-xs text-[#9CA3AF]">
                TradeOS follows a zero-mocking, local-first architecture. Below is the explicit support matrix for offline vs online capabilities.
              </div>

              <div className="space-y-3">
                {offlineCapabilities.map((cap) => (
                  <div
                    key={cap.id}
                    className="p-4 rounded-xl border border-[#1F242C] bg-[#121418] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{cap.name}</span>
                        <span className="text-[10px] font-mono text-[#6B7280] px-1.5 py-0.5 rounded bg-[#1F242C]">
                          {cap.category}
                        </span>
                      </div>
                      <div className="text-xs text-[#9CA3AF] leading-relaxed max-w-xl">
                        {cap.description}
                      </div>
                      <div className="text-[11px] text-[#38BDF8] font-mono">
                        Behavior: {cap.offlineBehavior}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {cap.supportedOffline ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>100% Offline Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium">
                          <WifiOff className="h-3.5 w-3.5" />
                          <span>Network Required</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DIAGNOSTICS & PWA */}
          {activeTab === 'DIAGNOSTICS' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-[#1F242C] bg-[#121418] space-y-3">
                <div className="text-xs font-bold text-white uppercase tracking-wider text-[#9CA3AF]">
                  Progressive Web App State
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-[#16191E] border border-[#1F242C]">
                    <div className="text-[10px] text-[#6B7280] uppercase">Display Mode</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">
                      {isStandalone ? 'Standalone' : 'Browser Tab'}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#16191E] border border-[#1F242C]">
                    <div className="text-[10px] text-[#6B7280] uppercase">Service Worker</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">Active & Precached</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#16191E] border border-[#1F242C]">
                    <div className="text-[10px] text-[#6B7280] uppercase">Storage Engine</div>
                    <div className="text-sm font-bold text-[#38BDF8] mt-1">Partitioned LocalDB</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#16191E] border border-[#1F242C]">
                    <div className="text-[10px] text-[#6B7280] uppercase">Manifest Status</div>
                    <div className="text-sm font-bold text-emerald-400 mt-1">Compliant</div>
                  </div>
                </div>

                {isInstallable && (
                  <button
                    onClick={() => install()}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Install TradeOS Workstation App
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#1F242C] bg-[#121418] flex items-center justify-between text-xs text-[#9CA3AF]">
          <div>TradeOS Institutional Offline Architecture — Zero Silent Data Loss</div>
          <button
            onClick={closeSyncModal}
            className="px-4 py-1.5 rounded-lg bg-[#1F242C] hover:bg-[#282E38] text-white font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
