import React from 'react';
import { ClientDeviceRequirement } from '../../types/crm';
import { Badge } from '../common/Badge';
import {
  calculateStillNeeded,
  canSupplyDevice,
} from '../../utils/clientRequirements';
import {
  Disc,
  Layers,
  Trash2,
  Users,
  DoorClosed,
  UserCheck,
  Wind,
  Wifi,
  Package,
} from 'lucide-react';

interface RequirementRowProps {
  item: ClientDeviceRequirement;
  onRequiredChange: (deviceKey: string, newValue: number) => void;
  index: number;
}

export const RequirementRow: React.FC<RequirementRowProps> = ({
  item,
  onRequiredChange,
  index,
}) => {
  // Device Icon Mapping
  const getDeviceIcon = (key: string) => {
    switch (key) {
      case 'toilet_paper':
        return <Disc className="w-3.5 h-3.5 text-brand-600" />;
      case 'paper_towel':
        return <Layers className="w-3.5 h-3.5 text-cyan-600" />;
      case 'trash':
        return <Trash2 className="w-3.5 h-3.5 text-amber-600" />;
      case 'ros':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'stall':
        return <DoorClosed className="w-3.5 h-3.5 text-blue-600" />;
      case 'stall_ros':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'air_quality':
        return <Wind className="w-3.5 h-3.5 text-emerald-600" />;
      case 'gateway':
        return <Wifi className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Calculations
  const stillNeeded = calculateStillNeeded(item.required, item.installed);
  const canSupply = canSupplyDevice(item.indiaStock, stillNeeded);

  // Input change handler ensuring numeric, >= 0
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      onRequiredChange(item.deviceKey, 0);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed)) {
      onRequiredChange(item.deviceKey, Math.max(0, parsed));
    }
  };

  return (
    <tr
      className={`transition-colors duration-150 hover:bg-slate-50/80 ${
        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
      }`}
    >
      {/* 1. Device: Name & short description/type */}
      <td className="px-2.5 sm:px-3 py-2 text-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-slate-100 border border-slate-200/70 shrink-0">
            {getDeviceIcon(item.deviceKey)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 leading-snug truncate">
              {item.deviceName}
            </p>
            <p className="text-[10px] text-slate-500 truncate">
              {item.deviceDescription}
            </p>
          </div>
        </div>
      </td>

      {/* 2. Required (Editable numeric input >= 0) */}
      <td className="px-2 py-2 text-center">
        <input
          type="number"
          min="0"
          step="1"
          value={item.required === 0 ? '0' : item.required}
          onChange={handleInputChange}
          aria-label={`${item.deviceName} Required Quantity`}
          className="w-14 sm:w-16 mx-auto block text-center py-1 px-1 text-xs font-bold rounded border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 shadow-sm transition-colors"
        />
      </td>

      {/* 3. Installed (Read-only, from installation data) */}
      <td className="px-2 py-2 text-center">
        <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 min-w-[28px]">
          {item.installed}
        </span>
      </td>

      {/* 4. Still Needed = max(Required - Installed, 0) */}
      <td className="px-2 py-2 text-center">
        <span
          className={`inline-block text-xs font-bold px-2 py-0.5 rounded min-w-[28px] ${
            stillNeeded === 0
              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/80'
              : 'text-slate-800 bg-slate-50 border border-slate-200'
          }`}
        >
          {stillNeeded}
        </span>
      </td>

      {/* 5. India Stock (Read-only available India stock) */}
      <td className="px-2 py-2 text-center">
        <span className="text-xs font-semibold text-slate-700">
          {item.indiaStock}
        </span>
      </td>

      {/* 6. Can We Supply? (YES / NO badge) */}
      <td className="px-2 py-2 text-center">
        {canSupply ? (
          <Badge variant="green" size="sm" dot className="text-[10px] px-1.5 py-0">
            YES
          </Badge>
        ) : (
          <Badge variant="rose" size="sm" dot className="text-[10px] px-1.5 py-0">
            NO
          </Badge>
        )}
      </td>
    </tr>
  );
};
