import React from 'react';
import { BookOpen, ArrowUpRight, ArrowDownRight, Plus, ExternalLink } from 'lucide-react';
import { Trade } from '../../types/domain';
import { formatCurrency, formatShortDate } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface RecentTradesWidgetProps {
  trades: Trade[];
  onOpenNewTradeModal: () => void;
  onViewAllTrades: () => void;
}

export const RecentTradesWidget: React.FC<RecentTradesWidgetProps> = ({
  trades,
  onOpenNewTradeModal,
  onViewAllTrades,
}) => {
  const recentTrades = [...trades]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3 border-b border-[#22252A] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <CardTitle className="text-sm font-semibold text-white">
            Recent Executions
          </CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAllTrades}
          className="text-xs text-[#848B98] hover:text-white"
        >
          <span>View All Journal</span>
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </CardHeader>

      <CardContent className="pt-3">
        {recentTrades.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#848B98]">
            <p>No trades logged yet.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenNewTradeModal}
              className="mt-2 text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" /> Log First Trade
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#22252A] text-[#848B98] text-[10px] uppercase">
                  <th className="pb-2 font-medium">Instrument</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 font-medium">Entry/Exit</th>
                  <th className="pb-2 font-medium">Qty</th>
                  <th className="pb-2 font-medium">R-Mult</th>
                  <th className="pb-2 font-medium text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {recentTrades.map((t) => {
                  const isLong = t.direction === 'LONG';
                  const isWinner = t.netPnL > 0;
                  return (
                    <tr key={t.id} className="hover:bg-[#1A1D21] transition-colors">
                      <td className="py-2.5 font-bold text-white flex items-center gap-1.5">
                        {t.instrument}
                        {t.strategyName && (
                          <span className="text-[9px] font-sans font-normal text-[#848B98] hidden sm:inline truncate max-w-[100px]">
                            • {t.strategyName}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <Badge variant={isLong ? 'emerald' : 'rose'} size="sm">
                          {t.direction}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-[#D1D5DB]">
                        {t.entryPrice} → {t.exitPrice || 'OPEN'}
                      </td>
                      <td className="py-2.5 text-[#848B98]">
                        {t.quantity}
                      </td>
                      <td className="py-2.5">
                        {t.achievedRMultiple !== undefined ? (
                          <span className={t.achievedRMultiple >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                            {t.achievedRMultiple > 0 ? `+${t.achievedRMultiple}R` : `${t.achievedRMultiple}R`}
                          </span>
                        ) : (
                          <span className="text-[#606773]">—</span>
                        )}
                      </td>
                      <td className={`py-2.5 text-right font-bold ${isWinner ? 'text-emerald-400' : t.netPnL < 0 ? 'text-rose-400' : 'text-[#848B98]'}`}>
                        {formatCurrency(t.netPnL)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
