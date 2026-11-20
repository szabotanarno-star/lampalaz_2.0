import { hostAction, checkHost, dbError } from '../lib/game.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Csak POST.' });
  const bad = checkHost(req.headers['x-host-key']);
  if (bad) return res.status(bad.status).json(bad.body);
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const r = await hostAction({ action: b.action, code: b.code, w: b.w });
    res.status(r.status).json(r.body);
  } catch (e) { const r = dbError(e); res.status(r.status).json(r.body); }
}
