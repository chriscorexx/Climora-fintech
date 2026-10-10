# Climora — MVP Scope

## 1. Goal

Build a cross-platform desktop prototype, built with Electron, that helps lenders assess climate-related risks affecting Micro, Small and Medium Enterprises (MSMEs). The application combines business information with location-based climate indicators to generate an explainable, illustrative climate-adjusted risk score.

## 2. Architecture

The application is a single desktop Electron app with no separate server or microservices:

- **Electron** hosts the application as a cross-platform desktop shell.
- **React + TypeScript** (in the renderer process) provides the dashboard UI, profile forms, and results display.
- **Node.js + TypeScript** (in Electron's main process or local services) handles input validation, external API integration (Open-Meteo), the risk-scoring engine, and SQLite database access.
- **SQLite** stores business profiles, assessment results, and history locally.
- **No Python, FastAPI, or server deployment** is required for the MVP.

See [TECH_STACK.md](TECH_STACK.md) for full architecture, security, and data-flow details.

## 3. Target Users

- **Primary:** Bank credit officers and risk analysts.
- **Secondary:** MSME owners who want to understand their climate exposure.

## 4. Core Features (Must Have)

1. **MSME Profile:** Enter business name, business type, location, and basic financial information. Saved to local SQLite storage.
2. **Climate Data:** Retrieve available weather indicators for the selected location via the Open-Meteo API (forecast, flood, geocoding). The application remains functional when APIs are unavailable by falling back to clearly labelled sample data.
3. **Risk Assessment:** Generate an illustrative climate-risk score using transparent, rule-based logic (see [RISK_SCORING.md](RISK_SCORING.md) for the methodology and weights).
4. **Risk Breakdown:** Show contributing factors such as heavy rainfall, heat exposure, and flood-related exposure where data is available. Missing or incomplete data is clearly labeled.
5. **Recommendations:** Suggest practical steps to reduce identified risks.
6. **Dashboard:** Display the score, risk category, contributing factors, data sources, timestamp, limitations, and recommendations. Past assessments can be loaded from local history.

## 5. Optional Features (If Time Permits)

- Interactive map showing business locations.
- Compare risk profiles across multiple MSMEs.
- Export a simple risk report (JSON or PDF).
- Simulated portfolio-level risk dashboard for lenders.

## 6. Out of Scope

- Production-grade credit scoring.
- Predicting actual loan defaults.
- Direct integration with banking systems.
- Automatic loan approvals or rejections.
- Claims of validated climate-risk predictions.
- Cloud deployment, server-side infrastructure, or microservices.
- Paid API integrations requiring API keys.

## 7. Constraints

- Hackathon duration: 24 hours.
- Team size: 4 members.
- Use public or sample data only. Open-Meteo is free and does not require an API key for non-commercial use.
- Prioritize a working end-to-end desktop demonstration over a large feature set.
- No external services or cloud infrastructure required.

## 8. Data Sources

| Source                            | Type                 | Purpose                                                                         |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------- |
| Open-Meteo Forecast API           | Live API             | Temperature, precipitation, wind for heavy-rainfall and extreme-heat dimensions |
| Open-Meteo Flood API              | Live API             | Simulated river discharge for flood-exposure dimension                          |
| Open-Meteo Geocoding API          | Live API             | Resolve location names to coordinates                                           |
| Open-Meteo Historical API         | Reference API        | Context for recent climate patterns                                             |
| World Bank Climate/Flood Datasets | Downloadable dataset | Reference only; requires preprocessing                                          |
| Sample data                       | Synthetic fallback   | Clearly labelled; used when APIs are unavailable                                |

See [DATA_SOURCES.md](DATA_SOURCES.md) for full details.

## 9. Responsible Use

The score is an illustrative prototype assessment, not a validated credit rating or probability of default. Data limitations must be disclosed, and the score must not be used as the sole basis for lending decisions.
