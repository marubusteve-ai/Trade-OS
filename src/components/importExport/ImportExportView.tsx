/**
 * Primary Import / Export Subsystem View
 * 
 * Provides unified access to:
 * - 4-step interactive CSV & statement import wizard
 * - Multi-criteria CSV & JSON data export center
 * - Audit logs & 1-click batch rollback control
 * - Platform adapter documentation & downloadable CSV templates
 */

import React, { useState } from 'react';
import { 
  UploadCloud, 
  Download, 
  History, 
  BookOpen, 
  FileSpreadsheet, 
  Layers, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { ImportWizard } from './ImportWizard';
import { ExportCenter } from './ExportCenter';
import { ImportHistoryView } from './ImportHistoryView';
import { SupportedAdaptersGuide } from './SupportedAdaptersGuide';
import { useTradeOS } from '../../context/TradeOSContext';
import { Button } from '../ui/Button';

export const ImportExportView: React.FC = () => {
  const [subTab, setSubTab] = useState<'IMPORT' | 'EXPORT' | 'HISTORY' | 'GUIDES'>('IMPORT');
  const { importBatches } = useTradeOS();

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#22252A]">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-emerald-400" />
            <span>Trading Data Import & Export Engine</span>
          </h1>
          <p className="text-xs text-[#848B98] mt-1">
            Import statements from MetaTrader, cTrader, TradingView, NinjaTrader, or export journal datasets.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-2 bg-[#121417] p-1 rounded-xl border border-[#22252A] overflow-x-auto">
          <Button
            variant={subTab === 'IMPORT' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('IMPORT')}
            className="text-xs font-semibold"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Import Wizard
          </Button>

          <Button
            variant={subTab === 'EXPORT' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('EXPORT')}
            className="text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Center
          </Button>

          <Button
            variant={subTab === 'HISTORY' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('HISTORY')}
            className="text-xs font-semibold relative"
          >
            <History className="h-3.5 w-3.5 mr-1.5" /> 
            <span>History & Rollback</span>
            {importBatches.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                {importBatches.length}
              </span>
            )}
          </Button>

          <Button
            variant={subTab === 'GUIDES' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('GUIDES')}
            className="text-xs font-semibold"
          >
            <BookOpen className="h-3.5 w-3.5 mr-1.5" /> Adapters & Templates
          </Button>
        </div>
      </div>

      {/* Tab Panels */}
      {subTab === 'IMPORT' && <ImportWizard />}
      {subTab === 'EXPORT' && <ExportCenter />}
      {subTab === 'HISTORY' && <ImportHistoryView />}
      {subTab === 'GUIDES' && <SupportedAdaptersGuide />}
    </div>
  );
};
