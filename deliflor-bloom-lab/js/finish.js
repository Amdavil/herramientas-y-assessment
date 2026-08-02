/* =========================================================================
   DELIFLOR BLOOM LAB — Pantallas 9 a 15, galería, panel y vista compartida
   ========================================================================= */
(function (root) {
  'use strict';

  var App = root.App, G = root.Genome, M = root.MeshGen, T = root.Thumbs, QR = root.QR;
  var h = App.h, CFG = App.CFG;

  App.shots = {};

  function snapshot() {
    try {
      var cv = App.stageEl;
      return cv && cv.toDataURL ? cv.toDataURL('image/png') : null;
    } catch (e) { return null; }
  }

  function stripPanel(s) {
    var panel = s.body.parentNode;
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    if (s.stage) { s.stage.style.flex = '1'; s.stage.style.borderRight = '0'; }
  }
  function onNext(s, fn) {
    var b = s.nav.querySelector('.btn.primary');
    if (b) b.onclick = fn;
    return b;
  }

  /* =================================================================
     09 · Laboratorio de hibridación
     ================================================================= */
  var MSG = {
    es: ['Combinando forma y estructura', 'Definiendo la arquitectura de los pétalos',
         'Desarrollando la expresión de color', 'Cultivando tu nueva variedad',
         'Tu crisantemo está floreciendo'],
    en: ['Combining form and structure', 'Defining the petal architecture',
         'Developing the colour expression', 'Growing your new variety',
         'Your chrysanthemum is blooming']
  };

  App.screens.lab = function (app) {
    var cv = h('canvas');
    var msg = h('div', { class: 'labmsg' });
    var bar = h('i');
    var wrap = h('div', { class: 'full center', id: 'lab' }, [
      cv,
      h('div', { class: 'labtext' }, [
        msg,
        h('div', { class: 'labbar' }, bar),
        h('div', {
          class: 'labnote',
          text: App.lang === 'en'
            ? 'A digital creation inspired by plant breeding. Not a prediction of genetic viability.'
            : 'Creación digital inspirada en procesos de hibridación. No es una garantía de viabilidad genética.'
        })
      ])
    ]);
    app.appendChild(wrap);
    App.track('lab');

    /* La lámina de la flor se pide aquí, no en la pantalla del nombre: la
       revelación llega justo después y la petición tarda ~12 s, así que
       pedirla más tarde significaba que nunca alcanzaba a mostrarse. Los
       rasgos de la flor ya están fijados en este punto; sólo el ramo y el
       nombre se deciden después, y ninguno entra en esta imagen. */
    if (root.AI) root.AI.prefetch(App.g, 'bloom');

    var list = MSG[App.lang] || MSG.es;
    var t0 = performance.now(), dur = CFG.labMs, raf = 0;
    var particles = [];
    for (var i = 0; i < 90; i++) {
      particles.push({ a: Math.random() * Math.PI * 2, r: Math.random(), sp: 0.2 + Math.random() * 0.8, s: 1 + Math.random() * 2.5 });
    }
    var tmp = document.createElement('canvas');
    tmp.width = tmp.height = 420; tmp.style.width = tmp.style.height = '420px';
    T.flower(tmp, App.g, { scale: 0.46 });

    (function frame(ts) {
      raf = requestAnimationFrame(frame);
      if (!cv.isConnected) { cancelAnimationFrame(raf); return; }
      var p = Math.min(1, (ts - t0) / dur);
      bar.style.width = (p * 100) + '%';
      var mi = Math.min(list.length - 1, Math.floor(p * list.length));
      if (msg.textContent !== list[mi]) msg.textContent = list[mi];

      var r = cv.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      var W = Math.round(r.width * dpr), H = Math.round(r.height * dpr);
      if (cv.width !== W) { cv.width = W; cv.height = H; }
      var ctx = cv.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      var cx = W / 2, cy = H * 0.42, R = Math.min(W, H) * 0.3;

      /* líneas genéticas */
      ctx.strokeStyle = 'rgba(124,33,77,.16)'; ctx.lineWidth = dpr;
      for (var k = 0; k < 14; k++) {
        var a0 = (k / 14) * Math.PI * 2 + p * 1.2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a0) * R * 2.1, cy + Math.sin(a0) * R * 2.1);
        ctx.quadraticCurveTo(cx, cy, cx + Math.cos(a0 + 2.1) * R * 2.1, cy + Math.sin(a0 + 2.1) * R * 2.1);
        ctx.stroke();
      }
      /* partículas convergiendo */
      ctx.fillStyle = 'rgba(156,48,113,.45)';
      for (k = 0; k < particles.length; k++) {
        var q = particles[k];
        var rr = (1 - p) * R * 3.2 * q.r + R * 0.25;
        var aa = q.a + p * q.sp * 3;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(aa) * rr, cy + Math.sin(aa) * rr * 0.8, q.s * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
      /* la flor crece y se revela */
      var grow = p * p * (3 - 2 * p);
      var size = R * 2.2 * grow;
      if (size > 4) {
        ctx.globalAlpha = Math.min(1, p * 1.6);
        ctx.drawImage(tmp, cx - size / 2, cy - size / 2, size, size);
        ctx.globalAlpha = 1;
      }
      if (p >= 1) { cancelAnimationFrame(raf); App.go('reveal'); }
    })(t0);
  };

  /* =================================================================
     10 · Revelación
     ================================================================= */
  App.screens.reveal = function (app) {
    var s = App.shell(app, { title: '', kind: 'stem' });
    stripPanel(s);
    App.track('reveal');

    s.stage.appendChild(h('div', { class: 'reveal-msg' }, [
      h('div', {
        class: 'rt', text: App.lang === 'en'
          ? "You've created a flower that didn't exist yet"
          : 'Has creado una flor que todavía no existía'
      })
    ]));

    var views = h('div', { class: 'viewbtns' });
    [['front', App.lang === 'en' ? 'Front' : 'Frontal'],
     ['side', App.lang === 'en' ? 'Side' : 'Lateral'],
     ['top', App.lang === 'en' ? 'Top' : 'Superior'],
     ['reset', App.lang === 'en' ? 'Reset' : 'Reiniciar']].forEach(function (v) {
      views.appendChild(h('button', {
        class: 'icon-btn', text: v[1],
        onclick: function () {
          if (!App.renderer || !App.renderer.ok) return;
          if (v[0] === 'reset') App.renderer.reset(); else App.renderer.setView(v[0]);
        }
      }));
    });
    s.stage.appendChild(views);

    /* La lámina fotográfica de la flor, si llegó a tiempo. Es el momento en
       que el visitante juzga "su" flor, así que aquí es donde más pesa que
       se vea como una fotografía y no como un modelo. */
    photoPlate(s.stage, App.g, null, 'bloom');

    App.defer(function () {
      if (App.renderer && App.renderer.ok) App.renderer.bloomIn();
    });

    onNext(s, function () {
      App.shots.flower = snapshot();
      App.next();
    });
  };

  /* =================================================================
     11 · Ramo
     ================================================================= */
  App.screens.bouquet = function (app) {
    var s = App.shell(app, {
      title: App.lang === 'en' ? 'Build the bouquet' : 'Crea el ramo',
      hint: App.lang === 'en' ? 'Made entirely from the variety you invented.'
                              : 'Hecho por completo con la variedad que inventaste.',
      kind: 'bouquet'
    });
    var tab = App._bqTab || 'style';
    var TABS = [['style', App.lang === 'en' ? 'Style' : 'Estilo'],
                ['abundance', App.lang === 'en' ? 'Stems' : 'Tallos'],
                ['extras', App.lang === 'en' ? 'Extras' : 'Complementos'],
                ['wrap', App.lang === 'en' ? 'Wrapping' : 'Envoltura'],
                ['bg', App.lang === 'en' ? 'Setting' : 'Fondo']];
    var tabs = h('div', { class: 'opts c5' });
    TABS.forEach(function (t2) {
      tabs.appendChild(h('button', {
        class: 'opt', style: 'min-height:auto', 'aria-pressed': String(tab === t2[0]),
        onclick: function () { App._bqTab = t2[0]; App.render(); }
      }, h('span', { class: 'lbl', text: t2[1] })));
    });
    s.body.appendChild(tabs);

    var lists = {
      style: G.BQ_STYLES, abundance: G.BQ_ABUNDANCE, extras: G.BQ_EXTRAS,
      wrap: G.BQ_WRAP, bg: G.BQ_BG
    };
    s.body.appendChild(App.optionGrid(App.ids(lists[tab]), App.g.bouquet[tab], function (id) {
      App.g.bouquet[tab] = id;
      App.track('bq:' + tab + ':' + id);
      App.render();
      App.refresh('bouquet', true);
    }, tab === 'abundance' ? 4 : 5));

    onNext(s, function () {
      App.shots.bouquet = snapshot();
      App.next();
    });
  };

  /* =================================================================
     12 · Nombre
     ================================================================= */
  var ROWS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

  App.screens.name = function (app) {
    var s = App.shell(app, {
      title: App.lang === 'en' ? 'Name your variety' : 'Nombra tu variedad',
      hint: App.lang === 'en' ? 'How is your new creation called?' : '¿Cómo se llama tu nueva creación?',
      kind: 'flower'
    });
    /* El render fotorrealista se pide aquí, no al final: así dispone del
       tiempo del teclado y del pasaporte para llegar sin hacer esperar. */
    if (root.AI) root.AI.prefetch(App.g, 'bouquet');

    var val = h('div', { class: 'val' + (App.g.name ? '' : ' empty') });
    var count = h('span', { class: 'count' });
    var err = h('div', { class: 'err' });

    function paint() {
      val.textContent = App.g.name || (App.lang === 'en' ? 'Your variety' : 'Tu variedad');
      val.className = 'val' + (App.g.name ? '' : ' empty');
      count.textContent = App.g.name.length + '/24';
      var chk = G.checkName(App.g.name);
      var okBtn = s.nav.querySelector('.btn.primary');
      if (App.g.name && !chk.ok) {
        err.textContent = chk.reason === 'blocked'
          ? (App.lang === 'en' ? 'That name is not allowed. Try another one.' : 'Ese nombre no está permitido. Prueba otro.')
          : (App.lang === 'en' ? 'Name too long.' : 'El nombre es demasiado largo.');
        if (okBtn) okBtn.setAttribute('disabled', 'disabled');
      } else {
        err.textContent = '';
        if (okBtn) okBtn.removeAttribute('disabled');
      }
    }
    function type(c) {
      if (App.g.name.length >= 24) return;
      App.g.name += c; paint();
    }

    s.body.appendChild(h('div', { class: 'namebox' }, [val, count]));
    s.body.appendChild(err);

    var kb = h('div', { class: 'kb' });
    ROWS.forEach(function (row) {
      var r = h('div', { class: 'kbrow' });
      row.split('').forEach(function (c) {
        r.appendChild(h('button', { class: 'key', text: c, onclick: function () { type(c); } }));
      });
      kb.appendChild(r);
    });
    kb.appendChild(h('div', { class: 'kbrow' }, [
      h('button', {
        class: 'key wide', text: '⌫', onclick: function () {
          App.g.name = App.g.name.slice(0, -1); paint();
        }
      }),
      h('button', { class: 'key', style: 'flex:4', text: '␣', onclick: function () { type(' '); } }),
      h('button', {
        class: 'key wide act', text: App.lang === 'en' ? 'Clear' : 'Borrar',
        onclick: function () { App.g.name = ''; paint(); }
      })
    ]));
    s.body.appendChild(kb);

    var sug = h('div', { class: 'suggest' });
    App._nameSalt = App._nameSalt || 0;
    function refillSuggestions() {
      App.clear(sug);
      /* Se cambia la sal, nunca g.seed: la semilla ya definió la flor que el
         visitante acaba de ver y moverla la redibujaría distinta. */
      App._nameSalt++;
      G.suggestNames(App.g, 3, App._nameSalt).forEach(function (n) {
        sug.appendChild(h('button', {
          class: 'btn', text: n, onclick: function () { App.g.name = n; paint(); }
        }));
      });
      sug.appendChild(h('button', {
        class: 'btn ghost', text: '⟳', title: App.lang === 'en' ? 'More names' : 'Más nombres',
        onclick: refillSuggestions
      }));
    }
    refillSuggestions();
    s.body.appendChild(sug);

    onNext(s, function () {
      if (!App.g.name) {
        var auto = G.suggestNames(App.g, 1)[0];
        App.g.name = auto || 'Bloom Lab';
      }
      if (!G.checkName(App.g.name).ok) { App.track('name:blocked'); return; }
      App.track('name:ok');
      App.next();
    });
    paint();
  };

  /* -----------------------------------------------------------------
     Lámina fotográfica. La imagen generada se rotula siempre y no ofrece
     ningún control de giro: no se puede confundir con el modelo 3D.
     ----------------------------------------------------------------- */
  function photoPlate(box, g, on3D, subject) {
    if (!root.AI) return;
    var en = App.lang === 'en';

    function mount(src) {
      if (!src || !box.isConnected) return;
      /* El lienzo 3D de la revelación lo crea el renderizador de forma
         asíncrona, así que no existe todavía cuando se arma esta lámina:
         se resuelve al montar, no antes. */
      if (!on3D) on3D = box.querySelector('canvas');
      var img = h('img', { src: src, alt: en ? 'Photographic render' : 'Render fotográfico',
        style: 'width:100%;height:100%;object-fit:cover;display:block' });
      var plate = h('div', { class: 'plate' }, [
        img, h('span', { class: 'plate-tag', text: en ? 'Photographic render' : 'Render fotográfico' })
      ]);
      var showing = 'photo';
      var swap = h('button', {
        class: 'plate-swap', text: en ? '3D model' : 'Modelo 3D',
        onclick: function (e) {
          showing = showing === 'photo' ? 'model' : 'photo';
          plate.style.display = showing === 'photo' ? '' : 'none';
          if (on3D) on3D.style.display = showing === 'photo' ? 'none' : '';
          e.currentTarget.textContent = showing === 'photo'
            ? (en ? '3D model' : 'Modelo 3D') : (en ? 'Photo' : 'Foto');
        }
      });
      if (on3D) on3D.style.display = 'none';
      box.appendChild(plate);
      box.appendChild(swap);
    }

    /* El montaje se aplaza siempre: cuando la imagen ya está en caché,
       photoPlate corre antes de que su contenedor entre en el documento. */
    var hit = root.AI.cached(g, subject);
    if (hit) { App.defer(function () { mount(hit); }); return; }
    var p = root.AI.pending(g, subject);
    if (p) p.then(function (src) { App.defer(function () { mount(src); }); });
  }

  /* =================================================================
     13 · Pasaporte
     ================================================================= */
  function specRow(k, v) {
    return h('div', { class: 'spec' }, [h('span', { class: 'k', text: k }), h('span', { class: 'v', text: v })]);
  }

  App.buildPassport = function (compact) {
    var g = App.g, sc = G.scores(g);
    var en = App.lang === 'en';
    var card = h('div', { class: 'pcard' }, [
      h('div', { class: 'phead' }, [
        h('div', { style: 'display:flex;align-items:baseline;gap:calc(var(--s)*.7);min-width:0' }, [
          App.logo('sm', true),
          h('div', { class: 'pname', text: g.name || '—' })
        ]),
        h('div', { class: 'pid', text: 'Bloom Lab · ' + CFG.eventName })
      ])
    ]);
    var imgs = h('div', { class: 'pbody' });
    ['flower', 'bouquet'].forEach(function (k) {
      var box = h('div', { class: 'pimg' });
      if (App.shots[k]) box.appendChild(h('img', { src: App.shots[k], alt: k }));
      else {
        var cv = h('canvas');
        box.appendChild(cv);
        App.defer(function () { T.fallbackScene(cv, g, k); });
      }
      imgs.appendChild(box);
    });
    card.appendChild(imgs);

    card.appendChild(h('div', { class: 'specs' }, [
      specRow(en ? 'Family' : 'Familia', App.lb(g.family)),
      specRow(en ? 'Class' : 'Clase', App.ncs(g.family)),
      specRow(en ? 'Main shape' : 'Forma principal', App.lb(g.shape)),
      specRow(en ? 'Petal' : 'Pétalo', App.lb(g.petalShape)),
      specRow(en ? 'Arrangement' : 'Disposición', App.lb(g.arrangement)),
      specRow(en ? 'Diameter' : 'Diámetro', App.lb(g.diameter) + ' · ' + G.DIAMETER_CM[g.diameter] + ' cm'),
      specRow(en ? 'Density' : 'Densidad', Math.round(g.density * 100) + '% · ' + g.layers + ' ' + (en ? 'layers' : 'capas')),
      specRow(en ? 'Growth' : 'Crecimiento', App.lb(g.growth) + (g.flowersPerStem > 1 ? ' · ' + g.flowersPerStem : '')),
      specRow(en ? 'Pattern' : 'Patrón', App.lb(g.pattern)),
      specRow(en ? 'Creative mode' : 'Modo creativo', App.lb(g.mode)),
      specRow(en ? 'Personality' : 'Personalidad',
        g.personality.length ? g.personality.map(App.lb).join(' · ') : '—')
    ]));

    var pal = h('div', { class: 'palette-row' });
    ['primary', 'secondary', 'center', 'tip', 'reverse'].forEach(function (k) {
      pal.appendChild(h('span', { style: 'background:' + G.hex(g.colors[k]), title: App.t('slot_' + k) }));
    });
    card.appendChild(pal);

    if (!compact) {
      card.appendChild(h('div', { class: 'meters' }, [
        meter(en ? 'Novelty' : 'Novedad', sc.novelty, '',
          en ? 'How different it is from conventional combinations.' : 'Qué tan distinta es frente a combinaciones convencionales.'),
        meter(en ? 'Visual harmony' : 'Armonía visual', sc.harmony, 'alt',
          en ? 'Balance of colour, form and proportion.' : 'Equilibrio de color, forma y proporción.'),
        meter(en ? 'Hybridisation challenge' : 'Desafío de hibridación', sc.challenge, 'alt2',
          en ? 'How complex a similar flower could be, conceptually.' : 'Qué tan compleja sería una flor similar, conceptualmente.')
      ]));
      card.appendChild(h('div', {
        class: 'disclaimer',
        text: en
          ? 'Playful indicators, not a scientific assessment. Bloom Lab is a digital creation inspired by plant breeding; it does not predict genetic viability.'
          : 'Indicadores lúdicos, no una evaluación científica. Bloom Lab es una creación digital inspirada en el mejoramiento vegetal; no predice viabilidad genética.'
      }));
    }
    return card;
  };

  function meter(name, v, cls, note) {
    var bar = h('i', { class: cls, style: 'width:0' });
    App.defer(function () { setTimeout(function () { bar.style.width = v + '%'; }, 60); });
    return h('div', { class: 'meter' }, [
      h('div', { class: 'mhead' }, [h('span', { class: 'mname', text: name }), h('span', { class: 'mval', text: v })]),
      h('div', { class: 'mbar' }, bar),
      h('div', { class: 'mnote', text: note })
    ]);
  }

  App.screens.passport = function (app) {
    var s = App.shell(app, { stage: false, title: '' });
    var panel = s.body.parentNode;
    panel.parentNode.removeChild(panel);
    App.track('passport');

    var body = App.$('.body');
    var grid = h('div', { class: 'passport' });
    grid.appendChild(App.buildPassport(false));

    var side = h('div', { class: 'pcard' }, [
      h('div', { class: 'phead' }, [
        h('div', { class: 'pname', text: App.lang === 'en' ? 'Your bouquet' : 'Tu ramo' }),
        h('div', { class: 'pid', text: new Date().toLocaleDateString() })
      ])
    ]);
    var big = h('div', { class: 'pimg', style: 'flex:1;min-height:0;position:relative' });
    var model3d;
    if (App.shots.bouquet) { model3d = h('img', { src: App.shots.bouquet, alt: '' }); big.appendChild(model3d); }
    else {
      var cv = h('canvas'); model3d = cv; big.appendChild(cv);
      App.defer(function () { T.fallbackScene(cv, App.g, 'bouquet'); });
    }
    photoPlate(big, App.g, model3d, 'bouquet');
    side.appendChild(h('div', { class: 'pbody', style: 'flex:1' }, big));
    side.appendChild(h('div', { class: 'specs' }, [
      specRow(App.lang === 'en' ? 'Bouquet style' : 'Estilo del ramo', App.lb(App.g.bouquet.style)),
      specRow(App.lang === 'en' ? 'Stems' : 'Tallos', App.lb(App.g.bouquet.abundance)),
      specRow(App.lang === 'en' ? 'Extras' : 'Complementos', App.lb(App.g.bouquet.extras)),
      specRow(App.lang === 'en' ? 'Wrapping' : 'Envoltura', App.lb(App.g.bouquet.wrap))
    ]));
    grid.appendChild(side);
    body.appendChild(grid);
  };

  /* =================================================================
     14 · Compartir
     ================================================================= */
  App.shareURL = function () {
    var base = CFG.shareBase || (location.origin + location.pathname);
    return base + '#g=' + G.encode(App.g);
  };

  App.screens.share = function (app) {
    var s = App.shell(app, { stage: false, title: '' });
    var panel = s.body.parentNode;
    panel.parentNode.removeChild(panel);
    App.track('share');

    var url = App.shareURL();
    var body = App.$('.body');
    var qcv = h('canvas');
    var box = h('div', {}, [
      h('div', { class: 'qrbox' }, qcv),
      h('div', { class: 'qrlink', text: url })
    ]);

    App.defer(function () {
      var ok = QR.toCanvas(qcv, url, { size: 340, dark: '#241A1F', light: '#FFFFFF' });
      if (!ok) {
        box.replaceChild(h('div', {
          class: 'qrbox', style: 'padding:2rem;max-width:340px',
          text: App.lang === 'en' ? 'Link too long for a QR code. Use the address below.'
                                  : 'El enlace es muy largo para un código QR. Usa la dirección de abajo.'
        }), box.firstChild);
      }
    });

    var en = App.lang === 'en';
    var right = h('div', {}, [
      h('h2', {
        style: 'font-family:var(--f-display);font-weight:400;font-size:calc(var(--s)*3.4);margin:0 0 calc(var(--s)*.6)',
        text: en ? 'Take your flower with you' : 'Llévate tu flor'
      }),
      h('p', {
        style: 'font-size:calc(var(--s)*1.2);color:var(--ink-dim);max-width:44ch;line-height:1.5',
        text: en ? 'Scan the code with your phone. The whole variety travels inside the link — no account, no data stored.'
                 : 'Escanea el código con tu teléfono. La variedad completa viaja dentro del enlace: sin cuenta y sin guardar datos.'
      }),
      h('div', { class: 'row', style: 'display:flex;gap:calc(var(--s)*.8);margin:calc(var(--s)*1.4) 0;flex-wrap:wrap' }, [
        /* El primero usa la hoja nativa de compartir cuando existe: en el
           móvil es el gesto que el visitante espera. Los demás descargan. */
        h('button', { class: 'btn primary', text: en ? 'Save or share' : 'Guardar o compartir', onclick: function () { download('square', true); } }),
        h('button', { class: 'btn', text: en ? 'Story · 1080×1920' : 'Historia · 1080×1920', onclick: function () { download('story'); } }),
        h('button', { class: 'btn', text: 'HD · 1920×1080', onclick: function () { download('hd'); } }),
        h('button', { class: 'btn', text: en ? 'Variety passport' : 'Pasaporte de variedad', onclick: function () { download('passport'); } })
      ]),
      CFG.galleryOn ? h('button', {
        class: 'consent', 'aria-pressed': String(!!App.consent),
        onclick: function (e) {
          App.consent = !App.consent;
          e.currentTarget.setAttribute('aria-pressed', String(App.consent));
          if (App.consent) saveToGallery(); else removeFromGallery();
        }
      }, [
        h('span', { class: 'box', text: '✓' }),
        h('span', { class: 'ctext' }, [
          h('b', { text: en ? 'Show it in the event gallery' : 'Mostrarla en la galería del evento' }),
          document.createTextNode(en
            ? 'Only the flower and its name are stored on this computer, and only while the event lasts. Optional — you can continue without it.'
            : 'Sólo se guardan la flor y su nombre, en este computador y mientras dure el evento. Es opcional: puedes continuar sin activarlo.')
        ])
      ]) : null
    ]);

    body.appendChild(h('div', { class: 'share' }, [box, right]));
  };

  function saveToGallery() {
    try {
      var k = 'bloomlab.gallery';
      var arr = JSON.parse(localStorage.getItem(k) || '[]');
      arr = arr.filter(function (x) { return x.code !== G.encode(App.g); });
      arr.unshift({ code: G.encode(App.g), name: App.g.name, ts: Date.now(), hidden: false });
      localStorage.setItem(k, JSON.stringify(arr.slice(0, 400)));
      App.track('gallery:consent');
      App.toast(App.lang === 'en' ? 'Added to the gallery' : 'Añadida a la galería');
    } catch (e) {}
  }
  function removeFromGallery() {
    try {
      var k = 'bloomlab.gallery', code = G.encode(App.g);
      var arr = JSON.parse(localStorage.getItem(k) || '[]').filter(function (x) { return x.code !== code; });
      localStorage.setItem(k, JSON.stringify(arr));
    } catch (e) {}
  }

  /* -----------------------------------------------------------------
     Composición descargable

     Cuatro formatos porque el visitante hace cosas distintas con cada uno:
     cuadrada para el feed, historia para el vertical del móvil, HD para
     pantalla o correo, y pasaporte como ficha completa de la variedad.

     La descarga va por Blob y no por toDataURL: una data URL de 2-3 MB
     supera el límite de longitud de URL de varios navegadores móviles y
     falla en silencio, que es la peor forma de fallar en un evento.
     ----------------------------------------------------------------- */
  var EXPORT_SPEC = {
    square:   { w: 1080, h: 1080, imgY: 120, imgH: 640 },
    story:    { w: 1080, h: 1920, imgY: 120, imgH: 1080 },
    hd:       { w: 1920, h: 1080, imgY: 110, imgH: 660 },
    /* La lámina del pasaporte es más baja que la de los otros formatos
       porque debajo tiene que caber la ficha completa: título de sección,
       nueve atributos en dos columnas, los tres indicadores y el pie. Con
       930 px de imagen las barras se montaban encima de la tabla. */
    passport: { w: 1600, h: 2000, imgY: 130, imgH: 820 }
  };

  function safeName(s) {
    var base = String(s || 'flor');
    try { base = base.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) {}
    return base.replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '') || 'flor';
  }

  function canvasBlob(cv) {
    return new Promise(function (res, rej) {
      if (cv.toBlob) {
        cv.toBlob(function (b) { b ? res(b) : rej(new Error('sin blob')); }, 'image/png');
        return;
      }
      /* Respaldo para navegadores sin toBlob: se reconstruye desde la data
         URL. Más lento y con más memoria, pero sólo entra en ese caso. */
      try {
        var bin = atob(cv.toDataURL('image/png').split(',')[1]);
        var arr = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        res(new Blob([arr], { type: 'image/png' }));
      } catch (e) { rej(e); }
    });
  }

  function saveBlob(blob, name) {
    var url = URL.createObjectURL(blob);
    var a = h('a', { href: url, download: name, rel: 'noopener' });
    document.body.appendChild(a);
    try { a.click(); } catch (e) { window.open(url, '_blank', 'noopener'); }
    a.remove();
    /* La URL se libera tarde: revocarla de inmediato cancela la descarga en
       los navegadores que la resuelven de forma asíncrona. */
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  function wrapText(ctx, text, x, y, maxW, lh, maxLines) {
    var words = String(text).split(/\s+/), line = '', lines = [];
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = words[i]; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, maxLines || 99).forEach(function (l, j) { ctx.fillText(l, x, y + j * lh); });
  }

  function download(fmt, share) {
    var spec = EXPORT_SPEC[fmt] || EXPORT_SPEC.square;
    var W = spec.w, H = spec.h;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d');
    var g = App.g, sc = G.scores(g);

    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#F5F1EE'); grad.addColorStop(1, '#E4DAD4');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#7C214D'; ctx.fillRect(0, 0, W, 12);

    var imgY = spec.imgY, imgH = spec.imgH;
    var pad = fmt === 'passport' ? 90 : 60;
    var en = App.lang === 'en';

    function finish(img) {
      if (img) {
        var r = Math.max(W / img.width, imgH / img.height);
        var iw = img.width * r, ih = img.height * r;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, imgY, W, imgH); ctx.clip();
        ctx.drawImage(img, (W - iw) / 2, imgY + (imgH - ih) / 2, iw, ih);
        ctx.restore();
      }
      ctx.fillStyle = '#7C214D';
      ctx.font = '600 34px "Segoe UI", sans-serif';
      ctx.fillText('DELIFLOR BLOOM LAB', pad, 82);

      var y = imgY + imgH + 90;
      ctx.fillStyle = '#241A1F';
      ctx.font = '400 ' + (fmt === 'passport' ? 86 : 78) + 'px Georgia, serif';
      ctx.fillText(g.name || '—', pad, y);
      y += 56;
      ctx.fillStyle = '#6D5A62';
      ctx.font = '400 32px "Segoe UI", sans-serif';
      /* La clase NCS acompaña siempre al nombre de familia: es la que
         convierte "Decorativa" en un dato botánico verificable. */
      wrapText(ctx, App.lb(g.family) + ' · ' + App.ncs(g.family) + ' · ' +
               App.lb(g.petalShape) + ' · ' + App.lb(g.diameter),
               pad, y, W - pad * 2, 40, 2);

      y += 70;
      ['primary', 'secondary', 'center', 'tip', 'reverse'].forEach(function (k, i) {
        ctx.fillStyle = G.hex(g.colors[k]);
        ctx.fillRect(pad + i * 92, y, 80, 80);
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.strokeRect(pad + i * 92, y, 80, 80);
      });

      function bars(bx, by, barW) {
        [[en ? 'Novelty' : 'Novedad', sc.novelty, '#7C214D'],
         [en ? 'Harmony' : 'Armonía', sc.harmony, '#6F7D4C'],
         [en ? 'Challenge' : 'Desafío', sc.challenge, '#9C3071']].forEach(function (l, i) {
          var yy = by + i * 74;
          ctx.fillStyle = '#241A1F'; ctx.font = '600 30px "Segoe UI", sans-serif';
          ctx.fillText(l[0], bx, yy);
          ctx.fillStyle = '#ECE5E1'; ctx.fillRect(bx + 260, yy - 22, barW, 22);
          ctx.fillStyle = l[2]; ctx.fillRect(bx + 260, yy - 22, barW * l[1] / 100, 22);
          ctx.fillStyle = '#7C214D'; ctx.font = '600 28px monospace';
          ctx.fillText(String(l[1]), bx + 260 + barW + 20, yy);
        });
      }

      if (fmt === 'story') bars(pad, y + 150, 620);

      if (fmt === 'passport') {
        /* Ficha completa: dos columnas de atributos, los tres indicadores y
           el QR que reabre exactamente este genoma. */
        var x1 = pad, x2 = W / 2 + 20, ry = y + 150;
        ctx.fillStyle = '#7C214D'; ctx.font = '700 30px "Segoe UI", sans-serif';
        ctx.fillText(en ? 'VARIETY PASSPORT' : 'PASAPORTE DE VARIEDAD', x1, ry);
        var rows = [
          [en ? 'Family' : 'Familia', App.lb(g.family)],
          [en ? 'Class' : 'Clase', App.ncs(g.family)],
          [en ? 'Shape' : 'Forma', App.lb(g.shape)],
          [en ? 'Petal' : 'Pétalo', App.lb(g.petalShape)],
          [en ? 'Arrangement' : 'Disposición', App.lb(g.arrangement)],
          [en ? 'Pattern' : 'Patrón', App.lb(g.pattern)],
          [en ? 'Diameter' : 'Diámetro', App.lb(g.diameter) + ' · ' + G.DIAMETER_CM[g.diameter] + ' cm'],
          [en ? 'Density' : 'Densidad', Math.round(g.density * 100) + '% · ' + g.layers + (en ? ' layers' : ' capas')],
          [en ? 'Growth' : 'Crecimiento', App.lb(g.growth)]
        ];
        var half = Math.ceil(rows.length / 2);
        rows.forEach(function (r, i) {
          var xx = i < half ? x1 : x2, yy = ry + 66 + (i < half ? i : i - half) * 62;
          ctx.fillStyle = '#9C8A92'; ctx.font = '700 18px monospace';
          ctx.fillText(String(r[0]).toUpperCase(), xx, yy);
          ctx.fillStyle = '#241A1F'; ctx.font = '400 27px "Segoe UI", sans-serif';
          ctx.fillText(r[1], xx, yy + 30);
        });
        /* Las barras arrancan bajo la última fila de la tabla, calculado a
           partir de ella y no con una constante: así siguen encajando si
           mañana cambia el número de atributos. */
        var rowsEnd = ry + 66 + (half - 1) * 62 + 30;
        var q = document.createElement('canvas');
        var hasQR = QR && QR.toCanvas && QR.toCanvas(q, App.shareURL(), { size: 320, quiet: 4 });
        bars(x1, rowsEnd + 78, 520);
        if (hasQR) {
          ctx.fillStyle = '#fff';
          ctx.fillRect(W - 370, rowsEnd + 30, 290, 290);
          ctx.drawImage(q, W - 360, rowsEnd + 40, 270, 270);
        }
      }

      ctx.fillStyle = '#9C8A92'; ctx.font = '400 24px monospace';
      ctx.fillText(CFG.eventName, pad, H - 46);

      var name = safeName(g.name) + '_DELIFLOR_' + fmt + '.png';
      return canvasBlob(cv).then(function (blob) {
        App.track('download:' + fmt);
        /* En el móvil, la hoja nativa de compartir es lo que el visitante
           espera: manda a WhatsApp o Instagram sin pasar por la galería. */
        if (share && navigator.share && navigator.canShare) {
          try {
            var file = new File([blob], name, { type: 'image/png' });
            if (navigator.canShare({ files: [file] })) {
              return navigator.share({ title: g.name || 'Deliflor Bloom Lab', files: [file] })
                .catch(function () { saveBlob(blob, name); });
            }
          } catch (e) { /* sin File(): se descarga */ }
        }
        saveBlob(blob, name);
      }).catch(function () {
        App.toast(en ? 'Could not export the image' : 'No se pudo exportar la imagen');
      });
    }

    /* Si el visitante llega aquí sin captura previa (por ejemplo entrando
       desde un enlace compartido, donde nunca pasó por la revelación), se
       dibuja la flor con el trazador 2D. Sin este respaldo la lámina salía
       con un hueco en blanco donde debería estar su flor. */
    function fallbackShot() {
      try {
        var t = document.createElement('canvas');
        t.width = t.height = 1000;
        t.style.width = t.style.height = '1000px';
        T.flower(t, g, { scale: 0.44 });
        return t.toDataURL('image/png');
      } catch (e) { return null; }
    }

    var src = App.shots.bouquet || App.shots.flower || fallbackShot();
    if (src) { var im = new Image(); im.onload = function () { finish(im); }; im.onerror = function () { finish(null); }; im.src = src; }
    else finish(null);
  }

  /* =================================================================
     15 · Cierre
     ================================================================= */
  App.screens.end = function (app) {
    App.track('complete');
    if (App.startedAt) App.track('duration:' + Math.round((Date.now() - App.startedAt) / 15000) * 15 + 's');
    var en = App.lang === 'en';
    var wrap = h('div', { class: 'full center screen', style: 'background:var(--wine);color:#fff' }, [
      h('div', { style: 'text-align:center;padding:calc(var(--s)*3)' }, [
        h('div', {
          style: 'font-family:var(--f-display);font-size:calc(var(--s)*4.6);line-height:1.15;max-width:22ch;margin:0 auto',
          text: en ? 'Thank you for imagining the future of flowers with Deliflor'
                   : 'Gracias por imaginar el futuro de las flores con Deliflor'
        }),
        /* La marca cierra la experiencia: es lo último que se lleva el visitante */
        h('div', { style: 'display:flex;justify-content:center;margin-top:calc(var(--s)*2.2)' }, App.logo('md')),
        h('div', {
          style: 'font-family:var(--f-display);font-style:italic;font-size:calc(var(--s)*2.4);opacity:.85;margin-top:calc(var(--s)*1.4)',
          text: App.g.name || ''
        }),
        h('div', { style: 'display:flex;gap:calc(var(--s)*1);justify-content:center;margin-top:calc(var(--s)*3.4);flex-wrap:wrap' }, [
          h('button', {
            class: 'btn big', style: 'background:#fff;color:var(--wine);border-color:#fff',
            text: en ? 'Create another' : 'Crear otra flor',
            onclick: function () { App.g = G.base(); App.shots = {}; App.consent = false; App.go('mode'); }
          }),
          CFG.galleryOn ? h('button', {
            class: 'btn big', style: 'background:transparent;color:#fff;border-color:rgba(255,255,255,.5)',
            text: en ? 'See the gallery' : 'Ver galería',
            onclick: function () { App.openGallery(); }
          }) : null,
          h('button', {
            class: 'btn big', style: 'background:transparent;color:#fff;border-color:rgba(255,255,255,.5)',
            text: en ? 'Finish' : 'Finalizar',
            onclick: function () { App.endSession(); }
          })
        ])
      ])
    ]);
    app.appendChild(wrap);
    App.poke();
  };

  /* =================================================================
     Galería del evento
     ================================================================= */
  App.openGallery = function () {
    var app = App.$('#app');
    App.clear(app);
    var en = App.lang === 'en';
    app.appendChild(h('div', { class: 'topbar' }, [
      h('div', { class: 'brand' }, [
        App.logo('sm'),
        h('span', { class: 'sub', text: (en ? 'Gallery' : 'Galería') + ' · ' + CFG.eventName })
      ]),
      h('div', { class: 'progress' }),
      h('button', { class: 'icon-btn', text: en ? 'Close' : 'Cerrar', onclick: function () { App.go('attract'); } })
    ]));

    var arr = [];
    try { arr = JSON.parse(localStorage.getItem('bloomlab.gallery') || '[]'); } catch (e) {}
    arr = arr.filter(function (x) { return !x.hidden; });

    var grid = h('div', { class: 'gallery screen' });
    if (!arr.length) {
      grid.appendChild(h('div', {
        class: 'empty-note',
        text: en ? 'No flowers have been shared yet. Yours could be the first.'
                 : 'Todavía no hay flores compartidas. La tuya puede ser la primera.'
      }));
    }
    arr.slice(0, 60).forEach(function (item) {
      var g = G.decode(item.code);
      if (!g) return;
      var cv = h('canvas');
      grid.appendChild(h('button', {
        class: 'gitem', onclick: function () { App.g = g; App.shots = {}; App.go('passport'); }
      }, [cv, h('div', { class: 'gname', text: item.name || '—' })]));
      App.defer(function () { T.flower(cv, g, { scale: 0.45, cheap: true }); });
    });
    app.appendChild(grid);
    App.poke();
  };

  /* =================================================================
     Panel administrativo
     ================================================================= */
  App.openAdmin = function () {
    var pin = '';
    var app = App.$('#app');
    App.clear(app);
    var pad = h('div', { class: 'pinpad' });
    var view = h('div', { class: 'val', style: 'font-family:var(--f-mono);font-size:calc(var(--s)*2.4);text-align:center' });
    '123456789'.split('').forEach(function (d) {
      pad.appendChild(h('button', { class: 'key', text: d, onclick: function () { add(d); } }));
    });
    pad.appendChild(h('button', { class: 'key', text: '⌫', onclick: function () { pin = pin.slice(0, -1); view.textContent = pin.replace(/./g, '•'); } }));
    pad.appendChild(h('button', { class: 'key', text: '0', onclick: function () { add('0'); } }));
    pad.appendChild(h('button', { class: 'key act', text: '✓', onclick: check }));
    function add(d) { if (pin.length < 8) { pin += d; view.textContent = pin.replace(/./g, '•'); } }
    function check() { if (pin === CFG.adminPin) adminPanel(); else { pin = ''; view.textContent = ''; App.toast('PIN'); } }

    app.appendChild(h('div', { class: 'full center' }, [
      h('div', { style: 'text-align:center' }, [
        h('h2', { style: 'font-family:var(--f-display);font-weight:400', text: 'Bloom Lab · Panel' }),
        view, pad,
        h('button', { class: 'btn ghost', style: 'margin-top:calc(var(--s)*1.5)', text: 'Salir', onclick: function () { App.go('attract'); } })
      ])
    ]));
  };

  function adminPanel() {
    var app = App.$('#app');
    App.clear(app);
    var m = App.metrics();
    var gal = [];
    try { gal = JSON.parse(localStorage.getItem('bloomlab.gallery') || '[]'); } catch (e) {}

    app.appendChild(h('div', { class: 'topbar' }, [
      h('div', { class: 'brand' }, [App.logo('sm'), h('span', { class: 'sub', text: 'Panel · ' + CFG.eventId })]),
      h('div', { class: 'progress' }),
      h('button', { class: 'icon-btn', text: 'Cerrar', onclick: function () { App.go('attract'); } })
    ]));

    var wrap = h('div', { class: 'admin' });

    wrap.appendChild(h('h3', { text: 'Métricas de la sesión' }));
    var tbl = h('table');
    var keys = Object.keys(m).sort();
    var totals = { sesiones: m['session'] || 0, terminadas: m['complete'] || 0, QR: m['share'] || 0, galería: gal.length };
    Object.keys(totals).forEach(function (k) {
      tbl.appendChild(h('tr', {}, [h('td', { text: k }), h('td', { text: String(totals[k]) })]));
    });
    keys.forEach(function (k) {
      if (['session', 'complete', 'share'].indexOf(k) !== -1) return;
      tbl.appendChild(h('tr', {}, [h('td', { text: k }), h('td', { text: String(m[k]) })]));
    });
    wrap.appendChild(tbl);

    wrap.appendChild(h('h3', { text: 'Operación' }));
    wrap.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn', text: 'Exportar CSV', onclick: exportCSV }),
      h('button', {
        class: 'btn', text: 'Modo demostración', onclick: function () {
          App.g = G.randomize(G.base()); App.g.name = 'Demo Bloom'; App.go('reveal');
        }
      }),
      h('button', {
        class: 'btn', text: CFG.galleryOn ? 'Galería: activa' : 'Galería: inactiva',
        onclick: function (e) { CFG.galleryOn = !CFG.galleryOn; e.currentTarget.textContent = CFG.galleryOn ? 'Galería: activa' : 'Galería: inactiva'; }
      }),
      h('button', {
        class: 'btn', text: 'Limpiar sesiones', onclick: function () {
          if (!confirm('¿Borrar métricas y galería de este equipo?')) return;
          localStorage.removeItem('bloomlab.metrics');
          localStorage.removeItem('bloomlab.gallery');
          adminPanel();
        }
      })
    ]));

    wrap.appendChild(h('h3', { text: 'Creaciones autorizadas (' + gal.length + ')' }));
    var list = h('div', { class: 'row' });
    gal.slice(0, 40).forEach(function (item, i) {
      list.appendChild(h('button', {
        class: 'btn' + (item.hidden ? ' ghost' : ''),
        text: (item.hidden ? '🚫 ' : '') + (item.name || '—'),
        title: 'Ocultar / mostrar',
        onclick: function (e) {
          gal[i].hidden = !gal[i].hidden;
          localStorage.setItem('bloomlab.gallery', JSON.stringify(gal));
          e.currentTarget.textContent = (gal[i].hidden ? '🚫 ' : '') + (item.name || '—');
        }
      }));
    });
    wrap.appendChild(list);

    /* ---- Render fotorrealista ---- */
    if (root.AI) {
      var ai = root.AI.cfg();
      wrap.appendChild(h('h3', { text: 'Render fotorrealista (opcional)' }));
      wrap.appendChild(h('div', {
        class: 'row',
        text: 'Estado: ' + (root.AI.available() ? 'activo' : 'inactivo') +
              ' · generadas hoy: ' + ai.spent + '/' + ai.dailyCap +
              ' · aciertos: ' + root.AI.state.ok + ' · fallos: ' + root.AI.state.fail +
              (root.AI.state.lastError ? ' · último fallo: ' + root.AI.state.lastError : '')
      }));

      var fields = h('div', { class: 'row' });
      function field(label, key, type, width) {
        var inp = h('input', {
          type: type || 'text', value: ai[key] === undefined ? '' : String(ai[key]),
          placeholder: label,
          style: 'font:inherit;font-size:calc(var(--s)*1);padding:calc(var(--s)*.6) calc(var(--s)*.9);' +
                 'border:1px solid var(--wine-line);border-radius:calc(var(--s)*.5);width:' + (width || '22ch'),
          onchange: function (e) {
            var v = e.target.value;
            if (type === 'number') v = parseInt(v, 10) || 0;
            var patch = {}; patch[key] = v; root.AI.set(patch);
          }
        });
        fields.appendChild(h('label', { style: 'display:flex;flex-direction:column;gap:calc(var(--s)*.2)' }, [
          h('span', { style: 'font-family:var(--f-mono);font-size:calc(var(--s)*.72);letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint)', text: label }),
          inp
        ]));
      }
      field('Dirección del servicio', 'endpoint', 'text', '34ch');
      field('Modelo', 'model', 'text', '16ch');
      field('Tamaño', 'size', 'text', '12ch');
      field('Calidad (low/medium/high)', 'quality', 'text', '10ch');
      field('Tope diario', 'dailyCap', 'number', '8ch');
      wrap.appendChild(fields);

      var aiRow = h('div', { class: 'row' });
      aiRow.appendChild(h('button', {
        class: 'btn', text: ai.enabled ? 'IA: activada' : 'IA: desactivada',
        onclick: function (e) {
          var n = !root.AI.cfg().enabled; root.AI.set({ enabled: n });
          e.currentTarget.textContent = n ? 'IA: activada' : 'IA: desactivada';
        }
      }));
      aiRow.appendChild(h('button', {
        class: 'btn', text: 'Modo: ' + ai.mode,
        onclick: function (e) {
          var n = root.AI.cfg().mode === 'proxy' ? 'direct' : 'proxy';
          root.AI.set({ mode: n }); e.currentTarget.textContent = 'Modo: ' + n;
        }
      }));
      var testOut = h('span', { style: 'align-self:center;color:var(--ink-dim);font-size:calc(var(--s)*1)' });
      aiRow.appendChild(h('button', {
        class: 'btn', text: 'Probar conexión',
        onclick: function () {
          testOut.textContent = 'probando…';
          root.AI.test().then(function (r) { testOut.textContent = (r.ok ? '✓ ' : '✕ ') + r.msg; });
        }
      }));
      aiRow.appendChild(h('button', {
        class: 'btn', text: 'Vaciar caché de imágenes',
        onclick: function () { root.AI.clearCache(); App.toast('Caché vaciada'); }
      }));
      aiRow.appendChild(testOut);
      wrap.appendChild(aiRow);
      wrap.appendChild(h('div', {
        class: 'row',
        style: 'color:var(--ink-faint);font-size:calc(var(--s)*.95);max-width:70ch;line-height:1.5',
        text: 'En modo «proxy» la dirección apunta al worker de Cloudflare y la clave del ' +
              'proveedor vive allí como secreto, nunca en este equipo. El modo «direct» ' +
              'exige guardar la clave en este navegador y sólo debería usarse en pruebas. ' +
              'Si el servicio tarda más de ' + (root.AI.BUDGET_MS / 1000) + ' segundos, la ' +
              'petición se abandona y el visitante se queda con el modelo 3D sin enterarse.'
      }));
    }

    wrap.appendChild(h('h3', { text: 'Motor' }));
    wrap.appendChild(h('div', {
      class: 'row',
      text: 'Render: ' + (App.webgl ? 'WebGL activo' : 'respaldo 2D') +
            ' · Idioma: ' + App.lang + ' · Evento: ' + CFG.eventName
    }));

    app.appendChild(wrap);

    function exportCSV() {
      var rows = [['clave', 'valor']];
      Object.keys(m).forEach(function (k) { rows.push([k, m[k]]); });
      rows.push([]); rows.push(['nombre', 'fecha', 'genoma']);
      gal.forEach(function (x) { rows.push([x.name, new Date(x.ts).toISOString(), x.code]); });
      var csv = rows.map(function (r) {
        return r.map(function (c) { return '"' + String(c === undefined ? '' : c).replace(/"/g, '""') + '"'; }).join(',');
      }).join('\n');
      var a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
      a.download = 'bloomlab-' + CFG.eventId + '.csv';
      a.click();
    }
  }

  /* =================================================================
     Vista de la creación compartida (teléfono)
     ================================================================= */
  App.showShared = function () {
    var app = App.$('#app');
    App.clear(app);
    app.style.overflow = 'auto';
    var g = App.g, en = (navigator.language || 'es').slice(0, 2) === 'en';
    App.lang = en ? 'en' : 'es';

    var cv = h('canvas', { style: 'width:100%;aspect-ratio:1;display:block;border-radius:calc(var(--s)*1.2)' });
    var cv2 = h('canvas', { style: 'width:100%;aspect-ratio:4/5;display:block;border-radius:calc(var(--s)*1.2)' });

    var wrap = h('div', { class: 'mobile screen' }, [
      App.logo('md'),
      h('h1', {
        style: 'font-family:var(--f-display);font-weight:400;font-size:calc(var(--s)*6);margin:calc(var(--s)*.6) 0 calc(var(--s)*1.4);line-height:1.05',
        text: g.name || '—'
      }),
      cv2, h('div', { style: 'height:calc(var(--s)*1.4)' }), cv
    ]);
    app.appendChild(wrap);

    App.defer(function () {
      T.fallbackScene(cv2, g, 'bouquet');
      T.flower(cv, g, { scale: 0.44 });
    });

    var card = App.buildPassport(false);
    card.style.marginTop = 'calc(var(--s)*2)';
    wrap.appendChild(card);
    wrap.appendChild(h('p', {
      style: 'font-family:var(--f-mono);font-size:calc(var(--s)*1.1);color:var(--ink-faint);line-height:1.6;margin-top:calc(var(--s)*2)',
      text: en ? 'This variety travels entirely inside the link — nothing about it was stored on a server.'
               : 'Esta variedad viaja completa dentro del enlace: nada de ella quedó guardado en un servidor.'
    }));
  };

  /* Registro del service worker.

     El kiosco de la feria no puede quedarse en blanco porque se caiga el
     wifi del recinto. Sólo aplica bajo https (o localhost, para poder
     probarlo aquí): con file:// el navegador lo rechaza y no hay nada que
     hacer al respecto. */
  App.defer(function () {
    if (!('serviceWorker' in navigator)) return;
    var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (location.protocol !== 'https:' && !local) return;
    navigator.serviceWorker.register('sw.js?v=43').catch(function (e) {
      if (window.console) console.warn('service worker:', e);
    });
  });
})(window);
