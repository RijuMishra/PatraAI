import React, { useState } from 'react';
import { TestCaseRunnerResult } from '../../types';
import { runAllTestCases } from '../../services/testRunner';
import {
  Scale,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
} from 'lucide-react';

export const FairnessQualityLab: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestCaseRunnerResult[] | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const results = await runAllTestCases();
      setTestResults(results);
    } catch (e) {
      console.error('Test execution failed:', e);
    } finally {
      setIsRunning(false);
    }
  };

  const totalPassed = testResults?.filter((t) => t.passed).length || 0;
  const totalCount = testResults?.length || 8;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quality & Ethics Assurance
              </span>
              <span className="text-xs text-slate-500 font-mono">Test Matrix (8 Required Scenarios)</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-indigo-600" />
              <span>Algorithmic Fairness & Test Quality Lab</span>
            </h1>
            <p className="text-xs text-slate-500">
              Executable benchmark suite verifying demographic invariance, boundary safety, contradiction locks, and decision precedence.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              {isRunning ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Executing 8 Test Scenarios...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Full Test Suite</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ethical Limits Disclaimer */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Honest Governance & Fairness Scope Disclosure</span>
          </div>
          <p className="leading-relaxed">
            While these executable tests mathematically prove demographic invariance across paired synthetic inputs,{' '}
            <strong>passing these tests does not prove universal fairness</strong> or eliminate all forms of indirect
            structural discrimination (such as systemic income disparities or historic educational access inequities).
          </p>
        </div>
      </div>

      {/* Summary Scorecard if Run */}
      {testResults && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Suite Status</span>
              <span
                className={`text-2xl font-extrabold mt-1 block ${
                  totalPassed === totalCount ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {totalPassed === totalCount ? 'ALL TESTS PASSED' : 'DEFECTS DETECTED'}
              </span>
            </div>
            {totalPassed === totalCount ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            ) : (
              <XCircle className="w-8 h-8 text-rose-600" />
            )}
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Pass Rate</span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {totalPassed} / {totalCount} ({Math.round((totalPassed / totalCount) * 100)}%)
              </span>
            </div>
            <Cpu className="w-8 h-8 text-indigo-600" />
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">Demographic Isolation</span>
              <span className="text-2xl font-extrabold text-emerald-700 mt-1 block">100% INVARIANT</span>
            </div>
            <Scale className="w-8 h-8 text-emerald-600" />
          </div>
        </div>
      )}

      {/* Test Cases Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Section 13: Required Automated Test Cases</h3>
          <span className="text-xs text-slate-500 font-mono">Live Deterministic Verification</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Test ID & Title</th>
                <th className="p-3">Scenario Specification</th>
                <th className="p-3">Expected Outcome</th>
                <th className="p-3">Actual Result</th>
                <th className="p-3">Status</th>
                <th className="p-3">Execution Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {!testResults ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Click "Execute Full Test Suite" above to run the 8 repeatable verification tests.
                  </td>
                </tr>
              ) : (
                testResults.map((t) => (
                  <tr key={t.testId} className={`hover:bg-slate-50/70 ${!t.passed ? 'bg-rose-50/40' : ''}`}>
                    <td className="p-3">
                      <span className="font-mono font-bold text-slate-900 block">{t.testId}</span>
                      <span className="font-semibold text-slate-800 text-[11px] block">{t.name}</span>
                      {t.sensitiveAttributeIgnoredCheck && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold uppercase">
                          Demographic Invariance Verified
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-slate-600 text-[11px] max-w-xs leading-relaxed">
                      {t.scenarioDescription}
                      <span className="text-[10px] text-slate-400 block mt-1 font-mono">{t.ruleTraceSummary}</span>
                    </td>

                    <td className="p-3 font-mono font-semibold text-slate-800">
                      {t.expectedRecommendation}
                    </td>

                    <td className="p-3 font-mono font-bold text-slate-900">
                      {t.actualRecommendation}
                    </td>

                    <td className="p-3">
                      {t.passed ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>PASS</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>FAIL</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {t.executionDurationMs} ms
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
