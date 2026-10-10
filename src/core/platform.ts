export function isElectronApp(
  userAgent?: string,
  globalScope?: Record<string, unknown> | null,
): boolean {
  try {
    const ua =
      typeof userAgent === 'string'
        ? userAgent
        : typeof window !== 'undefined' && typeof navigator !== 'undefined'
          ? navigator.userAgent
          : '';

    if (ua && /Electron/i.test(ua)) {
      return true;
    }

    if (globalScope) {
      return 'climora' in globalScope;
    }

    return typeof window !== 'undefined' && 'climora' in window;
  } catch {
    return false;
  }
}

export function isDesktopApp(
  userAgent?: string,
  globalScope?: Record<string, unknown> | null,
): boolean {
  return isElectronApp(userAgent, globalScope);
}
