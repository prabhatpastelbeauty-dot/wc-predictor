// Vercel serverless function — runs server-side, so no CORS restrictions apply.
//
// Usage:
//   /api/scores?key=YOUR_KEY                     -> all World Cup matches
//   /api/scores?key=YOUR_KEY&status=FINISHED     -> only finished matches
//   /api/scores?key=YOUR_KEY&type=h2h&matchId=X  -> head-to-head for a match

module.exports = async (req, res) => {
  const { key, status, type, matchId } = req.query;

  if (!key) {
    res.status(400).json({ error: 'Missing API key. Pass ?key=YOUR_FOOTBALL_DATA_KEY' });
    return;
  }

  let url;
  if (type === 'h2h') {
    if (!matchId) {
      res.status(400).json({ error: 'Missing matchId for head-to-head request' });
      return;
    }
    url = 'https://api.football-data.org/v4/matches/' + encodeURIComponent(matchId) + '/head2head?limit=5';
  } else {
    const qs = status ? ('?status=' + encodeURIComponent(status)) : '';
    url = 'https://api.football-data.org/v4/competitions/WC/matches' + qs;
  }

  try {
    const r = await fetch(url, {
      headers: { 'X-Auth-Token': key }
    });
    const text = await r.text();

    res.status(r.status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');

    try {
      res.send(JSON.parse(text));
    } catch {
      res.send(JSON.stringify({ error: 'Upstream returned non-JSON', status: r.status, body: text.slice(0, 300) }));
    }
  } catch (e) {
    res.status(502).json({ error: 'Could not reach football-data.org', detail: String(e) });
  }
};
