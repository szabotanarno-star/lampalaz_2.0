import { vote, dbError } from '../lib/game.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Csak POST.' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const r = await vote({ code: b.code, voter: b.voter, scene: b.scene, choice: b.choice });
    res.status(r.status).json(r.body);
  } catch (e) { const r = dbError(e); res.status(r.status).json(r.body); }
}
