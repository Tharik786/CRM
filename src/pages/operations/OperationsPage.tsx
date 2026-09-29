import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import {
  Installation,
  InstallationStatus,
  InstallerScheduleItem,
  ScheduleStatus,
  DeviceInventoryItem,
} from '../../types/crm';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { Input } from '../../components/common/Input';
import { InstallationModalForm } from '../../components/forms/InstallationModalForm';
import { ScheduleModalForm } from '../../components/forms/ScheduleModalForm';
import { DeviceModalForm } from '../../components/forms/DeviceModalForm';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  Wrench,
  CalendarCheck,
  Clock,
  Cpu,
  Users,
  Search,
  Plus,
  Download,
  Edit2,
  Trash2,
  MapPin,
  Briefcase,
  Box,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ActiveTab = 'installations' | 'schedule' | 'inventory';

export const OperationsPage: React.FC = () => {
  const {
    installations,
    installerSchedules,
    deviceInventory,
    createInstallation,
    updateInstallation,
    deleteInstallation,
    createInstallerSchedule,
    updateInstallerSchedule,
    deleteInstallerSchedule,
    createDeviceInventoryItem,
    updateDeviceInventoryItem,
    deleteDeviceInventoryItem,
    isLoading,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<ActiveTab>('installations');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals State
  const [installationModalOpen, setInstallationModalOpen] = useState(false);
  const [editingInstallation, setEditingInstallation] = useState<Installation | null>(null);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<InstallerScheduleItem | null>(null);

  const [deviceModalOpen, setDeviceModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceInventoryItem | null>(null);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Reset pagination when tab or filters change
  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSearchTerm('');
    setStatusFilter('all');
    setSortBy(tab === 'inventory' ? 'qty-desc' : 'date-desc');
    setCurrentPage(1);
  };


  // ==========================================
  // Filtered & Sorted Data: Installations
  // ==========================================
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
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.installationDate.localeCompare(a.installationDate);
        if (sortBy === 'date-asc') return a.installationDate.localeCompare(b.installationDate);
        if (sortBy === 'customer-asc') return a.customerName.localeCompare(b.customerName);
        if (sortBy === 'installer-asc') return a.installer.localeCompare(b.installer);
        return 0;
      });
  }, [installations, searchTerm, statusFilter, sortBy]);

  // ==========================================
  // Filtered & Sorted Data: Installer Schedule
  // ==========================================
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
      .sort((a, b) => {
        if (sortBy === 'date-desc') return b.visitDate.localeCompare(a.visitDate);
        if (sortBy === 'date-asc') return a.visitDate.localeCompare(b.visitDate);
        if (sortBy === 'installer-asc') return a.installer.localeCompare(b.installer);
        if (sortBy === 'customer-asc') return a.customerName.localeCompare(b.customerName);
        return 0;
      });
  }, [installerSchedules, searchTerm, statusFilter, sortBy]);

  // ==========================================
  // Filtered & Sorted Data: Device Inventory
  // ==========================================
  const filteredInventory = useMemo(() => {
    return deviceInventory
      .filter(item => {
        const matchesSearch =
          item.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesStatus = statusFilter === 'all' || item.category === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'qty-desc') return b.availableQty - a.availableQty;
        if (sortBy === 'qty-asc') return a.availableQty - b.availableQty;
        if (sortBy === 'req-desc') return b.requiredQty - a.requiredQty;
        if (sortBy === 'name-asc') return a.deviceName.localeCompare(b.deviceName);
        return 0;
      });
  }, [deviceInventory, searchTerm, statusFilter, sortBy]);

  // Current Paginated Data
  const currentTotal =
    activeTab === 'installations'
      ? filteredInstallations.length
      : activeTab === 'schedule'
      ? filteredSchedules.length
      : filteredInventory.length;

  const totalPages = Math.ceil(currentTotal / itemsPerPage) || 1;

  const paginatedInstallations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInstallations.slice(start, start + itemsPerPage);
  }, [filteredInstallations, currentPage]);

  const paginatedSchedules = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSchedules.slice(start, start + itemsPerPage);
  }, [filteredSchedules, currentPage]);

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventory.slice(start, start + itemsPerPage);
  }, [filteredInventory, currentPage]);

  // ==========================================
  // CRUD Actions Handlers
  // ==========================================
  const handleSaveInstallation = async (
    data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingInstallation) {
      await updateInstallation(editingInstallation.id, data);
    } else {
      await createInstallation(data);
    }
  };

  const handleDeleteInstallation = async (id: string, customer: string) => {
    if (window.confirm(`Delete installation job for "${customer}"?`)) {
      await deleteInstallation(id);
    }
  };

  const handleSaveSchedule = async (
    data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingSchedule) {
      await updateInstallerSchedule(editingSchedule.id, data);
    } else {
      await createInstallerSchedule(data);
    }
  };

  const handleDeleteSchedule = async (id: string, installerName: string) => {
    if (window.confirm(`Remove visit slot for installer "${installerName}"?`)) {
      await deleteInstallerSchedule(id);
    }
  };

  const handleSaveDevice = async (data: Omit<DeviceInventoryItem, 'id' | 'updatedAt'>) => {
    if (editingDevice) {
      await updateDeviceInventoryItem(editingDevice.id, data);
    } else {
      await createDeviceInventoryItem(data);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (window.confirm(`Delete device "${name}" from inventory?`)) {
      await deleteDeviceInventoryItem(id);
    }
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    if (activeTab === 'installations') {
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
        ]
      );
    } else if (activeTab === 'schedule') {
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
        ]
      );
    } else {
      exportToCSV(
        `ZanCRM_Device_Inventory_${todayStr}`,
        filteredInventory,
        [
          { key: 'deviceName', label: 'Device Name' },
          { key: 'category', label: 'Category' },
          { key: 'sku', label: 'SKU' },
          { key: 'requiredQty', label: 'Required Qty' },
          { key: 'availableQty', label: 'Available Qty' },
          { key: 'allocatedQty', label: 'Allocated Qty' },
          { key: 'unit', label: 'Unit' },
        ]
      );
    }
  };

  // Helper Badge Colors for Status
  const getInstallationStatusBadge = (status: InstallationStatus) => {
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

  const getScheduleStatusBadge = (status: ScheduleStatus) => {
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

  // ==========================================
  // Table Columns Definition
  // ==========================================

  // 1. Installation Columns
  const installationColumns: Column<Installation>[] = [
    {
      key: 'customer',
      header: 'Customer',
      render: item => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
            {item.customerName.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 truncate flex items-center gap-1.5">
              <span>{item.customerName}</span>
              {item.customerId && (
                <Link
                  to="/contacts"
                  title="View Client Details"
                  className="text-slate-400 hover:text-brand-600 transition-colors"
                >
                  <Users className="w-3 h-3" />
                </Link>
              )}
            </div>
            {item.dealTitle && (
              <div className="flex items-center gap-1 text-[11px] text-brand-600 truncate mt-0.5">
                <Briefcase className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.dealTitle}</span>
              </div>
            )}
            {item.siteAddress && (
              <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.siteAddress}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'bookingDate',
      header: 'Booking Date',
      render: item => (
        <div className="text-xs text-slate-600 font-medium">
          {formatDate(item.bookingDate)}
        </div>
      ),
    },
    {
      key: 'installationDate',
      header: 'Installation Date',
      render: item => {
        const isToday = item.installationDate === todayStr;
        return (
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                isToday ? 'text-brand-600 font-bold' : 'text-slate-800'
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
      header: 'Installer',
      render: item => (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
            {item.installer.charAt(0)}
          </div>
          <span className="text-xs font-medium text-slate-800">{item.installer}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: item => getInstallationStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: item => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              setEditingInstallation(item);
              setInstallationModalOpen(true);
            }}
            title="Edit Installation"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDeleteInstallation(item.id, item.customerName);
            }}
            title="Delete Installation"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // 2. Schedule Columns
  const scheduleColumns: Column<InstallerScheduleItem>[] = [
    {
      key: 'installer',
      header: 'Installer',
      render: item => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0">
            {item.installer.charAt(0)}
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-900 block">{item.installer}</span>
            <span className="text-[11px] text-slate-400 block">{formatDate(item.visitDate)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'siteVisitTime',
      header: 'Site Visit Time',
      render: item => (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-semibold">
          <Clock className="w-3 h-3 text-brand-600 shrink-0" />
          <span>{item.siteVisitTime}</span>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: item => (
        <div className="min-w-0">
          <span className="font-semibold text-xs text-slate-900 block truncate">
            {item.customerName}
          </span>
          {item.siteAddress && (
            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate mt-0.5">
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
      render: item => getScheduleStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: item => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              setEditingSchedule(item);
              setScheduleModalOpen(true);
            }}
            title="Edit Schedule Slot"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDeleteSchedule(item.id, item.installer);
            }}
            title="Remove Slot"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  // 3. Device Inventory Columns
  const deviceColumns: Column<DeviceInventoryItem>[] = [
    {
      key: 'deviceName',
      header: 'Device Name',
      render: item => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-slate-900 block">{item.deviceName}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                {item.category}
              </span>
              {item.sku && (
                <span className="text-[11px] font-mono text-slate-500">
                  SKU: {item.sku}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'requiredQty',
      header: 'Required Qty',
      render: item => (
        <div className="text-xs font-semibold text-slate-700">
          <span className="font-mono text-sm">{item.requiredQty}</span>{' '}
          <span className="text-[10px] text-slate-400">{item.unit || 'units'}</span>
        </div>
      ),
    },
    {
      key: 'availableQty',
      header: 'Available Qty',
      render: item => {
        const isLow = item.availableQty <= item.requiredQty;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-sm font-bold ${
                isLow ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {item.availableQty}
            </span>
            <span className="text-[10px] text-slate-400">{item.unit || 'units'}</span>
            {isLow && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                Low
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'allocatedQty',
      header: 'Allocated Qty',
      render: item => {
        const total = item.availableQty + item.allocatedQty;
        const percent = total > 0 ? Math.round((item.allocatedQty / total) * 100) : 0;
        return (
          <div className="w-36">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-mono font-semibold text-slate-800">{item.allocatedQty}</span>
              <span className="text-[10px] text-slate-400">{percent}% allocated</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: item => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={e => {
              e.stopPropagation();
              setEditingDevice(item);
              setDeviceModalOpen(true);
            }}
            title="Edit Device"
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDeleteDevice(item.id, item.deviceName);
            }}
            title="Delete Device"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 border border-brand-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Operations
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage installations, installers, bookings, and devices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleExportCSV} icon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>

          {activeTab === 'installations' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingInstallation(null);
                setInstallationModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Schedule Installation
            </Button>
          )}

          {activeTab === 'schedule' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingSchedule(null);
                setScheduleModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Visit Slot
            </Button>
          )}

          {activeTab === 'inventory' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingDevice(null);
                setDeviceModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Device
            </Button>
          )}
        </div>
      </div>


      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => handleTabChange('installations')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'installations'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Installation List</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-600 font-semibold">
            {installations.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('schedule')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'schedule'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Installer Schedule</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-600 font-semibold">
            {installerSchedules.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('inventory')}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all ${
            activeTab === 'inventory'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Device Inventory</span>
          <span className="px-2 py-0.5 text-[11px] rounded-full bg-slate-100 text-slate-600 font-semibold">
            {deviceInventory.length}
          </span>
        </button>
      </div>

      {/* Main Section Content Card */}
      <Card>
        {/* Controls: Search, Filter & Sort */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1 max-w-md">
            <Input
              placeholder={
                activeTab === 'installations'
                  ? 'Search customer, installer, or address...'
                  : activeTab === 'schedule'
                  ? 'Search technician, time slot, or client...'
                  : 'Search device name, SKU, or category...'
              }
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filter & Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            {activeTab === 'installations' && (
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            )}

            {activeTab === 'schedule' && (
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="on_route">On Route</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="rescheduled">Rescheduled</option>
              </select>
            )}

            {activeTab === 'inventory' && (
              <select
                value={statusFilter}
                onChange={e => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                <option value="all">All Categories</option>
                <option value="Gateways">Gateways</option>
                <option value="Sensors">Sensors</option>
                <option value="Controllers">Controllers</option>
                <option value="Power & Energy">Power & Energy</option>
                <option value="Networking">Networking</option>
                <option value="Access Control">Access Control</option>
                <option value="Accessories">Accessories</option>
              </select>
            )}

            {/* Sorting Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 py-2 px-2.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            >
              {activeTab === 'inventory' ? (
                <>
                  <option value="qty-desc">Available Qty (High to Low)</option>
                  <option value="qty-asc">Available Qty (Low to High)</option>
                  <option value="req-desc">Required Qty (High to Low)</option>
                  <option value="name-asc">Device Name (A - Z)</option>
                </>
              ) : (
                <>
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="customer-asc">Customer (A - Z)</option>
                  <option value="installer-asc">Installer (A - Z)</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Section Table View */}
        {activeTab === 'installations' && (
          <Table<Installation>
            columns={installationColumns}
            data={paginatedInstallations}
            keyExtractor={item => item.id}
            isLoading={isLoading}
            emptyMessage={
              <div className="py-12 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {searchTerm || statusFilter !== 'all' ? 'No installations match filters' : 'No installations scheduled yet'}
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try clearing your search keyword or changing status filter.'
                    : 'Dispatch technicians and schedule customer hardware installations.'}
                </p>
                {!(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingInstallation(null);
                      setInstallationModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Schedule First Installation
                  </Button>
                )}
              </div>
            }
          />
        )}

        {activeTab === 'schedule' && (
          <Table<InstallerScheduleItem>
            columns={scheduleColumns}
            data={paginatedSchedules}
            keyExtractor={item => item.id}
            isLoading={isLoading}
            emptyMessage={
              <div className="py-12 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {searchTerm || statusFilter !== 'all' ? 'No schedule slots match filters' : 'No technician visits scheduled'}
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try clearing your search keyword or changing status filter.'
                    : 'Organize site appointment windows and installer routes.'}
                </p>
                {!(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingSchedule(null);
                      setScheduleModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add Visit Slot
                  </Button>
                )}
              </div>
            }
          />
        )}

        {activeTab === 'inventory' && (
          <Table<DeviceInventoryItem>
            columns={deviceColumns}
            data={paginatedInventory}
            keyExtractor={item => item.id}
            isLoading={isLoading}
            emptyMessage={
              <div className="py-12 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                  <Box className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {searchTerm || statusFilter !== 'all' ? 'No devices match filters' : 'No devices in inventory'}
                </p>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your category filter or search query.'
                    : 'Add devices, hubs, sensors, and gateway equipment to monitor stock.'}
                </p>
                {!(searchTerm || statusFilter !== 'all') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingDevice(null);
                      setDeviceModalOpen(true);
                    }}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add First Device
                  </Button>
                )}
              </div>
            }
          />
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={currentTotal}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </Card>

      {/* CRUD Modals */}
      <InstallationModalForm
        isOpen={installationModalOpen}
        onClose={() => setInstallationModalOpen(false)}
        onSubmit={handleSaveInstallation}
        initialData={editingInstallation}
      />

      <ScheduleModalForm
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSubmit={handleSaveSchedule}
        initialData={editingSchedule}
      />

      <DeviceModalForm
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        onSubmit={handleSaveDevice}
        initialData={editingDevice}
      />
    </div>
  );
};

export default OperationsPage;
