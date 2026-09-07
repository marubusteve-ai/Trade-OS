import React, { useMemo } from 'react';
import { Trade } from '../../../types/domain';
import { formatPercent } from '../../../lib/utils';
import { Badge } from '../../ui/Badge';

interface RMultipleHistogramWidgetProps {
  trades: Trade[];
  height?: number;
}

export const RMultipleHistogramWidget: React.FC<RMultipleHistogramWidgetProps> = ({
  trades,
  height = 240,
}) => {
  const bins = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');
    const bucketDefs = [
      { label: '< -2R', min: -Infinity, max: -2.001 },
      { label: '-2R', min: -2.0, max: -1.001 },
      { label: '-1R', min: -1.0, max: -0.001 },
      { label: '0R (BE)', min: 0.0, max: 0.499 },
      { label: '1R', min: 0.5, max: 1.499 },
      { label: '2R', min: 1.5, max: 2.499 },
      { label: '3R', min: 2.5, max: 3.499 },
      { label: '4R+', min: 3.5, max: Infinity },
    ];

    return bucketDefs.map((b) => {
      const matching = closed.filter((t) => {
        const r = t.achievedRMultiple ?? 0;
        return r >= b.min && r <= b.max;
      });
      const isPositive = b.max > 0;
      return {
        label: b.label,
        count: matching.length,
        trades: matching,
        isPositive,
      };
    });
  }, [trades]);

  const maxCount = useMemo(() => {
    return Math.max(...bins.map((b) => b.count), 1);
  }, [bins]);

  const totalClosed = useMemo(() => {
    return trades.filter((t) => t.status === 'CLOSED').length;
  }, [trades]);

  const avgR = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');
    if (closed.length === 0) return 0;
    const sum = closed.reduce((acc, t) => acc + (t.achievedRMultiple || 0), 0);
    return sum / closed.length;
  }, [trades]);

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#848B98]">Average Outcome:</span>
          <strong className={avgR >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            {avgR >= 0 ? '+' : ''}{avgR.toFixed(2)} R
          </strong>
        </div>
        <Badge variant={avgR >= 0.5 ? 'emerald' : 'zinc'}>
          {avgR >= 0.5 ? 'POSITIVE ASYMMETRY' : 'LOW ASYMMETRY'}
        </Badge>
      </div>

      {/* Histogram Bars */}
      <div className="flex-1 bg-[#0C0D0F] rounded border border-[#1E2128] p-3 flex items-end justify-between gap-2 min-h-[140px]">
        {bins.map((b, idx) => {
          const heightPercent = Math.max(8, (b.count / maxCount) * 100);
          const percentOfTotal = totalClosed > 0 ? (b.count / totalClosed) * 100 : 0;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 group h-full justify-end">
              <span className="text-[10px] font-mono text-[#848B98] group-hover:text-white transition-colors">
                {b.count}
              </span>
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-t transition-all duration-200 ${
                  b.isPositive
                    ? 'bg-emerald-500/70 hover:bg-emerald-400'
                    : 'bg-rose-500/70 hover:bg-rose-400'
                }`}
                title={`${b.label}: ${b.count} trades (${percentOfTotal.toFixed(1)}%)`}
              />
              <span className="text-[9.5px] font-medium text-[#555C68] group-hover:text-[#848B98] text-center truncate max-w-full">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
