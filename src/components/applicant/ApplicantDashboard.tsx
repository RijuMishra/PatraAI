import React from 'react';
import { ApplicationRecord, NotificationItem } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  IndianRupee,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface ApplicantDashboardProps {
  application: ApplicationRecord;
  notifications: NotificationItem[];
  onNavigate: (tab: string) => void;
}

export const ApplicantDashboard: React.FC<ApplicantDashboardProps> = ({
  application,
  notifications,
  onNavigate,
}) => {
  const { applicant, documents, status, refNumber, submittedAt, createdAt, decisionTrace } = application;

  const requiredDocTypes = ['INCOME_CERTIFICATE', 'MARKSHEET'];
  const uploadedCount = documents.filter((d) => requiredDocTypes.includes(d.type)).length;
  const isComplete = uploadedCount === requiredDocTypes.length;

  const relevantNotifications = notifications.filter((n) => n.applicationRef === refNumber).slice(0, 3);

  // Derive workflow steps
  const steps = [
    { label: 'Profile & Academics', done: true },
    { label: 'Documents Uploaded', done: isComplete },
    { label: 'Automated Extraction', done: documents.some((d) => Object.keys(d.extractedFields).length > 0) },
    { label: 'Rule Verification', done: Boolean(decisionTrace) },
    { label: 'Officer Decision', done: status === 'APPROVED' || status === 'REJECTED' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-6 text-white shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Application Ref: {refNumber}
              </span>
              <span className="text-xs text-slate-400">
                Submitted:{' '}
                {submittedAt
                  ? new Date(submittedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : 'Pending Submission'}
              </span>
            </div>
            <h1 className="text-2xl font-bold mt-2">Welcome back, {applicant.fullName || 'Scholar'}</h1>
            <p className="text-sm text-slate-300 mt-1">
              Applying for: <strong className="text-white">{application.schemeName}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/80 text-right">
              <span className="text-xs text-slate-400 block">Current Status</span>
              <div className="mt-1">
                <StatusPill status={status} size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Progress Tracker Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-300">Application Lifecycle Progress</span>
            <span className="text-xs font-semibold text-indigo-400">
              {Math.round((steps.filter((s) => s.done).length / steps.length) * 100)}% Complete
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  step.done
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-slate-800/50 border-slate-700/60 text-slate-400'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Required Banner if Any */}
      {status === 'ACTION_REQUIRED' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">Action Required on Your Application</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                One or more mandatory documents are missing or require clarification. Please review the checklist below
                and upload valid certificates to allow verification to proceed.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('applicant_documents')}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm transition"
          >
            Upload Now
          </button>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Document Checklist & Declared Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Required Documents Checklist Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Required Documents Checklist</h3>
                <p className="text-xs text-slate-500">Official proof required under Policy {application.policyVersion}</p>
              </div>
              <button
                onClick={() => onNavigate('applicant_documents')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
              >
                Manage Files <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Income Certificate */}
              {(() => {
                const doc = documents.find((d) => d.type === 'INCOME_CERTIFICATE');
                return (
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Income Certificate</h4>
                        <p className="text-xs text-slate-500">
                          {doc ? `${doc.fileName} (${(doc.fileSize / 1024).toFixed(0)} KB)` : 'Mandatory document missing'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {doc ? (
                        <StatusPill status={doc.status} size="sm" />
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Missing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Marksheet */}
              {(() => {
                const doc = documents.find((d) => d.type === 'MARKSHEET');
                return (
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${doc ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">Academic Marksheet</h4>
                        <p className="text-xs text-slate-500">
                          {doc ? `${doc.fileName} (${(doc.fileSize / 1024).toFixed(0)} KB)` : 'Mandatory document missing'}
                        </p>
                      </div>
                    </div>
                    <div>
                      {doc ? (
                        <StatusPill status={doc.status} size="sm" />
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Missing
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Declared Application Details Overview */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-3">Declared Profile Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Building className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Institution & Course</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mt-1">{applicant.institution || '—'}</p>
                <p className="text-xs text-slate-600">{applicant.course || '—'}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Academic Score Secured</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  {applicant.academicScore}% <span className="text-xs font-normal text-slate-500">of 100%</span>
                </p>
                <p className="text-[11px] text-slate-500">Qualifying threshold: 70.0%</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <IndianRupee className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Declared Annual Income</span>
                </div>
                <p className="text-sm font-bold text-slate-800 mt-1">
                  ₹{applicant.declaredAnnualIncome.toLocaleString('en-IN')}
                </p>
                <p className="text-[11px] text-slate-500">Policy ceiling: ₹3,50,000</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Registered Academic Year</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 mt-1">{applicant.academicYear || '1st Year'}</p>
                <p className="text-[11px] text-slate-500">Family Members: {applicant.familyMembersCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Recent In-App Notifications Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Notifications</h3>
              <button
                onClick={() => onNavigate('applicant_notifications')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                View all
              </button>
            </div>

            {relevantNotifications.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No recent alerts for this case.</p>
            ) : (
              <div className="space-y-2.5">
                {relevantNotifications.map((notif) => (
                  <div key={notif.id} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                    <p className="font-semibold text-slate-800">{notif.title}</p>
                    <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Portal Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('applicant_apply')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition shadow-xs"
              >
                <span>Edit / Review Application</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('applicant_documents')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition shadow-xs"
              >
                <span>Document Upload Center</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('applicant_results')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition shadow-xs"
              >
                <span>Document Verification Results</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigate('applicant_notifications')}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 transition shadow-xs"
              >
                <span>Decision & Explanations</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
