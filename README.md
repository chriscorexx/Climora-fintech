# Climora — Climate-Adjusted Risk Scoring for MSMEs

**Climate Intelligence. Smarter Credit Decisions.**

🔗 **Live web app: [https://climora-fintech.vercel.app](https://climora-fintech.vercel.app)**

Climora is a real-time climate-adjusted financial risk platform built for the **FUSION 2026 Hackathon (FIN-05, International Finance Corporation challenge)**. It helps lenders assess how physical climate hazards (flooding, heavy rainfall, extreme heat) impact Micro, Small, and Medium Enterprises (MSMEs), while giving business owners clear roadmaps and government scheme matches to build climate resilience.

It runs as a **web app** (hosted on Vercel) and as a **cross-platform desktop app** (Windows / macOS / Linux — see [Releases](https://github.com/chriscorexx/Climora-fintech/releases)).

---

## 1. Core Problem & Solution

- **The Problem:** Credit officers typically evaluate MSMEs using backward-looking financial statements alone. Two enterprises with identical balance sheets may look equally creditworthy, yet one operates in a severe flood basin or heatwave zone vulnerable to immediate inventory wipeouts or operating disruptions.
- **The Solution:** Climora combines location-based environmental data from Open-Meteo, regional flood benchmarks, and business operational profiles to produce an **explainable 0–100 climate risk score** and a **cashflow stress-testing simulator (DSCR impact)**.

---

## 2. Current Status

**Complete and verified** — typecheck clean, lint clean, **89/89 tests passing**, production build succeeds, desktop binaries published.

| Area                   | Status                                                                                             |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| Web app + landing page | Done — browser-only landing, login/register, role-isolated workspaces                              |
| Desktop app            | Done — Windows / macOS (Intel + Apple Silicon) / Linux binaries on Releases                        |
| Risk engine            | Done — 5 dimensions, dynamic reweighting, explainability, data-gap reporting                       |
| Stress simulator       | Done — hazard scenarios, baseline vs stressed DSCR, recovery time, runway                          |
| Scheme matching        | Done — verified government schemes with match scores, eligibility, documents                       |
| Theming                | Done — Light / Dark / System; dark theme is pure black + neutral greys (zero blue)                 |
| Motion                 | Done — CSS animation system throughout, respects `prefers-reduced-motion`                          |
| Data                   | Live Open-Meteo integration with offline baseline fallback and provenance badges                   |
| Auth                   | Demo-grade client-side auth (register/login, per-owner data scoping) — **not production-hardened** |
| Backend                | Optional Express + SQLite service for shared persistence                                           |

---

## 3. Architecture & Technology Stack

100% TypeScript:

| Layer                   | Technology                       | Role                                                                             |
| ----------------------- | -------------------------------- | -------------------------------------------------------------------------------- |
| **Frontend UI**         | React 18 + Vite + TypeScript     | Landing page, auth, dual workspaces, Command Center                              |
| **Styling & System**    | Tailwind CSS + Lucide Icons      | `fin-*` design tokens, light/dark theming, tabular financial typography          |
| **Animations**          | CSS keyframes + Tailwind         | Entrance/stagger/hover/shimmer motion, reduced-motion aware                      |
| **Data Visualizations** | Recharts + SVG gauges            | 7-day forecast, score-history trend, multi-dimension breakdown, risk gauge       |
| **Hazard Maps**         | Leaflet + OpenStreetMap          | Location context with theme-matched tiles                                        |
| **Domain Logic**        | Pure TypeScript (`src/core/`)    | Risk engine, climate-to-cashflow simulator, scheme matcher, auth, portfolio math |
| **Data Ingestion**      | Open-Meteo APIs                  | Real-time weather, flood simulation, geocoding with offline baseline fallback    |
| **Desktop Shell**       | Electron                         | Cross-platform desktop app via the same build                                    |
| **Backend (optional)**  | Express + SQLite (`node:sqlite`) | Shared persistence for profiles/assessments                                      |
| **Packaging**           | electron-builder                 | Windows NSIS, Linux AppImage/deb, macOS dmg (x64 + arm64)                        |

---

## 4. Features

### Access model

- **Landing page (web only)** — product overview, features, desktop downloads; the desktop app skips it by design (Electron is detected via user agent + preload bridge).
- **Login / Register** — accounts stored locally with salted SHA-256 password hashes (Web Crypto). No plaintext passwords, no demo accounts seeded.
- **Role isolation** — MSME Owners see only their own enterprise profiles; Lenders see the full portfolio. The workspaces are strictly separated after login.

### Lender workspace

- Underwriting pipeline table with risk filter + search, CSV export
- **Portfolio risk table** — per-profile scored assessment across the whole book
- District hazard baseline panel (flood / cyclone / drought)
- Cashflow stress simulator (hazard scenarios → DSCR, runway, recovery time)
- One-click print/PDF **credit memo**
- Weather-threshold alert strip

### MSME Owner workspace

- Enterprise profile manager with live geocoding
- Live environmental telemetry + 7-day hazard forecast
- **Resilience readiness checklist** over operational dependencies
- Matched government schemes with **match scores**, eligibility criteria and required documents
- Loan improvement roadmap with progress tracking

### Command Center (password-protected)

- KPI row, risk gauge with animated needle, 5-dimension breakdown
- Live telemetry, district hazard baseline, score-history trend chart
- Stress simulator, matched schemes, resilience checklist, location map
- Default password `climora@2026` — override at build time with `VITE_COMMAND_CENTER_PASSWORD`; unlock lasts for the browser session. See `COMMAND_CENTER.md`.

### Platform

- Light / Dark / System appearance modes; dark theme is pure black + neutral greys with semantic accents only (no blue family)
- Motion system with `prefers-reduced-motion` support
- Mobile-responsive layouts; print-ready memo pagination
- Live vs fallback **provenance badges** on every climate indicator

---

## 5. Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (built and verified with Node 26)
- npm

### Run the web app

```bash
git clone https://github.com/chriscorexx/Climora-fintech.git
cd Climora-fintech
npm install
npm run dev:web        # API server + Vite dev server
```

Open http://localhost:5173 — you'll see the landing page, then register an account (Lender or MSME Owner).

### Run the desktop app

```bash
npm run dev            # server + web + Electron (dev)
npm run desktop        # Electron only
```

### Optional backend persistence

```bash
npm run server         # Express + SQLite on :5000
```

The client automatically uses the API when healthy and falls back to local-only operation when it
isn't — the web app works without it.

---

## 6. Scripts

| Script                                                      | Purpose                                       |
| ----------------------------------------------------------- | --------------------------------------------- |
| `npm run dev` / `dev:web` / `dev:client` / `dev:server`     | Development (all / web / client / API server) |
| `npm run desktop`                                           | Electron shell in dev                         |
| `npm run build`                                             | Typecheck + production build → `dist/`        |
| `npm run build:website`                                     | Build + copy the hosted site into `website/`  |
| `npm run dist:win` / `dist:linux` / `dist:mac` / `dist:all` | Desktop binaries → `release/`                 |
| `npm run package`                                           | Build + package for the current platform      |
| `npm test`                                                  | Vitest unit + jsdom UI suite (89 tests)       |
| `npm run lint` / `npm run format` / `format:check`          | ESLint / Prettier                             |

---

## 7. Deployment

### Hosted website (Vercel — live)

The production web app is hosted on Vercel: **<https://climora-fintech.vercel.app>**

Deploys come straight from the `main` branch with **zero manual settings** — the repo ships
`vercel.json` (build command, `dist` output, SPA rewrite, immutable asset caching). See
**`DEPLOY_VERCEL.md`** for the full guide. Summary: import the repo → Vercel detects Vite → Deploy;
every push to `main` redeploys automatically and PRs get preview URLs. Set
`VITE_COMMAND_CENTER_PASSWORD` as an environment variable if you want a custom Command Center
password (inlined at build time).

### Hosted website (Render)

See **`DEPLOY_RENDER.md`** for the Render Static Site guide (build command `npm ci && npm run build`,
publish directory `dist`, SPA rewrite `/*` → `/index.html`). A ready-to-use `render.yaml` Blueprint
is included. The prebuilt static site is also kept in `website/` for drag-and-drop/static hosting
(`npm run build:website` regenerates it).

### Desktop binaries

Prebuilt installers for all platforms are attached to GitHub Releases
([latest: v1.0.1](https://github.com/chriscorexx/Climora-fintech/releases/tag/v1.0.1)):
Windows `.exe`, macOS `.dmg` (Intel + Apple Silicon), Linux `.AppImage` + `.deb`.
Build locally with `npm run dist:all` (macOS requires a macOS host) — see **`BUILDING.md`**.

---

## 8. External APIs & Data Sources

- **Open-Meteo Forecast API** — real-time precipitation, temperature extremes, wind speeds (free, CC BY 4.0, no key).
- **Open-Meteo Flood API** — river discharge anomalies (GloFAS simulation).
- **Open-Meteo Geocoding API** — city/postal code → coordinates.
- **District flood baselines** — calibrated regional hazard benchmarks used when live data is unavailable.
- **Government subsidy registry** — Central & State MSME schemes with eligibility criteria and official portal links.

All Open-Meteo data is used under CC BY 4.0 and attributed in-app.

---

## 9. Project Structure

```
climora/
├── src/
│   ├── core/           # Pure domain engines: riskEngine, scenarioSimulator, schemeMatcher,
│   │                   # weatherService, auth, portfolio, profileOwnership, format, csv,
│   │                   # scoreHistory, theme, commandCenter, platform
│   ├── components/
│   │   ├── landing/    # Public landing page (web-only)
│   │   ├── auth/       # Login, Register, password gate, shared auth UI
│   │   ├── lender/     # Lender workspace
│   │   ├── owner/      # MSME Owner workspace + profile editor
│   │   ├── dashboard/  # Command Center
│   │   ├── report/     # Credit memo modal
│   │   ├── common/     # Gauges, cards, badges, skeleton, resilience, map, alerts
│   │   └── navigation/ # TopBar (user menu, theme switcher, alerts)
│   ├── types/          # TypeScript domain models
│   ├── App.tsx         # Shell: auth gate, view routing, workspace scoping
│   └── main.tsx        # Entry point
├── server/             # Optional Express + SQLite API (persistence)
├── electron/           # Desktop shell (main + preload)
├── public/             # Static assets (logo)
├── website/            # Production static build of the web app (deployable as-is)
├── tests/              # Vitest jsdom UI harness + integration tests
├── scripts/            # Dev helpers (electron launcher)
├── build/icons/        # App icons for all platforms
├── .github/workflows/  # Release CI (linux/win/mac matrix)
├── *_SPEC.md / *.md    # Domain docs (risk scoring, data sources, scope, access, command center)
├── BUILDING.md         # Desktop binary build guide
├── DEPLOY_VERCEL.md    # Web deployment guide (Vercel)
├── DEPLOY_RENDER.md    # Web deployment guide (Render)
├── render.yaml         # Render Blueprint
├── vercel.json         # Vercel project configuration
└── package.json
```

---

## 10. Documentation Index

| Document                                                                                  | Contents                                                                |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `DEPLOY_RENDER.md`                                                                        | Manual web deployment on Render (static site, env vars, SPA rewrites)   |
| `DEPLOY_VERCEL.md`                                                                        | Manual web deployment on Vercel (import, env vars, SPA rewrites)        |
| `BUILDING.md`                                                                             | Desktop binaries: commands, platform matrix, icons, CI, troubleshooting |
| `ACCESS.md`                                                                               | Auth model, role isolation, Command Center password, security caveats   |
| `COMMAND_CENTER.md`                                                                       | Command Center access + section-by-section walkthrough                  |
| `RISK_SCORING.md`                                                                         | 5-dimension model, weights, reweighting, categories                     |
| `DATA_SOURCES.md`                                                                         | Open-Meteo APIs, fallbacks, provenance, licensing                       |
| `TECH_STACK.md`                                                                           | Technology decisions                                                    |
| `MVP_SCOPE.md` / `ApplicationFunctions.md` / `ProblemStatement.md` / `ProjectOverview.md` | Product scope and function specs                                        |

---

## 11. Quality & Verification

- `npx tsc --noEmit` — clean
- `npm run lint` (`eslint src tests --max-warnings=0`) — clean
- `npm test` — **89/89 passing** (domain engines, auth, portfolio, formatting, CSV, jsdom UI + auth-flow tests)
- `npm run build` — production build succeeds
- Linux AppImage smoke-tested headless; desktop release matrix green in CI

---

## 12. Responsible Use & Disclaimer

Climora is a hackathon prototype developed for IFC challenge FIN-05. Its risk scores, scoring
weights, and cashflow stress simulations are illustrative heuristics designed for decision support
and climate preparedness. They do not constitute official credit ratings or automated credit
approval/rejection decisions, and human review is required.

Authentication in the hosted/static deployment is **demo-grade client-side authentication** for the
hackathon (accounts and hashes live in the browser's `localStorage`); it is not a substitute for a
production identity provider. See `ACCESS.md` for details.
