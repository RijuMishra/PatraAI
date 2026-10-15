import React from 'react';
import { Role, ApplicationRecord, NotificationItem } from '../../types';
import {
  FileCheck2,
  Bell,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  ChevronDown,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  applications: ApplicationRecord[];
  activeAppId: string;
  onSelectApp: (id: string) => void;
  notifications: NotificationItem[];
  onOpenNotifications: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  applications,
  activeAppId,
  onSelectApp,
  notifications,
  onOpenNotifications,
  onResetData,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const activeApp = applications.find((a) => a.id === activeAppId || a.refNumber === activeAppId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-bold text-xl ring-1 ring-white/20">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">PatraAI</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-indigo-900/80 text-indigo-200 border border-indigo-700/60">
                  पत्रAI
                </span>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full hidden sm:inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Demo Mode
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
                Every document checked. Every decision explained.
              </p>
            </div>
          </div>

          {/* Center: Active Application Selector for Quick Testing */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-2.5 py-1">
            <span className="text-xs text-slate-400 font-medium">Active Case:</span>
            <select
              value={activeAppId}
              onChange={(e) => onSelectApp(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id} className="bg-slate-900 text-white">
                  {app.refNumber} — {app.applicant.fullName} ({app.status})
                </option>
              ))}
            </select>
          </div>

          {/* Right Side: Role Switcher & Actions */}
          <div className="flex items-center space-x-3">
            {/* Role Switcher Pill Bar */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-lg border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-2 hidden lg:inline">
                Simulated Role:
              </span>
              <button
                onClick={() => onRoleChange('applicant')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentRole === 'applicant'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Applicant / Student Portal"
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Applicant</span>
              </button>

              <button
                onClick={() => onRoleChange('officer')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentRole === 'officer'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Verification Officer Portal"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Officer</span>
              </button>

              <button
                onClick={() => onRoleChange('admin')}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  currentRole === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="System Administrator Portal"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Reset Factory Demo Data */}
            <button
              onClick={onResetData}
              className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
              title="Reset Demo Data to Factory Fixtures"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
