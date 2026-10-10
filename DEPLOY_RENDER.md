# Deploying Climora to Render (Manual, Step by Step)

This guide deploys the **Climora web app** to [Render](https://render.com) as a static site.
Two routes are covered:

- **Option A — Deploy from the GitHub repo (recommended):** Render builds and serves the site, with
  auto-deploys on every push. Nothing to upload by hand.
- **Option B — Upload the prebuilt `website/` folder:** no build on Render's side.

The hosted site is fully functional on its own: logins, enterprise profiles, risk scoring, stress
simulation, scheme matching and the credit memo all run in the browser. The Express backend in
`server/` is optional and **not required** for the hosted website.

---

## Before you start

1. Push the current code to GitHub (branch `More-Happening` is what the configs in this repo expect).
2. A Render account (free tier is fine).
3. Know what you want the **Command Center password** to be (default `climora@2026` — set your own
   via the `VITE_COMMAND_CENTER_PASSWORD` environment variable below).

---

## Option A — Static Site from the repo (recommended)

1. **Render Dashboard → New + → Static Site** (or **Blueprint** if you want to use `render.yaml`).
2. **Connect the repository** `chriscorexx/Climora-fintech` (grant Render access if asked).
3. **Configure the build:**

   | Field             | Value                       |
   | ----------------- | --------------------------- |
   | Name              | `climora-web` (or any name) |
   | Branch            | `More-Happening`            |
   | Build Command     | `npm ci && npm run build`   |
   | Publish Directory | `dist`                      |

4. **Environment variables** (optional but recommended):

   | Key                            | Value         | Notes                                                         |
   | ------------------------------ | ------------- | ------------------------------------------------------------- |
   | `VITE_COMMAND_CENTER_PASSWORD` | your password | Command Center gate; if unset, the documented default applies |

5. **SPA rewrite rule** (required, otherwise deep links 404):
   - Render Dashboard → your site → **Redirects/Rewrites** → Add Rule
   - Source: `/*` → Destination: `/index.html` → Action: **Rewrite**
   - (If you used the Blueprint/`render.yaml` route this rule is already defined.)

6. Click **Create Static Site**. Render installs dependencies, runs the build, and publishes.
   First deploy takes a few minutes.
7. Open the generated `https://<name>.onrender.com` URL — you should see the **landing page**
   (the landing page is intentionally browser-only; the desktop app skips it).

### Using `render.yaml` (Blueprint) instead

The repo includes `render.yaml`. Choose **New + → Blueprint → connect repo** and Render reads it
directly — it defines the same build command, publish directory (`dist`), SPA rewrite, immutable
asset caching, and the `VITE_COMMAND_CENTER_PASSWORD` variable (you set the value at deploy time).

---

## Option B — Upload the prebuilt `website/` folder

The repo contains `website/` — the ready-to-serve static build (regenerate any time with
`npm run build:website`).

- **Render Static Site with upload:** create a Static Site and choose **upload/deploy without a
  repo**, then upload the contents of `website/`.
- **Any static host** works too (Netlify, Cloudflare Pages, GitHub Pages, nginx, S3):
  the folder contains `index.html`, `assets/`, and `Climora-logo.jpg`.
- Keep the SPA fallback (`/*` → `/index.html`) everywhere; the `_redirects` file inside `website/`
  does this automatically on hosts that read it (Netlify/Cloudflare Pages).

---

## Post-deploy checklist

- [ ] Landing page loads and **Launch App** reaches the login page.
- [ ] Register a lender and an MSME owner — each lands in **their own workspace only**.
- [ ] Theme switcher (light / dark / system) works.
- [ ] Command Center prompts for the password you configured.
- [ ] A deep link refresh (e.g. on any in-app view) does **not** 404 — rewrite rule working.
- [ ] Climate data loads (Open-Meteo is called directly from the browser; no key needed).

## Troubleshooting

| Symptom                                     | Cause / Fix                                                                                                                              |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Blank page after deploy                     | Asset paths — the build uses relative paths (`base: './'` in `vite.config.ts`). Don't change it; re-run `npm run build`.                 |
| Refresh on an in-app view returns 404       | SPA rewrite rule missing — add `/*` → `/index.html` (Rewrite).                                                                           |
| "Command Center" rejects the right password | `VITE_COMMAND_CENTER_PASSWORD` was set after build — **redeploy** (env vars are inlined at build time).                                  |
| Sites says "login page instead of landing"  | You're inside the desktop app or the login page is expected after logout — landing shows only for unauthenticated browsers.              |
| Data "disappears" between devices           | Data is stored per-browser in `localStorage` — expected for the static deployment. The optional backend (below) adds shared persistence. |

---

## Optional: run the optional Express backend on Render

Only needed if you want shared persistence (SQLite). Render's filesystem is ephemeral, so this
needs a **paid instance with a persistent disk**, otherwise the database resets on redeploy.

1. **New + → Web Service**, same repo/branch.
2. Build Command: `npm ci` · Start Command: `npm run server` · Instance: any (paid recommended).
3. Add a **Disk** mounted at `/opt/render/project/src/data` and set `DATABASE_PATH` to the SQLite
   file path on that disk (the server reads `DATABASE_PATH` from env, default `data/climora.db`).
4. Set `VITE_API_BASE_URL` on the **static site** to the Web Service URL + `/api`
   (e.g. `https://climora-api.onrender.com/api`), then redeploy the static site.
5. The client already falls back to local-only operation whenever the API is unreachable, so the
   site keeps working if the backend sleeps.
