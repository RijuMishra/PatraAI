import React, { useState } from 'react';
import { ApplicationRecord, ContradictionRecord } from '../../types';
import { normalizeCurrency, normalizeAcademicScore } from '../../services/extractionAdapter';
import { dataService } from '../../services/dataService';
import {
  Radio,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Scale,
  ArrowRight,
  Info,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface ContradictionRadarProps {
  application: ApplicationRecord;
  onUpdateApplication: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

export const ContradictionRadar: React.FC<ContradictionRadarProps> = ({
  application,
  onUpdateApplication,
  onNavigate,
}) => {
  const { contradictions, applicant, refNumber, documents } = application;
  const [resolutionNotes, setResolutionNotes] = useState<{ [id: string]: string }>({});

  const handleResolveContradiction = (
    contradictionId: string,
    action: 'CONFIRMED_MISMATCH' | 'DISMISSED_TYPO' | 'RESOLVED'
  ) => {
    const note = resolutionNotes[contradictionId] || `Officer resolved discrepancy via ${action}.`;

    const updatedContradictions = contradictions.map((c) => {
      if (c.id === contradictionId) {
        return {
          ...c,
          status: action,
          reviewerNotes: note,
          isMismatch: action === 'CONFIRMED_MISMATCH',
        };
      }
      return c;
    });

    const updatedApp: ApplicationRecord = {
      ...application,
      contradictions: updatedContradictions,
      updatedAt: new Date().toISOString(),
    };

    const saved = dataService.saveApplication(updatedApp);
    dataService.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'MISMATCH_DETECTED',
      actor: 'Officer Reviewer (Contradiction Radar)',
      reasonOrResult: `Contradiction ${contradictionId} updated to ${action}. Note: ${note}`,
      policyVersion: saved.policyVersion,
    });

    onUpdateApplication(saved);
  };

  const hasUnresolvedMismatch = contradictions.some(
    (c) => c.isMismatch && c.status !== 'DISMISSED_TYPO' && c.status !== 'RESOLVED'
  );

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
              <span className="text-xs text-slate-500">{applicant.fullName}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
              <span>Contradiction Radar</span>
            </h1>
            <p className="text-xs text-slate-500">
              Deterministic comparison engine analyzing normalized declarations against verified certificate extractions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {hasUnresolvedMismatch ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3.5 h-3.5" />
                <span>Approval Interlocked (Unresolved Variance)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>No Active Contradictions</span>
              </span>
            )}
          </div>
        </div>

        {/* Ethical / Compliance Notice */}
        <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Fairness & Due Process Invariant:</strong> A numerical discrepancy between declared figures and
            certificate extractions is <em>not</em> proof of intentional fraud. Systemic factors include clerical
            transposition typos, gross vs net income definitions, or timing of certification. Discrepancies warrant human
            clarification, not automatic punitive disqualification.
          </p>
        </div>
      </div>

      {/* Contradiction Cards */}
      {contradictions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Discrepancies Flagged</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            All declared values (income, academic percentage, institutional credentials) match document extractions within
            configured tolerance thresholds.
          </p>
          <button
            onClick={() => onNavigate('officer_passport')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Proceed to Evidence Passport
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {contradictions.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-sm transition ${
                c.isMismatch ? 'border-amber-300' : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="font-bold text-sm text-slate-900">{c.fieldName} Discrepancy</span>
                  <span className="text-xs font-mono text-slate-500">[{c.documentType}]</span>
                </div>

                <div>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      c.status === 'CONFIRMED_MISMATCH'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : c.status === 'DISMISSED_TYPO'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : c.status === 'RESOLVED'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {c.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Comparison Visual Block */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Declared */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Applicant Declared Value
                    </span>
                    <span className="text-lg font-bold text-slate-900 mt-1 block">{c.declaredValue}</span>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Normalized: <code>{String(c.normalizedDeclared)}</code>
                    </span>
                    <span className="text-[10px] text-slate-400">Source: Online Application Form</span>
                  </div>

                  {/* Extracted */}
                  <div className="p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                      Extracted Certificate Value
                    </span>
                    <span className="text-lg font-bold text-amber-950 mt-1 block">{c.extractedValue}</span>
                    <span className="text-[11px] text-amber-900 mt-1 block">
                      Normalized: <code>{String(c.normalizedExtracted)}</code>
                    </span>
                    <span className="text-[10px] text-amber-700">Source: Tahsildar Certificate (OCR)</span>
                  </div>

                  {/* Variance Details */}
                  <div className="p-3.5 rounded-lg bg-rose-50/60 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                      Automated Variance Flag
                    </span>
                    <span className="text-sm font-bold text-rose-950 mt-1 block">CRITICAL VARIANCE</span>
                    <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">{c.ruleDescription}</p>
                  </div>
                </div>

                {/* Reviewer Resolution Controls */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Officer Audit Findings & Resolution Rationale:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified with applicant via phone; gross income misdeclared due to deduction confusion."
                      value={resolutionNotes[c.id] || c.reviewerNotes || ''}
                      onChange={(e) =>
                        setResolutionNotes({
                          ...resolutionNotes,
                          [c.id]: e.target.value,
                        })
                      }
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handleResolveContradiction(c.id, 'CONFIRMED_MISMATCH')}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Confirm Mismatch (Lock Adverse)</span>
                    </button>

                    <button
                      onClick={() => handleResolveContradiction(c.id, 'DISMISSED_TYPO')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Dismiss as Inconsequential Typo</span>
                    </button>

                    <button
                      onClick={() => handleResolveContradiction(c.id, 'RESOLVED')}
                      className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>Mark Clarified & Resolved</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
