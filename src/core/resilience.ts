import { MSMEProfile } from '../types';
import { normalizeProfile } from './profileUtils';

export interface ResilienceCheck {
  id: string;
  label: string;
  met: boolean;
  detail: string;
}

export const PLINTH_READY_METERS = 1.0;

export function buildResilienceChecks(profile: MSMEProfile): ResilienceCheck[] {
  const safe = normalizeProfile(profile);
  const ops = safe.operations;
  return [
    {
      id: 'flood_barriers',
      label: 'Flood Barriers',
      met: ops.hasFloodBarriers,
      detail: ops.hasFloodBarriers
        ? 'Removable barriers installed at entry points'
        : 'No barriers — direct water ingress risk',
    },
    {
      id: 'elevated_plinth',
      label: 'Elevated Plinth',
      met: ops.plinthHeightMeters >= PLINTH_READY_METERS,
      detail: `Current plinth ${ops.plinthHeightMeters.toFixed(1)}m (target ≥ ${PLINTH_READY_METERS.toFixed(1)}m)`,
    },
    {
      id: 'backup_generator',
      label: 'Backup Generator',
      met: ops.hasBackupGenerator,
      detail: ops.hasBackupGenerator
        ? 'Captive power available during grid outages'
        : 'Grid-only power — brownout exposure',
    },
    {
      id: 'water_storage',
      label: 'Water Storage',
      met: ops.hasWaterStorageRainwater,
      detail: ops.hasWaterStorageRainwater
        ? 'Rainwater harvesting / on-site storage buffer'
        : 'No storage buffer for supply shortages',
    },
    {
      id: 'cold_storage',
      label: 'Cold Storage',
      met: ops.hasColdStorage,
      detail: ops.hasColdStorage
        ? 'Refrigerated storage protects perishables'
        : ops.perishableInventory
          ? 'Perishable inventory without cold storage'
          : 'Not critical for this industry profile',
    },
    {
      id: 'climate_insurance',
      label: 'Climate Insurance',
      met: ops.hasClimateInsurance,
      detail: ops.hasClimateInsurance
        ? 'Parametric / property cover cushions asset loss'
        : 'No external loss recovery mechanism',
    },
  ];
}

export function resilienceReadinessPct(checks: ResilienceCheck[]): number {
  if (checks.length === 0) return 0;
  const met = checks.filter((check) => check.met).length;
  return Math.round((met / checks.length) * 100);
}
