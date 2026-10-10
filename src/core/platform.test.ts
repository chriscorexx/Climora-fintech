import { describe, it, expect, afterEach, vi } from 'vitest';
import { isDesktopApp, isElectronApp } from './platform';

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const ELECTRON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Climora/1.0.0 Chrome/131.0.0.0 Electron/44.7.0 Safari/537.36';

describe('isElectronApp', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the injected user agent contains Electron', () => {
    expect(isElectronApp(ELECTRON_UA, {})).toBe(true);
  });

  it('returns false for a regular browser user agent without the preload global', () => {
    expect(isElectronApp(BROWSER_UA, {})).toBe(false);
  });

  it('returns true when the preload global exists even with a browser user agent', () => {
    expect(isElectronApp(BROWSER_UA, { climora: { platform: 'win32', version: '1.0.0' } })).toBe(
      true,
    );
  });

  it('reads the live navigator user agent when no argument is injected', () => {
    const originalUA = navigator.userAgent;
    Object.defineProperty(navigator, 'userAgent', {
      value: ELECTRON_UA,
      configurable: true,
    });
    try {
      expect(isElectronApp(undefined, {})).toBe(true);
    } finally {
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUA,
        configurable: true,
      });
    }
  });

  it('returns false in non-browser environments without the preload global', () => {
    vi.stubGlobal('window', undefined);
    expect(isElectronApp('', null)).toBe(false);
    expect(isElectronApp(undefined, undefined)).toBe(false);
  });

  it('never throws when globals are hostile', () => {
    expect(() => isElectronApp(undefined, null)).not.toThrow();
    const hostileScope = new Proxy(
      {},
      {
        has() {
          throw new Error('blocked');
        },
      },
    ) as unknown as Record<string, unknown>;
    expect(isElectronApp(BROWSER_UA, hostileScope)).toBe(false);
  });

  it('exposes an isDesktopApp alias with identical behaviour', () => {
    expect(isDesktopApp(ELECTRON_UA, {})).toBe(true);
    expect(isDesktopApp(BROWSER_UA, {})).toBe(false);
    expect(isDesktopApp(BROWSER_UA, { climora: { platform: 'linux' } })).toBe(true);
  });
});
