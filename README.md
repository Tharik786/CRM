# ZanCRM — Enterprise Sales & Customer Intelligence Platform

A production-ready internal CRM frontend engineered with **React 19**, **TypeScript (Strict Mode)**, **Vite**, **React Router**, **Tailwind CSS v3.4**, and **Axios**.

---

## 🚀 Live Development Server
The application is running locally at:
👉 **[http://localhost:3000/](http://localhost:3000/)**

---

## 🛠 Tech Stack
- **Core Framework**: React 19 + TypeScript (ES2023, strict mode enabled)
- **Bundler & Build Tool**: Vite 8 with HMR (Hot Module Replacement)
- **Routing**: React Router DOM (Declarative client-side routing, protected session layout)
- **API Client**: Axios configured with authentication interceptors & persistent client storage adapter

---

## 🏢 Core CRM Modules

1. **Authentication (`/login`)**
   - Enterprise login interface with credential validation, remember me, and quick demo mode pre-authorization.
2. **Today Dashboard (`/dashboard`)**
   - Real-time revenue operations KPIs (Won ARR, Unweighted Pipeline, Win/Loss Rate, Active Leads).
   - Sales pipeline funnel breakdown across all stages.
   - Today's priority follow-ups checklist with one-click completion.
   - Live activity timeline feed with timestamps and author details.
3. **Leads (`/leads`)**
   - Inbound lead capture and qualification workflow.
   - Lead scoring (0–100), estimated budget values, and acquisition channels.
   - One-click **Convert to Deal & Contact** action that transitions the enquiry straight into the pipeline.
   - Search, multi-facet filtering (Status, Source), sorting, pagination, and CSV export.
4. **Deals & Pipeline (`/deals`)**
   - Dual-view interface: **Interactive Drag-and-Drop Kanban Board** + **Data Table**.
   - 6 pipeline stages: *Qualification, Needs Analysis, Proposal Sent, Negotiation, Closed Won, Closed Lost*.
   - Live stage totals, weighted forecast ARR calculation, and quick-advance stage buttons.
   - Opportunity creation and modification modals.
5. **Contacts & Companies (`/contacts`)**
   - Tabbed management for individual **Contacts** and corporate **Companies**.
   - Lifecycle stages (*Subscriber, Lead, MQL, Customer, Evangelist*), employee size, and revenue metrics.
   - Corporate firmographics, direct phone links, and mail triggers.
6. **Quotations (`/quotations`)**
   - Commercial proposal and quotation generator linked to sales deals.
   - Dynamic line items editor (descriptions, quantities, unit prices, discounts, subtotal, and tax rates).
   - Built-in **Invoice & Proposal Document Viewer** ready for instant client PDF export or printing.
7. **Tasks & Reminders (`/tasks`)**
   - Follow-up commitments, call reminders, and demo deliverables.
   - Priority indicators (*Urgent, High, Medium, Low*), due date tracking, overdue alerts, and completion toggles.
8. **Activity Timeline (`/activities`)**
   - Chronological audit log of all phone calls, executive meetings, emails, notes, and deal progressions.
   - Activity logger modal with discussion duration and outcome tracking.
9. **Search, Import & Export (`/data`)**
   - **Universal Multi-Entity Search** across deals, leads, contacts, and companies.
   - Bulk **CSV Import Parser** with column mapping preview.
   - Dedicated CSV and Full JSON backup archive downloaders.
10. **Reports & Analytics (`/reports`)**
    - Monthly revenue trends vs targets with visual progress bars.
    - End-to-end sales conversion funnel drop-off analysis.
    - Sales representative performance leaderboard and quota attainment rankings.
11. **Settings & Preferences (`/settings`)**
    - User profile details, timezone, direct contact, and role badges.
    - Workspace configuration (default currency, fiscal year, automated scoring, 2FA enforcement).
    - One-click **Reset All Demo Data** utility to return to initial seed records at any time.

---

## 📂 Project Architecture

```
CRM/
├── index.html                   # HTML5 shell with Google Fonts & metadata
├── vite.config.ts               # Vite configuration with path aliases
├── tsconfig.json                # Project TypeScript configuration
├── tsconfig.app.json            # Strict TypeScript configuration
├── tailwind.config.js           # Tailwind palette & typography definitions
├── postcss.config.js            # PostCSS Autoprefixer setup
├── src/
│   ├── main.tsx                 # React 19 root bootstrap
│   ├── App.tsx                  # Providers & Router orchestration
│   ├── index.css                # Tailwind directives & glassmorphic styling
│   ├── types/
│   │   └── crm.ts               # Comprehensive TypeScript definitions
│   ├── api/
│   │   ├── axiosClient.ts       # Axios instance with interceptors
│   │   ├── storage.ts           # Clean LocalStorage persistence engine
│   │   └── services/
│   │       └── crmService.ts    # Typed asynchronous service methods
│   ├── context/
│   │   ├── AuthContext.tsx      # User session & profile management
│   │   └── CrmContext.tsx       # Live CRM store, actions, search & toasts
│   ├── components/
│   │   ├── common/              # Reusable Button, Card, Badge, Modal, Input, Table, etc.
│   │   ├── layout/              # Sidebar, Header, GlobalSearchModal, AppLayout
│   │   ├── kanban/              # DealKanbanBoard, KanbanColumn, DealCard
│   │   └── forms/               # Modal forms for Leads, Deals, Contacts, Tasks, Quotations
│   ├── pages/
│   │   ├── auth/                # LoginPage
│   │   ├── dashboard/           # TodayDashboardPage
│   │   ├── leads/               # LeadsPage
│   │   ├── deals/               # DealsPipelinePage
│   │   ├── contacts/            # ContactsCompaniesPage
│   │   ├── quotations/          # QuotationsPage
│   │   ├── tasks/               # TasksRemindersPage
│   │   ├── activities/          # ActivityTimelinePage
│   │   ├── data/                # DataManagementPage
│   │   ├── reports/             # ReportsPage
│   │   ├── settings/            # SettingsPage
│   │   └── NotFoundPage.tsx     # 404 handler
│   ├── routes/
│   │   └── AppRoutes.tsx        # Protected & public route definitions
│   └── utils/
│       └── formatters.ts        # Currency, date, relative time, CSV import/export
```

---

## ⌨️ Useful Commands

```bash
# Run local development server
npm run dev

# Run TypeScript strict type-check & build production bundle
npm run build

# Preview production build locally
npm run preview
```
