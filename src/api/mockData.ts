import {
  Company,
  Contact,
  Lead,
  Deal,
  Quotation,
  Task,
  Activity,
  Installation,
  InstallerScheduleItem,
  DeviceInventoryItem,
  ClientDeviceRequirement,
  DeviceStockItem,
  ClientOrderRecord,
} from '../types/crm';

// ==========================================
// 1. COMPANIES
// ==========================================
export const MOCK_COMPANIES: Company[] = [];

// ==========================================
// 2. CONTACTS
// ==========================================
export const MOCK_CONTACTS: Contact[] = [];

// ==========================================
// 3. LEADS
// ==========================================
export const MOCK_LEADS: Lead[] = [];

// ==========================================
// 4. DEALS
// ==========================================
export const MOCK_DEALS: Deal[] = [];

// ==========================================
// 5. QUOTATIONS
// ==========================================
export const MOCK_QUOTATIONS: Quotation[] = [];

// ==========================================
// 6. TASKS & REMINDERS
// ==========================================
export const MOCK_TASKS: Task[] = [];

// ==========================================
// 7. ACTIVITIES & TIMELINE
// ==========================================
export const MOCK_ACTIVITIES: Activity[] = [];

// ==========================================
// 8. TECHNICIANS
// ==========================================
export const DEFAULT_TECHNICIANS: string[] = [];

// ==========================================
// 9. DEVICE DEFINITIONS & TYPES
// Standard device hardware catalog models supported by the platform
// ==========================================
export interface DeviceDefinition {
  key: string;
  name: string;
  description: string;
  defaultIndiaStock: number;
}

export const DEVICE_DEFINITIONS: DeviceDefinition[] = [
  {
    key: 'Wetness',
    name: 'Wetness',
    description: 'High-precision moisture & floor wetness sensor',
    defaultIndiaStock: 0,
  },
  {
    key: 'AirQuality',
    name: 'AirQuality',
    description: 'IAQ & VOC ambient air quality detector',
    defaultIndiaStock: 0,
  },
  {
    key: 'Traffic',
    name: 'Traffic',
    description: 'Infrared patron traffic & footfall counter',
    defaultIndiaStock: 0,
  },
  {
    key: 'Trash',
    name: 'Trash',
    description: 'Ultrasonic waste receptacle fill-level monitor',
    defaultIndiaStock: 0,
  },
  {
    key: 'PaperTowel',
    name: 'PaperTowel',
    description: 'Laser optical paper towel dispenser gauge',
    defaultIndiaStock: 0,
  },
  {
    key: 'ToiletPaper',
    name: 'ToiletPaper',
    description: 'Rotary roll usage & run-out monitor',
    defaultIndiaStock: 0,
  },
  {
    key: 'Soap',
    name: 'Soap',
    description: 'Infrared liquid soap level & pump sensor',
    defaultIndiaStock: 0,
  },
  {
    key: 'Stall',
    name: 'Stall',
    description: 'Magnetic door & occupancy privacy sensor',
    defaultIndiaStock: 0,
  },
  {
    key: 'Janitor Tag',
    name: 'Janitor Tag',
    description: 'NFC/BLE custodial staff attendance beacon',
    defaultIndiaStock: 0,
  },
  {
    key: 'Feedback',
    name: 'Feedback',
    description: 'Digital 4-button patron satisfaction console',
    defaultIndiaStock: 0,
  },
  {
    key: 'OccupancyDisplay',
    name: 'OccupancyDisplay',
    description: 'E-Ink LED restroom bay availability sign',
    defaultIndiaStock: 0,
  },
  {
    key: 'Gateway',
    name: 'Gateway',
    description: 'LoRaWAN & Cellular industrial IoT edge gateway',
    defaultIndiaStock: 0,
  },
];

// ==========================================
// 10. DEVICE STOCK (Clean initial 0 stock across all devices)
// ==========================================
export const MOCK_DEVICE_STOCK: DeviceStockItem[] = DEVICE_DEFINITIONS.map(def => ({
  id: `stock_${def.key}`,
  deviceKey: def.key,
  deviceName: def.name,
  deviceDescription: def.description,
  usWarehouse: 0,
  indiaProduction: 0,
  updatedAt: new Date().toISOString(),
}));

// ==========================================
// 11. DEVICE INVENTORY (Clean initial inventory items)
// ==========================================
export const MOCK_DEVICE_INVENTORY: DeviceInventoryItem[] = DEVICE_DEFINITIONS.map(def => ({
  id: `dev_inv_${def.key}`,
  deviceName: def.name,
  category: def.key === 'Gateway' ? 'Gateways' : def.key === 'OccupancyDisplay' || def.key === 'Feedback' ? 'Displays & Consoles' : 'Sensors',
  requiredQty: 0,
  availableQty: 0,
  allocatedQty: 0,
  unit: 'units',
  sku: `ZC-${def.key.toUpperCase().replace(/\s+/g, '')}-V2`,
  updatedAt: new Date().toISOString().split('T')[0],
}));

// ==========================================
// 12. CLIENT REQUIREMENTS
// ==========================================
export const MOCK_CLIENT_REQUIREMENTS: Record<string, ClientDeviceRequirement[]> = {};

// ==========================================
// 13. CLIENT ORDERS
// ==========================================
export const MOCK_ORDERS: ClientOrderRecord[] = [];

// ==========================================
// 14. INSTALLATIONS
// ==========================================
export const MOCK_INSTALLATIONS: Installation[] = [];

// ==========================================
// 15. INSTALLER SCHEDULES
// ==========================================
export const MOCK_INSTALLER_SCHEDULES: InstallerScheduleItem[] = [];
