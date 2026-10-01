import React from 'react';
import { ClientDeviceRequirement } from '../../types/crm';
import { RequirementRow } from './RequirementRow';
import { Badge } from '../common/Badge';
import { calculateStillNeeded } from '../../utils/clientRequirements';

interface RequirementsTableProps {
  requirements: ClientDeviceRequirement[];
  onRequiredChange: (deviceKey: string, newValue: number) => void;
  isLoading?: boolean;
}

export const RequirementsTable: React.FC<RequirementsTableProps> = ({
  requirements,
  onRequiredChange,
  isLoading,
}) => {
  // Summary totals
  const totalRequired = requirements.reduce(
    (acc, r) => acc + (Number(r.required) || 0),
    0
  );
  const totalInstalled = requirements.reduce(
    (acc, r) => acc + (Number(r.installed) || 0),
    0
  );
  const totalStillNeeded = requirements.reduce(
    (acc, r) => acc + calculateStillNeeded(r.required, r.installed),
    0
  );

  const totalShortages = requirements.filter(
    r => calculateStillNeeded(r.required, r.installed) > r.indiaStock
  ).length;

  const canFullySupply = totalShortages === 0;

  if (isLoading) {
    return (
      <div className="py-10 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-brand-600 border-t-transparent mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading requirements...</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-xs font-medium text-slate-600">No device requirements configured for this client.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <table className="w-full divide-y divide-slate-200 text-left text-xs table-fixed">
        {/* Table Header matching CRM Table styling */}
        <thead className="bg-slate-50/75 border-b border-slate-200/80">
          <tr>
            <th
              scope="col"
              className="px-2.5 sm:px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 w-[35%]"
            >
              Device
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center w-[13%]"
            >
              Required
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center w-[13%]"
            >
              Installed
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center w-[13%]"
            >
              Still Needed
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center w-[12%]"
            >
              India Stock
            </th>
            <th
              scope="col"
              className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 text-center w-[14%]"
            >
              Can We Supply?
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 bg-white">
          {requirements.map((item, index) => (
            <RequirementRow
              key={item.id || item.deviceKey}
              item={item}
              onRequiredChange={onRequiredChange}
              index={index}
            />
          ))}
        </tbody>

        {/* Table Footer with Summary Totals */}
        <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-xs">
          <tr>
            <td className="px-2.5 sm:px-3 py-2.5 text-slate-900">
              <span className="font-extrabold uppercase tracking-wide text-[11px] text-slate-700">
                Total Devices
              </span>
            </td>
            <td className="px-2 py-2.5 text-center text-brand-700 font-extrabold">
              {totalRequired}
            </td>
            <td className="px-2 py-2.5 text-center text-emerald-700 font-extrabold">
              {totalInstalled}
            </td>
            <td className="px-2 py-2.5 text-center text-slate-900 font-extrabold">
              {totalStillNeeded}
            </td>
            <td className="px-2 py-2.5 text-center text-slate-400 font-normal">
              —
            </td>
            <td className="px-2 py-2.5 text-center">
              {canFullySupply ? (
                <Badge variant="green" size="sm" dot className="text-[10px] px-1.5 py-0">
                  ALL YES
                </Badge>
              ) : (
                <Badge variant="rose" size="sm" dot className="text-[10px] px-1.5 py-0">
                  {totalShortages} {totalShortages === 1 ? 'SHORT' : 'SHORTS'}
                </Badge>
              )}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
