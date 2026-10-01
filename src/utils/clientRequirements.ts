/**
 * Utility functions for Client Device Requirements calculations,
 * country formatting, and shipping directions.
 */

export function getCountryCode(country: string): string {
  if (!country) return 'US';
  const clean = country.toLowerCase().trim();
  const map: Record<string, string> = {
    'united states': 'US',
    'united states of america': 'US',
    'usa': 'US',
    'us': 'US',
    'switzerland': 'CH',
    'germany': 'DE',
    'deutschland': 'DE',
    'singapore': 'SG',
    'united kingdom': 'UK',
    'uk': 'UK',
    'great britain': 'UK',
    'india': 'IN',
    'canada': 'CA',
    'australia': 'AU',
    'france': 'FR',
    'japan': 'JP',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'dubai': 'AE',
    'netherlands': 'NL',
  };
  return map[clean] || country.toUpperCase().slice(0, 2);
}

export function formatClientLocation(city?: string, country?: string): string {
  const parts: string[] = [];
  if (city && city.trim()) parts.push(city.trim());
  if (country && country.trim()) {
    parts.push(getCountryCode(country));
  }
  return parts.length > 0 ? parts.join(', ') : 'Location not set';
}

export function getShippingDirection(country?: string): string {
  if (!country) return 'Ships: India → US';
  const code = getCountryCode(country);
  if (code === 'IN') {
    return 'Ships: Domestic (India)';
  }
  return `Ships: India → ${code}`;
}

export function calculateStillNeeded(required: number, installed: number): number {
  const req = Number(required) || 0;
  const inst = Number(installed) || 0;
  return Math.max(req - inst, 0);
}

export function canSupplyDevice(indiaStock: number, stillNeeded: number): boolean {
  const stock = Number(indiaStock) || 0;
  const needed = Number(stillNeeded) || 0;
  return stock >= needed;
}

export function calculateInstallationProgress(installed: number, required: number): number {
  const req = Number(required) || 0;
  const inst = Number(installed) || 0;
  if (req <= 0) {
    return inst > 0 ? 100 : 0;
  }
  if (inst >= req) {
    return 100;
  }
  return Math.min(100, Math.round((inst / req) * 100));
}

export function calculateTotalClientsStillNeeded(
  deviceKey: string,
  clientRequirementsMap: Record<string, import('../types/crm').ClientDeviceRequirement[]>
): number {
  if (!clientRequirementsMap) return 0;
  let total = 0;
  for (const clientId in clientRequirementsMap) {
    const list = clientRequirementsMap[clientId];
    if (Array.isArray(list)) {
      const match = list.find(r => r.deviceKey === deviceKey);
      if (match) {
        total += calculateStillNeeded(match.required, match.installed);
      }
    }
  }
  return total;
}

export function calculateInventoryTotal(usWarehouse: number, indiaProduction: number): number {
  return (Number(usWarehouse) || 0) + (Number(indiaProduction) || 0);
}

export function calculateInventoryStatus(
  total: number,
  clientsStillNeed: number
): 'Healthy' | 'Produce more' {
  return total >= clientsStillNeed ? 'Healthy' : 'Produce more';
}

