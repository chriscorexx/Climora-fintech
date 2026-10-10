# website/ — Hosted Web App (Static Build)

This directory contains the **production build of the Climora web application** — the exact code
that gets hosted (e.g. on Render). It is a plain static site: `index.html` + hashed JS/CSS assets

- the Climora logo. No server, no database, and no build step is required to serve it.

## What is here

| Path               | Contents                                                              |
| ------------------ | --------------------------------------------------------------------- |
| `index.html`       | App entry (Vite-generated, relative asset paths)                      |
| `assets/`          | Hashed JS/CSS chunks (React app, lazy-loaded dashboards, charts, map) |
| `Climora-logo.jpg` | Brand asset referenced by the entry HTML                              |

## How it is produced

```bash
npm run build:website
```

That runs the normal production build (`tsc && vite build`) and copies the output from `dist/`
into this folder. Re-run it whenever the app changes and you want to refresh the hosted copy.

## Hosting it

- **Render Static Site**: point the publish directory at `website` (or at `dist` and let your host
  run the build — see the Deployment section of the root README for both options).
- **Any static host** (Netlify, Cloudflare Pages, GitHub Pages, S3, nginx): serve this folder as-is.
- Add the SPA fallback rewrite (`/*` → `/index.html`) — this is included as `_redirects` for hosts
  that read it, and is a one-line setting in the Render dashboard.

## Runtime notes

- All application state (logins, profiles, assessments) lives in the visitor's browser
  (`localStorage`); the hosted site is fully functional without the Express backend.
- The Express server in `server/` is optional extras only (shared SQLite persistence) and is not
  required for the hosted website.
- The hosted site shows the public **landing page** first; the desktop app intentionally does not.
