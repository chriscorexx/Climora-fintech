# Climora — Climate-Adjusted Risk Scoring for MSMEs

**Climate Intelligence. Smarter Credit Decisions.**

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE.md)
[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen.svg?style=flat-square)](https://climora-fintech.vercel.app)
[![Release](https://img.shields.io/github/v/release/chriscorexx/Climora-fintech.svg?style=flat-square)](https://github.com/chriscorexx/Climora-fintech/releases)
[![Build Desktop Binaries](https://img.shields.io/github/actions/workflow/status/chriscorexx/Climora-fintech/release.yml?label=release%20build&style=flat-square)](https://github.com/chriscorexx/Climora-fintech/actions)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](CONTRIBUTING.md)

Climora is a real-time climate-adjusted financial risk platform built for the **FUSION 2026
Hackathon (FIN-05, International Finance Corporation challenge)**. It helps lenders assess how
physical climate hazards — flooding, heavy rainfall, extreme heat — impact Micro, Small, and
Medium Enterprises (MSMEs), while giving business owners clear roadmaps and government scheme
matches to build climate resilience.

**Try it:** [climora-fintech.vercel.app](https://climora-fintech.vercel.app) ·
**Watch the demo:** [docs/demo-video.mp4](docs/demo-video.mp4)

It runs as a web app (hosted on Vercel) and as a cross-platform desktop app for Windows, macOS,
and Linux — see [Releases](https://github.com/chriscorexx/Climora-fintech/releases).

---

## The problem

Credit officers typically evaluate MSMEs using backward-looking financial statements alone. Two
enterprises with identical balance sheets may look equally creditworthy, yet one operates in a
severe flood basin or heatwave zone and is vulnerable to immediate inventory wipeouts or operating
disruption.

Climora combines location-based environmental data from Open-Meteo, regional flood benchmarks, and
business operational profiles to produce an **explainable 0–100 climate risk score** and a
**cashflow stress-testing simulator (DSCR impact)** — with provenance shown on every input.

---

## Features

### Access and isolation

- Public landing page (web browsers only — the desktop app skips it by design)
- Register and sign in with per-user accounts (salted SHA-256 password hashes, no demo accounts)
- Strict role isolation: MSME Owners see only their own enterprise profiles; Lenders see the full
  portfolio; the two workspaces are never cross-accessible

### Lender workspace

- Underwriting pipeline table with risk filtering and CSV export
- Portfolio-wide risk table scoring every profile, not just the active one
- District hazard baselines (flood, cyclone, drought)
- Cashflow stress simulator — hazard scenarios against baseline versus stressed DSCR
- One-click print and PDF credit memo
- Weather-threshold alert strip

### MSME Owner workspace

- Enterprise profile manager with live geocoding
- Live environmental telemetry and a 7-day hazard forecast
- Resilience readiness checklist across operational dependencies
- Matched government schemes with explicit match scores, eligibility criteria, and documents
- Loan improvement roadmap with progress tracking

### Command Center (password-gated)

- KPI row, animated risk gauge, and five-dimension risk breakdown
- Live telemetry, district baselines, and a score-history trend chart
- Stress simulator, matched schemes, readiness checklist, and a location map
- Default password `climora@2026`, overridable with `VITE_COMMAND_CENTER_PASSWORD`

### Platform

- Light / Dark / System appearance modes; the dark theme is pure black and neutral greys with
  semantic accents only (no blue family)
- Motion system across the app that respects `prefers-reduced-motion`
- Mobile-responsive layouts and print-ready memo pagination
- Live versus fallback provenance badges on every climate indicator

---

## Quick start

Prerequisites: [Node.js](https://nodejs.org/) 18+ and npm.

```bash
# 1. Clone
git clone https://github.com/chriscorexx/Climora-fintech.git
cd Climora-fintech

# 2. Install
npm install

# 3. Run the web app (API server + Vite)
npm run dev:web
```

Open http://localhost:5173 — the landing page loads, then register an account as a Lender or MSME
Owner. Workspaces start empty: you create your own profiles.

```bash
npm run desktop   # Electron desktop shell (dev)
npm run dev       # server + web + desktop together
npm run server    # optional Express + SQLite API only
```

The client uses the API when it is healthy and falls back to local-only operation when it is not,
so the web app works without the backend.

---

## Project structure

```
climora/
├── src/
│   ├── core/           # Pure domain engines: risk scoring, simulation, scheme matching,
│   │                   # weather, auth, portfolio, formatting, CSV, history, theme, platform
│   ├── components/
│   │   ├── landing/    # Public landing page (web-only)
│   │   ├── auth/       # Login, register, password gate, shared auth UI
│   │   ├── lender/     # Lender workspace
│   │   ├── owner/      # MSME Owner workspace and profile editor
│   │   ├── dashboard/  # Command Center
│   │   ├── report/     # Credit memo
│   │   ├── common/     # Gauges, cards, badges, skeleton, resilience, map, alerts
│   │   └── navigation/ # Top bar: user menu, theme switcher, alert strip
│   ├── types/          # TypeScript domain models
│   ├── App.tsx         # Auth gate, view routing, workspace scoping
│   └── main.tsx        # Entry point
├── server/             # Optional Express + SQLite API (shared persistence)
├── electron/           # Desktop shell (main + preload)
├── website/            # Prebuilt static site for any static host
├── tests/              # Vitest unit and jsdom UI suite
├── scripts/            # Dev helpers (Electron launcher)
├── build/icons/        # App icons for all platforms
├── docs/               # All project documentation, demo video, and deck
├── .github/            # Issue/PR templates and release CI
└── package.json
```

---

## Deployment

### Web (Vercel — live)

The production web app runs at **[climora-fintech.vercel.app](https://climora-fintech.vercel.app)**,
deployed from `main` with zero manual settings — `vercel.json` provides the build command, `dist`
output, SPA rewrite, and immutable asset caching. Every push to `main` redeploys automatically and
pull requests get preview URLs. Full guide: [docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md).

Set `VITE_COMMAND_CENTER_PASSWORD` in the Vercel project to change the Command Center password
(inlined at build time — redeploy after changing it).

### Web (Render)

Render is supported as an alternative static host; see
[docs/DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md) and the included `render.yaml` Blueprint.

### Desktop binaries

Prebuilt installers for Windows (NSIS), macOS (Intel and Apple Silicon), and Linux (AppImage and
deb) are attached to every GitHub Release. Build locally with:

```bash
npm run dist:all       # or: npm run package   (current platform)
```

Platform requirements and CI details: [docs/BUILDING.md](docs/BUILDING.md).

---

## Scripts

| Script                                                      | Purpose                                        |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `npm run dev` / `dev:web` / `dev:client` / `dev:server`     | Development (all / web / client / API server)  |
| `npm run desktop`                                           | Electron shell in development                  |
| `npm run build`                                             | Typecheck plus production build to `dist/`     |
| `npm run build:website`                                     | Build and sync the hosted site into `website/` |
| `npm run dist:win` / `dist:linux` / `dist:mac` / `dist:all` | Desktop binaries to `release/`                 |
| `npm test`                                                  | Vitest unit and UI suite (89 tests)            |
| `npm run lint` / `format` / `format:check`                  | ESLint / Prettier                              |

---

## Quality

- `npx tsc --noEmit` — clean
- `npm run lint` — ESLint with `--max-warnings=0`, clean
- `npm test` — 89 tests across 15 files (domain engines, auth, portfolio, formatting, CSV, and
  jsdom UI plus authentication-flow tests)
- `npm run build` — production build succeeds
- Linux AppImage smoke-tested headless; the desktop release matrix is green in CI

---

## Documentation

All documentation lives in [`docs/`](docs/):

| Document                                                                                        | Contents                                                         |
| ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)                                                       | Web deployment on Vercel (live)                                  |
| [DEPLOY_RENDER.md](docs/DEPLOY_RENDER.md)                                                       | Web deployment on Render                                         |
| [BUILDING.md](docs/BUILDING.md)                                                                 | Desktop binaries: commands, platform matrix, CI, troubleshooting |
| [ACCESS.md](docs/ACCESS.md)                                                                     | Auth model, role isolation, Command Center password, security    |
| [COMMAND_CENTER.md](docs/COMMAND_CENTER.md)                                                     | Command Center access and walkthrough                            |
| [RISK_SCORING.md](docs/RISK_SCORING.md)                                                         | Five-dimension model, weights, reweighting, categories           |
| [DATA_SOURCES.md](docs/DATA_SOURCES.md)                                                         | Open-Meteo APIs, fallbacks, provenance, licensing                |
| [TECH_STACK.md](docs/TECH_STACK.md)                                                             | Technology decisions                                             |
| [MVP_SCOPE.md](docs/MVP_SCOPE.md) / [ApplicationFunctions.md](docs/ApplicationFunctions.md)     | Product scope and function specs                                 |
| [ProblemStatement.md](docs/ProblemStatement.md) / [ProjectOverview.md](docs/ProjectOverview.md) | Challenge context and solution overview                          |
| [RESEARCH.md](docs/RESEARCH.md) / [references.md](docs/references.md)                           | Research notes and data-source references                        |
| [demo-video.mp4](docs/demo-video.mp4) / [presentationRound1.pdf](docs/presentationRound1.pdf)   | Demo recording and hackathon deck                                |

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow, coding
conventions, and quality gates, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community
guidelines.

```bash
npm install       # setup
npm run dev:web   # run
npm test          # verify
npm run lint      # and lint before opening a PR
```

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/chriscorexx">
        <img src="https://github.com/chriscorexx.png" width="80" height="80" alt="chriscorexx" /><br />
        <sub><b>chriscorexx</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/frictionalmega">
        <img src="https://github.com/frictionalmega.png" width="80" height="80" alt="frictionalmega" /><br />
        <sub><b>frictionalmega</b></sub>
      </a>
    </td>
  </tr>
</table>

Add yourself here in your first pull request — open a PR that appends your row to this table.

## License

Released under the [MIT License](LICENSE.md). Copyright (c) 2026 The Climora Contributors.

## Disclaimer

Climora is a hackathon prototype developed for IFC challenge FIN-05. Its risk scores, scoring
weights, and cashflow stress simulations are illustrative heuristics designed for decision support
and climate preparedness. They do not constitute official credit ratings or automated credit
approval or rejection decisions, and human review is required.

Authentication in the hosted deployment is demo-grade, client-side authentication (accounts and
hashed passwords live in the browser's local storage) and is not a substitute for a production
identity provider. See [docs/ACCESS.md](docs/ACCESS.md).
