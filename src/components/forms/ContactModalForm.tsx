import React, { useState, useEffect } from 'react';
import { Contact } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';

interface ContactModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (contactData: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>) => Promise<void>;
  initialData?: Contact | null;
}

export const ContactModalForm: React.FC<ContactModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [lifecycleStage, setLifecycleStage] = useState<Contact['lifecycleStage']>('lead');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setTitle(initialData.title);
      setCompanyName(initialData.companyName);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setLifecycleStage(initialData.lifecycleStage);
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setTitle('');
      setCompanyName('');
      setEmail('');
      setPhone('');
      setLifecycleStage('lead');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Contact name is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please provide a valid email format';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        title,
        companyName,
        email,
        phone,
        lifecycleStage,
        assignedTo: initialData?.assignedTo || 'usr_01',
        notes,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Contact Person' : 'Add New Contact'}
      subtitle="Record individual relationships, roles, and communication history"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="e.g. Sarah Chen"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Job Title / Role"
            placeholder="e.g. Chief Technology Officer"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <Input
            label="Associated Company"
            placeholder="e.g. Vertex AI Systems"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            error={errors.companyName}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="sarah@vertexai.io"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+1 (415) 890-1201"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <Select
          label="Customer Lifecycle Stage"
          value={lifecycleStage}
          onChange={e => setLifecycleStage(e.target.value as Contact['lifecycleStage'])}
          options={[
            { value: 'subscriber', label: 'Subscriber' },
            { value: 'lead', label: 'Lead' },
            { value: 'mql', label: 'Marketing Qualified Lead (MQL)' },
            { value: 'customer', label: 'Active Customer' },
            { value: 'evangelist', label: 'Advocate / Evangelist' },
          ]}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Relationship Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Preferences, decision-making authority, communication style..."
            className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialData ? 'Update Contact' : 'Save Contact'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
