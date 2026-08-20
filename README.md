# PCOM Bonus Model

Live dashboard for the PCOM media buying team's monthly performance bonus.

## URLs

- Production: *(add after deploying to Vercel)*
- Explainer guide: *(production URL)*/explainer

## User credentials

| Role | Username | Password |
|------|----------|----------|
| Manager | manager | pcom-admin |
| Team Leader | enri | enri2026 |
| MB · Stella | stella | stella2026 |
| MB · Anxhela | anxhela | anxhela2026 |
| MB · Kasandra | kasandra | kasandra2026 |
| MB · Semi | semi | semi2026 |
| MB · Suela | suela | suela2026 |

⚠️ Distribute passwords privately. Do not share the production URL publicly.

---

## First-time setup: Vercel KV (shared database)

The app needs a shared database so all team members see the same data.
Follow these steps **once**, right after deploying to Vercel.

### Step 1 — Enable Vercel KV storage

1. Open your project in the [Vercel dashboard](https://vercel.com/dashboard)
2. Click the **Storage** tab at the top
3. Click **Create Database** → choose **KV (Redis)**
4. Name it anything (e.g. `pcom-kv`) and click **Create**
5. On the next screen, click **Connect to Project** and select your project
6. Vercel automatically adds two environment variables to your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

### Step 2 — Redeploy so the variables take effect

1. Go to the **Deployments** tab in your Vercel project
2. Click the three-dot menu on the latest deployment → **Redeploy**
3. Wait for it to go green ✓

### Step 3 — Seed the initial state

The database is empty on first use. Login as **manager**, enter your numbers, then press **Publish to Team**. That writes both the draft state and the published snapshot to the database. All team members will now load from the shared database on login.

---

## How to update the app

Make your edits to `index.html` or `explainer.html`, then push to GitHub. Vercel auto-deploys on every push.

If you update `api/state.js` or `api/published.js` (e.g. to rotate passwords), redeploy as described in Step 2 above.

## How to rotate passwords

1. Open `index.html`, find the `USERS` object near the top of the `<script>` block
2. Update password values
3. **Also update** the matching `USERS` object in `api/state.js` and `api/published.js`
4. Push to GitHub and redeploy
5. Old passwords are immediately invalid on the next deploy

## How to backup state

In the dashboard, login as manager and click **Export JSON**. This downloads the entire state (projects, baselines, MBs, pool config). Store the file safely.

To restore: click **Import JSON** and select the backup file, then press **Publish to Team** to push it to the shared database.

## How to add a new media buyer

1. Add an entry to the `USERS` object in `index.html`, `api/state.js`, and `api/published.js`
2. Add a default entry to `DEFAULT_MBS` in `index.html` (or have the manager add via the UI)
3. Push and redeploy

## Architecture notes

- Single-page HTML app, no build step
- Two Vercel serverless functions handle shared state:
  - `GET /api/state` — any logged-in user can read the draft
  - `PUT /api/state` — manager only; saves draft to Vercel KV
  - `GET /api/published` — any logged-in user can read the published snapshot
  - `PUT /api/published` — manager only; triggered by "Publish to Team"
- Auth: `X-Auth-Token` header (value = user's password)
- Vercel KV keys: `pcom:state` (draft) and `pcom:published` (team snapshot)
- Fallback: if API is unreachable, the app shows `localStorage` cached data
- Manager must press **"Publish to Team"** for changes to become visible to MBs/TL

## File structure

```
index.html        — Main dashboard (login, manager view, MB view, TL view)
explainer.html    — Team-facing bonus guide (static, no login needed)
api/
  state.js        — Serverless function: draft state (GET/PUT)
  published.js    — Serverless function: published snapshot (GET/PUT)
package.json      — Declares ESM + Node ≥18 (no npm dependencies)
vercel.json       — Vercel deployment config
.gitignore        — Git ignore rules
README.md         — This file
```

## License

Internal — PCOM only. Not for redistribution.
