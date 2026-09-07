/**
 * Professional Reporting & Audit Tearsheet Suite
 */

import React, { useState, useMemo } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { ReportType, ReportFilterState, GeneratedReportData } from '../../types/reports';
import { ReportingEngine } from '../../services/reportingEngine';
import { ReportFilters } from './ReportFilters';
import { ExecutiveSummarySection } from './ExecutiveSummarySection';
import { DailyReportSection } from './DailyReportSection';
import { WeeklyReportSection } from './WeeklyReportSection';
import { MonthlyReportSection } from './MonthlyReportSection';
import { AccountReportSection } from './AccountReportSection';
import { StrategyReportSection } from './StrategyReportSection';
import { PlaybookReportSection } from './PlaybookReportSection';
import { PropFirmReportSection } from './PropFirmReportSection';
import { PsychologyReportSection } from './PsychologyReportSection';
import { RiskReportSection } from './RiskReportSection';
import { TradeHistoryReportSection } from './TradeHistoryReportSection';
import { PrintableTearsheet } from './PrintableTearsheet';
import { EmptyState } from '../ui/EmptyState';
import { FileText } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { trades, accounts, strategies, playbooks, propFirmRules, selectedAccountId } = useTradeOS();

  // State
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('EXECUTIVE_SUMMARY');
  const [filters, setFilters] = useState<ReportFilterState>({
    accountId: selectedAccountId || 'ALL',
    datePreset: 'ALL_TIME',
    strategyId: 'ALL',
    playbookId: 'ALL',
    instrument: 'ALL',
    assetClass: 'ALL',
  });
  const [copiedTsv, setCopiedTsv] = useState(false);

  // Filter Updates Handler
  const handleFilterChange = (updates: Partial<ReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Generate Report Data reactively
  const reportData: GeneratedReportData = useMemo(() => {
    return ReportingEngine.generateReport(
      selectedReportType,
      trades,
      accounts,
      strategies,
      playbooks,
      propFirmRules,
      filters
    );
  }, [selectedReportType, trades, accounts, strategies, playbooks, propFirmRules, filters]);

  // Export CSV Action
  const handleExportCsv = () => {
    const csvContent = ReportingEngine.exportReportToCsv(reportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportType.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON Action
  const handleExportJson = () => {
    const jsonContent = ReportingEngine.exportReportToJson(reportData);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedReportType.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy TSV to Clipboard Action
  const handleCopyTsv = async () => {
    try {
      const tsvContent = ReportingEngine.exportReportToSpreadsheetData(reportData);
      await navigator.clipboard.writeText(tsvContent);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    } catch (err) {
      console.error('Failed to copy TSV to clipboard', err);
    }
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Screen View: Interactive Controls and Viewer */}
      <div className="print:hidden space-y-6">
        <ReportFilters
          selectedReportType={selectedReportType}
          onSelectReportType={setSelectedReportType}
          filters={filters}
          onFilterChange={handleFilterChange}
          accounts={accounts}
          strategies={strategies}
          playbooks={playbooks}
          onPrint={handlePrint}
          onExportCsv={handleExportCsv}
          onExportJson={handleExportJson}
          onCopyTsv={handleCopyTsv}
          copiedTsv={copiedTsv}
          totalFilteredTrades={reportData.tradeCount}
        />

        {/* Dynamic Report View based on selectedReportType */}
        <div className="min-h-[400px]">
          {selectedReportType === 'EXECUTIVE_SUMMARY' && (
            <ExecutiveSummarySection data={reportData as any} />
          )}

          {selectedReportType === 'DAILY' && (
            <DailyReportSection data={reportData as any} />
          )}

          {selectedReportType === 'WEEKLY' && (
            <WeeklyReportSection data={reportData as any} />
          )}

          {selectedReportType === 'MONTHLY' && (
            <MonthlyReportSection data={reportData as any} />
          )}

          {selectedReportType === 'ACCOUNT' && (
            <AccountReportSection data={reportData as any} />
          )}

          {selectedReportType === 'STRATEGY' && (
            <StrategyReportSection data={reportData as any} />
          )}

          {selectedReportType === 'PLAYBOOK' && (
            <PlaybookReportSection data={reportData as any} />
          )}

          {selectedReportType === 'PROP_FIRM' && (
            <PropFirmReportSection data={reportData as any} />
          )}

          {selectedReportType === 'PSYCHOLOGY' && (
            <PsychologyReportSection data={reportData as any} />
          )}

          {selectedReportType === 'RISK' && (
            <RiskReportSection data={reportData as any} />
          )}

          {selectedReportType === 'TRADE_HISTORY' && (
            <TradeHistoryReportSection data={reportData as any} />
          )}
        </div>
      </div>

      {/* Print View: Printable Audit Document for PDF / Physical Print */}
      <PrintableTearsheet reportData={reportData} />
    </div>
  );
};
