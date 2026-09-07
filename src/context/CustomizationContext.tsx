/**
 * Customization, Workspaces & Advanced Layout Context
 * Phase 15: Centralized Multi-Workspace and Theme Coordinator
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import {
  DashboardWorkspace,
  CustomWidgetConfig,
  KPIKey,
  SavedFilterPreset,
  SavedViewPreset,
  TradeColumnConfig,
  TradeEntryTemplate,
  ThemeConfig,
  ThemePresetId,
  DisplayDensity,
  DashboardWidgetSetting,
} from '../types/customization';
import {
  CustomizationService,
  ALL_KPI_DEFINITIONS,
  THEME_PRESETS,
} from '../services/customizationService';
import { DashboardFilterState } from '../types/calculations';

interface CustomizationContextType {
  // Workspaces
  workspaces: DashboardWorkspace[];
  activeWorkspace: DashboardWorkspace;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (params: { name: string; description?: string; presetType?: string }) => DashboardWorkspace;
  duplicateWorkspace: (workspaceId: string) => DashboardWorkspace;
  deleteWorkspace: (workspaceId: string) => boolean;
  updateWorkspace: (workspace: DashboardWorkspace) => void;
  resetWorkspaces: () => void;

  // Active Workspace Widget Customization
  activeWidgets: CustomWidgetConfig[];
  toggleWidget: (widgetId: string) => void;
  reorderWidgets: (startIndex: number, endIndex: number) => void;
  moveWidget: (widgetId: string, direction: 'UP' | 'DOWN') => void;
  updateWidgetSettings: (widgetId: string, updates: Partial<DashboardWidgetSetting>) => void;
  updateWidgetColSpan: (widgetId: string, colSpan: 1 | 2 | 3 | 4) => void;
  updateWidgetHeight: (widgetId: string, height: 'compact' | 'standard' | 'expanded') => void;

  // KPI Selection
  selectedKPIs: KPIKey[];
  setKPISelection: (keys: KPIKey[]) => void;
  toggleKPI: (kpiKey: KPIKey) => void;

  // Theming & Density
  activeTheme: ThemeConfig;
  themeId: ThemePresetId;
  setTheme: (themeId: ThemePresetId) => void;
  density: DisplayDensity;
  setDensity: (density: DisplayDensity) => void;

  // Saved Filters
  savedFilters: SavedFilterPreset[];
  saveFilterPreset: (name: string, filters: DashboardFilterState, description?: string) => SavedFilterPreset;
  deleteFilterPreset: (filterId: string) => void;

  // Trade Table Columns
  tradeColumns: TradeColumnConfig[];
  toggleColumnVisibility: (columnId: string) => void;
  reorderColumns: (startIndex: number, endIndex: number) => void;
  resetTradeColumns: () => void;

  // Trade Entry Templates
  tradeTemplates: TradeEntryTemplate[];
  saveTradeTemplate: (template: Omit<TradeEntryTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }) => TradeEntryTemplate;
  deleteTradeTemplate: (templateId: string) => void;

  // Import / Export
  exportLayoutJSON: () => string;
  importLayoutJSON: (jsonString: string) => boolean;

  // Modals & UI States
  isWorkspaceModalOpen: boolean;
  openWorkspaceModal: () => void;
  closeWorkspaceModal: () => void;
  isKPIModalOpen: boolean;
  openKPIModal: () => void;
  closeKPIModal: () => void;
  isColumnConfigModalOpen: boolean;
  openColumnConfigModal: () => void;
  closeColumnConfigModal: () => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { notify } = useNotification();
  const userId = currentUser?.id || 'anonymous_user';

  // Workspaces State
  const [workspaces, setWorkspaces] = useState<DashboardWorkspace[]>(() =>
    CustomizationService.getWorkspaces(userId)
  );
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(() =>
    CustomizationService.getActiveWorkspace(userId).id
  );

  // Saved Filters State
  const [savedFilters, setSavedFilters] = useState<SavedFilterPreset[]>(() =>
    CustomizationService.getSavedFilters(userId)
  );

  // Trade Columns State
  const [tradeColumns, setTradeColumns] = useState<TradeColumnConfig[]>(() =>
    CustomizationService.getTradeColumns(userId)
  );

  // Trade Templates State
  const [tradeTemplates, setTradeTemplates] = useState<TradeEntryTemplate[]>(() =>
    CustomizationService.getTradeTemplates(userId)
  );

  // Modals UI
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState<boolean>(false);
  const [isKPIModalOpen, setIsKPIModalOpen] = useState<boolean>(false);
  const [isColumnConfigModalOpen, setIsColumnConfigModalOpen] = useState<boolean>(false);

  // Reload when user changes
  useEffect(() => {
    const ws = CustomizationService.getWorkspaces(userId);
    const activeWs = CustomizationService.getActiveWorkspace(userId);
    setWorkspaces(ws);
    setActiveWorkspaceId(activeWs.id);
    setSavedFilters(CustomizationService.getSavedFilters(userId));
    setTradeColumns(CustomizationService.getTradeColumns(userId));
    setTradeTemplates(CustomizationService.getTradeTemplates(userId));
  }, [userId]);

  // Derive active workspace
  const activeWorkspace = React.useMemo(() => {
    const found = workspaces.find((w) => w.id === activeWorkspaceId);
    return found || workspaces[0] || CustomizationService.getDefaultWorkspaces(userId)[0];
  }, [workspaces, activeWorkspaceId, userId]);

  // Derive active theme config
  const activeTheme = React.useMemo(() => {
    const found = THEME_PRESETS.find((t) => t.id === activeWorkspace.themeId);
    return found || THEME_PRESETS[0];
  }, [activeWorkspace.themeId]);

  // Switch Workspace
  const switchWorkspace = useCallback(
    (workspaceId: string) => {
      const target = workspaces.find((w) => w.id === workspaceId);
      if (target) {
        setActiveWorkspaceId(target.id);
        CustomizationService.setActiveWorkspace(userId, target.id);
        notify.info('Workspace Switched', `Active workspace is now "${target.name}".`);
      }
    },
    [workspaces, userId, notify]
  );

  // Create Workspace
  const createWorkspace = useCallback(
    (params: { name: string; description?: string; presetType?: string }): DashboardWorkspace => {
      const created = CustomizationService.createWorkspace(userId, params);
      const updatedList = CustomizationService.getWorkspaces(userId);
      setWorkspaces(updatedList);
      setActiveWorkspaceId(created.id);
      CustomizationService.setActiveWorkspace(userId, created.id);
      notify.success('Workspace Created', `Created and switched to "${created.name}".`);
      return created;
    },
    [userId, notify]
  );

  // Duplicate Workspace
  const duplicateWorkspace = useCallback(
    (workspaceId: string): DashboardWorkspace => {
      const duplicated = CustomizationService.duplicateWorkspace(userId, workspaceId);
      const updatedList = CustomizationService.getWorkspaces(userId);
      setWorkspaces(updatedList);
      setActiveWorkspaceId(duplicated.id);
      CustomizationService.setActiveWorkspace(userId, duplicated.id);
      notify.success('Workspace Duplicated', `Duplicated as "${duplicated.name}".`);
      return duplicated;
    },
    [userId, notify]
  );

  // Delete Workspace
  const deleteWorkspace = useCallback(
    (workspaceId: string): boolean => {
      const success = CustomizationService.deleteWorkspace(userId, workspaceId);
      if (success) {
        const updatedList = CustomizationService.getWorkspaces(userId);
        setWorkspaces(updatedList);
        const newActive = CustomizationService.getActiveWorkspace(userId);
        setActiveWorkspaceId(newActive.id);
        notify.info('Workspace Removed', 'Workspace deleted.');
        return true;
      } else {
        notify.warning('Cannot Delete', 'You must maintain at least one workspace.');
        return false;
      }
    },
    [userId, notify]
  );

  // Update Workspace
  const updateWorkspace = useCallback(
    (updated: DashboardWorkspace) => {
      const saved = CustomizationService.saveWorkspace(userId, updated);
      setWorkspaces((prev) => prev.map((w) => (w.id === saved.id ? saved : w)));
    },
    [userId]
  );

  // Reset Workspaces
  const resetWorkspaces = useCallback(() => {
    const defaults = CustomizationService.resetWorkspacesToDefault(userId);
    setWorkspaces(defaults);
    setActiveWorkspaceId(defaults[0].id);
    notify.info('Workspaces Reset', 'Reset all layouts to default presets.');
  }, [userId, notify]);

  // Widget Actions on Active Workspace
  const activeWidgets = activeWorkspace.widgets || [];

  const toggleWidget = useCallback(
    (widgetId: string) => {
      const updatedWidgets = activeWidgets.map((w) =>
        w.id === widgetId ? { ...w, enabled: !w.enabled } : w
      );
      updateWorkspace({ ...activeWorkspace, widgets: updatedWidgets });
    },
    [activeWidgets, activeWorkspace, updateWorkspace]
  );

  const reorderWidgets = useCallback(
    (startIndex: number, endIndex: number) => {
      const result: CustomWidgetConfig[] = [...activeWidgets];
      const [removed] = result.splice(startIndex, 1);
      if (removed) {
        result.splice(endIndex, 0, removed);
      }
      const reindexed = result.map((item, index) => ({ ...item, order: index + 1 }));
      updateWorkspace({ ...activeWorkspace, widgets: reindexed });
    },
    [activeWidgets, activeWorkspace, updateWorkspace]
  );

  const moveWidget = useCallback(
    (widgetId: string, direction: 'UP' | 'DOWN') => {
      const index = activeWidgets.findIndex((w) => w.id === widgetId);
      if (index < 0) return;
      if (direction === 'UP' && index === 0) return;
      if (direction === 'DOWN' && index === activeWidgets.length - 1) return;

      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      reorderWidgets(index, targetIndex);
    },
    [activeWidgets, reorderWidgets]
  );

  const updateWidgetSettings = useCallback(
    (widgetId: string, updates: Partial<DashboardWidgetSetting>) => {
      const updatedWidgets = activeWidgets.map((w) => {
        if (w.id === widgetId) {
          return {
            ...w,
            customSettings: {
              ...(w.customSettings || {}),
              ...updates,
            },
          };
        }
        return w;
      });
      updateWorkspace({ ...activeWorkspace, widgets: updatedWidgets });
    },
    [activeWidgets, activeWorkspace, updateWorkspace]
  );

  const updateWidgetColSpan = useCallback(
    (widgetId: string, colSpan: 1 | 2 | 3 | 4) => {
      const updatedWidgets = activeWidgets.map((w) =>
        w.id === widgetId ? { ...w, colSpan } : w
      );
      updateWorkspace({ ...activeWorkspace, widgets: updatedWidgets });
    },
    [activeWidgets, activeWorkspace, updateWorkspace]
  );

  const updateWidgetHeight = useCallback(
    (widgetId: string, height: 'compact' | 'standard' | 'expanded') => {
      const updatedWidgets = activeWidgets.map((w) =>
        w.id === widgetId ? { ...w, height } : w
      );
      updateWorkspace({ ...activeWorkspace, widgets: updatedWidgets });
    },
    [activeWidgets, activeWorkspace, updateWorkspace]
  );

  // KPI Actions
  const selectedKPIs = activeWorkspace.kpiSelection || [
    'netPnL',
    'winRate',
    'profitFactor',
    'expectancy',
    'maxDrawdown',
    'avgRR',
  ];

  const setKPISelection = useCallback(
    (keys: KPIKey[]) => {
      updateWorkspace({ ...activeWorkspace, kpiSelection: keys });
    },
    [activeWorkspace, updateWorkspace]
  );

  const toggleKPI = useCallback(
    (kpiKey: KPIKey) => {
      let updated: KPIKey[];
      if (selectedKPIs.includes(kpiKey)) {
        if (selectedKPIs.length <= 1) {
          notify.warning('Minimum Required', 'At least one KPI must remain visible.');
          return;
        }
        updated = selectedKPIs.filter((k) => k !== kpiKey);
      } else {
        updated = [...selectedKPIs, kpiKey];
      }
      setKPISelection(updated);
    },
    [selectedKPIs, setKPISelection, notify]
  );

  // Theme & Density
  const setTheme = useCallback(
    (newThemeId: ThemePresetId) => {
      updateWorkspace({ ...activeWorkspace, themeId: newThemeId });
      notify.info('Theme Updated', `Switched theme for ${activeWorkspace.name}.`);
    },
    [activeWorkspace, updateWorkspace, notify]
  );

  const setDensity = useCallback(
    (newDensity: DisplayDensity) => {
      updateWorkspace({ ...activeWorkspace, density: newDensity });
      notify.info('Density Adjusted', `Display density set to ${newDensity}.`);
    },
    [activeWorkspace, updateWorkspace, notify]
  );

  // Saved Filters
  const saveFilterPreset = useCallback(
    (name: string, filters: DashboardFilterState, description?: string): SavedFilterPreset => {
      const saved = CustomizationService.saveFilterPreset(userId, {
        userId,
        name,
        filters,
        description,
      });
      setSavedFilters(CustomizationService.getSavedFilters(userId));
      notify.success('Filter Saved', `Preset "${name}" saved to your library.`);
      return saved;
    },
    [userId, notify]
  );

  const deleteFilterPreset = useCallback(
    (filterId: string) => {
      CustomizationService.deleteFilterPreset(userId, filterId);
      setSavedFilters(CustomizationService.getSavedFilters(userId));
      notify.info('Filter Deleted', 'Filter preset removed.');
    },
    [userId, notify]
  );

  // Trade Table Columns
  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      const updated = tradeColumns.map((col) =>
        col.id === columnId ? { ...col, visible: !col.visible } : col
      );
      setTradeColumns(updated);
      CustomizationService.saveTradeColumns(userId, updated);
    },
    [tradeColumns, userId]
  );

  const reorderColumns = useCallback(
    (startIndex: number, endIndex: number) => {
      const result = [...tradeColumns];
      const [removed] = result.splice(startIndex, 1);
      if (removed) {
        result.splice(endIndex, 0, removed);
      }
      const reindexed = result.map((item, index) => ({ ...item, order: index + 1 }));
      setTradeColumns(reindexed);
      CustomizationService.saveTradeColumns(userId, reindexed);
    },
    [tradeColumns, userId]
  );

  const resetTradeColumns = useCallback(() => {
    const defaults = CustomizationService.resetTradeColumns(userId);
    setTradeColumns(defaults);
    notify.info('Columns Reset', 'Trade log columns reset to standard default view.');
  }, [userId, notify]);

  // Trade Entry Templates
  const saveTradeTemplate = useCallback(
    (template: Omit<TradeEntryTemplate, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & { id?: string }): TradeEntryTemplate => {
      const saved = CustomizationService.saveTradeTemplate(userId, {
        ...template,
        userId,
      });
      setTradeTemplates(CustomizationService.getTradeTemplates(userId));
      notify.success('Template Saved', `Trade template "${saved.name}" is ready to use.`);
      return saved;
    },
    [userId, notify]
  );

  const deleteTradeTemplate = useCallback(
    (templateId: string) => {
      CustomizationService.deleteTradeTemplate(userId, templateId);
      setTradeTemplates(CustomizationService.getTradeTemplates(userId));
      notify.info('Template Deleted', 'Trade entry template removed.');
    },
    [userId, notify]
  );

  // Layout Export / Import
  const exportLayoutJSON = useCallback((): string => {
    return CustomizationService.exportWorkspacesJSON(userId);
  }, [userId]);

  const importLayoutJSON = useCallback(
    (jsonString: string): boolean => {
      const success = CustomizationService.importWorkspacesJSON(userId, jsonString);
      if (success) {
        const ws = CustomizationService.getWorkspaces(userId);
        setWorkspaces(ws);
        setActiveWorkspaceId(ws[0].id);
        setSavedFilters(CustomizationService.getSavedFilters(userId));
        setTradeColumns(CustomizationService.getTradeColumns(userId));
        setTradeTemplates(CustomizationService.getTradeTemplates(userId));
        notify.success('Layout Imported', 'Workspace configuration imported successfully.');
        return true;
      } else {
        notify.error('Import Failed', 'Invalid workspace configuration JSON.');
        return false;
      }
    },
    [userId, notify]
  );

  return (
    <CustomizationContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        switchWorkspace,
        createWorkspace,
        duplicateWorkspace,
        deleteWorkspace,
        updateWorkspace,
        resetWorkspaces,
        activeWidgets,
        toggleWidget,
        reorderWidgets,
        moveWidget,
        updateWidgetSettings,
        updateWidgetColSpan,
        updateWidgetHeight,
        selectedKPIs,
        setKPISelection,
        toggleKPI,
        activeTheme,
        themeId: activeWorkspace.themeId || 'cyberpunk_dark',
        setTheme,
        density: activeWorkspace.density || 'standard',
        setDensity,
        savedFilters,
        saveFilterPreset,
        deleteFilterPreset,
        tradeColumns,
        toggleColumnVisibility,
        reorderColumns,
        resetTradeColumns,
        tradeTemplates,
        saveTradeTemplate,
        deleteTradeTemplate,
        exportLayoutJSON,
        importLayoutJSON,
        isWorkspaceModalOpen,
        openWorkspaceModal: () => setIsWorkspaceModalOpen(true),
        closeWorkspaceModal: () => setIsWorkspaceModalOpen(false),
        isKPIModalOpen,
        openKPIModal: () => setIsKPIModalOpen(true),
        closeKPIModal: () => setIsKPIModalOpen(false),
        isColumnConfigModalOpen,
        openColumnConfigModal: () => setIsColumnConfigModalOpen(true),
        closeColumnConfigModal: () => setIsColumnConfigModalOpen(false),
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = (): CustomizationContextType => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
};
