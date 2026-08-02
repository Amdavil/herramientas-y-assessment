const CACHE='deliflor-bloom-lab-v11-1103';
const ASSETS=[
  './','./index.html','./manifest.webmanifest?v=1103','./css/v11.css?v=1101','./css/v11-polish.css?v=1103',
  './js/v11-atlas.js?v=1101','./js/v11-route.js?v=1101','./js/v11-export.js?v=1101','./js/v11-mobile-ui.js?v=1101','./js/v11-polish.js?v=1103',
  './assets/deliflor-logo.svg?v=1103',
  '../deliflor-bloom-lab/css/app.css?v=33',
  '../deliflor-bloom-lab/js/genome.js?v=33','../deliflor-bloom-lab/js/mesh.js?v=33','../deliflor-bloom-lab/js/gl.js?v=33',
  '../deliflor-bloom-lab/js/thumbs.js?v=33','../deliflor-bloom-lab/js/qr.js?v=33','../deliflor-bloom-lab/js/ai.js?v=33',
  '../deliflor-bloom-lab/js/app.js?v=33','../deliflor-bloom-lab/js/finish.js?v=33'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response&&response.ok&&new URL(event.request.url).origin===location.origin){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>caches.match('./index.html'))));
});
