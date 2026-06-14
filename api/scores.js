// Vercel serverless function — runs server-side, so no CORS restrictions apply.
// Frontend calls /api/scores?key=YOUR_KEY and this fetches from football-data.org
// using that key, then returns the JSON straight through.

export default async function handler(req, res) {
  const { key, status } = req.query;

  if (!key) {
    res.status(400).json({ error: 'Missing API key. Pass ?key=YOUR_FOOTBALL_DATA_KEY' });
    return;
  }

  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const url = `https://api.football-data.org/v4/competitions/WC/matches${qs}`;

  try {
    const r = await fetch(url, {
      headers: { 'X-Auth-Token': key }
    });
    const text = await r.text();

    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');

    // Pass through whatever football-data.org sent (JSON on success or error)
    try {
      res.send(JSON.parse(text));
    } catch {
      res.send({ error: 'Upstream returned non-JSON', status: r.status, body: text.slice(0, 300) });
    }
  } catch (e) {
    res.status(502).json({ error: 'Could not reach football-data.org', detail: String(e) });
  }
}
