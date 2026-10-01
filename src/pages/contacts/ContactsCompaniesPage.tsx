import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Contact } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Table, Column, Pagination } from '../../components/common/Table';
import { ClientDetailsModal } from '../../components/clients/ClientDetailsModal';
import { formatDate, exportToCSV } from '../../utils/formatters';
import {
  Search,
  Download,
  Mail,
  Phone,
  Building2,
  Eye,
} from 'lucide-react';

export const ContactsCompaniesPage: React.FC = () => {
  const {
    contacts,
    isLoading,
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Client Details Panel State
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contacts, searchTerm]);

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  const paginatedContacts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, currentPage]);

  const handleOpenDetails = (c: Contact) => {
    setSelectedClient(c);
    setDetailsOpen(true);
  };

  // Export
  const handleExport = () => {
    exportToCSV('ZanCRM_Clients', filteredContacts, [
      { key: 'name', label: 'Contact Name' },
      { key: 'title', label: 'Job Title' },
      { key: 'companyName', label: 'Company' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ]);
  };

  const contactColumns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Client Name ',
      render: contact => (
        <div
          className="cursor-pointer group"
          onClick={() => handleOpenDetails(contact)}
        >
          <div className="font-bold text-slate-900 text-xs sm:text-sm group-hover:text-brand-600 transition-colors">
            {contact.name}
          </div>
          <div className="text-xs text-slate-500">{contact.title || 'Decision Maker'}</div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company ',
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
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <a href={`mailto:${contact.email}`} className="hover:text-brand-600 truncate max-w-[160px]">
              {contact.email}
            </a>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-1.5 text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{contact.phone}</span>
            </div>
          )}
        </div>
      ),
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
            onClick={() => handleOpenDetails(contact)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="View Client Details & Actions"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clients Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your customer profiles, decision makers, and business contacts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search clients by name, company, email..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{filteredContacts.length}</span> clients
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <Table
          columns={contactColumns}
          data={paginatedContacts}
          keyExtractor={c => c.id}
          isLoading={isLoading}
          noScroll={true}
          emptyMessage="No clients found."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredContacts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Client Details Modal with 3 Sub-Modals */}
      <ClientDetailsModal
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
      />
    </div>
  );
};
