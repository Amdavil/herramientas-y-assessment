/* =========================================================================
   DELIFLOR BLOOM LAB — Codificador de códigos QR
   Modo byte, niveles de corrección L y M, versiones 1 a 9.
   Escrito sin dependencias para que el kiosco genere el código sin red.

   Sólo se admiten las versiones cuyos bloques de corrección son uniformes,
   que es lo que cubre de sobra la carga útil de un genoma.
   ========================================================================= */
(function (root) {
  'use strict';

  /* [ecPorBloque, bloques] por versión y nivel */
  var SPEC = {
    L: { 1:[7,1], 2:[10,1], 3:[15,1], 4:[20,1], 5:[26,1], 6:[18,2], 7:[20,2], 8:[24,2], 9:[30,2] },
    M: { 1:[10,1], 2:[16,1], 3:[26,1], 4:[18,2], 5:[24,2], 6:[16,4], 7:[18,4] }
  };
  var TOTAL = { 1:26, 2:44, 3:70, 4:100, 5:134, 6:172, 7:196, 8:242, 9:292 };
  var ALIGN = { 1:[], 2:[6,18], 3:[6,22], 4:[6,26], 5:[6,30], 6:[6,34], 7:[6,22,38], 8:[6,24,42], 9:[6,26,46] };
  var EC_BITS = { L: 1, M: 0 };
  var G15 = 0x537, G15_MASK = 0x5412, G18 = 0x1F25;

  /* ---- Campo de Galois GF(256) ---- */
  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1, i;
    for (i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  function genPoly(n) {
    var p = [1], i, j, q;
    for (i = 0; i < n; i++) {
      q = new Array(p.length + 1);
      for (j = 0; j < q.length; j++) q[j] = 0;
      for (j = 0; j < p.length; j++) {
        q[j] ^= p[j];
        q[j + 1] ^= gmul(p[j], EXP[i]);
      }
      p = q;
    }
    return p;
  }

  function ecFor(data, n) {
    var g = genPoly(n), res = new Array(data.length + n), i, j, f;
    for (i = 0; i < data.length; i++) res[i] = data[i];
    for (i = data.length; i < res.length; i++) res[i] = 0;
    for (i = 0; i < data.length; i++) {
      f = res[i];
      if (f !== 0) for (j = 0; j < g.length; j++) res[i + j] ^= gmul(g[j], f);
    }
    return res.slice(data.length);
  }

  /* ---- BCH para la información de formato y de versión ---- */
  function bchDigit(d) { var n = 0; while (d !== 0) { n++; d >>>= 1; } return n; }
  function formatInfo(level, mask) {
    var data = (EC_BITS[level] << 3) | mask;
    var d = data << 10;
    while (bchDigit(d) - bchDigit(G15) >= 0) d ^= (G15 << (bchDigit(d) - bchDigit(G15)));
    return ((data << 10) | d) ^ G15_MASK;
  }
  function versionInfo(v) {
    var d = v << 12;
    while (bchDigit(d) - bchDigit(G18) >= 0) d ^= (G18 << (bchDigit(d) - bchDigit(G18)));
    return (v << 12) | d;
  }

  /* ---- Máscaras ---- */
  function maskFn(n, i, j) {
    switch (n) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      default: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0;
    }
  }

  function utf8(s) {
    var out = [], i, c;
    for (i = 0; i < s.length; i++) {
      c = s.charCodeAt(i);
      if (c < 128) out.push(c);
      else if (c < 2048) out.push(192 | (c >> 6), 128 | (c & 63));
      else out.push(224 | (c >> 12), 128 | ((c >> 6) & 63), 128 | (c & 63));
    }
    return out;
  }

  function capacity(v, level) {
    var s = SPEC[level][v];
    if (!s) return -1;
    var dataCw = TOTAL[v] - s[0] * s[1];
    return Math.floor((dataCw * 8 - 12) / 8);
  }

  function choose(len) {
    for (var v = 1; v <= 9; v++) {
      if (SPEC.M[v] && capacity(v, 'M') >= len) return { version: v, level: 'M' };
      if (SPEC.L[v] && capacity(v, 'L') >= len) return { version: v, level: 'L' };
    }
    return null;
  }

  /* ---- Codificación completa ---- */
  function encode(text) {
    var bytes = utf8(String(text));
    var pick = choose(bytes.length);
    if (!pick) return null;

    var v = pick.version, level = pick.level;
    var spec = SPEC[level][v], ecLen = spec[0], nBlocks = spec[1];
    var dataCw = TOTAL[v] - ecLen * nBlocks;
    var perBlock = dataCw / nBlocks;

    /* flujo de bits: modo byte + longitud + datos */
    var bits = [];
    function put(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }
    put(4, 4);
    put(bytes.length, 8);
    for (var i = 0; i < bytes.length; i++) put(bytes[i], 8);
    for (i = 0; i < 4 && bits.length < dataCw * 8; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);

    var cw = [];
    for (i = 0; i < bits.length; i += 8) {
      var b = 0;
      for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
      cw.push(b);
    }
    var pads = [0xEC, 0x11], p = 0;
    while (cw.length < dataCw) cw.push(pads[p++ % 2]);

    /* bloques + corrección de errores */
    var dBlocks = [], eBlocks = [];
    for (i = 0; i < nBlocks; i++) {
      var blk = cw.slice(i * perBlock, (i + 1) * perBlock);
      dBlocks.push(blk);
      eBlocks.push(ecFor(blk, ecLen));
    }
    var stream = [];
    for (i = 0; i < perBlock; i++) for (j = 0; j < nBlocks; j++) stream.push(dBlocks[j][i]);
    for (i = 0; i < ecLen; i++) for (j = 0; j < nBlocks; j++) stream.push(eBlocks[j][i]);

    /* prueba las 8 máscaras y elige la de menor penalización */
    var best = null, bestScore = Infinity;
    for (var mk = 0; mk < 8; mk++) {
      var m = matrix(v, level, stream, mk);
      var sc = penalty(m);
      if (sc < bestScore) { bestScore = sc; best = m; }
    }
    return { size: best.length, modules: best, version: v, level: level };
  }

  /* ---- Construcción de la matriz ---- */
  function matrix(v, level, stream, mask) {
    var size = v * 4 + 17;
    var m = [], i, j;
    for (i = 0; i < size; i++) { m.push(new Array(size)); for (j = 0; j < size; j++) m[i][j] = null; }

    function finder(r0, c0) {
      for (var r = -1; r <= 7; r++) for (var c = -1; c <= 7; c++) {
        var rr = r0 + r, cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        m[rr][cc] = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                    (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4);
      }
    }
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);

    /* patrones de alineación */
    var pos = ALIGN[v];
    for (i = 0; i < pos.length; i++) for (j = 0; j < pos.length; j++) {
      var ar = pos[i], ac = pos[j];
      if (m[ar][ac] !== null) continue;
      for (var r2 = -2; r2 <= 2; r2++) for (var c2 = -2; c2 <= 2; c2++) {
        m[ar + r2][ac + c2] = (r2 === -2 || r2 === 2 || c2 === -2 || c2 === 2 || (r2 === 0 && c2 === 0));
      }
    }

    /* patrones de sincronización */
    for (i = 8; i < size - 8; i++) {
      if (m[i][6] === null) m[i][6] = (i % 2 === 0);
      if (m[6][i] === null) m[6][i] = (i % 2 === 0);
    }

    /* información de versión (v7 en adelante) */
    if (v >= 7) {
      var vb = versionInfo(v);
      for (i = 0; i < 18; i++) {
        var bit = ((vb >> i) & 1) === 1;
        m[Math.floor(i / 3)][i % 3 + size - 8 - 3] = bit;
        m[i % 3 + size - 8 - 3][Math.floor(i / 3)] = bit;
      }
    }

    /* información de formato */
    var fb = formatInfo(level, mask);
    for (i = 0; i < 15; i++) {
      var b2 = ((fb >> i) & 1) === 1;
      if (i < 6) m[i][8] = b2;
      else if (i < 8) m[i + 1][8] = b2;
      else m[size - 15 + i][8] = b2;
    }
    for (i = 0; i < 15; i++) {
      var b3 = ((fb >> i) & 1) === 1;
      if (i < 8) m[8][size - i - 1] = b3;
      else if (i < 9) m[8][15 - i - 1 + 1] = b3;
      else m[8][15 - i - 1] = b3;
    }
    m[size - 8][8] = true;

    /* datos en zigzag, con la máscara aplicada al vuelo */
    var inc = -1, row = size - 1, bitIdx = 7, byteIdx = 0;
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (;;) {
        for (var c3 = 0; c3 < 2; c3++) {
          if (m[row][col - c3] === null) {
            var dark = false;
            if (byteIdx < stream.length) dark = ((stream[byteIdx] >>> bitIdx) & 1) === 1;
            if (maskFn(mask, row, col - c3)) dark = !dark;
            m[row][col - c3] = dark;
            bitIdx--;
            if (bitIdx === -1) { byteIdx++; bitIdx = 7; }
          }
        }
        row += inc;
        if (row < 0 || row >= size) { row -= inc; inc = -inc; break; }
      }
    }
    return m;
  }

  /* ---- Penalización (las cuatro reglas del estándar) ---- */
  function penalty(m) {
    var n = m.length, score = 0, r, c, i, run, prev;

    for (r = 0; r < n; r++) {
      run = 1; prev = m[r][0];
      for (c = 1; c < n; c++) {
        if (m[r][c] === prev) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[r][c]; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
    for (c = 0; c < n; c++) {
      run = 1; prev = m[0][c];
      for (r = 1; r < n; r++) {
        if (m[r][c] === prev) run++;
        else { if (run >= 5) score += 3 + (run - 5); run = 1; prev = m[r][c]; }
      }
      if (run >= 5) score += 3 + (run - 5);
    }

    for (r = 0; r < n - 1; r++) for (c = 0; c < n - 1; c++) {
      var v0 = m[r][c];
      if (v0 === m[r][c + 1] && v0 === m[r + 1][c] && v0 === m[r + 1][c + 1]) score += 3;
    }

    var pat1 = [true,false,true,true,true,false,true,false,false,false,false];
    var pat2 = [false,false,false,false,true,false,true,true,true,false,true];
    function matches(get, len, start, pat) {
      for (var k = 0; k < pat.length; k++) if (get(start + k) !== pat[k]) return false;
      return true;
    }
    for (r = 0; r < n; r++) {
      for (c = 0; c + 11 <= n; c++) {
        var gr = (function (rr) { return function (x) { return m[rr][x]; }; })(r);
        if (matches(gr, n, c, pat1)) score += 40;
        if (matches(gr, n, c, pat2)) score += 40;
      }
    }
    for (c = 0; c < n; c++) {
      for (r = 0; r + 11 <= n; r++) {
        var gc = (function (cc) { return function (x) { return m[x][cc]; }; })(c);
        if (matches(gc, n, r, pat1)) score += 40;
        if (matches(gc, n, r, pat2)) score += 40;
      }
    }

    var dark = 0;
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) if (m[r][c]) dark++;
    var pct = Math.abs(dark * 100 / (n * n) - 50);
    score += Math.floor(pct / 5) * 10;
    return score;
  }

  /* ---- Dibujo ---- */
  function toCanvas(canvas, text, opt) {
    opt = opt || {};
    var q = encode(text);
    if (!q) return false;
    var quiet = opt.quiet === undefined ? 3 : opt.quiet;
    var total = q.size + quiet * 2;
    var dpr = Math.min(window.devicePixelRatio || 1, 3);
    var css = opt.size || canvas.getBoundingClientRect().width || 260;
    var scale = Math.max(1, Math.floor(css * dpr / total));
    var px = total * scale;
    canvas.width = px; canvas.height = px;
    canvas.style.width = css + 'px'; canvas.style.height = css + 'px';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opt.light || '#FFFFFF';
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = opt.dark || '#241A1F';
    for (var r = 0; r < q.size; r++) for (var c = 0; c < q.size; c++) {
      if (q.modules[r][c]) ctx.fillRect((c + quiet) * scale, (r + quiet) * scale, scale, scale);
    }
    return true;
  }

  root.QR = { encode: encode, toCanvas: toCanvas, capacity: capacity };
})(window);
