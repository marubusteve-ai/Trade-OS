import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  CheckCircle2, 
  XCircle, 
  Play, 
  RotateCw, 
  ShieldCheck, 
  Cpu, 
  Database,
  Award
} from 'lucide-react';
import { TestRunner, TestCaseResult } from '../../tests/testRunner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export const TestRunnerView: React.FC = () => {
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTimestamp, setLastRunTimestamp] = useState<string | null>(null);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const testResults = await TestRunner.runAllTests();
      setResults(testResults);
      setLastRunTimestamp(new Date().toLocaleTimeString());
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((acc, r) => acc + r.durationMs, 0);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'FINANCIAL_ENGINE':
        return <Badge variant="emerald">FINANCIAL ENGINE</Badge>;
      case 'DATA_ISOLATION':
        return <Badge variant="blue">SECURITY & ISOLATION</Badge>;
      case 'PROP_COMPLIANCE':
        return <Badge variant="amber">PROP COMPLIANCE</Badge>;
      case 'ACCOUNT_MANAGEMENT':
        return <Badge variant="emerald">ACCOUNT MANAGEMENT</Badge>;
      case 'TRADE_JOURNAL':
        return <Badge variant="blue">TRADE JOURNAL</Badge>;
      case 'STRATEGY_ENGINE':
        return <Badge variant="emerald">STRATEGY ENGINE</Badge>;
      case 'PLAYBOOK_ENGINE':
        return <Badge variant="purple">PLAYBOOK ENGINE</Badge>;
      case 'CHECKLIST_SCORING':
        return <Badge variant="amber">CHECKLIST & SCORING</Badge>;
      case 'DASHBOARD_ANALYTICS':
        return <Badge variant="blue">DASHBOARD & ANALYTICS</Badge>;
      case 'RISK_MANAGEMENT':
        return <Badge variant="rose">RISK MANAGEMENT</Badge>;
      case 'PROP_FIRM_ENGINE':
        return <Badge variant="amber">PROP FIRM ENGINE</Badge>;
      case 'ANALYTICS_ENGINE':
        return <Badge variant="purple">ANALYTICS ENGINE</Badge>;
      case 'PSYCHOLOGY_ENGINE':
        return <Badge variant="pink">PSYCHOLOGY ENGINE</Badge>;
      case 'IMPORT_EXPORT_ENGINE':
        return <Badge variant="cyan">IMPORT / EXPORT ENGINE</Badge>;
      case 'AUTOMATION_ENGINE':
        return <Badge variant="amber">AUTOMATION ENGINE</Badge>;
      case 'PWA_OFFLINE_SYNC':
        return <Badge variant="emerald">PWA & OFFLINE SYNC</Badge>;
      default:
        return <Badge variant="zinc">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-[#15171A] border border-[#22252A] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <FlaskConical className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Automated QA & Regression Test Suite
              <Badge variant={totalFailed === 0 ? 'emerald' : 'rose'}>
                {totalFailed === 0 ? '100% PASSING' : `${totalFailed} FAILING`}
              </Badge>
            </h1>
            <p className="text-xs text-[#848B98] mt-0.5">
              Deterministic verification for financial calculation accuracy, multi-tenant isolation, and prop-firm compliance boundaries.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={runTests}
          isLoading={isRunning}
          className="shadow-sm font-semibold"
        >
          <Play className="h-4 w-4 mr-1.5" />
          <span>Execute Test Suite</span>
        </Button>
      </div>

      {/* Test Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B98]">
            Total Test Cases
          </span>
          <div className="text-2xl font-bold font-mono text-white mt-1">
            {results.length}
          </div>
          <span className="text-[11px] text-[#848B98] mt-1 block">Deterministic assertions</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B98]">
            Passed Tests
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="h-5 w-5" />
            {totalPassed}
          </div>
          <span className="text-[11px] text-emerald-400 mt-1 block">Zero regressions</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B98]">
            Failed Tests
          </span>
          <div className={`text-2xl font-bold font-mono mt-1 flex items-center gap-1.5 ${totalFailed === 0 ? 'text-[#606773]' : 'text-rose-400'}`}>
            {totalFailed === 0 ? <CheckCircle2 className="h-5 w-5 text-[#606773]" /> : <XCircle className="h-5 w-5" />}
            {totalFailed}
          </div>
          <span className="text-[11px] text-[#848B98] mt-1 block">Critical bugs detected</span>
        </Card>

        <Card className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#848B98]">
            Execution Speed
          </span>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {totalDuration.toFixed(2)} ms
          </div>
          <span className="text-[11px] text-[#848B98] mt-1 block">Last run: {lastRunTimestamp || 'Just now'}</span>
        </Card>
      </div>

      {/* Detailed Test Results List */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[#D1D5DB]">
          Verification Test Matrix
        </h2>

        <div className="space-y-2.5">
          {results.map((test) => (
            <Card
              key={test.id}
              className={`p-4 transition-colors ${
                test.passed ? 'border-[#22252A] hover:border-[#2A2E35]' : 'border-rose-500/50 bg-rose-950/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {test.passed ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{test.name}</span>
                      {getCategoryBadge(test.category)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-[#848B98]">
                    {test.durationMs} ms
                  </span>
                  <Badge variant={test.passed ? 'emerald' : 'rose'}>
                    {test.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
              </div>

              {/* Expected vs Actual */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono bg-[#0C0D0F] p-2.5 rounded-lg border border-[#22252A]">
                <div>
                  <span className="text-[#848B98] text-[10px] uppercase block font-sans">Expected Output:</span>
                  <span className="text-[#D1D5DB]">{test.expected}</span>
                </div>
                <div>
                  <span className="text-[#848B98] text-[10px] uppercase block font-sans">Actual Engine Evaluation:</span>
                  <span className={test.passed ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                    {test.actual}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
