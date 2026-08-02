/* DELIFLOR Bloom Lab V11.1 · Branding y layout final */
(function(root){
  'use strict';
  var App=root.App;
  if(!App||!App.h)return;
  var LOGO='assets/deliflor-logo.svg?v=1103';

  /* Usa siempre el archivo oficial completo, sin reconstrucción tipográfica. */
  App.logo=function(size,iconOnly){
    var cls='df-logo df-logo-official '+(size||'sm')+(iconOnly?' icon-only':'');
    return App.h('div',{class:cls},[
      App.h('img',{src:LOGO,alt:'DELIFLOR Américas',draggable:'false'})
    ]);
  };

  function syncScreenClass(){
    var id=App.FLOW&&App.FLOW[App.step];
    document.body.classList.toggle('v11-share-screen',id==='share');
    document.body.classList.toggle('v11-passport-screen',id==='passport');
  }

  /* Conserva las mejoras previas y añade el estado de pantalla al final. */
  var previousRender=App.render;
  App.render=function(){
    previousRender.apply(App,arguments);
    setTimeout(syncScreenClass,0);
  };

  document.addEventListener('DOMContentLoaded',syncScreenClass,{once:true});
})(window);
