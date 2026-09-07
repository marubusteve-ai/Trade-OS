/**
 * Reporting Engine Filter Toolbar & Control Bar
 */

import React from 'react';
import { Account, Strategy, Playbook, AssetClass } from '../../types/domain';
import { ReportType, ReportFilterState, DateRangePreset } from '../../types/reports';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import {
  FileText,
  Calendar,
  CalendarDays,
  CalendarRange,
  Layers,
  BookOpen,
  ShieldAlert,
  Brain,
  Award,
  ListOrdered,
  Briefcase,
  Printer,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface ReportFiltersProps {
  selectedReportType: ReportType;
  onSelectReportType: (type: ReportType) => void;
  filters: ReportFilterState;
  onFilterChange: (updates: Partial<ReportFilterState>) => void;
  accounts: Account[];
  strategies: Strategy[];
  playbooks: Playbook[];
  onPrint: () => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onCopyTsv: () => void;
  copiedTsv: boolean;
  totalFilteredTrades: number;
}

const REPORT_TABS: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'EXECUTIVE_SUMMARY', label: 'Executive Tearsheet', icon: FileText },
  { id: 'DAILY', label: 'Daily Breakdown', icon: CalendarDays },
  { id: 'WEEKLY', label: 'Weekly Rollup', icon: CalendarRange },
  { id: 'MONTHLY', label: 'Monthly Statement', icon: Calendar },
  { id: 'ACCOUNT', label: 'Account Audit', icon: Briefcase },
  { id: 'STRATEGY', label: 'Strategy Attribution', icon: Layers },
  { id: 'PLAYBOOK', label: 'Playbook Discipline', icon: BookOpen },
  { id: 'PROP_FIRM', label: 'Prop Firm Compliance', icon: Award },
  { id: 'PSYCHOLOGY', label: 'Psychology & Tilt', icon: Brain },
  { id: 'RISK', label: 'Risk Exposure Audit', icon: ShieldAlert },
  { id: 'TRADE_HISTORY', label: 'Trade Ledger', icon: ListOrdered },
];

export const ReportFilters: React.FC<ReportFiltersProps> = ({
  selectedReportType,
  onSelectReportType,
  filters,
  onFilterChange,
  accounts,
  strategies,
  playbooks,
  onPrint,
  onExportCsv,
  onExportJson,
  onCopyTsv,
  copiedTsv,
  totalFilteredTrades,
}) => {
  return (
    <div className="space-y-4">
      {/* Top Header Row with Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-[#22252A]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F3F4F6]">
              Professional Reporting & Audit Tearsheets
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
              INSTITUTIONAL GRADE
            </span>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Deterministic financial statements, multi-timeframe performance tear-sheets, compliance certificates, and export engine.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="border-[#2B303B] hover:border-emerald-500/50 hover:text-emerald-400"
            title="Print or Save as PDF"
          >
            <Printer className="h-4 w-4 mr-1.5" />
            <span>Print / PDF</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onCopyTsv}
            className="border-[#2B303B] hover:border-blue-500/50 hover:text-blue-400"
            title="Copy spreadsheet-ready tab-delimited data to clipboard"
          >
            {copiedTsv ? <Check className="h-4 w-4 mr-1.5 text-emerald-400" /> : <Copy className="h-4 w-4 mr-1.5" />}
            <span>{copiedTsv ? 'Copied Sheets TSV' : 'Copy for Sheets'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportJson}
            className="border-[#2B303B] hover:border-purple-500/50 hover:text-purple-400"
            title="Export full JSON structure"
          >
            <FileSpreadsheet className="h-4 w-4 mr-1.5" />
            <span>JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExportCsv}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
            title="Download standard CSV report"
          >
            <Download className="h-4 w-4 mr-1.5" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* 11 Report Types Horizontal Scroll Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#22252A] scrollbar-track-transparent">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedReportType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectReportType(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-sm'
                  : 'bg-[#121418] text-[#848B98] hover:text-[#F3F4F6] hover:bg-[#1A1D24] border border-[#22252A]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-[#848B98]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Control Strip */}
      <div className="bg-[#0C0D0F] border border-[#22252A] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#848B98]">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-semibold text-[#C5C9D3]">Filters:</span>
          </div>

          {/* Account Filter */}
          <div className="min-w-[160px]">
            <Select
              value={filters.accountId}
              onChange={(e) => onFilterChange({ accountId: e.target.value })}
              className="py-1 text-xs bg-[#121418] border-[#22252A]"
            >
              <option value="ALL">All Accounts (Consolidated)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.broker || acc.type})
                </option>
              ))}
            </Select>
          </div>

          {/* Date Range Preset */}
          <div className="min-w-[140px]">
            <Select
              value={filters.datePreset}
              onChange={(e) => {
                const preset = e.target.value as DateRangePreset;
                onFilterChange({ datePreset: preset });
              }}
              className="py-1 text-xs bg-[#121418] border-[#22252A]"
            >
              <option value="ALL_TIME">All Time</option>
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="LAST_WEEK">Last Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="LAST_30_DAYS">Last 30 Days</option>
              <option value="LAST_90_DAYS">Last 90 Days</option>
              <option value="YEAR_TO_DATE">Year To Date</option>
              <option value="CUSTOM">Custom Range...</option>
            </Select>
          </div>

          {/* Custom Date Inputs if CUSTOM is active */}
          {filters.datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-1.5">
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ startDate: e.target.value })}
                className="py-1 px-2 text-xs bg-[#121418] border-[#22252A]"
              />
              <span className="text-[#848B98]">to</span>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ endDate: e.target.value })}
                className="py-1 px-2 text-xs bg-[#121418] border-[#22252A]"
              />
            </div>
          )}

          {/* Strategy Filter */}
          <div className="min-w-[140px]">
            <Select
              value={filters.strategyId || 'ALL'}
              onChange={(e) => onFilterChange({ strategyId: e.target.value })}
              className="py-1 text-xs bg-[#121418] border-[#22252A]"
            >
              <option value="ALL">All Strategies</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Playbook Filter */}
          <div className="min-w-[140px]">
            <Select
              value={filters.playbookId || 'ALL'}
              onChange={(e) => onFilterChange({ playbookId: e.target.value })}
              className="py-1 text-xs bg-[#121418] border-[#22252A]"
            >
              <option value="ALL">All Playbooks</option>
              {playbooks.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>

          {/* Reset Filters button if any filter applied */}
          {(filters.accountId !== 'ALL' || filters.datePreset !== 'ALL_TIME' || (filters.strategyId && filters.strategyId !== 'ALL') || (filters.playbookId && filters.playbookId !== 'ALL')) && (
            <button
              onClick={() =>
                onFilterChange({
                  accountId: 'ALL',
                  datePreset: 'ALL_TIME',
                  startDate: undefined,
                  endDate: undefined,
                  strategyId: 'ALL',
                  playbookId: 'ALL',
                  instrument: 'ALL',
                  assetClass: 'ALL',
                })
              }
              className="flex items-center gap-1 text-[11px] text-[#848B98] hover:text-rose-400 transition-colors"
              title="Reset all filters"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Filtered Count Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#848B98]">Evaluated:</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#1A1D24] text-emerald-400 border border-[#2B303B]">
            {totalFilteredTrades} trades
          </span>
        </div>
      </div>
    </div>
  );
};
