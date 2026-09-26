import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { ToastContainer } from '../common/ToastContainer';
import { useCrm } from '../../context/CrmContext';
import { LeadModalForm } from '../forms/LeadModalForm';
import { DealModalForm } from '../forms/DealModalForm';
import { ContactModalForm } from '../forms/ContactModalForm';
import { TaskModalForm } from '../forms/TaskModalForm';
import { QuotationModalForm } from '../forms/QuotationModalForm';

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Global Quick Modals
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [dealModalOpen, setDealModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const { createLead, createDeal, createContact, createTask, createQuotation } = useCrm();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNewLead={() => setLeadModalOpen(true)}
          onOpenNewDeal={() => setDealModalOpen(true)}
          onOpenNewContact={() => setContactModalOpen(true)}
          onOpenNewTask={() => setTaskModalOpen(true)}
          onOpenNewQuote={() => setQuoteModalOpen(true)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette / Search Dialog */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      {/* Floating System Toasts */}
      <ToastContainer />

      {/* Global Quick Creation Modals */}
      <LeadModalForm
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSubmit={async data => {
          await createLead(data);
        }}
      />

      <DealModalForm
        isOpen={dealModalOpen}
        onClose={() => setDealModalOpen(false)}
        onSubmit={async data => {
          await createDeal(data);
        }}
      />

      <ContactModalForm
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onSubmit={async data => {
          await createContact(data);
        }}
      />

      <TaskModalForm
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={async data => {
          await createTask(data);
        }}
      />

      <QuotationModalForm
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        onSubmit={async data => {
          await createQuotation(data);
        }}
      />
    </div>
  );
};
