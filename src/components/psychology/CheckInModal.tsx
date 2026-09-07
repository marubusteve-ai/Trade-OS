import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { PreTradeEmotion, SessionCheckIn } from '../../types/psychology';
import { DEFAULT_TRADING_HABITS } from '../../repositories/psychologyRepository';
import { 
  HeartPulse, 
  Brain, 
  Smile, 
  Frown, 
  Meh, 
  Sparkles, 
  Moon, 
  Activity, 
  Target, 
  ShieldCheck, 
  Check, 
  Plus, 
  X,
  Flame,
  AlertTriangle
} from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (checkIn: Omit<SessionCheckIn, 'id' | 'userId' | 'timestamp'>) => Promise<void>;
}

const PRESET_GOALS = [
  'Stick strictly to 1% risk per trade',
  'Wait for 15m Fair Value Gap confirmation',
  'Max 3 trades for today session',
  'Stop trading immediately if down 2R',
  'No phone or social media during active window',
  'Wait for 1m candle close before entry trigger',
];

const EMOTIONS_LIST: { id: PreTradeEmotion; label: string; icon: string; color: string; desc: string }[] = [
  { id: 'CALM', label: 'Calm', icon: '😌', color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10', desc: 'Relaxed, objective, neutral' },
  { id: 'FOCUSED', label: 'Focused', icon: '🎯', color: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10', desc: 'Laser attentive, clear plan' },
  { id: 'CONFIDENT', label: 'Confident', icon: '💪', color: 'border-blue-500/50 text-blue-400 bg-blue-500/10', desc: 'Trusting edge and strategy' },
  { id: 'OPTIMISTIC', label: 'Optimistic', icon: '✨', color: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10', desc: 'Positive market outlook' },
  { id: 'EAGER', label: 'Eager / Excited', icon: '⚡', color: 'border-amber-500/50 text-amber-400 bg-amber-500/10', desc: 'Anticipating fast action' },
  { id: 'ANXIOUS', label: 'Anxious / Hesitant', icon: '😰', color: 'border-orange-500/50 text-orange-400 bg-orange-500/10', desc: 'Fear of losing capital' },
  { id: 'FOMO', label: 'FOMO', icon: '🏃', color: 'border-rose-500/50 text-rose-400 bg-rose-500/10', desc: 'Fear of missing out on rally' },
  { id: 'REVENGE', label: 'Revenge Seeking', icon: '🔥', color: 'border-red-600/60 text-red-400 bg-red-600/10', desc: 'Urge to claw back prior losses' },
  { id: 'FATIGUED', label: 'Fatigued / Tired', icon: '🥱', color: 'border-zinc-500/50 text-zinc-400 bg-zinc-500/10', desc: 'Low energy, reduced focus' },
  { id: 'IMPATIENT', label: 'Impatient', icon: '⏳', color: 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10', desc: 'Wanting setup right now' },
  { id: 'BORED', label: 'Bored', icon: '😑', color: 'border-zinc-600/50 text-zinc-400 bg-zinc-600/10', desc: 'Low stimulation, seeking action' },
];

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(todayStr);
  const [primaryMood, setPrimaryMood] = useState<PreTradeEmotion>('CALM');
  const [energyLevel, setEnergyLevel] = useState<number>(8);
  const [focusScore, setFocusScore] = useState<number>(8);
  const [stressLevel, setStressLevel] = useState<number>(2);
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [marketPreparedness, setMarketPreparedness] = useState<'UNPREPARED' | 'BASIC' | 'THOROUGH' | 'OPTIMAL'>('THOROUGH');
  const [sessionGoals, setSessionGoals] = useState<string[]>([
    'Stick strictly to 1% risk per trade',
    'Wait for 15m Fair Value Gap confirmation',
  ]);
  const [customGoalInput, setCustomGoalInput] = useState<string>('');
  const [rulesCommittedTo, setRulesCommittedTo] = useState<string[]>([
    'Hard Stop Loss placed immediately at entry',
    'Waited for candle close before entering',
  ]);
  const [customRuleInput, setCustomRuleInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleGoal = (goal: string) => {
    if (sessionGoals.includes(goal)) {
      setSessionGoals(sessionGoals.filter(g => g !== goal));
    } else {
      setSessionGoals([...sessionGoals, goal]);
    }
  };

  const handleAddCustomGoal = () => {
    if (!customGoalInput.trim()) return;
    if (!sessionGoals.includes(customGoalInput.trim())) {
      setSessionGoals([...sessionGoals, customGoalInput.trim()]);
    }
    setCustomGoalInput('');
  };

  const handleToggleRule = (rule: string) => {
    if (rulesCommittedTo.includes(rule)) {
      setRulesCommittedTo(rulesCommittedTo.filter(r => r !== rule));
    } else {
      setRulesCommittedTo([...rulesCommittedTo, rule]);
    }
  };

  const handleAddCustomRule = () => {
    if (!customRuleInput.trim()) return;
    if (!rulesCommittedTo.includes(customRuleInput.trim())) {
      setRulesCommittedTo([...rulesCommittedTo, customRuleInput.trim()]);
    }
    setCustomRuleInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        date,
        energyLevel: Number(energyLevel),
        focusScore: Number(focusScore),
        stressLevel: Number(stressLevel),
        primaryMood,
        sleepHours: Number(sleepHours),
        marketPreparedness,
        sessionGoals,
        rulesCommittedTo,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save emotional check-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Readiness Score Calculation (0 - 100)
  const readinessScore = Math.round(
    (energyLevel * 3.5 + focusScore * 4.0 + (11 - stressLevel) * 2.5)
  );

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pre-Session Mindset & Emotional Check-in"
      description="Record your physiological preparedness, mood, and rule commitments before trading."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#848B98]">Estimated Readiness:</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getReadinessColor(readinessScore)}`}>
              {readinessScore} / 100
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
            >
              <Check className="h-4 w-4 mr-1.5" />
              Save Check-in
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-[#F3F4F6]">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Top Meta: Date, Sleep, Preparedness */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#848B98] mb-1">
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#848B98] mb-1 flex items-center gap-1">
              <Moon className="h-3.5 w-3.5 text-indigo-400" />
              <span>Sleep Hours</span>
            </label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="16"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#848B98] mb-1">
              Market Prep Level
            </label>
            <select
              value={marketPreparedness}
              onChange={(e) => setMarketPreparedness(e.target.value as any)}
              className="w-full h-9 rounded-md bg-[#13151A] border border-[#2B2E36] px-3 text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500"
            >
              <option value="OPTIMAL">Optimal (Levels & News mapped)</option>
              <option value="THOROUGH">Thorough (Key HTF levels ready)</option>
              <option value="BASIC">Basic (Brief chart review)</option>
              <option value="UNPREPARED">Unprepared (Opened chart directly)</option>
            </select>
          </div>
        </div>

        {/* Physiological & Cognitive Sliders */}
        <div className="p-3.5 rounded-lg bg-[#0C0D0F] border border-[#22252A] space-y-4">
          <div className="text-xs font-semibold text-[#D1D5DB] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              Bio-Mental Metrics & Energy Scales
            </span>
            <span className="text-[11px] text-[#848B98]">1 = Depleted/None, 10 = Maximum</span>
          </div>

          {/* Energy Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#848B98]">Physical Energy:</span>
              <span className="font-mono font-bold text-emerald-400">{energyLevel} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-[#22252A] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#636A78]">
              <span>Exhausted (1)</span>
              <span>Moderate (5)</span>
              <span>Fully Energized (10)</span>
            </div>
          </div>

          {/* Focus Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#848B98]">Mental Focus & Clarity:</span>
              <span className="font-mono font-bold text-cyan-400">{focusScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={focusScore}
              onChange={(e) => setFocusScore(parseInt(e.target.value))}
              className="w-full accent-cyan-500 h-1.5 bg-[#22252A] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#636A78]">
              <span>Distracted / Foggy (1)</span>
              <span>Normal (5)</span>
              <span>Laser Sharp (10)</span>
            </div>
          </div>

          {/* Stress Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#848B98]">Stress & Emotional Pressure:</span>
              <span className={`font-mono font-bold ${stressLevel > 6 ? 'text-rose-400' : stressLevel > 3 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {stressLevel} / 10 {stressLevel > 6 && '(High Tension)'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value))}
              className="w-full accent-rose-500 h-1.5 bg-[#22252A] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#636A78]">
              <span>Completely Zen (1)</span>
              <span>Manageable (5)</span>
              <span>Extreme Stress / Tilt Risk (10)</span>
            </div>
          </div>
        </div>

        {/* Primary Mood Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#848B98]">
            Primary Emotional State Before Session
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {EMOTIONS_LIST.map((item) => {
              const isSelected = primaryMood === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPrimaryMood(item.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? `${item.color} shadow-sm ring-1 ring-emerald-500/50`
                      : 'bg-[#13151A] border-[#22252A] text-[#848B98] hover:border-[#333842] hover:text-[#D1D5DB]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base">{item.icon}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                  </div>
                  <span className="font-semibold text-[11px] block">{item.label}</span>
                  <span className="text-[10px] opacity-70 line-clamp-1">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Session Goals */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#848B98] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-amber-400" />
              Session Goals & Guardrails
            </span>
            <span className="text-[10px] text-[#636A78]">Click to toggle / add custom</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_GOALS.map((goal) => {
              const active = sessionGoals.includes(goal);
              return (
                <button
                  type="button"
                  key={goal}
                  onClick={() => handleToggleGoal(goal)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-colors flex items-center gap-1.5 ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-medium'
                      : 'bg-[#13151A] border-[#22252A] text-[#848B98] hover:border-[#333842]'
                  }`}
                >
                  {active && <Check className="h-3 w-3 text-amber-400" />}
                  <span>{goal}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Input
              type="text"
              placeholder="Add custom session goal..."
              value={customGoalInput}
              onChange={(e) => setCustomGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomGoal();
                }
              }}
              className="h-8 text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCustomGoal}
              disabled={!customGoalInput.trim()}
              className="h-8 shrink-0"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Rule Commitments */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[#848B98] flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Rules Committed To Honor
            </span>
            <span className="text-[10px] text-[#636A78]">Selected habits</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {DEFAULT_TRADING_HABITS.slice(0, 6).map((habit) => {
              const active = rulesCommittedTo.includes(habit);
              return (
                <button
                  type="button"
                  key={habit}
                  onClick={() => handleToggleRule(habit)}
                  className={`text-xs px-2.5 py-1.5 rounded-md border text-left transition-colors flex items-center justify-between ${
                    active
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-medium'
                      : 'bg-[#13151A] border-[#22252A] text-[#848B98] hover:border-[#333842]'
                  }`}
                >
                  <span className="line-clamp-1">{habit}</span>
                  {active ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0 ml-1" />
                  ) : (
                    <Plus className="h-3 w-3 text-[#636A78] shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reflection Notes */}
        <div>
          <label className="block text-xs font-medium text-[#848B98] mb-1">
            Pre-Market Mental Notes & Context
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Slept 8 hours, calm mindset. CPI release at 8:30 AM, waiting for post-news volatility to settle."
            className="w-full rounded-md bg-[#13151A] border border-[#2B2E36] p-2.5 text-xs text-[#F3F4F6] placeholder-[#636A78] focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};
