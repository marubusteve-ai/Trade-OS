import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useCustomization } from '../../../context/CustomizationContext';
import { DashboardFilterState } from '../../../types/calculations';
import { 
  Bookmark, 
  Plus, 
  Trash2, 
  Check, 
  Filter, 
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface SavedFiltersDropdownProps {
  currentFilters: DashboardFilterState;
  onApplyFilter: (filters: DashboardFilterState) => void;
}

export const SavedFiltersDropdown: React.FC<SavedFiltersDropdownProps> = ({
  currentFilters,
  onApplyFilter,
}) => {
  const { savedFilters, saveFilterPreset, deleteFilterPreset } = useCustomization();
  const [isOpen, setIsOpen] = useState(false);
  const [isSavingNew, setIsSavingNew] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [newFilterDesc, setNewFilterDesc] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim()) return;

    saveFilterPreset(newFilterName.trim(), currentFilters, newFilterDesc.trim());
    setNewFilterName('');
    setNewFilterDesc('');
    setIsSavingNew(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs border-[#2B303B] text-[#848B98] hover:text-white hover:border-[#3B82F6]/50 gap-1.5"
      >
        <Bookmark className="w-3.5 h-3.5 text-blue-400" />
        <span>Saved Views & Filters ({savedFilters.length})</span>
        <ChevronDown className="w-3 h-3 text-[#555C68]" />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop click closer */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          {/* Popover Menu */}
          <div className="absolute right-0 mt-1.5 w-80 bg-[#15171A] border border-[#2B303B] rounded-lg shadow-2xl z-50 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#22252A]">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                Saved Filter Presets
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSavingNew(!isSavingNew)}
                className="h-6 text-[11px] text-emerald-400 hover:text-emerald-300 gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Save Current</span>
              </Button>
            </div>

            {/* Quick Save Current Form */}
            {isSavingNew && (
              <form onSubmit={handleSave} className="p-2.5 bg-[#0C0D0F] rounded border border-emerald-500/40 space-y-2">
                <span className="text-[11px] font-semibold text-emerald-400 block">Save Current Filters</span>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g. London Forex Scalps"
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  value={newFilterDesc}
                  onChange={(e) => setNewFilterDesc(e.target.value)}
                  placeholder="Notes / description (optional)"
                  className="w-full bg-[#181B21] border border-[#2B303B] rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <div className="flex justify-end gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSavingNew(false)}
                    className="h-6 text-[10px]"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    Save Preset
                  </Button>
                </div>
              </form>
            )}

            {/* Presets List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {savedFilters.length === 0 ? (
                <div className="text-center py-4 text-xs text-[#555C68]">No saved filter presets yet.</div>
              ) : (
                savedFilters.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-2 rounded bg-[#111316] border border-[#1F2228] hover:border-[#2E333C] transition-colors flex items-center justify-between gap-2 group"
                  >
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => {
                        onApplyFilter(preset.filters);
                        setIsOpen(false);
                      }}
                    >
                      <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                        {preset.name}
                      </div>
                      {preset.description && (
                        <div className="text-[10.5px] text-[#848B98] truncate">{preset.description}</div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFilterPreset(preset.id);
                      }}
                      className="h-6 w-6 p-0 text-[#555C68] hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
