# Climora backend

Express 5 + SQLite API for the Climora frontend. See [`API.md`](./API.md) for
the endpoint contract and [`../RISK_SCORING.md`](../RISK_SCORING.md) for the
scoring methodology.

## Requirements

- Node.js **22.5+** (uses the built-in `node:sqlite` module, so there is no
  native build step and no extra database dependency)
- No API keys are required for the Open-Meteo free tier

## Install and run

```bash
cd backend
npm install
cp .env.example .env     # placeholders only; never commit real values
npm run dev              # nodemon, http://localhost:5000
# or
npm start                # plain node
```

The database file is created at `./data/climora.db` on first start. Schema
initialisation is idempotent and **never deletes existing rows**. When
`SEED_DEMO_DATA=true` and the tables are empty, it inserts the government-scheme
catalogue plus four clearly-labelled demo businesses and one labelled demo
assessment each.

## Test

```bash
cd backend
npm test          # 41 tests, network-independent
npm run test:verbose
```

## Useful commands

```bash
curl -s http://localhost:5000/api/health
curl -s "http://localhost:5000/api/businesses?limit=5"
curl -s "http://localhost:5000/api/schemes?governmentLevel=state"
curl -s -X POST http://localhost:5000/api/businesses/<id>/assessments
curl -s "http://localhost:5000/api/dashboard"
```

## Structure

```
backend/
├── API.md                     endpoint contract
├── .env.example               placeholders only
└── src/
    ├── app.js                 Express app factory (cors, limits, routes, error handler)
    ├── server.js              entry point: init db, seed, listen
    ├── config/index.js        env + centralised risk/scenario/business configuration
    ├── db/
    │   ├── index.js           SQLite open, schema, idempotent migration, param sanitiser
    │   └── seed.js            clearly-labelled demo schemes/businesses
    ├── routes/index.js        route table + body validation
    ├── controllers/           request/response shaping only
    ├── services/              business logic (risk, climate, assessment, scenario, schemes, loan, dashboard)
    ├── repositories/          all SQL, parameterised, scoped by owner
    ├── validators/            dependency-free request validation
    ├── middleware/            async handler, error handler, 404 handler
    ├── data/schemeCatalogue.js  verified scheme catalogue
    └── tests/api.test.js      node:test suite
```

## Data and honesty rules the code enforces

- **Missing data is never zero risk.** A dimension with no provider data is
  returned as `null`, excluded from the score, and the remaining dimensions are
  proportionally reweighted. `isIncomplete` is then set.
- **No fabricated climate data.** Demo values are only produced when a request
  explicitly passes `forceDemo: true`; every demo field is labelled `demo`.
- **River discharge is a hazard proxy.** The flood dimension compares the
  forecast peak daily discharge with the trailing 12-month maximum. It is not a
  flood probability and not a measurement of risk to a specific business.
- **No live eligibility verification for schemes.** `verificationStatus` only
  records whether the scheme, authority and official URL were confirmed against
  public sources at catalogue build time.
- **No guarantee of loan approval**, and no automatic rejection from the
  climate score.
