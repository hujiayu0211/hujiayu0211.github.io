// POST /api/track
// Records one visit using Cloudflare's built-in geo info on the request.
// Privacy: stores only city-level rounded coordinates + country/city.
//          No IP address is ever written to the database.

export async function onRequestPost(context) {
  const { request, env } = context;
  const cf = request.cf || {};

  let lat = parseFloat(cf.latitude);
  let lon = parseFloat(cf.longitude);

  // No geo available (rare, or local dev) — accept silently, store nothing.
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return Response.json({ ok: true, stored: false, reason: "no-geo" });
  }

  // Round to ~1 decimal (~11 km) so we never keep precise coordinates.
  lat = Math.round(lat * 10) / 10;
  lon = Math.round(lon * 10) / 10;

  const country = cf.country || null;       // ISO code, e.g. "AU"
  const countryName = cf.country || null;   // Cloudflare gives the code; name resolved client-side if desired
  const city = cf.city || null;

  try {
    await env.DB
      .prepare(
        "INSERT INTO visits (country, city, lat, lon) VALUES (?, ?, ?, ?)"
      )
      .bind(country, city, lat, lon)
      .run();
  } catch (e) {
    return Response.json({ ok: false, reason: "db-error" }, { status: 500 });
  }

  return Response.json({ ok: true, stored: true, country, city });
}

// Anything other than POST: simple 405.
export async function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return new Response("Method Not Allowed", { status: 405 });
}
