import React, { useState, useEffect } from 'react';
import { Deal, DealStage, CurrencyType } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';

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
  const { companies, contacts } = useCrm();
  const [title, setTitle] = useState('');
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [value, setValue] = useState<number | ''>('');
  const [stage, setStage] = useState<DealStage>('new');
  const [probability, setProbability] = useState(50);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [expectedCloseDate, setExpectedCloseDate] = useState(() =>
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tagsInput, setTagsInput] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData && initialData.id) {
      setTitle(initialData.title || '');
      setCurrency((initialData.currency as CurrencyType) || 'USD');
      setValue(initialData.value || '');
      setStage(initialData.stage || 'new');
      setProbability(initialData.probability ?? (initialData.stage === 'lost' ? 0 : 50));
      setCompanyName(initialData.companyName || '');
      setContactName(initialData.contactName || '');
      setExpectedCloseDate(initialData.expectedCloseDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setPriority(initialData.priority || 'medium');
      setTagsInput(initialData.tags?.join(', ') || '');
      setLostReason(initialData.lostReason || '');
    } else {
      const defaultStage = (initialData && initialData.stage) ? initialData.stage : 'new';
      setTitle('');
      setCurrency('USD');
      setValue('');
      setStage(defaultStage);
      setProbability(defaultStage === 'lost' ? 0 : defaultStage === 'won' ? 100 : 50);
      setCompanyName('');
      setContactName('');
      setExpectedCloseDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setPriority('medium');
      setTagsInput('');
      setLostReason('');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Deal title is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (value === '' || Number(value) <= 0) errs.value = 'Deal value must be greater than 0';
    if (!expectedCloseDate) errs.expectedCloseDate = 'Close date is required';
    if (stage === 'lost' && !lostReason.trim()) {
      errs.lostReason = 'Please enter the reason for lost deal';
    }
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
        value: Number(value) || 0,
        currency,
        stage,
        probability: Number(probability),
        expectedCloseDate,
        companyName,
        contactName: contactName.trim(),
        assignedTo: initialData?.assignedTo || user?.id || 'usr_current',
        priority,
        tags,
        lostReason: stage === 'lost' ? lostReason.trim() : undefined,
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
          <div>
            <Input
              label="Target Organization / Company"
              placeholder="e.g. Vertex AI Systems"
              value={companyName}
              onChange={e => {
                const val = e.target.value;
                setCompanyName(val);
                const matched = companies.find(
                  c => c.name.toLowerCase() === val.trim().toLowerCase()
                );
                if (matched && !contactName) {
                  const matchContact = contacts.find(
                    ct =>
                      (ct.companyId && ct.companyId === matched.id) ||
                      ct.companyName.toLowerCase() === matched.name.toLowerCase()
                  );
                  if (matchContact) {
                    setContactName(matchContact.name);
                  }
                }
              }}
              error={errors.companyName}
              required
              list="deal-company-suggestions"
            />
            <datalist id="deal-company-suggestions">
              {companies.map(c => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <Input
              label="Primary Contact Person"
              placeholder="e.g. Sarah Chen"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              list="deal-contact-suggestions"
            />
            <datalist id="deal-contact-suggestions">
              {contacts.map(c => (
                <option key={c.id} value={c.name}>
                  {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
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
          <div>
            <Input
              label={`Deal Amount (${currency === 'INR' ? '₹ INR' : '$ USD'})`}
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 50000"
              value={value}
              onChange={e => setValue(e.target.value === '' ? '' : Number(e.target.value))}
              error={errors.value}
              required
            />
          </div>
          <div>
            <Input
              label="Expected Close Date"
              type="date"
              max="2099-12-31"
              value={expectedCloseDate}
              onChange={e => setExpectedCloseDate(e.target.value)}
              error={errors.expectedCloseDate}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Pipeline Sales Stage"
            value={stage}
            onChange={e => {
              const newStage = e.target.value as DealStage;
              setStage(newStage);
              // auto adjust default probability
              if (newStage === 'new') setProbability(20);
              if (newStage === 'proposal') setProbability(50);
              if (newStage === 'negotiation') setProbability(80);
              if (newStage === 'won') setProbability(100);
              if (newStage === 'lost') setProbability(0);
              if (newStage === 'cold') setProbability(10);
            }}
            options={[
              { value: 'new', label: 'New' },
              { value: 'proposal', label: 'Proposal' },
              { value: 'negotiation', label: 'Negotiation' },
              { value: 'won', label: 'Won' },
              { value: 'lost', label: 'Lost' },
              { value: 'cold', label: 'Cold' },
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

        {stage === 'lost' && (
          <Input
            label="Reason for Lost Deal"
            placeholder="e.g. Budget constraints, chosen competitor, project postponed..."
            value={lostReason}
            onChange={e => {
              setLostReason(e.target.value);
              if (errors.lostReason) {
                setErrors(prev => ({ ...prev, lostReason: '' }));
              }
            }}
            error={errors.lostReason}
            required
          />
        )}

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
