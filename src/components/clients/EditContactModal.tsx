import React, { useState, useEffect } from 'react';
import { Contact, ContactStatus } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onSaved?: (updated: Contact) => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSaved,
}) => {
  const { updateContact, addToast } = useCrm();

  const [name, setName] = useState(contact.name);
  const [companyName, setCompanyName] = useState(contact.companyName);
  const [email, setEmail] = useState(contact.email);
  const [phone, setPhone] = useState(contact.phone || '');
  const [location, setLocation] = useState(contact.location || '');
  const [status, setStatus] = useState<ContactStatus>(contact.status || 'Active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(contact.name);
    setCompanyName(contact.companyName);
    setEmail(contact.email);
    setPhone(contact.phone || '');
    setLocation(contact.location || '');
    setStatus(contact.status || 'Active');
    setErrors({});
  }, [contact, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Full name is required';
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
      const updated = await updateContact(contact.id, {
        name: name.trim(),
        companyName: companyName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        location: location.trim(),
        status,
      });

      addToast({
        type: 'success',
        title: 'Contact Updated',
        message: `Successfully saved changes for ${updated.name}.`,
      });

      if (onSaved) onSaved(updated);
      onClose();
    } catch {
      setErrors({ form: 'Failed to update contact details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contact"
      subtitle="Update client contact information and active status"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name *"
          placeholder="e.g. Sarah Jenkins"
          value={name}
          onChange={e => {
            setName(e.target.value);
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          error={errors.name}
          required
        />

        <Input
          label="Company *"
          placeholder="e.g. AeroSpace Dynamics Ltd"
          value={companyName}
          onChange={e => {
            setCompanyName(e.target.value);
            if (errors.companyName) setErrors(prev => ({ ...prev, companyName: '' }));
          }}
          error={errors.companyName}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email Address *"
            type="email"
            placeholder="sarah@aerospacedynamics.io"
            value={email}
            onChange={e => {
              setEmail(e.target.value);
              if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
            }}
            error={errors.email}
            required
          />

          <Input
            label="Phone Number"
            placeholder="+1 (555) 234-8910"
            value={phone}
            onChange={e => setPhone(e.target.value)}
          />
        </div>

        <Input
          label="Location"
          placeholder="e.g. Austin, TX or London, UK"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />

        <Select
          label="Status Dropdown *"
          value={status}
          onChange={e => setStatus(e.target.value as ContactStatus)}
          options={[
            { value: 'Active', label: 'Active' },
            { value: 'Won Client', label: 'Won Client' },
            { value: 'Inactive', label: 'Inactive' },
          ]}
        />

        {errors.form && <p className="text-xs text-rose-600 font-medium">{errors.form}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
