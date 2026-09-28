export type UserRole = 'admin' | 'sales_manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  title: string;
  phone?: string;
  timezone: string;
  notificationsEnabled: boolean;
}

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'proposal'
  | 'discussion'
  | 'won'
  | 'lost'
  | 'contacted'
  | 'unqualified'
  | 'converted';
export type LeadSource = 'website' | 'linkedin' | 'referral' | 'cold_outreach' | 'event' | 'inbound_call';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: LeadSource;
  status: LeadStatus;
  score: number; // 0 - 100
  assignedTo: string; // User ID
  estimatedValue: number;
  notes?: string;
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

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  companyId?: string;
  companyName: string;
  avatar?: string;
  lifecycleStage: 'subscriber' | 'lead' | 'mql' | 'customer' | 'evangelist';
  lastActivityAt: string;
  assignedTo: string;
  notes?: string;
  createdAt: string;
}

export type DealStage =
  | 'qualification'
  | 'needs_analysis'
  | 'proposal_sent'
  | 'negotiation'
  | 'closed_won'
  | 'closed_lost';

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
  createdAt: string;
  updatedAt: string;
}

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage
  amount: number;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface Quotation {
  id: string;
  quoteNumber: string; // e.g. Q-2026-001
  title: string;
  dealId?: string;
  dealTitle?: string;
  contactName: string;
  contactEmail: string;
  companyName: string;
  status: QuotationStatus;
  issueDate: string;
  validUntil: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  taxRate: number; // percentage e.g. 10
  taxAmount: number;
  total: number;
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

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'deal_stage_changed' | 'quotation_created';

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

export interface Installation {
  id: string;
  customerId?: string; // Client Contact ID
  customerName: string;
  dealId?: string;     // Sales Pipeline Deal ID
  dealTitle?: string;
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

