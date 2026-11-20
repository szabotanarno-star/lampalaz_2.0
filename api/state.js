import { getState, checkHost, dbError } from '../lib/game.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const q = req.query || {};
    const host = q.host === '1';
    if (host) { const bad = checkHost(req.headers['x-host-key']); if (bad) return res.status(bad.status).json(bad.body); }
    const r = await getState({ code: q.code, voter: q.voter, beat: q.beat === '1', host });
    res.status(r.status).json(r.body);
  } catch (e) { const r = dbError(e); res.status(r.status).json(r.body); }
}
