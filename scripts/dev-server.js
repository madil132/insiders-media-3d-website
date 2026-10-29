// Local test server:  npm run dev   then open http://localhost:3000
// Serves /public and runs the /api functions. Uses an in-memory store and prints emails instead of sending them.
process.env.ALLOW_MEMORY = process.env.ALLOW_MEMORY || '1';
if (!process.env.GMAIL_USER && !process.env.RESEND_API_KEY) process.env.MAIL_DRY_RUN = process.env.MAIL_DRY_RUN || '1';
process.env.ADMIN_KEY = process.env.ADMIN_KEY || 'local-admin-key';
require('./build.js');
const http = require('http'), fs = require('fs'), path = require('path');
const pub = path.join(__dirname, '..', 'public');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.xml': 'application/xml' };
const handlers = { '/api/booking': require('../api/booking.js'), '/api/admin': require('../api/admin.js') };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (handlers[u.pathname]) {
    const chunks = []; req.on('data', (c) => chunks.push(c));
    req.on('end', () => { if (chunks.length) req.body = Buffer.concat(chunks).toString('utf8'); handlers[u.pathname](req, res).catch((e) => { res.statusCode = 500; res.end(String(e)); }); });
    return;
  }
  let f = path.join(pub, u.pathname === '/' ? 'index.html' : u.pathname);
  if (!f.startsWith(pub) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { f = path.join(pub, 'index.html'); if (u.pathname.includes('.')) { res.statusCode = 404; return res.end('Not found'); } }
  res.setHeader('Content-Type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(res);
}).listen(process.env.PORT || 3000, () => console.log('Local site: http://localhost:' + (process.env.PORT || 3000) + '   admin key: ' + process.env.ADMIN_KEY));
