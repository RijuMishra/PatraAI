import React, { useState } from 'react';
import { ApplicationRecord } from '../../types';
import { validateApplicationInputs } from '../../services/policyEngine';
import { dataService } from '../../services/dataService';
import {
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Building,
  User,
  GraduationCap,
  IndianRupee,
  ShieldAlert,
} from 'lucide-react';

interface ScholarshipApplicationFormProps {
  application: ApplicationRecord;
  onSave: (app: ApplicationRecord) => void;
  onSubmit: (app: ApplicationRecord) => void;
  onNavigate: (tab: string) => void;
}

export const ScholarshipApplicationForm: React.FC<ScholarshipApplicationFormProps> = ({
  application,
  onSave,
  onSubmit,
  onNavigate,
}) => {
  const [formData, setFormData] = useState({
    fullName: application.applicant.fullName,
    email: application.applicant.email,
    phone: application.applicant.phone,
    institution: application.applicant.institution,
    course: application.applicant.course,
    academicYear: application.applicant.academicYear,
    academicScore: application.applicant.academicScore,
    declaredAnnualIncome: application.applicant.declaredAnnualIncome,
    familyMembersCount: application.applicant.familyMembersCount,
    schemeType: application.schemeType,
    schemeName: application.schemeName,
  });

  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
  };

  const constructUpdatedApp = (): ApplicationRecord => {
    return {
      ...application,
      schemeType: formData.schemeType,
      schemeName: formData.schemeName,
      applicant: {
        ...application.applicant,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        institution: formData.institution,
        course: formData.course,
        academicYear: formData.academicYear,
        academicScore: Number(formData.academicScore),
        declaredAnnualIncome: Number(formData.declaredAnnualIncome),
        familyMembersCount: Number(formData.familyMembersCount),
      },
    };
  };

  const handleSaveDraft = () => {
    const updated = constructUpdatedApp();
    const saved = dataService.saveApplication(updated);
    onSave(saved);
    setSuccessMessage('Draft saved successfully to session storage.');
  };

  const handleValidateAndReview = () => {
    const updated = constructUpdatedApp();
    const result = validateApplicationInputs(updated);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }
    setValidationErrors([]);
    setIsReviewMode(true);
  };

  const handleSubmitFormal = () => {
    if (!declarationChecked) {
      setValidationErrors(['You must agree to the statutory truthfulness declaration before submitting.']);
      return;
    }
    const updated = constructUpdatedApp();
    const result = validateApplicationInputs(updated);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }

    const submittedApp: ApplicationRecord = {
      ...updated,
      status: 'SUBMITTED',
      submittedAt: new Date().toISOString(),
    };

    const saved = dataService.saveApplication(submittedApp);
    dataService.recordAuditEvent({
      applicationRef: saved.refNumber,
      eventType: 'APPLICATION_SUBMITTED',
      actor: `${saved.applicant.fullName} (Applicant)`,
      reasonOrResult: `Formal application submitted for ${saved.schemeName}.`,
      policyVersion: saved.policyVersion,
    });

    dataService.addNotification({
      applicationRef: saved.refNumber,
      type: 'INFO',
      title: 'Application Submitted Successfully',
      message: `Your scholarship application ${saved.refNumber} has been submitted and queued for document verification.`,
    });

    onSubmit(saved);
    setSuccessMessage('Application submitted successfully! Redirecting to Document Upload Center...');
    setTimeout(() => {
      onNavigate('applicant_documents');
    }, 1200);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Ref: {application.refNumber}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Scholarship Application Form</h1>
            <p className="text-xs text-slate-500">
              Fill in your academic and income declarations. All entries are cross-checked against uploaded certificates.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Policy Benchmark</span>
            <span className="text-xs font-bold text-slate-700">{application.policyVersion}</span>
          </div>
        </div>

        {/* Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Please resolve the following input issues:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 pl-2">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="mt-6 space-y-6">
          {/* Section 1: Scheme Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>1. Scheme & Policy Selection</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship / Scheme Type</label>
                <select
                  value={formData.schemeType}
                  onChange={(e) => {
                    const type = e.target.value as 'SCHOLARSHIP' | 'LOAN';
                    handleChange('schemeType', type);
                    handleChange(
                      'schemeName',
                      type === 'SCHOLARSHIP'
                        ? 'National Merit-cum-Means Postsecondary Policy'
                        : 'Higher Education Concessional Student Credit Scheme'
                    );
                  }}
                  disabled={isReviewMode}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="SCHOLARSHIP">Postsecondary Merit-cum-Means Scholarship</option>
                  <option value="LOAN">Concessional Student Higher Education Credit (Loan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Scheme Title</label>
                <input
                  type="text"
                  value={formData.schemeName}
                  disabled
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 bg-slate-100 text-slate-600 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Personal & Contact */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>2. Applicant Information</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="student@example.ac.in"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="+91 98765 43210"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Academic Details */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span>3. Academic Enrollment & Merit Score</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">Institution / University *</label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => handleChange('institution', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="e.g. Delhi Technological University"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Course of Study *</label>
                <input
                  type="text"
                  value={formData.course}
                  onChange={(e) => handleChange('course', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Current Academic Year</label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => handleChange('academicYear', e.target.value)}
                  disabled={isReviewMode}
                  placeholder="e.g. 2nd Year (Semester 4)"
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Qualifying Exam Percentage Score (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.academicScore}
                  onChange={(e) => handleChange('academicScore', e.target.value)}
                  disabled={isReviewMode}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Valid range: 0.0% to 100.0%</span>
              </div>
            </div>
          </div>

          {/* Section 4: Income Details */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-indigo-600" />
              <span>4. Income & Household Criteria</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Declared Gross Annual Family Income (₹) *
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.declaredAnnualIncome}
                  onChange={(e) => handleChange('declaredAnnualIncome', e.target.value)}
                  disabled={isReviewMode}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Must match the certified amount in your official Tahsildar/SDM certificate.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Total Family Household Count</label>
                <input
                  type="number"
                  min="1"
                  value={formData.familyMembersCount}
                  onChange={(e) => handleChange('familyMembersCount', e.target.value)}
                  disabled={isReviewMode}
                  className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Declaration and Statutory Disclaimer */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="statutory_decl"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="statutory_decl" className="leading-relaxed">
                <strong>Statutory Declaration:</strong> I solemnly declare that all statements made in this application
                are true, complete, and correct to the best of my knowledge and belief. I understand that any deliberate
                mismatch between declared figures and authenticated certificates will trigger manual officer review and
                may result in adverse decision or rejection.
              </label>
            </div>
          </div>

          {/* Action Button Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isReviewMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsReviewMode(false)}
                    className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                  >
                    Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFormal}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Confirm & Submit Application</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleValidateAndReview}
                  className="w-full sm:w-auto px-5 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Validate & Review Application</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
