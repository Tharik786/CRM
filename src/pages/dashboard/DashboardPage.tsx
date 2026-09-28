import React, { useState, useEffect } from 'react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
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
  Activity as ActivityIcon,
  Flame,
  PhoneCall,
  Mail,
  Users2,
} from 'lucide-react';
import { DashboardMetrics } from '../../types/crm';
import { crmService } from '../../api/services/crmService';

export const DashboardPage: React.FC = () => {
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

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <LoadingSpinner label="Calculating real-time CRM metrics..." />
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const todayTasks = tasks.slice(0, 5);
  const activeDealsCount = metrics.stageBreakdown
    .filter(s => s.stage !== 'closed_won' && s.stage !== 'closed_lost')
    .reduce((acc, curr) => acc + curr.count, 0);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return 'Good afternoon';
    } else {
      return 'Good evening';
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Welcome Greeting Header */}
      <div>
        <span className="text-xs sm:text-sm font-medium text-slate-500 tracking-normal block">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
          {getGreeting()}{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Won Revenue */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Revenue
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
                  <ArrowUpRight className="w-3.5 h-3.5" /> {metrics.dealsWonCount} deals won
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pipeline Value */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pipeline Value
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
                  <Flame className="w-3.5 h-3.5 text-amber-500 mr-0.5" /> {activeDealsCount} {activeDealsCount === 1 ? 'deal' : 'deals'}
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
                Win Rate
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

        {/* New Enquiries */}
        <Card className="hover:border-brand-200">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                New Enquiries
              </span>
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
                {metrics.activeLeadsCount} Enquiries
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
          title="Sales Pipeline Summary"
        />
        <CardBody>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {metrics.stageBreakdown.map((item, idx) => {
              const stageLabels: Record<string, string> = {
                qualification: 'New',
                needs_analysis: 'Qualified',
                proposal_sent: 'Proposal',
                negotiation: 'Discussion',
                closed_won: 'Won',
                closed_lost: 'Lost',
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
