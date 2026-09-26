import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Quotation, QuotationStatus } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { QuotationModalForm } from '../../components/forms/QuotationModalForm';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  Eye,
  CheckCircle,
  Printer,
  Edit2,
  Trash2,
  Send,
  Building2,
} from 'lucide-react';

export const QuotationsPage: React.FC = () => {
  const { quotations, createQuotation, updateQuotationStatus, deleteQuotation, isLoading } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Filtered
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  const handleStatusChange = async (id: string, status: QuotationStatus) => {
    await updateQuotationStatus(id, status);
  };

  const handleDelete = async (id: string, quoteNumber: string) => {
    if (window.confirm(`Delete quotation ${quoteNumber}?`)) {
      await deleteQuotation(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const statusVariantMap: Record<QuotationStatus, 'slate' | 'blue' | 'green' | 'rose' | 'amber'> = {
    draft: 'slate',
    sent: 'blue',
    accepted: 'green',
    declined: 'rose',
    expired: 'amber',
  };

  const columns: Column<Quotation>[] = [
    {
      key: 'quoteNumber',
      header: 'Quote # & Title',
      render: q => (
        <div>
          <div className="font-mono font-bold text-xs text-brand-600">{q.quoteNumber}</div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5">{q.title}</div>
          {q.dealTitle && (
            <div className="text-[11px] text-slate-400">Deal: {q.dealTitle}</div>
          )}
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client Organization',
      render: q => (
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{q.companyName}</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">{q.contactName} ({q.contactEmail})</div>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Value',
      render: q => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-sm">
            {formatCurrency(q.total)}
          </div>
          <div className="text-[11px] text-slate-400">Tax: {formatCurrency(q.taxAmount)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: q => (
        <Badge variant={statusVariantMap[q.status]} size="sm">
          {q.status}
        </Badge>
      ),
    },
    {
      key: 'validity',
      header: 'Issue / Validity',
      render: q => (
        <div className="text-xs text-slate-500">
          <div>Issued: {formatDate(q.issueDate)}</div>
          <div>Valid until: {formatDate(q.validUntil)}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: q => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Quick status cycle */}
          {q.status === 'draft' && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleStatusChange(q.id, 'sent')}
              icon={<Send className="w-3 h-3" />}
            >
              Send
            </Button>
          )}
          {q.status === 'sent' && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleStatusChange(q.id, 'accepted')}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              icon={<CheckCircle className="w-3 h-3" />}
            >
              Accept
            </Button>
          )}

          <button
            onClick={() => setPreviewQuote(q)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"
            title="Preview Quote Invoice"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setEditingQuote(q);
              setModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            title="Edit Quote"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(q.id, q.quoteNumber)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
            title="Delete Quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Quotations & Proposals
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {quotations.length} Proposals
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build itemized proposals, calculate multi-tier licenses, and formalize enterprise contracts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV('ZanCRM_Quotations', filteredQuotations, [
                { key: 'quoteNumber', label: 'Quote Number' },
                { key: 'title', label: 'Title' },
                { key: 'companyName', label: 'Client' },
                { key: 'contactName', label: 'Contact' },
                { key: 'status', label: 'Status' },
                { key: 'total', label: 'Total Value ($)' },
                { key: 'issueDate', label: 'Issue Date' },
                { key: 'validUntil', label: 'Valid Until' },
              ])
            }
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingQuote(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search quotations by quote #, client, title..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <Table
          columns={columns}
          data={paginatedQuotations}
          keyExtractor={q => q.id}
          isLoading={isLoading}
          emptyMessage="No quotations recorded."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredQuotations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Quotation Create/Edit Modal */}
      <QuotationModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingQuote}
        onSubmit={async data => {
          await createQuotation(data);
        }}
      />

      {/* Invoice Document Preview Modal */}
      {previewQuote && (
        <Modal
          isOpen={!!previewQuote}
          onClose={() => setPreviewQuote(null)}
          title={`Commercial Quotation — ${previewQuote.quoteNumber}`}
          subtitle="Client-facing document view and export layout"
          maxWidth="3xl"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
            {/* Header / Brand */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-6">
              <div>
                <div className="flex items-center gap-2 text-brand-600 font-extrabold text-xl">
                  <span>ZanCRM Systems Inc.</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">100 Enterprise Way, Suite 400</p>
                <p className="text-xs text-slate-500">San Francisco, CA 94107</p>
                <p className="text-xs text-slate-500">sales@zancrm.internal</p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900 font-mono">
                  {previewQuote.quoteNumber}
                </span>
                <div className="mt-1">
                  <Badge variant={statusVariantMap[previewQuote.status]} size="sm">
                    {previewQuote.status}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">Issue Date: {formatDate(previewQuote.issueDate)}</p>
                <p className="text-xs text-slate-500">Valid Until: {formatDate(previewQuote.validUntil)}</p>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Prepared For:
                </span>
                <p className="font-extrabold text-slate-900 text-sm">{previewQuote.companyName}</p>
                <p className="text-slate-600">{previewQuote.contactName}</p>
                <p className="text-slate-600">{previewQuote.contactEmail}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Prepared By:
                </span>
                <p className="font-extrabold text-slate-900 text-sm">{previewQuote.createdBy}</p>
                <p className="text-slate-600">Enterprise Revenue Team</p>
                {previewQuote.dealTitle && (
                  <p className="text-slate-600 mt-1 font-semibold">Deal: {previewQuote.dealTitle}</p>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 text-left">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewQuote.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-3 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-3 text-right text-slate-600 font-mono">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Calculation */}
              <div className="flex justify-end pt-4 border-t border-slate-200 text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(previewQuote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Tax ({previewQuote.taxRate}%):</span>
                    <span>{formatCurrency(previewQuote.taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-brand-700 pt-2 border-t border-slate-200">
                    <span>Total Amount:</span>
                    <span>{formatCurrency(previewQuote.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and notes */}
            {(previewQuote.terms || previewQuote.notes) && (
              <div className="text-xs text-slate-500 p-3 bg-slate-50 rounded-xl space-y-1">
                {previewQuote.terms && (
                  <p><span className="font-semibold text-slate-700">Terms:</span> {previewQuote.terms}</p>
                )}
                {previewQuote.notes && (
                  <p><span className="font-semibold text-slate-700">Notes:</span> {previewQuote.notes}</p>
                )}
              </div>
            )}

            {/* Print and Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
                Print / Save PDF
              </Button>
              <Button variant="primary" size="sm" onClick={() => setPreviewQuote(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
