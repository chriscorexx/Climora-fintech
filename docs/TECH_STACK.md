# Climora — Technology Stack

**Status:** Planning and documentation (24-hour hackathon prototype)
**Project Type:** ClimateTech × FinTech
**Challenge:** Real-Time Climate Risk Scoring for MSMEs
**Team Size:** 4 members

---

## 1. Overview

Climora is an application built with **TypeScript** across both frontend and backend layers, with support for an **Electron** desktop shell and standard web browser execution. The application bundles a **React + TypeScript** dashboard with a **Node.js + TypeScript** core engine. The application retrieves public climate and weather data for a given MSME location, computes an illustrative rule-based climate-risk score, persists results locally in **SQLite**, and presents an explainable assessment with mitigation recommendations.

This is a single-runtime application. No external microservices or cloud servers are required for the primary demo. External HTTP calls to weather APIs are made with typed API clients in TypeScript.

---

## 2. Core Technologies

### 2.1 Runtime & Shell

| Layer         | Technology                | Role                                                                                                                                                                          |
| ------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop shell | **Electron (TypeScript)** | Cross-platform desktop container (Windows, macOS, Linux). Hosts the React renderer and provides the Node.js main process for backend logic, file I/O, and external API calls. |
| Renderer (UI) | **React + TypeScript**    | Renders the dashboard, MSME profile forms, risk-score display, contributing-factor breakdown, and recommendations. Bundled with Vite.                                         |
| Backend logic | **Node.js + TypeScript**  | Handles input validation, external API integration (Open-Meteo), risk-engine calculation, and all SQLite persistence.                                                         |
| Persistence   | **SQLite**                | Local relational database stored in user data directory. Stores business profiles, assessment results, metadata, and assessment history.                                      |

### 2.2 Architecture Pattern

```
┌──────────────────────────────────────────────┐
│              Electron Main Process           │
│              (Node.js runtime)               │
│                                              │
│  ┌───────────────┐  ┌───────────────┐       │
│  │  Preload      │  │  Backend      │       │
│  │  Bridge       │  │  Services     │       │
│  │  (context-    │  │               │       │
│  │  isolation)   │  │  • API Client │       │
│  │               │  │  • Risk      │       │
│  │  IPC handlers │  │    Engine     │       │
│  │  for renderer │  │  • Validator │       │
│  └───────────────┘  │  • SQLite    │       │
│        │              │    Repo      │       │
│        ▼              └───────────────┘       │
│  ┌───────────────────────────────────────┐   │
│  │        SQLite Local Database          │   │
│  │  profiles, assessments, history     │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
                              │
                              │ HTTP(S)
                              ▼
                    ┌─────────────────────┐
                    │  Open-Meteo API     │
                    │  (free, CC BY 4.0)  │
                    └─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌─────────────┐   ┌──────────────────┐   ┌─────────────────┐
│ World Bank  │   │  World Bank      │   │  HDX / Local    │
│ Climate     │   │  Global Flood    │   │  Datasets       │
│ Knowledge   │   │  Exposure        │   │  (preprocessed) │
│ Portal      │   │  Dataset         │   │                 │
└─────────────┘   └──────────────────┘   └─────────────────┘
```

### 2.3 Security Architecture

| Concern                          | Setting                                            | Rationale                                                                                                                                                            |
| -------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Context isolation**            | `contextIsolation: true`                           | Isolates the renderer from the main process to prevent XSS from accessing Node.js APIs.                                                                              |
| **Node integration in renderer** | `nodeIntegration: false`                           | Disables direct Node.js access from React/HTML to reduce attack surface.                                                                                             |
| **Preload script**               | `preload.ts`                                       | Exposes a vetted, narrowly-scoped API surface via typed `contextBridge.exposeInMainWorld`. Only approved IPC channels are callable from the renderer.                |
| **Input validation**             | Zod schemas in TypeScript                          | All user inputs (business name, location, coordinates, financial figures) are validated with strongly typed Zod schemas. Never trust renderer-side validation alone. |
| **SQL injection**                | Parameterized queries (`?` placeholders)           | All SQLite operations use parameterized queries. No string concatenation in SQL.                                                                                     |
| **API credential handling**      | `process.env` via `.env` or Electron `safeStorage` | If any API keys are needed in future, they are loaded from environment variables or Electron secure storage — never hardcoded.                                       |
| **Network calls**                | From main process only                             | External HTTP requests originate from Electron's main process, not the renderer, preventing CORS and reducing exposure.                                              |

---

## 3. Data Flow

1. **User enters MSME details** — business name, type, location (city/country or lat/lng), and optional financial indicators — through the React UI in the renderer.
2. **React UI sends data via IPC** — the renderer calls a curated function exposed by the preload bridge (e.g., `window.climora.assessRisk(profile)`).
3. **Electron main process validates inputs** — the Node.js backend validates all fields using schema validation. Invalid input returns structured error messages to the renderer.
4. **Geocoding and weather retrieval** — the backend resolves the location (if a city name was entered) and fetches weather and climate indicators from the primary data source (Open-Meteo).
5. **Risk engine calculation** — the backend applies the transparent rule-based scoring methodology, computing each dimension and the overall weighted score.
6. **SQLite persistence** — the backend stores the business profile, assessment inputs, dimension scores, sources, and timestamp in the local SQLite database.
7. **Result rendering** — the renderer displays the score, risk category, contributing factors, data sources, timestamp, limitations, and mitigation recommendations.
8. **History retrieval** — past assessments can be loaded from SQLite for comparison.

---

## 4. External APIs & Datasets

### 4.1 Primary Weather Provider: Open-Meteo

Open-Meteo aggregates open weather model output from national meteorological services (ECMWF, NOAA, DWD, Météo-France, and others). It provides multiple free-to-use APIs under **CC BY 4.0** licensing (attribution required). No API key is required for non-commercial/free use; commercial use requires a paid plan with an API key.

| API Endpoint                                                                 | Purpose                                                                                     | Key Variables                                                                                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Forecast API** (`https://api.open-meteo.com/v1/forecast`)                  | Current conditions and up-to-16-day forecast                                                | `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `rain_sum`, `weather_code`, `wind_speed_10m_max` |
| **Historical Weather API** (`https://archive-api.open-meteo.com/v1/archive`) | Past weather (1940–present, ERA5/ERA5-Land reanalysis)                                      | Same variables as forecast; useful for computing recent normals                                                   |
| **Flood API** (`https://flood-api.open-meteo.com/v1/flood`)                  | Simulated river discharge (GloFAS, 5 km resolution, 1984–present + up to 7 months forecast) | `river_discharge`, `river_discharge_max`, ensemble percentiles                                                    |
| **Climate API** (`https://climate-api.open-meteo.com/v1/climate`)            | Climate projections (1950–2050, CMIP6 downscaled to 10 km)                                  | `temperature_2m_max`, `precipitation_sum`, long-term trends                                                       |
| **Geocoding API** (`https://geocoding-api.open-meteo.com/v1/search`)         | Resolve city/location names to lat/lng coordinates                                          | `latitude`, `longitude`, `elevation`, `timezone`, `country`                                                       |

**Primary demo approach:**

- Use the **Forecast API** for current weather conditions (temperature, precipitation) to drive the heavy-rainfall and extreme-heat dimensions.
- Use the **Flood API** for river discharge to drive the flood-exposure dimension.
- Use the **Geocoding API** to resolve location names to coordinates.
- All endpoints are free for non-commercial use with a 10,000 calls/day rate limit on the free tier. No API key needed for free tier.

**Rate limits (free tier):** 10,000 calls/day, 5,000 calls/hour, 600 calls/minute.

**Attribution:** "Weather data by Open-Meteo" plus citation of underlying data sources (ERA5, ERA5-Land, GloFAS, CMIP6) as specified in the Open-Meteo licence.

### 4.2 Supplementary / Alternative Weather Sources

| Source              | URL                                            | Notes                                                                                                                                                           |
| ------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Visual Crossing** | `https://www.visualcrossing.com/weather-data/` | Single Timeline API for historical, current, and forecast data. Free tier: 1,000 records/day, no credit card. Paid plans for higher volume. Requires API key.   |
| **Meteostat**       | `https://dev.meteostat.net/`                   | Free access to historical weather and climate data via JSON API and CSV downloads. No API key required for basic usage. Primarily historical/observation-based. |

**Strategy:** Open-Meteo is the primary and only integrated provider for the hackathon MVP. Visual Crossing and Meteostat are documented as alternatives if Open-Meteo is unavailable or rate-limited. Only one provider should be prioritized to avoid complexity in a 24-hour window.

### 4.3 Climate & Flood Datasets

| Dataset                                    | Source     | URL                                                          | Notes                                                                                                                  |
| ------------------------------------------ | ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| World Bank Climate Change Knowledge Portal | World Bank | `https://climateknowledgeportal.worldbank.org/download-data` | Country-level climate indicators and projections. Requires preprocessing for geographic matching.                      |
| World Bank Global Flood Exposure Dataset   | World Bank | `https://datacatalog.worldbank.org/dataset/0062763`          | Gridded population flood exposure headcounts by country. Requires preprocessing to extract location-specific exposure. |
| HDX Flood Datasets                         | UN OCHA    | `https://data.humdata.org/dataset/?vocab_Topics=flooding`    | Various flood hazard maps and exposure datasets. Require preprocessing and geographic matching.                        |

**Important:** These datasets are downloaded as bulk files (CSV, GeoJSON, raster). They require **preprocessing and geographic matching** to associate a business location with its relevant climate or flood risk context. They are not real-time APIs and are intended for supplementary context only.

### 4.4 Research Reference (Not an API)

- **PLOS Climate article:** `https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000644` — Academic research reference only. This is **not** a live API and is not integrated. It is cited for methodological context.

### 4.5 Data Source Types: Definitions and Differences

| Type                                  | Definition                                                                                                                                                       | Source Example                                                                 | Use in Climora                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Forecasts**                         | Short-term predictions (up to 16 days) from numerical weather models. Best for current weather conditions and near-term outlook.                                 | Open-Meteo Forecast API                                                        | Drives real-time heavy-rainfall and extreme-heat dimensions.                                         |
| **Observations / Historical Weather** | Recorded or reanalyzed weather data (past conditions from 1940 onward). Represents what actually happened.                                                       | Open-Meteo Historical Weather API, Meteostat                                   | Context for recent averages; not the sole basis for risk.                                            |
| **Climate Projections**               | Long-term modeled scenarios of future climate conditions (e.g., 1950–2050) based on representative concentration pathways. Represents trends, not daily weather. | Open-Meteo Climate API, World Bank Climate Knowledge Portal                    | Context for long-term exposure trends. Not used as real-time scoring input.                          |
| **Flood Exposure Data**               | Geospatial datasets showing population or asset exposure to flood hazards, or simulated river discharge. Represents hazard exposure, not direct business risk.   | Open-Meteo Flood API, World Bank Global Flood Exposure Dataset, HDX flood maps | Drives the flood-exposure dimension. The Flood API (river discharge) is the primary input.           |
| **Sample Data**                       | Synthetic, hardcoded fallback values clearly labelled as illustrative.                                                                                           | Bundled in codebase                                                            | Used only when an external source is unavailable. Clearly marked as sample, never presented as live. |

---

## 5. SQLite Persistence

### 5.1 Storage Location

SQLite database file is stored in Electron's user data directory:

- **Windows:** `%APPDATA%\Climora\climora.db`
- **macOS:** `~/Library/Application Support/Climora/climora.db`
- **Linux:** `~/.config/Climora/climora.db`

### 5.2 Schema (Proposed)

```sql
-- Business profiles (MSMEs entered by the user)
CREATE TABLE profiles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    business_type TEXT NOT NULL,
    location    TEXT NOT NULL,
    latitude    REAL,
    longitude   REAL,
    revenue     REAL,
    expenses    REAL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Assessment results (risk scores and breakdown)
CREATE TABLE assessments (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL REFERENCES profiles(id),
    overall_score REAL NOT NULL,
    category    TEXT NOT NULL,
    -- Dimension scores (0–100 each)
    flood_score        REAL,
    rainfall_score     REAL,
    heat_score         REAL,
    business_score     REAL,
    financial_score    REAL,
    -- Metadata
    data_sources    TEXT,
    limitations     TEXT,
    recommendations TEXT,
    timestamp       TEXT NOT NULL DEFAULT (datetime('now')),
    -- Missing-data tracking (JSON string)
    missing_data    TEXT
);

-- Assessment history (audit trail)
CREATE TABLE assessment_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id  INTEGER NOT NULL REFERENCES profiles(id),
    assessment_id INTEGER NOT NULL REFERENCES assessments(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

All inserts use parameterized queries. No user input is concatenated into SQL strings.

---

## 6. Risk Engine

The risk engine is implemented as a set of pure functions in the Node.js main process. It is **transparent, illustrative, and rule-based** — it does not use machine learning or statistical models.

### 6.1 Risk Dimensions and Weights

| Dimension               | Weight   | Data Source                                               |
| ----------------------- | -------- | --------------------------------------------------------- |
| Flood Exposure          | 30%      | Open-Meteo Flood API (river discharge) or sample data     |
| Heavy Rainfall          | 25%      | Open-Meteo Forecast API (`precipitation_sum`, `rain_sum`) |
| Extreme Heat            | 20%      | Open-Meteo Forecast API (`temperature_2m_max`)            |
| Business Vulnerability  | 15%      | User-provided business type classification                |
| Financial Vulnerability | 10%      | User-provided revenue/expenses (optional)                 |
| **Total**               | **100%** |                                                           |

### 6.2 Scoring Formula

```
Overall Risk Score = Σ (Dimension Risk × Dimension Weight)
```

Each dimension is normalized to a 0–100 scale before weighting.

### 6.3 Risk Categories

| Score Range | Category  |
| ----------- | --------- |
| 0–24        | Low       |
| 25–49       | Moderate  |
| 50–74       | High      |
| 75–100      | Very High |

Thresholds are provisional and for the hackathon prototype only.

### 6.4 Missing-Data Handling

- **Do not silently treat missing data as zero risk.** If an external API returns no data for a dimension, that dimension's score is marked as `null` (not assessed).
- The overall score is computed from the **available** dimensions only, with weights **proportionally reweighted**:
  ```
  Adjusted Score = Σ (Dimension Risk × Dimension Weight) / Σ (Active Dimension Weights)
  ```
- If fewer than 2 dimensions have data, the assessment is flagged as **incomplete** and the score is presented with a clear disclaimer.
- The `missing_data` field in the SQLite `assessments` table records which dimensions could not be assessed and why (e.g., "API unavailable", "No flood data for coordinates").
- All missing-data decisions are visible to the user in the UI and stored in the database.

### 6.5 Factor-Level Explanations

Each dimension includes a human-readable explanation:

- **Flood Exposure:** Based on simulated river discharge from GloFAS (via Open-Meteo Flood API). Values above a provisional threshold indicate elevated river flood risk.
- **Heavy Rainfall:** Based on forecast precipitation over the next 7 days. Frequent or high-intensity rainfall may disrupt operations.
- **Extreme Heat:** Based on maximum daily temperature forecast. Prolonged heat above a threshold may stress workers and equipment.
- **Business Vulnerability:** Assigned based on business type (e.g., outdoor operations, agriculture, retail). Higher for business types that are operationally sensitive to climate.
- **Financial Vulnerability:** Optional. Derived from revenue/expenses if provided. A larger expense-to-revenue ratio indicates lower financial resilience.

### 6.6 Disclaimer

This risk score is an **illustrative prototype heuristic**. It is **not** a validated credit rating, probability of default, or lending recommendation. It must not be used as the sole basis for any financial decision.

---

## 7. Development Tools

| Category               | Tool                        | Purpose                                                             |
| ---------------------- | --------------------------- | ------------------------------------------------------------------- |
| **Language**           | TypeScript 5+               | End-to-end type safety across domain models, UI, and backend logic. |
| **Package management** | npm (Node Package Manager)  | Manages dependencies.                                               |
| **Build tooling**      | Vite                        | Ultra-fast bundling of React + TypeScript renderer.                 |
| **Electron packaging** | electron-builder            | Creates cross-platform desktop packages.                            |
| **Version control**    | Git                         | Local and feature-branch version control.                           |
| **Remote repository**  | GitHub                      | Hosted repository, collaboration, issue tracking, and CI.           |
| **UI/UX design**       | Tailwind CSS + Lucide Icons | Clean FinTech design system.                                        |

---

## 8. Supporting Libraries

### 8.1 React / Renderer Libraries

| Library                    | Purpose                                                                         |
| -------------------------- | ------------------------------------------------------------------------------- |
| `react`, `react-dom`       | Core UI rendering with React 18 & TypeScript.                                   |
| `lucide-react`             | Institutional financial and environmental icons.                                |
| `recharts`                 | Visualizations for risk scores, contributing hazards, and DSCR cashflow trends. |
| `leaflet`, `react-leaflet` | Geospatial hazard mapping.                                                      |

### 8.2 TypeScript / Backend Services

| Library                     | Purpose                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `better-sqlite3` / `sql.js` | Embedded local SQLite persistence for business profiles and assessments. |
| `zod`                       | Strongly typed schema-based input validation.                            |
| Built-in `fetch`            | HTTP requests to the Open-Meteo API.                                     |

### 8.3 Electron / Packaging Libraries

| Library            | Purpose                        |
| ------------------ | ------------------------------ |
| `electron`         | Core Electron framework.       |
| `electron-builder` | Desktop application packaging. |

---

## 9. Sample-Data Fallback

A small, clearly labelled sample dataset is included for demonstration and offline testing. Sample data is **never** presented as live or real weather. When sample data is used, the UI and stored assessment metadata explicitly indicate: "Sample data — for demonstration only; not live weather or climate data."

Sample data covers:

- Representative temperature, precipitation, and river discharge values for a few global cities.
- Business-type vulnerability mappings.
- Pre-defined mitigation recommendations.

---

## 10. Documentation Consistency Check (Resolved)

During initial inspection, the following inconsistencies were identified between the agreed technology stack and existing documentation. **All have been resolved:**

| File                     | Issue Found (Before Fix)                                                     | Resolution Applied                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `README.md:45`           | Listed **Python 3** as a prerequisite; no Python needed; backend is Node.js. | Replaced with Node.js 18+ prerequisite; added architecture section describing Electron + React + Node.js + SQLite. |
| `README.md:75`           | Listed data sources as bare bullet links without categorization.             | Replaced with categorized reference (primary provider + link to DATA_SOURCES.md); added project structure.         |
| `README.md:92`           | Stated **"Team Size: 3 members"**.                                           | Changed to 4 members.                                                                                              |
| `ProblemStatement.md:97` | Stated **"Team Size: 3 members"**.                                           | Changed to 4 members.                                                                                              |
| `MVP_SCOPE.md:40`        | Stated **"Team size: 3 members"**.                                           | Changed to 4 members; added architecture section describing Electron desktop app.                                  |
| `DATA_SOURCES.md:20`     | Referenced **"FastAPI backend"** for accessing the Open-Meteo API.           | Replaced with Node.js backend; full rewrite to categorize sources by type (API, dataset, reference).               |
| `DATA_SOURCES.md:60`     | Referenced **"FastAPI backend"** for fetching external data.                 | Replaced with Node.js backend; added data-type summary table.                                                      |

**Summary of resolutions:**

1. **Python / FastAPI references** — All removed from active documentation. The only remaining mentions are in this consistency table (documenting the fix) and a single statement in MVP_SCOPE stating "No Python, FastAPI required."
2. **Team size = 3** — Changed to 4 in `README.md`, `ProblemStatement.md`, and `MVP_SCOPE.md`.

**No Python references are retained for the application architecture.** Python was never mentioned in `RISK_SCORING.md` or as part of the agreed stack.

---

## 11. Assumptions

1. The application runs as a **desktop Electron app** — no browser deployment, no server infrastructure.
2. **Open-Meteo** is the sole integrated external API for weather and flood data in the MVP. No paid API keys are required for the free tier.
3. Climate and flood **datasets** from the World Bank and HDX are used only as **contextual reference** — not downloaded or processed within the 24-hour hackathon unless time permits.
4. The risk score is a **transparent rule-based heuristic**, not a statistically or scientifically validated model.
5. All persistence is local via **SQLite** — no cloud database or remote sync in the MVP.

---

## 12. Open Questions

1. Should the prototype attempt to preload any World Bank flood-exposure dataset, or rely solely on the Open-Meteo Flood API for the flood-exposure dimension?
2. Does the business-type vulnerability mapping need to be expanded beyond a simple lookup table?
3. Should financial-vulnerability input be required or optional? Current plan is optional with proportional reweighting of other dimensions.
4. Which build/packaging tool (`electron-forge` vs `electron-builder`) will be used for the final distributable?
