import React, { useState } from 'react';
import { AuditEvent } from '../../types';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Download,
  AlertCircle,
  FileCheck2,
  Lock,
} from 'lucide-react';

interface AuditTrailViewProps {
  auditEvents: AuditEvent[];
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({ auditEvents }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredEvents = auditEvents.filter((evt) => {
    const matchesSearch =
      evt.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.applicationRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evt.reasonOrResult.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'ALL' || evt.eventType === typeFilter;

    return matchesSearch && matchesType;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditEvents, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `patra_ai_audit_trail_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Statutory Compliance
              </span>
              <span className="text-xs text-slate-500 font-mono">Append-Only Event Stream</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>System-Wide Audit Trail & Event Ledger</span>
            </h1>
            <p className="text-xs text-slate-500">
              Chronological provenance capturing lifecycle events, document uploads, automated decisions, and human review actions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Audit JSON</span>
            </button>
          </div>
        </div>

        {/* Honest Security Disclaimer */}
        <div className="mt-4 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5 leading-relaxed">
            <strong className="block text-amber-950 font-semibold">
              Prototype Transparency & Production Architecture Notice:
            </strong>
            <p>
              In this client-side demo environment, events are recorded in an append-only in-memory list with local storage
              caching. This demonstrates the event schema and compliance logging workflow. <strong>True tamper resistance</strong>{' '}
              in an enterprise production deployment requires write-once-read-many (WORM) storage, cryptographic hash chaining,
              and authenticated backend microservices.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search audit trail by event ID, application ref, actor, or rationale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500">Event Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Event Types</option>
            <option value="APPLICATION_CREATED">Application Created</option>
            <option value="APPLICATION_SUBMITTED">Application Submitted</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="MISMATCH_DETECTED">Mismatch Detected</option>
            <option value="MANUAL_VERIFICATION_PERFORMED">Manual Verification</option>
            <option value="DECISION_EVALUATED">Decision Evaluated</option>
            <option value="HUMAN_OVERRIDE_RECORDED">Human Override</option>
            <option value="FINAL_DECISION_ISSUED">Final Decision Issued</option>
            <option value="POLICY_UPDATED">Policy Updated</option>
          </select>
        </div>
      </div>

      {/* Audit Events Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/80 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">Event ID</th>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Application Ref</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Actor / Origin</th>
                <th className="p-3.5">Reason, Evidence & Recorded Result</th>
                <th className="p-3.5">Policy Version</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No audit records matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/70">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{evt.eventId}</td>

                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(evt.timestamp).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>

                    <td className="p-3.5 font-mono font-semibold text-slate-800">
                      {evt.applicationRef}
                    </td>

                    <td className="p-3.5">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {evt.eventType}
                      </span>
                    </td>

                    <td className="p-3.5 font-medium text-slate-900">{evt.actor}</td>

                    <td className="p-3.5 text-slate-600 max-w-md leading-relaxed">
                      {evt.reasonOrResult}
                    </td>

                    <td className="p-3.5 font-mono text-slate-500">{evt.policyVersion}</td>
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
