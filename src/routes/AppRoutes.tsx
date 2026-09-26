import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/EmptyState';

// Lazy or Direct Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { TodayDashboardPage } from '../pages/dashboard/TodayDashboardPage';
import { LeadsPage } from '../pages/leads/LeadsPage';
import { DealsPipelinePage } from '../pages/deals/DealsPipelinePage';
import { ContactsCompaniesPage } from '../pages/contacts/ContactsCompaniesPage';
import { QuotationsPage } from '../pages/quotations/QuotationsPage';
import { TasksRemindersPage } from '../pages/tasks/TasksRemindersPage';
import { ActivityTimelinePage } from '../pages/activities/ActivityTimelinePage';
import { DataManagementPage } from '../pages/data/DataManagementPage';
import { ReportsPage } from '../pages/reports/ReportsPage';
import { SettingsPage } from '../pages/settings/SettingsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  return <>{children}</>;
};

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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

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
        <Route path="dashboard" element={<TodayDashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="deals" element={<DealsPipelinePage />} />
        <Route path="contacts" element={<ContactsCompaniesPage />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="tasks" element={<TasksRemindersPage />} />
        <Route path="activities" element={<ActivityTimelinePage />} />
        <Route path="data" element={<DataManagementPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
