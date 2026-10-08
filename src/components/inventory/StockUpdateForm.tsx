import React, { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import { DeviceStockItem } from '../../types/crm';
import { Button } from '../common/Button';
import { Check, Factory } from 'lucide-react';
import { DEVICE_DEFINITIONS } from '../../api/mockData';

const INVENTORY_DEVICE_OPTIONS = [
  { value: '', label: 'Select device...' },
  ...DEVICE_DEFINITIONS.map(def => ({ value: def.key, label: def.name })),
];

interface StockUpdateFormProps {
  deviceStock: DeviceStockItem[];
}

export const StockUpdateForm: React.FC<StockUpdateFormProps> = ({ deviceStock }) => {
  const { recordStockAction, addToast } = useCrm();

  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [errors, setErrors] = useState<{
    device?: string;
    quantity?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Current stock for the selected device
  const currentItem = deviceStock.find(item => item.deviceKey === selectedDeviceKey);

  // Validate form
  const validate = (): boolean => {
    const newErrors: {
      device?: string;
      quantity?: string;
    } = {};

    if (!selectedDeviceKey) {
      newErrors.device = 'Please select a device';
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
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorMessage =
        newErrors.quantity || newErrors.device || 'Please correct the form errors.';
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
        'production_ready',
        parsedQty
      );

      addToast({
        type: 'success',
        title: 'Stock Updated',
        message: `${updated.deviceName}: Added ${parsedQty} units to India Production.`,
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
    if (!quantity || !Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return null;
    }
    const qty = parseInt(quantity, 10);
    return {
      icon: Factory,
      text: `Will add ${qty} unit${qty > 1 ? 's' : ''} to India Production`,
      color: 'text-indigo-700 bg-indigo-50 border-indigo-200/80',
    };
  };

  const preview = getActionPreview();

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 sm:p-4">
      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          {/* 1. Device Dropdown */}
          <div className="flex-1 min-w-0 w-full">
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
              className={`block w-full rounded-lg border text-xs font-medium transition-colors h-9 py-1 px-2.5 bg-white ${
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

          {/* 2. Quantity Input */}
          <div className="w-full sm:w-28 shrink-0">
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
              className={`block w-full rounded-lg border text-xs font-bold transition-colors h-9 py-1 px-2.5 text-slate-900 placeholder-slate-400 bg-white ${
                errors.quantity
                  ? 'border-rose-300 text-rose-900 focus:ring-rose-500 focus:border-rose-500'
                  : 'border-slate-300 focus:ring-1 focus:ring-brand-500 focus:border-brand-500'
              }`}
            />
            {errors.quantity && (
              <p className="mt-0.5 text-[10px] text-rose-600 font-medium">{errors.quantity}</p>
            )}
          </div>

          {/* 3. Save Button */}
          <div className="w-full sm:w-auto shrink-0">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="w-full sm:w-auto h-9 px-4 text-xs font-bold shadow-sm"
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Update
            </Button>
          </div>
        </div>

        {/* Dynamic Action Preview Banner */}
        {preview && (
          <div
            className={`mt-2.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 animate-fade-in ${preview.color}`}
          >
            <preview.icon className="w-3.5 h-3.5 shrink-0" />
            <span>{preview.text}</span>
          </div>
        )}
      </form>
    </div>
  );
};
