import React, { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { Contact } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { Table, Column, Pagination } from '../../components/common/Table';
import { ClientDetailsModal } from '../../components/clients/ClientDetailsModal';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/formatters';
import {
  Search,
  Download,
  Mail,
  Phone,
  User,
  Eye,
  MapPin,
} from 'lucide-react';

const getCurrentMonthRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const format = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const start = format(year, month, 1);
  const end = format(year, month, new Date(year, month + 1, 0).getDate());
  return { start, end };
};

export const ContactsCompaniesPage: React.FC = () => {
  const {
    contacts,
    companies,
    deals,
    leads,
    quotations,
    isLoading,
  } = useCrm();

  const [searchTerm, setSearchTerm] = useState('');
  const initialMonthRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState<string>(initialMonthRange.start);
  const [endDate, setEndDate] = useState<string>(initialMonthRange.end);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Client Details Panel State
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const comp = companies.find(
        co => co.id === c.companyId || co.name.toLowerCase() === c.companyName.toLowerCase()
      );
      const loc = c.location || (comp ? [comp.city, comp.country].filter(Boolean).join(', ') : '');

      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc && loc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.country && c.country.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesDate = true;
      if (startDate || endDate) {
        const contactDate = (() => {
          const dStr = c.lastActivityAt || c.createdAt;
          if (!dStr) return '';
          const d = new Date(dStr);
          if (isNaN(d.getTime())) return dStr.substring(0, 10);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        })();

        if (startDate && contactDate < startDate) matchesDate = false;
        if (endDate && contactDate > endDate) matchesDate = false;
      }

      return matchesSearch && matchesDate;
    });
  }, [contacts, companies, searchTerm, startDate, endDate]);

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
    const exportData = filteredContacts.map(c => {
      const comp = companies.find(
        co => co.id === c.companyId || co.name.toLowerCase() === c.companyName.toLowerCase()
      );
      const loc = c.location || (comp ? [comp.city, comp.country].filter(Boolean).join(', ') : '');
      return {
        ...c,
        location: loc,
      };
    });

    exportToCSV('ZanCRM_Clients', exportData, [
      { key: 'name', label: 'Contact Name' },
      { key: 'companyName', label: 'Company' },
      { key: 'location', label: 'Location' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
    ]);
  };

  const contactColumns: Column<Contact>[] = [
    {
      key: 'name',
      header: 'Company & Client',
      className: 'w-[32%]',
      render: contact => (
        <div
          className="min-w-0 pr-1 cursor-pointer group"
          onClick={() => handleOpenDetails(contact)}
        >
          {/* Company Name as Bold First */}
          <div
            className="font-bold text-slate-900 text-sm group-hover:text-brand-600 transition-colors truncate"
            title={contact.companyName || contact.name}
          >
            {contact.companyName || 'Independent Client'}
          </div>
          {/* Client Name Below with User Icon */}
          <div
            className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 truncate font-medium"
            title={contact.name}
          >
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{contact.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      className: 'w-[28%]',
      render: contact => {
        const linkedQuote = quotations.find(
          q =>
            (contact.email && q.contactEmail && q.contactEmail.toLowerCase().trim() === contact.email.toLowerCase().trim()) ||
            (contact.companyName && q.companyName && q.companyName.toLowerCase().trim() === contact.companyName.toLowerCase().trim()) ||
            (contact.name && q.contactName && q.contactName.toLowerCase().trim() === contact.name.toLowerCase().trim())
        );

        const matchedLead = leads.find(
          l =>
            l.convertedContactId === contact.id ||
            (l.email && contact.email && l.email.toLowerCase().trim() === contact.email.toLowerCase().trim()) ||
            (l.company && contact.companyName && l.company.toLowerCase().trim() === contact.companyName.toLowerCase().trim()) ||
            (l.name && contact.name && l.name.toLowerCase().trim() === contact.name.toLowerCase().trim())
        );

        const comp = companies.find(
          c =>
            c.id === contact.companyId ||
            (c.name && contact.companyName && c.name.toLowerCase().trim() === contact.companyName.toLowerCase().trim())
        );

        const phone = contact.phone || linkedQuote?.contactPhone || matchedLead?.phone || comp?.phone || '';
        const location = contact.location || linkedQuote?.location || matchedLead?.location || comp?.city || '';
        const country = contact.country || linkedQuote?.country || matchedLead?.country || comp?.country || '';
        const locationCountry = [location, country].filter(Boolean).join(', ');

        return (
          <div className="text-xs space-y-0.5 min-w-0 pr-1">
            {contact.email && (
              <div className="flex items-center gap-1.5 text-slate-600 truncate">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${contact.email}`}
                  className="hover:text-brand-600 transition-colors truncate"
                  title={contact.email}
                >
                  {contact.email}
                </a>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 text-slate-400 truncate">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{phone}</span>
              </div>
            )}
            {locationCountry && (
              <div
                className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate"
                title={locationCountry}
              >
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{locationCountry}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'estimatedValue',
      header: 'Est. Value',
      className: 'w-[16%] whitespace-nowrap',
      render: contact => {
        const clientDeals = deals.filter(
          d =>
            d.contactId === contact.id ||
            (d.companyName &&
              contact.companyName &&
              d.companyName.toLowerCase() === contact.companyName.toLowerCase()) ||
            (d.contactName && contact.name && d.contactName.toLowerCase() === contact.name.toLowerCase())
        );
        const dealTotal = clientDeals.reduce((sum, d) => sum + (d.value || 0), 0);

        const linkedQuote = quotations.find(
          q =>
            (q.companyName &&
              contact.companyName &&
              q.companyName.toLowerCase() === contact.companyName.toLowerCase()) ||
            (q.contactName && contact.name && q.contactName.toLowerCase() === contact.name.toLowerCase())
        );

        const matchedLead = leads.find(
          l =>
            l.convertedContactId === contact.id ||
            (l.email && contact.email && l.email.toLowerCase() === contact.email.toLowerCase()) ||
            (l.company &&
              contact.companyName &&
              l.company.toLowerCase() === contact.companyName.toLowerCase())
        );

        const comp = companies.find(
          c =>
            c.id === contact.companyId ||
            (c.name && contact.companyName && c.name.toLowerCase() === contact.companyName.toLowerCase())
        );

        const val =
          dealTotal || linkedQuote?.total || matchedLead?.estimatedValue || comp?.totalRevenue || 0;
        const curr =
          clientDeals[0]?.currency || matchedLead?.currency || 'USD';

        return (
          <span className="font-mono font-bold text-slate-800 text-xs sm:text-sm">
            {formatCurrency(val, curr)}
          </span>
        );
      },
    },
    {
      key: 'lastActivityAt',
      header: 'Last Interaction',
      className: 'w-[14%] whitespace-nowrap',
      render: contact => (
        <span className="text-xs text-slate-500 font-medium">
          {formatDate(contact.lastActivityAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right pr-3',
      className: 'w-[10%] whitespace-nowrap text-right pr-3',
      render: contact => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenDetails(contact)}
            className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title="View Client Details & Actions"
          >
            <Eye className="w-4 h-4" />
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
            Manage your customer profiles, decision makers, and business contacts converted from enquiries.
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

      {/* Search and Date Filter Bar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search clients by name, company, email, location..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <div className="flex items-center gap-2.5">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
              setCurrentPage(1);
            }}
          />
          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Total: <span className="font-bold text-slate-800">{filteredContacts.length}</span> clients
          </div>
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
          tableClassName="w-full table-fixed"
          emptyMessage="No clients found. Convert an enquiry into a client to populate this directory."
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
