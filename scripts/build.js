// Turns site.config.json (the one file you edit) into public/assets/js/site.config.js
// Vercel runs this automatically on every deploy. You can also run it with: npm run build
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = path.join(root, 'site.config.json');
const out = path.join(root, 'public', 'assets', 'js', 'site.config.js');
let cfg;
try { cfg = JSON.parse(fs.readFileSync(src, 'utf8')); }
catch (e) { console.error('site.config.json is not valid JSON: ' + e.message); process.exit(1); }
const js = '/* Generated from site.config.json by scripts/build.js. Edit site.config.json, not this file. */\n' +
  'window.SITE_CONFIG = ' + JSON.stringify(cfg).replace(/<\/(script)/gi, '<\\/$1') + ';\n';
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, js);
console.log('site.config.js written (' + js.length + ' bytes)');
