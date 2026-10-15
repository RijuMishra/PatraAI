import React, { useState } from 'react';
import { ApplicationRecord, PolicyConfiguration, PolicyRule } from '../../types';
import { dataService } from '../../services/dataService';
import { evaluateApplication } from '../../services/policyEngine';
import {
  Settings2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldAlert,
  Sliders,
  History,
} from 'lucide-react';

interface PolicyManagementProps {
  applications: ApplicationRecord[];
  onPolicyUpdated: () => void;
}

export const PolicyManagement: React.FC<PolicyManagementProps> = ({
  applications,
  onPolicyUpdated,
}) => {
  const activePolicy = dataService.getActivePolicy('SCHOLARSHIP');

  const [policyName, setPolicyName] = useState(activePolicy.name);
  const [version, setVersion] = useState(activePolicy.version);
  const [maxIncome, setMaxIncome] = useState(activePolicy.maxAnnualIncome);
  const [minMarks, setMinMarks] = useState(activePolicy.minAcademicPercentage);
  const [tolerance, setTolerance] = useState(activePolicy.comparisonToleranceIncomePercent);

  const [previewResults, setPreviewResults] = useState<{
    totalEvaluated: number;
    wouldApprove: number;
    wouldReject: number;
    wouldReview: number;
  } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSimulateImpact = () => {
    // Construct hypothetical policy
    const testPolicy: PolicyConfiguration = {
      ...activePolicy,
      maxAnnualIncome: Number(maxIncome),
      minAcademicPercentage: Number(minMarks),
      comparisonToleranceIncomePercent: Number(tolerance),
    };

    let approves = 0;
    let rejects = 0;
    let reviews = 0;

    for (const app of applications) {
      const trace = evaluateApplication(app, testPolicy);
      if (trace.initialRecommendation === 'APPROVE') approves++;
      else if (trace.initialRecommendation === 'REJECT') rejects++;
      else reviews++;
    }

    setPreviewResults({
      totalEvaluated: applications.length,
      wouldApprove: approves,
      wouldReject: rejects,
      wouldReview: reviews,
    });
  };

  const handleSavePolicy = () => {
    setValidationError(null);
    setSaveSuccess(null);

    if (maxIncome <= 0) {
      setValidationError('Max Annual Income must be greater than ₹0.');
      return;
    }
    if (minMarks < 0 || minMarks > 100) {
      setValidationError('Minimum Academic Percentage must be between 0% and 100%.');
      return;
    }
    if (!version.trim()) {
      setValidationError('Policy version identifier cannot be blank.');
      return;
    }

    // Increment or update policy configuration
    const updatedPolicy: PolicyConfiguration = {
      ...activePolicy,
      name: policyName,
      version: version.trim(),
      maxAnnualIncome: Number(maxIncome),
      minAcademicPercentage: Number(minMarks),
      comparisonToleranceIncomePercent: Number(tolerance),
      effectiveDate: new Date().toISOString(),
    };

    dataService.updatePolicy(updatedPolicy);
    onPolicyUpdated();
    setSaveSuccess(`Policy "${updatedPolicy.name}" v${updatedPolicy.version} saved as active policy.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Governance Control Center
              </span>
              <span className="text-xs text-slate-500 font-mono">Active Version: {activePolicy.version}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-600" />
              <span>Policy Rules & Eligibility Thresholds Manager</span>
            </h1>
            <p className="text-xs text-slate-500">
              Configure parameters governing automated approvals. Updates preserve previous decision versions.
            </p>
          </div>
        </div>

        {/* Sensitive Attributes Exclusion Guarantee */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-900 text-white text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Algorithmic Fairness Lock:</strong> Sensitive demographic attributes (such as religion, gender,
            and caste category) are explicitly excluded from eligibility rules and decision engine evaluation pipelines.
            They cannot be added as criteria.
          </p>
        </div>
      </div>

      {/* Alert Messages */}
      {validationError && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Policy Settings Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Policy Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Scheme Policy Title *</label>
            <input
              type="text"
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Version Identifier */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Policy Version Code *</label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="e.g. 2026.1.5"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Max Annual Income Threshold */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Maximum Gross Annual Family Income Ceiling (₹) *
            </label>
            <input
              type="number"
              step="5000"
              value={maxIncome}
              onChange={(e) => setMaxIncome(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400">
              Current: ₹{maxIncome.toLocaleString('en-IN')}. Above this ceiling triggers automatic REJECT recommendation.
            </span>
          </div>

          {/* Min Academic Percentage Threshold */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Minimum Academic Exam Qualifying Score (%) *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="100"
              value={minMarks}
              onChange={(e) => setMinMarks(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400">
              Current: {minMarks}%. Below this score triggers automatic REJECT recommendation.
            </span>
          </div>

          {/* Comparison Tolerance */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">
              Declared vs Document Income Permissible Tolerance (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-[10px] text-slate-400">
              Allows minor rounding variance (e.g. 2%) before triggering Contradiction Radar.
            </span>
          </div>

          {/* Mandatory Documents Required */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Mandatory Documents Enforced</label>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-medium">
                INCOME_CERTIFICATE
              </span>
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono font-medium">
                MARKSHEET
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              Omission of any mandatory document immediately locks case into NEEDS_REVIEW.
            </span>
          </div>
        </div>

        {/* Simulation Preview Impact Section */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Simulate Policy Impact on Synthetic Cohort</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Runs proposed thresholds across all loaded test cases before saving.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSimulateImpact}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400" />
              <span>Run Impact Simulation</span>
            </button>
          </div>

          {previewResults && (
            <div className="grid grid-cols-4 gap-2 pt-2 text-xs">
              <div className="p-2.5 rounded bg-white border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block">Evaluated</span>
                <span className="font-bold text-slate-900">{previewResults.totalEvaluated} Cases</span>
              </div>
              <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-center text-emerald-800">
                <span className="text-[10px] block">Would Approve</span>
                <span className="font-bold">{previewResults.wouldApprove}</span>
              </div>
              <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-center text-rose-800">
                <span className="text-[10px] block">Would Reject</span>
                <span className="font-bold">{previewResults.wouldReject}</span>
              </div>
              <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-center text-amber-800">
                <span className="text-[10px] block">Needs Review</span>
                <span className="font-bold">{previewResults.wouldReview}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Button Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleSavePolicy}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Publish & Save Policy Version</span>
          </button>
        </div>
      </div>
    </div>
  );
};
