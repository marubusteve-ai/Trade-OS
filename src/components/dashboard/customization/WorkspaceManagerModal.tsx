import React, { useState } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useCustomization } from '../../../context/CustomizationContext';
import { THEME_PRESETS } from '../../../services/customizationService';
import { ThemePresetId, DisplayDensity } from '../../../types/customization';
import {
  LayoutDashboard,
  Plus,
  Copy,
  Trash2,
  Download,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ShieldCheck,
  BarChart3,
  Sliders,
  Palette
} from 'lucide-react';

export const WorkspaceManagerModal: React.FC = () => {
  const {
    workspaces,
    activeWorkspace,
    switchWorkspace,
    createWorkspace,
    duplicateWorkspace,
    deleteWorkspace,
    updateWorkspace,
    resetWorkspaces,
    isWorkspaceModalOpen,
    closeWorkspaceModal,
    exportLayoutJSON,
    importLayoutJSON,
  } = useCustomization();

  const [activeTab, setActiveTab] = useState<'WORKSPACES' | 'CREATE' | 'THEMES' | 'BACKUP'>('WORKSPACES');
  
  // New Workspace Form State
  const [newWsName, setNewWsName] = useState('');
  const [newWsDesc, setNewWsDesc] = useState('');
  const [newWsPreset, setNewWsPreset] = useState<'OVERVIEW' | 'PROP_AUDIT' | 'QUANT_RADAR' | 'STRATEGY_LAB'>('OVERVIEW');
  const [importJsonText, setImportJsonText] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    createWorkspace({
      name: newWsName.trim(),
      description: newWsDesc.trim(),
      presetType: newWsPreset,
    });

    setNewWsName('');
    setNewWsDesc('');
    setActiveTab('WORKSPACES');
  };

  const handleExport = () => {
    const json = exportLayoutJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradeos-workspaces-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    if (!importJsonText.trim()) return;
    const success = importLayoutJSON(importJsonText.trim());
    if (success) {
      setImportJsonText('');
      setActiveTab('WORKSPACES');
    }
  };

  return (
    <Modal
      isOpen={isWorkspaceModalOpen}
      onClose={closeWorkspaceModal}
      title="Dashboard Workspaces & Layout Studio"
      size="lg"
    >
      <div className="space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#22252A] pb-3">
          <Button
            variant={activeTab === 'WORKSPACES' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('WORKSPACES')}
            className="text-xs gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Workspaces ({workspaces.length})</span>
          </Button>

          <Button
            variant={activeTab === 'CREATE' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('CREATE')}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Workspace</span>
          </Button>

          <Button
            variant={activeTab === 'THEMES' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('THEMES')}
            className="text-xs gap-1.5"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme & Density</span>
          </Button>

          <Button
            variant={activeTab === 'BACKUP' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('BACKUP')}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export / Import</span>
          </Button>
        </div>

        {/* Tab 1: Workspaces List */}
        {activeTab === 'WORKSPACES' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#848B98]">
              <span>Switch or customize your operational layouts.</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetWorkspaces}
                className="h-6 text-[11px] text-zinc-400 hover:text-white gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Defaults</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspace.id;

                return (
                  <div
                    key={ws.id}
                    className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between gap-3 ${
                      isActive
                        ? 'bg-[#181B21] border-emerald-500/50 shadow-md shadow-emerald-500/5'
                        : 'bg-[#121417] border-[#22252A] hover:border-[#2E333C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{ws.name}</h4>
                          {ws.isDefault && <Badge variant="zinc">DEFAULT</Badge>}
                          {isActive && <Badge variant="emerald">ACTIVE</Badge>}
                        </div>
                      </div>
                      <p className="text-xs text-[#848B98] mt-1 line-clamp-2">
                        {ws.description || 'Custom multi-widget workspace.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1E2128]">
                      <div className="text-[11px] text-[#555C68] font-mono">
                        {ws.widgets.filter((w) => w.enabled).length} of {ws.widgets.length} widgets
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isActive && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              switchWorkspace(ws.id);
                              closeWorkspaceModal();
                            }}
                            className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                          >
                            Switch
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateWorkspace(ws.id)}
                          title="Duplicate Workspace"
                          className="h-7 w-7 p-0 text-[#848B98] hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>

                        {workspaces.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWorkspace(ws.id)}
                            title="Delete Workspace"
                            className="h-7 w-7 p-0 text-[#848B98] hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create Workspace Form */}
        {activeTab === 'CREATE' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-1.5">
                Workspace Name *
              </label>
              <input
                type="text"
                required
                value={newWsName}
                onChange={(e) => setNewWsName(e.target.value)}
                placeholder="e.g., Live Scalping Terminal, Risk Auditor, Macro Swing"
                className="w-full bg-[#0C0D0F] border border-[#2B303B] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={newWsDesc}
                onChange={(e) => setNewWsDesc(e.target.value)}
                placeholder="Primary objective and focus of this layout"
                className="w-full bg-[#0C0D0F] border border-[#2B303B] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-1.5">
                Starting Preset Template
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    type: 'OVERVIEW',
                    label: 'Executive Overview',
                    desc: 'Balanced KPIs, equity curve, calendar, recent trades.',
                    icon: LayoutDashboard,
                  },
                  {
                    type: 'PROP_AUDIT',
                    label: 'Prop Firm Audit',
                    desc: 'Drawdown depths, daily loss limits, rule audits.',
                    icon: ShieldCheck,
                  },
                  {
                    type: 'QUANT_RADAR',
                    label: 'Quant Edge Radar',
                    desc: 'Scatter plots, R histograms, correlation matrices.',
                    icon: BarChart3,
                  },
                  {
                    type: 'STRATEGY_LAB',
                    label: 'Strategy & Playbook Lab',
                    desc: 'Strategy comparison matrix and session cohorts.',
                    icon: Layers,
                  },
                ].map((item) => (
                  <div
                    key={item.type}
                    onClick={() => setNewWsPreset(item.type as any)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      newWsPreset === item.type
                        ? 'bg-[#181B21] border-emerald-500 text-white'
                        : 'bg-[#121417] border-[#22252A] text-[#848B98] hover:border-[#2E333C]'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold text-xs text-white">
                      <item.icon className="w-4 h-4 text-emerald-400" />
                      <span>{item.label}</span>
                    </div>
                    <p className="text-[11px] text-[#848B98] mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#22252A]">
              <Button type="button" variant="ghost" onClick={() => setActiveTab('WORKSPACES')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Create & Open Workspace
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Themes & Display Density */}
        {activeTab === 'THEMES' && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-2">
                Color Accent & Terminal Theme
              </label>
              <div className="grid grid-cols-2 gap-3">
                {THEME_PRESETS.map((t) => {
                  const isSelected = activeWorkspace.themeId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => updateWorkspace({ ...activeWorkspace, themeId: t.id })}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#181B21] border-emerald-500'
                          : 'bg-[#121417] border-[#22252A] hover:border-[#2E333C]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: t.primaryAccent }}
                          />
                          <span className="text-xs font-bold text-white">{t.name}</span>
                        </div>
                        {isSelected && <Badge variant="emerald">ACTIVE</Badge>}
                      </div>
                      <p className="text-[11px] text-[#848B98] mt-1.5">{t.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-2">
                Display Information Density
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'compact', label: 'Compact', desc: 'Maximum data density for pro scalpers & quants' },
                  { id: 'standard', label: 'Standard', desc: 'Balanced spacing, metrics, and chart heights' },
                  { id: 'spacious', label: 'Spacious', desc: 'Generous padding and elevated visual rhythm' },
                ].map((d) => (
                  <div
                    key={d.id}
                    onClick={() => updateWorkspace({ ...activeWorkspace, density: d.id as DisplayDensity })}
                    className={`p-3 rounded-lg border cursor-pointer text-center transition-all ${
                      activeWorkspace.density === d.id
                        ? 'bg-[#181B21] border-emerald-500'
                        : 'bg-[#121417] border-[#22252A] hover:border-[#2E333C]'
                    }`}
                  >
                    <div className="font-bold text-xs text-white">{d.label}</div>
                    <p className="text-[10px] text-[#848B98] mt-1">{d.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Export / Import Backup */}
        {activeTab === 'BACKUP' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#121417] border border-[#22252A] rounded-lg space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Export Workspace Bundle</h4>
              <p className="text-xs text-[#848B98]">
                Download a complete JSON configuration of your workspaces, saved filters, custom templates, and column layouts.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="text-xs border-[#2B303B] text-white hover:border-emerald-500 gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Workspaces JSON</span>
              </Button>
            </div>

            <div className="p-3 bg-[#121417] border border-[#22252A] rounded-lg space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">Import Workspace Bundle</h4>
              <p className="text-xs text-[#848B98]">
                Paste a exported JSON string to restore or sync configurations across stations.
              </p>
              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste TradeOS workspace JSON package here..."
                className="w-full bg-[#0C0D0F] border border-[#2B303B] rounded p-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleImportSubmit}
                disabled={!importJsonText.trim()}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Configuration</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
