/* DELIFLOR Bloom Lab V11 module */
(function(root){'use strict';
  var G=root.Genome,App=root.App,M=root.MeshGen,GL=root.GL,T=root.Thumbs,QR=root.QR;
  if(!G||!App||!M||!GL||!T){if(root.console)console.error('Bloom Lab V11: núcleo base no disponible');return;}
  var B=root.BloomLabV11=root.BloomLabV11||{};B.version='11.0.0';B.build='1101';
  var FAMILY_META=B.familyMeta||{},exportFile=B.exportFile,safeName=B.safeName,downloadBlob=B.downloadBlob,familyLabel=B.familyLabel,familyNcs=B.familyNcs;
  var clamp=B.clamp||function(v,a,b){return v<a?a:v>b?b:v;};var VERSION=B.version,BUILD=B.build;
  var mobileRaf = 0;
  function stopMobileRenderer() {
    cancelAnimationFrame(mobileRaf); mobileRaf = 0;
    if (App._v11MobileRenderer) { try { App._v11MobileRenderer.dispose(); } catch (e) {} App._v11MobileRenderer = null; }
  }
  App.showShared = function () {
    stopMobileRenderer();
    var app = App.$('#app'); App.clear(app); app.style.overflow='auto'; document.body.classList.add('v11-shared');
    var g = App.g, en = (navigator.language || 'es').slice(0,2)==='en'; App.lang = en ? 'en' : 'es';
    var cv = App.h('canvas');
    var stage = App.h('div',{class:'v11-mobile-stage'},[cv,App.h('div',{class:'v11-mobile-help',text:en?'Drag · pinch to zoom':'Gira · pellizca para acercar'})]);
    var head = App.h('div',{class:'v11-mobile-head'},[App.logo('md'),App.h('span',{class:'v11-chip',text:'V11 · 3D'})]);
    var title = App.h('h1',{class:'v11-mobile-title',text:g.name||'—'});
    var views = App.h('div',{class:'v11-mobile-views'});
    [['front',en?'Front':'Frontal'],['side',en?'Side':'Lateral'],['top',en?'Top':'Superior'],['reset',en?'Reset':'Reiniciar']].forEach(function(v){
      views.appendChild(App.h('button',{class:'btn',text:v[1],onclick:function(){var r=App._v11MobileRenderer;if(!r||!r.ok)return;if(v[0]==='reset')r.reset();else r.setView(v[0]);}}));
    });
    var actions = App.h('div',{class:'v11-mobile-actions'},[
      App.h('button',{class:'btn primary',text:en?'Save or share image':'Guardar o compartir imagen',onclick:function(){exportFile('square',true);}}),
      App.h('button',{class:'btn',text:en?'HD 16:9':'Imagen HD 16:9',onclick:function(){exportFile('hd',false);}}),
      App.h('button',{class:'btn',text:en?'Passport':'Pasaporte',onclick:function(){exportFile('passport',false);}})
    ]);
    var meta = App.h('div',{class:'v11-mobile-meta'},[
      App.h('div',{},[App.h('span',{text:en?'Family':'Familia'}),App.h('strong',{text:familyLabel(g)})]),
      App.h('div',{},[App.h('span',{text:'NCS'}),App.h('strong',{text:familyNcs(g)})]),
      App.h('div',{},[App.h('span',{text:en?'Petal':'Pétalo'}),App.h('strong',{text:App.lb(g.petalShape)})]),
      App.h('div',{},[App.h('span',{text:en?'Pattern':'Patrón'}),App.h('strong',{text:App.lb(g.pattern)})])
    ]);
    var wrap = App.h('main',{class:'v11-mobile-shell'},[head,title,stage,views,actions,meta]); app.appendChild(wrap);
    var renderer = new GL.Renderer(cv); App._v11MobileRenderer = renderer;
    if (renderer.ok) { try { renderer.setMesh(M.buildSingleStem(g,'mid')); renderer.setEnv('studio',g.personality,g.pattern==='iridescent'); renderer.reset(); } catch (e) { renderer.ok=false; } }
    if (!renderer.ok) { T.fallbackScene(cv,g,'flower'); }
    else { var last=performance.now(); (function frame(ts){ mobileRaf=requestAnimationFrame(frame); if(!cv.isConnected){stopMobileRenderer();return;} var dt=Math.min(.05,(ts-last)/1000||.016);last=ts;renderer.frame(dt); })(last); }
    var card = App.buildPassport(false); card.style.marginTop='1rem'; wrap.appendChild(card);
    wrap.appendChild(App.h('p',{class:'v11-note',text:en?'The full genome travels inside this link. Nothing about the flower needs to be stored on a server.':'El genoma completo viaja dentro de este enlace. La flor no necesita guardarse en un servidor.'}));
  };
  function plausibility(g) { var sc = G.scores(g), base = g.mode==='natural'?96:g.mode==='experimental'?82:64; return Math.round(clamp(base - sc.challenge*.16 - (1-g.symmetry)*18,38,98)); }
  function enhanceFamilyScreen() {
    if (App.FLOW[App.step] !== 'family') return;
    var opts = document.querySelectorAll('.panel-body .opts .opt');
    opts.forEach(function (btn, i) { var id = G.FAMILIES[i], meta = FAMILY_META[id]; if (!meta || btn.querySelector('.v11-ncs')) return; var lbl = btn.querySelector('.lbl'); if (lbl) lbl.appendChild(App.h('small',{class:'v11-ncs',text:meta.ncs.replace('NCS ','')})); });
    var stage=document.querySelector('.stage'); if(stage&&!stage.querySelector('.v11-family-badge'))stage.appendChild(App.h('div',{class:'v11-family-badge',text:'10 arquitecturas · atlas morfológico'}));
  }
  function enhanceAdvice() {
    var pbody=document.querySelector('.panel-body'); if(!pbody||pbody.querySelector('.v11-plausibility'))return;
    var score=plausibility(App.g), row=App.h('div',{class:'v11-plausibility'},[App.h('span',{text:(App.lang==='en'?'Morphological coherence ':'Coherencia morfológica ')+score+'%'}),App.h('i',{style:'--score:'+score+'%'})]); pbody.appendChild(row);
  }
  function enhanceShare() {
    var share=document.querySelector('.share'); if(!share||share.dataset.v11==='1')return; share.dataset.v11='1';
    Array.prototype.forEach.call(share.querySelectorAll('button'),function(b){var t=(b.textContent||'').trim().toLowerCase();if(t.indexOf('descargar historia')>=0||t.indexOf('download story')>=0||t.indexOf('descargar cuadrada')>=0||t.indexOf('download square')>=0)b.classList.add('v11-hidden-original');});
    var panel=App.h('section',{class:'v11-export-panel'},[
      App.h('h3',{text:App.lang==='en'?'Download and share':'Descarga y comparte'}),
      App.h('p',{text:App.lang==='en'?'Four independent compositions. The QR opens this exact genome in an interactive 3D mobile viewer.':'Cuatro composiciones independientes. El QR abre este mismo genoma en un visor móvil 3D interactivo.'})
    ]);
    var grid=App.h('div',{class:'v11-export-grid'},[
      App.h('button',{class:'btn primary',text:App.lang==='en'?'Save or share':'Guardar o compartir',onclick:function(){exportFile('square',true);}}),
      App.h('button',{class:'btn',text:'HD · 1920×1080',onclick:function(){exportFile('hd',false);}}),
      App.h('button',{class:'btn',text:App.lang==='en'?'Square · 1080':'Cuadrada · 1080',onclick:function(){exportFile('square',false);}}),
      App.h('button',{class:'btn',text:App.lang==='en'?'Story · 1080×1920':'Historia · 1080×1920',onclick:function(){exportFile('story',false);}}),
      App.h('button',{class:'btn',text:App.lang==='en'?'Variety passport':'Pasaporte de variedad',onclick:function(){exportFile('passport',false);}}),
      App.h('button',{class:'btn',text:App.lang==='en'?'Download QR':'Descargar QR',onclick:function(){var q=document.querySelector('.qrbox canvas');if(!q)return App.toast('QR no disponible');if(q.toBlob)q.toBlob(function(b){if(b)downloadBlob(b,safeName(App.g.name)+'_DELIFLOR_QR.png');},'image/png');}})
    ]); panel.appendChild(grid);
    var linkrow=App.h('div',{class:'v11-linkrow'},[
      App.h('button',{class:'btn',text:App.lang==='en'?'Open 3D mobile viewer':'Abrir visor móvil 3D',onclick:function(){root.open(App.shareURL(),'_blank','noopener');}}),
      App.h('button',{class:'btn',text:App.lang==='en'?'Copy link':'Copiar enlace',onclick:function(e){var b=e.currentTarget,url=App.shareURL();if(navigator.clipboard)navigator.clipboard.writeText(url).then(function(){b.textContent=App.lang==='en'?'Copied':'Copiado';setTimeout(function(){b.textContent=App.lang==='en'?'Copy link':'Copiar enlace';},1600);});}})
    ]); panel.appendChild(linkrow); share.appendChild(panel);
  }
  function enhanceDom() {
    if (!document.querySelector('.v11-version') && !document.body.classList.contains('v11-shared')) document.body.appendChild(App.h('div',{class:'v11-version',text:'V11 · Genome Edition'}));
    enhanceFamilyScreen();
    if (App.FLOW[App.step] !== 'attract' && App.FLOW[App.step] !== 'lab' && App.FLOW[App.step] !== 'end' && App.FLOW[App.step] !== 'share') enhanceAdvice();
    enhanceShare();
  }
  var BASE_RENDER = App.render; App.render = function () { BASE_RENDER(); setTimeout(enhanceDom,0); };
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js?v='+BUILD).catch(function(e){if(root.console)console.warn('SW V11:',e);});
  root.addEventListener('pagehide', stopMobileRenderer);
})(window);
