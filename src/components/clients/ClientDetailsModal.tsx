import React, { useState } from 'react';
import { Contact } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useCrm } from '../../context/CrmContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { NewReminderModal } from './NewReminderModal';
import { LogActivityModal } from './LogActivityModal';
import { EditContactModal } from './EditContactModal';
import {
  Mail,
  Phone,
  Building2,
  Clock,
  Briefcase,
  Bell,
  PlusCircle,
  FileText,
  PhoneCall,
  Users,
  CheckCircle2,
  Edit2,
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
  const { deals, tasks, activities } = useCrm();

  const [activeClient, setActiveClient] = useState<Contact | null>(client);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showLogActivityModal, setShowLogActivityModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);

  // Sync activeClient when client prop changes
  React.useEffect(() => {
    setActiveClient(client);
  }, [client]);

  if (!isOpen || !activeClient) return null;

  // Filter client-specific open deals
  const clientDeals = deals.filter(
    d =>
      d.contactId === activeClient.id ||
      d.companyName.toLowerCase() === activeClient.companyName.toLowerCase()
  );
  const openDeals = clientDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  const totalOpenValue = openDeals.reduce((sum, d) => sum + d.value, 0);

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
    <>
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
                  <Badge variant={activeClient.status === 'Inactive' ? 'rose' : 'green'} size="sm">
                    {activeClient.status || 'Active Client'}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{activeClient.companyName}</span>
                  {activeClient.title && <span>• {activeClient.title}</span>}
                </div>
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
              {activeClient.phone && (
                <a
                  href={`tel:${activeClient.phone}`}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-brand-600 transition-colors bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs font-medium"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeClient.phone}</span>
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

          {/* Action Toolbar */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-700">Quick Client Actions:</span>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowReminderModal(true)}
                icon={<Bell className="w-3.5 h-3.5 text-amber-600" />}
                className="bg-white hover:bg-amber-50 hover:text-amber-700 border-slate-200"
              >
                New Reminder
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowLogActivityModal(true)}
                icon={<PlusCircle className="w-3.5 h-3.5 text-blue-600" />}
                className="bg-white hover:bg-blue-50 hover:text-blue-700 border-slate-200"
              >
                Log Activity
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowEditContactModal(true)}
                icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                className="bg-white hover:bg-slate-100 border-slate-200"
              >
                Edit Contact
              </Button>
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
                  No interaction history logged yet. Click "Log Activity" above to add the first record.
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

      {/* 3 Sub-Modals */}
      <NewReminderModal
        isOpen={showReminderModal}
        onClose={() => setShowReminderModal(false)}
        client={activeClient}
      />

      <LogActivityModal
        isOpen={showLogActivityModal}
        onClose={() => setShowLogActivityModal(false)}
        client={activeClient}
      />

      <EditContactModal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
        contact={activeClient}
        onSaved={updated => setActiveClient(updated)}
      />
    </>
  );
};
