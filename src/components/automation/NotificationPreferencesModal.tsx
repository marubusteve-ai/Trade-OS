import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Moon, 
  ShieldAlert, 
  Clock, 
  Check, 
  Sliders, 
  SlidersHorizontal,
  Flame,
  Award,
  BookOpen,
  Sparkles,
  BarChart,
  Tag,
  FolderOpen,
  FileSpreadsheet
} from 'lucide-react';
import { NotificationPreferences, AutomationCategory, NotificationSeverity } from '../../types/automation';
import { Badge } from '../ui/Badge';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: NotificationPreferences;
  onSavePreferences: (updates: Partial<NotificationPreferences>) => Promise<NotificationPreferences>;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
}) => {
  const [formData, setFormData] = useState<NotificationPreferences>({ ...preferences });
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const categoryLabels: { key: AutomationCategory; label: string; icon: any; description: string }[] = [
    { key: 'RISK', label: 'Risk Ceiling Alerts', icon: ShieldAlert, description: 'Position size, planned risk %, and margin guardrails' },
    { key: 'DAILY_LOSS', label: 'Daily Loss & Drawdown', icon: Flame, description: 'Daily stop-out thresholds and intraday equity buffers' },
    { key: 'DRAWDOWN', label: 'Peak Drawdown Monitors', icon: BarChart, description: 'High-water mark and portfolio drawdown limits' },
    { key: 'PROP_FIRM', label: 'Prop Firm Compliance', icon: Award, description: 'Trailing drawdown proximity and rule violation alerts' },
    { key: 'GOALS', label: 'Discipline & Goals', icon: Sliders, description: 'Rule adherence pace and milestone warnings' },
    { key: 'JOURNAL', label: 'Journal Prompts', icon: BookOpen, description: 'Post-trade reflection and emotion logging reminders' },
    { key: 'AI_REVIEW', label: 'AI Review Schedules', icon: Sparkles, description: 'Automated diagnostic and tilt reviews' },
    { key: 'AUTO_TAGGING', label: 'Auto-Tagging Notifications', icon: Tag, description: 'Notifies when automated tags are attached' },
    { key: 'AUTO_CATEGORIZATION', label: 'Auto-Categorization', icon: FolderOpen, description: 'Notifies when setup/strategy matches are applied' },
    { key: 'REPORT_TRIGGER', label: 'Report Triggers', icon: FileSpreadsheet, description: 'Periodic and milestone statement generation notices' },
  ];

  const handleToggleCategory = (cat: AutomationCategory) => {
    setFormData(prev => ({
      ...prev,
      categorySubscriptions: {
        ...prev.categorySubscriptions,
        [cat]: !prev.categorySubscriptions[cat],
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSavePreferences(formData);
      onClose();
    } catch (e) {
      console.error('Failed to save preferences:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121316] border border-[#23272E] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23272E] bg-[#16181D]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#F3F4F6]">Notification & Dispatch Preferences</h3>
              <p className="text-xs text-[#9CA3AF]">Configure alert channels, quiet hours, minimum severities, and subscriptions</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm">
          {/* Master Delivery Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div 
              onClick={() => setFormData(p => ({ ...p, enabled: !p.enabled }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                formData.enabled 
                  ? 'bg-[#1A1D24] border-[#3B82F6]/40 text-[#F3F4F6]' 
                  : 'bg-[#14161A] border-[#23272E] text-[#6B7280]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Bell className="w-4 h-4 text-[#3B82F6]" />
                <span className={`w-2.5 h-2.5 rounded-full ${formData.enabled ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
              </div>
              <div>
                <p className="font-medium text-xs">Master Alerts</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formData.enabled ? 'Engine Active' : 'Muted Globally'}</p>
              </div>
            </div>

            <div 
              onClick={() => setFormData(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                formData.soundEnabled 
                  ? 'bg-[#1A1D24] border-[#3B82F6]/40 text-[#F3F4F6]' 
                  : 'bg-[#14161A] border-[#23272E] text-[#6B7280]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {formData.soundEnabled ? <Volume2 className="w-4 h-4 text-[#10B981]" /> : <VolumeX className="w-4 h-4 text-[#6B7280]" />}
                <span className={`w-2.5 h-2.5 rounded-full ${formData.soundEnabled ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
              </div>
              <div>
                <p className="font-medium text-xs">Audio Chimes</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formData.soundEnabled ? 'Chimes On' : 'Silent Mode'}</p>
              </div>
            </div>

            <div 
              onClick={() => setFormData(p => ({ ...p, inAppToast: !p.inAppToast }))}
              className={`p-4 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                formData.inAppToast 
                  ? 'bg-[#1A1D24] border-[#3B82F6]/40 text-[#F3F4F6]' 
                  : 'bg-[#14161A] border-[#23272E] text-[#6B7280]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-4 h-4 text-[#F59E0B]" />
                <span className={`w-2.5 h-2.5 rounded-full ${formData.inAppToast ? 'bg-[#10B981]' : 'bg-[#6B7280]'}`} />
              </div>
              <div>
                <p className="font-medium text-xs">In-App HUD Toasts</p>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5">{formData.inAppToast ? 'Popup Banners' : 'Tray Only'}</p>
              </div>
            </div>
          </div>

          {/* Minimum Severity Filter */}
          <div className="bg-[#16181D] border border-[#23272E] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-xs text-[#F3F4F6]">Minimum Severity Filter</label>
                <p className="text-[11px] text-[#9CA3AF]">Only display notifications matching or exceeding this threshold</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {formData.minimumSeverity}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['INFO', 'WARNING', 'CRITICAL'] as NotificationSeverity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, minimumSeverity: sev }))}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    formData.minimumSeverity === sev
                      ? sev === 'CRITICAL'
                        ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/50'
                        : sev === 'WARNING'
                        ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/50'
                        : 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/50'
                      : 'bg-[#1E2128] text-[#9CA3AF] border-[#2B303B] hover:text-[#F3F4F6]'
                  }`}
                >
                  {sev === 'INFO' ? 'All (Info+)' : sev === 'WARNING' ? 'Warnings & Critical' : 'Critical Only'}
                </button>
              ))}
            </div>
          </div>

          {/* Quiet Hours Configuration */}
          <div className="bg-[#16181D] border border-[#23272E] rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Moon className="w-4 h-4 text-[#A855F7]" />
                <div>
                  <h4 className="font-medium text-xs text-[#F3F4F6]">Quiet Hours Guard</h4>
                  <p className="text-[11px] text-[#9CA3AF]">Suppress non-critical alerts during focus or rest periods</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData(p => ({
                  ...p,
                  quietHours: { ...p.quietHours, enabled: !p.quietHours.enabled }
                }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  formData.quietHours.enabled ? 'bg-[#3B82F6]' : 'bg-[#2B303B]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    formData.quietHours.enabled ? 'translate-x-4.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.quietHours.enabled && (
              <div className="pt-2 border-t border-[#23272E] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fadeIn">
                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.quietHours.startTime}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      quietHours: { ...p.quietHours, startTime: e.target.value }
                    }))}
                    className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.quietHours.endTime}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      quietHours: { ...p.quietHours, endTime: e.target.value }
                    }))}
                    className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="allowCritical"
                    checked={formData.quietHours.allowCritical}
                    onChange={(e) => setFormData(p => ({
                      ...p,
                      quietHours: { ...p.quietHours, allowCritical: e.target.checked }
                    }))}
                    className="rounded bg-[#1E2128] border-[#2B303B] text-[#3B82F6] focus:ring-0 focus:ring-offset-0"
                  />
                  <label htmlFor="allowCritical" className="text-xs text-[#9CA3AF] cursor-pointer">
                    Bypass quiet hours for <span className="text-[#EF4444] font-medium">Critical Risk & Prop-Firm Limit Breaches</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Rate Limiting & Anti-Fatigue */}
          <div className="bg-[#16181D] border border-[#23272E] rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#3B82F6]" />
              <div>
                <h4 className="font-medium text-xs text-[#F3F4F6]">Anti-Fatigue Rate Limiting</h4>
                <p className="text-[11px] text-[#9CA3AF]">Sliding 60-second window to prevent notification floods</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">Max Alerts / Minute</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.rateLimiting?.maxPerMinute || 6}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    rateLimiting: {
                      ...p.rateLimiting,
                      maxPerMinute: Number(e.target.value) || 6,
                    }
                  }))}
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#9CA3AF] mb-1">Deduplication Window (Mins)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.rateLimiting?.deduplicateSimilarMinutes || 30}
                  onChange={(e) => setFormData(p => ({
                    ...p,
                    rateLimiting: {
                      ...p.rateLimiting,
                      deduplicateSimilarMinutes: Number(e.target.value) || 30,
                    }
                  }))}
                  className="w-full bg-[#1E2128] border border-[#2B303B] rounded-lg px-3 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
            </div>
          </div>

          {/* Category Subscriptions */}
          <div className="space-y-3">
            <h4 className="font-medium text-xs text-[#F3F4F6] uppercase tracking-wider text-[#9CA3AF]">
              Subscribed Event Categories
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {categoryLabels.map((cat) => {
                const isSubbed = formData.categorySubscriptions?.[cat.key] !== false;
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.key}
                    onClick={() => handleToggleCategory(cat.key)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start space-x-3 ${
                      isSubbed
                        ? 'bg-[#16181D] border-[#2B303B] text-[#F3F4F6] hover:border-[#3B82F6]/50'
                        : 'bg-[#121316] border-[#1E2128] text-[#6B7280] opacity-60'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md mt-0.5 ${isSubbed ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#1E2128] text-[#6B7280]'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium truncate">{cat.label}</p>
                        {isSubbed && <Check className="w-3.5 h-3.5 text-[#10B981] ml-1 flex-shrink-0" />}
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">{cat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-[#23272E] bg-[#16181D]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-[#9CA3AF] hover:text-[#F3F4F6] bg-[#1E2128] hover:bg-[#2B303B] border border-[#2B303B] rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
          >
            {isSaving ? 'Saving...' : 'Apply Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
