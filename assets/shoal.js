/* Shoal. The page's behaviour, no dependencies. Ported from the script class of
   the Claude Design canvas "Shoal Landing.dc.html" (makeShoal, tickLogo,
   runDemo), with the canvas defaults: density 3000, speed 1, glow 0.6.

   Everything reads correctly with this file blocked: <html class="no-js"> shows
   the whole mock run and its report, hides the controls that would do nothing,
   and the sign-up form falls back to a mailto. With prefers-reduced-motion the
   water is drawn once, still, and the mock run prints at once. */

(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) root.classList.add('static');

  var SPEED = 1, DENSITY = 3000, GLOW = 0.6;
  var heroOn = false;

  /* ------------------------------------------------------------ theme
     Colours for the canvas come from the CSS tokens, so the stylesheet stays
     the one place the palette lives. */
  var th = {};
  function readTheme() {
    var cs = getComputedStyle(root);
    ['bg', 'fg', 'muted', 'bio', 'coral', 'plank'].forEach(function (k) { th[k] = cs.getPropertyValue('--' + k).trim(); });
    th.dark = root.getAttribute('data-theme') !== 'light';
  }
  readTheme();
  var themeBtn = $('[data-theme-toggle]');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = th.dark ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('shoal-theme', next); } catch (e) {}
    var meta = $('meta[name="theme-color"]');
    readTheme();
    if (meta) meta.setAttribute('content', th.bg);
    if (sim && reduced) sim.draw();
  });
  if (!th.dark) { var tm = $('meta[name="theme-color"]'); if (tm) tm.setAttribute('content', th.bg); }

  var hx = function (a) {
    a = a.replace('#', '');
    return [0, 2, 4].map(function (i) { return parseInt(a.slice(i, i + 2), 16); });
  };
  var mix = function (a, b, t) {
    var A = hx(a), B = hx(b);
    return '#' + A.map(function (v, i) { return Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0'); }).join('');
  };
  var rgba = function (h, a) { var c = hx(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  var fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  var setText = function (el, v) { if (el && el.textContent !== v) el.textContent = v; };

  /* ------------------------------------------------------------- menu */
  var menuBtn = $('[data-menu-toggle]'), menu = $('[data-menu]');
  function setMenu(open) {
    if (!menu) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 860) setMenu(false); });

  /* ------------------------------------------------------------- logo
     Three chevron fish swim in a staggered, damped wave; on hover they surge
     forward and tighten; during a rehearsal they take sentiment colours. */
  var fish = $$('[data-fish]');
  var logo = { t: 0, hover: 0, h: 0 };
  var brand = $('[data-logo]');
  if (brand) {
    brand.addEventListener('pointerenter', function () { logo.hover = 1; });
    brand.addEventListener('pointerleave', function () { logo.hover = 0; });
  }
  function tickLogo(dt) {
    logo.h += (logo.hover - logo.h) * Math.min(1, dt * 4);
    logo.t += dt * SPEED * (1 + logo.h * 1.6);
    var cols = heroOn ? ['var(--coral)', 'var(--plank)', 'var(--bio)'] : ['var(--bio)', 'var(--bio)', 'var(--bio)'];
    fish.forEach(function (el, i) {
      var ph = logo.t * 1.7 - i * 0.95;
      var dx = Math.sin(ph) * 1.3 * (1 - logo.h * 0.5) + logo.h * (1.5 + i * 0.6);
      var dy = Math.sin(logo.t * 1.1 - i * 1.4) * 0.9 * (1 - logo.h * 0.7);
      el.setAttribute('transform', 'translate(' + dx.toFixed(2) + ' ' + dy.toFixed(2) + ')');
      el.style.opacity = (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(ph + 1.2)) * (1 - logo.h) + logo.h * 0.38).toFixed(3);
      el.style.stroke = cols[i];
    });
  }

  /* ------------------------------------------------------------- hero water
     A boids shoal on a spatial grid. Idle, it follows a slow wandering target,
     or the pointer; moving the pointer fast scatters it; a click sends a ring.
     "Rehearse a launch" sorts it into praise, question and objection schools
     while simulated comments surface, and the headline counts up. */
  var COMMENTS = [
    { g: 0, tag: 'PRAISE', color: 'var(--bio)', who: 'maintainer_0217', text: 'Single static binary that self-hosts. I can run this in CI.' },
    { g: 2, tag: 'OBJECTION', color: 'var(--coral)', who: 'sec_eng_0044', text: 'curl | sh on the landing page. Where is the signature?' },
    { g: 1, tag: 'QUESTION', color: 'var(--plank)', who: 'indie_hacker_0903', text: 'How were the agents calibrated against real threads?' },
    { g: 0, tag: 'PRAISE', color: 'var(--bio)', who: 'sre_0388', text: 'Self-hosted, no telemetry by default. That is the right call.' },
    { g: 2, tag: 'OBJECTION', color: 'var(--coral)', who: 'skeptic_0012', text: 'Simulated users predicting real users sounds circular.' },
    { g: 1, tag: 'QUESTION', color: 'var(--plank)', who: 'ml_eng_0561', text: 'Which model writes the comments, and can I swap it?' },
    { g: 0, tag: 'PRAISE', color: 'var(--bio)', who: 'devrel_0730', text: 'Ran it on our last post. It flagged the objection we actually got.' },
    { g: 0, tag: 'PRAISE', color: 'var(--bio)', who: 'founder_0129', text: 'This would have saved our launch week.' }
  ];
  var hero = $('[data-hero]'), cv = $('[data-cv]'), glowCv = $('[data-glow]');
  var cardsEl = $('[data-cards]'), countEl = $('[data-count]'), statusEl = $('[data-status]');
  var sim = null;

  function setCards(cards) {
    cardsEl.textContent = '';
    cards.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'bubble';
      d.style.left = c.x + 'px';
      d.style.top = c.y + 'px';
      d.innerHTML = '<div class="bubble__head"><span></span><span></span></div><div class="bubble__text"></div>';
      var s = d.querySelectorAll('span');
      s[0].textContent = c.tag; s[0].style.color = c.color; s[1].textContent = c.who;
      d.querySelector('.bubble__text').textContent = c.text;
      cardsEl.appendChild(d);
    });
  }

  function makeShoal() {
    var MAX = 4000, CS = 26;
    var W = 1280, H = 720, ctx = null, GW = 0, GH = 0, head = null;
    var gctx = glowCv.getContext('2d');
    var x = new Float32Array(MAX), y = new Float32Array(MAX), vx = new Float32Array(MAX), vy = new Float32Array(MAX),
      z = new Float32Array(MAX), lum = new Float32Array(MAX), g = new Uint8Array(MAX), nx = new Int32Array(MAX);
    var CN = ['PRAISE', 'QUESTION', 'OBJECTION'], SCHED = [0.07, 0.18, 0.29, 0.41, 0.53, 0.64, 0.76, 0.88];
    var i;
    for (i = 0; i < MAX; i++) {
      var a = Math.random() * 6.283; vx[i] = Math.cos(a); vy[i] = Math.sin(a); z[i] = Math.random();
      var u = Math.random(); g[i] = u < 0.58 ? 0 : u < 0.82 ? 1 : 2;
    }
    var snow = []; for (i = 0; i < 160; i++) snow.push([Math.random(), Math.random(), 0.4 + Math.random() * 0.9, 0.05 + Math.random() * 0.15]);
    var s = { mode: 0, prog: 0, t: 0, mouse: null, pm: null, mv: 0, rip: [], n: DENSITY, spk: [], ci: 0, init: false, cards: [], hov: -1, pin: 0 };
    var mob = function () { return W < 760; };
    var cen = function () {
      return mob() ? [[W * 0.5, H * 0.2], [W * 0.82, H * 0.42], [W * 0.2, H * 0.4]]
        : [[W * 0.16, H * 0.42], [W * 0.85, H * 0.36], [W * 0.82, H * 0.76]];
    };
    s.resize = function (w, h) {
      var ow = W, oh = H; W = w; H = h;
      var d = Math.min(2, window.devicePixelRatio || 1);
      cv.width = W * d; cv.height = H * d; ctx = cv.getContext('2d'); ctx.setTransform(d, 0, 0, d, 0, 0);
      glowCv.width = Math.ceil(W / 2); glowCv.height = Math.ceil(H / 2);
      GW = Math.ceil(W / CS); GH = Math.ceil(H / CS); head = new Int32Array(GW * GH);
      for (var k = 0; k < MAX; k++) {
        if (!s.init) { x[k] = Math.random() * W; y[k] = Math.random() * H; } else { x[k] *= W / ow; y[k] *= H / oh; }
      }
      s.init = true;
    };
    // The copy is a rock in the stream: an ellipse the school flows around (desktop only).
    s.zone = null;
    s.setZone = function (z) { s.zone = z; };
    s.start = function () { s.mode = 1; s.prog = 0; s.ci = 0; s.spk = []; s.cards = []; setCards([]); };
    s.reset = function () { s.mode = 0; s.prog = 0; s.spk = []; s.cards = []; setCards([]); };
    s.click = function (px, py) { if (!reduced) s.rip.push({ x: px, y: py, r: 0 }); };
    function spawn(k) {
      var c = COMMENTS[k], n = s.n, m = mob(), pick = -1;
      for (var t = 0; t < 300; t++) {
        var j = (Math.random() * n) | 0;
        if (g[j] === c.g && (m ? y[j] < H * 0.5 && y[j] > 90 : Math.abs(x[j] - W * 0.5) > 420 && x[j] > 40 && x[j] < W - 40 && y[j] > 100 && y[j] < H - 60)) { pick = j; break; }
      }
      if (pick < 0) pick = (Math.random() * n) | 0;
      lum[pick] = 1;
      var cx = m ? 16 : (x[pick] > W * 0.5 ? Math.max(W * 0.5 + 400, Math.min(W - 372, x[pick] + 30)) : Math.max(16, Math.min(W * 0.5 - 740, x[pick] - 372)));
      var cy = m ? 20 : Math.max(24, Math.min(H - 170, y[pick] - 96));
      s.spk = s.spk.concat([{ i: pick, cx: cx, cy: cy }]).slice(m ? -1 : -2);
      s.cards = s.cards.concat([{ tag: c.tag, color: c.color, who: c.who, text: c.text, x: Math.round(cx), y: Math.round(cy) }]).slice(m ? -1 : -2);
      setCards(s.cards);
    }
    s.step = function (dt) {
      if (!head) return;
      var f = Math.min(3, dt * 60) * SPEED;
      var n = Math.max(200, Math.min(MAX, DENSITY * Math.min(1, (W * H) / (1280 * 720) * 1.1))) | 0;
      s.n = n; s.t += dt * SPEED;
      var m = s.mouse;
      if (m && s.pm) s.mv = s.mv * 0.85 + Math.hypot(m.x - s.pm.x, m.y - s.pm.y) * 0.15; else s.mv *= 0.85;
      s.pm = m ? { x: m.x, y: m.y } : null;
      var flee = s.mv > 12;
      s.rip.forEach(function (r) { r.r += dt * SPEED * 380; });
      s.rip = s.rip.filter(function (r) { return r.r < Math.max(W, H) * 1.3; });
      if (s.mode) { s.prog = Math.min(1, s.prog + dt * SPEED / 11); while (s.ci < SCHED.length && s.prog >= SCHED[s.ci]) spawn(s.ci++); }
      head.fill(-1);
      var i, cx, cy;
      for (i = 0; i < n; i++) {
        cx = (x[i] / CS) | 0; cy = (y[i] / CS) | 0;
        cx = cx < 0 ? 0 : cx >= GW ? GW - 1 : cx; cy = cy < 0 ? 0 : cy >= GH ? GH - 1 : cy;
        var k = cy * GW + cx; nx[i] = head[k]; head[k] = i;
      }
      var C = cen(), mb = mob();
      var wx = mb ? W * 0.5 + Math.cos(s.t * 0.21) * W * 0.3 : W * 0.5 + Math.cos(s.t * 0.21) * W * 0.36;
      var wy = mb ? H * 0.3 + Math.sin(s.t * 0.29) * H * 0.14 : H * 0.44 + Math.sin(s.t * 0.29) * H * 0.2;
      var rev = s.mode ? n * Math.min(1, s.prog * 2) : 0, CS2 = CS * CS, dec = Math.pow(0.22, dt * SPEED);
      for (i = 0; i < n; i++) {
        var cnt = 0, ax = 0, ay = 0, sx = 0, sy = 0;
        cx = 0; cy = 0;
        var gx = (x[i] / CS) | 0, gy = (y[i] / CS) | 0;
        for (var oy = -1; oy <= 1; oy++) {
          var yy = gy + oy; if (yy < 0 || yy >= GH) continue;
          for (var ox = -1; ox <= 1; ox++) {
            var xx = gx + ox; if (xx < 0 || xx >= GW) continue;
            var j = head[yy * GW + xx];
            while (j >= 0 && cnt < 20) {
              if (j !== i) {
                var ddx = x[j] - x[i], ddy = y[j] - y[i], d2 = ddx * ddx + ddy * ddy;
                if (d2 < CS2) {
                  cnt++; cx += ddx; cy += ddy; ax += vx[j]; ay += vy[j];
                  if (d2 < 100) { sx -= ddx / (d2 + 0.5); sy -= ddy / (d2 + 0.5); }
                }
              }
              j = nx[j];
            }
          }
        }
        var fx = 0, fy = 0;
        if (cnt) {
          fx += (ax / cnt - vx[i]) * 0.06 + cx / cnt * 0.0022 + sx * 0.8;
          fy += (ay / cnt - vy[i]) * 0.06 + cy / cnt * 0.0022 + sy * 0.8;
        }
        var tx, ty, ka, sw = 0.9;
        if (i < rev) { var c = C[g[i]]; tx = c[0]; ty = c[1]; ka = 0.05; sw = g[i] === 1 ? -0.9 : 0.9; }
        else if (m) { tx = m.x; ty = m.y; ka = 0.042; }
        else { tx = wx; ty = wy; ka = 0.014; }
        var dx = tx - x[i], dy = ty - y[i], d = Math.sqrt(dx * dx + dy * dy) + 0.001, pull = d < 60 ? -0.6 : 1;
        fx += (dx * pull - dy * sw) / d * ka; fy += (dy * pull + dx * sw) / d * ka;
        if (m) {
          var mx = x[i] - m.x, my = y[i] - m.y, md = Math.sqrt(mx * mx + my * my) + 0.001;
          if (flee && md < 170) { fx += mx / md * 0.35; fy += my / md * 0.35; lum[i] = Math.max(lum[i], 0.8); }
          else if (md < 95) lum[i] = Math.max(lum[i], 0.55 * (1 - md / 95));
        }
        for (var q = 0; q < s.rip.length; q++) {
          var r = s.rip[q], rx = x[i] - r.x, ry = y[i] - r.y, rd = Math.sqrt(rx * rx + ry * ry) + 0.001;
          if (Math.abs(rd - r.r) < 14) { lum[i] = 1; fx += rx / rd * 0.12; fy += ry / rd * 0.12; }
        }
        var Z = s.zone;
        if (Z && !mb) {
          var zx = (x[i] - Z.x) / Z.rx, zy = (y[i] - Z.y) / Z.ry, ze = zx * zx + zy * zy;
          if (ze < 1) { var zd = Math.sqrt(ze) + 0.001, zp = (1 - ze) * 0.55; fx += zx / zd * zp; fy += zy / zd * zp * 0.6; }
        }
        lum[i] *= dec;
        vx[i] += fx * f; vy[i] += fy * f;
        var v = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]), vmax = 2.4 * (0.75 + 0.45 * z[i]), vmin = 0.6;
        if (i === s.hov) { vmax *= 0.3; vmin = 0.25; }
        if (v > vmax) { vx[i] *= vmax / v; vy[i] *= vmax / v; } else if (v < vmin && v > 0) { vx[i] *= vmin / v; vy[i] *= vmin / v; }
        x[i] += vx[i] * f; y[i] += vy[i] * f;
        if (x[i] < -10) x[i] += W + 20; else if (x[i] > W + 10) x[i] -= W + 20;
        if (y[i] < -10) y[i] += H + 20; else if (y[i] > H + 10) y[i] -= H + 20;
      }
      s.spk.forEach(function (p) { lum[p.i] = 1; });
      if (s.hov >= 0) lum[s.hov] = 1;
      snow.forEach(function (p) {
        p[1] += p[3] * f / H; p[0] += Math.sin(s.t * 0.5 + p[1] * 7) * 0.00006 * f;
        if (p[1] > 1.01) { p[1] = -0.01; p[0] = Math.random(); }
      });
    };
    s.draw = function () {
      if (!ctx) return;
      var n = s.n, dark = th.dark, i;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = dark ? 0.5 - GLOW * 0.3 : 0.6 - GLOW * 0.25; ctx.fillStyle = th.bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      ctx.fillStyle = rgba(th.fg, dark ? 0.12 : 0.18);
      snow.forEach(function (p) { ctx.fillRect(p[0] * W, p[1] * H, p[2], p[2]); });
      if (dark) ctx.globalCompositeOperation = 'lighter';
      var rev = s.mode ? n * Math.min(1, s.prog * 2) : 0;
      var L = [0, 1, 2].map(function () { return [new Path2D(), new Path2D(), new Path2D(), new Path2D()]; });
      var LIT = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
      for (i = 0; i < n; i++) {
        var v = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]) || 1, ux = vx[i] / v, uy = vy[i] / v, len = 2.2 + z[i] * 3.4, w = len * 0.55;
        var bx = x[i] - ux * len, by = y[i] - uy * len, c = i < rev ? g[i] : 3;
        var p = lum[i] > 0.45 ? LIT[c] : L[z[i] < 0.33 ? 0 : z[i] < 0.66 ? 1 : 2][c];
        p.moveTo(bx - uy * w, by + ux * w); p.lineTo(x[i], y[i]); p.lineTo(bx + uy * w, by - ux * w);
      }
      var cols = [th.bio, th.plank, th.coral, dark ? th.bio : th.fg], LA = dark ? [0.28, 0.5, 0.85] : [0.3, 0.55, 0.9], LW = [0.8, 1.1, 1.4];
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (var l = 0; l < 3; l++) {
        ctx.lineWidth = LW[l];
        for (var k = 0; k < 4; k++) { ctx.strokeStyle = rgba(cols[k], LA[l] * (k === 3 ? 0.8 : 1)); ctx.stroke(L[l][k]); }
      }
      ctx.lineWidth = 1.7;
      for (k = 0; k < 4; k++) { ctx.strokeStyle = dark ? mix(cols[k], '#ffffff', 0.45) : cols[k]; ctx.stroke(LIT[k]); }
      ctx.globalCompositeOperation = 'source-over';
      var cw = Math.min(340, W - 32);
      s.spk.forEach(function (p) {
        var fx = x[p.i], fy = y[p.i], col = cols[g[p.i]], ax = fx < p.cx ? p.cx : p.cx + cw, ay = Math.max(p.cy + 8, Math.min(p.cy + 60, fy));
        ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(ax, ay); ctx.stroke();
        ctx.beginPath(); ctx.arc(fx, fy, 8 + Math.sin(s.t * 5) * 1.5, 0, 6.283); ctx.stroke();
      });
      if (s.hov >= 0 && s.hov < n) {
        var hc = s.mode && s.hov < rev ? cols[g[s.hov]] : th.bio;
        ctx.strokeStyle = rgba(hc, 0.9); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x[s.hov], y[s.hov], 9, 0, 6.283); ctx.stroke();
        ctx.strokeStyle = rgba(hc, 0.3); ctx.beginPath(); ctx.arc(x[s.hov], y[s.hov], 14, 0, 6.283); ctx.stroke(); ctx.lineWidth = 1;
      }
      if (s.mode) {
        var kk = 10000 / n, cnt = [0, 0, 0], C = cen();
        for (i = 0; i < rev; i++) cnt[g[i]]++;
        ctx.globalAlpha = Math.min(1, s.prog * 6); ctx.font = '500 12px "Geist Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        C.forEach(function (c, j) { ctx.fillStyle = cols[j]; ctx.fillText(CN[j] + '  ' + fmt(cnt[j] * kk), c[0], c[1] + 100); });
        ctx.globalAlpha = 1;
        if (!mob()) {
          var X0 = W * 0.58, X1 = W - 48, Y = H - 40, HGT = 34, cur = function (q) { return 1 - Math.pow(1 - q, 3); }, h;
          ctx.strokeStyle = rgba(th.fg, 0.25); ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(X1, Y);
          for (h = 0; h <= 24; h += 6) { var hx0 = X0 + (X1 - X0) * h / 24; ctx.moveTo(hx0, Y); ctx.lineTo(hx0, Y + 4); }
          ctx.stroke();
          ctx.fillStyle = th.muted; ctx.font = '11px "Geist Mono", monospace';
          for (h = 0; h <= 24; h += 6) ctx.fillText('T+' + h + 'h', X0 + (X1 - X0) * h / 24, Y + 16);
          ctx.strokeStyle = th.bio; ctx.lineWidth = 1.5; ctx.beginPath();
          for (var q = 0; q <= s.prog + 1e-6; q += 0.01) { var px = X0 + (X1 - X0) * q, py = Y - HGT * cur(q); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke(); ctx.lineWidth = 1;
          ctx.fillStyle = th.bio; ctx.beginPath(); ctx.arc(X0 + (X1 - X0) * s.prog, Y - HGT * cur(s.prog), 3, 0, 6.283); ctx.fill();
        }
        setText(countEl, fmt(412 * (1 - Math.pow(1 - s.prog, 3))));
        setText(statusEl, s.prog < 1 ? 'SIMULATING 10,000 AGENTS · T+' + Math.round(s.prog * 24) + 'h' : 'REHEARSAL COMPLETE · 24H PREDICTED');
      } else setText(statusEl, 'LAUNCH REHEARSAL');
      gctx.clearRect(0, 0, glowCv.width, glowCv.height); gctx.drawImage(cv, 0, 0, glowCv.width, glowCv.height);
      glowCv.style.opacity = String(GLOW * (dark ? 0.9 : 0.2));
      glowCv.style.mixBlendMode = dark ? 'screen' : 'multiply';
    };
    /* Hover: the fish nearest a point, from the same spatial grid the flocking
       uses. Only the cells within R are visited, and nothing is allocated. */
    s.nearest = function (px, py, R) {
      if (!head) return -1;
      var best = -1, bd = R * R, r = Math.ceil(R / CS), gx = (px / CS) | 0, gy = (py / CS) | 0;
      for (var yy = gy - r; yy <= gy + r; yy++) {
        if (yy < 0 || yy >= GH) continue;
        for (var xx = gx - r; xx <= gx + r; xx++) {
          if (xx < 0 || xx >= GW) continue;
          for (var j = head[yy * GW + xx]; j >= 0; j = nx[j]) {
            var dx = x[j] - px, dy = y[j] - py, d2 = dx * dx + dy * dy;
            if (d2 < bd) { bd = d2; best = j; }
          }
        }
      }
      return best;
    };
    /* A fish in open water, clear of the copy, for the keyboard button. */
    s.anyFish = function () {
      var m = mob(), n = s.n;
      for (var t = 0; t < 400; t++) {
        var j = (Math.random() * n) | 0;
        if (j !== s.hov && (m ? y[j] > 110 && y[j] < H * 0.4 && x[j] > 30 && x[j] < W - 30 : Math.abs(x[j] - W * 0.5) > 420 && x[j] > 40 && x[j] < W - 320 && y[j] > 140 && y[j] < H - 200)) return j;
      }
      return (Math.random() * n) | 0;
    };
    s.at = function (i, o) { o.x = x[i]; o.y = y[i]; o.g = s.mode && i < s.n * Math.min(1, s.prog * 2) ? g[i] : -1; o.W = W; o.H = H; return o; };
    /* Called once a frame (or on each pointer event when motion is reduced):
       keep the fish under the pointer while it stays close, else take the nearest. */
    s.track = function (now) {
      if (s.pin && now > s.pin) { s.pin = 0; s.hov = -1; }
      if (s.pin) return;
      var m = s.mouse;
      if (!m) { s.hov = -1; return; }
      var h = s.hov;
      if (h >= 0 && h < s.n) { var dx = x[h] - m.x, dy = y[h] - m.y; if (dx * dx + dy * dy < 4900) return; }
      s.hov = s.nearest(m.x, m.y, 30);
    };
    return s;
  }

  /* ------------------------------------------------------------- who's who
     Each fish is a simulated developer with a stable persona, derived from its
     index, and an activity that changes every few seconds. While a rehearsal
     runs, the activity follows the fish's school: praise, question or
     objection. None of these are real people; the card says so. */
  var ROLES = ['backend', 'frontend', 'SRE', 'security engineer', 'data engineer', 'ML engineer', 'indie hacker', 'OSS maintainer',
    'DevRel', 'platform engineer', 'mobile dev', 'startup CTO', 'staff engineer', 'student'];
  var STACKS = ['Go', 'Rust', 'TypeScript', 'Python', 'Java', 'Kotlin', 'Elixir', 'Ruby', 'C++', 'Swift', 'PHP', 'Zig', 'C#'];
  var VENUES = [['Hacker News', 'HN', 'upvoted on HN'], ['r/programming', 'r/programming', 'upvoted on r/programming'],
    ['r/selfhosted', 'r/selfhosted', 'upvoted on r/selfhosted'], ['X', 'X', 'reposted it on X'], ['Product Hunt', 'Product Hunt', 'upvoted it on Product Hunt']];
  var IDLE = ['reading the README', 'reading the launch post on %', 'scrolling %', 'skimming the comments', 'opened the repo',
    'checking the install steps', 'deciding whether to install', 'looking at the GitHub stars'];
  var ACTS = [
    ['@', 'installed it', 'starred the repo', 'shared on X', 'commenting: "Single binary, finally. Trying it tonight."',
      'running the quickstart', 'sent it to the team Slack', 'bookmarked it for Monday'],
    ['commenting: "How is this different from Playwright?"', 'asking: "Does it run offline?"', 'looking for the pricing page',
      'reading the docs', 'asking: "Which model writes the comments?"', 'comparing it with what they use now', 'asking: "Is there a self-host guide?"'],
    ['skeptical: no pricing page', 'skeptical: "simulated users" sounds circular', 'flagged: curl | sh with no signature',
      'downvoted', 'closed the tab', 'commenting: "Where are the benchmarks?"', 'skeptical: no self-host docs']
  ];
  var hsh = function (a) {
    a = Math.imul(a ^ (a >>> 16), 0x45d9f3b); a = Math.imul(a ^ (a >>> 16), 0x45d9f3b);
    return (a ^ (a >>> 16)) >>> 0;
  };
  var venueOf = function (i) { var u = hsh(i * 5 + 3) % 100; return VENUES[u < 40 ? 0 : u < 60 ? 1 : u < 75 ? 2 : 3]; };
  var personaOf = function (i) { return ROLES[hsh(i * 5 + 1) % ROLES.length] + ', ' + STACKS[hsh(i * 5 + 2) % STACKS.length] + ' · via ' + venueOf(i)[1]; };
  var devId = function (i) { return 'DEV #' + (hsh(i * 5 + 4) % 10000); };
  var activityOf = function (i, grp, slot) {
    var r = hsh(i * 7919 + slot), list = grp < 0 ? (r % 10 < 6 ? IDLE : ACTS[[0, 0, 0, 1, 2][hsh(i) % 5]]) : ACTS[grp];
    var a = list[(r >>> 4) % list.length], v = venueOf(i);
    return a === '@' ? v[2] : a.replace('%', v[1]);
  };

  if (hero && cv && glowCv && cv.getContext && window.Path2D) {
    sim = makeShoal();
    var pt = function (e) { var r = hero.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    var resize = function () {
      var r = hero.getBoundingClientRect();
      sim.resize(Math.max(320, Math.round(r.width)), Math.max(400, Math.round(r.height)));
      var inner = $('.hero__inner', hero);
      if (inner) {
        var ir = inner.getBoundingClientRect();
        sim.setZone({ x: ir.left - r.left + ir.width / 2, y: ir.top - r.top + ir.height / 2, rx: ir.width / 2 + 90, ry: ir.height / 2 + 60 });
      }
      if (reduced) { for (var i = 0; i < 240; i++) sim.step(1 / 60); sim.draw(); }
    };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(hero); else window.addEventListener('resize', resize);
    resize();
    var vis = true;
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }).observe(hero);
    var tipEl = $('[data-tip]'), tipIdEl = $('[data-tip-id]'), tipWho = $('[data-tip-who]'), tipAct = $('[data-tip-act]');
    var tipLive = $('[data-tip-live]'), tipBtn = $('[data-tip-btn]');
    var tip = { i: -1, key: -1, w: 0, h: 0, tx: -1, ty: -1 }, fo = { x: 0, y: 0, g: -1, W: 0, H: 0 };
    /* Draw the card for sim.hov: text only when the fish or its activity
       changes, position every frame, rounded so unchanged frames write nothing. */
    var renderTip = function (now) {
      sim.track(now);
      var i = sim.hov;
      if (i < 0) { if (tip.i >= 0) { tipEl.hidden = true; tip.i = -1; } return; }
      var f = sim.at(i, fo), slot = Math.floor(now / 1000 / (3.5 + (hsh(i) % 30) / 10) + (hsh(i + 9) % 7)), key = slot * 4 + f.g + 1;
      if (i !== tip.i) { tipIdEl.textContent = devId(i); tipWho.textContent = personaOf(i); tip.key = -1; tipEl.hidden = false; }
      if (key !== tip.key) {
        tipAct.textContent = activityOf(i, f.g, slot);
        tipEl.className = 'bubble tip' + (f.g > 0 ? ' g' + f.g : '');
        tip.key = key; tip.w = tipEl.offsetWidth; tip.h = tipEl.offsetHeight;
      }
      tip.i = i;
      var w = tip.w, lx = f.x + 18, ty = f.y - tip.h - 16;
      if (lx + w > f.W - 12) lx = f.x - 18 - w;
      if (ty < 80) ty = f.y + 18;
      lx = Math.round(Math.max(12, Math.min(f.W - w - 12, lx)));
      ty = Math.round(Math.max(80, Math.min(f.H - tip.h - 12, ty)));
      if (lx !== tip.tx || ty !== tip.ty) { tip.tx = lx; tip.ty = ty; tipEl.style.transform = 'translate(' + lx + 'px,' + ty + 'px)'; }
    };
    var refresh = function () { if (reduced) { renderTip(performance.now()); sim.draw(); } };
    var announce = function () {
      var i = sim.hov; if (i < 0) return;
      tipLive.textContent = 'Simulated developer ' + tipIdEl.textContent.replace('DEV ', '') + ', ' + tipWho.textContent.replace(' · via ', ', from ') + ': ' + tipAct.textContent + '.';
    };
    if (window.matchMedia && window.matchMedia('(hover: none)').matches) tipBtn.textContent = 'Tap a fish to see what it’s doing';

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      sim.mouse = pt(e);
      if (sim.pin && !e.target.closest('[data-tip-btn]')) sim.pin = 0;
      refresh();
    });
    hero.addEventListener('pointerleave', function () { sim.mouse = null; refresh(); });
    hero.addEventListener('pointerdown', function (e) {
      if (e.target.closest('a, button')) return;
      var p = pt(e);
      sim.click(p.x, p.y);
      /* No hover on touch: a tap near a fish shows its card for a few seconds. */
      if (e.pointerType !== 'mouse') {
        var j = sim.nearest(p.x, p.y, 44);
        if (j >= 0) { sim.hov = j; sim.pin = performance.now() + 6000; refresh(); if (reduced) setTimeout(refresh, 6100); }
      }
    });
    /* Keyboard (and anyone without a pointer): the hint is a button that picks a
       fish in open water and holds its card; again for another, Escape to close.
       Only this path speaks to the live region, so hovering stays quiet. */
    tipBtn.addEventListener('click', function () {
      sim.hov = sim.anyFish(); sim.pin = Infinity; tip.i = -1;
      refresh(); if (!reduced) renderTip(performance.now());
      announce();
    });
    var unpin = function () { if (sim.pin === Infinity) { sim.pin = 0; sim.hov = -1; refresh(); } };
    tipBtn.addEventListener('blur', unpin);
    tipBtn.addEventListener('keydown', function (e) { if (e.key === 'Escape') { unpin(); tipLive.textContent = ''; } });

    var toggle = $('[data-hero-toggle]'), hLabel = $('[data-hero-label]'), hIcon = $('[data-hero-icon]');
    var hIdle = $('[data-idle]'), hOn = $('[data-on]');
    toggle.setAttribute('role', 'button');
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      heroOn = !heroOn;
      if (heroOn) sim.start(); else sim.reset();
      hIdle.hidden = heroOn; hOn.hidden = !heroOn;
      hLabel.textContent = heroOn ? 'Reset rehearsal' : 'Rehearse a launch';
      hIcon.textContent = heroOn ? '↺' : '→';
      if (reduced) { if (heroOn) for (var i = 0; i < 900; i++) sim.step(1 / 60); sim.draw(); }
    });

    if (!reduced) {
      var last = performance.now();
      var tick = function (now) {
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        tickLogo(dt);
        if (vis) { sim.step(dt); renderTip(now); sim.draw(); }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  /* ------------------------------------------------------- 01 mock run
     The HTML ships the finished run, so it reads without this script. Here it
     is cleared to idle, and "Run rehearsal" (or Cmd/Ctrl+Enter) prints the log
     line by line with the canvas's timings. */
  var LOG_MS = [500, 600, 700, 600, 700, 700, 700, 700, 600, 600, 600];
  var lines = $$('[data-log] > [data-l]');
  var stepEls = $$('[data-steps] > li');
  var results = $('[data-results]');
  var runBtn = $('[data-run]'), runLabel = $('[data-run-label]'), elapsed = $('[data-elapsed]');
  var term = $('[data-term]'), post = $('[data-post]');
  var timers = [];

  function render(n) {
    var done = n === lines.length, running = n > 0 && !done;
    var stage = n ? Number(lines[n - 1].getAttribute('data-l')) : -1;
    lines.forEach(function (el, i) { el.hidden = i >= n; });
    stepEls.forEach(function (el, i) {
      var isDone = done || i < stage, act = running && i === stage;
      el.classList.toggle('is-done', isDone);
      el.classList.toggle('is-act', act);
      el.querySelector('span').textContent = isDone ? 'done' : act ? 'running…' : 'queued';
    });
    results.hidden = !done;
    runLabel.textContent = running ? 'Running…' : done ? 'Run again' : 'Run rehearsal';
    elapsed.textContent = n ? lines[n - 1].firstElementChild.textContent.replace(/[\[\]]/g, '') + 's' : 'idle';
    term.scrollTop = term.scrollHeight;
  }
  function runDemo() {
    timers.forEach(clearTimeout); timers = [];
    if (reduced) { render(lines.length); return; }
    render(0);
    var acc = 0;
    LOG_MS.forEach(function (ms, i) { acc += ms; timers.push(setTimeout(function () { render(i + 1); }, acc)); });
  }
  if (lines.length && runBtn) {
    render(0);
    runBtn.addEventListener('click', runDemo);
    window.addEventListener('keydown', function (e) { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); runDemo(); } });
    var words = $$('[data-words]');
    post.addEventListener('input', function () {
      var t = post.value.trim(), n = t ? t.split(/\s+/).length : 0;
      words.forEach(function (el) { el.textContent = String(n); });
    });
  }

  /* --------------------------------------------------------- 04 sign-up
     Posts { email, product: "shoal", captchaToken } to the waitlist Worker at
     api.shoal.ing, the same contract as the release.show and Colonizer
     waitlists (the Cratefield harness waitlist module, in
     shoal-ing/waitlist-backend). captchaToken is a Cloudflare Turnstile token
     from the widget under the form (action "waitlist"); the Worker verifies it
     and refuses a join without one (400, problem type captcha-failed). A token
     is single-use, so the widget is reset after every attempt. If the widget
     cannot load, the form says so and offers the address instead of sending
     without a token. On any failure the form says so and offers the address,
     rather than pretending the email was saved. Without JS the form is a
     mailto. */
  var API = 'https://api.shoal.ing/v1/waitlist';
  var SITEKEY = '0x4AAAAAAFM4LLG5hjMxlWrK';
  var TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=shoalTurnstileReady';
  var MAIL = '<a href="mailto:contact@shoal.ing?subject=Shoal%20early%20access">contact@shoal.ing</a>';
  var form = $('[data-form]');
  if (form) {
    var email = form.elements.email;
    var err = $('[data-form-err]');
    var go = $('.signup__go', form);
    var label = $('[data-submit-label]', form);
    var human = $('[data-captcha]');
    var token = null, widget = null, broken = false;
    var fail = function (html) { err.innerHTML = html; err.hidden = false; };
    var ok = function () { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()); };
    var unavailable = function () {
      broken = true; token = null;
      if (human) human.hidden = true;
      fail('! The human check didn\'t load, so the form can\'t send. A content blocker may be stopping challenges.cloudflare.com. Reload to try again, or email ' + MAIL + '.');
    };

    /* Turnstile, rendered explicitly into [data-captcha] once its script loads.
       Its theme follows the page's; a theme switch re-renders it while it holds
       no token. */
    var render = function () {
      if (!window.turnstile || !human) return;
      if (widget !== null) { window.turnstile.remove(widget); widget = null; }
      human.innerHTML = '';
      var box = document.createElement('div');
      human.appendChild(box);
      widget = window.turnstile.render(box, {
        sitekey: SITEKEY,
        action: 'waitlist',
        theme: th.dark ? 'dark' : 'light',
        size: 'flexible',
        callback: function (t) {
          token = t; broken = false;
          if (/human check/.test(err.textContent)) err.hidden = true;
        },
        'expired-callback': function () { token = null; },
        'timeout-callback': function () { token = null; },
        'error-callback': function () {
          token = null;
          fail('! The human check hit an error. Reload the page and try again, or email ' + MAIL + '.');
          return true;
        }
      });
    };
    var reset = function () {
      token = null;
      if (window.turnstile && widget !== null) window.turnstile.reset(widget);
    };
    if (human) {
      human.hidden = false;
      window.shoalTurnstileReady = function () { clearTimeout(waited); render(); };
      var tag = document.createElement('script');
      tag.src = TURNSTILE; tag.async = true; tag.defer = true;
      tag.onerror = function () { clearTimeout(waited); unavailable(); };
      var waited = setTimeout(function () { if (!window.turnstile) unavailable(); }, 10000);
      document.head.appendChild(tag);
      if (themeBtn) themeBtn.addEventListener('click', function () { if (!token && widget !== null) render(); });
    }

    email.addEventListener('input', function () {
      if (email.getAttribute('aria-invalid') === 'true' && ok()) { email.setAttribute('aria-invalid', 'false'); err.hidden = true; }
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.hidden = true;
      if (!ok()) {
        email.setAttribute('aria-invalid', 'true');
        fail('! That email looks off. Try again?');
        email.focus();
        return;
      }
      email.setAttribute('aria-invalid', 'false');
      if (broken || !window.turnstile) { unavailable(); return; }
      if (!token) {
        fail('! One more step: complete the human check below the field, then send.');
        return;
      }
      go.disabled = true;
      label.textContent = 'Sending…';
      var body = { email: email.value.trim(), product: 'shoal', captchaToken: token };
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then(function (res) {
          if (res.ok) return null;
          return res.json().catch(function () { return null; }).then(function (p) {
            var type = p && typeof p.type === 'string' ? p.type : '';
            throw new Error(/\/captcha-failed$/.test(type) ? 'captcha' : String(res.status));
          });
        })
        .then(function () {
          $('[data-done-email]').textContent = body.email;
          form.hidden = true;
          if (human) human.hidden = true;
          $('[data-done]').hidden = false;
        })
        .catch(function (x) {
          var why = x && x.message;
          fail(why === 'captcha'
            ? '! The human check didn\'t go through. It has been reset: complete it again, then send.'
            : Number(why) === 429
              ? '! Too many tries. Give it a minute, then send again.'
              : '! That didn\'t go through. Try again, or email ' + MAIL + '.');
        })
        .then(function () { reset(); go.disabled = false; label.textContent = 'Get early access'; });
    });
  }

  // ---------------------------------------------------------------- predictions
  // The example prediction plays like a live readout: rows arrive one by one and
  // their numbers count up; the rank climbs. Static (final) values without JS or
  // with reduced motion.
  (function () {
    var card = $('.pred');
    if (!card || reduced) return;
    var rows = $$('.pred__row', card), nums = $$('[data-to]', card), played = false;
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    function play() {
      card.classList.add('pred--play');
      rows.forEach(function (r) { r.classList.remove('is-in'); });
      nums.forEach(function (n) { n.textContent = n.getAttribute('data-from') || '0'; });
      rows.forEach(function (r, i) {
        setTimeout(function () {
          r.classList.add('is-in');
          $$('[data-to]', r).forEach(function (n) {
            var to = +n.getAttribute('data-to'), from = +(n.getAttribute('data-from') || 0), t0 = performance.now(), dur = 1300;
            (function tick(now) {
              var k = Math.max(0, Math.min(1, (now - t0) / dur)), v = from + (to - from) * ease(k);
              n.textContent = fmt(v) + (n.getAttribute('data-suffix') || '');
              if (k < 1) requestAnimationFrame(tick); else n.classList.add('is-done');
            })(t0);
          });
        }, 350 + i * 520);
      });
    }
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) {
        if (es[0].isIntersecting && !played) { played = true; play(); }
        if (!es[0].isIntersecting) played = false; // replay when it scrolls back in
      }, { threshold: 0.4 }).observe(card);
    } else play();
  })();
})();
