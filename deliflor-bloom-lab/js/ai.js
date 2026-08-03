/* =========================================================================
   DELIFLOR BLOOM LAB — Render fotorrealista opcional

   Reglas que gobiernan este módulo, en este orden:

   1. Nunca bloquea. El modelo 3D procedural ya está en pantalla antes de que
      esta petición salga, y la experiencia se termina igual si nunca vuelve.
   2. Presupuesto duro de 12 segundos. Pasado ese plazo se aborta y se olvida.
   3. La imagen generada se presenta SIEMPRE como lámina fotográfica rotulada,
      nunca como un modelo manipulable.
   4. La clave del proveedor no vive aquí. El modo recomendado es 'proxy', que
      habla con el worker de Cloudflare donde la clave es un secreto.
   ========================================================================= */
(function (root) {
  'use strict';

  var G = root.Genome;
  var KEY = 'bloomlab.ai';
  var CACHE = 'bloomlab.aicache';
  // 18 s: gpt-image-1.5 en calidad 'low' tardó 13 s medido en vivo contra
  // el worker de producción (30-jul-2026). El visitante sigue escribiendo
  // su nombre durante buena parte de esta espera, así que el margen no
  // se nota; lo que sí se nota es una lámina que nunca llega por un plazo
  // demasiado corto.
  var BUDGET_MS = 18000;
  var MAX_CACHE = 40;

  /* La configuración vive en localStorage, que es POR DISPOSITIVO: un kiosco
     recién montado arranca con estos valores y nadie tiene que tocarlos. Por
     eso el endpoint va aquí y no vacío — con endpoint vacío la capa
     fotorrealista queda muda aunque esté "activada", que es exactamente lo
     que pasaba antes: el visitante sólo veía el modelo 3D procedural. */
  var DEFAULTS = {
    enabled: true,
    mode: 'proxy',                 /* 'proxy' (recomendado) | 'direct' */
    endpoint: 'https://pal-ai.projectability-pal.workers.dev/',
    apiKey: '',                    /* sólo en modo 'direct'; lo escribe el operador */
    model: '',                     /* vacío = el que decida el worker */
    size: '1024x1024',
    quality: 'low',                /* 'low' | 'medium' | 'high' — 'low' ya
                                       da resultados excelentes en pruebas
                                       reales y es ~5x más barato */
    dailyCap: 300,                 /* techo de imágenes por jornada */
    spent: 0,
    day: ''
  };

  function cfg() {
    var c;
    try { c = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { c = {}; }
    var out = {}, k;
    for (k in DEFAULTS) if (DEFAULTS.hasOwnProperty(k)) out[k] = c[k] === undefined ? DEFAULTS[k] : c[k];
    var today = new Date().toISOString().slice(0, 10);
    if (out.day !== today) { out.day = today; out.spent = 0; }
    return out;
  }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function set(patch) {
    var c = cfg(), k;
    for (k in patch) if (patch.hasOwnProperty(k)) c[k] = patch[k];
    save(c);
    return c;
  }

  /* La identidad de la imagen es el genoma sin el nombre: dos visitantes que
     diseñan la misma flor comparten render y no se paga dos veces. */
  function keyOf(g, subject) {
    var copy = G.clone(g);
    copy.name = '';
    return (subject || 'bouquet') + ':' + G.encode(copy);
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE) || '[]'); } catch (e) { return []; }
  }
  function cached(g, subject) {
    var k = keyOf(g, subject), arr = readCache();
    for (var i = 0; i < arr.length; i++) if (arr[i].k === k) return arr[i].img;
    return null;
  }
  function store(g, img, subject) {
    try {
      var k = keyOf(g, subject);
      var arr = readCache().filter(function (x) { return x.k !== k; });
      arr.unshift({ k: k, img: img, ts: Date.now() });
      while (arr.length > MAX_CACHE) arr.pop();
      localStorage.setItem(CACHE, JSON.stringify(arr));
    } catch (e) {
      /* Cuota llena: se descarta la caché antes que perder la sesión */
      try { localStorage.removeItem(CACHE); } catch (e2) {}
    }
  }

  var state = { busy: false, lastError: null, lastMs: 0, ok: 0, fail: 0 };
  AIstats();
  function AIstats() {
    try {
      var s = JSON.parse(localStorage.getItem('bloomlab.aistats') || '{}');
      state.ok = s.ok || 0; state.fail = s.fail || 0;
    } catch (e) {}
  }
  function bump(field, ms, err) {
    state[field]++;
    state.lastMs = ms || 0;
    state.lastError = err || null;
    try { localStorage.setItem('bloomlab.aistats', JSON.stringify({ ok: state.ok, fail: state.fail })); } catch (e) {}
  }

  function available() {
    var c = cfg();
    if (!c.enabled) return false;
    if (!c.endpoint) return false;
    if (c.spent >= c.dailyCap) return false;
    return true;
  }

  /* -----------------------------------------------------------------
     Petición. Devuelve una promesa que NUNCA se rechaza: resuelve con la
     imagen o con null. Quien llama no necesita gestionar errores.
     ----------------------------------------------------------------- */
  function request(g, subject) {
    var hit = cached(g, subject);
    if (hit) return Promise.resolve(hit);
    if (!available()) return Promise.resolve(null);

    var c = cfg();
    var t0 = Date.now();
    state.busy = true;

    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, BUDGET_MS);

    var url, body, headers = { 'Content-Type': 'application/json' };
    if (c.mode === 'direct') {
      url = c.endpoint;
      headers.Authorization = 'Bearer ' + c.apiKey;
      body = { model: c.model || 'gpt-image-1.5', prompt: G.prompt(g, subject), size: c.size, quality: c.quality, n: 1 };
    } else {
      url = c.endpoint.replace(/\/+$/, '');
      body = {
        mode: 'bloom-render',
        prompt: G.prompt(g, subject),
        negative: G.NEGATIVE,
        size: c.size,
        quality: c.quality,
        model: c.model || undefined,
        creativeMode: g.mode
      };
    }

    return fetch(url, {
      method: 'POST', headers: headers, body: JSON.stringify(body),
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (j) {
        var img = pickImage(j);
        if (!img) throw new Error('sin imagen en la respuesta');
        clearTimeout(timer);
        store(g, img, subject);
        set({ spent: c.spent + 1 });
        state.busy = false;
        bump('ok', Date.now() - t0);
        return img;
      })
      .catch(function (e) {
        clearTimeout(timer);
        state.busy = false;
        var msg = (e && e.name === 'AbortError')
          ? 'tiempo agotado (' + (BUDGET_MS / 1000) + ' s)'
          : (e && e.message) || 'error';
        bump('fail', Date.now() - t0, msg);
        return null;
      });
  }

  function pickImage(j) {
    if (!j) return null;
    if (typeof j.image === 'string') return normalise(j.image);
    if (j.data && j.data[0]) {
      if (j.data[0].b64_json) return 'data:image/png;base64,' + j.data[0].b64_json;
      if (j.data[0].url) return j.data[0].url;
    }
    if (j.images && j.images[0]) {
      var i = j.images[0];
      if (typeof i === 'string') return normalise(i);
      if (i.url) return i.url;
      if (i.b64_json) return 'data:image/png;base64,' + i.b64_json;
    }
    if (j.artifacts && j.artifacts[0] && j.artifacts[0].base64) {
      return 'data:image/png;base64,' + j.artifacts[0].base64;
    }
    return null;
  }
  function normalise(s) {
    return /^(data:|https?:)/.test(s) ? s : 'data:image/png;base64,' + s;
  }

  /* Arranca la petición en segundo plano y guarda la promesa para que la
     pantalla del pasaporte la recoja cuando llegue. */
  /* Se siguen varias peticiones a la vez, indexadas por clave: la flor y el
     ramo son dos láminas distintas y se piden en momentos distintos, así que
     una sola ranura hacía que la segunda borrase el rastro de la primera. */
  var inflight = {};
  function prefetch(g, subject) {
    var k = keyOf(g, subject);
    if (inflight[k]) return inflight[k];
    var p = request(g, subject).then(function (img) {
      /* La entrada se suelta al resolverse. Cada promesa retiene la imagen
         entera (~2 MB en base64) y un kiosco de feria encadena cientos de
         flores en una jornada: sin esto la pestaña acaba quedándose sin
         memoria. La copia duradera ya vive en la caché de localStorage. */
      delete inflight[k];
      return img;
    });
    inflight[k] = p;
    return p;
  }
  function pending(g, subject) {
    return inflight[keyOf(g, subject)] || null;
  }

  function test() {
    var c = cfg();
    if (!c.endpoint) return Promise.resolve({ ok: false, msg: 'Falta la dirección del servicio' });
    var g = G.randomize(G.base(), 1234);
    var t0 = Date.now();
    var saved = c.enabled;
    set({ enabled: true });
    return request(g).then(function (img) {
      set({ enabled: saved });
      return img
        ? { ok: true, msg: 'Respondió en ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s', img: img }
        : { ok: false, msg: state.lastError || 'sin respuesta' };
    });
  }

  function clearCache() {
    try { localStorage.removeItem(CACHE); } catch (e) {}
  }

  root.AI = {
    cfg: cfg, set: set, available: available, request: request,
    prefetch: prefetch, pending: pending, cached: cached,
    test: test, clearCache: clearCache, state: state, BUDGET_MS: BUDGET_MS
  };
})(window);
