import React, { useState, useEffect } from 'react';
import { DeviceInventoryItem } from '../../types/crm';
import { Modal } from '../common/Modal';
import { Input, Select } from '../common/Input';
import { Button } from '../common/Button';

interface DeviceModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DeviceInventoryItem, 'id' | 'updatedAt'>) => Promise<void>;
  initialData?: DeviceInventoryItem | null;
}

export const DeviceModalForm: React.FC<DeviceModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [deviceName, setDeviceName] = useState('');
  const [category, setCategory] = useState('Gateways');
  const [sku, setSku] = useState('');
  const [requiredQty, setRequiredQty] = useState<number>(0);
  const [availableQty, setAvailableQty] = useState<number>(0);
  const [allocatedQty, setAllocatedQty] = useState<number>(0);
  const [unit, setUnit] = useState('Units');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDeviceName(initialData.deviceName);
      setCategory(initialData.category);
      setSku(initialData.sku || '');
      setRequiredQty(initialData.requiredQty);
      setAvailableQty(initialData.availableQty);
      setAllocatedQty(initialData.allocatedQty);
      setUnit(initialData.unit || 'Units');
    } else {
      setDeviceName('');
      setCategory('Gateways');
      setSku('');
      setRequiredQty(0);
      setAvailableQty(0);
      setAllocatedQty(0);
      setUnit('Units');
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!deviceName.trim()) errs.deviceName = 'Device name is required';
    if (requiredQty < 0) errs.requiredQty = 'Cannot be negative';
    if (availableQty < 0) errs.availableQty = 'Cannot be negative';
    if (allocatedQty < 0) errs.allocatedQty = 'Cannot be negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        deviceName: deviceName.trim(),
        category,
        sku: sku.trim() || undefined,
        requiredQty: Number(requiredQty),
        availableQty: Number(availableQty),
        allocatedQty: Number(allocatedQty),
        unit,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'Gateways', label: 'Gateways & Hubs' },
    { value: 'Sensors', label: 'Sensors & Telemetry' },
    { value: 'Controllers', label: 'Industrial Controllers' },
    { value: 'Power & Energy', label: 'Power & Energy Meters' },
    { value: 'Networking', label: 'Networking & Backhaul' },
    { value: 'Access Control', label: 'Access Control & RFID' },
    { value: 'Accessories', label: 'Antennas & Accessories' },
  ];

  const unitOptions = [
    { value: 'Units', label: 'Units' },
    { value: 'Sets', label: 'Sets' },
    { value: 'Kits', label: 'Kits' },
    { value: 'Pcs', label: 'Pcs' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Device Item' : 'Add Device to Inventory'}
      subtitle="Manage hardware catalog, required quantities, stock levels, and field allocations"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Device Name */}
        <Input
          label="Device Name / Model"
          placeholder="Enter device or model name"
          value={deviceName}
          onChange={e => setDeviceName(e.target.value)}
          error={errors.deviceName}
          required
        />

        {/* Category & SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Hardware Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            options={categoryOptions}
            required
          />
          <Input
            label="SKU / Part Number"
            placeholder="e.g. SKU-100"
            value={sku}
            onChange={e => setSku(e.target.value)}
          />
        </div>

        {/* Quantities Grid */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
            Stock Quantities & Allocation
          </span>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Input
                label="Required Qty"
                type="number"
                min="0"
                value={requiredQty}
                onChange={e => setRequiredQty(Number(e.target.value))}
                error={errors.requiredQty}
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Needed for jobs</span>
            </div>

            <div>
              <Input
                label="Available Qty"
                type="number"
                min="0"
                value={availableQty}
                onChange={e => setAvailableQty(Number(e.target.value))}
                error={errors.availableQty}
                required
              />
              <span className="text-[10px] text-emerald-600 font-medium mt-1 block">In warehouse</span>
            </div>

            <div>
              <Input
                label="Allocated Qty"
                type="number"
                min="0"
                value={allocatedQty}
                onChange={e => setAllocatedQty(Number(e.target.value))}
                error={errors.allocatedQty}
                required
              />
              <span className="text-[10px] text-brand-600 font-medium mt-1 block">Assigned in field</span>
            </div>
          </div>
        </div>

        {/* Unit */}
        <Select
          label="Measurement Unit"
          value={unit}
          onChange={e => setUnit(e.target.value)}
          options={unitOptions}
          required
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {initialData ? 'Save Changes' : 'Add to Inventory'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
