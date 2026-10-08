import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Task, TaskPriority, TaskType } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { TaskModalForm } from '../../components/forms/TaskModalForm';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  CheckSquare,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Phone,
  Mail,
  Users2,
  Calendar,
  AlertCircle,
  Edit2,
} from 'lucide-react';

export const TasksRemindersPage: React.FC = () => {
  const { tasks, createTask, toggleTask } = useCrm();

  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.relatedToName && t.relatedToName.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (activeFilter === 'today') {
        matchesFilter = t.dueDate === todayStr && t.status !== 'completed';
      } else if (activeFilter === 'upcoming') {
        matchesFilter = t.dueDate > todayStr && t.status !== 'completed';
      } else if (activeFilter === 'completed') {
        matchesFilter = t.status === 'completed';
      }

      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesFilter && matchesPriority;
    });
  }, [tasks, searchTerm, activeFilter, priorityFilter, todayStr]);

  const handleToggle = async (id: string) => {
    await toggleTask(id);
  };

  const priorityVariantMap: Record<TaskPriority, 'rose' | 'amber' | 'green' | 'slate'> = {
    urgent: 'rose',
    high: 'rose',
    medium: 'amber',
    low: 'green',
  };

  const typeIconMap: Record<TaskType, React.ReactNode> = {
    call: <Phone className="w-3.5 h-3.5 text-blue-600" />,
    email: <Mail className="w-3.5 h-3.5 text-amber-600" />,
    meeting: <Users2 className="w-3.5 h-3.5 text-indigo-600" />,
    demo: <Calendar className="w-3.5 h-3.5 text-purple-600" />,
    quote_review: <CheckSquare className="w-3.5 h-3.5 text-brand-600" />,
    follow_up: <Clock className="w-3.5 h-3.5 text-slate-600" />,
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tasks & Follow-up Reminders
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {tasks.filter(t => t.status !== 'completed').length} Pending
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV('ZanCRM_Tasks', filteredTasks, [
                { key: 'title', label: 'Task Title' },
                { key: 'type', label: 'Type' },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status' },
                { key: 'dueDate', label: 'Due Date' },
                { key: 'dueTime', label: 'Due Time' },
                { key: 'relatedToName', label: 'Account / Deal' },
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
              setEditingTask(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Schedule Task
          </Button>
        </div>
      </div>

      {/* Filter Tabs and Controls */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Filter Badges */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 w-fit">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Due Today
          </button>
          <button
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>
        </div>
      </div>

      {/* Task List Items */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {filteredTasks.map(task => {
          const isCompleted = task.status === 'completed';
          const isOverdue = task.dueDate < todayStr && !isCompleted;

          return (
            <div
              key={task.id}
              className={`p-4 flex items-start gap-3.5 transition-colors ${
                isCompleted ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/80'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => handleToggle(task.id)}
                className={`mt-0.5 rounded-lg p-1 transition-colors ${
                  isCompleted
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100'
                }`}
                title={isCompleted ? 'Mark pending' : 'Mark completed'}
              >
                <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'fill-emerald-100' : ''}`} />
              </button>

              {/* Task Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-slate-100">
                      {typeIconMap[task.type] || <Clock className="w-3.5 h-3.5 text-slate-500" />}
                    </span>
                    <h3
                      className={`text-xs sm:text-sm font-bold text-slate-900 ${
                        isCompleted ? 'line-through text-slate-400' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={priorityVariantMap[task.priority]} size="sm">
                      {task.priority}
                    </Badge>
                    {isOverdue && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <AlertCircle className="w-3 h-3" /> Overdue
                      </span>
                    )}
                  </div>
                </div>

                {task.description && (
                  <p className="text-xs text-slate-500 mt-1">{task.description}</p>
                )}

                <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(task.dueDate)}</span>
                    {task.dueTime && <span>• {task.dueTime}</span>}
                  </div>

                  {task.relatedToName && (
                    <div className="text-brand-600 font-semibold truncate">
                      Account: {task.relatedToName}
                    </div>
                  )}

                  {task.completedAt && (
                    <div className="text-emerald-600">
                      Completed {formatDate(task.completedAt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setEditingTask(task);
                    setModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  title="Edit Task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No tasks match your selected view or search.
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editingTask}
        onSubmit={async data => {
          await createTask(data);
        }}
      />
    </div>
  );
};
