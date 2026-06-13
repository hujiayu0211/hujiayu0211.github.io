# Deploying the "Hello, World" Visitor Globe

This guide moves your site to **Cloudflare Pages** and wires up the live visitor
globe. Your GitHub repo stays as-is — Cloudflare just connects to it and builds
from it. Everything below is free-tier.

You'll do this once. Total time: ~20–30 minutes.

---

## What the pieces are

| File | Role |
|---|---|
| `hello-world.html` | The page with the 3D globe + stats |
| `functions/api/track.js` | Runs on the server; records each visit |
| `functions/api/visitors.js` | Runs on the server; returns globe data |
| `schema.sql` | Creates the database table |
| `wrangler.toml` | Tells Cloudflare the database binding is called `DB` |

The `functions/` folder is special: Cloudflare Pages automatically turns
`functions/api/track.js` into the URL `/api/track`, and
`functions/api/visitors.js` into `/api/visitors`. You don't configure routes.

---

## Step 1 — Push these files to your GitHub repo

Add and commit the new files to the repo that hosts your site:

```
index.html
news.html
publications.html
projects.html
hello-world.html
functions/api/track.js
functions/api/visitors.js
schema.sql
wrangler.toml
```

(Plus your existing assets/ folder etc.)

---

## Step 2 — Create a Cloudflare account & connect the repo

1. Sign up / log in at https://dash.cloudflare.com
2. Left sidebar → **Workers & Pages** → **Create** → **Pages** tab →
   **Connect to Git**.
3. Authorise GitHub and pick your site repo.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty)
   - **Build output directory:** `/`  (your HTML is at the repo root)
5. Click **Save and Deploy**. After a minute you'll get a URL like
   `your-site.pages.dev`. The static pages already work; the globe is empty
   until we add the database (next steps).

---

## Step 3 — Create the D1 database

You can do this entirely in the dashboard:

1. **Workers & Pages** → **D1 SQL Database** → **Create database**.
2. Name it exactly: **`visitor-globe`**
3. Open the new database → **Console** tab → paste the entire contents of
   `schema.sql` → **Execute**. This creates the `visits` table.

> Prefer the command line? Install Wrangler (`npm i -g wrangler`), then:
> ```
> wrangler d1 create visitor-globe
> wrangler d1 execute visitor-globe --remote --file=./schema.sql
> ```

---

## Step 4 — Bind the database to your Pages project

This is the step people forget — without it, `env.DB` is undefined.

1. **Workers & Pages** → your Pages project → **Settings** → **Bindings**
   (older UI: *Settings → Functions → D1 database bindings*).
2. **Add binding → D1 database**:
   - **Variable name:** `DB`  ← must be exactly this
   - **D1 database:** `visitor-globe`
3. Save. Add it for **Production** (and Preview too, if you want the globe to
   work on preview deploys).

> If you filled `database_id` in `wrangler.toml`, that also works — get the id
> from the D1 database's overview page and paste it in. Dashboard binding is
> simpler; you only need one of the two.

---

## Step 5 — Redeploy & test

1. Trigger a fresh deploy: **Deployments** → **Retry deployment**, or just push
   any commit.
2. Open `your-site.pages.dev/hello-world.html`.
3. You should see the dark globe spin up. Your own visit gets recorded, so
   after a refresh the stats should show **1 visit**, **1 country**, and a green
   point should appear at roughly your city.

To check the API directly: open `your-site.pages.dev/api/visitors` — you should
see JSON like `{"ok":true,"points":[...],"total":1,...}`.

---

## Step 6 (optional) — Custom domain

If you have your own domain (or want to keep using a github.io address is *not*
possible here — Pages serves its own domain), add it under
**Custom domains** in the Pages project. Cloudflare issues HTTPS automatically.

---

## Local testing (optional, for tinkering)

```
npm i -g wrangler
wrangler pages dev . --d1 DB=visitor-globe
```

Then open the printed `localhost` URL. Note: on localhost there's no real geo
info, so `track` will store nothing — that's expected. It'll work once deployed.

---

## How privacy is handled (for your own reference / a privacy page)

- The server reads Cloudflare's approximate geo for each request and **rounds
  coordinates to ~11 km** before storing.
- **IP addresses are never written to the database** — look at `track.js`,
  there is no `ip` column and no IP is inserted.
- Stored fields: country code, city name, rounded lat/lon, timestamp.
- Data is used only to draw the globe. The page already states this in its
  footer note; if you have EU visitors and want to be thorough, you can link
  that note to a fuller privacy page.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Globe shows but stats stay `0` / `Be the first` | DB binding missing or named something other than `DB` (Step 4) |
| `/api/visitors` returns `{"ok":false,"reason":"db-error"}` | Table not created — re-run `schema.sql` (Step 3) |
| Globe never appears, says "could not be loaded" | `globe.gl` CDN blocked; check the network tab |
| No point at your location | Local/VPN IP with no geo, or your city rounds onto an existing point |
| Works on `.pages.dev` but not old github.io | Expected — the API only exists on Cloudflare; the github.io copy can't run functions |

---

## Adding dwell time later (v2)

When you're ready, we add: a session id generated on load, a second
`/api/track` call on `visibilitychange`/`beforeunload` carrying the elapsed
seconds, and an `UPDATE` (instead of insert) keyed by session id. The globe
code doesn't change; only an extra stat appears. Ping me when you want it.
