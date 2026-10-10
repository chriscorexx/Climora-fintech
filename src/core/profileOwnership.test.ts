import { describe, it, expect } from 'vitest';
import { applyProfileOwner, getVisibleProfiles, isProfileOwnedBy } from './profileOwnership';
import { buildResilienceChecks, resilienceReadinessPct } from './resilience';
import { SAMPLE_MSME_PROFILES } from './sampleData';
import { AuthUser } from './auth';
import { MSMEProfile } from '../types';

const lender: AuthUser = {
  id: 'user_lender',
  email: 'lender@climora.in',
  name: 'Lender',
  role: 'lender',
};
const owner: AuthUser = {
  id: 'user_owner',
  email: 'owner@climora.in',
  name: 'Owner',
  role: 'msme_owner',
};
const otherOwner: AuthUser = {
  id: 'user_other',
  email: 'other@climora.in',
  name: 'Other',
  role: 'msme_owner',
};

describe('Profile ownership isolation', () => {
  it('treats profiles without an owner stamp as unowned', () => {
    expect(isProfileOwnedBy(SAMPLE_MSME_PROFILES[0], owner)).toBe(false);
    expect(isProfileOwnedBy(SAMPLE_MSME_PROFILES[0], null)).toBe(false);
  });

  it('matches ownership by owner id or owner email', () => {
    const owned: MSMEProfile = {
      ...SAMPLE_MSME_PROFILES[0],
      ownerId: 'user_owner',
      ownerEmail: 'owner@climora.in',
    };
    expect(isProfileOwnedBy(owned, owner)).toBe(true);
    expect(isProfileOwnedBy({ ...owned, ownerId: undefined }, owner)).toBe(true);
    expect(isProfileOwnedBy({ ...owned, ownerId: 'user_other' }, owner)).toBe(true);
    expect(isProfileOwnedBy(owned, otherOwner)).toBe(false);
  });

  it('stamps new profiles with the current session user', () => {
    const stamped = applyProfileOwner(SAMPLE_MSME_PROFILES[0], owner);
    expect(stamped.ownerId).toBe('user_owner');
    expect(stamped.ownerEmail).toBe('owner@climora.in');
  });

  it('preserves an existing owner stamp when another user edits', () => {
    const owned: MSMEProfile = {
      ...SAMPLE_MSME_PROFILES[0],
      ownerId: 'user_owner',
      ownerEmail: 'owner@climora.in',
    };
    const reStamped = applyProfileOwner(owned, otherOwner);
    expect(reStamped.ownerId).toBe('user_owner');
    expect(reStamped.ownerEmail).toBe('owner@climora.in');
  });

  it('shows the full portfolio to lenders and only owned profiles to owners', () => {
    const mixed: MSMEProfile[] = [
      SAMPLE_MSME_PROFILES[0],
      { ...SAMPLE_MSME_PROFILES[1], ownerId: 'user_owner', ownerEmail: 'owner@climora.in' },
      { ...SAMPLE_MSME_PROFILES[2], ownerId: 'user_other', ownerEmail: 'other@climora.in' },
    ];

    expect(getVisibleProfiles(mixed, lender)).toHaveLength(3);
    expect(getVisibleProfiles(mixed, owner)).toHaveLength(1);
    expect(getVisibleProfiles(mixed, owner)[0].id).toBe(SAMPLE_MSME_PROFILES[1].id);
    expect(getVisibleProfiles(mixed, null)).toEqual([]);
  });
});

describe('Resilience readiness checklist', () => {
  it('flags met and unmet mitigation features from the operations profile', () => {
    const checks = buildResilienceChecks(SAMPLE_MSME_PROFILES[0]);
    expect(checks).toHaveLength(6);
    expect(checks.map((c) => c.id)).toEqual([
      'flood_barriers',
      'elevated_plinth',
      'backup_generator',
      'water_storage',
      'cold_storage',
      'climate_insurance',
    ]);
    expect(checks.every((c) => c.met === false)).toBe(true);
  });

  it('marks elevated plinth as met above the readiness threshold', () => {
    const resilient: MSMEProfile = {
      ...SAMPLE_MSME_PROFILES[0],
      operations: {
        ...SAMPLE_MSME_PROFILES[0].operations,
        plinthHeightMeters: 1.4,
        hasFloodBarriers: true,
        hasBackupGenerator: true,
        hasClimateInsurance: true,
      },
    };
    const checks = buildResilienceChecks(resilient);
    expect(checks.find((c) => c.id === 'elevated_plinth')?.met).toBe(true);
    expect(resilienceReadinessPct(checks)).toBe(Math.round((4 / 6) * 100));
  });

  it('computes readiness percentage defensively', () => {
    expect(resilienceReadinessPct([])).toBe(0);
  });
});
