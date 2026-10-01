import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Deal, DealStage } from '../../types/crm';
import { DealModalForm } from '../../components/forms/DealModalForm';
import { DealDetailsModal } from '../../components/deals/DealDetailsModal';
import { Button } from '../../components/common/Button';
import { formatCurrency, exportToCSV } from '../../utils/formatters';
import {
  Search,
  Download,
  Edit2,
  Building2,
  User,
  Filter,
  XCircle,
} from 'lucide-react';

interface StageColumnConfig {
  stage: DealStage;
  label: string;
  badgeColor: string;
  dotColor: string;
  dropBorder: string;
}

const STAGE_CONFIGS: StageColumnConfig[] = [
  {
    stage: 'new',
    label: '1. New',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
    dropBorder: 'border-blue-400 bg-blue-50/40',
  },
  {
    stage: 'proposal',
    label: '2. Proposal',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500',
    dropBorder: 'border-amber-400 bg-amber-50/40',
  },
  {
    stage: 'negotiation',
    label: '3. Negotiation',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    dotColor: 'bg-purple-500',
    dropBorder: 'border-purple-400 bg-purple-50/40',
  },
  {
    stage: 'won',
    label: '4. Won',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500',
    dropBorder: 'border-emerald-400 bg-emerald-50/40',
  },
  {
    stage: 'lost',
    label: '5. Lost',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500',
    dropBorder: 'border-rose-400 bg-rose-50/40',
  },
  {
    stage: 'cold',
    label: '6. Cold',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
    dotColor: 'bg-slate-400',
    dropBorder: 'border-slate-400 bg-slate-100/50',
  },
];

const STAGE_ORDER: DealStage[] = STAGE_CONFIGS.map(c => c.stage);

export const DealsPipelinePage: React.FC = () => {
  const { deals, createDeal, updateDeal, updateDealStage } = useCrm();

  // Search, Filter, Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const sortBy = 'value_desc';

  // Drag and drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  // Modals (Create, Edit & Details)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [selectedDealForDetails, setSelectedDealForDetails] = useState<Deal | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

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

        return matchesSearch && matchesStage;
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
  }, [deals, searchTerm, stageFilter, sortBy]);

  // Active columns to display on Kanban
  const visibleColumns = useMemo(() => {
    if (stageFilter !== 'all') {
      return STAGE_CONFIGS.filter(c => c.stage === stageFilter);
    }
    return STAGE_CONFIGS;
  }, [stageFilter]);

  const getGridColsClass = (count: number) => {
    switch (count) {
      case 1:
        return 'grid-cols-1 max-w-xl';
      case 2:
        return 'grid-cols-1 sm:grid-cols-2';
      case 3:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
      case 4:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
      default:
        return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    }
  };

  // Handler helpers
  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };
  const handleStageFilterChange = (val: string) => {
    setStageFilter(val);
  };


  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setModalOpen(true);
  };

  const handleViewDeal = (deal: Deal) => {
    setSelectedDealForDetails(deal);
    setDetailsModalOpen(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stage) {
      setDragOverStage(stage);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only reset if leaving current drop target
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverStage(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    setDragOverStage(null);
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    if (dealId) {
      const deal = deals.find(d => d.id === dealId);
      if (deal && deal.stage !== targetStage) {
        await updateDealStage(dealId, targetStage);
      }
    }
    setDraggedDealId(null);
  };

  const handleExport = () => {
    exportToCSV(
      'ZanCRM_Deals_Pipeline',
      filteredDeals,
      [
        { key: 'title', label: 'Deal Name' },
        { key: 'companyName', label: 'Company' },
        { key: 'value', label: 'Deal Value ($)' },
        { key: 'stage', label: 'Stage' },
        { key: 'lostReason', label: 'Lost Reason' },
        { key: 'assignedTo', label: 'Owner' },
        { key: 'expectedCloseDate', label: 'Expected Close Date' },
        { key: 'contactName', label: 'Contact' },
        { key: 'probability', label: 'Probability (%)' },
      ]
    );
  };

  return (
    <div className="space-y-3 animate-fade-in pb-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sales Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              {filteredDeals.length} {filteredDeals.length === 1 ? 'Deal' : 'Deals'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and advance opportunities visually across deal stages with live stage metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search, Filters and Sorting Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2.5">
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
            <option value="new">1. New</option>
            <option value="proposal">2. Proposal</option>
            <option value="negotiation">3. Negotiation</option>
            <option value="won">4. Won</option>
            <option value="lost">5. Lost</option>
            <option value="cold">6. Cold</option>
          </select>

        </div>
      </div>

      {/* Kanban Board - 100% fitted to screen width with zero horizontal scroll */}
      <div className="w-full pb-6">
        <div className={`grid gap-2 sm:gap-2.5 w-full items-start ${getGridColsClass(visibleColumns.length)}`}>
          {visibleColumns.map(column => {
            const columnDeals = filteredDeals.filter(d => d.stage === column.stage);
            const columnTotal = columnDeals.reduce((sum, d) => sum + d.value, 0);
            const isOver = dragOverStage === column.stage;

            return (
              <div
                key={column.stage}
                onDragOver={e => handleDragOver(e, column.stage)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, column.stage)}
                className={`w-full min-w-0 flex flex-col rounded-xl bg-slate-50/90 border transition-all duration-200 ${
                  isOver
                    ? `${column.dropBorder} ring-2 ring-brand-500/30 scale-[1.01]`
                    : 'border-slate-200/80 shadow-subtle'
                }`}
              >
                {/* Column Header */}
                <div className="p-2 sm:p-2.5 border-b border-slate-200/80 bg-white/80 rounded-t-xl flex items-center justify-between gap-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${column.dotColor}`} />
                      <span className="font-bold text-xs text-slate-900 tracking-tight truncate">
                        {column.label}
                      </span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                        {columnDeals.length}
                      </span>
                    </div>
                    <div className="font-mono text-xs font-black text-slate-700 pl-3.5 truncate">
                      {formatCurrency(columnTotal)}
                    </div>
                  </div>
                </div>

                {/* Column Body / Dropzone */}
                <div className="p-1.5 sm:p-2 space-y-2 min-h-[300px]">
                  {columnDeals.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-slate-200/80 rounded-xl flex flex-col items-center justify-center p-3 text-center">
                      <p className="text-[11px] font-semibold text-slate-500">No deals in this stage</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Drag a card here</p>
                    </div>
                  ) : (
                    columnDeals.map(deal => {
                      const isDragging = draggedDealId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={e => handleDragStart(e, deal.id)}
                          onClick={() => handleViewDeal(deal)}
                          className={`group relative bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-subtle hover:shadow-md hover:border-brand-300 transition-all duration-150 cursor-pointer space-y-2 w-full min-w-0 ${
                            isDragging ? 'opacity-40 scale-95 border-brand-400' : ''
                          }`}
                        >
                          {/* Card Top: Deal Name & Quick Action icons */}
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-bold text-xs text-slate-900 group-hover:text-brand-600 leading-snug line-clamp-2 break-words flex-1 min-w-0">
                              {deal.title}
                            </h3>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0 bg-white/95 rounded">
                              {deal.stage !== 'lost' && deal.stage !== 'won' && (
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    updateDealStage(deal.id, 'lost');
                                  }}
                                  title="Mark as Lost"
                                  className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <XCircle className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEditDeal(deal);
                                }}
                                title="Edit"
                                className="p-0.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Company & Contact */}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate">
                              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{deal.companyName || 'No Company'}</span>
                            </div>
                            {deal.contactName && (
                              <div className="flex items-center gap-1.5 text-[10.5px] text-slate-400 truncate">
                                <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <span className="truncate">{deal.contactName}</span>
                              </div>
                            )}
                          </div>

                          {/* Deal Value & Win Probability Bar */}
                          <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-100 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono text-xs font-black text-slate-900 truncate">
                                {formatCurrency(deal.value, deal.currency || 'USD')}
                              </span>
                              <span className="font-mono text-[9.5px] font-bold text-slate-500 shrink-0">
                                {deal.probability}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  deal.stage === 'won'
                                    ? 'bg-emerald-500'
                                    : deal.stage === 'lost'
                                    ? 'bg-rose-500'
                                    : deal.probability >= 70
                                    ? 'bg-emerald-500'
                                    : deal.probability >= 40
                                    ? 'bg-brand-500'
                                    : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(8, deal.probability))}%` }}
                              />
                            </div>
                          </div>

                          {/* Previous & Next Stage Controls */}
                          {(() => {
                            const currentStageIndex = STAGE_ORDER.indexOf(deal.stage);
                            return (
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                                {currentStageIndex > 0 ? (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateDealStage(deal.id, STAGE_ORDER[currentStageIndex - 1]);
                                    }}
                                    className="px-2 py-0.5 rounded text-xs font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-100 border border-slate-200 bg-white shadow-2xs transition-colors"
                                  >
                                    &lt;
                                  </button>
                                ) : (
                                  <span />
                                )}

                                {currentStageIndex < STAGE_ORDER.length - 1 ? (
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.stopPropagation();
                                      updateDealStage(deal.id, STAGE_ORDER[currentStageIndex + 1]);
                                    }}
                                    className="px-2 py-0.5 rounded text-xs font-bold text-slate-600 hover:text-brand-600 hover:bg-slate-100 border border-slate-200 bg-white shadow-2xs transition-colors"
                                  >
                                    &gt;
                                  </button>
                                ) : (
                                  <span />
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Modal Form (Create & Edit) */}
      <DealModalForm
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingDeal(null);
        }}
        initialData={editingDeal}
        onSubmit={async data => {
          if (editingDeal && editingDeal.id) {
            await updateDeal(editingDeal.id, data);
          } else {
            await createDeal(data);
          }
          setModalOpen(false);
          setEditingDeal(null);
        }}
      />

      {/* Deal Details Modal */}
      <DealDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDealForDetails(null);
        }}
        deal={
          selectedDealForDetails
            ? deals.find(d => d.id === selectedDealForDetails.id) || selectedDealForDetails
            : null
        }
      />
    </div>
  );
};
