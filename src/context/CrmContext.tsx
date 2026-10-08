import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Lead,
  Deal,
  Contact,
  Company,
  Quotation,
  Task,
  Activity,
  WorkspaceSettings,
  DealStage,
  QuotationStatus,
  Installation,
  InstallerScheduleItem,
  DeviceInventoryItem,
  ClientDeviceRequirement,
  DeviceStockItem,
  StockActionType,
  ClientOrderRecord,
} from '../types/crm';
import { crmService } from '../api/services/crmService';
import { CrmStorage } from '../api/storage';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface CrmContextType {
  leads: Lead[];
  deals: Deal[];
  contacts: Contact[];
  companies: Company[];
  quotations: Quotation[];
  tasks: Task[];
  activities: Activity[];
  settings: WorkspaceSettings | null;
  isLoading: boolean;
  refreshAll: () => Promise<void>;

  // Leads
  createLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Lead>;
  updateLead: (id: string, lead: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  convertLead: (id: string) => Promise<{ deal: Deal; contact: Contact }>;

  // Deals
  createDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Deal>;
  updateDeal: (id: string, deal: Partial<Deal>) => Promise<Deal>;
  updateDealStage: (id: string, stage: DealStage) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;

  // Contacts & Companies
  createContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>) => Promise<Contact>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  createCompany: (company: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalRevenue'>) => Promise<Company>;
  updateCompany: (id: string, company: Partial<Company>) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;

  // Quotations
  createQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>) => Promise<Quotation>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<Quotation>;
  updateQuotationStatus: (id: string, status: QuotationStatus) => Promise<Quotation>;
  deleteQuotation: (id: string) => Promise<void>;

  // Tasks
  createTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  toggleTask: (id: string) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;

  // Activities
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'performedBy' | 'performedById'>) => Promise<Activity>;

  // Settings
  updateSettings: (settings: WorkspaceSettings) => Promise<WorkspaceSettings>;
  resetDatabase: () => Promise<void>;
  loadMockData: () => Promise<void>;

  // Global Search & Filter
  globalSearch: (query: string) => {
    deals: Deal[];
    leads: Lead[];
    contacts: Contact[];
    companies: Company[];
  };

  // Operations
  installations: Installation[];
  installerSchedules: InstallerScheduleItem[];
  deviceInventory: DeviceInventoryItem[];
  createInstallation: (data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Installation>;
  updateInstallation: (id: string, data: Partial<Installation>) => Promise<Installation>;
  deleteInstallation: (id: string) => Promise<void>;
  createInstallerSchedule: (data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InstallerScheduleItem>;
  updateInstallerSchedule: (id: string, data: Partial<InstallerScheduleItem>) => Promise<InstallerScheduleItem>;
  deleteInstallerSchedule: (id: string) => Promise<void>;
  createDeviceInventoryItem: (data: Omit<DeviceInventoryItem, 'id' | 'updatedAt'>) => Promise<DeviceInventoryItem>;
  updateDeviceInventoryItem: (id: string, data: Partial<DeviceInventoryItem>) => Promise<DeviceInventoryItem>;
  deleteDeviceInventoryItem: (id: string) => Promise<void>;

  // Client Requirements
  clientRequirements: Record<string, ClientDeviceRequirement[]>;
  getClientRequirements: (clientId: string) => Promise<ClientDeviceRequirement[]>;
  saveClientRequirements: (clientId: string, requirements: ClientDeviceRequirement[]) => Promise<ClientDeviceRequirement[]>;
  updateClientRequirement: (clientId: string, deviceKey: string, required: number) => Promise<void>;

  // Device Stock Inventory
  deviceStock: DeviceStockItem[];
  recordStockAction: (deviceKey: string, action: StockActionType, quantity: number) => Promise<DeviceStockItem>;
  refreshDeviceStock: () => Promise<void>;

  // === CONNECTED OPERATIONS WORKFLOW (Order ID -> Device -> Installation ID) ===
  orders: ClientOrderRecord[];
  createOrder: (order: ClientOrderRecord) => Promise<ClientOrderRecord>;
  deleteOrder: (id: string) => Promise<void>;
  dispatchWorkflow: (
    orderId: string,
    deviceKey: string,
    quantity: number,
    carrier?: string,
    dispatchDate?: string,
    location?: string
  ) => Promise<{ order: ClientOrderRecord }>;
  receiveWorkflowInTransit: (
    identifier: string,
    deviceKey?: string,
    quantity?: number
  ) => Promise<{ receivedQuantity: number; order?: ClientOrderRecord }>;
  scheduleWorkflowInstallation: (
    orderId: string,
    installer: string,
    date: string,
    siteAddress?: string,
    notes?: string,
    siteVisitTime?: string
  ) => Promise<{ installation: Installation; order: ClientOrderRecord; schedule: InstallerScheduleItem }>;
  completeWorkflowInstallation: (
    installationId: string,
    actualInstalledCount?: number
  ) => Promise<{ installation: Installation; order?: ClientOrderRecord; schedule?: InstallerScheduleItem }>;
  adjustProductionStock: (deviceKey: string, newStock: number) => Promise<DeviceStockItem>;

  // Technicians / Installers
  technicians: string[];
  addTechnician: (name: string) => Promise<string[]>;

  // Toast
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [installerSchedules, setInstallerSchedules] = useState<InstallerScheduleItem[]>([]);
  const [deviceInventory, setDeviceInventory] = useState<DeviceInventoryItem[]>([]);
  const [deviceStock, setDeviceStock] = useState<DeviceStockItem[]>([]);
  const [clientRequirements, setClientRequirements] = useState<Record<string, ClientDeviceRequirement[]>>({});
  const [orders, setOrders] = useState<ClientOrderRecord[]>([]);
  const [technicians, setTechnicians] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        fetchedLeads,
        fetchedDeals,
        fetchedContacts,
        fetchedCompanies,
        fetchedQuotes,
        fetchedTasks,
        fetchedActs,
        fetchedSettings,
        fetchedInst,
        fetchedSch,
        fetchedDev,
        fetchedReqs,
        fetchedStock,
        fetchedOrders,
        fetchedTechs,
      ] = await Promise.all([
        crmService.getLeads(),
        crmService.getDeals(),
        crmService.getContacts(),
        crmService.getCompanies(),
        crmService.getQuotations(),
        crmService.getTasks(),
        crmService.getActivities(),
        crmService.getSettings(),
        crmService.getInstallations(),
        crmService.getInstallerSchedules(),
        crmService.getDeviceInventory(),
        crmService.getClientRequirementsMap(),
        crmService.getDeviceStock(),
        crmService.getOrders(),
        crmService.getTechnicians(),
      ]);

      setLeads(fetchedLeads);
      setDeals(fetchedDeals);
      setContacts(fetchedContacts);
      setCompanies(fetchedCompanies);
      setQuotations(fetchedQuotes);
      setTasks(fetchedTasks);
      setActivities(fetchedActs);
      setSettings(fetchedSettings);
      setInstallations(fetchedInst);
      setInstallerSchedules(fetchedSch);
      setDeviceInventory(fetchedDev);
      setClientRequirements(fetchedReqs);
      setDeviceStock(fetchedStock);
      setOrders(fetchedOrders);
      setTechnicians(fetchedTechs);
    } catch (err) {
      console.error('Error fetching CRM data:', err);
      addToast({
        type: 'error',
        title: 'Network Error',
        message: 'Could not fetch CRM records. Please verify connection.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    CrmStorage.init();
    refreshAll();
  }, [refreshAll]);

  // Lead Handlers
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createLead(leadData);
    if (leadData.status === 'converted') {
      setLeads(prev => prev.filter(l => l.id !== res.id));
      addToast({
        type: 'success',
        title: 'Enquiry Converted to Client!',
        message: `${res.name} (${res.company}) moved to Client Directory.`,
      });
    } else {
      setLeads(prev => [res, ...prev]);
      addToast({ type: 'success', title: 'Enquiry Created', message: `${res.name} added to enquiries.` });
    }
    await refreshAll();
    return res;
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    const res = await crmService.updateLead(id, leadData);
    if (leadData.status === 'converted') {
      setLeads(prev => prev.filter(l => l.id !== id));
      addToast({
        type: 'success',
        title: 'Enquiry Converted to Client!',
        message: `${res.name} (${res.company}) moved to Client Directory.`,
      });
    } else {
      setLeads(prev => prev.map(l => (l.id === id ? res : l)));
      addToast({ type: 'success', title: 'Enquiry Updated', message: `Changes saved for ${res.name}.` });
    }
    await refreshAll();
    return res;
  };

  const deleteLead = async (id: string) => {
    await crmService.deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    addToast({ type: 'info', title: 'Lead Deleted', message: 'Lead record removed.' });
  };

  const convertLead = async (id: string) => {
    const res = await crmService.convertLeadToDeal(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    addToast({
      type: 'success',
      title: 'Enquiry Converted to Client!',
      message: `${res.contact.name} (${res.contact.companyName}) has been moved to the Client Directory.`,
    });
    await refreshAll();
    return res;
  };

  // Deal Handlers
  const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createDeal(dealData);
    setDeals(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Deal Created', message: `Deal "${res.title}" added to pipeline.` });
    await refreshAll();
    return res;
  };

  const updateDeal = async (id: string, dealData: Partial<Deal>) => {
    const res = await crmService.updateDeal(id, dealData);
    setDeals(prev => prev.map(d => (d.id === id ? res : d)));
    addToast({ type: 'success', title: 'Deal Updated', message: `Updated details for ${res.title}.` });
    await refreshAll();
    return res;
  };

  const updateDealStage = async (id: string, stage: DealStage) => {
    // Optimistic UI update
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, stage } : d)));
    try {
      const res = await crmService.updateDealStage(id, stage);
      setDeals(prev => prev.map(d => (d.id === id ? res : d)));

      addToast({
        type: 'success',
        title: 'Stage Shifted',
        message: `Deal moved to ${stage.replace('_', ' ').toUpperCase()}`,
      });
      await refreshAll();
      return res;
    } catch (err) {
      await refreshAll();
      throw err;
    }
  };

  const deleteDeal = async (id: string) => {
    await crmService.deleteDeal(id);
    setDeals(prev => prev.filter(d => d.id !== id));
    addToast({ type: 'info', title: 'Deal Deleted', message: 'Deal removed from pipeline.' });
    await refreshAll();
  };

  // Contacts & Companies
  const createContact = async (data: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>) => {
    const res = await crmService.createContact(data);
    setContacts(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Contact Added', message: `${res.name} added to records.` });
    await refreshAll();
    return res;
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    const res = await crmService.updateContact(id, data);
    setContacts(prev => prev.map(c => (c.id === id ? res : c)));
    addToast({ type: 'success', title: 'Contact Updated', message: `Profile updated for ${res.name}.` });
    await refreshAll();
    return res;
  };

  const deleteContact = async (id: string) => {
    await crmService.deleteContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
    addToast({ type: 'info', title: 'Contact Removed' });
    await refreshAll();
  };

  const createCompany = async (data: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalRevenue'>) => {
    const res = await crmService.createCompany(data);
    setCompanies(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Company Added', message: `${res.name} registered.` });
    await refreshAll();
    return res;
  };

  const updateCompany = async (id: string, data: Partial<Company>) => {
    const res = await crmService.updateCompany(id, data);
    setCompanies(prev => prev.map(c => (c.id === id ? res : c)));
    addToast({ type: 'success', title: 'Company Updated' });
    return res;
  };

  const deleteCompany = async (id: string) => {
    await crmService.deleteCompany(id);
    setCompanies(prev => prev.filter(c => c.id !== id));
    addToast({ type: 'info', title: 'Company Removed' });
  };

  // Quotations
  const createQuotation = async (data: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>) => {
    const res = await crmService.createQuotation(data);
    setQuotations(prev => [res, ...prev]);
    if (res.status === 'accepted') {
      addToast({
        type: 'success',
        title: 'Quotation Accepted & Converted',
        message: `${res.companyName} added to Client Directory!`,
      });
    } else {
      addToast({ type: 'success', title: 'Quotation Generated', message: `${res.quoteNumber} created.` });
    }
    await refreshAll();
    return res;
  };

  const updateQuotation = async (id: string, data: Partial<Quotation>) => {
    const res = await crmService.updateQuotation(id, data);
    setQuotations(prev => prev.map(q => (q.id === id ? res : q)));
    if (res.status === 'accepted') {
      addToast({
        type: 'success',
        title: 'Quotation Accepted & Converted',
        message: `${res.companyName} converted to Client in Client Directory!`,
      });
    } else if (res.status === 'declined') {
      addToast({
        type: 'info',
        title: 'Quotation Declined',
        message: `Enquiry for ${res.companyName} marked as Lost.`,
      });
    } else if (res.status === 'expired') {
      addToast({
        type: 'info',
        title: 'Quotation Expired',
        message: `Enquiry for ${res.companyName} marked as No Response.`,
      });
    } else {
      addToast({ type: 'success', title: 'Quotation Updated', message: `${res.quoteNumber} updated successfully.` });
    }
    await refreshAll();
    return res;
  };

  const updateQuotationStatus = async (id: string, status: QuotationStatus) => {
    const res = await crmService.updateQuotationStatus(id, status);
    setQuotations(prev => prev.map(q => (q.id === id ? res : q)));
    if (status === 'accepted') {
      addToast({
        type: 'success',
        title: 'Quotation Accepted & Converted',
        message: `${res.companyName} converted to Client in Client Directory!`,
      });
    } else if (status === 'declined') {
      addToast({
        type: 'info',
        title: 'Quotation Declined',
        message: `Enquiry for ${res.companyName} marked as Lost.`,
      });
    } else if (status === 'expired') {
      addToast({
        type: 'info',
        title: 'Quotation Expired',
        message: `Enquiry for ${res.companyName} marked as No Response.`,
      });
    } else {
      addToast({ type: 'success', title: 'Status Updated', message: `Quote marked as ${status}.` });
    }
    await refreshAll();
    return res;
  };

  const deleteQuotation = async (id: string) => {
    await crmService.deleteQuotation(id);
    setQuotations(prev => prev.filter(q => q.id !== id));
    addToast({ type: 'info', title: 'Quotation Removed' });
  };

  // Tasks
  const createTask = async (data: Omit<Task, 'id' | 'createdAt'>) => {
    const res = await crmService.createTask(data);
    setTasks(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Task Scheduled', message: res.title });
    return res;
  };

  const toggleTask = async (id: string) => {
    const res = await crmService.toggleTaskStatus(id);
    setTasks(prev => prev.map(t => (t.id === id ? res : t)));
    addToast({
      type: 'info',
      title: res.status === 'completed' ? 'Task Completed' : 'Task Reopened',
      message: res.title,
    });
    return res;
  };

  const deleteTask = async (id: string) => {
    await crmService.deleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast({ type: 'info', title: 'Task Deleted' });
  };

  // Activities
  const addActivity = async (data: Omit<Activity, 'id' | 'timestamp' | 'performedBy' | 'performedById'>) => {
    const res = await crmService.createActivity(data);
    setActivities(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Activity Logged', message: res.title });
    return res;
  };

  // Settings
  const updateSettings = async (data: WorkspaceSettings) => {
    const res = await crmService.updateSettings(data);
    setSettings(res);
    addToast({ type: 'success', title: 'Settings Saved', message: 'Workspace preferences updated.' });
    return res;
  };

  const resetDatabase = async () => {
    await crmService.clearAllData();
    await refreshAll();
    addToast({ type: 'info', title: 'Data Cleared', message: 'All CRM records have been cleared to an empty clean state.' });
  };

  const loadMockData = async () => {
    await crmService.clearAllData();
    await refreshAll();
    addToast({ type: 'info', title: 'Data Cleared', message: 'All CRM records cleared.' });
  };

  // Operations Handlers
  const createInstallation = async (data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createInstallation(data);
    setInstallations(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Installation Scheduled', message: `Job for ${res.customerName} assigned to ${res.installer}.` });
    refreshAll();
    return res;
  };

  const updateInstallation = async (id: string, data: Partial<Installation>) => {
    const res = await crmService.updateInstallation(id, data);
    setInstallations(prev => prev.map(i => (i.id === id ? res : i)));
    addToast({ type: 'success', title: 'Installation Updated', message: `Job for ${res.customerName} updated.` });
    return res;
  };

  const deleteInstallation = async (id: string) => {
    await crmService.deleteInstallation(id);
    setInstallations(prev => prev.filter(i => i.id !== id));
    addToast({ type: 'info', title: 'Installation Removed' });
  };

  const createInstallerSchedule = async (data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createInstallerSchedule(data);
    setInstallerSchedules(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Schedule Added', message: `Visit for ${res.installer} booked.` });
    return res;
  };

  const updateInstallerSchedule = async (id: string, data: Partial<InstallerScheduleItem>) => {
    const res = await crmService.updateInstallerSchedule(id, data);
    setInstallerSchedules(prev => prev.map(s => (s.id === id ? res : s)));
    addToast({ type: 'success', title: 'Schedule Updated', message: `Visit for ${res.installer} updated.` });
    return res;
  };

  const deleteInstallerSchedule = async (id: string) => {
    await crmService.deleteInstallerSchedule(id);
    setInstallerSchedules(prev => prev.filter(s => s.id !== id));
    addToast({ type: 'info', title: 'Schedule Slot Removed' });
  };

  const createDeviceInventoryItem = async (data: Omit<DeviceInventoryItem, 'id' | 'updatedAt'>) => {
    const res = await crmService.createDeviceInventoryItem(data);
    setDeviceInventory(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Device Added', message: `${res.deviceName} added to inventory.` });
    return res;
  };

  const updateDeviceInventoryItem = async (id: string, data: Partial<DeviceInventoryItem>) => {
    const res = await crmService.updateDeviceInventoryItem(id, data);
    setDeviceInventory(prev => prev.map(d => (d.id === id ? res : d)));
    addToast({ type: 'success', title: 'Device Updated', message: `${res.deviceName} inventory updated.` });
    return res;
  };

  const deleteDeviceInventoryItem = async (id: string) => {
    await crmService.deleteDeviceInventoryItem(id);
    setDeviceInventory(prev => prev.filter(d => d.id !== id));
    addToast({ type: 'info', title: 'Device Removed' });
  };

  // Client Requirements
  const getClientRequirements = async (clientId: string): Promise<ClientDeviceRequirement[]> => {
    if (clientRequirements[clientId] && clientRequirements[clientId].length > 0) {
      return clientRequirements[clientId];
    }
    const reqs = await crmService.getClientRequirements(clientId);
    setClientRequirements(prev => ({ ...prev, [clientId]: reqs }));
    return reqs;
  };

  const saveClientRequirements = async (
    clientId: string,
    requirements: ClientDeviceRequirement[]
  ): Promise<ClientDeviceRequirement[]> => {
    const updated = await crmService.saveClientRequirements(clientId, requirements);
    setClientRequirements(prev => ({ ...prev, [clientId]: updated }));
    crmService.getDeviceStock().then(setDeviceStock).catch(() => { });
    return updated;
  };

  const updateClientRequirement = async (clientId: string, deviceKey: string, required: number) => {
    const updated = await crmService.updateClientRequirement(clientId, deviceKey, required);
    setClientRequirements(prev => ({ ...prev, [clientId]: updated }));
    crmService.getDeviceStock().then(setDeviceStock).catch(() => { });
  };

  // Device Stock Inventory Actions
  const refreshDeviceStock = useCallback(async () => {
    try {
      const stock = await crmService.getDeviceStock();
      setDeviceStock(stock);
    } catch (err) {
      console.error('Failed to refresh device stock:', err);
    }
  }, []);

  const recordStockAction = async (
    deviceKey: string,
    action: StockActionType,
    quantity: number
  ): Promise<DeviceStockItem> => {
    const { updatedItem, allStock } = await crmService.recordStockAction(deviceKey, action, quantity);
    setDeviceStock(allStock);
    // If India Production changed, update client requirements map in state
    if (action === 'production_ready' || action === 'shipped_to_us') {
      const updatedReqMap = await crmService.getClientRequirementsMap();
      setClientRequirements(updatedReqMap);
    }
    crmService.getActivities().then(setActivities).catch(() => { });
    return updatedItem;
  };

  // === OPERATIONS WORKFLOW HANDLERS ===
  const createOrder = async (order: ClientOrderRecord): Promise<ClientOrderRecord> => {
    const res = await crmService.saveOrder(order);
    const [updatedOrders, updatedStock] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    addToast({
      type: 'success',
      title: 'Order Created',
      message: `Order ${order.orderPrefix || 'ORD-'}${order.orderNumber} added. Device inventory required quantities updated.`,
    });
    return res;
  };

  const deleteOrder = async (id: string): Promise<void> => {
    await crmService.deleteOrder(id);
    const [updatedOrders, updatedStock] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    addToast({
      type: 'info',
      title: 'Order Removed',
      message: 'Order and associated inventory allocations removed.',
    });
  };

  const adjustProductionStock = async (deviceKey: string, newStock: number): Promise<DeviceStockItem> => {
    const updated = await crmService.adjustProductionStock(deviceKey, newStock);
    const updatedStock = await crmService.getDeviceStock();
    setDeviceStock(updatedStock);
    addToast({
      type: 'success',
      title: 'Production Stock Updated',
      message: `${updated.deviceName} India production stock set to ${newStock} units.`,
    });
    return updated;
  };

  const dispatchWorkflow = async (
    orderId: string,
    deviceKey: string,
    quantity: number,
    carrier?: string,
    dispatchDate?: string,
    location?: string
  ): Promise<{ order: ClientOrderRecord }> => {
    const result = await crmService.dispatchWorkflow(orderId, deviceKey, quantity, carrier, dispatchDate, location);
    const [updatedOrders, updatedStock] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    addToast({
      type: 'success',
      title: 'Dispatched to In-Transit',
      message: `${quantity} units dispatched. Production Stock decreased, In Transit increased.`,
    });
    return result;
  };

  const receiveWorkflowInTransit = async (
    identifier: string,
    deviceKey?: string,
    quantity?: number
  ): Promise<{ receivedQuantity: number; order?: ClientOrderRecord }> => {
    const result = await crmService.receiveWorkflowInTransit(identifier, deviceKey, quantity);
    const [updatedOrders, updatedStock] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    addToast({
      type: 'success',
      title: 'Received at US Warehouse',
      message: `${result.receivedQuantity} units received. In Transit decreased, US Warehouse increased.`,
    });
    return result;
  };

  const scheduleWorkflowInstallation = async (
    orderId: string,
    installer: string,
    date: string,
    siteAddress?: string,
    notes?: string,
    siteVisitTime?: string
  ): Promise<{ installation: Installation; order: ClientOrderRecord; schedule: InstallerScheduleItem }> => {
    const result = await crmService.scheduleWorkflowInstallation(orderId, installer, date, siteAddress, notes, siteVisitTime);
    const [updatedOrders, updatedStock, updatedInst, updatedTechs, updatedSchedules, updatedActivities] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
      crmService.getInstallations(),
      crmService.getTechnicians(),
      crmService.getInstallerSchedules(),
      crmService.getActivities(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    setInstallations(updatedInst);
    setTechnicians(updatedTechs);
    setInstallerSchedules(updatedSchedules);
    setActivities(updatedActivities);
    addToast({
      type: 'success',
      title: 'Installation Scheduled & Synced',
      message: `Installation ${result.installation.id} linked to Order ${orderId} and synced to Installer Schedule (${result.schedule.siteVisitTime}).`,
    });
    return result;
  };

  const addTechnician = async (name: string): Promise<string[]> => {
    const updated = await crmService.addTechnician(name);
    setTechnicians(updated);
    return updated;
  };

  const completeWorkflowInstallation = async (
    installationId: string,
    actualInstalledCount?: number
  ): Promise<{ installation: Installation; order?: ClientOrderRecord; schedule?: InstallerScheduleItem }> => {
    const result = await crmService.completeWorkflowInstallation(installationId, actualInstalledCount);
    const [updatedOrders, updatedStock, updatedInst, updatedSchedules, updatedActivities] = await Promise.all([
      crmService.getOrders(),
      crmService.getDeviceStock(),
      crmService.getInstallations(),
      crmService.getInstallerSchedules(),
      crmService.getActivities(),
    ]);
    setOrders(updatedOrders);
    setDeviceStock(updatedStock);
    setInstallations(updatedInst);
    setInstallerSchedules(updatedSchedules);
    setActivities(updatedActivities);
    addToast({
      type: 'success',
      title: 'Installation Completed',
      message: `Installation ${installationId} marked complete. Actual installed count updated across all tables and schedules.`,
    });
    return result;
  };

  // Global Search
  const globalSearch = useCallback((query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return { deals: [], leads: [], contacts: [], companies: [] };

    return {
      deals: deals.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.companyName.toLowerCase().includes(q) ||
        d.contactName.toLowerCase().includes(q)
      ),
      leads: leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q)
      ),
      contacts: contacts.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      ),
      companies: companies.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q) ||
        c.industry.toLowerCase().includes(q)
      ),
    };
  }, [deals, leads, contacts, companies]);

  return (
    <CrmContext.Provider
      value={{
        leads,
        deals,
        contacts,
        companies,
        quotations,
        tasks,
        activities,
        settings,
        isLoading,
        refreshAll,
        createLead,
        updateLead,
        deleteLead,
        convertLead,
        createDeal,
        updateDeal,
        updateDealStage,
        deleteDeal,
        createContact,
        updateContact,
        deleteContact,
        createCompany,
        updateCompany,
        deleteCompany,
        createQuotation,
        updateQuotation,
        updateQuotationStatus,
        deleteQuotation,
        createTask,
        toggleTask,
        deleteTask,
        addActivity,
        updateSettings,
        resetDatabase,
        loadMockData,
        globalSearch,
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
        clientRequirements,
        getClientRequirements,
        saveClientRequirements,
        updateClientRequirement,
        deviceStock,
        recordStockAction,
        refreshDeviceStock,
        orders,
        createOrder,
        deleteOrder,
        dispatchWorkflow,
        receiveWorkflowInTransit,
        scheduleWorkflowInstallation,
        completeWorkflowInstallation,
        adjustProductionStock,
        technicians,
        addTechnician,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = (): CrmContextType => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
