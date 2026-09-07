import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  User,
  Clock,
  RefreshCw,
  Server,
  Lock,
  Eye,
  Sliders,
  Database,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { AuditLogService } from '../../services/auditLogService';
import { AuditLogEntry, AuditEventType, AuditSeverity, DataIntegrityReport } from '../../types/security';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input, Select } from '../ui/Input';
import { formatDate } from '../../lib/utils';

export const AuditLogView: React.FC = () => {
  const { currentUser } = useAuth();
  const { notify } = useNotification();
  const userId = currentUser?.id || 'anonymous_user';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<AuditEventType | 'ALL'>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<AuditSeverity | 'ALL'>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  // Data Integrity Report state
  const [integrityReport, setIntegrityReport] = useState<DataIntegrityReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [userId]);

  const loadLogs = () => {
    const data = AuditLogService.getLogs(userId);
    setLogs(data);
  };

  const runIntegrityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const report = AuditLogService.verifyDataIntegrity(userId);
      setIntegrityReport(report);
      setIsScanning(false);
      if (report.passed) {
        notify.success('Integrity Verified', `Scanned ${report.totalRecordsChecked} records. Zero tenant leaks or orphaned records found.`);
      } else {
        notify.warning('Integrity Issues Found', `Found ${report.issues.length} discrepancies in local ledger.`);
      }
    }, 400);
  };

  const handleExportJSON = () => {
    const jsonStr = AuditLogService.exportLogsJSON(userId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradeos_audit_trail_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Audit Log Exported', 'JSON audit trail file downloaded.');
  };

  const handleExportCSV = () => {
    const csvStr = AuditLogService.exportLogsCSV(userId);
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tradeos_audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify.success('Audit Log Exported', 'CSV audit trail file downloaded.');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedEventType !== 'ALL' && log.eventType !== selectedEventType) return false;
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          log.summary.toLowerCase().includes(q) ||
          log.actor.toLowerCase().includes(q) ||
          (log.entityId && log.entityId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [logs, selectedEventType, selectedSeverity, search]);

  const getSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'SECURITY':
      case 'CRITICAL':
        return <Badge variant="danger" className="text-[10px]">{severity}</Badge>;
      case 'WARNING':
        return <Badge variant="warning" className="text-[10px]">{severity}</Badge>;
      default:
        return <Badge variant="neutral" className="text-[10px] text-[#848B98]">{severity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#22252A] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
              Audit Trail & Security Telemetry
            </h1>
            <Badge variant="primary" className="text-[10px] uppercase font-sans">
              Immutable Log
            </Badge>
          </div>
          <p className="text-xs text-[#848B98] mt-1">
            Tamper-evident audit ledger capturing trades, balance modifications, prop firm rule evaluations, and system integrity diagnostics.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            size="md"
            onClick={runIntegrityScan}
            disabled={isScanning}
            className="text-xs border-emerald-500/30 text-emerald-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>Verify Tenant Isolation</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleExportCSV}
            className="text-xs border-[#22252A]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleExportJSON}
            className="text-xs border-[#22252A]"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            <span>Export JSON</span>
          </Button>
        </div>
      </div>

      {/* Diagnostics Banner if scanned */}
      {integrityReport && (
        <Card className={`p-4 border ${
          integrityReport.passed ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-amber-950/20 border-amber-500/30'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {integrityReport.passed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
              )}
              <div>
                <h3 className="text-sm font-bold text-white font-mono">
                  {integrityReport.passed ? 'Tenant Isolation & Ledger Integrity: Verified' : 'Integrity Discrepancies Detected'}
                </h3>
                <p className="text-xs text-[#848B98] mt-0.5">
                  Checked {integrityReport.totalRecordsChecked} records across accounts, trades, strategies, and workspaces.
                  {integrityReport.passed ? ' 0 tenant leaks or orphaned records.' : ` ${integrityReport.issues.length} warnings detected.`}
                </p>
              </div>
            </div>
            <span className="text-[10px] text-[#606773] font-mono">
              Scanned: {formatDate(integrityReport.timestamp)}
            </span>
          </div>

          {integrityReport.issues.length > 0 && (
            <div className="mt-3 p-2.5 bg-[#0C0D0F] rounded text-xs font-mono space-y-1 text-amber-300 border border-[#22252A]">
              {integrityReport.issues.map((iss, idx) => (
                <div key={idx} className="flex items-start space-x-1.5">
                  <span className="text-amber-400">•</span>
                  <span>{iss}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          placeholder="Search by summary, actor, or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-[#848B98]" />}
        />

        <Select
          value={selectedEventType}
          onChange={(e) => setSelectedEventType(e.target.value as AuditEventType | 'ALL')}
          options={[
            { value: 'ALL', label: 'All Event Types' },
            { value: 'TRADE_CREATE', label: 'Trade Created' },
            { value: 'TRADE_UPDATE', label: 'Trade Updated' },
            { value: 'TRADE_DELETE', label: 'Trade Deleted' },
            { value: 'ACCOUNT_UPDATE', label: 'Account Modified' },
            { value: 'RULE_BREACH', label: 'Prop Firm Breach' },
            { value: 'IMPORT_EXECUTE', label: 'CSV Import' },
            { value: 'WORKSPACE_SAVE', label: 'Workspace Saved' },
            { value: 'INTEGRATION_CONFIG_UPDATE', label: 'Integration Changed' },
          ]}
        />

        <Select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value as AuditSeverity | 'ALL')}
          options={[
            { value: 'ALL', label: 'All Severities' },
            { value: 'INFO', label: 'Info' },
            { value: 'WARNING', label: 'Warning' },
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'SECURITY', label: 'Security' },
          ]}
        />
      </div>

      {/* Logs Table */}
      <Card className="bg-[#15171A] border-[#22252A] overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#848B98]">
            <FileText className="h-8 w-8 text-[#606773] mx-auto mb-2" />
            <p className="font-semibold text-[#D1D5DB]">No audit log entries found</p>
            <p className="text-[#848B98] mt-1">Actions taken across trades, accounts, and settings will appear in this immutable trail.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-[#0C0D0F] border-b border-[#22252A] text-[#848B98] uppercase text-[10px] tracking-wider select-none">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-3 font-semibold">Severity</th>
                  <th className="py-2.5 px-3 font-semibold">Event Type</th>
                  <th className="py-2.5 px-3 font-semibold">Actor / Entity</th>
                  <th className="py-2.5 px-4 font-semibold">Action Summary</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22252A]">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-[#1A1D21] transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-4 text-[#848B98] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-3">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="py-2.5 px-3 text-[#D1D5DB] whitespace-nowrap">
                      <span className="text-emerald-400 font-sans">{log.actor}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-[#606773] block truncate max-w-[120px]">
                          {log.entityType}: {log.entityId}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-[#F3F4F6] font-sans">
                      {log.summary}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[#848B98] group-hover:text-white">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <Card className="w-full max-w-xl bg-[#15171A] border-[#22252A] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#22252A] pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  Audit Entry: {selectedLog.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-[#848B98] hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-2 p-3 bg-[#0C0D0F] rounded border border-[#22252A]">
                <div>
                  <span className="text-[#848B98] block">Timestamp:</span>
                  <span className="text-white">{formatDate(selectedLog.timestamp)}</span>
                </div>
                <div>
                  <span className="text-[#848B98] block">Event Type:</span>
                  <span className="text-emerald-400 font-bold">{selectedLog.eventType}</span>
                </div>
                <div>
                  <span className="text-[#848B98] block">Actor:</span>
                  <span className="text-white">{selectedLog.actor}</span>
                </div>
                <div>
                  <span className="text-[#848B98] block">Entity:</span>
                  <span className="text-white">{selectedLog.entityType} ({selectedLog.entityId || 'N/A'})</span>
                </div>
              </div>

              <div>
                <span className="text-[#848B98] block mb-1">Summary Description:</span>
                <p className="p-2.5 bg-[#0C0D0F] rounded border border-[#22252A] text-white font-sans">
                  {selectedLog.summary}
                </p>
              </div>

              {selectedLog.details && (
                <div>
                  <span className="text-[#848B98] block mb-1">Payload Telemetry:</span>
                  <pre className="p-2.5 bg-[#0C0D0F] rounded border border-[#22252A] text-emerald-300 overflow-x-auto text-[11px] max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.previousState && (
                <div>
                  <span className="text-[#848B98] block mb-1">Previous State Snapshot:</span>
                  <pre className="p-2 bg-[#0C0D0F] rounded border border-[#22252A] text-[#9CA3AF] overflow-x-auto text-[10px] max-h-36">
                    {JSON.stringify(selectedLog.previousState, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#22252A] flex justify-end">
              <Button variant="outline" size="md" onClick={() => setSelectedLog(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
