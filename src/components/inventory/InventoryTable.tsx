import React, { useState, useMemo } from 'react';
import { DeviceStockItem, ClientDeviceRequirement } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Card, CardHeader, CardBody } from '../common/Card';
import {
  calculateTotalClientsStillNeeded,
  calculateInventoryTotal,
  calculateInventoryStatus,
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
  BatteryCharging,
  Droplets,
  Package,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface InventoryTableProps {
  deviceStock: DeviceStockItem[];
  clientRequirements: Record<string, ClientDeviceRequirement[]>;
  isLoading?: boolean;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  deviceStock,
  clientRequirements,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Device Icon Mapping matching the CRM design
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
      case 'battery_pack':
        return <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />;
      case 'soap_dispenser':
        return <Droplets className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <Package className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  // Compute table data with live calculations for each device
  const computedRows = useMemo(() => {
    return deviceStock.map(item => {
      const usWarehouse = Number(item.usWarehouse) || 0;
      const indiaProduction = Number(item.indiaProduction) || 0;
      const total = calculateInventoryTotal(usWarehouse, indiaProduction);
      const clientsStillNeed = calculateTotalClientsStillNeeded(item.deviceKey, clientRequirements);
      const status = calculateInventoryStatus(total, clientsStillNeed);

      return {
        ...item,
        usWarehouse,
        indiaProduction,
        total,
        clientsStillNeed,
        status,
      };
    });
  }, [deviceStock, clientRequirements]);

  // Overall totals across all devices
  const overallTotals = useMemo(() => {
    return computedRows.reduce(
      (acc, r) => {
        acc.usWarehouse += r.usWarehouse;
        acc.indiaProduction += r.indiaProduction;
        acc.total += r.total;
        acc.clientsStillNeed += r.clientsStillNeed;
        if (r.status === 'Healthy') acc.healthyCount += 1;
        else acc.produceMoreCount += 1;
        return acc;
      },
      {
        usWarehouse: 0,
        indiaProduction: 0,
        total: 0,
        clientsStillNeed: 0,
        healthyCount: 0,
        produceMoreCount: 0,
      }
    );
  }, [computedRows]);

  // Filtered rows for display
  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return computedRows.filter(r => {
      const matchesSearch =
        !q ||
        r.deviceName.toLowerCase().includes(q) ||
        r.deviceDescription.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [computedRows, searchQuery]);

  return (
    <Card className="border-slate-200/90 shadow-subtle overflow-hidden">
      {/* Compact Table Header */}
      <CardHeader
        title={
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900">Current Inventory Status</span>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/70">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                {overallTotals.healthyCount} Healthy
              </span>
              {overallTotals.produceMoreCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                  {overallTotals.produceMoreCount} Produce more
                </span>
              )}
            </div>
          </div>
        }
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search device..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500 h-7.5 w-32 sm:w-40"
              />
            </div>
          </div>
        }
        className="py-2 px-3.5 sm:px-4 bg-white border-b border-slate-100"
      />

      {/* Main Table */}
      <CardBody className="p-0">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[660px]">
            {/* Table Column Headers */}
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/90 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="px-3 py-2">Device</th>
                <th className="px-2.5 py-2 text-center">US Warehouse</th>
                <th className="px-2.5 py-2 text-center">India Production</th>
                <th className="px-2.5 py-2 text-center bg-slate-100/60 font-extrabold text-slate-800">
                  Total
                </th>
                <th className="px-2.5 py-2 text-center">Clients Still Need</th>
                <th className="px-2.5 py-2 text-center">Status</th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent mb-1" />
                    <p className="text-xs font-semibold text-slate-700">Updating inventory balances...</p>
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-slate-500">
                    <Filter className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-slate-700">No matching devices found</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Try clearing the search or filter query.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  return (
                    <tr
                      key={row.deviceKey}
                      className={`transition-colors duration-150 hover:bg-slate-50/90 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      {/* 1. Device: Name & Description */}
                      <td className="px-3 py-1.5 sm:py-2 text-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded bg-slate-100 border border-slate-200/70 shrink-0">
                            {getDeviceIcon(row.deviceKey)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                              {row.deviceName}
                            </p>
                            <p className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                              {row.deviceDescription}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. US Warehouse */}
                      <td className="px-2.5 py-1.5 sm:py-2 text-center">
                        <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 min-w-[30px]">
                          {row.usWarehouse}
                        </span>
                      </td>

                      {/* 3. India Production */}
                      <td className="px-2.5 py-1.5 sm:py-2 text-center">
                        <span className="inline-block text-xs font-semibold text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200/60 min-w-[30px]">
                          {row.indiaProduction}
                        </span>
                      </td>

                      {/* 4. Total = US Warehouse + India Production */}
                      <td className="px-2.5 py-1.5 sm:py-2 text-center bg-slate-50/50">
                        <span className="inline-block text-xs font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/70 min-w-[32px]">
                          {row.total}
                        </span>
                      </td>

                      {/* 5. Clients Still Need (from client requirements, read-only) */}
                      <td className="px-2.5 py-1.5 sm:py-2 text-center">
                        <span
                          className={`inline-block text-xs font-bold px-2 py-0.5 rounded min-w-[30px] ${
                            row.clientsStillNeed === 0
                              ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/70'
                              : 'text-slate-800 bg-slate-100 border border-slate-200'
                          }`}
                          title="Total required across all clients minus already installed"
                        >
                          {row.clientsStillNeed}
                        </span>
                      </td>

                      {/* 6. Status: Healthy vs Produce more */}
                      <td className="px-2.5 py-1.5 sm:py-2 text-center">
                        {row.status === 'Healthy' ? (
                          <Badge variant="green" size="sm" dot className="text-[10px] px-1.5 py-0 font-bold">
                            Healthy
                          </Badge>
                        ) : (
                          <Badge variant="amber" size="sm" dot className="text-[10px] px-1.5 py-0 font-bold">
                            Produce more
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Summary Row */}
            {filteredRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-200 font-bold text-xs text-slate-900">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">
                        Overall Totals
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({filteredRows.length} items)
                      </span>
                    </div>
                  </td>
                  <td className="px-2.5 py-2 text-center font-bold text-slate-800">
                    {overallTotals.usWarehouse}
                  </td>
                  <td className="px-2.5 py-2 text-center font-bold text-slate-800">
                    {overallTotals.indiaProduction}
                  </td>
                  <td className="px-2.5 py-2 text-center font-extrabold text-brand-700 bg-brand-50/50">
                    {overallTotals.total}
                  </td>
                  <td className="px-2.5 py-2 text-center font-bold text-slate-800">
                    {overallTotals.clientsStillNeed}
                  </td>
                  <td className="px-2.5 py-2 text-center">
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {overallTotals.total >= overallTotals.clientsStillNeed ? (
                        <span className="text-emerald-700">Balanced</span>
                      ) : (
                        <span className="text-amber-700">Need Stock</span>
                      )}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </CardBody>
    </Card>
  );
};
