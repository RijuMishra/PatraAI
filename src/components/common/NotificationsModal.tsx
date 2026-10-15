import React from 'react';
import { NotificationItem } from '../../types';
import { Bell, CheckCircle2, AlertTriangle, X, ArrowRight } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onNavigateToApp?: (appRef: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onNavigateToApp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">In-App Notifications</h3>
            <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              {notifications.filter((n) => !n.isRead).length} Unread
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No notifications found.</p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border text-xs transition ${
                  notif.isRead ? 'bg-slate-50/80 border-slate-200' : 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-1.5 rounded-md mt-0.5 ${
                        notif.type === 'DECISION_READY'
                          ? 'bg-emerald-100 text-emerald-700'
                          : notif.type === 'MISMATCH_ALERT'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {notif.type === 'DECISION_READY' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : notif.type === 'MISMATCH_ALERT' ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Bell className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">[{notif.applicationRef}]</span>
                      </div>
                      <p className="text-slate-600 mt-1 leading-relaxed">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 block mt-1.5 font-mono">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => onMarkRead(notif.id)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 shrink-0"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
