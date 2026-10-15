import React from 'react';
import { ApplicationStatus, DocumentStatus, RuleStatus } from '../../types';
import { CheckCircle2, Clock, AlertTriangle, XCircle, FileQuestion, ShieldCheck, Eye } from 'lucide-react';

interface StatusPillProps {
  status: ApplicationStatus | DocumentStatus | RuleStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  switch (status) {
    case 'APPROVED':
    case 'VERIFIED_AGAINST_RULES':
    case 'PASS':
    case 'READABLE':
    case 'RESOLVED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );

    case 'SUBMITTED':
    case 'PROCESSING':
    case 'UNDER_REVIEW':
    case 'PENDING_REVIEW':
    case 'RECEIVED':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-sky-50 text-sky-700 border border-sky-200/80 ${sizeClasses}`}>
          <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );

    case 'ACTION_REQUIRED':
    case 'NEEDS_HUMAN_REVIEW':
    case 'NEEDS_REVIEW':
    case 'MISMATCH':
    case 'INCOMPLETE':
    case 'DEGRADED':
    case 'UNKNOWN':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );

    case 'REJECTED':
    case 'REJECT':
    case 'FAILED_VALIDATION':
    case 'FAIL':
    case 'UNREADABLE':
    case 'CONFIRMED_MISMATCH':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses}`}>
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );

    case 'DRAFT':
    case 'UNVERIFIED':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200 ${sizeClasses}`}>
          <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
          <span>{status.replace(/_/g, ' ')}</span>
        </span>
      );
  }
};
