// GET /api/visitors
// Returns aggregated visitor data for the globe:
//   points:    [{ lat, lon, country, city, count }]  (grouped by location)
//   total:     total number of visits
//   countries: distinct country count
//   recent:    most recent visit { city, country, created_at }

export async function onRequestGet(context) {
  const { env } = context;

  try {
    const pointsRes = await env.DB
      .prepare(
        `SELECT lat, lon,
                MAX(country) AS country,
                MAX(city)    AS city,
                COUNT(*)     AS count
         FROM visits
         GROUP BY lat, lon
         ORDER BY count DESC
         LIMIT 5000`
      )
      .all();

    const totalRow = await env.DB
      .prepare("SELECT COUNT(*) AS total FROM visits")
      .first();

    const countriesRow = await env.DB
      .prepare("SELECT COUNT(DISTINCT country) AS countries FROM visits WHERE country IS NOT NULL")
      .first();

    const recentRow = await env.DB
      .prepare("SELECT city, country, created_at FROM visits ORDER BY id DESC LIMIT 1")
      .first();

    return Response.json(
      {
        ok: true,
        points: pointsRes.results || [],
        total: (totalRow && totalRow.total) || 0,
        countries: (countriesRow && countriesRow.countries) || 0,
        recent: recentRow || null,
      },
      {
        headers: {
          // Cache briefly at the edge so the DB isn't hit on every page load.
          "Cache-Control": "public, max-age=30",
        },
      }
    );
  } catch (e) {
    return Response.json({ ok: false, reason: "db-error" }, { status: 500 });
  }
}
