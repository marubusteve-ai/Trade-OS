/**
 * TradeOS AI Structured Response Viewer
 * 
 * Renders verified AI evaluations with high-contrast visual category badges:
 * - [OBSERVED DATA]
 * - [CALCULATED METRIC]
 * - [INTERPRETATION]
 * - [RECOMMENDATION]
 * With explicit Insufficient Data Warnings and Financial Educational Disclaimers.
 */

import React, { useState } from 'react';
import { StructuredAIAnalysisResponse } from '../../types/ai';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Info,
  Copy,
  Check,
  Download,
  Clock,
  Cpu,
  Lightbulb,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

interface AIResponseCardProps {
  response: StructuredAIAnalysisResponse;
  onSaveOrFavorite?: () => void;
  isFavorite?: boolean;
}

export const AIResponseCard: React.FC<AIResponseCardProps> = ({
  response,
}) => {
  const { notify } = useNotification();
  const [copied, setCopied] = useState(false);

  const handleCopyMarkdown = () => {
    const md = `# ${response.title}
*Review Type:* ${response.reviewType} | *Generated:* ${new Date(response.generatedAt).toLocaleString()}
*Model:* ${response.modelUsed}

## Executive Summary
${response.summary}

## [OBSERVED DATA]
${response.observedData.map((d) => `- **${d.label}:** ${d.value} *(Source: ${d.source})*`).join('\n')}

## [CALCULATED METRICS]
${response.calculatedMetrics.map((m) => `- **${m.metric}:** ${m.value} *(Formula: ${m.formulaOrSource})*`).join('\n')}

## [INTERPRETATIONS]
${response.interpretations.map((i) => `### ${i.title} (Confidence: ${i.confidence})\n${i.text}`).join('\n\n')}

## [RECOMMENDATIONS]
${response.recommendations.map((r) => `- **[${r.priority}] ${r.action}**\n  *Category: ${r.category}* | *Rationale: ${r.rationale}*`).join('\n')}

---
*Disclaimer:* ${response.disclaimer}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    notify.success('Audit Copied', 'Structured AI evaluation copied to clipboard as Markdown.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TradeOS-AI-${response.reviewType}-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Export Complete', 'AI Evaluation exported as JSON.');
  };

  return (
    <Card className="border border-[#22252A] bg-[#121418] shadow-2xl overflow-hidden space-y-6">
      {/* Header Bar */}
      <CardHeader className="bg-[#181B20] border-b border-[#22252A] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="purple" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {response.reviewType.replace(/_/g, ' ')}
            </Badge>
            <span className="text-xs text-[#848B98] flex items-center gap-1 font-mono">
              <Cpu className="h-3 w-3 text-emerald-400" />
              {response.modelUsed}
            </span>
            {response.executionTimeMs && (
              <span className="text-xs text-[#848B98] flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-cyan-400" />
                {response.executionTimeMs}ms
              </span>
            )}
          </div>
          <CardTitle className="text-base sm:text-lg font-bold text-white tracking-tight">
            {response.title}
          </CardTitle>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyMarkdown}
            className="text-xs border-[#2A2E35] text-[#D1D5DB] hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? 'Copied' : 'Copy MD'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadJSON}
            className="text-xs border-[#2A2E35] text-[#D1D5DB] hover:text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1" />
            JSON
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-6 text-sm">
        {/* Insufficient Data Warnings */}
        {response.insufficientDataWarnings && response.insufficientDataWarnings.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Statistical Sample Size Notice</span>
            </div>
            <ul className="space-y-1 text-xs text-amber-200/90 list-disc list-inside">
              {response.insufficientDataWarnings.map((w, idx) => (
                <li key={idx}>
                  <strong>{w.field}:</strong> {w.warningMessage}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Executive Summary Box */}
        <div className="p-4 rounded-xl bg-[#181B20] border border-[#2A2E35] space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Executive Synthesis
          </div>
          <p className="text-sm sm:text-base text-[#F3F4F6] font-normal leading-relaxed">
            {response.summary}
          </p>
        </div>

        {/* Category 1: [OBSERVED DATA] */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#22252A] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                [OBSERVED DATA]
              </span>
              <span className="text-xs font-semibold text-[#D1D5DB]">Factual Ledger Records & Logs</span>
            </div>
            <span className="text-[10px] text-[#848B98] font-mono">ZERO ESTIMATION</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {response.observedData.map((obs, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#0E1013] border border-[#22252A] flex flex-col justify-between space-y-1.5 hover:border-[#323742] transition-colors"
              >
                <span className="text-xs text-[#848B98]">{obs.label}</span>
                <span className="text-sm font-bold text-white font-mono">{obs.value}</span>
                <span className="text-[10px] text-blue-400/80 truncate font-mono">
                  Source: {obs.source}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: [CALCULATED METRIC] */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#22252A] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                [CALCULATED METRIC]
              </span>
              <span className="text-xs font-semibold text-[#D1D5DB]">Deterministic Mathematical Formulas</span>
            </div>
            <span className="text-[10px] text-[#848B98] font-mono">CALCULATION ENGINE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {response.calculatedMetrics.map((met, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#0E1013] border border-[#22252A] flex flex-col justify-between space-y-1.5 hover:border-[#323742] transition-colors"
              >
                <span className="text-xs text-[#848B98]">{met.metric}</span>
                <span className="text-base font-bold text-emerald-400 font-mono">{met.value}</span>
                <span className="text-[10px] text-[#848B98] truncate font-mono">
                  {met.formulaOrSource}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category 3: [INTERPRETATION] */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#22252A] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                [INTERPRETATION]
              </span>
              <span className="text-xs font-semibold text-[#D1D5DB]">Qualitative Reasoning & Dynamics</span>
            </div>
            <span className="text-[10px] text-[#848B98] font-mono">BEHAVIORAL DEDUCTION</span>
          </div>

          <div className="space-y-2.5">
            {response.interpretations.map((interp, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#0E1013] border border-[#22252A] space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-purple-400" />
                    {interp.title}
                  </span>
                  <Badge
                    variant={
                      interp.confidence === 'HIGH'
                        ? 'emerald'
                        : interp.confidence === 'MEDIUM'
                        ? 'blue'
                        : 'amber'
                    }
                    className="text-[9px] px-1.5 py-0 font-mono"
                  >
                    CONFIDENCE: {interp.confidence}
                  </Badge>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed">{interp.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Category 4: [RECOMMENDATION] */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#22252A] pb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                [RECOMMENDATION]
              </span>
              <span className="text-xs font-semibold text-[#D1D5DB]">Actionable Discipline & Process Steps</span>
            </div>
            <span className="text-[10px] text-[#848B98] font-mono">PROCESS OPTIMIZATION</span>
          </div>

          <div className="space-y-2.5">
            {response.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-lg bg-[#0E1013] border border-[#22252A] space-y-2 hover:border-amber-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        rec.priority === 'HIGH'
                          ? 'rose'
                          : rec.priority === 'MEDIUM'
                          ? 'amber'
                          : 'blue'
                      }
                      className="text-[9px] font-mono font-bold"
                    >
                      {rec.priority} PRIORITY
                    </Badge>
                    <span className="text-[10px] font-mono text-[#848B98] uppercase">
                      [{rec.category}]
                    </span>
                  </div>
                </div>

                <div className="text-xs sm:text-sm font-semibold text-white">
                  {rec.action}
                </div>

                <div className="text-xs text-[#848B98] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>Rationale: {rec.rationale}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regulatory & Educational Disclaimer */}
        <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-[11px] text-[#848B98] flex items-start gap-2.5">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#D1D5DB] block">Trading Education & Risk Disclaimer</span>
            <p className="mt-0.5 leading-relaxed">{response.disclaimer}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
