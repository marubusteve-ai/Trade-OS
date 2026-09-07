import React from 'react';
import { WifiOff, Sparkles, AlertCircle } from 'lucide-react';
import { useSync } from '../../context/SyncContext';

interface NetworkRequirementBadgeProps {
  featureName: string;
  description?: string;
  className?: string;
}

export const NetworkRequirementBadge: React.FC<NetworkRequirementBadgeProps> = ({
  featureName,
  description = 'This feature requires an active network connection to reach external cloud services.',
  className = '',
}) => {
  const { isOnline } = useSync();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={`p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-200 flex items-start gap-3.5 ${className}`}
    >
      <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
        <WifiOff className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span>{featureName} (Offline Unavailable)</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            NETWORK REQUIRED
          </span>
        </div>
        <p className="text-xs text-[#9CA3AF] mt-1 leading-relaxed">
          {description} Your local journals, trade logs, and metrics remain 100% accessible and can still be reviewed.
        </p>
      </div>
    </div>
  );
};
