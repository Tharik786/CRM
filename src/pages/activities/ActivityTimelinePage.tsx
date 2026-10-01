import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { ActivityType } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input, Select } from '../../components/common/Input';
import { formatDateTime, formatRelativeTime } from '../../utils/formatters';
import {
  Plus,
  PhoneCall,
  Users2,
  Mail,
  FileText,
  TrendingUp,
  DollarSign,
  Search,
} from 'lucide-react';

export const ActivityTimelinePage: React.FC = () => {
  const { activities, addActivity } = useCrm();

  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [newType, setNewType] = useState<ActivityType>('call');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRelatedToName, setNewRelatedToName] = useState('');
  const [newDuration, setNewDuration] = useState(25);
  const [newOutcome, setNewOutcome] = useState('Completed successfully');

  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      const matchesSearch =
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.relatedToName && a.relatedToName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || a.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [activities, searchTerm, typeFilter]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addActivity({
      type: newType,
      title: newTitle,
      description: newDescription,
      relatedToName: newRelatedToName,
      durationMinutes: Number(newDuration),
      outcome: newOutcome,
    });

    setModalOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewRelatedToName('');
  };

  const iconDetails: Record<ActivityType, { icon: React.ReactNode; bg: string; color: string; label: string }> = {
    call: {
      icon: <PhoneCall className="w-4 h-4" />,
      bg: 'bg-blue-50 border-blue-200',
      color: 'text-blue-600',
      label: 'Phone Call',
    },
    meeting: {
      icon: <Users2 className="w-4 h-4" />,
      bg: 'bg-indigo-50 border-indigo-200',
      color: 'text-indigo-600',
      label: 'Meeting / Sync',
    },
    email: {
      icon: <Mail className="w-4 h-4" />,
      bg: 'bg-amber-50 border-amber-200',
      color: 'text-amber-600',
      label: 'Email Outreach',
    },
    note: {
      icon: <FileText className="w-4 h-4" />,
      bg: 'bg-slate-100 border-slate-200',
      color: 'text-slate-600',
      label: 'Internal Note',
    },
    deal_stage_changed: {
      icon: <TrendingUp className="w-4 h-4" />,
      bg: 'bg-emerald-50 border-emerald-200',
      color: 'text-emerald-600',
      label: 'Deal Progression',
    },
    quotation_created: {
      icon: <DollarSign className="w-4 h-4" />,
      bg: 'bg-purple-50 border-purple-200',
      color: 'text-purple-600',
      label: 'Commercial Proposal',
    },
    other: {
      icon: <FileText className="w-4 h-4" />,
      bg: 'bg-slate-50 border-slate-200',
      color: 'text-slate-600',
      label: 'General Interaction',
    },
  };

  return (
    <div className="space-y-3 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Activity Timeline
          </h1>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Log Activity
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search notes, client discussions, outcomes..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
        >
          <option value="all">All Interaction Types</option>
          <option value="call">Phone Calls</option>
          <option value="meeting">Meetings</option>
          <option value="email">Emails</option>
          <option value="deal_stage_changed">Deal Stage Changes</option>
          <option value="quotation_created">Quotations</option>
          <option value="note">Internal Notes</option>
        </select>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 ml-4 space-y-6">
        {filteredActivities.map(act => {
          const detail = iconDetails[act.type] || iconDetails.note;

          return (
            <div key={act.id} className="relative group">
              {/* Timeline Pin Icon */}
              <div
                className={`absolute -left-[35px] sm:-left-[43px] top-1.5 h-8 w-8 rounded-full border-2 bg-white flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${detail.bg} ${detail.color}`}
              >
                {detail.icon}
              </div>

              {/* Activity Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {detail.label}
                    </span>
                    <span className="text-slate-300">•</span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{act.title}</h3>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatRelativeTime(act.timestamp)} ({formatDateTime(act.timestamp)})
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{act.description}</p>

                {/* Footer Metadata */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-slate-700">By: {act.performedBy}</span>
                    {act.relatedToName && (
                      <span className="text-brand-600 font-medium">
                        Linked: {act.relatedToName}
                      </span>
                    )}
                  </div>

                  {act.outcome && (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-100">
                      Outcome: {act.outcome}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredActivities.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-400">
            No activity matches the current filter.
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Log Customer Activity"
        subtitle="Record touchpoints, outcomes, and stakeholder feedback"
        maxWidth="md"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <Select
            label="Activity Type"
            value={newType}
            onChange={e => setNewType(e.target.value as ActivityType)}
            options={[
              { value: 'call', label: 'Phone Call' },
              { value: 'meeting', label: 'Meeting / Sync' },
              { value: 'email', label: 'Email Outreach' },
              { value: 'note', label: 'Internal Account Note' },
            ]}
          />

          <Input
            label="Activity Summary / Title"
            placeholder="e.g. Technical Discovery Call with Architecture Lead"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />

          <Input
            label="Related Account / Opportunity"
            placeholder="e.g. Vertex AI Systems / Deal #01"
            value={newRelatedToName}
            onChange={e => setNewRelatedToName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Minutes)"
              type="number"
              min="5"
              step="5"
              value={newDuration}
              onChange={e => setNewDuration(Number(e.target.value))}
            />
            <Input
              label="Outcome / Verdict"
              placeholder="e.g. Positive - Moving to Demo"
              value={newOutcome}
              onChange={e => setNewOutcome(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Notes & Key Takeaways
            </label>
            <textarea
              rows={3}
              required
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Document discussed points, questions asked, next agreed steps..."
              className="w-full rounded-lg border border-slate-300 text-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Log Activity
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
