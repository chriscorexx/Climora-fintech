import { MSMEProfile, UserRole } from '../types';
import { SAMPLE_MSME_PROFILES } from './sampleData';

const STORAGE_KEYS = {
  PROFILES: 'climora_profiles_v1',
  ACTIVE_PROFILE_ID: 'climora_active_profile_id_v1',
  USER_ROLE: 'climora_user_role_v1',
  COMPLETED_ACTIONS: 'climora_completed_actions_v1',
};

export function getStoredProfiles(): MSMEProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(SAMPLE_MSME_PROFILES));
      return SAMPLE_MSME_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_MSME_PROFILES;
  } catch {
    return SAMPLE_MSME_PROFILES;
  }
}

export function saveProfiles(profiles: MSMEProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  } catch (err) {
    console.error('Failed to save profiles to localStorage:', err);
  }
}

export function getActiveProfileId(): string {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE_ID);
    if (id) return id;
    const profiles = getStoredProfiles();
    return profiles[0]?.id || 'msme_001';
  } catch {
    return 'msme_001';
  }
}

export function setActiveProfileId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE_ID, id);
  } catch (err) {
    console.error('Failed to save active profile id:', err);
  }
}

export function getStoredRole(): UserRole {
  try {
    const role = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return role === 'msme_owner' ? 'msme_owner' : 'lender';
  } catch {
    return 'lender';
  }
}

export function saveStoredRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  } catch (err) {
    console.error('Failed to save user role:', err);
  }
}

export function getCompletedActionIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_ACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleCompletedActionId(actionId: string): string[] {
  try {
    const current = getCompletedActionIds();
    const updated = current.includes(actionId)
      ? current.filter((id) => id !== actionId)
      : [...current, actionId];
    localStorage.setItem(STORAGE_KEYS.COMPLETED_ACTIONS, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
