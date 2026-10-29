(function () {
'use strict';
var CFG = window.SITE_CONFIG;
if (!CFG) { document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif;color:#fff">Site configuration failed to load.</p>'; return; }
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
var TAU = Math.PI * 2;
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function get(p) { return p.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, CFG); }
function tpl(s) { return String(s).replace(/\{\{([\w.]+)\}\}/g, function (m, p) { var v = get(p); return v == null ? '' : v; }); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
function track(name, props) { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name, props: props || {} }); }

/* ---------- {{config}} templating on the static markup ---------- */
(function () {
  var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n, list = [];
  while ((n = w.nextNode())) { if (n.nodeValue.indexOf('{{') > -1 && !/^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName)) list.push(n); }
  list.forEach(function (t) { t.nodeValue = tpl(t.nodeValue); });
  $$('*').forEach(function (e) {
    if (e.nodeName === 'SCRIPT' || e.nodeName === 'STYLE') return;
    [].slice.call(e.attributes).forEach(function (a) { if (a.value.indexOf('{{') > -1) e.setAttribute(a.name, tpl(a.value)); });
  });
})();
$('#yr').textContent = new Date().getFullYear();

/* ---------- Alex: a chrome mascot drawn on canvas ---------- */
var M = {
  idle:      { ew: .095, eh: .21, gap: .30, ey: -.04, tilt: 0,    lx: 0,  ly: 0,   arc: 0, amp: 1,   spd: 1,   sq: 0,    roll: 0 },
  listen:    { ew: .100, eh: .28, gap: .27, ey: -.07, tilt: .10,  lx: 0,  ly: 0,   arc: 0, amp: 1,   spd: 1,   sq: 0,    roll: .06 },
  think:     { ew: .085, eh: .15, gap: .33, ey: -.12, tilt: -.22, lx: .8, ly: -.8, arc: 0, amp: .8,  spd: .8,  sq: 0,    roll: -.05 },
  work:      { ew: .125, eh: .07, gap: .32, ey: -.03, tilt: 0,    lx: 0,  ly: .3,  arc: 0, amp: .6,  spd: 2.2, sq: .02,  roll: 0 },
  celebrate: { ew: .105, eh: .10, gap: .31, ey: -.05, tilt: 0,    lx: 0,  ly: 0,   arc: 1, amp: 1.7, spd: 1.8, sq: 0,    roll: 0 },
  sleep:     { ew: .135, eh: .018, gap: .30, ey: .02, tilt: 0,    lx: 0,  ly: 0,   arc: 0, amp: .35, spd: .4,  sq: .07,  roll: 0 },
  surprised: { ew: .115, eh: .31, gap: .26, ey: -.06, tilt: 0,    lx: 0,  ly: 0,   arc: 0, amp: 1.2, spd: 1.3, sq: -.03, roll: 0 },
  excited:   { ew: .105, eh: .30, gap: .27, ey: -.08, tilt: .12,  lx: 0,  ly: 0,   arc: 0, amp: 1.6, spd: 1.7, sq: -.03, roll: 0 },
  confused:  { ew: .090, eh: .20, gap: .32, ey: -.05, tilt: .28,  lx: .6, ly: -.5, arc: 0, amp: .9,  spd: .9,  sq: 0,    roll: -.1 },
  laughing:  { ew: .105, eh: .10, gap: .31, ey: -.05, tilt: 0,    lx: 0,  ly: 0,   arc: 1, amp: 2.2, spd: 3,   sq: .03,  roll: 0 },
  drowsy:    { ew: .130, eh: .06, gap: .30, ey: 0,    tilt: 0,    lx: 0,  ly: .2,  arc: 0, amp: .5,  spd: .5,  sq: .04,  roll: .04 },
  happy:     { ew: .100, eh: .12, gap: .30, ey: -.05, tilt: 0,    lx: 0,  ly: 0,   arc: 1, amp: 1.1, spd: 1.1, sq: 0,    roll: .03 },
  proud:     { ew: .105, eh: .10, gap: .34, ey: -.12, tilt: 0,    lx: 0,  ly: 0,   arc: 1, amp: .9,  spd: .9,  sq: -.05, roll: 0 },
  curious:   { ew: .095, eh: .22, gap: .30, ey: -.06, tilt: .05,  lx: .5, ly: -.3, arc: 0, amp: 1,   spd: 1,   sq: 0,    roll: .1,  rh: 1.45 },
  searching: { ew: .090, eh: .22, gap: .30, ey: -.04, tilt: 0,    lx: 0,  ly: 0,   arc: 0, amp: 1,   spd: 1.2, sq: 0,    roll: 0,   sweep: 1 },
  playful:   { ew: .100, eh: .22, gap: .30, ey: -.05, tilt: .06,  lx: 0,  ly: 0,   arc: 0, amp: 1.4, spd: 1.5, sq: 0,    roll: -.08, rh: .06 },
  shy:       { ew: .100, eh: .12, gap: .26, ey: 0,    tilt: -.1,  lx: -.9, ly: .8, arc: 0, amp: .6,  spd: .7,  sq: .06,  roll: -.08 },
  suspicious:{ ew: .130, eh: .06, gap: .32, ey: -.02, tilt: .16,  lx: .9, ly: 0,   arc: 0, amp: .8,  spd: .8,  sq: 0,    roll: .03 },
  bored:     { ew: .120, eh: .05, gap: .30, ey: .03,  tilt: 0,    lx: 0,  ly: .4,  arc: 0, amp: .4,  spd: .5,  sq: .03,  roll: .05 },
  sad:       { ew: .100, eh: .20, gap: .30, ey: .02,  tilt: -.38, lx: 0,  ly: .5,  arc: 0, amp: .5,  spd: .6,  sq: .05,  roll: 0 },
  angry:     { ew: .110, eh: .15, gap: .27, ey: -.02, tilt: .5,   lx: 0,  ly: 0,   arc: 0, amp: .9,  spd: 1.6, sq: 0,    roll: 0,   shake: .3 },
  scared:    { ew: .080, eh: .34, gap: .30, ey: -.06, tilt: 0,    lx: 0,  ly: 0,   arc: 0, amp: 1.3, spd: 2,   sq: -.04, roll: 0,   shake: 1 }
};
(function () { var D = { rh: 1, shake: 0, sweep: 0 }; Object.keys(M).forEach(function (k) { M[k] = Object.assign({}, D, M[k]); }); })();
var P = { x: -9999, y: -9999 }, lastAct = Date.now(), onWake = null;
function act() { lastAct = Date.now(); if (onWake) onWake(); }
addEventListener('pointermove', function (e) { P.x = e.clientX; P.y = e.clientY; act(); }, { passive: true });
addEventListener('scroll', act, { passive: true });
addEventListener('keydown', act);

function pill(c, w, h) {
  var r = Math.min(w, h) / 2;
  c.beginPath();
  c.moveTo(-w / 2 + r, -h / 2); c.lineTo(w / 2 - r, -h / 2);
  c.arc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0); c.lineTo(w / 2, h / 2 - r);
  c.arc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2); c.lineTo(-w / 2 + r, h / 2);
  c.arc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI); c.lineTo(-w / 2, -h / 2 + r);
  c.arc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5); c.closePath();
}
var all = [];
function Alex(cv, o) {
  this.cv = cv; this.ctx = cv.getContext('2d');
  this.o = Object.assign({ n: 2, sx: 1, sy: 1, drop: 0, seed: 0, rings: false, pointer: 1, rs: .34 }, o || {});
  this.mood = 'idle'; this.cur = Object.assign({}, M.idle); this.tgt = Object.assign({}, M.idle);
  this.tm = this.o.seed * 3.1; this.bp = -1; this.nb = 1 + Math.random() * 3; this.vis = false; this.ck = 0; this.hold = false;
  var self = this;
  this.resize();
  if ('ResizeObserver' in window) new ResizeObserver(function () { self.resize(); }).observe(cv);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { self.vis = en[0].isIntersecting; if (self.vis) self.draw(); }).observe(cv); else this.vis = true;
  all.push(this);
  if (this.o.scene) { if (reduce) this.ck = SCENE_T[this.o.scene] || 0; this.set(SCENE_MOOD[this.o.scene](this.ck), true); }
}
Alex.prototype.resize = function () {
  var cv = this.cv, dpr = Math.min(2, window.devicePixelRatio || 1);
  this.w = cv.clientWidth || 300; this.h = cv.clientHeight || 150; this.dpr = dpr;
  cv.width = Math.round(this.w * dpr); cv.height = Math.round(this.h * dpr);
  this.R = Math.min(this.w, this.h) * this.o.rs; if (this.o.scene) this.R = Math.min(this.R, this.w / 7.4); this.draw();
};
Alex.prototype.set = function (m, snap) {
  this.mood = m; this.tgt = Object.assign({}, M[m]);
  if (reduce || snap) { this.cur = Object.assign({}, this.tgt); this.draw(); }
};
Alex.prototype.rad = function (th, tm, amp, ph) {
  var o = this.o, n = o.n, c = Math.cos(th), s = Math.sin(th);
  var r = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n), sd = o.seed + ph;
  var w = 1 + amp * (.045 * Math.sin(3 * th + tm * .7 + sd) + .03 * Math.sin(5 * th - tm * .9 + sd * 1.7) + .02 * Math.sin(2 * th + tm * .5 + sd * .6));
  var x = r * c * o.sx, y = r * s * o.sy;
  if (o.drop) { var k = Math.max(0, -s); y *= 1 + o.drop * k * k; x *= 1 - o.drop * .5 * k * k; }
  return [x * w, y * w];
};
Alex.prototype.trace = function (c, tm, amp, ph, f) {
  var N = 96; c.beginPath();
  for (var i = 0; i <= N; i++) { var p = this.rad(i / N * TAU, tm, amp, ph), x = p[0] * this.R * f, y = p[1] * this.R * f; if (i === 0) c.moveTo(x, y); else c.lineTo(x, y); }
  c.closePath();
};
Alex.prototype.step = function (dt) {
  var k = 1 - Math.exp(-dt * 8), key;
  for (key in this.tgt) this.cur[key] += (this.tgt[key] - this.cur[key]) * k;
  this.tm += dt * this.cur.spd; this.ck += dt;
  if (this.o.scene && !this.hold) { var sm = SCENE_MOOD[this.o.scene](this.ck); if (sm !== this.mood) { this.mood = sm; this.tgt = Object.assign({}, M[sm]); } }
  if (this.mood !== 'sleep' && this.mood !== 'celebrate' && this.mood !== 'laughing') {
    if (this.bp < 0) { this.nb -= dt; if (this.nb <= 0) this.bp = 0; }
    else { this.bp += dt / .17; if (this.bp >= 1) { this.bp = -1; this.nb = 2 + Math.random() * 3.5; } }
  }
  this.draw();
};
Alex.prototype.draw = function () {
  var c = this.ctx, W = this.w, H = this.h, R = this.R, e = this.cur, o = this.o, tm = this.tm, i, side;
  c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); c.clearRect(0, 0, W, H);
  var r = this.cv.getBoundingClientRect();
  var dx = reduce ? 0 : clamp((P.x - (r.left + W / 2)) / Math.max(280, W * .7), -1, 1) * o.pointer;
  var dy = reduce ? 0 : clamp((P.y - (r.top + H / 2)) / Math.max(280, H * .9), -1, 1) * o.pointer;
  var cx = W * (o.cxf || .5), cy = H / 2, bounce = e.amp > 1.3 ? Math.abs(Math.sin(tm * 4.2)) * R * .09 * (e.amp - 1) : 0;
  if (o.rings) {
    c.save(); c.translate(cx, cy);
    for (i = 0; i < 15; i++) { this.trace(c, tm * .6, 1.5, i * .55, 1.14 + i * .085); c.strokeStyle = 'rgba(236,239,244,' + (.24 - i * .014).toFixed(3) + ')'; c.lineWidth = .7; c.stroke(); }
    c.restore();
  }
  c.save(); c.translate(cx, cy + R * 1.08); c.scale(1, .16);
  var sg = c.createRadialGradient(0, 0, 0, 0, 0, R * 1.1);
  sg.addColorStop(0, 'rgba(220,224,232,' + Math.max(.05, .17 - bounce / R * .8).toFixed(3) + ')'); sg.addColorStop(1, 'rgba(220,224,232,0)');
  c.fillStyle = sg; c.beginPath(); c.arc(0, 0, R * 1.1, 0, TAU); c.fill(); c.restore();
  var br = Math.sin(tm * 1.7) * .02 * Math.min(1, e.amp);
  c.save(); c.translate(cx + dx * R * .05 + Math.sin(tm * 45) * e.shake * R * .02, cy + dy * R * .035 - bounce); c.rotate(e.roll + dx * .035); c.scale(1 + br + e.sq * .5, 1 - br - e.sq);
  this.trace(c, tm, e.amp, 0, 1); c.save(); c.clip();
  var a = -.8 + dx * .45 + Math.sin(tm * .2) * .3, gx = Math.cos(a) * R * 1.1, gy = Math.sin(a) * R * 1.1;
  var g = c.createLinearGradient(-gx, -gy, gx, gy);
  g.addColorStop(0, '#0a0a0c'); g.addColorStop(.16, '#5c6068'); g.addColorStop(.27, '#f5f7fa'); g.addColorStop(.36, '#2b2d33'); g.addColorStop(.47, '#0c0c0f');
  g.addColorStop(.58, '#b9bdc6'); g.addColorStop(.66, '#ffffff'); g.addColorStop(.74, '#3a3d44'); g.addColorStop(.88, '#0b0b0d'); g.addColorStop(1, '#8a8e97');
  c.fillStyle = g; c.fillRect(-R * 2, -R * 2, R * 4, R * 4);
  var ed = c.createRadialGradient(0, 0, 0, 0, 0, R * 1.15); ed.addColorStop(0, 'rgba(0,0,0,0)'); ed.addColorStop(.6, 'rgba(0,0,0,0)'); ed.addColorStop(1, 'rgba(0,0,0,.6)');
  c.fillStyle = ed; c.fillRect(-R * 2, -R * 2, R * 4, R * 4);
  var fp = c.createRadialGradient(0, e.ey * R, 0, 0, e.ey * R, R * .66); fp.addColorStop(0, 'rgba(228,231,238,.86)'); fp.addColorStop(.7, 'rgba(228,231,238,.5)'); fp.addColorStop(1, 'rgba(228,231,238,0)');
  c.fillStyle = fp; c.fillRect(-R * 2, -R * 2, R * 4, R * 4);
  var sp = c.createRadialGradient(-.4 * R, -.44 * R, 0, -.4 * R, -.44 * R, R * .55); sp.addColorStop(0, 'rgba(255,255,255,.65)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sp; c.fillRect(-R * 2, -R * 2, R * 4, R * 4); c.restore();
  this.trace(c, tm, e.amp, 0, 1); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 1.2; c.stroke();
  var bl = this.bp >= 0 ? 1 - Math.sin(Math.PI * this.bp) * .92 : 1, ox = (dx * .5 + e.lx * .5) * R * .09 + Math.sin(tm * 2.2) * e.sweep * R * .1, oy = (dy * .5 + e.ly * .5) * R * .06;
  var w = e.ew * R, h;
  for (i = 0; i < 2; i++) {
    side = i ? 1 : -1; h = Math.max(2, e.eh * R * bl * (i ? e.rh : 1)); c.save(); c.translate(side * e.gap * R / 2 + ox, e.ey * R + oy); c.rotate(e.tilt * side);
    if (e.arc < .99) { c.globalAlpha = 1 - e.arc; c.fillStyle = '#07070a'; pill(c, w, h); c.fill(); if (h > w * 1.6) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(-w * .16, -h * .26, w * .15, 0, TAU); c.fill(); } }
    if (e.arc > .01) { c.globalAlpha = e.arc; c.strokeStyle = '#07070a'; c.lineWidth = w * .85; c.lineCap = 'round'; c.beginPath(); c.arc(0, w * .5, w * 1.2, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); }
    c.restore();
  }
  if (o.scene === 'voice') {
    c.strokeStyle = '#e9ecf1'; c.lineWidth = R * .07; c.lineCap = 'round'; c.beginPath(); c.arc(0, 0, R * 1.02, Math.PI * 1.07, Math.PI * 1.93); c.stroke();
    c.fillStyle = '#0b0c0e'; c.lineWidth = 1.2;
    [-1, 1].forEach(function (sd) { rr(c, sd * R * 1.0 - R * .1, -R * .18, R * .2, R * .46, R * .08); c.fill(); c.stroke(); });
    c.lineWidth = R * .04; c.beginPath(); c.moveTo(-R * 1.0, R * .26); c.quadraticCurveTo(-R * .95, R * .75, -R * .45, R * .78); c.stroke();
    c.beginPath(); c.arc(-R * .42, R * .78, R * .07, 0, TAU); c.fillStyle = '#e9ecf1'; c.fill();
  }
  c.restore();
  if (o.scene && S[o.scene]) { c.save(); S[o.scene](c, cx, cy, R, this.ck); c.restore(); }
};
var FG = '#eef0f3', MID = 'rgba(238,240,243,.45)', DIM = 'rgba(238,240,243,.2)';
function rr(c, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function gear(c, x, y, r, rot) {
  c.beginPath();
  for (var i = 0; i < 32; i++) { var a = rot + i * TAU / 32, d = (i % 4 < 2) ? r : r * .78; if (i) c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d); else c.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d); }
  c.closePath(); c.fillStyle = 'rgba(238,240,243,.14)'; c.fill(); c.strokeStyle = MID; c.lineWidth = 1; c.stroke(); c.beginPath(); c.arc(x, y, r * .28, 0, TAU); c.stroke();
}
var SCENE_MOOD = {
  voice: function (t) { var p = t % 4.8; return p < 1.8 ? 'listen' : (p < 4.4 ? 'happy' : 'idle'); },
  automation: function (t) { var p = t % 6.4; return (p > 4.9 && p < 6.2) ? 'celebrate' : 'work'; },
  software: function () { return 'work'; },
  marketing: function (t) { return (t % 4) < 2.4 ? 'excited' : 'proud'; },
  lead: function (t) { return (t % 3.6) < 2.4 ? 'searching' : 'happy'; },
  audit: function (t) { return (t % 7) < 4.6 ? 'think' : 'proud'; }
};
var SCENE_T = { voice: 2.3, automation: 5.2, software: 4, marketing: 1.5, lead: 1.5, audit: 5.4 };
var S = {
  audit: function (c, cx, cy, R, t) {
    var x0 = cx + R * 1.5, w = R * 3.1, nodes = [[0, .55], [.27, .12], [.52, .64], [.77, .2], [1, .5]], P = nodes.map(function (q) { return [x0 + q[0] * w, cy - R * 1.05 + q[1] * R * 2.1]; }), fixed = (t % 7) > 4.6, i;
    c.strokeStyle = fixed ? MID : DIM; c.lineWidth = 1.3; c.beginPath(); P.forEach(function (p, k) { if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }); c.stroke();
    var u = ((t * .32) % 1) * (P.length - 1), i0 = Math.min(P.length - 2, Math.floor(u)), f = u - i0, a = P[i0], b2 = P[i0 + 1];
    c.fillStyle = FG; c.beginPath(); c.arc(a[0] + (b2[0] - a[0]) * f, a[1] + (b2[1] - a[1]) * f, 3, 0, TAU); c.fill();
    for (i = 0; i < P.length; i++) {
      var p = P[i], r = R * .16, hot = i === 2 && !fixed;
      c.beginPath(); c.arc(p[0], p[1], r, 0, TAU); c.fillStyle = hot ? FG : '#0b0c0e'; c.fill(); c.strokeStyle = hot ? FG : MID; c.lineWidth = 1.3; c.stroke();
      if (hot) {
        var pl = (t * 1.1) % 1; c.beginPath(); c.arc(p[0], p[1], r * (1 + pl * 1.7), 0, TAU); c.strokeStyle = 'rgba(238,240,243,' + ((1 - pl) * .7).toFixed(3) + ')'; c.stroke();
        c.fillStyle = '#0b0c0e'; c.font = '400 ' + Math.round(R * .22) + 'px DM Mono, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', p[0], p[1] + 1);
        c.fillStyle = FG; c.font = '400 ' + Math.round(R * .15) + 'px DM Mono, monospace'; c.textBaseline = 'alphabetic'; c.fillText('BOTTLENECK', p[0], p[1] + r * 2.6);
      } else if (i === 2) {
        c.strokeStyle = FG; c.lineWidth = 1.8; c.beginPath(); c.moveTo(p[0] - r * .45, p[1]); c.lineTo(p[0] - r * .1, p[1] + r * .38); c.lineTo(p[0] + r * .5, p[1] - r * .35); c.stroke();
        c.fillStyle = FG; c.font = '400 ' + Math.round(R * .15) + 'px DM Mono, monospace'; c.textAlign = 'center'; c.fillText('RANKED', p[0], p[1] + r * 2.6);
      }
    }
  },
  voice: function (c, cx, cy, R, t) {
    var T = 4.8, p = t % T, a1 = clamp(p / .3, 0, 1) * clamp((3 - p) / .35, 0, 1), a2 = clamp((p - 1.8) / .3, 0, 1) * clamp((T - .35 - p) / .3, 0, 1);
    var bx = cx + R * 1.55, bw = R * 2.1, bh = R * .74, i;
    c.save(); c.globalAlpha = a1; c.translate(0, (1 - a1) * 6);
    rr(c, bx, cy - R * 1.25, bw, bh, R * .2); c.fillStyle = 'rgba(13,14,17,.92)'; c.fill(); c.strokeStyle = MID; c.lineWidth = 1; c.stroke();
    c.fillStyle = FG; for (i = 0; i < 3; i++) { c.beginPath(); c.arc(bx + bw / 2 + (i - 1) * R * .3, cy - R * 1.25 + bh / 2 + Math.sin(t * 8 + i * .8) * R * .07, R * .07, 0, TAU); c.fill(); }
    c.restore();
    c.save(); c.globalAlpha = a2; c.translate(0, (1 - a2) * 6);
    rr(c, bx - R * .1, cy - R * .05, bw + R * .1, bh, R * .2); c.fillStyle = FG; c.fill(); c.fillStyle = '#0b0c0e';
    rr(c, bx + R * .15, cy - R * .05 + bh * .28, (.55 + .35 * Math.sin(t * 5)) * bw * .8, R * .1, R * .05); c.fill();
    rr(c, bx + R * .15, cy - R * .05 + bh * .58, (.4 + .3 * Math.sin(t * 4 + 1)) * bw * .8, R * .1, R * .05); c.fill();
    c.restore();
    if (a2 > .05) for (var k = 0; k < 3; k++) { var f = (t * 1.1 + k / 3) % 1; c.beginPath(); c.arc(cx + R * .2, cy + R * .2, R * (1.25 + f * .7), -.45, .45); c.strokeStyle = 'rgba(238,240,243,' + (a2 * (1 - f) * .6).toFixed(3) + ')'; c.lineWidth = 1.2; c.stroke(); }
  },
  automation: function (c, cx, cy, R, t) {
    var p = t % 6.4, px = cx + R * 1.55, py = cy - R * 1, w = R * 2.15, h = R * 2, i;
    rr(c, px, py, w, h, R * .14); c.fillStyle = 'rgba(13,14,17,.92)'; c.fill(); c.strokeStyle = DIM; c.lineWidth = 1; c.stroke();
    for (i = 0; i < 3; i++) {
      var ry = py + R * .28 + i * R * .58, q = clamp((p - i * 1.7 - .3) / 1.1, 0, 1), bs = R * .3, bx = px + R * .22;
      rr(c, bx, ry, bs, bs, R * .06); c.strokeStyle = q >= 1 ? FG : MID; c.lineWidth = 1.2; c.stroke();
      if (q >= 1) { c.fillStyle = FG; rr(c, bx, ry, bs, bs, R * .06); c.fill(); c.strokeStyle = '#0b0c0e'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(bx + bs * .22, ry + bs * .52); c.lineTo(bx + bs * .43, ry + bs * .72); c.lineTo(bx + bs * .8, ry + bs * .28); c.stroke(); }
      else if (q > 0) { c.strokeStyle = FG; c.lineWidth = 1.6; c.beginPath(); c.arc(bx + bs / 2, ry + bs / 2, bs * .32, t * 7, t * 7 + 4.2); c.stroke(); }
      var lw = w - R * .44 - bs - R * .2; c.fillStyle = q >= 1 ? MID : DIM; rr(c, bx + bs + R * .2, ry + bs * .32, lw * (.55 + .15 * i) * (.35 + .65 * q), R * .1, R * .05); c.fill();
    }
    gear(c, cx - R * 1.3, cy - R * .95, R * .34, t * 1.2); gear(c, cx - R * .78, cy - R * 1.28, R * .22, -t * 1.86 + .3);
  },
  software: function (c, cx, cy, R, t) {
    var sx = cx - R * 1.05, sw = R * 2.1, sy = cy + R * .32, sh = R * .95, i;
    rr(c, sx, sy, sw, sh, R * .1); c.fillStyle = '#0a0b0d'; c.fill(); c.strokeStyle = 'rgba(238,240,243,.55)'; c.lineWidth = 1.2; c.stroke();
    for (i = 0; i < 3; i++) { c.beginPath(); c.arc(sx + R * .16 + i * R * .13, sy + R * .13, R * .035, 0, TAU); c.fillStyle = i ? DIM : MID; c.fill(); }
    var widths = [.9, .6, 1.1, .5, .8, .7], ind = [0, .15, .15, .3, .15, 0], prog = (t * 1.5) % 7;
    for (i = 0; i < 6; i++) { var rv = clamp(prog - i, 0, 1); if (rv <= 0) continue; c.fillStyle = (i % 3 === 0) ? FG : MID; rr(c, sx + R * .18 + ind[i] * R, sy + R * .3 + i * R * .115, Math.max(2, widths[i] * R * rv), R * .055, R * .027); c.fill(); }
    var ci = Math.min(5, Math.floor(prog)), rv2 = clamp(prog - ci, 0, 1);
    if (Math.floor(t * 2) % 2 === 0 && prog < 6) { c.fillStyle = FG; c.fillRect(sx + R * .18 + ind[ci] * R + widths[ci] * R * rv2 + 3, sy + R * .3 + ci * R * .115 - R * .02, 2, R * .1); }
    rr(c, cx - R * 1.25, sy + sh + R * .04, R * 2.5, R * .1, R * .05); c.fillStyle = '#cfd3da'; c.fill();
    var G = ['</>', '{ }', '01', '( )']; c.font = '400 ' + Math.round(R * .3) + 'px DM Mono, monospace'; c.textAlign = 'center';
    for (var g = 0; g < 4; g++) { var f = (t * .4 + g * .25) % 1, gx = cx + (g % 2 ? 1.55 : -1.6) * R + (g > 1 ? R * .3 : 0), gy = cy + R * .1 - f * R * 1.4; c.fillStyle = 'rgba(238,240,243,' + (Math.sin(f * Math.PI) * .7).toFixed(3) + ')'; c.fillText(G[g], gx, gy); }
  },
  marketing: function (c, cx, cy, R, t) {
    c.save(); c.translate(cx + R * 1.1, cy - R * .1); c.rotate(-.5 + Math.sin(t * 3) * .04);
    c.beginPath(); c.moveTo(0, -R * .13); c.lineTo(R * .7, -R * .42); c.lineTo(R * .7, R * .42); c.lineTo(0, R * .13); c.closePath(); c.fillStyle = FG; c.fill();
    rr(c, R * .7, -R * .48, R * .12, R * .96, R * .05); c.fillStyle = '#b9bdc6'; c.fill(); rr(c, R * .05, R * .1, R * .2, R * .32, R * .05); c.fillStyle = '#8c909a'; c.fill(); c.restore();
    var mx = cx + R * 1.1 + Math.cos(-.5) * R * .86, my = cy - R * .1 + Math.sin(-.5) * R * .86, i;
    for (i = 0; i < 3; i++) { var f = (t * .9 + i / 3) % 1; c.beginPath(); c.arc(mx, my, R * (.22 + f * .75), -1.05, .05); c.strokeStyle = 'rgba(238,240,243,' + ((1 - f) * .7).toFixed(3) + ')'; c.lineWidth = 1.3; c.stroke(); }
    var cyc = (t * .55) % 1.6, e = 1 - Math.pow(1 - clamp(cyc / 1.1, 0, 1), 3), bx0 = cx + R * 2.15, base = cy + R * 1.15, hs = [.45, .7, .95, 1.3];
    c.strokeStyle = DIM; c.lineWidth = 1; c.beginPath(); c.moveTo(bx0 - R * .15, base + 2); c.lineTo(bx0 + R * 1.75, base + 2); c.stroke();
    for (i = 0; i < 4; i++) { var hh = hs[i] * R * e * .9; c.fillStyle = i === 3 ? FG : MID; rr(c, bx0 + i * R * .45, base - hh, R * .3, Math.max(1, hh), R * .04); c.fill(); }
  },
  lead: function (c, cx, cy, R, t) {
    var x0 = 8, x1 = cx - R * 1.15, L = Math.max(40, x1 - x0), scan = x0 + L * .5, lane = cy + R * .98, hr = R * .17, i;
    c.save(); c.setLineDash([3, 4]); c.strokeStyle = MID; c.lineWidth = 1; c.beginPath(); c.moveTo(scan, cy - R * 1.1); c.lineTo(scan, lane + R * .5); c.stroke(); c.restore();
    var pulse = .5 + .5 * Math.sin(t * 4); c.beginPath(); c.arc(scan, cy - R * 1.1, R * .2, 0, TAU); c.strokeStyle = 'rgba(238,240,243,' + (.5 + pulse * .4).toFixed(3) + ')'; c.lineWidth = 1.4; c.stroke();
    c.beginPath(); c.moveTo(scan + R * .14, cy - R * 1.1 + R * .14); c.lineTo(scan + R * .3, cy - R * 1.1 + R * .3); c.stroke();
    c.beginPath(); c.moveTo(x0, lane + R * .62); c.lineTo(x1, lane + R * .62); c.strokeStyle = DIM; c.lineWidth = 1; c.stroke();
    for (i = 0; i < 4; i++) {
      var x = x0 + ((t * 34 + i * L / 4) % L), id = x > scan, a = 1 - clamp((x - (x1 - R * .5)) / (R * .5), 0, 1);
      c.save(); c.globalAlpha = a; c.fillStyle = FG; c.strokeStyle = id ? FG : MID; c.lineWidth = 1.2;
      c.beginPath(); c.arc(x, lane - hr * 1.5, hr, 0, TAU); if (id) c.fill(); else c.stroke();
      c.beginPath(); c.arc(x, lane + hr * .7, hr * 1.35, Math.PI, 0); if (id) c.fill(); else c.stroke();
      if (id) { rr(c, x - R * .3, lane - hr * 1.5 - R * .55, R * .6, R * .26, R * .06); c.fillStyle = 'rgba(13,14,17,.95)'; c.fill(); c.strokeStyle = FG; c.lineWidth = 1; c.stroke(); c.fillStyle = FG; rr(c, x - R * .2, lane - hr * 1.5 - R * .55 + R * .09, R * .4 * (i % 2 ? 1 : .6), R * .07, R * .035); c.fill(); }
      else { c.fillStyle = MID; c.font = '400 ' + Math.round(R * .3) + 'px DM Mono, monospace'; c.textAlign = 'center'; c.fillText('?', x, lane - hr * 1.5 - R * .3); }
      c.restore();
    }
  }
};
if (!reduce) {
  var last = performance.now();
  (function frame(now) { var dt = Math.min(.05, (now - last) / 1000); last = now; for (var i = 0; i < all.length; i++) if (all[i].vis) all[i].step(dt); requestAnimationFrame(frame); })(last);
}
var SHAPES = {
  ball: { n: 2, seed: 1 }, cube: { n: 4, sx: .88, sy: .88, seed: 2 }, drop: { n: 2, drop: .55, sx: .95, sy: .8, seed: 4 },
  bean: { n: 2, sx: .8, sy: 1.08, seed: 6 }, pebble: { n: 3, sx: 1, sy: .8, seed: 9 }
};
function later(fn, ms) { return setTimeout(fn, ms); }
function wire(host, a, rest) {
  var busy = 0, sc = !!a.o.scene;
  var done = function () { if (sc) a.hold = false; else a.set(rest); };
  host.addEventListener('pointerenter', function () { if (!busy) { a.hold = true; a.set('listen'); } });
  host.addEventListener('pointerleave', function () { if (!busy) done(); });
  host.addEventListener('click', function () { busy++; a.hold = true; a.set('celebrate'); later(function () { busy--; if (!busy) done(); }, 1500); });
}

/* ---------- renderers ---------- */
function fmt(c, v) { return (c.prefix || '') + Number(v).toLocaleString('en-US', { minimumFractionDigits: c.decimals || 0, maximumFractionDigits: c.decimals || 0 }) + (c.suffix || ''); }
function numCell(c, cls) { return '<div><span class="num" data-n="' + c.value + '">' + esc(fmt(c, reduce ? c.value : 0)) + '</span><span class="lbl">' + esc(c.label) + '</span></div>'; }
function fillNums(root, list) {
  var cells = $$('.num', root);
  var run = function () {
    var t0 = performance.now(), D = 1100;
    (function tick(now) {
      var p = clamp((now - t0) / D, 0, 1), k = 1 - Math.pow(1 - p, 3);
      cells.forEach(function (n, i) { n.textContent = fmt(list[i], list[i].value * k); });
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  };
  if (reduce || !('IntersectionObserver' in window)) { cells.forEach(function (n, i) { n.textContent = fmt(list[i], list[i].value); }); return; }
  var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { io.disconnect(); run(); } }, { threshold: .3 });
  io.observe(root);
  later(function () { cells.forEach(function (n, i) { if (n.textContent === fmt(list[i], 0)) n.textContent = fmt(list[i], list[i].value); }); }, 9000);
}
function renderNums() {
  [['counters', CFG.counters], ['homeStats', CFG.stats], ['resStats', CFG.stats]].forEach(function (p) {
    var root = document.getElementById(p[0]); root.innerHTML = p[1].map(numCell).join(''); fillNums(root, p[1]);
  });
}
function svcById(id) { return CFG.services.filter(function (s) { return s.id === id; })[0]; }
function renderServices() {
  $('#homeServices').innerHTML = CFG.services.map(function (s) {
    return '<article class="card" data-shape="' + s.shape + '" data-sid="' + s.id + '" data-tip="' + esc(s.tip) + '" data-mood="idle"><canvas class="chara" role="img" aria-label="' + esc(s.name) + ' character"></canvas><h3>' + esc(s.name) + '</h3><p>' + esc(s.short) + '</p><a class="go" href="#services-' + s.id + '">Learn more <span>&rarr;</span></a></article>';
  }).join('');
  $('#subnav').innerHTML = CFG.services.map(function (s) { return '<a href="#services-' + s.id + '" data-sid="' + s.id + '">' + esc(s.name) + '</a>'; }).join('');
  $('#svcList').innerHTML = CFG.services.map(function (s) {
    var note = (s.id === 'voice-agents' && CFG.outbound_policy_note) ? '<p class="note" style="margin-top:14px">' + esc(CFG.outbound_policy_note) + '</p>' : '';
    return '<article class="svc" id="svc-' + s.id + '" data-sid="' + s.id + '" data-tip="' + esc(s.tip) + '" data-mood="idle">' +
      '<div class="svc-l"><canvas class="chara" data-shape="' + s.shape + '" data-sid="' + s.id + '" role="img" aria-label="' + esc(s.name) + ' character"></canvas><h2 class="h2">' + esc(s.name) + '</h2><p class="problem">' + esc(s.problem) + '</p></div>' +
      '<div class="svc-r"><div><h4>What we build</h4><ul class="ticks">' + s.build.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' + note + '</div>' +
      '<div><h4>Example use cases</h4><ul class="ticks">' + s.use.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="full"><div class="tl"><span class="lbl" style="color:var(--muted)">Typical timeline</span><b>' + esc(s.timeline) + '</b></div><a class="btn solid" href="#start" data-track="cta_click_path_a">Start a project</a></div></div></article>';
  }).join('');
  $('#footSvc').innerHTML = CFG.services.map(function (s) { return '<a href="#services-' + s.id + '">' + esc(s.name) + '</a>'; }).join('');
}
function renderMisc() {
  $('#industries').innerHTML = CFG.industries.map(function (t) { return '<span class="tag plain">' + esc(t) + '</span>'; }).join('');
  $('#tech').innerHTML = CFG.technologies.map(function (t) { return '<span class="tag plain">' + esc(t) + '</span>'; }).join('');
  var faq = function (id, list) { $(id).innerHTML = list.map(function (f) { return '<details><summary>' + esc(tpl(f.q)) + '</summary><p>' + esc(tpl(f.a)) + '</p></details>'; }).join(''); };
  faq('#faqHome', CFG.faqs); faq('#faqCons', CFG.consultation_faqs);
  $('#methodRows').innerHTML = CFG.method.map(function (m, i) { return '<div class="row"><span class="lbl"><span class="chk" aria-hidden="true"></span>' + esc(m.name) + '</span><p>' + esc(m.text) + '</p></div>'; }).join('');
  $('#agenda').innerHTML = CFG.agenda.map(function (a, i) { return '<li><span class="n">0' + (i + 1) + '</span><div><span class="lbl">' + esc(a.time) + '</span><h3>' + esc(a.title) + '</h3><p>' + esc(a.desc || '') + '</p></div></li>'; }).join('');
  $('#sheet').innerHTML = CFG.deliverables.map(function (d, i) { return '<li><i>0' + (i + 1) + '</i><b>' + esc(d.title) + '</b><span>' + esc(d.text) + '</span></li>'; }).join('');
  $('#priceList').innerHTML = CFG.price_includes.map(function (t) { return '<li>' + esc(tpl(t)) + '</li>'; }).join('');
  var soc = { linkedin: 'LinkedIn', instagram: 'Instagram', tiktok: 'TikTok', facebook: 'Facebook' }, h = '';
  Object.keys(soc).forEach(function (k) { if (CFG.socials[k]) h += '<a href="' + esc(CFG.socials[k]) + '" target="_blank" rel="noopener">' + soc[k] + '</a>'; });
  $('#footSoc').insertAdjacentHTML('afterbegin', h);
  $('#consLink').hidden = !CFG.flags.show_consultation_footer_link;
  $$('[data-flag]').forEach(function (n) { if (!CFG.flags[n.dataset.flag]) n.hidden = true; });
  [['founderPhoto', 'AN'], ['consPhoto', 'AN']].forEach(function (p) {
    var n = document.getElementById(p[0]);
    n.innerHTML = CFG.founder_photo_url ? '<img src="' + esc(CFG.founder_photo_url) + '" alt="Adil Nazir">' : '<span aria-hidden="true">' + p[1] + '</span>';
  });
  if (CFG.outbound_policy_note) { var n = $('#outboundNote'); n.textContent = CFG.outbound_policy_note; n.hidden = false; }
  $$('[data-needs]').forEach(function (s) { if (!(CFG[s.dataset.needs] || []).length) s.hidden = true; });
}
var openVideo = function () {};
function initials(n) { var p = String(n).trim().split(/\s+/); return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
function renderQuotes() {
  var card = function (t) {
    return '<figure class="quote">' + (t.tag ? '<span class="tag">' + esc(t.tag) + '</span>' : '') + (t.result ? '<p class="res">' + esc(t.result) + '</p>' : '') +
      '<blockquote>&ldquo;' + esc(t.quote) + '&rdquo;</blockquote><figcaption class="qwho"><span class="avatar" aria-hidden="true">' + esc(initials(t.name)) + '</span><span class="who"><b>' + esc(t.name) + '</b><span>' + esc([t.role, t.company].filter(Boolean).join(', ')) + '</span></span></figcaption></figure>';
  };
  var T = CFG.testimonials;
  var tags = ['All', 'AI', 'Ads', 'Lead Capture', 'Dev'], cur = 'All', fl = $('#qFilters'), out = $('#resQuotes');
  var draw = function () {
    out.innerHTML = T.filter(function (t) { return cur === 'All' || t.tag === cur; }).map(card).join('');
    $$('.chip', fl).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.t === cur)); });
  };
  fl.innerHTML = tags.map(function (t) { return '<button class="chip" type="button" data-t="' + t + '" aria-pressed="false">' + t + '</button>'; }).join('');
  fl.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (b) { cur = b.dataset.t; draw(); } });
  draw();
}
function renderVideos() {
  var V = CFG.video_testimonials; if (!V.length) return;
  var P = CFG.proof || {};
  var card = function (v, feat) {
    var has = !!v.video_url, st = v.poster_url ? ' style="background-image:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,.65)),url(' + esc(v.poster_url) + ');background-size:cover;background-position:center"' : '';
    var label = feat ? [P.label, v.duration].filter(Boolean).join(' · ') : (v.duration || '');
    var inner = (has ? '<span class="pl" aria-hidden="true"></span>' : '') + (label ? '<span class="dur lbl">' + esc(label) + '</span>' : '') + '<span class="ini" aria-hidden="true">' + esc(initials(v.name)) + '</span>' +
      (v.result_chip ? '<span class="tag res">' + esc(v.result_chip) + '</span>' : '') + '<span class="nm">' + esc(v.name) + '</span><span class="co">' + esc([v.role, v.company].filter(Boolean).join(', ')) + '</span>';
    return has ? '<button class="vcard play' + (feat ? ' feat' : '') + '" type="button" data-url="' + esc(v.video_url) + '" aria-label="Play video: ' + esc(v.name) + '"' + st + '>' + inner + '</button>' : '<div class="vcard' + (feat ? ' feat' : '') + '"' + st + '>' + inner + '</div>';
  };
  $$('[data-videos]').forEach(function (c) {
    c.innerHTML = card(V[0], true) + '<div class="vcol">' + V.slice(1, 4).map(function (v) { return card(v, false); }).join('') + '</div>';
    if (V.length < 2) c.style.gridTemplateColumns = '1fr';
    if (c.hasAttribute('data-vcta') && P.cta_title) c.insertAdjacentHTML('beforeend', '<div class="vcta"><div><h3>' + esc(P.cta_title) + '</h3><p>' + esc(tpl(P.cta_sub)) + '</p></div><a class="btn on-paper solid xl" href="#start" data-track="cta_click_path_a">Book a Free Discovery Call</a></div>');
  });
  var modal = $('#vmodal'), box = $('#vbox'), back = null;
  var embed = function (u) {
    var m;
    if ((m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/))) return { f: 'https://www.youtube.com/embed/' + m[1] + '?autoplay=1' };
    if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { f: 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1' };
    if ((m = u.match(/loom\.com\/(?:share|embed)\/([\w]+)/))) return { f: 'https://www.loom.com/embed/' + m[1] + '?autoplay=1' };
    return { v: u };
  };
  var close = function () { modal.hidden = true; $$('iframe,video', box).forEach(function (n) { n.remove(); }); if (back) back.focus(); };
  openVideo = function (btn) {
    back = btn; var e = embed(btn.dataset.url), n;
    if (e.f) { n = el('iframe'); n.src = e.f; n.allow = 'autoplay; fullscreen; picture-in-picture'; n.title = 'Video'; n.setAttribute('allowfullscreen', ''); } else { n = el('video'); n.src = e.v; n.controls = true; n.autoplay = true; n.setAttribute('playsinline', ''); }
    box.appendChild(n); modal.hidden = false; $('#vclose').focus();
  };
  $('#vclose').addEventListener('click', close);
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) close(); });
  document.addEventListener('click', function (e) { var b = e.target.closest('.vcard.play'); if (b) openVideo(b); });
}

/* ---------- pipeline ---------- */
function pipeline() {
  var pipe = $('#pipe'), body = $('#pipeBody'), i = 0, timer = 0, user = false, vis = false;
  pipe.innerHTML = CFG.method.map(function (m, k) { return '<button class="step" type="button" role="tab" id="st' + k + '" data-i="' + k + '" aria-selected="false"><span class="lbl">Step ' + (k + 1) + '</span><span class="t">' + esc(m.name) + '</span></button>'; }).join('');
  var steps = $$('.step', pipe);
  var show = function (k, run) {
    i = k;
    steps.forEach(function (s, n) { s.setAttribute('aria-selected', String(n === k)); s.setAttribute('tabindex', n === k ? '0' : '-1'); s.classList.remove('run'); });
    if (run) { void steps[k].offsetWidth; steps[k].classList.add('run'); }
    var m = CFG.method[k];
    body.innerHTML = '<div><p class="lbl">' + esc(m.name) + '</p><p>' + esc(m.text) + '</p></div><div><p class="lbl">Output</p><p>' + esc(m.out) + '</p></div>';
  };
  var loop = function () { clearTimeout(timer); if (user || reduce || !vis) return; timer = later(function () { show((i + 1) % steps.length, true); loop(); }, 4200); };
  steps.forEach(function (s) { s.addEventListener('click', function () { user = true; clearTimeout(timer); show(+s.dataset.i, false); }); });
  pipe.addEventListener('keydown', function (e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return; e.preventDefault(); user = true; clearTimeout(timer);
    var k = (i + (e.key === 'ArrowRight' ? 1 : steps.length - 1)) % steps.length; show(k, false); steps[k].focus();
  });
  show(0, !reduce);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { vis = en[0].isIntersecting; if (vis) { show(i, !user && !reduce); loop(); } else clearTimeout(timer); }, { threshold: .4 }).observe(pipe);
}

/* ---------- finder ---------- */
function finder(react) {
  var chips = $('#finderChips'), out = $('#finderOut'), sel = {};
  chips.innerHTML = CFG.finder.map(function (o) { return '<button class="chip" type="button" data-id="' + o.id + '" aria-pressed="false">' + esc(o.label) + '</button>'; }).join('');
  var draw = function () {
    var score = {}, order = [];
    CFG.finder.forEach(function (o) { if (sel[o.id]) o.services.forEach(function (s, k) { if (!(s in score)) { score[s] = 0; order.push(s); } score[s] += (2 - k); }); });
    if (!order.length) { out.innerHTML = '<p class="lbl" style="color:var(--muted)">Alex says</p><p style="font-size:18px;color:var(--soft)">Pick one or more. I will suggest where to start.</p>'; return; }
    order.sort(function (a, b) { return score[b] - score[a]; });
    var top = svcById(order[0]);
    out.innerHTML = '<p class="lbl" style="color:var(--muted)">Alex says</p><p style="font-size:clamp(18px,2vw,22px)">Start with <b style="font-weight:500">' + esc(top.name) + '</b>. ' + esc(top.problem) + '</p><div class="res">' +
      order.slice(0, 3).map(function (id) { var s = svcById(id); return '<a href="#services-' + id + '">' + esc(s.name) + '<span>&rarr;</span></a>'; }).join('') + '</div><p class="fine">Not sure? The free call is where we work it out.</p>';
  };
  chips.addEventListener('click', function (e) { var b = e.target.closest('.chip'); if (!b) return; var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); sel[b.dataset.id] = on; draw(); react(on ? 'excited' : 'idle'); });
  draw();
}

/* ---------- recreated conversation player ---------- */
function demo(alex) {
  var scen = $('#scen'), chat = $('#chat'), wave = $('#wave'), title = $('#demoTitle'), cur = CFG.demo[0], timers = [], started = false;
  scen.innerHTML = CFG.demo.map(function (d) { return '<button type="button" data-id="' + d.id + '" aria-pressed="false"><b>' + esc(d.label) + '</b><span>' + esc(d.sub) + '</span></button>'; }).join('');
  var stop = function () { timers.forEach(clearTimeout); timers = []; wave.classList.remove('on'); };
  var msg = function (l) {
    var m = el('div', 'msg ' + l.who);
    m.innerHTML = l.who === 'sys' ? esc(l.text) : '<small>' + esc(l.name) + '</small>' + esc(l.text);
    chat.appendChild(m); chat.scrollTop = chat.scrollHeight;
  };
  var play = function (d) {
    stop(); cur = d; chat.innerHTML = ''; title.textContent = d.title;
    $$('button', scen).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.id === d.id)); });
    if (reduce) { d.lines.forEach(msg); alex.set('celebrate', true); return; }
    var t = 300;
    d.lines.forEach(function (l, k) {
      if (l.who === 'alex') {
        timers.push(later(function () { alex.set('think'); wave.classList.remove('on'); var ty = el('div', 'typing', '<i></i><i></i><i></i>'); ty.id = 'ty'; chat.appendChild(ty); chat.scrollTop = chat.scrollHeight; }, t)); t += 800;
        timers.push(later(function () { var ty = $('#ty'); if (ty) ty.remove(); alex.set('work'); wave.classList.add('on'); msg(l); }, t)); t += 900 + l.text.length * 22;
      } else if (l.who === 'them') {
        timers.push(later(function () { alex.set('listen'); wave.classList.remove('on'); msg(l); }, t)); t += 700 + l.text.length * 18;
      } else { timers.push(later(function () { msg(l); }, t)); t += 800; }
    });
    timers.push(later(function () { wave.classList.remove('on'); alex.set('celebrate'); timers.push(later(function () { alex.set('idle'); }, 2200)); }, t));
  };
  scen.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) { started = true; play(CFG.demo.filter(function (d) { return d.id === b.dataset.id; })[0]); } });
  $('#replay').addEventListener('click', function () { started = true; play(cur); });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting && !started) { started = true; play(cur); } }, { threshold: .45 }).observe($('#demo')); else play(cur);
  $$('button', scen)[0].setAttribute('aria-pressed', 'true');
}

/* ---------- availability, copy, menu, cookies ---------- */
function availability() {
  var a = CFG.availability, sp = a.start.split(':'), ep = a.end.split(':'), now = new Date();
  var base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  var s = new Date(base + ((+sp[0] - a.utc_offset) * 60 + (+sp[1] || 0)) * 60000), e = new Date(base + ((+ep[0] - a.utc_offset) * 60 + (+ep[1] || 0)) * 60000);
  var f = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }), zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (x) {}
  $('#avail').textContent = a.days + ', ' + f.format(s) + ' to ' + f.format(e);
  $('#availTz').textContent = 'Shown in your time zone' + (zone ? ' (' + zone + ')' : '');
}
function misc() {
  var mb = $('#menuBtn'), mp = $('#menuPanel');
  mb.addEventListener('click', function () { var o = mp.hidden; mp.hidden = !o; mb.setAttribute('aria-expanded', String(o)); mb.textContent = o ? 'Close' : 'Menu'; });
  mp.addEventListener('click', function (e) { if (e.target.closest('a')) { mp.hidden = true; mb.setAttribute('aria-expanded', 'false'); mb.textContent = 'Menu'; } });
  var cb = $('#copyMail');
  cb.addEventListener('click', function () {
    var t = CFG.brand.email, ok = function () { cb.textContent = 'Copied'; later(function () { cb.textContent = 'Copy email'; }, 1800); };
    var fb = function () { var r = document.createRange(); r.selectNodeContents($('#mailLink')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); cb.textContent = 'Press Ctrl+C'; };
    try { navigator.clipboard.writeText(t).then(ok, fb); } catch (x) { fb(); }
  });
  var ck = $('#cookie');
  if (!store('im_consent')) ck.hidden = false;
  $('#ckYes').addEventListener('click', function () { store('im_consent', 'yes'); ck.hidden = true; });
  $('#ckNo').addEventListener('click', function () { store('im_consent', 'no'); ck.hidden = true; });
  document.addEventListener('click', function (e) { var t = e.target.closest('[data-track]'); if (t) track(t.dataset.track); });
  document.addEventListener('pointermove', function (e) { var c = e.target.closest && e.target.closest('.card'); if (c) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); } }, { passive: true });
}

/* ---------- booking flows (discovery = free, consultation = paid) ---------- */
var HR = 3600e3, lastBooking = null;
try { lastBooking = JSON.parse(localStorage.getItem('im_booking') || 'null'); } catch (x) {}
var TZ = (function () { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (x) { return 'UTC'; } })();
function fmtT(ms, o, tz) { try { return new Intl.DateTimeFormat(undefined, Object.assign({ timeZone: tz || TZ }, o)).format(new Date(ms)); } catch (x) { return new Date(ms).toUTCString(); } }
function ymd(ms) { try { return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms)); } catch (x) { return new Date(ms).toISOString().slice(0, 10); } }

/* every bookable hour in the next three weeks, as UTC milliseconds */
function teamSlots(kind) {
  var A = CFG.availability, B = CFG.booking, off = A.utc_offset, sh = parseInt(A.start, 10), eh = parseInt(A.end, 10), paid = kind === 'consultation';
  var last = paid ? eh - 2 : eh - 1, lead = (paid ? B.consultation_lead_hours : B.discovery_lead_hours) * HR, now = Date.now(), out = [];
  var n = new Date(now + off * HR), y = n.getUTCFullYear(), m = n.getUTCMonth(), d = n.getUTCDate();
  for (var i = 0; i < 21; i++) {
    var day = Date.UTC(y, m, d + i), wd = new Date(day).getUTCDay();
    if (A.weekdays.indexOf(wd) < 0) continue;
    for (var h = sh; h <= last; h++) { var t = day + (h - off) * HR; if (t >= now + lead) out.push(t); }
  }
  return out;
}
/* the next N days that still have free hours, grouped by the visitor's own calendar day */
function buildDays(kind, taken) {
  var map = {}, order = [];
  teamSlots(kind).forEach(function (t) {
    if (taken[t] || (kind === 'consultation' && taken[t + HR])) return;
    var k = ymd(t); if (!map[k]) { map[k] = { key: k, t0: t, slots: [] }; order.push(k); }
    map[k].slots.push(t);
  });
  return order.slice(0, CFG.booking.slot_days).map(function (k) { return map[k]; });
}
function previewTaken() { var o = {}; try { (JSON.parse(localStorage.getItem('im_preview_taken') || '[]')).forEach(function (t) { o[t] = 1; }); } catch (x) {} return o; }
function rememberPreview(t, paid) { try { var a = JSON.parse(localStorage.getItem('im_preview_taken') || '[]'); a.push(t); if (paid) a.push(t + HR); localStorage.setItem('im_preview_taken', JSON.stringify(a)); } catch (x) {} }
function fetchTaken() {
  var u = CFG.booking.endpoint; if (!u) return Promise.resolve(previewTaken());
  var ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(function () { ctl.abort(); }, 8000);
  return fetch(u + (u.indexOf('?') > -1 ? '&' : '?') + 'action=slots', { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json(); })
    .then(function (j) { clearTimeout(to); var o = {}; (j.taken || []).forEach(function (s) { var t = Date.parse(s); if (!isNaN(t)) o[t] = 1; }); return o; })
    .catch(function () { return {}; });
}
function mkRef() { return 'IM-' + Date.now().toString(36).toUpperCase().slice(-6); }
function sendBooking(p) {
  var B = CFG.booking;
  if (B.n8n_webhook) { try { fetch(B.n8n_webhook, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p) }).catch(function () {}); } catch (x) {} }
  if (!B.endpoint) return Promise.resolve({ ok: true, preview: true, ref: mkRef(), hold_until: Date.now() + CFG.consultation.hold_hours * HR });
  var ctl = window.AbortController ? new AbortController() : null, to = ctl && setTimeout(function () { ctl.abort(); }, 25000);
  return fetch(B.endpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(p), signal: ctl ? ctl.signal : undefined })
    .then(function (r) { return r.json(); })
    .then(function (j) { clearTimeout(to); return j; })
    .catch(function () { return { ok: false, error: 'network' }; });
}

function flowHTML(kind) {
  var paid = kind === 'consultation', k = kind.charAt(0);
  var fld = function (name, label, ctrl, hint) { return '<div class="field"><label for="' + k + '-' + name + '">' + label + '</label>' + ctrl + (hint ? '<span class="hint">' + hint + '</span>' : '') + '<span class="err" data-err="' + name + '"></span></div>'; };
  var inp = function (name, type, ac, ph) { return '<input id="' + k + '-' + name + '" name="' + name + '" type="' + type + '"' + (ac ? ' autocomplete="' + ac + '"' : '') + (ph ? ' placeholder="' + ph + '"' : '') + '>'; };
  var sel = function (name, opts, first) { return '<select id="' + k + '-' + name + '" name="' + name + '">' + (first ? '<option value="">' + first + '</option>' : '') + opts.map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>'; };
  var area = function (name, ph) { return '<textarea id="' + k + '-' + name + '" name="' + name + '" placeholder="' + esc(ph) + '"></textarea>'; };
  var chips = CFG.services.map(function (s) { return '<button class="chip" type="button" data-s="' + s.id + '" aria-pressed="false">' + esc(s.name) + '</button>'; }).join('') + '<button class="chip" type="button" data-s="not-sure" aria-pressed="false">Not sure yet</button>';
  var cta = paid ? 'Reserve my slot' : 'Confirm my discovery call';
  return '<div class="steps-ind" aria-hidden="true"><span class="on" data-ind="1">1. Your details</span><span data-ind="2">2. Choose a time</span><span data-ind="3">3. Confirmed</span></div>' +
    '<div class="panel" data-step="1"><form data-form novalidate>' +
    '<div class="f2">' + fld('name', 'Full name', inp('name', 'text', 'name')) + fld('email', 'Email', inp('email', 'email', 'email')) + '</div>' +
    '<div class="f2">' + fld('business', 'Business name', inp('business', 'text', 'organization')) + fld('phone', 'Phone or WhatsApp', inp('phone', 'tel', 'tel', '+1 555 000 0000'), 'Include your country code.') + '</div>' +
    '<div class="f2">' + fld('website', 'Website <span style="text-transform:none;letter-spacing:0">(optional)</span>', inp('website', 'text', 'url', 'yourcompany.com')) + fld('industry', 'Industry <span style="text-transform:none;letter-spacing:0">(optional)</span>', sel('industry', CFG.industries.concat(['Other']), 'Choose one')) + '</div>' +
    '<div class="field"><label id="' + k + '-svl">What do you need help with? Choose all that apply</label><div class="pick" role="group" aria-labelledby="' + k + '-svl">' + chips + '</div><span class="err" data-err="services"></span></div>' +
    fld('bottleneck', 'What is the bottleneck you want to solve?', area('bottleneck', 'For example: we miss calls after 5 pm and leads go cold.')) +
    fld('outcome', 'What would a good result look like? <span style="text-transform:none;letter-spacing:0">(optional)</span>', area('outcome', 'For example: every lead gets a reply in under a minute.')) +
    '<div class="f2">' + fld('timeline', 'When do you want to start?', sel('timeline', ['As soon as possible', 'Within a month', 'In 1 to 3 months', 'Just exploring'])) +
    (paid ? fld('team', 'Team size', sel('team', ['Just me', '2 to 10', '11 to 50', '51 or more'])) : '<div></div>') + '</div>' +
    (paid ? fld('tools', 'Tools you use today <span style="text-transform:none;letter-spacing:0">(optional)</span>', inp('tools', 'text', '', 'CRM, phone system, scheduling, ads')) : '') +
    '<div class="hp" aria-hidden="true"><label>Leave this empty<input name="hp" tabindex="-1" autocomplete="off"></label></div>' +
    '<div class="actions"><button class="btn solid xl" type="submit">Continue to choose a time</button><span class="fine" style="text-transform:none;letter-spacing:.02em;color:var(--muted)">We use your details only to run this booking. <a href="#privacy" class="link">Privacy</a></span></div>' +
    '</form></div>' +
    '<div class="panel" data-step="2" hidden>' +
    '<div><p class="eyebrow" style="margin-bottom:8px"><span class="chk" aria-hidden="true"></span>Step 2</p><h2 class="h2">Choose a day</h2></div>' +
    '<p class="slotnote" data-note>Checking availability.</p>' +
    '<div class="days" data-days role="group" aria-label="Available days"></div>' +
    '<h3 class="lbl" style="color:var(--muted)" data-timeslbl hidden>Choose a time</h3>' +
    '<div class="times" data-times role="group" aria-label="Available times"></div>' +
    '<p class="slotnote" data-tz></p>' +
    '<div class="form-err" data-ferr role="alert" hidden></div>' +
    '<div class="actions"><button class="btn" type="button" data-back>Edit my details</button><button class="btn solid xl" type="button" data-confirm disabled>' + cta + '</button></div>' +
    (paid ? '<p class="slotnote">Your invoice is emailed as soon as you confirm. The slot is held for ' + CFG.consultation.hold_hours + ' hours while you pay.</p>' : '') +
    '</div>';
}

function bookingFlow(kind) {
  var paid = kind === 'consultation', root = $('#flow-' + kind), side = root.parentNode, sumEl = $('[data-sum="when"]', side);
  var fa = new Alex($('#flow-alex-' + kind), { n: 2, seed: paid ? 4 : 6, rs: .34 });
  var S, mT = 0;
  var mood = function (m, ms) { fa.set(m); clearTimeout(mT); mT = later(function () { fa.set('idle'); }, ms || 1500); };
  var q = function (sel) { return $(sel, root); };
  function init() {
    root.innerHTML = flowHTML(kind); S = { data: null, days: [], day: null, slot: null, taken: {}, busy: false };
    sumEl.textContent = 'Not chosen yet'; fa.set('idle');
  }
  function step(n) {
    $$('[data-step]', root).forEach(function (p) { p.hidden = String(p.dataset.step) !== String(n); });
    $$('[data-ind]', root).forEach(function (s) { s.classList.toggle('on', Number(s.dataset.ind) === n); });
    var top = $('.steps-ind', root); if (top) top.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }
  function clearErr() { $$('.field.bad', root).forEach(function (f) { f.classList.remove('bad'); }); $$('[data-err]', root).forEach(function (e) { e.textContent = ''; }); }
  function bad(name, msg) { var e = $('[data-err="' + name + '"]', root); if (e) { e.textContent = msg; var f = e.closest('.field'); if (f) f.classList.add('bad'); } }
  function collect() {
    var f = q('[data-form]'), d = {};
    [].forEach.call(f.elements, function (x) { if (x.name) d[x.name] = String(x.value || '').trim(); });
    d.services = $$('.chip[aria-pressed="true"]', f).map(function (b) { return b.dataset.s; });
    return d;
  }
  function validate(d) {
    var ok = true;
    if (d.name.length < 2) { bad('name', 'Enter your full name.'); ok = false; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { bad('email', 'Enter a valid email address.'); ok = false; }
    if (d.business.length < 2) { bad('business', 'Enter your business name.'); ok = false; }
    if (d.phone.replace(/\D/g, '').length < 7) { bad('phone', 'Enter a phone or WhatsApp number with country code.'); ok = false; }
    if (!d.services.length) { bad('services', 'Choose at least one option.'); ok = false; }
    if (d.bottleneck.length < 10) { bad('bottleneck', 'Tell us a little more, one or two sentences is enough.'); ok = false; }
    return ok;
  }
  function renderDays() {
    var dEl = q('[data-days]'), tEl = q('[data-times]'), note = q('[data-note]');
    if (!S.days.length) { dEl.innerHTML = ''; tEl.innerHTML = ''; $('[data-timeslbl]', root).hidden = true; note.textContent = 'No times are open right now. Email ' + CFG.brand.email + ' and we will arrange one.'; mood('sad', 1800); return; }
    note.textContent = 'Pick one of the next ' + S.days.length + ' days with open times.';
    dEl.innerHTML = S.days.map(function (d) {
      return '<button class="day" type="button" data-k="' + d.key + '" aria-pressed="' + (S.day === d.key) + '"><small>' + esc(fmtT(d.t0, { weekday: 'short' })) + '</small><b>' + esc(fmtT(d.t0, { day: 'numeric' })) + '</b><small>' + esc(fmtT(d.t0, { month: 'short' })) + '</small></button>';
    }).join('');
    renderTimes();
  }
  function renderTimes() {
    var tEl = q('[data-times]'), d = S.days.filter(function (x) { return x.key === S.day; })[0];
    $('[data-timeslbl]', root).hidden = !d;
    if (!d) { tEl.innerHTML = ''; return; }
    tEl.innerHTML = d.slots.map(function (t) { return '<button class="time" type="button" data-t="' + t + '" aria-pressed="' + (S.slot === t) + '">' + esc(fmtT(t, { hour: 'numeric', minute: '2-digit' })) + '</button>'; }).join('');
  }
  function setSum() {
    sumEl.textContent = S.slot ? fmtT(S.slot, { weekday: 'short', day: 'numeric', month: 'short' }) + ', ' + fmtT(S.slot, { hour: 'numeric', minute: '2-digit' }) : 'Not chosen yet';
    q('[data-confirm]').disabled = !S.slot;
  }
  function loadSlots() {
    q('[data-note]').textContent = 'Checking availability.'; q('[data-days]').innerHTML = ''; q('[data-times]').innerHTML = ''; $('[data-timeslbl]', root).hidden = true;
    fa.set('searching'); S.slot = null; setSum();
    q('[data-tz]').textContent = 'Times are shown in your time zone (' + TZ.replace(/_/g, ' ') + '). Our hours are ' + CFG.availability.start + ' to ' + CFG.availability.end + ' Pakistan time, ' + CFG.availability.days + '.';
    return fetchTaken().then(function (tk) {
      S.taken = tk; S.days = buildDays(kind, tk); S.day = S.days.length ? S.days[0].key : null; renderDays(); fa.set('idle');
    });
  }
  function submit() {
    if (S.busy || !S.slot) return;
    var d = S.data, C = CFG.consultation, B = CFG.booking, btn = q('[data-confirm]'), fe = q('[data-ferr]'), qs = new URLSearchParams(location.search);
    fe.hidden = true; S.busy = true; btn.disabled = true; btn.textContent = 'Booking'; fa.set('work');
    var payload = Object.assign({}, d, {
      kind: kind, slot_iso: new Date(S.slot).toISOString(), slot_label: fmtT(S.slot, { dateStyle: 'full', timeStyle: 'short' }), tz: TZ,
      duration_min: paid ? C.session_minutes : B.discovery_minutes, price: paid ? C.price + ' ' + C.currency : 'Free', submitted_at: new Date().toISOString(),
      page: location.href.split('#')[0], referrer: document.referrer || '', utm_source: qs.get('utm_source') || '', utm_medium: qs.get('utm_medium') || '', utm_campaign: qs.get('utm_campaign') || ''
    });
    sendBooking(payload).then(function (r) {
      S.busy = false; btn.textContent = paid ? 'Reserve my slot' : 'Confirm my discovery call';
      if (r && r.ok) {
        lastBooking = { kind: kind, ref: r.ref || mkRef(), name: d.name, email: d.email, slot: S.slot, tz: TZ, minutes: payload.duration_min, hold_until: paid ? (r.hold_until ? Date.parse(r.hold_until) || Date.now() + C.hold_hours * HR : Date.now() + C.hold_hours * HR) : 0, preview: !!r.preview };
        store('im_booking', JSON.stringify(lastBooking)); track('booking_submitted', { kind: kind }); if (r.preview) rememberPreview(S.slot, paid);
        init(); location.hash = 'booked-' + kind; return;
      }
      btn.disabled = !S.slot; fe.hidden = false;
      if (r && r.error === 'slot_taken') { fe.textContent = 'That time was just taken by someone else. Please choose another.'; mood('sad', 1600); loadSlots(); }
      else { fe.textContent = 'We could not complete your booking. Please try again, or email ' + CFG.brand.email + '.'; mood('confused', 1800); }
    });
  }
  root.addEventListener('click', function (e) {
    var t = e.target.closest('button'); if (!t) return;
    if (t.matches('.chip[data-s]')) { t.setAttribute('aria-pressed', String(t.getAttribute('aria-pressed') !== 'true')); mood('happy', 800); }
    else if (t.matches('.day')) { S.day = t.dataset.k; S.slot = null; setSum(); renderDays(); mood('curious', 900); }
    else if (t.matches('.time')) { S.slot = Number(t.dataset.t); renderTimes(); setSum(); mood('happy', 1400); }
    else if (t.matches('[data-back]')) { step(1); }
    else if (t.matches('[data-confirm]')) { submit(); }
  });
  root.addEventListener('submit', function (e) {
    e.preventDefault(); clearErr();
    var d = collect();
    if (d.hp) return;
    if (!validate(d)) { mood('confused', 1600); var f = $('.field.bad input,.field.bad textarea,.field.bad select', root); if (f) f.focus(); return; }
    S.data = d; track('booking_details_done', { kind: kind }); step(2); loadSlots();
  });
  root.addEventListener('input', function (e) { var f = e.target.closest && e.target.closest('.field'); if (f && f.classList.contains('bad')) { f.classList.remove('bad'); var er = $('.err', f); if (er) er.textContent = ''; } });
  root.addEventListener('click', function (e) { var c = e.target.closest('.chip[data-s]'); if (c) { var f = c.closest('.field'); if (f) { f.classList.remove('bad'); var er = $('.err', f); if (er) er.textContent = ''; } } });
  root.addEventListener('focusin', function (e) { if (e.target.matches('input,textarea,select')) fa.set('listen'); });
  root.addEventListener('focusout', function (e) { if (e.target.matches('input,textarea,select')) fa.set('idle'); });
  init();
  return { reset: init };
}

function fillBooked(kind) {
  var v = $('[data-view="booked-' + kind + '"]'), b = lastBooking; if (!v || !b) return;
  var set = function (n, t) { var x = $('[data-b="' + n + '"]', v); if (x) x.textContent = t; };
  set('when', fmtT(b.slot, { weekday: 'long', day: 'numeric', month: 'long' }) + ' at ' + fmtT(b.slot, { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }));
  set('email', b.email); set('ref', b.ref);
  var pk = $('[data-b="whenpk"]', v), iana = CFG.availability.iana || 'Asia/Karachi';
  if (pk) { pk.hidden = TZ === iana; pk.textContent = 'Pakistan time: ' + fmtT(b.slot, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }, iana); }
  var pv = $('[data-b="preview"]', v); if (pv) pv.hidden = !b.preview;
  var g = $('[data-b="gcal"]', v);
  if (g) {
    var f = function (ms) { return new Date(ms).toISOString().replace(/[-:]|\.\d{3}/g, ''); };
    g.href = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Insiders Media discovery call') + '&dates=' + f(b.slot) + '/' + f(b.slot + b.minutes * 60000) + '&details=' + encodeURIComponent('Free discovery call with Insiders Media. Reference ' + b.ref + '.');
  }
  tickHold();
}
function tickHold() {
  if (cur !== 'booked-consultation' || !lastBooking || !lastBooking.hold_until) return;
  var n = $('[data-b="hold"]'), left = lastBooking.hold_until - Date.now(), p = function (x) { return (x < 10 ? '0' : '') + x; };
  if (left <= 0) { n.textContent = '00:00:00'; return; }
  var s = Math.floor(left / 1000); n.textContent = p(Math.floor(s / 3600)) + ':' + p(Math.floor(s % 3600 / 60)) + ':' + p(s % 60);
}
setInterval(tickHold, 1000);

/* ---------- boot: characters, hero, router, dock ---------- */
renderNums(); renderServices(); renderMisc(); renderQuotes(); renderVideos(); availability(); misc();

var hero = new Alex($('#hero'), { n: 2, rings: true, seed: 0 });
var dockA = new Alex($('#dock-alex'), { n: 2, seed: 3, rs: .36 });
var footA = new Alex($('#foot-alex'), { n: 2, seed: 8, rs: .34 }); footA.set('sleep', true);
var consA = new Alex($('#cons-alex'), { n: 2, seed: 5, scene: 'audit', cxf: .3, rs: .27 });
var demoA = new Alex($('#demo-alex'), { n: 2, seed: 11, rs: .36 });
[['svc-alex', 2], ['res-alex', 7], ['about-alex', 12], ['cons-foot', 14]].forEach(function (p) { var a = new Alex(document.getElementById(p[0]), { n: 2, seed: p[1], rs: .34 }); wire(document.getElementById(p[0]).closest('.final'), a, 'idle'); });
var SC = { 'voice-agents': { scene: 'voice', cxf: .3 }, 'ai-automation': { scene: 'automation', cxf: .3 }, 'custom-software': { scene: 'software', cxf: .5 }, 'performance-marketing': { scene: 'marketing', cxf: .3 }, 'lead-capture': { scene: 'lead', cxf: .64 } };
function charOpts(shape, sid) { return Object.assign({}, SHAPES[shape], SC[sid] || {}, SC[sid] ? { rs: .27 } : {}); }
$$('.card[data-shape]').forEach(function (c) { wire(c, new Alex($('canvas', c), charOpts(c.dataset.shape, c.dataset.sid)), 'idle'); });
$$('.svc canvas.chara').forEach(function (cv) { var a = new Alex(cv, charOpts(cv.dataset.shape, cv.dataset.sid)); wire(cv.closest('.svc'), a, 'idle'); });
wire($('#foot-alex').closest('.final'), footA, 'sleep');

var dockState = { sc: null, mood: 'idle' }, rT = 0, focusEl = null;
function dockApply() { if (dockState.sc) dockA.hold = false; else { dockA.hold = true; dockA.set(dockState.mood); } }
function react(m, ms) { dockA.hold = true; dockA.set(m); clearTimeout(rT); rT = later(dockApply, ms || 1400); }
function say(m, text) { if (text) $('#bubble').textContent = text; react(m, 1800); }
function setFocus(n) {
  var sid = n.dataset.sid, svc = sid && svcById(sid), sc = svc && SC[sid] ? SC[sid] : null, o = dockA.o;
  $('#bubble').textContent = n.dataset.tip || '';
  Object.assign(o, { n: 2, sx: 1, sy: 1, drop: 0 }, svc ? SHAPES[svc.shape] : SHAPES.ball, { scene: sc ? sc.scene : null, cxf: sc ? sc.cxf : .5, rs: sc ? .27 : .34, seed: 3 });
  dockState = { sc: sc, mood: n.dataset.mood || 'idle' }; dockA.ck = 0; dockA.resize(); react('surprised', 450);
}
function pickFocus() {
  var v = views.filter(function (x) { return !x.hidden; })[0]; if (!v) return;
  var mid = innerHeight * .5, px = P.x > 0 ? P.x : innerWidth / 2, best = null, bs = 1e12;
  $$('[data-tip]', v).forEach(function (n) {
    var r = n.getBoundingClientRect(); if (r.height <= 0 || r.width <= 0) return;
    var score = (r.top <= mid && r.bottom >= mid) ? (r.width * r.height) / 1000 + Math.abs((r.left + r.right) / 2 - px) * .05 : 1e7 + Math.min(Math.abs(r.top - mid), Math.abs(r.bottom - mid));
    if (score < bs) { bs = score; best = n; }
  });
  if (best && best !== focusEl) { focusEl = best; setFocus(best); }
}
var fT = 0; function schedFocus() { if (!fT) fT = requestAnimationFrame(function () { fT = 0; pickFocus(); }); }
addEventListener('scroll', schedFocus, { passive: true });
finder(react); demo(demoA); pipeline(); bookingFlow('discovery'); bookingFlow('consultation');
var confD = new Alex($('#conf-alex-d'), { n: 2, seed: 9, rs: .34 }); confD.set('celebrate', true);
var confC = new Alex($('#conf-alex-c'), { n: 2, seed: 10, rs: .34 }); confC.set('proud', true);

/* hero behaviour */
var SAY = {
  idle: ['Alex', 'Waiting for the phone to ring.'], listen: ['Listening', 'Picks up every inbound call, day or night.'], think: ['Thinking', 'Checks the caller against your rules.'],
  work: ['Working', 'Books the appointment straight into your calendar.'], celebrate: ['Celebrating', 'Hands your team a qualified lead.'], sleep: ['Sleeping', 'Nothing in the queue. Wakes the moment someone calls.'],
  surprised: ['Awake', 'New call.'], happy: ['Happy', 'Another call handled.'], proud: ['Proud', 'Every lead followed up.'], curious: ['Curious', 'Wants to know what you need.'],
  searching: ['Searching', 'Looking up the customer record.'], playful: ['Playful', 'Ready for a joke.'], shy: ['Shy', 'Not used to the spotlight.'], suspicious: ['Suspicious', 'Checking that caller is real.'],
  bored: ['Bored', 'Nothing to automate. Yet.'], sad: ['Sad', 'A lead slipped away.'], angry: ['Annoyed', 'Spam call blocked.'], scared: ['Scared', 'That queue is very long.'], excited: ['Excited', 'One click to a free call.'], laughing: ['Laughing', 'Ha. You found the button.'], drowsy: ['Drowsy', 'It has been quiet for a while.']
};
var say$ = $('#say'), chips = $$('.mood[data-mood]'), auto = !reduce, timer = 0, slept = false, laughT = 0, cur = 'home';
function setHero(m, snap) { hero.set(m, snap); chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mood === m)); }); var s = SAY[m]; say$.innerHTML = '<b>' + s[0] + '</b> &middot; ' + s[1]; }
chips.forEach(function (b) { b.addEventListener('click', function () { auto = false; clearTimeout(timer); slept = false; setHero(b.dataset.mood); }); });
if (reduce) setHero('idle', true); else {
  setHero('sleep', true); later(function () { setHero('surprised'); }, 700); later(function () { setHero('idle'); }, 1300);
  var seq = ['listen', 'think', 'work', 'celebrate', 'idle'], si = -1;
  timer = later(function tick() { if (!auto) return; if (hero.vis && cur === 'home') { si = (si + 1) % seq.length; setHero(seq[si]); } timer = later(tick, 2800); }, 3000);
  setInterval(function () {
    if (cur !== 'home') return; var q = Date.now() - lastAct;
    if (q > 38000 && hero.mood !== 'sleep') { auto = false; clearTimeout(timer); slept = true; setHero('sleep'); }
    else if (q > 30000 && !slept) { auto = false; clearTimeout(timer); slept = true; setHero('drowsy'); }
  }, 2000);
  onWake = function () { if (slept) { slept = false; setHero('surprised'); later(function () { setHero('idle'); }, 700); } };
}
var stageEl = $('.stage'), clicks = [], curT = 0;
stageEl.addEventListener('click', function () {
  var n = Date.now(); clicks = clicks.filter(function (t) { return n - t < 2200; }); clicks.push(n);
  auto = false; clearTimeout(timer); slept = false; clearTimeout(curT);
  setHero(clicks.length >= 5 ? 'scared' : clicks.length === 4 ? 'angry' : clicks.length === 3 ? 'surprised' : 'laughing');
  clearTimeout(laughT); laughT = later(function () { setHero('idle'); }, 1800);
});
stageEl.addEventListener('pointerenter', function () { curT = later(function () { if (!slept) { auto = false; clearTimeout(timer); setHero('curious'); } }, 1200); });
stageEl.addEventListener('pointerleave', function () { clearTimeout(curT); if (hero.mood === 'curious') setHero('idle'); });
document.documentElement.addEventListener('mouseleave', function () { if (cur === 'home' && !slept) { auto = false; clearTimeout(timer); setHero('searching'); } });
document.documentElement.addEventListener('mouseenter', function () { if (cur === 'home' && hero.mood === 'searching') { setHero('surprised'); later(function () { setHero('idle'); }, 700); } });
var mb2 = $('#moreBtn'), mm = $('#moreMoods');
mb2.addEventListener('click', function () { var o = mm.hidden; mm.hidden = !o; mb2.setAttribute('aria-expanded', String(o)); mb2.textContent = o ? 'Fewer moods' : 'More moods'; });
$$('#heroCta,.hdr .btn.solid').forEach(function (b) {
  b.addEventListener('pointerenter', function () { if (!slept) { auto = false; clearTimeout(timer); setHero('excited'); } });
  b.addEventListener('pointerleave', function () { if (!slept) setHero('idle'); });
});
$$('[data-wake="foot"]').forEach(function (b) { b.addEventListener('pointerenter', function () { footA.set('excited'); }); b.addEventListener('pointerleave', function () { footA.set('sleep'); }); });

/* router */
var views = $$('[data-view]'), navs = $$('[data-nav]'), heroIn = true;
function route() {
  var h = (location.hash || '#home').slice(1), name, anchor = null;
  if (h === 'book-discovery') h = 'start';
  if (h.indexOf('booked-') === 0 && (!lastBooking || lastBooking.kind !== h.slice(7))) { location.hash = h.slice(7) === 'consultation' ? 'book-consultation' : 'start'; return; }
  name = h;
  if (h.indexOf('services-') === 0) { name = 'services'; anchor = 'svc-' + h.slice(9); }
  if (h === 'cons-book') { name = 'consultation'; anchor = 'cons-book'; }
  var v = views.filter(function (x) { return x.dataset.view === name; })[0];
  if (!v) { v = views.filter(function (x) { return x.dataset.view === 'notfound'; })[0]; name = 'notfound'; }
  views.forEach(function (x) { x.hidden = x !== v; });
  cur = name; document.title = v.dataset.title || 'Insiders Media';
  var navName = name === 'book-consultation' ? 'consultation' : name;
  if (name.indexOf('booked-') === 0) fillBooked(name.slice(7));
  navs.forEach(function (a) { if (a.dataset.nav === navName) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  var t = anchor && document.getElementById(anchor);
  if (t) { requestAnimationFrame(function () { t.scrollIntoView({ block: 'start' }); }); }
  else { window.scrollTo({ top: 0, behavior: 'instant' }); var h1 = $('h1', v); if (h1) h1.focus({ preventScroll: true }); }
  track('page_view', { view: name }); updateDock(); focusEl = null; later(pickFocus, 120);
}
function updateDock() { $('#dock').hidden = (cur === 'home' && heroIn); }
addEventListener('hashchange', route);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(function (en) { heroIn = en[0].isIntersecting; updateDock(); }, { threshold: .15 }).observe($('.hero'));
  var svcIO = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { $$('#subnav a').forEach(function (a) { a.classList.toggle('on', 'svc-' + a.dataset.sid === x.target.id); }); } }); }, { rootMargin: '-30% 0px -60% 0px' });
  $$('.svc').forEach(function (n) { svcIO.observe(n); });
}
route();
})();
