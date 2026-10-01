import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { InstallerScheduleItem, ScheduleStatus } from '../../types/crm';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { Input } from '../../components/common/Input';
import { ScheduleModalForm } from '../../components/forms/ScheduleModalForm';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  Clock,
  Search,
  Plus,
  Download,
  Edit2,
  MapPin,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstallerSchedulePage: React.FC = () => {
  const {
    installerSchedules,
    createInstallerSchedule,
    updateInstallerSchedule,
    isLoading,
  } = useCrm();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InstallerScheduleItem | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = installerSchedules.length;
    const todayCount = installerSchedules.filter(s => s.visitDate === todayStr).length;
    const activeRouteCount = installerSchedules.filter(
      s => s.status === 'confirmed' || s.status === 'on_route' || s.status === 'in_progress'
    ).length;
    const completedCount = installerSchedules.filter(s => s.status === 'completed').length;
    const rescheduledCount = installerSchedules.filter(s => s.status === 'rescheduled').length;
    return { total, todayCount, activeRouteCount, completedCount, rescheduledCount };
  }, [installerSchedules, todayStr]);

  // Filtered & Sorted Schedules
  const filteredSchedules = useMemo(() => {
    return installerSchedules
      .filter(item => {
        const matchesSearch =
          item.installer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.siteAddress && item.siteAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
          item.siteVisitTime.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }, [installerSchedules, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage) || 1;

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  const handleSaveSchedule = async (
    data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingSchedule) {
      await updateInstallerSchedule(editingSchedule.id, data);
    } else {
      await createInstallerSchedule(data);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      `ZanCRM_Installer_Schedule_${todayStr}`,
      filteredSchedules,
      [
        { key: 'installer', label: 'Installer' },
        { key: 'siteVisitTime', label: 'Site Visit Time' },
        { key: 'visitDate', label: 'Visit Date' },
        { key: 'customerName', label: 'Customer' },
        { key: 'status', label: 'Status' },
        { key: 'siteAddress', label: 'Site Address' },
        { key: 'notes', label: 'Notes' },
      ]
    );
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="green" dot>Completed</Badge>;
      case 'in_progress':
        return <Badge variant="blue" dot>In Progress</Badge>;
      case 'confirmed':
        return <Badge variant="indigo" dot>Confirmed</Badge>;
      case 'on_route':
        return <Badge variant="purple" dot>On Route</Badge>;
      case 'rescheduled':
        return <Badge variant="amber" dot>Rescheduled</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const columns: Column<InstallerScheduleItem>[] = [
    {
      key: 'installer',
      header: 'Technician & Date',
      className: 'w-[22%] whitespace-nowrap',
      render: item => {
        const isToday = item.visitDate === todayStr;
        return (
          <div className="whitespace-nowrap min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                {item.installer.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-slate-900 truncate">{item.installer}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 ml-8">
              <span className="text-[11px] text-slate-500 font-medium">{formatDate(item.visitDate)}</span>
              {isToday && (
                <span className="px-1.5 py-0.2 rounded text-[9px] bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                  Today
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'siteVisitTime',
      header: 'Visit Time Window',
      className: 'w-[18%] whitespace-nowrap',
      render: item => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/90 border border-slate-200 text-slate-800 text-xs font-semibold whitespace-nowrap">
          <Clock className="w-3 h-3 text-brand-600 shrink-0" />
          <span>{item.siteVisitTime}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer & Destination',
      className: 'w-[36%]',
      render: item => (
        <div className="min-w-0 pr-2">
          <span className="font-semibold text-xs text-slate-900 block truncate">
            {item.customerName}
          </span>
          {item.siteAddress && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.siteAddress}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[14%] whitespace-nowrap',
      render: item => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[10%] text-right whitespace-nowrap pr-4',
      headerClassName: 'text-right pr-4',
      render: item => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              setEditingSchedule(item);
              setModalOpen(true);
            }}
            title="Edit Schedule Slot"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-fade-in pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-2 transition-all w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all" />
            <span>Back to Operations</span>
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Installer Schedule
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate technician appointments, arrival time windows, and field routes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSchedule(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Visit Slot
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip (Compact Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Visit Slots
            </span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 font-mono leading-none">
            {metrics.total}
          </div>
        </div>

        <div className="bg-indigo-50/20 rounded-xl border border-indigo-200 px-3.5 py-2 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Today's Appointments
            </span>
            <Navigation className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-700 mt-0.5 font-mono leading-none">
            {metrics.todayCount}
          </div>
        </div>

        <div className="bg-blue-50/20 rounded-xl border border-blue-200 px-3.5 py-2 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Active & En Route
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 font-mono leading-none">
            {metrics.activeRouteCount}
          </div>
        </div>

        <div className="bg-amber-50/20 rounded-xl border border-amber-200 px-3.5 py-2 shadow-2xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Rescheduled
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-amber-700 mt-0.5 font-mono leading-none">
            {metrics.rescheduledCount}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden">
        {/* Controls: Search, Filters & Sort */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search technician, time slot, customer, or address..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs rounded-lg border border-slate-300 py-1.5 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              <option value="all">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="on_route">On Route</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <Table<InstallerScheduleItem>
          columns={columns}
          data={paginatedSchedules}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          noScroll={true}
          tableClassName="table-fixed"
          emptyMessage={
            <div className="py-12 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {searchTerm || statusFilter !== 'all'
                  ? 'No schedule slots match filters'
                  : 'No technician visits scheduled'}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try clearing your search keyword or reset filter settings.'
                  : 'Organize site appointment windows and installer routes.'}
              </p>
              {!(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingSchedule(null);
                    setModalOpen(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Add Visit Slot
                </Button>
              )}
            </div>
          }
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredSchedules.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Modal */}
      <ScheduleModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveSchedule}
        initialData={editingSchedule}
      />
    </div>
  );
};

export default InstallerSchedulePage;
