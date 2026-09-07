import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Wallet, 
  Filter, 
  ShieldCheck, 
  TrendingUp, 
  Layers,
  ArrowUpRight,
  AlertTriangle,
  LayoutGrid,
  List,
  Search,
  FolderTree,
  Archive,
  RefreshCw,
  Copy,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { useTradeOS } from '../../context/TradeOSContext';
import { Account, AccountType, AccountStatus } from '../../types/domain';
import { AccountService, AccountGroupBy } from '../../services/accountService';
import { formatCurrency, formatPercent } from '../../lib/utils';
import { AccountCard } from './AccountCard';
import { AccountTableView } from './AccountTableView';
import { AccountDetailModal } from './AccountDetailModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input, Select } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface AccountsViewProps {
  onOpenNewAccountModal: () => void;
  onEditAccount: (account: Account) => void;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  onOpenNewAccountModal,
  onEditAccount,
}) => {
  const { 
    accounts, 
    selectedAccountId, 
    setSelectedAccountId, 
    deleteAccount,
    archiveAccount,
    restoreAccount,
    duplicateAccount,
    trades 
  } = useTradeOS();

  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [groupBy, setGroupBy] = useState<AccountGroupBy>('NONE');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Account Detail Modal State
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);

  // Delete Confirmation Modal State
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      // Status & Type Filter
      if (filterType === 'ACTIVE' && (acc.isArchived || acc.status === 'ARCHIVED' || acc.status === 'INACTIVE')) return false;
      if (filterType === 'ARCHIVED' && !acc.isArchived && acc.status !== 'ARCHIVED') return false;
      if (filterType === 'PROP' && !(acc.accountType?.startsWith('PROP_') || acc.accountType === 'CHALLENGE')) return false;
      if (filterType === 'LIVE' && acc.accountType !== 'PERSONAL_LIVE') return false;
      if (filterType === 'DEMO' && acc.accountType !== 'PERSONAL_DEMO') return false;
      if (filterType === 'BACKTEST' && acc.accountType !== 'BACKTEST' && acc.accountType !== 'FORWARD_TEST') return false;

      // By default for 'ALL', hide archived unless explicit
      if (filterType === 'ALL' && (acc.isArchived || acc.status === 'ARCHIVED')) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesBroker = acc.broker.toLowerCase().includes(q);
        const matchesPlatform = acc.platform.toLowerCase().includes(q);
        const matchesNumber = acc.accountNumber?.toLowerCase().includes(q);
        const matchesGroup = acc.group?.toLowerCase().includes(q);
        const matchesNotes = acc.notes?.toLowerCase().includes(q);
        const matchesTags = acc.tags?.some(t => t.toLowerCase().includes(q));

        if (!matchesName && !matchesBroker && !matchesPlatform && !matchesNumber && !matchesGroup && !matchesNotes && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [accounts, filterType, searchQuery]);

  // Grouped Accounts Dictionary
  const groupedAccounts = useMemo(() => {
    return AccountService.groupAccounts(filteredAccounts, groupBy);
  }, [filteredAccounts, groupBy]);

  // KPI Calculations across active monitored accounts
  const activeAccounts = accounts.filter(a => !a.isArchived && a.status !== 'ARCHIVED');
  const totalCapital = activeAccounts.reduce((acc, a) => acc + a.currentBalance, 0);
  const totalStartingCapital = activeAccounts.reduce((acc, a) => acc + a.startingBalance, 0);
  const netCapitalGrowth = totalCapital - totalStartingCapital;
  const growthPercent = totalStartingCapital > 0 ? (netCapitalGrowth / totalStartingCapital) * 100 : 0;
  const archivedCount = accounts.filter(a => a.isArchived || a.status === 'ARCHIVED').length;

  // Handlers
  const handleArchiveToggle = async (account: Account) => {
    if (account.isArchived || account.status === 'ARCHIVED') {
      await restoreAccount(account.id);
    } else {
      await archiveAccount(account.id);
    }
  };

  const handleDuplicate = async (account: Account) => {
    await duplicateAccount(account.id);
  };

  const confirmDelete = async () => {
    if (!accountToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAccount(accountToDelete.id);
      setAccountToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Trading Accounts Manager
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Central multi-broker portfolio console, prop firm challenge tracker, and desk capital allocator.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="md"
            onClick={onOpenNewAccountModal}
            className="shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Add Trading Account</span>
          </Button>
        </div>
      </div>

      {/* Aggregate Capital KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900/90 border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Total Monitored Equity
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalCapital)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block font-mono">
            Across {activeAccounts.length} active trading desks
          </span>
        </Card>

        <Card className="bg-zinc-900/90 border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Combined Net Realized P&L
          </span>
          <div className={`text-2xl font-bold font-mono mt-1 ${netCapitalGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {netCapitalGrowth >= 0 ? '+' : ''}{formatCurrency(netCapitalGrowth)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block font-mono">
            {formatPercent(growthPercent)} growth vs baseline {formatCurrency(totalStartingCapital)}
          </span>
        </Card>

        <Card className="bg-zinc-900/90 border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Active vs Inactive Desks
          </span>
          <div className="text-2xl font-bold font-mono text-zinc-100 mt-1">
            {activeAccounts.length} <span className="text-xs text-zinc-500 font-sans font-normal">Active</span> / {archivedCount} <span className="text-xs text-zinc-500 font-sans font-normal">Archived</span>
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">
            Multi-account risk engine synchronized
          </span>
        </Card>

        <Card className="bg-zinc-900/90 border-zinc-800">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
            Prop Challenges Monitored
          </span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
            {accounts.filter(a => a.accountType?.startsWith('PROP_') || a.accountType === 'CHALLENGE').length}
          </div>
          <span className="text-[11px] text-zinc-400 mt-1 block">
            Objective compliance tracked deterministically
          </span>
        </Card>
      </div>

      {/* Controls & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search accounts by name, broker, platform, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Group By & View Switcher Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-zinc-400 whitespace-nowrap">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as AccountGroupBy)}
              className="bg-zinc-900 border border-zinc-800 text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="NONE">None (Flat List)</option>
              <option value="TYPE">Account Type</option>
              <option value="BROKER">Broker / Prop Firm</option>
              <option value="STATUS">Status</option>
              <option value="CURRENCY">Currency</option>
              <option value="GROUP">Custom Desk / Group</option>
            </select>
          </div>

          <div className="h-4 w-px bg-zinc-800 mx-1 hidden sm:block" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-zinc-800 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Institutional Table View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Active Accounts' },
            { id: 'PROP', label: 'Prop Firm & Challenges' },
            { id: 'LIVE', label: 'Personal Live' },
            { id: 'DEMO', label: 'Demo / Sim' },
            { id: 'BACKTEST', label: 'Backtest / Forward' },
            { id: 'ARCHIVED', label: `Archived (${archivedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                filterType === tab.id
                  ? 'bg-zinc-800 text-white font-semibold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-mono text-zinc-400 hidden md:inline shrink-0 pl-2">
          {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'} shown
        </span>
      </div>

      {/* Accounts List / Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
          <Wallet className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No trading accounts found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchQuery 
              ? `No accounts matching "${searchQuery}". Try clearing your search query.` 
              : filterType === 'ARCHIVED'
                ? 'You do not have any archived accounts.'
                : 'Create your first trading account to begin tracking execution, health metrics, and rules.'}
          </p>
          {!searchQuery && filterType !== 'ARCHIVED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenNewAccountModal}
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create Account
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(Object.entries(groupedAccounts) as [string, Account[]][]).map(([groupTitle, groupAccs]) => (
            <div key={groupTitle} className="space-y-3">
              {/* Group Section Header (only shown if grouping is active) */}
              {groupBy !== 'NONE' && (
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                      {groupTitle}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-mono bg-zinc-800 px-1.5 py-0.5 rounded">
                      {groupAccs.length}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400">
                    Combined Equity: {formatCurrency(groupAccs.reduce((acc, a) => acc + a.currentBalance, 0))}
                  </span>
                </div>
              )}

              {/* Rendering Cards vs Table */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupAccs.map(account => (
                    <AccountCard
                      key={account.id}
                      account={account}
                      trades={trades}
                      isSelected={selectedAccountId === account.id}
                      onSelect={() => setSelectedAccountId(account.id)}
                      onEdit={() => onEditAccount(account)}
                      onArchiveToggle={() => handleArchiveToggle(account)}
                      onDuplicate={() => handleDuplicate(account)}
                      onDelete={() => setAccountToDelete(account)}
                      onViewDetails={() => setDetailAccount(account)}
                    />
                  ))}
                </div>
              ) : (
                <AccountTableView
                  accounts={groupAccs}
                  trades={trades}
                  selectedAccountId={selectedAccountId}
                  onSelect={(id) => setSelectedAccountId(id)}
                  onEdit={(acc) => onEditAccount(acc)}
                  onArchiveToggle={(acc) => handleArchiveToggle(acc)}
                  onDuplicate={(acc) => handleDuplicate(acc)}
                  onDelete={(acc) => setAccountToDelete(acc)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Account Detail Modal */}
      {detailAccount && (
        <AccountDetailModal
          isOpen={!!detailAccount}
          onClose={() => setDetailAccount(null)}
          account={detailAccount}
          trades={trades}
          onEdit={(acc) => onEditAccount(acc)}
          onArchiveToggle={(acc) => handleArchiveToggle(acc)}
          onDuplicate={(acc) => handleDuplicate(acc)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <Modal
          isOpen={!!accountToDelete}
          onClose={() => setAccountToDelete(null)}
          title="Confirm Account Deletion"
          description="Are you sure you want to permanently delete this trading account?"
          maxWidth="sm"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setAccountToDelete(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={confirmDelete} isLoading={isDeleting}>
                Delete Permanently
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs text-zinc-300">
            <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
              <div className="font-bold text-white text-sm">{accountToDelete.name}</div>
              <div className="text-zinc-400 font-mono">
                {accountToDelete.broker} • {accountToDelete.platform} • Balance: {formatCurrency(accountToDelete.currentBalance, accountToDelete.currency)}
              </div>
            </div>
            <p className="text-zinc-400 text-xs">
              Deleting this account will remove its configuration and compliance limits. Associated historical trades will remain in the database unlinked.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
