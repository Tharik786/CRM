import React, { useState, useEffect } from 'react';
import { Quotation, QuotationLineItem, QuotationStatus } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface QuotationModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>) => Promise<void>;
  initialData?: Quotation | null;
}

export const QuotationModalForm: React.FC<QuotationModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [dealTitle, setDealTitle] = useState('');
  const [status, setStatus] = useState<QuotationStatus>('draft');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [taxRate, setTaxRate] = useState(10);
  const [terms, setTerms] = useState('Payment within 30 days of invoice date.');
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: 'li_1',
      description: 'ZanCRM Platform License (Annual)',
      quantity: 1,
      unitPrice: 45000,
      discount: 0,
      amount: 45000,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setCompanyName(initialData.companyName);
      setContactName(initialData.contactName);
      setContactEmail(initialData.contactEmail);
      setDealTitle(initialData.dealTitle || '');
      setStatus(initialData.status);
      setIssueDate(initialData.issueDate);
      setValidUntil(initialData.validUntil);
      setTaxRate(initialData.taxRate);
      setTerms(initialData.terms || '');
      setNotes(initialData.notes || '');
      setLineItems(initialData.lineItems);
    } else {
      setTitle('Enterprise Subscription Agreement');
      setCompanyName('');
      setContactName('');
      setContactEmail('');
      setDealTitle('');
      setStatus('draft');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setTaxRate(10);
      setTerms('Payment within 30 days of invoice date.');
      setNotes('Includes standard SLA, 99.9% uptime guarantee, and priority onboarding support.');
      setLineItems([
        {
          id: `li_${Date.now()}`,
          description: 'ZanCRM Platform License (Annual)',
          quantity: 1,
          unitPrice: 45000,
          discount: 0,
          amount: 45000,
        },
      ]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `li_${Date.now()}_${Math.random()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        amount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const updateLineItem = (index: number, field: keyof QuotationLineItem, value: unknown) => {
    setLineItems(prev => {
      const copy = [...prev];
      const item = { ...copy[index], [field]: value };
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const disc = Number(item.discount) || 0;
      item.amount = Math.max(0, qty * price * (1 - disc / 100));
      copy[index] = item;
      return copy;
    });
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const taxAmount = (subtotal * Number(taxRate)) / 100;
  const total = subtotal + taxAmount;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!companyName.trim()) errs.companyName = 'Company name is required';
    if (!contactName.trim()) errs.contactName = 'Contact name is required';
    if (lineItems.length === 0) errs.lineItems = 'At least one line item is required';
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
        companyName,
        contactName,
        contactEmail: contactEmail || `${contactName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        dealTitle,
        status,
        issueDate,
        validUntil,
        lineItems,
        subtotal,
        taxRate: Number(taxRate),
        taxAmount,
        total,
        terms,
        notes,
        createdBy: 'Alex Rivera',
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
      title={initialData ? `Edit Quotation ${initialData.quoteNumber}` : 'Create Commercial Quotation'}
      subtitle="Assemble itemized line items, calculate totals, and dispatch client proposals"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Proposal / Quotation Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            error={errors.title}
            required
          />
          <Select
            label="Quotation Status"
            value={status}
            onChange={e => setStatus(e.target.value as QuotationStatus)}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent to Client' },
              { value: 'accepted', label: 'Accepted / Executed' },
              { value: 'declined', label: 'Declined' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Client Organization"
            placeholder="e.g. Vertex AI Systems"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            error={errors.companyName}
            required
          />
          <Input
            label="Contact Person"
            placeholder="e.g. Sarah Chen"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
            error={errors.contactName}
            required
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="e.g. sarah@vertexai.io"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Linked Deal (Optional)"
            placeholder="e.g. Enterprise AI Suite Expansion"
            value={dealTitle}
            onChange={e => setDealTitle(e.target.value)}
          />
          <Input
            label="Issue Date"
            type="date"
            value={issueDate}
            onChange={e => setIssueDate(e.target.value)}
            required
          />
          <Input
            label="Valid Until"
            type="date"
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
            required
          />
        </div>

        {/* Line Items Builder */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Line Items & Services
            </h4>
            <Button type="button" variant="outline" size="xs" onClick={addLineItem} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            {lineItems.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-xs">
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Item / Service description"
                    value={item.description}
                    onChange={e => updateLineItem(idx, 'description', e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Unit Price"
                    value={item.unitPrice}
                    onChange={e => updateLineItem(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded p-1.5 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="col-span-2 text-right text-xs font-bold text-slate-800">
                  {formatCurrency(item.amount)}
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    disabled={lineItems.length <= 1}
                    className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </div>
            ))}

            {/* Calculations breakdown */}
            <div className="flex justify-end pt-3 text-xs space-y-1">
              <div className="w-64 space-y-1.5 bg-white p-3 rounded-lg border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tax Rate (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-16 border rounded p-1 text-right text-xs"
                  />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-brand-700 pt-1.5 border-t border-slate-100">
                  <span>Grand Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Payment Terms & Conditions"
            value={terms}
            onChange={e => setTerms(e.target.value)}
          />
          <Input
            label="Client Notes & SLA"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
            {initialData ? 'Update Quotation' : 'Generate Quotation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
