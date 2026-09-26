import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/EmptyState';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Award,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Briefcase,
  Activity as ActivityIcon,
  ChevronRight,
  Flame,
  PhoneCall,
  Mail,
  Users2,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { DashboardMetrics } from '../../types/crm';
import { crmService } from '../../api/services/crmService';

export const TodayDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, toggleTask } = useCrm();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await crmService.getDashboardMetrics();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading || !metrics) {
    return <LoadingSpinner label="Crunching daily revenue intelligence..." />;
  }

  const todayTasks = tasks.filter(t => t.dueDate === '2026-09-26' || t.status === 'pending').slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-6 sm:p-8 shadow-elevated border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-500/20 via-indigo-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Live Revenue Operations
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Saturday, September 26, 2026
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good morning, {user?.name?.split(' ')[0] || 'Alex'} 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-xl">
              You have <span className="text-brand-300 font-semibold">{todayTasks.filter(t => t.status !== 'completed').length} priority follow-ups</span> scheduled for today and <span className="text-emerald-400 font-semibold">{formatCurrency(metrics.pipelineValue)}</span> in active deal pipeline.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/deals">
              <Button variant="primary" size="sm" icon={<Briefcase className="w-4 h-4" />}>
                View Pipeline Kanban
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Won Revenue */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Closed Revenue
              </span>
              <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatCurrency(metrics.totalRevenue)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{metrics.revenueChange}%
                </span>
                <span className="text-slate-400">vs last month</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pipeline Value */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Pipeline
              </span>
              <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {formatCurrency(metrics.pipelineValue)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-brand-600 font-semibold">
                  <Flame className="w-3.5 h-3.5 text-amber-500 mr-0.5" /> 5 deals
                </span>
                <span className="text-slate-400">in progression</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Win Rate */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Opportunity Win Rate
              </span>
              <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics.winRate}%
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{metrics.winRateChange}%
                </span>
                <span className="text-slate-400">conversion benchmark</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Active Enquiries */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Sales Leads
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics.activeLeadsCount} Leads
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center text-emerald-600 font-semibold">
                  +{metrics.leadsChange}%
                </span>
                <span className="text-slate-400">inbound growth</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Pipeline Summary Breakdown */}
      <Card>
        <CardHeader
          title="Sales Pipeline Funnel Summary"
          subtitle="Real-time distribution of opportunity values by sales stage"
          action={
            <Link
              to="/deals"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Kanban Board <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.stageBreakdown.map((item, idx) => {
              const stageLabels: Record<string, string> = {
                qualification: 'Qualification',
                needs_analysis: 'Needs Analysis',
                proposal_sent: 'Proposal Sent',
                negotiation: 'Negotiation',
                closed_won: 'Closed Won',
                closed_lost: 'Closed Lost',
              };

              const colors = [
                'border-blue-200 bg-blue-50/50 text-blue-700',
                'border-indigo-200 bg-indigo-50/50 text-indigo-700',
                'border-amber-200 bg-amber-50/50 text-amber-700',
                'border-purple-200 bg-purple-50/50 text-purple-700',
                'border-emerald-200 bg-emerald-50/50 text-emerald-700',
                'border-rose-200 bg-rose-50/50 text-rose-700',
              ];

              return (
                <div
                  key={item.stage}
                  className={`p-3.5 rounded-xl border ${colors[idx % colors.length]} flex flex-col justify-between`}
                >
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                      {stageLabels[item.stage]}
                    </span>
                    <div className="text-lg font-black font-mono mt-1">
                      {formatCurrency(item.totalValue)}
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-medium opacity-75">
                    {item.count} {item.count === 1 ? 'deal' : 'deals'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Main Grid: Today's Tasks & Follow-ups vs Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Tasks / Reminders */}
        <Card>
          <CardHeader
            title="Today's Priority Follow-ups"
            subtitle="Scheduled customer calls, quote reviews, and action items"
            action={
              <Link
                to="/tasks"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                All Tasks <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {todayTasks.map(task => {
                const isCompleted = task.status === 'completed';
                const priorityVariants: Record<string, 'rose' | 'amber' | 'green'> = {
                  urgent: 'rose',
                  high: 'amber',
                  medium: 'green',
                  low: 'green',
                };

                return (
                  <div
                    key={task.id}
                    className={`p-4 flex items-start gap-3 transition-colors ${
                      isCompleted ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`mt-0.5 rounded-lg p-1 transition-colors ${
                        isCompleted
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-400 hover:text-brand-600 hover:bg-slate-100'
                      }`}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${isCompleted ? 'fill-emerald-100' : ''}`} />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4
                          className={`text-xs font-bold text-slate-800 truncate ${
                            isCompleted ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        <Badge variant={priorityVariants[task.priority]} size="sm">
                          {task.priority}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {task.dueTime || 'All Day'}
                        </span>
                        {task.relatedToName && (
                          <span className="truncate text-slate-500">
                            • {task.relatedToName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {todayTasks.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No pending follow-ups scheduled for today!
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Recent Activity Timeline */}
        <Card>
          <CardHeader
            title="Activity Timeline"
            subtitle="Recent calls, quotations, closed sales, and notes"
            action={
              <Link
                to="/activities"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                Full Stream <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {metrics.recentActivities.map(act => {
                const iconMap: Record<string, React.ReactNode> = {
                  call: <PhoneCall className="w-3.5 h-3.5 text-blue-600" />,
                  meeting: <Users2 className="w-3.5 h-3.5 text-indigo-600" />,
                  email: <Mail className="w-3.5 h-3.5 text-amber-600" />,
                  deal_stage_changed: <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />,
                  quotation_created: <DollarSign className="w-3.5 h-3.5 text-purple-600" />,
                  note: <ActivityIcon className="w-3.5 h-3.5 text-slate-600" />,
                };

                return (
                  <div key={act.id} className="p-4 flex items-start gap-3 hover:bg-slate-50/50 transition-colors">
                    <div className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {iconMap[act.type] || <ActivityIcon className="w-3.5 h-3.5 text-slate-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{act.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{act.description}</p>
                      <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-2">
                        <span className="font-semibold text-slate-600">{act.performedBy}</span>
                        {act.relatedToName && <span>• {act.relatedToName}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
