import { MSMEProfile, UserRole } from '../types';
import { THEME_STORAGE_KEY, type ThemeMode } from './theme';
import { SAMPLE_MSME_PROFILES } from './sampleData';
import { normalizeProfile } from './profileUtils';

const STORAGE_KEYS = {
  PROFILES: 'climora_profiles_v1',
  ACTIVE_PROFILE_ID: 'climora_active_profile_id_v1',
  USER_ROLE: 'climora_user_role_v1',
  COMPLETED_ACTIONS: 'climora_completed_actions_v1',
  UI_MODE: THEME_STORAGE_KEY,
};

export function getStoredProfiles(): MSMEProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (!raw) {
      const initial = SAMPLE_MSME_PROFILES.map(normalizeProfile);
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map(normalizeProfile);
    }
    return SAMPLE_MSME_PROFILES.map(normalizeProfile);
  } catch {
    return SAMPLE_MSME_PROFILES.map(normalizeProfile);
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

export function getStoredThemeMode(): ThemeMode {
  try {
    const mode = localStorage.getItem(STORAGE_KEYS.UI_MODE);
    return mode === 'light' || mode === 'dark' || mode === 'system' ? mode : 'system';
  } catch {
    return 'system';
  }
}

export function saveStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEYS.UI_MODE, mode);
  } catch (err) {
    console.error('Failed to save UI mode to localStorage:', err);
  }
}
