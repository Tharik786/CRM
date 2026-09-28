import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';
import { useCrm } from '../../context/CrmContext';

// Dynamic creation modal imports
import { LeadModalForm } from '../forms/LeadModalForm';
import { DealModalForm } from '../forms/DealModalForm';
import { ContactModalForm } from '../forms/ContactModalForm';
import { TaskModalForm } from '../forms/TaskModalForm';
import { QuotationModalForm } from '../forms/QuotationModalForm';

type GlobalModalType = 'lead' | 'deal' | 'contact' | 'task' | 'quotation' | null;

export const AppLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeGlobalModal, setActiveGlobalModal] = useState<GlobalModalType>(null);

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
          onOpenNewLead={() => setActiveGlobalModal('lead')}
          onOpenNewDeal={() => setActiveGlobalModal('deal')}
          onOpenNewContact={() => setActiveGlobalModal('contact')}
          onOpenNewTask={() => setActiveGlobalModal('task')}
          onOpenNewQuote={() => setActiveGlobalModal('quotation')}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 px-4 pt-3.5 pb-8 sm:px-6 sm:pt-4 sm:pb-8 md:px-8 md:pt-4 md:pb-8 w-full max-w-[1600px] mx-auto">
          <Outlet />
        </main>
      </div>


      {/* Floating System Toasts */}
      <ToastContainer />

      {/* Conditionally rendered global modals */}
      {activeGlobalModal === 'lead' && (
        <LeadModalForm
          isOpen={true}
          onClose={() => setActiveGlobalModal(null)}
          onSubmit={async data => {
            await createLead(data);
            setActiveGlobalModal(null);
          }}
        />
      )}

      {activeGlobalModal === 'deal' && (
        <DealModalForm
          isOpen={true}
          onClose={() => setActiveGlobalModal(null)}
          onSubmit={async data => {
            await createDeal(data);
            setActiveGlobalModal(null);
          }}
        />
      )}

      {activeGlobalModal === 'contact' && (
        <ContactModalForm
          isOpen={true}
          onClose={() => setActiveGlobalModal(null)}
          onSubmit={async data => {
            await createContact(data);
            setActiveGlobalModal(null);
          }}
        />
      )}

      {activeGlobalModal === 'task' && (
        <TaskModalForm
          isOpen={true}
          onClose={() => setActiveGlobalModal(null)}
          onSubmit={async data => {
            await createTask(data);
            setActiveGlobalModal(null);
          }}
        />
      )}

      {activeGlobalModal === 'quotation' && (
        <QuotationModalForm
          isOpen={true}
          onClose={() => setActiveGlobalModal(null)}
          onSubmit={async data => {
            await createQuotation(data);
            setActiveGlobalModal(null);
          }}
        />
      )}
    </div>
  );
};
