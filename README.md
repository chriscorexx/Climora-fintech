# Climora — Climate-Adjusted Risk Scoring for MSMEs

**Climate Intelligence. Smarter Credit Decisions.**

Climora is a real-time climate-adjusted financial risk platform designed for the **FUSION 2026 Hackathon (FIN-05, International Finance Corporation challenge)**. It helps lenders and financial institutions assess how physical climate hazards (flooding, heavy rainfall, extreme heat) impact Micro, Small, and Medium Enterprises (MSMEs), while giving business owners clear roadmaps and government scheme matches to build climate resilience.

---

## 1. Core Problem & Solution

* **The Problem:** Credit officers typically evaluate MSMEs using backward-looking financial statements alone. Two enterprises with identical balance sheets may look equally creditworthy, yet one operates in a severe flood basin or heatwave zone vulnerable to immediate inventory wipeouts or operating disruptions.
* **The Solution:** Climora combines location-based environmental data from Open-Meteo, regional flood benchmarks, and business operational profiles to produce an **explainable 0–100 climate risk score** and a **cashflow stress-testing simulator (DSCR impact)**.

---

## 2. Architecture & Technology Stack

The platform is built with a **100% TypeScript** architecture:

| Layer | Technology | Role |
|---|---|---|
| **Frontend UI** | React 18 + Vite + TypeScript | High-trust institutional FinTech interface with dual workspaces (Lender & MSME Owner) |
| **Styling & System** | Tailwind CSS + Lucide Icons | Clean, anti-AI-slop design system with tabular financial typography |
| **Data Visualizations** | Recharts + SVG gauges | Multi-dimension hazard breakdowns, cashflow stress charts, risk gauges |
| **Hazard Maps** | Leaflet + OpenStreetMap | Spatial risk boundary and location context |
| **Domain Logic** | Pure TypeScript (`src/core/`) | 5-dimension rule-based scoring engine, climate-to-cashflow simulator, scheme matcher |
| **Data Ingestion** | Open-Meteo APIs (TypeScript client) | Real-time weather, flood simulation, and location geocoding with sample-data fallback |
| **Desktop Shell** | Electron + TypeScript | Optional cross-platform desktop application using typed IPC |

---

## 3. Key Capabilities

1. **Dual Persona Workspaces**:
   - **Lender Workspace (Credit Analyst)**: Loan pipeline table, portfolio climate exposure distribution, stress-testing simulator (+2°C heat, +50mm storm, utility outages) calculating pre- and post-shock Debt Service Coverage Ratio (DSCR), and one-click credit recommendation memo.
   - **MSME Owner Workspace**: Business profile manager with live geocoding, 7-day weather hazard monitor, climate resilience action checklist, and matched government subsidies.
2. **Transparent 5-Dimension Risk Scoring**:
   - Flood Exposure (30%)
   - Heavy Rainfall (25%)
   - Extreme Heat (20%)
   - Business Vulnerability (15%)
   - Financial Resilience (10%)
   - *Dynamic proportional reweighting* ensures missing indicators are never silently treated as zero risk.
3. **Government Scheme Catalogue**:
   - 16 verified Central & State MSME resilience schemes (CGTMSE, PM Surya Ghar, Agriculture Infrastructure Fund, etc.) with real eligibility criteria and direct portal links.
4. **Data Provenance**:
   - Explicit badges distinguish live weather observations, modelled regional benchmarks, and self-reported inputs.

---

## 4. Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher)
* [npm](https://www.npmjs.com/)

### Installation & Launch

```bash
# 1. Clone repository
git clone https://github.com/chriscorexx/Climora-fintech.git
cd Climora-fintech

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. External APIs & Data Sources

* **Open-Meteo Forecast API**: Real-time precipitation, temperature extremes, wind speeds (Free, CC BY 4.0, no key required).
* **Open-Meteo Flood API**: River discharge anomalies and flood hazard return period simulations (Free, CC BY 4.0).
* **Open-Meteo Geocoding API**: Resolves city/postal codes to coordinates (Free, CC BY 4.0).
* **World Bank Global Flood Dataset**: Preprocessed regional flood hazard baselines for administrative districts.
* **Government Subsidy Registry**: Official MSME schemes from Ministry of MSME, SIDBI, and State Governments.

---

## 6. Project Structure

```
climora/
├── src/
│   ├── types/          # TypeScript domain models (business, climate, risk, scenario, scheme)
│   ├── core/           # Pure TypeScript domain engines (scoring, simulation, matching, API)
│   ├── components/     # React + TypeScript UI components (lender, owner, risk, simulator)
│   ├── App.tsx         # Main application shell with dual workspace routing
│   ├── main.tsx        # React application entrypoint
│   └── index.css       # Tailwind financial styling tokens
├── electron/           # Electron TypeScript desktop shell
│   ├── main.ts         # Desktop main process
│   └── preload.ts      # Context isolation IPC bridge
├── public/             # Static assets and logo
├── package.json        # Dependencies & scripts
├── tsconfig.json       # TypeScript configuration
└── vite.config.ts      # Vite build configuration
```

---

## 7. Responsible Use & Disclaimer

Climora is a hackathon prototype developed for IFC challenge FIN-05. Its risk scores, scoring weights, and cashflow stress simulations are illustrative heuristics designed for decision support and climate preparedness. They do not constitute official credit ratings or automated credit approval/rejection decisions.
