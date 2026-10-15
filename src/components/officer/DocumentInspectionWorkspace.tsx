import React, { useState } from 'react';
import { ApplicationRecord, DocumentType, UploadedDocument } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { dataService } from '../../services/dataService';
import {
  SplitSquareVertical,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileCheck,
  ShieldAlert,
  Send,
  Eye,
  Edit3,
  Save,
  MessageSquare,
} from 'lucide-react';

interface DocumentInspectionWorkspaceProps {
  application: ApplicationRecord;
  onUpdateApplication: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

export const DocumentInspectionWorkspace: React.FC<DocumentInspectionWorkspaceProps> = ({
  application,
  onUpdateApplication,
  onNavigate,
}) => {
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [manualNote, setManualNote] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Manual field override states
  const [manualIncomeEntry, setManualIncomeEntry] = useState<string>('');
  const [manualMarksEntry, setManualMarksEntry] = useState<string>('');
  const [isEditingManualFields, setIsEditingManualFields] = useState(false);

  const doc = application.documents[selectedDocIndex];

  const handleAction = (
    actionType: 'MARK_READABLE' | 'MARK_UNREADABLE' | 'MARK_VERIFIED' | 'MARK_MISMATCH' | 'UNABLE_TO_VERIFY' | 'REQUEST_CORRECTION',
    reasonPrompt?: string
  ) => {
    if (!doc) return;

    let updatedStatus = doc.status;
    let updatedReadability = doc.readability;
    let eventReason = '';

    const note = manualNote.trim() || 'Officer manual verification action recorded.';

    if (actionType === 'MARK_READABLE') {
      updatedReadability = 'READABLE';
      updatedStatus = 'PROCESSING';
      eventReason = `Marked readable by officer. Reason: ${note}`;
    } else if (actionType === 'MARK_UNREADABLE') {
      updatedReadability = 'UNREADABLE';
      updatedStatus = 'UNREADABLE';
      eventReason = `Marked unreadable by officer due to optical defects. Reason: ${note}`;
    } else if (actionType === 'MARK_VERIFIED') {
      updatedStatus = 'VERIFIED_AGAINST_RULES';
      eventReason = `Officer confirmed field values against original certificate. Note: ${note}`;
    } else if (actionType === 'MARK_MISMATCH') {
      updatedStatus = 'MISMATCH';
      eventReason = `Officer marked critical mismatch between certificate and declaration. Note: ${note}`;
    } else if (actionType === 'UNABLE_TO_VERIFY') {
      updatedStatus = 'NEEDS_HUMAN_REVIEW';
      eventReason = `Officer unable to verify: ${note}`;
    } else if (actionType === 'REQUEST_CORRECTION') {
      updatedStatus = 'INCOMPLETE';
      eventReason = `Correction requested from applicant: ${note}`;
    }

    const updatedDocuments = [...application.documents];
    updatedDocuments[selectedDocIndex] = {
      ...doc,
      status: updatedStatus,
      readability: updatedReadability,
      manualVerificationNotes: note,
      verifiedBy: 'Verification Officer (Manual Workspace)',
      verifiedAt: new Date().toISOString(),
    };

    // If manual entry was saved
    if (manualIncomeEntry && doc.type === 'INCOME_CERTIFICATE') {
      updatedDocuments[selectedDocIndex].extractedFields = {
        ...updatedDocuments[selectedDocIndex].extractedFields,
        annualIncome: {
          fieldKey: 'annualIncome',
          fieldName: 'Manual Officer Verified Annual Income',
          extractedValue: manualIncomeEntry,
          confidence: 1.0,
          page: 1,
        },
      };
    }

    const updatedApp: ApplicationRecord = {
      ...application,
      documents: updatedDocuments,
      reviewNotes: [...application.reviewNotes, `[${new Date().toLocaleTimeString()}] ${eventReason}`],
    };

    const saved = dataService.saveApplication(updatedApp);
    dataService.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'MANUAL_VERIFICATION_PERFORMED',
      actor: 'Officer V. Deshmukh (VO-Central)',
      reasonOrResult: eventReason,
      policyVersion: saved.policyVersion,
    });

    onUpdateApplication(saved);
    setActionSuccess(`Action "${actionType.replace(/_/g, ' ')}" logged and application re-evaluated.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-xs">
            <SplitSquareVertical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono">
                {application.refNumber}
              </span>
              <span className="text-xs font-bold text-slate-900">{application.applicant.fullName}</span>
              <StatusPill status={application.status} size="sm" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Split-Screen Inspection Workspace: Dual-pane visual audit & deterministic validation.
            </p>
          </div>
        </div>

        {/* Document Selector Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          {application.documents.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => {
                setSelectedDocIndex(idx);
                setZoomLevel(100);
                setRotation(0);
              }}
              className={`text-xs px-2.5 py-1.5 rounded-md font-medium transition ${
                selectedDocIndex === idx
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[640px]">
        {/* LEFT PANE: Document Visual Inspector (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {/* Top Controls Toolbar */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-slate-600" />
              <span className="font-bold text-slate-800 truncate max-w-[200px]">
                {doc?.fileName || 'No Document Selected'}
              </span>
              {doc && <span className="text-slate-400 font-mono text-[10px]">({(doc.fileSize / 1024).toFixed(0)} KB)</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 rounded hover:bg-slate-200 text-slate-600"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-600 w-10 text-center">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="p-1 rounded hover:bg-slate-200 text-slate-600"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1 rounded hover:bg-slate-200 text-slate-600 ml-1"
                title="Rotate 90deg"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Document Canvas Area */}
          <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center min-h-[460px]">
            {!doc ? (
              <div className="text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No document attached to this application slot.</p>
              </div>
            ) : doc.fileDataUrl ? (
              doc.mimeType === 'application/pdf' ? (
                <iframe
                  src={doc.fileDataUrl}
                  title="PDF Preview"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className="w-full h-[520px] bg-white rounded border border-slate-300 shadow-xs"
                />
              ) : (
                <img
                  src={doc.fileDataUrl}
                  alt="Inspection Document"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                  className="max-w-full max-h-[520px] object-contain rounded border border-slate-300 shadow-xs"
                />
              )
            ) : (
              /* High-Fidelity Synthetic Document View */
              <div
                style={{
                  transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                className="w-[420px] bg-white p-6 rounded-lg shadow border border-slate-300 text-xs space-y-4 font-serif text-slate-800"
              >
                <div className="text-center border-b pb-2">
                  <span className="font-bold text-xs uppercase tracking-wider block text-slate-900">
                    GOVERNMENT OF INDIA / REVENUE AUTHORITY
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans">
                    Certified Document Inspection Canvas (Demo Fixture)
                  </span>
                </div>

                <div className="space-y-2 text-[11px] font-sans">
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Document Type:</span>
                    <strong className="text-slate-900">{doc.title}</strong>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Candidate / Holder:</span>
                    <strong className="text-slate-900">{application.applicant.fullName}</strong>
                  </div>
                  {Object.values(doc.extractedFields).map((f) => (
                    <div key={f.fieldKey} className="flex justify-between border-b pb-1 bg-amber-50/60 p-1.5 rounded">
                      <span className="text-slate-600 font-medium">{f.fieldName}:</span>
                      <strong className="font-mono text-slate-900">{String(f.extractedValue)}</strong>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t text-center text-[10px] text-slate-400 font-sans">
                  Official Tahsildar / Registrar Seal & Digital Watermark
                </div>
              </div>
            )}
          </div>

          {/* Document Metadata Footer */}
          {doc && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span>Readability: <strong className="text-slate-800">{doc.readability}</strong></span>
              <span>Authenticity: <strong className="text-amber-700">{doc.authenticity}</strong></span>
              <span>Extraction Source: <strong className="text-slate-800">Demo Vision Adapter</strong></span>
            </div>
          )}
        </div>

        {/* RIGHT PANE: Extracted Data, Declared Application & Verification Actions (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col p-5 space-y-4 overflow-y-auto">
          {/* Comparison Checklist Header */}
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Cross-Verification Audit</span>
            </h3>
            <button
              onClick={() => setIsEditingManualFields(!isEditingManualFields)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingManualFields ? 'Cancel Entry' : 'Manual Entry'}</span>
            </button>
          </div>

          {/* Authenticity Disclaimer Warning */}
          <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-tight">
              <strong>Authenticity Distinction:</strong> Visual consistency and OCR pass does <em>not</em> prove
              document authenticity. Authenticity defaults to <code>UNVERIFIED</code> until verified through cryptographic
              or issuing-registry APIs.
            </p>
          </div>

          {/* Declared Application Data Box */}
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Applicant Declared Baseline
            </span>
            <div className="grid grid-cols-2 gap-2 text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block">Declared Annual Income:</span>
                <span className="font-bold text-slate-900">
                  ₹{application.applicant.declaredAnnualIncome.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Declared Academic Score:</span>
                <span className="font-bold text-slate-900">{application.applicant.academicScore}%</span>
              </div>
            </div>
          </div>

          {/* Extracted Fields Comparison */}
          {doc && (
            <div className="space-y-2">
              <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                Extracted Fields ({Object.keys(doc.extractedFields).length})
              </span>

              {isEditingManualFields ? (
                <div className="p-3 rounded-lg bg-indigo-50/40 border border-indigo-200 space-y-2 text-xs">
                  <span className="font-bold text-indigo-900">Manual Officer Field Overrides:</span>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Annual Income (₹):</label>
                    <input
                      type="text"
                      placeholder="e.g. ₹2,40,000"
                      value={manualIncomeEntry}
                      onChange={(e) => setManualIncomeEntry(e.target.value)}
                      className="w-full p-2 text-xs border rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block">Academic Score (%):</label>
                    <input
                      type="text"
                      placeholder="e.g. 88.5%"
                      value={manualMarksEntry}
                      onChange={(e) => setManualMarksEntry(e.target.value)}
                      className="w-full p-2 text-xs border rounded bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.values(doc.extractedFields).map((field) => (
                    <div
                      key={field.fieldKey}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="text-[11px] text-slate-500 block">{field.fieldName}</span>
                        <span className="font-bold text-slate-900">{String(field.extractedValue)}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {(field.confidence * 100).toFixed(0)}% conf
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviewer Note Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
              <span>Officer Verification Rationale / Audit Note *</span>
            </label>
            <textarea
              rows={2}
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              placeholder="Record explicit reason for manual action (required for audit compliance)..."
              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Manual Verification Actions Buttons */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
              Officer Verification Actions
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleAction('MARK_READABLE')}
                className="p-2 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark Readable</span>
              </button>

              <button
                onClick={() => handleAction('MARK_UNREADABLE')}
                className="p-2 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 transition flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Mark Unreadable</span>
              </button>

              <button
                onClick={() => handleAction('MARK_VERIFIED')}
                className="p-2 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mark Field Verified</span>
              </button>

              <button
                onClick={() => handleAction('MARK_MISMATCH')}
                className="p-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition flex items-center justify-center gap-1.5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Flag Mismatch</span>
              </button>

              <button
                onClick={() => handleAction('REQUEST_CORRECTION')}
                className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>Request Correction</span>
              </button>

              <button
                onClick={() => handleAction('UNABLE_TO_VERIFY')}
                className="p-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 transition flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                <span>Unable to Verify</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
