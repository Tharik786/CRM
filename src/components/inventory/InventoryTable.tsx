import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import { CrmStorage } from '../../api/storage';
import { Card, CardHeader, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import { DateRangePicker } from '../common/DateRangePicker';
import { exportToCSV } from '../../utils/formatters';
import {
  Disc,
  Layers,
  Trash2,
  Users,
  DoorClosed,
  Wind,
  Wifi,
  Droplets,
  Tag,
  MessageSquare,
  Monitor,
  Droplet,
  Package,
  Search,
  Filter,
  Truck,
  Warehouse,
  CalendarCheck,
  Download,
  X,
  Check,
  ExternalLink,
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

export type ViewTab = 'inventory' | 'us_office' | 'india' | 'workflow';

export interface InventoryTableProps {
  activeTab?: ViewTab;
  onTabChange?: (tab: ViewTab) => void;
}

const getDefaultScheduleDate = () =>
  new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

export const InventoryTable: React.FC<InventoryTableProps> = ({
  activeTab: controlledTab,
  onTabChange,
}) => {
  const {
    deviceStock,
    orders,
    companies,
    contacts,
    leads,
    quotations,
    dispatchWorkflow,
    receiveWorkflowInTransit,
    scheduleWorkflowInstallation,
    technicians,
    addTechnician,
    addToast,
    isLoading,
  } = useCrm();

  const [internalTab, setInternalTab] = useState<ViewTab>('inventory');
  const activeTab = controlledTab !== undefined ? controlledTab : internalTab;
  const setActiveTab = (tab: ViewTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const initialMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(initialMonthRange.start);
  const [endDate, setEndDate] = useState<string>(initialMonthRange.end);

  // === MODAL STATES ===
  // 1. Dispatch Modal (India Production -> In Transit)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchOrderId, setDispatchOrderId] = useState<string>('');
  const [dispatchDeviceKey, setDispatchDeviceKey] = useState<string>('');
  const [dispatchQuantity, setDispatchQuantity] = useState<number>(1);
  const [dispatchDate, setDispatchDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [dispatchCarrier, setDispatchCarrier] = useState<string>('DHL Express');
  const [dispatchLocation, setDispatchLocation] = useState<'India' | 'US Office'>('US Office');
  const [isDispatching, setIsDispatching] = useState(false);

  // 3. Schedule Installation Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleOrderId, setScheduleOrderId] = useState<string>('');
  const [scheduleInstaller, setScheduleInstaller] = useState<string>('');
  const [isAddingNewInstaller, setIsAddingNewInstaller] = useState<boolean>(false);
  const [newInstallerInput, setNewInstallerInput] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState<string>(getDefaultScheduleDate);
  const [scheduleAddress, setScheduleAddress] = useState<string>('');
  const [scheduleNotes, setScheduleNotes] = useState<string>('');
  const [scheduleTimeWindow, setScheduleTimeWindow] = useState<string>('10:00 AM - 12:00 PM');
  const [isScheduling, setIsScheduling] = useState(false);

  // Device Icon Mapping
  const getDeviceIcon = (key: string) => {
    switch (key) {
      case 'Wetness':
        return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
      case 'AirQuality':
      case 'air_quality':
        return <Wind className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Traffic':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'Trash':
      case 'trash':
        return <Trash2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'PaperTowel':
      case 'paper_towel':
        return <Layers className="w-3.5 h-3.5 text-cyan-600" />;
      case 'ToiletPaper':
      case 'toilet_paper':
        return <Disc className="w-3.5 h-3.5 text-brand-600" />;
      case 'Soap':
      case 'soap_dispenser':
        return <Droplet className="w-3.5 h-3.5 text-teal-500" />;
      case 'Stall':
      case 'stall':
        return <DoorClosed className="w-3.5 h-3.5 text-indigo-600" />;
      case 'Janitor Tag':
        return <Tag className="w-3.5 h-3.5 text-orange-500" />;
      case 'Feedback':
        return <MessageSquare className="w-3.5 h-3.5 text-rose-500" />;
      case 'OccupancyDisplay':
        return <Monitor className="w-3.5 h-3.5 text-violet-600" />;
      case 'Gateway':
      case 'gateway':
        return <Wifi className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-500" />;
    }
  };


  // Filtered devices for Tab 1: Device Inventory
  const filteredStock = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return deviceStock.filter(item => {
      const matchesSearch =
        !q ||
        item.deviceName.toLowerCase().includes(q) ||
        item.deviceDescription.toLowerCase().includes(q) ||
        (item.orderIds && item.orderIds.some(id => id.toLowerCase().includes(q)));

      let matchesDate = true;
      if (startDate || endDate) {
        const dStr = item.updatedAt ? item.updatedAt.substring(0, 10) : '';
        if (dStr) {
          if (startDate && dStr < startDate) matchesDate = false;
          if (endDate && dStr > endDate) matchesDate = false;
        }
      }
      return matchesSearch && matchesDate;
    });
  }, [deviceStock, searchQuery, startDate, endDate]);

  // Overall totals across all devices for Tab 1
  const overallTotals = useMemo(() => {
    return filteredStock.reduce(
      (acc, r) => {
        acc.required += r.required || 0;
        acc.production += r.indiaProduction || 0;
        acc.inTransit += r.inTransit || 0;
        acc.usWarehouse += r.usWarehouse || 0;
        acc.scheduled += r.scheduled || 0;
        acc.installed += r.installed || 0;
        return acc;
      },
      {
        required: 0,
        production: 0,
        inTransit: 0,
        usWarehouse: 0,
        scheduled: 0,
        installed: 0,
      }
    );
  }, [filteredStock]);

  // Order-wise items for Tab 2: Connected Workflow (One row per Order ID)
  const workflowRows = useMemo(() => {
    const seenOrderIds = new Set<string>();
    const q = searchQuery.toLowerCase().trim();

    return orders
      .filter(ord => {
        const ordIdStr = `${ord.orderPrefix || 'ORD-'}${ord.orderNumber}`;
        if (seenOrderIds.has(ordIdStr)) {
          return false;
        }
        seenOrderIds.add(ordIdStr);

        // Only show dispatched / active workflow orders in the Connected Workflow (not Pending dispatch with 0 activity)
        const totDispatched =
          ord.dispatched ||
          (ord.devices ? ord.devices.reduce((sum, d) => sum + (d.dispatched || 0), 0) : 0);
        const totInTransit =
          ord.inTransit ||
          (ord.devices ? ord.devices.reduce((sum, d) => sum + (d.inTransit || 0), 0) : 0);
        const totUSWarehouse =
          ord.usWarehouse ||
          (ord.devices ? ord.devices.reduce((sum, d) => sum + (d.usWarehouse || 0), 0) : 0);
        const totInstalled =
          ord.installed ||
          (ord.devices ? ord.devices.reduce((sum, d) => sum + (d.installed || 0), 0) : 0);

        if (
          ord.status === 'Pending dispatch' &&
          totDispatched === 0 &&
          totInTransit === 0 &&
          totUSWarehouse === 0 &&
          totInstalled === 0
        ) {
          return false;
        }

        const instId =
          ord.installationId ||
          (ord.devices && ord.devices.find(d => d.installationId)?.installationId) ||
          '';

        const matchesSearch =
          !q ||
          ordIdStr.toLowerCase().includes(q) ||
          ord.clientName.toLowerCase().includes(q) ||
          instId.toLowerCase().includes(q) ||
          (ord.devices &&
            ord.devices.some(
              d =>
                d.deviceName.toLowerCase().includes(q) ||
                d.deviceKey.toLowerCase().includes(q)
            ));

        let matchesDate = true;
        if (startDate || endDate) {
          const dStr = ord.createdAt ? ord.createdAt.substring(0, 10) : '';
          if (dStr) {
            if (startDate && dStr < startDate) matchesDate = false;
            if (endDate && dStr > endDate) matchesDate = false;
          }
        }
        return matchesSearch && matchesDate;
      })
      .map(ord => {
        const ordIdStr = `${ord.orderPrefix || 'ORD-'}${ord.orderNumber}`;
        const hasWorkflow = (ord.devices || []).some(
          d => (d.dispatched || 0) > 0 || (d.inTransit || 0) > 0 || (d.usWarehouse || 0) > 0
        );
        const displayedDevices = hasWorkflow
          ? (ord.devices || []).filter(d => (d.dispatched || 0) > 0 || (d.inTransit || 0) > 0 || (d.usWarehouse || 0) > 0)
          : (ord.devices || []);

        let required = 0, dispatched = 0, inTransit = 0, usWarehouse = 0, scheduled = 0, installed = 0;
        for (const d of displayedDevices) {
          required += hasWorkflow ? (d.dispatched || d.quantity || 0) : (d.quantity || 0);
          dispatched += d.dispatched || 0;
          inTransit += d.inTransit || 0;
          usWarehouse += d.usWarehouse || 0;
          scheduled += d.scheduled || 0;
          installed += d.installed || 0;
        }

        const instId =
          ord.installationId ||
          (ord.devices && ord.devices.find(d => d.installationId)?.installationId);

        return {
          orderId: ordIdStr,
          orderNumber: ord.orderNumber,
          clientId: ord.clientId,
          clientName: ord.clientName,
          location: ord.location,
          devices: displayedDevices.map(d => ({ ...d, quantity: hasWorkflow ? (d.dispatched || d.quantity) : d.quantity })),
          installationId: instId,
          required,
          dispatched,
          inTransit,
          usWarehouse,
          scheduled,
          installed,
          status: ord.status,
          createdAt: ord.createdAt,
        };
      });
  }, [orders, searchQuery, startDate, endDate]);

  const getClientLocationForOrder = (ord?: (typeof orders)[number]) => {
    if (!ord) return '';
    const clientName = (ord.clientName || '').trim().toLowerCase();
    const allLeads = CrmStorage.getAllLeadsRaw();
    const lead = allLeads.find(
      l =>
        (clientName && l.company && l.company.trim().toLowerCase() === clientName) ||
        (clientName && l.name && l.name.trim().toLowerCase() === clientName) ||
        (ord.clientId && l.id === ord.clientId) ||
        (ord.clientId && l.convertedContactId === ord.clientId)
    );
    const cont = contacts.find(
      c =>
        (ord.clientId && c.id === ord.clientId) ||
        (ord.clientId && c.companyId === ord.clientId) ||
        (clientName && c.companyName && c.companyName.trim().toLowerCase() === clientName) ||
        (clientName && c.name && c.name.trim().toLowerCase() === clientName)
    );
    const quote = quotations.find(
      q =>
        (clientName && q.companyName && q.companyName.trim().toLowerCase() === clientName) ||
        (clientName && q.contactName && q.contactName.trim().toLowerCase() === clientName)
    );
    const comp = companies.find(
      c => c.id === ord.clientId || (clientName && c.name.toLowerCase() === clientName)
    );

    const leadLoc = lead?.location ? `${lead.location}${lead.country ? `, ${lead.country}` : ''}` : lead?.location || '';
    const contLoc = cont?.location ? `${cont.location}${cont.country ? `, ${cont.country}` : ''}` : cont?.location || '';
    const quoteLoc = quote?.location ? `${quote.location}${quote.country ? `, ${quote.country}` : ''}` : quote?.location || '';
    const compLoc = comp?.city ? `${comp.city}${comp.country ? `, ${comp.country}` : ''}` : comp?.country || '';
    const ordLoc = ord.location && ord.location !== 'Main Facility' ? ord.location : '';

    return leadLoc || contLoc || quoteLoc || compLoc || ordLoc || '';
  };

  const getClientCountryForOrder = (
    ord?: { location?: string; clientName?: string; clientId?: string; country?: string } | (typeof orders)[number]
  ): 'India' | 'US Office' => {
    if (!ord) return 'US Office';

    const clientName = (ord.clientName || '').trim().toLowerCase();
    const clientId = ord.clientId;

    // 1. Check client's Enquiry (including raw leads from storage)
    const allLeads = CrmStorage.getAllLeadsRaw();
    const lead = allLeads.find(
      l =>
        (clientName && l.company && l.company.trim().toLowerCase() === clientName) ||
        (clientName && l.name && l.name.trim().toLowerCase() === clientName) ||
        (clientId && l.id === clientId) ||
        (clientId && l.convertedContactId === clientId)
    );
    const leadCountry = (lead?.country || '').trim().toLowerCase();
    if (leadCountry === 'india' || leadCountry.includes('india')) return 'India';
    if (leadCountry === 'usa' || leadCountry.includes('united states') || leadCountry === 'us') return 'US Office';

    // 2. Check client's Contact in Client Directory
    const cont = contacts.find(
      c =>
        (clientId && c.id === clientId) ||
        (clientId && c.companyId === clientId) ||
        (clientName && c.companyName && c.companyName.trim().toLowerCase() === clientName) ||
        (clientName && c.name && c.name.trim().toLowerCase() === clientName)
    );
    const contCountry = (cont?.country || '').trim().toLowerCase();
    if (contCountry === 'india' || contCountry.includes('india')) return 'India';
    if (contCountry === 'usa' || contCountry.includes('united states') || contCountry === 'us') return 'US Office';

    // 3. Check client's Quotation
    const quote = quotations.find(
      q =>
        (clientName && q.companyName && q.companyName.trim().toLowerCase() === clientName) ||
        (clientName && q.contactName && q.contactName.trim().toLowerCase() === clientName)
    );
    const quoteCountry = (quote?.country || '').trim().toLowerCase();
    if (quoteCountry === 'india' || quoteCountry.includes('india')) return 'India';
    if (quoteCountry === 'usa' || quoteCountry.includes('united states') || quoteCountry === 'us') return 'US Office';

    // 4. Check linked Company
    const comp = companies.find(
      c =>
        (clientId && c.id === clientId) ||
        (clientName && c.name && c.name.trim().toLowerCase() === clientName)
    );
    const compCountry = (comp?.country || '').trim().toLowerCase();
    if (compCountry.includes('india')) return 'India';
    if (compCountry.includes('united states') || compCountry.includes('usa')) return 'US Office';

    // 5. Check Indian location keywords across all records
    const leadLoc = (lead?.location || '').toLowerCase();
    const contLoc = (cont?.location || '').toLowerCase();
    const quoteLoc = (quote?.location || '').toLowerCase();
    const compCity = (comp?.city || '').toLowerCase();
    const directLoc = (ord.location || '').toLowerCase();

    const indianKeywords = [
      'india', 'tamilnadu', 'tamil nadu', 'karnataka', 'maharashtra', 'kerala',
      'andhra', 'telangana', 'gujarat', 'rajasthan', 'punjab', 'haryana',
      'uttar pradesh', 'madhya pradesh', 'bihar', 'bengal', 'odisha', 'delhi',
      'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata',
      'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'coimbatore', 'kochi',
      'trivandrum', 'thiruvananthapuram', 'madurai', 'trichy', 'salem', 'tiruppur',
      'noida', 'gurgaon', 'gurugram', 'chandigarh', 'indore', 'bhopal', 'nagpur'
    ];

    const combinedLoc = `${leadLoc} ${contLoc} ${quoteLoc} ${compCity} ${directLoc}`.toLowerCase();
    if (indianKeywords.some(keyword => combinedLoc.includes(keyword))) {
      return 'India';
    }

    // 6. Direct Order country (fallback)
    const directCountry = ((ord as any).country || '').trim().toLowerCase();
    if (directCountry === 'india' || directCountry.includes('india')) return 'India';
    if (directCountry === 'usa' || directCountry.includes('united states') || directCountry === 'us') return 'US Office';

    return 'US Office';
  };

  const isIndiaOrder = (ord: { location?: string; clientName?: string; clientId?: string; country?: string }) => {
    return getClientCountryForOrder(ord) === 'India';
  };

  const usOfficeRows = useMemo(() => {
    return workflowRows.filter(r => !isIndiaOrder(r));
  }, [workflowRows, companies, contacts, leads]);

  const indiaRows = useMemo(() => {
    return workflowRows.filter(r => isIndiaOrder(r));
  }, [workflowRows, companies, contacts, leads]);

  const currentWorkflowRows = activeTab === 'india' ? indiaRows : usOfficeRows;
  const currentOfficeTitle = activeTab === 'india' ? 'India' : 'US Office';

  // Handlers for Modals
  const handleOpenDispatchModal = (orderId?: string, deviceKey?: string) => {
    const chosenDeviceKey = deviceKey || (deviceStock.length > 0 ? deviceStock[0].deviceKey : '');
    const chosenOrderId = orderId || (orders.length > 0 ? `${orders[0].orderPrefix || 'ORD-'}${orders[0].orderNumber}` : '');
    setDispatchOrderId(chosenOrderId);
    setDispatchDeviceKey(chosenDeviceKey);
    setDispatchDate(new Date().toISOString().split('T')[0]);

    const devStock = deviceStock.find(d => d.deviceKey === chosenDeviceKey);
    const ord = orders.find(o => `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === chosenOrderId || o.id === chosenOrderId);
    const ordDev = ord?.devices?.find(d => d.deviceKey === chosenDeviceKey);
    const needed = ordDev ? Math.max(0, (ordDev.quantity || 0) - (ordDev.dispatched || 0)) : 0;
    const avail = devStock?.indiaProduction || 0;
    const maxAllowed = Math.min(needed, avail);
    setDispatchQuantity(maxAllowed > 0 ? maxAllowed : 0);
    setDispatchCarrier('DHL Express');

    // Preselect location: strictly based on the client country of the order
    if (ord) {
      setDispatchLocation(getClientCountryForOrder(ord));
    } else if (activeTab === 'india') {
      setDispatchLocation('India');
    } else {
      setDispatchLocation('US Office');
    }

    setDispatchModalOpen(true);
  };

  const selectedDispatchOrder = useMemo(() => {
    return orders.find(
      o => `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === dispatchOrderId || o.id === dispatchOrderId
    );
  }, [orders, dispatchOrderId]);

  useEffect(() => {
    if (selectedDispatchOrder && dispatchModalOpen) {
      setDispatchLocation(getClientCountryForOrder(selectedDispatchOrder));
    }
  }, [selectedDispatchOrder, dispatchModalOpen]);

  const selectedDispatchDevice = useMemo(() => {
    return deviceStock.find(d => d.deviceKey === dispatchDeviceKey);
  }, [deviceStock, dispatchDeviceKey]);

  const selectedOrderDeviceItem = useMemo(() => {
    return selectedDispatchOrder?.devices?.find(d => d.deviceKey === dispatchDeviceKey);
  }, [selectedDispatchOrder, dispatchDeviceKey]);

  const indiaStockForDispatch = selectedDispatchDevice?.indiaProduction || 0;
  const neededForDispatch = selectedOrderDeviceItem
    ? Math.max(0, (selectedOrderDeviceItem.quantity || 0) - (selectedOrderDeviceItem.dispatched || 0))
    : 0;
  const maxAllowedToDispatch = Math.min(indiaStockForDispatch, neededForDispatch);

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchOrderId || !dispatchDeviceKey) return;

    if (dispatchQuantity <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Dispatch quantity must be at least 1.',
      });
      return;
    }

    if (neededForDispatch <= 0) {
      addToast({
        type: 'error',
        title: 'Already Fully Dispatched',
        message: `All ordered units for ${selectedDispatchDevice?.deviceName || 'this device'} have already been dispatched.`,
      });
      return;
    }

    if (dispatchQuantity > neededForDispatch) {
      addToast({
        type: 'error',
        title: 'Exceeds Client Requirement',
        message: `Client only needs ${neededForDispatch} more unit(s) (ordered: ${selectedOrderDeviceItem?.quantity}, dispatched: ${selectedOrderDeviceItem?.dispatched || 0}). Cannot dispatch more than required.`,
      });
      return;
    }

    if (dispatchQuantity > indiaStockForDispatch) {
      addToast({
        type: 'error',
        title: 'Insufficient India Stock',
        message: `Only ${indiaStockForDispatch} unit(s) available in India production stock.`,
      });
      return;
    }

    setIsDispatching(true);
    try {
      await dispatchWorkflow(
        dispatchOrderId,
        dispatchDeviceKey,
        dispatchQuantity,
        dispatchCarrier,
        dispatchDate,
        dispatchLocation
      );
      setDispatchModalOpen(false);
      setActiveTab(dispatchLocation === 'India' ? 'india' : 'us_office');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Dispatch Failed',
        message: err?.message || 'Could not dispatch device.',
      });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleOpenScheduleModal = (orderId?: string, address?: string) => {
    const selectedId = orderId || (orders.length > 0 ? `${orders[0].orderPrefix || 'ORD-'}${orders[0].orderNumber}` : '');
    setScheduleOrderId(selectedId);
    const defaultTech = technicians && technicians.length > 0 ? technicians[0] : '';
    setScheduleInstaller(defaultTech);
    setIsAddingNewInstaller(false);
    setNewInstallerInput('');
    setScheduleDate(getDefaultScheduleDate());
    
    // Resolve client location address
    const foundOrd = orders.find(
      o => `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === selectedId || o.id === selectedId
    );
    const clientLoc = getClientLocationForOrder(foundOrd);
    setScheduleAddress(address && address !== 'Main Facility' ? address : (clientLoc || address || foundOrd?.location || ''));
    setScheduleNotes('');
    setScheduleTimeWindow('10:00 AM - 12:00 PM');
    setScheduleModalOpen(true);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleOrderId || !scheduleDate) return;

    const finalInstaller = isAddingNewInstaller ? newInstallerInput.trim() : scheduleInstaller;
    if (!finalInstaller) {
      addToast({
        type: 'error',
        title: 'Technician Required',
        message: 'Please choose or enter a technician name.',
      });
      return;
    }

    setIsScheduling(true);
    try {
      if (isAddingNewInstaller) {
        await addTechnician(finalInstaller);
      }
      await scheduleWorkflowInstallation(
        scheduleOrderId,
        finalInstaller,
        scheduleDate,
        scheduleAddress,
        scheduleNotes,
        scheduleTimeWindow
      );
      setScheduleModalOpen(false);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleQuickReceiveUS = async (orderId: string, deviceKey?: string) => {
    await receiveWorkflowInTransit(orderId, deviceKey);
  };

  const handleExportCSV = () => {
    const today = new Date().toISOString().split('T')[0];
    if (activeTab === 'inventory') {
      exportToCSV(
        `ZanCRM_Device_Inventory_${today}`,
        filteredStock,
        [
          { key: 'deviceName', label: 'Device Name' },
          { key: 'required', label: 'Required Qty' },
          { key: 'indiaProduction', label: 'India Production Stock' },
          { key: 'inTransit', label: 'In Transit' },
          { key: 'usWarehouse', label: 'US Warehouse' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'installed', label: 'Installed' },
        ]
      );
    } else {
      exportToCSV(
        `ZanCRM_${currentOfficeTitle.replace(' ', '_')}_Orders_${today}`,
        currentWorkflowRows.map(r => ({
          ...r,
          deviceSummary: (r.devices || []).map(d => `${d.deviceName} (${d.quantity})`).join(', '),
        })),
        [
          { key: 'orderId', label: 'Order ID' },
          { key: 'clientName', label: 'Client' },
          { key: 'deviceSummary', label: 'Devices' },
          { key: 'installationId', label: 'Installation ID' },
          { key: 'required', label: 'Required' },
          { key: 'inTransit', label: 'In Transit' },
          { key: 'usWarehouse', label: 'US Warehouse' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'installed', label: 'Installed' },
          { key: 'status', label: 'Status' },
        ]
      );
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-subtle overflow-hidden">
      {/* Card Header matching CRM Page Standards */}
      <CardHeader
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Simple Segmented View Tab Selector */}
            <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80">
              <button
                type="button"
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'inventory'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Device Stock Inventory
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('us_office')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'us_office' || activeTab === 'workflow'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                US Office ({usOfficeRows.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('india')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'india'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                India ({indiaRows.length})
              </button>
            </div>
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search device, order..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 h-7.5 w-36 sm:w-48"
              />
            </div>

            {/* Date Range Filter */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />

            {/* Export CSV */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              icon={<Download className="w-3.5 h-3.5" />}
              className="h-7.5 text-xs font-semibold px-2.5"
            >
              Export
            </Button>
          </div>
        }
        className="py-2.5 px-3.5 sm:px-4 bg-white border-b border-slate-100"
      />

      {/* Main Table Body */}
      <CardBody className="p-0">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand-600 border-t-transparent mb-1.5" />
            <p className="text-xs font-bold text-slate-700">Synchronizing inventory balances...</p>
          </div>
        ) : activeTab === 'inventory' ? (
          /* ========================================================================= */
          /* VIEW 1: DEVICE STOCK INVENTORY (Master Stock Table with Live Operations)   */
          /* ========================================================================= */
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-4 py-3 min-w-[220px]">Device</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">Production</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">In Transit</th>
                  <th className="px-3 py-3 text-center min-w-[110px]">US Warehouse</th>
                  <th className="px-3 py-3 text-center min-w-[100px]">Installed</th>
                  <th className="px-4 py-3 text-right pr-4 min-w-[140px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      <Filter className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">No matching devices found</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Try clearing your search query.</p>
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((row, idx) => {
                    const production = row.indiaProduction || 0;
                    const inTransit = row.inTransit || 0;
                    const usWarehouse = row.usWarehouse || 0;
                    const installed = row.installed || 0;
                    const orderIds = row.orderIds || [];

                    return (
                      <tr
                        key={row.deviceKey}
                        className={`transition-colors duration-150 hover:bg-slate-50/90 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}
                      >
                        {/* 1. Device: Name & Description */}
                        <td className="px-4 py-3 text-slate-800">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200/70 shrink-0">
                              {getDeviceIcon(row.deviceKey)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                                {row.deviceName}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                                {row.deviceDescription}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Production Stock */}
                        <td className="px-3 py-3 text-center text-xs font-semibold text-slate-800">
                          {production}
                        </td>

                        {/* 3. In Transit */}
                        <td className="px-3 py-3 text-center text-xs font-semibold text-slate-800">
                          {inTransit}
                        </td>

                        {/* 4. US Warehouse */}
                        <td className="px-3 py-3 text-center text-xs font-semibold text-slate-800">
                          {usWarehouse}
                        </td>

                        {/* 5. Installed */}
                        <td className="px-3 py-3 text-center text-xs font-semibold text-slate-800">
                          {installed}
                        </td>

                        {/* 6. Quick Actions: Dispatch or Completed status */}
                        <td className="px-4 py-3 text-right pr-4 whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 shrink-0">
                            {production > 0 ? (
                              // Still has production stock → can dispatch
                              <button
                                type="button"
                                onClick={() => {
                                  const targetOrd = orders.find(
                                    o => orderIds.includes(`${o.orderPrefix || 'ORD-'}${o.orderNumber}`) || orderIds.includes(o.id)
                                  ) || orders[0];
                                  const ordIdStr = targetOrd ? `${targetOrd.orderPrefix || 'ORD-'}${targetOrd.orderNumber}` : '';
                                  handleOpenDispatchModal(ordIdStr, row.deviceKey);
                                }}
                                title="Dispatch available production stock for this device"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-brand-600 hover:bg-brand-700 px-2.5 py-1 rounded-md shadow-2xs transition-all cursor-pointer shrink-0"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Dispatch</span>
                              </button>
                            ) : (inTransit > 0 || usWarehouse > 0 || installed > 0 || (row.dispatched || 0) > 0) ? (
                              // All production dispatched, items are moving through pipeline
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <Check className="w-3.5 h-3.5" />
                                <span>Dispatched</span>
                              </span>
                            ) : (
                              // Nothing dispatched and no stock → neutral
                              <span className="text-[11px] text-slate-300 font-normal pr-1">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Summary Footer */}
              {filteredStock.length > 0 && (
                <tfoot>
                  <tr className="bg-slate-100/90 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                          Totals
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({filteredStock.length})
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {overallTotals.production}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {overallTotals.inTransit}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {overallTotals.usWarehouse}
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-slate-800">
                      {overallTotals.installed}
                    </td>
                    <td className="px-4 py-3 text-right pr-4">
                      <span className="text-[10px] text-emerald-700 font-bold">
                        All balances synced
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: CONNECTED WORKFLOW (Order ID -> Devices -> Installation ID)       */
          /* ========================================================================= */
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="px-3 py-2.5 whitespace-nowrap w-[11%]">Order ID</th>
                  <th className="px-3 py-2.5 w-[18%]">Client & Location</th>
                  <th className="px-3 py-2.5 w-[18%]">Devices</th>
                  <th className="px-2.5 py-2.5 w-[13%]">Installation ID</th>
                  <th className="px-2 py-2.5 text-center whitespace-nowrap w-[10%]">Quantity</th>
                  <th className="px-2.5 py-2.5 text-center whitespace-nowrap w-[15%]">Status</th>
                  <th className="px-3 py-2.5 text-right whitespace-nowrap w-[15%] pr-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {currentWorkflowRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500">
                      <p className="text-xs font-semibold text-slate-700">
                        No client orders in {currentOfficeTitle} pipeline
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {activeTab === 'india'
                          ? 'Dispatch devices selecting India location to see orders here.'
                          : 'Create an order or dispatch selecting US Office to see it here.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  currentWorkflowRows.map((row, idx) => {
                    const isCompleted =
                      row.status === 'Completed' ||
                      (row.required > 0 && row.installed >= row.required);
                    const isInTransit =
                      !isCompleted &&
                      (row.status === 'Dispatched / In Transit' ||
                        (row.inTransit > 0 && !row.installationId));
                    const isScheduled =
                      !isCompleted &&
                      (row.status === 'Installation scheduled' ||
                        (!!row.installationId && !isInTransit) ||
                        row.scheduled > 0);
                    const isInWarehouse =
                      !isCompleted &&
                      !isScheduled &&
                      !isInTransit &&
                      (row.status === 'In US Warehouse' || row.usWarehouse > 0);

                    return (
                      <tr
                        key={row.orderId}
                        className={`transition-colors duration-150 hover:bg-slate-50/90 ${
                          idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                        }`}
                      >
                        {/* 1. Order ID */}
                        <td className="px-3 py-2.5 whitespace-nowrap align-middle">
                          <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 border border-slate-200/90 px-2 py-0.5 rounded">
                            {row.orderId}
                          </span>
                        </td>

                        {/* 2. Client & Location */}
                        <td className="px-3 py-2.5 align-middle">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 leading-tight">
                              {row.clientName}
                            </p>
                            <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                              {row.location}
                            </p>
                          </div>
                        </td>

                        {/* 3. Devices (Order-wise list of devices) */}
                        <td className="px-3 py-2.5 align-middle">
                          {row.devices && row.devices.length > 0 ? (
                            <div className="flex flex-col gap-1 py-0.5">
                              {row.devices.map((dev, dIdx) => (
                                <div key={dIdx} className="flex items-center gap-1.5 min-w-0">
                                  <span className="shrink-0">{getDeviceIcon(dev.deviceKey)}</span>
                                  <span className="font-semibold text-slate-800 text-xs">
                                    {dev.deviceName}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono font-medium shrink-0">
                                    × {dev.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No devices</span>
                          )}
                        </td>

                        {/* 4. Installation ID */}
                        <td className="px-2.5 py-2.5 align-middle">
                          {row.installationId ? (
                            <Link
                              to={`/installer-schedule?search=${encodeURIComponent(row.installationId)}`}
                              title={`View appointment for ${row.installationId} in Installer Schedule`}
                              className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 px-2 py-0.5 rounded transition-colors group cursor-pointer whitespace-nowrap"
                            >
                              <span>{row.installationId}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 shrink-0" />
                            </Link>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic whitespace-nowrap">Pending schedule</span>
                          )}
                        </td>

                        {/* 5. Quantity / Progress */}
                        <td className="px-2 py-2.5 text-center align-middle whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-900">
                              {row.installed > 0 ? `${row.installed} / ${row.required}` : row.required}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {row.installed >= row.required && row.required > 0 ? 'Installed' : 'Units'}
                            </span>
                          </div>
                        </td>

                        {/* 6. Status */}
                        <td className="px-2.5 py-2.5 text-center align-middle whitespace-nowrap">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isScheduled
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : isInTransit
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : isInWarehouse
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* 7. Contextual Workflow Action */}
                        <td className="px-3 py-2.5 text-right pr-3 whitespace-nowrap align-middle">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                              <Check className="w-3.5 h-3.5" />
                              <span>Completed</span>
                            </span>
                          ) : isScheduled ? (
                            <div className="flex items-center justify-end shrink-0">
                              <Link
                                to={`/installer-schedule?search=${encodeURIComponent(row.installationId || row.orderId)}`}
                                title="View in Installer Schedule"
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded-md transition-colors whitespace-nowrap"
                              >
                                <CalendarCheck className="w-3 h-3 shrink-0" />
                                <span>Schedule Slot</span>
                              </Link>
                            </div>
                          ) : isInWarehouse ? (
                            <button
                              type="button"
                              onClick={() => handleOpenScheduleModal(row.orderId, row.location)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <CalendarCheck className="w-3 h-3 shrink-0" />
                              <span>Schedule</span>
                            </button>
                          ) : isInTransit ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleQuickReceiveUS(row.orderId);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Warehouse className="w-3 h-3 shrink-0" />
                              <span>Receive {currentOfficeTitle === 'India' ? 'India' : 'US'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDispatchModal(
                                  row.orderId,
                                  row.devices?.[0]?.deviceKey
                                )
                              }
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                            >
                              <Truck className="w-3 h-3 shrink-0" />
                              <span>Dispatch</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>

      {/* ========================================================================= */}
      {/* MODAL: DISPATCH HARDWARE (India Production -> In Transit)                 */}
      {/* ========================================================================= */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-[460px] w-full p-4 sm:p-5 shadow-2xl border border-slate-200/90 my-auto">
            <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Dispatch {selectedDispatchDevice?.deviceName || 'Device'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  India stock: <span className="font-bold text-slate-800">{indiaStockForDispatch}</span>. Every dispatch must belong to an order.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="mt-3 space-y-2.5">
              {/* Field 1: Order ID */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Order ID
                </label>
                <select
                  value={dispatchOrderId}
                  onChange={e => {
                    const newOrderId = e.target.value;
                    setDispatchOrderId(newOrderId);
                    const ord = orders.find(
                      o => `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === newOrderId || o.id === newOrderId
                    );
                    if (ord) {
                      setDispatchLocation(getClientCountryForOrder(ord));
                      const dev = ord.devices.find(d => d.deviceKey === dispatchDeviceKey) || ord.devices[0];
                      if (dev) {
                        if (dev.deviceKey !== dispatchDeviceKey) {
                          setDispatchDeviceKey(dev.deviceKey);
                        }
                        const devStock = deviceStock.find(d => d.deviceKey === dev.deviceKey);
                        const availStock = devStock?.indiaProduction || 0;
                        const needed = Math.max(0, (dev.quantity || 0) - (dev.dispatched || 0));
                        const maxAllowed = Math.min(availStock, needed);
                        setDispatchQuantity(maxAllowed > 0 ? maxAllowed : 0);
                      }
                    }
                  }}
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {orders.map(o => {
                    const ordDev = o.devices.find(d => d.deviceKey === dispatchDeviceKey);
                    const needed = ordDev
                      ? Math.max(0, (ordDev.quantity || 0) - (ordDev.dispatched || 0))
                      : o.totalRequired;
                    return (
                      <option
                        key={o.id}
                        value={`${o.orderPrefix || 'ORD-'}${o.orderNumber}`}
                      >
                        {o.orderPrefix || 'ORD-'}{o.orderNumber} · {o.clientName} (needs {needed})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Field 2: Client name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Client name
                </label>
                <input
                  type="text"
                  disabled
                  readOnly
                  value={selectedDispatchOrder?.clientName || ''}
                  className="w-full h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 cursor-not-allowed"
                />
              </div>

              {/* Field 3: Location (India / US Office) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Location (India / US Office)
                </label>
                <select
                  value={dispatchLocation}
                  onChange={e => setDispatchLocation(e.target.value as 'India' | 'US Office')}
                  className="w-full h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="India">India</option>
                  <option value="US Office">US Office</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Selected based on client country ({getClientCountryForOrder(selectedDispatchOrder)}{getClientLocationForOrder(selectedDispatchOrder) ? ` · ${getClientLocationForOrder(selectedDispatchOrder)}` : ''}).
                </p>
              </div>

              {/* Fields: Quantity & Dispatch date side-by-side */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Quantity to dispatch
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={maxAllowedToDispatch > 0 ? maxAllowedToDispatch : 1}
                    disabled={maxAllowedToDispatch <= 0}
                    value={dispatchQuantity}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val)) {
                        setDispatchQuantity(0);
                        return;
                      }
                      const clamped = maxAllowedToDispatch > 0 ? Math.min(Math.max(1, val), maxAllowedToDispatch) : val;
                      setDispatchQuantity(clamped);
                    }}
                    className="w-full h-8 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                  {neededForDispatch === 0 ? (
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
                      ✓ Requirement met ({selectedOrderDeviceItem?.quantity}/{selectedOrderDeviceItem?.quantity} dispatched)
                    </p>
                  ) : indiaStockForDispatch <= 0 ? (
                    <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                      India stock is 0
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate" title={`Max allowed: ${maxAllowedToDispatch} (Client needs: ${neededForDispatch}, India stock: ${indiaStockForDispatch})`}>
                      Max allowed: <span className="font-bold text-slate-800">{maxAllowedToDispatch}</span> (Needs {neededForDispatch}, Stock: {indiaStockForDispatch})
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                    Dispatch date
                  </label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={e => setDispatchDate(e.target.value)}
                    className="w-full h-8 rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDispatchModalOpen(false)}
                  className="h-7.5 text-xs px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isDispatching || maxAllowedToDispatch <= 0 || dispatchQuantity <= 0 || dispatchQuantity > maxAllowedToDispatch}
                  isLoading={isDispatching}
                  className="h-7.5 bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm dispatch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: SCHEDULE INSTALLATION (US Warehouse -> Scheduled)                */}
      {/* ========================================================================= */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Schedule Hardware Installation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link Order to an Installation ID.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Order ID
                </label>
                <select
                  value={scheduleOrderId}
                  onChange={e => {
                    const newOrdId = e.target.value;
                    setScheduleOrderId(newOrdId);
                    const ord = orders.find(
                      o => `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === newOrdId || o.id === newOrdId
                    );
                    const clientLoc = getClientLocationForOrder(ord);
                    if (clientLoc) {
                      setScheduleAddress(clientLoc);
                    }
                  }}
                  className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                >
                  {orders.map(o => (
                    <option
                      key={o.id}
                      value={`${o.orderPrefix || 'ORD-'}${o.orderNumber}`}
                    >
                      {o.orderPrefix || 'ORD-'}
                      {o.orderNumber} · {o.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Technician / Installer
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingNewInstaller(!isAddingNewInstaller);
                        setNewInstallerInput('');
                      }}
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline cursor-pointer"
                    >
                      {isAddingNewInstaller ? 'Choose Existing' : '+ Add New'}
                    </button>
                  </div>
                  {isAddingNewInstaller ? (
                    <input
                      type="text"
                      placeholder="Enter new technician name..."
                      value={newInstallerInput}
                      onChange={e => setNewInstallerInput(e.target.value)}
                      className="w-full h-9 rounded-lg border border-brand-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={scheduleInstaller}
                      onChange={e => {
                        if (e.target.value === '__add_new__') {
                          setIsAddingNewInstaller(true);
                          setNewInstallerInput('');
                        } else {
                          setScheduleInstaller(e.target.value);
                        }
                      }}
                      className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                    >
                      <option value="" disabled>-- Select technician --</option>
                      {(technicians || []).map(tech => (
                        <option key={tech} value={tech}>
                          {tech}
                        </option>
                      ))}
                      <option value="__add_new__">+ Add New Technician...</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Installation Date
                  </label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Time slot & Site Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Visit Time Window
                  </label>
                  <select
                    value={scheduleTimeWindow}
                    onChange={e => setScheduleTimeWindow(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="09:00 AM - 11:30 AM">09:00 AM - 11:30 AM (Morning)</option>
                    <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM (Mid-Day)</option>
                    <option value="01:00 PM - 03:30 PM">01:00 PM - 03:30 PM (Afternoon)</option>
                    <option value="03:30 PM - 06:00 PM">03:30 PM - 06:00 PM (Evening)</option>
                    <option value="Full Day (09:00 AM - 05:00 PM)">Full Day (09:00 - 17:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Site Address
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Building 4, Seattle, WA"
                    value={scheduleAddress}
                    onChange={e => setScheduleAddress(e.target.value)}
                    className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScheduleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isScheduling}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4"
                >
                  Confirm Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </Card>
  );
};

export default InventoryTable;
