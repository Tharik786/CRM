import React, { useState, useEffect } from 'react';
import { Lead, LeadSource, LeadStatus, CurrencyType } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface LeadModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Lead | null;
}

export const LeadModalForm: React.FC<LeadModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState<LeadSource>('website');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [score, setScore] = useState(50);
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setCompany(initialData.company);
      setEmail(initialData.email);
      setPhone(initialData.phone);
      setSource(initialData.source);
      setStatus(initialData.status);
      setScore(initialData.score);
      setCurrency(initialData.currency || 'USD');
      setEstimatedValue(initialData.estimatedValue || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setSource('website');
      setStatus('new');
      setScore(50);
      setCurrency('USD');
      setEstimatedValue('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Contact name is required';
    if (!company.trim()) errs.company = 'Company name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Please provide a valid email format';
    }
    if (typeof estimatedValue === 'number' && estimatedValue < 0) {
      errs.estimatedValue = 'Value cannot be negative';
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
        company,
        email,
        phone,
        source,
        status,
        score: Number(score),
        estimatedValue: estimatedValue === '' ? 0 : Number(estimatedValue),
        currency,
        assignedTo: initialData?.assignedTo || user?.id || 'usr_current',
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
      title={initialData ? 'Edit Enquiry' : 'Create New Enquiry'}
      subtitle="Capture customer enquiry and details"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Full Name"
            placeholder="e.g. David Sterling"
            value={name}
            onChange={e => setName(e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Company Name"
            placeholder="e.g. HyperScale Cloud Labs"
            value={company}
            onChange={e => setCompany(e.target.value)}
            error={errors.company}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="david@hyperscale.dev"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 019-2834"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Sources"
            value={source}
            onChange={e => setSource(e.target.value as LeadSource)}
            options={[
              { value: 'website', label: 'Website Inbound' },
              { value: 'inbound_call', label: 'Phone Inbound' },
              { value: 'linkedin', label: 'LinkedIn' },
              { value: 'referral', label: 'Referral' },
              { value: 'event', label: 'Conference' },
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={e => setStatus(e.target.value as LeadStatus)}
            options={[
              { value: 'new', label: '1. New' },
              { value: 'qualified', label: '2. Qualified' },
              { value: 'proposal', label: '3. Proposal' },
              { value: 'discussion', label: '4. Discussion' },
              { value: 'won', label: '5. Won' },
              { value: 'lost', label: '6. Lost' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Select
              label="Currency"
              value={currency}
              onChange={e => setCurrency(e.target.value as CurrencyType)}
              options={[
                { value: 'USD', label: '$ USD (Dollar)' },
                { value: 'INR', label: '₹ INR (Rupee)' },
              ]}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label={`Estimated Deal Value (${currency === 'INR' ? '₹ INR' : '$ USD'})`}
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 50000"
              value={estimatedValue}
              onChange={e => setEstimatedValue(e.target.value === '' ? '' : Number(e.target.value))}
              error={errors.estimatedValue}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialData ? 'Update Enquiry' : 'Save Enquiry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
