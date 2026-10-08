import React, { useState, useEffect } from 'react';
import { InstallerScheduleItem, ScheduleStatus } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';

interface ScheduleModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: InstallerScheduleItem | null;
}

export const ScheduleModalForm: React.FC<ScheduleModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { contacts, technicians, addTechnician } = useCrm();

  const [installer, setInstaller] = useState('');
  const [isAddingNewInstaller, setIsAddingNewInstaller] = useState(false);
  const [newInstallerInput, setNewInstallerInput] = useState('');
  const [siteVisitTime, setSiteVisitTime] = useState('09:00 AM - 11:30 AM');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedInstallationId, setSelectedInstallationId] = useState('');
  const [status, setStatus] = useState<ScheduleStatus>('confirmed');
  const [siteAddress, setSiteAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setInstaller(initialData.installer);
      setIsAddingNewInstaller(false);
      setNewInstallerInput('');
      setSiteVisitTime(initialData.siteVisitTime);
      setVisitDate(initialData.visitDate);
      setCustomerName(initialData.customerName);
      setSelectedContactId(initialData.customerId || '');
      setSelectedInstallationId(initialData.installationId || '');
      setStatus(initialData.status);
      setSiteAddress(initialData.siteAddress || '');
      setNotes(initialData.notes || '');
    } else {
      const defaultTech = technicians && technicians.length > 0 ? technicians[0] : '';
      setInstaller(defaultTech);
      setIsAddingNewInstaller(false);
      setNewInstallerInput('');
      setSiteVisitTime('');
      setVisitDate(new Date().toISOString().split('T')[0]);
      setCustomerName('');
      setSelectedContactId('');
      setSelectedInstallationId('');
      setStatus('confirmed');
      setSiteAddress('');
      setNotes('');
    }
    setErrors({});
  }, [initialData, isOpen, technicians]);

  const handleClientSelect = (contactId: string) => {
    setSelectedContactId(contactId);
    if (!contactId) return;
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      setCustomerName(`${contact.companyName ? `${contact.companyName} (${contact.name})` : contact.name}`);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    const finalInstaller = isAddingNewInstaller ? newInstallerInput.trim() : installer;
    if (!finalInstaller) errs.installer = 'Installer name is required';
    if (!siteVisitTime.trim()) errs.siteVisitTime = 'Site visit time is required';
    if (!visitDate) errs.visitDate = 'Visit date is required';
    if (!customerName.trim()) errs.customerName = 'Customer name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const finalInstaller = isAddingNewInstaller ? newInstallerInput.trim() : installer;

    setIsSubmitting(true);
    try {
      if (isAddingNewInstaller && finalInstaller) {
        await addTechnician(finalInstaller);
      }
      await onSubmit({
        installer: finalInstaller,
        siteVisitTime: siteVisitTime.trim(),
        visitDate,
        customerName: customerName.trim(),
        customerId: selectedContactId || undefined,
        installationId: selectedInstallationId || undefined,
        status,
        siteAddress: siteAddress.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = [
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'on_route', label: 'On Route' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'rescheduled', label: 'Rescheduled' },
  ];

  const techList = technicians || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Schedule Slot' : 'Add Installer Visit'}
      subtitle="Allocate technician site visit time and customer appointments"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Technician / Installer — dropdown synced from global technicians list */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Technician / Installer <span className="text-rose-500">*</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsAddingNewInstaller(!isAddingNewInstaller);
                setNewInstallerInput('');
              }}
              className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
            >
              {isAddingNewInstaller ? '← Choose Existing' : '+ Add New'}
            </button>
          </div>

          {isAddingNewInstaller ? (
            <input
              type="text"
              autoFocus
              placeholder="Enter new technician name..."
              value={newInstallerInput}
              onChange={e => {
                setNewInstallerInput(e.target.value);
                if (errors.installer) setErrors(prev => ({ ...prev, installer: '' }));
              }}
              className={`w-full text-xs rounded-lg border py-2 px-2.5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                errors.installer ? 'border-rose-400' : 'border-brand-300'
              }`}
            />
          ) : (
            <select
              value={installer}
              onChange={e => {
                if (e.target.value === '__add_new__') {
                  setIsAddingNewInstaller(true);
                  setNewInstallerInput('');
                } else {
                  setInstaller(e.target.value);
                  if (errors.installer) setErrors(prev => ({ ...prev, installer: '' }));
                }
              }}
              className={`w-full text-xs rounded-lg border py-2 px-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 cursor-pointer ${
                errors.installer ? 'border-rose-400' : 'border-slate-300'
              }`}
            >
              <option value="" disabled>
                -- Select technician --
              </option>
              {techList.map(tech => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
              <option value="__add_new__">+ Add New Technician...</option>
            </select>
          )}
          {errors.installer && (
            <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.installer}</p>
          )}
        </div>

        {/* Customer / Client */}
        <div className="space-y-2">

          {contacts.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Client (Optional)
              </label>
              <select
                value={selectedContactId}
                onChange={e => handleClientSelect(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="">-- Or enter customer name below --</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Input
            label="Customer Name"
            placeholder="Enter customer name"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            error={errors.customerName}
            required
          />
        </div>

        {/* Visit Date & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Visit Date"
            type="date"
            value={visitDate}
            onChange={e => setVisitDate(e.target.value)}
            error={errors.visitDate}
            required
          />

          <Input
            label="Site Visit Time Slot"
            placeholder="e.g. 09:00 AM - 11:30 AM"
            value={siteVisitTime}
            onChange={e => setSiteVisitTime(e.target.value)}
            error={errors.siteVisitTime}
            required
          />
        </div>

        {/* Status */}
        <Select
          label="Visit Status"
          value={status}
          onChange={e => setStatus(e.target.value as ScheduleStatus)}
          options={statusOptions}
          required
        />

        {/* Site Address */}
        <Input
          label="Site Address"
          placeholder="Enter site address"
          value={siteAddress}
          onChange={e => setSiteAddress(e.target.value)}
        />

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Visit Notes / Security Access Instructions
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Enter visit instructions or gate access notes..."
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Confirm Visit Slot'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
