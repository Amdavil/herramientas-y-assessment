/* =========================================================================
   DELIFLOR BLOOM LAB — Geometría procedural
   Construye la flor, el tallo, la hoja y el ramo a partir del genoma.
   Sin dependencias externas.

   Modelo del pétalo: superficie paramétrica (u a lo largo, v a lo ancho)
   sobre un raquis de arco circular. El pétalo nace en un receptáculo con
   forma de domo; el ángulo de nacimiento y la apertura determinan si la
   flor resulta esférica (Ballhia) o plana (Margriet).
   ========================================================================= */
(function (root) {
  'use strict';

  var PI = Math.PI, TAU = PI * 2;

  /* ---------------------------------------------------------------
     Acumulador de malla
     --------------------------------------------------------------- */
  function Mesh() {
    this.pos = []; this.nor = []; this.cf = []; this.cb = []; this.mat = [];
  }
  Mesh.prototype.tri = function (a, b, c, na, nb, nc, cf, cb, m) {
    this.pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    this.nor.push(na[0], na[1], na[2], nb[0], nb[1], nb[2], nc[0], nc[1], nc[2]);
    for (var i = 0; i < 3; i++) {
      this.cf.push(cf[0], cf[1], cf[2]);
      this.cb.push(cb[0], cb[1], cb[2]);
      this.mat.push(m);
    }
  };
  /* Copia otra malla aplicando una matriz 4x4 (column-major) */
  Mesh.prototype.merge = function (src, M) {
    var p = src.pos, n = src.nor, i, x, y, z;
    var m0 = M[0], m1 = M[1], m2 = M[2], m4 = M[4], m5 = M[5], m6 = M[6],
        m8 = M[8], m9 = M[9], m10 = M[10], m12 = M[12], m13 = M[13], m14 = M[14];
    for (i = 0; i < p.length; i += 3) {
      x = p[i]; y = p[i + 1]; z = p[i + 2];
      this.pos.push(m0 * x + m4 * y + m8 * z + m12,
                    m1 * x + m5 * y + m9 * z + m13,
                    m2 * x + m6 * y + m10 * z + m14);
      x = n[i]; y = n[i + 1]; z = n[i + 2];
      this.nor.push(m0 * x + m4 * y + m8 * z,
                    m1 * x + m5 * y + m9 * z,
                    m2 * x + m6 * y + m10 * z);
    }
    push(this.cf, src.cf); push(this.cb, src.cb); push(this.mat, src.mat);
  };
  Mesh.prototype.build = function () {
    return {
      pos: new Float32Array(this.pos), nor: new Float32Array(this.nor),
      cf: new Float32Array(this.cf), cb: new Float32Array(this.cb),
      mat: new Float32Array(this.mat), count: this.pos.length / 3
    };
  };
  function push(dst, src) { for (var i = 0; i < src.length; i++) dst.push(src[i]); }

  /* ---------------------------------------------------------------
     Rejilla genérica: evalúa la superficie, deriva normales por
     diferencias finitas y emite triángulos.
     --------------------------------------------------------------- */
  function addGrid(mesh, NU, NV, posFn, colFn, matId) {
    var grid = new Array((NU + 1) * (NV + 1)), i, j, u, v;
    for (i = 0; i <= NU; i++) {
      u = i / NU;
      for (j = 0; j <= NV; j++) {
        v = j / NV * 2 - 1;
        grid[i * (NV + 1) + j] = posFn(u, v);
      }
    }
    var nrm = new Array(grid.length);
    for (i = 0; i <= NU; i++) {
      for (j = 0; j <= NV; j++) {
        var k = i * (NV + 1) + j;
        var pu1 = grid[Math.min(i + 1, NU) * (NV + 1) + j];
        var pu0 = grid[Math.max(i - 1, 0) * (NV + 1) + j];
        var pv1 = grid[i * (NV + 1) + Math.min(j + 1, NV)];
        var pv0 = grid[i * (NV + 1) + Math.max(j - 1, 0)];
        var du = sub(pu1, pu0), dv = sub(pv1, pv0);
        nrm[k] = norm(cross(du, dv));
      }
    }
    for (i = 0; i < NU; i++) {
      for (j = 0; j < NV; j++) {
        var a = i * (NV + 1) + j, b = (i + 1) * (NV + 1) + j,
            c = (i + 1) * (NV + 1) + j + 1, d = i * (NV + 1) + j + 1;
        var uc = (i + 0.5) / NU, vc = (j + 0.5) / NV * 2 - 1;
        var col = colFn(uc, vc);
        mesh.tri(grid[a], grid[b], grid[c], nrm[a], nrm[b], nrm[c], col[0], col[1], matId);
        mesh.tri(grid[a], grid[c], grid[d], nrm[a], nrm[c], nrm[d], col[0], col[1], matId);
      }
    }
  }

  /* ---------------------------------------------------------------
     Perfil de ancho del pétalo

     Un flósculo radial de crisantemo es una cinta: se estrecha donde se
     inserta, mantiene un ancho casi constante y termina redondeado, no en
     punta. Ésa es la diferencia entre una flor y una piña. Sólo la forma
     'puntiagudo' termina realmente en pico.
     --------------------------------------------------------------- */
  function tipRound(u, start) {
    if (u <= start) return 1;
    var t = (u - start) / (1 - start);
    return Math.sqrt(Math.max(0, 1 - t * t));
  }
  function baseTaper(u, k) { return Math.pow(Math.min(1, u / k), 0.6); }
  /* Sube al ancho completo y se queda ahí: da la cinta espatulada que se ve
     en la macrofotografía del catálogo, en vez de una elipse acabada en pico. */
  function plateau(u, rise) { return smoothstep(0, rise, u) * 0.86 + 0.14 * Math.min(1, u / rise); }

  function widthProfile(shape, u) {
    var s = Math.sin(PI * u);
    switch (shape) {
      case 'rounded':  return plateau(u, 0.30) * (0.93 + 0.10 * s) * tipRound(u, 0.88);
      case 'oval':     return plateau(u, 0.44) * (0.84 + 0.22 * s) * tipRound(u, 0.85);
      case 'long':     return baseTaper(u, 0.16) * 0.76 * (0.92 + 0.12 * s) * tipRound(u, 0.91);
      case 'tubular':  return baseTaper(u, 0.10) * 0.38 * (1 - 0.18 * u) * tipRound(u, 0.93);
      case 'spoon':    return baseTaper(u, 0.14) * (0.34 + 0.62 * smoothstep(0.52, 0.88, u)) * tipRound(u, 0.94);
      case 'curly':    return baseTaper(u, 0.20) * (0.86 + 0.18 * s) * (1 + 0.12 * Math.sin(u * 12)) * tipRound(u, 0.89);
      case 'pointed':  return baseTaper(u, 0.20) * (0.90 + 0.20 * s) * Math.pow(1 - u, 0.42);
      case 'wavy':     return baseTaper(u, 0.24) * (0.72 + 0.36 * s) * (1 + 0.09 * Math.sin(u * 7)) * tipRound(u, 0.89);
      case 'spiral':   return baseTaper(u, 0.12) * 0.56 * (0.94 + 0.10 * s) * tipRound(u, 0.93);
      case 'irregular':return baseTaper(u, 0.22) * (0.76 + 0.30 * s) * (1 + 0.16 * Math.sin(u * 5.7) * Math.cos(u * 9.3)) * tipRound(u, 0.88);
      default:         return baseTaper(u, 0.22) * (0.80 + 0.28 * s) * tipRound(u, 0.89);
    }
  }
  var TUBULAR = { tubular: 1, spiral: 1 };

  /* Reparto de los cortes a lo largo del pétalo. Con cortes equidistantes la
     punta redondeada se resolvía en un solo triángulo y volvía a verse en
     pico; esta curva concentra cortes en la base y en el extremo. */
  function uMap(u) { return u * u * (3 - 2 * u); }

  /* Desplazamiento del borde, perpendicular a la cara del pétalo */
  function edgeDisp(edge, u, v, w) {
    var av = Math.abs(v);
    switch (edge) {
      case 'wavy':    return Math.sin(u * 9.5) * av * av * w * 0.42;
      case 'toothed': return (Math.abs(((u * 11) % 1) - 0.5) - 0.25) * av * av * w * 0.9;
      case 'curled':  return -av * av * av * w * 1.25;
      case 'sharp':   return Math.sin(u * 5) * Math.pow(av, 4) * w * 0.5;
      case 'faded':   return 0;
      default:        return 0;
    }
  }

  /* ---------------------------------------------------------------
     Un pétalo. Devuelve la función de posición para addGrid.
     P = { L, halfW, pitch, bend, twist, theta, base, cup, shape, edge }
     --------------------------------------------------------------- */
  function petalPosFn(P) {
    var cT = Math.cos(P.theta), sT = Math.sin(P.theta);
    var tube = !!TUBULAR[P.shape];
    return function (u, v) {
      u = uMap(u);
      var a = P.pitch + P.bend * u;
      var ca = Math.cos(a), sa = Math.sin(a);
      /* raquis: arco circular de longitud L en el plano (radial, vertical) */
      var r, y;
      if (Math.abs(P.bend) < 1e-4) { r = P.L * u * Math.cos(P.pitch); y = P.L * u * Math.sin(P.pitch); }
      else {
        r = P.L / P.bend * (Math.sin(a) - Math.sin(P.pitch));
        y = -P.L / P.bend * (Math.cos(a) - Math.cos(P.pitch));
      }
      var sx = P.base[0] + r * cT, sy = P.base[1] + y, sz = P.base[2] + r * sT;

      /* marco local: tangente, binormal (ancho) y normal (cara) */
      var Bx = -sT, By = 0, Bz = cT;
      var Nx = sa * cT, Ny = -ca, Nz = sa * sT;
      var tw = P.twist * u * TAU * 0.5;
      if (tw) {
        var c = Math.cos(tw), s = Math.sin(tw);
        var bx = Bx * c + Nx * s, by = By * c + Ny * s, bz = Bz * c + Nz * s;
        Nx = -Bx * s + Nx * c; Ny = -By * s + Ny * c; Nz = -Bz * s + Nz * c;
        Bx = bx; By = by; Bz = bz;
      }

      var w = widthProfile(P.shape, u) * P.halfW;
      var off, nOff;
      /* v invertido: deja la normal del lado adaxial (el haz) como cara
         frontal de la malla. Ver la nota de arriba. */
      if (tube) {
        var ang = -v * PI;
        off = Math.cos(ang) * w;
        nOff = Math.sin(ang) * w * 0.9;
      } else {
        off = -v * w;
        nOff = -P.cup * v * v * w * 1.15 + edgeDisp(P.edge, u, v, w);
        /* Ondulación propia de cada pétalo: sin ella todos son el mismo
           troquel liso repetido, que es lo que delata el render. Ondea más
           en los bordes que sobre el nervio, como un pétalo real. */
        nOff += P.wave * Math.sin(u * 3.3 + P.wavePh) * (0.25 + 0.75 * Math.abs(v)) * w;
      }
      return [sx + Bx * off + Nx * nOff, sy + By * off + Ny * nOff, sz + Bz * off + Nz * nOff];
    };
  }

  /* ---------------------------------------------------------------
     Color del pétalo según el patrón elegido
     --------------------------------------------------------------- */
  function hash(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function smoothNoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return mix(mix(hash(xi, yi), hash(xi + 1, yi), u), mix(hash(xi, yi + 1), hash(xi + 1, yi + 1), u), v);
  }
  function mix(a, b, t) { return a + (b - a) * t; }
  function mixC(a, b, t) { return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]; }
  function smoothstep(e0, e1, x) { var t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function petalColorFn(C, pattern, f, k) {
    var pri = C.primary, sec = C.secondary, tip = C.tip, rev = C.reverse;
    return function (u, v) {
      u = uMap(u);
      var col;
      switch (pattern) {
        case 'gradientCenter':
          col = mixC(sec, pri, smoothstep(0, 1, Math.pow(f, 2.1) * 0.92 + u * 0.10));
          col = mixC(col, tip, smoothstep(0.66, 1, u) * 0.45 * smoothstep(0.22, 0.55, f));
          break;
        case 'gradientTips':   col = mixC(pri, tip, smoothstep(0.35, 1, u)); break;
        case 'contrastCenter': col = f < 0.32 ? sec : pri; break;
        case 'contrastTips':   col = u > 0.8 ? tip : pri; break;
        case 'bicolor':        col = v < 0 ? pri : sec; break;
        case 'striped':        col = (Math.abs(v) * 3.4 % 1) < 0.46 ? sec : pri; break;
        case 'mottled':        col = mixC(pri, sec, smoothNoise(u * 5 + k, v * 3 + k * 1.7)); break;
        case 'speckled':       col = smoothNoise(u * 14 + k * 3, v * 9) > 0.78 ? sec : pri; break;
        case 'edged':          col = Math.abs(v) > 0.7 ? sec : pri; break;
        case 'watercolor':     col = mixC(mixC(pri, sec, smoothNoise(u * 2.4 + k, v * 1.8)), tip, smoothstep(0.55, 1, u) * 0.55); break;
        case 'iridescent':     col = mixC(pri, tip, smoothstep(0.3, 1, u) * 0.6); break;
        default:               col = pri;
      }
      /* Nervios longitudinales finos y un tono propio por pétalo: en la foto
         del catálogo ningún pétalo tiene exactamente el color del vecino. */
      var stria = 1 - 0.06 * Math.pow(1 - Math.abs(saw(v * 3.2) * 2 - 1), 3);
      /* Cada pétalo con su tono: una flor real no tiene dos pétalos iguales */
      var tone = 0.93 + 0.14 * hash(k, 7.7);
      /* Oclusión ambiental. La base de cada pétalo queda enterrada bajo la
         corona anterior y apenas recibe luz; los flancos también se ensombrecen
         contra los vecinos. Sin esta profundidad todos los pétalos se iluminan
         por igual y la flor se lee como un dibujo plano en vez de un objeto.
         Es el factor que más separa un render de una fotografía. */
      /* El error real: el degradado llegaba a su meseta en u=0.6, y la
         mayoría de la superficie VISIBLE de un pétalo exterior está en
         u>0.6 (sólo la base, oculta bajo la corona anterior, tiene u
         bajo). Así que el 60% del pétalo que sí se ve quedaba en la
         meseta plana, con un solo tono — eso es lo que se leía como
         "dibujo". El degradado ahora cubre casi todo el largo del pétalo. */
      var ao = 0.16 + 0.84 * smoothstep(0, 0.88, u);
      ao *= 1 - 0.24 * Math.pow(Math.abs(v), 3);
      var shade = ao * stria * tone;
      var front = [col[0] * shade, col[1] * shade, col[2] * shade];
      /* El envés de un pétalo es una versión más pálida del haz, no una cara
         gris: mezclarlo con blanco evita el aspecto de plástico apagado. */
      var back = mixC(mixC(front, rev, 0.30), [1, 1, 1], 0.20);
      back = [back[0] * shade, back[1] * shade, back[2] * shade];
      return [front, back];
    };
  }

  /* ---------------------------------------------------------------
     Centro de la flor (receptáculo + flósculos del disco)
     --------------------------------------------------------------- */
  function addCenter(mesh, R, domeH, color, floretCount) {
    var dark = [color[0] * 0.62, color[1] * 0.62, color[2] * 0.66];
    addGrid(mesh, 13, 16,
      function (u, v) {
        var phi = u * PI * 0.5, th = (v + 1) * PI;
        return [R * Math.sin(phi) * Math.cos(th), R * Math.cos(phi) * domeH, R * Math.sin(phi) * Math.sin(th)];
      },
      function () { return [dark, dark]; }, 1.0);

    if (floretCount < 4) return;
    for (var i = 0; i < floretCount; i++) {
      var t = i / floretCount;
      var ang = i * 2.399963;
      var rr = R * Math.sqrt(t) * 0.94;
      var phi = Math.asin(clamp(rr / R, 0, 1));
      var px = rr * Math.cos(ang), pz = rr * Math.sin(ang);
      var py = R * Math.cos(phi) * domeH;
      var s = R * 0.098 * (1 - t * 0.28);
      var c = t < 0.42 ? dark : color;
      floret(mesh, px, py, pz, s, c);
    }
  }
  function floret(mesh, x, y, z, s, c) {
    var top = [x, y + s * 1.5, z], n = [0, 1, 0];
    for (var i = 0; i < 5; i++) {
      var a0 = i / 5 * TAU, a1 = (i + 1) / 5 * TAU;
      var p0 = [x + Math.cos(a0) * s, y, z + Math.sin(a0) * s];
      var p1 = [x + Math.cos(a1) * s, y, z + Math.sin(a1) * s];
      var nn = norm(cross(sub(p1, p0), sub(top, p0)));
      mesh.tri(p0, p1, top, nn, nn, n, c, c, 1.0);
    }
  }

  /* ---------------------------------------------------------------
     LA FLOR
     --------------------------------------------------------------- */
  function buildFlower(g, opt) {
    opt = opt || {};
    var lod = opt.lod || 'high';
    /* En 'high' se ve de cerca en la revelación: con NV=8 las facetas del
       ancho del pétalo eran grandes y creaban bordes duros visibles incluso
       a distancia normal, sobre todo en la silueta. Más segmentos = curva
       suave en vez de polígono. */
    var NU = lod === 'high' ? 15 : lod === 'mid' ? 6 : 4;
    var NV = lod === 'high' ? 11 : lod === 'mid' ? 3 : 2;
    var petalCap = lod === 'high' ? 640 : lod === 'mid' ? 190 : 85;

    var mesh = new Mesh();
    var C = {
      primary: Genome.rgb(Genome.hex(g.colors.primary)),
      secondary: Genome.rgb(Genome.hex(g.colors.secondary)),
      center: Genome.rgb(Genome.hex(g.colors.center)),
      tip: Genome.rgb(Genome.hex(g.colors.tip)),
      reverse: Genome.rgb(Genome.hex(g.colors.reverse))
    };
    var rand = Genome.rng((g.seed || 1) * 7919 + 13);

    /* receptáculo */
    var Rb = 0.06 + g.centerSize * 0.34;
    var domeH = 0.5 + g.volume * 0.75;
    var phiMax = (0.20 + g.volume * 0.80) * PI * 0.5;
    /* Los flósculos del disco ocupan la cima del receptáculo; los pétalos
       radiales nacen a partir de ahí. Sin este borde, las flores de pocas
       capas juntaban todos los pétalos en el polo y formaban un cono. */
    var phiDisc = Math.min(phiMax * 0.92, (0.06 + g.centerSize * 1.30));

    /* longitud base del pétalo relativa al radio total */
    var baseLen = 0.42 + g.petalLength * 0.78;
    /* La macrofotografía del catálogo muestra pétalos espatulados, con una
       proporción de 3:1 a 5:1 entre largo y ancho, no cintas finas. */
    var halfW = (0.050 + g.petalWidth * 0.160) * (0.75 + baseLen * 0.4);
    /* 0 = incurvado (el pétalo sube y cierra la flor), 1 = reflejo (cae
       hacia afuera). El signo estaba invertido: las Ballhia se abrían en vez
       de cerrarse, que era la causa del aspecto de alcachofa. */
    var bendBase = (0.5 - g.petalCurve) * 2.5;
    /* Los pétalos muy largos pesan y arquean hacia abajo */
    var droop = -Math.max(0, g.petalLength - 0.55) * 1.5;
    var cup = 0.35 + (1 - g.openness) * 0.5;

    var layers = Math.max(1, g.layers);
    var gradStrength = smoothstep(2, 7, layers) * (0.35 + 0.65 * g.openness);
    var total = 0;

    for (var i = 0; i < layers; i++) {
      var f = layers > 1 ? i / (layers - 1) : 1;
      var phi = phiDisc + (phiMax - phiDisc) * Math.pow(f, 0.82);
      /* La apertura tumba los pétalos exteriores dejando el centro casi
         vertical: en una flor doble el corazón permanece cerrado mientras el
         borde ya está plano. Pero en una margarita de dos capas la corona
         interior ES media flor, y dejarla vertical la convertía en un ramillete
         de cuchillas en el centro: por eso el reparto se mezcla con la apertura
         uniforme según lo doble que sea la flor. */
      var openFactor = mix(1, Math.pow(f, 0.62), gradStrength);
      var pitch = (PI / 2 - phi) - g.openness * 1.05 * openFactor;
      var bend = bendBase * (1.05 - 0.28 * f) + droop * (0.35 + 0.65 * f);

      var cnt = Math.round((9 + 20 * f) * (0.45 + g.density * 0.58));
      if (g.arrangement === 'compact') cnt = Math.round(cnt * 1.22);
      if (g.arrangement === 'open') cnt = Math.round(cnt * 0.7);
      cnt = Math.max(5, cnt);
      if (total + cnt > petalCap) cnt = Math.max(3, petalCap - total);
      if (total >= petalCap) break;
      total += cnt;

      var layerOff =
        g.arrangement === 'spiral' ? i * 2.399963 :
        g.arrangement === 'layered' ? i * (PI / cnt) :
        g.arrangement === 'asym' ? i * 1.1 : 0;

      /* Gradiente de tamaño: en una flor muy doble los pétalos del corazón
         son botones diminutos que crecen hacia afuera, y eso es lo que forma
         la espiral central. Pero una margarita de dos capas tiene pétalos casi
         iguales, y una Ballhia esférica también: el gradiente se gradúa por
         número de capas y apertura, o esas dos familias se deshacen. */
      var Lmin = 1 - 0.80 * gradStrength;
      var L = baseLen * (Lmin + (1 - Lmin) * Math.pow(f, 0.72));
      var asym = 1 - g.symmetry;

      for (var k = 0; k < cnt; k++) {
        var jitterA = asym * (rand() - 0.5) * (TAU / cnt) * 1.6;
        var theta = layerOff + k * (TAU / cnt) + jitterA;
        if (g.arrangement === 'asym') theta += Math.sin(k * 1.7 + i) * asym * 0.5;

        var jl = (1 + asym * (rand() - 0.5) * 0.5) * (1 + (rand() - 0.5) * 0.09);
        var jp = asym * (rand() - 0.5) * 0.35 + (rand() - 0.5) * 0.025;
        var jw = 1 + (rand() - 0.5) * 0.12;
        var jb = 1 + (rand() - 0.5) * 0.09;

        var base = [Rb * Math.sin(phi) * Math.cos(theta),
                    Rb * Math.cos(phi) * domeH,
                    Rb * Math.sin(phi) * Math.sin(theta)];

        var P = {
          L: L * jl, halfW: halfW * (0.85 + 0.3 * f) * jw, pitch: pitch + jp,
          bend: bend * jb * (1 + asym * (rand() - 0.5) * 0.6),
          twist: g.petalTwist * (0.6 + 0.8 * f) + (rand() - 0.5) * 0.025,
          theta: theta, base: base,
          cup: cup * (1.30 - 0.50 * f), shape: g.petalShape, edge: g.petalEdge,
          wave: (0.14 + rand() * 0.18) * (0.55 + 0.45 * gradStrength), wavePh: rand() * TAU
        };
        addGrid(mesh, NU, NV, petalPosFn(P), petalColorFn(C, g.pattern, f, k + i * 31), 0.0);
      }
    }

    var floretCount = lod === 'high' ? Math.round(30 + g.centerSize * 260) : Math.round(8 + g.centerSize * 40);
    addCenter(mesh, Rb * 1.02, domeH, C.center, g.centerSize > 0.12 ? floretCount : 0);

    var m = mesh.build();
    m.radius = radiusOf(m);
    return m;
  }

  function radiusOf(m) {
    var r = 0, p = m.pos, i, d;
    for (i = 0; i < p.length; i += 3) {
      d = p[i] * p[i] + p[i + 1] * p[i + 1] + p[i + 2] * p[i + 2];
      if (d > r) r = d;
    }
    return Math.sqrt(r);
  }

  /* ---------------------------------------------------------------
     Tallo y hojas
     --------------------------------------------------------------- */
  var STEM_GREEN = [0.30, 0.42, 0.20];
  /* Verde oscuro algo grisáceo del haz y envés pálido: la pubescencia es más
     densa por debajo y aclara la cara inferior. */
  var LEAF_GREEN = [0.19, 0.31, 0.13];
  var LEAF_BACK = [0.40, 0.50, 0.34];

  function addStem(mesh, h, thick, curveX, curveZ, sides, matId) {
    sides = sides || 6;
    addGrid(mesh, 8, sides,
      function (u, v) {
        var a = (v + 1) * PI;
        var r = thick * (1 - u * 0.22);
        var cx = curveX * u * u, cz = curveZ * u * u;
        return [cx + Math.cos(a) * r, u * h, cz + Math.sin(a) * r];
      },
      function () { return [STEM_GREEN, STEM_GREEN]; }, matId === undefined ? 2.0 : matId);
  }

  /* -----------------------------------------------------------------
     Hoja de crisantemo

     Morfología copiada de la lámina del propio catálogo (la página del tallo,
     que trae la foto y el grabado con la nervadura) y de la descripción
     botánica de Chrysanthemum x morifolium: limbo pinnatipartido con un
     nervio central del que salen de 3 a 7 lóbulos triangulares barridos hacia
     el ápice, senos profundos que no llegan al nervio, margen groseramente
     dentado con muescas secundarias, y los dos lados desiguales.
     ----------------------------------------------------------------- */
  function saw(x) { var f = ((x % 1) + 1) % 1; return f < 0.5 ? f * 2 : 2 - f * 2; }

  function leafHalfWidth(t, side, seed) {
    if (t <= 0) return 0;
    /* envolvente ovada del limbo: más ancho en el tercio inferior */
    var E = Math.pow(Math.sin(PI * Math.pow(t, 0.72)), 0.46);
    /* lóbulos: distinto número a cada lado, como en una hoja real */
    var N = side > 0 ? 2.7 : 2.2;
    var ph = t * N + (side > 0 ? 0 : 0.38) + seed * 0.11;
    var fr = ph - Math.floor(ph);
    /* la potencia sobre fr barre el lóbulo hacia la punta de la hoja */
    var lobe = Math.pow(Math.sin(PI * Math.pow(fr, 0.78)), 0.62);
    var sinus = 0.44;                    /* los senos no llegan al nervio */
    var w = E * (sinus + (1 - sinus) * lobe);
    /* dientes gruesos e irregulares, más una muesca secundaria más fina */
    w *= 1 + 0.10 * (saw(t * 12 + seed) - 0.5) + 0.05 * (saw(t * 26) - 0.5);
    return w;
  }

  function leafColorFn(seed) {
    /* Cada hoja con su tono: un tallo con seis hojas idénticas se delata */
    var tone = 0.88 + 0.24 * (hash(seed, 3.1));
    return function (u, v) {
      var av = Math.abs(v);
      /* el nervio central y los laterales son más claros que el limbo */
      var mid = Math.max(0, 1 - av * 7);
      /* la onda de 'lat' no sigue los lóbulos reales de la hoja: con
         amplitud alta se veía como una cuadrícula repetida, no como
         nervadura. Se deja tenue — sugiere textura sin leerse como patrón. */
      var lat = Math.pow(1 - Math.abs(saw(u * 4.6 + av * 1.2) * 2 - 1), 8);
      var k = tone * (1 + 0.30 * mid + 0.06 * lat);
      var f = [LEAF_GREEN[0] * k, LEAF_GREEN[1] * k, LEAF_GREEN[2] * k];
      var b = [LEAF_BACK[0] * tone, LEAF_BACK[1] * tone, LEAF_BACK[2] * tone];
      return [f, b];
    };
  }

  function addLeaf(mesh, x, y, z, ang, tilt, size, res) {
    var NU = res === 'high' ? 20 : 12;
    var NV = res === 'high' ? 10 : 6;
    var ca = Math.cos(ang), sa = Math.sin(ang);
    var ct = Math.cos(tilt), st = Math.sin(tilt);
    var seed = hash(x * 7.3 + z * 3.9, y * 5.1) * 9;
    var PET = 0.17;                       /* peciolo */
    addGrid(mesh, NU, NV,
      function (u, v) {
        var t = u <= PET ? 0 : (u - PET) / (1 - PET);
        var w = (u <= PET ? 0.05 : leafHalfWidth(t, v >= 0 ? 1 : -1, seed)) * size * 0.52;
        var lx = u * size;
        /* Pliegue en V sobre el nervio, arqueo del limbo y una ligera torsión
           a lo largo: sin la torsión la hoja se lee como una chapa plana. */
        var ly = -Math.abs(v) * size * 0.075
                 - Math.pow(u, 1.8) * size * 0.24
                 + v * Math.pow(u, 1.4) * size * 0.10;
        var lz = -v * w;
        var px = lx * ct - ly * st, py = lx * st + ly * ct;
        return [x + px * ca - lz * sa, y + py, z + px * sa + lz * ca];
      },
      leafColorFn(seed), 3.0);
  }

  /* ---------------------------------------------------------------
     Tallo florido completo (flor principal + spray)
     Devuelve una malla lista para instanciar en el ramo.
     --------------------------------------------------------------- */
  function buildStem(g, flowerMesh, opt) {
    opt = opt || {};
    var mesh = new Mesh();
    var hMap = { short: 1.5, medium: 2.2, long: 3.0 };
    var h = (hMap[g.stemLength] || 2.2) * (opt.heightScale || 1);
    var scale = flowerScale(g);
    var rand = Genome.rng((g.seed || 1) * 31 + (opt.variant || 0) * 977);

    var curveX = (rand() - 0.5) * 0.14 * h, curveZ = (rand() - 0.5) * 0.14 * h;
    addStem(mesh, h, 0.028, curveX, curveZ);

    /* follaje */
    var folMap = { light: 3, medium: 5, abundant: 8, compact: 7, wild: 9 };
    var nLeaf = folMap[g.foliage] || 5;
    for (var i = 0; i < nLeaf; i++) {
      var t = 0.18 + (i / nLeaf) * 0.66;
      var lx = curveX * t * t, lz = curveZ * t * t;
      var lsize = 0.62 * (g.foliage === 'wild' ? 1.2 : g.foliage === 'compact' ? 0.82 : 1) * (1.2 - t * 0.55);
      addLeaf(mesh, lx, t * h, lz, i * 2.399963 + rand() * 0.5, -0.20 - rand() * 0.28, lsize, opt.leafRes);
    }

    /* flores */
    var tipX = curveX, tipZ = curveZ;
    var n = Math.max(1, g.flowersPerStem);
    if (g.growth === 'disbud') n = 1;

    var placements = [];
    if (n === 1) {
      placements.push({ x: tipX, y: h, z: tipZ, s: 1, tilt: 0 });
    } else {
      var spreadMap = { spraySmall: 0.30, sprayFull: 0.46, cluster: 0.22, cascade: 0.55 };
      var spread = spreadMap[g.growth] || 0.38;
      for (var j = 0; j < n; j++) {
        var a = j * 2.399963 + rand();
        var rr = (j === 0 ? 0 : spread * Math.sqrt(j / n));
        var drop = g.growth === 'cascade' ? (j / n) * 0.5 : (j === 0 ? 0 : 0.10 + rand() * 0.16);
        placements.push({
          x: tipX + Math.cos(a) * rr, y: h - drop, z: tipZ + Math.sin(a) * rr,
          s: j === 0 ? 1 : 0.72 + rand() * 0.22, tilt: rr * 0.9
        });
        /* pedúnculo hacia la flor secundaria */
        if (j > 0) {
          var pm = new Mesh();
          addStem(pm, Math.sqrt(rr * rr + drop * drop) + 0.02, 0.012, 0, 0);
          var ang = Math.atan2(Math.cos(a) * rr, drop + 0.02);
          var M = mul(translate(tipX, h - drop - 0.02, tipZ), mul(rotY(-a), rotZ(-ang)));
          mesh.merge(pm.build(), M);
        }
      }
    }

    for (var p = 0; p < placements.length; p++) {
      var q = placements[p];
      var s = scale * q.s;
      var M2 = mul(translate(q.x, q.y, q.z),
                mul(rotY(rand() * TAU), mul(rotX(q.tilt * (rand() - 0.5) + q.tilt), scaleM(s, s, s))));
      mesh.merge(flowerMesh, M2);
    }

    var out = mesh.build();
    out.height = h;
    return out;
  }

  function flowerScale(g) {
    var d = { mini: 0.34, small: 0.48, medium: 0.62, large: 0.78, xlarge: 0.95 };
    return d[g.diameter] || 0.62;
  }

  /* ---------------------------------------------------------------
     EL RAMO
     --------------------------------------------------------------- */
  var PAPER = {
    none: null,
    whitePaper: [0.95, 0.94, 0.92],
    naturalPaper: [0.79, 0.71, 0.58],
    deliflorPaper: [0.486, 0.129, 0.302],
    textile: [0.72, 0.68, 0.70],
    vase: [0.86, 0.85, 0.83]
  };

  function buildBouquet(g, opt) {
    opt = opt || {};
    var lod = opt.lod || 'mid';
    var mesh = new Mesh();
    var rand = Genome.rng((g.seed || 1) * 104729 + 7);
    var B = g.bouquet;

    var countMap = { small: 7, medium: 12, abundant: 18, monumental: 26 };
    var n = countMap[B.abundance] || 12;
    if (B.style === 'minimal') n = Math.max(3, Math.round(n * 0.45));
    if (B.style === 'mono') n = Math.max(5, Math.round(n * 0.8));

    var flower = buildFlower(g, { lod: lod === 'high' ? 'mid' : 'low' });

    /* Un puñado de variantes de tallo, reutilizadas: mucho más barato
       que construir un tallo distinto por posición. */
    var variants = [];
    var nv = Math.min(5, n);
    for (var i = 0; i < nv; i++) {
      variants.push(buildStem(g, flower, { variant: i, heightScale: 0.92 + i * 0.045 }));
    }

    var Rd = B.style === 'minimal' ? 0.55 : B.style === 'runway' ? 0.9 : 0.72;
    Rd *= (0.8 + n / 40);

    for (var k = 0; k < n; k++) {
      var t = n > 1 ? k / (n - 1) : 0;
      var ang = k * 2.399963 + (B.style === 'wild' ? rand() * 0.9 : 0);
      var rr = Rd * Math.sqrt((k + 0.4) / n);

      if (B.style === 'asymmetric') rr *= 0.6 + 0.8 * (0.5 + 0.5 * Math.cos(ang));
      if (B.style === 'sculptural') rr *= 0.5 + rand() * 1.1;

      var x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;

      /* altura: domo para el ramo redondo, escalonado para el escultural */
      var hs = 1;
      if (B.style === 'round' || B.style === 'gift' || B.style === 'celebration') hs = 1 - rr * 0.28;
      else if (B.style === 'sculptural') hs = 0.7 + rand() * 0.6;
      else if (B.style === 'wild') hs = 0.85 + rand() * 0.4;
      else if (B.style === 'runway') hs = 1 + rr * 0.25;
      else if (B.style === 'asymmetric') hs = 0.75 + 0.5 * (0.5 + 0.5 * Math.sin(ang * 1.3));

      /* Inclinación de cada tallo hacia afuera del eje del ramo. Con valores
         bajos todas las flores miraban al cenit y de perfil se veían como
         discos apilados; así el ramo presenta su cúpula al visitante. */
      var tilt = rr * (B.style === 'minimal' ? 0.42 : B.style === 'runway' ? 0.5 : 0.72);
      var v = variants[k % variants.length];

      var M = mul(translate(x * 0.18, 0, z * 0.18),
              mul(rotY(ang),
              mul(rotZ(-tilt),
              mul(rotY(-ang), mul(scaleM(hs, hs, hs), translate(0, 0, 0))))));
      /* desplazamiento horizontal adicional del extremo superior */
      M = mul(translate(x * 0.32, 0, z * 0.32), mul(rotY(ang), mul(rotZ(-tilt), rotY(-ang))));
      M = mul(M, scaleM(hs, hs, hs));
      mesh.merge(v, M);
    }

    /* complementos */
    if (B.extras === 'lightFoliage' || B.extras === 'fullFoliage' || B.extras === 'textures') {
      var nf = B.extras === 'fullFoliage' ? 18 : B.extras === 'textures' ? 13 : 9;
      for (var q = 0; q < nf; q++) {
        var a2 = q * 2.399963 + 0.7;
        var r2 = Rd * (0.75 + rand() * 0.55);
        addLeaf(mesh, Math.cos(a2) * r2 * 0.5, 1.0 + rand() * 1.3, Math.sin(a2) * r2 * 0.5,
                a2, -0.12 - rand() * 0.30, 0.34 + rand() * 0.20);
      }
    }
    if (B.extras === 'neutralFlowers' || B.extras === 'dried') {
      var tone = B.extras === 'dried' ? [0.72, 0.64, 0.50] : [0.94, 0.93, 0.89];
      for (var s2 = 0; s2 < 26; s2++) {
        var a3 = s2 * 2.399963, r3 = Rd * (0.55 + rand() * 0.7);
        sphere(mesh, Math.cos(a3) * r3 * 0.55, 1.6 + rand() * 1.2, Math.sin(a3) * r3 * 0.55,
               0.045 + rand() * 0.03, tone);
      }
    }

    /* envoltura o florero */
    var paper = PAPER[B.wrap];
    if (paper) {
      if (B.wrap === 'vase') addVase(mesh, Rd * 0.62, paper);
      else addWrap(mesh, Rd * 0.95, paper);
    }

    var out = mesh.build();
    out.radius = radiusOf(out);
    return out;
  }

  function sphere(mesh, x, y, z, r, c) {
    addGrid(mesh, 5, 7, function (u, v) {
      var phi = u * PI, th = (v + 1) * PI;
      return [x + r * Math.sin(phi) * Math.cos(th), y + r * Math.cos(phi), z + r * Math.sin(phi) * Math.sin(th)];
    }, function () { return [c, c]; }, 1.0);
  }

  function addWrap(mesh, R, color) {
    var dark = [color[0] * 0.72, color[1] * 0.72, color[2] * 0.74];
    addGrid(mesh, 6, 26, function (u, v) {
      var a = (v + 1) * PI;
      /* cono invertido con borde superior irregular */
      var jag = 1 + 0.09 * Math.sin(a * 7) + 0.05 * Math.sin(a * 13);
      var rr = (0.10 + u * R * 1.05) * (u > 0.55 ? jag : 1);
      var y = -0.75 + u * 1.55;
      return [Math.cos(a) * rr, y, Math.sin(a) * rr];
    }, function (u) { return [u > 0.5 ? color : dark, dark]; }, 4.0);
  }

  function addVase(mesh, R, color) {
    var dark = [color[0] * 0.78, color[1] * 0.78, color[2] * 0.80];
    addGrid(mesh, 12, 22, function (u, v) {
      var a = (v + 1) * PI;
      var prof = 0.55 + 0.45 * Math.sin(PI * (0.15 + u * 0.8));
      var rr = R * prof * (1 - 0.25 * smoothstep(0.8, 1, u));
      return [Math.cos(a) * rr, -1.0 + u * 1.5, Math.sin(a) * rr];
    }, function () { return [color, dark]; }, 4.0);
  }

  /* ---------------------------------------------------------------
     Tallo suelto para la pantalla de revelación
     --------------------------------------------------------------- */
  function buildSingleStem(g, lod) {
    var flower = buildFlower(g, { lod: lod || 'high' });
    var m = buildStem(g, flower, { variant: 0, leafRes: 'high' });
    m.radius = radiusOf(m);
    return m;
  }

  /* ---------------------------------------------------------------
     Álgebra de matrices 4x4 (column-major, como WebGL)
     --------------------------------------------------------------- */
  function ident() { return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; }
  function mul(a, b) {
    var o = new Array(16);
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function translate(x, y, z) { var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function scaleM(x, y, z) { var m = ident(); m[0] = x; m[5] = y; m[10] = z; return m; }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a), m = ident(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }

  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function norm(v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  }

  root.MeshGen = {
    widthProfile: widthProfile,
    buildFlower: buildFlower,
    buildStem: buildStem,
    buildSingleStem: buildSingleStem,
    buildBouquet: buildBouquet,
    flowerScale: flowerScale,
    mat: { ident: ident, mul: mul, translate: translate, scale: scaleM, rotX: rotX, rotY: rotY, rotZ: rotZ }
  };
})(window);
