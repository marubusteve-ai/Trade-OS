import React, { useState, useMemo } from 'react';
import { Trade } from '../../../types/domain';
import { formatCurrency, formatPercent } from '../../../lib/utils';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Calendar, Clock, Globe } from 'lucide-react';

interface CohortAnalysisWidgetProps {
  trades: Trade[];
  currency?: string;
}

type CohortType = 'SESSION' | 'DAY_OF_WEEK' | 'DURATION';

export const CohortAnalysisWidget: React.FC<CohortAnalysisWidgetProps> = ({
  trades,
  currency = 'USD',
}) => {
  const [cohortType, setCohortType] = useState<CohortType>('SESSION');

  const cohortData = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');

    if (cohortType === 'SESSION') {
      const sessions = ['ASIA', 'LONDON', 'NEW_YORK', 'LONDON_NY_OVERLAP', 'OTHER'];
      const sessionLabels: Record<string, string> = {
        ASIA: 'Asian Session',
        LONDON: 'London Open',
        NEW_YORK: 'New York Session',
        LONDON_NY_OVERLAP: 'London/NY Overlap',
        OTHER: 'Off-Hours',
      };

      return sessions.map((sess) => {
        const matches = closed.filter((t) => t.session === sess);
        const wins = matches.filter((t) => t.netPnL > 0.001).length;
        const netPnL = matches.reduce((acc, t) => acc + t.netPnL, 0);
        const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
        return {
          key: sess,
          label: sessionLabels[sess] || sess,
          count: matches.length,
          wins,
          netPnL,
          winRate,
        };
      });
    } else if (cohortType === 'DAY_OF_WEEK') {
      const days = [
        { dayIdx: 1, label: 'Monday' },
        { dayIdx: 2, label: 'Tuesday' },
        { dayIdx: 3, label: 'Wednesday' },
        { dayIdx: 4, label: 'Thursday' },
        { dayIdx: 5, label: 'Friday' },
      ];

      return days.map((d) => {
        const matches = closed.filter((t) => {
          const date = new Date(t.exitDate || t.entryDate);
          return date.getDay() === d.dayIdx;
        });
        const wins = matches.filter((t) => t.netPnL > 0.001).length;
        const netPnL = matches.reduce((acc, t) => acc + t.netPnL, 0);
        const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
        return {
          key: d.label,
          label: d.label,
          count: matches.length,
          wins,
          netPnL,
          winRate,
        };
      });
    } else {
      // DURATION
      const buckets = [
        { label: '< 15m (Scalp)', min: 0, max: 15 },
        { label: '15m - 1h (Intraday)', min: 15, max: 60 },
        { label: '1h - 4h (Session)', min: 60, max: 240 },
        { label: '4h+ (Swing)', min: 240, max: Infinity },
      ];

      return buckets.map((b) => {
        const matches = closed.filter((t) => {
          const durMin = (t.holdingTimeSeconds || 0) / 60;
          return durMin >= b.min && durMin < b.max;
        });
        const wins = matches.filter((t) => t.netPnL > 0.001).length;
        const netPnL = matches.reduce((acc, t) => acc + t.netPnL, 0);
        const winRate = matches.length > 0 ? (wins / matches.length) * 100 : 0;
        return {
          key: b.label,
          label: b.label,
          count: matches.length,
          wins,
          netPnL,
          winRate,
        };
      });
    }
  }, [trades, cohortType]);

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      {/* Selector Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-[#0F1012] p-0.5 rounded border border-[#22252A]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCohortType('SESSION')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              cohortType === 'SESSION' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Globe className="w-3 h-3 mr-1 text-blue-400" />
            Session
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCohortType('DAY_OF_WEEK')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              cohortType === 'DAY_OF_WEEK' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3 mr-1 text-emerald-400" />
            Day of Week
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCohortType('DURATION')}
            className={`h-6 px-2 text-[11px] font-medium rounded ${
              cohortType === 'DURATION' ? 'bg-[#22252A] text-white shadow-sm' : 'text-[#848B98] hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3 mr-1 text-purple-400" />
            Duration
          </Button>
        </div>

        <Badge variant="zinc">COHORT MATRIX</Badge>
      </div>

      {/* Cohort Breakdown Table */}
      <div className="flex-1 bg-[#0C0D0F] rounded border border-[#1E2128] overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#1C1F26] text-[#848B98] bg-[#111316]">
              <th className="p-2.5 font-medium">Cohort Segment</th>
              <th className="p-2.5 font-medium text-center">Trades</th>
              <th className="p-2.5 font-medium text-center">Win Rate</th>
              <th className="p-2.5 font-medium text-right">Net Return</th>
            </tr>
          </thead>
          <tbody>
            {cohortData.map((item) => (
              <tr key={item.key} className="border-b border-[#1C1F26]/60 hover:bg-[#14161C] transition-colors">
                <td className="p-2.5 font-medium text-white">{item.label}</td>
                <td className="p-2.5 text-center font-mono text-[#848B98]">{item.count}</td>
                <td className="p-2.5 text-center">
                  <span
                    className={`font-mono font-semibold ${
                      item.winRate >= 55 ? 'text-emerald-400' : item.winRate >= 45 ? 'text-zinc-300' : 'text-rose-400'
                    }`}
                  >
                    {item.count > 0 ? formatPercent(item.winRate) : '—'}
                  </span>
                </td>
                <td className="p-2.5 text-right font-mono font-semibold">
                  <span className={item.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {formatCurrency(item.netPnL, currency)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
