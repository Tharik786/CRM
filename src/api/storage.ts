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
  DeviceInventoryItem,
  ClientDeviceRequirement,
  DeviceStockItem,
  StockActionType,
  ClientOrderRecord,
} from '../types/crm';
import {
  MOCK_COMPANIES,
  MOCK_CONTACTS,
  MOCK_LEADS,
  MOCK_DEALS,
  MOCK_QUOTATIONS,
  MOCK_INSTALLATIONS,
  MOCK_INSTALLER_SCHEDULES,
  MOCK_DEVICE_INVENTORY,
  MOCK_TASKS,
  MOCK_ACTIVITIES,
  MOCK_CLIENT_REQUIREMENTS,
  DEVICE_DEFINITIONS,
  MOCK_DEVICE_STOCK,
  DEFAULT_TECHNICIANS,
  MOCK_ORDERS,
} from './mockData';

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
  CLIENT_REQUIREMENTS: 'zancrm_client_requirements',
  DEVICE_STOCK: 'zancrm_device_stock',
  ORDERS: 'zancrm_client_orders_table',
  TECHNICIANS: 'zancrm_technicians',
};

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  companyName: 'ZanCompute Global Workspace',
  defaultCurrency: 'USD',
  fiscalYearStart: 'January',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  emailNotifications: true,
  autoLeadScoring: true,
  twoFactorAuth: false,
};

export const DEFAULT_USER: User = {
  id: 'usr_admin',
  name: 'Administrator',
  email: 'admin@zancompute.com',
  role: 'admin',
  title: 'Administrator',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  notificationsEnabled: true,
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

const SEED_VERSION_KEY = 'zancrm_mock_data_version';
const CURRENT_SEED_VERSION = 'v14_clean_production_no_dummy_data';

export class CrmStorage {
  static init(): void {
    if (typeof localStorage === 'undefined') return;
    const isSeeded = localStorage.getItem(SEED_VERSION_KEY) === CURRENT_SEED_VERSION;
    if (!isSeeded) {
      this.seedMockData();
      localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION);
      return;
    }
    this.syncClientDirectoryWithDeals();
  }

  static seedMockData(): void {
    setStorage(STORAGE_KEYS.COMPANIES, MOCK_COMPANIES);
    setStorage(STORAGE_KEYS.CONTACTS, MOCK_CONTACTS);
    setStorage(STORAGE_KEYS.LEADS, MOCK_LEADS);
    setStorage(STORAGE_KEYS.DEALS, MOCK_DEALS);
    setStorage(STORAGE_KEYS.QUOTATIONS, MOCK_QUOTATIONS);
    setStorage(STORAGE_KEYS.TASKS, MOCK_TASKS);
    setStorage(STORAGE_KEYS.ACTIVITIES, MOCK_ACTIVITIES);
    setStorage(STORAGE_KEYS.SETTINGS, DEFAULT_WORKSPACE_SETTINGS);
    setStorage(STORAGE_KEYS.INSTALLATIONS, MOCK_INSTALLATIONS);
    setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, MOCK_INSTALLER_SCHEDULES);
    setStorage(STORAGE_KEYS.DEVICE_INVENTORY, MOCK_DEVICE_INVENTORY);
    setStorage(STORAGE_KEYS.CLIENT_REQUIREMENTS, MOCK_CLIENT_REQUIREMENTS);
    setStorage(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);
    setStorage(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    setStorage(STORAGE_KEYS.TECHNICIANS, DEFAULT_TECHNICIANS);
  }

  static clearAll(): void {
    this.seedMockData();
  }

  // Auth
  static getUser(): User {
    return getStorage<User>(STORAGE_KEYS.USER, DEFAULT_USER);
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
    this.syncClientDirectoryWithDeals();
    return company;
  }

  static deleteCompany(id: string): void {
    const list = this.getCompanies().filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.COMPANIES, list);
    this.syncClientDirectoryWithDeals();
  }

  // Contacts
  static getContacts(): Contact[] {
    const raw = getStorage<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const quotations = getStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);
    const companies = getStorage<Company[]>(STORAGE_KEYS.COMPANIES, []);
    const rawLeads = getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);

    const seen = new Set<string>();
    const deduped = raw.filter(c => {
      c.title = '';
      const key = (c.email || `${c.name}:::${c.companyName}`).trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);

      // Auto-heal missing phone, location, country from quotations, leads, or companies
      const emailLower = (c.email || '').trim().toLowerCase();
      const companyLower = (c.companyName || '').trim().toLowerCase();
      const nameLower = (c.name || '').trim().toLowerCase();

      const quote = quotations.find(
        q =>
          (emailLower && q.contactEmail && q.contactEmail.trim().toLowerCase() === emailLower) ||
          (companyLower && q.companyName && q.companyName.trim().toLowerCase() === companyLower) ||
          (nameLower && q.contactName && q.contactName.trim().toLowerCase() === nameLower)
      );

      const lead = rawLeads.find(
        l =>
          l.convertedContactId === c.id ||
          (emailLower && l.email && l.email.trim().toLowerCase() === emailLower) ||
          (companyLower && l.company && l.company.trim().toLowerCase() === companyLower) ||
          (nameLower && l.name && l.name.trim().toLowerCase() === nameLower)
      );

      const comp = companies.find(
        cp =>
          cp.id === c.companyId ||
          (companyLower && cp.name && cp.name.trim().toLowerCase() === companyLower)
      );

      if (!c.phone) {
        c.phone = quote?.contactPhone || lead?.phone || comp?.phone || '';
      }
      if (!c.location) {
        c.location = quote?.location || lead?.location || comp?.city || '';
      }
      if (!c.country) {
        c.country = quote?.country || lead?.country || comp?.country || '';
      }

      return true;
    });
    setStorage(STORAGE_KEYS.CONTACTS, deduped);
    return deduped;
  }

  static saveContact(contact: Contact): Contact {
    const list = this.getContacts();
    const sanitizedContact = { ...contact, title: '' };
    const idx = list.findIndex(
      c => c.id === contact.id || (c.email && contact.email && c.email.toLowerCase() === contact.email.toLowerCase())
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...sanitizedContact, id: list[idx].id };
    } else {
      list.unshift(sanitizedContact);
    }
    setStorage(STORAGE_KEYS.CONTACTS, list);
    this.syncClientDirectoryWithDeals();
    return idx >= 0 ? list[idx] : sanitizedContact;
  }

  static deleteContact(id: string): void {
    const list = this.getContacts().filter(c => c.id !== id);
    setStorage(STORAGE_KEYS.CONTACTS, list);
    this.syncClientDirectoryWithDeals();
  }

  // Leads
  static getAllLeadsRaw(): Lead[] {
    return getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);
  }

  static getLeads(): Lead[] {
    const list = getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);
    const active = list.filter(l => l.status !== 'converted' && l.status !== 'won');
    if (active.length !== list.length) {
      setStorage(STORAGE_KEYS.LEADS, active);
    }
    return active;
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
  static normalizeStage(stage: string): DealStage {
    if (stage === 'qualification') return 'new';
    if (stage === 'needs_analysis') return 'proposal';
    if (stage === 'proposal_sent') return 'proposal';
    if (stage === 'closed_won') return 'won';
    if (stage === 'closed_lost') return 'lost';
    if (['new', 'proposal', 'negotiation', 'won', 'lost', 'cold'].includes(stage)) {
      return stage as DealStage;
    }
    return 'new';
  }

  static getDeals(): Deal[] {
    this.syncClientDirectoryWithDeals();
    const raw = getStorage<Deal[]>(STORAGE_KEYS.DEALS, []);

    // Deduplicate: group by companyName (case-insensitive).
    // Within each group keep the user-created deal (no 'Client Directory' tag)
    // or the one with the highest value / most recent updatedAt if all are auto-generated.
    const grouped = new Map<string, Deal[]>();
    for (const d of raw) {
      const key = (d.companyName || '').trim().toLowerCase();
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(d);
    }

    const deduped: Deal[] = [];
    let changed = false;
    for (const group of grouped.values()) {
      if (group.length === 1) {
        deduped.push(group[0]);
      } else {
        // Prefer user-created (no 'Client Directory' tag); among those pick highest value
        const userCreated = group.filter(d => !d.tags?.includes('Client Directory'));
        const pool = userCreated.length > 0 ? userCreated : group;
        const best = pool.reduce((a, b) => {
          if (Number(b.value) !== Number(a.value)) return Number(b.value) > Number(a.value) ? b : a;
          return (b.updatedAt || '') > (a.updatedAt || '') ? b : a;
        });
        deduped.push(best);
        changed = true;
      }
    }

    if (changed) {
      setStorage(STORAGE_KEYS.DEALS, deduped);
    }

    return deduped.map(d => ({
      ...d,
      stage: this.normalizeStage(d.stage),
    }));
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
    this.syncClientDirectoryWithDeals();
    return deal;
  }

  static updateDealStage(id: string, stage: DealStage): Deal | undefined {
    const list = this.getDeals();
    const deal = list.find(d => d.id === id);
    if (deal) {
      deal.stage = stage;
      deal.updatedAt = new Date().toISOString();
      if (stage === 'won') deal.probability = 100;
      if (stage === 'lost') deal.probability = 0;
      if (stage === 'cold') deal.probability = 10;
      if (stage === 'new') deal.probability = 20;
      if (stage === 'proposal') deal.probability = 50;
      if (stage === 'negotiation') deal.probability = 80;
      setStorage(STORAGE_KEYS.DEALS, list);
      this.syncClientDirectoryWithDeals();

      const currentUser = this.getUser();
      this.addActivity({
        id: `act_${Date.now()}`,
        type: 'deal_stage_changed',
        title: `Deal "${deal.title}" moved to ${stage.toUpperCase()}`,
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
    this.syncClientDirectoryWithDeals();
  }

  // === BACKGROUND SYNC: CLIENT DIRECTORY & SALES PIPELINE ===
  static syncClientDirectoryWithDeals(): void {
    const deals = getStorage<Deal[]>(STORAGE_KEYS.DEALS, []);
    const companies = getStorage<Company[]>(STORAGE_KEYS.COMPANIES, []);
    const contacts = getStorage<Contact[]>(STORAGE_KEYS.CONTACTS, []);

    let companiesChanged = false;
    let contactsChanged = false;
    let dealsChanged = false;

    // 1. For every deal in the sales pipeline, ensure its company & contact exist in client directory
    for (const deal of deals) {
      if (!deal.companyName || !deal.companyName.trim()) continue;
      const compNorm = deal.companyName.trim().toLowerCase();

      // Find or create Company in Client Directory
      let comp = companies.find(c => c.name.trim().toLowerCase() === compNorm);
      if (!comp) {
        comp = {
          id: `comp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: deal.companyName.trim(),
          domain: `${deal.companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          industry: 'Commercial & Facilities',
          size: '50-200',
          phone: '',
          city: '',
          country: 'United States',
          totalRevenue: 0,
          openDealsCount: 0,
          createdAt: deal.createdAt || new Date().toISOString(),
        };
        companies.push(comp);
        companiesChanged = true;
      }

      if (deal.companyId !== comp.id) {
        deal.companyId = comp.id;
        dealsChanged = true;
      }

      // Find or create Contact if contactName exists (or default to Decision Maker)
      const contactName = (deal.contactName || '').trim() || `${comp.name} Contact`;
      const contactNorm = contactName.toLowerCase();
      let cont = contacts.find(
        c =>
          c.name.trim().toLowerCase() === contactNorm &&
          c.companyName.trim().toLowerCase() === compNorm
      );
      if (!cont) {
        cont = {
          id: `cont_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: contactName,
          title: '',
          companyId: comp.id,
          companyName: comp.name,
          email: `contact@${comp.domain}`,
          phone: '',
          status: deal.stage === 'won' ? 'Won Client' : 'Active',
          lifecycleStage: deal.stage === 'won' ? 'customer' : 'lead',
          lastActivityAt: deal.updatedAt || deal.createdAt || new Date().toISOString(),
          assignedTo: deal.assignedTo || 'usr_current',
          createdAt: deal.createdAt || new Date().toISOString(),
        };
        contacts.push(cont);
        contactsChanged = true;
      } else {
        // Keep contact status updated with deal stage
        if (deal.stage === 'won' && cont.status !== 'Won Client') {
          cont.status = 'Won Client';
          cont.lifecycleStage = 'customer';
          contactsChanged = true;
        }
        if (cont.companyId !== comp.id) {
          cont.companyId = comp.id;
          contactsChanged = true;
        }
      }

      if (deal.contactId !== cont.id) {
        deal.contactId = cont.id;
        dealsChanged = true;
      }
    }

    // Note: Bidirectional auto-deal creation removed — it caused duplicate pipeline cards.
    // Deals are only created explicitly by the user via the sales pipeline form.

    // 3. Recalculate company metrics (openDealsCount, totalRevenue) based on actual deals
    for (const comp of companies) {
      const compNorm = comp.name.trim().toLowerCase();
      const compDeals = deals.filter(
        d =>
          (d.companyId && d.companyId === comp.id) ||
          (d.companyName && d.companyName.trim().toLowerCase() === compNorm)
      );
      const openDeals = compDeals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
      const wonDeals = compDeals.filter(d => d.stage === 'won');
      const totalRev = wonDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
      const openCount = openDeals.length;

      if (comp.openDealsCount !== openCount || comp.totalRevenue !== totalRev) {
        comp.openDealsCount = openCount;
        comp.totalRevenue = totalRev;
        companiesChanged = true;
      }
    }

    // Save silently if changed
    if (companiesChanged) {
      setStorage(STORAGE_KEYS.COMPANIES, companies);
    }
    if (contactsChanged) {
      setStorage(STORAGE_KEYS.CONTACTS, contacts);
    }
    if (dealsChanged) {
      setStorage(STORAGE_KEYS.DEALS, deals);
    }
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
    const rawSchedules = getStorage<InstallerScheduleItem[]>(STORAGE_KEYS.INSTALLER_SCHEDULE, []);
    const installations = this.getInstallations();
    const orders = this.getOrders();

    // Auto-heal / deduplicate any duplicate schedules by installationId or id
    const seenIds = new Set<string>();
    const seenInstIds = new Set<string>();
    const schedules: InstallerScheduleItem[] = [];

    for (const item of rawSchedules) {
      if (!item || !item.id) continue;
      if (seenIds.has(item.id)) continue;
      if (item.installationId && seenInstIds.has(item.installationId)) continue;

      seenIds.add(item.id);
      if (item.installationId) seenInstIds.add(item.installationId);
      schedules.push(item);
    }

    let changed = schedules.length !== rawSchedules.length;
    const scheduleByInstId = new Map<string, InstallerScheduleItem>();
    schedules.forEach(s => {
      if (s.installationId) scheduleByInstId.set(s.installationId, s);
    });

    for (const inst of installations) {
      if (!inst.id) continue;
      if (!scheduleByInstId.has(inst.id)) {
        // Find matching order if available
        const ord = orders.find(
          o => o.installationId === inst.id ||
            inst.orderId === `${o.orderPrefix || 'ORD-'}${o.orderNumber}` ||
            o.id === inst.orderId
        );
        const deviceSummary = inst.devices && inst.devices.length > 0
          ? inst.devices.map(d => `${d.deviceName} × ${d.quantity}`).join(', ')
          : '';
        const orderRef = ord ? `${ord.orderPrefix || 'ORD-'}${ord.orderNumber}` : (inst.orderId || '');

        const autoItem: InstallerScheduleItem = {
          id: `sch_${inst.id.replace(/[^0-9]/g, '') || Date.now()}`,
          installer: inst.installer || '',
          siteVisitTime: '10:00 AM - 12:00 PM',
          visitDate: inst.installationDate || inst.bookingDate || new Date().toISOString().split('T')[0],
          customerId: inst.customerId,
          customerName: inst.customerName,
          installationId: inst.id,
          status: inst.status === 'completed' ? 'completed' : 'confirmed',
          siteAddress: inst.siteAddress,
          notes: inst.notes || (orderRef ? `Hardware installation for order ${orderRef}${deviceSummary ? ` (${deviceSummary})` : ''}` : 'Hardware installation'),
          createdAt: inst.createdAt || new Date().toISOString(),
          updatedAt: inst.updatedAt || new Date().toISOString(),
        };

        schedules.unshift(autoItem);
        scheduleByInstId.set(inst.id, autoItem);
        changed = true;
      } else {
        // If installation status is completed, make sure schedule is synced
        const existing = scheduleByInstId.get(inst.id)!;
        if (inst.status === 'completed' && existing.status !== 'completed') {
          existing.status = 'completed';
          existing.updatedAt = new Date().toISOString();
          changed = true;
        }
      }
    }

    if (changed) {
      setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, schedules);
    }

    return schedules;
  }

  static saveInstallerSchedule(item: InstallerScheduleItem): InstallerScheduleItem {
    const list = this.getInstallerSchedules();
    const idx = list.findIndex(
      s => s.id === item.id || (Boolean(item.installationId) && s.installationId === item.installationId)
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.unshift(item);
    }
    setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, list);

    // If linked to an installation and marked completed, sync installation
    if (item.installationId && item.status === 'completed') {
      const installations = this.getInstallations();
      const inst = installations.find(i => i.id === item.installationId);
      if (inst && inst.status !== 'completed') {
        try {
          this.completeWorkflowInstallation(item.installationId);
        } catch {
          // silently continue if already processed
        }
      }
    }

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

  // Client Requirements
  static getClientRequirementsMap(): Record<string, ClientDeviceRequirement[]> {
    return getStorage<Record<string, ClientDeviceRequirement[]>>(STORAGE_KEYS.CLIENT_REQUIREMENTS, MOCK_CLIENT_REQUIREMENTS);
  }

  static getClientRequirements(clientId: string): ClientDeviceRequirement[] {
    const map = this.getClientRequirementsMap();
    if (map[clientId] && map[clientId].length > 0) {
      return map[clientId];
    }
    // Generate default requirements if not exists for this client
    const defaults: ClientDeviceRequirement[] = DEVICE_DEFINITIONS.map(def => ({
      id: `req_${clientId}_${def.key}`,
      clientId,
      deviceKey: def.key,
      deviceName: def.name,
      deviceDescription: def.description,
      required: 0,
      installed: 0,
      indiaStock: def.defaultIndiaStock,
      updatedAt: new Date().toISOString(),
    }));
    map[clientId] = defaults;
    setStorage(STORAGE_KEYS.CLIENT_REQUIREMENTS, map);
    return defaults;
  }

  static saveClientRequirements(clientId: string, requirements: ClientDeviceRequirement[]): ClientDeviceRequirement[] {
    const map = this.getClientRequirementsMap();
    map[clientId] = requirements;
    setStorage(STORAGE_KEYS.CLIENT_REQUIREMENTS, map);
    return requirements;
  }

  static updateClientRequirement(clientId: string, deviceKey: string, required: number): ClientDeviceRequirement[] {
    const list = this.getClientRequirements(clientId);
    const updated = list.map(item => {
      if (item.deviceKey === deviceKey) {
        return {
          ...item,
          required: Math.max(0, required),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    return this.saveClientRequirements(clientId, updated);
  }

  // === DEVICE STOCK INVENTORY ===
  static getDeviceStock(): DeviceStockItem[] {
    const rawStock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, []);
    let stock = rawStock;
    if (!stock || stock.length === 0) {
      stock = MOCK_DEVICE_STOCK;
      setStorage(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);
    }
    // Ensure all 10 device definitions are present
    const existingKeys = new Set(stock.map(s => s.deviceKey));
    let hasMissing = false;
    const completeStock = [...stock];

    for (const def of DEVICE_DEFINITIONS) {
      if (!existingKeys.has(def.key)) {
        const mockItem = MOCK_DEVICE_STOCK.find(m => m.deviceKey === def.key);
        completeStock.push(
          mockItem || {
            id: `stock_${def.key}`,
            deviceKey: def.key,
            deviceName: def.name,
            deviceDescription: def.description,
            usWarehouse: 0,
            indiaProduction: 0,
            updatedAt: new Date().toISOString(),
          }
        );
        hasMissing = true;
      }
    }

    if (hasMissing) {
      setStorage(STORAGE_KEYS.DEVICE_STOCK, completeStock);
      stock = completeStock;
    }

    // Now compute live quantities connected with Orders workflow
    const orders = this.getOrders();
    const reqMap = this.getClientRequirementsMap();

    // Map total requirements from client requirements page
    const clientReqMap: Record<string, number> = {};
    for (const cId in reqMap) {
      const cReqs = reqMap[cId];
      if (Array.isArray(cReqs)) {
        for (const req of cReqs) {
          if (req.deviceKey) {
            clientReqMap[req.deviceKey] = (clientReqMap[req.deviceKey] || 0) + (Number(req.required) || 0);
          }
        }
      }
    }

    return stock.map(item => {
      let required = 0;
      let dispatched = 0;
      let inTransit = 0;
      let scheduled = 0;
      let installed = 0;
      const orderIdsSet = new Set<string>();
      const installationIdsSet = new Set<string>();

      for (const ord of orders) {
        if (!ord.devices || !Array.isArray(ord.devices)) continue;
        for (const dev of ord.devices) {
          if (dev.deviceKey === item.deviceKey) {
            required += Number(dev.quantity) || 0;
            dispatched += Number(dev.dispatched) || 0;
            inTransit += Number(dev.inTransit) || 0;
            scheduled += Number(dev.scheduled) || 0;
            installed += Number(dev.installed) || 0;

            const ordIdStr = `${ord.orderPrefix || 'ORD-'}${ord.orderNumber}`;
            orderIdsSet.add(ordIdStr);

            if (dev.installationId) installationIdsSet.add(dev.installationId);
            else if (ord.installationId) installationIdsSet.add(ord.installationId);
          }
        }
      }

      return {
        ...item,
        indiaProduction: item.indiaProduction || 0,
        required,
        dispatched,
        inTransit,
        scheduled,
        installed,
        orderIds: Array.from(orderIdsSet),
        installationIds: Array.from(installationIdsSet),
      };
    });
  }

  static saveDeviceStock(stock: DeviceStockItem[]): DeviceStockItem[] {
    setStorage(STORAGE_KEYS.DEVICE_STOCK, stock);
    return stock;
  }

  // ONLY Production Stock can be manually adjusted
  static adjustProductionStock(deviceKey: string, newStock: number): DeviceStockItem {
    const stock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);
    const targetIdx = stock.findIndex(s => s.deviceKey === deviceKey);
    const validatedStock = Math.max(0, Math.floor(newStock));

    if (targetIdx >= 0) {
      stock[targetIdx] = {
        ...stock[targetIdx],
        indiaProduction: validatedStock,
        updatedAt: new Date().toISOString(),
      };
      setStorage(STORAGE_KEYS.DEVICE_STOCK, stock);
      return stock[targetIdx];
    }

    const def = DEVICE_DEFINITIONS.find(d => d.key === deviceKey);
    const newItem: DeviceStockItem = {
      id: `stock_${deviceKey}`,
      deviceKey,
      deviceName: def?.name || deviceKey,
      deviceDescription: def?.description || 'Sensor node',
      usWarehouse: 0,
      indiaProduction: validatedStock,
      updatedAt: new Date().toISOString(),
    };
    stock.push(newItem);
    setStorage(STORAGE_KEYS.DEVICE_STOCK, stock);
    return newItem;
  }

  static recordStockAction(
    deviceKey: string,
    action: StockActionType,
    quantity: number
  ): { updatedItem: DeviceStockItem; allStock: DeviceStockItem[] } {
    if (!quantity || !Number.isInteger(quantity) || quantity <= 0) {
      throw new Error('Quantity must be a positive whole number greater than zero.');
    }

    const rawStock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);
    const targetIndex = rawStock.findIndex(item => item.deviceKey === deviceKey);
    if (targetIndex === -1) {
      throw new Error(`Device with key "${deviceKey}" was not found in inventory.`);
    }

    const item = { ...rawStock[targetIndex] };

    if (action === 'production_ready') {
      item.indiaProduction += quantity;
    } else if (action === 'shipped_to_us') {
      if (quantity > item.indiaProduction) {
        throw new Error(
          `Insufficient stock in India Production. Available: ${item.indiaProduction}, Requested: ${quantity}`
        );
      }
      item.indiaProduction -= quantity;
      item.usWarehouse += quantity;
    } else if (action === 'installed_client') {
      if (quantity > item.usWarehouse) {
        throw new Error(
          `Insufficient stock in US Warehouse. Available: ${item.usWarehouse}, Requested: ${quantity}`
        );
      }
      item.usWarehouse -= quantity;
    } else {
      throw new Error(`Invalid stock action: ${action}`);
    }

    item.updatedAt = new Date().toISOString();
    rawStock[targetIndex] = item;
    this.saveDeviceStock(rawStock);

    if (action === 'production_ready' || action === 'shipped_to_us') {
      const reqMap = this.getClientRequirementsMap();
      let changed = false;
      for (const cId in reqMap) {
        reqMap[cId] = reqMap[cId].map(req => {
          if (req.deviceKey === deviceKey) {
            changed = true;
            return {
              ...req,
              indiaStock: item.indiaProduction,
              updatedAt: new Date().toISOString(),
            };
          }
          return req;
        });
      }
      if (changed) {
        setStorage(STORAGE_KEYS.CLIENT_REQUIREMENTS, reqMap);
      }
    }

    return { updatedItem: item, allStock: this.getDeviceStock() };
  }

  // === ORDERS (Client Requirements & Workflow) ===
  static getOrders(): ClientOrderRecord[] {
    const orders = getStorage<ClientOrderRecord[]>(STORAGE_KEYS.ORDERS, MOCK_ORDERS);
    const rawLeads = getStorage<Lead[]>(STORAGE_KEYS.LEADS, []);
    const contacts = getStorage<Contact[]>(STORAGE_KEYS.CONTACTS, []);
    const companies = getStorage<Company[]>(STORAGE_KEYS.COMPANIES, []);
    const quotations = getStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, []);

    const indianKeywords = [
      'india', 'tamilnadu', 'tamil nadu', 'karnataka', 'maharashtra', 'kerala',
      'andhra', 'telangana', 'gujarat', 'rajasthan', 'punjab', 'haryana',
      'uttar pradesh', 'madhya pradesh', 'bihar', 'bengal', 'odisha', 'delhi',
      'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata',
      'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'coimbatore', 'kochi',
      'trivandrum', 'thiruvananthapuram', 'madurai', 'trichy', 'salem', 'tiruppur',
      'noida', 'gurgaon', 'gurugram', 'chandigarh', 'indore', 'bhopal', 'nagpur'
    ];

    let changed = false;
    const sanitized = orders.map(o => {
      // 1. Auto-heal any orders where installed exceeded totalRequired
      if (o.installed > o.totalRequired && o.totalRequired > 0) {
        changed = true;
        const fixedDevices = o.devices.map(d => ({
          ...d,
          installed: Math.min(d.quantity, d.installed > d.quantity ? d.quantity : d.installed),
        }));
        const newInstalled = fixedDevices.reduce((sum, d) => sum + (d.installed || 0), 0);
        o = {
          ...o,
          devices: fixedDevices,
          installed: newInstalled,
        };
      }

      // 2. Auto-heal order country and location based on client enquiry or contact
      const clientNameLower = (o.clientName || '').trim().toLowerCase();
      const clientId = o.clientId;

      const lead = rawLeads.find(
        l =>
          (clientNameLower && l.company && l.company.trim().toLowerCase() === clientNameLower) ||
          (clientNameLower && l.name && l.name.trim().toLowerCase() === clientNameLower) ||
          (clientId && l.id === clientId) ||
          (clientId && l.convertedContactId === clientId)
      );

      const contact = contacts.find(
        c =>
          (clientId && c.id === clientId) ||
          (clientId && c.companyId === clientId) ||
          (clientNameLower && c.companyName && c.companyName.trim().toLowerCase() === clientNameLower) ||
          (clientNameLower && c.name && c.name.trim().toLowerCase() === clientNameLower)
      );

      const quote = quotations.find(
        q =>
          (clientNameLower && q.companyName && q.companyName.trim().toLowerCase() === clientNameLower) ||
          (clientNameLower && q.contactName && q.contactName.trim().toLowerCase() === clientNameLower)
      );

      const comp = companies.find(
        cp =>
          (clientId && cp.id === clientId) ||
          (clientNameLower && cp.name && cp.name.trim().toLowerCase() === clientNameLower)
      );

      const resolvedCountry =
        lead?.country ||
        contact?.country ||
        quote?.country ||
        comp?.country ||
        '';

      const resolvedLocation =
        lead?.location ||
        contact?.location ||
        quote?.location ||
        comp?.city ||
        '';

      const combinedText = `${resolvedCountry} ${resolvedLocation} ${o.location || ''} ${o.country || ''}`.toLowerCase();
      const isIndia =
        resolvedCountry.toLowerCase() === 'india' ||
        resolvedCountry.toLowerCase().includes('india') ||
        indianKeywords.some(k => combinedText.includes(k));

      const isUsa =
        resolvedCountry.toLowerCase() === 'usa' ||
        resolvedCountry.toLowerCase() === 'united states' ||
        resolvedCountry.toLowerCase().includes('usa');

      if (isIndia && (o.country !== 'India' || !o.location || o.location === 'Main Facility')) {
        changed = true;
        o = {
          ...o,
          country: 'India',
          location: resolvedLocation && resolvedLocation !== 'Main Facility' ? resolvedLocation : 'India',
        };
      } else if (!isIndia && isUsa && (o.country !== 'USA' && o.country !== 'United States')) {
        changed = true;
        o = {
          ...o,
          country: 'USA',
          location: resolvedLocation || o.location || 'US Office',
        };
      }

      return o;
    });

    if (changed) {
      setStorage(STORAGE_KEYS.ORDERS, sanitized);
    }
    return sanitized;
  }

  static saveOrders(orders: ClientOrderRecord[]): ClientOrderRecord[] {
    setStorage(STORAGE_KEYS.ORDERS, orders);
    return orders;
  }

  static saveOrder(order: ClientOrderRecord): ClientOrderRecord {
    const list = this.getOrders();
    const idx = list.findIndex(o => o.id === order.id);
    if (idx >= 0) {
      list[idx] = { ...order, updatedAt: new Date().toISOString() };
    } else {
      list.unshift(order);
    }
    this.saveOrders(list);
    return order;
  }

  static deleteOrder(id: string): void {
    const list = this.getOrders().filter(o => o.id !== id);
    this.saveOrders(list);
  }

  // === WORKFLOW STEP 1: DISPATCH (India Production -> In Transit) ===
  static dispatchWorkflow(
    orderId: string,
    deviceKey: string,
    quantity: number,
    _carrier?: string,
    _dispatchDate?: string,
    location?: string
  ): { order: ClientOrderRecord } {
    if (quantity <= 0) throw new Error('Dispatch quantity must be at least 1.');

    const orders = this.getOrders();
    const orderIdx = orders.findIndex(
      o => o.id === orderId || `${o.orderPrefix || ''}${o.orderNumber}` === orderId
    );
    if (orderIdx === -1) throw new Error(`Order ${orderId} not found.`);

    const order = { ...orders[orderIdx] };
    const devIdx = order.devices.findIndex(d => d.deviceKey === deviceKey);
    if (devIdx === -1) throw new Error(`Device ${deviceKey} not found on Order ${orderId}.`);

    const dev = { ...order.devices[devIdx] };

    // Prevent dispatching more than the client requested
    const remainingNeeded = Math.max(0, (dev.quantity || 0) - (dev.dispatched || 0));
    if (remainingNeeded <= 0) {
      throw new Error(
        `All requested ${dev.deviceName || deviceKey} units for Order ${orderId} have already been dispatched (${dev.dispatched}/${dev.quantity}).`
      );
    }
    if (quantity > remainingNeeded) {
      throw new Error(
        `Cannot dispatch ${quantity} units! Client only requires ${remainingNeeded} more unit(s) (ordered: ${dev.quantity}, already dispatched: ${dev.dispatched || 0}).`
      );
    }

    // Check India production stock
    const rawStock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);
    const stockIdx = rawStock.findIndex(s => s.deviceKey === deviceKey);
    if (stockIdx === -1) throw new Error(`Stock record for ${deviceKey} not found.`);

    // Available production stock in India
    const availableIndiaProduction = rawStock[stockIdx].indiaProduction || 0;

    if (availableIndiaProduction < quantity) {
      throw new Error(
        `Insufficient Production Stock in India! Available: ${availableIndiaProduction}, Requested: ${quantity}. Please produce or adjust Production Stock first.`
      );
    }

    // 1. Decrease Production Stock:
    rawStock[stockIdx].indiaProduction = Math.max(0, (rawStock[stockIdx].indiaProduction || 0) - quantity);
    rawStock[stockIdx].updatedAt = new Date().toISOString();
    setStorage(STORAGE_KEYS.DEVICE_STOCK, rawStock);

    // 2. Update Order record
    dev.dispatched = (dev.dispatched || 0) + quantity;
    dev.inTransit = (dev.inTransit || 0) + quantity;

    order.devices[devIdx] = dev;
    order.dispatched = order.devices.reduce((sum, d) => sum + (d.dispatched || 0), 0);
    order.inTransit = order.devices.reduce((sum, d) => sum + (d.inTransit || 0), 0);
    if (location) {
      order.dispatchLocation = location;
      if (!order.location || order.location === 'Main Facility' || order.location === 'US Office' || order.location === 'India') {
        order.location = location;
      }
    }
    order.status = 'Dispatched / In Transit';
    order.updatedAt = new Date().toISOString();

    orders[orderIdx] = order;
    this.saveOrders(orders);

    return { order };
  }

  // === WORKFLOW STEP 2: RECEIVE IN US (In Transit -> US Warehouse) ===
  static receiveWorkflowInTransit(
    identifier: string,
    deviceKey?: string,
    quantityToReceive?: number
  ): { receivedQuantity: number; order?: ClientOrderRecord } {
    const orders = this.getOrders();
    const rawStock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);

    // 1. Try finding matching order by orderId
    const targetOrder = orders.find(
      o =>
        o.id === identifier ||
        `${o.orderPrefix || ''}${o.orderNumber}` === identifier ||
        `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === identifier
    );

    let receivedQty = 0;
    if (targetOrder) {
      targetOrder.devices = targetOrder.devices.map(dev => {
        // If deviceKey is specified, only receive for that specific device
        if (deviceKey && dev.deviceKey !== deviceKey) {
          return dev;
        }
        const qty =
          quantityToReceive !== undefined
            ? Math.min(dev.inTransit || 0, quantityToReceive)
            : dev.inTransit || 0;
        if (qty > 0) {
          receivedQty += qty;
          dev.inTransit = Math.max(0, (dev.inTransit || 0) - qty);
          dev.usWarehouse = (dev.usWarehouse || 0) + qty;

          const sIdx = rawStock.findIndex(s => s.deviceKey === dev.deviceKey);
          if (sIdx >= 0) {
            rawStock[sIdx].usWarehouse = (rawStock[sIdx].usWarehouse || 0) + qty;
            rawStock[sIdx].updatedAt = new Date().toISOString();
          }
        }
        return dev;
      });

      targetOrder.inTransit = targetOrder.devices.reduce((sum, d) => sum + (d.inTransit || 0), 0);
      targetOrder.usWarehouse = targetOrder.devices.reduce((sum, d) => sum + (d.usWarehouse || 0), 0);
      if (targetOrder.inTransit === 0 && targetOrder.usWarehouse > 0) {
        targetOrder.status = 'In US Warehouse';
      }
      targetOrder.updatedAt = new Date().toISOString();
      this.saveOrders(orders);
      setStorage(STORAGE_KEYS.DEVICE_STOCK, rawStock);
      return { receivedQuantity: receivedQty, order: targetOrder };
    }

    // 2. Otherwise, treat identifier as deviceKey
    const targetDevKey = deviceKey || identifier;
    for (const ord of orders) {
      if (!ord.devices) continue;
      for (const dev of ord.devices) {
        if (dev.deviceKey === targetDevKey && dev.inTransit > 0) {
          const qty =
            quantityToReceive !== undefined
              ? Math.min(dev.inTransit, quantityToReceive - receivedQty)
              : dev.inTransit;
          if (qty > 0) {
            receivedQty += qty;
            dev.inTransit -= qty;
            dev.usWarehouse = (dev.usWarehouse || 0) + qty;
          }
        }
      }
      ord.inTransit = ord.devices.reduce((sum, d) => sum + (d.inTransit || 0), 0);
      ord.usWarehouse = ord.devices.reduce((sum, d) => sum + (d.usWarehouse || 0), 0);
      if (ord.inTransit === 0 && ord.usWarehouse > 0) {
        ord.status = 'In US Warehouse';
      }
      ord.updatedAt = new Date().toISOString();
    }

    if (receivedQty > 0) {
      const sIdx = rawStock.findIndex(s => s.deviceKey === targetDevKey);
      if (sIdx >= 0) {
        rawStock[sIdx].usWarehouse = (rawStock[sIdx].usWarehouse || 0) + receivedQty;
        rawStock[sIdx].updatedAt = new Date().toISOString();
      }
      this.saveOrders(orders);
      setStorage(STORAGE_KEYS.DEVICE_STOCK, rawStock);
    }

    return { receivedQuantity: receivedQty };
  }

  // === WORKFLOW STEP 3: SCHEDULE INSTALLATION (US Warehouse -> Scheduled) ===
  static scheduleWorkflowInstallation(
    orderId: string,
    installer: string,
    date: string,
    siteAddress?: string,
    notes?: string,
    siteVisitTime?: string
  ): { installation: Installation; order: ClientOrderRecord; schedule: InstallerScheduleItem } {
    const orders = this.getOrders();
    const orderIdx = orders.findIndex(
      o => o.id === orderId || `${o.orderPrefix || 'ORD-'}${o.orderNumber}` === orderId
    );
    if (orderIdx === -1) throw new Error(`Order ${orderId} not found.`);

    const order = { ...orders[orderIdx] };
    const now = new Date().toISOString();

    const installations = this.getInstallations();
    let maxInstNum = 5001;
    installations.forEach(i => {
      const num = parseInt(i.id.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num >= maxInstNum) maxInstNum = num + 1;
    });
    const installationId = `INST-${maxInstNum}`;

    const newInst: Installation = {
      id: installationId,
      customerId: order.clientId,
      customerName: order.clientName,
      orderId: `${order.orderPrefix || 'ORD-'}${order.orderNumber}`,
      devices: order.devices.map(d => ({
        deviceKey: d.deviceKey,
        deviceName: d.deviceName,
        quantity: d.usWarehouse || d.quantity,
      })),
      bookingDate: now.split('T')[0],
      installationDate: date,
      installer: installer || '',
      status: 'scheduled',
      siteAddress: siteAddress || order.location,
      notes: notes || `Hardware scheduled for order ${order.orderPrefix || 'ORD-'}${order.orderNumber}.`,
      createdAt: now,
      updatedAt: now,
    };

    if (installer && installer.trim()) {
      this.addTechnician(installer.trim());
    }

    // Create synchronized Installer Schedule Appointment FIRST to avoid auto-heal duplicate
    const deviceSummary = order.devices && order.devices.length > 0
      ? order.devices.map(d => `${d.deviceName} × ${d.quantity}`).join(', ')
      : '';
    const scheduleItem: InstallerScheduleItem = {
      id: `sch_${maxInstNum}`,
      installer: installer || '',
      siteVisitTime: siteVisitTime || '10:00 AM - 12:00 PM',
      visitDate: date,
      customerId: order.clientId,
      customerName: order.clientName,
      installationId: installationId,
      status: 'confirmed',
      siteAddress: siteAddress || order.location,
      notes: notes || `Hardware scheduled for order ${order.orderPrefix || 'ORD-'}${order.orderNumber}${deviceSummary ? ` (${deviceSummary})` : ''}`,
      createdAt: now,
      updatedAt: now,
    };
    this.saveInstallerSchedule(scheduleItem);

    installations.unshift(newInst);
    setStorage(STORAGE_KEYS.INSTALLATIONS, installations);

    // Update Order
    order.installationId = installationId;
    order.devices = order.devices.map(d => ({
      ...d,
      scheduled: d.usWarehouse || d.quantity,
      installationId,
    }));
    order.scheduled = order.devices.reduce((sum, d) => sum + (d.scheduled || 0), 0);
    order.status = 'Installation scheduled';
    order.updatedAt = now;

    orders[orderIdx] = order;
    this.saveOrders(orders);

    return { installation: newInst, order, schedule: scheduleItem };
  }

  // === WORKFLOW STEP 4: COMPLETE INSTALLATION (Scheduled -> Installed) ===
  static completeWorkflowInstallation(
    installationId: string,
    actualInstalledCount?: number
  ): { installation: Installation; order?: ClientOrderRecord; schedule?: InstallerScheduleItem } {
    const installations = this.getInstallations();
    const instIdx = installations.findIndex(
      i => i.id === installationId || i.id.toLowerCase() === installationId.toLowerCase()
    );
    if (instIdx === -1) throw new Error(`Installation ${installationId} not found.`);

    const inst = { ...installations[instIdx] };
    const totalInstReq = (inst.devices || []).reduce((sum, d) => sum + (d.quantity || 0), 0) || 10;
    const finalInstalled = actualInstalledCount !== undefined ? Math.max(0, actualInstalledCount) : totalInstReq;
    const isFullyCompleted = finalInstalled >= totalInstReq;

    // 1. Update installation record and its device installed quantities
    inst.status = isFullyCompleted ? 'completed' : 'in_progress';
    inst.devices = (inst.devices || []).map(d => {
      const devInstalled = finalInstalled >= totalInstReq
        ? d.quantity
        : Math.min(d.quantity, Math.round(d.quantity * (finalInstalled / totalInstReq)) || finalInstalled);
      return {
        ...d,
        installedQuantity: devInstalled,
      };
    });
    inst.updatedAt = new Date().toISOString();
    installations[instIdx] = inst;
    setStorage(STORAGE_KEYS.INSTALLATIONS, installations);

    // 2. Sync status on linked installer schedule appointment
    const schedules = this.getInstallerSchedules();
    let schChanged = false;
    let matchedSchedule: InstallerScheduleItem | undefined;
    schedules.forEach(s => {
      if (s.installationId === inst.id || s.installationId === installationId) {
        s.status = isFullyCompleted ? 'completed' : 'in_progress';
        s.updatedAt = new Date().toISOString();
        schChanged = true;
        matchedSchedule = s;
      }
    });
    if (schChanged) {
      setStorage(STORAGE_KEYS.INSTALLER_SCHEDULE, schedules);
    }

    // 3. Find linked order
    const orders = this.getOrders();
    const orderIdx = orders.findIndex(
      o =>
        o.installationId === inst.id ||
        (inst.orderId && (`${o.orderPrefix || 'ORD-'}${o.orderNumber}` === inst.orderId || o.id === inst.orderId)) ||
        (inst.customerId && o.clientId === inst.customerId && (o.status === 'Installation scheduled' || o.status === 'Dispatched / In Transit'))
    );

    let updatedOrder: ClientOrderRecord | undefined;
    const rawStock = getStorage<DeviceStockItem[]>(STORAGE_KEYS.DEVICE_STOCK, MOCK_DEVICE_STOCK);

    if (orderIdx >= 0) {
      const order = { ...orders[orderIdx] };
      const totalOrderReq = order.totalRequired || order.devices.reduce((sum, d) => sum + (d.quantity || 0), 0) || 1;

      order.devices = order.devices.map(d => {
        const count = finalInstalled >= totalOrderReq
          ? d.quantity
          : Math.min(d.quantity, Math.round(d.quantity * (finalInstalled / totalOrderReq)) || finalInstalled);

        const prevInstalled = d.installed || 0;
        const newlyInstalled = Math.max(0, count - prevInstalled);
        if (newlyInstalled > 0) {
          const sIdx = rawStock.findIndex(s => s.deviceKey === d.deviceKey);
          if (sIdx >= 0) {
            rawStock[sIdx].usWarehouse = Math.max(0, (rawStock[sIdx].usWarehouse || 0) - newlyInstalled);
            rawStock[sIdx].updatedAt = new Date().toISOString();
          }
        }

        const remainingToInstall = Math.max(0, d.quantity - count);
        return {
          ...d,
          scheduled: remainingToInstall,
          installed: count,
        };
      });

      order.scheduled = order.devices.reduce((sum, d) => sum + (d.scheduled || 0), 0);
      order.installed = order.devices.reduce((sum, d) => sum + (d.installed || 0), 0);
      order.status = order.installed >= totalOrderReq ? 'Completed' : 'Installation scheduled';
      order.updatedAt = new Date().toISOString();

      orders[orderIdx] = order;
      this.saveOrders(orders);
      setStorage(STORAGE_KEYS.DEVICE_STOCK, rawStock);
      updatedOrder = order;
    }

    return { installation: inst, order: updatedOrder, schedule: matchedSchedule };
  }

  // === TECHNICIANS / INSTALLERS ===
  static getTechnicians(): string[] {
    const custom = getStorage<string[]>(STORAGE_KEYS.TECHNICIANS, []);
    const installations = this.getInstallations();
    const schedules = this.getInstallerSchedules();
    const all = new Set([
      ...custom,
      ...installations.map(i => i.installer),
      ...schedules.map(s => s.installer),
    ]);
    return Array.from(all).filter(Boolean);
  }

  static addTechnician(name: string): string[] {
    const trimmed = name.trim();
    if (!trimmed) return this.getTechnicians();
    const current = getStorage<string[]>(STORAGE_KEYS.TECHNICIANS, []);
    if (!current.includes(trimmed)) {
      current.push(trimmed);
      setStorage(STORAGE_KEYS.TECHNICIANS, current);
    }
    return this.getTechnicians();
  }
}

// Initialize clean data structures
CrmStorage.init();

