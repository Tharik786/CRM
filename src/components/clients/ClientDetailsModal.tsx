import React from 'react';
import { Contact } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Mail,
  Phone,
  Building2,
  Clock,
  Briefcase,
  Bell,
  FileText,
  PhoneCall,
  Users,
  CheckCircle2,
  MapPin,
} from 'lucide-react';

interface ClientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Contact | null;
}

export const ClientDetailsModal: React.FC<ClientDetailsModalProps> = ({
  isOpen,
  onClose,
  client,
}) => {
  const { deals, tasks, activities, companies } = useCrm();

  if (!isOpen || !client) return null;
  const activeClient = client;

  // Filter client-specific open deals
  const clientDeals = deals.filter(d => {
    // If the deal is explicitly linked to a contact, only show it for THAT contact
    if (d.contactId) {
      return d.contactId === activeClient.id;
    }
    // If no contactId, fall back to company name match (unassigned deals)
    return d.companyName.toLowerCase() === activeClient.companyName.toLowerCase();
  });
  const openDeals = clientDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  const totalOpenValue = openDeals.reduce((sum, d) => sum + d.value, 0);

  // Compute pipeline-driven status badge
  const getPipelineBadge = () => {
    if (clientDeals.length === 0)
      return { label: 'No Deals', variant: 'default' as const, cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    const hasWon = clientDeals.some(d => d.stage === 'won');
    const hasNegotiation = clientDeals.some(d => d.stage === 'negotiation');
    const hasProposal = clientDeals.some(d => d.stage === 'proposal');
    const hasNew = clientDeals.some(d => d.stage === 'new');
    const allLost = clientDeals.every(d => d.stage === 'lost');
    const hasCold = clientDeals.some(d => d.stage === 'cold');
    if (hasWon) return { label: 'Won Client', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (hasNegotiation) return { label: 'Negotiating', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (hasProposal) return { label: 'Proposal Sent', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    if (hasNew) return { label: 'Active Lead', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    if (hasCold) return { label: 'Cold', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (allLost) return { label: 'Lost', cls: 'bg-rose-50 text-rose-600 border-rose-200' };
    return { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };
  const pipelineBadge = getPipelineBadge();

  // Find linked company & location
  const linkedCompany = companies.find(
    c => c.id === activeClient.companyId || c.name.toLowerCase() === activeClient.companyName.toLowerCase()
  );
  const locationText =
    [activeClient.location, activeClient.country].filter(Boolean).join(', ') ||
    (linkedCompany ? [linkedCompany.city, linkedCompany.country].filter(Boolean).join(', ') : '');
  const phoneText = activeClient.phone || linkedCompany?.phone;

  // Filter client-specific tasks/reminders
  const clientTasks = tasks.filter(
    t =>
      (t.relatedToType === 'contact' && t.relatedToId === activeClient.id) ||
      (t.relatedToName && t.relatedToName.toLowerCase().includes(activeClient.name.toLowerCase()))
  );
  const openReminders = clientTasks.filter(t => t.status !== 'completed');

  // Filter client-specific activities (Recent History)
  const clientActivities = activities.filter(
    a =>
      (a.relatedToType === 'contact' && a.relatedToId === activeClient.id) ||
      (a.relatedToName && a.relatedToName.toLowerCase().includes(activeClient.name.toLowerCase())) ||
      (a.description && a.description.toLowerCase().includes(activeClient.name.toLowerCase()))
  );

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
        title="Client Details"
        subtitle="Comprehensive customer profile, associated deals, reminders, and history"
        maxWidth="2xl"
      >
        <div className="space-y-6">
          {/* Header Profile Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-50 to-brand-50/30 border border-slate-200/80">
            <div className="flex items-center gap-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {activeClient.name}
                  </h2>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${pipelineBadge.cls}`}
                  >
                    {pipelineBadge.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{activeClient.companyName}</span>
                </div>
                {locationText && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{locationText}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Contact Links */}
            <div className="flex flex-wrap sm:flex-col gap-2 text-xs">
              <a
                href={`mailto:${activeClient.email}`}
                className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600 transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[180px]">{activeClient.email}</span>
              </a>
              {phoneText && (
                <a
                  href={`tel:${phoneText}`}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600 transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{phoneText}</span>
                </a>
              )}
            </div>
          </div>

          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Briefcase className="w-4 h-4 text-brand-500" />
                Open Deals
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                {openDeals.length} Deal{openDeals.length === 1 ? '' : 's'}
              </div>
              <div className="text-[11px] font-mono font-semibold text-brand-600 mt-0.5">
                {formatCurrency(totalOpenValue)} total
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Bell className="w-4 h-4 text-amber-500" />
                Open Reminders
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                {openReminders.length} Scheduled
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {openReminders.length > 0 ? 'Follow-up pending' : 'All clear'}
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                <Clock className="w-4 h-4 text-purple-500" />
                Total Activities
              </div>
              <div className="mt-1 text-base sm:text-lg font-bold text-slate-900">
                {clientActivities.length} Events
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Last: {formatDate(activeClient.lastActivityAt)}
              </div>
            </div>
          </div>


          {/* Associated Deals (Sales Pipeline) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                <span>Sales Pipeline Opportunities</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {clientDeals.length} {clientDeals.length === 1 ? 'deal' : 'deals'}
              </span>
            </h3>

            <div className="space-y-2">
              {clientDeals.length > 0 ? (
                clientDeals.map(d => {
                  const stageStyles: Record<string, string> = {
                    won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    lost: 'bg-rose-50 text-rose-700 border-rose-200',
                    negotiation: 'bg-amber-50 text-amber-700 border-amber-200',
                    proposal: 'bg-blue-50 text-blue-700 border-blue-200',
                    new: 'bg-slate-100 text-slate-700 border-slate-200',
                    cold: 'bg-slate-100 text-slate-500 border-slate-200',
                  };
                  return (
                    <div
                      key={d.id}
                      className="p-3 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate leading-tight">{d.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Close date: {formatDate(d.expectedCloseDate)} · Win probability: {d.probability}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-extrabold text-xs text-slate-900 font-mono">
                          {formatCurrency(d.value)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            stageStyles[d.stage] || 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {d.stage}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No deals in sales pipeline yet for this client.
                </div>
              )}
            </div>
          </div>

          {/* Recent History / Activity Section */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Recent History / Activity</span>
              <span className="text-[11px] font-normal lowercase text-slate-400">
                {clientActivities.length} records
              </span>
            </h3>

            <div className="max-h-56 overflow-y-auto pr-1 space-y-2.5 no-scrollbar">
              {clientActivities.length > 0 ? (
                clientActivities.map(act => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-colors flex items-start gap-3 text-xs"
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
                      <p className="text-slate-600 text-[11px] mt-0.5 line-clamp-2">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No interaction history logged yet.
                </div>
              )}
            </div>
          </div>

          {/* Close Action */}
          <div className="flex items-center justify-end pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
  );
};
