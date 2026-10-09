# Climora Backend API

Express 5 + SQLite (`node:sqlite`) REST API backing the Climora Electron/React
frontend. CommonJS, matching the module style the backend started with.

- Base URL: `http://localhost:5000`
- All routes are prefixed with `/api`
- Success envelope: `{ "success": true, "data": { ... } }`
- Error envelope: `{ "success": false, "error": { "message", "code", "details" } }`
- Dates are ISO-8601 strings. Money is a plain number in INR.
- No authentication is implemented for this MVP (see *Authentication* below).

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `5000` | HTTP port |
| `CORS_ORIGIN` | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated allowed origins |
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `DATABASE_PATH` | `./data/climora.db` | SQLite file path |
| `SEED_DEMO_DATA` | `true` | Seed schemes + labelled demo businesses on an empty database only |
| `OPEN_METEO_BASE_URL` | `https://api.open-meteo.com` | Forecast API |
| `OPEN_METEO_FLOOD_BASE_URL` | `https://flood-api.open-meteo.com` | Flood (river discharge) API |
| `OPEN_METEO_GEOCODING_BASE_URL` | `https://geocoding-api.open-meteo.com` | Geocoding API |
| `CLIMATE_TIMEOUT_MS` | `8000` | Outbound timeout per climate call (2 attempts) |
| `CLIMATE_CACHE_TTL_MINUTES` | `360` | Cache lifetime for a climate payload |
| `CLIMATE_ALLOW_DEMO_FALLBACK` | `true` | Reserved. Demo values are only ever used when a request explicitly asks for them |
| `CLIMATE_HISTORY_DAYS` | `365` | Trailing window used as the flood reference |

Copy `backend/.env.example` to `backend/.env`. **Never commit `.env`.**

---

## Endpoints

### Health & configuration

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Liveness. Returns weights, categories and the disclaimer |
| GET | `/api` | Machine-readable endpoint index |
| GET | `/api/config` | Public scoring/business configuration the UI needs |

```bash
curl -s http://localhost:5000/api/health
```

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "climora-api",
    "environment": "development",
    "timestamp": "2026-10-09T13:00:00.000Z",
    "scoring": {
      "weights": { "flood": 0.3, "rainfall": 0.25, "heat": 0.2, "business": 0.15, "financial": 0.1 },
      "categories": [
        { "key": "low", "label": "Low", "min": 0, "max": 24 },
        { "key": "moderate", "label": "Moderate", "min": 25, "max": 49 },
        { "key": "high", "label": "High", "min": 50, "max": 74 },
        { "key": "veryHigh", "label": "Very High", "min": 75, "max": 100 }
      ]
    },
    "disclaimer": "Climora produces an illustrative prototype climate-risk score …"
  }
}
```

### Businesses

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/businesses` | List (query: `search`, `industry`, `state`, `limit`, `offset`, `sort`, `includeDemo`) |
| POST | `/api/businesses` | Create |
| GET | `/api/businesses/:id` | Retrieve one |
| PATCH / PUT | `/api/businesses/:id` | Partial update |
| DELETE | `/api/businesses/:id` | Delete (cascades to assessments, scenarios, actions) |

Create body (only `name`, `industry`, `location` are required):

```json
{
  "name": "Krishna Traders",
  "industry": "retail",
  "location": "Nagpur, Maharashtra",
  "state": "Maharashtra",
  "latitude": 21.1458,
  "longitude": 79.0882,
  "businessSize": "small",
  "businessStage": "established",
  "annualTurnover": 8000000,
  "annualExpenses": 6500000,
  "monthlyOperatingCost": 540000,
  "employeeCount": 30,
  "fundingRequired": 2000000,
  "hasBackupSupplier": false,
  "hasEmergencyReserve": false,
  "operationalDetails": "…"
}
```

Coordinates may also be sent as `coordinates: { "lat": 21.1, "lng": 79.0 }`.
Valid `industry`: `retail`, `manufacturing`, `agriculture`, `food_processing`,
`hospitality`, `construction`, `services`, `logistics`, `other`.
Valid `businessSize`: `micro`, `small`, `medium`. Valid `businessStage`:
`startup`, `growth`, `established`.

`annualTurnover`, `annualExpenses` and `fundingRequired` are optional — a missing
financial value is stored as `null`, never coerced to `0`.

```bash
curl -s -X POST http://localhost:5000/api/businesses \
  -H 'Content-Type: application/json' \
  -d @- <<'EOF'
{ "name": "Sahyadri Agro", "industry": "food_processing",
  "location": "Pune, Maharashtra", "state": "Maharashtra",
  "latitude": 18.5204, "longitude": 73.8567,
  "businessSize": "micro", "businessStage": "growth",
  "annualTurnover": 4800000, "annualExpenses": 3900000 }
EOF
```

Response `201`:

```json
{ "success": true, "data": { "business": { "id": "biz_…", "name": "Sahyadri Agro", "…": "…" } } }
```

### Assessments

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/assessments` | All assessments (query: `category`, `from`, `to`, `limit`, `offset`) |
| GET | `/api/assessments/:id` | One assessment with its factor breakdown |
| GET | `/api/businesses/:id/assessments` | History for a business (newest first) |
| POST | `/api/businesses/:id/assessments` | Run an assessment (body: `{ "forceDemo": false }`) |

Running an assessment fetches live Open-Meteo data for the business
coordinates, derives the dimension scores, runs the deterministic scoring engine
and persists the result plus its improvement actions.

```bash
curl -s -X POST http://localhost:5000/api/businesses/biz_xxx/assessments \
  -H 'Content-Type: application/json' -d '{"forceDemo": false}'
```

```json
{
  "success": true,
  "data": {
    "business": { "id": "biz_xxx", "name": "…" },
    "assessment": {
      "id": "asmt_…",
      "overallScore": 35,
      "category": "Moderate",
      "isIncomplete": true,
      "missingDimensions": ["flood"],
      "dataNote": "Climate dimensions derived from live Open-Meteo forecast data …",
      "methodology": "Weighted rule-based heuristic using proportional reweighting …",
      "uncertaintyNotes": ["…"],
      "factors": [
        {
          "dimension": "rainfall",
          "score": 5,
          "baseWeight": 0.25,
          "effectiveWeight": 0.3571,
          "contribution": 1.25,
          "dataAvailability": "live_forecast",
          "sourceTimestamp": "2026-10-09T00:00:00.000Z",
          "explanation": "Highest forecast daily precipitation total over the next 7 days is 0 mm."
        }
      ]
    },
    "climate": {
      "demoFallback": false,
      "sources": [{ "provider": "Open-Meteo Forecast API", "dataType": "live_forecast", "cached": false }],
      "warnings": ["The \"flood\" dimension is reported as MISSING …"],
      "detail": { "rainfallObservedMaxMm": 0, "heatObservedMaxC": 34.1 }
    },
    "disclaimer": "This score is an illustrative prototype heuristic …"
  }
}
```

`forceDemo: true` replaces every climate dimension with clearly-labelled demo
values and sets `climate.demoFallback` and the assessment `dataNote`
accordingly. Demo values are **never** used implicitly.

### Climate

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/climate/geocode?q=Pune` | Resolve a location to coordinates via Open-Meteo |
| GET | `/api/climate/businesses/:id` | Climate bundle for a business |

```bash
curl -s 'http://localhost:5000/api/climate/businesses/biz_xxx'
```

```json
{
  "success": true,
  "data": {
    "businessId": "biz_xxx",
    "coordinates": { "lat": 21.1458, "lng": 79.0882 },
    "dimensions": { "flood": null, "rainfall": 5, "heat": 30 },
    "detail": {
      "flood": null,
      "rainfallObservedMaxMm": 0,
      "heatObservedMaxC": 34.1
    },
    "sources": [
      { "provider": "Open-Meteo Forecast API", "dataType": "live_forecast", "cached": false }
    ],
    "warnings": ["Open-Meteo river-discharge data is unavailable …"],
    "demoFallback": false,
    "attribution": "Weather data provided by Open-Meteo … licensed CC BY 4.0.",
    "disclaimer": "Forecasts are short-term predictions, not long-run climate risk …"
  }
}
```

`dataType` is one of `live_forecast`, `live_historical`, `live_geocoding`,
`cached`, or `demo_fallback`. A `null` dimension means the provider data was
unavailable and the dimension was **excluded** from scoring, not scored as zero.

### Scenarios

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/businesses/:id/scenarios` | List saved scenarios |
| POST | `/api/businesses/:id/scenarios` | Run a scenario (also saves it) |
| GET | `/api/scenarios/:id` | Retrieve one |
| DELETE | `/api/scenarios/:id` | Delete |

```bash
curl -s -X POST http://localhost:5000/api/businesses/biz_xxx/scenarios \
  -H 'Content-Type: application/json' -d '{
    "name": "Monsoon disruption",
    "annualNetRevenue": 5000000,
    "annualFixedCost": 3800000,
    "monthlyOperatingCost": 300000,
    "disruptionDays": 12,
    "revenueDisruptionPct": 0.5,
    "backupSupplier": false,
    "emergencyReserve": true,
    "resilienceInvestment": 150000
  }'
```

Response includes `result` (breakdown, `totalAnnualImpact`, `fundingGap`,
`incomeReductionPct`), `limitations`, and a `disclaimer` stating the output is a
hypothetical scenario. Missing `annualNetRevenue`, `annualFixedCost` or
`monthlyOperatingCost` return `400` instead of an invented impact.

Defaults when omitted: `revenueDisruptionPct` 0.5, `resilienceAmortisationYears` 5.
Mitigation assumptions are centralised in `config.scenario`
(`backupMitigationPct` 0.4, `emergencyReserveCoverPct` 0.5, `reserveCoverMonths` 6).

### Schemes

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/schemes` | List (query: `category`, `governmentLevel`, `state`, `industry`, `supportType`, `verificationStatus`, `search`, `limit`, `offset`) |
| GET | `/api/schemes/:id` | Scheme detail |
| GET | `/api/schemes/saved` | Schemes saved by the current owner |
| POST | `/api/schemes/:id/save` | Save / track preparation (`prepStatus`, `notes`) |
| DELETE | `/api/schemes/:id/save` | Unsave |
| GET | `/api/businesses/:id/scheme-matches` | Match the catalogue against a business |

`GET /api/schemes?governmentLevel=state&industry=manufacturing`:

```json
{
  "success": true,
  "data": {
    "schemes": [
      {
        "id": "sch_mh_industries_policy",
        "name": "Maharashtra Industries, Investment and Services Policy 2025",
        "category": "state_incentives",
        "governmentLevel": "state",
        "eligibleStates": ["Maharashtra"],
        "industries": [],
        "businessStages": ["startup", "growth", "established"],
        "businessSizes": ["micro", "small", "medium"],
        "eligibilityCriteria": ["…"],
        "supportType": "state_industrial_incentive",
        "requiredDocuments": ["…"],
        "officialSourceUrl": "https://industry.maharashtra.gov.in/en",
        "applicationUrl": null,
        "verificationStatus": "partially_verified",
        "lastVerifiedDate": "2026-10-09"
      }
    ],
    "pagination": { "total": 4, "limit": 50, "offset": 0 },
    "disclaimer": "Climora does not perform live eligibility verification …"
  }
}
```

`GET /api/businesses/:id/scheme-matches` returns `results`, `counts`
(`total`, `potentiallyEligible`, `insufficientInformation`, `ineligible`) and the
catalogue `disclaimer`. Each result carries:

- `matchStatus`: `potentially_eligible` | `insufficient_information` | `ineligible`
- `checks`: the four stored rules Climora can actually evaluate
  (state, industry, business stage, business size) with `pass`/`fail`/`unknown`
- `matchedCriteria`, `unverifiedCriteria`, `missingInformation`,
  `documentsToPrepare`

Climora performs **no live eligibility verification**. `verificationStatus` only
records whether the scheme's existence, sponsoring authority and official URL
were confirmed against public sources at catalogue build time.

### Loan readiness & improvements

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/businesses/:id/loan-readiness` | Readiness view with document checklist and suggestions |
| PUT | `/api/businesses/:id/loan-readiness` | Update application status / lender-provided fields |
| PATCH | `/api/businesses/:id/loan-readiness/documents/:documentName` | Set a checklist item to `missing` \| `in_progress` \| `ready` |
| GET | `/api/businesses/:id/improvements` | List improvement actions |
| POST | `/api/businesses/:id/improvements` | Regenerate engine actions |
| PATCH | `/api/businesses/:id/improvements/:actionId` | Set `open` \| `in_progress` \| `done` \| `not_applicable` |

```bash
curl -s -X PUT http://localhost:5000/api/businesses/biz_xxx/loan-readiness \
  -H 'Content-Type: application/json' \
  -d '{"applicationStatus":"preparing","lenderFeedback":"Bank asked for 6 months of statements"}'
```

The response separates `lenderConfirmed` (entered by the user or supplied by the
lender) from `climoraSuggestions`, and states explicitly that document completion
is **not** a credit decision and that a business is never rejected solely on its
climate score.

### Dashboard

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/dashboard` | Portfolio metrics computed from stored records |

```json
{
  "success": true,
  "data": {
    "metrics": {
      "portfolioSize": 4,
      "assessedBusinesses": 4,
      "unassessedBusinesses": 0,
      "averageRiskScore": 48,
      "highRiskBusinesses": 0,
      "highRiskPct": 0,
      "categoryDistribution": { "Low": 0, "Moderate": 4, "High": 0, "Very High": 0 },
      "industryDistribution": { "Food Processing": 2, "Manufacturing": 1, "Agriculture": 1 },
      "incompleteAssessments": 4,
      "totalAssessments": 4,
      "assessmentsLast30Days": 4,
      "savedSchemes": 0,
      "scenarioCount": 0,
      "openImprovementActions": 16,
      "loanReadinessRecords": 0,
      "latestAssessmentByBusiness": [ … ]
    },
    "generatedAt": "2026-10-09T13:40:00.000Z",
    "disclaimer": "Metrics are computed from records stored in this Climora instance …"
  }
}
```

---

## Multi-tenancy / Authentication

The frontend has no login, so no authentication system was added — the MVP is
single-tenant. Every table still carries an `owner_id` (default `local`) that is
honoured by every query, and the request header `X-Climora-Owner` selects the
scope. Passing another value for a record created under `local` returns `404`
(not `403`) so record existence is not leaked. If accounts are added later,
only the header resolution and password handling need to change; the schema
already supports it.

To verify the isolation behaviour:

```bash
curl -s -H 'X-Climora-Owner: someoneelse' http://localhost:5000/api/businesses/biz_xxx   # 404
```

---

## Consistent errors

| Situation | Status | Body |
| --- | --- | --- |
| Invalid body field | 400 | `error.details` lists every problem |
| Missing coordinates on assess | 400 | explains how to fix it |
| Unknown record | 404 | generic “not found”, never “exists but not yours” |
| Unknown route | 404 | `error.code = "NOT_FOUND"` |
| Climate provider down | 200 | affected dimensions reported `missing` with warnings |
| Geocoding provider down | 503 | labelled provider message |
| Unhandled error | 500 | `"Internal server error"` — no stack traces, no SQL errors |

---

## Testing

```bash
cd backend
npm test          # 41 tests, no network access required
```

The climate HTTP client is injectable, so the suite swaps in a fixture-based
stub instead of calling Open-Meteo. Covered: health, business CRUD and
validation, risk-scoring maths and missing-data handling, assessment structure
and determinism, provider failure and demo labelling, scenario determinism and
input rejection, scheme listing/filtering/matching including ineligible and
insufficient-information cases, loan readiness, improvements, dashboard metrics,
validation errors, oversized bodies, 404s, persistence across a reconnect,
foreign-key enforcement and cascade deletes, and seed idempotency.

The build also enforces Open-Meteo's CC BY 4.0 attribution; every climate
response carries the attribution string.
