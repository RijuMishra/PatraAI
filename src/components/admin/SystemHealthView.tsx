import React from 'react';
import { ApplicationRecord } from '../../types';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Server,
  Lock,
  Cpu,
  Database,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

interface SystemHealthViewProps {
  applications: ApplicationRecord[];
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({ applications }) => {
  const totalDocs = applications.reduce((acc, a) => acc + a.documents.length, 0);
  const unreadableDocs = applications.reduce(
    (acc, a) => acc + a.documents.filter((d) => d.readability === 'UNREADABLE').length,
    0
  );
  const successfulOcrDocs = totalDocs - unreadableDocs;

  const checklistItems = [
    {
      category: 'Authentication & Access Control',
      title: 'Server-Side Identity & JWT Validation',
      status: 'DEMO_SIMULATED',
      desc: 'Role switching is currently client-side for hackathon demonstration. Production requires OAuth 2.0 / OIDC and token verification.',
    },
    {
      category: 'Document Storage & Privacy',
      title: 'Encrypted Object Storage with Pre-Signed URLs',
      status: 'DEMO_IN_MEMORY',
      desc: 'Uploaded files are handled in-memory (Blob URLs). Production requires AWS S3 / Google Cloud Storage with SSE-KMS encryption and automated TTL purge.',
    },
    {
      category: 'Adversarial Prompt Injection Defense',
      title: 'Untrusted Document Text Sanitizer',
      status: 'ACTIVE_IMPLEMENTED',
      desc: 'Active regex-based sanitization and entity escaping to prevent prompt injection or adversarial text embedded inside student marksheets.',
    },
    {
      category: 'Audit & Provenance',
      title: 'Immutable WORM Audit Ledger',
      status: 'DEMO_APPEND_ONLY',
      desc: 'Client-side append-only audit stream implemented. Production requires cryptographic hash chaining and append-only database records.',
    },
    {
      category: 'Decision Engine',
      title: 'Deterministic Policy Evaluation Core',
      status: 'ACTIVE_IMPLEMENTED',
      desc: 'Strict hierarchical precedence engine with demographic attribute isolation fully verified and operational.',
    },
    {
      category: 'Document Extraction',
      title: 'Extraction Adapter Architecture',
      status: 'DEMO_FIXTURE_MODE',
      desc: 'Running in Demo Fixture Mode with high-fidelity synthetic government certificates. Ready to connect Gemini Vision API endpoint.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Infrastructure Governance
              </span>
              <span className="text-xs text-slate-500 font-mono">Environment: Demo / Hackathon Sandbox</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <span>System Health, Integration & Production-Readiness</span>
            </h1>
            <p className="text-xs text-slate-500">
              Honest operational diagnostics, adapter modes, and gap analysis between hackathon prototype and enterprise production.
            </p>
          </div>
        </div>
      </div>

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700">Extraction Adapter Mode</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-extrabold text-indigo-700 block mt-1">
            DEMO EXTRACTION MODE
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Synthetic fixture records with OCR confidence metrics
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700">Document Processing Stats</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-bold text-slate-900 block mt-1">
            {successfulOcrDocs} Processed / {unreadableDocs} Degraded
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            {totalDocs} total documents ingested into memory
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-700">Active Policy Version</span>
            <Server className="w-4 h-4 text-sky-600" />
          </div>
          <span className="text-xl font-bold text-slate-900 block mt-1 font-mono">
            2026.1.4 (Active)
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            National Merit-cum-Means Postsecondary Policy
          </span>
        </div>
      </div>

      {/* Production Readiness Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">
            Enterprise Architecture & Security Readiness Gap Analysis
          </h3>
          <p className="text-xs text-slate-500">
            Detailed breakdown of what is implemented in the prototype versus what requires enterprise infrastructure.
          </p>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                </div>

                <div>
                  {item.status === 'ACTIVE_IMPLEMENTED' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Implemented & Functional</span>
                    </span>
                  ) : item.status === 'DEMO_FIXTURE_MODE' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                      <Cpu className="w-3 h-3 text-sky-600" />
                      <span>Demo Mode (Clean Adapter)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Simulation (Needs Cloud Backend)</span>
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
