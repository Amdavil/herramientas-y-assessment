/* =========================================================================
   DELIFLOR BLOOM LAB — Núcleo de la experiencia
   Estado, navegación, escenario 3D permanente y pantallas 1 a 8.
   Las pantallas 9 a 15, la galería y el panel viven en finish.js.
   ========================================================================= */
(function (root) {
  'use strict';

  var App = root.App = {};
  var G = root.Genome, M = root.MeshGen, T = root.Thumbs;

  /* ---------------------------------------------------------------
     Configuración editable por Deliflor sin tocar el resto del código
     --------------------------------------------------------------- */
  var CFG = App.CFG = {
    eventName: 'Evento floral 2026',
    eventId: 'deliflor-2026',
    shareBase: '',            /* vacío = la misma página */
    idleWarn: 45000,          /* aviso de inactividad */
    idleReset: 60000,         /* fin de sesión */
    endReset: 20000,          /* pantalla final */
    labMs: 8000,              /* duración de la hibridación */
    adminPin: '2026',
    galleryOn: true,
    languages: ['es', 'en']
  };

  /* ---------------------------------------------------------------
     Textos
     --------------------------------------------------------------- */
  var L = {
    es: {
      tagline: 'Imagina el crisantemo del futuro',
      start: 'Crear mi flor', touch: 'Toca la pantalla para comenzar',
      quick: 'Creación rápida · 75 segundos',
      back: 'Atrás', next: 'Continuar', surprise: 'Sorpréndeme',
      step: 'Paso', of: 'de',
      s_mode: 'Elige tu modo creativo', s_mode_h: 'Define hasta dónde puede llegar tu flor.',
      s_family: '¿Qué tipo de crisantemo?', s_family_h: 'Toca una familia. Tu flor queda lista y la afinas después.',
      s_shape: 'Diseña la forma', s_shape_h: 'La silueta general y su volumen.',
      s_petals: 'Crea los pétalos', s_petals_h: 'La pieza que más cambia el carácter de la flor.',
      s_color: 'Elige los colores', s_color_h: 'Toca un destino y luego un color.',
      s_size: 'Tamaño y abundancia', s_size_h: '¿Una sola flor grande o muchas pequeñas?',
      s_pers: 'La personalidad de tu flor', s_pers_h: 'Escoge hasta tres. Cambian la luz y el ambiente.',
      tab_shape: 'Forma', tab_sil: 'Silueta', tab_arr: 'Disposición',
      slot_primary: 'Color principal', slot_secondary: 'Secundario', slot_center: 'Centro',
      slot_tip: 'Puntas', slot_reverse: 'Reverso', patterns: 'Patrón de color',
      openness: 'Apertura', volume: 'Volumen', centerSize: 'Tamaño del centro',
      symmetry: 'Simetría', density: 'Densidad', length: 'Longitud', width: 'Anchura',
      curve: 'Curvatura', twist: 'Retorcido', layers: 'Capas de pétalos',
      fps: 'Flores por tallo', stem: 'Longitud del tallo', foliage: 'Follaje',
      diameter: 'Diámetro de la flor', growth: 'Tipo de crecimiento',
      closed: 'Cerrada', open: 'Abierta', flat: 'Plana', domed: 'Con volumen',
      light: 'Ligera', full: 'Muy abundante', inward: 'Hacia adentro', outward: 'Hacia afuera',
      short: 'Corta', verylong: 'Muy larga', thin: 'Delgada', wide: 'Ancha',
      free: 'Libre', exact: 'Exacta', small_c: 'Pequeño', big_c: 'Grande',
      max3: 'Máximo tres', drag: 'Arrastra para girar',
      apply: 'Aplicar'
    },
    en: {
      tagline: "Imagine tomorrow's chrysanthemum",
      start: 'Create my flower', touch: 'Touch the screen to begin',
      quick: 'Quick creation · 75 seconds',
      back: 'Back', next: 'Continue', surprise: 'Surprise me',
      step: 'Step', of: 'of',
      s_mode: 'Choose your creative mode', s_mode_h: 'Set how far your flower may go.',
      s_family: 'Which kind of chrysanthemum?', s_family_h: 'Tap a family. Your flower is ready; refine it next.',
      s_shape: 'Design the shape', s_shape_h: 'Overall silhouette and volume.',
      s_petals: 'Create the petals', s_petals_h: 'The part that most changes the character.',
      s_color: 'Choose the colours', s_color_h: 'Tap a target, then a colour.',
      s_size: 'Size and abundance', s_size_h: 'One large bloom or many small ones?',
      s_pers: 'Your flower’s personality', s_pers_h: 'Pick up to three. They change light and setting.',
      tab_shape: 'Shape', tab_sil: 'Silhouette', tab_arr: 'Arrangement',
      slot_primary: 'Primary colour', slot_secondary: 'Secondary', slot_center: 'Centre',
      slot_tip: 'Tips', slot_reverse: 'Reverse', patterns: 'Colour pattern',
      openness: 'Opening', volume: 'Volume', centerSize: 'Centre size',
      symmetry: 'Symmetry', density: 'Density', length: 'Length', width: 'Width',
      curve: 'Curvature', twist: 'Twist', layers: 'Petal layers',
      fps: 'Flowers per stem', stem: 'Stem length', foliage: 'Foliage',
      diameter: 'Flower diameter', growth: 'Growth habit',
      closed: 'Closed', open: 'Open', flat: 'Flat', domed: 'Domed',
      light: 'Light', full: 'Very full', inward: 'Inward', outward: 'Outward',
      short: 'Short', verylong: 'Very long', thin: 'Thin', wide: 'Wide',
      free: 'Free', exact: 'Exact', small_c: 'Small', big_c: 'Large',
      max3: 'Up to three', drag: 'Drag to rotate',
      apply: 'Apply'
    }
  };

  /* Etiquetas de todas las opciones */
  var LB = App.LB = {
    natural: ['Natural', 'Natural'], experimental: ['Experimental', 'Experimental'], fantastic: ['Fantástica', 'Fantastical'],
    natural_d: ['Una flor novedosa y potencialmente cultivable', 'A novel, potentially growable flower'],
    experimental_d: ['Una combinación atrevida inspirada en la hibridación', 'A daring cross-inspired combination'],
    fantastic_d: ['Una flor sin límites', 'A flower without limits'],

    ballhia: ['Ballhia', 'Ballhia'], decorative: ['Decorativa', 'Decorative'], margriet: ['Margriet', 'Margriet'],
    spoon: ['Cuchara', 'Spoon'], spider: ['Araña', 'Spider'], anemone: ['Anémona', 'Anemone'],
    single: ['Simple', 'Single'], semidouble: ['Semidoble', 'Semi-double'], double: ['Doble', 'Double'],
    surprise: ['Sorpresa', 'Surprise'],
    quill: ['Canuto', 'Quill'], reflex: ['Refleja', 'Reflex'],
    incurve: ['Incurvada', 'Incurve'], brush: ['Brocha', 'Brush'],

    circular: ['Circular', 'Circular'], spherical: ['Esférica', 'Spherical'], semispherical: ['Semiesférica', 'Semi-spherical'],
    flat: ['Plana', 'Flat'], concave: ['Cóncava', 'Concave'], convex: ['Convexa', 'Convex'],
    star: ['Estrellada', 'Star'], organic: ['Orgánica', 'Organic'], compact: ['Compacta', 'Compact'],
    expanded: ['Expandida', 'Expanded'],

    rounded: ['Redondeado', 'Rounded'], oval: ['Ovalado', 'Oval'], long: ['Alargado', 'Elongated'],
    tubular: ['Tubular', 'Tubular'], curly: ['Rizado', 'Curled'], pointed: ['Puntiagudo', 'Pointed'],
    wavy: ['Ondulado', 'Wavy'], spiral: ['Espiral', 'Spiral'], irregular: ['Irregular', 'Irregular'],

    smooth: ['Lisos', 'Smooth'], toothed: ['Dentados', 'Toothed'], curled: ['Rizados', 'Curled'],
    faded: ['Degradados', 'Faded'], sharp: ['Puntas marcadas', 'Sharp tips'],

    radial: ['Radial', 'Radial'], layered: ['En capas', 'Layered'], open: ['Abierta', 'Open'],
    asym: ['Asimétrica', 'Asymmetric'],

    solid: ['Sólido', 'Solid'], gradientCenter: ['Desde el centro', 'From the centre'],
    gradientTips: ['Hacia las puntas', 'Toward the tips'], contrastCenter: ['Centro contrastante', 'Contrasting centre'],
    contrastTips: ['Puntas contrastantes', 'Contrasting tips'], bicolor: ['Bicolor', 'Bicolour'],
    striped: ['Rayado', 'Striped'], mottled: ['Moteado', 'Mottled'], speckled: ['Salpicado', 'Speckled'],
    edged: ['Bordes de color', 'Coloured edges'], watercolor: ['Acuarela', 'Watercolour'],
    iridescent: ['Tornasol', 'Iridescent'],

    disbud: ['Una flor por tallo', 'One bloom per stem'], spraySmall: ['Spray ligero', 'Light spray'],
    sprayFull: ['Spray abundante', 'Full spray'], cluster: ['Racimo compacto', 'Compact cluster'],
    cascade: ['Escalonada', 'Cascading'],

    mini: ['Mini', 'Mini'], small: ['Pequeña', 'Small'], medium: ['Mediana', 'Medium'],
    large: ['Grande', 'Large'], xlarge: ['Extra grande', 'Extra large'],

    abundant: ['Abundante', 'Abundant'], wild: ['Silvestre', 'Wild'],

    elegant: ['Elegante', 'Elegant'], joyful: ['Alegre', 'Joyful'], romantic: ['Romántica', 'Romantic'],
    powerful: ['Poderosa', 'Powerful'], delicate: ['Delicada', 'Delicate'], exotic: ['Exótica', 'Exotic'],
    modern: ['Moderna', 'Modern'], serene: ['Serena', 'Serene'], mysterious: ['Misteriosa', 'Mysterious'],
    bold: ['Atrevida', 'Bold'], sophisticated: ['Sofisticada', 'Sophisticated'],
    tropical: ['Tropical', 'Tropical'], minimal: ['Minimalista', 'Minimal'], festive: ['Festiva', 'Festive'],

    mono: ['Monofloral', 'Monofloral'], round: ['Redondo', 'Round'], asymmetric: ['Asimétrico', 'Asymmetric'],
    sculptural: ['Escultural', 'Sculptural'], celebration: ['De celebración', 'Celebration'],
    gift: ['De regalo', 'Gift'], runway: ['De pasarela', 'Runway'], monumental: ['Monumental', 'Monumental'],
    none: ['Sin complementos', 'No extras'], lightFoliage: ['Follaje ligero', 'Light foliage'],
    fullFoliage: ['Follaje abundante', 'Full foliage'], neutralFlowers: ['Flores neutras', 'Neutral flowers'],
    dried: ['Elementos secos', 'Dried elements'], textures: ['Texturas naturales', 'Natural textures'],
    whitePaper: ['Papel blanco', 'White paper'], naturalPaper: ['Papel natural', 'Kraft paper'],
    deliflorPaper: ['Papel Deliflor', 'Deliflor paper'], textile: ['Textil', 'Textile'], vase: ['Florero', 'Vase'],
    studio: ['Estudio', 'Studio'], greenhouse: ['Invernadero', 'Greenhouse'], floralEvent: ['Evento floral', 'Floral event'],
    elegantTable: ['Mesa elegante', 'Elegant table'], deliflor: ['Fondo Deliflor', 'Deliflor backdrop'],
    artistic: ['Escenario artístico', 'Artistic set']
  };

  App.t = function (k) { return (L[App.lang] && L[App.lang][k]) || L.es[k] || k; };
  App.lb = function (k) { var e = LB[k]; return e ? (App.lang === 'en' ? e[1] : e[0]) : k; };
  /* Clase oficial NCS de una familia. Va junto al nombre comercial en el
     pasaporte y en las descargas: es el dato que un floricultor reconoce. */
  App.ncs = function (fam) { var e = G.NCS[fam]; return e ? e.ncs : 'Chrysanthemum'; };
  App.ncsRay = function (fam) { var e = G.NCS[fam]; return e ? e.ray : ''; };
  App.ncsDisc = function (fam) { var e = G.NCS[fam]; return e ? e.disc : ''; };

  /* ---------------------------------------------------------------
     Estado
     --------------------------------------------------------------- */
  App.lang = 'es';
  App.g = G.base();
  App.sound = false;
  App.startedAt = 0;

  var FLOW = App.FLOW = ['attract', 'mode', 'family', 'shape', 'petals', 'color', 'size',
                         'personality', 'lab', 'reveal', 'bouquet', 'name', 'passport', 'share', 'end'];
  App.step = 0;

  /* Ruta rápida.

     En una feria con fila, el recorrido completo de 14 pasos es demasiado:
     la gente se sale a la mitad y el kiosco queda ocupado. Ésta salta el
     modo creativo, la forma, los pétalos y el ramo — todo eso conserva sus
     valores del preset de familia, así que la flor sigue saliendo completa
     y coherente, sólo que decidida por nosotros en vez de por el visitante.

     Es un subconjunto de FLOW, no una lista aparte: las pantallas son las
     mismas y no hay que mantener dos recorridos. */
  var QUICK = App.QUICK = ['family', 'color', 'size', 'personality',
                           'lab', 'reveal', 'name', 'passport', 'share', 'end'];
  App.route = null;   /* null = laboratorio completo; 'quick' = ruta rápida */

  /* Lista de pasos activa según la ruta. */
  function steps() { return App.route === 'quick' ? QUICK : FLOW; }
  App.steps = steps;

  /* ---------------------------------------------------------------
     Utilidades DOM
     --------------------------------------------------------------- */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    if (attrs) for (k in attrs) if (attrs.hasOwnProperty(k)) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    }
    if (kids) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  App.h = h;
  /* Las tareas de montaje (crear el contexto, pintar miniaturas) usan un
     temporizador y no un frame de animación: si el kiosco arranca con la
     ventana oculta o el sistema deja de componer, requestAnimationFrame no
     se dispara y la pantalla quedaría vacía. */
  var defer = App.defer = function (fn) { setTimeout(fn, 0); };

  function clear(e) { while (e.firstChild) e.removeChild(e.firstChild); return e; }
  App.clear = clear;
  function $(sel) { return document.querySelector(sel); }
  App.$ = $;

  /* ---------------------------------------------------------------
     Marca Deliflor — wordmark uniforme con un acento coral inclinado
     sobre la "I", como el lockup real del catálogo. Aprovecha el sistema
     df-logo de css/app.css: hereda el color de texto de su contenedor
     (oscuro sobre papel, blanco sobre el vino de la atracción).
       size: 'sm'  — barra superior, sólo wordmark, sin "Américas"
             'md'  — pasaporte y vista compartida
             'lg'  — hero de la pantalla de atracción
     iconOnly: true — sólo la "I" con su acento, para espacios angostos */
  App.logo = function (size, iconOnly) {
    if (iconOnly) {
      return h('div', { class: 'df-logo icon-only ' + (size || 'sm') }, [
        h('span', { class: 'df-i', 'aria-hidden': 'true' }),
        h('span', { class: 'df-ibar', 'aria-hidden': 'true' })
      ]);
    }
    var eye = h('span', { class: 'df-eye' }, [
      document.createTextNode('I'),
      h('span', { class: 'df-i', 'aria-hidden': 'true' })
    ]);
    var word = h('div', { class: 'df-word' }, [
      document.createTextNode('DEL'), eye, document.createTextNode('FLOR')
    ]);
    var kids = [word];
    if (size !== 'sm') {
      kids.push(h('div', { class: 'df-rule' }));
      kids.push(h('div', { class: 'df-sub', text: 'Américas' }));
    }
    return h('div', { class: 'df-logo ' + (size || 'sm') }, kids);
  };

  App.toast = function (msg) {
    var old = $('.toast'); if (old) old.parentNode.removeChild(old);
    var t = h('div', { class: 'toast', text: msg });
    document.body.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
  };

  /* ---------------------------------------------------------------
     Escenario 3D
     --------------------------------------------------------------- */
  var stageCanvas = null, renderer = null, lastT = 0, rafId = 0;
  var pending = null, settleTimer = 0;
  App.stageKind = 'flower';

  App.ensureRenderer = function (canvas) {
    if (renderer && renderer.canvas === canvas) return renderer;
    if (renderer) { renderer.dispose(); renderer = null; }
    stageCanvas = canvas;
    renderer = new root.GL.Renderer(canvas);
    App.renderer = renderer;
    if (!renderer.ok) { App.webgl = false; return null; }
    App.webgl = true;
    return renderer;
  };

  /* Reconstruye la malla. Durante la manipulación usa un nivel de
     detalle bajo y sube a alto cuando el visitante deja de tocar. */
  App.refresh = function (kind, immediate) {
    App.stageKind = kind || App.stageKind;
    if (!stageCanvas) return;
    if (!App.webgl) { drawFallback(); return; }
    /* Se entra SIEMPRE en detalle medio y se sube al alto en cuanto la
       pantalla está quieta. Construir en alto cuesta más de 100 ms incluso
       para una sola flor, y hacerlo durante la transición produce un tirón
       visible justo en el momento más vistoso de la experiencia. */
    var first = 'mid';
    pending = { kind: App.stageKind, lod: first };
    clearTimeout(settleTimer);
    if (first !== 'high') {
      settleTimer = setTimeout(function () {
        pending = { kind: App.stageKind, lod: 'high' };
        buildNow();
      }, immediate ? 140 : 260);
    }
    buildNow();
  };

  function buildNow() {
    if (!pending || !renderer || !renderer.ok) return;
    var p = pending; pending = null;
    var g = App.g, mesh;
    try {
      if (p.kind === 'bouquet') mesh = M.buildBouquet(g, { lod: p.lod });
      else if (p.kind === 'stem') mesh = M.buildSingleStem(g, p.lod === 'high' ? 'high' : 'mid');
      else mesh = M.buildFlower(g, { lod: p.lod });
    } catch (e) { if (root.console) console.warn(e); return; }
    renderer.setMesh(mesh);
    renderer.setEnv(p.kind === 'flower' ? 'studio' : g.bouquet.bg, g.personality, g.pattern === 'iridescent');
  }

  function drawFallback() {
    if (!stageCanvas) return;
    T.fallbackScene(stageCanvas, App.g, App.stageKind === 'bouquet' ? 'bouquet' : 'flower');
  }
  App.drawFallback = drawFallback;

  function loop(ts) {
    rafId = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (ts - lastT) / 1000 || 0.016);
    lastT = ts;
    if (renderer && renderer.ok && stageCanvas && stageCanvas.isConnected) renderer.frame(dt);
  }

  /* ---------------------------------------------------------------
     Higiene de sesión
     --------------------------------------------------------------- */
  var idleT = 0, warnT = 0, warnEl = null;

  App.poke = function () {
    clearTimeout(idleT); clearTimeout(warnT);
    if (warnEl) { warnEl.parentNode && warnEl.parentNode.removeChild(warnEl); warnEl = null; }
    var id = FLOW[App.step];
    if (id === 'attract' || id === 'lab' || id === 'admin') return;
    var reset = id === 'end' ? CFG.endReset : CFG.idleReset;
    var warn = id === 'end' ? Math.max(4000, reset - 8000) : CFG.idleWarn;
    warnT = setTimeout(showWarn, warn);
    idleT = setTimeout(function () { App.endSession(true); }, reset);
  };

  function showWarn() {
    var left = Math.round((CFG.idleReset - CFG.idleWarn) / 1000);
    var cd = h('div', { class: 'cd', text: left + 's' });
    warnEl = h('div', { class: 'idle', onpointerdown: App.poke }, [
      h('h2', { text: App.lang === 'en' ? 'Still there?' : '¿Sigues ahí?' }),
      cd,
      h('button', { class: 'btn primary big', onclick: App.poke },
        App.lang === 'en' ? 'Continue creating' : 'Seguir creando')
    ]);
    document.body.appendChild(warnEl);
    var iv = setInterval(function () {
      left--; cd.textContent = left + 's';
      if (left <= 0 || !warnEl || !warnEl.parentNode) clearInterval(iv);
    }, 1000);
  }

  App.endSession = function (silent) {
    App.track('abandon:' + FLOW[App.step]);
    App.g = G.base();
    App.consent = false;
    App.route = null;   /* el siguiente visitante empieza de cero */
    App.step = 0;
    App.render();
  };

  /* ---------------------------------------------------------------
     Analítica anónima
     --------------------------------------------------------------- */
  App.track = function (ev) {
    try {
      var k = 'bloomlab.metrics';
      var m = JSON.parse(localStorage.getItem(k) || '{}');
      m[ev] = (m[ev] || 0) + 1;
      localStorage.setItem(k, JSON.stringify(m));
    } catch (e) {}
  };
  App.metrics = function () {
    try { return JSON.parse(localStorage.getItem('bloomlab.metrics') || '{}'); } catch (e) { return {}; }
  };

  /* ---------------------------------------------------------------
     Navegación
     --------------------------------------------------------------- */
  App.go = function (id) {
    var i = FLOW.indexOf(id);
    App.step = i < 0 ? 0 : i;
    App.render();
  };
  /* next/prev caminan sobre la ruta activa. En la completa el índice de FLOW
     y la posición coinciden; en la rápida hay que traducir de una a otra. */
  App.next = function () {
    var list = steps();
    if (App.route === 'quick') {
      var i = list.indexOf(FLOW[App.step]);
      if (i >= 0 && i < list.length - 1) return App.go(list[i + 1]);
    }
    if (App.step < FLOW.length - 1) { App.step++; App.render(); }
  };
  App.prev = function () {
    var list = steps();
    if (App.route === 'quick') {
      var i = list.indexOf(FLOW[App.step]);
      if (i > 0) return App.go(list[i - 1]);
      return;
    }
    if (App.step > 1) { App.step--; App.render(); }
  };

  /* ---------------------------------------------------------------
     Andamiaje de pantalla
     --------------------------------------------------------------- */
  App.render = function () {
    var app = $('#app');
    clear(app);
    var id = FLOW[App.step];
    App.poke();
    if (!rafId) rafId = requestAnimationFrame(loop);

    var builder = App.screens[id];
    if (!builder) { App.step = 0; return App.render(); }
    stageCanvas = null;
    builder(app);
    app.appendChild(h('button', {
      class: 'corner', 'aria-label': 'admin', ondblclick: function () { App.openAdmin && App.openAdmin(); }
    }));
  };

  /* Cabecera + escenario + panel + navegación */
  App.shell = function (app, opts) {
    var id = FLOW[App.step];
    /* El contador y la barra siguen la ruta activa: en la rápida marcar
       "paso 3 de 13" cuando sólo quedan siete sería desmoralizante, y es
       justo lo que hace que alguien con prisa abandone. */
    var stepNo, totalSteps;
    if (App.route === 'quick') {
      stepNo = QUICK.indexOf(id) + 1;
      totalSteps = QUICK.length - 1;   /* 'end' no cuenta como paso */
    } else {
      stepNo = App.step;
      totalSteps = FLOW.length - 2;
    }

    var prog = h('div', { class: 'progress' });
    for (var i = 1; i <= totalSteps; i++) {
      prog.appendChild(h('i', { class: i < stepNo ? 'done' : (i === stepNo ? 'now' : '') }));
    }

    var top = h('div', { class: 'topbar' }, [
      h('div', { class: 'brand' }, [
        App.logo('sm'),
        h('span', { class: 'sub', text: 'Bloom Lab' })
      ]),
      prog,
      h('div', { class: 'topright' }, [
        CFG.languages.length > 1 ? h('button', {
          class: 'icon-btn', onclick: function () {
            App.lang = App.lang === 'es' ? 'en' : 'es'; App.render();
          }, text: App.lang === 'es' ? 'EN' : 'ES'
        }) : null,
        h('button', {
          class: 'icon-btn', 'aria-pressed': String(App.sound),
          title: 'Sonido', onclick: function (e) {
            App.sound = !App.sound;
            e.currentTarget.setAttribute('aria-pressed', String(App.sound));
            e.currentTarget.textContent = App.sound ? '♪' : '✕♪';
          }, text: App.sound ? '♪' : '✕♪'
        })
      ])
    ]);
    app.appendChild(top);

    var body = h('div', { class: 'body screen' });
    app.appendChild(body);

    var stage = null;
    if (opts.stage !== false) {
      stage = h('div', { class: 'stage' });
      var cv = h('canvas');
      stage.appendChild(cv);
      stage.appendChild(h('div', { class: 'stage-note', text: App.t('drag') }));
      body.appendChild(stage);
      App.stageEl = cv;
      defer(function () {
        App.ensureRenderer(cv);
        stageCanvas = cv;
        App.refresh(opts.kind || 'flower', true);
        if (!App.webgl) drawFallback();
      });
    }

    var panel = h('div', { class: 'panel' });
    var head = h('div', { class: 'panel-head' }, [
      h('div', { class: 'step', text: App.t('step') + ' ' + stepNo + ' ' + App.t('of') + ' ' + totalSteps }),
      h('h2', { text: opts.title }),
      opts.hint ? h('p', { class: 'hint', text: opts.hint }) : null
    ]);
    panel.appendChild(head);
    var pbody = h('div', { class: 'panel-body' });
    panel.appendChild(pbody);
    body.appendChild(panel);

    var nav = h('div', { class: 'nav' }, [
      h('button', { class: 'btn ghost', onclick: App.prev, text: '‹ ' + App.t('back') }),
      h('button', {
        class: 'btn', onclick: function () {
          App.g = G.randomize(App.g);
          App.track('surprise');
          App.render();
        }, text: '✦ ' + App.t('surprise')
      }),
      h('div', { class: 'spacer' }),
      h('button', { class: 'btn primary', onclick: App.next, text: App.t('next') + ' ›' })
    ]);
    app.appendChild(nav);

    return { body: pbody, stage: stage, nav: nav };
  };

  /* ---------------------------------------------------------------
     Constructores de controles
     --------------------------------------------------------------- */
  function optionGrid(items, current, onPick, cols, draw) {
    var grid = h('div', { class: 'opts c' + (cols || 5) });
    items.forEach(function (it) {
      var cv = draw ? h('canvas') : null;
      var btn = h('button', {
        class: 'opt', 'aria-pressed': String(it.id === current),
        onclick: function () { onPick(it.id); }
      }, [cv, h('span', { class: 'lbl', text: it.label }), it.desc ? h('span', { class: 'desc', text: it.desc }) : null]);
      grid.appendChild(btn);
      if (draw && cv) defer(function () { draw(cv, it.id); });
    });
    return grid;
  }
  App.optionGrid = optionGrid;

  function ids(list) {
    return list.map(function (k) { return { id: k, label: App.lb(k) }; });
  }
  App.ids = ids;

  function slider(name, key, lo, hi, opts) {
    opts = opts || {};
    var val = h('span', { class: 'slval' });
    function fmt(v) { return opts.fmt ? opts.fmt(v) : Math.round(v * 100) + '%'; }
    var cur = opts.get ? opts.get() : App.g[key];
    val.textContent = fmt(cur);
    var input = h('input', {
      type: 'range',
      min: opts.min !== undefined ? opts.min : 0,
      max: opts.max !== undefined ? opts.max : 1,
      step: opts.step !== undefined ? opts.step : 0.01,
      value: cur,
      oninput: function (e) {
        var v = parseFloat(e.target.value);
        val.textContent = fmt(v);
        if (opts.set) opts.set(v); else App.g[key] = v;
        G.normalize(App.g);
        App.refresh();
        App.poke();
      }
    });
    return h('div', { class: 'sl' }, [
      h('div', { class: 'slhead' }, [h('span', { class: 'slname', text: name }), val]),
      input,
      h('div', { class: 'slends' }, [h('span', { text: lo }), h('span', { text: hi })])
    ]);
  }
  App.slider = slider;

  function adviceBar(pbody) {
    var list = G.advice(App.g, App.lang);
    if (!list.length) return;
    var a = list[0];
    var row = h('div', { class: 'advice' }, [
      h('span', { html: '<b>◆</b> ' + a.text }),
      a.fix ? h('button', {
        class: 'btn', onclick: function () {
          for (var k in a.fix) if (a.fix.hasOwnProperty(k)) App.g[k] = a.fix[k];
          G.normalize(App.g); App.render();
        }, text: a.label
      }) : null
    ]);
    pbody.appendChild(row);
  }
  App.adviceBar = adviceBar;

  /* ---------------------------------------------------------------
     PANTALLAS 1 – 8
     --------------------------------------------------------------- */
  App.screens = {};

  /* 01 · Atracción -------------------------------------------------- */
  App.screens.attract = function (app) {
    App.g = G.base();
    App.consent = false;
    var cv = h('canvas');
    var wrap = h('div', { class: 'full center', id: 'attract', onpointerdown: begin }, [
      cv,
      h('div', { class: 'att-inner' }, [
        h('div', { style: 'display:flex;justify-content:center;margin-bottom:calc(var(--s)*1.8)' }, App.logo('lg')),
        h('h1', { html: 'Bloom&nbsp;Lab' }),
        h('div', { class: 'tag', text: App.t('tagline') }),
        h('button', { class: 'btn big', onclick: begin, text: App.t('start') }),
        h('button', {
          class: 'btn big alt',
          text: App.t('quick'),
          onclick: function (e) { e.stopPropagation(); begin('quick'); }
        }),
        h('div', { class: 'touch', text: App.t('touch') })
      ])
    ]);
    app.appendChild(wrap);
    startAttract(cv);
    /* Tocar cualquier parte de la pantalla arranca el recorrido completo;
       sólo el botón de la ruta rápida la activa, y por eso detiene la
       propagación: si no, el onpointerdown del fondo se le adelantaba. */
    function begin(route) {
      App.route = route === 'quick' ? 'quick' : null;
      App.track(App.route === 'quick' ? 'session:quick' : 'session');
      App.startedAt = Date.now();
      App.g = G.base();
      G.applyPreset(App.g, 'ballhia');
      if (App.route === 'quick') { G.normalize(App.g); App.go('family'); }
      else App.go('mode');
    }
  };

  /* Jardín en bucle: flores que crecen y se transforman */
  var attractRaf = 0;
  function startAttract(cv) {
    cancelAnimationFrame(attractRaf);
    var blooms = [];
    for (var i = 0; i < 7; i++) blooms.push(newBloom(i));
    function newBloom(i) {
      var g = G.randomize(G.base(), Math.floor(Math.random() * 60000) + 1);
      g.mode = 'experimental';
      return { g: g, t: -i * 0.55, x: 0, y: 0, s: 0 };
    }
    var t0 = performance.now();
    (function frame(ts) {
      attractRaf = requestAnimationFrame(frame);
      if (!cv.isConnected) { cancelAnimationFrame(attractRaf); return; }
      var r = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
      if (cv.width !== W) { cv.width = W; cv.height = H; }
      var ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var el = (ts - t0) / 1000;
      var tmp = attractTmp(dpr);
      for (var k = 0; k < blooms.length; k++) {
        var b = blooms[k];
        var life = (el * 0.19 + k * 0.14) % 1;
        var scale = Math.sin(life * Math.PI);
        if (life < 0.02) b.g = G.randomize(G.base(), Math.floor(Math.random() * 60000) + 1);
        var cx = (0.09 + 0.135 * k) * W + Math.sin(el * 0.4 + k) * W * 0.02;
        var cy = H * (0.5 + Math.sin(el * 0.32 + k * 1.7) * 0.28);
        var size = Math.min(W, H) * (0.16 + (k % 3) * 0.05) * scale;
        if (size < 4) continue;
        T.flower(tmp, b.g, { scale: 0.46, cheap: true });
        ctx.globalAlpha = 0.16 + scale * 0.5;
        ctx.drawImage(tmp, cx - size / 2, cy - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
    })(t0);
  }
  var _atmp = null;
  function attractTmp(dpr) {
    if (!_atmp) {
      _atmp = document.createElement('canvas');
      _atmp.width = _atmp.height = 240;
      _atmp.style.width = _atmp.style.height = '240px';
    }
    return _atmp;
  }

  /* 02 · Modo creativo ---------------------------------------------- */
  App.screens.mode = function (app) {
    var s = App.shell(app, { title: App.t('s_mode'), hint: App.t('s_mode_h'), kind: 'flower' });
    var cards = h('div', { class: 'cards' });
    G.MODES.forEach(function (m) {
      var cv = h('canvas');
      var card = h('button', {
        class: 'card', 'aria-pressed': String(App.g.mode === m),
        onclick: function () {
          App.g.mode = m; G.normalize(App.g);
          App.track('mode:' + m);
          App.next();
        }
      }, [cv, h('div', { class: 'cbody' }, [
        h('h3', { text: App.lb(m) }),
        h('p', { text: App.lb(m + '_d') })
      ])]);
      cards.appendChild(card);
      defer(function () {
        var demo = G.randomize(G.base(), m === 'natural' ? 4242 : m === 'experimental' ? 991 : 7777);
        demo.mode = m; G.normalize(demo);
        T.flower(cv, demo, { scale: 0.42, cheap: true });
      });
    });
    s.body.appendChild(cards);
  };

  /* 03 · Familia ----------------------------------------------------- */
  App.screens.family = function (app) {
    var s = App.shell(app, { title: App.t('s_family'), hint: App.t('s_family_h'), kind: 'flower' });
    /* Cada familia lleva su clase oficial NCS como subtítulo: convierte la
       elección en un dato botánico reconocible para el floricultor que pasa
       por el stand, sin estorbar al visitante que sólo mira la forma. */
    var items = G.FAMILIES.map(function (k) {
      return { id: k, label: App.lb(k), desc: App.ncs(k).replace(/^NCS\s*/, 'NCS ') };
    });
    s.body.appendChild(optionGrid(items, App.g.family, function (id) {
      if (id === 'surprise') {
        App.g = G.randomize(App.g);
      } else {
        G.applyPreset(App.g, id);
        G.normalize(App.g);
      }
      App.track('family:' + id);
      App.render();
      App.refresh('flower', true);
    }, 5, function (cv, id) {
      var demo = G.base();
      if (id === 'surprise') demo = G.randomize(demo, 31337);
      else G.applyPreset(demo, id);
      demo.colors = App.g.colors; demo.pattern = App.g.pattern;
      G.normalize(demo);
      T.flower(cv, demo, { scale: 0.44, cheap: true });
    }));
  };

  /* 04 · Forma principal --------------------------------------------- */
  App.screens.shape = function (app) {
    var s = App.shell(app, { title: App.t('s_shape'), hint: App.t('s_shape_h'), kind: 'flower' });
    s.body.appendChild(optionGrid(ids(G.SHAPES), App.g.shape, function (id) {
      App.g.shape = id;
      applyShape(App.g, id);
      G.normalize(App.g);
      App.track('shape:' + id);
      App.render();
    }, 5, function (cv, id) {
      var demo = G.clone(App.g); demo.shape = id; applyShape(demo, id); G.normalize(demo);
      T.flower(cv, demo, { scale: 0.44, cheap: true });
    }));
    var sl = h('div', { class: 'sliders' }, [
      slider(App.t('openness'), 'openness', App.t('closed'), App.t('open')),
      slider(App.t('volume'), 'volume', App.t('flat'), App.t('domed')),
      slider(App.t('centerSize'), 'centerSize', App.t('small_c'), App.t('big_c'))
    ]);
    s.body.appendChild(sl);
    adviceBar(s.body);
  };

  /* Cada silueta mueve los mismos parámetros del motor */
  function applyShape(g, id) {
    var map = {
      circular:      { openness: 0.72, volume: 0.34, symmetry: 0.98 },
      spherical:     { openness: 0.22, volume: 0.88, symmetry: 0.97 },
      semispherical: { openness: 0.45, volume: 0.66, symmetry: 0.95 },
      flat:          { openness: 0.95, volume: 0.14, symmetry: 0.96 },
      concave:       { openness: 0.68, volume: 0.3, petalCurve: 0.22 },
      convex:        { openness: 0.5, volume: 0.72, petalCurve: 0.74 },
      star:          { openness: 0.85, volume: 0.3, petalShape: 'pointed', density: 0.34 },
      organic:       { symmetry: 0.62, openness: 0.6, volume: 0.5 },
      compact:       { openness: 0.3, volume: 0.6, density: 0.95 },
      expanded:      { openness: 0.9, volume: 0.4, density: 0.45, petalLength: 0.85 }
    };
    var p = map[id];
    if (p) for (var k in p) if (p.hasOwnProperty(k)) g[k] = p[k];
    return g;
  }

  /* 05 · Pétalos ------------------------------------------------------ */
  App.screens.petals = function (app) {
    var s = App.shell(app, { title: App.t('s_petals'), hint: App.t('s_petals_h'), kind: 'flower' });
    var tab = App._petalTab || 'shape';

    var tabs = h('div', { class: 'opts c3' }, [
      tabBtn('shape', App.t('tab_shape')), tabBtn('sil', App.t('tab_sil')), tabBtn('arr', App.t('tab_arr'))
    ]);
    function tabBtn(id, label) {
      return h('button', {
        class: 'opt', 'aria-pressed': String(tab === id),
        style: 'min-height:auto',
        onclick: function () { App._petalTab = id; App.render(); }
      }, h('span', { class: 'lbl', text: label }));
    }
    s.body.appendChild(tabs);

    if (tab === 'shape') {
      s.body.appendChild(optionGrid(ids(G.PETAL_SHAPES), App.g.petalShape, function (id) {
        App.g.petalShape = id; G.normalize(App.g); App.track('petal:' + id); App.render();
      }, 5, function (cv, id) {
        T.petalIcon(cv, id, G.hex(App.g.colors.primary), App.g.petalEdge);
      }));
    } else if (tab === 'sil') {
      s.body.appendChild(h('div', { class: 'sliders' }, [
        slider(App.t('length'), 'petalLength', App.t('short'), App.t('verylong')),
        slider(App.t('width'), 'petalWidth', App.t('thin'), App.t('wide')),
        slider(App.t('curve'), 'petalCurve', App.t('inward'), App.t('outward')),
        slider(App.t('twist'), 'petalTwist', '—', '↻')
      ]));
      s.body.appendChild(optionGrid(ids(G.EDGES), App.g.petalEdge, function (id) {
        App.g.petalEdge = id; App.render();
      }, 6, function (cv, id) {
        T.petalIcon(cv, App.g.petalShape, G.hex(App.g.colors.primary), id);
      }));
    } else {
      s.body.appendChild(optionGrid(ids(G.ARRANGEMENTS), App.g.arrangement, function (id) {
        App.g.arrangement = id; App.render();
      }, 6, function (cv, id) {
        var demo = G.clone(App.g); demo.arrangement = id;
        T.flower(cv, demo, { scale: 0.44, cheap: true });
      }));
      s.body.appendChild(h('div', { class: 'sliders' }, [
        slider(App.t('density'), 'density', App.t('light'), App.t('full')),
        slider(App.t('layers'), 'layers', '1', '14', {
          min: 1, max: 14, step: 1, fmt: function (v) { return String(Math.round(v)); }
        }),
        slider(App.t('symmetry'), 'symmetry', App.t('free'), App.t('exact'))
      ]));
    }
    adviceBar(s.body);
  };

  /* 06 · Color -------------------------------------------------------- */
  App.screens.color = function (app) {
    var s = App.shell(app, { title: App.t('s_color'), hint: App.t('s_color_h'), kind: 'flower' });
    var slot = App._colorSlot || 'primary';
    var SLOTS = ['primary', 'secondary', 'center', 'tip', 'reverse'];

    var slots = h('div', { class: 'slots' });
    SLOTS.forEach(function (k) {
      slots.appendChild(h('button', {
        class: 'slot', 'aria-pressed': String(slot === k),
        onclick: function () { App._colorSlot = k; App.render(); }
      }, [
        h('span', { class: 'dot', style: 'background:' + G.hex(App.g.colors[k]) }),
        h('span', {}, [
          h('span', { class: 'sname', text: App.t('slot_' + k) }), h('br'),
          h('span', { class: 'sval', text: G.PALETTE[App.g.colors[k]][App.lang === 'en' ? 'en' : 'es'] })
        ])
      ]));
    });
    s.body.appendChild(slots);

    var sw = h('div', { class: 'swatches', style: 'margin-bottom:calc(var(--s)*1.6)' });
    G.PALETTE.forEach(function (c, i) {
      sw.appendChild(h('button', {
        class: 'sw', 'aria-pressed': String(App.g.colors[slot] === i),
        style: 'background:' + c.hex, title: c[App.lang === 'en' ? 'en' : 'es'],
        'aria-label': c[App.lang === 'en' ? 'en' : 'es'],
        onclick: function () {
          App.g.colors[slot] = i;
          App.track('color:' + c.id);
          App.render();
          App.refresh('flower', true);
        }
      }, h('span', { class: 'swname', text: c[App.lang === 'en' ? 'en' : 'es'] })));
    });
    s.body.appendChild(sw);

    s.body.appendChild(h('div', { class: 'step', text: App.t('patterns') }));
    var pats = App.g.mode === 'fantastic' ? G.PATTERNS : G.PATTERNS.slice(0, 11);
    s.body.appendChild(optionGrid(ids(pats), App.g.pattern, function (id) {
      App.g.pattern = id; G.normalize(App.g); App.track('pattern:' + id); App.render();
    }, 6, function (cv, id) {
      T.patternSwatch(cv, id, App.g.colors);
    }));
    adviceBar(s.body);
  };

  /* 07 · Tamaño y abundancia ------------------------------------------ */
  App.screens.size = function (app) {
    var s = App.shell(app, { title: App.t('s_size'), hint: App.t('s_size_h'), kind: 'flower' });

    s.body.appendChild(h('div', { class: 'step', text: App.t('diameter') }));
    s.body.appendChild(optionGrid(
      G.DIAMETERS.map(function (d) { return { id: d, label: App.lb(d), desc: G.DIAMETER_CM[d] + ' cm' }; }),
      App.g.diameter,
      function (id) { App.g.diameter = id; App.track('diam:' + id); App.render(); }, 5,
      function (cv, id) {
        var demo = G.clone(App.g); demo.diameter = id;
        var rel = { mini: 0.2, small: 0.3, medium: 0.4, large: 0.5, xlarge: 0.6 }[id];
        T.flower(cv, demo, { scale: rel * 0.9, cheap: true });
      }));

    s.body.appendChild(h('div', { class: 'step', text: App.t('growth') }));
    s.body.appendChild(optionGrid(ids(G.GROWTH), App.g.growth, function (id) {
      App.g.growth = id;
      App.g.flowersPerStem = id === 'disbud' ? 1 : Math.max(3, App.g.flowersPerStem);
      G.normalize(App.g);
      App.render();
    }, 5));

    s.body.appendChild(h('div', { class: 'sliders' }, [
      slider(App.t('fps'), 'flowersPerStem', '1', '9', {
        min: 1, max: 9, step: 1, fmt: function (v) { return flowerDots(Math.round(v)); },
        set: function (v) { App.g.flowersPerStem = Math.round(v); if (v > 1 && App.g.growth === 'disbud') App.g.growth = 'spraySmall'; }
      }),
      slider(App.t('stem'), null, App.t('short'), App.t('verylong'), {
        min: 0, max: 2, step: 1,
        get: function () { return G.STEMS.indexOf(App.g.stemLength); },
        set: function (v) { App.g.stemLength = G.STEMS[Math.round(v)]; },
        fmt: function (v) { return App.lb(['short', 'medium', 'long'][Math.round(v)]) || ''; }
      }),
      slider(App.t('foliage'), null, App.t('light'), App.t('full'), {
        min: 0, max: 4, step: 1,
        get: function () { return G.FOLIAGE.indexOf(App.g.foliage); },
        set: function (v) { App.g.foliage = G.FOLIAGE[Math.round(v)]; },
        fmt: function (v) { return App.lb(G.FOLIAGE[Math.round(v)]); }
      })
    ]));
    adviceBar(s.body);
  };
  function flowerDots(n) { var s = ''; for (var i = 0; i < n; i++) s += '✿'; return s; }

  /* 08 · Personalidad -------------------------------------------------- */
  App.screens.personality = function (app) {
    var s = App.shell(app, { title: App.t('s_pers'), hint: App.t('s_pers_h') + ' · ' + App.t('max3'), kind: 'flower' });
    var chips = h('div', { class: 'chips' });
    G.PERSONALITY.forEach(function (p) {
      var on = App.g.personality.indexOf(p) !== -1;
      chips.appendChild(h('button', {
        class: 'chip', 'aria-pressed': String(on),
        disabled: (!on && App.g.personality.length >= 3) ? 'disabled' : null,
        onclick: function () {
          var i = App.g.personality.indexOf(p);
          if (i !== -1) App.g.personality.splice(i, 1);
          else if (App.g.personality.length < 3) { App.g.personality.push(p); App.track('pers:' + p); }
          App.render();
          App.refresh('flower', true);
        }, text: App.lb(p)
      }));
    });
    s.body.appendChild(chips);
  };

  /* ---------------------------------------------------------------
     Arranque
     --------------------------------------------------------------- */
  function sharedFromHash() {
    var m = (location.hash || '').match(/[#&]g=([A-Za-z0-9\-_]+)/);
    if (!m || !App.showShared) return false;
    var g = G.decode(m[1]);
    if (!g) return false;
    App.g = g;
    App.showShared();
    return true;
  }

  App.boot = function () {
    if (sharedFromHash()) return;
    var nav = (navigator.language || 'es').slice(0, 2);
    App.lang = CFG.languages.indexOf(nav) !== -1 ? nav : CFG.languages[0];
    App.render();
  };

  /* Cambiar sólo el fragmento no recarga la página: si alguien escanea un
     segundo código con la vista compartida ya abierta, hay que atenderlo. */
  window.addEventListener('hashchange', function () { sharedFromHash(); });

  ['pointerdown', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, function () { App.poke(); }, true);
  });
  window.addEventListener('resize', function () {
    if (App.renderer && App.renderer.ok) App.renderer.dirty = true;
    if (!App.webgl) App.drawFallback();
  });

  document.addEventListener('DOMContentLoaded', function () {
    if (App.screens.lab) App.boot();
    else setTimeout(App.boot, 0);
  });
})(window);
