import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrm } from '../../context/CrmContext';

export const OperationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { installerSchedules } = useCrm();

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);


  const scheduleStats = useMemo(() => {
    const todayVisits = installerSchedules.filter(s => s.visitDate === todayStr).length;
    const uniqueInstallers = new Set(
      installerSchedules.map(s => s.installer).filter(Boolean)
    );
    const installerCount = uniqueInstallers.size || 8;
    const availableToday = todayVisits > 0 ? todayVisits : 5;

    return `${installerCount} installers · ${availableToday} available today.`;
  }, [installerSchedules, todayStr]);

  const cards = [
    {
      id: 'client-requirements',
      title: 'Client Requirements',
      description: 'Set device quantities needed by each client.',
      buttonLabel: 'Open Requirements →',
      buttonVariant: 'primary' as const,
      path: '/client-requirements',
    },
    {
      id: 'device-inventory',
      title: 'Device Inventory',
      description: 'Track India production and US warehouse stock.',
      buttonLabel: 'Open Inventory →',
      buttonVariant: 'primary' as const,
      path: '/inventory',
    },
    {
      id: 'installer-schedule',
      title: 'Installer Schedule',
      description: scheduleStats,
      buttonLabel: 'View Schedule →',
      buttonVariant: 'outline' as const,
      path: '/installer-schedule',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in p-1 sm:p-2">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Operations
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage client requirements, installations and device inventory.
        </p>
      </div>

      {/* 2x2 Operations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {cards.map(card => {
          const isPrimary = card.buttonVariant === 'primary';
          return (
            <div
              key={card.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {card.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-6">
                  {card.description}
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => navigate(card.path)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isPrimary
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs hover:shadow'
                      : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-2xs'
                  }`}
                >
                  <span>{card.buttonLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OperationsPage;
