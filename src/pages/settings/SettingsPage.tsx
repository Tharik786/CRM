import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Save, Camera, Upload, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useCrm();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profileTitle, setProfileTitle] = useState(user?.title || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Handle Photo Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Please select an image smaller than 5MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setProfileAvatar(base64);
      try {
        await updateProfile({ avatar: base64 });
        addToast({
          type: 'success',
          title: 'Photo Uploaded',
          message: 'Profile photo updated successfully.',
        });
      } catch (err) {
        console.error('Failed to update avatar:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Remove Photo
  const handleRemovePhoto = async () => {
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=4f46e5&color=fff`;
    setProfileAvatar('');
    try {
      await updateProfile({ avatar: defaultAvatar });
      addToast({
        type: 'info',
        title: 'Photo Removed',
        message: 'Profile photo has been reset.',
      });
    } catch (err) {
      console.error('Failed to reset avatar:', err);
    }
  };

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
        avatar: profileAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName)}&background=4f46e5&color=fff`,
      });
      addToast({ type: 'success', title: 'Profile Updated', message: 'User profile updated successfully.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
      {/* User Profile Card */}
      <Card>
        <CardHeader
          title="Account Profile & Credentials"
          subtitle="Your personal identification information visible to teammates"
        />
        <CardBody>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Avatar & Photo Upload Section */}
            <div className="pb-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="relative group shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center shadow-subtle">
                  {profileAvatar ? (
                    <img
                      src={profileAvatar}
                      alt={profileName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                      <div className="w-full h-full bg-brand-600 text-white flex items-center justify-center text-2xl font-black">
                        {profileName ? profileName.charAt(0).toUpperCase() : 'U'}
                      </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Upload profile photo"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[10px] font-bold">Change</span>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                />
                <h4 className="text-sm font-bold text-slate-900 mb-1">Profile Photo</h4>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload Photo
                  </Button>
                  {profileAvatar && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemovePhoto}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  JPG, PNG, WebP or GIF. Maximum file size: 5MB.
                </p>
              </div>
            </div>

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
    </div>
  );
};
