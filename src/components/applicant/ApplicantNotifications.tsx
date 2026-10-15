import React from 'react';
import { ApplicationRecord, NotificationItem } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Printer,
  FileText,
  Building,
  GraduationCap,
  IndianRupee,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ApplicantNotificationsProps {
  application: ApplicationRecord;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const ApplicantNotifications: React.FC<ApplicantNotificationsProps> = ({
  application,
  notifications,
  onMarkRead,
  onNavigate,
}) => {
  const { applicant, refNumber, status, schemeName, policyVersion, decisionTrace, finalDecision, submittedAt } =
    application;

  const appNotifications = notifications.filter((n) => n.applicationRef === refNumber);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Ref: {refNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Notifications & Transparent Decision Statement</h1>
            <p className="text-xs text-slate-500">
              Clear, auditable explanations of all status updates, requirements, and final determinations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Decision Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Decision Explanation Card (Printable) */}
      <div className="bg-white rounded-xl border border-slate-300 p-6 shadow-sm print:p-0 print:border-none print:shadow-none space-y-6">
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                PatraAI Transparent Decision Statement
              </span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                Policy v{policyVersion}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Scheme: {schemeName}</p>
          </div>
          <div>
            <StatusPill status={status} size="lg" />
          </div>
        </div>

        {/* Detailed Decision Rationale */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Applicant & Submission Summary</h4>
            <div className="space-y-1 text-slate-600">
              <div>
                <strong>Applicant Name:</strong> {applicant.fullName}
              </div>
              <div>
                <strong>Application Ref:</strong> {refNumber}
              </div>
              <div>
                <strong>Institution:</strong> {applicant.institution}
              </div>
              <div>
                <strong>Academic Score:</strong> {applicant.academicScore}% (Threshold: 70.0%)
              </div>
              <div>
                <strong>Declared Annual Income:</strong> ₹{applicant.declaredAnnualIncome.toLocaleString('en-IN')}{' '}
                (Ceiling: ₹3,50,000)
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="font-bold text-slate-800 text-sm">Automated System Recommendation</h4>
            <div className="space-y-1 text-slate-600">
              <div>
                <strong>System Recommendation:</strong>{' '}
                <span className="font-bold text-slate-900">
                  {decisionTrace?.initialRecommendation || 'PROCESSING'}
                </span>
              </div>
              <div>
                <strong>Evidence Completeness:</strong> {decisionTrace?.evidenceCompletenessPercentage || 0}%
              </div>
              <div>
                <strong>Honest Confidence Metric:</strong>{' '}
                {decisionTrace?.confidenceScore ? `${(decisionTrace.confidenceScore * 100).toFixed(0)}%` : 'N/A'}
              </div>
              <div className="mt-2 text-slate-700 italic bg-white p-2 rounded border border-slate-200">
                "{decisionTrace?.recommendedNextAction || 'Evaluation in progress'}"
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Adverse Finding Specific Explanations */}
        {decisionTrace?.initialRecommendation === 'REJECT' && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Adverse Decision Grounds (Explicit Policy Rule Trace)</span>
            </div>
            <p className="leading-relaxed">
              Your application does not satisfy one or more mandatory eligibility thresholds specified by the National
              Merit Policy:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              {decisionTrace.ruleResults
                .filter((r) => r.isMandatory && r.status === 'FAIL')
                .map((r) => (
                  <li key={r.ruleId}>
                    <strong>Rule {r.ruleId} ({r.ruleName}):</strong> {r.explanation} Condition requires{' '}
                    <code>{r.thresholdCondition}</code>; verified value was <code>{String(r.actualInputValue)}</code>.
                  </li>
                ))}
            </ul>
            <div className="pt-2 border-t border-rose-200 font-medium">
              <strong>Appeal or Grievance Redressal:</strong> If you believe academic examination data was miscalculated,
              you may submit a formal re-evaluation grievance with an attested gazette marksheet within 14 business days.
            </div>
          </div>
        )}

        {/* Human Officer Review Record if exists */}
        {finalDecision && (
          <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Recorded Human Verification Officer Determination</span>
              </h4>
              <span className="font-mono text-[11px] text-slate-500">
                {new Date(finalDecision.decidedAt).toLocaleDateString('en-IN')}
              </span>
            </div>
            <p className="leading-relaxed">
              <strong>Reviewer Identity:</strong> {finalDecision.decidedBy}
            </p>
            <p className="leading-relaxed">
              <strong>Determination:</strong> {finalDecision.finalOutcome} (Officer Action:{' '}
              {finalDecision.officerRecommendation})
            </p>
            <div className="p-2.5 rounded bg-white border border-indigo-100 text-slate-800">
              <strong>Officer Rationale:</strong> {finalDecision.decisionReason}
            </div>
            {finalDecision.authorizedExceptionRecorded && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                <strong>Discretionary Exception Applied:</strong> {finalDecision.exceptionNotes} (Original automated
                recommendation [{finalDecision.originalSystemRecommendation}] preserved in permanent audit log).
              </div>
            )}
          </div>
        )}
      </div>

      {/* In-App Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">In-App Notification Dispatch Log</h3>
          </div>
          <span className="text-xs text-slate-400">
            {appNotifications.filter((n) => !n.isRead).length} unread
          </span>
        </div>

        {appNotifications.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No notifications dispatched for this case yet.</p>
        ) : (
          <div className="space-y-3">
            {appNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition flex items-start justify-between gap-4 ${
                  notif.isRead
                    ? 'bg-slate-50/70 border-slate-200'
                    : 'bg-indigo-50/30 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      notif.type === 'DECISION_READY'
                        ? 'bg-emerald-100 text-emerald-700'
                        : notif.type === 'MISMATCH_ALERT'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {notif.type === 'DECISION_READY' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : notif.type === 'MISMATCH_ALERT' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{notif.title}</h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                    <time className="text-[10px] text-slate-400 block mt-1.5 font-mono">
                      {new Date(notif.createdAt).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!notif.isRead && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Mark Read
                    </button>
                  )}
                  {notif.actionUrl && (
                    <button
                      onClick={() => onNavigate('applicant_documents')}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700"
                    >
                      Resolve
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
