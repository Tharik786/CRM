import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Deal, DealStage } from '../../types/crm';
import { DealKanbanBoard } from '../../components/kanban/DealKanbanBoard';
import { DealModalForm } from '../../components/forms/DealModalForm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column } from '../../components/common/Table';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  KanbanSquare,
  List,
  Plus,
  Search,
  Download,
  DollarSign,
  TrendingUp,
  Award,
  Edit2,
  Trash2,
} from 'lucide-react';

export const DealsPipelinePage: React.FC = () => {
  const { deals, createDeal, updateDeal, updateDealStage, deleteDeal, isLoading } = useCrm();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Filtering
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchesSearch =
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.contactName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter === 'all' || deal.stage === stageFilter;
      return matchesSearch && matchesStage;
    });
  }, [deals, searchTerm, stageFilter]);

  // Metrics
  const totalValue = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedValue = deals.reduce((sum, d) => sum + (d.value * (d.probability / 100)), 0);
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const wonTotal = wonDeals.reduce((sum, d) => sum + d.value, 0);

  const handleDropDeal = async (dealId: string, targetStage: DealStage) => {
    await updateDealStage(dealId, targetStage);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  };

  const handleNewDealAtStage = (_stage: DealStage) => {
    setEditingDeal(null);
    setModalOpen(true);
  };

  const handleMoveStage = async (dealId: string, nextStage: DealStage) => {
    await updateDealStage(dealId, nextStage);
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete opportunity "${title}"?`)) {
      await deleteDeal(id);
    }
  };

  const handleExport = () => {
    exportToCSV(
      'ZanCRM_Deals_Pipeline',
      filteredDeals,
      [
        { key: 'title', label: 'Opportunity Title' },
        { key: 'companyName', label: 'Company' },
        { key: 'contactName', label: 'Contact' },
        { key: 'stage', label: 'Stage' },
        { key: 'value', label: 'Value ($)' },
        { key: 'probability', label: 'Probability (%)' },
        { key: 'expectedCloseDate', label: 'Expected Close' },
        { key: 'priority', label: 'Priority' },
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

  const listColumns: Column<Deal>[] = [
    {
      key: 'title',
      header: 'Deal Title & Company',
      render: deal => (
        <div>
          <span className="font-bold text-slate-900 text-xs sm:text-sm">{deal.title}</span>
          <div className="text-xs text-slate-500 mt-0.5">{deal.companyName} • {deal.contactName}</div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: deal => (
        <Badge variant={stageVariantMap[deal.stage]} size="sm">
          {deal.stage.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'value',
      header: 'Value',
      render: deal => (
        <span className="font-mono font-bold text-slate-900 text-sm">
          {formatCurrency(deal.value)}
        </span>
      ),
    },
    {
      key: 'probability',
      header: 'Win Prob.',
      render: deal => (
        <span className="font-mono font-semibold text-xs text-slate-600">
          {deal.probability}%
        </span>
      ),
    },
    {
      key: 'expectedCloseDate',
      header: 'Expected Close',
      render: deal => (
        <span className="text-xs text-slate-600">
          {formatDate(deal.expectedCloseDate)}
        </span>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: deal => (
        <span className={`text-xs font-semibold uppercase ${deal.priority === 'high' ? 'text-rose-600' : 'text-slate-600'}`}>
          {deal.priority}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: deal => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleEditDeal(deal)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(deal.id, deal.title)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
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
              Deals & Sales Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {deals.length} Opportunities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Drag deals across stages to advance negotiations, update win probabilities, and forecast revenue
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Table</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export
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
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Unweighted Value</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(totalValue)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Weighted Forecast ARR</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(weightedValue)}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Closed Won Revenue</div>
            <div className="text-xl font-extrabold text-slate-900 font-mono">{formatCurrency(wonTotal)}</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search deals, company or contact..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="qualification">1. Qualification</option>
            <option value="needs_analysis">2. Needs Analysis</option>
            <option value="proposal_sent">3. Proposal Sent</option>
            <option value="negotiation">4. Negotiation</option>
            <option value="closed_won">5. Closed Won</option>
            <option value="closed_lost">6. Closed Lost</option>
          </select>
        </div>
      </div>

      {/* View: Kanban vs List */}
      {viewMode === 'kanban' ? (
        <DealKanbanBoard
          deals={filteredDeals}
          onDropDeal={handleDropDeal}
          onEditDeal={handleEditDeal}
          onNewDealAtStage={handleNewDealAtStage}
          onMoveStage={handleMoveStage}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <Table
            columns={listColumns}
            data={filteredDeals}
            keyExtractor={d => d.id}
            isLoading={isLoading}
            emptyMessage="No deals found."
          />
        </div>
      )}

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
