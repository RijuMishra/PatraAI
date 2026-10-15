import React from 'react';
import { Role } from '../../types';
import {
  LayoutDashboard,
  FilePlus2,
  UploadCloud,
  CheckSquare2,
  Clock3,
  BellRing,
  FolderSearch,
  SplitSquareVertical,
  Radio,
  FileText,
  GitBranch,
  Gavel,
  BarChart3,
  Settings2,
  ShieldCheck,
  Scale,
  Activity,
  AlertCircle,
} from 'lucide-react';

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  mismatchCount?: number;
  urgentCount?: number;
  unresolvedCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  mismatchCount = 0,
  urgentCount = 0,
  unresolvedCount = 0,
}) => {
  const applicantNav: NavItem[] = [
    { id: 'applicant_dashboard', label: 'A1: Dashboard', icon: LayoutDashboard },
    { id: 'applicant_apply', label: 'A2: Apply for Scholarship', icon: FilePlus2 },
    { id: 'applicant_documents', label: 'A3: Document Upload Center', icon: UploadCloud },
    { id: 'applicant_results', label: 'A4: Document Verification Results', icon: CheckSquare2 },
    { id: 'applicant_tracking', label: 'A5: Application Tracking', icon: Clock3 },
    { id: 'applicant_notifications', label: 'A6: Notifications & Decision', icon: BellRing },
  ];

  const officerNav: NavItem[] = [
    { id: 'officer_dashboard', label: 'B1: Review Dashboard', icon: FolderSearch, badge: urgentCount > 0 ? `${urgentCount} urgent` : undefined, badgeColor: 'bg-rose-900/60 text-rose-300' },
    { id: 'officer_workspace', label: 'B2: Inspection Workspace', icon: SplitSquareVertical },
    { id: 'officer_radar', label: 'B3: Contradiction Radar', icon: Radio, badge: mismatchCount > 0 ? `${mismatchCount} diff` : undefined, badgeColor: 'bg-amber-900/60 text-amber-300' },
    { id: 'officer_passport', label: 'B4: Evidence Passport', icon: FileText },
    { id: 'officer_trace', label: 'B5: Decision & Rule Trace', icon: GitBranch },
    { id: 'officer_decision', label: 'B6: Human Review & Decision', icon: Gavel },
  ];

  const adminNav: NavItem[] = [
    { id: 'admin_dashboard', label: 'C1: Operations Dashboard', icon: BarChart3 },
    { id: 'admin_policy', label: 'C2: Policy Management', icon: Settings2 },
    { id: 'admin_audit', label: 'C3: Audit Trail (Append-Only)', icon: ShieldCheck },
    { id: 'admin_fairness', label: 'C4: Fairness & Quality Lab', icon: Scale },
    { id: 'admin_health', label: 'C5: System Health & Security', icon: Activity },
  ];

  let currentNav = applicantNav;
  let roleTitle = 'Applicant Portal';
  let roleDesc = 'Submit details & track document checks';

  if (currentRole === 'officer') {
    currentNav = officerNav;
    roleTitle = 'Verification Officer Portal';
    roleDesc = 'Examine evidence, resolve mismatches & decide';
  } else if (currentRole === 'admin') {
    currentNav = adminNav;
    roleTitle = 'Administrator Governance';
    roleDesc = 'Audit logs, policy rules & algorithmic fairness';
  }

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            {currentRole} Mode
          </span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
            v1.0
          </span>
        </div>
        <h2 className="text-sm font-semibold text-white mt-1">{roleTitle}</h2>
        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{roleDesc}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {currentNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Disclaimer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-[11px] text-slate-400">
        <div className="flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          <p className="leading-tight">
            Synthetic demo environment. Role switcher provides testing access, not production auth.
          </p>
        </div>
      </div>
    </aside>
  );
};
