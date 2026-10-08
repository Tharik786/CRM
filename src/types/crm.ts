export type UserRole = 'admin' | 'sales_manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  title: string;
  phone?: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export type CurrencyType = 'USD' | 'INR';

export type LeadStatus =
  | 'lead'
  | 'contact'
  | 'discussion'
  | 'converted'
  | 'lost'
  | 'new'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'cold'
  | 'qualified'
  | 'contacted'
  | 'unqualified'
  | 'no_response';
export type LeadSource = 'website' | 'linkedin' | 'referral' | 'cold_outreach' | 'event' | 'inbound_call';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country?: string;
  location?: string;
  source: LeadSource;
  status: LeadStatus;
  score: number; // 0 - 100
  assignedTo: string; // User ID
  estimatedValue: number;
  currency?: CurrencyType;
  notes?: string;
  lostReason?: string;
  convertedContactId?: string;
  convertedDealId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string; // e.g. "50-200"
  phone: string;
  city: string;
  country: string;
  totalRevenue: number;
  openDealsCount: number;
  createdAt: string;
}

export type ContactStatus = 'Active' | 'Won Client' | 'Inactive';

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId?: string;
  companyName: string;
  location?: string;
  country?: string;
  avatar?: string;
  status?: ContactStatus;
  lifecycleStage: 'subscriber' | 'lead' | 'mql' | 'customer' | 'evangelist';
  lastActivityAt: string;
  assignedTo: string;
  notes?: string;
  createdAt: string;
}

export type DealStage =
  | 'new'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'cold';

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: DealStage;
  probability: number; // percentage 0 - 100
  expectedCloseDate: string;
  companyId?: string;
  companyName: string;
  contactId?: string;
  contactName: string;
  assignedTo: string; // User ID
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice?: number;
  unitOneTime: number;
  unitMonthly: number;
  discount?: number; // percentage
  amount?: number;
  oneTimeTotal: number;
  monthlyTotal: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface Quotation {
  id: string;
  quoteNumber: string; // e.g. Q-2026-001
  title: string;
  leadId?: string;
  leadName?: string;
  dealId?: string;
  dealTitle?: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  location?: string;
  country?: string;
  companyName: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  oneTimeSubtotal?: number;
  monthlySubtotal?: number;
  annualRecurring?: number;
  year1Total?: number;
  taxRate: number; // percentage e.g. 10
  taxAmount: number;
  total: number;
  totalOneTime?: number;
  totalMonthly?: number;
  notes?: string;
  terms?: string;
  createdBy: string;
  createdAt: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'demo' | 'quote_review';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string;
  assignedTo: string;
  relatedToType?: 'lead' | 'deal' | 'contact' | 'company';
  relatedToId?: string;
  relatedToName?: string;
  isRecurring?: boolean;
  completedAt?: string;
  createdAt: string;
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'other' | 'deal_stage_changed' | 'quotation_created';

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  performedBy: string; // User Name
  performedById: string; // User ID
  timestamp: string;
  durationMinutes?: number;
  outcome?: string;
  relatedToType?: 'lead' | 'deal' | 'contact' | 'company';
  relatedToId?: string;
  relatedToName?: string;
}

export interface WorkspaceSettings {
  companyName: string;
  defaultCurrency: string;
  fiscalYearStart: string;
  timezone: string;
  emailNotifications: boolean;
  autoLeadScoring: boolean;
  twoFactorAuth: boolean;
}

export interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number; // e.g. +14.2%
  dealsWonCount: number;
  dealsWonChange: number;
  activeLeadsCount: number;
  leadsChange: number;
  winRate: number; // percentage
  winRateChange: number;
  pipelineValue: number;
  stageBreakdown: { stage: DealStage; count: number; totalValue: number }[];
  recentActivities: Activity[];
  upcomingTasks: Task[];
}

export type InstallationStatus = 'scheduled' | 'in_progress' | 'completed' | 'pending' | 'cancelled';

export interface InstallationDeviceItem {
  deviceKey: string;
  deviceName?: string;
  quantity: number;
  installedQuantity?: number;
}

export interface Installation {
  id: string;
  customerId?: string; // Client Contact ID
  customerName: string;
  dealId?: string;     // Sales Pipeline Deal ID
  dealTitle?: string;
  orderId?: string;    // Linked Order ID (e.g. "ORD-1004")
  devices?: InstallationDeviceItem[];
  bookingDate: string; // YYYY-MM-DD
  installationDate: string; // YYYY-MM-DD
  installer: string;
  status: InstallationStatus;
  siteAddress?: string;
  contactPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ScheduleStatus = 'confirmed' | 'on_route' | 'in_progress' | 'completed' | 'rescheduled';

export interface InstallerScheduleItem {
  id: string;
  installer: string;
  siteVisitTime: string; // e.g. "09:00 AM - 11:30 AM"
  visitDate: string;     // YYYY-MM-DD
  customerId?: string;
  customerName: string;
  installationId?: string;
  status: ScheduleStatus;
  siteAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceInventoryItem {
  id: string;
  deviceName: string;
  category: string;
  requiredQty: number;
  availableQty: number;
  allocatedQty: number;
  unit: string;
  sku?: string;
  updatedAt: string;
}

export interface ClientDeviceRequirement {
  id: string;
  clientId: string;
  deviceKey: string;
  deviceName: string;
  deviceDescription: string;
  required: number;
  installed: number;
  indiaStock: number;
  updatedAt?: string;
}


export type StockActionType =
  | 'production_ready'
  | 'shipped_to_us'
  | 'installed_client';

export interface DeviceStockItem {
  id: string;
  deviceKey: string;
  deviceName: string;
  deviceDescription: string;
  usWarehouse: number;
  indiaProduction: number;
  required?: number;
  dispatched?: number;
  inTransit?: number;
  scheduled?: number;
  installed?: number;
  orderIds?: string[];
  installationIds?: string[];
  updatedAt?: string;
}

// === CONNECTED OPERATIONS WORKFLOW TYPES ===
export interface OrderDeviceItem {
  deviceKey: string;
  deviceName: string;
  quantity: number;
  dispatched: number;
  inTransit: number;
  usWarehouse: number;
  scheduled: number;
  installed: number;
  installationId?: string;
}

export interface ClientOrderRecord {
  id: string;
  orderPrefix: string;
  orderNumber: string;
  clientId: string;
  clientName: string;
  location: string;
  country?: string;
  dispatchLocation?: string;
  contactInfo: string;
  devices: OrderDeviceItem[];
  totalRequired: number;
  dispatched: number;
  inTransit: number;
  usWarehouse: number;
  scheduled: number;
  installed: number;
  installationId?: string;
  status: 'Pending dispatch' | 'Dispatched / In Transit' | 'In US Warehouse' | 'Installation scheduled' | 'Completed';
  createdAt: string;
  updatedAt?: string;
}

