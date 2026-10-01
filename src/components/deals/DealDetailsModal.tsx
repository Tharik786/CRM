import React, { useState } from 'react';
import { Deal, DealStage } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge, BadgeVariant } from '../common/Badge';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import {
  DollarSign,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
  PhoneCall,
  Users,
  CheckSquare,
  Square,
  Percent,
} from 'lucide-react';

interface DealDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deal: Deal | null;
}

const STAGES: { stage: DealStage; label: string; badgeVariant: BadgeVariant }[] = [
  { stage: 'new', label: '1. New', badgeVariant: 'indigo' },
  { stage: 'proposal', label: '2. Proposal', badgeVariant: 'amber' },
  { stage: 'negotiation', label: '3. Negotiation', badgeVariant: 'purple' },
  { stage: 'won', label: '4. Won', badgeVariant: 'green' },
  { stage: 'lost', label: '5. Lost', badgeVariant: 'rose' },
  { stage: 'cold', label: '6. Cold', badgeVariant: 'slate' },
];

export const DealDetailsModal: React.FC<DealDetailsModalProps> = ({
  isOpen,
  onClose,
  deal,
}) => {
  const {
    contacts,
    companies,
    quotations,
    tasks,
    activities,
    updateDealStage,
    toggleTask,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'overview' | 'quotations' | 'activities' | 'tasks'>('overview');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

  if (!isOpen || !deal) return null;
  const activeDeal = deal;

  // Find linked contact & company
  const linkedContact = contacts.find(
    c =>
      (activeDeal.contactId && c.id === activeDeal.contactId) ||
      (activeDeal.contactName && c.name.toLowerCase() === activeDeal.contactName.toLowerCase())
  );

  const linkedCompany = companies.find(
    comp =>
      (activeDeal.companyId && comp.id === activeDeal.companyId) ||
      (activeDeal.companyName && comp.name.toLowerCase() === activeDeal.companyName.toLowerCase())
  );

  // Associated quotations
  const dealQuotations = quotations.filter(
    q =>
      q.dealId === activeDeal.id ||
      (activeDeal.title && q.dealTitle && q.dealTitle.toLowerCase() === activeDeal.title.toLowerCase())
  );

  // Associated activities
  const dealActivities = activities.filter(
    a =>
      (a.relatedToType === 'deal' && a.relatedToId === activeDeal.id) ||
      (a.relatedToName && a.relatedToName.toLowerCase().includes(activeDeal.title.toLowerCase())) ||
      (activeDeal.contactName &&
        a.relatedToName &&
        a.relatedToName.toLowerCase().includes(activeDeal.contactName.toLowerCase()))
  );

  // Associated tasks
  const dealTasks = tasks.filter(
    t =>
      (t.relatedToType === 'deal' && t.relatedToId === activeDeal.id) ||
      (t.relatedToName && t.relatedToName.toLowerCase().includes(activeDeal.title.toLowerCase())) ||
      (activeDeal.contactName &&
        t.relatedToName &&
        t.relatedToName.toLowerCase().includes(activeDeal.contactName.toLowerCase()))
  );

  const handleStageChange = async (newStage: DealStage) => {
    if (newStage === activeDeal.stage || isUpdatingStage) return;
    setIsUpdatingStage(true);
    try {
      await updateDealStage(activeDeal.id, newStage);
    } catch (err) {
      console.error('Failed to update stage:', err);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const currentStageConfig = STAGES.find(s => s.stage === activeDeal.stage) || STAGES[0];

  const getPriorityVariant = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'high':
        return 'rose';
      case 'medium':
        return 'amber';
      default:
        return 'slate';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-3.5 h-3.5 text-blue-500" />;
      case 'email':
        return <Mail className="w-3.5 h-3.5 text-amber-500" />;
      case 'meeting':
        return <Users className="w-3.5 h-3.5 text-purple-500" />;
      case 'note':
        return <FileText className="w-3.5 h-3.5 text-slate-500" />;
      default:
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deal Details"
      subtitle="Complete pipeline information, financials, linked customer, and activity history"
      maxWidth="3xl"
    >
      <div className="space-y-5 text-left">
        {/* Header Hero Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-brand-50/20 to-slate-50 border border-slate-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={currentStageConfig.badgeVariant} size="sm" dot>
                  {currentStageConfig.label}
                </Badge>
                <Badge variant={getPriorityVariant(activeDeal.priority)} size="sm">
                  {activeDeal.priority} priority
                </Badge>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug break-words">
                {activeDeal.title}
              </h2>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeDeal.companyName || 'No Company'}</span>
                </div>
                {activeDeal.contactName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{activeDeal.contactName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Pipeline Stage Stepper */}
          <div className="mt-4 pt-3.5 border-t border-slate-200/80">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-2">
              <span>Pipeline Stage Progression</span>
              <span className="text-slate-400 font-normal">Click stage to change</span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {STAGES.map(s => {
                const isActive = activeDeal.stage === s.stage;
                return (
                  <button
                    key={s.stage}
                    type="button"
                    disabled={isUpdatingStage}
                    onClick={() => handleStageChange(s.stage)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all text-center border truncate ${
                      isActive
                        ? 'bg-brand-600 text-white border-brand-600 shadow-xs ring-2 ring-brand-200'
                        : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200 hover:border-slate-300'
                    } ${isUpdatingStage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {s.label.replace(/^\d+\.\s*/, '')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4 Core Financial & Pipeline Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Deal Value */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Deal Value</span>
            </div>
            <div className="mt-1.5 text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(activeDeal.value, activeDeal.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
              Currency: {activeDeal.currency || 'USD'}
            </div>
          </div>

          {/* Win Probability */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-brand-600" />
                <span>Probability</span>
              </div>
              <span className="font-bold text-slate-800">{activeDeal.probability}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  activeDeal.probability >= 80
                    ? 'bg-emerald-500'
                    : activeDeal.probability >= 40
                    ? 'bg-brand-500'
                    : activeDeal.probability > 0
                    ? 'bg-amber-500'
                    : 'bg-rose-400'
                }`}
                style={{ width: `${Math.max(activeDeal.probability, 4)}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5 font-medium">
              Weighted: {formatCurrency((activeDeal.value * (activeDeal.probability || 0)) / 100)}
            </div>
          </div>

          {/* Expected Close Date */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span>Target Close</span>
            </div>
            <div className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 truncate">
              {formatDate(activeDeal.expectedCloseDate)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Created: {formatDate(activeDeal.createdAt)}
            </div>
          </div>

          {/* Deal Owner */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Deal Owner</span>
            </div>
            <div className="mt-1.5 text-sm sm:text-base font-bold text-slate-900 truncate">
              {activeDeal.assignedTo || 'Unassigned'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate">
              Updated: {formatRelativeTime(activeDeal.updatedAt)}
            </div>
          </div>
        </div>

        {/* Lost Reason Alert Box (if Lost) */}
        {activeDeal.stage === 'lost' && (
          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-rose-900">Deal Closed Lost</span>
              <p className="text-rose-700 mt-0.5">
                {activeDeal.lostReason
                  ? activeDeal.lostReason
                  : 'No specific loss reason recorded.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('quotations')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'quotations'
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Quotations
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {dealQuotations.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activities')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'activities'
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Activities & History
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {dealActivities.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'tasks'
                  ? 'border-brand-600 text-brand-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Tasks & Reminders
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600">
                {dealTasks.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Linked Company & Contact Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Company Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-brand-500" />
                    <span>Company Info</span>
                  </div>
                  {linkedCompany?.industry && (
                    <span className="text-[11px] font-normal text-slate-400">
                      {linkedCompany.industry}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 text-sm">
                  {activeDeal.companyName || 'Not linked to a company'}
                </div>
                {linkedCompany ? (
                  <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                    {(linkedCompany.city || linkedCompany.country) && (
                      <div>
                        Location:{' '}
                        {[linkedCompany.city, linkedCompany.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {linkedCompany.domain && (
                      <div className="text-brand-600 truncate">
                        <a
                          href={
                            linkedCompany.domain.startsWith('http')
                              ? linkedCompany.domain
                              : `https://${linkedCompany.domain}`
                          }
                          target="_blank"
                          rel="noreferrer"
                        >
                          {linkedCompany.domain}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 mt-1">
                    Custom entity name in pipeline.
                  </div>
                )}
              </div>

              {/* Primary Contact Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-500" />
                    <span>Primary Contact</span>
                  </div>
                  {linkedContact?.title && (
                    <span className="text-[11px] font-normal text-slate-400 truncate max-w-[140px]">
                      {linkedContact.title}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 text-sm">
                  {activeDeal.contactName || 'No contact assigned'}
                </div>
                <div className="flex flex-wrap gap-2 text-xs mt-2">
                  {linkedContact?.email && (
                    <a
                      href={`mailto:${linkedContact.email}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 transition-colors"
                    >
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span className="truncate max-w-[160px]">{linkedContact.email}</span>
                    </a>
                  )}
                  {linkedContact?.phone && (
                    <a
                      href={`tel:${linkedContact.phone}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600 border border-slate-200 transition-colors"
                    >
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{linkedContact.phone}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Quotations */}
        {activeTab === 'quotations' && (
          <div className="space-y-2.5">
            {dealQuotations.length > 0 ? (
              dealQuotations.map(quote => {
                const totalValue =
                  quote.total ||
                  ((quote.totalOneTime || 0) + (quote.totalMonthly || 0));

                return (
                  <div
                    key={quote.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{quote.quoteNumber}</span>
                          <Badge
                            variant={
                              quote.status === 'accepted'
                                ? 'green'
                                : quote.status === 'sent'
                                ? 'blue'
                                : quote.status === 'declined'
                                ? 'rose'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {quote.status}
                          </Badge>
                        </div>
                        <div className="text-slate-600 font-medium truncate mt-0.5">
                          {quote.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Created: {formatDate(quote.createdAt)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900 font-mono">
                        {formatCurrency(totalValue)}
                      </div>
                      {quote.totalMonthly && quote.totalMonthly > 0 ? (
                        <div className="text-[10px] text-slate-500">
                          +{formatCurrency(quote.totalMonthly)}/mo
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No quotations have been generated for this deal yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Activities & History */}
        {activeTab === 'activities' && (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {dealActivities.length > 0 ? (
              dealActivities.map(act => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl border border-slate-200/90 bg-white flex items-start gap-3 text-xs"
                >
                  <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">{act.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDate(act.timestamp)}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">{act.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No activities or interactions recorded for this deal.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Tasks & Reminders */}
        {activeTab === 'tasks' && (
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {dealTasks.length > 0 ? (
              dealTasks.map(t => {
                const isCompleted = t.status === 'completed';
                return (
                  <div
                    key={t.id}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 text-xs ${
                      isCompleted
                        ? 'bg-slate-50/70 border-slate-200 opacity-70'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleTask(t.id)}
                        className="text-slate-400 hover:text-brand-600 transition-colors shrink-0"
                      >
                        {isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <div
                          className={`font-semibold ${
                            isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                          } truncate`}
                        >
                          {t.title}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-500 truncate">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.dueDate && (
                        <span className="text-[10px] text-slate-400">
                          Due: {formatDate(t.dueDate)}
                        </span>
                      )}
                      <Badge variant={getPriorityVariant(t.priority)} size="sm">
                        {t.priority}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No pending tasks or reminders for this deal.
              </div>
            )}
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
