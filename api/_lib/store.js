// Storage for bookings and slot locks.
// Production: Upstash Redis (add it from the Vercel dashboard: Storage > Upstash Redis).
// Local testing only: in-memory fallback when ALLOW_MEMORY=1.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useRedis = !!(URL_ && TOKEN);
const useMemory = !useRedis && process.env.ALLOW_MEMORY === '1';

const RESERVE_LUA = [
  "for i=1,#KEYS do if redis.call('EXISTS',KEYS[i])==1 then return 0 end end",
  "for i=1,#KEYS do",
  "  if tonumber(ARGV[2])>0 then redis.call('SET',KEYS[i],ARGV[1],'EX',ARGV[2]) else redis.call('SET',KEYS[i],ARGV[1]) end",
  "end",
  "return 1"
].join('\n');

async function cmd(args) {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error('redis: ' + (j.error || r.status));
  return j.result;
}

/* in-memory implementation with the same behaviour (for local testing) */
const mem = new Map();
const alive = (e) => e && (!e.exp || e.exp > Date.now());
const M = {
  async reserve(keys, ttl, val) {
    for (const k of keys) if (alive(mem.get(k))) return false;
    for (const k of keys) mem.set(k, { v: String(val), exp: ttl > 0 ? Date.now() + ttl * 1000 : 0 });
    return true;
  },
  async get(k) { const e = mem.get(k); return alive(e) ? e.v : null; },
  async set(k, v, ex) { mem.set(k, { v: String(v), exp: ex ? Date.now() + ex * 1000 : 0 }); },
  async del(keys) { keys.forEach((k) => mem.delete(k)); },
  async persist(keys) { keys.forEach((k) => { const e = mem.get(k); if (alive(e)) e.exp = 0; }); },
  async keys(prefix) { return [...mem.keys()].filter((k) => k.startsWith(prefix) && alive(mem.get(k))); },
  async incr(k, ex) { const e = mem.get(k); const n = (alive(e) ? Number(e.v) : 0) + 1; mem.set(k, { v: String(n), exp: alive(e) ? e.exp : Date.now() + ex * 1000 }); return n; }
};
const R = {
  async reserve(keys, ttl, val) { return (await cmd(['EVAL', RESERVE_LUA, String(keys.length), ...keys, String(val), String(ttl || 0)])) === 1; },
  async get(k) { return cmd(['GET', k]); },
  async set(k, v, ex) { return ex ? cmd(['SET', k, String(v), 'EX', String(ex)]) : cmd(['SET', k, String(v)]); },
  async del(keys) { if (keys.length) await cmd(['DEL', ...keys]); },
  async persist(keys) { for (const k of keys) await cmd(['PERSIST', k]); },
  async keys(prefix) { return (await cmd(['KEYS', prefix + '*'])) || []; },
  async incr(k, ex) { const n = await cmd(['INCR', k]); if (n === 1) await cmd(['EXPIRE', k, String(ex)]); return n; }
};

const impl = useRedis ? R : M;
module.exports = Object.assign({ ready: useRedis || useMemory, kind: useRedis ? 'redis' : (useMemory ? 'memory (local testing only)' : 'none') }, impl);
