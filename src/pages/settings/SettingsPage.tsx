import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input, Select } from '../../components/common/Input';
import {
  Bell,
  Shield,
  RotateCcw,
  CheckCircle2,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { settings, updateSettings, resetDatabase, addToast } = useCrm();

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileTitle, setProfileTitle] = useState(user?.title || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileTimezone, setProfileTimezone] = useState(user?.timezone || 'America/New_York (EST)');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Workspace Form State
  const [companyName, setCompanyName] = useState(settings?.companyName || 'Zan Technologies Inc.');
  const [currency, setCurrency] = useState(settings?.defaultCurrency || 'USD');
  const [fiscalYear, setFiscalYear] = useState(settings?.fiscalYearStart || 'January');
  const [emailNotifs, setEmailNotifs] = useState(settings?.emailNotifications ?? true);
  const [autoLeadScoring, setAutoLeadScoring] = useState(settings?.autoLeadScoring ?? true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(settings?.twoFactorAuth ?? true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      await updateProfile({
        name: profileName,
        email: profileEmail,
        title: profileTitle,
        phone: profilePhone,
        timezone: profileTimezone,
      });
      addToast({ type: 'success', title: 'Profile Updated', message: 'User profile updated successfully.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Workspace Save
  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings({
        companyName,
        defaultCurrency: currency,
        fiscalYearStart: fiscalYear,
        timezone: profileTimezone,
        emailNotifications: emailNotifs,
        autoLeadScoring,
        twoFactorAuth,
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Reset Demo Data
  const handleResetData = async () => {
    if (
      window.confirm(
        'Are you sure you want to restore the CRM to initial seed demo data? All custom additions will be reset.'
      )
    ) {
      await resetDatabase();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System & Workspace Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize individual user account parameters, company defaults, and data lifecycle configurations
        </p>
      </div>

      {/* User Profile Card */}
      <Card>
        <CardHeader
          title="Account Profile & Credentials"
          subtitle="Your personal identification information visible to teammates"
        />
        <CardBody>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                alt={user?.name || 'Profile'}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-brand-500/30 shadow-md"
              />
              <div>
                <h4 className="text-sm font-bold text-slate-900">{user?.name}</h4>
                <p className="text-xs text-slate-500">{user?.role?.toUpperCase()} • {user?.email}</p>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated Enterprise Session
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                required
              />
              <Input
                label="Corporate Email Address"
                type="email"
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Job Title"
                value={profileTitle}
                onChange={e => setProfileTitle(e.target.value)}
              />
              <Input
                label="Direct Phone"
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
              />
              <Select
                label="Operating Timezone"
                value={profileTimezone}
                onChange={e => setProfileTimezone(e.target.value)}
                options={[
                  { value: 'America/New_York (EST)', label: 'Eastern Time (US & Canada)' },
                  { value: 'America/Chicago (CST)', label: 'Central Time (US & Canada)' },
                  { value: 'America/Los_Angeles (PST)', label: 'Pacific Time (US & Canada)' },
                  { value: 'Europe/London (GMT)', label: 'London, Dublin (GMT)' },
                  { value: 'Asia/Tokyo (JST)', label: 'Tokyo, Osaka (JST)' },
                ]}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingProfile}
                icon={<Save className="w-4 h-4" />}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Workspace Preferences Card */}
      <Card>
        <CardHeader
          title="CRM Workspace Configuration"
          subtitle="Global currencies, notifications, and security rules for ZanCRM"
        />
        <CardBody>
          <form onSubmit={handleSaveWorkspace} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Workspace Organization Name"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
              <Select
                label="Default Currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                options={[
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
                  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
                  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
                ]}
              />
              <Select
                label="Fiscal Year Start Month"
                value={fiscalYear}
                onChange={e => setFiscalYear(e.target.value)}
                options={[
                  { value: 'January', label: 'January' },
                  { value: 'April', label: 'April' },
                  { value: 'July', label: 'July' },
                  { value: 'October', label: 'October' },
                ]}
              />
            </div>

            {/* Feature Toggles */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-brand-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Email Notifications for Deal Stages</h5>
                    <p className="text-[11px] text-slate-500">Alert representatives when deals transition to Won/Lost</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={e => setEmailNotifs(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-indigo-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Automated Predictive Lead Scoring</h5>
                    <p className="text-[11px] text-slate-500">Calculate fit scores based on employee count & estimated budget</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoLeadScoring}
                  onChange={e => setAutoLeadScoring(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Enforce Two-Factor Authentication (2FA)</h5>
                    <p className="text-[11px] text-slate-500">Mandate hardware or authenticator app TOTP verification</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={e => setTwoFactorAuth(e.target.checked)}
                  className="h-4 w-4 rounded accent-brand-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSavingSettings}
                icon={<Save className="w-4 h-4" />}
              >
                Save Preferences
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Danger Zone / Reset Demo Data */}
      <Card className="border-rose-200 bg-rose-50/20">
        <CardHeader
          title="Data Management & Reset"
          subtitle="Reset CRM state to original enterprise demo records"
        />
        <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h5 className="text-xs font-bold text-slate-800">Restore Default Mock Seed Records</h5>
            <p className="text-[11px] text-slate-500 max-w-md mt-0.5">
              Re-initializes all contacts, pipeline deals, leads, tasks, and quotations to the clean original state.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={handleResetData}
            icon={<RotateCcw className="w-4 h-4" />}
          >
            Reset All Demo Data
          </Button>
        </CardBody>
      </Card>
    </div>
  );
};
