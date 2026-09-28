import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import {
  Menu,
  Plus,
  Bell,
  CheckCircle2,
  ChevronDown,
  Target,
  Briefcase,
  Users,
  CheckSquare,
  FileSpreadsheet
} from 'lucide-react';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewLead?: () => void;
  onOpenNewDeal?: () => void;
  onOpenNewContact?: () => void;
  onOpenNewTask?: () => void;
  onOpenNewQuote?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenNewLead,
  onOpenNewDeal,
  onOpenNewContact,
  onOpenNewTask,
  onOpenNewQuote,
}) => {
  const { tasks } = useCrm();
  const location = useLocation();

  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-close popovers on route change
  useEffect(() => {
    setShowQuickMenu(false);
    setShowNotifications(false);
  }, [location.pathname]);

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  const triggerAction = (action?: () => void) => {
    setShowQuickMenu(false);
    if (action) {
      action();
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: Mobile menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          aria-label="Open Mobile Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right section: Quick actions, Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Create Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(false);
              setShowQuickMenu(!showQuickMenu);
            }}
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowQuickMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-30 animate-fade-in">
                {onOpenNewLead && (
                  <button
                    onClick={() => triggerAction(onOpenNewLead)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
                  >
                    <Target className="w-4 h-4 text-amber-500" />
                    New Enquiry
                  </button>
                )}
                {onOpenNewContact && (
                  <button
                    onClick={() => triggerAction(onOpenNewContact)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    New Client
                  </button>
                )}
                {onOpenNewDeal && (
                  <button
                    onClick={() => triggerAction(onOpenNewDeal)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-brand-600" />
                    New Sales Pipeline Deal
                  </button>
                )}
                {onOpenNewTask && (
                  <button
                    onClick={() => triggerAction(onOpenNewTask)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    New Task / Reminder
                  </button>
                )}
                {onOpenNewQuote && (
                  <button
                    onClick={() => triggerAction(onOpenNewQuote)}
                    className="w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 flex items-center gap-2.5 transition-colors"
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
            onClick={() => {
              setShowQuickMenu(false);
              setShowNotifications(!showNotifications);
            }}
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
                className="fixed inset-0 z-30"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-30 animate-fade-in">
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
      </div>
    </header>
  );
};
