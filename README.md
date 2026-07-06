# Personal Academic Homepage

Source for my personal website, live at **[www.jiayuhu.com](https://www.jiayuhu.com)**. It serves as the front door to my research in quantitative finance, ESG, and conservation analytics, and doubles as a small end-to-end project in its own right: a privacy-first **visitor globe** backed by a serverless API and a database, deployed on Cloudflare Pages.

The static pages are a standard academic homepage (about, projects, publications, news). The part worth reading the code for is `hello-world.html` and the `functions/` directory, where each visit is recorded and rendered as a live point on a 3D globe without ever storing a visitor's IP address.

## The visitor globe

When a page loads, a lightweight tracker posts once per browser session to `/api/track`. The endpoint reads Cloudflare's edge geolocation for the request, rounds the coordinates, and writes a single row to a Cloudflare D1 (SQLite) database. The globe page then calls `/api/visitors`, which returns visits aggregated by location, and plots them on an interactive 3D globe.

**Privacy was the first design constraint, not an afterthought.** The concrete choices:

- **No IP is ever stored.** The `visits` table has no IP column by design. Location comes from Cloudflare's request metadata and only city-level fields are kept.
- **Coordinates are rounded to roughly 11 km** (one decimal place) before they touch the database, so no precise location is retained.
- **One record per session.** A `sessionStorage` flag means opening several pages in one visit still counts once.
- **Edge caching** on the read endpoint (30 seconds) keeps the database from being hit on every page load.

## Tech stack

- **Frontend:** static HTML, CSS, and vanilla JavaScript; the visitor map is rendered with [globe.gl](https://github.com/vasturiano/globe.gl) (built on three.js and three-globe)
- **Backend:** Cloudflare Pages Functions (`functions/api/track.js`, `functions/api/visitors.js`)
- **Database:** Cloudflare D1 (serverless SQLite), schema in `schema.sql`
- **Hosting:** Cloudflare Pages with a custom domain (`wrangler.toml`)

## Repository structure

```
index.html              Home / about
projects.html           Research projects
publications.html       Publications
news.html               News and updates
live-my-life.html       Personal page
hello-world.html        Interactive visitor globe
visit-tracker.js        Per-session visit tracker (client)
functions/api/
  track.js              POST /api/track    records one visit
  visitors.js           GET  /api/visitors returns aggregated points
schema.sql              D1 table and indexes
wrangler.toml           Cloudflare Pages / D1 configuration
DEPLOY-visitor-globe.md Deployment guide
assets/                 Logos, papers, photos
```

## Running the globe locally

The static pages open directly in a browser. The visitor globe needs the Cloudflare toolchain, since it depends on Pages Functions and a D1 binding:

```bash
npm install -g wrangler
wrangler d1 create visitor-globe        # paste the returned database_id into wrangler.toml
wrangler d1 execute visitor-globe --file schema.sql
wrangler pages dev .
```

In `wrangler.toml`, replace the `database_id` value with your own (shown as a placeholder in this repo). Full setup, including binding D1 from the Pages dashboard, is in `DEPLOY-visitor-globe.md`.

## Known limitations

- Edge geolocation is approximate and occasionally missing; when it is unavailable the visit is accepted but nothing is stored.
- Visit counting is per browser session, so it is a rough indicator of reach rather than a precise unique-visitor metric.
- Country is stored as an ISO code; the human-readable name is resolved on the client.

## Contact

**Jiayu Hu**
Email: hujiayu211@gmail.com
GitHub: [hujiayu0211](https://github.com/hujiayu0211)
