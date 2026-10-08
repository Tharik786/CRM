import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';
import { Menu, Bell, CheckCircle2 } from 'lucide-react';

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
}) => {
  const { tasks } = useCrm();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-close popovers on route change
  useEffect(() => {
    setShowNotifications(false);
  }, [location.pathname]);

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

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

      {/* Right section: Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
            title="Notifications & Tasks"
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
