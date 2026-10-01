import React from 'react';
import { Company } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatClientLocation, getCountryCode, getShippingDirection } from '../../utils/clientRequirements';
import { MapPin, Plane, Building2, Save, CheckCircle2, RotateCcw } from 'lucide-react';

interface SelectedClientHeaderProps {
  client: Company;
  totalRequired: number;
  totalInstalled: number;
  totalStillNeeded: number;
  progressPercentage: number;
  canFullySupply: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onSave: () => void;
  onReset: () => void;
}

export const SelectedClientHeader: React.FC<SelectedClientHeaderProps> = ({
  client,
  totalRequired,
  totalInstalled,
  totalStillNeeded,
  progressPercentage,
  canFullySupply,
  isSaving,
  isDirty,
  onSave,
  onReset,
}) => {
  const locationText = formatClientLocation(client.city, client.country);
  const countryCode = getCountryCode(client.country);
  const shippingStatus = getShippingDirection(client.country);

  return (
    <div className="p-3 sm:p-4 border-b border-slate-100 bg-white">
      {/* Top Details & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 truncate">
              <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{client.name}</span>
            </h2>
            <Badge variant="indigo" size="sm" className="font-bold text-[10px] px-1.5 py-0">
              {countryCode}
            </Badge>
          </div>

          {/* Location & Shipping Direction Status */}
          <div className="flex items-center gap-2.5 mt-1 flex-wrap text-xs">
            <div className="flex items-center gap-1 text-slate-600 font-medium">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{locationText}</span>
            </div>

            <span className="text-slate-300">•</span>

            {/* Shipping direction/status */}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200/80 text-[11px]">
              <Plane className="w-3 h-3 text-brand-600 shrink-0" />
              <span>{shippingStatus}</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isDirty && (
            <Button
              variant="secondary"
              size="xs"
              onClick={onReset}
              disabled={isSaving}
              icon={<RotateCcw className="w-3 h-3 text-slate-500" />}
              className="text-xs"
            >
              Reset
            </Button>
          )}

          <Button
            variant="primary"
            size="xs"
            onClick={onSave}
            isLoading={isSaving}
            icon={<Save className="w-3.5 h-3.5" />}
            className="text-xs font-semibold shadow-sm px-3 py-1.5"
          >
            {isSaving ? 'Saving...' : 'Save Requirements'}
          </Button>
        </div>
      </div>

      {/* Metric Summary Cards - Compact Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100">
        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Required</p>
          <p className="text-base font-bold text-slate-900 mt-0.5">{totalRequired}</p>
        </div>

        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Installed</p>
          <p className="text-base font-bold text-emerald-700 mt-0.5">{totalInstalled}</p>
        </div>

        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Still Needed</p>
          <p className="text-base font-bold text-slate-800 mt-0.5">{totalStillNeeded}</p>
        </div>

        <div className="bg-slate-50/80 rounded-lg p-2 border border-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Progress</p>
            {canFullySupply ? (
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> In Stock
              </span>
            ) : (
              <span className="text-[10px] font-bold text-rose-600">Shortage</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-900">{progressPercentage}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
