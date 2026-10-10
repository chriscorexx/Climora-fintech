# Command Center

The **Command Center** is Climora's password-protected lender/underwriter workspace. It combines climate-adjusted
risk scoring, live environmental telemetry, a cashflow stress simulator, and an underwriting portfolio view into a
single screen for credit decisioning.

- **Component:** `src/components/dashboard/CommandCenterDashboard.tsx` (rendered by `src/App.tsx` when the active
  workspace role is `command_center`)
- **Selectors:** `src/components/dashboard/commandCenterSelectors.ts`
- **Simulation engine:** `src/core/scenarioSimulator.ts` (`simulateCashflowStress`)

## How to access it

1. Open the app and select the **Command Center** workspace in the top navigation bar.
2. A **password prompt** appears before the dashboard is rendered.

| Setting             | Value                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Default password    | `climora@2026`                                                                                                                                 |
| Override            | `VITE_COMMAND_CENTER_PASSWORD` environment variable, inlined **at build time** by Vite                                                         |
| Session persistence | `sessionStorage` — the unlock survives refreshes but **ends when the tab is closed**                                                           |
| Where configured    | The Command Center access-gate component owned by the frontend (`src/`) reads the env var; the variable is documented in `.env.example         |
| Live deployment     | Hosted at <https://climora-fintech.vercel.app>; if `VITE_COMMAND_CENTER_PASSWORD` was not set in the Vercel project, the default above applies |

> To change the password for a build, set `VITE_COMMAND_CENTER_PASSWORD` in your `.env` before running
> `npm run build`. This is a demo-grade client-side gate, not production authentication — see [`ACCESS.md`](./ACCESS.md).

## What it shows (top to bottom)

### 1. Hero — Enterprise identity, risk gauge & provenance

- **RiskGauge** (`size=168`) with the overall climate-adjusted risk score (0–100) and risk category
- **RiskBadge** (large) repeating the category/score, plus industry, business size, location, and Udyam number
- **Data provenance**: `ProvenanceBadge` (live vs. fallback provider, retrieval timestamp) and a confidence-level chip
- **Actions**: _Refresh Climate_ (re-fetches live indicators), _Edit Profile_, _Export Credit Memo_

### 2. KPI row

Four `MetricCard` tiles summarizing the assessment:

| KPI                     | Value                                 | Subtitle                                                        |
| ----------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Overall Climate Risk    | `{score}/100`                         | Risk category classification                                    |
| Financial Resilience    | `financialResilience` dimension score | Liquidity runway (cash reserves ÷ monthly opex), in months      |
| Peak Hazard Exposure    | Highest single-hazard score           | Dominant hazard label; switches to `alert` variant at ≥ 60      |
| Climate-Adjusted Rating | Risk category                         | Max safe facility (`formatInrLakhs`) from loan decision support |

### 3. Live climate telemetry

Current conditions for the active profile's resolved address, plus extreme-event counters:

| Metric                   | Source field                                                 |
| ------------------------ | ------------------------------------------------------------ |
| Temperature              | `currentConditions.temperatureC` + weather description       |
| Humidity                 | `currentConditions.relativeHumidityPct`                      |
| Wind speed               | `currentConditions.windSpeedKmh` (10 m gust proxy)           |
| River anomaly            | `extremes.riverDischargeAnomalyPct` (above-normal discharge) |
| Hot streak               | `extremes.consecutiveHotDays`                                |
| Peak rain                | `extremes.maxDailyPrecipitationMm`                           |
| Rain days                | `extremes.precipitationDaysCount`                            |
| District hazard baseline | `districtBaseline.floodExposureScore`                        |

### 4. 7-day climate forecast

- Recharts `ComposedChart`: precipitation bars (mm, right axis) with max/min temperature lines (°C, left axis),
  themed for light/dark via the resolved chart palette (Open-Meteo feed)
- Below the chart, a 7-tile day strip flags each day as **rain** or **heat** hazard with the day's max temperature
  and precipitation (or min temperature on dry days)

### 5. 5-dimension risk breakdown

One card per scoring dimension with score, effective weight, plain-language hint, and the primary driving factor:

| Dimension               | Meaning                                   |
| ----------------------- | ----------------------------------------- |
| `floodExposure`         | River/flood inundation exposure           |
| `heavyRainfall`         | Rainfall extremes and event concentration |
| `extremeHeat`           | Heatwave and temperature records          |
| `businessVulnerability` | Sector/physical vulnerability inputs      |
| `financialResilience`   | Balance-sheet and liquidity resilience    |

### 6. Climate-to-cashflow stress test

An interactive DSCR simulator (`simulateCashflowStress(profile, params)`):

- **Inputs**: hazard (flash flood / extreme heat / cyclone storm / water crisis), interruption duration (2–21 days),
  disruption severity (20–100%), premises flooded, grid brownout
- **Outputs**: scenario label with insolvency badge (`critical` / `strained` / `resilient`), baseline vs. stressed DSCR,
  revenue deficit, emergency repair cost, stressed cash runway (months), and recovery time (months)

### 7. Adaptation roadmap (resilience readiness)

Mitigation recommendations from the risk engine rendered as a checklist:

- Progress bar: completed actions / total, % complete, and **risk points remaining** if all are completed
- Per action: title, risk reduction (pts), estimated cost (₹k), and completion state carried in
  `completedActionIds`

### 8. Matched government schemes

Cards for each matched scheme with **match score (%)**, eligibility status (_Eligible_ / _Check Scope_), sponsoring
authority and government level, max benefit summary, and a link to the official source URL.

### 9. Underwriting pipeline

The full-portfolio table: enterprise count, total exposure (₹ crore), and count requiring covenants, with a search box
(name / city / industry) and per-row enterprise, industry, location, loan requested (₹ lakhs), DSCR, covenant flag,
and a select action that swaps the active profile driving every panel above.

## Tech stack

| Layer  | Technology                                                                                                                                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI     | React 18 + TypeScript, Tailwind CSS (fin-* design tokens, light/dark)                                                                                       |
| Charts | Recharts (`ComposedChart`, `Bar`, `Line`)                                                                                                                   |
| Icons  | lucide-react                                                                                                                                                |
| State  | React `useState`/`useMemo`, props from `src/App.tsx`                                                                                                        |
| Data   | Open-Meteo live feed (via `src/core/weatherService.ts`) with deterministic fallback indicators; backend REST API via `src/services/apiClient.ts` (optional) |
