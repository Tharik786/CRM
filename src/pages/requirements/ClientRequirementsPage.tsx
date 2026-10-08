import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Card, CardBody } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { DEVICE_DEFINITIONS } from '../../api/mockData';
import { ClientDeviceRequirement, ClientOrderRecord } from '../../types/crm';

interface SelectedSensorItem {
  deviceKey: string;
  deviceName: string;
  deviceDescription: string;
  quantity: number;
}

export const ClientRequirementsPage: React.FC = () => {
  const {
    companies,
    contacts,
    leads,
    quotations,
    getClientRequirements,
    saveClientRequirements,
    orders,
    createOrder,
    deleteOrder,
    addToast,
  } = useCrm();

  // Form State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedSensorKey, setSelectedSensorKey] = useState<string>(
    DEVICE_DEFINITIONS[0]?.key || 'Wetness'
  );
  const [quantityInput, setQuantityInput] = useState<string>('');
  const [sensorList, setSensorList] = useState<SelectedSensorItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Selected company object
  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === selectedClientId);
  }, [companies, selectedClientId]);

  const canCreateOrder = Boolean(
    selectedClientId && (sensorList.length > 0 || parseInt(quantityInput.trim(), 10) > 0)
  );

  // Reset the sensor list whenever client changes to compose a fresh order
  useEffect(() => {
    setSensorList([]);
    setQuantityInput('');
  }, [selectedClientId]);

  // Add sensor to current list
  const handleAddSensor = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const qty = parseInt(quantityInput, 10);
    if (isNaN(qty) || qty <= 0) {
      addToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Please enter a valid quantity of at least 1.',
      });
      return;
    }

    const sensorDef = DEVICE_DEFINITIONS.find(d => d.key === selectedSensorKey);
    if (!sensorDef) return;

    setSensorList(prev => {
      const existingIdx = prev.findIndex(item => item.deviceKey === selectedSensorKey);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + qty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            deviceKey: sensorDef.key,
            deviceName: sensorDef.name,
            deviceDescription: sensorDef.description,
            quantity: qty,
          },
        ];
      }
    });

    setQuantityInput('');
  };

  // Remove sensor item
  const handleRemoveSensor = (deviceKey: string) => {
    setSensorList(prev => prev.filter(item => item.deviceKey !== deviceKey));
  };

  // Update quantity of an added sensor
  const handleUpdateQuantity = (deviceKey: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveSensor(deviceKey);
      return;
    }
    setSensorList(prev =>
      prev.map(item =>
        item.deviceKey === deviceKey ? { ...item, quantity: newQty } : item
      )
    );
  };

  // Helper to sync client requirement totals with orders
  const syncClientReqs = async (
    clientId: string,
    clientOrders: ClientOrderRecord[],
    extraItems: SelectedSensorItem[] = []
  ) => {
    const totalMap: Record<string, number> = {};
    clientOrders.forEach(o => (o.devices || []).forEach(d => {
      totalMap[d.deviceKey] = (totalMap[d.deviceKey] || 0) + (Number(d.quantity) || 0);
    }));
    extraItems.forEach(item => {
      totalMap[item.deviceKey] = (totalMap[item.deviceKey] || 0) + (Number(item.quantity) || 0);
    });

    const existingReqs = await getClientRequirements(clientId);
    const updatedRequirements: ClientDeviceRequirement[] = existingReqs.map(r => ({
      ...r,
      required: totalMap[r.deviceKey] || 0,
      updatedAt: new Date().toISOString(),
    }));
    await saveClientRequirements(clientId, updatedRequirements);
  };

  // Save requirements to CRM context & Create an entry in the Orders Table
  const handleSaveRequirements = async () => {
    if (!selectedClientId || !selectedCompany) {
      addToast({
        type: 'error',
        title: 'Client Required',
        message: 'Please select a client to save requirements.',
      });
      return;
    }

    // Determine final sensor items: include current input if user didn't click "+ Add sensor"
    let finalSensorList = [...sensorList];
    const parsedQty = parseInt(quantityInput.trim(), 10);
    if (!isNaN(parsedQty) && parsedQty > 0) {
      const sensorDef = DEVICE_DEFINITIONS.find(d => d.key === selectedSensorKey);
      if (sensorDef) {
        const existingIdx = finalSensorList.findIndex(item => item.deviceKey === selectedSensorKey);
        if (existingIdx >= 0) {
          finalSensorList[existingIdx] = {
            ...finalSensorList[existingIdx],
            quantity: finalSensorList[existingIdx].quantity + parsedQty,
          };
        } else {
          finalSensorList.push({
            deviceKey: sensorDef.key,
            deviceName: sensorDef.name,
            deviceDescription: sensorDef.description,
            quantity: parsedQty,
          });
        }
      }
    }

    if (finalSensorList.length === 0) {
      addToast({
        type: 'error',
        title: 'No Sensors Added',
        message: 'Please enter a quantity or click "+ Add sensor" before creating an order.',
      });
      return;
    }

    setIsSaving(true);
    try {
      // 1. Sync CRM client requirements
      await syncClientReqs(
        selectedClientId,
        orders.filter(o => o.clientId === selectedClientId),
        finalSensorList
      );

      // 2. Format order details matching user's exact specification
      const contact = contacts.find(
        c =>
          c.companyId === selectedClientId ||
          (c.companyName && selectedCompany.name && c.companyName.toLowerCase() === selectedCompany.name.toLowerCase()) ||
          (c.name && selectedCompany.name && c.name.toLowerCase() === selectedCompany.name.toLowerCase())
      );

      const lead = leads.find(
        l =>
          (l.company && selectedCompany.name && l.company.toLowerCase() === selectedCompany.name.toLowerCase()) ||
          (l.name && selectedCompany.name && l.name.toLowerCase() === selectedCompany.name.toLowerCase()) ||
          l.convertedContactId === contact?.id
      );

      const quote = quotations.find(
        q =>
          (q.companyName && selectedCompany.name && q.companyName.toLowerCase() === selectedCompany.name.toLowerCase()) ||
          (q.contactName && selectedCompany.name && q.contactName.toLowerCase() === selectedCompany.name.toLowerCase())
      );

      const indianKeywords = [
        'india', 'tamilnadu', 'tamil nadu', 'karnataka', 'maharashtra', 'kerala',
        'andhra', 'telangana', 'gujarat', 'rajasthan', 'punjab', 'haryana',
        'uttar pradesh', 'madhya pradesh', 'bihar', 'bengal', 'odisha', 'delhi',
        'mumbai', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata'
      ];

      const rawCountry = (lead?.country || contact?.country || quote?.country || selectedCompany.country || '').trim();
      const rawLocation = (contact?.location || lead?.location || quote?.location || selectedCompany.city || '').trim();

      const combinedText = `${rawCountry} ${rawLocation}`.toLowerCase();
      const isIndia =
        rawCountry.toLowerCase() === 'india' ||
        rawCountry.toLowerCase().includes('india') ||
        indianKeywords.some(k => combinedText.includes(k));

      const totalRequired = finalSensorList.reduce((sum, item) => sum + item.quantity, 0);

      // Calculate next sequential Order ID (e.g. 1004, 1005, 1006...)
      let nextNum = 1004;
      orders.forEach(o => {
        const parsed = parseInt(o.orderNumber.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed >= nextNum) {
          nextNum = parsed + 1;
        }
      });

      const countryStr = isIndia ? 'India' : (rawCountry || 'USA');
      const locationStr = rawLocation || (isIndia ? 'India' : 'US Office');

      const contactStr = contact
        ? `${contact.name} · ${contact.phone || selectedCompany.phone || '+1 555 0100'}`
        : selectedCompany.phone
          ? `Operations · ${selectedCompany.phone}`
          : 'Operations Desk';

      const newOrder: ClientOrderRecord = {
        id: `ord_${Date.now()}`,
        orderPrefix: 'ORD-',
        orderNumber: String(nextNum),
        clientId: selectedClientId,
        clientName: selectedCompany.name,
        location: locationStr,
        country: countryStr,
        contactInfo: contactStr,
        devices: finalSensorList.map(item => ({
          deviceKey: item.deviceKey,
          deviceName: item.deviceName,
          quantity: item.quantity,
          dispatched: 0,
          inTransit: 0,
          usWarehouse: 0,
          scheduled: 0,
          installed: 0,
        })),
        totalRequired,
        dispatched: 0,
        inTransit: 0,
        usWarehouse: 0,
        scheduled: 0,
        installed: 0,
        status: 'Pending dispatch',
        createdAt: new Date().toISOString(),
      };

      await createOrder(newOrder);

      // Clear the form for the next entry
      setSensorList([]);
      setSelectedClientId('');
      setQuantityInput('');
    } catch (err: any) {
      console.error('Failed to save requirements:', err);
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err?.message || 'Could not save client requirements.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete an order from the table
  const handleDeleteOrder = async (orderId: string) => {
    const orderToDelete = orders.find(o => o.id === orderId);
    await deleteOrder(orderId);

    if (orderToDelete?.clientId) {
      await syncClientReqs(
        orderToDelete.clientId,
        orders.filter(o => o.clientId === orderToDelete.clientId && o.id !== orderId)
      );
    }
  };



  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Page Title & Back Link */}
      <div>
        <Link
          to="/operations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 px-2.5 py-1 rounded-lg shadow-2xs mb-2.5 transition-all w-fit group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:-translate-x-0.5 transition-all" />
          <span>Back to Operations</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Client Requirements
        </h1>
      </div>

      {/* Main Requirement Configuration Card */}
      <Card className="border-slate-200/90 shadow-card overflow-hidden">
        <CardBody className="p-5 sm:p-6 space-y-5">
          {/* Unified One-Row Form: Client name · Sensor · Qty · + Add sensor */}
          <form onSubmit={handleAddSensor} className="flex flex-wrap lg:flex-nowrap items-end gap-3">
            {/* Client name */}
            <div className="w-full sm:w-64 lg:w-72 shrink-0">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Client name
              </label>
              <select
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              >
                <option value="">Select client...</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.id}>
                    {comp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sensor / Device */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Sensor
              </label>
              <select
                value={selectedSensorKey}
                onChange={e => setSelectedSensorKey(e.target.value)}
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              >
                {DEVICE_DEFINITIONS.map(def => (
                  <option key={def.key} value={def.key}>
                    {def.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Qty */}
            <div className="w-24 sm:w-28 shrink-0">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Qty
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantityInput}
                onChange={e => setQuantityInput(e.target.value)}
                placeholder="Qty"
                className="w-full h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              />
            </div>

            {/* Add Sensor Button */}
            <div className="shrink-0">
              <Button
                type="submit"
                variant="outline"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                className="h-9 font-semibold text-slate-700 bg-white border-slate-300 hover:bg-slate-50"
              >
                Add sensor
              </Button>
            </div>
          </form>

          {/* Sensors Preview Table (only shown when sensors are added) */}
          {sensorList.length > 0 && (
            <div className="pt-2">
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Sensor / Device</th>
                      <th className="py-2.5 px-4 text-center">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {sensorList.map(item => (
                      <tr key={item.deviceKey} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          {item.deviceName}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.deviceKey, item.quantity - 1)}
                              className="w-6 h-6 rounded border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.deviceKey, item.quantity + 1)}
                              className="w-6 h-6 rounded border border-slate-200 bg-white hover:bg-slate-100 flex items-center justify-center text-slate-600 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveSensor(item.deviceKey)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardBody>

        {/* Card Footer: Create Order button placed on the right side */}
        <div className="bg-slate-50/60 border-t border-slate-100 p-4 sm:p-5 flex items-center justify-end rounded-b-xl">
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isSaving}
            disabled={!canCreateOrder}
            onClick={handleSaveRequirements}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 shadow-sm ml-auto"
          >
            Create Order
          </Button>
        </div>
      </Card>

      {/* ========================================================================= */}
      {/* ORDERS TABLE SECTION (Matching Reference Structure in Project CRM Style)  */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Orders
          </h2>
        </div>


        {/* Orders Table Container - Fits 100% width with no horizontal scroll */}
        <Card className="border-slate-200/90 shadow-subtle overflow-hidden w-full">
          {orders.length === 0 ? (
            <div className="py-12 px-4 text-center bg-slate-50/40">
              <p className="text-xs font-bold text-slate-700">No orders created yet.</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Pick a client, add sensors and quantities above, then click <strong>Create Order</strong> to generate your first client order.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3 sm:px-4 w-[8%]">Order ID</th>
                    <th className="py-3 px-3 sm:px-4 w-[27%]">Client</th>
                    <th className="py-3 px-3 sm:px-4 w-[25%]">Devices required</th>
                    <th className="py-3 px-3 sm:px-4 w-[10%]">Dispatched</th>
                    <th className="py-3 px-3 sm:px-4 w-[10%]">Installed</th>
                    <th className="py-3 px-3 sm:px-4 w-[20%]">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {orders.map(order => {
                    const safeTotalRequired = order.totalRequired || 0;
                    const displayDispatched = Math.min(order.dispatched || 0, safeTotalRequired);
                    const displayInstalled = Math.min(order.installed || 0, safeTotalRequired);

                    const dispatchRatio = safeTotalRequired > 0
                      ? Math.min(100, Math.round((displayDispatched / safeTotalRequired) * 100))
                      : 0;

                    const installRatio = safeTotalRequired > 0
                      ? Math.min(100, Math.round((displayInstalled / safeTotalRequired) * 100))
                      : 0;

                    const isCompleted = order.status === 'Completed';
                    const isScheduled = order.status === 'Installation scheduled';

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/60 transition-colors group">
                        {/* Order ID: ORD- on top, Number below */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="font-mono text-xs font-black text-slate-900 leading-tight">
                            <span className="block text-slate-700 text-[11px]">{order.orderPrefix}</span>
                            <span className="block text-sm font-extrabold text-slate-900">{order.orderNumber}</span>
                          </div>
                        </td>

                        {/* Client details: Name, Location, Contact · Phone */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug break-words">
                            {order.clientName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 break-words">
                            {order.location}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 break-words">
                            {order.contactInfo}
                          </div>
                        </td>

                        {/* Devices required: Plain tag pills */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="flex flex-wrap gap-1.5">
                            {order.devices.map((dev, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[11px] bg-slate-100 text-slate-800 border border-slate-200/90 rounded px-2 py-0.5 font-medium whitespace-nowrap"
                              >
                                {dev.deviceName} × {dev.quantity}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Dispatched: Ratio + Mini Progress Bar */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="text-xs font-bold text-slate-900 mb-1">
                            {displayDispatched} / {safeTotalRequired}
                          </div>
                          <div className="w-full max-w-[90px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className="h-full bg-brand-600 rounded-full transition-all duration-300"
                              style={{ width: `${dispatchRatio}%` }}
                            />
                          </div>
                        </td>

                        {/* Installed: Ratio + Mini Progress Bar */}
                        <td className="py-3.5 px-3 sm:px-4 align-top">
                          <div className="text-xs font-bold text-slate-900 mb-1">
                            {displayInstalled} / {safeTotalRequired}
                          </div>
                          <div className="w-full max-w-[90px] h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${installRatio === 100 ? 'bg-emerald-600' : 'bg-brand-500'
                                }`}
                              style={{ width: `${installRatio}%` }}
                            />
                          </div>
                        </td>

                        {/* Status: Badge with exact user status labels */}
                        <td className="py-3.5 px-3 sm:px-4 align-top whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${isCompleted
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                                  : isScheduled
                                    ? 'bg-brand-50 text-brand-700 border-brand-200/80'
                                    : 'bg-amber-50 text-amber-700 border-amber-200/80'
                                }`}
                            >
                              {order.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id)}
                              title="Delete order"
                              className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-rose-600 transition-opacity shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
