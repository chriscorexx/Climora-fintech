# Building Climora Desktop Binaries

Climora ships as a web app **and** a desktop app (Electron). This document explains how to produce
installer binaries for **Windows**, **Linux**, and **macOS** from this repository.

## How the two runtimes relate

| Runtime                      | Entry                          | Notes                                                                                                                                                                                             |
| ---------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web (Vite dev / static host) | `npm run dev:client` / `dist/` | Shows the public **landing page** before login.                                                                                                                                                   |
| Desktop (Electron)           | `electron/main.cjs`            | Loads `dist/index.html` from disk (`file://`) in production and skips the landing page entirely — the Electron renderer is detected via its user agent / preload bridge (`src/core/platform.ts`). |

`vite.config.ts` sets `base: './'` so all built asset URLs are relative — this is required for the
Electron `file://` loader to work. Do not change it back to `/`.

## Prerequisites

- Node.js 18+ (built and verified with Node 26) and npm
- All dependencies installed (`npm install`)
- **Icons** are generated into `build/icons/` (checked into git):
  - `icon.png` (512×512), `icon.ico` (16–256 multi-resolution, Windows), `icon.icns` (16–1024, macOS), `linux/` (Linux set)
  - Source: `src/assets/Climora-logo.jpg`

## Build commands

```bash
# 1. Build the web bundle (always required first — the desktop app loads dist/)
npm run build                # tsc && vite build

# 2. Package for the current platform
npm run package              # = npm run build && electron-builder
npm run dist:linux           # electron-builder --linux   → AppImage + deb (x64)
npm run dist:win             # electron-builder --win     → NSIS installer (x64)
npm run dist:mac             # electron-builder --mac      → dmg (x64 + arm64)
npm run dist:all             # all three platforms
```

Artifacts are written to **`release/`** (gitignored):

```
release/
  Climora-1.0.0.AppImage          # Linux portable app
  climora_1.0.0_amd64.deb         # Debian/Ubuntu package
  Climora Setup 1.0.0.exe         # Windows NSIS installer (on Windows/wine/CI)
  Climora-1.0.0.dmg               # macOS disk image (on macOS)
  linux-unpacked/, win-unpacked/, mac/   # unpacked payloads
```

## Platform requirements matrix

| Host OS                           | Linux binaries               | Windows binaries              | macOS binaries   |
| --------------------------------- | ---------------------------- | ----------------------------- | ---------------- |
| Linux (this repo's verified path) | ✅ verified (AppImage + deb) | ✅ verified via `wine` (NSIS) | ❌ not supported |
| Windows                           | ✅ (with WSL/docker caveats) | ✅                            | ❌               |
| macOS                             | ✅                           | ⚠️ needs `wine` or CI         | ✅ (x64 + arm64) |

- **macOS builds require a macOS host** — there is no reliable cross-compilation path for signed
  `.dmg` output. Use a Mac, or push a `v*` tag / run `.github/workflows/release.yml` on GitHub
  Actions (`macos-latest`), which builds all three platforms and publishes a draft release.
- **Windows builds** run natively on Windows; on Linux they were verified with `wine` installed
  (`/usr/bin/wine`), producing `release/Climora Setup 1.0.0.exe`.
- Code signing is intentionally **disabled** (hackathon build). macOS users may need to right-click →
  Open the first time; Windows SmartScreen will show an "unknown publisher" warning.

## Verified on this machine (Linux x64)

- `npx electron-builder --linux` → `release/Climora-1.0.0.AppImage` (121 MB), `release/climora_1.0.0_amd64.deb` (96 MB)
- `npx electron-builder --win` (via `wine`) → `release/Climora Setup 1.0.0.exe` (107 MB)
- Headless smoke test (`xvfb-run -a release/Climora-1.0.0.AppImage --no-sandbox`): app launches and
  stays running with no crash; `app.asar` contains `dist/index.html`, `dist/assets/*`, `electron/*`, and `package.json`.
- The desktop app opens directly on the login screen (landing page is browser-only, by design).

## Configuration reference (package.json `build` field)

| Field                   | Purpose                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `appId` / `productName` | `com.climora.app` / `Climora`                                                                                                           |
| `directories.output`    | `release/` (keeps Vite's `dist/` clean)                                                                                                 |
| `files`                 | `dist/**`, `electron/**/*`, `public/**`, `package.json`; `node_modules/**` excluded (Vite bundles all renderer deps into `dist/assets`) |
| `win.target`            | NSIS installer (per-user, changeable install dir)                                                                                       |
| `linux.target`          | AppImage + deb, x64, category Office                                                                                                    |
| `mac.target`            | dmg for x64 + arm64                                                                                                                     |
| `asar` / `compression`  | packed archive, normal compression                                                                                                      |

## Troubleshooting

- **Blank window on Linux**: install the usual Electron runtime deps, e.g. on Debian/Ubuntu
  `libnss3 libatk-bridge2.0-0 libgtk-3-0 libgbm1 libasound2` (or use the AppImage with `--no-sandbox`,
  which `main.cjs` already applies in-process via `--no-sandbox`/`disable-gpu-sandbox` switches).
- **Assets missing in packaged app**: confirm `dist/` was rebuilt before packaging (`npm run package`
  does this automatically) and that `vite.config.ts` still has `base: './'`.
- **Login page shown in desktop build**: expected. The landing page intentionally renders only in
  browsers (`src/core/platform.ts` → `isElectronApp()`); desktop users go straight to login.
- **Windows build fails on Linux with wine errors**: build on Windows or in CI
  (`runs-on: windows-latest` + `npm run dist:win`).
- **Large binaries (~100 MB)**: expected for Electron; `compression: "maximum"` and excluding
  `node_modules` (already done) keep it as small as practical.

## CI hint (GitHub Actions matrix)

```yaml
strategy:
  matrix:
    os: [windows-latest, ubuntu-latest, macos-latest]
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with: { node-version: 20 }
  - run: npm ci
  - run: npm run dist:${{ matrix.os == 'windows-latest' && 'win' || matrix.os == 'ubuntu-latest' && 'linux' || 'mac' }}
  - uses: actions/upload-artifact@v4
    with:
      name: climora-${{ matrix.os }}
      path: release/*
```
