/* =========================================================================
   DELIFLOR BLOOM LAB — Renderizador WebGL
   Sin librerías. Iluminación de estudio con translucidez de pétalo,
   órbita táctil de un dedo y zoom con dos dedos.
   ========================================================================= */
(function (root) {
  'use strict';

  var VS_MESH = [
    'attribute vec3 aPos;',
    'attribute vec3 aNor;',
    'attribute vec3 aCF;',
    'attribute vec3 aCB;',
    'attribute float aMat;',
    'uniform mat4 uProj, uView;',
    'uniform float uGrow;',
    'varying vec3 vN, vP, vCF, vCB;',
    'varying float vMat;',
    'void main(){',
    '  vec3 p = aPos;',
    '  p.xz *= uGrow;',
    '  p.y  *= mix(0.55, 1.0, uGrow);',
    '  vP = p; vN = aNor; vCF = aCF; vCB = aCB; vMat = aMat;',
    '  gl_Position = uProj * uView * vec4(p, 1.0);',
    '}'
  ].join('\n');

  var FS_MESH = [
    'precision mediump float;',
    'varying vec3 vN, vP, vCF, vCB;',
    'varying float vMat;',
    'uniform vec3 uCam, uKey, uFill, uKeyCol, uFillCol, uAmbTop, uAmbBot;',
    'uniform float uTrans, uRim, uIrid, uSpec;',
    'void main(){',
    '  vec3 N = normalize(vN);',
    '  vec3 V = normalize(uCam - vP);',
    '  bool front = gl_FrontFacing;',
    '  if(!front) N = -N;',
    '  vec3 base = front ? vCF : vCB;',
    '  bool petal = vMat < 0.5;',
    '  bool leaf  = vMat > 2.5 && vMat < 3.5;',
    '  if(leaf) base = (N.y >= 0.0) ? vCF : vCB;',
    '  vec3 L = normalize(uKey);',
    '  float ndl = dot(N, L);',
    /* iluminación envolvente: los pétalos delgados no se apagan de golpe */
    '  float wrap = clamp(ndl * 0.62 + 0.38, 0.0, 1.0);',
    '  vec3 amb = mix(uAmbBot, uAmbTop, N.y * 0.5 + 0.5);',
    '  if(petal) amb = max(amb, uAmbTop * 0.62);',
    '  vec3 col = base * (amb + uKeyCol * wrap);',
    '  float ndl2 = clamp(dot(N, normalize(uFill)) * 0.5 + 0.5, 0.0, 1.0);',
    '  col += base * uFillCol * ndl2;',
    /* translucidez: luz que atraviesa el pétalo a contraluz */
    '  if(petal){',
    '    float t = pow(clamp(dot(-V, L) * 0.5 + 0.5, 0.0, 1.0), 3.0);',
    '    col += base * t * uTrans;',
    '  }',
    '  float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);',
    '  col += vec3(1.0) * rim * uRim;',
    '  vec3 H = normalize(L + V);',
    '  col += vec3(0.95, 0.95, 0.92) * pow(max(dot(N, H), 0.0), 46.0) * uSpec;',
    '  if(uIrid > 0.5 && petal){',
    '    float f = pow(1.0 - max(dot(N, V), 0.0), 1.8);',
    '    col += 0.30 * f * vec3(sin(f*8.0 + vP.y*2.5)*0.5+0.5,',
    '                           sin(f*8.0 + 2.1 + vP.y*2.5)*0.5+0.5,',
    '                           sin(f*8.0 + 4.2 + vP.y*2.5)*0.5+0.5);',
    '  }',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  var VS_FLAT = [
    'attribute vec2 aXY;',
    'varying vec2 vXY;',
    'void main(){ vXY = aXY; gl_Position = vec4(aXY, 0.999, 1.0); }'
  ].join('\n');

  var FS_BG = [
    'precision mediump float;',
    'varying vec2 vXY;',
    'uniform vec3 uTop, uBot, uGlow;',
    'uniform float uVig;',
    'void main(){',
    '  float t = vXY.y * 0.5 + 0.5;',
    '  vec3 c = mix(uBot, uTop, t);',
    '  float g = exp(-dot(vXY * vec2(1.0, 1.25), vXY * vec2(1.0, 1.25)) * 1.6);',
    '  c += uGlow * g;',
    '  float d = length(vXY * vec2(0.85, 1.0));',
    '  c *= 1.0 - uVig * smoothstep(0.55, 1.5, d);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var VS_SHADOW = [
    'attribute vec2 aXY;',
    'uniform mat4 uProj, uView;',
    'uniform vec3 uCenter;',
    'uniform vec2 uSize;',
    'varying vec2 vXY;',
    'void main(){',
    '  vXY = aXY;',
    '  vec3 p = uCenter + vec3(aXY.x * uSize.x, 0.0, aXY.y * uSize.y);',
    '  gl_Position = uProj * uView * vec4(p, 1.0);',
    '}'
  ].join('\n');

  var FS_SHADOW = [
    'precision mediump float;',
    'varying vec2 vXY;',
    'uniform float uStrength;',
    'void main(){',
    '  float d = length(vXY);',
    '  float a = (1.0 - smoothstep(0.0, 1.0, d));',
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, a * a * uStrength);',
    '}'
  ].join('\n');

  /* ---------------------------------------------------------------
     Ambientes: fondo, luz y carácter según escena y personalidad
     --------------------------------------------------------------- */
  var BG_ENV = {
    studio:       { top: [0.97,0.96,0.95], bot: [0.86,0.84,0.83], glow: [0.05,0.05,0.05], vig: 0.18, ambT: [0.52,0.52,0.55], ambB: [0.26,0.25,0.27] },
    greenhouse:   { top: [0.88,0.93,0.84], bot: [0.62,0.70,0.55], glow: [0.10,0.12,0.06], vig: 0.30, ambT: [0.50,0.55,0.46], ambB: [0.24,0.28,0.20] },
    floralEvent:  { top: [0.94,0.90,0.92], bot: [0.72,0.66,0.72], glow: [0.08,0.05,0.08], vig: 0.36, ambT: [0.50,0.48,0.53], ambB: [0.24,0.22,0.28] },
    elegantTable: { top: [0.93,0.90,0.85], bot: [0.68,0.62,0.55], glow: [0.10,0.08,0.05], vig: 0.34, ambT: [0.52,0.49,0.45], ambB: [0.26,0.23,0.20] },
    natural:      { top: [0.86,0.91,0.93], bot: [0.66,0.72,0.62], glow: [0.08,0.09,0.08], vig: 0.28, ambT: [0.52,0.55,0.56], ambB: [0.26,0.28,0.25] },
    deliflor:     { top: [0.55,0.16,0.34], bot: [0.30,0.07,0.18], glow: [0.14,0.05,0.09], vig: 0.42, ambT: [0.40,0.30,0.35], ambB: [0.20,0.12,0.16] },
    artistic:     { top: [0.20,0.18,0.24], bot: [0.07,0.06,0.09], glow: [0.16,0.12,0.18], vig: 0.50, ambT: [0.34,0.32,0.40], ambB: [0.13,0.12,0.17] }
  };

  var MOOD = {
    elegant:      { key: [0.92,0.90,0.94], fill: [0.16,0.16,0.20], rim: 0.11, spec: 0.16, trans: 0.50 },
    joyful:       { key: [1.05,1.00,0.88], fill: [0.20,0.19,0.15], rim: 0.10, spec: 0.20, trans: 0.62 },
    romantic:     { key: [1.00,0.90,0.92], fill: [0.22,0.16,0.19], rim: 0.13, spec: 0.14, trans: 0.66 },
    powerful:     { key: [1.10,1.05,0.98], fill: [0.10,0.10,0.12], rim: 0.16, spec: 0.26, trans: 0.40 },
    delicate:     { key: [0.86,0.86,0.90], fill: [0.28,0.28,0.30], rim: 0.09, spec: 0.10, trans: 0.74 },
    exotic:       { key: [1.02,0.94,0.86], fill: [0.16,0.20,0.24], rim: 0.20, spec: 0.22, trans: 0.68 },
    modern:       { key: [0.96,0.97,1.00], fill: [0.18,0.19,0.22], rim: 0.14, spec: 0.24, trans: 0.44 },
    serene:       { key: [0.88,0.92,0.96], fill: [0.24,0.26,0.28], rim: 0.09, spec: 0.12, trans: 0.58 },
    mysterious:   { key: [0.72,0.72,0.86], fill: [0.10,0.10,0.16], rim: 0.26, spec: 0.18, trans: 0.46 },
    natural:      { key: [1.00,0.98,0.90], fill: [0.20,0.22,0.20], rim: 0.10, spec: 0.14, trans: 0.60 },
    bold:         { key: [1.08,1.02,0.94], fill: [0.12,0.12,0.14], rim: 0.18, spec: 0.28, trans: 0.46 },
    sophisticated:{ key: [0.88,0.86,0.88], fill: [0.14,0.14,0.16], rim: 0.15, spec: 0.20, trans: 0.48 },
    tropical:     { key: [1.06,1.00,0.84], fill: [0.18,0.22,0.18], rim: 0.14, spec: 0.20, trans: 0.72 },
    minimal:      { key: [0.94,0.94,0.95], fill: [0.26,0.26,0.27], rim: 0.07, spec: 0.12, trans: 0.42 },
    festive:      { key: [1.08,1.00,0.90], fill: [0.22,0.18,0.18], rim: 0.16, spec: 0.24, trans: 0.68 }
  };
  var MOOD_DEFAULT = { key: [0.98,0.96,0.94], fill: [0.18,0.18,0.20], rim: 0.12, spec: 0.18, trans: 0.55 };

  /* ---------------------------------------------------------------
     Renderer
     --------------------------------------------------------------- */
  function Renderer(canvas) {
    this.canvas = canvas;
    this.ok = false;
    var gl = null;
    try {
      var attrs = { antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' };
      gl = canvas.getContext('webgl', attrs) || canvas.getContext('experimental-webgl', attrs);
    } catch (e) { gl = null; }
    if (!gl) return;
    this.gl = gl;
    this.ok = true;

    this.progMesh = program(gl, VS_MESH, FS_MESH);
    this.progBG = program(gl, VS_FLAT, FS_BG);
    this.progSh = program(gl, VS_SHADOW, FS_SHADOW);
    if (!this.progMesh || !this.progBG || !this.progSh) { this.ok = false; return; }

    this.buf = { pos: gl.createBuffer(), nor: gl.createBuffer(), cf: gl.createBuffer(), cb: gl.createBuffer(), mat: gl.createBuffer() };
    this.quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);

    this.count = 0;
    this.bounds = { cx: 0, cy: 0, cz: 0, r: 1, minY: 0 };
    this.yaw = 0.5; this.pitch = 0.40; this.dist = 0; this.baseDist = 4;
    this.targetYaw = 0.5; this.targetPitch = 0.40;
    this.zoom = 1;
    this.grow = 1; this.targetGrow = 1;
    this.autoSpin = true;
    this.env = BG_ENV.studio; this.mood = MOOD_DEFAULT; this.irid = 0;
    this.dpr = 1;
    this.dirty = true;

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.CULL_FACE);

    this._bindInput();
    this._resize();
  }

  Renderer.prototype.setMesh = function (m) {
    if (!this.ok || !m) return;
    var gl = this.gl;
    bind(gl, this.buf.pos, m.pos);
    bind(gl, this.buf.nor, m.nor);
    bind(gl, this.buf.cf, m.cf);
    bind(gl, this.buf.cb, m.cb);
    bind(gl, this.buf.mat, m.mat);
    this.count = m.count;

    /* Encuadre automático. Se mide el ancho y el alto por separado: una
       Margriet es ancha y plana, un ramo es alto y estrecho, y una esfera
       de referencia única encuadraría mal a los dos. */
    var p = m.pos, i, minY = 1e9, maxY = -1e9, maxR = 0, d;
    for (i = 0; i < p.length; i += 3) {
      if (p[i + 1] < minY) minY = p[i + 1];
      if (p[i + 1] > maxY) maxY = p[i + 1];
      d = p[i] * p[i] + p[i + 2] * p[i + 2];
      if (d > maxR) maxR = d;
    }
    maxR = Math.sqrt(maxR) || 0.5;
    this.bounds = {
      cx: 0, cy: (minY + maxY) * 0.5, cz: 0,
      halfW: maxR, halfH: Math.max(0.05, (maxY - minY) * 0.5),
      r: Math.max(maxR, (maxY - minY) * 0.5), minY: minY
    };
    this.dirty = true;
  };

  /* Distancia a la que el objeto llena FILL del encuadre.
     Se usa la fórmula de la tangente (r / sen α) y no la ortográfica
     (r / tan α): en perspectiva los pétalos más cercanos a la cámara se
     proyectan más grandes, y con la fórmula ortográfica se recortaban. */
  var FOV = 0.56, FILL = 0.86;
  Renderer.prototype._fitDist = function (aspect) {
    var b = this.bounds;
    var fv = FOV * FILL;
    var fh = Math.atan(Math.tan(FOV) * aspect) * FILL;
    return Math.max(b.halfH / Math.sin(fv), b.halfW / Math.sin(fh), b.halfW * 1.25, 0.4);
  };

  Renderer.prototype.setEnv = function (bgKey, personality, iridescent) {
    this.env = BG_ENV[bgKey] || BG_ENV.studio;
    var m = null;
    if (personality && personality.length) {
      m = { key: [0,0,0], fill: [0,0,0], rim: 0, spec: 0, trans: 0 };
      for (var i = 0; i < personality.length; i++) {
        var s = MOOD[personality[i]] || MOOD_DEFAULT;
        for (var j = 0; j < 3; j++) { m.key[j] += s.key[j] / personality.length; m.fill[j] += s.fill[j] / personality.length; }
        m.rim += s.rim / personality.length;
        m.spec += s.spec / personality.length;
        m.trans += s.trans / personality.length;
      }
    }
    this.mood = m || MOOD_DEFAULT;
    this.irid = iridescent ? 1 : 0;
    this.dirty = true;
  };

  Renderer.prototype.setView = function (which) {
    if (which === 'front') { this.targetYaw = 0; this.targetPitch = 0.06; }
    else if (which === 'side') { this.targetYaw = Math.PI / 2; this.targetPitch = 0.06; }
    else if (which === 'top') { this.targetYaw = 0; this.targetPitch = 1.35; }
    else { this.targetYaw = 0.5; this.targetPitch = 0.40; }
    this.zoom = 1;
    this.autoSpin = false;
    this.dirty = true;
  };
  Renderer.prototype.reset = function () { this.setView('default'); this.autoSpin = true; };
  Renderer.prototype.bloomIn = function () { this.grow = 0.04; this.targetGrow = 1; this.dirty = true; };

  Renderer.prototype._resize = function () {
    var c = this.canvas, r = c.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (c.width !== w || c.height !== h) {
      c.width = w; c.height = h; this.dpr = dpr; this.dirty = true;
      return true;
    }
    return false;
  };

  Renderer.prototype._bindInput = function () {
    var self = this, c = this.canvas;
    var pointers = {}, lastDist = 0, moved = false;

    function count() { var n = 0; for (var k in pointers) if (pointers.hasOwnProperty(k)) n++; return n; }

    function down(e) {
      c.setPointerCapture && c.setPointerCapture(e.pointerId);
      pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
      self.autoSpin = false; moved = false;
    }
    function move(e) {
      var p = pointers[e.pointerId];
      if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
      var n = count();
      if (n === 1) {
        self.targetYaw -= dx * 0.0085;
        self.targetPitch = clamp(self.targetPitch + dy * 0.0068, -1.15, 1.45);
        self.dirty = true;
      } else if (n === 2) {
        var ids = Object.keys(pointers);
        var a = pointers[ids[0]], b = pointers[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y);
        if (lastDist) {
          self.zoom = clamp(self.zoom * (lastDist / d), 0.42, 2.6);
          self.dirty = true;
        }
        lastDist = d;
      }
    }
    function up(e) {
      delete pointers[e.pointerId];
      if (count() < 2) lastDist = 0;
    }
    c.addEventListener('pointerdown', down);
    c.addEventListener('pointermove', move);
    c.addEventListener('pointerup', up);
    c.addEventListener('pointercancel', up);
    c.addEventListener('pointerleave', up);
    c.addEventListener('wheel', function (e) {
      e.preventDefault();
      self.autoSpin = false;
      self.zoom = clamp(self.zoom * (1 + (e.deltaY > 0 ? 0.12 : -0.12)), 0.42, 2.6);
      self.dirty = true;
    }, { passive: false });
    c.style.touchAction = 'none';
  };

  Renderer.prototype.frame = function (dt) {
    if (!this.ok) return;
    this._resize();
    var gl = this.gl, c = this.canvas;
    if (!c.width || !c.height) return;

    if (this.autoSpin) { this.targetYaw += dt * 0.16; this.dirty = true; }
    var k = 1 - Math.pow(0.0015, dt);
    this.baseDist = this._fitDist(c.width / c.height);
    var wanted = this.baseDist * this.zoom;
    if (!this.dist) this.dist = wanted;
    this.yaw += (this.targetYaw - this.yaw) * k;
    this.pitch += (this.targetPitch - this.pitch) * k;
    this.dist += (wanted - this.dist) * k;
    if (Math.abs(this.targetGrow - this.grow) > 0.0008) { this.grow += (this.targetGrow - this.grow) * (1 - Math.pow(0.02, dt)); this.dirty = true; }
    else this.grow = this.targetGrow;

    gl.viewport(0, 0, c.width, c.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* fondo */
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.progBG);
    attr(gl, this.progBG, 'aXY', this.quad, 2);
    u3(gl, this.progBG, 'uTop', this.env.top);
    u3(gl, this.progBG, 'uBot', this.env.bot);
    u3(gl, this.progBG, 'uGlow', this.env.glow);
    u1(gl, this.progBG, 'uVig', this.env.vig);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST);

    var b = this.bounds;
    var aspect = c.width / c.height;
    var proj = perspective(0.56, aspect, 0.05, 200);
    var cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    var eye = [
      b.cx + Math.sin(this.yaw) * cp * this.dist,
      b.cy + sp * this.dist,
      b.cz + Math.cos(this.yaw) * cp * this.dist
    ];
    var view = lookAt(eye, [b.cx, b.cy, b.cz], [0, 1, 0]);

    /* sombra de contacto */
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.useProgram(this.progSh);
    attr(gl, this.progSh, 'aXY', this.quad, 2);
    m4(gl, this.progSh, 'uProj', proj);
    m4(gl, this.progSh, 'uView', view);
    u3(gl, this.progSh, 'uCenter', [b.cx, b.minY - b.r * 0.02, b.cz]);
    u2(gl, this.progSh, 'uSize', [b.r * 1.15, b.r * 1.15]);
    u1(gl, this.progSh, 'uStrength', 0.34);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    /* malla */
    if (this.count) {
      var P = this.progMesh;
      gl.useProgram(P);
      attr(gl, P, 'aPos', this.buf.pos, 3);
      attr(gl, P, 'aNor', this.buf.nor, 3);
      attr(gl, P, 'aCF', this.buf.cf, 3);
      attr(gl, P, 'aCB', this.buf.cb, 3);
      attr(gl, P, 'aMat', this.buf.mat, 1);
      m4(gl, P, 'uProj', proj);
      m4(gl, P, 'uView', view);
      u3(gl, P, 'uCam', eye);
      u3(gl, P, 'uKey', [0.45, 0.85, 0.62]);
      u3(gl, P, 'uFill', [-0.6, 0.15, -0.5]);
      u3(gl, P, 'uKeyCol', this.mood.key);
      u3(gl, P, 'uFillCol', this.mood.fill);
      u3(gl, P, 'uAmbTop', this.env.ambT);
      u3(gl, P, 'uAmbBot', this.env.ambB);
      u1(gl, P, 'uTrans', this.mood.trans);
      u1(gl, P, 'uRim', this.mood.rim);
      u1(gl, P, 'uSpec', this.mood.spec);
      u1(gl, P, 'uIrid', this.irid);
      u1(gl, P, 'uGrow', this.grow);
      gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
  };

  Renderer.prototype.snapshot = function () {
    try { return this.canvas.toDataURL('image/png'); } catch (e) { return null; }
  };

  Renderer.prototype.dispose = function () {
    if (!this.ok) return;
    var gl = this.gl, k;
    for (k in this.buf) if (this.buf.hasOwnProperty(k)) gl.deleteBuffer(this.buf[k]);
    gl.deleteBuffer(this.quad);
    gl.deleteProgram(this.progMesh); gl.deleteProgram(this.progBG); gl.deleteProgram(this.progSh);
    this.ok = false;
  };

  /* ------------------------------- helpers ------------------------------- */
  function bind(gl, b, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
  }
  function attr(gl, prog, name, buf, size) {
    var loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  function u1(gl, p, n, v) { var l = gl.getUniformLocation(p, n); if (l) gl.uniform1f(l, v); }
  function u2(gl, p, n, v) { var l = gl.getUniformLocation(p, n); if (l) gl.uniform2f(l, v[0], v[1]); }
  function u3(gl, p, n, v) { var l = gl.getUniformLocation(p, n); if (l) gl.uniform3f(l, v[0], v[1], v[2]); }
  function m4(gl, p, n, v) { var l = gl.getUniformLocation(p, n); if (l) gl.uniformMatrix4fv(l, false, new Float32Array(v)); }

  function shader(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  function program(gl, vs, fs) {
    var v = shader(gl, gl.VERTEX_SHADER, vs), f = shader(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    gl.deleteShader(v); gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      if (window.console) console.warn('link:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy), nf = 1 / (near - far);
    return [f / aspect,0,0,0, 0,f,0,0, 0,0,(far + near) * nf,-1, 0,0,2 * far * near * nf,0];
  }
  function lookAt(eye, tgt, up) {
    var z = nrm(sub(eye, tgt)), x = nrm(crs(up, z)), y = crs(z, x);
    return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
            -dot(x, eye), -dot(y, eye), -dot(z, eye), 1];
  }
  function sub(a, b) { return [a[0]-b[0], a[1]-b[1], a[2]-b[2]]; }
  function crs(a, b) { return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]; }
  function dot(a, b) { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2]; }
  function nrm(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0]/l, v[1]/l, v[2]/l]; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  root.GL = { Renderer: Renderer, BG_ENV: BG_ENV };
})(window);
