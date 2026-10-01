import React, { useState } from 'react';
import { Contact } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Bell, Calendar, Clock } from 'lucide-react';

interface NewReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Contact;
  onReminderSaved?: () => void;
}

export const NewReminderModal: React.FC<NewReminderModalProps> = ({
  isOpen,
  onClose,
  client,
  onReminderSaved,
}) => {
  const { createTask, addToast } = useCrm();
  const { user } = useAuth();

  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [details, setDetails] = useState('');
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !details.trim()) {
      setError('Please provide a title or description for the reminder.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask({
        title: title.trim() || `Follow-up with ${client.name}`,
        description: details.trim(),
        type: 'follow_up',
        priority: 'medium',
        status: 'pending',
        dueDate: date,
        dueTime: time,
        assignedTo: user?.id || 'usr_current',
        relatedToType: 'contact',
        relatedToId: client.id,
        relatedToName: client.name,
      });

      addToast({
        type: 'success',
        title: 'Reminder Created',
        message: `Reminder scheduled for ${client.name} on ${date} at ${time}.`,
      });

      if (onReminderSaved) onReminderSaved();
      onClose();
    } catch {
      setError('Failed to save reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Reminder"
      subtitle={`Schedule a reminder or follow-up task for ${client.name}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Reference (Read-only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Relevant Client / Contact
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <div className="font-bold text-xs text-slate-900">{client.name}</div>
              <div className="text-[11px] text-slate-500">{client.companyName}</div>
            </div>
            <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
              {client.status || 'Active Client'}
            </span>
          </div>
        </div>

        {/* Reminder Title */}
        <Input
          label="Reminder Title"
          placeholder="e.g. Follow-up contract discussion"
          value={title}
          onChange={e => {
            setTitle(e.target.value);
            setError('');
          }}
        />

        {/* Date and Time Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Reminder Date *
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Reminder Time *
            </label>
            <input
              type="time"
              required
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* Reminder Details */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5 text-slate-400" />
            Reminder Details / Description
          </label>
          <textarea
            rows={3}
            placeholder="Add specific notes, meeting agenda, or preparation required..."
            value={details}
            onChange={e => {
              setDetails(e.target.value);
              setError('');
            }}
            className="w-full text-xs rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            Save Reminder
          </Button>
        </div>
      </form>
    </Modal>
  );
};
