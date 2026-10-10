# Access Model

This document describes how users authenticate and what each user can see in Climora.

## Surfaces

| Surface | Route / entry | Purpose |
| --- | --- | --- |
| Login | Frontend auth screen (see `src/`) | Choose/wallet of identity; resolves the user's role |
| Register | Frontend auth screen (see `src/`) | Create a new account; assigned a role (Lender or MSME Owner) |
| Lender workspace | Workspace role `lender` | Portfolio-wide underwriting view (`src/components/lender/LenderDashboard.tsx`) |
| MSME Owner workspace | Workspace role `msme_owner` | Single-owner view of the profiles the user owns (`src/components/owner/MSMEOwnerDashboard.tsx`) |
| Command Center | Workspace role `command_center`, **password-gated** | See [`COMMAND_CENTER.md`](./COMMAND_CENTER.md) |

## Workspace isolation

- Each account resolves to **one role**, and the app renders **only that role's workspace**. A signed-in MSME
  Owner never sees the lender portfolio, and a lender never sees an owner-only profile workspace.
- **MSME Owners** see only the enterprise profiles they own — a single active profile plus their own profile
  library, with editing limited to their records.
- **Lenders** see the portfolio view: all enterprises in the portfolio with risk, DSCR, exposure, and covenant
  status, and can switch the active profile under review.
- The active workspace is persisted (`localStorage` key `climora_user_role_v1` via `src/core/storage.ts`) and
  restored on reload; profiles and completed actions persist under `climora_profiles_v1` / `climora_active_profile_id_v1`
  / `climora_completed_actions_v1`.
- **Logout** clears the session and returns to the login/register screen; a fresh login is required to re-enter a
  workspace.

## Command Center access (separate flow)

The Command Center is **not** reachable by role alone — it has its own password prompt:

| Setting | Value |
| --- | --- |
| Default password | `climora@2026` |
| Override | `VITE_COMMAND_CENTER_PASSWORD`, inlined at **build time** by Vite |
| Session persistence | `sessionStorage` — unlock lasts until the tab is closed |
| Where configured | Command Center access gate in `src/` (frontend-owned); variable documented in `.env.example` |

## Security note

This is a **demo-grade, client-side authentication model**, not production-hardened:

- Identity, role, and the Command Center unlock live in browser storage (`localStorage` / `sessionStorage`) and are
  verifiable only in the browser bundle; the Command Center password is compiled into the client.
- The backend exposes **no authentication or authorization endpoints** — `server/src/routes/index.ts` registers only
  health/dashboard, businesses, assessments, climate, scenarios, and schemes routes under `/api` (no login, register,
  token, or session routes exist).
- Do not treat any Climora session as a security boundary. Production use would require server-issued tokens,
  hashed credentials, role checks enforced server-side, and the Command Center gate moved off the client.
