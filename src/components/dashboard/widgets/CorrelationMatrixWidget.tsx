import React, { useMemo } from 'react';
import { Trade } from '../../../types/domain';
import { Badge } from '../../ui/Badge';

interface CorrelationMatrixWidgetProps {
  trades: Trade[];
}

export const CorrelationMatrixWidget: React.FC<CorrelationMatrixWidgetProps> = ({ trades }) => {
  // Extract top traded instruments
  const { instruments, matrix } = useMemo(() => {
    const closed = trades.filter((t) => t.status === 'CLOSED');
    const instrumentCounts = new Map<string, number>();
    closed.forEach((t) => {
      instrumentCounts.set(t.instrument, (instrumentCounts.get(t.instrument) || 0) + 1);
    });

    // Take top 5 most frequent instruments
    const topInstruments = Array.from(instrumentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([sym]) => sym);

    if (topInstruments.length === 0) {
      return { instruments: ['EURUSD', 'NQ', 'ES', 'BTCUSDT', 'GC'], matrix: [] };
    }

    // Generate date map of daily PnLs per instrument
    const dateMap = new Map<string, Record<string, number>>();
    closed.forEach((t) => {
      const d = (t.exitDate || t.entryDate).split('T')[0];
      if (!dateMap.has(d)) dateMap.set(d, {});
      const dayRec = dateMap.get(d)!;
      dayRec[t.instrument] = (dayRec[t.instrument] || 0) + t.netPnL;
    });

    const dates = Array.from(dateMap.keys());

    // Pearson Correlation
    const computeCorrelation = (instA: string, instB: string) => {
      if (instA === instB) return 1.0;

      const seriesA: number[] = [];
      const seriesB: number[] = [];

      dates.forEach((d) => {
        const dayRec = dateMap.get(d)!;
        seriesA.push(dayRec[instA] || 0);
        seriesB.push(dayRec[instB] || 0);
      });

      if (seriesA.length < 2) return 0.0;

      const meanA = seriesA.reduce((a, b) => a + b, 0) / seriesA.length;
      const meanB = seriesB.reduce((a, b) => a + b, 0) / seriesB.length;

      let numerator = 0;
      let denomA = 0;
      let denomB = 0;

      for (let i = 0; i < seriesA.length; i++) {
        const diffA = seriesA[i] - meanA;
        const diffB = seriesB[i] - meanB;
        numerator += diffA * diffB;
        denomA += diffA * diffA;
        denomB += diffB * diffB;
      }

      const denominator = Math.sqrt(denomA * denomB);
      if (denominator === 0) return 0.0;
      return Math.max(-1, Math.min(1, numerator / denominator));
    };

    const corrMatrix: number[][] = [];
    topInstruments.forEach((iA, rIdx) => {
      corrMatrix[rIdx] = [];
      topInstruments.forEach((iB, cIdx) => {
        corrMatrix[rIdx][cIdx] = computeCorrelation(iA, iB);
      });
    });

    return { instruments: topInstruments, matrix: corrMatrix };
  }, [trades]);

  const getHeatmapColor = (val: number) => {
    if (val === 1.0) return 'bg-emerald-500/30 text-emerald-300 font-bold border-emerald-500/40';
    if (val >= 0.6) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20';
    if (val >= 0.2) return 'bg-emerald-500/10 text-emerald-500/80 border-transparent';
    if (val <= -0.6) return 'bg-rose-500/30 text-rose-300 font-bold border-rose-500/40';
    if (val <= -0.2) return 'bg-rose-500/15 text-rose-400 border-transparent';
    return 'bg-[#181A1F] text-[#848B98] border-transparent';
  };

  return (
    <div className="space-y-3 flex-1 flex flex-col justify-between">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#848B98]">Daily Return Pearson Correlation Matrix</span>
        <Badge variant="blue">DIVERSIFICATION RADAR</Badge>
      </div>

      <div className="flex-1 bg-[#0C0D0F] rounded border border-[#1E2128] p-3 overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-[#555C68] font-mono">SYM</th>
              {instruments.map((sym) => (
                <th key={sym} className="p-2 font-mono text-white text-xs font-semibold">
                  {sym}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instruments.map((symA, rowIdx) => (
              <tr key={symA} className="border-t border-[#1C1F26]">
                <td className="p-2 text-left font-mono font-bold text-white">{symA}</td>
                {instruments.map((symB, colIdx) => {
                  const val = matrix[rowIdx]?.[colIdx] ?? (rowIdx === colIdx ? 1 : 0);
                  return (
                    <td key={symB} className="p-1.5">
                      <div
                        className={`py-1 px-2 rounded border text-[11px] font-mono transition-colors ${getHeatmapColor(
                          val
                        )}`}
                        title={`${symA} vs ${symB}: ${(val * 100).toFixed(1)}% correlation`}
                      >
                        {val >= 0 ? '+' : ''}
                        {val.toFixed(2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
