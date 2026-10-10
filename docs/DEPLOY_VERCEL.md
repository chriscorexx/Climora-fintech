# Deploying Climora to Vercel (Manual, Step by Step)

**Production deployment: [https://climora-fintech.vercel.app](https://climora-fintech.vercel.app)**

This guide deploys the **Climora web app** to [Vercel](https://vercel.com) from the `main` branch of
this repository. The repo ships a `vercel.json`, so a fresh import needs **no special settings** —
Vercel reads the build command, output directory, SPA rewrites and asset caching from it.

The hosted site is fully functional on its own: register/login, enterprise profiles, risk scoring,
the stress simulator, scheme matching and the credit memo all run in the browser. The Express
backend in `server/` is **optional** and not required.

---

## Option A — Import from GitHub (recommended)

1. **Vercel Dashboard → Add New… → Project** and import `chriscorexx/Climora-fintech`.
2. Vercel auto-detects **Vite**. Confirm these values (they also come from `vercel.json`):

   | Field            | Value                       |
   | ---------------- | --------------------------- |
   | Framework Preset | Vite                        |
   | Build Command    | `npm run build`             |
   | Output Directory | `dist`                      |
   | Install Command  | `npm install` (or `npm ci`) |

3. **Environment Variables** (optional but recommended):

   | Key                            | Value         | Notes                                                    |
   | ------------------------------ | ------------- | -------------------------------------------------------- |
   | `VITE_COMMAND_CENTER_PASSWORD` | your password | Command Center gate; defaults to `climora@2026` if unset |

4. Click **Deploy**. Vercel runs `npm install` + `npm run build` and publishes to
   <https://climora-fintech.vercel.app> (the project's production domain).
5. Every later push to `main` (and every pull request) triggers a new deployment automatically —
   PRs get preview URLs.

---

## Option B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod          # preview deploys: vercel
```

The CLI uses the same `vercel.json` settings.

---

## Deploying the prebuilt site (no build)

The repo also contains `website/` — the production build, ready to serve. You can drag-and-drop
that folder at **vercel.com/new** (or host it on any static provider). Its `_redirects` file covers
the SPA fallback on hosts that read it; for Vercel the rewrite already comes from `vercel.json`.

---

## What `vercel.json` configures

| Setting           | Value                              | Why                                                         |
| ----------------- | ---------------------------------- | ----------------------------------------------------------- |
| `buildCommand`    | `npm run build`                    | Typecheck + Vite production build                           |
| `outputDirectory` | `dist`                             | Vite's build output (relative asset paths via `base: './'`) |
| `rewrites`        | `/(.*)` → `/index.html`            | SPA fallback so refreshing an in-app view never 404s        |
| `headers`         | `assets/*` immutable, 1-year cache | Hashed bundles cached forever; `index.html` stays fresh     |

---

## Post-deploy checklist

- [ ] Landing page loads and **Launch App** reaches the login screen.
- [ ] Register a **Lender** and an **MSME Owner** — each lands only in their own workspace.
- [ ] Theme switcher (light / dark / system) works.
- [ ] Command Center asks for the password you configured.
- [ ] Refresh on an in-app view does **not** 404 (SPA rewrite working).
- [ ] Live climate data loads (Open-Meteo is called from the browser; no API key needed).

## Troubleshooting

| Symptom                                     | Cause / Fix                                                                                                                                          |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Refresh on an in-app view returns 404       | SPA rewrite missing — keep `vercel.json`'s `rewrites` entry (or add a Rewrite rule `/(.*)` → `/index.html` in project settings)                      |
| Blank page                                  | Don't change `base: './'` in `vite.config.ts` — relative asset paths are required for the file-based hosts and keep deploys portable                 |
| Command Center rejects the correct password | `VITE_*` vars are inlined **at build time** — set the var, then **redeploy** (Deployments → ⋯ → Redeploy)                                            |
| "Data disappears between devices"           | Data lives in the visitor's browser `localStorage` — expected for the static deployment. Add the optional API backend if you need shared persistence |
| Build fails on `tsc`                        | Ensure you deploy `main` (older branches carried a removed `baseUrl` compiler option)                                                                |

## Node version

The build runs on Vercel's default Node runtime (22). There is no `engines` pin; Node 18+ works.
If you pin a version later, add an `engines` field to `package.json`.

## Optional API backend on Vercel

Not required for the web app. If you want shared persistence, deploy the Express service separately
(Render/Railway/Fly) and set `VITE_API_BASE_URL` on the Vercel project to its `/api` base URL, then
redeploy — the client already falls back to local-only operation whenever the API is unreachable.
