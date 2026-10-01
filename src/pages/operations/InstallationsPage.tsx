import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Installation, InstallationStatus } from '../../types/crm';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { Input } from '../../components/common/Input';
import { InstallationModalForm } from '../../components/forms/InstallationModalForm';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  CalendarCheck,
  Search,
  Plus,
  Download,
  Edit2,
  MapPin,
  Briefcase,
  Users,
  CheckCircle2,
  Activity,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstallationsPage: React.FC = () => {
  const {
    installations,
    createInstallation,
    updateInstallation,
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
  const [editingInstallation, setEditingInstallation] = useState<Installation | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = installations.length;
    const todayCount = installations.filter(i => i.installationDate === todayStr).length;
    const inProgressCount = installations.filter(i => i.status === 'in_progress').length;
    const completedCount = installations.filter(i => i.status === 'completed').length;
    const pendingCount = installations.filter(i => i.status === 'pending' || i.status === 'scheduled').length;
    return { total, todayCount, inProgressCount, completedCount, pendingCount };
  }, [installations, todayStr]);

  // Filtered & Sorted Installations
  const filteredInstallations = useMemo(() => {
    return installations
      .filter(item => {
        const matchesSearch =
          item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.installer.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.siteAddress && item.siteAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (item.dealTitle && item.dealTitle.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.installationDate.localeCompare(a.installationDate));
  }, [installations, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredInstallations.length / itemsPerPage) || 1;

  const paginatedInstallations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstallations.slice(start, start + itemsPerPage);
  }, [filteredInstallations, currentPage]);

  const handleSaveInstallation = async (
    data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingInstallation) {
      await updateInstallation(editingInstallation.id, data);
    } else {
      await createInstallation(data);
    }
  };

  const handleExportCSV = () => {
    exportToCSV(
      `ZanCRM_Installations_${todayStr}`,
      filteredInstallations,
      [
        { key: 'customerName', label: 'Customer' },
        { key: 'bookingDate', label: 'Booking Date' },
        { key: 'installationDate', label: 'Installation Date' },
        { key: 'installer', label: 'Installer' },
        { key: 'status', label: 'Status' },
        { key: 'siteAddress', label: 'Site Address' },
        { key: 'contactPhone', label: 'Contact Phone' },
        { key: 'dealTitle', label: 'Deal Title' },
      ]
    );
  };

  const getStatusBadge = (status: InstallationStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="green" dot>Completed</Badge>;
      case 'in_progress':
        return <Badge variant="blue" dot>In Progress</Badge>;
      case 'scheduled':
        return <Badge variant="indigo" dot>Scheduled</Badge>;
      case 'pending':
        return <Badge variant="amber" dot>Pending</Badge>;
      case 'cancelled':
        return <Badge variant="rose" dot>Cancelled</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const columns: Column<Installation>[] = [
    {
      key: 'customer',
      header: 'Customer & Site',
      className: 'w-[28%]',
      render: item => (
        <div className="min-w-0 pr-2">
          <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-1.5 min-w-0">
            <span className="truncate">{item.customerName}</span>
            {item.customerId && (
              <Link
                to="/contacts"
                title="View Client Profile"
                className="text-slate-400 hover:text-brand-600 transition-colors shrink-0"
              >
                <Users className="w-3 h-3" />
              </Link>
            )}
          </div>
          {item.dealTitle && (
            <div className="flex items-center gap-1 text-[11px] text-brand-600 truncate mt-0.5 font-medium min-w-0">
              <Briefcase className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.dealTitle}</span>
            </div>
          )}
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
      key: 'bookingDate',
      header: 'Booking Date',
      className: 'w-[14%] whitespace-nowrap',
      render: item => (
        <div className="text-xs text-slate-600 font-medium whitespace-nowrap">
          {formatDate(item.bookingDate)}
        </div>
      ),
    },
    {
      key: 'installationDate',
      header: 'Installation Date',
      className: 'w-[17%] whitespace-nowrap',
      render: item => {
        const isToday = item.installationDate === todayStr;
        const isPast = item.installationDate < todayStr && item.status !== 'completed';
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className={`text-xs font-semibold ${
                isToday ? 'text-brand-600 font-bold' : isPast ? 'text-rose-600' : 'text-slate-800'
              }`}
            >
              {formatDate(item.installationDate)}
            </span>
            {isToday && (
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-50 text-brand-700 border border-brand-200 font-bold">
                Today
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'installer',
      header: 'Technician / Installer',
      className: 'w-[18%] whitespace-nowrap',
      render: item => (
        <div className="flex items-center gap-2 whitespace-nowrap min-w-0">
          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
            {item.installer.charAt(0)}
          </div>
          <span className="text-xs font-semibold text-slate-800 truncate">{item.installer}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      className: 'w-[13%] whitespace-nowrap',
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
              setEditingInstallation(item);
              setModalOpen(true);
            }}
            title="Edit Installation"
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
            Installations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer hardware installations, technician assignments, and site dispatch status.
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
              setEditingInstallation(null);
              setModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Schedule Installation
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip (Compact Height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 px-3.5 py-2 shadow-2xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Installations
            </span>
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-slate-900 mt-0.5 font-mono leading-none">
            {metrics.total}
          </div>
        </div>

        <div className="bg-brand-50/20 rounded-xl border border-brand-200 px-3.5 py-2 shadow-2xs hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
              Scheduled Today
            </span>
            <Clock className="w-3.5 h-3.5 text-brand-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-brand-700 mt-0.5 font-mono leading-none">
            {metrics.todayCount}
          </div>
        </div>

        <div className="bg-blue-50/20 rounded-xl border border-blue-200 px-3.5 py-2 shadow-2xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              In Progress
            </span>
            <Activity className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-700 mt-0.5 font-mono leading-none">
            {metrics.inProgressCount}
          </div>
        </div>

        <div className="bg-emerald-50/20 rounded-xl border border-emerald-200 px-3.5 py-2 shadow-2xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5 font-mono leading-none">
            {metrics.completedCount}
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
              placeholder="Search customer, installer, deal, or address..."
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
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table View */}
        <Table<Installation>
          columns={columns}
          data={paginatedInstallations}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          noScroll={true}
          tableClassName="table-fixed"
          emptyMessage={
            <div className="py-12 text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {searchTerm || statusFilter !== 'all'
                  ? 'No installations match filters'
                  : 'No installations scheduled yet'}
              </p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try clearing your search query or reset filter settings.'
                  : 'Dispatch technicians and schedule customer hardware installations.'}
              </p>
              {!(searchTerm || statusFilter !== 'all') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setEditingInstallation(null);
                    setModalOpen(true);
                  }}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Schedule First Installation
                </Button>
              )}
            </div>
          }
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredInstallations.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* Modal */}
      <InstallationModalForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveInstallation}
        initialData={editingInstallation}
      />
    </div>
  );
};

export default InstallationsPage;
