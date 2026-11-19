// Helyi kipróbáláshoz: node dev-server.mjs  →  http://localhost:3000
// Adatbázis nélkül memóriában tárol. Az előadói jelszó itt: proba (ha nincs más beállítva).
import http from 'node:http';
import { readFile } from 'node:fs/promises';
process.env.ELOADO_JELSZO ||= 'proba';
const routes = {
  '/api/state': (await import('./api/state.js')).default,
  '/api/vote': (await import('./api/vote.js')).default,
  '/api/host': (await import('./api/host.js')).default
};
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const h = routes[u.pathname];
  if (!h) { res.setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end(await readFile('./index.html')); }
  let raw = ''; for await (const ch of req) raw += ch;
  req.query = Object.fromEntries(u.searchParams);
  req.body = raw ? JSON.parse(raw) : {};
  res.status = c => { res.statusCode = c; return res; };
  res.json = o => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)); };
  h(req, res);
}).listen(process.env.PORT || 3000, () => console.log('http://localhost:' + (process.env.PORT || 3000)));
