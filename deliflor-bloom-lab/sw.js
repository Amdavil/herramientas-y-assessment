/* =========================================================================
   Lápida del service worker de la ruta antigua.

   Bloom Lab vivía aquí y registraba un service worker que guardaba la
   aplicación entera para funcionar sin conexión. Tras mudarla a su propio
   repositorio, ese worker sigue instalado en los teléfonos y kioscos que ya
   la habían abierto y, como manda la copia en caché, esos equipos nunca
   llegan a ver la página de redirección: se quedan en la versión vieja.

   Dejar el archivo en 404 no basta. Chrome descarta la instalación cuando
   el script desaparece, pero Safari de iPhone no es fiable en eso, y el
   teléfono del visitante que escanea el QR es justo el caso que importa.

   Así que este worker sólo se borra a sí mismo: vacía las cachés, se
   desinstala y recarga las pestañas que controlaba, que ya reciben la
   redirección con el fragmento de la flor intacto.
   ========================================================================= */
self.addEventListener('install', function (e) {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) {
        clients.forEach(function (c) { c.navigate(c.url); });
      })
      .catch(function () { /* si algo falla, la próxima visita lo reintenta */ })
  );
});

/* Mientras siga vivo no sirve nada desde caché: todo va a la red, que es
   donde está la redirección. */
self.addEventListener('fetch', function () {});
