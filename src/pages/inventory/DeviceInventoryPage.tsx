import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { InventoryTable, ViewTab } from '../../components/inventory/InventoryTable';
import { StockUpdateForm } from '../../components/inventory/StockUpdateForm';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';

export const DeviceInventoryPage: React.FC = () => {
  const { refreshDeviceStock, deviceStock } = useCrm();
  const [isUpdateStockOpen, setIsUpdateStockOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>('inventory');

  // Ensure latest synced stock balances on mount
  useEffect(() => {
    refreshDeviceStock();
  }, [refreshDeviceStock]);

  return (
    <div className="space-y-3.5 animate-fade-in pb-8">
      {/* Page Header matching Operations / Client Requirements Style */}
      <div>
        <Link
          to="/operations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-2 transition-all w-fit group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all" />
          <span>Back to Operations</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Device Inventory
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Connected operations inventory across Client Requirements, Dispatch, In Transit, US Warehouse, and Installations.
            </p>
          </div>
          {activeTab === 'inventory' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsUpdateStockOpen(true)}
            >
              Update Stock
            </Button>
          )}
        </div>
      </div>

      {/* Main Connected Table */}
      <InventoryTable activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Update Stock Modal */}
      {isUpdateStockOpen && (
        <Modal
          isOpen={isUpdateStockOpen}
          onClose={() => setIsUpdateStockOpen(false)}
          title="Update Stock"
          subtitle="Record production batches, India → US shipments, or client installations"
          maxWidth="lg"
        >
          <StockUpdateForm deviceStock={deviceStock} />
          <div className="flex justify-end pt-3 border-t border-slate-100 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsUpdateStockOpen(false)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DeviceInventoryPage;
