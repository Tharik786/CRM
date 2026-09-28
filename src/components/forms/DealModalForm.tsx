import React, { useState, useEffect } from 'react';
import { Deal, DealStage } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface DealModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  initialData?: Deal | null;
}

export const DealModalForm: React.FC<DealModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [value, setValue] = useState(0);
  const [stage, setStage] = useState<DealStage>('qualification');
  const [probability, setProbability] = useState(50);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setValue(initialData.value);
      setStage(initialData.stage);
      setProbability(initialData.probability);
      setCompanyName(initialData.companyName);
      setContactName(initialData.contactName);
      setExpectedCloseDate(initialData.expectedCloseDate);
      setPriority(initialData.priority);
      setTagsInput(initialData.tags?.join(', ') || '');
    } else {
      setTitle('');
      setValue(0);
      setStage('qualification');
      setProbability(50);
      setCompanyName('');
      setContactName('');
      setExpectedCloseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setPriority('medium');
      setTagsInput('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Deal title is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (value <= 0) errs.value = 'Deal value must be greater than $0';
    if (!expectedCloseDate) errs.expectedCloseDate = 'Close date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await onSubmit({
        title,
        value: Number(value),
        currency: 'USD',
        stage,
        probability: Number(probability),
        expectedCloseDate,
        companyName,
        contactName: contactName.trim(),
        assignedTo: initialData?.assignedTo || user?.id || 'usr_current',
        priority,
        tags,
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
      title={initialData ? 'Edit Deal' : 'New Sales Pipeline Deal'}
      subtitle="Track deal value, milestones, and expected closing schedule"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Deal Opportunity Title"
          placeholder="e.g. Enterprise Cloud AI Deployment"
          value={title}
          onChange={e => setTitle(e.target.value)}
          error={errors.title}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Target Organization / Company"
            placeholder="e.g. Vertex AI Systems"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            error={errors.companyName}
            required
          />
          <Input
            label="Primary Contact Person"
            placeholder="e.g. Sarah Chen"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Deal Amount ($ USD)"
            type="number"
            min="1"
            step="1000"
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            error={errors.value}
            required
          />
          <Input
            label="Expected Close Date"
            type="date"
            value={expectedCloseDate}
            onChange={e => setExpectedCloseDate(e.target.value)}
            error={errors.expectedCloseDate}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Pipeline Sales Stage"
            value={stage}
            onChange={e => {
              const newStage = e.target.value as DealStage;
              setStage(newStage);
              // auto adjust default probability
              if (newStage === 'qualification') setProbability(20);
              if (newStage === 'needs_analysis') setProbability(40);
              if (newStage === 'proposal_sent') setProbability(60);
              if (newStage === 'negotiation') setProbability(80);
              if (newStage === 'closed_won') setProbability(100);
              if (newStage === 'closed_lost') setProbability(0);
            }}
            options={[
              { value: 'qualification', label: '1. New' },
              { value: 'needs_analysis', label: '2. Qualified' },
              { value: 'proposal_sent', label: '3. Proposal' },
              { value: 'negotiation', label: '4. Discussion' },
              { value: 'closed_won', label: '5. Won' },
              { value: 'closed_lost', label: '6. Lost' },
            ]}
          />
          <Select
            label="Deal Priority"
            value={priority}
            onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high')}
            options={[
              { value: 'high', label: 'High Priority (Tier 1)' },
              { value: 'medium', label: 'Medium Priority' },
              { value: 'low', label: 'Low Priority' },
            ]}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Closing Probability: <span className="text-brand-600 font-bold">{probability}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={probability}
            onChange={e => setProbability(Number(e.target.value))}
            className="w-full accent-brand-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
        </div>

        <Input
          label="Tags (comma-separated)"
          placeholder="e.g. Tier-1, AI, Renewal"
          value={tagsInput}
          onChange={e => setTagsInput(e.target.value)}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialData ? 'Update Opportunity' : 'Create Opportunity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
