# DELIFLOR Bloom Lab V11 · Genome Edition

Versión consolidada que combina el núcleo estable del Bloom Lab con el atlas morfológico ampliado y las mejoras de descarga, QR y experiencia móvil.

## Enlace público

https://amdavil.github.io/herramientas-y-assessment/deliflor-bloom-lab-v11/

## Mejoras principales

- Diez arquitecturas florales: Ballhia, Decorativa, Margriet, Spoon, Spider, Anemone, Quill, Reflex, Incurve y Brush/Thistle.
- Validación morfológica estricta según familia y modo creativo.
- Ruta rápida para eventos y recorrido de laboratorio completo.
- Un único genoma compacto y determinista para el modelo 3D, el pasaporte, el QR y la vista móvil.
- QR local, sin servicios externos, con la flor codificada dentro de la URL.
- Visor móvil WebGL manipulable, con respaldo 2D.
- Descargas mediante Blob: HD 16:9, cuadrada, historia y pasaporte de variedad.
- Uso del menú nativo de compartir cuando el teléfono lo soporta.
- PWA y caché local mediante service worker.
- Publicación estática directa, sin payloads ni reconstrucción del aplicativo en el navegador.

## Arquitectura

La V11 reutiliza el núcleo modular probado de `../deliflor-bloom-lab/` y agrega módulos propios en `css/` y `js/`.

```text
deliflor-bloom-lab-v11/
├── index.html
├── manifest.webmanifest
├── sw.js
├── css/v11.css
└── js/
    ├── v11-atlas.js
    ├── v11-route.js
    ├── v11-export.js
    └── v11-mobile-ui.js
```

## Prueba recomendada

Abrir la URL en Chrome o Edge, completar una creación y verificar:

1. generación del QR;
2. apertura del visor móvil 3D;
3. descarga cuadrada;
4. descarga HD 16:9;
5. descarga del pasaporte;
6. reconstrucción de la misma flor desde el enlace compartido.
