import React from 'react';
import { ApplicationRecord } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  FileText,
  Scale,
  Sparkles,
  ArrowRight,
  Gavel,
} from 'lucide-react';

interface DecisionTraceViewProps {
  application: ApplicationRecord;
  onNavigate: (tab: string) => void;
}

export const DecisionTraceView: React.FC<DecisionTraceViewProps> = ({
  application,
  onNavigate,
}) => {
  const { decisionTrace, refNumber, applicant, policyVersion } = application;

  if (!decisionTrace) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-sm">
        No decision evaluation record found for {refNumber}.
      </div>
    );
  }

  const {
    initialRecommendation,
    evidenceCompletenessPercentage,
    confidenceScore,
    ruleResults,
    reasonsForEscalation,
    missingInformation,
    recommendedNextAction,
    evaluatedAt,
  } = decisionTrace;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Application: {refNumber}
              </span>
              <span className="text-xs text-slate-500 font-mono">Policy {policyVersion}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-600" />
              <span>Decision Explanation & Deterministic Rule Trace</span>
            </h1>
            <p className="text-xs text-slate-500">
              Evaluated strictly against Policy {policyVersion}. Explanations are compiled from deterministic rule execution, not invented AI hallucination.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">System Recommendation</span>
              <span
                className={`text-sm font-extrabold px-3 py-1 rounded-md inline-block mt-0.5 ${
                  initialRecommendation === 'APPROVE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : initialRecommendation === 'REJECT'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {initialRecommendation}
              </span>
            </div>

            <button
              onClick={() => onNavigate('officer_decision')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Gavel className="w-3.5 h-3.5" />
              <span>Record Decision</span>
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              Evidence Completeness
            </span>
            <span className="text-base font-extrabold text-slate-900 mt-0.5 block">
              {evidenceCompletenessPercentage}%
            </span>
            <span className="text-[10px] text-slate-500">All mandatory documents present</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              Honest Confidence Metric
            </span>
            <span className="text-base font-extrabold text-indigo-700 mt-0.5 block">
              {(confidenceScore * 100).toFixed(0)}%
            </span>
            <span className="text-[10px] text-slate-500">Derived from OCR & completeness metrics</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
              Evaluation Timestamp
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 mt-1 block">
              {new Date(evaluatedAt).toLocaleString('en-IN', {
                dateStyle: 'short',
                timeStyle: 'medium',
              })}
            </span>
            <span className="text-[10px] text-slate-500">Deterministic Engine v2.4</span>
          </div>
        </div>
      </div>

      {/* Escalation or Missing Info Callouts */}
      {(reasonsForEscalation.length > 0 || missingInformation.length > 0) && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2 text-amber-950">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Escalation Reasons & Unresolved Preconditions</span>
          </div>
          {reasonsForEscalation.length > 0 && (
            <div>
              <span className="font-semibold text-amber-900 block">Reasons for Officer Escalation:</span>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-900">
                {reasonsForEscalation.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {missingInformation.length > 0 && (
            <div>
              <span className="font-semibold text-amber-900 block">Missing Evidentiary Information:</span>
              <ul className="list-disc list-inside space-y-0.5 pl-2 text-amber-900">
                {missingInformation.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Rules Trace Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-sm font-bold text-slate-900">Policy Rules Execution Ledger</h3>
          <span className="text-xs text-slate-500 font-mono">{ruleResults.length} Rules Executed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/70 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Rule ID & Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Actual Evaluated Input</th>
                <th className="p-3">Threshold Condition</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence Source</th>
                <th className="p-3">Deterministic Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {ruleResults.map((r) => (
                <tr key={r.ruleId} className="hover:bg-slate-50/70">
                  <td className="p-3">
                    <span className="font-mono font-bold text-slate-900 block">{r.ruleId}</span>
                    <span className="text-[11px] text-slate-500 block">{r.ruleName}</span>
                    {r.isMandatory && (
                      <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-1 rounded uppercase">
                        Mandatory
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {r.category}
                    </span>
                  </td>

                  <td className="p-3 font-mono font-semibold text-slate-900">
                    {String(r.actualInputValue)}
                  </td>

                  <td className="p-3 font-mono text-slate-600 text-[11px]">
                    {r.thresholdCondition}
                  </td>

                  <td className="p-3">
                    <StatusPill status={r.status} size="sm" />
                  </td>

                  <td className="p-3 text-[11px] text-slate-500 font-mono">
                    {r.evidenceReference}
                  </td>

                  <td className="p-3 text-slate-600 text-[11px] max-w-xs">
                    {r.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Next Action Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <strong>Recommended Next Action: </strong>
            <span>{recommendedNextAction}</span>
          </div>

          <button
            onClick={() => onNavigate('officer_decision')}
            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 shrink-0"
          >
            Go to Final Determination <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
