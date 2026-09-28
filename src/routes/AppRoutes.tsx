import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext'; // Uncomment when re-enabling auth
import { AppLayout } from '../components/layout/AppLayout';
// import { LoadingSpinner } from '../components/common/EmptyState'; // Uncomment when re-enabling auth

// Lazy or Direct Pages
// import { LoginPage } from '../pages/auth/LoginPage'; // Uncomment when re-enabling login page
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LeadsPage } from '../pages/leads/LeadsPage';
import { DealsPipelinePage } from '../pages/deals/DealsPipelinePage';
import { ContactsCompaniesPage } from '../pages/contacts/ContactsCompaniesPage';
import { QuotationsPage } from '../pages/quotations/QuotationsPage';
import { OperationsPage } from '../pages/operations/OperationsPage';
import { TasksRemindersPage } from '../pages/tasks/TasksRemindersPage';
import { ActivityTimelinePage } from '../pages/activities/ActivityTimelinePage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  /*
  // ========================================================
  // [AUTH BYPASSED] Uncomment below to re-enable login check:
  // ========================================================
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner label="Authenticating ZanCRM session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  */

  return <>{children}</>;
};

/*
// ========================================================
// [AUTH BYPASSED] Uncomment below when re-enabling login:
// ========================================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <LoadingSpinner label="Initializing session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
*/

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 
        ========================================================
        Public Auth Routes (Commented out to bypass login page)
        Uncomment when ready to restore login page route:
        ========================================================
      */}
      {/*
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      */}
      {/* Direct redirect from /login to /dashboard while login is disabled */}
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />

      {/* Protected CRM Workspaces */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="deals" element={<DealsPipelinePage />} />
        <Route path="contacts" element={<ContactsCompaniesPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="tasks" element={<TasksRemindersPage />} />
        <Route path="activities" element={<ActivityTimelinePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
