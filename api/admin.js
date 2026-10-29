// Owner tools. Needs ADMIN_KEY in Vercel environment variables.
//  /api/admin?ref=IM-XXXXXX&action=paid&sig=...   one-click link from your notification email
//  /api/admin?ref=IM-XXXXXX&action=cancel&sig=... one-click link from your notification email
//  /api/admin?key=YOUR_ADMIN_KEY                  list of all bookings
const crypto = require('crypto');
const store = require('./_lib/store');
const mail = require('./_lib/mail');
const T = require('./_lib/templates');
const { HR } = require('./_lib/rules');

function page(res, code, title, body) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + T.h(title) + '</title>' +
    '<style>body{font:16px/1.5 system-ui,sans-serif;background:#050506;color:#eef0f3;margin:0;padding:32px 20px}main{max-width:1000px;margin:0 auto}h1{font-weight:400}a{color:#fff}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #2b2d33;padding:10px 8px;text-align:left;vertical-align:top}th{color:#8c909a;font-weight:400}.b{display:inline-block;padding:6px 10px;border:1px solid #555;border-radius:3px;text-decoration:none;margin:2px}.ok{color:#7ee2a0}.no{color:#ff9d9d}</style><main>' + body + '</main>');
}
const baseUrl = (req) => process.env.SITE_URL || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host));
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

async function load(ref) { const j = await store.get('booking:' + ref); return j ? JSON.parse(j) : null; }
async function save(r) { await store.set('booking:' + r.ref, JSON.stringify(r), 60 * 60 * 24 * 365); }

async function effectiveStatus(r) {
  if (r.status !== 'held') return r.status;
  const owner = await store.get(r.keys[0]);
  return owner === r.ref ? 'held' : 'expired';
}

async function markPaid(r) {
  let st = await effectiveStatus(r);
  if (st === 'paid') return { ok: true, msg: 'Already marked as paid.' };
  if (st === 'cancelled') return { ok: false, msg: 'This booking was cancelled.' };
  if (st === 'expired') {
    // the 24 hour hold ran out: try to take the slot back
    if (!(await store.reserve(r.keys, 0, r.ref))) return { ok: false, msg: 'The hold expired and the slot has since been booked by someone else. Contact the client to choose a new time.' };
  } else await store.persist(r.keys);
  r.status = 'paid'; r.paid_at = Date.now(); await save(r);
  try { await mail.send(T.paidEmail(r)); } catch (e) { return { ok: true, msg: 'Marked as paid, but the confirmation email failed: ' + e.message }; }
  return { ok: true, msg: 'Marked as paid. The client has been sent a confirmation and calendar file.' };
}
async function cancel(r) {
  if (r.status === 'cancelled') return { ok: true, msg: 'Already cancelled.' };
  for (const k of r.keys) if ((await store.get(k)) === r.ref) await store.del([k]);
  r.status = 'cancelled'; await save(r);
  try { await mail.send(T.cancelEmail(r)); } catch (e) { return { ok: true, msg: 'Cancelled and slot released, but the client email failed: ' + e.message }; }
  return { ok: true, msg: 'Cancelled. The slot is free again and the client has been notified.' };
}

module.exports = async (req, res) => {
  try {
    if (!process.env.ADMIN_KEY) return page(res, 503, 'Not set up', '<h1>Admin not set up</h1><p>Add ADMIN_KEY in Vercel > Settings > Environment Variables, then redeploy.</p>');
    if (!store.ready) return page(res, 503, 'No database', '<h1>No database</h1><p>Add Upstash Redis in Vercel > Storage.</p>');
    const q = new URL(req.url, 'http://x').searchParams, ref = q.get('ref') || '', action = q.get('action') || '';

    if (ref && action) {
      if (!T.verify(ref, action, q.get('sig'))) return page(res, 403, 'Invalid link', '<h1>This link is not valid</h1>');
      const r = await load(ref); if (!r) return page(res, 404, 'Not found', '<h1>Booking not found</h1>');
      const result = action === 'paid' ? await markPaid(r) : action === 'cancel' ? await cancel(r) : { ok: false, msg: 'Unknown action.' };
      return page(res, result.ok ? 200 : 409, 'Booking ' + ref, '<h1 class="' + (result.ok ? 'ok' : 'no') + '">' + T.h(result.msg) + '</h1><p>' + T.h(r.name) + ', ' + T.h(r.business) + ', ' + T.h(T.fmt(r.start, T.teamTz())) + '</p><p><a href="/api/admin?key=' + encodeURIComponent(process.env.ADMIN_KEY) + '">All bookings</a></p>');
    }

    if (q.get('key') && same(q.get('key'), process.env.ADMIN_KEY)) {
      const keys = await store.keys('booking:'), rows = [];
      for (const k of keys) { const j = await store.get(k); if (j) rows.push(JSON.parse(j)); }
      rows.sort((a, b) => a.start - b.start);
      const base = baseUrl(req), now = Date.now();
      let body = '<h1>Bookings (' + rows.length + ')</h1><table><tr><th>When (Pakistan)</th><th>Type</th><th>Status</th><th>Client</th><th>Contact</th><th>Needs</th><th></th></tr>';
      for (const r of rows) {
        const st = await effectiveStatus(r);
        body += '<tr><td>' + T.h(T.fmt(r.start, T.teamTz())) + (r.start < now ? ' <span class="no">past</span>' : '') + '</td><td>' + (r.kind === 'consultation' ? 'Consultation' : 'Discovery') + '</td><td>' + T.h(st) + '</td><td><b>' + T.h(r.name) + '</b><br>' + T.h(r.business) + '</td><td>' + T.h(r.email) + '<br>' + T.h(r.phone) + '</td><td>' + T.h(r.services) + '<br><i>' + T.h(r.bottleneck.slice(0, 140)) + '</i></td><td>' +
          (r.kind === 'consultation' && (st === 'held' || st === 'expired') ? '<a class="b" href="' + T.adminLink(base, r.ref, 'paid') + '">Mark paid</a>' : '') + (st !== 'cancelled' ? '<a class="b" href="' + T.adminLink(base, r.ref, 'cancel') + '">Cancel</a>' : '') + '</td></tr>';
      }
      return page(res, 200, 'Bookings', body + '</table>');
    }
    return page(res, 403, 'Forbidden', '<h1>Forbidden</h1>');
  } catch (e) { console.error('admin error', e); return page(res, 500, 'Error', '<h1>Something went wrong</h1><p>' + T.h(e.message) + '</p>'); }
};
