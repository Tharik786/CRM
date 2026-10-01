import React, { useState, useMemo } from 'react';
import { Company, ClientDeviceRequirement } from '../../types/crm';
import { Card, CardBody } from '../common/Card';
import { ClientCard } from './ClientCard';
import { calculateInstallationProgress } from '../../utils/clientRequirements';
import { Search, Users, X } from 'lucide-react';

interface ClientListProps {
  clients: Company[];
  selectedClientId: string | null;
  onSelectClient: (clientId: string) => void;
  requirementsMap: Record<string, ClientDeviceRequirement[]>;
  isLoading?: boolean;
}

export const ClientList: React.FC<ClientListProps> = ({
  clients,
  selectedClientId,
  onSelectClient,
  requirementsMap,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const term = searchTerm.toLowerCase().trim();
    return clients.filter(c =>
      c.name.toLowerCase().includes(term) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.country && c.country.toLowerCase().includes(term))
    );
  }, [clients, searchTerm]);

  // Calculate requirement totals for each client
  const getClientProgress = (clientId: string) => {
    const reqs = requirementsMap[clientId] || [];
    const totalRequired = reqs.reduce((acc, r) => acc + (Number(r.required) || 0), 0);
    const totalInstalled = reqs.reduce((acc, r) => acc + (Number(r.installed) || 0), 0);
    const progressPercentage = calculateInstallationProgress(totalInstalled, totalRequired);
    return { totalRequired, totalInstalled, progressPercentage };
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden border-slate-200/90 shadow-subtle">
      {/* Compact Header */}
      <div className="p-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <h3 className="font-bold text-xs text-slate-900 leading-tight">Clients</h3>
          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600">
            {filteredClients.length}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 truncate">Choose client</p>
      </div>

      {/* Compact Search Bar */}
      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by client or city..."
            className="w-full pl-8 pr-7 py-1 text-xs rounded-md border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500/30 focus:border-brand-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 p-0.5"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Client Cards List */}
      <CardBody className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-250px)] lg:max-h-[660px] space-y-1.5">
        {isLoading ? (
          <div className="py-8 text-center">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-brand-600 border-t-transparent mb-1" />
            <p className="text-[11px] text-slate-500">Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-8 text-center px-2">
            <p className="text-xs font-semibold text-slate-700">No matching clients</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-xs text-brand-600 hover:text-brand-700 font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          filteredClients.map(client => {
            const { totalRequired, totalInstalled, progressPercentage } = getClientProgress(client.id);
            const isSelected = client.id === selectedClientId;

            return (
              <ClientCard
                key={client.id}
                client={client}
                isSelected={isSelected}
                onSelect={() => onSelectClient(client.id)}
                totalRequired={totalRequired}
                totalInstalled={totalInstalled}
                progressPercentage={progressPercentage}
              />
            );
          })
        )}
      </CardBody>
    </Card>
  );
};
