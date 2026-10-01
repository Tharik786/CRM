import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { formatCurrency } from '../../utils/formatters';
import {
  Download,
  ArrowUpRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { deals, leads } = useCrm();
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'q3' | 'ytd' | 'all'>('ytd');

  // Revenue totals
  const wonDeals = deals.filter(d => d.stage === 'won');
  const lostDeals = deals.filter(d => d.stage === 'lost');
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost' && d.stage !== 'cold');

  const totalWonRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const pipelineRevenue = activeDeals.reduce((sum, d) => sum + d.value, 0);

  // Conversion funnel data
  const totalLeadsCount = leads.length;
  const contactedCount = leads.filter(l => l.status !== 'new').length;
  const qualifiedCount = leads.filter(l => l.status === 'qualified' || l.status === 'converted').length;

  // Dynamic Monthly Revenue from real won deals
  const monthlyRevenueMap: Record<string, number> = {};
  wonDeals.forEach(deal => {
    const d = new Date(deal.expectedCloseDate || deal.updatedAt);
    const key = !isNaN(d.getTime())
      ? d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : 'Current Period';
    monthlyRevenueMap[key] = (monthlyRevenueMap[key] || 0) + deal.value;
  });

  const monthlyRevenue = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  const maxRevenue = monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue.map(m => m.revenue)) : 0;

  // Real Leaderboard from active users and deals
  const repTotals: Record<string, { dealsWon: number; revenue: number }> = {};
  wonDeals.forEach(deal => {
    const repName = user?.name || 'Current User';
    if (!repTotals[repName]) {
      repTotals[repName] = { dealsWon: 0, revenue: 0 };
    }
    repTotals[repName].dealsWon += 1;
    repTotals[repName].revenue += deal.value;
  });

  const reps = Object.entries(repTotals).map(([name, data]) => ({
    name,
    role: user?.title || 'Account Executive',
    dealsWon: data.dealsWon,
    revenueClosed: data.revenue,
  }));

  return (
    <div className="space-y-3.5 animate-fade-in pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Executive Sales & Pipeline Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 border border-brand-200">
              Live Reports
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={e => setTimeframe(e.target.value as 'q3' | 'ytd' | 'all')}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium"
          >
            <option value="q3">Current Quarter</option>
            <option value="ytd">Year to Date (YTD)</option>
            <option value="all">All Time</option>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardBody className="p-4 sm:p-4.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Revenue
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatCurrency(totalWonRevenue)}
            </div>
            <div className="mt-2 text-xs flex items-center gap-1 text-slate-500 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Based on {wonDeals.length} won deals
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pipeline Value
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {formatCurrency(pipelineRevenue)}
            </div>
            <div className="mt-2 text-xs text-brand-600 font-semibold">
              {activeDeals.length} active opportunities
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Win Rate
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {wonDeals.length + lostDeals.length > 0
                ? `${Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)}%`
                : '0%'}
            </div>
            <div className="mt-2 text-xs text-slate-500 font-medium">
              {wonDeals.length} Won • {lostDeals.length} Lost
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Opportunities
            </span>
            <div className="text-2xl font-black text-slate-900 font-mono mt-2">
              {deals.length}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Across all pipeline stages
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader
            title="Revenue Performance Trend"
            subtitle="Closed won revenue grouped by period"
          />
          <CardBody>
            {monthlyRevenue.length > 0 ? (
              <div className="space-y-4 pt-2">
                {monthlyRevenue.map((item, idx) => {
                  const percent = maxRevenue > 0 ? Math.round((item.revenue / maxRevenue) * 100) : 0;

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.month}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>

                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                No closed won deals recorded yet. Advance pipeline deals to "Won" to see revenue trends.
              </div>
            )}
          </CardBody>
        </Card>

        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader
            title="Sales Conversion Funnel"
            subtitle="Stage drop-off rates from inbound lead to won deal"
          />
          <CardBody>
            {totalLeadsCount > 0 ? (
              <div className="space-y-3 pt-2">
                {/* Stage 1: Captured */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">1. Inbound Enquiries Captured</span>
                    <span className="font-mono font-bold text-slate-900">{totalLeadsCount} Enquiries (100%)</span>
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
                      {contactedCount} Enquiries ({Math.round((contactedCount / totalLeadsCount) * 100)}%)
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
                    <span className="font-bold text-indigo-900">3. Qualified Opportunities</span>
                    <span className="font-mono font-bold text-indigo-900">
                      {qualifiedCount} Enquiries ({Math.round((qualifiedCount / totalLeadsCount) * 100)}%)
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
                    <span className="font-bold text-emerald-900">4. Won Deals</span>
                    <span className="font-mono font-bold text-emerald-900">
                      {wonDeals.length} Deals ({(wonDeals.length / totalLeadsCount * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-emerald-100 h-2.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full"
                      style={{ width: `${Math.min(100, Math.round((wonDeals.length / totalLeadsCount) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                No enquiries captured yet. Add enquiries to view conversion funnel metrics.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Sales Leaderboard */}
      <Card>
        <CardHeader
          title="Sales Representative Performance"
          subtitle="Revenue generated and deals won"
        />
        <CardBody className="p-0">
          {reps.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {reps.map((rep, idx) => (
                <div key={idx} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-400 text-sm w-4">
                      #{idx + 1}
                    </span>
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
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              No closed won revenue yet. Leaderboard updates when deals are won.
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
