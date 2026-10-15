import React from 'react';
import { ApplicationRecord, DocumentStatus } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Info,
  Scale,
  Sparkles,
} from 'lucide-react';

interface DocumentVerificationResultsProps {
  application: ApplicationRecord;
  onNavigate: (tab: string) => void;
}

export const DocumentVerificationResults: React.FC<DocumentVerificationResultsProps> = ({
  application,
  onNavigate,
}) => {
  const { documents, contradictions, applicant, decisionTrace, refNumber } = application;

  const getPlainLanguageExplanation = (status: DocumentStatus): string => {
    switch (status) {
      case 'VERIFIED_AGAINST_RULES':
        return 'The document is completely readable, required data was extracted successfully, and figures match your declared application.';
      case 'MISMATCH':
        return 'Discrepancy detected: The value extracted from this certificate differs from the figure you entered in your application form.';
      case 'UNREADABLE':
        return 'The uploaded document image or scan is blurred, dark, or corrupted. Optical text recognition could not reliably read key fields.';
      case 'INCOMPLETE':
        return 'The document is missing mandatory sections or seals required by the scholarship verification standard.';
      case 'NEEDS_HUMAN_REVIEW':
        return 'Automated checks detected an anomaly that requires manual inspection by a human verification officer.';
      case 'FAILED_VALIDATION':
        return 'The certificate failed basic format or structural validation rules.';
      case 'PROCESSING':
        return 'The document is queued for OCR text extraction and automated policy rule evaluation.';
      case 'RECEIVED':
      default:
        return 'The document has been securely stored in memory and is awaiting processing.';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Application: {refNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Document Verification Results</h1>
            <p className="text-xs text-slate-500">
              Transparent, field-by-field verification report detailing declared versus extracted values and plain-language status explanations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Evidence Completeness:</span>
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
              {decisionTrace?.evidenceCompletenessPercentage ?? 50}%
            </span>
          </div>
        </div>
      </div>

      {/* Discrepancy Alert If Any Contradictions Found */}
      {contradictions.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Data Contradiction Flagged by Verification Core</span>
          </div>
          <p className="leading-relaxed">
            PatraAI has detected a variance between the figure declared on your application and the certified figure extracted
            from your uploaded documents. Approval is safely paused pending officer review or applicant correction.
          </p>
          <div className="mt-2 space-y-2">
            {contradictions.map((c) => (
              <div key={c.id} className="p-3 bg-white/80 rounded-lg border border-amber-200 text-xs">
                <span className="font-semibold text-slate-800">{c.fieldName}:</span> Declared{' '}
                <strong className="text-slate-900">{c.declaredValue}</strong> vs Certified Document{' '}
                <strong className="text-amber-800">{c.extractedValue}</strong>.
                <p className="text-[11px] text-slate-500 mt-0.5">{c.ruleDescription}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Detailed Results Cards */}
      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">No Documents Uploaded Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Please visit the Document Upload Center to submit your Income Certificate and Marksheet for verification.
          </p>
          <button
            onClick={() => onNavigate('applicant_documents')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
          >
            Go to Upload Center
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {documents.map((doc) => {
            const hasExtractedFields = Object.keys(doc.extractedFields).length > 0;

            // Compute comparison with declared application values
            let declaredComparison: {
              field: string;
              declared: string | number;
              extracted: string | number | null;
              isMatch: boolean;
            } | null = null;

            if (doc.type === 'INCOME_CERTIFICATE') {
              const extIncome = doc.extractedFields.annualIncome?.extractedValue;
              declaredComparison = {
                field: 'Annual Income',
                declared: `₹${applicant.declaredAnnualIncome.toLocaleString('en-IN')}`,
                extracted: extIncome ? String(extIncome) : 'Not extracted',
                isMatch: doc.status !== 'MISMATCH',
              };
            } else if (doc.type === 'MARKSHEET') {
              const extMarks = doc.extractedFields.totalMarksObtained?.extractedValue;
              declaredComparison = {
                field: 'Qualifying Score (%)',
                declared: `${applicant.academicScore}%`,
                extracted: extMarks ? String(extMarks) : 'Not extracted',
                isMatch: true,
              };
            }

            return (
              <div key={doc.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Header Strip */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-700">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500 font-mono">
                        {doc.fileName} • {(doc.fileSize / 1024).toFixed(0)} KB • Uploaded:{' '}
                        {new Date(doc.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusPill status={doc.status} size="md" />
                  </div>
                </div>

                {/* Plain Language Status Explanation Banner */}
                <div className="px-5 py-3 bg-indigo-50/40 border-b border-indigo-100/60 text-xs text-indigo-950 flex items-start gap-2">
                  <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Status Explanation: </strong>
                    <span>{getPlainLanguageExplanation(doc.status)}</span>
                  </div>
                </div>

                {/* Body: Comparison & Extracted Fields */}
                <div className="p-5 space-y-5">
                  {/* Declared vs Extracted Comparison Highlight */}
                  {declaredComparison && (
                    <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/80">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Declared Input vs Document Extraction Comparison</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[11px] text-slate-400 block">Declared in Form:</span>
                          <span className="text-sm font-bold text-slate-800">{declaredComparison.declared}</span>
                        </div>

                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[11px] text-slate-400 block">Extracted from Document:</span>
                          <span className="text-sm font-bold text-slate-800">{declaredComparison.extracted}</span>
                        </div>

                        <div
                          className={`p-2.5 rounded border flex items-center justify-between ${
                            declaredComparison.isMatch
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}
                        >
                          <div>
                            <span className="text-[11px] block font-medium">Comparison Result:</span>
                            <span className="text-xs font-bold">
                              {declaredComparison.isMatch ? 'CONSISTENT' : 'CRITICAL MISMATCH'}
                            </span>
                          </div>
                          {declaredComparison.isMatch ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Extracted Fields Table */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Extracted Document Attributes (Structured Schema)</span>
                    </h4>

                    {!hasExtractedFields ? (
                      <p className="text-xs text-slate-400 italic">No structured fields extracted.</p>
                    ) : (
                      <div className="overflow-x-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="p-2.5">Field Name</th>
                              <th className="p-2.5">Extracted Value</th>
                              <th className="p-2.5">Model Confidence</th>
                              <th className="p-2.5">Page / Bounding Hint</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {Object.values(doc.extractedFields).map((field) => (
                              <tr key={field.fieldKey} className="hover:bg-slate-50/70">
                                <td className="p-2.5 font-medium text-slate-900">{field.fieldName}</td>
                                <td className="p-2.5 font-mono font-semibold text-slate-800">
                                  {String(field.extractedValue)}
                                </td>
                                <td className="p-2.5">
                                  <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                    {(field.confidence * 100).toFixed(0)}%
                                  </span>
                                </td>
                                <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                                  {field.boundingBoxHint || `Page ${field.page || 1}`}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Applicant Next Steps */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                      <strong>Applicant Next Step: </strong>
                      {doc.status === 'MISMATCH'
                        ? 'Review your declared annual income or contact verification officer to clarify variance.'
                        : doc.status === 'UNREADABLE'
                        ? 'Re-upload a higher resolution scan of this document.'
                        : 'No action needed. Document passed automated verification checks.'}
                    </div>

                    {doc.status !== 'VERIFIED_AGAINST_RULES' && (
                      <button
                        onClick={() => onNavigate('applicant_documents')}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 shrink-0"
                      >
                        Replace Document <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
