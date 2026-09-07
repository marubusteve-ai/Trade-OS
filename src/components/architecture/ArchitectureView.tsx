import React from 'react';
import { 
  Layers, 
  Database, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  BrainCircuit, 
  FileText,
  CheckCircle2,
  Workflow,
  Smartphone,
  RefreshCw,
  Wifi
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="p-5 rounded-xl bg-[#15171A] border border-[#22252A] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              System Architecture & Domain Specification
              <Badge variant="purple">DOMAIN-DRIVEN DESIGN</Badge>
              <Badge variant="emerald">PWA & LOCAL-FIRST</Badge>
            </h1>
            <p className="text-xs text-[#848B98] mt-0.5">
              Production-ready blueprint, deterministic computation model, user data isolation, and resilient offline synchronization.
            </p>
          </div>
        </div>
      </div>

      {/* Layer Hierarchy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Layer 1: Core Domain Entities */}
        <Card>
          <CardHeader className="pb-2 border-b border-[#22252A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                <Workflow className="h-4 w-4" /> 1. Domain Entities
              </span>
              <Badge variant="zinc">STRONG TYPING</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#848B98]">
            <p>
              Strict TypeScript schemas defining business primitives:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#D1D5DB] font-mono text-[11px]">
              <li>User & Auth Profile</li>
              <li>Trading Account & Prop Rules</li>
              <li>Trade Execution & Risk Records</li>
              <li>Strategy & Playbook Schemas</li>
              <li>SyncMutation & Conflict Models</li>
            </ul>
          </CardContent>
        </Card>

        {/* Layer 2: Stateless Financial Calculation Engine */}
        <Card>
          <CardHeader className="pb-2 border-b border-[#22252A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Cpu className="h-4 w-4" /> 2. Calculation & Risk Engine
              </span>
              <Badge variant="emerald">ZERO SIDE-EFFECTS</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#848B98]">
            <p>
              Single source of truth for all quantitative math:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#D1D5DB] font-mono text-[11px]">
              <li>Gross & Net P&L (Futures multipliers)</li>
              <li>Position Sizing & Multi-Asset Lot Math</li>
              <li>Stop Loss, R:R Matrix & Breakeven Edge</li>
              <li>Daily/Weekly/Monthly Risk Budgets</li>
              <li>Exposure Radar & Correlation Clusters</li>
            </ul>
          </CardContent>
        </Card>

        {/* Layer 3: Persistence & User Isolation */}
        <Card>
          <CardHeader className="pb-2 border-b border-[#22252A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Database className="h-4 w-4" /> 3. Repository Pattern
              </span>
              <Badge variant="blue">PLUGGABLE DB</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#848B98]">
            <p>
              Abstract repository contracts for multi-user isolation:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#D1D5DB] font-mono text-[11px]">
              <li>Isolated keys (<code className="text-[#F3F4F6]">tradeos:uid:*</code>)</li>
              <li>AccountRepository (CRUD, Balances)</li>
              <li>TradeRepository (Log, Filter, Query)</li>
              <li>StrategyRepository (Rules, Tags)</li>
              <li>SyncRepository (FIFO Queue Buffering)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Layer 4: PWA & Offline Synchronization Engine */}
        <Card>
          <CardHeader className="pb-2 border-b border-[#22252A]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Smartphone className="h-4 w-4" /> 4. PWA & Offline Sync
              </span>
              <Badge variant="amber">LOCAL-FIRST</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#848B98]">
            <p>
              Zero-install desktop & mobile resilience:
            </p>
            <ul className="list-disc pl-4 space-y-1 text-[#D1D5DB] font-mono text-[11px]">
              <li>ServiceWorker Cache-First Assets</li>
              <li>Offline Mutation Buffer & Queue</li>
              <li>Reconnection Auto-Sync</li>
              <li>Deterministic Conflict Resolution</li>
              <li>Network State Telemetry</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Complete Data Flow Architecture Diagram */}
      <Card className="p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          Deterministic Execution & Local-First Sync Flow
        </h3>

        <div className="bg-[#0C0D0F] p-4 rounded-xl border border-[#22252A] font-mono text-xs text-[#D1D5DB] space-y-3 leading-relaxed">
          <div className="flex items-center gap-2 text-emerald-400">
            <span>[USER ACTION]</span>
            <span>→</span>
            <span>[TradeOS UI Component]</span>
            <span>→</span>
            <span>[TradeOS Context Coordinator]</span>
          </div>
          <div className="pl-6 text-[#848B98]">
            │ ├─→ Validates input against Domain Constraints (Schema validation)
            <br />
            │ ├─→ Invokes <strong>CalculationEngine</strong> for real-time risk, R:R, and P&L (100% Offline)
            <br />
            │ ├─→ Persists instantly to <strong>LocalDatabase & Repositories</strong> with Tenant Partitioning
            <br />
            │ ├─→ Enqueues mutation to <strong>SyncRepository FIFO Buffer</strong> with timestamp & operation
            <br />
            │ └─→ Computes aggregate Portfolio Metrics, Equity Curve, and Prop Compliance Status
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <span>[BACKGROUND SYNC]</span>
            <span>↔</span>
            <span>[Network Detection Event]</span>
            <span>↔</span>
            <span>[SyncEngine Reconciler]</span>
          </div>
          <div className="pl-6 text-[#848B98]">
            │ ├─→ Verifies network heartbeat (ping latency & connection quality)
            <br />
            │ ├─→ Flushes pending mutations in chronological order
            <br />
            │ └─→ Detects and resolves version conflicts deterministically (Client-Wins / Server-Wins / Manual)
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <span>[STATE RE-RENDER]</span>
            <span>←</span>
            <span>[Reactive Subscription]</span>
            <span>←</span>
            <span>[Audited Calculation & Sync Results]</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
