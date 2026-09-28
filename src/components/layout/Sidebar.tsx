import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Target,
  Briefcase,
  FileSpreadsheet,
  CheckSquare,
  Clock,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Wrench,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Enquiries', path: '/leads', icon: Target },
    { label: 'Clients', path: '/contacts', icon: Users },
    { label: 'Sales Pipeline', path: '/deals', icon: Briefcase },
    { label: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { label: 'Operations', path: '/operations', icon: Wrench },
    { label: 'Tasks & Reminders', path: '/tasks', icon: CheckSquare },
    { label: 'Activity Timeline', path: '/activities', icon: Clock },
    { label: 'Sales Reports', path: '/reports', icon: BarChart3 },
    { label: 'Setting', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col no-scrollbar transition-transform duration-200 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } border-r border-slate-800`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/favicon.png"
              alt="ZanCompute Logo"
              className="h-8 w-8 object-contain shrink-0"
            />
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans truncate">
              ZanCompute <span className="text-brand-400">CRM</span>
            </span>
          </div>
        </div>

        {/* Navigation Modules */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group ${isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 border border-slate-800">
            <div className="flex-1 min-w-0 px-1">
              <div className="flex items-center gap-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'User'}</p>
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">{user?.role ? user.role.replace('_', ' ') : 'Administrator'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
