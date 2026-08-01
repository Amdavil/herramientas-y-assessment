/* DELIFLOR Bloom Lab V11 module */
(function(root){'use strict';
  var G=root.Genome,App=root.App,M=root.MeshGen,GL=root.GL,T=root.Thumbs,QR=root.QR;
  if(!G||!App||!M||!GL||!T){if(root.console)console.error('Bloom Lab V11: núcleo base no disponible');return;}
  var B=root.BloomLabV11=root.BloomLabV11||{};B.version='11.0.0';B.build='1101';
  var FAMILY_META=B.familyMeta||{};
  function familyLabel(g) { return App.lb(g.family); }
  function familyNcs(g) { return (FAMILY_META[g.family] || {}).ncs || 'Chrysanthemum'; }
  function safeName(s) {
    return String(s || 'Flor_DELIFLOR').normalize ? String(s || 'Flor_DELIFLOR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'') : 'Flor_DELIFLOR';
  }
  function loadImage(src) {
    return new Promise(function (resolve) {
      if (!src) return resolve(null);
      var im = new Image(); im.onload = function () { resolve(im); }; im.onerror = function () { resolve(null); }; im.src = src;
    });
  }
  function bestSnapshot() {
    if (App._v11MobileRenderer && App._v11MobileRenderer.ok) { var ms = App._v11MobileRenderer.snapshot(); if (ms) return ms; }
    if (App.shots && App.shots.flower) return App.shots.flower;
    if (App.renderer && App.renderer.ok) { var rs = App.renderer.snapshot(); if (rs) return rs; }
    if (App.shots && App.shots.bouquet) return App.shots.bouquet;
    return null;
  }
  function fallbackSnapshot() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 1000; cv.style.width = cv.style.height = '1000px';
    T.flower(cv, App.g, { scale: .44, bg: '#F5F1EE' });
    try { return cv.toDataURL('image/png'); } catch (e) { return null; }
  }
  function drawCover(ctx, img, x, y, w, h, contain) {
    if (!img) return;
    var r = contain ? Math.min(w / img.width, h / img.height) : Math.max(w / img.width, h / img.height);
    var iw = img.width * r, ih = img.height * r; ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function roundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    var words = String(text).split(/\s+/), line = '', lines = [];
    for (var i = 0; i < words.length; i++) { var test = line ? line + ' ' + words[i] : words[i]; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = words[i]; } else line = test; }
    if (line) lines.push(line); lines = lines.slice(0, maxLines || 99); lines.forEach(function (l, j) { ctx.fillText(l, x, y + j * lineHeight); }); return y + lines.length * lineHeight;
  }
  function palette(ctx, g, x, y, size, gap) {
    ['primary','secondary','center','tip','reverse'].forEach(function (k, i) {
      ctx.fillStyle = G.hex(g.colors[k]); ctx.fillRect(x + i * (size + gap), y, size, size);
      ctx.strokeStyle = 'rgba(36,26,31,.13)'; ctx.lineWidth = 2; ctx.strokeRect(x + i * (size + gap), y, size, size);
    });
  }
  function qrCanvas(url, size) {
    if (!QR || !QR.toCanvas) return null;
    var q = document.createElement('canvas'); var ok = QR.toCanvas(q, url, { size: size, dark: '#241A1F', light: '#FFFFFF', quiet: 4 }); return ok ? q : null;
  }
  function canvasBlob(canvas) {
    return new Promise(function (resolve, reject) {
      if (canvas.toBlob) canvas.toBlob(function (b) { b ? resolve(b) : reject(new Error('No se pudo crear la imagen.')); }, 'image/png', .96);
      else { try { var data = canvas.toDataURL('image/png').split(',')[1], bin = atob(data), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); resolve(new Blob([arr], { type: 'image/png' })); } catch (e) { reject(e); } }
    });
  }
  function composeExport(fmt) {
    var spec = {
      hd:{w:1920,h:1080,imageY:0,imageH:760,nameY:860}, square:{w:1080,h:1080,imageY:0,imageH:690,nameY:800},
      story:{w:1080,h:1920,imageY:120,imageH:1040,nameY:1280}, passport:{w:1600,h:2000,imageY:130,imageH:930,nameY:1180}
    }[fmt] || {w:1920,h:1080,imageY:0,imageH:760,nameY:860};
    var cv = document.createElement('canvas'); cv.width = spec.w; cv.height = spec.h;
    var ctx = cv.getContext('2d'), g = App.g, grad = ctx.createLinearGradient(0,0,0,spec.h);
    grad.addColorStop(0,'#F8F5F2'); grad.addColorStop(1,'#E7DDD8'); ctx.fillStyle = grad; ctx.fillRect(0,0,spec.w,spec.h);
    ctx.fillStyle = '#7C214D'; ctx.fillRect(0,0,spec.w,Math.max(10,spec.w*.008));
    return loadImage(bestSnapshot() || fallbackSnapshot()).then(function (img) {
      if (img) { ctx.save(); roundedRect(ctx,0,spec.imageY,spec.w,spec.imageH,0); ctx.clip(); drawCover(ctx,img,0,spec.imageY,spec.w,spec.imageH,false); ctx.restore(); }
      var pad = fmt === 'passport' ? 90 : 60;
      ctx.fillStyle='#7C214D';ctx.font='700 '+(fmt==='passport'?42:32)+'px "Segoe UI",Arial,sans-serif';ctx.fillText('DELIFLOR BLOOM LAB · GENOME EDITION',pad,fmt==='story'?78:68);
      ctx.fillStyle='#241A1F';ctx.font='400 '+(fmt==='passport'?86:fmt==='story'?80:62)+'px Georgia,serif';var titleY=spec.nameY;ctx.fillText(g.name||'Nueva variedad',pad,titleY);
      ctx.fillStyle='#6D5A62';ctx.font='400 '+(fmt==='passport'?32:26)+'px "Segoe UI",Arial,sans-serif';
      wrapText(ctx,familyLabel(g)+' · '+familyNcs(g)+' · '+App.lb(g.petalShape)+' · '+App.lb(g.diameter),pad,titleY+52,spec.w-pad*2,38,2);
      palette(ctx,g,pad,titleY+95,fmt==='passport'?72:58,12);
      if(fmt==='passport'){
        var sc=G.scores(g),x1=90,x2=820,y=titleY+230;ctx.fillStyle='#7C214D';ctx.font='700 30px "Segoe UI",Arial,sans-serif';ctx.fillText('PASAPORTE DE VARIEDAD',x1,y);
        var rows=[['Familia',familyLabel(g)],['Clase',familyNcs(g)],['Forma',App.lb(g.shape)],['Pétalo',App.lb(g.petalShape)],['Disposición',App.lb(g.arrangement)],['Patrón',App.lb(g.pattern)],['Diámetro',App.lb(g.diameter)+' · '+G.DIAMETER_CM[g.diameter]+' cm'],['Densidad',Math.round(g.density*100)+'% · '+g.layers+' capas'],['Crecimiento',App.lb(g.growth)]];
        rows.forEach(function(r,i){var xx=i<5?x1:x2,yy=y+70+(i<5?i:i-5)*62;ctx.fillStyle='#9C8A92';ctx.font='700 18px monospace';ctx.fillText(r[0].toUpperCase(),xx,yy);ctx.fillStyle='#241A1F';ctx.font='400 27px "Segoe UI",Arial,sans-serif';ctx.fillText(r[1],xx,yy+30);});
        var sy=1640;[['Novedad',sc.novelty,'#7C214D'],['Armonía',sc.harmony,'#6F7D4C'],['Desafío',sc.challenge,'#9C3071']].forEach(function(r,i){var yy=sy+i*70;ctx.fillStyle='#241A1F';ctx.font='600 25px "Segoe UI",Arial,sans-serif';ctx.fillText(r[0],90,yy);ctx.fillStyle='#E3DAD5';ctx.fillRect(300,yy-20,700,24);ctx.fillStyle=r[2];ctx.fillRect(300,yy-20,700*r[1]/100,24);ctx.fillStyle='#7C214D';ctx.font='700 24px monospace';ctx.fillText(String(r[1]),1030,yy);});
        var q=qrCanvas(App.shareURL(),360);if(q){ctx.fillStyle='#fff';roundedRect(ctx,1160,1580,350,350,24);ctx.fill();ctx.drawImage(q,1180,1600,310,310);}
        ctx.fillStyle='#9C8A92';ctx.font='400 20px monospace';ctx.fillText('Creación digital inspirada en mejoramiento vegetal. No predice viabilidad genética.',90,1950);
      }
      return canvasBlob(cv);
    });
  }
  function downloadBlob(blob,name){var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);try{a.click();}catch(e){root.open(url,'_blank','noopener');}a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);}
  function fallbackLink(blob,name){var old=document.querySelector('.v11-download-fallback');if(old)old.remove();var url=URL.createObjectURL(blob),box=document.createElement('div');box.className='v11-download-fallback';box.innerHTML='<strong>Imagen lista.</strong> <a target="_blank" rel="noopener" download="'+name+'">Abrir o guardar manualmente</a>';box.querySelector('a').href=url;document.body.appendChild(box);setTimeout(function(){if(box.parentNode)box.remove();URL.revokeObjectURL(url);},90000);}
  function exportFile(fmt,share){var label={hd:'HD_16x9',square:'Cuadrada',story:'Historia',passport:'Pasaporte'}[fmt]||fmt,name=safeName(App.g.name)+'_DELIFLOR_'+label+'.png';App.toast(App.lang==='en'?'Preparing image…':'Preparando imagen…');return composeExport(fmt).then(function(blob){var file=new File([blob],name,{type:'image/png'});if(share&&navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){return navigator.share({title:App.g.name||'DELIFLOR Bloom Lab',text:'Mi creación DELIFLOR Bloom Lab',files:[file]}).catch(function(){fallbackLink(blob,name);});}try{downloadBlob(blob,name);}catch(e){fallbackLink(blob,name);}App.track('v11:download:'+fmt);return null;}).catch(function(e){if(root.console)console.warn(e);App.toast(App.lang==='en'?'The image could not be exported':'No se pudo exportar la imagen');});}
  App.v11Export=exportFile;
  B.exportFile=exportFile;B.familyLabel=familyLabel;B.familyNcs=familyNcs;B.safeName=safeName;B.downloadBlob=downloadBlob;
})(window);
