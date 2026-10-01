import React, { useState, useEffect } from 'react';
import { Quotation, QuotationLineItem, QuotationStatus } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';
import { Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';

interface QuotationModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>) => Promise<void>;
  initialData?: Quotation | null;
  initialLeadId?: string | null;
}

export const QuotationModalForm: React.FC<QuotationModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  initialLeadId,
}) => {
  const { user } = useAuth();
  const { leads, updateLead } = useCrm();

  const [selectedLeadId, setSelectedLeadId] = useState<string>('');
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
  const [taxRate, setTaxRate] = useState(0);
  const [terms, setTerms] = useState('Payment within 30 days of invoice date.');
  const [notes, setNotes] = useState('');

  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: `li_${Date.now()}`,
      description: '',
      quantity: 1,
      unitPrice: 0,
      unitOneTime: 0,
      unitMonthly: 0,
      discount: 0,
      amount: 0,
      oneTimeTotal: 0,
      monthlyTotal: 0,
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
      setSelectedLeadId(initialData.leadId || '');
      setDealTitle(initialData.dealTitle || '');
      setStatus(initialData.status);
      setIssueDate(initialData.issueDate);
      setValidUntil(initialData.validUntil);
      setTaxRate(initialData.taxRate);
      setTerms(initialData.terms || '');
      setNotes(initialData.notes || '');
      setLineItems(
        initialData.lineItems.map(item => {
          const unitOneTime = item.unitOneTime ?? item.unitPrice ?? 0;
          const unitMonthly = item.unitMonthly ?? 0;
          const oneTimeTotal = item.oneTimeTotal ?? item.amount ?? (item.quantity * unitOneTime);
          const monthlyTotal = item.monthlyTotal ?? (item.quantity * unitMonthly);
          return {
            ...item,
            unitOneTime,
            unitMonthly,
            oneTimeTotal,
            monthlyTotal,
          };
        })
      );
    } else {
      const defaultLead = initialLeadId ? leads.find(l => l.id === initialLeadId) : null;
      setSelectedLeadId(defaultLead ? defaultLead.id : '');
      setTitle(defaultLead ? `ZANI Intelligence Platform - ${defaultLead.company}` : 'ZANI Facility Intelligence Platform Quotation');
      setCompanyName(defaultLead ? defaultLead.company : '');
      setContactName(defaultLead ? defaultLead.name : '');
      setContactEmail(defaultLead ? defaultLead.email : '');
      setDealTitle('');
      setStatus('draft');
      setIssueDate(new Date().toISOString().split('T')[0]);
      setValidUntil(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
      setTaxRate(0);
      setTerms('Pricing excludes applicable taxes. Recurring fees are billed monthly and include LTE connectivity, cloud hosting, and software updates.');
      setNotes('One-time charges cover hardware, shipping, installation, and travel as itemized above. Quote valid for the period stated above.');

      setLineItems([
        {
          id: `li_${Date.now()}_1`,
          description: 'Dispenser sensor / machine tracking',
          quantity: 100,
          unitPrice: 0,
          unitOneTime: 0,
          unitMonthly: 5,
          discount: 0,
          amount: 0,
          oneTimeTotal: 0,
          monthlyTotal: 500,
        },
        {
          id: `li_${Date.now()}_2`,
          description: 'Gateway & LTE',
          quantity: 3,
          unitPrice: 0,
          unitOneTime: 0,
          unitMonthly: 30,
          discount: 0,
          amount: 0,
          oneTimeTotal: 0,
          monthlyTotal: 90,
        },
        {
          id: `li_${Date.now()}_3`,
          description: 'Installation + Travel',
          quantity: 1,
          unitPrice: 3000,
          unitOneTime: 3000,
          unitMonthly: 0,
          discount: 0,
          amount: 3000,
          oneTimeTotal: 3000,
          monthlyTotal: 0,
        },
        {
          id: `li_${Date.now()}_4`,
          description: 'Shipping',
          quantity: 1,
          unitPrice: 250,
          unitOneTime: 250,
          unitMonthly: 0,
          discount: 0,
          amount: 250,
          oneTimeTotal: 250,
          monthlyTotal: 0,
        },
        {
          id: `li_${Date.now()}_5`,
          description: 'ZANI License - LLM Platform with Data Agent only',
          quantity: 2,
          unitPrice: 0,
          unitOneTime: 0,
          unitMonthly: 120,
          discount: 0,
          amount: 0,
          oneTimeTotal: 0,
          monthlyTotal: 240,
        },
      ]);
    }
    setErrors({});
  }, [initialData, initialLeadId, isOpen, leads]);

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (!leadId) return;

    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setCompanyName(lead.company);
      setContactName(lead.name);
      if (lead.email) setContactEmail(lead.email);
      if (!title || title.startsWith('Commercial Quotation') || title.startsWith('ZANI')) {
        setTitle(`ZANI Intelligence Platform - ${lead.company}`);
      }
    }
  };

  const addLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        id: `li_${Date.now()}_${Math.random()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        unitOneTime: 0,
        unitMonthly: 0,
        discount: 0,
        amount: 0,
        oneTimeTotal: 0,
        monthlyTotal: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (
    index: number,
    field: keyof QuotationLineItem,
    value: string | number
  ) => {
    setLineItems(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      const qty = field === 'quantity' ? Number(value) : item.quantity;
      const oneTime = field === 'unitOneTime' ? Number(value) : (item.unitOneTime ?? item.unitPrice ?? 0);
      const monthly = field === 'unitMonthly' ? Number(value) : (item.unitMonthly ?? 0);
      const disc = field === 'discount' ? Number(value) : (item.discount ?? 0);

      item.quantity = qty;
      item.unitOneTime = oneTime;
      item.unitMonthly = monthly;
      item.unitPrice = oneTime;
      item.oneTimeTotal = Math.max(0, qty * oneTime - (qty * oneTime * disc) / 100);
      item.monthlyTotal = Math.max(0, qty * monthly);
      item.amount = item.oneTimeTotal;

      next[index] = item;
      return next;
    });
  };

  const handleKeyDownNumericOnly = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End',
      ].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Only allow digits 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const oneTimeSubtotal = lineItems.reduce(
    (acc, curr) => acc + (curr.oneTimeTotal ?? curr.amount ?? 0),
    0
  );
  const monthlySubtotal = lineItems.reduce((acc, curr) => acc + (curr.monthlyTotal ?? 0), 0);
  const annualRecurring = monthlySubtotal * 12;
  const year1Total = oneTimeSubtotal + annualRecurring;
  const subtotal = oneTimeSubtotal;
  const taxAmount = (oneTimeSubtotal * taxRate) / 100;
  const totalOneTime = oneTimeSubtotal + taxAmount;
  const totalMonthly = monthlySubtotal;
  const total = totalOneTime;

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
      const selectedLead = leads.find(l => l.id === selectedLeadId);
      await onSubmit({
        title,
        companyName,
        contactName,
        contactEmail: contactEmail.trim(),
        leadId: selectedLeadId || undefined,
        leadName: selectedLead ? `${selectedLead.name} (${selectedLead.company})` : undefined,
        dealTitle,
        status,
        issueDate,
        validUntil,
        lineItems,
        subtotal,
        oneTimeSubtotal,
        monthlySubtotal,
        annualRecurring,
        year1Total,
        taxRate: Number(taxRate),
        taxAmount,
        total,
        totalOneTime,
        totalMonthly,
        terms,
        notes,
        createdBy: user?.name || 'User',
      });

      // When quotation is created or sent based on an enquiry, update the lead status to 'proposal'
      if (selectedLeadId) {
        try {
          await updateLead(selectedLeadId, { status: 'proposal' });
        } catch (err) {
          console.error('Failed to update lead status:', err);
        }
      }

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
        {/* Enquiry Link & Quotation Status Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Based on Lead / Enquiry"
            value={selectedLeadId}
            onChange={e => handleLeadSelect(e.target.value)}
            options={[
              { value: '', label: '— Manual / Direct Quotation —' },
              ...leads.map(lead => ({
                value: lead.id,
                label: `${lead.company} (${lead.name}) - Est: $${lead.estimatedValue.toLocaleString()}`,
              })),
            ]}
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

        {/* Quotation Title */}
        <div>
          <Input
            label="Proposal / Quotation Title"
            placeholder="e.g. Enterprise Cloud AI Deployment Proposal"
            value={title}
            onChange={e => setTitle(e.target.value)}
            error={errors.title}
            required
          />
        </div>

        {/* Company Name, Contact Person, Contact Email */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Company Name"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Line Items Builder with requested fields */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Line Items & Services
              </h4>
              <p className="text-[11px] text-slate-500">Configure quantities, one-time hardware/setup fees, and recurring monthly charges</p>
            </div>
            <Button type="button" variant="outline" size="xs" onClick={addLineItem} icon={<Plus className="w-3.5 h-3.5" />}>
              Add Item
            </Button>
          </div>

          {/* Line Items Table with clean full border UI style and no dark background */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold">
                <tr className="divide-x divide-slate-200 border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 text-left">Description</th>
                  <th className="py-2.5 px-2 text-center w-16">Qty</th>
                  <th className="py-2.5 px-3 text-right w-32">Unit One-Time</th>
                  <th className="py-2.5 px-3 text-right w-32">Unit Monthly</th>
                  <th className="py-2.5 px-3 text-right w-28">One-Time Total</th>
                  <th className="py-2.5 px-3 text-right w-28">Monthly Total</th>
                  <th className="py-2.5 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {lineItems.map((item, idx) => {
                  const oneTimeUnit = item.unitOneTime ?? item.unitPrice ?? 0;
                  const monthlyUnit = item.unitMonthly ?? 0;
                  const oneTimeTot = item.oneTimeTotal ?? (item.quantity * oneTimeUnit);
                  const monthlyTot = item.monthlyTotal ?? (item.quantity * monthlyUnit);

                  return (
                    <tr key={item.id} className="divide-x divide-slate-200 hover:bg-slate-50/50 transition-colors">
                      {/* Description */}
                      <td className="p-2">
                        <input
                          type="text"
                          placeholder="Item / Service description"
                          value={item.description}
                          onChange={e => updateLineItem(idx, 'description', e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-brand-500"
                          required
                        />
                      </td>

                      {/* Qty */}
                      <td className="p-2 text-center">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder="1"
                          value={item.quantity === 0 ? '' : item.quantity}
                          onFocus={e => {
                            if (e.target.value === '0') e.target.select();
                          }}
                          onKeyDown={handleKeyDownNumericOnly}
                          onChange={e => {
                            const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                            const val = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
                            updateLineItem(idx, 'quantity', val);
                          }}
                          className="w-full text-xs text-center border border-slate-200 rounded px-1.5 py-1.5 focus:outline-none focus:border-brand-500 font-mono"
                          required
                        />
                      </td>

                      {/* Unit One-Time */}
                      <td className="p-2 text-right">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 select-none">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={oneTimeUnit === 0 ? '0' : oneTimeUnit}
                            onFocus={e => {
                              if (e.target.value === '0') e.target.select();
                            }}
                            onKeyDown={handleKeyDownNumericOnly}
                            onChange={e => {
                              const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                              const val = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
                              updateLineItem(idx, 'unitOneTime', val);
                            }}
                            className="w-full text-xs text-right pl-6 pr-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-brand-500 font-mono"
                          />
                        </div>
                      </td>

                      {/* Unit Monthly */}
                      <td className="p-2 text-right">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 select-none">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="0"
                            value={monthlyUnit === 0 ? '0' : monthlyUnit}
                            onFocus={e => {
                              if (e.target.value === '0') e.target.select();
                            }}
                            onKeyDown={handleKeyDownNumericOnly}
                            onChange={e => {
                              const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                              const val = digitsOnly === '' ? 0 : parseInt(digitsOnly, 10);
                              updateLineItem(idx, 'unitMonthly', val);
                            }}
                            className="w-full text-xs text-right pl-6 pr-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-brand-500 font-mono"
                          />
                        </div>
                      </td>

                      {/* One-Time Total */}
                      <td className="p-2 text-right font-bold text-slate-900 font-mono text-xs whitespace-nowrap">
                        {formatCurrency(oneTimeTot)}
                      </td>

                      {/* Monthly Total */}
                      <td className="p-2 text-right font-bold text-indigo-700 font-mono text-xs whitespace-nowrap">
                        {formatCurrency(monthlyTot)}
                      </td>

                      {/* Delete Button */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          disabled={lineItems.length <= 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed p-1 rounded transition-colors"
                          title="Remove Item"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

            {/* Calculations breakdown */}
            <div className="flex justify-end pt-3 text-xs">
              <div className="w-full sm:w-80 space-y-2 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex justify-between text-slate-600">
                  <span>One-Time Subtotal:</span>
                  <span className="font-semibold text-slate-800 font-mono">{formatCurrency(oneTimeSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Monthly Recurring Subtotal:</span>
                  <span className="font-semibold text-indigo-700 font-mono">{formatCurrency(monthlySubtotal)} / mo</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-100">
                  <span>Tax Rate (% on One-Time):</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={taxRate === 0 ? '0' : taxRate}
                    onFocus={e => {
                      if (e.target.value === '0') e.target.select();
                    }}
                    onKeyDown={handleKeyDownNumericOnly}
                    onChange={e => {
                      const digitsOnly = e.target.value.replace(/[^0-9]/g, '');
                      const val = digitsOnly === '' ? 0 : Math.min(100, parseInt(digitsOnly, 10));
                      setTaxRate(val);
                    }}
                    className="w-16 border rounded p-1 text-right text-xs font-mono"
                  />
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax Amount:</span>
                  <span className="font-mono">{formatCurrency(taxAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="flex justify-between text-sm font-extrabold text-brand-700">
                    <span>One-Time Total:</span>
                    <span className="font-mono">{formatCurrency(totalOneTime)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-indigo-700">
                    <span>Monthly Total:</span>
                    <span className="font-mono">{formatCurrency(totalMonthly)} / mo</span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1 border-t border-slate-100">
                    <span>Annual recurring (12 mos):</span>
                    <span className="font-mono">{formatCurrency(annualRecurring)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 bg-slate-100 p-2 rounded-lg">
                    <span>Year 1 Total:</span>
                    <span className="font-mono font-black">{formatCurrency(year1Total)}</span>
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
