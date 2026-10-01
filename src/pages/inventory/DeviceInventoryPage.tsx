import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { StockActionType } from '../../types/crm';
import { Button } from '../../components/common/Button';
import { InventoryTable } from '../../components/inventory/InventoryTable';
import { LoadingSpinner } from '../../components/common/EmptyState';

export const DeviceInventoryPage: React.FC = () => {
  const {
    deviceStock,
    clientRequirements,
    refreshDeviceStock,
    recordStockAction,
    addToast,
    isLoading,
  } = useCrm();

  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<StockActionType>('production_ready');
  const [quantity, setQuantity] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Ensure stock data is up to date on mount
  useEffect(() => {
    refreshDeviceStock();
  }, [refreshDeviceStock]);

  // Default to first device once loaded
  useEffect(() => {
    if (deviceStock.length > 0 && !selectedDevice) {
      setSelectedDevice(deviceStock[0].deviceKey);
    }
  }, [deviceStock, selectedDevice]);

  const handleSaveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(quantity, 10);
    if (!selectedDevice || isNaN(qty) || qty <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Please enter a valid positive number.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await recordStockAction(selectedDevice, selectedAction, qty);
      const dev = deviceStock.find(d => d.deviceKey === selectedDevice);
      addToast({
        type: 'success',
        title: 'Stock Updated',
        message: `Updated ${dev ? dev.deviceName : 'device'} stock balance.`,
      });
      setQuantity('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err?.message || 'Could not update stock.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 animate-fade-in pb-4">
      {/* Compact Page Header */}
      <div>
        <Link
          to="/operations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-1.5 transition-all w-fit group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all" />
          <span>Back to Operations</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
          Device Inventory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Stock in the India production house and the US warehouse.
        </p>
      </div>

      {/* Update Stock Form matching CRM design style */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Update Stock
        </h3>
        <form onSubmit={handleSaveStock} className="flex flex-wrap items-end gap-2.5">
          <div className="flex-1 min-w-[150px] sm:max-w-xs">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Device
            </label>
            <select
              value={selectedDevice}
              onChange={e => setSelectedDevice(e.target.value)}
              className="w-full h-8 text-xs font-medium rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs transition-colors"
            >
              {deviceStock.map(item => (
                <option key={item.deviceKey} value={item.deviceKey}>
                  {item.deviceName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[190px] sm:max-w-sm">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Stock Action
            </label>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value as StockActionType)}
              className="w-full h-8 text-xs font-medium rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs transition-colors"
            >
              <option value="production_ready">Produced in India (+ India)</option>
              <option value="shipped_to_us">Shipped to US (+ US, - India)</option>
              <option value="installed_client">Installed in client place (- US)</option>
            </select>
          </div>

          <div className="w-28 sm:w-32">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              placeholder="How many?"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full h-8 text-xs font-medium rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs transition-colors"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            className="h-8 text-xs font-bold whitespace-nowrap shadow-xs px-4"
          >
            Save
          </Button>
        </form>
      </div>

      {isLoading && deviceStock.length === 0 ? (
        <div className="py-12">
          <LoadingSpinner label="Loading device inventory..." />
        </div>
      ) : (
        <div>
          {/* Inventory Table */}
          <InventoryTable
            deviceStock={deviceStock}
            clientRequirements={clientRequirements}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default DeviceInventoryPage;

