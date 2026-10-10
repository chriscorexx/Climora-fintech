const COMMAND_CENTER_UNLOCK_KEY = 'climora_command_center_unlocked_v1';

const DEFAULT_COMMAND_CENTER_CREDENTIAL = 'climora@2026';

export function getCommandCenterPassword(): string {
  try {
    const fromEnv = import.meta.env?.VITE_COMMAND_CENTER_PASSWORD;
    if (typeof fromEnv === 'string' && fromEnv.length > 0) return fromEnv;
  } catch {
    return DEFAULT_COMMAND_CENTER_CREDENTIAL;
  }
  return DEFAULT_COMMAND_CENTER_CREDENTIAL;
}

export function verifyCommandCenterPassword(candidate: string): boolean {
  return candidate === getCommandCenterPassword();
}

export function isCommandCenterUnlocked(): boolean {
  try {
    return sessionStorage.getItem(COMMAND_CENTER_UNLOCK_KEY) === 'unlocked';
  } catch {
    return false;
  }
}

export function setCommandCenterUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) {
      sessionStorage.setItem(COMMAND_CENTER_UNLOCK_KEY, 'unlocked');
    } else {
      sessionStorage.removeItem(COMMAND_CENTER_UNLOCK_KEY);
    }
  } catch (err) {
    console.error('Failed to persist command center unlock state:', err);
  }
}
