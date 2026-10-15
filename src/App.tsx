import React, { useState, useEffect } from 'react';
import { Role, ApplicationRecord, NotificationItem, AuditEvent } from './types';
import { dataService } from './services/dataService';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { NotificationsModal } from './components/common/NotificationsModal';

// Applicant Pages
import { ApplicantDashboard } from './components/applicant/ApplicantDashboard';
import { ScholarshipApplicationForm } from './components/applicant/ScholarshipApplicationForm';
import { DocumentUploadCenter } from './components/applicant/DocumentUploadCenter';
import { DocumentVerificationResults } from './components/applicant/DocumentVerificationResults';
import { ApplicationTimeline } from './components/applicant/ApplicationTimeline';
import { ApplicantNotifications } from './components/applicant/ApplicantNotifications';

// Officer Pages
import { ReviewDashboard } from './components/officer/ReviewDashboard';
import { DocumentInspectionWorkspace } from './components/officer/DocumentInspectionWorkspace';
import { ContradictionRadar } from './components/officer/ContradictionRadar';
import { EvidencePassport } from './components/officer/EvidencePassport';
import { DecisionTraceView } from './components/officer/DecisionTraceView';
import { HumanDecisionView } from './components/officer/HumanDecisionView';

// Admin Pages
import { OperationsDashboard } from './components/admin/OperationsDashboard';
import { PolicyManagement } from './components/admin/PolicyManagement';
import { AuditTrailView } from './components/admin/AuditTrailView';
import { FairnessQualityLab } from './components/admin/FairnessQualityLab';
import { SystemHealthView } from './components/admin/SystemHealthView';

export function App() {
  const [currentRole, setCurrentRole] = useState<Role>('applicant');
  const [activeTab, setActiveTab] = useState<string>('applicant_dashboard');
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [activeAppId, setActiveAppId] = useState<string>('app-001');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // Load initial data
  const loadData = () => {
    const apps = dataService.getApplications();
    const notifs = dataService.getNotifications();
    const audits = dataService.getAuditEvents();
    setApplications(apps);
    setNotifications(notifs);
    setAuditEvents(audits);
    if (apps.length > 0 && !activeAppId) {
      setActiveAppId(apps[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Role change
  const handleRoleChange = (newRole: Role) => {
    setCurrentRole(newRole);
    if (newRole === 'applicant') {
      setActiveTab('applicant_dashboard');
    } else if (newRole === 'officer') {
      setActiveTab('officer_dashboard');
    } else if (newRole === 'admin') {
      setActiveTab('admin_dashboard');
    }
  };

  // Active Application Record
  const activeApp =
    applications.find((a) => a.id === activeAppId || a.refNumber === activeAppId) ||
    applications[0] || {
      id: 'app-default',
      refNumber: 'APP-2026-0000',
      schemeType: 'SCHOLARSHIP' as const,
      schemeName: 'National Merit-cum-Means Postsecondary Policy',
      status: 'DRAFT' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      policyVersion: '2026.1.4',
      applicant: {
        fullName: 'New Scholar',
        email: 'scholar@example.ac.in',
        phone: '+91 99999 99999',
        institution: 'University of Delhi',
        course: 'B.Sc Computer Science',
        academicYear: '1st Year',
        academicScore: 75.0,
        maxScore: 100,
        declaredAnnualIncome: 200000,
        familyMembersCount: 4,
      },
      documents: [],
      contradictions: [],
      evidencePassport: [],
      reviewNotes: [],
    };

  const handleUpdateApplication = (updated: ApplicationRecord) => {
    loadData();
    setActiveAppId(updated.id);
  };

  const handleMarkNotificationRead = (notifId: string) => {
    dataService.markNotificationAsRead(notifId);
    setNotifications(dataService.getNotifications());
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo data and applications to initial synthetic factory fixtures?')) {
      dataService.resetToFactoryDefaults();
      loadData();
      setActiveAppId('app-001');
      alert('Demo data successfully restored to factory state.');
    }
  };

  // Metrics for badges
  const mismatchCount = applications.filter((a) => a.contradictions.some((c) => c.isMismatch)).length;
  const urgentCount = applications.filter(
    (a) => a.status === 'UNDER_REVIEW' && a.contradictions.some((c) => c.isMismatch)
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navbar */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        applications={applications}
        activeAppId={activeApp.id}
        onSelectApp={(id) => setActiveAppId(id)}
        notifications={notifications}
        onOpenNotifications={() => setIsNotifModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentRole={currentRole}
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          mismatchCount={mismatchCount}
          urgentCount={urgentCount}
        />

        {/* Dynamic Portal View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* APPLICANT PORTAL PAGES */}
          {activeTab === 'applicant_dashboard' && (
            <ApplicantDashboard
              application={activeApp}
              notifications={notifications}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'applicant_apply' && (
            <ScholarshipApplicationForm
              application={activeApp}
              onSave={handleUpdateApplication}
              onSubmit={handleUpdateApplication}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'applicant_documents' && (
            <DocumentUploadCenter
              application={activeApp}
              onUpdateApplication={handleUpdateApplication}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'applicant_results' && (
            <DocumentVerificationResults
              application={activeApp}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'applicant_tracking' && (
            <ApplicationTimeline
              application={activeApp}
              auditEvents={auditEvents}
            />
          )}

          {activeTab === 'applicant_notifications' && (
            <ApplicantNotifications
              application={activeApp}
              notifications={notifications}
              onMarkRead={handleMarkNotificationRead}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* OFFICER PORTAL PAGES */}
          {activeTab === 'officer_dashboard' && (
            <ReviewDashboard
              applications={applications}
              onSelectApplication={(id) => setActiveAppId(id)}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'officer_workspace' && (
            <DocumentInspectionWorkspace
              application={activeApp}
              onUpdateApplication={handleUpdateApplication}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'officer_radar' && (
            <ContradictionRadar
              application={activeApp}
              onUpdateApplication={handleUpdateApplication}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'officer_passport' && (
            <EvidencePassport
              application={activeApp}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'officer_trace' && (
            <DecisionTraceView
              application={activeApp}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'officer_decision' && (
            <HumanDecisionView
              application={activeApp}
              onUpdateApplication={handleUpdateApplication}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {/* ADMIN PORTAL PAGES */}
          {activeTab === 'admin_dashboard' && (
            <OperationsDashboard
              applications={applications}
              auditEvents={auditEvents}
              onNavigate={(tab) => {
                if (tab === 'admin_audit') setActiveTab('admin_audit');
                else if (tab === 'admin_fairness') setActiveTab('admin_fairness');
                else setActiveTab(tab);
              }}
            />
          )}

          {activeTab === 'admin_policy' && (
            <PolicyManagement
              applications={applications}
              onPolicyUpdated={() => loadData()}
            />
          )}

          {activeTab === 'admin_audit' && (
            <AuditTrailView auditEvents={auditEvents} />
          )}

          {activeTab === 'admin_fairness' && (
            <FairnessQualityLab />
          )}

          {activeTab === 'admin_health' && (
            <SystemHealthView applications={applications} />
          )}
        </main>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
      />
    </div>
  );
}

export default App;
