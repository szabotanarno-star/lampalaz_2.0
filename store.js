// Adattár: Vercelen Upstash Redis, helyi teszteléskor memória.
import { Redis } from '@upstash/redis';

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const TTL = 60 * 60 * 12; // egy játék 12 óráig él

function memoryStore() {
  const m = new Map();
  const h = k => { if (!m.has(k)) m.set(k, new Map()); return m.get(k); };
  return {
    kind: 'memory',
    async getJSON(k) { return m.has(k) ? JSON.parse(m.get(k)) : null; },
    async setJSON(k, v, { nx } = {}) { if (nx && m.has(k)) return false; m.set(k, JSON.stringify(v)); return true; },
    async hset(k, f, v) { h(k).set(f, String(v)); },
    async hgetall(k) { return m.has(k) ? Object.fromEntries(h(k)) : {}; },
    async expire() {}
  };
}

function redisStore() {
  const r = new Redis({ url, token });
  return {
    kind: 'redis',
    async getJSON(k) { const v = await r.get(k); return v == null ? null : (typeof v === 'string' ? JSON.parse(v) : v); },
    async setJSON(k, v, { nx } = {}) {
      const res = await r.set(k, JSON.stringify(v), nx ? { nx: true, ex: TTL } : { ex: TTL });
      return res === 'OK' || res === true;
    },
    async hset(k, f, v) { await r.hset(k, { [f]: String(v) }); },
    async hgetall(k) { return (await r.hgetall(k)) || {}; },
    async expire(k) { await r.expire(k, TTL); }
  };
}

let store = null;
export function getStore() {
  if (store) return store;
  if (url && token) store = redisStore();
  else if (process.env.VERCEL) throw new Error('NO_DB');
  else store = memoryStore();
  return store;
}
