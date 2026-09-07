import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Info,
  Filter
} from 'lucide-react';
import { AutomationExecutionLog, NotificationSeverity } from '../../types/automation';
import { Badge } from '../ui/Badge';

interface AutomationLogsTableProps {
  logs: AutomationExecutionLog[];
  onClearLogs: () => Promise<void>;
}

export const AutomationLogsTable: React.FC<AutomationLogsTableProps> = ({
  logs,
  onClearLogs,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'SKIPPED' | 'FAILED'>('ALL');
  const [isClearing, setIsClearing] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.ruleName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.instrument && log.instrument.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.accountName && log.accountName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleClear = async () => {
    if (confirm('Are you sure you want to clear all automation execution audit logs?')) {
      setIsClearing(true);
      await onClearLogs();
      setIsClearing(false);
    }
  };

  const getSeverityBadge = (sev: NotificationSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return <Badge variant="outline" className="border-[#EF4444]/40 text-[#EF4444] bg-[#EF4444]/10 text-[10px]">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="outline" className="border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10 text-[10px]">WARNING</Badge>;
      case 'SUCCESS':
        return <Badge variant="outline" className="border-[#10B981]/40 text-[#10B981] bg-[#10B981]/10 text-[10px]">SUCCESS</Badge>;
      case 'INFO':
      default:
        return <Badge variant="outline" className="border-[#3B82F6]/40 text-[#3B82F6] bg-[#3B82F6]/10 text-[10px]">INFO</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />;
      case 'WARNING':
        return <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />;
      case 'SKIPPED':
        return <Clock className="w-3.5 h-3.5 text-[#9CA3AF]" />;
      case 'FAILED':
      default:
        return <XCircle className="w-3.5 h-3.5 text-[#EF4444]" />;
    }
  };

  return (
    <div className="bg-[#121316] border border-[#23272E] rounded-xl overflow-hidden shadow-sm">
      {/* Header & Controls */}
      <div className="p-4 border-b border-[#23272E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#16181D]">
        <div className="flex items-center space-x-2.5">
          <History className="w-4 h-4 text-[#3B82F6]" />
          <h3 className="font-semibold text-xs text-[#F3F4F6] uppercase tracking-wider">
            Execution Audit Log ({logs.length})
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit logs..."
              className="bg-[#1E2128] border border-[#2B303B] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F3F4F6] placeholder-[#6B7280] focus:outline-none focus:border-[#3B82F6] w-44 sm:w-56"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-[#1E2128] border border-[#2B303B] rounded-lg px-2.5 py-1.5 text-xs text-[#F3F4F6] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="ALL">All Status</option>
            <option value="SUCCESS">Success Only</option>
            <option value="SKIPPED">Skipped Only</option>
            <option value="FAILED">Failed Only</option>
          </select>

          {/* Clear button */}
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              disabled={isClearing}
              className="p-1.5 text-[#9CA3AF] hover:text-[#EF4444] hover:bg-[#1E2128] rounded-lg transition-colors"
              title="Clear audit logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto custom-scrollbar">
        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center text-[#6B7280]">
            <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">No execution audit events recorded yet.</p>
            <p className="text-[11px] text-[#4B5563] mt-1">
              Events will log here automatically whenever automation rules trigger or evaluate.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#23272E] bg-[#14161A] text-[#9CA3AF] text-[11px] font-medium">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Trigger Event & Rule</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Condition Snapshot</th>
                <th className="py-3 px-4">Dispatched Actions</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2128]">
              {filteredLogs.map((log) => {
                const triggeredDate = new Date(log.triggeredAt);
                const timeString = triggeredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateString = triggeredDate.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <tr key={log.id} className="hover:bg-[#16181D]/60 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-xs text-[#F3F4F6] font-mono">{timeString}</div>
                      <div className="text-[10px] text-[#6B7280]">{dateString}</div>
                    </td>

                    {/* Rule & Target */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getSeverityBadge(log.severity)}
                        <span className="font-medium text-[#F3F4F6] truncate max-w-xs">{log.ruleName}</span>
                      </div>
                      <div className="text-[11px] text-[#9CA3AF] mt-0.5 flex items-center space-x-2">
                        <span className="font-mono text-[10px] bg-[#1E2128] px-1.5 py-0.5 rounded text-[#9CA3AF]">
                          {log.triggerEvent}
                        </span>
                        {log.instrument && (
                          <span className="text-[#3B82F6] font-semibold">{log.instrument}</span>
                        )}
                        {log.accountName && (
                          <span className="text-[#6B7280]">({log.accountName})</span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-xs text-[#9CA3AF] bg-[#1A1D24] border border-[#2B303B] px-2 py-0.5 rounded">
                        {log.category}
                      </span>
                    </td>

                    {/* Condition Snapshot */}
                    <td className="py-3 px-4">
                      <div className="text-xs text-[#F3F4F6]">
                        <span className="text-[#9CA3AF]">{log.conditionSnapshot.evaluatedMetric}:</span>{' '}
                        <span className="font-semibold text-[#F59E0B] font-mono">
                          {String(log.conditionSnapshot.actualValue)}
                        </span>
                        <span className="text-[#6B7280] mx-1">vs target</span>
                        <span className="font-mono text-[#9CA3AF]">
                          {String(log.conditionSnapshot.thresholdValue)}
                        </span>
                      </div>
                    </td>

                    {/* Dispatched Actions */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {log.actionsExecuted.map((act, idx) => (
                          <div key={idx} className="text-[11px] flex items-center space-x-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                act.status === 'SUCCESS'
                                  ? 'bg-[#10B981]'
                                  : act.status.startsWith('SKIPPED')
                                  ? 'bg-[#F59E0B]'
                                  : 'bg-[#EF4444]'
                              }`}
                            />
                            <span className="text-[#D1D5DB] font-medium">{act.actionType}</span>
                            <span className="text-[#6B7280] text-[10px] truncate max-w-xs">
                              {act.detail ? `(${act.detail})` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5 bg-[#1E2128] border border-[#2B303B] px-2 py-1 rounded-md">
                        {getStatusIcon(log.status)}
                        <span
                          className={`text-[11px] font-medium ${
                            log.status === 'SUCCESS'
                              ? 'text-[#10B981]'
                              : log.status === 'SKIPPED'
                              ? 'text-[#9CA3AF]'
                              : 'text-[#EF4444]'
                          }`}
                        >
                          {log.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
