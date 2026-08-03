/* =========================================================================
   DELIFLOR BLOOM LAB — Service worker

   El kiosco del evento no puede depender del wifi de una feria. Todo lo que
   la experiencia necesita para funcionar cabe en esta lista: no hay backend,
   la flor entera vive dentro del genoma y el QR se dibuja en local.

   Estrategia por tipo de petición, no una sola para todo:

   - Navegación (abrir la app): red primero, caché de respaldo. Así un kiosco
     encendido durante días recibe la versión nueva al recargar en vez de
     quedarse clavado en la copia guardada.
   - Estáticos propios: caché primero. Llevan ?v= en la URL, así que una
     versión nueva es una URL nueva y nunca se sirve una copia rancia.
   - Terceros (la lámina fotorrealista del worker): nunca se cachean. Son
     respuestas únicas por visitante y llenarían el disco sin sentido.

   IMPORTANTE: subir CACHE en cada despliegue, junto con el ?v= de index.html.
   ========================================================================= */
var CACHE = 'bloom-lab-v46';
var V = '?v=46';

var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css' + V,
  './js/genome.js' + V,
  './js/mesh.js' + V,
  './js/gl.js' + V,
  './js/thumbs.js' + V,
  './js/qr.js' + V,
  './js/ai.js' + V,
  './js/app.js' + V,
  './js/finish.js' + V
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      /* addAll es atómico: si un solo archivo falla, no se instala nada y el
         kiosco se queda sin copia sin avisar. Se piden por separado para que
         un fallo suelto no tumbe la instalación entera. */
      .then(function (c) {
        return Promise.all(ASSETS.map(function (u) {
          return c.add(u).catch(function () { /* ese archivo se servirá de red */ });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  /* La petición a la IA es de un solo uso y pesa megas: se deja pasar. */
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(function (r) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
          return r;
        })
        .catch(function () {
          return caches.match(req).then(function (hit) {
            return hit || caches.match('./index.html');
          });
        })
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (r) {
        if (r && r.ok) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return r;
      });
    })
  );
});
