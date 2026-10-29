const crypto = require('crypto');
const CFG = require('./config');
const { safeTz } = require('./rules');

const OWNER = () => process.env.OWNER_EMAIL || process.env.GMAIL_USER || CFG.brand.email;
const PAY_URL = () => process.env.PAY_URL || '';
const MEET = () => process.env.MEETING_LINK || '';
const BRAND = CFG.brand.name || 'Insiders Media';

const h = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmt(ms, tz) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: safeTz(tz), weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(ms));
}
const teamTz = () => CFG.availability.iana || 'Asia/Karachi';

function sign(ref, action) {
  const key = process.env.ADMIN_KEY || '';
  return crypto.createHmac('sha256', key).update(ref + ':' + action).digest('hex').slice(0, 32);
}
function verify(ref, action, sig) {
  if (!process.env.ADMIN_KEY || !sig) return false;
  const a = Buffer.from(sign(ref, action)), b = Buffer.from(String(sig));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function adminLink(base, ref, action) { return base + '/api/admin?ref=' + encodeURIComponent(ref) + '&action=' + action + '&sig=' + sign(ref, action); }

function ics(r, title) {
  const f = (ms) => new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Insiders Media//Booking//EN', 'METHOD:PUBLISH', 'BEGIN:VEVENT',
    'UID:' + r.ref + '@insidersmedia.xyz', 'DTSTAMP:' + f(Date.now()), 'DTSTART:' + f(r.start), 'DTEND:' + f(r.start + r.mins * 60000),
    'SUMMARY:' + esc(title), 'DESCRIPTION:' + esc('Reference ' + r.ref + (MEET() ? '\nJoin: ' + MEET() : '')), MEET() ? 'LOCATION:' + esc(MEET()) : 'LOCATION:Online',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

const wrap = (inner) => '<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#111;max-width:620px">' + inner + '<p style="color:#555">' + h(BRAND) + '</p></div>';
const btn = (href, label, bg) => '<a href="' + h(href) + '" style="display:inline-block;background:' + (bg || '#111') + ';color:#fff;padding:12px 20px;text-decoration:none;border-radius:3px;margin:4px 8px 4px 0">' + h(label) + '</a>';

function ownerEmail(r, base) {
  const paid = r.kind === 'consultation', C = CFG.consultation;
  const rows = [
    ['Reference', r.ref], ['Type', paid ? 'PAID CONSULTATION (' + C.price + ' ' + C.currency + ')' : 'Free discovery call'],
    ['When (Pakistan time)', fmt(r.start, teamTz())], ['When (their time)', fmt(r.start, r.tz) + ' (' + r.tz + ')'],
    ['Name', r.name], ['Email', r.email], ['Business', r.business], ['Phone / WhatsApp', r.phone], ['Website', r.website], ['Industry', r.industry],
    ['Needs help with', r.services], ['Bottleneck', r.bottleneck], ['Good result looks like', r.outcome], ['Wants to start', r.timeline],
    ['Team size', r.team], ['Tools today', r.tools], ['Came from', r.campaign || r.page]
  ].filter((x) => x[1]);
  let note = '';
  if (paid) {
    note = '<p style="background:#fff3cd;padding:12px;border-radius:4px"><b>Awaiting payment.</b> Slot held until ' + h(fmt(r.hold_until, teamTz())) + '. ' +
      (PAY_URL() ? 'The client was sent your payment link.' : '<b>PAY_URL is not set, so send this client an invoice now.</b>') + '</p>';
    note += process.env.ADMIN_KEY
      ? '<p>When the money arrives: ' + btn(adminLink(base, r.ref, 'paid'), 'Mark as paid and confirm', '#0a7a3d') + btn(adminLink(base, r.ref, 'cancel'), 'Cancel and release slot', '#9b1c1c') + '</p>'
      : '<p style="color:#9b1c1c">Set ADMIN_KEY in Vercel to get one-click Paid and Cancel buttons here.</p>';
  } else if (process.env.ADMIN_KEY) {
    note = '<p>' + btn(adminLink(base, r.ref, 'cancel'), 'Cancel this call and release slot', '#9b1c1c') + '</p>';
  }
  return {
    to: OWNER(), replyTo: r.email,
    subject: (paid ? 'New CONSULTATION booking: ' : 'New discovery call: ') + r.name + ' (' + r.business + '), ' + fmt(r.start, teamTz()),
    html: '<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">' + note + '<table cellpadding="8" style="border-collapse:collapse">' +
      rows.map((x) => '<tr><td style="border-bottom:1px solid #eee;color:#666;vertical-align:top;white-space:nowrap">' + h(x[0]) + '</td><td style="border-bottom:1px solid #eee">' + h(x[1]).replace(/\n/g, '<br>') + '</td></tr>').join('') + '</table></div>'
  };
}

function clientEmail(r) {
  const paid = r.kind === 'consultation', C = CFG.consultation, first = h(r.name.split(' ')[0]);
  const when = h(fmt(r.start, r.tz)), pk = h(fmt(r.start, teamTz()));
  if (!paid) {
    return {
      to: r.email, replyTo: OWNER(), subject: 'Your discovery call is booked: ' + fmt(r.start, r.tz),
      html: wrap('<p>Hi ' + first + ',</p><p>Your free ' + r.mins + ' minute discovery call is booked.</p><p><b>' + when + '</b><br>' + pk + ' (Pakistan time)<br>Reference ' + h(r.ref) + '</p>' +
        (MEET() ? '<p>Join here: <a href="' + h(MEET()) + '">' + h(MEET()) + '</a></p>' : '<p>We will send the call link before the session.</p>') +
        '<p>We have read your answers, so we will start on your real problem. To change the time, reply to this email. A calendar file is attached.</p>'),
      attachments: [{ filename: 'discovery-call.ics', content: ics(r, 'Insiders Media discovery call'), contentType: 'text/calendar' }]
    };
  }
  return {
    to: r.email, replyTo: OWNER(), subject: 'Your consultation is booked. Payment request: ' + C.price + ' ' + C.currency,
    html: wrap('<p>Hi ' + first + ',</p><p>Your Audit &amp; Consultation is booked and your slot is held.</p><p><b>' + when + '</b><br>' + pk + ' (Pakistan time)<br>' + r.mins + ' minutes live with Adil Nazir. Reference ' + h(r.ref) + '</p>' +
      '<p style="border:1px solid #ddd;padding:14px;border-radius:4px"><b>Invoice ' + h(r.ref) + '</b><br>Audit &amp; Consultation, ' + r.mins + ' minute session and written roadmap<br><b>' + h(C.price + ' ' + C.currency) + '</b><br>Credited in full toward any build signed within ' + C.credit_days + ' days.</p>' +
      (PAY_URL() ? '<p>' + btn(PAY_URL(), 'Pay ' + C.price + ' to confirm your booking') + '</p>' : '<p>Payment details follow from us in a separate email shortly.</p>') +
      '<p><b>Your slot is held until ' + h(fmt(r.hold_until, r.tz)) + '.</b> It is confirmed as soon as payment is received. If it is not paid by then, the slot is released.</p><p>Questions? Reply to this email.</p>')
  };
}

function paidEmail(r) {
  return {
    to: r.email, replyTo: OWNER(), subject: 'Payment received. Your consultation is confirmed',
    html: wrap('<p>Hi ' + h(r.name.split(' ')[0]) + ',</p><p>Payment received. Your consultation is confirmed for <b>' + h(fmt(r.start, r.tz)) + '</b>.</p>' +
      (MEET() ? '<p>Join here: <a href="' + h(MEET()) + '">' + h(MEET()) + '</a></p>' : '<p>We will send the call link before the session.</p>') +
      '<p>We will also send a short 10 minute intake form. A calendar file is attached.</p>'),
    attachments: [{ filename: 'consultation.ics', content: ics(r, 'Insiders Media Audit & Consultation'), contentType: 'text/calendar' }]
  };
}

function cancelEmail(r) {
  return {
    to: r.email, replyTo: OWNER(), subject: 'Your booking has been cancelled',
    html: wrap('<p>Hi ' + h(r.name.split(' ')[0]) + ',</p><p>Your ' + (r.kind === 'consultation' ? 'consultation' : 'discovery call') + ' on ' + h(fmt(r.start, r.tz)) + ' (reference ' + h(r.ref) + ') has been cancelled and the slot released. You are welcome to book another time on our website, or reply to this email and we will help.</p>')
  };
}

module.exports = { h, fmt, teamTz, sign, verify, adminLink, ownerEmail, clientEmail, paidEmail, cancelEmail, OWNER };
