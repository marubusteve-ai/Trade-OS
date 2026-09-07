/**
 * User Profile & Preferences Modal
 */

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { User, Shield, Moon, Sun, Monitor, Percent } from 'lucide-react';

export const UserProfileModal: React.FC = () => {
  const { isProfileModalOpen, closeProfileModal, currentUser, userProfile, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useNotification();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [defaultCurrency, setDefaultCurrency] = useState(userProfile?.defaultCurrency || 'USD');
  const [defaultTimezone, setDefaultTimezone] = useState(userProfile?.defaultTimezone || 'America/New_York');
  const [riskTolerancePercent, setRiskTolerancePercent] = useState<number>(userProfile?.riskTolerancePercent || 1.0);
  const [experienceLevel, setExperienceLevel] = useState<any>(userProfile?.experienceLevel || 'ADVANCED');
  const [enableSoundEffects, setEnableSoundEffects] = useState<boolean>(userProfile?.enableSoundEffects ?? true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateProfile({
        defaultCurrency,
        defaultTimezone,
        riskTolerancePercent: Number(riskTolerancePercent),
        experienceLevel,
        enableSoundEffects,
        themePreference: theme,
      });
      notify.success('Profile Updated', 'Trading parameters and display preferences saved.');
      closeProfileModal();
    } catch (e: any) {
      notify.error('Save Failed', e?.message || 'Could not save profile settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isProfileModalOpen}
      onClose={closeProfileModal}
      title="Trader Profile & System Preferences"
      description="Configure risk parameters, default base currency, timezone, and design tokens."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 py-1">
        {/* User Identity Info */}
        <div className="p-3.5 rounded-xl bg-[#0C0D0F] border border-[#22252A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1A1D21] border border-[#2A2E35] flex items-center justify-center font-bold text-sm text-emerald-400">
              {currentUser?.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{currentUser?.displayName}</p>
              <p className="text-[11px] text-[#848B98]">{currentUser?.email}</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              {currentUser?.isDemo ? 'DEMO ENVIRONMENT' : 'ISOLATED TENANT'}
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            prefixElement={<User className="h-3.5 w-3.5 text-[#848B98]" />}
            disabled
          />

          <Select
            label="Base Account Currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value)}
          >
            <option value="USD">USD ($ - United States Dollar)</option>
            <option value="EUR">EUR (€ - Euro)</option>
            <option value="GBP">GBP (£ - British Pound)</option>
            <option value="AUD">AUD ($ - Australian Dollar)</option>
            <option value="CAD">CAD ($ - Canadian Dollar)</option>
            <option value="JPY">JPY (¥ - Japanese Yen)</option>
            <option value="CHF">CHF (Fr - Swiss Franc)</option>
          </Select>

          <Select
            label="Trading Desk Timezone"
            value={defaultTimezone}
            onChange={(e) => setDefaultTimezone(e.target.value)}
          >
            <option value="America/New_York">America/New_York (EST/EDT - US Market)</option>
            <option value="America/Chicago">America/Chicago (CST/CDT - Futures)</option>
            <option value="Europe/London">Europe/London (GMT/BST - London Open)</option>
            <option value="Europe/Frankfurt">Europe/Frankfurt (CET/CEST)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (JST - Tokyo Open)</option>
            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
            <option value="UTC">UTC (Universal Coordinated Time)</option>
          </Select>

          <Input
            label="Default Max Risk Per Trade (%)"
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={riskTolerancePercent}
            onChange={(e) => setRiskTolerancePercent(parseFloat(e.target.value) || 1.0)}
            prefixElement={<Percent className="h-3.5 w-3.5 text-[#848B98]" />}
          />

          <Select
            label="Trading Experience Tier"
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as any)}
          >
            <option value="BEGINNER">Beginner (1-2 years)</option>
            <option value="INTERMEDIATE">Intermediate (2-4 years)</option>
            <option value="ADVANCED">Advanced / Prop Trader (4+ years)</option>
            <option value="PRO">Institutional / Systematic Quantitative</option>
          </Select>

          {/* Theme Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98]">
              Appearance Theme
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#1A1D21] border-[#2A2E35] text-[#848B98] hover:text-white'
                }`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  theme === 'light'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#1A1D21] border-[#2A2E35] text-[#848B98] hover:text-white'
                }`}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  theme === 'system'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#1A1D21] border-[#2A2E35] text-[#848B98] hover:text-white'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Auto</span>
              </button>
            </div>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="pt-2 border-t border-[#22252A] flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-[#D1D5DB] cursor-pointer">
            <input
              type="checkbox"
              checked={enableSoundEffects}
              onChange={(e) => setEnableSoundEffects(e.target.checked)}
              className="rounded border-[#2A2E35] bg-[#0C0D0F] text-emerald-500 focus:ring-emerald-500 h-3.5 w-3.5"
            />
            <span>Enable Haptic Audio Cues on Trade Execution</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#22252A]">
          <Button type="button" variant="outline" onClick={closeProfileModal}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            Save Preferences
          </Button>
        </div>
      </form>
    </Modal>
  );
};
