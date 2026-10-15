import React from 'react';
import { ApplicationRecord, AuditEvent } from '../../types';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Send,
  Sparkles,
  Gavel,
  ShieldCheck,
} from 'lucide-react';

interface ApplicationTimelineProps {
  application: ApplicationRecord;
  auditEvents: AuditEvent[];
}

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  application,
  auditEvents,
}) => {
  const { refNumber, createdAt, submittedAt, documents, contradictions, finalDecision } = application;

  // Filter audit events specific to this application
  const appEvents = auditEvents.filter((e) => e.applicationRef === refNumber);

  // If no formal audit events exist, synthesize standard timeline points from state
  const timelinePoints: {
    title: string;
    description: string;
    timestamp: string;
    icon: any;
    color: string;
    badge: string;
  }[] = [];

  // 1. Draft Created
  timelinePoints.push({
    title: 'Draft Application Initialized',
    description: `Applicant profile and demographic baseline created under reference ${refNumber}.`,
    timestamp: createdAt,
    icon: FileText,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    badge: 'DRAFT',
  });

  // 2. Submitted
  if (submittedAt) {
    timelinePoints.push({
      title: 'Application Formally Submitted',
      description: `Declarations signed by applicant. Queued for document validation against Policy ${application.policyVersion}.`,
      timestamp: submittedAt,
      icon: Send,
      color: 'text-sky-600 bg-sky-50 border-sky-200',
      badge: 'SUBMITTED',
    });
  }

  // 3. Documents Uploaded
  for (const doc of documents) {
    timelinePoints.push({
      title: `Document Uploaded: ${doc.title}`,
      description: `File "${doc.fileName}" (${(doc.fileSize / 1024).toFixed(0)} KB) received into memory store. Readability: ${doc.readability}.`,
      timestamp: doc.uploadedAt,
      icon: Sparkles,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      badge: 'DOC_RECEIVED',
    });
  }

  // 4. Mismatch / Issues
  for (const c of contradictions) {
    timelinePoints.push({
      title: `Discrepancy Detected: ${c.fieldName}`,
      description: `Contradiction Radar flagged variance: Declared [${c.declaredValue}] vs Extracted [${c.extractedValue}]. Approval locked pending human review.`,
      timestamp: c.detectedAt,
      icon: AlertTriangle,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      badge: 'MISMATCH_FLAGGED',
    });
  }

  // 5. Audit Events
  for (const evt of appEvents) {
    if (
      evt.eventType !== 'APPLICATION_CREATED' &&
      evt.eventType !== 'APPLICATION_SUBMITTED' &&
      evt.eventType !== 'DOCUMENT_UPLOADED'
    ) {
      timelinePoints.push({
        title: evt.eventType.replace(/_/g, ' '),
        description: `${evt.reasonOrResult} (Actor: ${evt.actor})`,
        timestamp: evt.timestamp,
        icon: UserCheck,
        color: 'text-slate-700 bg-slate-100 border-slate-200',
        badge: evt.eventType,
      });
    }
  }

  // 6. Final Decision if recorded
  if (finalDecision) {
    timelinePoints.push({
      title: `Final Decision Recorded: ${finalDecision.finalOutcome}`,
      description: `Officer ${finalDecision.decidedBy} finalized case. Reason: "${finalDecision.decisionReason}". Original system recommendation preserved as [${finalDecision.originalSystemRecommendation}].`,
      timestamp: finalDecision.decidedAt,
      icon: Gavel,
      color:
        finalDecision.finalOutcome === 'APPROVED'
          ? 'text-emerald-700 bg-emerald-100 border-emerald-300'
          : 'text-rose-700 bg-rose-100 border-rose-300',
      badge: finalDecision.finalOutcome,
    });
  }

  // Sort chronological descending (newest first)
  timelinePoints.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Ref: {refNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Application Tracking & Audit History</h1>
            <p className="text-xs text-slate-500">
              Complete chronological audit trail of all lifecycle events, automated OCR evaluations, and human officer actions.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Events Logged</span>
            <span className="text-sm font-bold text-slate-800">{timelinePoints.length} Milestones</span>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {timelinePoints.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="relative group">
                {/* Dot / Icon */}
                <div
                  className={`absolute -left-[30px] top-0 w-7 h-7 rounded-full border flex items-center justify-center shadow-xs ${point.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 ml-2 transition hover:border-slate-300 hover:bg-white shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{point.title}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-semibold">
                        {point.badge}
                      </span>
                    </div>
                    <time className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(point.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </time>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{point.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
