import React from 'react';
import { WifiOff, RefreshCw, AlertTriangle, CloudOff, Check } from 'lucide-react';
import { useSync } from '../../context/SyncContext';

interface OfflineIndicatorProps {
  mode?: 'banner' | 'header-badge' | 'sidebar-status';
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ mode = 'banner' }) => {
  const {
    isOnline,
    isReconnecting,
    isSyncing,
    pendingCount,
    conflictCount,
    openSyncModal,
    syncNow,
  } = useSync();

  // Header badge mode (compact pill)
  if (mode === 'header-badge') {
    if (!isOnline) {
      return (
        <button
          onClick={openSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-colors cursor-pointer"
          title="Offline mode active. Click to view sync queue."
        >
          <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
          <WifiOff className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px] font-semibold">OFFLINE {pendingCount > 0 ? `(${pendingCount})` : ''}</span>
        </button>
      );
    }

    if (conflictCount > 0) {
      return (
        <button
          onClick={openSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium hover:bg-rose-500/25 transition-colors cursor-pointer"
          title="Sync conflicts detected. Click to resolve."
        >
          <AlertTriangle className="h-3.5 w-3.5 text-rose-400 animate-bounce" />
          <span className="font-mono text-[11px] font-semibold">{conflictCount} CONFLICT{conflictCount > 1 ? 'S' : ''}</span>
        </button>
      );
    }

    if (isSyncing || isReconnecting) {
      return (
        <button
          onClick={openSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          <span className="font-mono text-[11px]">SYNCING...</span>
        </button>
      );
    }

    if (pendingCount > 0) {
      return (
        <button
          onClick={openSyncModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors cursor-pointer"
          title="Local mutations waiting to sync."
        >
          <CloudOff className="h-3.5 w-3.5" />
          <span className="font-mono text-[11px]">{pendingCount} PENDING</span>
        </button>
      );
    }

    // Default Online state pill
    return (
      <button
        onClick={openSyncModal}
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono transition-colors cursor-pointer"
        title="Terminal online. Click for sync inspector."
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <span className="text-[#9CA3AF] font-sans">ONLINE</span>
      </button>
    );
  }

  // Sidebar Status mode
  if (mode === 'sidebar-status') {
    return (
      <div
        onClick={openSyncModal}
        className={`p-3 rounded-xl border transition-all cursor-pointer ${
          !isOnline
            ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
            : conflictCount > 0
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            : pendingCount > 0
            ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
            : 'bg-[#121418] border-[#262B33] text-[#9CA3AF] hover:border-[#38BDF8]/30'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                !isOnline
                  ? 'bg-amber-400 animate-pulse'
                  : conflictCount > 0
                  ? 'bg-rose-400'
                  : isSyncing
                  ? 'bg-blue-400 animate-spin'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-semibold text-white">
              {!isOnline
                ? 'Offline Workstation'
                : conflictCount > 0
                ? `${conflictCount} Conflicts`
                : isSyncing
                ? 'Syncing Terminal...'
                : pendingCount > 0
                ? `${pendingCount} Local Changes`
                : 'Terminal Synchronized'}
            </span>
          </div>

          <span className="text-[10px] font-mono uppercase text-[#6B7280]">
            {!isOnline ? 'OFFLINE' : isSyncing ? 'SYNC' : 'READY'}
          </span>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[11px] text-[#6B7280]">
          <span>{pendingCount} queued edits</span>
          <span className="text-[#38BDF8] hover:underline">Inspect →</span>
        </div>
      </div>
    );
  }

  // Floating Banner mode (bottom-right / bottom-center alert when offline or in conflict)
  if (isOnline && conflictCount === 0 && pendingCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div
        className={`p-3.5 rounded-xl shadow-2xl border flex items-center justify-between gap-3 ${
          !isOnline
            ? 'bg-[#181B20]/95 backdrop-blur-md border-amber-500/40 text-amber-200'
            : conflictCount > 0
            ? 'bg-[#181B20]/95 backdrop-blur-md border-rose-500/40 text-rose-200'
            : 'bg-[#181B20]/95 backdrop-blur-md border-blue-500/40 text-blue-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
              !isOnline
                ? 'bg-amber-500/20 text-amber-400'
                : conflictCount > 0
                ? 'bg-rose-500/20 text-rose-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {!isOnline ? (
              <WifiOff className="h-4 w-4" />
            ) : conflictCount > 0 ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </div>

          <div className="text-left">
            <div className="text-xs font-semibold text-white flex items-center gap-1.5">
              {!isOnline
                ? 'Offline Workstation Active'
                : conflictCount > 0
                ? 'Sync Conflicts Detected'
                : 'Changes Pending Replication'}
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#262B33] text-[#9CA3AF]">
                {pendingCount} queued
              </span>
            </div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">
              {!isOnline
                ? 'Journals & calculations safely cached locally.'
                : conflictCount > 0
                ? 'Review colliding changes to avoid overwriting.'
                : 'Will replicate automatically.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isOnline && pendingCount > 0 && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing' : 'Sync'}</span>
            </button>
          )}

          <button
            onClick={openSyncModal}
            className="px-2.5 py-1.5 rounded-lg bg-[#262B33] hover:bg-[#323944] text-[#D1D5DB] hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Inspect
          </button>
        </div>
      </div>
    </div>
  );
};
