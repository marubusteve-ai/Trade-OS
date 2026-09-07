/**
 * Custom Prop Firm & Challenge Configurator Modal
 * 
 * Allows traders to define custom prop firms, challenge structures, multi-step phases,
 * payout parameters, and link them to versioned rule sets.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { PropFirm, Challenge, ChallengePhase, RuleSet } from '../../types/propFirm';
import { Building2, Plus, Trash2, Shield, Award, Check } from 'lucide-react';

interface PropFirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  firm: PropFirm | null;
  ruleSets: RuleSet[];
  onSave: (data: Omit<PropFirm, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
}

const AVAILABLE_PLATFORMS = [
  'NinjaTrader',
  'Rithmic',
  'Tradovate',
  'MetaTrader 4',
  'MetaTrader 5',
  'cTrader',
  'TopstepX',
  'TradingView',
  'DXtrade',
  'Quantower',
];

const AVAILABLE_ASSETS = ['FUTURES', 'FOREX', 'CRYPTO', 'INDICES', 'COMMODITIES', 'EQUITIES'];

export const PropFirmModal: React.FC<PropFirmModalProps> = ({
  isOpen,
  onClose,
  firm,
  ruleSets,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [payoutSpeedDays, setPayoutSpeedDays] = useState(14);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['NinjaTrader']);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(['FUTURES']);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (firm) {
      setName(firm.name);
      setWebsite(firm.website || '');
      setDescription(firm.description || '');
      setPayoutSpeedDays(firm.payoutSpeedDays || 14);
      setSelectedPlatforms(firm.supportedPlatforms || ['NinjaTrader']);
      setSelectedAssets(firm.assetClasses || ['FUTURES']);
      setChallenges(firm.challenges || []);
    } else {
      setName('');
      setWebsite('');
      setDescription('');
      setPayoutSpeedDays(14);
      setSelectedPlatforms(['NinjaTrader', 'Tradovate']);
      setSelectedAssets(['FUTURES']);
      
      const defaultRuleSetId = ruleSets[0]?.id || 'ruleset_default';
      setChallenges([
        {
          id: `chal_${Date.now()}`,
          firmId: '',
          name: '50k Standard Evaluation',
          initialBalance: 50000,
          currency: 'USD',
          challengeType: 'ONE_STEP',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          phases: [
            {
              phaseNumber: 1,
              name: 'Phase 1 - Evaluation',
              ruleSetId: defaultRuleSetId,
              targetProfitPercent: 6,
              maxDailyLossPercent: 4,
              maxTotalLossPercent: 6,
              minTradingDays: 5,
              isFundedStage: false,
            },
            {
              phaseNumber: 2,
              name: 'Phase 2 - Funded Account',
              ruleSetId: defaultRuleSetId,
              profitSplitPercent: 90,
              isFundedStage: true,
              payoutTerms: {
                minProfitBufferAmount: 2000,
                minTradingDaysBeforeFirstPayout: 10,
                minDaysBetweenPayouts: 14,
                defaultProfitSplitPercent: 90,
                consistencyCheckRequired: true,
              },
            },
          ],
        },
      ]);
    }
  }, [firm, isOpen, ruleSets]);

  const togglePlatform = (p: string) => {
    if (selectedPlatforms.includes(p)) {
      setSelectedPlatforms(selectedPlatforms.filter(item => item !== p));
    } else {
      setSelectedPlatforms([...selectedPlatforms, p]);
    }
  };

  const toggleAsset = (a: string) => {
    if (selectedAssets.includes(a)) {
      setSelectedAssets(selectedAssets.filter(item => item !== a));
    } else {
      setSelectedAssets([...selectedAssets, a]);
    }
  };

  const handleAddChallenge = () => {
    const defaultRuleSetId = ruleSets[0]?.id || 'ruleset_default';
    const newChal: Challenge = {
      id: `chal_${Date.now()}`,
      firmId: firm?.id || '',
      name: '100k Evaluation',
      initialBalance: 100000,
      currency: 'USD',
      challengeType: 'TWO_STEP',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases: [
        {
          phaseNumber: 1,
          name: 'Step 1 - Evaluation',
          ruleSetId: defaultRuleSetId,
          targetProfitPercent: 10,
          maxDailyLossPercent: 5,
          maxTotalLossPercent: 10,
          minTradingDays: 4,
          isFundedStage: false,
        },
        {
          phaseNumber: 2,
          name: 'Step 2 - Verification',
          ruleSetId: defaultRuleSetId,
          targetProfitPercent: 5,
          maxDailyLossPercent: 5,
          maxTotalLossPercent: 10,
          minTradingDays: 4,
          isFundedStage: false,
        },
        {
          phaseNumber: 3,
          name: 'Funded Trader',
          ruleSetId: defaultRuleSetId,
          profitSplitPercent: 80,
          isFundedStage: true,
        },
      ],
    };
    setChallenges([...challenges, newChal]);
  };

  const handleDeleteChallenge = (index: number) => {
    setChallenges(challenges.filter((_, i) => i !== index));
  };

  const handleChallengeChange = (index: number, field: keyof Challenge, value: any) => {
    const updated = [...challenges];
    updated[index] = { ...updated[index], [field]: value };
    setChallenges(updated);
  };

  const handlePhaseRuleSetChange = (chalIndex: number, phaseIndex: number, ruleSetId: string) => {
    const updated = [...challenges];
    const phases = [...updated[chalIndex].phases];
    phases[phaseIndex] = { ...phases[phaseIndex], ruleSetId };
    updated[chalIndex].phases = phases;
    setChallenges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        website: website.trim() || undefined,
        description: description.trim() || undefined,
        payoutSpeedDays: Number(payoutSpeedDays) || 14,
        supportedPlatforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['NinjaTrader'],
        assetClasses: selectedAssets.length > 0 ? selectedAssets : ['FUTURES'],
        isCustom: true,
        challenges,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save prop firm:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={firm ? `Edit Prop Firm: ${firm.name}` : 'Create Custom Prop Firm Profile'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Firm Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. MyFundedFutures, Alpha Capital, Custom Desk"
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-sm text-[#F3F4F6] focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Payout Speed (Days)
            </label>
            <input
              type="number"
              value={payoutSpeedDays}
              onChange={(e) => setPayoutSpeedDays(Number(e.target.value))}
              placeholder="14"
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-sm text-[#F3F4F6] focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Official Website (Optional)
            </label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://propfirm.com"
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Description & Evaluation Type
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Futures evaluation firm with 90% payout split and 1-step challenge."
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Supported Platforms */}
        <div>
          <label className="block text-xs font-semibold text-[#848B98] mb-1.5">
            Supported Execution Platforms
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_PLATFORMS.map((p) => {
              const active = selectedPlatforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold'
                      : 'bg-[#0C0D0F] border-[#22252A] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        {/* Asset Classes */}
        <div>
          <label className="block text-xs font-semibold text-[#848B98] mb-1.5">
            Traded Asset Classes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_ASSETS.map((a) => {
              const active = selectedAssets.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAsset(a)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    active
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 font-semibold'
                      : 'bg-[#0C0D0F] border-[#22252A] text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {a}
                </button>
              );
            })}
          </div>
        </div>

        {/* Challenges & Evaluation Steps */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" />
                Configured Challenges & Phases ({challenges.length})
              </h3>
              <p className="text-[11px] text-[#848B98]">
                Each challenge can contain multiple phases linked to specific rule sets.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddChallenge}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Challenge
            </Button>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {challenges.map((chal, cIdx) => (
              <div
                key={chal.id || cIdx}
                className="p-3.5 rounded-xl border border-[#22252A] bg-[#0C0D0F] space-y-3"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chal.name}
                      onChange={(e) => handleChallengeChange(cIdx, 'name', e.target.value)}
                      placeholder="Challenge Name"
                      className="px-2 py-1 bg-[#16181D] border border-[#22252A] rounded text-xs text-white font-bold"
                    />
                    <Badge variant="amber">{chal.challengeType}</Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#848B98]">Initial Capital:</span>
                    <input
                      type="number"
                      value={chal.initialBalance}
                      onChange={(e) => handleChallengeChange(cIdx, 'initialBalance', Number(e.target.value))}
                      className="w-24 px-2 py-1 bg-[#16181D] border border-[#22252A] rounded text-xs text-emerald-400 font-mono font-bold"
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteChallenge(cIdx)}
                      className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Phases in this challenge */}
                <div className="space-y-2 pl-2 border-l-2 border-[#22252A]">
                  {chal.phases?.map((ph, pIdx) => (
                    <div
                      key={pIdx}
                      className="p-2.5 rounded-lg bg-[#121417] border border-[#22252A] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{ph.name}</span>
                        <Badge variant={ph.isFundedStage ? 'emerald' : 'blue'}>
                          {ph.isFundedStage ? 'FUNDED STAGE' : `PHASE ${ph.phaseNumber}`}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[#848B98] text-[11px]">Rule Set:</span>
                        <select
                          value={ph.ruleSetId}
                          onChange={(e) => handlePhaseRuleSetChange(cIdx, pIdx, e.target.value)}
                          className="px-2 py-1 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-[11px] focus:outline-none"
                        >
                          {ruleSets.map((rs) => (
                            <option key={rs.id} value={rs.id}>
                              {rs.name} ({rs.version})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#22252A]">
          <span className="text-xs text-[#848B98]">
            Firm will be saved in your workspace registry.
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? 'Saving...' : 'Save Prop Firm'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
