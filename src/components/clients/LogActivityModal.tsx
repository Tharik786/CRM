import React, { useState } from 'react';
import { Contact, ActivityType } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';
import { PhoneCall, Mail, Users, FileText, MoreHorizontal } from 'lucide-react';

interface LogActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Contact;
  onActivityLogged?: () => void;
}

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  isOpen,
  onClose,
  client,
  onActivityLogged,
}) => {
  const { contacts, addActivity, addToast } = useCrm();

  const [activityType, setActivityType] = useState<string>('call');
  const [selectedContactId, setSelectedContactId] = useState<string>(client.id);
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const contactOptions = contacts.map(c => ({
    value: c.id,
    label: `${c.name} — ${c.companyName}`,
  }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = '"What happened?" summary is required';
    if (!details.trim()) errs.details = 'Details / next step is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const activeContact = contacts.find(c => c.id === selectedContactId) || client;

      let apiType: ActivityType = 'call';
      if (activityType === 'email') apiType = 'email';
      else if (activityType === 'meeting') apiType = 'meeting';
      else if (activityType === 'note') apiType = 'note';
      else if (activityType === 'other') apiType = 'other';

      await addActivity({
        type: apiType,
        title: title.trim(),
        description: details.trim(),
        relatedToType: 'contact',
        relatedToId: activeContact.id,
        relatedToName: `${activeContact.name} (${activeContact.companyName})`,
      });

      addToast({
        type: 'success',
        title: 'Activity Logged',
        message: `Saved ${activityType} activity for ${activeContact.name}.`,
      });

      if (onActivityLogged) onActivityLogged();
      onClose();
    } catch {
      setErrors({ form: 'Failed to record activity.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Activity"
      subtitle="Record an interaction, update notes, or document next steps"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Activity Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Activity Type *
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { id: 'call', label: 'Call', icon: PhoneCall },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'meeting', label: 'Meeting', icon: Users },
              { id: 'note', label: 'Note', icon: FileText },
              { id: 'other', label: 'Others', icon: MoreHorizontal },
            ].map(type => {
              const Icon = type.icon;
              const isSelected = activityType === type.id;
              return (
                <button
                  type="button"
                  key={type.id}
                  onClick={() => setActivityType(type.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[11px]">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Dropdown */}
        <Select
          label="Contact *"
          value={selectedContactId}
          onChange={e => setSelectedContactId(e.target.value)}
          options={contactOptions}
        />

        {/* What happened? field */}
        <Input
          label="What happened? *"
          placeholder="e.g. Discovery call on telemetry deployment timeline"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
          }}
          error={errors.title}
          required
        />

        {/* Details / next step field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Details / Next Step *
          </label>
          <textarea
            rows={4}
            placeholder="Document key discussion points, customer requirements, agreed timeline, and the immediate next action item..."
            value={details}
            onChange={e => {
              setDetails(e.target.value);
              if (errors.details) setErrors(prev => ({ ...prev, details: '' }));
            }}
            className={`w-full text-xs rounded-lg border p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
              errors.details ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-brand-500'
            }`}
            required
          />
          {errors.details && <p className="text-[11px] text-rose-500 mt-1">{errors.details}</p>}
        </div>

        {errors.form && <p className="text-xs text-rose-600 font-medium">{errors.form}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Activity
          </Button>
        </div>
      </form>
    </Modal>
  );
};
