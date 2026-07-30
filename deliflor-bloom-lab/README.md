# Deliflor Bloom Lab

**Imagina el crisantemo del futuro.**

Experiencia interactiva para pantalla táctil gigante. El visitante diseña una
variedad de crisantemo que no existe —familia, forma, pétalos, color, tamaño y
carácter—, le pone nombre y recibe un ramo tridimensional hecho con su propia
flor, junto con un pasaporte de la variedad y un código QR para llevársela.

Construida para Deliflor Américas. Colores, iconografía y estructura de ficha
tomados del Catálogo Deliflor Américas 2024.

---

## Lo esencial en tres puntos

**Cero dependencias.** No hay Three.js, ni React, ni CDN, ni paso de compilación.
El motor 3D es WebGL escrito a mano; el codificador de códigos QR también. Se
copia la carpeta a un computador y funciona.

**Cero red.** Las quince pantallas, el modelo 3D, el ramo, el pasaporte y el QR
funcionan con el cable desconectado. La red de un recinto ferial no es una
dependencia aceptable.

**El QR lleva la flor adentro.** El genoma completo se comprime a unos 40 bytes y
viaja codificado en la propia dirección del enlace. El teléfono del visitante
reconstruye la flor desde la URL: sin base de datos, sin cuenta y sin registrar
nada en ningún servidor. Como el fragmento que sigue a `#` nunca se envía, la
creación no queda ni en los registros del servidor.

---

## Probarlo

```bash
python -m http.server 7805 --directory deliflor-bloom-lab
```

Y abrir <http://localhost:7805>. Cualquier servidor de archivos estáticos sirve.
Abrir `index.html` con doble clic también funciona, salvo la instalación como PWA.

---

## Modo kiosco

1. Windows 11 Pro, usuario dedicado sin privilegios de administrador.
2. Desactivar suspensión, salvapantallas, notificaciones y actualizaciones
   automáticas en horario de evento.
3. Copiar la carpeta al disco local (no a una unidad de red).
4. Servirla en local y crear un acceso directo:

```bash
chrome.exe --kiosk --incognito --disable-pinch --overscroll-history-navigation=0 --autoplay-policy=no-user-gesture-required "http://localhost:7805"
```

5. Poner ese acceso directo en `shell:startup` para que arranque solo.
6. Programar un reinicio del equipo de madrugada.

El panel administrativo se abre con **doble toque en la esquina inferior
izquierda** de la pantalla. PIN por defecto: `2026`.

---

## Variables que Deliflor puede cambiar

Todas están juntas al principio de [`js/app.js`](js/app.js), en el objeto `CFG`:

| Variable | Qué hace | Valor por defecto |
|---|---|---|
| `eventName` | Nombre del evento que aparece en el pasaporte | `Evento floral 2026` |
| `eventId` | Identificador para los archivos exportados | `deliflor-2026` |
| `shareBase` | Dominio del QR. Vacío = la misma página | `''` |
| `idleWarn` | Milisegundos hasta el aviso «¿sigues ahí?» | `45000` |
| `idleReset` | Milisegundos hasta borrar la sesión | `60000` |
| `endReset` | Inactividad en la pantalla final | `20000` |
| `labMs` | Duración de la animación de hibridación | `8000` |
| `adminPin` | PIN del panel | `2026` |
| `galleryOn` | Activa la galería del evento | `true` |
| `languages` | Idiomas disponibles | `['es','en']` |

Otros puntos de ajuste:

- **Paleta de colores** — `PALETTE` en [`js/genome.js`](js/genome.js). El índice
  de cada color viaja dentro del QR: se pueden cambiar los tonos, pero **no
  reordenar ni insertar** sin invalidar los códigos ya impresos.
- **Presets de familia** — `PRESETS` en `js/genome.js`. Definen la flor que
  aparece ya terminada al elegir cada familia.
- **Lista de términos bloqueados** — `BLOCKED` en `js/genome.js`.
- **Colores de marca de la interfaz** — variables CSS al principio de
  [`css/app.css`](css/app.css).
- **Ambientes de iluminación** — `BG_ENV` y `MOOD` en [`js/gl.js`](js/gl.js).

---

## Render fotorrealista (capa opcional)

El modelo procedural es botánico estilizado, no fotografía. Para la promesa
fotográfica hay una capa opcional que genera una imagen a partir del genoma y la
muestra en el pasaporte como **lámina rotulada**, con un conmutador «Foto /
Modelo 3D». La lámina no tiene controles de giro: no puede confundirse con el
modelo manipulable.

Cuatro reglas la gobiernan, y están verificadas:

1. **Nunca bloquea.** La petición sale al entrar en la pantalla del nombre, con
   el 3D ya en pantalla. Si nunca vuelve, el visitante termina igual y no se
   entera.
2. **Presupuesto de 18 segundos.** Pasado el plazo se aborta. Se ajustó tras
   medir en vivo: `gpt-image-1.5` en calidad `low` tarda ~13 s reales contra
   el proveedor; 12 s se quedaba corto casi siempre.
3. **Caché por genoma.** Dos visitantes que diseñan la misma flor comparten
   render y no se paga dos veces. El nombre no entra en la clave.
4. **Tope de gasto diario** configurable, e interruptor de apagado en el panel.

### Configurarla

El modo recomendado es **proxy**: el kiosco habla con el worker de Cloudflare de
[`pal-ai-worker`](../pal-ai-worker/worker.js), donde la clave del proveedor vive
como secreto y **nunca llega al navegador**.

En el worker, como secretos de Cloudflare:

| Secreto | Para qué |
|---|---|
| `IMAGE_API_KEY` | Clave del proveedor de imágenes |
| `IMAGE_PROVIDER` | `gemini`, `openai` (por defecto), `stability` o `fal` |
| `IMAGE_MODEL` | Modelo concreto; opcional |

`IMAGE_PROVIDER` vive en `wrangler.toml` (no es un secreto), y hoy está en
`openai` con el modelo por defecto `gpt-image-1.5`, calidad `low`.

Una suscripción de ChatGPT o de Gemini en la aplicación **no sirve**: la API es
un producto aparte, con su propia clave y su propia facturación. Hace falta una
clave de `platform.openai.com` o de Google AI Studio.

Sólo `fal` y `stability` respetan el prompt negativo de verdad. En `openai` y
`gemini` la lista de exclusiones se cuela como «Avoid: …», que funciona peor.

**Se probó Gemini primero por su capa gratuita, pero se descartó**: los modelos
de imagen devuelven `429 · limit: 0` en proyectos sin facturación vinculada, y
vincularla no garantiza que el uso siga siendo gratis. `openai` quedó como
proveedor en producción porque la cuenta ya tenía facturación resuelta y el
resultado, verificado visualmente, es excelente.

### Estado verificado en producción (30-jul-2026)

- Proveedor: `openai` · modelo `gpt-image-1.5` · calidad `low`
- Latencia medida contra el worker real: **12.8–13.1 s**, dentro del
  presupuesto de 18 s
- Costo: ~$0,01–0,02 por imagen — con 160–250 imágenes/día, **menos de $5 para
  todo el evento**
- Calidad visual: aprobada — el ramo generado es fotorrealista, respeta color,
  patrón y envoltura del genoma, y se reconoce como crisantemo

### Si el modelo desaparece

Los proveedores retiran modelos con el tiempo (`gpt-image-1` deja de estar
disponible el 23 de octubre de 2026). Cuando pase, la capa de IA empieza a
fallar y el kiosco sigue funcionando con su modelo 3D sin que el visitante lo
note. Arreglarlo es cambiar una variable:

```bash
cd pal-ai-worker && npx wrangler secret put IMAGE_MODEL && npx wrangler deploy
```

Nada del recorrido, del 3D, del pasaporte ni del QR depende de esto.

En el panel administrativo del kiosco sólo se escribe la dirección del worker,
el modelo, el tamaño y el tope diario, y se pulsa «Probar conexión».

El modo **direct** existe únicamente para pruebas: obliga a guardar la clave en
el navegador del kiosco. No usarlo en el evento.

Si no se configura nada, la capa queda desactivada y la experiencia funciona
completa con el modelo 3D.

---

## Cómo está organizado

```
deliflor-bloom-lab/
├── index.html            Armazón y orden de carga
├── manifest.webmanifest  Instalación como PWA en pantalla completa
├── css/app.css           Sistema de diseño; todo escala con la unidad --s
└── js/
    ├── genome.js         El genoma: 30 parámetros, presets, nombres,
    │                     moderación, indicadores y (des)codificación al QR
    ├── mesh.js           Geometría procedural: pétalo, flor, tallo, hoja, ramo
    ├── gl.js             Renderizador WebGL propio y órbita táctil
    ├── thumbs.js         Dibujo 2D: miniaturas y respaldo sin WebGL
    ├── qr.js             Codificador de códigos QR
    ├── ai.js             Render fotorrealista opcional: presupuesto, caché,
    │                     tope de gasto y degradación silenciosa
    ├── app.js            Estado, navegación, temporizadores, pantallas 1–8
    └── finish.js         Pantallas 9–15, galería, panel, vista compartida
```

El genoma es la única fuente de verdad. La flor 3D, el ramo, el pasaporte, los
indicadores, el prompt de la IA y el QR son funciones puras de ese objeto: el
mismo genoma produce siempre exactamente la misma flor.

### Actualizar el kiosco

Las etiquetas de `index.html` llevan un sufijo `?v=N`. **Súbelo en cada
despliegue.** Sin él, la caché heurística del navegador sigue sirviendo los
archivos viejos y la actualización parece no haber ocurrido: eso ya nos costó
varias iteraciones evaluando código que no era el que estaba en disco.

### El modelo del pétalo

Cada pétalo es una superficie paramétrica sobre un raquis de arco circular. Nace
en un receptáculo con forma de domo, y el ángulo de nacimiento junto con la
apertura deciden si la flor resulta una esfera (Ballhia) o un plato (Margriet).
El perfil de ancho, la curvatura, el retorcido y el borde son funciones
independientes, así que las combinaciones no se agotan.

El perfil no es una elipse: es una cinta espatulada que alcanza pronto su ancho,
lo mantiene y redondea sólo al final, con los cortes concentrados en la base y
en el extremo. Un perfil en seno puro termina en pico y la flor entera se lee
como una piña.

La malla se orienta con la normal **adaxial** —la del haz— como cara frontal.
Consecuencia botánicamente correcta: en una variedad incurvada uno ve de verdad
el envés de los pétalos, así que el «color del reverso» del catálogo aparece
donde corresponde.

### La hoja

Limbo pinnatipartido con un nervio central del que salen de 3 a 7 lóbulos
triangulares barridos hacia el ápice, senos profundos que no llegan al nervio,
margen groseramente dentado con muescas secundarias y los dos lados desiguales.
Haz verde oscuro y envés pálido por la pubescencia. La morfología está tomada de
la lámina del propio catálogo —la página del tallo, que trae la foto junto al
grabado con la nervadura— y de la descripción botánica de *Chrysanthemum ×
morifolium*. No se incrusta ninguna imagen ajena: las referencias sirvieron para
escribir la geometría.

---

## Las quince pantallas

| # | Pantalla | # | Pantalla |
|---|---|---|---|
| 01 | Atracción | 09 | Laboratorio de hibridación |
| 02 | Modo creativo | 10 | Revelación en 3D |
| 03 | Familia | 11 | Ramo |
| 04 | Forma principal | 12 | Nombre |
| 05 | Pétalos | 13 | Pasaporte de la variedad |
| 06 | Color | 14 | Compartir con QR |
| 07 | Tamaño y abundancia | 15 | Cierre |
| 08 | Personalidad | | |

Fuera del recorrido: galería del evento, panel administrativo y la vista móvil
que abre el código QR.

**Ninguna decisión es obligatoria.** Al elegir familia se carga una flor ya
terminada y armónica; las pantallas 4 a 8 son refinamiento. Por eso la
experiencia se completa en 75 segundos por la ruta rápida y admite tres minutos
y medio por la completa.

---

## Requisitos

**Computador** — GPU dedicada (NVIDIA RTX 3050 o superior), Core i5 de 12.ª
generación o Ryzen 5 5600, 16 GB de RAM, SSD. Los gráficos integrados no
sostienen 4K con el ramo completo.

**Pantalla** — 55" a 86", táctil capacitiva de 10 puntos o más, 4K horizontal,
brillo ≥ 400 nits y acabado antirreflejo. Borde inferior a 85–90 cm del piso:
todos los controles quedan en la franja de 90 a 150 cm, alcanzable por niños y
por personas en silla de ruedas.

**Sin WebGL** la aplicación no se cae: cambia sola a un renderizador 2D que
mantiene el recorrido completo, con menos profundidad visual.

---

## Estado de verificación

Comprobado de forma automatizada:

- Las 15 pantallas se construyen sin errores de consola.
- El genoma sobrevive 300 ciclos de ida y vuelta por el QR sin perder un solo
  campo.
- El codificador de QR se valida contra un decodificador independiente, con la
  tabla oficial de cadenas de formato.
- La moderación de nombres bloquea sustituciones de caracteres y acentos.
- Encuadre automático sin recortes en Ballhia, Margriet, araña, anémona,
  decorativa y ramo.
- 40 sesiones seguidas reconstruyendo la malla sin degradación de tiempos.
- La capa de IA en sus cuatro caminos: éxito, acierto de caché con el servicio
  caído, fallo HTTP y agotamiento del plazo (aborta a los 12,0 s y el pasaporte
  queda intacto).
- La semilla del genoma no se mueve al pedir sugerencias de nombre, así que la
  flor revelada es la misma que viaja en el QR.

**Pendiente de verificar en hardware real:** los fotogramas por segundo a 4K, el
comportamiento táctil de la pantalla concreta que se instale, la resistencia de
ocho horas continuas y el escaneo del QR con teléfonos de distintas marcas.

**Ya en producción:** la capa fotorrealista genera imágenes reales con OpenAI
`gpt-image-1.5`. Queda por ver cómo se comporta con los prompts que produce
cada combinación del genoma (el probado hasta ahora fue uno solo, aunque
representativo) y confirmar el tope de gasto diario adecuado una vez arranque
el evento.

**Punto más débil del modelo procedural:** los lóbulos de la hoja son todavía
blandos en lugar de triangulares y agudos, sobre todo en la versión de menor
resolución que usa el ramo.

---

## Licencia y marca

Código de la experiencia: uso interno de Deliflor. «Deliflor», su logotipo y las
variedades del catálogo son propiedad de Deliflor Américas. Las variedades que
crea el visitante son invenciones digitales: la aplicación no afirma que sean
cultivables ni predice viabilidad genética, y así se declara en pantalla.
