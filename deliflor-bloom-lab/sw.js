/* =========================================================================
   Lápida del service worker de la ruta antigua.

   Bloom Lab vivía aquí y registraba un service worker que guardaba la
   aplicación entera para funcionar sin conexión. Al mudarla a su propio
   repositorio ese worker sigue instalado en los teléfonos y kioscos que ya
   la habían abierto, y como manda la copia en caché, esos equipos nunca
   llegan a ver la página de redirección: se quedan atrapados en la versión
   vieja indefinidamente.

   Dejar el archivo en 404 no basta. Chrome descarta la instalación cuando
   el script desaparece, pero Safari de iPhone no es fiable en eso, y el
   teléfono del visitante es justo el caso que importa.

   Así que este worker se limita a borrarse: vacía las cachés, se desinstala
   y recarga las pestañas que estuviera controlando, que en ese momento ya
   reciben la redirección con la flor intacta.
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

/* Mientras siga vivo no responde nada desde caché: todo va a la red, que es
   lo que devuelve la página de redirección. */
self.addEventListener('fetch', function () {});
