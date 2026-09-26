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
  DealStage
} from '../types/crm';
import {
  INITIAL_USER,
  INITIAL_COMPANIES,
  INITIAL_CONTACTS,
  INITIAL_LEADS,
  INITIAL_DEALS,
  INITIAL_QUOTATIONS,
  INITIAL_TASKS,
  INITIAL_ACTIVITIES,
  INITIAL_SETTINGS
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

export class MockStorageServer {
  static init(): void {
    if (!localStorage.getItem(STORAGE_KEYS.COMPANIES)) {
      setStorage(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CONTACTS)) {
      setStorage(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADS)) {
      setStorage(STORAGE_KEYS.LEADS, INITIAL_LEADS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DEALS)) {
      setStorage(STORAGE_KEYS.DEALS, INITIAL_DEALS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUOTATIONS)) {
      setStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
      setStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
      setStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.USER)) {
      setStorage(STORAGE_KEYS.USER, INITIAL_USER);
    }
    // Set a default demo token if not logged out
    if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) {
      setStorage(STORAGE_KEYS.TOKEN, 'demo_session_token_xyz_2026');
    }
  }

  static resetAll(): void {
    setStorage(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
    setStorage(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
    setStorage(STORAGE_KEYS.LEADS, INITIAL_LEADS);
    setStorage(STORAGE_KEYS.DEALS, INITIAL_DEALS);
    setStorage(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
    setStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    setStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    setStorage(STORAGE_KEYS.USER, INITIAL_USER);
  }

  // Auth
  static getUser(): User {
    return getStorage<User>(STORAGE_KEYS.USER, INITIAL_USER);
  }
  static setUser(user: User): void {
    setStorage(STORAGE_KEYS.USER, user);
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
    return getStorage<Company[]>(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES);
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
    return getStorage<Contact[]>(STORAGE_KEYS.CONTACTS, INITIAL_CONTACTS);
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
    return getStorage<Lead[]>(STORAGE_KEYS.LEADS, INITIAL_LEADS);
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
    return getStorage<Deal[]>(STORAGE_KEYS.DEALS, INITIAL_DEALS);
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

      // Log activity
      this.addActivity({
        id: `act_${Date.now()}`,
        type: 'deal_stage_changed',
        title: `Deal "${deal.title}" moved to ${stage.replace('_', ' ').toUpperCase()}`,
        description: `Probability updated to ${deal.probability}%. Total value: $${deal.value.toLocaleString()}`,
        performedBy: this.getUser().name,
        performedById: this.getUser().id,
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
    return getStorage<Quotation[]>(STORAGE_KEYS.QUOTATIONS, INITIAL_QUOTATIONS);
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

    this.addActivity({
      id: `act_${Date.now()}`,
      type: 'quotation_created',
      title: `Quotation ${quote.quoteNumber} ${idx >= 0 ? 'updated' : 'created'}`,
      description: `For ${quote.companyName} (${quote.contactName}) amounting to $${quote.total.toLocaleString()}`,
      performedBy: this.getUser().name,
      performedById: this.getUser().id,
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
    return getStorage<Task[]>(STORAGE_KEYS.TASKS, INITIAL_TASKS);
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
    return getStorage<Activity[]>(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  }
  static addActivity(activity: Activity): Activity {
    const list = this.getActivities();
    list.unshift(activity);
    setStorage(STORAGE_KEYS.ACTIVITIES, list);
    return activity;
  }

  // Settings
  static getSettings(): WorkspaceSettings {
    return getStorage<WorkspaceSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }
  static saveSettings(settings: WorkspaceSettings): WorkspaceSettings {
    setStorage(STORAGE_KEYS.SETTINGS, settings);
    return settings;
  }
}

// Auto initialize on load
MockStorageServer.init();
