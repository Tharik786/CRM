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
  DeviceInventoryItem
} from '../types/crm';
import { crmService } from '../api/services/crmService';

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
    refreshAll();
  }, [refreshAll]);

  // Lead Handlers
  const createLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createLead(leadData);
    setLeads(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Lead Created', message: `${res.name} added to pipeline.` });
    refreshAll();
    return res;
  };

  const updateLead = async (id: string, leadData: Partial<Lead>) => {
    const res = await crmService.updateLead(id, leadData);
    setLeads(prev => prev.map(l => (l.id === id ? res : l)));
    addToast({ type: 'success', title: 'Lead Updated', message: `Changes saved for ${res.name}.` });
    return res;
  };

  const deleteLead = async (id: string) => {
    await crmService.deleteLead(id);
    setLeads(prev => prev.filter(l => l.id !== id));
    addToast({ type: 'info', title: 'Lead Deleted', message: 'Lead record removed.' });
  };

  const convertLead = async (id: string) => {
    const res = await crmService.convertLeadToDeal(id);
    addToast({
      type: 'success',
      title: 'Lead Converted!',
      message: `Created new deal "${res.deal.title}" and contact profile.`,
    });
    await refreshAll();
    return res;
  };

  // Deal Handlers
  const createDeal = async (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const res = await crmService.createDeal(dealData);
    setDeals(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Deal Created', message: `Deal "${res.title}" added to pipeline.` });
    refreshAll();
    return res;
  };

  const updateDeal = async (id: string, dealData: Partial<Deal>) => {
    const res = await crmService.updateDeal(id, dealData);
    setDeals(prev => prev.map(d => (d.id === id ? res : d)));
    addToast({ type: 'success', title: 'Deal Updated', message: `Updated details for ${res.title}.` });
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
  };

  // Contacts & Companies
  const createContact = async (data: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>) => {
    const res = await crmService.createContact(data);
    setContacts(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Contact Added', message: `${res.name} added to records.` });
    return res;
  };

  const updateContact = async (id: string, data: Partial<Contact>) => {
    const res = await crmService.updateContact(id, data);
    setContacts(prev => prev.map(c => (c.id === id ? res : c)));
    addToast({ type: 'success', title: 'Contact Updated', message: `Profile updated for ${res.name}.` });
    return res;
  };

  const deleteContact = async (id: string) => {
    await crmService.deleteContact(id);
    setContacts(prev => prev.filter(c => c.id !== id));
    addToast({ type: 'info', title: 'Contact Removed' });
  };

  const createCompany = async (data: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalRevenue'>) => {
    const res = await crmService.createCompany(data);
    setCompanies(prev => [res, ...prev]);
    addToast({ type: 'success', title: 'Company Added', message: `${res.name} registered.` });
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
    addToast({ type: 'success', title: 'Quotation Generated', message: `${res.quoteNumber} created.` });
    refreshAll();
    return res;
  };

  const updateQuotationStatus = async (id: string, status: QuotationStatus) => {
    const res = await crmService.updateQuotationStatus(id, status);
    setQuotations(prev => prev.map(q => (q.id === id ? res : q)));
    addToast({ type: 'success', title: 'Status Updated', message: `Quote marked as ${status}.` });
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
    addToast({ type: 'info', title: 'Data Cleared', message: 'All CRM records have been reset to clean state.' });
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
        updateQuotationStatus,
        deleteQuotation,
        createTask,
        toggleTask,
        deleteTask,
        addActivity,
        updateSettings,
        resetDatabase,
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
