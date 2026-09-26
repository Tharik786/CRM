import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';
import {
  Download,
  ArrowUpRight,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { deals, leads } = useCrm();
  const [timeframe, setTimeframe] = useState<'q3' | 'ytd' | 'all'>('ytd');

  // Revenue totals
  const wonDeals = deals.filter(d => d.stage === 'closed_won');
  const lostDeals = deals.filter(d => d.stage === 'closed_lost');
  const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');

  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pipelineRevenue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  // Conversion funnel data
  const totalLeadsCount = leads.length;
  const contactedCount = leads.filter(l => l.status !== 'new').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified' || l.status === 'converted').length;

  // Monthly Revenue Data
  const monthlyRevenue = [
    { month: 'Apr 2026', revenue: 75000, target: 60000 },
    { month: 'May 2026', revenue: 110000, target: 80000 },
    { month: 'Jun 2026', revenue: 145000, target: 120000 },
    { month: 'Jul 2026', revenue: 130000, target: 130000 },
    { month: 'Aug 2026', revenue: 165000, target: 150000 },
    { month: 'Sep 2026', revenue: 150000, target: 140000 },
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => m.revenue));

  // Sales Leaderboard
  const reps = [
    {
      name: 'Alex Rivera',
      role: 'VP Sales & RevOps',
      dealsWon: 8,
      revenueClosed: 420000,
      quotaAttainment: 128,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    {
      name: 'Marcus Vance',
      role: 'Enterprise AE',
      dealsWon: 5,
      revenueClosed: 295000,
      quotaAttainment: 112,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    },
    {
      name: 'Elena Rostova',
      role: 'Strategic Accounts Lead',
      dealsWon: 4,
      revenueClosed: 210000,
      quotaAttainment: 96,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Executive Sales & Pipeline Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Q3 Reporting Cycle
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time revenue attribution, stage velocity, conversion rates, and sales leaderboard
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value as 'q3' | 'ytd' | 'all')}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 font-medium"
          >
            <option value="q3">Current Quarter (Q3 2026)</option>
            <option value="ytd">Year to Date (YTD 2026)</option>
            <option value="all">Trailing 12 Months</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            icon={<Download className="w-4 h-4" />}
          >
            Print Report
          </Button>
        </div>
      </div>

      {/* High-level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Won ARR
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatCurrency(totalWonRevenue)}
            </div>
            <div className="mt-2 text-xs flex items-center gap-1 text-emerald-600 font-semibold">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24% vs Q2 benchmark
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Unweighted Pipeline
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatCurrency(pipelineRevenue)}
            </div>
            <div className="mt-2 text-xs text-brand-600 font-semibold">
              {activeDeals.length} active enterprise deals
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Overall Win / Loss Ratio
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {wonDeals.length + lostDeals.length > 0
                ? `${Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)}%`
                : '75%'}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              {wonDeals.length} Won • {lostDeals.length} Lost
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Avg Deal Cycle
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              28 Days
            </div>
            <div className="mt-2 text-xs text-emerald-600 font-semibold">
              -4 days faster than industry standard
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader
            title="Revenue Performance Trend (Monthly)"
            subtitle="Actual closed ARR vs quarterly targets"
          />
          <CardBody>
            <div className="space-y-4 pt-2">
              {monthlyRevenue.map((item, idx) => {
                const percent = Math.round((item.revenue / maxRevenue) * 100);
                const targetPercent = Math.round((item.target / maxRevenue) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.month}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(item.revenue)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target: {formatCurrency(item.target)}
                        </span>
                      </div>
                    </div>

                    {/* Bar visualization */}
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                      {/* Target marker line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                        style={{ left: `${targetPercent}%` }}
                        title={`Target: ${formatCurrency(item.target)}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader
            title="Sales Conversion Funnel"
            subtitle="Stage drop-off rates from inbound lead to won deal"
          />
          <CardBody>
            <div className="space-y-3 pt-2">
              {/* Stage 1: Captured */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">1. Inbound Leads Captured</span>
                  <span className="font-mono font-bold text-slate-900">{totalLeadsCount} Leads (100%)</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-slate-700 h-full w-full" />
                </div>
              </div>

              {/* Stage 2: Contacted */}
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-900">2. Initial Contact & Discovery</span>
                  <span className="font-mono font-bold text-blue-900">
                    {contactedCount} Leads ({Math.round((contactedCount / totalLeadsCount) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-blue-100 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full"
                    style={{ width: `${Math.round((contactedCount / totalLeadsCount) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stage 3: Qualified */}
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900">3. BANT Qualified Pipeline</span>
                  <span className="font-mono font-bold text-indigo-900">
                    {qualifiedCount} Leads ({Math.round((qualifiedCount / totalLeadsCount) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-indigo-100 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full"
                    style={{ width: `${Math.round((qualifiedCount / totalLeadsCount) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Stage 4: Deal Won */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900">4. Closed Won Customers</span>
                  <span className="font-mono font-bold text-emerald-900">
                    {wonDeals.length} Deals ({(wonDeals.length / totalLeadsCount * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-emerald-100 h-2.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full"
                    style={{ width: `${Math.round((wonDeals.length / totalLeadsCount) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sales Rep Leaderboard */}
      <Card>
        <CardHeader
          title="Sales Representative Leaderboard"
          subtitle="Quota attainment, closed revenue, and deals closed"
        />
        <CardBody className="p-0">
          <div className="divide-y divide-slate-100">
            {reps.map((rep, idx) => (
              <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-slate-400 text-sm w-4">
                    #{idx + 1}
                  </span>
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{rep.name}</h4>
                    <p className="text-xs text-slate-500">{rep.role}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-10 text-right">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Deals Won
                    </span>
                    <span className="font-mono font-extrabold text-sm text-slate-800">
                      {rep.dealsWon}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Revenue
                    </span>
                    <span className="font-mono font-extrabold text-sm text-slate-900">
                      {formatCurrency(rep.revenueClosed)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quota
                    </span>
                    <span className="font-mono font-extrabold text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rep.quotaAttainment}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
