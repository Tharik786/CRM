import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import { InstallerScheduleItem, ScheduleStatus } from '../../types/crm';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { ScheduleModalForm } from '../../components/forms/ScheduleModalForm';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  Clock,
  Search,
  Plus,
  Download,
  Edit2,
  MapPin,
  CheckCircle2,
  X,
  Navigation,
  AlertTriangle,
  ArrowLeft,
  Tag,
  Droplets,
  Wind,
  Users,
  Trash2,
  Layers,
  Disc,
  Droplet,
  DoorClosed,
  Monitor,
  Wifi,
  Package,
} from 'lucide-react';

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const format = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const start = format(year, month, 1);
  const end = format(year, month, new Date(year, month + 1, 0).getDate());
  return { start, end };
};

// Device Icon Mapping
const getDeviceIcon = (key: string) => {
  switch (key) {
    case 'Wetness':
      return <Droplets className="w-3 h-3 text-blue-500 shrink-0" />;
    case 'AirQuality':
    case 'air_quality':
      return <Wind className="w-3 h-3 text-emerald-600 shrink-0" />;
    case 'Traffic':
      return <Users className="w-3 h-3 text-purple-600 shrink-0" />;
    case 'Trash':
    case 'trash':
      return <Trash2 className="w-3 h-3 text-amber-600 shrink-0" />;
    case 'PaperTowel':
    case 'paper_towel':
      return <Layers className="w-3 h-3 text-cyan-600 shrink-0" />;
    case 'ToiletPaper':
    case 'toilet_paper':
      return <Disc className="w-3 h-3 text-brand-600 shrink-0" />;
    case 'Soap':
    case 'soap_dispenser':
      return <Droplet className="w-3 h-3 text-teal-500 shrink-0" />;
    case 'Stall':
    case 'stall':
      return <DoorClosed className="w-3 h-3 text-indigo-600 shrink-0" />;
    case 'Janitor Tag':
      return <Tag className="w-3 h-3 text-orange-500 shrink-0" />;
    case 'OccupancyDisplay':
      return <Monitor className="w-3 h-3 text-violet-600 shrink-0" />;
    case 'Gateway':
    case 'gateway':
      return <Wifi className="w-3 h-3 text-sky-600 shrink-0" />;
    default:
      return <Package className="w-3 h-3 text-slate-500 shrink-0" />;
  }
};

export const InstallerSchedulePage: React.FC = () => {
  const {
    installerSchedules,
    installations,
    orders,
    createInstallerSchedule,
    updateInstallerSchedule,
    completeWorkflowInstallation,
    isLoading,
  } = useCrm();

  const [searchParams] = useSearchParams();
  const querySearch = searchParams.get('search') || '';

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState(querySearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const initialMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(initialMonthRange.start);
  const [endDate, setEndDate] = useState<string>(initialMonthRange.end);

  // Sync if search query param changes
  useEffect(() => {
    if (querySearch) {
      setSearchTerm(querySearch);
    }
  }, [querySearch]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InstallerScheduleItem | null>(null);

  // Complete Installation Modal State
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeInstId, setCompleteInstId] = useState('');
  const [completeInstalledCount, setCompleteInstalledCount] = useState<number>(10);
  const [isCompleting, setIsCompleting] = useState(false);

  const getScheduleQuantities = (item: InstallerScheduleItem) => {
    const inst = installations.find(i => i.id === item.installationId);
    const ord = orders.find(
      o =>
        (item.installationId && (o.installationId === item.installationId || o.devices?.some(d => d.installationId === item.installationId))) ||
        (inst?.orderId && (`${o.orderPrefix || 'ORD-'}${o.orderNumber}` === inst.orderId || o.id === inst.orderId))
    );

    // Prioritize installation devices for this appointment slot
    const devices =
      inst?.devices && inst.devices.length > 0
        ? inst.devices
        : ord?.devices && ord.devices.length > 0
        ? ord.devices
        : [];

    let required = devices.reduce((sum, d) => sum + (d.quantity || 0), 0);
    let installed = 0;

    if (inst?.devices && inst.devices.length > 0) {
      installed = inst.devices.reduce((sum, d) => sum + (d.installedQuantity || 0), 0);
    } else if (ord?.devices && ord.devices.length > 0) {
      installed = ord.devices.reduce((sum, d) => sum + (d.installed || 0), 0);
    }

    if (required === 0) {
      const match = item.notes?.match(/×\s*(\d+)/) || item.notes?.match(/\((\d+)\)/);
      required = match ? parseInt(match[1], 10) : 10;
    }

    const isComplete = item.status === 'completed' || inst?.status === 'completed' || ord?.status === 'Completed';
    if (isComplete && installed === 0) {
      installed = required;
    }

    return { required, installed };
  };

  const getDeviceQuantity = (item: InstallerScheduleItem) => {
    const { required, installed } = getScheduleQuantities(item);
    const remaining = Math.max(1, required - installed);
    return remaining;
  };

  const handleOpenCompleteModal = (instId?: string, count?: number) => {
    setCompleteInstId(instId || (installations.length > 0 ? installations[0].id : ''));
    setCompleteInstalledCount(count && count > 0 ? count : 10);
    setCompleteModalOpen(true);
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeInstId) return;
    setIsCompleting(true);
    try {
      await completeWorkflowInstallation(completeInstId, completeInstalledCount);
      setCompleteModalOpen(false);
    } finally {
      setIsCompleting(false);
    }
  };

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
        const q = searchTerm.toLowerCase();
        const matchesSearch =
          !q ||
          item.installer.toLowerCase().includes(q) ||
          item.customerName.toLowerCase().includes(q) ||
          (item.siteAddress && item.siteAddress.toLowerCase().includes(q)) ||
          (item.installationId && item.installationId.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          item.siteVisitTime.toLowerCase().includes(q);

        const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

        let matchesDate = true;
        if (startDate || endDate) {
          const schedDate = (() => {
            const dStr = item.visitDate || item.createdAt;
            if (!dStr) return '';
            const d = new Date(dStr);
            if (isNaN(d.getTime())) return dStr.substring(0, 10);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          })();

          if (startDate && schedDate < startDate) matchesDate = false;
          if (endDate && schedDate > endDate) matchesDate = false;
        }

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) => b.visitDate.localeCompare(a.visitDate));
  }, [installerSchedules, searchTerm, statusFilter, startDate, endDate]);

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
      filteredSchedules.map(item => {
        const inst = installations.find(i => i.id === item.installationId);
        const ord = orders.find(
          o => o.installationId === item.installationId || o.clientId === item.customerId
        );
        const devices =
          inst?.devices && inst.devices.length > 0
            ? inst.devices
            : ord?.devices && ord.devices.length > 0
            ? ord.devices
            : [];
        const deviceSummary = devices.map(d => `${d.deviceName} (${d.quantity})`).join(', ');
        const { required, installed } = getScheduleQuantities(item);

        return {
          ...item,
          devicesSummary: deviceSummary || 'Standard Kit',
          quantitySummary: installed > 0 ? `${installed} / ${required}` : `${required} Units`,
        };
      }),
      [
        { key: 'installer', label: 'Technician' },
        { key: 'customerName', label: 'Client' },
        { key: 'devicesSummary', label: 'Devices' },
        { key: 'quantitySummary', label: 'Quantity' },
        { key: 'visitDate', label: 'Installation Date' },
        { key: 'siteVisitTime', label: 'Time Site Visit' },
        { key: 'status', label: 'Status' },
        { key: 'siteAddress', label: 'Site Address' },
      ]
    );
  };

  const getStatusBadge = (status: ScheduleStatus) => {
    switch (status) {
      case 'completed':
        return <Badge variant="green" size="xs" dot>Completed</Badge>;
      case 'in_progress':
        return <Badge variant="blue" size="xs" dot>In Progress</Badge>;
      case 'confirmed':
        return <Badge variant="indigo" size="xs" dot>Confirmed</Badge>;
      case 'on_route':
        return <Badge variant="purple" size="xs" dot>On Route</Badge>;
      case 'rescheduled':
        return <Badge variant="amber" size="xs" dot>Rescheduled</Badge>;
      default:
        return <Badge variant="slate" size="xs">{status}</Badge>;
    }
  };

  const columns: Column<InstallerScheduleItem>[] = [
    {
      key: 'installer',
      header: 'Technician',
      width: '11%',
      className: 'w-[11%]',
      render: item => (
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center text-[9px] font-bold uppercase shrink-0">
            {item.installer.charAt(0)}
          </div>
          <span className="text-[11px] font-semibold text-slate-900 truncate" title={item.installer}>
            {item.installer}
          </span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      width: '17%',
      className: 'w-[17%]',
      render: item => (
        <div className="min-w-0 pr-1">
          <span className="font-semibold text-[11px] text-slate-900 truncate block max-w-full" title={item.customerName}>
            {item.customerName}
          </span>
          {item.siteAddress && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5 min-w-0" title={item.siteAddress}>
              <MapPin className="w-2.5 h-2.5 shrink-0 text-slate-400" />
              <span className="truncate">{item.siteAddress}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'devices',
      header: 'Devices',
      width: '15%',
      className: 'w-[15%]',
      render: item => {
        const inst = installations.find(i => i.id === item.installationId);
        const ord = orders.find(
          o => o.installationId === item.installationId || o.clientId === item.customerId
        );
        const devices =
          inst?.devices && inst.devices.length > 0
            ? inst.devices
            : ord?.devices && ord.devices.length > 0
            ? ord.devices
            : [];

        if (devices.length > 0) {
          return (
            <div className="flex flex-col gap-0.5 py-0.5 min-w-0">
              {devices.map((dev, dIdx) => (
                <div key={dIdx} className="flex items-center gap-1 min-w-0">
                  {getDeviceIcon(dev.deviceKey)}
                  <span className="font-semibold text-slate-800 text-[10.5px] truncate" title={dev.deviceName}>
                    {dev.deviceName}
                  </span>
                  <span className="text-[9.5px] text-slate-500 font-mono font-medium shrink-0">
                    × {dev.quantity}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        if (item.notes && item.notes.includes('(')) {
          const match = item.notes.match(/\(([^)]+)\)/);
          if (match) {
            return (
              <span className="text-[11px] text-slate-700 font-medium truncate block" title={match[1]}>
                {match[1]}
              </span>
            );
          }
        }

        return <span className="text-[10px] text-slate-400 italic">Standard Kit</span>;
      },
    },
    {
      key: 'visitDate',
      header: 'Installation Date',
      width: '11%',
      className: 'w-[11%]',
      render: item => {
        const isToday = item.visitDate === todayStr;
        return (
          <div className="flex items-center gap-1.5 whitespace-nowrap min-w-0">
            <span className="text-[11px] text-slate-700 font-medium">{formatDate(item.visitDate)}</span>
            {isToday && (
              <span className="px-1 py-0.2 rounded text-[8px] bg-brand-50 text-brand-700 border border-brand-200 font-bold shrink-0">
                Today
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'siteVisitTime',
      header: 'Time Site Visit',
      width: '13%',
      className: 'w-[13%]',
      render: item => (
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200 text-slate-800 text-[10px] font-semibold whitespace-nowrap">
          <Clock className="w-2.5 h-2.5 text-brand-600 shrink-0" />
          <span>{item.siteVisitTime}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      width: '9%',
      className: 'w-[9%] min-w-[85px] text-center align-middle whitespace-nowrap',
      headerClassName: 'w-[9%] min-w-[85px] text-center whitespace-nowrap',
      render: item => {
        const { required, installed } = getScheduleQuantities(item);
        const isFullyInstalled = installed >= required && required > 0;
        const isPartiallyInstalled = installed > 0 && installed < required;
        return (
          <div className="inline-flex flex-col items-center">
            <span
              className={`text-xs font-bold ${
                isFullyInstalled
                  ? 'text-emerald-700'
                  : isPartiallyInstalled
                  ? 'text-blue-700'
                  : 'text-slate-700'
              }`}
            >
              {installed > 0 ? `${installed} / ${required}` : `0 / ${required}`}
            </span>
            <span
              className={`text-[9px] font-medium ${
                isFullyInstalled
                  ? 'text-emerald-600'
                  : isPartiallyInstalled
                  ? 'text-blue-600'
                  : 'text-slate-400'
              }`}
            >
              Installed
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '13%',
      className: 'w-[13%] min-w-[125px] px-3 text-center align-middle whitespace-nowrap',
      headerClassName: 'w-[13%] min-w-[125px] px-3 text-center whitespace-nowrap',
      render: item => (
        <div className="inline-flex items-center justify-center whitespace-nowrap">
          {getStatusBadge(item.status)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      width: '14%',
      className: 'w-[14%] min-w-[130px] px-3 text-right whitespace-nowrap',
      headerClassName: 'w-[14%] min-w-[130px] px-3 text-right whitespace-nowrap',
      render: item => {
        const { required, installed } = getScheduleQuantities(item);
        const isDone = item.status === 'completed' || (installed >= required && required > 0);
        const instId = item.installationId || (item.notes?.match(/INST-\d+/)?.[0]) || '';
        const devCount = getDeviceQuantity(item);

        return (
          <div className="inline-flex items-center justify-end gap-1.5 whitespace-nowrap">
            {!isDone && instId ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleOpenCompleteModal(instId, devCount);
                }}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                title="Mark this installation as completed"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Installed</span>
              </button>
            ) : null}
            <button
              onClick={e => {
                e.stopPropagation();
                setEditingSchedule(item);
                setModalOpen(true);
              }}
              title="Edit Schedule Slot"
              className="p-1 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer shrink-0"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-2.5 animate-fade-in pb-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <Link
            to="/operations"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-1.5 transition-all w-fit group"
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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

      {/* Controls: Search, Filters & Sort Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-20">
        {/* Search Box */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search technician, ID, client..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 h-8"
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
            className="h-8 text-xs rounded-lg border border-slate-300 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="on_route">On Route</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="rescheduled">Rescheduled</option>
          </select>

          {/* Date Range Filter */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden relative z-10">
        {/* Table View */}
        <Table<InstallerScheduleItem>
          columns={columns}
          data={paginatedSchedules}
          keyExtractor={item => item.id}
          isLoading={isLoading}
          compact={true}
          noScroll={false}
          containerClassName="w-full overflow-x-auto"
          tableClassName="w-full min-w-[950px]"
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

      {/* Complete Site Installation Modal */}
      {completeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Complete Site Installation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update Installed count with actual count installed on site.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Installation ID
                </label>
                <input
                  type="text"
                  disabled
                  value={completeInstId}
                  className="w-full h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Actual Installed Count
                </label>
                <input
                  type="number"
                  min="1"
                  value={completeInstalledCount}
                  onChange={e => setCompleteInstalledCount(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This actual count will update the Installed balance across Inventory, Orders, and Operations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompleteModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isCompleting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4"
                >
                  Verify & Mark Complete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstallerSchedulePage;
