/* DELIFLOR Bloom Lab V11 module */
(function(root){'use strict';
  var G=root.Genome,App=root.App,M=root.MeshGen,GL=root.GL,T=root.Thumbs,QR=root.QR;
  if(!G||!App||!M||!GL||!T){if(root.console)console.error('Bloom Lab V11: núcleo base no disponible');return;}
  var B=root.BloomLabV11=root.BloomLabV11||{};B.version='11.0.0';B.build='1101';
  /* -----------------------------------------------------------------
     3. Ruta rápida y ruta laboratorio
     ----------------------------------------------------------------- */
  var QUICK = ['family','color','size','personality','lab','reveal','name','passport','share','end'];
  var BASE_GO = App.go, BASE_NEXT = App.next, BASE_PREV = App.prev, BASE_SHELL = App.shell, BASE_END = App.endSession;

  App.go = function (id) {
    if (id === 'mode' && App.step === 0) App._v11Route = 'lab';
    BASE_GO(id);
  };
  App.next = function () {
    if (App._v11Route !== 'quick') return BASE_NEXT();
    var id = App.FLOW[App.step], i = QUICK.indexOf(id);
    if (i < 0 || i >= QUICK.length - 1) return BASE_NEXT();
    App.go(QUICK[i + 1]);
  };
  App.prev = function () {
    if (App._v11Route !== 'quick') return BASE_PREV();
    var id = App.FLOW[App.step], i = QUICK.indexOf(id);
    if (i <= 0) return;
    App.go(QUICK[i - 1]);
  };
  App.endSession = function (silent) { App._v11Route = null; return BASE_END(silent); };

  App.shell = function (app, opts) {
    var s = BASE_SHELL(app, opts);
    if (App._v11Route === 'quick') {
      var id = App.FLOW[App.step], i = QUICK.indexOf(id);
      var p = app.querySelector('.progress');
      if (p && i >= 0) {
        while (p.firstChild) p.removeChild(p.firstChild);
        for (var k = 0; k < QUICK.length - 1; k++) {
          var bar = document.createElement('i');
          bar.className = k < i ? 'done' : k === i ? 'now' : '';
          p.appendChild(bar);
        }
      }
      var step = app.querySelector('.step');
      if (step && i >= 0) step.textContent = (App.lang === 'en' ? 'Quick route ' : 'Ruta rápida ') + (i + 1) + ' / ' + QUICK.length;
    }
    return s;
  };

  var BASE_ATTRACT = App.screens.attract;
  App.screens.attract = function (app) {
    BASE_ATTRACT(app);
    setTimeout(function () {
      var inner = app.querySelector('.att-inner');
      if (!inner || inner.querySelector('.v11-quick')) return;
      var main = inner.querySelector('.btn.big');
      if (main) main.textContent = App.lang === 'en' ? 'Full laboratory' : 'Laboratorio completo';
      var quick = App.h('button', {
        class: 'btn big v11-quick',
        text: App.lang === 'en' ? 'Quick creation · 75 seconds' : 'Creación rápida · 75 segundos'
      });
      quick.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
      quick.addEventListener('click', function (e) {
        e.stopPropagation();
        App.track('session:quick');
        App.startedAt = Date.now();
        App._v11Route = 'quick';
        App.g = G.base();
        G.applyPreset(App.g, 'ballhia');
        G.normalize(App.g);
        App.go('family');
      });
      var touch = inner.querySelector('.touch');
      inner.insertBefore(quick, touch || null);
      var note = App.h('div', { class: 'v11-route-note', text: App.lang === 'en' ? 'Two experiences · one genome' : 'Dos experiencias · un solo genoma' });
      inner.insertBefore(note, touch || null);
    }, 0);
  };


})(window);
