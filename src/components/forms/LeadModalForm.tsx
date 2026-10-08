import React, { useState, useEffect } from 'react';
import { Lead, LeadSource, LeadStatus, CurrencyType } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface LeadModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>, andSendQuote?: boolean) => Promise<void>;
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
  const [country, setCountry] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState<LeadSource>('website');
  const [status, setStatus] = useState<LeadStatus>('lead');
  const [score, setScore] = useState(50);
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [estimatedValue, setEstimatedValue] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setCompany(initialData.company || '');
      setEmail(initialData.email || '');
      setPhone(initialData.phone || '');
      setCountry(initialData.country || '');
      setLocation(initialData.location || '');
      let mappedStatus: LeadStatus = initialData.status;
      if ((mappedStatus as string) === 'new') mappedStatus = 'lead';
      else if ((mappedStatus as string) === 'contacted') mappedStatus = 'contact';
      else if (
        (mappedStatus as string) === 'proposal' ||
        (mappedStatus as string) === 'negotiation' ||
        (mappedStatus as string) === 'qualified'
      )
        mappedStatus = 'discussion';
      else if ((mappedStatus as string) === 'won') mappedStatus = 'converted';
      else if ((mappedStatus as string) === 'cold' || (mappedStatus as string) === 'unqualified')
        mappedStatus = 'lost';
      setStatus(mappedStatus);
      setCurrency(initialData.currency || 'USD');
      setEstimatedValue(initialData.estimatedValue ?? '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setCompany('');
      setEmail('');
      setPhone('');
      setCountry('');
      setLocation('');
      setSource('website');
      setStatus('lead');
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please provide a valid email format';
    }

    if (!phone.trim()) {
      errs.phone = 'Phone number is required';
    }

    if (!country.trim()) {
      errs.country = 'Country is required';
    }

    if (!location.trim()) {
      errs.location = 'Location is required';
    }

    if (!source) {
      errs.source = 'Source is required';
    }

    if (!status) {
      errs.status = 'Status is required';
    }

    if (!currency) {
      errs.currency = 'Currency is required';
    }

    if (estimatedValue === '' || estimatedValue === undefined || isNaN(Number(estimatedValue))) {
      errs.estimatedValue = 'Estimated deal value is required';
    } else if (Number(estimatedValue) <= 0) {
      errs.estimatedValue = 'Estimated deal value must be greater than 0';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          phone: phone.trim(),
          country: country.trim(),
          location: location.trim(),
          source,
          status,
          score: Number(score),
          estimatedValue: Number(estimatedValue),
          currency,
          assignedTo: initialData?.assignedTo || user?.id || 'usr_current',
          notes,
          convertedContactId: initialData?.convertedContactId,
          convertedDealId: initialData?.convertedDealId,
        },
        false
      );
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
      <form onSubmit={handleSaveOnly} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Contact Full Name"
            value={name}
            onChange={e => {
              setName(e.target.value);
              if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
            }}
            error={errors.name}
            required
            placeholder="e.g. John Doe"
          />
          <Input
            label="Company Name"
            value={company}
            onChange={e => {
              setCompany(e.target.value);
              if (errors.company) setErrors(prev => ({ ...prev, company: '' }));
            }}
            error={errors.company}
            required
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            required
            placeholder="e.g. john@example.com"
          />
          <Input
            label="Phone Number"
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              if (errors.phone) setErrors(prev => ({ ...prev, phone: '' }));
            }}
            error={errors.phone}
            required
            placeholder="e.g. +1 555-0123"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Country"
            value={country}
            onChange={e => {
              setCountry(e.target.value);
              if (errors.country) setErrors(prev => ({ ...prev, country: '' }));
            }}
            error={errors.country}
            required
            options={[
              { value: '', label: 'Select Country' },
              { value: 'India', label: 'India' },
              { value: 'USA', label: 'USA' },
            ]}
          />
          <Input
            label="Location"
            value={location}
            onChange={e => {
              setLocation(e.target.value);
              if (errors.location) setErrors(prev => ({ ...prev, location: '' }));
            }}
            error={errors.location}
            required
            placeholder="e.g. Mumbai, Maharashtra or San Jose, CA"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Sources"
            value={source}
            onChange={e => {
              setSource(e.target.value as LeadSource);
              if (errors.source) setErrors(prev => ({ ...prev, source: '' }));
            }}
            error={errors.source}
            required
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
            value={status === 'new' ? 'lead' : status === 'contacted' ? 'contact' : status}
            onChange={e => {
              setStatus(e.target.value as LeadStatus);
              if (errors.status) setErrors(prev => ({ ...prev, status: '' }));
            }}
            error={errors.status}
            required
            options={[
              { value: 'lead', label: 'Lead' },
              { value: 'contact', label: 'Contact' },
              { value: 'discussion', label: 'Discussion' },
              { value: 'converted', label: 'Client / Converted ' },
              { value: 'lost', label: 'Lost' },
              { value: 'no_response', label: 'No Response' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <Select
              label="Currency"
              value={currency}
              onChange={e => {
                setCurrency(e.target.value as CurrencyType);
                if (errors.currency) setErrors(prev => ({ ...prev, currency: '' }));
              }}
              error={errors.currency}
              required
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
              value={estimatedValue}
              onChange={e => {
                setEstimatedValue(e.target.value === '' ? '' : Number(e.target.value));
                if (errors.estimatedValue) setErrors(prev => ({ ...prev, estimatedValue: '' }));
              }}
              error={errors.estimatedValue}
              required
              placeholder="e.g. 5000"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
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
