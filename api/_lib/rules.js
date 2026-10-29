// Validation and slot rules. Hours, weekdays, lead times and durations come from site.config.json.
const CFG = require('./config');
const HR = 3600000;

function clean(s, max) { return String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max || 200); }
function safeTz(tz) { try { new Intl.DateTimeFormat('en', { timeZone: tz }); return tz; } catch (e) { return 'UTC'; } }

function slotAllowed(startMs, kind) {
  const A = CFG.availability, B = CFG.booking, paid = kind === 'consultation';
  if (!Number.isFinite(startMs)) return false;
  const local = new Date(startMs + A.utc_offset * HR);
  const hour = local.getUTCHours(), day = local.getUTCDay();
  const sh = parseInt(A.start, 10), eh = parseInt(A.end, 10), last = paid ? eh - 2 : eh - 1;
  if (local.getUTCMinutes() !== 0 || local.getUTCSeconds() !== 0 || startMs % 60000 !== 0) return false;
  if (hour < sh || hour > last || A.weekdays.indexOf(day) < 0) return false;
  const lead = (paid ? B.consultation_lead_hours : B.discovery_lead_hours) * HR - 15 * 60000;
  if (startMs < Date.now() + lead) return false;
  if (startMs > Date.now() + 45 * 24 * HR) return false;
  return true;
}

/* returns an error code or '' */
function validate(p) {
  if (!p || ['discovery', 'consultation'].indexOf(p.kind) < 0) return 'invalid';
  if (clean(p.name, 120).length < 2) return 'invalid';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(p.email || '')) || String(p.email).length > 160) return 'invalid';
  if (clean(p.business, 160).length < 2) return 'invalid';
  if (String(p.phone || '').replace(/\D/g, '').length < 7) return 'invalid';
  if (clean(p.bottleneck, 2000).length < 10) return 'invalid';
  if (!slotAllowed(Date.parse(p.slot_iso), p.kind)) return 'invalid';
  return '';
}

function normalise(p) {
  const paid = p.kind === 'consultation';
  return {
    kind: p.kind, start: Date.parse(p.slot_iso), mins: paid ? CFG.consultation.session_minutes : CFG.booking.discovery_minutes,
    tz: safeTz(p.tz),
    name: clean(p.name, 120), email: clean(p.email, 160), business: clean(p.business, 160), phone: clean(p.phone, 40),
    website: clean(p.website, 200), industry: clean(p.industry, 80),
    services: (Array.isArray(p.services) ? p.services : []).slice(0, 8).map((s) => clean(s, 60)).join(', '),
    bottleneck: clean(p.bottleneck, 2000), outcome: clean(p.outcome, 2000), timeline: clean(p.timeline, 60),
    team: clean(p.team, 40), tools: clean(p.tools, 300), page: clean(p.page, 300),
    campaign: clean([p.utm_source, p.utm_medium, p.utm_campaign].filter(Boolean).join(' / '), 200)
  };
}

module.exports = { HR, clean, safeTz, slotAllowed, validate, normalise };
