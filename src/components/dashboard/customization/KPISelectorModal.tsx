import React, { useState, useMemo } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useCustomization } from '../../../context/CustomizationContext';
import { ALL_KPI_DEFINITIONS } from '../../../services/customizationService';
import { KPIKey, KPIDefinition } from '../../../types/customization';
import { 
  Check, 
  Search, 
  RotateCcw, 
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  Sparkles
} from 'lucide-react';

export const KPISelectorModal: React.FC = () => {
  const {
    selectedKPIs,
    setKPISelection,
    toggleKPI,
    isKPIModalOpen,
    closeKPIModal,
  } = useCustomization();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const filteredKPIs = useMemo(() => {
    return ALL_KPI_DEFINITIONS.filter((kpi) => {
      const matchesSearch =
        kpi.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'ALL' || kpi.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const applyPreset = (keys: KPIKey[]) => {
    setKPISelection(keys);
  };

  const moveKpiInSelection = (kpiKey: KPIKey, direction: 'UP' | 'DOWN') => {
    const index = selectedKPIs.indexOf(kpiKey);
    if (index < 0) return;
    if (direction === 'UP' && index === 0) return;
    if (direction === 'DOWN' && index === selectedKPIs.length - 1) return;

    const result = Array.from(selectedKPIs);
    const [removed] = result.splice(index, 1);
    result.splice(direction === 'UP' ? index - 1 : index + 1, 0, removed);
    setKPISelection(result);
  };

  return (
    <Modal
      isOpen={isKPIModalOpen}
      onClose={closeKPIModal}
      title="Customize Primary Key Performance Indicators (KPIs)"
      size="lg"
    >
      <div className="space-y-5">
        {/* Presets Quick-Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#848B98] mb-2">
            Quick KPI Presets
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(['netPnL', 'winRate', 'profitFactor', 'expectancy', 'maxDrawdown', 'avgRR'])}
              className="text-xs border-[#2B303B] hover:border-emerald-500/50 justify-start"
            >
              Executive Core (6)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(['netPnL', 'maxDrawdown', 'winRate', 'profitFactor', 'recoveryFactor', 'maxLossStreak'])}
              className="text-xs border-[#2B303B] hover:border-emerald-500/50 justify-start"
            >
              Prop Risk Audit (6)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(['sharpeRatio', 'sortinoRatio', 'expectancy', 'payoffRatio', 'kellyCriterion', 'avgRR'])}
              className="text-xs border-[#2B303B] hover:border-emerald-500/50 justify-start"
            >
              Statistical Edge (6)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => applyPreset(['netPnL', 'winRate', 'totalTrades', 'averageWin', 'averageLoss', 'avgHoldingTime'])}
              className="text-xs border-[#2B303B] hover:border-emerald-500/50 justify-start"
            >
              Execution Deep (6)
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#555C68]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 20 quantitative performance metrics..."
              className="w-full bg-[#0C0D0F] border border-[#2B303B] rounded pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#0F1012] p-0.5 rounded border border-[#22252A] shrink-0">
            {['ALL', 'FINANCIAL', 'STATISTICAL', 'RISK', 'EXECUTION'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded text-[10.5px] font-medium transition-colors ${
                  selectedCategory === cat ? 'bg-[#22252A] text-white' : 'text-[#848B98] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredKPIs.map((kpi) => {
            const isSelected = selectedKPIs.includes(kpi.key);
            const selectionIndex = selectedKPIs.indexOf(kpi.key);

            return (
              <div
                key={kpi.key}
                onClick={() => toggleKPI(kpi.key)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-[#181B21] border-emerald-500/60 shadow-sm'
                    : 'bg-[#121417] border-[#22252A] hover:border-[#2E333C]'
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-[#383D4A] bg-[#0C0D0F]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{kpi.label}</span>
                      <Badge variant="zinc" className="text-[9px] py-0 px-1">
                        {kpi.category}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#848B98] mt-0.5 line-clamp-2">{kpi.description}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex flex-col gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => moveKpiInSelection(kpi.key, 'UP')}
                      title="Move Left/Earlier"
                      className="p-1 hover:bg-[#2B303B] rounded text-[#848B98] hover:text-white"
                    >
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveKpiInSelection(kpi.key, 'DOWN')}
                      title="Move Right/Later"
                      className="p-1 hover:bg-[#2B303B] rounded text-[#848B98] hover:text-white"
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="flex items-center justify-between pt-3 border-t border-[#22252A]">
          <div className="text-xs text-[#848B98]">
            <strong className="text-white">{selectedKPIs.length}</strong> KPIs currently active on top hero grid.
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={closeKPIModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4"
          >
            Apply KPI Layout
          </Button>
        </div>
      </div>
    </Modal>
  );
};
