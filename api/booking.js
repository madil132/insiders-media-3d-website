// POST /api/booking                 create a booking (discovery call or paid consultation)
// GET  /api/booking?action=slots    list hours that are already taken
// GET  /api/booking?action=health   shows which parts are configured (no secrets)
const crypto = require('crypto');
const CFG = require('./_lib/config');
const store = require('./_lib/store');
const mail = require('./_lib/mail');
const T = require('./_lib/templates');
const { HR, validate, normalise } = require('./_lib/rules');

function out(res, code, obj) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}
async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === 'string') return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8'));
    return req.body;
  }
  const chunks = []; for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}
const baseUrl = (req) => process.env.SITE_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') { res.setHeader('Allow', 'GET, POST, OPTIONS'); res.statusCode = 204; return res.end(); }

    if (req.method === 'GET') {
      const action = new URL(req.url, 'http://x').searchParams.get('action') || '';
      if (action === 'health') {
        return out(res, 200, { ok: true, storage: store.kind, storage_ready: store.ready, email: mail.provider, admin_key_set: !!process.env.ADMIN_KEY, pay_url_set: !!process.env.PAY_URL, owner: T.OWNER() });
      }
      if (action === 'slots') {
        if (!store.ready) return out(res, 200, { ok: true, taken: [] });
        const keys = await store.keys('slot:');
        const taken = keys.map((k) => Number(k.slice(5))).filter(Number.isFinite).map((t) => new Date(t).toISOString());
        return out(res, 200, { ok: true, taken });
      }
      if (action === 'mails' && process.env.MAIL_DRY_RUN === '1') return out(res, 200, { ok: true, mails: global.__mails });
      return out(res, 200, { ok: true, service: 'Insiders Media booking' });
    }

    if (req.method !== 'POST') return out(res, 405, { ok: false, error: 'method' });
    if (!store.ready) { console.error('Booking refused: no database configured. Add Upstash Redis in Vercel (Storage tab).'); return out(res, 503, { ok: false, error: 'server' }); }

    const p = await readBody(req);
    if (p.hp) return out(res, 200, { ok: true });

    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    if ((await store.incr('rl:' + ip, 3600)) > Number(process.env.RATE_LIMIT || 12)) return out(res, 429, { ok: false, error: 'rate_limited' });

    if (validate(p)) return out(res, 400, { ok: false, error: 'invalid' });
    const r = normalise(p), paid = r.kind === 'consultation';
    r.ref = 'IM-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    r.created = Date.now();
    r.status = paid ? 'held' : 'booked';
    r.hold_until = paid ? r.created + CFG.consultation.hold_hours * HR : 0;

    const keys = ['slot:' + r.start]; if (paid) keys.push('slot:' + (r.start + HR));
    const ttl = paid ? CFG.consultation.hold_hours * 3600 : Math.max(86400, Math.round((r.start - Date.now()) / 1000) + 86400);
    if (!(await store.reserve(keys, ttl, r.ref))) return out(res, 200, { ok: false, error: 'slot_taken' });

    r.keys = keys;
    await store.set('booking:' + r.ref, JSON.stringify(r), 60 * 60 * 24 * 365);

    const base = baseUrl(req), errs = [];
    for (const m of [T.ownerEmail(r, base), T.clientEmail(r)]) {
      try { await mail.send(m); } catch (e) { errs.push(m.to + ': ' + e.message); console.error('mail failed', m.to, e.message); }
    }
    if (errs.length) { r.mail_errors = errs; await store.set('booking:' + r.ref, JSON.stringify(r), 60 * 60 * 24 * 365); }

    return out(res, 200, { ok: true, ref: r.ref, hold_until: paid ? new Date(r.hold_until).toISOString() : '' });
  } catch (e) {
    console.error('booking error', e);
    return out(res, 500, { ok: false, error: 'server' });
  }
};
