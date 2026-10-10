import { MSMEProfile } from '../types';
import { AuthUser } from './auth';

export function isProfileOwnedBy(profile: MSMEProfile, user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  const ownerId = profile.ownerId;
  const ownerEmail = profile.ownerEmail;
  if (ownerId && ownerId === user.id) return true;
  if (ownerEmail && ownerEmail.toLowerCase() === user.email.toLowerCase()) return true;
  return false;
}

export function applyProfileOwner(profile: MSMEProfile, user: AuthUser): MSMEProfile {
  return {
    ...profile,
    ownerId: profile.ownerId ?? user.id,
    ownerEmail: profile.ownerEmail ?? user.email,
  };
}

export function getVisibleProfiles(
  profiles: MSMEProfile[],
  user: AuthUser | null | undefined,
): MSMEProfile[] {
  if (!user) return [];
  if (user.role === 'lender') return profiles;
  return profiles.filter((profile) => isProfileOwnedBy(profile, user));
}
