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
  DeviceInventoryItem,
  ClientDeviceRequirement,
  DeviceStockItem,
  StockActionType,
  ClientOrderRecord,
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

  async signup(
    firstName: string,
    lastName: string,
    email: string,
    _password?: string
  ): Promise<{ user: User; token: string }> {
    await delay(150);
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      throw new Error('Please enter your full name.');
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      name: fullName,
      email: email.trim(),
      role: 'admin',
      title: 'Administrator',
      phone: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notificationsEnabled: true,
    };

    const token = `zancrm_token_${Date.now()}`;
    CrmStorage.setUser(user);
    CrmStorage.setToken(token);
    return { user, token };
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    await delay(150);
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    return {
      success: true,
      message: `Password reset link has been dispatched to ${email}. Please check your inbox.`,
    };
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

    const wonDeals = deals.filter(d => d.stage === 'won');
    const closedDeals = deals.filter(d => d.stage === 'won' || d.stage === 'lost');

    const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
    const pipelineValue = deals
      .filter(d => d.stage !== 'won' && d.stage !== 'lost' && d.stage !== 'cold')
      .reduce((sum, d) => sum + d.value, 0);

    const winRate = closedDeals.length > 0
      ? Math.round((wonDeals.length / closedDeals.length) * 100)
      : 0;

    const stages: DealStage[] = ['new', 'proposal', 'negotiation', 'won', 'lost', 'cold'];
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

    // If marked as converted immediately, convert to client and remove from enquiries
    if (newLead.status === 'converted') {
      await this.convertLeadToDeal(newLead.id);
      return newLead;
    }

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

    // If updated to converted, immediately move to Client Directory and remove from Enquiry table
    if (updated.status === 'converted') {
      CrmStorage.saveLead(updated);
      await this.convertLeadToDeal(updated.id);
      return updated;
    }

    // Sync matching contact in Client Directory if enquiry was previously converted
    const contacts = CrmStorage.getContacts();
    const contact = contacts.find(c => c.id === current.convertedContactId || (c.email && c.email.toLowerCase() === current.email.toLowerCase()));
    if (contact) {
      updated.convertedContactId = contact.id;
      CrmStorage.saveContact({
        ...contact,
        name: updated.name,
        companyName: updated.company,
        email: updated.email,
        phone: updated.phone,
        location: updated.location,
        country: updated.country || contact.country,
      });
    }

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

    // 1. Ensure Company exists in Client Directory
    const companies = CrmStorage.getCompanies();
    let company = companies.find(
      c => c.name.toLowerCase() === lead.company.trim().toLowerCase()
    );
    if (!company) {
      company = CrmStorage.saveCompany({
        id: `comp_${Date.now()}`,
        name: lead.company.trim(),
        domain: lead.email?.includes('@') ? lead.email.split('@')[1] : '',
        industry: 'Commercial & Facilities',
        size: '10-50',
        phone: lead.phone || '',
        city: lead.location || '',
        country: lead.country || '',
        totalRevenue: lead.estimatedValue || 0,
        openDealsCount: 1,
        createdAt: new Date().toISOString(),
      });
    } else {
      company = CrmStorage.saveCompany({
        ...company,
        phone: company.phone || lead.phone || '',
        city: company.city || lead.location || '',
        country: company.country || lead.country || '',
        totalRevenue: (company.totalRevenue || 0) + (lead.estimatedValue || 0),
        openDealsCount: (company.openDealsCount || 0) + 1,
      });
    }

    // 2. Ensure Contact exists in Client Directory (CrmStorage.saveContact automatically deduplicates)
    const contacts = CrmStorage.getContacts();
    const existingContact = contacts.find(
      c =>
        c.id === lead.convertedContactId ||
        (c.email && lead.email && c.email.toLowerCase() === lead.email.toLowerCase()) ||
        (c.companyName.toLowerCase() === lead.company.toLowerCase() &&
          c.name.toLowerCase() === lead.name.toLowerCase())
    );

    const contact = CrmStorage.saveContact({
      id: existingContact?.id || `cont_${Date.now()}`,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      title: '',
      companyId: company?.id,
      companyName: lead.company,
      location: lead.location || '',
      country: lead.country || '',
      lifecycleStage: 'customer',
      status: 'Won Client',
      notes: lead.notes || `Converted from Enquiry: ${lead.name} (${lead.company})`,
      lastActivityAt: new Date().toISOString(),
      assignedTo: lead.assignedTo || currentUser?.id || '',
      createdAt: existingContact?.createdAt || new Date().toISOString(),
    });

    lead.convertedContactId = contact.id;

    // 3. Create or update deal in Sales Pipeline
    const deals = CrmStorage.getDeals();
    const existingDeal = deals.find(
      d =>
        d.contactId === contact.id ||
        (d.companyName && d.companyName.toLowerCase() === lead.company.toLowerCase())
    );
    const deal = CrmStorage.saveDeal({
      id: existingDeal?.id || `deal_${Date.now()}`,
      title: existingDeal?.title || `${lead.company} - Opportunity`,
      value: lead.estimatedValue || 0,
      currency: lead.currency || 'USD',
      stage: existingDeal?.stage || 'new',
      probability: existingDeal?.probability || 20,
      expectedCloseDate:
        existingDeal?.expectedCloseDate ||
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      companyId: company?.id,
      companyName: lead.company,
      contactId: contact.id,
      contactName: contact.name,
      assignedTo: lead.assignedTo || currentUser?.id || '',
      priority: existingDeal?.priority || 'high',
      tags: existingDeal?.tags || ['Converted Lead'],
      createdAt: existingDeal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    lead.convertedDealId = deal.id;

    // 4. Update any linked quotations to link to the new deal
    const quotations = CrmStorage.getQuotations();
    quotations.forEach(q => {
      if (
        q.leadId === lead.id ||
        (q.companyName && q.companyName.toLowerCase() === lead.company.toLowerCase())
      ) {
        q.dealId = deal.id;
        q.dealTitle = deal.title;
        CrmStorage.saveQuotation(q);
      }
    });

    // 5. Remove the lead from Enquiry storage and table (moved to Client Directory only)
    CrmStorage.deleteLead(lead.id);

    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'deal_stage_changed',
      title: `Enquiry converted to Client: ${contact.name}`,
      description: `Moved ${contact.name} (${lead.company}) to Client Directory with Deal valued at ${deal.currency || '$'}${deal.value.toLocaleString()}`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
      relatedToType: 'contact',
      relatedToId: contact.id,
      relatedToName: contact.name,
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

    if (!newQuote.contactPhone || !newQuote.location || !newQuote.country) {
      const rawLeads = CrmStorage.getAllLeadsRaw();
      const matchedLead = newQuote.leadId
        ? rawLeads.find(l => l.id === newQuote.leadId)
        : rawLeads.find(
          l =>
            (l.email && newQuote.contactEmail && l.email.trim().toLowerCase() === newQuote.contactEmail.trim().toLowerCase()) ||
            (l.company && newQuote.companyName && l.company.trim().toLowerCase() === newQuote.companyName.trim().toLowerCase())
        );
      if (matchedLead) {
        if (!newQuote.contactPhone && matchedLead.phone) newQuote.contactPhone = matchedLead.phone;
        if (!newQuote.location && matchedLead.location) newQuote.location = matchedLead.location;
        if (!newQuote.country && matchedLead.country) newQuote.country = matchedLead.country;
      }
    }

    const saved = CrmStorage.saveQuotation(newQuote);
    this.syncQuotationStatusToLead(saved);
    return saved;
  },

  async updateQuotation(id: string, data: Partial<Quotation>): Promise<Quotation> {
    await delay();
    const quotes = CrmStorage.getQuotations();
    const current = quotes.find(q => q.id === id);
    if (!current) throw new Error('Quotation not found');
    const updated: Quotation = {
      ...current,
      ...data,
      id: current.id,
      quoteNumber: current.quoteNumber,
      createdAt: current.createdAt,
      createdBy: current.createdBy || data.createdBy || 'User',
    };

    if (!updated.contactPhone || !updated.location || !updated.country) {
      const rawLeads = CrmStorage.getAllLeadsRaw();
      const matchedLead = updated.leadId
        ? rawLeads.find(l => l.id === updated.leadId)
        : rawLeads.find(
          l =>
            (l.email && updated.contactEmail && l.email.trim().toLowerCase() === updated.contactEmail.trim().toLowerCase()) ||
            (l.company && updated.companyName && l.company.trim().toLowerCase() === updated.companyName.trim().toLowerCase())
        );
      if (matchedLead) {
        if (!updated.contactPhone && matchedLead.phone) updated.contactPhone = matchedLead.phone;
        if (!updated.location && matchedLead.location) updated.location = matchedLead.location;
        if (!updated.country && matchedLead.country) updated.country = matchedLead.country;
      }
    }

    const saved = CrmStorage.saveQuotation(updated);
    this.syncQuotationStatusToLead(saved);
    return saved;
  },

  async updateQuotationStatus(id: string, status: QuotationStatus): Promise<Quotation> {
    await delay();
    const quotes = CrmStorage.getQuotations();
    const quote = quotes.find(q => q.id === id);
    if (!quote) throw new Error('Quotation not found');
    quote.status = status;

    if (!quote.contactPhone || !quote.location || !quote.country) {
      const rawLeads = CrmStorage.getAllLeadsRaw();
      const matchedLead = quote.leadId
        ? rawLeads.find(l => l.id === quote.leadId)
        : rawLeads.find(
          l =>
            (l.email && quote.contactEmail && l.email.trim().toLowerCase() === quote.contactEmail.trim().toLowerCase()) ||
            (l.company && quote.companyName && l.company.trim().toLowerCase() === quote.companyName.trim().toLowerCase())
        );
      if (matchedLead) {
        if (!quote.contactPhone && matchedLead.phone) quote.contactPhone = matchedLead.phone;
        if (!quote.location && matchedLead.location) quote.location = matchedLead.location;
        if (!quote.country && matchedLead.country) quote.country = matchedLead.country;
      }
    }

    const saved = CrmStorage.saveQuotation(quote);
    this.syncQuotationStatusToLead(saved);
    return saved;
  },

  syncQuotationStatusToLead(quote: Quotation) {
    if (quote.status === 'accepted') {
      this.convertQuotationToClient(quote);
      return;
    }

    const leads = CrmStorage.getLeads();
    const matchedLead = quote.leadId
      ? leads.find(l => l.id === quote.leadId)
      : leads.find(
        l =>
          (l.email && quote.contactEmail && l.email.toLowerCase() === quote.contactEmail.trim().toLowerCase()) ||
          (l.company && quote.companyName && l.company.toLowerCase() === quote.companyName.trim().toLowerCase())
      );

    if (matchedLead) {
      if (quote.status === 'declined') {
        matchedLead.status = 'lost';
        matchedLead.lostReason = 'Quotation Declined';
        matchedLead.updatedAt = new Date().toISOString();
        CrmStorage.saveLead(matchedLead);
      } else if (quote.status === 'expired') {
        matchedLead.status = 'no_response';
        matchedLead.updatedAt = new Date().toISOString();
        CrmStorage.saveLead(matchedLead);
      }
    }
  },

  convertQuotationToClient(quote: Quotation): { contact: Contact } {
    const currentUser = CrmStorage.getUser();

    // Find any matching Lead (from raw stored leads)
    const allLeads = CrmStorage.getAllLeadsRaw();
    const matchedLead = quote.leadId
      ? allLeads.find(l => l.id === quote.leadId)
      : allLeads.find(
        l =>
          (l.email && quote.contactEmail && l.email.trim().toLowerCase() === quote.contactEmail.trim().toLowerCase()) ||
          (l.company && quote.companyName && l.company.trim().toLowerCase() === quote.companyName.trim().toLowerCase()) ||
          (l.name && quote.contactName && l.name.trim().toLowerCase() === quote.contactName.trim().toLowerCase())
      );

    // Find existing Company & Contact
    const companies = CrmStorage.getCompanies();
    let company = companies.find(
      c => c.name.toLowerCase() === quote.companyName.trim().toLowerCase()
    );

    const contacts = CrmStorage.getContacts();
    const existingContact = contacts.find(
      c =>
        (c.email && quote.contactEmail && c.email.toLowerCase() === quote.contactEmail.trim().toLowerCase()) ||
        (c.companyName.toLowerCase() === quote.companyName.trim().toLowerCase() &&
          c.name.toLowerCase() === quote.contactName.trim().toLowerCase())
    );

    // Resolve contact details
    const resolvedPhone =
      quote.contactPhone?.trim() ||
      matchedLead?.phone?.trim() ||
      existingContact?.phone?.trim() ||
      company?.phone?.trim() ||
      '';
    const resolvedLocation =
      quote.location?.trim() ||
      matchedLead?.location?.trim() ||
      existingContact?.location?.trim() ||
      company?.city?.trim() ||
      '';
    const resolvedCountry =
      quote.country?.trim() ||
      matchedLead?.country?.trim() ||
      existingContact?.country?.trim() ||
      company?.country?.trim() ||
      '';

    // 1. Ensure Company exists in Company Directory
    if (!company) {
      company = CrmStorage.saveCompany({
        id: `comp_${Date.now()}`,
        name: quote.companyName.trim(),
        domain: quote.contactEmail?.includes('@') ? quote.contactEmail.split('@')[1] : '',
        industry: 'Technology',
        size: '10-50',
        phone: resolvedPhone,
        city: resolvedLocation,
        country: resolvedCountry,
        totalRevenue: quote.total || 0,
        openDealsCount: 0,
        createdAt: new Date().toISOString(),
      });
    } else {
      company = CrmStorage.saveCompany({
        ...company,
        phone: company.phone || resolvedPhone,
        city: company.city || resolvedLocation,
        country: company.country || resolvedCountry,
        totalRevenue: (company.totalRevenue || 0) + (quote.total || 0),
      });
    }

    // 2. Ensure Contact exists in Client Directory with resolved contact info
    const contact = CrmStorage.saveContact({
      id: existingContact?.id || `cont_${Date.now()}`,
      name: quote.contactName.trim(),
      email: quote.contactEmail?.trim() || '',
      phone: resolvedPhone,
      title: '',
      companyId: company?.id,
      companyName: quote.companyName.trim(),
      location: resolvedLocation,
      country: resolvedCountry,
      lifecycleStage: 'customer',
      status: 'Won Client',
      notes: existingContact?.notes
        ? `${existingContact.notes}\nQuotation ${quote.quoteNumber} Accepted.`
        : `Client converted via Accepted Quotation ${quote.quoteNumber}.`,
      lastActivityAt: new Date().toISOString(),
      assignedTo: existingContact?.assignedTo || currentUser?.id || '',
      createdAt: existingContact?.createdAt || new Date().toISOString(),
    });

    // 3. If linked to an Enquiry/Lead, mark lead as converted and remove from enquiry table
    if (matchedLead) {
      matchedLead.status = 'converted';
      matchedLead.convertedContactId = contact.id;
      matchedLead.updatedAt = new Date().toISOString();
      CrmStorage.saveLead(matchedLead);
      CrmStorage.deleteLead(matchedLead.id);
    }

    // 4. Update or create Won Deal in Pipeline
    const deals = CrmStorage.getDeals();
    const existingDeal = deals.find(
      d =>
        (d.contactId && d.contactId === contact.id) ||
        d.companyName.toLowerCase() === quote.companyName.trim().toLowerCase()
    );
    if (!existingDeal) {
      CrmStorage.saveDeal({
        id: `deal_${Date.now()}`,
        title: `${quote.companyName.trim()} - Project Contract`,
        value: quote.total || 0,
        currency: 'USD',
        stage: 'won',
        probability: 100,
        expectedCloseDate: new Date().toISOString().split('T')[0],
        companyId: company?.id,
        companyName: quote.companyName.trim(),
        contactId: contact.id,
        contactName: quote.contactName.trim(),
        assignedTo: currentUser?.id || '',
        priority: 'high',
        tags: ['Quotation Accepted', 'Won Contract'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      existingDeal.stage = 'won';
      existingDeal.value = quote.total || existingDeal.value;
      existingDeal.probability = 100;
      existingDeal.updatedAt = new Date().toISOString();
      CrmStorage.saveDeal(existingDeal);
    }

    return { contact };
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
  },

  // === CLIENT REQUIREMENTS ===
  async getClientRequirementsMap(): Promise<Record<string, ClientDeviceRequirement[]>> {
    await delay(60);
    return CrmStorage.getClientRequirementsMap();
  },

  async getClientRequirements(clientId: string): Promise<ClientDeviceRequirement[]> {
    await delay(60);
    return CrmStorage.getClientRequirements(clientId);
  },

  async saveClientRequirements(clientId: string, requirements: ClientDeviceRequirement[]): Promise<ClientDeviceRequirement[]> {
    await delay(80);
    const updated = CrmStorage.saveClientRequirements(clientId, requirements);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: 'Device Requirements Updated',
      description: `Requirements updated for client ID ${clientId}.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
      relatedToType: 'company',
      relatedToId: clientId,
    });
    return updated;
  },

  async updateClientRequirement(clientId: string, deviceKey: string, required: number): Promise<ClientDeviceRequirement[]> {
    await delay(60);
    return CrmStorage.updateClientRequirement(clientId, deviceKey, required);
  },

  // === DEVICE STOCK INVENTORY ===
  async getDeviceStock(): Promise<DeviceStockItem[]> {
    await delay(60);
    return CrmStorage.getDeviceStock();
  },

  async recordStockAction(
    deviceKey: string,
    action: StockActionType,
    quantity: number
  ): Promise<{ updatedItem: DeviceStockItem; allStock: DeviceStockItem[] }> {
    await delay(80);
    const result = CrmStorage.recordStockAction(deviceKey, action, quantity);
    const currentUser = CrmStorage.getUser();
    const actionLabel =
      action === 'production_ready'
        ? 'Production ready in India'
        : action === 'shipped_to_us'
          ? 'Shipped from India → US'
          : 'Installed in client place';

    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: 'Stock Updated',
      description: `${actionLabel}: ${quantity} units for ${result.updatedItem.deviceName}.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return result;
  },

  // === OPERATIONS WORKFLOW (Orders, Synchronization) ===
  async getOrders(): Promise<ClientOrderRecord[]> {
    await delay(50);
    return CrmStorage.getOrders();
  },

  async saveOrder(order: ClientOrderRecord): Promise<ClientOrderRecord> {
    await delay(80);
    const res = CrmStorage.saveOrder(order);
    return res;
  },

  async deleteOrder(id: string): Promise<void> {
    await delay(50);
    CrmStorage.deleteOrder(id);
  },

  async adjustProductionStock(deviceKey: string, newStock: number): Promise<DeviceStockItem> {
    await delay(60);
    const updated = CrmStorage.adjustProductionStock(deviceKey, newStock);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: 'Production Stock Adjusted',
      description: `Manual adjustment: ${updated.deviceName} Production Stock set to ${newStock} units.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return updated;
  },

  async dispatchWorkflow(
    orderId: string,
    deviceKey: string,
    quantity: number,
    carrier?: string,
    dispatchDate?: string,
    location?: string
  ): Promise<{ order: ClientOrderRecord }> {
    await delay(80);
    const result = CrmStorage.dispatchWorkflow(orderId, deviceKey, quantity, carrier, dispatchDate, location);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `Dispatched to In-Transit`,
      description: `Dispatched ${quantity} units for ${result.order.clientName} (Order ${result.order.orderPrefix || 'ORD-'}${result.order.orderNumber}). Status: In Transit.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return result;
  },

  async receiveWorkflowInTransit(
    identifier: string,
    deviceKey?: string,
    quantity?: number
  ): Promise<{ receivedQuantity: number; order?: ClientOrderRecord }> {
    await delay(80);
    const result = CrmStorage.receiveWorkflowInTransit(identifier, deviceKey, quantity);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `Received at US Warehouse`,
      description: `${result.receivedQuantity} units received and moved to US Warehouse.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return result;
  },

  async scheduleWorkflowInstallation(
    orderId: string,
    installer: string,
    date: string,
    siteAddress?: string,
    notes?: string,
    siteVisitTime?: string
  ): Promise<{ installation: Installation; order: ClientOrderRecord; schedule: InstallerScheduleItem }> {
    await delay(80);
    const result = CrmStorage.scheduleWorkflowInstallation(orderId, installer, date, siteAddress, notes, siteVisitTime);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `Installation Scheduled: ${result.installation.id}`,
      description: `Hardware installation booked for ${result.order.clientName} on ${date} (${result.schedule.siteVisitTime}) with installer ${installer}. Synced to Installer Schedule.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return result;
  },

  async completeWorkflowInstallation(
    installationId: string,
    actualInstalledCount?: number
  ): Promise<{ installation: Installation; order?: ClientOrderRecord; schedule?: InstallerScheduleItem }> {
    await delay(80);
    const result = CrmStorage.completeWorkflowInstallation(installationId, actualInstalledCount);
    const currentUser = CrmStorage.getUser();
    CrmStorage.addActivity({
      id: `act_${Date.now()}`,
      type: 'note',
      title: `Installation Completed: ${result.installation.id}`,
      description: `Site installation verified and completed. Actual installed count: ${actualInstalledCount || 'All units'}. Synced with Installer Schedule.`,
      performedBy: currentUser?.name || 'User',
      performedById: currentUser?.id || '',
      timestamp: new Date().toISOString(),
    });
    return result;
  },

  async getTechnicians(): Promise<string[]> {
    await delay(30);
    return CrmStorage.getTechnicians();
  },

  async addTechnician(name: string): Promise<string[]> {
    await delay(40);
    return CrmStorage.addTechnician(name);
  },
};
