import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Lead, LeadStatus, LeadSource } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { LeadModalForm } from '../../components/forms/LeadModalForm';
import { formatCurrency, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Download,
  Mail,
  Phone,
  Building2,
  CheckCircle,
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const { leads, createLead, updateLead, deleteLead, convertLead, isLoading } = useCrm();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'value' | 'date'>('date');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Filter & Sort Logic
  const filteredLeads = useMemo(() => {
    return leads
      .filter(lead => {
        const matchesSearch =
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter;
        return matchesSearch && matchesStatus && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.estimatedValue - a.estimatedValue;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [leads, searchTerm, statusFilter, sourceFilter, sortBy]);

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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete lead "${name}"?`)) {
      await deleteLead(id);
    }
  };

  const handleConvert = async (lead: Lead) => {
    if (window.confirm(`Convert ${lead.name} (${lead.company}) into a Client?`)) {
      await convertLead(lead.id);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'ZanCRM_Leads_Export',
      filteredLeads,
      [
        { key: 'name', label: 'Contact Name' },
        { key: 'company', label: 'Company' },
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

  const statusVariantMap: Record<LeadStatus, 'slate' | 'indigo' | 'green' | 'rose' | 'purple' | 'blue' | 'amber'> = {
    new: 'blue',
    qualified: 'indigo',
    proposal: 'amber',
    discussion: 'purple',
    won: 'green',
    lost: 'rose',
    contacted: 'slate',
    unqualified: 'rose',
    converted: 'green',
  };

  const statusLabelMap: Record<LeadStatus, string> = {
    new: 'New',
    qualified: 'Qualified',
    proposal: 'Proposal',
    discussion: 'Discussion',
    won: 'Won',
    lost: 'Lost',
    contacted: 'Contacted',
    unqualified: 'Unqualified',
    converted: 'Client',
  };

  const columns: Column<Lead>[] = [
    {
      key: 'name',
      header: 'Lead Name & Company',
      render: lead => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-100 to-indigo-100 text-brand-700 font-bold flex items-center justify-center shrink-0 border border-brand-200/60">
            {lead.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{lead.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>{lead.company}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: lead => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Mail className="w-3 h-3 text-slate-400" />
            <a href={`mailto:${lead.email}`} className="hover:text-brand-600 truncate max-w-[160px]">
              {lead.email}
            </a>
          </div>
          {lead.phone && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{lead.phone}</span>
            </div>
          )}
        </div>
      ),
    },

    {
      key: 'estimatedValue',
      header: 'Est. Value',
      render: lead => (
        <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
          {formatCurrency(lead.estimatedValue)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: lead => (
        <Badge variant={statusVariantMap[lead.status] || 'slate'} size="sm">
          {statusLabelMap[lead.status] || lead.status}
        </Badge>
      ),
    },
    {
      key: 'source',
      header: 'Source',
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
          <span className="text-xs text-slate-600 font-medium">
            {sourceLabelMap[lead.source] || lead.source}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: lead => (
        <div className="flex items-center justify-end gap-1.5">
          {lead.status !== 'converted' ? (
            <Button
              variant="outline"
              size="xs"
              onClick={e => {
                e.stopPropagation();
                handleConvert(lead);
              }}
              title="Convert to Client"
              className="text-brand-600 border-brand-200 hover:bg-brand-50"
              icon={<ArrowRightLeft className="w-3 h-3" />}
            >
              Client
            </Button>
          ) : (
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 px-2 py-0.5 bg-emerald-50 rounded">
              <CheckCircle className="w-3 h-3" /> Client
            </span>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              handleOpenEdit(lead);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Enquiry"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={e => {
              e.stopPropagation();
              handleDelete(lead.id, lead.name);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Enquiry"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

        <div className="flex items-center gap-2.5">
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
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Filter enquiries by name, company, email..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="new">1. New</option>
            <option value="qualified">2. Qualified</option>
            <option value="proposal">3. Proposal</option>
            <option value="discussion">4. Discussion</option>
            <option value="won">5. Won</option>
            <option value="lost">6. Lost</option>
          </select>

          <select
            value={sourceFilter}
            onChange={e => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Sources</option>
            <option value="website">Website Inbound</option>
            <option value="inbound_call">Phone Inbound</option>
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="event">Conference</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'value' | 'date')}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="date">Sort by Recent</option>
            <option value="value">Sort by Est. Value</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <Table
          columns={columns}
          data={paginatedLeads}
          keyExtractor={lead => lead.id}
          isLoading={isLoading}
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

      {/* Modal Form */}
      <LeadModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingLead}
        onSubmit={async data => {
          if (editingLead) {
            await updateLead(editingLead.id, data);
          } else {
            await createLead(data);
          }
        }}
      />
    </div>
  );
};
