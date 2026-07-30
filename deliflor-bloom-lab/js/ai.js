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
  var BUDGET_MS = 12000;
  var MAX_CACHE = 40;

  var DEFAULTS = {
    enabled: false,
    mode: 'proxy',                 /* 'proxy' (recomendado) | 'direct' */
    endpoint: '',                  /* p. ej. https://pal-ai.<cuenta>.workers.dev */
    apiKey: '',                    /* sólo en modo 'direct'; lo escribe el operador */
    model: 'gpt-image-1',
    size: '1024x1024',
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
  function keyOf(g) {
    var copy = G.clone(g);
    copy.name = '';
    return G.encode(copy);
  }

  function readCache() {
    try { return JSON.parse(localStorage.getItem(CACHE) || '[]'); } catch (e) { return []; }
  }
  function cached(g) {
    var k = keyOf(g), arr = readCache();
    for (var i = 0; i < arr.length; i++) if (arr[i].k === k) return arr[i].img;
    return null;
  }
  function store(g, img) {
    try {
      var k = keyOf(g);
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
  function request(g) {
    var hit = cached(g);
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
      body = {
        model: c.model, prompt: G.prompt(g), size: c.size, n: 1, response_format: 'b64_json'
      };
    } else {
      url = c.endpoint.replace(/\/+$/, '');
      body = {
        mode: 'bloom-render',
        prompt: G.prompt(g),
        negative: G.NEGATIVE,
        size: c.size,
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
        store(g, img);
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
  var inflight = null, inflightKey = null;
  function prefetch(g) {
    var k = keyOf(g);
    if (inflight && inflightKey === k) return inflight;
    inflightKey = k;
    inflight = request(g);
    return inflight;
  }
  function pending(g) {
    return (inflight && inflightKey === keyOf(g)) ? inflight : null;
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
