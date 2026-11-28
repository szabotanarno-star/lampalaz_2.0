// A játék szerveroldali logikája. Minden függvény { status, body } párt ad vissza.
import { getStore } from './store.js';

export const SCENES = 9;
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const ACTIVE_MS = 30000;

const gKey = c => `lampalaz:g:${c}`;
const pKey = c => `lampalaz:p:${c}`;
const vKey = (c, i) => `lampalaz:v:${c}:${i}`;

const okCode = c => typeof c === 'string' && /^[A-Z0-9]{4}$/.test(c);
const okVoter = v => typeof v === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(v);
const norm = c => String(c || '').trim().toUpperCase();
const err = (status, msg) => ({ status, body: { error: msg } });

function newCode() { let s = ''; for (let i = 0; i < 4; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; }

async function counts(st, code, scene) {
  const all = await st.hgetall(vKey(code, scene));
  const c = [0, 0];
  for (const v of Object.values(all)) { const n = Number(v); if (n === 0 || n === 1) c[n]++; }
  return c;
}
async function players(st, code) {
  const all = await st.hgetall(pKey(code));
  const now = Date.now();
  return Object.values(all).filter(t => now - Number(t) < ACTIVE_MS).length;
}

export function checkHost(key) {
  const pw = process.env.ELOADO_JELSZO;
  if (!pw) return err(500, 'Az előadói jelszó (ELOADO_JELSZO) nincs beállítva a szerveren.');
  if (key !== pw) return err(403, 'Hibás előadói jelszó.');
  return null;
}

// GET állapot: résztvevő és előadó is ezt kérdezi le néhány másodpercenként.
export async function getState({ code, voter, beat, host }) {
  const st = getStore();
  code = norm(code);
  if (!okCode(code)) return err(400, 'A kód négy karakter.');
  const g = await st.getJSON(gKey(code));
  if (!g) return err(404, 'Nem található ilyen kódú játék.');
  if (voter && okVoter(voter) && beat) { await st.hset(pKey(code), voter, Date.now()); await st.expire(pKey(code)); }
  const body = { game: g };
  if (host) {
    body.players = await players(st, code);
    if (g.phase === 'q') { const c = await counts(st, code, g.scene); body.votes = c[0] + c[1]; }
  }
  return { status: 200, body };
}

export async function vote({ code, voter, scene, choice }) {
  const st = getStore();
  code = norm(code);
  if (!okCode(code) || !okVoter(voter)) return err(400, 'Hibás kérés.');
  if (choice !== 0 && choice !== 1) return err(400, 'Hibás választás.');
  const g = await st.getJSON(gKey(code));
  if (!g) return err(404, 'Nem található ilyen kódú játék.');
  if (g.phase !== 'q' || g.scene !== scene) return err(409, 'Ennél a helyzetnél a szavazás már lezárult.');
  await st.hset(vKey(code, scene), voter, choice); await st.expire(vKey(code, scene));
  await st.hset(pKey(code), voter, Date.now()); await st.expire(pKey(code));
  return { status: 200, body: { ok: true } };
}

export async function hostAction({ action, code, w }) {
  const st = getStore();
  if (action === 'create') {
    for (let n = 0; n < 8; n++) {
      const c = newCode();
      const g = { scene: -1, phase: 'lobby', picks: [], counts: [], t: Date.now() };
      if (await st.setJSON(gKey(c), g, { nx: true })) return { status: 200, body: { code: c, game: g } };
    }
    return err(500, 'Nem sikerült új kódot létrehozni, próbálja újra.');
  }
  code = norm(code);
  if (!okCode(code)) return err(400, 'Hibás kód.');
  const g = await st.getJSON(gKey(code));
  if (!g) return err(404, 'Nem található ilyen kódú játék.');
  const save = async () => { g.t = Date.now(); await st.setJSON(gKey(code), g); return { status: 200, body: { game: g } }; };

  if (action === 'start') {
    if (g.phase !== 'lobby') return { status: 200, body: { game: g } };
    g.scene = 0; g.phase = 'q'; return save();
  }
  if (action === 'close') {
    if (g.phase !== 'q') return { status: 200, body: { game: g } };
    const c = await counts(st, code, g.scene);
    let pick;
    if (w === 0 || w === 1) pick = w;
    else if (c[0] !== c[1]) pick = c[0] > c[1] ? 0 : 1;
    else return { status: 200, body: { tie: true, counts: c, game: g } };
    while (g.picks.length < g.scene) g.picks.push(null);
    while (g.counts.length < g.scene) g.counts.push(null);
    g.picks[g.scene] = pick; g.counts[g.scene] = c; g.phase = 'f';
    return save();
  }
  if (action === 'next') {
    if (g.phase !== 'f') return { status: 200, body: { game: g } };
    if (g.scene >= SCENES - 1) g.phase = 'end'; else { g.scene += 1; g.phase = 'q'; }
    return save();
  }
  return err(400, 'Ismeretlen művelet.');
}

export function dbError(e) {
  if (e && e.message === 'NO_DB') return err(500, 'Nincs adatbázis bekötve: adja hozzá az Upstash Redis integrációt a Vercel-projekthez, majd telepítse újra.');
  return err(500, 'Szerverhiba, próbálja újra.');
}
