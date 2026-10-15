import React, { useState } from 'react';
import { ApplicationRecord } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  FolderSearch,
  AlertTriangle,
  FileQuestion,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Flame,
  FileX,
  Eye,
  UserCheck,
} from 'lucide-react';

interface ReviewDashboardProps {
  applications: ApplicationRecord[];
  onSelectApplication: (id: string) => void;
  onNavigate: (tab: string) => void;
}

export const ReviewDashboard: React.FC<ReviewDashboardProps> = ({
  applications,
  onSelectApplication,
  onNavigate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [issueFilter, setIssueFilter] = useState('ALL');

  // Compute live statistics from actual application records
  const totalAwaitingReview = applications.filter(
    (a) => a.status === 'UNDER_REVIEW' || a.status === 'PROCESSING' || a.status === 'ACTION_REQUIRED'
  ).length;

  const casesWithMismatches = applications.filter((a) => a.contradictions.some((c) => c.isMismatch)).length;

  const casesWithMissingOrUnreadable = applications.filter(
    (a) =>
      a.documents.some((d) => d.status === 'UNREADABLE' || d.readability === 'UNREADABLE') ||
      a.documents.length < 2
  ).length;

  const casesFailedExtraction = applications.filter((a) =>
    a.documents.some((d) => d.status === 'UNREADABLE' || d.readability === 'DEGRADED')
  ).length;

  const urgentCases = applications.filter(
    (a) => a.status === 'UNDER_REVIEW' && a.contradictions.some((c) => c.isMismatch)
  ).length;

  const reviewedCases = applications.filter(
    (a) => a.status === 'APPROVED' || a.status === 'REJECTED'
  ).length;

  // Filter application list
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      app.refNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.applicant.institution.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    let matchesIssue = true;
    if (issueFilter === 'MISMATCH') {
      matchesIssue = app.contradictions.some((c) => c.isMismatch);
    } else if (issueFilter === 'UNREADABLE') {
      matchesIssue = app.documents.some((d) => d.readability === 'UNREADABLE');
    } else if (issueFilter === 'URGENT') {
      matchesIssue = app.status === 'UNDER_REVIEW' && app.contradictions.some((c) => c.isMismatch);
    }

    return matchesSearch && matchesStatus && matchesIssue;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Verification Officer Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">Queue ID: VQ-ZONE-CENTRAL</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Document Verification & Case Review Queue</h1>
            <p className="text-xs text-slate-500">
              Computed metrics and priority workload routing based on automated extraction and contradiction flags.
            </p>
          </div>
        </div>
      </div>

      {/* Real Computed KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-600">Awaiting Review</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{totalAwaitingReview}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Pending officer triage</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-semibold text-amber-900">Mismatches</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <span className="text-2xl font-extrabold text-amber-900">{casesWithMismatches}</span>
          <span className="text-[10px] text-amber-700 block mt-1">Contradiction radar flagged</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-600">Doc Deficient</span>
            <FileQuestion className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{casesWithMissingOrUnreadable}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Missing / low resolution</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold text-slate-600">OCR Degraded</span>
            <FileX className="w-4 h-4 text-rose-500" />
          </div>
          <span className="text-2xl font-extrabold text-slate-900">{casesFailedExtraction}</span>
          <span className="text-[10px] text-slate-400 block mt-1">Requires manual inspection</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-[11px] font-semibold text-rose-900">Urgent Attention</span>
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-2xl font-extrabold text-rose-700">{urgentCases}</span>
          <span className="text-[10px] text-rose-600 block mt-1">Disputed variance block</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-semibold text-emerald-900">Determined</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-2xl font-extrabold text-emerald-700">{reviewedCases}</span>
          <span className="text-[10px] text-emerald-600 block mt-1">Officer finalized</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by application ref (e.g. APP-2026-0893), student name, or institution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="PROCESSING">Processing</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ACTION_REQUIRED">Action Required</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Issues</option>
            <option value="MISMATCH">Mismatches Only</option>
            <option value="UNREADABLE">Unreadable / Degraded Scan</option>
            <option value="URGENT">Urgent Priority Only</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Application Ref</th>
                <th className="p-3.5">Candidate Name</th>
                <th className="p-3.5">Declared vs Extracted Income</th>
                <th className="p-3.5">Merit Score</th>
                <th className="p-3.5">Documents & Issues</th>
                <th className="p-3.5">System Rec</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No applications matched the current search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const hasMismatch = app.contradictions.some((c) => c.isMismatch);
                  const isUnreadable = app.documents.some((d) => d.readability === 'UNREADABLE');
                  const incDoc = app.documents.find((d) => d.type === 'INCOME_CERTIFICATE');
                  const extIncome = incDoc?.extractedFields?.annualIncome?.extractedValue;

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition ${
                        hasMismatch ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono font-bold text-slate-900">
                        {app.refNumber}
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-slate-900 block">{app.applicant.fullName}</span>
                        <span className="text-[11px] text-slate-500 truncate max-w-[150px] block">
                          {app.applicant.institution}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <span className="text-slate-600 block">
                            Declared: <strong>₹{app.applicant.declaredAnnualIncome.toLocaleString('en-IN')}</strong>
                          </span>
                          <span className="text-slate-500 text-[11px] block">
                            Extracted:{' '}
                            <strong className={hasMismatch ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                              {extIncome ? String(extIncome) : 'Pending / None'}
                            </strong>
                          </span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-800">{app.applicant.academicScore}%</span>
                        <span className="text-[10px] text-slate-400 block">Min req: 70.0%</span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">
                            {app.documents.length} Docs
                          </span>
                          {hasMismatch && (
                            <span className="text-[10px] bg-amber-100 border border-amber-300 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                              Mismatch
                            </span>
                          )}
                          {isUnreadable && (
                            <span className="text-[10px] bg-rose-100 border border-rose-300 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                              Unreadable
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded ${
                            app.decisionTrace?.initialRecommendation === 'APPROVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : app.decisionTrace?.initialRecommendation === 'REJECT'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {app.decisionTrace?.initialRecommendation || 'PENDING'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <StatusPill status={app.status} size="sm" />
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => {
                            onSelectApplication(app.id);
                            onNavigate('officer_workspace');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 ml-auto shadow-xs transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Case</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
