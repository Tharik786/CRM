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
  QuotationStatus
} from '../../types/crm';
import { MockStorageServer } from '../mockServer';

// Simulated latency helper for authentic asynchronous REST feel
const delay = (ms: number = 180) => new Promise(resolve => setTimeout(resolve, ms));

export const crmService = {
  // === AUTHENTICATION ===
  async login(email: string, _password?: string): Promise<{ user: User; token: string }> {
    await delay(300);
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    const user = MockStorageServer.getUser();
    user.email = email;
    const token = `zancrm_token_${Date.now()}`;
    MockStorageServer.setUser(user);
    MockStorageServer.setToken(token);
    return { user, token };
  },

  async logout(): Promise<void> {
    await delay(100);
    MockStorageServer.setToken(null);
  },

  async getCurrentUser(): Promise<User> {
    await delay(100);
    return MockStorageServer.getUser();
  },

  async updateCurrentUser(data: Partial<User>): Promise<User> {
    await delay(150);
    const current = MockStorageServer.getUser();
    const updated = { ...current, ...data };
    MockStorageServer.setUser(updated);
    return updated;
  },

  // === DASHBOARD & METRICS ===
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await delay(200);
    const deals = MockStorageServer.getDeals();
    const leads = MockStorageServer.getLeads();
    const tasks = MockStorageServer.getTasks();
    const activities = MockStorageServer.getActivities();

    const wonDeals = deals.filter(d => d.stage === 'closed_won');
    const closedDeals = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost');
    
    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = deals
      .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + d.value, 0);

    const winRate = closedDeals.length > 0 
      ? Math.round((wonDeals.length / closedDeals.length) * 100) 
      : 65;

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
      revenueChange: 14.8,
      dealsWonCount: wonDeals.length,
      dealsWonChange: 22.5,
      activeLeadsCount: leads.filter(l => l.status !== 'converted' && l.status !== 'unqualified').length,
      leadsChange: 8.4,
      winRate,
      winRateChange: 4.2,
      pipelineValue,
      stageBreakdown,
      recentActivities: activities.slice(0, 6),
      upcomingTasks,
    };
  },

  // === LEADS ===
  async getLeads(): Promise<Lead[]> {
    await delay();
    return MockStorageServer.getLeads();
  },

  async createLead(leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>): Promise<Lead> {
    await delay();
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MockStorageServer.saveLead(newLead);
    MockStorageServer.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `New lead captured: ${newLead.name}`,
      description: `Company: ${newLead.company}, Est Value: $${newLead.estimatedValue.toLocaleString()}`,
      performedBy: MockStorageServer.getUser().name,
      performedById: MockStorageServer.getUser().id,
      timestamp: new Date().toISOString(),
      relatedToType: 'lead',
      relatedToId: newLead.id,
      relatedToName: newLead.name,
    });
    return newLead;
  },

  async updateLead(id: string, leadData: Partial<Lead>): Promise<Lead> {
    await delay();
    const leads = MockStorageServer.getLeads();
    const current = leads.find(l => l.id === id);
    if (!current) throw new Error('Lead not found');
    const updated = { ...current, ...leadData, updatedAt: new Date().toISOString() };
    return MockStorageServer.saveLead(updated);
  },

  async deleteLead(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteLead(id);
  },

  async convertLeadToDeal(leadId: string): Promise<{ deal: Deal; contact: Contact }> {
    await delay(250);
    const leads = MockStorageServer.getLeads();
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    lead.status = 'converted';
    lead.updatedAt = new Date().toISOString();
    MockStorageServer.saveLead(lead);

    // Create Contact
    const contact: Contact = {
      id: `cont_${Date.now()}`,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      title: 'Prospect / Decision Maker',
      companyName: lead.company,
      lifecycleStage: 'lead',
      lastActivityAt: new Date().toISOString(),
      assignedTo: lead.assignedTo,
      createdAt: new Date().toISOString(),
    };
    MockStorageServer.saveContact(contact);

    // Create Deal
    const deal: Deal = {
      id: `deal_${Date.now()}`,
      title: `${lead.company} - Expansion Deal`,
      value: lead.estimatedValue || 50000,
      currency: 'USD',
      stage: 'qualification',
      probability: 30,
      expectedCloseDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      companyName: lead.company,
      contactId: contact.id,
      contactName: contact.name,
      assignedTo: lead.assignedTo,
      priority: 'high',
      tags: ['Converted Lead'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MockStorageServer.saveDeal(deal);

    MockStorageServer.addActivity({
      id: `act_${Date.now()}`,
      type: 'deal_stage_changed',
      title: `Lead converted to Deal: ${deal.title}`,
      description: `Converted from lead ${lead.name}. Valued at $${deal.value.toLocaleString()}`,
      performedBy: MockStorageServer.getUser().name,
      performedById: MockStorageServer.getUser().id,
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
    return MockStorageServer.getDeals();
  },

  async createDeal(dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>): Promise<Deal> {
    await delay();
    const newDeal: Deal = {
      ...dealData,
      id: `deal_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MockStorageServer.saveDeal(newDeal);
    MockStorageServer.addActivity({
      id: `act_${Date.now()}`,
      type: 'deal_stage_changed',
      title: `Opportunity created: ${newDeal.title}`,
      description: `Value: $${newDeal.value.toLocaleString()} in stage ${newDeal.stage}`,
      performedBy: MockStorageServer.getUser().name,
      performedById: MockStorageServer.getUser().id,
      timestamp: new Date().toISOString(),
      relatedToType: 'deal',
      relatedToId: newDeal.id,
      relatedToName: newDeal.title,
    });
    return newDeal;
  },

  async updateDeal(id: string, dealData: Partial<Deal>): Promise<Deal> {
    await delay();
    const deals = MockStorageServer.getDeals();
    const current = deals.find(d => d.id === id);
    if (!current) throw new Error('Deal not found');
    const updated = { ...current, ...dealData, updatedAt: new Date().toISOString() };
    return MockStorageServer.saveDeal(updated);
  },

  async updateDealStage(id: string, stage: DealStage): Promise<Deal> {
    await delay(120);
    const deal = MockStorageServer.updateDealStage(id, stage);
    if (!deal) throw new Error('Deal not found');
    return deal;
  },

  async deleteDeal(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteDeal(id);
  },

  // === CONTACTS & COMPANIES ===
  async getContacts(): Promise<Contact[]> {
    await delay();
    return MockStorageServer.getContacts();
  },

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'lastActivityAt'>): Promise<Contact> {
    await delay();
    const newContact: Contact = {
      ...contactData,
      id: `cont_${Date.now()}`,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    return MockStorageServer.saveContact(newContact);
  },

  async updateContact(id: string, contactData: Partial<Contact>): Promise<Contact> {
    await delay();
    const list = MockStorageServer.getContacts();
    const current = list.find(c => c.id === id);
    if (!current) throw new Error('Contact not found');
    const updated = { ...current, ...contactData };
    return MockStorageServer.saveContact(updated);
  },

  async deleteContact(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteContact(id);
  },

  async getCompanies(): Promise<Company[]> {
    await delay();
    return MockStorageServer.getCompanies();
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
    return MockStorageServer.saveCompany(newCompany);
  },

  async updateCompany(id: string, data: Partial<Company>): Promise<Company> {
    await delay();
    const list = MockStorageServer.getCompanies();
    const current = list.find(c => c.id === id);
    if (!current) throw new Error('Company not found');
    const updated = { ...current, ...data };
    return MockStorageServer.saveCompany(updated);
  },

  async deleteCompany(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteCompany(id);
  },

  // === QUOTATIONS ===
  async getQuotations(): Promise<Quotation[]> {
    await delay();
    return MockStorageServer.getQuotations();
  },

  async createQuotation(data: Omit<Quotation, 'id' | 'createdAt' | 'quoteNumber'>): Promise<Quotation> {
    await delay();
    const quotes = MockStorageServer.getQuotations();
    const quoteNumber = `Q-2026-${String(quotes.length + 90).padStart(3, '0')}`;
    const newQuote: Quotation = {
      ...data,
      id: `quot_${Date.now()}`,
      quoteNumber,
      createdAt: new Date().toISOString(),
    };
    return MockStorageServer.saveQuotation(newQuote);
  },

  async updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    await delay();
    const quotes = MockStorageServer.getQuotations();
    const quote = quotes.find(q => q.id === id);
    if (!quote) throw new Error('Quotation not found');
    quote.status = status;
    return MockStorageServer.saveQuotation(quote);
  },

  async deleteQuotation(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteQuotation(id);
  },

  // === TASKS ===
  async getTasks(): Promise<Task[]> {
    await delay();
    return MockStorageServer.getTasks();
  },

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    await delay();
    const newTask: Task = {
      ...taskData,
      id: `task_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    return MockStorageServer.saveTask(newTask);
  },

  async toggleTaskStatus(id: string): Promise<Task> {
    await delay(100);
    const task = MockStorageServer.toggleTask(id);
    if (!task) throw new Error('Task not found');
    return task;
  },

  async deleteTask(id: string): Promise<void> {
    await delay();
    MockStorageServer.deleteTask(id);
  },

  // === ACTIVITIES ===
  async getActivities(): Promise<Activity[]> {
    await delay();
    return MockStorageServer.getActivities();
  },

  async createActivity(activityData: Omit<Activity, 'id' | 'timestamp' | 'performedBy' | 'performedById'>): Promise<Activity> {
    await delay();
    const user = MockStorageServer.getUser();
    const newActivity: Activity = {
      ...activityData,
      id: `act_${Date.now()}`,
      performedBy: user.name,
      performedById: user.id,
      timestamp: new Date().toISOString(),
    };
    return MockStorageServer.addActivity(newActivity);
  },

  // === SETTINGS & SYSTEM ===
  async getSettings(): Promise<WorkspaceSettings> {
    await delay(100);
    return MockStorageServer.getSettings();
  },

  async updateSettings(settings: WorkspaceSettings): Promise<WorkspaceSettings> {
    await delay(150);
    return MockStorageServer.saveSettings(settings);
  },

  async resetData(): Promise<void> {
    await delay(200);
    MockStorageServer.resetAll();
  }
};
