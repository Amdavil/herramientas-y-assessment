/* =========================================================================
   DELIFLOR BLOOM LAB — Dibujo 2D
   Miniaturas de familia, siluetas de pétalo, muestras de patrón y el
   respaldo completo cuando el equipo no soporta WebGL.
   ========================================================================= */
(function (root) {
  'use strict';
  var PI = Math.PI, TAU = PI * 2;

  function profile(shape, u) {
    var s = Math.sin(PI * u);
    switch (shape) {
      case 'rounded':  return Math.pow(s, 0.5);
      case 'oval':     return Math.pow(s, 0.8);
      case 'long':     return Math.pow(s, 1.25) * 0.78;
      case 'tubular':  return 0.30 * (1 - 0.35 * u);
      case 'spoon':    return u < 0.66 ? 0.26 : 0.26 + Math.pow((u - 0.66) / 0.34, 0.7) * 0.8;
      case 'curly':    return Math.pow(s, 0.7) * (1 + 0.16 * Math.sin(u * 13));
      case 'pointed':  return Math.pow(s, 0.45) * Math.pow(1 - u, 0.3);
      case 'wavy':     return Math.pow(s, 0.8) * (1 + 0.1 * Math.sin(u * 8));
      case 'spiral':   return Math.pow(s, 1.1) * 0.82;
      case 'irregular':return Math.pow(s, 0.75) * (1 + 0.22 * Math.sin(u * 6.3) * Math.cos(u * 11.1));
      default:         return Math.pow(s, 0.7);
    }
  }

  function fit(canvas) {
    var r = canvas.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round((r.width || canvas.width || 100) * dpr));
    var h = Math.max(1, Math.round((r.height || canvas.height || 100) * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w / dpr, h: h / dpr };
  }

  /* Un pétalo visto desde arriba, con el escorzo del ángulo de nacimiento */
  function petalPath(ctx, L, halfW, shape, curve) {
    var N = 16, i, u, w, bendY;
    ctx.beginPath();
    for (i = 0; i <= N; i++) {
      u = i / N; w = profile(shape, u) * halfW;
      bendY = (curve - 0.5) * u * u * halfW * 1.2;
      if (i === 0) ctx.moveTo(0, 0); else ctx.lineTo(u * L, -w + bendY);
    }
    for (i = N; i >= 0; i--) {
      u = i / N; w = profile(shape, u) * halfW;
      bendY = (curve - 0.5) * u * u * halfW * 1.2;
      ctx.lineTo(u * L, w + bendY);
    }
    ctx.closePath();
  }

  function colorsOf(g) {
    var C = Genome;
    return {
      primary: C.hex(g.colors.primary), secondary: C.hex(g.colors.secondary),
      center: C.hex(g.colors.center), tip: C.hex(g.colors.tip), reverse: C.hex(g.colors.reverse)
    };
  }

  function petalFill(ctx, g, C, L, halfW, f) {
    var grad = ctx.createLinearGradient(0, 0, L, 0);
    switch (g.pattern) {
      case 'gradientCenter': grad.addColorStop(0, C.secondary); grad.addColorStop(1, C.primary); break;
      case 'gradientTips':   grad.addColorStop(0, C.primary); grad.addColorStop(0.55, C.primary); grad.addColorStop(1, C.tip); break;
      case 'contrastCenter': grad.addColorStop(0, f < 0.32 ? C.secondary : C.primary); grad.addColorStop(1, f < 0.32 ? C.secondary : C.primary); break;
      case 'contrastTips':   grad.addColorStop(0, C.primary); grad.addColorStop(0.8, C.primary); grad.addColorStop(0.82, C.tip); grad.addColorStop(1, C.tip); break;
      case 'bicolor':        grad.addColorStop(0, C.primary); grad.addColorStop(0.5, C.primary); grad.addColorStop(0.5, C.secondary); grad.addColorStop(1, C.secondary); break;
      case 'edged':          grad.addColorStop(0, C.primary); grad.addColorStop(1, C.primary); break;
      case 'watercolor':     grad.addColorStop(0, C.secondary); grad.addColorStop(0.5, C.primary); grad.addColorStop(1, C.tip); break;
      case 'iridescent':     grad.addColorStop(0, C.primary); grad.addColorStop(0.6, C.tip); grad.addColorStop(1, C.secondary); break;
      default:               grad.addColorStop(0, C.primary); grad.addColorStop(1, C.primary);
    }
    ctx.fillStyle = grad;
  }

  /* ---------------------------------------------------------------
     Flor vista desde arriba
     --------------------------------------------------------------- */
  function flower(canvas, g, opt) {
    opt = opt || {};
    var f2 = fit(canvas), ctx = f2.ctx, W = f2.w, H = f2.h;
    ctx.clearRect(0, 0, W, H);
    if (opt.bg) { ctx.fillStyle = opt.bg; ctx.fillRect(0, 0, W, H); }

    var cx = W / 2, cy = H / 2;
    var R = Math.min(W, H) * (opt.scale || 0.46);
    var C = colorsOf(g);
    var rand = Genome.rng((g.seed || 1) * 7919 + 13);
    var layers = Math.max(1, g.layers);
    var asym = 1 - g.symmetry;
    var maxPetals = opt.cheap ? 90 : 420;
    var total = 0;

    ctx.save();
    ctx.translate(cx, cy);
    if (opt.rotate) ctx.rotate(opt.rotate);

    for (var i = layers - 1; i >= 0; i--) {
      var f = layers > 1 ? i / (layers - 1) : 1;
      var phi = (0.33 + g.volume * 0.75) * (PI / 2) * Math.pow(f, 0.82);
      var pitch = (PI / 2 - phi) - g.openness * 0.95;
      /* escorzo: cuanto más vertical el pétalo, menos se proyecta hacia afuera */
      var fore = Math.max(0.12, Math.cos(pitch));
      var L = R * (0.32 + g.petalLength * 0.62) * (0.58 + 0.42 * f) * fore + R * 0.1 * Math.sin(phi);
      var halfW = R * (0.05 + g.petalWidth * 0.12) * (0.85 + 0.3 * f);
      var cnt = Math.round((4 + 17 * f) * (0.42 + g.density * 1.0));
      if (g.arrangement === 'compact') cnt = Math.round(cnt * 1.2);
      if (g.arrangement === 'open') cnt = Math.round(cnt * 0.7);
      cnt = Math.max(3, cnt);
      if (total + cnt > maxPetals) cnt = Math.max(3, maxPetals - total);
      if (total >= maxPetals) continue;
      total += cnt;

      var off = g.arrangement === 'spiral' ? i * 2.399963
              : g.arrangement === 'layered' ? i * (PI / cnt) : 0;
      var base = R * (0.06 + g.centerSize * 0.34) * Math.sin(phi);

      for (var k = 0; k < cnt; k++) {
        var th = off + k * (TAU / cnt) + asym * (rand() - 0.5) * (TAU / cnt) * 1.6;
        var jl = 1 + asym * (rand() - 0.5) * 0.5;
        ctx.save();
        ctx.rotate(th);
        ctx.translate(base, 0);
        petalFill(ctx, g, C, L * jl, halfW, f);
        petalPath(ctx, L * jl, halfW, g.petalShape, g.petalCurve);
        ctx.fill();
        if (g.pattern === 'edged') {
          ctx.strokeStyle = C.secondary; ctx.lineWidth = Math.max(1, halfW * 0.3); ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 0.6; ctx.stroke();
        }
        /* sombra en la base para dar profundidad al corazón */
        var sh = ctx.createLinearGradient(0, 0, L * 0.5, 0);
        sh.addColorStop(0, 'rgba(0,0,0,.30)'); sh.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sh; ctx.fill();
        ctx.restore();
      }
    }

    /* centro */
    var cr = R * (0.06 + g.centerSize * 0.34);
    var cg = ctx.createRadialGradient(-cr * 0.3, -cr * 0.3, cr * 0.1, 0, 0, cr);
    cg.addColorStop(0, C.center); cg.addColorStop(1, shade(C.center, 0.68));
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0, 0, cr, 0, TAU); ctx.fill();
    if (g.centerSize > 0.12) {
      ctx.fillStyle = 'rgba(0,0,0,.20)';
      var nf = Math.round(18 + g.centerSize * 90);
      for (var d = 0; d < nf; d++) {
        var a = d * 2.399963, rr = cr * Math.sqrt(d / nf) * 0.9;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, cr * 0.07, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ---------------------------------------------------------------
     Respaldo sin WebGL: flor o ramo en 2D
     --------------------------------------------------------------- */
  function fallbackScene(canvas, g, kind) {
    var f2 = fit(canvas), ctx = f2.ctx, W = f2.w, H = f2.h;
    var env = { studio: ['#F7F5F3', '#DAD5D1'], greenhouse: ['#E2EBD6', '#9DAE8C'],
      floralEvent: ['#F0E7EC', '#B9AAB8'], elegantTable: ['#EFE7DB', '#AC9E8C'],
      natural: ['#DEE8EA', '#A9B79E'], deliflor: ['#8C2757', '#4C1029'], artistic: ['#332E3C', '#141118'] };
    var pair = env[g.bouquet.bg] || env.studio;
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, pair[0]); bg.addColorStop(1, pair[1]);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    if (kind !== 'bouquet') {
      flower(canvas, g, { scale: 0.4, bg: null });
      return;
    }
    /* ramo: tallos + flores en disposición de domo */
    var rand = Genome.rng((g.seed || 1) * 104729 + 7);
    var countMap = { small: 7, medium: 12, abundant: 18, monumental: 24 };
    var n = countMap[g.bouquet.abundance] || 12;
    var cx = W / 2, cy = H * 0.46, spread = Math.min(W, H) * 0.34;
    var baseY = H * 0.88;
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = i * 2.399963, rr = Math.sqrt((i + 0.4) / n);
      pts.push({ x: cx + Math.cos(a) * spread * rr, y: cy + Math.sin(a) * spread * rr * 0.62 - (1 - rr) * spread * 0.3, s: 0.62 + rand() * 0.4, z: rr });
    }
    pts.sort(function (a, b) { return b.y - a.y; });
    ctx.strokeStyle = '#43602B'; ctx.lineCap = 'round';
    for (i = 0; i < pts.length; i++) {
      ctx.lineWidth = Math.max(2, spread * 0.035);
      ctx.beginPath(); ctx.moveTo(cx, baseY);
      ctx.quadraticCurveTo((cx + pts[i].x) / 2, (baseY + pts[i].y) / 2, pts[i].x, pts[i].y);
      ctx.stroke();
    }
    var wrapCol = { whitePaper: '#F0EEEA', naturalPaper: '#C9B594', deliflorPaper: '#7C214D', textile: '#B8AEB2', vase: '#DCD9D4' }[g.bouquet.wrap];
    if (wrapCol) {
      ctx.fillStyle = wrapCol;
      ctx.beginPath();
      ctx.moveTo(cx - spread * 0.55, baseY - spread * 0.55);
      ctx.lineTo(cx + spread * 0.55, baseY - spread * 0.55);
      ctx.lineTo(cx + spread * 0.22, H * 0.99);
      ctx.lineTo(cx - spread * 0.22, H * 0.99);
      ctx.closePath(); ctx.fill();
    }
    var tmp = document.createElement('canvas');
    var size = Math.round(spread * 1.5);
    tmp.width = tmp.height = size;
    tmp.style.width = tmp.style.height = size + 'px';
    flower(tmp, g, { scale: 0.46, cheap: true });
    for (i = 0; i < pts.length; i++) {
      var s = size * pts[i].s * 0.62;
      ctx.drawImage(tmp, pts[i].x - s / 2, pts[i].y - s / 2, s, s);
    }
  }

  /* ---------------------------------------------------------------
     Silueta de un pétalo suelto (pantalla 5)
     --------------------------------------------------------------- */
  function petalIcon(canvas, shape, color, edge) {
    var f2 = fit(canvas), ctx = f2.ctx, W = f2.w, H = f2.h;
    ctx.clearRect(0, 0, W, H);
    var L = H * 0.76, halfW = Math.min(W, H) * 0.2;
    ctx.save();
    ctx.translate(W / 2, H * 0.90);
    ctx.rotate(-PI / 2);
    var grad = ctx.createLinearGradient(0, 0, L, 0);
    grad.addColorStop(0, shade(color, 0.72)); grad.addColorStop(1, color);
    ctx.fillStyle = grad;
    var N = 26, i, u, w, wob;
    ctx.beginPath(); ctx.moveTo(0, 0);
    for (i = 1; i <= N; i++) {
      u = i / N; w = profile(shape, u) * halfW;
      wob = edge === 'wavy' ? Math.sin(u * 9.5) * w * 0.18 : edge === 'toothed' ? (Math.abs(((u * 11) % 1) - 0.5) - 0.25) * w * 0.7 : 0;
      ctx.lineTo(u * L, -(w + wob));
    }
    for (i = N; i >= 1; i--) {
      u = i / N; w = profile(shape, u) * halfW;
      wob = edge === 'wavy' ? Math.sin(u * 9.5) * w * 0.18 : edge === 'toothed' ? (Math.abs(((u * 11) % 1) - 0.5) - 0.25) * w * 0.7 : 0;
      ctx.lineTo(u * L, w + wob);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(L * 0.94, 0); ctx.stroke();
    ctx.restore();
  }

  /* Muestra circular de un patrón de color */
  function patternSwatch(canvas, pattern, colors) {
    var f2 = fit(canvas), ctx = f2.ctx, W = f2.w, H = f2.h;
    var g2 = Genome.base();
    g2.colors = colors; g2.pattern = pattern;
    g2.layers = 3; g2.density = 0.55; g2.openness = 0.8; g2.volume = 0.3;
    g2.petalShape = 'oval'; g2.centerSize = 0.22; g2.symmetry = 1; g2.seed = 9;
    ctx.clearRect(0, 0, W, H);
    flower(canvas, g2, { scale: 0.47, cheap: true });
  }

  function shade(hex, k) {
    var c = Genome.rgb(hex);
    return 'rgb(' + Math.round(c[0] * k * 255) + ',' + Math.round(c[1] * k * 255) + ',' + Math.round(c[2] * k * 255) + ')';
  }

  root.Thumbs = {
    flower: flower, fallbackScene: fallbackScene,
    petalIcon: petalIcon, patternSwatch: patternSwatch, profile: profile
  };
})(window);
