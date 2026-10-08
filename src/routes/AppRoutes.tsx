import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/EmptyState';

// Lazy or Direct Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { LeadsPage } from '../pages/leads/LeadsPage';
import { DealsPipelinePage } from '../pages/deals/DealsPipelinePage';
import { ContactsCompaniesPage } from '../pages/contacts/ContactsCompaniesPage';
import { ClientRequirementsPage } from '../pages/requirements/ClientRequirementsPage';
import { DeviceInventoryPage } from '../pages/inventory/DeviceInventoryPage';
import { QuotationsPage } from '../pages/quotations/QuotationsPage';
import { OperationsPage } from '../pages/operations/OperationsPage';
import { InstallerSchedulePage } from '../pages/operations/InstallerSchedulePage';
import { TasksRemindersPage } from '../pages/tasks/TasksRemindersPage';
import { ActivityTimelinePage } from '../pages/activities/ActivityTimelinePage';
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
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={<Navigate to="/signup" replace />}
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={<Navigate to="/forgot-password" replace />}
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="deals" element={<DealsPipelinePage />} />
        <Route path="contacts" element={<ContactsCompaniesPage />} />
        <Route path="client-requirements" element={<ClientRequirementsPage />} />
        <Route path="requirements" element={<Navigate to="/client-requirements" replace />} />
        <Route path="inventory" element={<DeviceInventoryPage />} />
        <Route path="device-inventory" element={<Navigate to="/inventory" replace />} />
        <Route path="quotations" element={<QuotationsPage />} />
        <Route path="operations" element={<OperationsPage />} />
        <Route path="installer-schedule" element={<InstallerSchedulePage />} />
        <Route path="installation-scheduler" element={<Navigate to="/installer-schedule" replace />} />
        <Route path="schedule" element={<Navigate to="/installer-schedule" replace />} />
        <Route path="operations/schedule" element={<Navigate to="/installer-schedule" replace />} />
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
