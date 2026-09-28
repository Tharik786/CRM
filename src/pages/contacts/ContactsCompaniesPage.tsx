import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Contact, Company } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Table, Column, Pagination } from '../../components/common/Table';
import { ContactModalForm } from '../../components/forms/ContactModalForm';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Users,
  Building2,
  Plus,
  Search,
  Download,
  Mail,
  Phone,
  Globe,
  MapPin,
  Edit2,
  Trash2,
} from 'lucide-react';

export const ContactsCompaniesPage: React.FC = () => {
  const {
    contacts,
    companies,
    createContact,
    updateContact,
    deleteContact,
    createCompany,
    updateCompany,
    deleteCompany,
    isLoading,
  } = useCrm();

  const [activeTab, setActiveTab] = useState<'contacts' | 'companies'>('contacts');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Contact Modal
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Company Modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    domain: '',
    industry: '',
    size: '50-200',
    phone: '',
    city: '',
    country: 'United States',
  });

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(
      comp =>
        comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comp.domain.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const activeTotal = activeTab === 'contacts' ? filteredContacts.length : filteredCompanies.length;
  const totalPages = Math.ceil(activeTotal / itemsPerPage);

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage]);

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  // Handlers for Contacts
  const handleOpenContactModal = (c?: Contact) => {
    setEditingContact(c || null);
    setContactModalOpen(true);
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (window.confirm(`Delete contact profile for "${name}"?`)) {
      await deleteContact(id);
    }
  };

  // Handlers for Companies
  const handleOpenCompanyModal = (comp?: Company) => {
    if (comp) {
      setEditingCompany(comp);
      setCompanyForm({
        name: comp.name,
        domain: comp.domain,
        industry: comp.industry,
        size: comp.size,
        phone: comp.phone,
        city: comp.city,
        country: comp.country,
      });
    } else {
      setEditingCompany(null);
      setCompanyForm({
        name: '',
        domain: '',
        industry: 'Software / Technology',
        size: '50-200',
        phone: '',
        city: '',
        country: 'United States',
      });
    }
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.name.trim()) return;

    if (editingCompany) {
      await updateCompany(editingCompany.id, companyForm);
    } else {
      await createCompany(companyForm);
    }
    setCompanyModalOpen(false);
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (window.confirm(`Delete company profile for "${name}"?`)) {
      await deleteCompany(id);
    }
  };

  // Export
  const handleExport = () => {
    if (activeTab === 'contacts') {
      exportToCSV('ZanCRM_Contacts', filteredContacts, [
        { key: 'name', label: 'Contact Name' },
        { key: 'title', label: 'Job Title' },
        { key: 'companyName', label: 'Company' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'lifecycleStage', label: 'Stage' },
      ]);
    } else {
      exportToCSV('ZanCRM_Companies', filteredCompanies, [
        { key: 'name', label: 'Company Name' },
        { key: 'domain', label: 'Website Domain' },
        { key: 'industry', label: 'Industry' },
        { key: 'size', label: 'Team Size' },
        { key: 'city', label: 'City' },
        { key: 'country', label: 'Country' },
        { key: 'totalRevenue', label: 'Total Revenue ($)' },
      ]);
    }
  };

  const contactColumns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Contact Name & Role',
      render: contact => (
        <div className="flex items-center gap-3">
          <img
            src={
              contact.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=6366f1&color=fff`
            }
            alt={contact.name}
            className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
          />
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{contact.name}</div>
            <div className="text-xs text-slate-500">{contact.title || 'Decision Maker'}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company Relationship',
      render: contact => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <Building2 className="w-3.5 h-3.5 text-slate-400" />
          <span>{contact.companyName}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email & Phone',
      render: contact => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Mail className="w-3 h-3 text-slate-400" />
            <a href={`mailto:${contact.email}`} className="hover:text-brand-600 truncate max-w-[160px]">
              {contact.email}
            </a>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'lifecycle',
      header: 'Lifecycle Stage',
      render: contact => {
        const variants: Record<string, 'slate' | 'indigo' | 'amber' | 'green' | 'purple'> = {
          subscriber: 'slate',
          lead: 'indigo',
          mql: 'amber',
          customer: 'green',
          evangelist: 'purple',
        };
        return (
          <Badge variant={variants[contact.lifecycleStage] || 'slate'} size="sm">
            {contact.lifecycleStage}
          </Badge>
        );
      },
    },
    {
      key: 'lastActivityAt',
      header: 'Last Interaction',
      render: contact => (
        <span className="text-xs text-slate-500">{formatDate(contact.lastActivityAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: contact => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenContactModal(contact)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteContact(contact.id, contact.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const companyColumns: Column<Company>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: comp => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
            {comp.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{comp.name}</div>
            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
              <Globe className="w-3 h-3" />
              <a href={`https://${comp.domain}`} target="_blank" rel="noreferrer" className="hover:underline">
                {comp.domain}
              </a>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry & Size',
      render: comp => (
        <div className="text-xs">
          <div className="font-medium text-slate-800">{comp.industry}</div>
          <div className="text-slate-400">{comp.size} employees</div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Headquarters',
      render: comp => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{comp.city}, {comp.country}</span>
        </div>
      ),
    },
    {
      key: 'totalRevenue',
      header: 'Account Revenue',
      render: comp => (
        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
          {formatCurrency(comp.totalRevenue)}
        </span>
      ),
    },
    {
      key: 'openDeals',
      header: 'Active Deals',
      render: comp => (
        <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold">
          {comp.openDealsCount} {comp.openDealsCount === 1 ? 'deal' : 'deals'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: comp => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenCompanyModal(comp)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDeleteCompany(comp.id, comp.name)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clients & Accounts Directory
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>

          {activeTab === 'contacts' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenContactModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Client
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCompanyModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              Add Company
            </Button>
          )}
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Switch Tab */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 w-fit">
          <button
            onClick={() => {
              setActiveTab('contacts');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'contacts'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clients ({contacts.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('companies');
              setCurrentPage(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'companies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Companies ({companies.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              activeTab === 'contacts'
                ? 'Search clients by name, company, email...'
                : 'Search companies by name, domain, industry...'
            }
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        {activeTab === 'contacts' ? (
          <Table
            columns={contactColumns}
            data={paginatedContacts}
            keyExtractor={c => c.id}
            isLoading={isLoading}
            emptyMessage="No clients found."
          />
        ) : (
          <Table
            columns={companyColumns}
            data={paginatedCompanies}
            keyExtractor={comp => comp.id}
            isLoading={isLoading}
            emptyMessage="No companies registered."
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={activeTotal}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Contact Form Modal */}
      <ContactModalForm
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        initialData={editingContact}
        onSubmit={async data => {
          if (editingContact) {
            await updateContact(editingContact.id, data);
          } else {
            await createContact(data);
          }
        }}
      />

      {/* Company Form Modal */}
      <Modal
        isOpen={companyModalOpen}
        onClose={() => setCompanyModalOpen(false)}
        title={editingCompany ? 'Edit Company Profile' : 'Register New Company'}
        subtitle="Manage corporate firmographics, address, and industry categorization"
        maxWidth="md"
      >
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <Input
            label="Company Name"
            placeholder="e.g. Acme Cloud Innovations"
            value={companyForm.name}
            onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Website Domain"
              placeholder="e.g. acmecloud.com"
              value={companyForm.domain}
              onChange={e => setCompanyForm({ ...companyForm, domain: e.target.value })}
            />
            <Input
              label="Industry"
              placeholder="e.g. SaaS / Enterprise Software"
              value={companyForm.industry}
              onChange={e => setCompanyForm({ ...companyForm, industry: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Company Size"
              placeholder="e.g. 100-250"
              value={companyForm.size}
              onChange={e => setCompanyForm({ ...companyForm, size: e.target.value })}
            />
            <Input
              label="Main Phone"
              placeholder="+1 (555) 123-4567"
              value={companyForm.phone}
              onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Headquarters City"
              placeholder="e.g. San Francisco, CA"
              value={companyForm.city}
              onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
            />
            <Input
              label="Country"
              value={companyForm.country}
              onChange={e => setCompanyForm({ ...companyForm, country: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" size="sm" onClick={() => setCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingCompany ? 'Save Changes' : 'Register Company'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
