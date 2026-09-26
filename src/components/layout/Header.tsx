import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import {
  Menu,
  Search,
  Plus,
  RefreshCw,
  Bell,
  CheckCircle2,
  ChevronDown,
  Target,
  Briefcase,
  Users,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenNewLead?: () => void;
  onOpenNewDeal?: () => void;
  onOpenNewContact?: () => void;
  onOpenNewTask?: () => void;
  onOpenNewQuote?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenNewLead,
  onOpenNewDeal,
  onOpenNewContact,
  onOpenNewTask,
  onOpenNewQuote,
}) => {
  const { user } = useAuth();
  const { refreshAll, isLoading, tasks } = useCrm();
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Mobile menu & Quick Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <button
          onClick={onOpenSearch}
          className="w-full max-w-md flex items-center justify-between px-3.5 py-2 text-xs text-slate-400 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl transition-all shadow-inner"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-500">Quick search deals, leads, clients...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Quick actions, Sync, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Refresh Sync Button */}
        <button
          onClick={() => refreshAll()}
          disabled={isLoading}
          title="Refresh Data"
          className="p-2 text-slate-500 hover:text-brand-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-600' : ''}`} />
        </button>

        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-fade-in">
                {onOpenNewLead && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenNewLead();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5"
                  >
                    <Target className="w-4 h-4 text-amber-500" />
                    New Sales Lead
                  </button>
                )}
                {onOpenNewDeal && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenNewDeal();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5"
                  >
                    <Briefcase className="w-4 h-4 text-brand-600" />
                    New Pipeline Deal
                  </button>
                )}
                {onOpenNewContact && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenNewContact();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    New Contact
                  </button>
                )}
                {onOpenNewTask && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenNewTask();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5"
                  >
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    New Task / Reminder
                  </button>
                )}
                {onOpenNewQuote && (
                  <button
                    onClick={() => {
                      setShowQuickMenu(false);
                      onOpenNewQuote();
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-purple-500" />
                    New Quotation
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {pendingTasksCount > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Reminders & Actions ({pendingTasksCount})
                  </h4>
                  <Link
                    to="/tasks"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-brand-600 hover:underline font-semibold"
                  >
                    View All
                  </Link>
                </div>
                <div className="py-2 space-y-2 max-h-60 overflow-y-auto">
                  {tasks.filter(t => t.status !== 'completed').slice(0, 4).map(task => (
                    <div
                      key={task.id}
                      className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                        <p className="text-[11px] text-slate-500">Due: {task.dueDate}</p>
                      </div>
                    </div>
                  ))}
                  {pendingTasksCount === 0 && (
                    <p className="text-xs text-center py-4 text-slate-400">All tasks caught up!</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Mini Avatar Link */}
        <Link
          to="/settings"
          className="flex items-center pl-1.5"
          title="Account Settings"
        >
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 hover:ring-brand-400 transition-all"
          />
        </Link>
      </div>
    </header>
  );
};
