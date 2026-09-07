/**
 * Psychology, Discipline & Tilt Tracker View
 * 
 * Interactive Hub for Emotional Check-ins, Mistake Cost Attribution,
 * 6-Pillar Behavioral Radar, Tilt Circuit Breaker, and Taxonomy Management.
 */

import React, { useState } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { CheckInModal } from './CheckInModal';
import { MistakeModal } from './MistakeModal';
import { PreTradeEmotion, SessionCheckIn, MistakeTaxonomyItem } from '../../types/psychology';
import { 
  HeartPulse, 
  Brain, 
  AlertOctagon, 
  CheckCircle2, 
  Smile, 
  Frown, 
  Meh, 
  Plus, 
  ShieldAlert, 
  Flame, 
  Activity, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  Zap, 
  Trash2, 
  Check, 
  Sparkles, 
  Moon, 
  BarChart3, 
  Layers, 
  AlertTriangle,
  Info
} from 'lucide-react';

type SubTab = 'OVERVIEW' | 'EMOTIONS' | 'MISTAKES' | 'CHECKINS' | 'HABITS';

export const PsychologyView: React.FC = () => {
  const { 
    psychologyReport, 
    sessionCheckIns, 
    mistakeTaxonomy, 
    mistakeCategories, 
    selectedAccountTrades,
    createSessionCheckIn,
    deleteSessionCheckIn,
    createTaxonomyMistake,
    deleteTaxonomyMistake,
  } = useTradeOS();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('OVERVIEW');
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isMistakeModalOpen, setIsMistakeModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  const handleSaveCheckIn = async (checkInData: Omit<SessionCheckIn, 'id' | 'userId' | 'timestamp'>) => {
    await createSessionCheckIn(checkInData);
    showToast('Session mindset & emotional check-in logged successfully!');
  };

  const handleDeleteCheckIn = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this session check-in?')) {
      await deleteSessionCheckIn(id);
      showToast('Session check-in removed.');
    }
  };

  const handleSaveMistake = async (mistakeData: Omit<MistakeTaxonomyItem, 'id' | 'isCustom'>) => {
    await createTaxonomyMistake(mistakeData);
    showToast(`Custom mistake "${mistakeData.name}" added to taxonomy.`);
  };

  const handleDeleteMistake = async (id: string) => {
    if (window.confirm('Delete this custom mistake taxonomy item?')) {
      await deleteTaxonomyMistake(id);
      showToast('Custom mistake item deleted.');
    }
  };

  const { radar, tiltMonitor, emotionsPre, emotionsPost, costAnalysis, consecutiveLossImpact, ruleAdherence, topMistakesByCost, topMistakesByFrequency, tradingHabitsSummary } = psychologyReport;

  // Formatting helpers
  const formatCurrency = (val: number) => {
    const prefix = val < 0 ? '-' : val > 0 ? '+' : '';
    return `${prefix}$${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTiltBadgeVariant = (status: string) => {
    switch (status) {
      case 'CALM': return 'emerald';
      case 'CAUTION': return 'amber';
      case 'TILT_WARNING': return 'purple';
      case 'CIRCUIT_BREAKER_TRIPPED': return 'rose';
      default: return 'zinc';
    }
  };

  const getMoodEmoji = (mood: PreTradeEmotion | string) => {
    switch (mood) {
      case 'CALM': return '😌';
      case 'FOCUSED': return '🎯';
      case 'CONFIDENT': return '💪';
      case 'OPTIMISTIC': return '✨';
      case 'EAGER': return '⚡';
      case 'ANXIOUS': return '😰';
      case 'FOMO': return '🏃';
      case 'REVENGE': return '🔥';
      case 'FATIGUED': return '🥱';
      case 'IMPATIENT': return '⏳';
      case 'BORED': return '😑';
      default: return '😐';
    }
  };

  const filteredTaxonomy = selectedCategoryFilter === 'ALL'
    ? mistakeTaxonomy
    : mistakeTaxonomy.filter(m => m.categoryId === selectedCategoryFilter);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Success Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl bg-[#13151A] border border-emerald-500/50 shadow-2xl text-xs text-[#F3F4F6] flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Psychology, Discipline & Tilt Engine
            </h1>
            <Badge variant="emerald">BEHAVIORAL SUITE</Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Pre-session emotional state check-ins, mistake drag attribution, 6-pillar behavioral radar, and revenge-trading defense.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => setIsMistakeModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5 text-[#848B98]" />
            New Mistake Item
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => setIsCheckInModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Log Emotional Check-in
          </Button>
        </div>
      </div>

      {/* Tilt Circuit Breaker Alert Banner (if caution or warning or tripped) */}
      {tiltMonitor.status !== 'CALM' && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          tiltMonitor.status === 'CIRCUIT_BREAKER_TRIPPED' 
            ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' 
            : tiltMonitor.status === 'TILT_WARNING' 
            ? 'bg-purple-500/10 border-purple-500/40 text-purple-300' 
            : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  {tiltMonitor.status === 'CIRCUIT_BREAKER_TRIPPED' ? 'Tilt Circuit Breaker Tripped!' : 'Tilt Warning Active'}
                </span>
                <Badge variant={getTiltBadgeVariant(tiltMonitor.status)}>
                  {tiltMonitor.tiltProbabilityPercent}% Risk Level
                </Badge>
              </div>
              <p className="text-xs opacity-90 mt-1">
                {tiltMonitor.suggestedAction}
              </p>
              {tiltMonitor.warningSignals.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tiltMonitor.warningSignals.map((sig, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-black/30 border border-current/20 font-medium">
                      ⚠️ {sig}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={() => setIsCheckInModalOpen(true)}
            >
              Take Mental Break & Check-in
            </Button>
          </div>
        </div>
      )}

      {/* Primary Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Discipline Index */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#848B98]">
            <span>Discipline Index</span>
            <Brain className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {radar.overallDisciplineIndex} <span className="text-xs text-[#848B98] font-normal">/ 100</span>
          </div>
          <div className="w-full bg-[#22252A] h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full rounded-full ${radar.overallDisciplineIndex >= 75 ? 'bg-emerald-500' : radar.overallDisciplineIndex >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(100, Math.max(0, radar.overallDisciplineIndex))}%` }}
            />
          </div>
          <p className="text-[11px] text-[#848B98] mt-2">
            Weighted adherence across 6 mental pillars
          </p>
        </Card>

        {/* Tilt Probability */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#848B98]">
            <span>Tilt Probability</span>
            <Flame className="h-4 w-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-bold font-mono mt-2 ${tiltMonitor.tiltProbabilityPercent > 50 ? 'text-rose-400' : tiltMonitor.tiltProbabilityPercent > 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {tiltMonitor.tiltProbabilityPercent}%
          </div>
          <p className="text-xs font-medium text-[#D1D5DB] mt-1 flex items-center gap-1.5">
            <Badge variant={getTiltBadgeVariant(tiltMonitor.status)}>
              {tiltMonitor.status.replace(/_/g, ' ')}
            </Badge>
          </p>
          <p className="text-[11px] text-[#848B98] mt-2">
            {tiltMonitor.recentConsecutiveLosses} consecutive recent losses
          </p>
        </Card>

        {/* Cost of Mistakes Drag */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#848B98]">
            <span>Cost of Mistakes Drag</span>
            <DollarSign className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-2">
            {formatCurrency(costAnalysis.totalCostOfMistakesDrag)}
          </div>
          <p className="text-xs text-[#D1D5DB] mt-1">
            {costAnalysis.mistakeTradesCount} mistake-contaminated trades
          </p>
          <p className="text-[11px] text-[#848B98] mt-2">
            Avoidable dollar drawdown
          </p>
        </Card>

        {/* Rule Adherence Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-[#848B98]">
            <span>Plan Follow Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {ruleAdherence.compliantTradesCount + ruleAdherence.nonCompliantTradesCount > 0
              ? `${Math.round((ruleAdherence.compliantTradesCount / (ruleAdherence.compliantTradesCount + ruleAdherence.nonCompliantTradesCount)) * 100)}%`
              : '100%'}
          </div>
          <p className="text-xs text-[#D1D5DB] mt-1">
            {ruleAdherence.compliantTradesCount} compliant vs {ruleAdherence.nonCompliantTradesCount} off-plan
          </p>
          <p className="text-[11px] text-[#848B98] mt-2">
            {ruleAdherence.compliantWinRate}% WR on compliant trades
          </p>
        </Card>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-[#22252A] pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveSubTab('OVERVIEW')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'OVERVIEW'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#13151A]'
          }`}
        >
          <Brain className="h-3.5 w-3.5" />
          Overview & 6-Pillar Radar
        </button>

        <button
          onClick={() => setActiveSubTab('CHECKINS')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'CHECKINS'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#13151A]'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          Mindset Check-in Logs ({sessionCheckIns.length})
        </button>

        <button
          onClick={() => setActiveSubTab('EMOTIONS')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'EMOTIONS'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#13151A]'
          }`}
        >
          <Smile className="h-3.5 w-3.5" />
          Emotional Performance Matrix
        </button>

        <button
          onClick={() => setActiveSubTab('MISTAKES')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'MISTAKES'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#13151A]'
          }`}
        >
          <AlertOctagon className="h-3.5 w-3.5" />
          Mistake Drag & Taxonomy ({mistakeTaxonomy.length})
        </button>

        <button
          onClick={() => setActiveSubTab('HABITS')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
            activeSubTab === 'HABITS'
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold'
              : 'text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#13151A]'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Habit Adherence & Discipline
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeSubTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* 6-Pillar Radar Scores + Quick Checkin Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 6-Pillar Behavioral Radar */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-emerald-400" />
                    <span>6-Pillar Behavioral & Psychology Radar</span>
                  </div>
                  <Badge variant="zinc">Score: {radar.overallDisciplineIndex} / 100</Badge>
                </CardTitle>
                <CardDescription>
                  Multi-dimensional quantification of mental and operational edge.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Discipline */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">1. Plan Discipline:</span>
                      <span className="font-mono font-bold text-emerald-400">{radar.discipline}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${radar.discipline}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Executing precisely according to written playbook rules</p>
                  </div>

                  {/* Patience */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">2. Setup Patience:</span>
                      <span className="font-mono font-bold text-cyan-400">{radar.patience}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${radar.patience}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Waiting for valid session timing and structural confirmation</p>
                  </div>

                  {/* Confidence */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">3. Execution Confidence:</span>
                      <span className="font-mono font-bold text-blue-400">{radar.confidence}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${radar.confidence}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Pulling trigger without hesitation when criteria are met</p>
                  </div>

                  {/* Stress Control */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">4. Stress Control:</span>
                      <span className="font-mono font-bold text-indigo-400">{radar.stressControl}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${radar.stressControl}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Maintaining composure under drawdown and volatility</p>
                  </div>

                  {/* Impulsivity Control */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">5. Impulsivity Defense:</span>
                      <span className="font-mono font-bold text-amber-400">{radar.impulsivityControl}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${radar.impulsivityControl}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Resisting FOMO, random market orders, and revenge trades</p>
                  </div>

                  {/* Rule Adherence */}
                  <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#848B98] font-medium">6. Rule Adherence:</span>
                      <span className="font-mono font-bold text-emerald-400">{radar.ruleAdherence}%</span>
                    </div>
                    <div className="w-full bg-[#1A1D24] h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${radar.ruleAdherence}%` }} />
                    </div>
                    <p className="text-[10px] text-[#636A78]">Checklist compliance and hard stop loss maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Check-ins Quick Card */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Recent Check-ins</span>
                  </CardTitle>
                  <CardDescription>Latest session readiness logs</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setIsCheckInModalOpen(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Log
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {sessionCheckIns.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#848B98]">
                    No check-in entries logged yet.
                  </div>
                ) : (
                  sessionCheckIns.slice(0, 3).map((chk) => (
                    <div key={chk.id} className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#F3F4F6] flex items-center gap-1.5">
                          <span>{getMoodEmoji(chk.primaryMood)}</span>
                          <span>{chk.primaryMood}</span>
                        </span>
                        <span className="text-[11px] text-[#848B98] font-mono">{chk.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[11px] text-[#848B98]">
                        <span>⚡ Energy: <strong className="text-emerald-400">{chk.energyLevel}/10</strong></span>
                        <span>🎯 Focus: <strong className="text-cyan-400">{chk.focusScore}/10</strong></span>
                        <span>🧘 Stress: <strong className={chk.stressLevel > 6 ? 'text-rose-400' : 'text-emerald-400'}>{chk.stressLevel}/10</strong></span>
                      </div>

                      {chk.notes && (
                        <p className="text-[11px] text-[#848B98] bg-[#13151A] p-2 rounded border border-[#1F232B] line-clamp-2">
                          "{chk.notes}"
                        </p>
                      )}
                    </div>
                  ))
                )}

                {sessionCheckIns.length > 3 && (
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => setActiveSubTab('CHECKINS')}
                  >
                    View All {sessionCheckIns.length} Check-ins
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Consecutive Losses Behavioral Impact */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>Loss Streak Behavioral Drift & Revenge Tendencies</span>
              </CardTitle>
              <CardDescription>
                How trade execution, win rate, and interval pacing degrade as consecutive losses accumulate.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {consecutiveLossImpact.map((tier) => (
                  <div key={tier.consecutiveLossTier} className="p-4 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#F3F4F6]">{tier.consecutiveLossTier}</span>
                      <Badge variant={tier.winRate < 40 ? 'rose' : tier.winRate < 55 ? 'amber' : 'emerald'}>
                        {tier.sampleTradesCount} Trades Sample
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-[#848B98]">
                        <span>Win Rate:</span>
                        <span className={`font-mono font-bold ${tier.winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {tier.winRate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-[#848B98]">
                        <span>Avg Net PnL:</span>
                        <span className={`font-mono font-bold ${tier.avgNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(tier.avgNetPnL)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#848B98]">
                        <span>Avg Re-entry Speed:</span>
                        <span className="font-mono text-white">
                          {tier.avgIntervalMinutes > 0 ? `${tier.avgIntervalMinutes} mins` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: CHECKINS */}
      {activeSubTab === 'CHECKINS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F3F4F6] flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" />
              <span>Pre-Session Mindset Journal & Check-in History</span>
            </h2>
            <Button 
              variant="primary" 
              size="sm"
              onClick={() => setIsCheckInModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Log Emotional Check-in
            </Button>
          </div>

          {sessionCheckIns.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[#848B98] space-y-3">
              <Brain className="h-8 w-8 mx-auto text-[#636A78]" />
              <p>No mindset check-ins recorded yet.</p>
              <Button size="sm" variant="primary" onClick={() => setIsCheckInModalOpen(true)}>
                Record Your First Check-in
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessionCheckIns.map((chk) => {
                const readiness = Math.round(
                  (chk.energyLevel * 3.5 + chk.focusScore * 4.0 + (11 - chk.stressLevel) * 2.5)
                );

                return (
                  <Card key={chk.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{getMoodEmoji(chk.primaryMood)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#F3F4F6]">{chk.primaryMood}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                              {readiness}/100 Readiness
                            </span>
                          </div>
                          <span className="text-[11px] text-[#848B98]">{chk.date} • {new Date(chk.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCheckIn(chk.id)}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-[#636A78] hover:text-rose-400 transition-colors"
                        title="Delete Check-in"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Vitals Grid */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#848B98] block">Energy</span>
                        <strong className="text-emerald-400 font-mono">{chk.energyLevel}/10</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#848B98] block">Focus</span>
                        <strong className="text-cyan-400 font-mono">{chk.focusScore}/10</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#848B98] block">Stress</span>
                        <strong className={`font-mono ${chk.stressLevel > 6 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {chk.stressLevel}/10
                        </strong>
                      </div>
                    </div>

                    {/* Goals & Rules */}
                    {chk.sessionGoals && chk.sessionGoals.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-[#848B98] uppercase tracking-wider block">Goals</span>
                        <div className="flex flex-wrap gap-1">
                          {chk.sessionGoals.map((g, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              🎯 {g}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {chk.rulesCommittedTo && chk.rulesCommittedTo.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-[#848B98] uppercase tracking-wider block">Rule Commitments</span>
                        <div className="flex flex-wrap gap-1">
                          {chk.rulesCommittedTo.map((r, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {chk.notes && (
                      <div className="text-xs text-[#D1D5DB] bg-[#0C0D0F] p-2.5 rounded-lg border border-[#22252A]">
                        "{chk.notes}"
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: EMOTIONS */}
      {activeSubTab === 'EMOTIONS' && (
        <div className="space-y-6">
          {/* Pre-Trade Emotion Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="h-4 w-4 text-emerald-400" />
                  <span>Pre-Trade Emotional State Attribution</span>
                </div>
                <Badge variant="emerald">ENTRY MINDSET</Badge>
              </CardTitle>
              <CardDescription>
                Statistical performance correlation categorized by emotion felt prior to entry.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22252A] text-[#848B98]">
                      <th className="py-2.5 px-3">Emotion State</th>
                      <th className="py-2.5 px-3">Trades</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Total Net PnL</th>
                      <th className="py-2.5 px-3">Avg PnL</th>
                      <th className="py-2.5 px-3">Avg R-Multiple</th>
                      <th className="py-2.5 px-3">Profit Factor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22252A]">
                    {emotionsPre.map((e) => (
                      <tr key={e.emotion} className="hover:bg-[#13151A]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#F3F4F6] flex items-center gap-2">
                          <span>{getMoodEmoji(e.emotion)}</span>
                          <span>{e.label}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[#D1D5DB]">{e.tradesCount}</td>
                        <td className="py-3 px-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            e.winRate >= 60 ? 'bg-emerald-500/10 text-emerald-400' : e.winRate >= 45 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {e.winRate}%
                          </span>
                        </td>
                        <td className={`py-3 px-3 font-mono font-bold ${e.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(e.totalNetPnL)}
                        </td>
                        <td className={`py-3 px-3 font-mono ${e.avgPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(e.avgPnL)}
                        </td>
                        <td className="py-3 px-3 font-mono text-white">
                          {e.avgRMultiple > 0 ? `+${e.avgRMultiple}R` : `${e.avgRMultiple}R`}
                        </td>
                        <td className="py-3 px-3 font-mono text-white">
                          {e.profitFactor === Infinity ? '∞' : e.profitFactor.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Post-Trade Emotion Breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HeartPulse className="h-4 w-4 text-purple-400" />
                  <span>Post-Trade Psychological Reaction Matrix</span>
                </div>
                <Badge variant="purple">EXIT REACTION</Badge>
              </CardTitle>
              <CardDescription>
                Emotions recorded after closing the trade (satisfaction, regret, frustration, tilt).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#22252A] text-[#848B98]">
                      <th className="py-2.5 px-3">Post Emotion</th>
                      <th className="py-2.5 px-3">Trades</th>
                      <th className="py-2.5 px-3">Win Rate</th>
                      <th className="py-2.5 px-3">Total Net PnL</th>
                      <th className="py-2.5 px-3">Avg PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#22252A]">
                    {emotionsPost.map((e) => (
                      <tr key={e.emotion} className="hover:bg-[#13151A]/50 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#F3F4F6]">
                          {e.label}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#D1D5DB]">{e.tradesCount}</td>
                        <td className="py-3 px-3 font-mono text-white">{e.winRate}%</td>
                        <td className={`py-3 px-3 font-mono font-bold ${e.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(e.totalNetPnL)}
                        </td>
                        <td className={`py-3 px-3 font-mono ${e.avgPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(e.avgPnL)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: MISTAKES & TAXONOMY */}
      {activeSubTab === 'MISTAKES' && (
        <div className="space-y-6">
          {/* Clean vs Mistake Comparison Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Clean Trades (No Mistakes)</span>
                <Badge variant="emerald">{costAnalysis.cleanTradesCount} Trades</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">{costAnalysis.cleanWinRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#848B98] block">Profit Factor</span>
                  <span className="font-mono font-bold text-white text-base">{costAnalysis.cleanProfitFactor.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#848B98] block">Total Net PnL</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">{formatCurrency(costAnalysis.cleanNetPnL)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-rose-500/5 border-rose-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Mistake-Contaminated Trades</span>
                <Badge variant="rose">{costAnalysis.mistakeTradesCount} Trades</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                  <span className="font-mono font-bold text-rose-400 text-base">{costAnalysis.mistakeWinRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#848B98] block">Profit Factor</span>
                  <span className="font-mono font-bold text-white text-base">{costAnalysis.mistakeProfitFactor.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#848B98] block">Total Net PnL</span>
                  <span className="font-mono font-bold text-rose-400 text-base">{formatCurrency(costAnalysis.mistakeNetPnL)}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Top Mistakes by Cost Breakdown */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-rose-400" />
                  <span>Cost of Mistakes Frequency & Dollar Drag Breakdown</span>
                </CardTitle>
                <CardDescription>
                  Exact dollar losses resulting from specific execution flaws and emotional biases.
                </CardDescription>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setIsMistakeModalOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Mistake
              </Button>
            </CardHeader>
            <CardContent>
              {topMistakesByCost.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#848B98]">
                  No mistakes logged in current trade sample.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#22252A] text-[#848B98]">
                        <th className="py-2.5 px-3">Mistake Description</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Severity</th>
                        <th className="py-2.5 px-3">Occurrences</th>
                        <th className="py-2.5 px-3">Total Loss PnL</th>
                        <th className="py-2.5 px-3">Avg Loss</th>
                        <th className="py-2.5 px-3">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#22252A]">
                      {topMistakesByCost.map((m) => (
                        <tr key={m.mistakeId} className="hover:bg-[#13151A]/50 transition-colors">
                          <td className="py-3 px-3 font-semibold text-[#F3F4F6]">
                            {m.mistakeName}
                          </td>
                          <td className="py-3 px-3 text-[#848B98]">{m.categoryName}</td>
                          <td className="py-3 px-3">
                            <Badge variant={m.severity === 'SEVERE' ? 'rose' : m.severity === 'MODERATE' ? 'amber' : 'zinc'}>
                              {m.severity}
                            </Badge>
                          </td>
                          <td className="py-3 px-3 font-mono text-white font-bold">{m.occurrencesCount}x</td>
                          <td className="py-3 px-3 font-mono font-bold text-rose-400">
                            -${Math.abs(m.totalLossPnL).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 font-mono text-rose-400">
                            -${Math.abs(m.avgLossPnL).toFixed(2)}
                          </td>
                          <td className="py-3 px-3 font-mono text-white">{m.winRateWhenCommitted}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configurable Taxonomy Manager */}
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  <span>Active Mistake Taxonomy & Categories</span>
                </CardTitle>
                <CardDescription>
                  Pre-configured and custom mistake definitions available when logging trades.
                </CardDescription>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategoryFilter('ALL')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    selectedCategoryFilter === 'ALL'
                      ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                      : 'text-[#848B98] bg-[#13151A] hover:bg-[#1A1D24]'
                  }`}
                >
                  All ({mistakeTaxonomy.length})
                </button>
                {mistakeCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryFilter(c.id)}
                    className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap ${
                      selectedCategoryFilter === c.id
                        ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40'
                        : 'text-[#848B98] bg-[#13151A] hover:bg-[#1A1D24]'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredTaxonomy.map((item) => (
                  <div key={item.id} className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-2 text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-[#F3F4F6]">{item.name}</span>
                        <div className="flex items-center gap-1">
                          <Badge variant={item.severity === 'SEVERE' ? 'rose' : item.severity === 'MODERATE' ? 'amber' : 'zinc'}>
                            {item.severity}
                          </Badge>
                          {item.isCustom && (
                            <button
                              onClick={() => handleDeleteMistake(item.id)}
                              className="p-1 text-[#636A78] hover:text-rose-400 transition-colors"
                              title="Delete custom mistake"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#848B98] line-clamp-2">{item.description}</p>
                    </div>

                    <div className="text-[10px] text-[#636A78] pt-2 border-t border-[#1A1D24] flex items-center justify-between">
                      <span>{item.categoryName}</span>
                      {item.isCustom && <span className="text-purple-400 font-semibold">CUSTOM</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB CONTENT: HABITS */}
      {activeSubTab === 'HABITS' && (
        <div className="space-y-6">
          {/* Rule Adherence Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Plan-Compliant Trades Performance
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                  <span className="font-mono font-bold text-emerald-400 text-lg">{ruleAdherence.compliantWinRate}%</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] block">Profit Factor</span>
                  <span className="font-mono font-bold text-white text-lg">{ruleAdherence.compliantProfitFactor.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#848B98]">
                Total Net PnL: <strong className="text-emerald-400 font-mono">{formatCurrency(ruleAdherence.compliantNetPnL)}</strong> across {ruleAdherence.compliantTradesCount} trades.
              </p>
            </Card>

            <Card className="p-4 space-y-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                Non-Compliant (Off-Plan) Performance
              </span>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] block">Win Rate</span>
                  <span className="font-mono font-bold text-rose-400 text-lg">{ruleAdherence.nonCompliantWinRate}%</span>
                </div>
                <div className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A]">
                  <span className="text-[10px] text-[#848B98] block">Profit Factor</span>
                  <span className="font-mono font-bold text-white text-lg">{ruleAdherence.nonCompliantProfitFactor.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#848B98]">
                Total Net PnL: <strong className="text-rose-400 font-mono">{formatCurrency(ruleAdherence.nonCompliantNetPnL)}</strong> across {ruleAdherence.nonCompliantTradesCount} trades.
              </p>
            </Card>
          </div>

          {/* Adherence Checklist Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Execution Habits & Rule Compliance Tracking</span>
              </CardTitle>
              <CardDescription>
                Frequency of positive trading habits checked off during trade logging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tradingHabitsSummary.map((h, i) => (
                  <div key={i} className="p-3 rounded-lg bg-[#0C0D0F] border border-[#22252A] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="font-medium text-[#F3F4F6]">{h.habit}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-[#848B98] font-mono">{h.count} trades checked</span>
                      <span className="font-mono font-bold text-emerald-400">{h.adherenceRate}% Adherence</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInModalOpen}
        onClose={() => setIsCheckInModalOpen(false)}
        onSubmit={handleSaveCheckIn}
      />

      <MistakeModal
        isOpen={isMistakeModalOpen}
        onClose={() => setIsMistakeModalOpen(false)}
        categories={mistakeCategories}
        onSubmit={handleSaveMistake}
      />
    </div>
  );
};
