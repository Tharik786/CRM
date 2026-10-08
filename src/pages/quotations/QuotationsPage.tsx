import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import { Quotation, QuotationStatus } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { Modal } from '../../components/common/Modal';
import { QuotationModalForm } from '../../components/forms/QuotationModalForm';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  Eye,
  CheckCircle,
  Printer,
  Edit2,
  Send,
  Building2,
  Trash2,
} from 'lucide-react';

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const format = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const start = format(year, month, 1);
  const end = format(year, month, new Date(year, month + 1, 0).getDate());
  return { start, end };
};

export const QuotationsPage: React.FC = () => {
  const { quotations, createQuotation, updateQuotation, updateQuotationStatus, deleteQuotation, isLoading } = useCrm();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const initialMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(initialMonthRange.start);
  const [endDate, setEndDate] = useState<string>(initialMonthRange.end);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [initialLeadId, setInitialLeadId] = useState<string | null>(null);
  const [previewQuote, setPreviewQuote] = useState<Quotation | null>(null);

  // Auto-open modal if navigated from Enquiry / Lead page with leadId
  useEffect(() => {
    if (location.state && (location.state as { leadId?: string }).leadId) {
      setInitialLeadId((location.state as { leadId: string }).leadId);
      setEditingQuote(null);
      setModalOpen(true);
    }
  }, [location.state]);

  // Filtered
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;

      let matchesDate = true;
      if (startDate || endDate) {
        const quoteDate = (() => {
          const dStr = q.issueDate || q.createdAt;
          if (!dStr) return '';
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr.substring(0, 10);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        })();

        if (startDate && quoteDate < startDate) matchesDate = false;
        if (endDate && quoteDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [quotations, searchTerm, statusFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage]);

  const handleStatusChange = async (id: string, status: QuotationStatus) => {
    await updateQuotationStatus(id, status);
  };

  const handlePrint = () => {
    if (!previewQuote) {
      window.print();
      return;
    }

    const quoteDisplayNumber = previewQuote.quoteNumber.startsWith('QT-')
      ? previewQuote.quoteNumber.replace(/^QT-/, 'ZQ-')
      : previewQuote.quoteNumber.startsWith('Q-')
        ? previewQuote.quoteNumber.replace(/^Q-/, 'ZQ-')
        : previewQuote.quoteNumber;

    const formatDashOrPrice = (val: number | undefined | null) => {
      if (val === undefined || val === null || val === 0) {
        return '-';
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: val % 1 !== 0 ? 2 : 0,
      }).format(val);
    };

    const formatUSDate = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
          return `${parts[1]}-${parts[2]}-${parts[0]}`;
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const year = d.getFullYear();
          return `${month}-${day}-${year}`;
        }
      } catch { }
      return dateStr;
    };

    const calculateValidDays = (issueDateStr: string, validUntilStr: string) => {
      if (!issueDateStr || !validUntilStr) return '30 days';
      try {
        const start = new Date(issueDateStr).getTime();
        const end = new Date(validUntilStr).getTime();
        const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `${diffDays} days`;
      } catch { }
      return '30 days';
    };

    const oneTimeSubtotal = previewQuote.lineItems.reduce((acc, item) => {
      const oneTimeUnit = item.unitOneTime ?? (item.unitPrice && !item.unitMonthly ? item.unitPrice : 0);
      const oneTimeTot = item.oneTimeTotal ?? (oneTimeUnit ? (item.quantity || 1) * oneTimeUnit : 0);
      return acc + (oneTimeTot || 0);
    }, 0);

    const monthlySubtotal = previewQuote.lineItems.reduce((acc, item) => {
      const monthlyUnit = item.unitMonthly ?? 0;
      const monthlyTot = item.monthlyTotal ?? (monthlyUnit ? (item.quantity || 1) * monthlyUnit : 0);
      return acc + (monthlyTot || 0);
    }, 0);

    const annualRecurring = monthlySubtotal * 12;
    const year1Total = oneTimeSubtotal + annualRecurring;

    const itemsRowsHtml = previewQuote.lineItems
      .map(item => {
        const oneTimeUnit = item.unitOneTime ?? (item.unitPrice && !item.unitMonthly ? item.unitPrice : 0);
        const monthlyUnit = item.unitMonthly ?? 0;
        const oneTimeTot = item.oneTimeTotal ?? (oneTimeUnit ? (item.quantity || 1) * oneTimeUnit : 0);
        const monthlyTot = item.monthlyTotal ?? (monthlyUnit ? (item.quantity || 1) * monthlyUnit : 0);

        return `
          <tr>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 500; color: #0f172a;">${item.description}</td>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: center; font-family: monospace; color: #0f172a;">${item.quantity}</td>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; color: #0f172a;">${formatDashOrPrice(oneTimeUnit)}</td>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; color: #0f172a;">${formatDashOrPrice(monthlyUnit)}</td>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">${formatDashOrPrice(oneTimeTot)}</td>
            <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 600; color: #0f172a;">${formatDashOrPrice(monthlyTot)}</td>
          </tr>
        `;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${quoteDisplayNumber} - Quotation</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 12mm 8mm 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-size: 11px;
              line-height: 1.35;
              padding: 0;
              margin: 0;
            }
            .container {
              width: 100%;
              max-width: 100%;
              margin: 0;
              padding: 0;
            }
            .header-flex {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
            }
            .logo-wrap {
              display: flex;
              flex-direction: column;
            }
            .logo-img {
              height: 48px;
              width: auto;
              object-fit: contain;
              margin-bottom: 4px;
            }
            .platform-label {
              font-size: 12px;
              font-weight: 500;
              color: #1e293b;
            }
            .doc-heading {
              font-size: 24px;
              font-weight: 900;
              color: #0b1b2d;
              letter-spacing: 0.5px;
              padding-top: 4px;
            }
            .meta-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-bottom: 12px;
              font-size: 12px;
            }
            .meta-left {
              display: flex;
              flex-direction: column;
              gap: 3px;
            }
            .meta-row {
              display: flex;
              align-items: baseline;
              gap: 8px;
            }
            .meta-title {
              font-weight: 700;
              color: #000;
              min-width: 95px;
            }
            .meta-val-client {
              color: #2563eb;
              font-weight: 700;
            }
            .meta-right {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              gap: 4px;
            }
            .meta-badge-row {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .yellow-badge {
              background-color: #fde047 !important;
              color: #000 !important;
              font-weight: 700;
              padding: 2px 10px;
              min-width: 90px;
              text-align: center;
              font-size: 11px;
              display: inline-block;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #94a3b8;
              font-size: 11px;
              margin-bottom: 10px;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            thead tr {
              background-color: #051329 !important;
              color: #ffffff !important;
            }
            th {
              padding: 6px 8px;
              border: 1px solid #94a3b8;
              font-weight: 700;
              font-size: 11px;
            }
            .bg-summary {
              background-color: #eaf1f8 !important;
              font-weight: 700;
              color: #0f172a;
            }
            .bg-year1 {
              background-color: #eaf1f8 !important;
              font-weight: 900;
              color: #020617;
            }
            .terms-notes-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-top: 10px;
            }
            .terms-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 8px 10px;
            }
            .terms-title {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #0f172a;
              margin-bottom: 4px;
              letter-spacing: 0.5px;
            }
            .terms-content {
              font-size: 9.5px;
              color: #334155;
              line-height: 1.4;
              white-space: pre-line;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header-flex">
              <div class="logo-wrap">
                <img class="logo-img" src="/zancompute-logo.png" alt="ZAN COMPUTE" />
                <div class="platform-label">ZANI Facility Intelligence Platform</div>
              </div>
              <div class="doc-heading">QUOTATION</div>
            </div>

            <div class="meta-section">
              <div class="meta-left">
                <div class="meta-row">
                  <span class="meta-title">Prepared for:</span>
                  <span class="meta-val-client">${previewQuote.companyName || '[Client Name]'}</span>
                </div>
                <div class="meta-row">
                  <span class="meta-title">Quote #:</span>
                  <span class="meta-val-client">${quoteDisplayNumber}</span>
                </div>
              </div>

              <div class="meta-right">
                <div class="meta-badge-row">
                  <span class="meta-title" style="min-width: auto;">Date:</span>
                  <span class="yellow-badge">${formatUSDate(previewQuote.issueDate)}</span>
                </div>
                <div class="meta-badge-row">
                  <span class="meta-title" style="min-width: auto;">Valid for:</span>
                  <span class="yellow-badge">${calculateValidDays(previewQuote.issueDate, previewQuote.validUntil)}</span>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Description</th>
                  <th style="text-align: center; width: 45px;">Qty</th>
                  <th style="text-align: right; width: 95px;">Unit One-Time</th>
                  <th style="text-align: right; width: 95px;">Unit Monthly</th>
                  <th style="text-align: right; width: 105px;">One-Time Total</th>
                  <th style="text-align: right; width: 105px;">Monthly Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRowsHtml}
                <tr class="bg-summary">
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 700;">Subtotal</td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 700;">${formatDashOrPrice(oneTimeSubtotal)}</td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 700;">${formatDashOrPrice(monthlySubtotal)}</td>
                </tr>
                <tr class="bg-summary">
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 700;">Annual recurring (12 months)</td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 700;">${formatDashOrPrice(annualRecurring)}</td>
                </tr>
                <tr class="bg-year1">
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; font-weight: 900;">Year 1 Total (one-time + 12 months recurring)</td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8;"></td>
                  <td style="padding: 5px 8px; border: 1px solid #94a3b8; text-align: right; font-family: monospace; font-weight: 900;">${formatDashOrPrice(year1Total)}</td>
                </tr>
              </tbody>
            </table>

            <div class="terms-notes-grid">
              <div class="terms-box">
                <div class="terms-title">Payment Terms & Conditions</div>
                <div class="terms-content">${previewQuote.terms || 'Pricing excludes applicable taxes. Recurring fees are billed monthly and include LTE connectivity, cloud hosting, and software updates.'}</div>
              </div>
              <div class="terms-box">
                <div class="terms-title">Client Notes </div>
                <div class="terms-content">${previewQuote.notes || 'One-time charges cover hardware, shipping, installation, and travel as itemized above. Quote valid for the period stated above.'}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Print using clean hidden iframe to prevent modal or parent styling from pushing down content
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        printIframe.contentWindow?.focus();
        printIframe.contentWindow?.print();
        setTimeout(() => {
          if (document.body.contains(printIframe)) {
            document.body.removeChild(printIframe);
          }
        }, 1500);
      }, 350);
    }
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
      header: 'Quote #',
      render: q => (
        <span className="font-mono font-bold text-xs sm:text-sm text-brand-600">
          {q.quoteNumber}
        </span>
      ),
    },
    {
      key: 'client',
      header: 'Company Name',
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
          <div className="text-[11px] text-slate-400">
            Tax{q.taxRate ? ` (${q.taxRate}%)` : ''}: {formatCurrency(q.taxAmount)}
          </div>
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
              title="Mark as Sent to Client"
            >
              Send
            </Button>
          )}
          {q.status !== 'accepted' && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleStatusChange(q.id, 'accepted')}
              className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              icon={<CheckCircle className="w-3 h-3" />}
              title="Accept Quotation & Convert to Client Directory"
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
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete quotation ${q.quoteNumber}?`)) {
                await deleteQuotation(q.id);
              }
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Quote"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Customer Quotations & Proposals
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
              {quotations.length} Proposals
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
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

        <div className="flex flex-wrap items-center gap-2">
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

          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Quotations Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <Table
          columns={columns}
          data={paginatedQuotations}
          keyExtractor={q => q.id}
          isLoading={isLoading}
          noScroll={true}
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
        onClose={() => {
          setModalOpen(false);
          setEditingQuote(null);
          setInitialLeadId(null);
        }}
        initialData={editingQuote}
        initialLeadId={initialLeadId}
        onSubmit={async data => {
          if (editingQuote) {
            await updateQuotation(editingQuote.id, data);
          } else {
            await createQuotation(data);
          }
        }}
      />

      {/* Invoice Document Preview Modal */}
      {previewQuote && (
        <Modal
          isOpen={!!previewQuote}
          onClose={() => setPreviewQuote(null)}
          title={`Quotation Template — ${previewQuote.quoteNumber}`}
          subtitle="Official ZanCompute Proposal & Agreement Layout"
          maxWidth="4xl"
        >
          {(() => {
            const quoteDisplayNumber = previewQuote.quoteNumber.startsWith('QT-')
              ? previewQuote.quoteNumber.replace(/^QT-/, 'ZQ-')
              : previewQuote.quoteNumber.startsWith('Q-')
                ? previewQuote.quoteNumber.replace(/^Q-/, 'ZQ-')
                : previewQuote.quoteNumber;

            const formatDashOrPrice = (val: number | undefined | null) => {
              if (val === undefined || val === null || val === 0) {
                return '-';
              }
              return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: val % 1 !== 0 ? 2 : 0,
              }).format(val);
            };

            const formatUSDate = (dateStr: string) => {
              if (!dateStr) return '';
              try {
                const parts = dateStr.split('-');
                if (parts.length === 3 && parts[0].length === 4) {
                  return `${parts[1]}-${parts[2]}-${parts[0]}`;
                }
                const d = new Date(dateStr);
                if (!isNaN(d.getTime())) {
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  const year = d.getFullYear();
                  return `${month}-${day}-${year}`;
                }
              } catch { }
              return dateStr;
            };

            const calculateValidDays = (issueDateStr: string, validUntilStr: string) => {
              if (!issueDateStr || !validUntilStr) return '30 days';
              try {
                const start = new Date(issueDateStr).getTime();
                const end = new Date(validUntilStr).getTime();
                const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
                if (diffDays > 0) return `${diffDays} days`;
              } catch { }
              return '30 days';
            };

            const oneTimeSubtotal = previewQuote.lineItems.reduce((acc, item) => {
              const oneTimeUnit = item.unitOneTime ?? (item.unitPrice && !item.unitMonthly ? item.unitPrice : 0);
              const oneTimeTot = item.oneTimeTotal ?? (oneTimeUnit ? (item.quantity || 1) * oneTimeUnit : 0);
              return acc + (oneTimeTot || 0);
            }, 0);

            const monthlySubtotal = previewQuote.lineItems.reduce((acc, item) => {
              const monthlyUnit = item.unitMonthly ?? 0;
              const monthlyTot = item.monthlyTotal ?? (monthlyUnit ? (item.quantity || 1) * monthlyUnit : 0);
              return acc + (monthlyTot || 0);
            }, 0);

            const annualRecurring = monthlySubtotal * 12;
            const year1Total = oneTimeSubtotal + annualRecurring;

            return (
              <div className="space-y-6">
                {/* Printable Quotation Document Container */}
                <div
                  id="quotation-print-area"
                  className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-sm space-y-6 text-slate-900"
                >
                  {/* Top Header: Logo + Platform Title (Left) and QUOTATION (Right) */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <img
                        src="/zancompute-logo.png"
                        alt="ZAN COMPUTE"
                        className="h-14 sm:h-16 w-auto object-contain"
                      />
                      <p className="text-sm sm:text-base font-medium text-slate-800 tracking-tight">
                        ZANI Facility Intelligence Platform
                      </p>
                    </div>

                    <div className="text-right pt-2">
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wider">
                        QUOTATION
                      </h1>
                    </div>
                  </div>

                  {/* Metadata Row: Prepared for & Quote # (Left) | Date & Valid for (Right) */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-transparent">
                    <div className="space-y-1 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 min-w-[110px]">Prepared for:</span>
                        <span className="text-blue-600 font-bold">
                          {previewQuote.companyName || '[Client Name]'}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-900 min-w-[110px]">Quote #:</span>
                        <span className="text-blue-600 font-bold">
                          {quoteDisplayNumber}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-sm sm:text-right">
                      <div className="flex sm:justify-end items-center gap-3">
                        <span className="font-bold text-slate-900 min-w-[70px]">Date:</span>
                        <span className="bg-yellow-300 font-bold px-3 py-0.5 text-slate-900 inline-block min-w-[110px] text-center">
                          {formatUSDate(previewQuote.issueDate)}
                        </span>
                      </div>
                      <div className="flex sm:justify-end items-center gap-3">
                        <span className="font-bold text-slate-900 min-w-[70px]">Valid for:</span>
                        <span className="bg-yellow-300 font-bold px-3 py-0.5 text-slate-900 inline-block min-w-[110px] text-center">
                          {calculateValidDays(previewQuote.issueDate, previewQuote.validUntil)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#051329] text-white">
                          <th className="border border-slate-300 px-3 py-2.5 text-left font-bold tracking-tight">
                            Description
                          </th>
                          <th className="border border-slate-300 px-2 py-2.5 text-center font-bold tracking-tight w-16">
                            Qty
                          </th>
                          <th className="border border-slate-300 px-3 py-2.5 text-right font-bold tracking-tight w-28">
                            Unit One-Time
                          </th>
                          <th className="border border-slate-300 px-3 py-2.5 text-right font-bold tracking-tight w-28">
                            Unit Monthly
                          </th>
                          <th className="border border-slate-300 px-3 py-2.5 text-right font-bold tracking-tight w-32">
                            One-Time Total
                          </th>
                          <th className="border border-slate-300 px-3 py-2.5 text-right font-bold tracking-tight w-32">
                            Monthly Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {previewQuote.lineItems.map((item, idx) => {
                          const oneTimeUnit =
                            item.unitOneTime ??
                            (item.unitPrice && !item.unitMonthly ? item.unitPrice : 0);
                          const monthlyUnit = item.unitMonthly ?? 0;
                          const oneTimeTot =
                            item.oneTimeTotal ??
                            (oneTimeUnit ? (item.quantity || 1) * oneTimeUnit : 0);
                          const monthlyTot =
                            item.monthlyTotal ??
                            (monthlyUnit ? (item.quantity || 1) * monthlyUnit : 0);

                          return (
                            <tr key={item.id || idx}>
                              <td className="border border-slate-300 px-3 py-2 text-left text-slate-900 font-medium">
                                {item.description}
                              </td>
                              <td className="border border-slate-300 px-2 py-2 text-center text-slate-900 font-mono">
                                {item.quantity}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-mono">
                                {formatDashOrPrice(oneTimeUnit)}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-mono">
                                {formatDashOrPrice(monthlyUnit)}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-mono font-medium">
                                {formatDashOrPrice(oneTimeTot)}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-right text-slate-900 font-mono font-medium">
                                {formatDashOrPrice(monthlyTot)}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Subtotal row */}
                        <tr className="bg-[#eaf1f8] font-bold text-slate-900">
                          <td className="border border-slate-300 px-3 py-2 text-left font-bold">
                            Subtotal
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">
                            {formatDashOrPrice(oneTimeSubtotal)}
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">
                            {formatDashOrPrice(monthlySubtotal)}
                          </td>
                        </tr>

                        {/* Annual recurring (12 months) row */}
                        <tr className="bg-[#eaf1f8] font-bold text-slate-900">
                          <td className="border border-slate-300 px-3 py-2 text-left font-bold">
                            Annual recurring (12 months)
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">
                            {formatDashOrPrice(annualRecurring)}
                          </td>
                        </tr>

                        {/* Year 1 Total row */}
                        <tr className="bg-[#eaf1f8] font-black text-slate-900">
                          <td className="border border-slate-300 px-3 py-2 text-left font-extrabold">
                            Year 1 Total (one-time + 12 months recurring)
                          </td>
                          <td className="border border-slate-300 px-2 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2"></td>
                          <td className="border border-slate-300 px-3 py-2 text-right font-mono font-black text-slate-950">
                            {formatDashOrPrice(year1Total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Terms & Conditions & Client Notes Dedicated Sections */}
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
                      <div className="font-bold text-slate-900 text-xs tracking-tight mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                        Payment Terms & Conditions
                      </div>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed text-xs">
                        {previewQuote.terms ||
                          'Pricing excludes applicable taxes. Recurring fees are billed monthly and include LTE connectivity, cloud hosting, and software updates.'}
                      </p>
                    </div>

                    <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 shadow-2xs">
                      <div className="font-bold text-slate-900 text-xs tracking-tight mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                        Client Notes
                      </div>
                      <p className="text-slate-600 whitespace-pre-line leading-relaxed text-xs">
                        {previewQuote.notes ||
                          'One-time charges cover hardware, shipping, installation, and travel as itemized above. Quote valid for the period stated above.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Print and Actions Modal Controls (hidden during print) */}
                <div className="no-print flex items-center justify-between pt-2">
                  <div className="text-xs text-slate-500">
                    Client: <span className="font-semibold text-slate-700">{previewQuote.companyName}</span> ({previewQuote.contactName})
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
                      Print / Save PDF
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => setPreviewQuote(null)}>
                      Close Preview
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
