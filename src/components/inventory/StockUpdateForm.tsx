import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { StockActionType, DeviceStockItem } from '../../types/crm';
import { Card, CardBody } from '../common/Card';
import { Button } from '../common/Button';
import {
  Boxes,
  Check,
  Factory,
  Truck,
  Building2,
} from 'lucide-react';

export const INVENTORY_DEVICE_OPTIONS = [
  { value: '', label: 'Select device...' },
  { value: 'toilet_paper', label: 'Toilet paper' },
  { value: 'paper_towel', label: 'Paper towel' },
  { value: 'trash', label: 'Trash' },
  { value: 'ros', label: 'ROS' },
  { value: 'stall', label: 'Stall' },
  { value: 'stall_ros', label: 'Stall ROS' },
  { value: 'air_quality', label: 'Air quality' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'battery_pack', label: 'Battery pack' },
  { value: 'soap_dispenser', label: 'Soap dispenser' },
];

export const STOCK_ACTION_OPTIONS: { value: '' | StockActionType; label: string }[] = [
  { value: '', label: 'Select stock action...' },
  { value: 'production_ready', label: 'Production ready in India' },
  { value: 'shipped_to_us', label: 'Shipped from India → US' },
  { value: 'installed_client', label: 'Installed in client place' },
];

interface StockUpdateFormProps {
  deviceStock: DeviceStockItem[];
}

export const StockUpdateForm: React.FC<StockUpdateFormProps> = ({ deviceStock }) => {
  const { recordStockAction, addToast } = useCrm();

  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<StockActionType | ''>('');
  const [quantity, setQuantity] = useState<string>('');
  const [errors, setErrors] = useState<{
    device?: string;
    action?: string;
    quantity?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Current stock for the selected device
  const currentItem = deviceStock.find(item => item.deviceKey === selectedDeviceKey);

  // Validate form
  const validate = (): boolean => {
    const newErrors: {
      device?: string;
      action?: string;
      quantity?: string;
    } = {};

    if (!selectedDeviceKey) {
      newErrors.device = 'Please select a device';
    }

    if (!selectedAction) {
      newErrors.action = 'Please select a stock action';
    }

    if (!quantity || quantity.trim() === '') {
      newErrors.quantity = 'Quantity is required';
    } else {
      const num = Number(quantity.trim());
      if (isNaN(num)) {
        newErrors.quantity = 'Must be a valid number';
      } else if (!Number.isInteger(num)) {
        newErrors.quantity = 'Decimals not allowed';
      } else if (num <= 0) {
        newErrors.quantity = 'Must be greater than 0';
      } else if (currentItem) {
        if (selectedAction === 'shipped_to_us' && num > currentItem.indiaProduction) {
          newErrors.quantity = `Only ${currentItem.indiaProduction} available in India Production`;
        } else if (selectedAction === 'installed_client' && num > currentItem.usWarehouse) {
          newErrors.quantity = `Only ${currentItem.usWarehouse} available in US Warehouse`;
        }
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorMessage =
        newErrors.quantity || newErrors.action || newErrors.device || 'Please correct the form errors.';
      addToast({
        type: 'error',
        title: 'Validation Error',
        message: firstErrorMessage,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const parsedQty = parseInt(quantity.trim(), 10);
    setIsSubmitting(true);

    try {
      const updated = await recordStockAction(
        selectedDeviceKey,
        selectedAction as StockActionType,
        parsedQty
      );

      const actionText =
        selectedAction === 'production_ready'
          ? `Added ${parsedQty} units to India Production`
          : selectedAction === 'shipped_to_us'
          ? `Transferred ${parsedQty} units from India to US Warehouse`
          : `Recorded ${parsedQty} units installed from US Warehouse`;

      addToast({
        type: 'success',
        title: 'Stock Updated',
        message: `${updated.deviceName}: ${actionText}.`,
      });

      // Clear quantity after successful save
      setQuantity('');
      setErrors({});
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      const errMsg = err?.message || 'Could not update stock. Please try again.';
      setErrors(prev => ({ ...prev, quantity: errMsg }));
      addToast({
        type: 'error',
        title: 'Stock Update Failed',
        message: errMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Action Preview Text Helper
  const getActionPreview = () => {
    if (!selectedAction || !quantity || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return null;
    }
    const qty = parseInt(quantity, 10);
    if (selectedAction === 'production_ready') {
      return {
        icon: Factory,
        text: `Will add ${qty} unit${qty > 1 ? 's' : ''} to India Production`,
        color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
      };
    }
    if (selectedAction === 'shipped_to_us') {
      return {
        icon: Truck,
        text: `Will move ${qty} unit${qty > 1 ? 's' : ''} from India Production → US Warehouse`,
        color: 'text-cyan-700 bg-cyan-50 border-cyan-200/80',
      };
    }
    if (selectedAction === 'installed_client') {
      return {
        icon: Building2,
        text: `Will subtract ${qty} unit${qty > 1 ? 's' : ''} from US Warehouse (Installed at client place)`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
      };
    }
    return null;
  };

  const preview = getActionPreview();

  return (
    <Card className="border-slate-200/90 shadow-subtle overflow-hidden">
      {/* Compact Card Header */}
      <div className="py-2 px-3.5 sm:px-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Boxes className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900">Update Stock</span>
        </div>
        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Record production batches, transshipments, or installations
        </span>
      </div>

      {/* Compact Form Body */}
      <CardBody className="p-3 sm:p-3.5">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
            {/* 1. Device Dropdown */}
            <div className="lg:col-span-4 w-full">
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="inventory-device-select"
                  className="text-[11px] font-bold text-slate-700"
                >
                  Device <span className="text-rose-500">*</span>
                </label>
                {currentItem && (
                  <span className="text-[10px] text-slate-500 font-medium">
                    India: <span className="font-bold text-slate-700">{currentItem.indiaProduction}</span> | US: <span className="font-bold text-slate-700">{currentItem.usWarehouse}</span>
                  </span>
                )}
              </div>
              <select
                id="inventory-device-select"
                value={selectedDeviceKey}
                onChange={e => {
                  setSelectedDeviceKey(e.target.value);
                  if (errors.device) {
                    setErrors(prev => ({ ...prev, device: undefined }));
                  }
                }}
                className={`block w-full rounded-lg border text-xs font-medium transition-colors h-8 py-1 px-2.5 bg-white ${
                  errors.device
                    ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 text-slate-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500'
                }`}
              >
                {INVENTORY_DEVICE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.device && (
                <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.device}</p>
              )}
            </div>

            {/* 2. Stock Action Dropdown */}
            <div className="lg:col-span-4 w-full">
              <label
                htmlFor="inventory-action-select"
                className="block text-[11px] font-bold text-slate-700 mb-1"
              >
                Stock Action <span className="text-rose-500">*</span>
              </label>
              <select
                id="inventory-action-select"
                value={selectedAction}
                onChange={e => {
                  setSelectedAction(e.target.value as StockActionType | '');
                  if (errors.action) {
                    setErrors(prev => ({ ...prev, action: undefined }));
                  }
                }}
                className={`block w-full rounded-lg border text-xs font-medium transition-colors h-8 py-1 px-2.5 bg-white ${
                  errors.action
                    ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 text-slate-900 focus:ring-1 focus:ring-brand-500 focus:border-brand-500'
                }`}
              >
                {STOCK_ACTION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.action && (
                <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.action}</p>
              )}
            </div>

            {/* 3. Quantity Input */}
            <div className="lg:col-span-2 w-full">
              <label
                htmlFor="inventory-quantity-input"
                className="block text-[11px] font-bold text-slate-700 mb-1"
              >
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                id="inventory-quantity-input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 25"
                value={quantity}
                onChange={e => {
                  setQuantity(e.target.value);
                  if (errors.quantity) {
                    setErrors(prev => ({ ...prev, quantity: undefined }));
                  }
                }}
                className={`block w-full rounded-lg border text-xs font-bold transition-colors h-8 py-1 px-2.5 text-slate-900 placeholder-slate-400 bg-white ${
                  errors.quantity
                    ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                    : 'border-slate-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500'
                }`}
              />
              {errors.quantity && (
                <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.quantity}</p>
              )}
            </div>

            {/* 4. Save Button */}
            <div className="lg:col-span-2 w-full">
              <Button
                type="submit"
                variant="primary"
                size="xs"
                isLoading={isSubmitting}
                className="w-full h-8 text-xs font-bold shadow-sm"
                icon={<Check className="w-3.5 h-3.5" />}
              >
                Save
              </Button>
            </div>
          </div>

          {/* Dynamic Action Preview Banner */}
          {preview && (
            <div
              className={`mt-2 px-2.5 py-1 rounded-md border text-[11px] font-medium flex items-center gap-1.5 animate-fade-in ${preview.color}`}
            >
              <preview.icon className="w-3.5 h-3.5 shrink-0" />
              <span>{preview.text}</span>
            </div>
          )}
        </form>
      </CardBody>
    </Card>
  );
};
