import React, { useState } from 'react';
import { ApplicationRecord, FinalDecisionRecord } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { dataService } from '../../services/dataService';
import {
  Gavel,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Lock,
  FileText,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

interface HumanDecisionViewProps {
  application: ApplicationRecord;
  onUpdateApplication: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

export const HumanDecisionView: React.FC<HumanDecisionViewProps> = ({
  application,
  onUpdateApplication,
  onNavigate,
}) => {
  const { decisionTrace, refNumber, applicant, finalDecision, contradictions, documents } = application;

  const originalRecommendation = decisionTrace?.initialRecommendation || 'NEEDS_REVIEW';

  const [officerChoice, setOfficerChoice] = useState<'APPROVE' | 'REJECT' | 'REQUEST_MORE_INFO' | 'ESCALATE'>(
    originalRecommendation === 'APPROVE' ? 'APPROVE' : 'REJECT'
  );
  const [decisionRationale, setDecisionRationale] = useState('');
  const [authorizedException, setAuthorizedException] = useState(false);
  const [exceptionClause, setExceptionClause] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check closure gates: active mismatches or unreadable docs
  const activeMismatches = contradictions.filter(
    (c) => c.isMismatch && c.status !== 'DISMISSED_TYPO' && c.status !== 'RESOLVED'
  );
  const hasUnresolvedIssues = activeMismatches.length > 0 || documents.some((d) => d.readability === 'UNREADABLE');

  const handleRecordFinalDetermination = () => {
    setErrorMessage(null);

    // Guard: Require meaningful rationale
    if (!decisionRationale.trim() || decisionRationale.trim().length < 10) {
      setErrorMessage('A meaningful officer decision rationale (minimum 10 characters) is legally mandatory.');
      return;
    }

    // Guard: Prevent approval if unresolved issues unless explicit authorized exception
    if (officerChoice === 'APPROVE' && hasUnresolvedIssues && !authorizedException) {
      setErrorMessage(
        'Closure Gating Invariant: Cannot approve case with unresolved contradictions or unreadable documents without an explicit Authorized Statutory Exception.'
      );
      return;
    }

    if (authorizedException && (!exceptionClause.trim() || exceptionClause.trim().length < 5)) {
      setErrorMessage('Please state the specific policy clause or exception reference (e.g. Clause 4.2 Hardship).');
      return;
    }

    let finalOutcome: 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED' | 'UNDER_REVIEW' = 'UNDER_REVIEW';
    if (officerChoice === 'APPROVE') finalOutcome = 'APPROVED';
    else if (officerChoice === 'REJECT') finalOutcome = 'REJECTED';
    else if (officerChoice === 'REQUEST_MORE_INFO') finalOutcome = 'ACTION_REQUIRED';
    else if (officerChoice === 'ESCALATE') finalOutcome = 'UNDER_REVIEW';

    const recordedDecision: FinalDecisionRecord = {
      officerRecommendation: officerChoice,
      finalOutcome,
      decisionReason: decisionRationale.trim(),
      originalSystemRecommendation: originalRecommendation,
      decidedBy: 'Officer S. Kulkarni (VO-402)',
      decidedAt: new Date().toISOString(),
      authorizedExceptionRecorded: authorizedException,
      exceptionNotes: authorizedException ? exceptionClause.trim() : undefined,
    };

    const updatedApp: ApplicationRecord = {
      ...application,
      status: finalOutcome,
      finalDecision: recordedDecision,
      updatedAt: new Date().toISOString(),
    };

    const saved = dataService.saveApplication(updatedApp);

    // Record audit event
    dataService.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'FINAL_DECISION_ISSUED',
      actor: 'Officer S. Kulkarni (VO-402)',
      reasonOrResult: `Determination recorded: ${finalOutcome}. Officer Action: ${officerChoice}. Rationale: ${decisionRationale.trim()}`,
      policyVersion: saved.policyVersion,
    });

    // Dispatch transparent notification to applicant
    dataService.addNotification({
      applicationRef: saved.refNumber,
      type: finalOutcome === 'APPROVED' ? 'DECISION_READY' : finalOutcome === 'REJECTED' ? 'INFO' : 'ACTION_REQUIRED',
      title: `Application Determination: ${finalOutcome}`,
      message:
        finalOutcome === 'APPROVED'
          ? `Congratulations! Your scholarship application ${saved.refNumber} has been verified and officially approved.`
          : finalOutcome === 'REJECTED'
          ? `Your application ${saved.refNumber} was not approved per Policy ${saved.policyVersion}. Rationale: "${decisionRationale.trim()}".`
          : `Additional information or clarification is requested for your application ${saved.refNumber}.`,
    });

    onUpdateApplication(saved);
    setSuccessMessage(`Final determination [${finalOutcome}] recorded and applicant notified.`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Application: {refNumber}
              </span>
              <span className="text-xs text-slate-500 font-mono">{applicant.fullName}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Gavel className="w-5 h-5 text-indigo-600" />
              <span>Human Review & Final Decision Determination</span>
            </h1>
            <p className="text-xs text-slate-500">
              Preserves the original system recommendation alongside officer determination for immutable audit governance.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current Application Status</span>
            <div className="mt-1">
              <StatusPill status={application.status} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Preservation of Original Recommendation Notice */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
            Original System Automated Recommendation
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-white">{originalRecommendation}</span>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
              Immutable
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Derived directly from Policy {application.policyVersion}. This baseline cannot be overwritten by human override.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 shadow-sm space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block">
            Recorded Officer Final Outcome
          </span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold text-indigo-950">
              {finalDecision?.finalOutcome || 'PENDING DETERMINATION'}
            </span>
          </div>
          <p className="text-xs text-indigo-900/80 leading-relaxed">
            {finalDecision
              ? `Decided by ${finalDecision.decidedBy} on ${new Date(finalDecision.decidedAt).toLocaleDateString('en-IN')}`
              : 'Case is awaiting formal officer determination.'}
          </p>
        </div>
      </div>

      {/* Errors or Success Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Decision Form Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Record Final Reviewer Determination
        </h3>

        {/* Action Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Select Determination Action *</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setOfficerChoice('APPROVE')}
              className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                officerChoice === 'APPROVE'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve Case</span>
            </button>

            <button
              type="button"
              onClick={() => setOfficerChoice('REJECT')}
              className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                officerChoice === 'REJECT'
                  ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Case</span>
            </button>

            <button
              type="button"
              onClick={() => setOfficerChoice('REQUEST_MORE_INFO')}
              className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                officerChoice === 'REQUEST_MORE_INFO'
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Request Info (RFI)</span>
            </button>

            <button
              type="button"
              onClick={() => setOfficerChoice('ESCALATE')}
              className={`p-3 rounded-lg border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                officerChoice === 'ESCALATE'
                  ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Escalate to Board</span>
            </button>
          </div>
        </div>

        {/* Meaningful Rationale Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">
            Statutory Decision Rationale / Reviewer Justification *
          </label>
          <textarea
            rows={3}
            value={decisionRationale}
            onChange={(e) => setDecisionRationale(e.target.value)}
            placeholder="Record clear, audit-compliant justification citing policy clauses or verified documents..."
            className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-[10px] text-slate-400 block">
            Must detail reasons if overriding the automated recommendation.
          </span>
        </div>

        {/* Authorized Discretionary Exception Option */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              id="auth_ex"
              checked={authorizedException}
              onChange={(e) => setAuthorizedException(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="auth_ex" className="text-xs font-bold text-slate-900 cursor-pointer">
                Invoke Authorized Discretionary Hardship / Statutory Exception
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                Enable only if the applicant qualifies for special dispensation under authorized welfare guidelines
                (e.g. natural disaster relief, war widow ward).
              </p>
            </div>
          </div>

          {authorizedException && (
            <div className="pt-2">
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Authorized Policy Clause Reference & Exemption Document ID *
              </label>
              <input
                type="text"
                value={exceptionClause}
                onChange={(e) => setExceptionClause(e.target.value)}
                placeholder="e.g. Section 4.2 Calamity Relief Waiver (Ref: DRM-2025-081)"
                className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Submit Decision */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('officer_trace')}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
          >
            Review Rule Trace First
          </button>

          <button
            type="button"
            onClick={handleRecordFinalDetermination}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Sign & Record Determination</span>
          </button>
        </div>
      </div>
    </div>
  );
};
