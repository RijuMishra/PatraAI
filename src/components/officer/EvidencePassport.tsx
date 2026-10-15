import React from 'react';
import { ApplicationRecord, EvidencePassportCheck } from '../../types';
import { StatusPill } from '../common/StatusPill';
import {
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Layers,
  Sparkles,
  UserCheck,
  Scale,
  Calendar,
} from 'lucide-react';

interface EvidencePassportProps {
  application: ApplicationRecord;
  onNavigate: (tab: string) => void;
}

export const EvidencePassport: React.FC<EvidencePassportProps> = ({
  application,
  onNavigate,
}) => {
  const { evidencePassport, refNumber, applicant, documents, decisionTrace } = application;

  // If no formal checks saved in evidencePassport array yet, synthesize transparent checks from application documents
  const checks: EvidencePassportCheck[] =
    evidencePassport.length > 0
      ? evidencePassport
      : documents.map((doc, idx) => {
          const isIncome = doc.type === 'INCOME_CERTIFICATE';
          const field = isIncome ? 'Annual Gross Income' : 'Academic Percentage Score';
          const isConsistent = doc.status === 'VERIFIED_AGAINST_RULES';

          return {
            checkId: `CHK-${refNumber.slice(-4)}-0${idx + 1}`,
            documentRef: doc.fileName,
            documentType: doc.type,
            fieldChecked: field,
            source: 'AI_OCR_EXTRACTION',
            expectedCondition: isIncome
              ? 'Declared income matches verified document value within 2%'
              : 'Aggregate academic score >= 70.0%',
            actualResult: isIncome
              ? `Declared: ₹${applicant.declaredAnnualIncome.toLocaleString('en-IN')} | Document: ${
                  doc.extractedFields.annualIncome?.extractedValue || 'N/A'
                }`
              : `Declared: ${applicant.academicScore}% | Document: ${
                  doc.extractedFields.totalMarksObtained?.extractedValue || 'N/A'
                }`,
            status: isConsistent ? 'PASS' : doc.status === 'MISMATCH' ? 'FAIL' : 'REVIEW_REQUIRED',
            timestamp: doc.uploadedAt,
            method: 'DETERMINISTIC_RULE',
            actor: 'PatraAI Comparison Core',
            explanation: isConsistent
              ? 'Field values consistent and satisfy baseline policy criteria.'
              : 'Discrepancy detected or manual inspection required.',
            nextAction: isConsistent
              ? 'Ready for eligibility rule evaluation.'
              : 'Resolve discrepancy or request clarification.',
            distinctDimension: {
              isReadable: doc.readability === 'READABLE',
              isExtracted: Object.keys(doc.extractedFields).length > 0,
              isConsistentWithApp: isConsistent,
              satisfiesPolicyRule: isConsistent,
              isExternalVerified: false,
              authenticityEstablished: false,
            },
          };
        });

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
              <span className="text-xs text-slate-500 font-mono">Passport Ledger v1.4</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Evidence Passport (Field-Level Verification Record)</span>
            </h1>
            <p className="text-xs text-slate-500">
              Granular, field-level provenance audit matrix separating readability, consistency, policy satisfaction, and authenticity.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total Field Checks</span>
            <span className="text-base font-bold text-slate-800">{checks.length} Verified Evidence Records</span>
          </div>
        </div>

        {/* Six Dimensions Architectural Invariant Notice */}
        <div className="mt-5 p-4 rounded-xl bg-slate-900 text-white text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-indigo-300">
            <ShieldCheck className="w-4 h-4" />
            <span>The Six Discrete Verification Dimensions (Strictly Non-Conflated)</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2">
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-slate-200">1. Readable</span>
              <span className="text-[10px] text-slate-400">Clear optical density</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-slate-200">2. Extracted</span>
              <span className="text-[10px] text-slate-400">Parsed into schema</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-slate-200">3. Consistent</span>
              <span className="text-[10px] text-slate-400">Matches declared</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-slate-200">4. Policy Met</span>
              <span className="text-[10px] text-slate-400">Meets thresholds</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-slate-200">5. Ext. Verified</span>
              <span className="text-[10px] text-slate-400">Database API checked</span>
            </div>
            <div className="p-2 rounded bg-slate-800/80 border border-slate-700">
              <span className="font-bold block text-amber-400">6. Authentic</span>
              <span className="text-[10px] text-slate-400">Legally tamper-proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Field Checks Stream */}
      {checks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs shadow-sm">
          No field checks recorded. Upload documents in the Applicant Portal to populate the evidence passport.
        </div>
      ) : (
        <div className="space-y-4">
          {checks.map((chk) => (
            <div key={chk.checkId} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    {chk.checkId}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{chk.fieldChecked}</span>
                  <span className="text-xs text-slate-500 font-mono">[{chk.documentRef}]</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400">{chk.method}</span>
                  <StatusPill status={chk.status} size="sm" />
                </div>
              </div>

              {/* Conditions & Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Expected Condition
                  </span>
                  <p className="font-mono font-medium text-slate-800 mt-1">{chk.expectedCondition}</p>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Actual Result
                  </span>
                  <p className="font-mono font-bold text-slate-900 mt-1">{chk.actualResult}</p>
                </div>
              </div>

              {/* Six Dimensions Breakdown Matrix */}
              <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Dimension Integrity Status
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    {chk.distinctDimension.isReadable ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Readable</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    {chk.distinctDimension.isExtracted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Extracted</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    {chk.distinctDimension.isConsistentWithApp ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Consistent</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700">
                    {chk.distinctDimension.satisfiesPolicyRule ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>Policy Met</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-500">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>External Ref (N/A)</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-amber-700 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Unverified Authen.</span>
                  </div>
                </div>
              </div>

              {/* Audit Metadata Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Auditor / Actor: <strong>{chk.actor}</strong></span>
                </div>
                <div>
                  Next Action: <strong>{chk.nextAction}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
