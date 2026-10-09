
# Climora — Data Sources

## 1. Purpose

Climora uses public climate and weather data to demonstrate how location-based climate hazards may affect MSMEs. This document describes the primary provider, supplementary sources, downloadable datasets, and research references. It distinguishes between real-time APIs, static datasets, and academic references to avoid confusion.

## 2. Data Source Categories

| Category | Description | Integrated in MVP? |
|---|---|---|
| **Weather APIs** | Real-time or forecast weather data accessed via HTTP. | Yes — Open-Meteo is the primary provider. |
| **Downloadable Datasets** | Static files (CSV, GeoJSON, raster) that must be preprocessed and matched to business locations. | Reference only — requires preprocessing and geographic matching. |
| **Alternative APIs** | Other weather data providers that could be used if the primary source is unavailable. | Documented as alternatives; not integrated in MVP. |
| **Research References** | Academic articles cited for methodological context. Not live data sources. | Reference only. |

## 3. Primary Weather Provider: Open-Meteo

Website: https://open-meteo.com/
License: CC BY 4.0 (attribution required). Free for non-commercial use. No API key required for the free tier.

### Key APIs

| API Endpoint | Purpose | Key Variables |
|---|---|---|
| **Forecast API** — `https://api.open-meteo.com/v1/forecast` | Current conditions and up-to-16-day daily forecast | `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`, `rain_sum`, `weather_code`, `wind_speed_10m_max` |
| **Historical Weather API** — `https://archive-api.open-meteo.com/v1/archive` | Past weather from 1940 onward (ERA5/ERA5-Land reanalysis) | Same variables as the Forecast API |
| **Flood API** — `https://flood-api.open-meteo.com/v1/flood` | Simulated river discharge (GloFAS, 5 km resolution, 1984 to 7 months forecast) | `river_discharge`, `river_discharge_max` |
| **Climate API** — `https://climate-api.open-meteo.com/v1/climate` | Climate projections 1950–2050 (CMIP6 downscaled to ~10 km) | `temperature_2m_max`, `precipitation_sum` |
| **Geocoding API** — `https://geocoding-api.open-meteo.com/v1/search` | Resolve city/location names to latitude/longitude | `latitude`, `longitude`, `elevation`, `country` |

### Purpose

- Retrieve weather data for a selected MSME location.
- Obtain temperature and precipitation indicators for the heavy-rainfall and extreme-heat risk dimensions.
- Obtain simulated river discharge for the flood-exposure risk dimension.
- Resolve location names to geographic coordinates.

### Integration

Access the Open-Meteo APIs directly from the Node.js backend (running in Electron's main process) using the business location's latitude and longitude. The Geocoding API resolves city or postal-code inputs to coordinates.

### Differences Among Data Types

| Data Type | Definition | Source | Role in Climora |
|---|---|---|---|
| **Forecasts** | Short-term predictions (up to 16 days) from numerical weather models. | Open-Meteo Forecast API | Drives the heavy-rainfall and extreme-heat dimensions for the current assessment. |
| **Observations / Historical Weather** | Recorded or reanalyzed weather conditions (1940–present). Represents actual past weather, not predictions. | Open-Meteo Historical Weather API | Contextual reference for recent climate patterns. Not the sole basis for risk scoring. |
| **Climate Projections** | Long-term modeled scenarios of future climate (1950–2050). Represents trends, not daily weather. | Open-Meteo Climate API, World Bank Climate Knowledge Portal | Contextual reference for long-term trends. Not used for real-time scoring. |
| **Flood Exposure Data** | Simulated river discharge or geospatial flood-exposure grids. Represents hazard exposure, not direct business risk. | Open-Meteo Flood API, World Bank Global Flood Exposure Dataset | Drives the flood-exposure dimension. The Open-Meteo Flood API (river discharge) is the primary input. |

### Limitations

- **Current weather is not the same as long-term climate risk.** Short-term observations must not be presented as proof of future climate conditions.
- The 7-day forecast covers near-term conditions only. Climate projections (long-term trends) are contextual and not a substitute for forecast data.
- River discharge from the Flood API represents simulated flow in the nearest river at 5 km resolution. It does not represent direct flood risk to a specific business premise.
- The free tier is rate-limited (10,000 calls/day). Production use would require a commercial plan or API key.
- Forecast accuracy degrades beyond 5–7 days. Avoid relying on forecasts further out for risk decisions.

## 4. Supplementary Weather Providers

These are documented as alternatives if Open-Meteo is unavailable or rate-limited. They are **not integrated** in the MVP prototype.

### A. Visual Crossing

Website: https://www.visualcrossing.com/weather-data/
License: Free tier (1,000 records/day, no credit card). Paid plans for higher volume. Requires an API key.

- **Purpose:** Single Timeline API for historical, current, and forecast weather data globally.
- **Variables:** Temperature, precipitation, wind, humidity, UV index, alerts, and more.
- **Integration note:** Would be called from the Node.js backend. Requires secure API credential handling (environment variables, not hardcoded).
- **Limitations:** Free tier is lower volume than Open-Meteo. Requires an API key for all access.

### B. Meteostat

Website: https://dev.meteostat.net/
License: Free. No API key required for basic usage. Primarily historical/observation-based.

- **Purpose:** Historical weather and climate data via JSON API and CSV downloads.
- **Integration note:** Would be called from the Node.js backend.
- **Limitations:** Focuses on historical observations rather than forecasts. Limited free-tier concurrency.

## 5. Climate & Flood Datasets (Downloadable, Reference Only)

These are static datasets that must be downloaded, preprocessed, and matched to business locations geographically. They are **not real-time APIs** and are not automated in the MVP. They are documented for future improvement and contextual reference.

### A. World Bank Climate Change Knowledge Portal

Website: https://climateknowledgeportal.worldbank.org/download-data

**Purpose:**
- Explore historical climate information and climate projections.
- Identify relevant country-level or regional climate indicators where available.

**Integration:** Use only if data can be downloaded, interpreted, and matched to the prototype's geographic scope within available time.

**Limitations:** Country-level information may not represent conditions at an individual business location. Requires preprocessing and geographic matching.

### B. World Bank Global Flood Exposure Dataset

Dataset: https://datacatalog.worldbank.org/search/dataset/0062763/global-flood-exposure-gridded-exposure-headcounts-bycountry

**Purpose:**
- Explore flood-exposure information as contextual evidence of potential hazard exposure.

**Integration:** Use only if the relevant data can be downloaded, interpreted, and matched to the prototype's geographic scope.

**Limitations:** Population exposure is not the same as direct flood risk to an individual business. Do not present population exposure values as business-specific flood probabilities. Requires preprocessing to associate with a business location.

### C. HDX Flood Datasets

Website: https://data.humdata.org/dataset/?vocab_Topics=flooding

**Purpose:**
- Access flood hazard maps and exposure datasets from humanitarian sources.

**Integration:** Reference only. Would require download, preprocessing, and geographic matching.

**Limitations:** Data formats and coverage vary by region. Requires significant preprocessing for use in the prototype.

## 6. Research Reference

### PLOS Climate Article

URL: https://journals.plos.org/climate/article?id=10.1371/journal.pclm.0000644

**Note:** This is an **academic research article**, not a live API. It is cited for methodological context only and is not integrated into the application.

## 7. Fallback Strategy

Because this is a 24-hour hackathon:

1. **Prioritize Open-Meteo** for weather, flood, and geocoding data.
2. **Use clearly labelled sample data** if an external API is unavailable or fails.
3. **Keep the application functional** when an API request fails — fall back to sample data with an explicit label.
4. **Label all data accurately** — sample, live (forecast), historical (observations), and modelled (climate projections) must be clearly distinguished.
5. **Do not invent observations** or present sample data as live data.

## 8. Data Handling

- Fetch external data through the **Node.js backend** (Electron main process), not from the React renderer directly.
- Validate API responses and handle missing or unexpected values.
- Display the data source and retrieval timestamp when available.
- Do not invent observations or present sample data as live data.
- Avoid collecting unnecessary personal or sensitive financial information.
- Store assessment metadata (sources, timestamps, limitations) in SQLite for auditability.

## 9. Data Type Summary

| Source | Type | Access Method | Integrated in MVP? |
|---|---|---|---|
| Open-Meteo Forecast API | Forecast (live) | HTTP API | Yes — primary |
| Open-Meteo Historical API | Observations | HTTP API | Reference |
| Open-Meteo Flood API | Flood exposure | HTTP API | Yes — primary flood source |
| Open-Meteo Climate API | Climate projections | HTTP API | Reference |
| Open-Meteo Geocoding API | Geocoding | HTTP API | Yes — location resolution |
| World Bank Climate Portal | Dataset | Download + preprocessing | No — reference only |
| World Bank Flood Exposure | Dataset | Download + preprocessing | No — reference only |
| HDX Flood Datasets | Dataset | Download + preprocessing | No — reference only |
| Visual Crossing | Alternative API | HTTP API | No — documented alternative |
| Meteostat | Alternative API | HTTP API / CSV | No — documented alternative |
| PLOS Climate article | Research reference | Academic paper | No — reference only |
| Sample data | Synthetic | Bundled in codebase | Yes — fallback when APIs fail |

## 10. Future Improvements

- Integrate additional regional climate datasets if preprocessing time permits.
- Add verified flood-hazard maps from HDX or World Bank datasets.
- Include drought and other locally relevant climate hazards.
- Validate the scoring methodology against suitable historical data and expert guidance.
- Consider adding API key-based providers (Visual Crossing) as a backup if Open-Meteo rate limits are encountered.

---

*See [TECH_STACK.md](TECH_STACK.md) for the full architecture, data flow, and security documentation.*
