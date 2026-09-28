import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Deal, DealStage } from '../../types/crm';
import { DealModalForm } from '../../components/forms/DealModalForm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  Award,
  Edit2,
  Trash2,
  Building2,
  User,
  Calendar,
  Filter,
} from 'lucide-react';

export const DealsPipelinePage: React.FC = () => {
  const { deals, createDeal, updateDeal, deleteDeal, isLoading } = useCrm();
  const { user } = useAuth();

  // Search, Filter, Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('value_desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Filter & Sort Logic
  const filteredDeals = useMemo(() => {
    return deals
      .filter(deal => {
        const matchesSearch =
          deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          deal.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (deal.assignedTo && deal.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;

        let matchesStatus = true;
        if (statusFilter === 'active') {
          matchesStatus = deal.stage !== 'closed_won' && deal.stage !== 'closed_lost';
        } else if (statusFilter === 'won') {
          matchesStatus = deal.stage === 'closed_won';
        } else if (statusFilter === 'lost') {
          matchesStatus = deal.stage === 'closed_lost';
        }

        return matchesSearch && matchesStage && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'value_desc') return b.value - a.value;
        if (sortBy === 'value_asc') return a.value - b.value;
        if (sortBy === 'date_asc') {
          return new Date(a.expectedCloseDate).getTime() - new Date(b.expectedCloseDate).getTime();
        }
        if (sortBy === 'date_desc') {
          return new Date(b.expectedCloseDate).getTime() - new Date(a.expectedCloseDate).getTime();
        }
        if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
        if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
        return 0;
      });
  }, [deals, searchTerm, stageFilter, statusFilter, sortBy]);

  // Paginated Slice
  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);
  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeals.slice(start, start + itemsPerPage);
  }, [filteredDeals, currentPage]);

  // Handler helpers that reset pagination
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };
  const handleStageFilterChange = (val: string) => {
    setStageFilter(val);
    setCurrentPage(1);
  };
  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };
  const handleSortChange = (val: string) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Pipeline Metrics
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const wonTotal = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete opportunity "${title}"?`)) {
      await deleteDeal(id);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'ZanCRM_Deals_List',
      filteredDeals,
      [
        { key: 'title', label: 'Deal Name' },
        { key: 'companyName', label: 'Company' },
        { key: 'value', label: 'Deal Value ($)' },
        { key: 'stage', label: 'Stage' },
        { key: 'assignedTo', label: 'Owner' },
        { key: 'expectedCloseDate', label: 'Expected Close Date' },
        { key: 'contactName', label: 'Contact' },
        { key: 'probability', label: 'Probability (%)' },
      ]
    );
  };

  const stageVariantMap: Record<DealStage, 'blue' | 'indigo' | 'amber' | 'purple' | 'green' | 'rose'> = {
    qualification: 'blue',
    needs_analysis: 'indigo',
    proposal_sent: 'amber',
    negotiation: 'purple',
    closed_won: 'green',
    closed_lost: 'rose',
  };

  const stageLabels: Record<DealStage, string> = {
    qualification: 'New',
    needs_analysis: 'Qualified',
    proposal_sent: 'Proposal',
    negotiation: 'Discussion',
    closed_won: 'Won',
    closed_lost: 'Lost',
  };

  const getOwnerName = (deal: Deal) => {
    if (!deal.assignedTo || deal.assignedTo === 'usr_current' || deal.assignedTo === user?.id) {
      return user?.name || 'Unassigned';
    }
    return deal.assignedTo;
  };

  const getDealStatus = (deal: Deal): { label: string; variant: 'green' | 'rose' | 'indigo' } => {
    if (deal.stage === 'closed_won') {
      return { label: 'Won', variant: 'green' };
    }
    if (deal.stage === 'closed_lost') {
      return { label: 'Lost', variant: 'rose' };
    }
    return { label: 'Active', variant: 'indigo' };
  };

  // Table Columns: Deal Name, Company, Deal Value, Stage, Owner, Expected Close Date, Status
  const columns: Column<Deal>[] = [
    {
      key: 'title',
      header: 'Deal Name',
      render: deal => (
        <div className="max-w-xs">
          <span className="font-bold text-slate-900 text-xs sm:text-sm hover:text-brand-600 cursor-pointer block truncate" onClick={() => handleEditDeal(deal)}>
            {deal.title}
          </span>
          {deal.contactName && (
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Contact: {deal.contactName}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'companyName',
      header: 'Company',
      render: deal => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{deal.companyName || '—'}</span>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Deal Value',
      render: deal => (
        <div>
          <div className="font-mono font-bold text-slate-900 text-xs sm:text-sm">
            {formatCurrency(deal.value)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {deal.probability}% win prob
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: deal => (
        <Badge variant={stageVariantMap[deal.stage]} size="sm">
          {stageLabels[deal.stage] || deal.stage}
        </Badge>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: deal => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
            <User className="w-3 h-3 text-slate-500" />
          </div>
          <span className="font-medium truncate">{getOwnerName(deal)}</span>
        </div>
      ),
    },
    {
      key: 'expectedCloseDate',
      header: 'Expected Close Date',
      render: deal => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatDate(deal.expectedCloseDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: deal => {
        const status = getDealStatus(deal);
        return (
          <Badge variant={status.variant} size="sm">
            {status.label}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: deal => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => handleEditDeal(deal)}
            title="Edit Deal"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(deal.id, deal.title)}
            title="Delete Deal"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sales Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {filteredDeals.length} {filteredDeals.length === 1 ? 'Deal' : 'Deals'}
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
            onClick={() => {
              setEditingDeal(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            New Opportunity
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pipeline Value</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Expected Revenue</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(weightedValue)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Revenue</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(wonTotal)}</div>
          </div>
        </div>
      </div>

      {/* Search, Filters and Sorting Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search deals, company, contact or owner..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Filter:</span>
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={e => handleStageFilterChange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Stages</option>
            <option value="qualification">1. New</option>
            <option value="needs_analysis">2. Qualified</option>
            <option value="proposal_sent">3. Proposal</option>
            <option value="negotiation">4. Discussion</option>
            <option value="closed_won">5. Won</option>
            <option value="closed_lost">6. Lost</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => handleStatusFilterChange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Open)</option>
            <option value="won">Won Deals</option>
            <option value="lost">Lost Deals</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => handleSortChange(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="value_desc">Value: High to Low</option>
            <option value="value_asc">Value: Low to High</option>
            <option value="date_asc">Close Date: Earliest First</option>
            <option value="date_desc">Close Date: Latest First</option>
            <option value="name_asc">Deal Name: A to Z</option>
            <option value="name_desc">Deal Name: Z to A</option>
          </select>
        </div>
      </div>

      {/* Responsive Deals Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <Table
          columns={columns}
          data={paginatedDeals}
          keyExtractor={d => d.id}
          isLoading={isLoading}
          emptyMessage="No deals found matching your search or filters."
        />

        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredDeals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={page => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Deal Modal Form */}
      <DealModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingDeal}
        onSubmit={async data => {
          if (editingDeal) {
            await updateDeal(editingDeal.id, data);
          } else {
            await createDeal(data);
          }
        }}
      />
    </div>
  );
};
