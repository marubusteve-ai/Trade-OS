import React, { useState, useEffect } from 'react';
import { 
  X, 
  Zap, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Sliders, 
  ShieldAlert, 
  Bell, 
  Tag, 
  FolderPlus, 
  Sparkles, 
  FileSpreadsheet, 
  Lock 
} from 'lucide-react';
import { 
  AutomationRule, 
  AutomationCategory, 
  AutomationTriggerEvent, 
  AutomationConditionType, 
  AutomationActionType, 
  AutomationAction, 
  NotificationSeverity 
} from '../../types/automation';
import { Account } from '../../types/domain';
import { Badge } from '../ui/Badge';

interface AutomationRuleBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRule: (ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'triggerCount'>) => Promise<AutomationRule>;
  editingRule?: AutomationRule | null;
  accounts: Account[];
}

export const AutomationRuleBuilderModal: React.FC<AutomationRuleBuilderModalProps> = ({
  isOpen,
  onClose,
  onSaveRule,
  editingRule,
  accounts,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<AutomationCategory>('RISK');
  const [isEnabled, setIsEnabled] = useState(true);
  const [accountScope, setAccountScope] = useState<'ALL' | string[]>('ALL');
  const [triggerEvents, setTriggerEvents] = useState<AutomationTriggerEvent[]>(['ON_TRADE_CLOSED']);
  const [cooldownMinutes, setCooldownMinutes] = useState<number>(15);

  // Condition State
  const [conditionType, setConditionType] = useState<AutomationConditionType>('RISK_PER_TRADE_EXCEEDED');
  const [conditionOperator, setConditionOperator] = useState<'GREATER_THAN' | 'GREATER_EQUAL' | 'LESS_THAN' | 'LESS_EQUAL' | 'EQUALS' | 'CONTAINS' | 'BETWEEN'>('GREATER_THAN');
  const [conditionField, setConditionField] = useState('plannedRiskPercent');
  const [conditionValue, setConditionValue] = useState<string | number>('2.0');
  const [conditionSecondaryValue, setConditionSecondaryValue] = useState<string | number>('');

  // Actions State
  const [actions, setActions] = useState<AutomationAction[]>([
    {
      id: 'act_' + Math.random().toString(36).substring(2, 7),
      type: 'SEND_NOTIFICATION',
      title: 'Risk Guardrail Breached',
      messageTemplate: 'Trade on {instrument} was opened with {plannedRiskPercent}% risk, exceeding limit of {thresholdValue}%.',
      severity: 'WARNING',
    },
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingRule) {
      setName(editingRule.name);
      setDescription(editingRule.description);
      setCategory(editingRule.category);
      setIsEnabled(editingRule.isEnabled);
      setAccountScope(editingRule.accountScope);
      setTriggerEvents(editingRule.triggerEvents || ['ON_TRADE_CLOSED']);
      setCooldownMinutes(editingRule.cooldownMinutes || 15);

      setConditionType(editingRule.condition.type);
      setConditionOperator(editingRule.condition.operator);
      setConditionField(editingRule.condition.field || '');
      setConditionValue(editingRule.condition.value);
      setConditionSecondaryValue(editingRule.condition.secondaryValue || '');

      setActions(editingRule.actions || []);
    } else {
      // Defaults for new rule
      setName('');
      setDescription('');
      setCategory('RISK');
      setIsEnabled(true);
      setAccountScope('ALL');
      setTriggerEvents(['ON_TRADE_CLOSED']);
      setCooldownMinutes(15);
      setConditionType('RISK_PER_TRADE_EXCEEDED');
      setConditionOperator('GREATER_THAN');
      setConditionField('plannedRiskPercent');
      setConditionValue(2.0);
      setConditionSecondaryValue('');
      setActions([
        {
          id: 'act_' + Math.random().toString(36).substring(2, 7),
          type: 'SEND_NOTIFICATION',
          title: 'Risk Guardrail Breached',
          messageTemplate: 'Trade on {instrument} was logged with {plannedRiskPercent}% risk.',
          severity: 'WARNING',
        },
      ]);
    }
  }, [editingRule, isOpen]);

  if (!isOpen) return null;

  // Handle category change presets
  const handleCategoryChange = (newCat: AutomationCategory) => {
    setCategory(newCat);
    switch (newCat) {
      case 'RISK':
        setConditionType('RISK_PER_TRADE_EXCEEDED');
        setConditionOperator('GREATER_THAN');
        setConditionField('plannedRiskPercent');
        setConditionValue(2.0);
        break;
      case 'DAILY_LOSS':
        setConditionType('DAILY_LOSS_EXCEEDED');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('dailyLossPercent');
        setConditionValue(75);
        break;
      case 'DRAWDOWN':
        setConditionType('DRAWDOWN_EXCEEDED');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('maxDrawdownPercent');
        setConditionValue(5.0);
        break;
      case 'PROP_FIRM':
        setConditionType('PROP_FIRM_LIMIT_WARNING');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('trailingDrawdownProximityPercent');
        setConditionValue(80);
        break;
      case 'GOALS':
        setConditionType('GOAL_PROGRESS_BEHIND');
        setConditionOperator('LESS_THAN');
        setConditionField('disciplineScore');
        setConditionValue(80);
        break;
      case 'JOURNAL':
        setConditionType('UNFILLED_JOURNAL_LOGS');
        setConditionOperator('EQUALS');
        setConditionField('isJournalComplete');
        setConditionValue('false');
        break;
      case 'AI_REVIEW':
        setConditionType('CONSECUTIVE_LOSSES_EXCEEDED');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('consecutiveLosses');
        setConditionValue(3);
        break;
      case 'AUTO_TAGGING':
        setConditionType('TRADE_ATTRIBUTE_MATCH');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('achievedRMultiple');
        setConditionValue(3.0);
        break;
      case 'AUTO_CATEGORIZATION':
        setConditionType('TRADE_ATTRIBUTE_MATCH');
        setConditionOperator('CONTAINS');
        setConditionField('instrument');
        setConditionValue('NQ,ES');
        break;
      case 'REPORT_TRIGGER':
        setConditionType('RECURRING_SCHEDULE');
        setConditionOperator('GREATER_EQUAL');
        setConditionField('weeklyTradeCount');
        setConditionValue(10);
        break;
    }
  };

  const handleToggleTriggerEvent = (event: AutomationTriggerEvent) => {
    setTriggerEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleAddAction = () => {
    const newAction: AutomationAction = {
      id: 'act_' + Math.random().toString(36).substring(2, 7),
      type: 'SEND_NOTIFICATION',
      title: 'Automated Alert',
      messageTemplate: 'Rule condition matched for {instrument}.',
      severity: 'INFO',
    };
    setActions([...actions, newAction]);
  };

  const handleUpdateAction = (id: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleRemoveAction = (id: string) => {
    if (actions.length <= 1) return;
    setActions(actions.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a descriptive rule name.');
      return;
    }
    if (triggerEvents.length === 0) {
      setError('Please select at least one trigger event.');
      return;
    }
    if (actions.length === 0) {
      setError('Please configure at least one execution action.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSaveRule({
        name: name.trim(),
        description: description.trim() || `WHEN ${conditionType} ${conditionOperator} ${conditionValue} THEN execute ${actions.length} action(s)`,
        category,
        isEnabled,
        accountScope,
        triggerEvents,
        cooldownMinutes: Number(cooldownMinutes) || 5,
        condition: {
          type: conditionType,
          operator: conditionOperator,
          field: conditionField,
          value: !isNaN(Number(conditionValue)) ? Number(conditionValue) : conditionValue,
          secondaryValue: conditionSecondaryValue ? (!isNaN(Number(conditionSecondaryValue)) ? Number(conditionSecondaryValue) : conditionSecondaryValue) : undefined,
        },
        actions,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save automation rule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121316] border border-[#23272E] rounded-xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23272E] bg-[#16181D]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F3F4F6]">
                {editingRule ? 'Edit Automation Rule' : 'Create Automation Rule'}
              </h3>
              <p className="text-xs text-[#9CA3AF]">
                Configure autonomous WHEN-condition-IS-TRUE THEN-action workflows
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2128] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
          {error && (
            <div className="p-3 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg text-xs text-[#EF4444]">
              {error}
            </div>
          )}

          {/* Core Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-medium text-[#F3F4F6]">Rule Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Single Trade Risk Ceiling Warning"
                className="w-full bg-[#16181D] border border-[#23272E] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-[#F3F4F6]">Category</label>
              <select
                value={category}
                onChange={(e) => handleCategoryChange(e.target.value as AutomationCategory)}
                className="w-full bg-[#16181D] border border-[#23272E] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
              >
                <option value="RISK">Risk Management</option>
                <option value="DAILY_LOSS">Daily Loss Protection</option>
                <option value="DRAWDOWN">Drawdown Guardrails</option>
                <option value="PROP_FIRM">Prop Firm Compliance</option>
                <option value="GOALS">Discipline & Goals</option>
                <option value="JOURNAL">Journal Prompts</option>
                <option value="AI_REVIEW">AI Diagnostics</option>
                <option value="AUTO_TAGGING">Auto-Tagging</option>
                <option value="AUTO_CATEGORIZATION">Auto-Categorization</option>
                <option value="REPORT_TRIGGER">Report Triggers</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F3F4F6]">Description / Objective</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., WHEN trade risk exceeds 2% THEN warn trader and auto-tag High Risk."
              className="w-full bg-[#16181D] border border-[#23272E] rounded-lg px-3 py-2 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          {/* Trigger Events & Account Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 bg-[#16181D] border border-[#23272E] p-3.5 rounded-lg">
              <label className="block text-xs font-medium text-[#F3F4F6]">Trigger Evaluation Events</label>
              <div className="space-y-1.5">
                {[
                  { id: 'ON_TRADE_CREATED', label: 'On Trade Logged / Created' },
                  { id: 'ON_TRADE_UPDATED', label: 'On Trade Modified' },
                  { id: 'ON_TRADE_CLOSED', label: 'On Trade Closed & Realized' },
                  { id: 'ON_METRICS_CALCULATED', label: 'On Metrics / Recalculation' },
                  { id: 'MANUAL_EVALUATION', label: 'On Manual Check Trigger' },
                ].map((ev) => (
                  <label key={ev.id} className="flex items-center space-x-2 text-xs text-[#9CA3AF] cursor-pointer hover:text-[#F3F4F6]">
                    <input
                      type="checkbox"
                      checked={triggerEvents.includes(ev.id as AutomationTriggerEvent)}
                      onChange={() => handleToggleTriggerEvent(ev.id as AutomationTriggerEvent)}
                      className="rounded bg-[#1E2128] border-[#2B303B] text-[#3B82F6] focus:ring-0"
                    />
                    <span>{ev.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 bg-[#16181D] border border-[#23272E] p-3.5 rounded-lg">
              <div>
                <label className="block text-xs font-medium text-[#F3F4F6] mb-1">Target Account Scope</label>
                <select
                  value={typeof accountScope === 'string' ? accountScope : accountScope[0] || 'ALL'}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAccountScope(val === 'ALL' ? 'ALL' : [val]);
                  }}
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="ALL">All Accounts (Global Scope)</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.accountType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#F3F4F6] mb-1">Anti-Fatigue Cooldown</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="0"
                    max="1440"
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(Number(e.target.value))}
                    className="w-24 bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                  />
                  <span className="text-xs text-[#9CA3AF]">minutes between repeat firings</span>
                </div>
              </div>
            </div>
          </div>

          {/* Condition Builder (WHEN) */}
          <div className="bg-[#16181D] border border-[#23272E] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider rounded bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/40">
                WHEN
              </span>
              <h4 className="font-semibold text-xs text-[#F3F4F6]">Condition Evaluation Logic</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Condition Rule</label>
                <select
                  value={conditionType}
                  onChange={(e) => setConditionType(e.target.value as AutomationConditionType)}
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="RISK_PER_TRADE_EXCEEDED">Planned Risk % Exceeded</option>
                  <option value="DAILY_LOSS_EXCEEDED">Daily Drawdown % Exceeded</option>
                  <option value="DRAWDOWN_EXCEEDED">Total Peak Drawdown % Exceeded</option>
                  <option value="PROP_FIRM_LIMIT_WARNING">Prop Firm Drawdown Proximity</option>
                  <option value="CONSECUTIVE_LOSSES_EXCEEDED">Consecutive Losses Streak</option>
                  <option value="OPEN_EXPOSURE_EXCEEDED">Open Trades Count</option>
                  <option value="UNFILLED_JOURNAL_LOGS">Unfilled Closed Trade Notes</option>
                  <option value="GOAL_PROGRESS_BEHIND">Discipline Score Threshold</option>
                  <option value="TRADE_ATTRIBUTE_MATCH">Trade Attribute Property Match</option>
                  <option value="RECURRING_SCHEDULE">Recurring Trade Count Trigger</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Comparison Operator</label>
                <select
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value as any)}
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                >
                  <option value="GREATER_THAN">Greater Than (&gt;)</option>
                  <option value="GREATER_EQUAL">Greater Than or Equal (&gt;=)</option>
                  <option value="LESS_THAN">Less Than (&lt;)</option>
                  <option value="LESS_EQUAL">Less Than or Equal (&lt;=)</option>
                  <option value="EQUALS">Equals (==)</option>
                  <option value="CONTAINS">Contains (Substring)</option>
                  <option value="BETWEEN">Between Range</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Threshold Value</label>
                <input
                  type="text"
                  value={conditionValue}
                  onChange={(e) => setConditionValue(e.target.value)}
                  placeholder="e.g. 2.0 or NQ,ES"
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>

            {conditionOperator === 'BETWEEN' && (
              <div>
                <label className="block text-[11px] text-[#9CA3AF] mb-1">Secondary Range Upper Bound</label>
                <input
                  type="text"
                  value={conditionSecondaryValue}
                  onChange={(e) => setConditionSecondaryValue(e.target.value)}
                  placeholder="Upper bound value"
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            )}
          </div>

          {/* Actions Builder (THEN) */}
          <div className="bg-[#16181D] border border-[#23272E] rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-[11px] font-bold tracking-wider rounded bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40">
                  THEN
                </span>
                <h4 className="font-semibold text-xs text-[#F3F4F6]">Actions Dispatcher</h4>
              </div>
              <button
                type="button"
                onClick={handleAddAction}
                className="text-xs text-[#3B82F6] hover:text-[#60A5FA] flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Secondary Action</span>
              </button>
            </div>

            {/* Actions List */}
            <div className="space-y-4">
              {actions.map((act, idx) => (
                <div key={act.id} className="p-3.5 bg-[#121316] border border-[#2B303B] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-medium text-[#9CA3AF]">Action #{idx + 1}</span>
                      <select
                        value={act.type}
                        onChange={(e) => handleUpdateAction(act.id, { type: e.target.value as AutomationActionType })}
                        className="bg-[#1E2128] border border-[#2B303B] rounded px-2 py-1 text-xs text-[#F3F4F6] focus:outline-none"
                      >
                        <option value="SEND_NOTIFICATION">Send In-App Notification</option>
                        <option value="AUTO_TAG_TRADE">Auto-Tag Trade</option>
                        <option value="AUTO_CATEGORIZATION">Auto-Categorize Strategy/Setup</option>
                        <option value="TRIGGER_AI_REVIEW">Trigger AI Review</option>
                        <option value="TRIGGER_REPORT_GENERATION">Trigger Report Statement</option>
                        <option value="LOCKOUT_WARNING">Enforce Tilt Lockout Warning</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <select
                        value={act.severity}
                        onChange={(e) => handleUpdateAction(act.id, { severity: e.target.value as NotificationSeverity })}
                        className="bg-[#1E2128] border border-[#2B303B] rounded px-2 py-1 text-xs text-[#F3F4F6] focus:outline-none"
                      >
                        <option value="INFO">Info</option>
                        <option value="SUCCESS">Success</option>
                        <option value="WARNING">Warning</option>
                        <option value="CRITICAL">Critical</option>
                      </select>

                      {actions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAction(act.id)}
                          className="text-[#EF4444] hover:text-[#F87171] p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Specific Fields */}
                  {act.type === 'SEND_NOTIFICATION' && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={act.title}
                        onChange={(e) => handleUpdateAction(act.id, { title: e.target.value })}
                        placeholder="Notification Title (supports {instrument}, {accountName})"
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      />
                      <textarea
                        rows={2}
                        value={act.messageTemplate}
                        onChange={(e) => handleUpdateAction(act.id, { messageTemplate: e.target.value })}
                        placeholder="Notification Body (supports {instrument}, {plannedRiskPercent}, {actualValue}, {thresholdValue})"
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  )}

                  {act.type === 'AUTO_TAG_TRADE' && (
                    <div>
                      <label className="block text-[11px] text-[#9CA3AF] mb-1">Tags to attach (comma-separated)</label>
                      <input
                        type="text"
                        value={(act.tagsToAdd || []).join(', ')}
                        onChange={(e) => handleUpdateAction(act.id, {
                          tagsToAdd: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        })}
                        placeholder="e.g. Overleveraged, High Risk, 3R+ Runner"
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  )}

                  {act.type === 'AUTO_CATEGORIZATION' && (
                    <div>
                      <label className="block text-[11px] text-[#9CA3AF] mb-1">Setup Name to Assign</label>
                      <input
                        type="text"
                        value={act.setupName || ''}
                        onChange={(e) => handleUpdateAction(act.id, { setupName: e.target.value })}
                        placeholder="e.g. Index Futures Momentum"
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  )}

                  {act.type === 'TRIGGER_AI_REVIEW' && (
                    <div>
                      <label className="block text-[11px] text-[#9CA3AF] mb-1">AI Diagnostic Workflow</label>
                      <select
                        value={act.aiReviewType || 'MISTAKE_ANALYSIS'}
                        onChange={(e) => handleUpdateAction(act.id, { aiReviewType: e.target.value as any })}
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      >
                        <option value="MISTAKE_ANALYSIS">Mistake Diagnostic & Root Cause</option>
                        <option value="PLAYBOOK_MATCH">Playbook Fit Evaluation</option>
                        <option value="EXECUTION_QUALITY">Execution Quality Score</option>
                      </select>
                    </div>
                  )}

                  {act.type === 'TRIGGER_REPORT_GENERATION' && (
                    <div>
                      <label className="block text-[11px] text-[#9CA3AF] mb-1">Report Statement Type</label>
                      <select
                        value={act.reportType || 'WEEKLY'}
                        onChange={(e) => handleUpdateAction(act.id, { reportType: e.target.value as any })}
                        className="w-full bg-[#1E2128] border border-[#2B303B] rounded px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                      >
                        <option value="WEEKLY">Weekly Performance Retrospective</option>
                        <option value="DAILY">Daily Executive Brief</option>
                        <option value="MONTHLY">Monthly Audit Report</option>
                        <option value="PROP_FIRM">Prop Firm Compliance Audit</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#6B7280]">
                Interpolation keys: {'{instrument}'}, {'{accountName}'}, {'{actualValue}'}, {'{thresholdValue}'}, {'{achievedRMultiple}'}
              </span>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#23272E] bg-[#16181D]">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enableRule"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="rounded bg-[#1E2128] border-[#2B303B] text-[#3B82F6] focus:ring-0"
            />
            <label htmlFor="enableRule" className="text-xs text-[#F3F4F6] cursor-pointer">
              Rule Active immediately
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#1E2128] hover:bg-[#2B303B] border border-[#2B303B] rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
            >
              {isSaving ? 'Saving Rule...' : editingRule ? 'Update Rule' : 'Create Automation Rule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
