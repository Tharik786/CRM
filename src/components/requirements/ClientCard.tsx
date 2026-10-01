import React from 'react';
import { Company } from '../../types/crm';
import { Badge } from '../common/Badge';
import { formatClientLocation, getCountryCode } from '../../utils/clientRequirements';
import { MapPin, Building2, CheckCircle2 } from 'lucide-react';

interface ClientCardProps {
  client: Company;
  isSelected: boolean;
  onSelect: () => void;
  totalRequired: number;
  totalInstalled: number;
  progressPercentage: number;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  isSelected,
  onSelect,
  totalRequired,
  totalInstalled,
  progressPercentage,
}) => {
  const countryCode = getCountryCode(client.country);
  const locationText = formatClientLocation(client.city, client.country);
  const isCompleted = progressPercentage >= 100 && totalRequired > 0;

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`p-2.5 rounded-lg border text-left transition-all duration-150 cursor-pointer select-none group relative ${
        isSelected
          ? 'bg-brand-50/70 border-brand-500 shadow-sm ring-1 ring-brand-500/30'
          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-subtle hover:bg-slate-50/50'
      }`}
    >
      {/* Top Row: Name & Country Badge */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="min-w-0 flex-1 flex items-center gap-1.5">
          <Building2
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isSelected ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
            }`}
          />
          <h4
            className={`text-xs font-bold truncate transition-colors ${
              isSelected ? 'text-brand-950' : 'text-slate-900 group-hover:text-brand-700'
            }`}
            title={client.name}
          >
            {client.name}
          </h4>
        </div>

        {/* Compact Country Badge */}
        <Badge
          variant={isSelected ? 'indigo' : 'slate'}
          size="sm"
          className="text-[10px] px-1.5 py-0 shrink-0 font-bold"
        >
          {countryCode}
        </Badge>
      </div>

      {/* Location Line */}
      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 pl-5">
        <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
        <span className="truncate">{locationText}</span>
      </div>

      {/* Compact Installation Progress Bar & Percentage */}
      <div className="mt-2 pt-1.5 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 font-medium">
            Progress <span className="text-slate-400 font-normal">({totalInstalled}/{totalRequired})</span>
          </span>
          <div className="flex items-center gap-1">
            {isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
            <span
              className={`font-bold ${
                isCompleted
                  ? 'text-emerald-700'
                  : isSelected
                  ? 'text-brand-700'
                  : 'text-slate-700'
              }`}
            >
              {progressPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${
              isCompleted
                ? 'bg-emerald-500'
                : isSelected
                ? 'bg-brand-600'
                : 'bg-brand-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
          />
        </div>
      </div>
    </div>
  );
};
