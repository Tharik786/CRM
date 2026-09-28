import {
  User,
  Lead,
  Company,
  Contact,
  Deal,
  Quotation,
  Task,
  Activity,
  WorkspaceSettings,
  DealStage,
  Installation,
  InstallerScheduleItem,
  DeviceInventoryItem
} from '../types/crm';

const STORAGE_KEYS = {
  USER: 'zancrm_user',
  TOKEN: 'zancrm_token',
  COMPANIES: 'zancrm_companies',
  CONTACTS: 'zancrm_contacts',
  LEADS: 'zancrm_leads',
  DEALS: 'zancrm_deals',
  QUOTATIONS: 'zancrm_quotations',
  TASKS: 'zancrm_tasks',
  ACTIVITIES: 'zancrm_activities',
  SETTINGS: 'zancrm_settings',
  INSTALLATIONS: 'zancrm_installations',
  INSTALLER_SCHEDULE: 'zancrm_installer_schedule',
  DEVICE_INVENTORY: 'zancrm_device_inventory',
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  companyName: 'My Workspace',
  defaultCurrency: 'USD',
  fiscalYearStart: 'January',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  emailNotifications: true,
  autoLeadScoring: false,
  twoFactorAuth: false,
};

function getStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage write error:', err);
  }
}

export class CrmStorage {
  static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      setStorage(STORAGE_KEYS.COMPANIES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      setStorage(STORAGE_KEYS.CONTACTS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
      setStorage(STORAGE_KEYS.LEADS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEALS)) {
      setStorage(STORAGE_KEYS.DEALS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
      setStorage(STORAGE_KEYS.QUOTATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      setStorage(STORAGE_KEYS.TASKS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      setStorage(STORAGE_KEYS.ACTIVITIES, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStorage(STORAGE_KEYS.SETTINGS, DEFAULT_WORKSPACE_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSTALLATIONS)) {
      setStorage(STORAGE_KEYS.INSTALLATIONS, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.INSTALLER_SCHEDULE)) {
      setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEVICE_INVENTORY)) {
      setStorage(STORAGE_KEYS.DEVICE_INVENTORY, []);
    }
  }

  static clearAll(): void {
    setStorage(STORAGE_KEYS.COMPANIES, []);
    setStorage(STORAGE_KEYS.CONTACTS, []);
    setStorage(STORAGE_KEYS.LEADS, []);
    setStorage(STORAGE_KEYS.DEALS, []);
    setStorage(STORAGE_KEYS.QUOTATIONS, []);
    setStorage(STORAGE_KEYS.TASKS, []);
    setStorage(STORAGE_KEYS.ACTIVITIES, []);
    setStorage(STORAGE_KEYS.SETTINGS, DEFAULT_WORKSPACE_SETTINGS);
    setStorage(STORAGE_KEYS.INSTALLATIONS, []);
    setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, []);
    setStorage(STORAGE_KEYS.DEVICE_INVENTORY, []);
  }

  // Auth
  static getUser(): User | null {
    return getStorage<User | null>(STORAGE_KEYS.USER, null);
  }

  static setUser(user: User | null): void {
    if (user) {
      setStorage(STORAGE_KEYS.USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }

  static getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  static setToken(token: string | null): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  }

  // Companies
  static getCompanies(): Company[] {
    return getStorage<Company[]>(STORAGE_KEYS.COMPANIES, []);
  }

  static saveCompany(company: Company): Company {
    const list = this.getCompanies();
    const idx = list.findIndex(c => c.id === company.id);
    if (idx >= 0) {
      list[idx] = company;
    } else {
      list.unshift(company);
    }
    setStorage(STORAGE_KEYS.COMPANIES, list);
    return company;
  }

  static deleteCompany(id: string): void {
    const list = this.getCompanies().filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.COMPANIES, list);
  }

  // Contacts
  static getContacts(): Contact[] {
    return getStorage<Contact[]>(STORAGE_KEYS.CONTACTS, []);
  }

  static saveContact(contact: Contact): Contact {
    const list = this.getContacts();
    const idx = list.findIndex(c => c.id === contact.id);
    if (idx >= 0) {
      list[idx] = contact;
    } else {
      list.unshift(contact);
    }
    setStorage(STORAGE_KEYS.CONTACTS, list);
    return contact;
  }

  static deleteContact(id: string): void {
    const list = this.getContacts().filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.CONTACTS, list);
  }

  // Leads
  static getLeads(): Lead[] {
    return getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);
  }

  static saveLead(lead: Lead): Lead {
    const list = this.getLeads();
    const idx = list.findIndex(l => l.id === lead.id);
    if (idx >= 0) {
      list[idx] = lead;
    } else {
      list.unshift(lead);
    }
    setStorage(STORAGE_KEYS.LEADS, list);
    return lead;
  }

  static deleteLead(id: string): void {
    const list = this.getLeads().filter(l => l.id !== id);
    setStorage(STORAGE_KEYS.LEADS, list);
  }

  // Deals
  static getDeals(): Deal[] {
    return getStorage<Deal[]>(STORAGE_KEYS.DEALS, []);
  }

  static saveDeal(deal: Deal): Deal {
    const list = this.getDeals();
    const idx = list.findIndex(d => d.id === deal.id);
    if (idx >= 0) {
      list[idx] = deal;
    } else {
      list.unshift(deal);
    }
    setStorage(STORAGE_KEYS.DEALS, list);
    return deal;
  }

  static updateDealStage(id: string, stage: DealStage): Deal | undefined {
    const list = this.getDeals();
    const deal = list.find(d => d.id === id);
    if (deal) {
      deal.stage = stage;
      deal.updatedAt = new Date().toISOString();
      if (stage === 'closed_won') deal.probability = 100;
      if (stage === 'closed_lost') deal.probability = 0;
      setStorage(STORAGE_KEYS.DEALS, list);

      const currentUser = this.getUser();
      this.addActivity({
        id: `act_${Date.now()}`,
        type: 'deal_stage_changed',
        title: `Deal "${deal.title}" moved to ${stage.replace('_', ' ').toUpperCase()}`,
        description: `Probability updated to ${deal.probability}%. Total value: $${deal.value.toLocaleString()}`,
        performedBy: currentUser?.name || 'User',
        performedById: currentUser?.id || 'usr_current',
        timestamp: new Date().toISOString(),
        relatedToType: 'deal',
        relatedToId: deal.id,
        relatedToName: deal.title,
      });

      return deal;
    }
    return undefined;
  }

  static deleteDeal(id: string): void {
    const list = this.getDeals().filter(d => d.id !== id);
    setStorage(STORAGE_KEYS.DEALS, list);
  }

  // Quotations
  static getQuotations(): Quotation[] {
    return getStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
  }

  static saveQuotation(quote: Quotation): Quotation {
    const list = this.getQuotations();
    const idx = list.findIndex(q => q.id === quote.id);
    if (idx >= 0) {
      list[idx] = quote;
    } else {
      list.unshift(quote);
    }
    setStorage(STORAGE_KEYS.QUOTATIONS, list);

    const currentUser = this.getUser();
    this.addActivity({
      id: `act_${Date.now()}`,
      type: 'quotation_created',
      title: `Quotation ${quote.quoteNumber} ${idx >= 0 ? 'updated' : 'created'}`,
      description: `For ${quote.companyName} (${quote.contactName}) amounting to $${quote.total.toLocaleString()}`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || 'usr_current',
      timestamp: new Date().toISOString(),
      relatedToType: quote.dealId ? 'deal' : undefined,
      relatedToId: quote.dealId,
      relatedToName: quote.title,
    });

    return quote;
  }

  static deleteQuotation(id: string): void {
    const list = this.getQuotations().filter(q => q.id !== id);
    setStorage(STORAGE_KEYS.QUOTATIONS, list);
  }

  // Tasks
  static getTasks(): Task[] {
    return getStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  }

  static saveTask(task: Task): Task {
    const list = this.getTasks();
    const idx = list.findIndex(t => t.id === task.id);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.unshift(task);
    }
    setStorage(STORAGE_KEYS.TASKS, list);
    return task;
  }

  static toggleTask(id: string): Task | undefined {
    const list = this.getTasks();
    const task = list.find(t => t.id === id);
    if (task) {
      const isCompleted = task.status === 'completed';
      task.status = isCompleted ? 'pending' : 'completed';
      task.completedAt = isCompleted ? undefined : new Date().toISOString();
      setStorage(STORAGE_KEYS.TASKS, list);
      return task;
    }
    return undefined;
  }

  static deleteTask(id: string): void {
    const list = this.getTasks().filter(t => t.id !== id);
    setStorage(STORAGE_KEYS.TASKS, list);
  }

  // Activities
  static getActivities(): Activity[] {
    return getStorage<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
  }

  static addActivity(activity: Activity): Activity {
    const list = this.getActivities();
    list.unshift(activity);
    setStorage(STORAGE_KEYS.ACTIVITIES, list);
    return activity;
  }

  // Settings
  static getSettings(): WorkspaceSettings {
    return getStorage<WorkspaceSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_WORKSPACE_SETTINGS);
  }

  static saveSettings(settings: WorkspaceSettings): WorkspaceSettings {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }

  // Installations
  static getInstallations(): Installation[] {
    return getStorage<Installation[]>(STORAGE_KEYS.INSTALLATIONS, []);
  }

  static saveInstallation(installation: Installation): Installation {
    const list = this.getInstallations();
    const idx = list.findIndex(i => i.id === installation.id);
    if (idx >= 0) {
      list[idx] = installation;
    } else {
      list.unshift(installation);
    }
    setStorage(STORAGE_KEYS.INSTALLATIONS, list);
    return installation;
  }

  static deleteInstallation(id: string): void {
    const list = this.getInstallations().filter(i => i.id !== id);
    setStorage(STORAGE_KEYS.INSTALLATIONS, list);
  }

  // Installer Schedules
  static getInstallerSchedules(): InstallerScheduleItem[] {
    return getStorage<InstallerScheduleItem[]>(STORAGE_KEYS.INSTALLER_SCHEDULE, []);
  }

  static saveInstallerSchedule(item: InstallerScheduleItem): InstallerScheduleItem {
    const list = this.getInstallerSchedules();
    const idx = list.findIndex(s => s.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, list);
    return item;
  }

  static deleteInstallerSchedule(id: string): void {
    const list = this.getInstallerSchedules().filter(s => s.id !== id);
    setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, list);
  }

  // Device Inventory
  static getDeviceInventory(): DeviceInventoryItem[] {
    return getStorage<DeviceInventoryItem[]>(STORAGE_KEYS.DEVICE_INVENTORY, []);
  }

  static saveDeviceInventory(item: DeviceInventoryItem): DeviceInventoryItem {
    const list = this.getDeviceInventory();
    const idx = list.findIndex(d => d.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    setStorage(STORAGE_KEYS.DEVICE_INVENTORY, list);
    return item;
  }

  static deleteDeviceInventory(id: string): void {
    const list = this.getDeviceInventory().filter(d => d.id !== id);
    setStorage(STORAGE_KEYS.DEVICE_INVENTORY, list);
  }
}

// Initialize clean data structures
CrmStorage.init();
