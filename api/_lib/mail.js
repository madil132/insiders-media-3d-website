// Sends email. Pick ONE provider with environment variables:
//  A) Gmail:  GMAIL_USER + GMAIL_APP_PASSWORD   (simplest)
//  B) Resend: RESEND_API_KEY + MAIL_FROM        (needs your domain verified at resend.com)
// MAIL_DRY_RUN=1 skips sending and keeps the messages in memory (used for tests).
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_PASS = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
const RESEND = process.env.RESEND_API_KEY || '';
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Insiders Media';
const provider = process.env.MAIL_DRY_RUN === '1' ? 'dry-run' : (RESEND ? 'resend' : (GMAIL_USER && GMAIL_PASS ? 'gmail' : 'none'));

global.__mails = global.__mails || [];
let transport = null;

async function send(m) {
  // m: { to, subject, html, replyTo, attachments:[{filename, content, contentType}] }
  if (provider === 'dry-run') { global.__mails.push(m); return { ok: true }; }
  if (provider === 'gmail') {
    if (!transport) transport = require('nodemailer').createTransport({ service: 'gmail', auth: { user: GMAIL_USER, pass: GMAIL_PASS } });
    await transport.sendMail({
      from: '"' + FROM_NAME + '" <' + GMAIL_USER + '>', to: m.to, subject: m.subject, html: m.html, replyTo: m.replyTo || undefined,
      attachments: (m.attachments || []).map((a) => ({ filename: a.filename, content: a.content, contentType: a.contentType }))
    });
    return { ok: true };
  }
  if (provider === 'resend') {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + RESEND, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || (FROM_NAME + ' <onboarding@resend.dev>'), to: [m.to], subject: m.subject, html: m.html, reply_to: m.replyTo || undefined,
        attachments: (m.attachments || []).map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString('base64') }))
      })
    });
    if (!r.ok) throw new Error('resend ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return { ok: true };
  }
  throw new Error('No email provider configured');
}
module.exports = { send, provider };
