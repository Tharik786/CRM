import {
  User,
  Company,
  Contact,
  Lead,
  Deal,
  Quotation,
  Task,
  Activity,
  WorkspaceSettings,
  DashboardMetrics,
  DealStage,
  QuotationStatus,
  Installation,
  InstallerScheduleItem,
  DeviceInventoryItem
} from '../../types/crm';
import { CrmStorage } from '../storage';

const delay = (ms: number = 80) => new Promise(resolve => setTimeout(resolve, ms));

export const crmService = {
  // === AUTHENTICATION ===
  async login(email: string, _password?: string, name?: string): Promise<{ user: User; token: string }> {
    await delay(150);
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }

    const resolvedName = name?.trim() || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const existingUser = CrmStorage.getUser();

    const user: User = {
      id: existingUser?.id || `usr_${Date.now()}`,
      name: resolvedName,
      email: email.trim(),
      role: existingUser?.role || 'admin',
      avatar: existingUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(resolvedName)}&background=4f46e5&color=fff`,
      title: existingUser?.title || 'Administrator',
      phone: existingUser?.phone || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notificationsEnabled: true,
    };

    const token = `zancrm_token_${Date.now()}`;
    CrmStorage.setUser(user);
    CrmStorage.setToken(token);
    return { user, token };
  },

  async logout(): Promise<void> {
    await delay(50);
    CrmStorage.setToken(null);
  },

  async getCurrentUser(): Promise<User | null> {
    await delay(50);
    return CrmStorage.getUser();
  },

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    await delay(80);
    const current = CrmStorage.getUser();
    const updated: User = {
      id: current?.id || `usr_${Date.now()}`,
      name: data.name || current?.name || 'User',
      email: data.email || current?.email || '',
      role: data.role || current?.role || 'admin',
      avatar: data.avatar || current?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || current?.name || 'User')}&background=4f46e5&color=fff`,
      title: data.title || current?.title || '',
      phone: data.phone || current?.phone || '',
      timezone: data.timezone || current?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notificationsEnabled: data.notificationsEnabled ?? current?.notificationsEnabled ?? true,
      ...data,
    };
    CrmStorage.setUser(updated);
    return updated;
  },

  // === DASHBOARD & METRICS ===
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await delay(100);
    const deals = CrmStorage.getDeals();
    const leads = CrmStorage.getLeads();
    const tasks = CrmStorage.getTasks();
    const activities = CrmStorage.getActivities();

    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const closedDeals = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost');

    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = deals
      .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + d.value, 0);

    const winRate = closedDeals.length > 0
      ? Math.round((wonDeals.length / closedDeals.length) * 100)
      : 0;

    const stages: DealStage[] = ['qualification', 'needs_analysis', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost'];
    const stageBreakdown = stages.map(st => {
      const stageDeals = deals.filter(d => d.stage === st);
      return {
        stage: st,
        count: stageDeals.length,
        totalValue: stageDeals.reduce((sum, d) => sum + d.value, 0)
      };
    });

    const upcomingTasks = tasks
      .filter(t => t.status !== 'completed')
      .slice(0, 5);

    return {
      totalRevenue,
      revenueChange: totalRevenue > 0 ? 12.5 : 0,
      dealsWonCount: wonDeals.length,
      dealsWonChange: wonDeals.length > 0 ? 10 : 0,
      activeLeadsCount: leads.filter(l => l.status !== 'converted' && l.status !== 'unqualified').length,
      leadsChange: leads.length > 0 ? 5 : 0,
      winRate,
      winRateChange: winRate > 0 ? 2.5 : 0,
      pipelineValue,
      stageBreakdown,
      recentActivities: activities.slice(0, 6),
      upcomingTasks,
    };
  },

  // === LEADS ===
  async getLeads(): Promise<Lead[]> {
    await delay();
    return CrmStorage.getLeads();
  },

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    await delay();
    const currentUser = CrmStorage.getUser();
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}`,
      assignedTo: leadData.assignedTo || currentUser?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    CrmStorage.saveLead(newLead);
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `New lead added: ${newLead.name}`,
      description: `Company: ${newLead.company}, Est Value: $${newLead.estimatedValue.toLocaleString()}`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
      relatedToType: 'lead',
      relatedToId: newLead.id,
      relatedToName: newLead.name,
    });
    return newLead;
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    await delay();
    const leads = CrmStorage.getLeads();
    const current = leads.find(l => l.id === id);
    if (!current) throw new Error('Lead not found');
    const updated = { ...current, ...leadData, updatedAt: new Date().toISOString() };
    return CrmStorage.saveLead(updated);
  },

  async deleteLead(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteLead(id);
  },

  async convertLeadToDeal(leadId: string): Promise<{ deal: Deal; contact: Contact }> {
    await delay(150);
    const leads = CrmStorage.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    const currentUser = CrmStorage.getUser();
    lead.status = 'converted';
    lead.updatedAt = new Date().toISOString();
    CrmStorage.saveLead(lead);

    // Create Contact
    const contact: Contact = {
      id: `cont_${Date.now()}`,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      title: 'Contact',
      companyName: lead.company,
      lifecycleStage: 'customer',
      lastActivityAt: new Date().toISOString(),
      assignedTo: lead.assignedTo || currentUser?.id || '',
      createdAt: new Date().toISOString(),
    };
    CrmStorage.saveContact(contact);

    // Create Deal
    const deal: Deal = {
      id: `deal_${Date.now()}`,
      title: `${lead.company} - Opportunity`,
      value: lead.estimatedValue || 0,
      currency: 'USD',
      stage: 'qualification',
      probability: 50,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      companyName: lead.company,
      contactId: contact.id,
      contactName: contact.name,
      assignedTo: lead.assignedTo || currentUser?.id || '',
      priority: 'high',
      tags: ['Converted Lead'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    CrmStorage.saveDeal(deal);

    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'deal_stage_changed',
      title: `Lead converted to Deal: ${deal.title}`,
      description: `Converted from lead ${lead.name}. Valued at $${deal.value.toLocaleString()}`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
      relatedToType: 'deal',
      relatedToId: deal.id,
      relatedToName: deal.title,
    });

    return { deal, contact };
  },

  // === DEALS ===
  async getDeals(): Promise<Deal[]> {
    await delay();
    return CrmStorage.getDeals();
  },

  async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    await delay();
    const currentUser = CrmStorage.getUser();
    const newDeal: Deal = {
      ...dealData,
      id: `deal_${Date.now()}`,
      assignedTo: dealData.assignedTo || currentUser?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    CrmStorage.saveDeal(newDeal);
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'deal_stage_changed',
      title: `Opportunity created: ${newDeal.title}`,
      description: `Value: $${newDeal.value.toLocaleString()} in stage ${newDeal.stage}`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
      relatedToType: 'deal',
      relatedToId: newDeal.id,
      relatedToName: newDeal.title,
    });
    return newDeal;
  },

  async updateDeal(id: string, dealData: Partial<Deal>): Promise<Deal> {
    await delay();
    const deals = CrmStorage.getDeals();
    const current = deals.find(d => d.id === id);
    if (!current) throw new Error('Deal not found');
    const updated = { ...current, ...dealData, updatedAt: new Date().toISOString() };
    return CrmStorage.saveDeal(updated);
  },

  async updateDealStage(id: string, stage: DealStage): Promise<Deal> {
    await delay(80);
    const deal = CrmStorage.updateDealStage(id, stage);
    if (!deal) throw new Error('Deal not found');
    return deal;
  },

  async deleteDeal(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteDeal(id);
  },

  // === CONTACTS & COMPANIES ===
  async getContacts(): Promise<Contact[]> {
    await delay();
    return CrmStorage.getContacts();
  },

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<Contact> {
    await delay();
    const currentUser = CrmStorage.getUser();
    const newContact: Contact = {
      ...contactData,
      id: `cont_${Date.now()}`,
      assignedTo: contactData.assignedTo || currentUser?.id || '',
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return CrmStorage.saveContact(newContact);
  },

  async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    await delay();
    const list = CrmStorage.getContacts();
    const current = list.find(c => c.id === id);
    if (!current) throw new Error('Contact not found');
    const updated = { ...current, ...contactData };
    return CrmStorage.saveContact(updated);
  },

  async deleteContact(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteContact(id);
  },

  async getCompanies(): Promise<Company[]> {
    await delay();
    return CrmStorage.getCompanies();
  },

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'openDealsCount' | 'totalRevenue'>): Promise<Company> {
    await delay();
    const newCompany: Company = {
      ...companyData,
      id: `comp_${Date.now()}`,
      totalRevenue: 0,
      openDealsCount: 0,
      createdAt: new Date().toISOString(),
    };
    return CrmStorage.saveCompany(newCompany);
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    await delay();
    const list = CrmStorage.getCompanies();
    const current = list.find(c => c.id === id);
    if (!current) throw new Error('Company not found');
    const updated = { ...current, ...data };
    return CrmStorage.saveCompany(updated);
  },

  async deleteCompany(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteCompany(id);
  },

  // === QUOTATIONS ===
  async getQuotations(): Promise<Quotation[]> {
    await delay();
    return CrmStorage.getQuotations();
  },

  async createQuotation(data: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>): Promise<Quotation> {
    await delay();
    const quotes = CrmStorage.getQuotations();
    const currentUser = CrmStorage.getUser();
    const quoteNumber = `Q-${new Date().getFullYear()}-${String(quotes.length + 1).padStart(3, '0')}`;
    const newQuote: Quotation = {
      ...data,
      id: `quot_${Date.now()}`,
      quoteNumber,
      createdBy: data.createdBy || currentUser?.name || 'User',
      createdAt: new Date().toISOString(),
    };
    return CrmStorage.saveQuotation(newQuote);
  },

  async updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    await delay();
    const quotes = CrmStorage.getQuotations();
    const quote = quotes.find(q => q.id === id);
    if (!quote) throw new Error('Quotation not found');
    quote.status = status;
    return CrmStorage.saveQuotation(quote);
  },

  async deleteQuotation(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteQuotation(id);
  },

  // === TASKS ===
  async getTasks(): Promise<Task[]> {
    await delay();
    return CrmStorage.getTasks();
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await delay();
    const currentUser = CrmStorage.getUser();
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      assignedTo: taskData.assignedTo || currentUser?.id || '',
      createdAt: new Date().toISOString(),
    };
    return CrmStorage.saveTask(newTask);
  },

  async toggleTaskStatus(id: string): Promise<Task> {
    await delay(60);
    const task = CrmStorage.toggleTask(id);
    if (!task) throw new Error('Task not found');
    return task;
  },

  async deleteTask(id: string): Promise<void> {
    await delay();
    CrmStorage.deleteTask(id);
  },

  // === ACTIVITIES ===
  async getActivities(): Promise<Activity[]> {
    await delay();
    return CrmStorage.getActivities();
  },

  async createActivity(activityData: Omit<Activity, 'id' | 'timestamp' | 'performedBy' | 'performedById'>): Promise<Activity> {
    await delay();
    const user = CrmStorage.getUser();
    const newActivity: Activity = {
      ...activityData,
      id: `act_${Date.now()}`,
      performedBy: user?.name || 'User',
      performedById: user?.id || '',
      timestamp: new Date().toISOString(),
    };
    return CrmStorage.addActivity(newActivity);
  },

  // === SETTINGS & SYSTEM ===
  async getSettings(): Promise<WorkspaceSettings> {
    await delay(50);
    return CrmStorage.getSettings();
  },

  async updateSettings(settings: WorkspaceSettings): Promise<WorkspaceSettings> {
    await delay(80);
    return CrmStorage.saveSettings(settings);
  },

  async clearAllData(): Promise<void> {
    await delay(100);
    CrmStorage.clearAll();
  },

  // === OPERATIONS: INSTALLATIONS ===
  async getInstallations(): Promise<Installation[]> {
    await delay(60);
    return CrmStorage.getInstallations();
  },

  async createInstallation(data: Omit<Installation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Installation> {
    await delay(80);
    const now = new Date().toISOString();
    const newInst: Installation = {
      ...data,
      id: `inst_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    CrmStorage.saveInstallation(newInst);

    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `Installation Scheduled for ${newInst.customerName}`,
      description: `Assigned to installer ${newInst.installer} on ${newInst.installationDate}. Status: ${newInst.status}.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: now,
      relatedToType: newInst.dealId ? 'deal' : newInst.customerId ? 'contact' : undefined,
      relatedToId: newInst.dealId || newInst.customerId,
      relatedToName: newInst.dealTitle || newInst.customerName,
    });

    return newInst;
  },

  async updateInstallation(id: string, data: Partial<Installation>): Promise<Installation> {
    await delay(80);
    const list = CrmStorage.getInstallations();
    const existing = list.find(i => i.id === id);
    if (!existing) throw new Error('Installation not found');
    const updated: Installation = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return CrmStorage.saveInstallation(updated);
  },

  async deleteInstallation(id: string): Promise<void> {
    await delay(60);
    CrmStorage.deleteInstallation(id);
  },

  // === OPERATIONS: INSTALLER SCHEDULES ===
  async getInstallerSchedules(): Promise<InstallerScheduleItem[]> {
    await delay(60);
    return CrmStorage.getInstallerSchedules();
  },

  async createInstallerSchedule(data: Omit<InstallerScheduleItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallerScheduleItem> {
    await delay(80);
    const now = new Date().toISOString();
    const newSchedule: InstallerScheduleItem = {
      ...data,
      id: `sch_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    CrmStorage.saveInstallerSchedule(newSchedule);
    return newSchedule;
  },

  async updateInstallerSchedule(id: string, data: Partial<InstallerScheduleItem>): Promise<InstallerScheduleItem> {
    await delay(80);
    const list = CrmStorage.getInstallerSchedules();
    const existing = list.find(s => s.id === id);
    if (!existing) throw new Error('Installer schedule not found');
    const updated: InstallerScheduleItem = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return CrmStorage.saveInstallerSchedule(updated);
  },

  async deleteInstallerSchedule(id: string): Promise<void> {
    await delay(60);
    CrmStorage.deleteInstallerSchedule(id);
  },

  // === OPERATIONS: DEVICE INVENTORY ===
  async getDeviceInventory(): Promise<DeviceInventoryItem[]> {
    await delay(60);
    return CrmStorage.getDeviceInventory();
  },

  async createDeviceInventoryItem(data: Omit<DeviceInventoryItem, 'id' | 'updatedAt'>): Promise<DeviceInventoryItem> {
    await delay(80);
    const newItem: DeviceInventoryItem = {
      ...data,
      id: `dev_${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    CrmStorage.saveDeviceInventory(newItem);
    return newItem;
  },

  async updateDeviceInventoryItem(id: string, data: Partial<DeviceInventoryItem>): Promise<DeviceInventoryItem> {
    await delay(80);
    const list = CrmStorage.getDeviceInventory();
    const existing = list.find(d => d.id === id);
    if (!existing) throw new Error('Device not found');
    const updated: DeviceInventoryItem = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    return CrmStorage.saveDeviceInventory(updated);
  },

  async deleteDeviceInventoryItem(id: string): Promise<void> {
    await delay(60);
    CrmStorage.deleteDeviceInventory(id);
  }
};
