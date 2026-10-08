import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadSource, Quotation, QuotationStatus } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { LeadModalForm } from '../../components/forms/LeadModalForm';
import { QuotationModalForm } from '../../components/forms/QuotationModalForm';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { formatCurrency, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  ArrowRightLeft,
  Edit2,
  Download,
  Mail,
  Phone,
  User,
  Send,
  FileText,
  MapPin,
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

export const LeadsPage: React.FC = () => {
  const {
    leads,
    contacts,
    quotations,
    createLead,
    updateLead,
    convertLead,
    createQuotation,
    updateQuotation,
    isLoading,
  } = useCrm();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const initialMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(initialMonthRange.start);
  const [endDate, setEndDate] = useState<string>(initialMonthRange.end);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Quotation Modal State
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState<Lead | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quotation | null>(null);
  const [quoteInitialStatus, setQuoteInitialStatus] = useState<QuotationStatus>('sent');

  // Filter & Sort Logic
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        // Converted enquiries are moved to Client Directory only and removed from enquiry table
        if (lead.status === 'converted' || lead.status === 'won') {
          return false;
        }

        const matchesSearch =
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (lead.location && lead.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (lead.country && lead.country.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;

        let matchesStatus = true;
        if (statusFilter !== 'all') {
          if (statusFilter === 'lead') {
            matchesStatus = lead.status === 'lead' || lead.status === 'new';
          } else if (statusFilter === 'contact') {
            matchesStatus = lead.status === 'contact' || lead.status === 'contacted';
          } else if (statusFilter === 'discussion') {
            matchesStatus =
              lead.status === 'discussion' ||
              lead.status === 'proposal' ||
              lead.status === 'negotiation' ||
              lead.status === 'qualified';
          } else if (statusFilter === 'lost') {
            matchesStatus =
              lead.status === 'lost' || lead.status === 'cold' || lead.status === 'unqualified';
          } else {
            matchesStatus = lead.status === statusFilter;
          }
        }

        // Date range filter
        let matchesDate = true;
        if (startDate || endDate) {
          const leadDate = (() => {
            if (!lead.createdAt) return '';
            const d = new Date(lead.createdAt);
            if (isNaN(d.getTime())) return lead.createdAt.substring(0, 10);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })();

          if (startDate && leadDate < startDate) matchesDate = false;
          if (endDate && leadDate > endDate) matchesDate = false;
        }

        return matchesSearch && matchesSource && matchesStatus && matchesDate;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leads, searchTerm, sourceFilter, statusFilter, startDate, endDate]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (lead: Lead) => {
    setEditingLead(lead);
    setModalOpen(true);
  };

  const handleCreateAndSendQuotation = (lead: Lead) => {
    setSelectedLeadForQuote(lead);
    setEditingQuote(null);
    setQuoteInitialStatus('sent');
    setQuoteModalOpen(true);
  };

  const handleOpenQuotation = (lead: Lead, quote: Quotation) => {
    setSelectedLeadForQuote(lead);
    setEditingQuote(quote);
    setQuoteInitialStatus(quote.status);
    setQuoteModalOpen(true);
  };

  const handleQuoteSubmit = async (quoteData: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>) => {
    if (editingQuote) {
      await updateQuotation(editingQuote.id, quoteData);
    } else {
      await createQuotation(quoteData);
    }
    setQuoteModalOpen(false);
  };

  const handleLeadSubmit = async (
    data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
    andSendQuote?: boolean
  ) => {
    let savedLead: Lead;
    if (editingLead) {
      savedLead = await updateLead(editingLead.id, data);
    } else {
      savedLead = await createLead(data);
    }
    setModalOpen(false);

    if (andSendQuote && savedLead) {
      handleCreateAndSendQuotation(savedLead);
    }
  };

  const isConvertedClient = (lead: Lead) =>
    lead.status === 'converted' ||
    Boolean(lead.convertedContactId) ||
    contacts.some(c => c.email && c.email.toLowerCase() === lead.email?.toLowerCase());

  const handleConvert = async (lead: Lead) => {
    if (isConvertedClient(lead)) {
      alert(`${lead.name} (${lead.company}) is already in the Client Directory.`);
      return;
    }
    if (
      window.confirm(
        `Convert "${lead.name} (${lead.company})" to a Client?\n\nThis enquiry will be removed from this table and moved directly to the Client Directory.`
      )
    ) {
      await convertLead(lead.id);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'ZanCRM_Leads_Export',
      filteredLeads,
      [
        { key: 'company', label: 'Company' },
        { key: 'name', label: 'Contact Name' },
        { key: 'country', label: 'Country' },
        { key: 'location', label: 'Location' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'status', label: 'Status' },
        { key: 'source', label: 'Source' },
        { key: 'score', label: 'Fit Score' },
        { key: 'estimatedValue', label: 'Estimated Value' },
        { key: 'createdAt', label: 'Captured Date' },
      ]
    );
  };

  const statusVariantMap: Record<string, 'slate' | 'indigo' | 'green' | 'rose' | 'purple' | 'blue' | 'amber'> = {
    lead: 'blue',
    new: 'blue',
    contact: 'indigo',
    contacted: 'indigo',
    discussion: 'purple',
    proposal: 'purple',
    negotiation: 'purple',
    qualified: 'purple',
    converted: 'green',
    won: 'green',
    lost: 'rose',
    cold: 'rose',
    unqualified: 'rose',
    no_response: 'amber',
  };

  const statusLabelMap: Record<string, string> = {
    lead: 'Lead',
    new: 'Lead',
    contact: 'Contact',
    contacted: 'Contact',
    discussion: 'Discussion',
    proposal: 'Discussion',
    negotiation: 'Discussion',
    qualified: 'Discussion',
    converted: 'Client/Converted',
    won: 'Client/Converted',
    lost: 'Lost',
    cold: 'Lost',
    unqualified: 'Lost',
    no_response: 'No Response',
  };

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Enquiry & Company',
      render: lead => (
        <div className="min-w-0 pr-1">
          {/* Company Name as Bold First */}
          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug" title={lead.company}>
            {lead.company}
          </div>
          {/* Contact Person Name Below */}
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 leading-snug" title={lead.name}>
            <User className="w-3 h-3 text-slate-400 shrink-0" />
            <span>{lead.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: lead => (
        <div className="text-[11px] space-y-0.5 min-w-0 pr-1">
          <div className="flex items-center gap-1 text-slate-600 leading-snug">
            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
            <a
              href={`mailto:${lead.email}`}
              className="hover:text-brand-600 transition-colors"
              title={lead.email}
            >
              {lead.email}
            </a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1 text-slate-400 leading-snug">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{lead.phone}</span>
            </div>
          )}
          {(lead.country || lead.location) && (
            <div className="flex items-center gap-1 text-slate-500 text-[10.5px] leading-snug" title={[lead.location, lead.country].filter(Boolean).join(', ')}>
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[140px]">{[lead.location, lead.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'estimatedValue',
      header: 'Est. Value',
      className: 'whitespace-nowrap',
      render: lead => (
        <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
          {formatCurrency(lead.estimatedValue, lead.currency || 'USD')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'whitespace-nowrap',
      render: lead => (
        <Badge
          variant={statusVariantMap[lead.status] || 'slate'}
          size="xs"
          className="px-2 py-0.5 tracking-normal font-semibold normal-case text-[10.5px]"
        >
          {statusLabelMap[lead.status] || lead.status}
        </Badge>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      className: 'whitespace-nowrap',
      render: lead => {
        const sourceLabelMap: Record<LeadSource, string> = {
          website: 'Website Inbound',
          inbound_call: 'Phone Inbound',
          linkedin: 'LinkedIn',
          referral: 'Referral',
          event: 'Conference',
          cold_outreach: 'Cold Outreach',
        };
        return (
          <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
            {sourceLabelMap[lead.source] || lead.source}
          </span>
        );
      },
    },
    {
      key: 'quotation',
      header: 'Quotation',
      headerClassName: 'text-center',
      className: 'whitespace-nowrap text-center',
      render: lead => {
        const linkedQuote = quotations.find(
          q =>
            q.leadId === lead.id ||
            (q.companyName && q.companyName.toLowerCase() === lead.company.toLowerCase())
        );

        if (linkedQuote) {
          const statusColorMap: Record<string, string> = {
            accepted: 'text-emerald-600',
            sent: 'text-blue-600',
            declined: 'text-rose-600',
            draft: 'text-slate-500',
            expired: 'text-amber-600',
          };
          const colorClass = statusColorMap[linkedQuote.status] || 'text-slate-500';

          return (
            <div className="flex flex-col items-center justify-center gap-0.5 whitespace-nowrap mx-auto">
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleOpenQuotation(lead, linkedQuote);
                }}
                className="text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-0.5 rounded flex items-center gap-1.5 transition-colors shadow-2xs font-mono"
                title={`View / Edit Quotation ${linkedQuote.quoteNumber}`}
              >
                <FileText className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                <span>{linkedQuote.quoteNumber}</span>
              </button>
              <span className={`text-[11px] font-medium capitalize text-center ${colorClass}`}>
                {linkedQuote.status}
              </span>
            </div>
          );
        }

        return (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="xs"
              onClick={e => {
                e.stopPropagation();
                handleCreateAndSendQuotation(lead);
              }}
              icon={<Send className="w-3 h-3 text-brand-600" />}
              className="text-brand-700 border-brand-200 hover:bg-brand-50 font-medium text-[11px] px-2 py-0.5 whitespace-nowrap shadow-2xs"
              title="Create / Send Quotation"
            >
              Quote
            </Button>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right pr-2 sm:pr-3',
      className: 'whitespace-nowrap text-right pr-2 sm:pr-3',
      render: lead => (
        <div className="flex items-center justify-end gap-1.5">
          {!isConvertedClient(lead) && (
            <Button
              variant="outline"
              size="xs"
              onClick={e => {
                e.stopPropagation();
                handleConvert(lead);
              }}
              title="Convert to Client"
              className="text-brand-600 border-brand-200 hover:bg-brand-50 text-[11px] px-2 py-0.5 font-medium shrink-0"
              icon={<ArrowRightLeft className="w-3 h-3" />}
            >
              Client
            </Button>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              handleOpenEdit(lead);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            title="Edit Enquiry"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Enquiries
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              {leads.length} Total
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            icon={<Plus className="w-4 h-4" />}
          >
            New Enquiry
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter enquiries by company, name, email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="lead">Lead</option>
            <option value="contact">Contact</option>
            <option value="discussion">Discussion</option>
            <option value="lost">Lost</option>
            <option value="no_response">No Response</option>
          </select>

          <select
            value={sourceFilter}
            onChange={e => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Sources</option>
            <option value="website">Website Inbound</option>
            <option value="inbound_call">Phone Inbound</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="event">Conference</option>
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

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle">
        <Table
          columns={columns}
          data={paginatedLeads}
          keyExtractor={lead => lead.id}
          isLoading={isLoading}
          tableClassName="w-full"
          emptyMessage="No enquiries match your selected filters."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredLeads.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Create / Edit Enquiry Modal */}
      <LeadModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingLead}
        onSubmit={handleLeadSubmit}
      />

      {/* Direct Quotation Modal */}
      {quoteModalOpen && (
        <QuotationModalForm
          isOpen={quoteModalOpen}
          onClose={() => setQuoteModalOpen(false)}
          onSubmit={handleQuoteSubmit}
          initialData={editingQuote}
          initialLeadId={selectedLeadForQuote?.id}
          initialLead={selectedLeadForQuote}
          initialStatus={quoteInitialStatus}
        />
      )}
    </div>
  );
};
