import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Save, RefreshCw } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { addToast, loadMockData } = useCrm();
  const [isResetting, setIsResetting] = useState(false);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileTitle, setProfileTitle] = useState(user?.title || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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
        timezone: user?.timezone || 'UTC',
      });
      addToast({ type: 'success', title: 'Profile Updated', message: 'User profile updated successfully.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-3.5 animate-fade-in max-w-4xl mx-auto pb-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader
          title="Account Profile & Credentials"
          subtitle="Your personal identification information visible to teammates"
        />
        <CardBody>
          <form onSubmit={handleSaveProfile} className="space-y-5">

            {/* Profile Fields */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Demo Mock Data Management */}
      <Card>
        <CardHeader
          title="Demo Mock Data Administration"
          subtitle="Populate or restore 5 realistic records across all CRM modules and pages"
        />
        <CardBody className="space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Click below to instantly refresh and populate 5 comprehensive sample records across all modules:
            <strong className="text-slate-700 font-semibold block mt-1">
              • 5 Inbound Enquiries (Leads) &nbsp;|&nbsp; 5 Clients & Organizations &nbsp;|&nbsp; 5 Pipeline Deals &nbsp;|&nbsp; 5 Commercial Quotations &nbsp;|&nbsp; 5 Field Installations &nbsp;|&nbsp; 5 Installer Visit Schedules &nbsp;|&nbsp; 5 Device Inventory items &nbsp;|&nbsp; 5 Follow-up Tasks &nbsp;|&nbsp; 5 Activity Timeline entries
            </strong>
          </p>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isResetting}
              onClick={async () => {
                setIsResetting(true);
                try {
                  await loadMockData();
                } finally {
                  setIsResetting(false);
                }
              }}
              icon={<RefreshCw className="w-4 h-4 text-brand-600" />}
            >
              Reset / Populate 5 Dummy Records for All Pages
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
