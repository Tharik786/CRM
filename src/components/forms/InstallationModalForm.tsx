import React, { useState, useEffect } from 'react';
import { Installation, InstallationStatus } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';

interface InstallationModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Installation | null;
}

export const InstallationModalForm: React.FC<InstallationModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { contacts, deals } = useCrm();

  const [customerName, setCustomerName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().split('T')[0]);
  const [installer, setInstaller] = useState('');
  const [status, setStatus] = useState<InstallationStatus>('scheduled');
  const [siteAddress, setSiteAddress] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customerName);
      setSelectedContactId(initialData.customerId || '');
      setSelectedDealId(initialData.dealId || '');
      setBookingDate(initialData.bookingDate || new Date().toISOString().split('T')[0]);
      setInstallationDate(initialData.installationDate || new Date().toISOString().split('T')[0]);
      setInstaller(initialData.installer);
      setStatus(initialData.status);
      setSiteAddress(initialData.siteAddress || '');
      setContactPhone(initialData.contactPhone || '');
      setNotes(initialData.notes || '');
    } else {
      setCustomerName('');
      setSelectedContactId('');
      setSelectedDealId('');
      const today = new Date().toISOString().split('T')[0];
      setBookingDate(today);
      setInstallationDate(today);
      setInstaller('');
      setStatus('scheduled');
      setSiteAddress('');
      setContactPhone('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  // Handle client selection auto-fill
  const handleClientSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) return;

    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setCustomerName(`${contact.companyName ? `${contact.companyName} (${contact.name})` : contact.name}`);
      if (contact.phone) setContactPhone(contact.phone);
    }
  };

  // Handle deal selection auto-fill
  const handleDealSelect = (dealId: string) => {
    setSelectedDealId(dealId);
    if (!dealId) return;

    const deal = deals.find(d => d.id === dealId);
    if (deal) {
      if (!customerName) {
        setCustomerName(deal.companyName || deal.contactName || deal.title);
      }
      if (!notes) {
        setNotes(`Installation linked to sales pipeline deal: "${deal.title}"`);
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    if (!installer.trim()) errs.installer = 'Installer name is required';
    if (!bookingDate) errs.bookingDate = 'Booking date is required';
    if (!installationDate) errs.installationDate = 'Installation date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedDeal = deals.find(d => d.id === selectedDealId);
      await onSubmit({
        customerName: customerName.trim(),
        customerId: selectedContactId || undefined,
        dealId: selectedDealId || undefined,
        dealTitle: selectedDeal?.title || undefined,
        bookingDate,
        installationDate,
        installer: installer.trim(),
        status,
        siteAddress: siteAddress.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Installation Job' : 'Schedule New Installation'}
      subtitle="Track customer site visits, assigned technicians, and hardware deployment"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Module Integrations: Client & Sales Deal Link */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Module Integrations (Optional)
            </span>
            <span className="text-[10px] text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/60">
              Clients & Sales Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Existing Client
              </label>
              <select
                value={selectedContactId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- Choose from Clients --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link Sales Deal
              </label>
              <select
                value={selectedDealId}
                onChange={e => handleDealSelect(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- Choose from Deals --</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.stage.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Customer & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Customer / Client Name"
            placeholder="Enter customer or company name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            error={errors.customerName}
            required
          />
          <Input
            label="Customer Contact Phone"
            placeholder="e.g. +1 (555) 000-0000"
            value={contactPhone}
            onChange={e => setContactPhone(e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Booking Date"
            type="date"
            value={bookingDate}
            onChange={e => setBookingDate(e.target.value)}
            error={errors.bookingDate}
            required
          />
          <Input
            label="Installation Date"
            type="date"
            value={installationDate}
            onChange={e => setInstallationDate(e.target.value)}
            error={errors.installationDate}
            required
          />
        </div>

        {/* Installer & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Assigned Installer"
            placeholder="Enter installer name"
            value={installer}
            onChange={e => setInstaller(e.target.value)}
            error={errors.installer}
            required
          />

          <Select
            label="Installation Status"
            value={status}
            onChange={e => setStatus(e.target.value as InstallationStatus)}
            options={statusOptions}
            required
          />
        </div>

        {/* Site Address */}
        <Input
          label="Site Visit Address"
          placeholder="Enter job site address"
          value={siteAddress}
          onChange={e => setSiteAddress(e.target.value)}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Deployment Notes / Hardware Scope
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Enter deployment notes or equipment scope..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Schedule Installation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
