import React, { useState } from 'react';
import { 
  Zap, 
  Plus, 
  Play, 
  SlidersHorizontal, 
  RotateCcw, 
  ShieldAlert, 
  Flame, 
  Award, 
  BookOpen, 
  Sparkles, 
  Tag, 
  FolderPlus, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Edit3, 
  Trash2, 
  Power, 
  Search,
  Sliders,
  History,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useNotification } from '../../context/NotificationContext';
import { AutomationRule, AutomationCategory } from '../../types/automation';
import { Badge } from '../ui/Badge';
import { AutomationRuleBuilderModal } from './AutomationRuleBuilderModal';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { AutomationLogsTable } from './AutomationLogsTable';

export const AutomationView: React.FC = () => {
  const {
    automationRules,
    notificationPreferences,
    automationLogs,
    createAutomationRule,
    updateAutomationRule,
    deleteAutomationRule,
    toggleAutomationRule,
    resetAutomationDefaults,
    updateNotificationPreferences,
    evaluateAutomationRules,
    clearAutomationLogs,
    accounts,
    selectedAccount,
  } = useTradeOS();

  const { notify } = useNotification();

  // Filter and Modal States
  const [selectedCategory, setSelectedCategory] = useState<AutomationCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState<'RULES' | 'LOGS'>('RULES');

  // Filter rules
  const filteredRules = automationRules.filter((rule) => {
    const matchesCategory = selectedCategory === 'ALL' || rule.category === selectedCategory;
    const matchesSearch =
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.condition.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Summary Metrics
  const activeRulesCount = automationRules.filter((r) => r.isEnabled).length;
  const totalTriggersFired = automationRules.reduce((sum, r) => sum + (r.triggerCount || 0), 0);
  const riskGuardrailsCount = automationRules.filter(
    (r) => r.isEnabled && (r.category === 'RISK' || r.category === 'DAILY_LOSS' || r.category === 'DRAWDOWN' || r.category === 'PROP_FIRM')
  ).length;

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setIsBuilderModalOpen(true);
  };

  const handleOpenEditModal = (rule: AutomationRule) => {
    setEditingRule(rule);
    setIsBuilderModalOpen(true);
  };

  const handleDeleteRule = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete rule "${name}"?`)) {
      await deleteAutomationRule(id);
      notify.info('Rule Deleted', `Automation rule "${name}" has been removed.`);
    }
  };

  const handleToggleRule = async (id: string) => {
    const updated = await toggleAutomationRule(id);
    if (updated) {
      if (updated.isEnabled) {
        notify.success('Rule Activated', `Automation rule "${updated.name}" is now active.`);
      } else {
        notify.info('Rule Paused', `Automation rule "${updated.name}" is now paused.`);
      }
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    try {
      const logs = await evaluateAutomationRules('MANUAL_EVALUATION');
      notify.success('Evaluation Complete', `Evaluated ${automationRules.length} rules. Fired ${logs.length} trigger events.`);
    } catch (err: any) {
      notify.error('Evaluation Error', err?.message || 'Failed to evaluate automation rules.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset all automation rules to factory institutional defaults? Custom rules will be replaced.')) {
      await resetAutomationDefaults();
      notify.success('Rules Reset', 'Loaded 10 default institutional automation rules.');
    }
  };

  const getCategoryIcon = (category: AutomationCategory) => {
    switch (category) {
      case 'RISK':
        return <ShieldAlert className="w-4 h-4 text-[#EF4444]" />;
      case 'DAILY_LOSS':
        return <Flame className="w-4 h-4 text-[#F59E0B]" />;
      case 'DRAWDOWN':
        return <TrendingDown className="w-4 h-4 text-[#EC4899]" />;
      case 'PROP_FIRM':
        return <Award className="w-4 h-4 text-[#8B5CF6]" />;
      case 'GOALS':
        return <Sliders className="w-4 h-4 text-[#10B981]" />;
      case 'JOURNAL':
        return <BookOpen className="w-4 h-4 text-[#3B82F6]" />;
      case 'AI_REVIEW':
        return <Sparkles className="w-4 h-4 text-[#F59E0B]" />;
      case 'AUTO_TAGGING':
        return <Tag className="w-4 h-4 text-[#06B6D4]" />;
      case 'AUTO_CATEGORIZATION':
        return <FolderPlus className="w-4 h-4 text-[#14B8A6]" />;
      case 'REPORT_TRIGGER':
        return <FileSpreadsheet className="w-4 h-4 text-[#6366F1]" />;
      default:
        return <Zap className="w-4 h-4 text-[#3B82F6]" />;
    }
  };

  const categories: { id: AutomationCategory | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'All Rules' },
    { id: 'RISK', label: 'Risk Ceiling' },
    { id: 'DAILY_LOSS', label: 'Daily Loss' },
    { id: 'DRAWDOWN', label: 'Drawdown' },
    { id: 'PROP_FIRM', label: 'Prop Firm' },
    { id: 'GOALS', label: 'Discipline' },
    { id: 'JOURNAL', label: 'Journal Prompts' },
    { id: 'AI_REVIEW', label: 'AI Reviews' },
    { id: 'AUTO_TAGGING', label: 'Auto-Tagging' },
    { id: 'REPORT_TRIGGER', label: 'Report Triggers' },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#121316] border border-[#23272E] p-5 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F3F4F6] tracking-tight">Automation & Notification Engine</h1>
              <p className="text-xs text-[#9CA3AF]">
                Autonomous risk guardrails, prop firm monitors, auto-tagging, and discipline triggers
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunEvaluation}
            disabled={isEvaluating}
            className="px-3 py-2 text-xs font-medium text-[#F3F4F6] bg-[#1E2128] hover:bg-[#2B303B] border border-[#2B303B] rounded-lg transition-colors flex items-center space-x-1.5"
            title="Evaluate active rules against current account state"
          >
            <Play className={`w-3.5 h-3.5 text-[#10B981] ${isEvaluating ? 'animate-spin' : ''}`} />
            <span>{isEvaluating ? 'Evaluating...' : 'Evaluate Now'}</span>
          </button>

          <button
            onClick={() => setIsPreferencesModalOpen(true)}
            className="px-3 py-2 text-xs font-medium text-[#F3F4F6] bg-[#1E2128] hover:bg-[#2B303B] border border-[#2B303B] rounded-lg transition-colors flex items-center space-x-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Preferences</span>
          </button>

          <button
            onClick={handleResetDefaults}
            className="px-3 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#1E2128] hover:bg-[#2B303B] border border-[#2B303B] rounded-lg transition-colors flex items-center space-x-1.5"
            title="Reset rules to default institutional presets"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121316] border border-[#23272E] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Active Guardrails</span>
            <span className="p-1.5 rounded-lg bg-[#10B981]/10 text-[#10B981]">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#F3F4F6] font-mono">{activeRulesCount}</span>
            <span className="text-xs text-[#9CA3AF]">of {automationRules.length} enabled</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23272E] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Risk Ceiling Shields</span>
            <span className="p-1.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444]">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#EF4444] font-mono">{riskGuardrailsCount}</span>
            <span className="text-xs text-[#9CA3AF]">active monitors</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23272E] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Total Triggers Fired</span>
            <span className="p-1.5 rounded-lg bg-[#F59E0B]/10 text-[#F59E0B]">
              <Flame className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#F3F4F6] font-mono">{totalTriggersFired}</span>
            <span className="text-xs text-[#9CA3AF]">lifetime triggers</span>
          </div>
        </div>

        <div className="bg-[#121316] border border-[#23272E] p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Audit Log Entries</span>
            <span className="p-1.5 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6]">
              <History className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-[#3B82F6] font-mono">{automationLogs.length}</span>
            <span className="text-xs text-[#9CA3AF]">events recorded</span>
          </div>
        </div>
      </div>

      {/* Main Tab Switcher & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#23272E] pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveViewTab('RULES')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 ${
              activeViewTab === 'RULES'
                ? 'bg-[#3B82F6] text-white'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2128]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configured Rules ({automationRules.length})</span>
          </button>
          <button
            onClick={() => setActiveViewTab('LOGS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-2 ${
              activeViewTab === 'LOGS'
                ? 'bg-[#3B82F6] text-white'
                : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2128]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Logs ({automationLogs.length})</span>
          </button>
        </div>

        {activeViewTab === 'RULES' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className="bg-[#121316] border border-[#23272E] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] w-full sm:w-60"
            />
          </div>
        )}
      </div>

      {activeViewTab === 'RULES' ? (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 custom-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const count =
                cat.id === 'ALL'
                  ? automationRules.length
                  : automationRules.filter((r) => r.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                    isSelected
                      ? 'bg-[#1E2128] text-[#3B82F6] border border-[#3B82F6]/50 shadow-sm'
                      : 'bg-[#121316] text-[#9CA3AF] border border-[#23272E] hover:text-[#F3F4F6] hover:border-[#2B303B]'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-[#3B82F6]/20 text-[#3B82F6]' : 'bg-[#1E2128] text-[#6B7280]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Rules Cards Grid */}
          {filteredRules.length === 0 ? (
            <div className="bg-[#121316] border border-[#23272E] rounded-xl p-12 text-center text-[#6B7280]">
              <Zap className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-semibold text-[#F3F4F6]">No automation rules match your filters.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                Try selecting another category or click "Create Rule" to build a custom trigger.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] rounded-lg transition-colors inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Rule</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((rule) => {
                const isEnabled = rule.isEnabled;
                return (
                  <div
                    key={rule.id}
                    className={`bg-[#121316] border rounded-xl p-4 transition-all flex flex-col justify-between space-y-4 shadow-sm ${
                      isEnabled
                        ? 'border-[#23272E] hover:border-[#3B82F6]/40'
                        : 'border-[#1E2128] opacity-60 bg-[#0F1013]'
                    }`}
                  >
                    {/* Top Row: Category, Name & Toggle */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-md bg-[#16181D] border border-[#23272E]">
                            {getCategoryIcon(rule.category)}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-semibold text-[#F3F4F6] leading-tight">{rule.name}</h3>
                            </div>
                            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wider font-semibold">
                              {rule.category}
                            </span>
                          </div>
                        </div>

                        {/* Enable/Disable Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleRule(rule.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            isEnabled ? 'bg-[#3B82F6]' : 'bg-[#2B303B]'
                          }`}
                          title={isEnabled ? 'Pause Rule' : 'Activate Rule'}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-xs text-[#9CA3AF] mt-2.5 line-clamp-2">
                        {rule.description}
                      </p>
                    </div>

                    {/* Middle Row: WHEN condition & THEN actions badge */}
                    <div className="space-y-2 pt-2 border-t border-[#1E2128]">
                      {/* WHEN badge */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
                          WHEN
                        </span>
                        <span className="text-[#D1D5DB] font-mono text-[11px] truncate">
                          {rule.condition.type} {rule.condition.operator.replace('_', ' ')} {String(rule.condition.value)}
                        </span>
                      </div>

                      {/* THEN actions */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                          THEN
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {rule.actions.map((act) => (
                            <span
                              key={act.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#16181D] border border-[#2B303B] text-[#9CA3AF]"
                            >
                              {act.type} ({act.severity})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#1E2128] text-xs">
                      <div className="flex items-center space-x-3 text-[11px] text-[#6B7280]">
                        <span className="flex items-center space-x-1">
                          <Flame className="w-3 h-3 text-[#F59E0B]" />
                          <span>{rule.triggerCount || 0} fires</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{rule.cooldownMinutes || 15}m cooldown</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(rule)}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2128] rounded-lg transition-colors"
                          title="Edit Rule"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#1E2128] rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Audit Logs View */
        <AutomationLogsTable
          logs={automationLogs}
          onClearLogs={clearAutomationLogs}
        />
      )}

      {/* Modals */}
      <AutomationRuleBuilderModal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        onSaveRule={async (ruleData) => {
          if (editingRule) {
            return await updateAutomationRule(editingRule.id, ruleData);
          } else {
            return await createAutomationRule(ruleData);
          }
        }}
        editingRule={editingRule}
        accounts={accounts}
      />

      <NotificationPreferencesModal
        isOpen={isPreferencesModalOpen}
        onClose={() => setIsPreferencesModalOpen(false)}
        preferences={notificationPreferences}
        onSavePreferences={updateNotificationPreferences}
      />
    </div>
  );
};
