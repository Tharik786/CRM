import React, { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskType } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface TaskModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Task | null;
}

export const TaskModalForm: React.FC<TaskModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('follow_up');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('11:00 AM');
  const [relatedToName, setRelatedToName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || '');
      setType(initialData.type);
      setPriority(initialData.priority);
      setDueDate(initialData.dueDate);
      setDueTime(initialData.dueTime || '11:00 AM');
      setRelatedToName(initialData.relatedToName || '');
    } else {
      setTitle('');
      setDescription('');
      setType('follow_up');
      setPriority('high');
      setDueDate(new Date().toISOString().split('T')[0]);
      setDueTime('11:00 AM');
      setRelatedToName('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Task title is required';
    if (!dueDate) errs.dueDate = 'Due date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        description,
        type,
        priority,
        status: initialData?.status || 'pending',
        dueDate,
        dueTime,
        assignedTo: initialData?.assignedTo || user?.id || 'usr_current',
        relatedToName,
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
      title={initialData ? 'Edit Follow-up Task' : 'Schedule New Task'}
      subtitle="Ensure no prospect, meeting, or quote review slips through the cracks"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Action / Task Title"
          placeholder="e.g. Follow-up Call on SLA Terms"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Activity Type"
            value={type}
            onChange={e => setType(e.target.value as TaskType)}
            options={[
              { value: 'call', label: 'Phone Call' },
              { value: 'email', label: 'Email Follow-up' },
              { value: 'meeting', label: 'Meeting / Sync' },
              { value: 'demo', label: 'Product Demonstration' },
              { value: 'quote_review', label: 'Proposal Review' },
              { value: 'follow_up', label: 'General Follow-up' },
            ]}
          />
          <Select
            label="Priority Level"
            value={priority}
            onChange={e => setPriority(e.target.value as TaskPriority)}
            options={[
              { value: 'urgent', label: '🔴 Urgent' },
              { value: 'high', label: '🟠 High' },
              { value: 'medium', label: '🟡 Medium' },
              { value: 'low', label: '🟢 Low' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            error={errors.dueDate}
            required
          />
          <Input
            label="Due Time"
            placeholder="e.g. 02:30 PM"
            value={dueTime}
            onChange={e => setDueTime(e.target.value)}
          />
        </div>

        <Input
          label="Related Account / Opportunity"
          placeholder="e.g. Vertex AI Systems / Deal #01"
          value={relatedToName}
          onChange={e => setRelatedToName(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Details & Notes</label>
          <textarea
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Key discussion points, links, or specific deliverables..."
            className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialData ? 'Update Task' : 'Save Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
