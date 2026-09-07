/**
 * Rule Set & Prop Firm Rule Configurator Modal
 * 
 * Enables granular creation, editing, cloning, and versioning of deterministic prop-firm rule sets.
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { 
  RuleSet, 
  PropFirmRule, 
  PropFirmRuleType, 
  RuleCategory, 
  RuleUnit, 
  RuleCalculationMethod, 
  RuleSeverity 
} from '../../types/propFirm';
import { ShieldCheck, Plus, Trash2, Edit2, Check, AlertTriangle, HelpCircle, Copy } from 'lucide-react';

interface RuleSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleSet: RuleSet | null;
  onSave: (data: Omit<RuleSet, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
}

export const RuleSetModal: React.FC<RuleSetModalProps> = ({
  isOpen,
  onClose,
  ruleSet,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [version, setVersion] = useState('v2026.1');
  const [rules, setRules] = useState<PropFirmRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);

  // Single rule edit form state
  const [ruleType, setRuleType] = useState<PropFirmRuleType>('PROFIT_TARGET');
  const [ruleName, setRuleName] = useState('');
  const [ruleDesc, setRuleDesc] = useState('');
  const [ruleCategory, setRuleCategory] = useState<RuleCategory>('OBJECTIVE');
  const [threshold, setThreshold] = useState<number | string>(10);
  const [unit, setUnit] = useState<RuleUnit>('PERCENT_BALANCE');
  const [calcMethod, setCalcMethod] = useState<RuleCalculationMethod>('STATIC_BALANCE');
  const [warningThreshold, setWarningThreshold] = useState(80);
  const [violationThreshold, setViolationThreshold] = useState(100);
  const [severity, setSeverity] = useState<RuleSeverity>('HARD_BREACH');
  const [isEnabled, setIsEnabled] = useState(true);
  const [docUrl, setDocUrl] = useState('');
  const [clauseNumber, setClauseNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (ruleSet) {
      setName(ruleSet.name);
      setDescription(ruleSet.description || '');
      setVersion(ruleSet.version || 'v2026.1');
      setRules(ruleSet.rules || []);
    } else {
      setName('');
      setDescription('');
      setVersion('v2026.1');
      setRules([
        {
          id: `rule_${Date.now()}_1`,
          type: 'PROFIT_TARGET',
          name: 'Profit Target (8%)',
          description: 'Achieve 8% net profit target.',
          category: 'OBJECTIVE',
          threshold: 8,
          unit: 'PERCENT_BALANCE',
          calculationMethod: 'STATIC_BALANCE',
          warningThreshold: 80,
          violationThreshold: 100,
          severity: 'INFO',
          isEnabled: true,
          version: 'v2026.1',
        },
        {
          id: `rule_${Date.now()}_2`,
          type: 'DAILY_LOSS',
          name: 'Daily Loss Limit (4%)',
          description: 'Maximum daily loss limit.',
          category: 'DRAWDOWN',
          threshold: 4,
          unit: 'PERCENT_BALANCE',
          calculationMethod: 'STATIC_BALANCE',
          warningThreshold: 80,
          violationThreshold: 100,
          severity: 'HARD_BREACH',
          isEnabled: true,
          version: 'v2026.1',
        },
        {
          id: `rule_${Date.now()}_3`,
          type: 'MAX_DRAWDOWN',
          name: 'Maximum Total Loss (8%)',
          description: 'Maximum overall drawdown.',
          category: 'DRAWDOWN',
          threshold: 8,
          unit: 'PERCENT_BALANCE',
          calculationMethod: 'STATIC_BALANCE',
          warningThreshold: 80,
          violationThreshold: 100,
          severity: 'HARD_BREACH',
          isEnabled: true,
          version: 'v2026.1',
        },
      ]);
    }
    setEditingRuleIndex(null);
  }, [ruleSet, isOpen]);

  const handleStartEditRule = (index: number) => {
    const r = rules[index];
    setEditingRuleIndex(index);
    setRuleType(r.type);
    setRuleName(r.name);
    setRuleDesc(r.description);
    setRuleCategory(r.category);
    setThreshold(r.threshold);
    setUnit(r.unit);
    setCalcMethod(r.calculationMethod);
    setWarningThreshold(r.warningThreshold);
    setViolationThreshold(r.violationThreshold);
    setSeverity(r.severity);
    setIsEnabled(r.isEnabled);
    setDocUrl(r.sourceMetadata?.docUrl || '');
    setClauseNumber(r.sourceMetadata?.clauseNumber || '');
    setNotes(r.notes || '');
  };

  const handleAddNewRule = () => {
    setEditingRuleIndex(rules.length);
    setRuleType('PROFIT_TARGET');
    setRuleName('New Evaluation Rule');
    setRuleDesc('Custom rule parameter');
    setRuleCategory('OBJECTIVE');
    setThreshold(10);
    setUnit('PERCENT_BALANCE');
    setCalcMethod('STATIC_BALANCE');
    setWarningThreshold(80);
    setViolationThreshold(100);
    setSeverity('HARD_BREACH');
    setIsEnabled(true);
    setDocUrl('');
    setClauseNumber('');
    setNotes('');
  };

  const handleSaveRuleItem = () => {
    if (editingRuleIndex === null) return;
    const updatedRule: PropFirmRule = {
      id: rules[editingRuleIndex]?.id || `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: ruleType,
      name: ruleName.trim() || 'Custom Rule',
      description: ruleDesc.trim(),
      category: ruleCategory,
      threshold: typeof threshold === 'string' && !isNaN(Number(threshold)) ? Number(threshold) : threshold,
      unit,
      calculationMethod: calcMethod,
      warningThreshold: Number(warningThreshold) || 80,
      violationThreshold: Number(violationThreshold) || 100,
      severity,
      isEnabled,
      version,
      notes: notes.trim() || undefined,
      sourceMetadata: docUrl || clauseNumber ? { docUrl, clauseNumber } : undefined,
    };

    const newRules = [...rules];
    if (editingRuleIndex < rules.length) {
      newRules[editingRuleIndex] = updatedRule;
    } else {
      newRules.push(updatedRule);
    }
    setRules(newRules);
    setEditingRuleIndex(null);
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
    if (editingRuleIndex === index) {
      setEditingRuleIndex(null);
    }
  };

  const handleToggleRule = (index: number) => {
    setRules(rules.map((r, i) => i === index ? { ...r, isEnabled: !r.isEnabled } : r));
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        version: version.trim() || 'v2026.1',
        rules,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save rule set:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ruleSet ? `Edit Rule Set: ${ruleSet.name}` : 'Create Configurable Rule Set'}
      size="xl"
    >
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* Top Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Rule Set Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex 50k Full Evaluation v2026"
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-sm text-[#F3F4F6] focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#848B98] mb-1">
              Version / Edition
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="v2026.1"
              className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-sm text-[#F3F4F6] focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#848B98] mb-1">
            Description & Target Evaluation Phase
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Official ruleset for evaluation phase. 1-step evaluation with trailing drawdown and no daily loss."
            className="w-full px-3 py-2 bg-[#0C0D0F] border border-[#22252A] rounded-lg text-xs text-[#F3F4F6] focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Rules Table & Builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-[#F3F4F6] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Configured Rules Matrix ({rules.length} Rules)
              </h3>
              <p className="text-[11px] text-[#848B98]">
                Every rule is evaluated against real account balances, equity, and trade execution data.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNewRule}
              className="text-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Custom Rule
            </Button>
          </div>

          {/* Rules List */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 border border-[#22252A] rounded-lg p-2 bg-[#0C0D0F]">
            {rules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className={`p-3 rounded-lg border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  editingRuleIndex === idx
                    ? 'border-emerald-500/60 bg-[#16181D]'
                    : rule.isEnabled
                    ? 'border-[#22252A] bg-[#121417]'
                    : 'border-[#22252A]/50 bg-[#121417]/40 opacity-60'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">{rule.name}</span>
                    <Badge variant={rule.severity === 'HARD_BREACH' ? 'rose' : rule.severity === 'SOFT_BREACH' ? 'amber' : 'zinc'}>
                      {rule.severity.replace('_', ' ')}
                    </Badge>
                    <Badge variant="blue">{rule.type.replace('_', ' ')}</Badge>
                    <span className="text-[11px] font-mono text-emerald-400">
                      Limit: {String(rule.threshold)} {rule.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#848B98]">{rule.description}</p>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleRule(idx)}
                    className={`text-[11px] px-2 py-1 rounded font-semibold transition-colors ${
                      rule.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {rule.isEnabled ? 'Active' : 'Disabled'}
                  </button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStartEditRule(idx)}
                    className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(idx)}
                    className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Granular Rule Editor Sub-Form */}
        {editingRuleIndex !== null && (
          <div className="p-4 rounded-xl border border-emerald-500/40 bg-[#16181D] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#22252A]">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {editingRuleIndex < rules.length ? `Editing Rule: ${ruleName}` : 'Add New Custom Rule'}
              </span>
              <Badge variant="emerald">RULE EDITOR</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Rule Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as PropFirmRuleType)}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                >
                  <option value="PROFIT_TARGET">PROFIT_TARGET</option>
                  <option value="DAILY_LOSS">DAILY_LOSS</option>
                  <option value="MAX_DRAWDOWN">MAX_DRAWDOWN</option>
                  <option value="TRAILING_DRAWDOWN">TRAILING_DRAWDOWN</option>
                  <option value="CONSISTENCY_RULE">CONSISTENCY_RULE</option>
                  <option value="MIN_TRADING_DAYS">MIN_TRADING_DAYS</option>
                  <option value="MAX_TRADING_DAYS">MAX_TRADING_DAYS</option>
                  <option value="POSITION_SIZE_RESTRICTION">POSITION_SIZE_RESTRICTION</option>
                  <option value="RISK_RESTRICTION">RISK_RESTRICTION (Stop Loss)</option>
                  <option value="NEWS_RESTRICTION">NEWS_RESTRICTION</option>
                  <option value="OVERNIGHT_RESTRICTION">OVERNIGHT_RESTRICTION</option>
                  <option value="WEEKEND_RESTRICTION">WEEKEND_RESTRICTION</option>
                  <option value="SCALING_RULE">SCALING_RULE</option>
                  <option value="PAYOUT_RULE">PAYOUT_RULE</option>
                  <option value="CUSTOM_RESTRICTION">CUSTOM_RESTRICTION</option>
                </select>
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Rule Name</label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="e.g. Trailing Drawdown $2,500"
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Category</label>
                <select
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value as RuleCategory)}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                >
                  <option value="OBJECTIVE">OBJECTIVE</option>
                  <option value="DRAWDOWN">DRAWDOWN</option>
                  <option value="TRADING_STYLE">TRADING_STYLE</option>
                  <option value="RISK_MANAGEMENT">RISK_MANAGEMENT</option>
                  <option value="PAYOUT_SCALING">PAYOUT_SCALING</option>
                </select>
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Threshold Value</label>
                <input
                  type="text"
                  value={String(threshold)}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="10 or 3000"
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as RuleUnit)}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                >
                  <option value="PERCENT_BALANCE">% of Starting Balance</option>
                  <option value="CURRENCY">Fixed Currency Amount ($)</option>
                  <option value="PERCENT_EQUITY">% of Current Equity</option>
                  <option value="PERCENT_OF_PROFIT">% of Generated Profit</option>
                  <option value="DAYS">Trading Days</option>
                  <option value="CONTRACTS">Contracts</option>
                  <option value="LOTS">Lots</option>
                  <option value="BOOLEAN">Boolean (Yes/No)</option>
                  <option value="MINUTES">Minutes</option>
                </select>
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Calculation Method</label>
                <select
                  value={calcMethod}
                  onChange={(e) => setCalcMethod(e.target.value as RuleCalculationMethod)}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                >
                  <option value="STATIC_BALANCE">STATIC_BALANCE (Fixed)</option>
                  <option value="TRAILING_HIGH_WATER_MARK">TRAILING_HIGH_WATER_MARK (Intraday Peak)</option>
                  <option value="TRAILING_EOD">TRAILING_EOD (End of Day)</option>
                  <option value="CURRENT_EQUITY">CURRENT_EQUITY</option>
                  <option value="MAX_DAILY_PROFIT_RATIO">MAX_DAILY_PROFIT_RATIO (Consistency)</option>
                  <option value="MAX_LOTS_TOTAL">MAX_LOTS_TOTAL</option>
                  <option value="BOOLEAN_FLAG">BOOLEAN_FLAG</option>
                  <option value="TIME_WINDOW">TIME_WINDOW</option>
                </select>
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Warning Threshold (%)</label>
                <input
                  type="number"
                  value={warningThreshold}
                  onChange={(e) => setWarningThreshold(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Violation Threshold (%)</label>
                <input
                  type="number"
                  value={violationThreshold}
                  onChange={(e) => setViolationThreshold(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Severity</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as RuleSeverity)}
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                >
                  <option value="HARD_BREACH">HARD BREACH (Account Termination)</option>
                  <option value="SOFT_BREACH">SOFT BREACH (Session Close/Lock)</option>
                  <option value="WARNING_ONLY">WARNING ONLY (Consistency Notice)</option>
                  <option value="INFO">INFO (Milestone Tracker)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Rule Description</label>
                <input
                  type="text"
                  value={ruleDesc}
                  onChange={(e) => setRuleDesc(e.target.value)}
                  placeholder="Explain how this rule protects the prop firm account"
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#848B98] mb-1 font-semibold">Official Source / FAQ Link (Optional)</label>
                <input
                  type="text"
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://firm.com/rules#clause-3"
                  className="w-full px-2.5 py-1.5 bg-[#0C0D0F] border border-[#22252A] rounded text-white text-xs focus:outline-none font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#22252A]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingRuleIndex(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveRuleItem}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Apply Rule Changes
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[#22252A]">
          <span className="text-xs text-[#848B98]">
            Rule set will be saved to your local workspace database.
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
              {isSaving ? 'Saving...' : 'Save Rule Set'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
