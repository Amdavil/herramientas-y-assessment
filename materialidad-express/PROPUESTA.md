# Estudio de Materialidad Exprés — Propuesta de producto y documento base de construcción

Mesa de trabajo: arquitectura de software, IA aplicada, consultoría ESG/GRI/ESRS/IFRS S1-S2/SASB/AA1000.
Cliente interno: Projectability / Soluciones PAL S.A.S.
Repositorio: `Amdavil/herramientas-y-assessment` (GitHub Pages → `https://amdavil.github.io/herramientas-y-assessment/`)

> Este documento asume la infraestructura que **ya existe** en este repositorio (`diagnostico-circularidad.html`, `reporte-gri-express.html`, `adn-sostenible.html`, `assessment_sostenibilidad_ia.html`, `pal-ai-worker/`) y diseña la nueva herramienta como el **quinto producto de la misma familia**, no como una plataforma nueva desde cero. Esto es lo que hace el MVP realista, barato y rápido de construir.

---

## Capa 0 — Diagnóstico de lo que ya existe (punto de partida real)

| Pieza | Qué es | Cómo se reutiliza aquí |
|---|---|---|
| `herramientas-y-assessment` (este repo) | Sitio estático de GitHub Pages, un archivo HTML autocontenido por herramienta | El nuevo estudio será `estudio-materialidad-express.html` en la raíz |
| `pal-ai-worker/worker.js` | Cloudflare Worker que hace de proxy seguro hacia Groq (`llama-3.3-70b-versatile`), enruta por `body.mode`, valida `ALLOWED_ORIGINS`, nunca expone la API key | Se le agrega un nuevo `mode: "materialidad-*"` con su propio system prompt (no un servicio nuevo) |
| Botones PayPal client-side + `ACCESS_KEY` en `localStorage` | Monetización sin backend de pagos: PayPal SDK + código de acceso maestro para bypass manual/beta | Mismo patrón para el estudio, con precio propio |
| `window.print()` + CSS `@media print` | Exportación a PDF sin librerías | Mismo patrón para el informe final |
| Canvas `drawRadar()` en `assessment_sostenibilidad_ia.html` | Gráfico radar dibujado a mano en `<canvas>`, sin librería de charts | Se adapta a un **scatter plot** (matriz de materialidad) con la misma técnica |
| `projectability-site/index.html` | Landing principal (`www.projectability.net`), sección `#herramientas` con tarjetas que enlazan a `amdavil.github.io/.../*.html` | Se agrega una tarjeta más para el Estudio de Materialidad Exprés |

**Consecuencia directa para la arquitectura:** no se necesita Next.js, ni base de datos, ni backend propio para el MVP. Se necesitaría solo si se pasa a v2 (cuentas de empresa, panel admin, comparables sectoriales).

---

## 1. Concepto general de la herramienta

**Qué es:** una aplicación web de una sola página (self-service) que guía a una empresa, en 45–90 minutos, a través de las 5 etapas de un estudio de materialidad (contexto → grupos de interés → asuntos ESG → evaluación → matriz), y que al final usa IA para redactar un **informe profesional exportable**, con enfoques de gestión PHVA para los asuntos más críticos.

**A quién resuelve el problema:** empresas PyME y de tamaño medio en LatAm que:
- Necesitan un estudio de materialidad para arrancar su estrategia ESG, un reporte GRI, o responder a un cliente/aliado que lo pide.
- No tienen equipo de sostenibilidad, ni presupuesto para una consultoría de materialidad tradicional (que normalmente toma semanas y cuesta miles de dólares en honorarios de entrevistas y facilitación).
- Prefieren un resultado *"suficientemente bueno para actuar hoy"* frente a un proceso perfecto que nunca empieza.

**Lo que NO es (y debe decirse explícitamente en el producto):** no es una auditoría, no es una verificación externa, no reemplaza la consulta real y documentada a grupos de interés que exigen GRI/ESRS para un reporte formal. Es un **diagnóstico exprés de priorización estratégica** que la empresa puede robustecer después. Este matiz debe aparecer en la portada del informe, en la metodología y en el disclaimer legal — igual que ya hace `reporte-gri-express.html` con su enfoque no certificador.

## 2. Nombre sugerido del producto

**"Estudio de Materialidad Exprés"** como nombre funcional (consistente con "Diagnóstico de Circularidad" y "Reporte GRI Express" ya existentes — el usuario ya reconoce el patrón "Projectability + [proceso] + Exprés/Express").

Nombre de marca corto para navegación/URL: **MaterialidadPAL** (archivo: `estudio-materialidad-express.html`, hashtag interno `#MATPAL`).

Alternativas descartadas: "Brújula de Materialidad" (bonito pero rompe el naming existente), "ESG Focus" (no dice qué hace).

## 3. Descripción del MVP

El MVP es una sola página HTML/JS (sin build, sin backend propio) con:

1. Wizard de 8 pasos (perfil → grupos de interés → asuntos ESG → evaluación GI → evaluación empresa → matriz → informe → descarga).
2. Bancos de datos embebidos en JS: 20 grupos de interés base, ~45 asuntos ESG base con mapeo GRI/ODS.
3. Motor de scoring 100% cliente (fórmulas simples, ver secciones 8–9), sin llamada a IA para calcular — la IA solo redacta y explica.
4. Un único punto de contacto con IA: `pal-ai-worker` (nuevo modo `materialidad-informe`), que recibe el JSON de resultados y devuelve texto redactado (resumen ejecutivo, justificaciones, PHVA, recomendaciones).
5. Matriz de materialidad dibujada en `<canvas>` (scatter, sin librería externa).
6. Exportación: PDF vía impresión de navegador; Excel vía SheetJS (única librería externa nueva, CDN, ~30 KB).
7. Monetización: gratis hasta ver la matriz + 3 asuntos críticos → pago único (PayPal) o código de acceso para desbloquear el informe completo con IA y exportación.
8. Persistencia: `localStorage` (una empresa = un estudio por navegador). Sin login, sin base de datos.

Fuera del MVP explícitamente (ver roadmap): doble materialidad financiera completa (IFRS S1/S2 cuantitativa), cuentas multiempresa, panel admin, exportación Word real, benchmarking sectorial, encuestas reales a grupos de interés.

## 4. Arquitectura técnica recomendada (MVP)

```
┌─────────────────────────────────────────────────────────┐
│  Navegador del usuario                                    │
│  estudio-materialidad-express.html (HTML+CSS+JS vanilla)  │
│   - Wizard UI                                              │
│   - Motor de scoring (JS puro)                              │
│   - Render de matriz (Canvas 2D)                            │
│   - Estado en localStorage                                  │
│   - PayPal SDK (checkout)                                   │
│   - SheetJS (export Excel)                                  │
│   - window.print() (export PDF)                             │
└───────────────┬─────────────────────────────────────────┘
                │ fetch POST (solo al pedir redacción IA)
                ▼
┌─────────────────────────────────────────────────────────┐
│  Cloudflare Worker: pal-ai-worker (ya existe, se extiende) │
│   - Valida origin (ALLOWED_ORIGINS + nuevo localhost dev)  │
│   - mode === "materialidad-informe" → MATERIALIDAD_PROMPT  │
│   - Guarda GROQ_API_KEY como secret (nunca en cliente)      │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
        Groq API (llama-3.3-70b-versatile)
```

Justificación de cada decisión:

| Decisión | Por qué |
|---|---|
| Sin framework (no React/Next.js) | Los 4 productos hermanos ya son HTML vanilla; introducir un framework rompe consistencia, obliga a build pipeline y CI nuevo, y no aporta valor al usuario final para un wizard de 8 pasos |
| Sin backend propio | El único cómputo servidor-dependiente es "redactar texto con IA", y ya existe `pal-ai-worker` para eso |
| Sin base de datos | El MVP es de una sesión: la empresa hace su estudio y se lo lleva. No hay necesidad de comparar estudios entre sí todavía (eso es v2) |
| Groq/llama-3.3-70b (no OpenAI) | Ya es el modelo pagado y probado en producción para GRI Express y Circularidad; añadir un segundo proveedor de IA duplica costos y secretos sin necesidad |
| PayPal client-side | Ya funciona en circularidad, la cuenta business ya existe, cero integración nueva de backend de pagos |
| Canvas 2D a mano para la matriz | Mismo patrón que `drawRadar()`; evita cargar Chart.js/D3 (~200 KB) para un solo scatter plot |

## 5. Stack tecnológico recomendado

| Capa | MVP (v1) | V2 | V3 / futuro |
|---|---|---|---|
| Frontend | HTML + CSS + JS vanilla (1 archivo) | Igual, o migrar a módulos JS si crece mucho | React/Next.js si se necesita panel multiempresa |
| Backend IA | Cloudflare Worker `pal-ai-worker` (existente, extendido) | Igual | Igual, posiblemente con más modelos |
| Base de datos | Ninguna (localStorage) | Supabase (Postgres + Auth incluida, capa gratuita generosa) | Supabase o Postgres administrado |
| Autenticación | Ninguna (código de acceso / pago) | Supabase Auth (magic link por correo) | SSO empresarial si un gremio lo pide |
| Pagos | PayPal Buttons (client-side) | Igual + webhook de verificación server-side | Pasarela local (Wompi/ePayco) si hay volumen en Colombia |
| Export PDF | `window.print()` + CSS print | Igual, o Puppeteer en un worker si se necesita pixel-perfect | Generación de PDF con marca dinámica (agencias white-label) |
| Export Excel | SheetJS (CDN) | Igual | Igual |
| Export Word | — (no en MVP) | `docx` (JS) generado client-side | Plantilla Word con estilos corporativos del cliente |
| Hosting | GitHub Pages (ya existe) | Igual | Igual o Cloudflare Pages si se necesita SSR |
| Analítica | Ninguna o Plausible/GA4 básico | Plausible self-hosted o GA4 + eventos de embudo | Dashboard propio de producto |

**Por qué NO Next.js/Postgres desde ya:** el enunciado del ejercicio original pedía evaluarlo, pero forzar ese stack aquí violaría "MVP realista, de bajo costo, rápido" — significaría montar un proyecto nuevo, un pipeline de CI/CD nuevo, una base de datos nueva y credenciales nuevas, cuando el problema de negocio (un wizard + scoring + un informe con IA) ya está resuelto en este repo con el patrón vigente. Se reserva Next.js + Supabase para v2, cuando el valor real (cuentas, comparación histórica, multiusuario) lo justifique.

## 6. Modelo de datos

En el MVP este modelo vive como **un único objeto JSON en `localStorage`** (`materialidadState`). Se documenta ya en forma relacional para que la migración a Supabase en v2 sea directa.

| Entidad | Campos principales | Tipo | Relaciones | Reglas |
|---|---|---|---|---|
| `empresa` | id, nombre, sector, tamaño, pais, ciudad, num_empleados, productos, mercados, tipo_operacion, madurez_esg, tiene_estrategia_esg (bool), tiene_reporte_previo (bool), certificaciones (text), riesgos_percibidos (text), oportunidades_percibidas (text) | uuid, texto, enum | 1—N con `estudio` | `sector` limita el banco de asuntos y grupos sugeridos |
| `usuario` | id, empresa_id, nombre, correo, rol | uuid, texto | N—1 con `empresa` | Solo aplica desde v2 (auth) |
| `estudio` | id, empresa_id, nombre_estudio, fecha_creacion, estado (borrador/pagado/finalizado), version | uuid, texto, enum, int | 1—N con `grupo_interes_eval`, `asunto_eval`; 1—1 con `matriz`, `reporte` | `version` incrementa si la empresa repite el estudio (histórico v2) |
| `grupo_interes` (catálogo) | id, nombre, descripcion, sectores_sugeridos[] | uuid, texto, array | catálogo global, no depende de empresa | Editable solo por admin/IA, no por la empresa final |
| `grupo_interes_eval` | id, estudio_id, grupo_id, nombre_personalizado, influencia, afectacion, dependencia, urgencia, legitimidad, cercania, riesgo_reputacional, oportunidad, score_total, prioridad (alta/media/baja), justificacion_ia | uuid, int(1-5) x8, decimal, enum, texto | N—1 con `estudio`, N—1 con `grupo_interes` | Score calculado client-side, ver sección 8 |
| `asunto_esg` (catálogo) | id, nombre, dimension (Ambiental/Social/Gobernanza), descripcion, estandares_relacionados[] (GRI/ESRS/SASB/ODS), sectores_sugeridos[] | uuid, texto, enum, array | catálogo global | Banco base ~45 asuntos, ver Módulo 3 |
| `asunto_eval` | id, estudio_id, asunto_id, nombre_personalizado, grupos_vinculados[] (fk grupo_interes_eval), criterios_gi{5 x 1-5}, criterios_empresa{10 x 1-5}, score_gi, score_empresa, score_combinado, nivel_materialidad (critico/alto/medio/seguimiento), materialidad_impacto (bool), materialidad_financiera (bool), justificacion_ia | uuid, texto, jsonb, decimal, enum, bool | N—1 con `estudio`, N—1 con `asunto_esg` | Ver fórmulas sección 9 |
| `matriz` | id, estudio_id, imagen_base64 o svg, config_ejes, fecha_generacion | uuid, texto/blob, jsonb, fecha | 1—1 con `estudio` | Se regenera cada vez que cambian evaluaciones |
| `enfoque_phva` | id, asunto_eval_id, planificar{objetivo,politica,meta,indicadores,responsables,recursos}, hacer{acciones,programas,cronograma,aliados,herramientas}, verificar{indicadores_seguimiento,frecuencia,evidencias,auditoria,tablero}, actuar{mejoras,ajustes,decisiones,escalamiento,comunicacion} | uuid, jsonb x4 | 1—1 con `asunto_eval` | Solo se genera para nivel crítico/alto |
| `recomendacion` | id, estudio_id, plazo (corto/mediano/largo), texto, tipo (riesgo/oportunidad) | uuid, enum, texto | N—1 con `estudio` | Redactadas por IA a partir de asuntos críticos/altos |
| `reporte` | id, estudio_id, formato (pdf/excel), fecha_generacion, hash_version | uuid, enum, fecha, texto | N—1 con `estudio` | En MVP es una URL/blob temporal, no se almacena en servidor |
| `historial_version` | id, estudio_id, version, fecha, cambios_resumen | uuid, int, fecha, texto | N—1 con `estudio` | Solo v2, cuando exista persistencia real |

## 7. Flujo UX paso a paso (wizard de 8–9 pantallas)

| Pantalla | Objetivo | Elementos clave | Salida |
|---|---|---|---|
| 0. Bienvenida | Explicar el proceso, tiempo estimado (45-90 min), y el disclaimer metodológico | Texto corto + 3 bullets + botón "Comenzar" + aviso Ley 1581 (mismo componente ya usado en circularidad/GRI) | — |
| 1. Perfil de empresa | Capturar Módulo 1 | Formulario en 2 columnas, selects para sector/tamaño/tipo de operación, textareas cortas para riesgos/oportunidades | `empresa` |
| 2. Grupos de interés | Sugerir 10-14 grupos según sector, permitir agregar/quitar | Chips seleccionables + campo "agregar otro" | Lista base de `grupo_interes_eval` |
| 3. Priorización de grupos | Evaluar los 8 criterios por grupo | Sliders 1-5 por criterio, uno por grupo, con acordeón para no saturar | `grupo_interes_eval` completo + score |
| 4. Banco de asuntos ESG | Mostrar banco filtrado por sector, permitir editar/agrupar/agregar | Tabla con checkbox + dimensión (color A/S/G) + campo de estándar sugerido | Lista de `asunto_eval` (sin evaluar aún) |
| 5. Evaluación — grupos de interés | Para cada asunto, calificar los 5 criterios de importancia para GI | Misma UI de sliders, agrupada por asunto | `score_gi` |
| 6. Evaluación — empresa | Para cada asunto, calificar los 10 criterios de importancia para la empresa | Sliders agrupados, con ayuda contextual ("¿qué significa riesgo regulatorio aquí?") | `score_empresa`, `score_combinado`, `nivel_materialidad` |
| 7. Matriz de materialidad | Mostrar el scatter, permitir arrastrar ligeramente un punto si el usuario justifica el ajuste manual | Canvas interactivo, leyenda por dimensión, filtro por nivel | `matriz` + ajustes manuales registrados con justificación |
| 8. Informe con IA | Botón "Generar informe" → llamada a `pal-ai-worker` → preview del informe completo | Loading state, luego documento navegable por secciones (índice lateral, igual patrón que `reporte-gri-express.html`) | `reporte` en memoria |
| 9. Descarga y siguientes pasos | Exportar PDF/Excel, y CTA de "agenda una sesión de profundización con Projectability" | Botones de export + botón de contacto/calendly | Conversión a lead/consultoría |

Principio de diseño: cada pantalla tiene **una sola idea**, botones "Atrás/Continuar" fijos, barra de progreso en el sidebar (igual patrón ya usado en `diagnostico-circularidad.html`), y el estado se autoguarda en cada paso (no se pierde nada si el usuario cierra el navegador).

## 8. Sistema de scoring — Grupos de interés

8 criterios, escala 1–5, con dos pesos distintos: los que indican **poder/urgencia** (afectan qué tan alto debe ir el grupo) pesan más que los de contexto.

```
score_grupo = (
    influencia          * 1.5 +
    dependencia         * 1.0 +
    afectacion          * 1.5 +
    urgencia            * 1.2 +
    legitimidad         * 1.0 +
    cercania_operacion  * 0.8 +
    riesgo_reputacional * 1.3 +
    oportunidad         * 1.0
) / 9.3   // suma de pesos, normaliza a escala 1-5

Clasificación:
  score >= 3.8            → Prioridad ALTA
  2.6 <= score < 3.8       → Prioridad MEDIA
  score < 2.6              → Prioridad BAJA
```

Esta fórmula está inspirada en el modelo de Mitchell, Agle & Wood (poder, legitimidad, urgencia) que subyace a AA1000, simplificado a pesos declarados y trazables (no una caja negra). Los pesos se muestran al usuario ("por qué influencia pesa más que cercanía") para cumplir el requisito de explicabilidad del Módulo 16.

**Justificación automática (regla, no IA):** se genera una frase corta por umbral, ej.: *"Se clasifica como prioridad alta principalmente por su alto nivel de influencia (5/5) y riesgo reputacional (4/5)."* — se toman los 2 criterios de mayor puntaje del grupo y se arma la frase con una plantilla. La IA solo la pule/enriquece en el informe final, no decide el nivel.

## 9. Sistema de scoring — Asuntos materiales

**A. Relevancia para grupos de interés** (5 criterios, 1–5): frecuencia, sensibilidad, afectación, expectativa de gestión, relevancia para confianza/licencia social.

```
score_gi(asunto) = promedio(los 5 criterios)   // 1.0 – 5.0
```

Ponderado adicionalmente por qué tan prioritarios son los grupos vinculados a ese asunto:

```
peso_grupos(asunto) = promedio( score_grupo de cada grupo_interes_eval vinculado ) / 5
score_gi_final(asunto) = score_gi(asunto) * (0.7 + 0.3 * peso_grupos(asunto))
```//

Esto asegura que un asunto que solo le importa a un grupo de baja prioridad no suba artificialmente al mismo nivel que uno que le importa a un grupo de prioridad alta.

**B. Relevancia para la empresa** (10 criterios, 1–5): impacto financiero, riesgo operativo, riesgo legal/regulatorio, riesgo reputacional, continuidad del negocio, oportunidad de innovación, oportunidad de eficiencia, oportunidad comercial, alineación estratégica, capacidad de gestión actual (este último se invierte: baja capacidad = mayor urgencia).

```
score_empresa(asunto) = promedio( impacto_financiero, riesgo_operativo, riesgo_legal,
                                   riesgo_reputacional, continuidad, oportunidad_innovacion,
                                   oportunidad_eficiencia, oportunidad_comercial,
                                   alineacion_estrategica, (6 - capacidad_gestion) )
```

**C. Score combinado y nivel de materialidad:**

```
score_combinado(asunto) = (score_gi_final * 0.5) + (score_empresa * 0.5)

Clasificación:
  score_combinado >= 4.2                                  → Material CRÍTICO
  3.4 <= score_combinado < 4.2                             → Material ALTO
  2.5 <= score_combinado < 3.4                             → Material MEDIO
  score_combinado < 2.5                                    → No prioritario / seguimiento
```

**D. Doble materialidad (ESRS-lite):**

```
materialidad_impacto     = score_gi_final       >= 3.4   // el asunto impacta a personas/planeta
materialidad_financiera  = score_empresa        >= 3.4   // el asunto impacta al desempeño financiero

Clasificación cruzada:
  impacto=true  & financiera=true   → "Material en doble vía" (prioridad máxima de reporte)
  impacto=true  & financiera=false  → "Material por impacto"
  impacto=false & financiera=true   → "Material financiero"
  impacto=false & financiera=false  → "No material" (seguimiento)
```

Nota metodológica obligatoria en el informe: esto es una **aproximación cualitativa exprés**; ESRS exige un análisis de doble materialidad más riguroso, con evidencia cuantitativa de impactos y de exposición financiera, normalmente con consulta directa a grupos de interés — cosa que el estudio exprés no reemplaza.

## 10. Lógica de la matriz de materialidad

- **Eje X (0–5):** `score_empresa` de cada asunto.
- **Eje Y (0–5):** `score_gi_final` de cada asunto.
- **Color del punto:** dimensión ESG (verde=Ambiental, azul=Social, morado=Gobernanza — reutilizar la paleta ya definida en `--green/--blue/--lav` de `diagnostico-circularidad.html`).
- **Tamaño del punto:** proporcional al `score_combinado` (los críticos se ven más grandes).
- **Cuadrantes de fondo:** 4 zonas sombreadas suaves (crítico arriba-derecha, seguimiento abajo-izquierda, dos zonas mixtas), con las etiquetas de nivel superpuestas.
- **Interacción:** hover muestra tooltip con nombre del asunto + los 2 scores; click abre el detalle del asunto (criterios que lo llevaron ahí).
- **Ajuste manual:** el usuario puede arrastrar un punto dentro de un rango limitado (±0.5 en cada eje) — **obligatorio registrar una justificación de texto** que quede en el informe como nota de ajuste experto (cumple Módulo 16: "permitir ajustes manuales justificados").
- **Vista de doble materialidad:** un segundo canvas/tab con los mismos puntos pero coloreados por la clasificación cruzada de la sección 9D en vez de por dimensión ESG.
- **Exportación de imagen:** `canvas.toDataURL("image/png")` (mismo patrón ya usado en `reporte-gri-express.html:1298-1302` para comprimir imágenes), se inserta directamente en el informe HTML y se incluye en el PDF vía impresión.

## 11. Prompts internos de IA (reutilizables, para agregar a `pal-ai-worker`)

Se propone añadir un solo `mode: "materialidad-informe"` (evitar fragmentar en 5 llamadas separadas —cada llamada sería más lenta y más cara). El worker recibe un único payload con todo el contexto y devuelve todas las piezas de texto en un solo JSON, siguiendo exactamente el patrón ya usado por `SYSTEM_PROMPT` en `worker.js`.

**System prompt propuesto (`MATERIALIDAD_SYSTEM_PROMPT`):**

```
Eres PAL, consultor senior en sostenibilidad corporativa y estudios de materialidad de
Projectability, con dominio de GRI Standards, ESRS/CSRD (doble materialidad), IFRS S1/S2,
SASB y AA1000.

Recibirás un JSON "context" con:
- empresa: datos de perfil (sector, tamaño, país, madurez ESG, riesgos y oportunidades declaradas)
- grupos_interes: lista con nombre, scores de los 8 criterios, score_total, prioridad
- asuntos: lista con nombre, dimension (A/S/G), score_gi, score_empresa, score_combinado,
  nivel_materialidad, materialidad_impacto, materialidad_financiera, grupos_vinculados

Tu tarea — generar TODO en un solo JSON de salida, con estas reglas transversales:
1. Español neutro latinoamericano, tono profesional, ejecutivo y cercano (trato de "usted").
2. NUNCA inventes cifras, certificaciones, incidentes o programas específicos de la empresa
   que no estén en "context". Puedes usar tu conocimiento general del sector para dar marco
   (tendencias regulatorias, expectativas típicas de mercado), nunca para atribuir hechos
   concretos a esta empresa.
3. Este es un estudio EXPRÉS de priorización estratégica, no una auditoría ni una
   certificación. No uses lenguaje que sugiera cumplimiento normativo formal o verificación
   externa. Donde sea relevante, señala explícitamente que el resultado requiere validación
   con los grupos de interés reales antes de reportarlo externamente.
4. Si "context" tiene información insuficiente para una sección (ej. pocos asuntos críticos,
   perfil incompleto), dilo honestamente en esa sección en vez de rellenar con genéricos.

Genera:
- "resumen_ejecutivo": 6-8 frases synthesizing el proceso, hallazgos principales, grupos
  prioritarios, asuntos críticos y una línea de recomendación general.
- "justificaciones_grupos": objeto {nombre_grupo: "1-2 frases explicando su nivel de
  prioridad, referenciando sus 2 criterios de mayor puntaje"} para cada grupo de prioridad
  alta o media.
- "justificaciones_asuntos": objeto {nombre_asunto: "2-3 frases explicando su nivel de
  materialidad"} para cada asunto crítico o alto.
- "lectura_matriz": un párrafo (5-7 frases) de interpretación estratégica de la matriz en
  conjunto: qué patrones se observan, qué dimensión ESG domina los críticos, qué implica para
  la empresa.
- "phva": objeto {nombre_asunto: {planificar, hacer, verificar, actuar}} SOLO para asuntos
  crítico o alto. Cada fase 3-5 frases, concreta y accionable para el sector y tamaño de
  empresa indicados, sin inventar recursos o cifras que la empresa no declaró.
- "recomendaciones": objeto {corto_plazo: [...], mediano_plazo: [...], largo_plazo: [...]},
  cada lista con 3-4 recomendaciones puntuales derivadas de los asuntos críticos/altos.
- "preguntas_validacion": lista de 6-10 preguntas concretas que la empresa debería usar para
  validar estos resultados directamente con sus grupos de interés reales (encuestas,
  entrevistas o grupos focales).
- "indicadores_sugeridos": objeto {nombre_asunto: ["indicador 1", "indicador 2"]} para
  asuntos crítico/alto, indicadores de gestión típicos del sector (no cifras meta, solo
  qué medir).
- "advertencia_metodologica": 3-4 frases fijas de disclaimer (puedes proponer texto, pero
  debe quedar claro que es un diagnóstico exprés que requiere profundización).

Responde ÚNICAMENTE con JSON válido, sin markdown, con las claves exactas indicadas arriba.
```

**Prompts satélite (mismo `mode`, pero disparados en pasos anteriores del wizard, para IA "copiloto" ligera y rápida — llamadas cortas, `max_tokens` bajo):**

| Prompt interno | Cuándo se dispara | Entrada | Salida esperada |
|---|---|---|---|
| `materialidad-sugerir-grupos` | Al entrar a Pantalla 2, si el sector no tiene match exacto en el catálogo | `{sector, tipo_operacion}` | Lista de 10-14 grupos de interés sugeridos con 1 frase de por qué aplican a ese sector |
| `materialidad-sugerir-asuntos` | Al entrar a Pantalla 4 | `{sector, tipo_operacion, riesgos_percibidos}` | Subconjunto priorizado del banco de 45 asuntos + hasta 3 asuntos sectoriales adicionales no listados en el catálogo base |
| `materialidad-explicar-score` | Botón "¿por qué este resultado?" en Pantalla 6/7 | `{asunto, criterios, score}` | 1 párrafo de explicación pedagógica de la fórmula aplicada a ese caso |
| `materialidad-informe` | Pantalla 8 | Ver system prompt completo arriba | JSON completo del informe |

**Cambios concretos en `pal-ai-worker/worker.js`:** agregar `MATERIALIDAD_SYSTEM_PROMPT` como constante, una rama `isMaterialidad = body.mode === "materialidad-informe"` (y variantes ligeras) junto a `isCircularSummary`, y añadir a `ALLOWED_ORIGINS` el puerto de desarrollo local del nuevo archivo (ej. `http://localhost:7802`). No se toca el prompt de GRI ni el de circularidad.

## 12. Estructura del informe final

Se implementa como una vista navegable dentro de la misma página (índice lateral, igual que `reporte-gri-express.html`), imprimible a PDF. Secciones (mapean 1:1 al Módulo 6 del brief, ya detallado ahí — no se repite aquí para no duplicar): Portada → Resumen ejecutivo → Contexto organizacional → Metodología aplicada (con el disclaimer no-certificador) → Grupos de interés → Banco y asuntos ESG → Evaluación y priorización → Matriz de materialidad (imagen + lectura) → Vinculación asuntos↔grupos → PHVA por asunto crítico/alto → Recomendaciones por plazo → Hoja de ruta en 6 fases → Anexos (tablas crudas, glosario, limitaciones).

Elemento nuevo respecto a los productos hermanos: la sección de **"Preguntas para validar con grupos de interés"** (salida de IA) se imprime como anexo — es lo que convierte el estudio exprés en punto de partida de un proceso real, no en un sustituto de él.

## 13. Propuesta de integración con GitHub

**No se crea un repo nuevo.** Se trabaja dentro de `Amdavil/herramientas-y-assessment`, con esta estructura añadida:

```
herramientas-y-assessment/
├── estudio-materialidad-express.html        ← la herramienta (nueva)
├── materialidad-express/                     ← documentación y activos de trabajo (esta carpeta)
│   ├── PROPUESTA.md                          ← este documento
│   ├── banco-asuntos-esg.json                ← catálogo de 45 asuntos (fuente única, se embebe en el HTML en build/copy manual)
│   └── banco-grupos-interes.json             ← catálogo de 20 grupos base
├── pal-ai-worker/
│   ├── worker.js                             ← se le agrega MATERIALIDAD_SYSTEM_PROMPT
│   └── PROMPT-MAESTRO-MATERIALIDAD.md        ← igual patrón que PROMPT-MAESTRO-GRI-EXPRESS.md
└── projectability-site/
    └── index.html                            ← nueva tarjeta en #herramientas
```

**Branches:** dado que el despliegue es GitHub Pages sirviendo directo desde `main`, y el equipo es de 1-2 personas, el flujo `main`/`dev`/`staging` completo es sobre-ingeniería para este repo. Recomendación práctica:
- `main`: siempre desplegable (es lo que ve `amdavil.github.io`).
- Ramas de feature de corta vida: `feat/materialidad-wizard`, `feat/materialidad-informe-ia`, etc., con PR a `main`.
- Reservar una rama `staging` solo si en v2 se agrega backend con datos reales que no se quieran probar en producción.

**Commits:** seguir el estilo que ya usa este repo (`feat:`, `fix:` — visible en el log: *"feat: microactivo Diagnóstico de Oportunidades de Circularidad"*). Ejemplos para este proyecto:
- `feat: wizard de perfil de empresa y grupos de interés (Estudio de Materialidad Exprés)`
- `feat: motor de scoring de asuntos materiales y matriz canvas`
- `feat: modo materialidad-informe en pal-ai-worker`
- `fix: normalizar pesos de score_gi_final cuando no hay grupos vinculados`

**Issues como roadmap:** crear labels `materialidad`, `mvp`, `v2`, `bug`; un issue por épica del backlog (sección 18), con checklist de historias como tareas.

**Variables de entorno / API keys:** ninguna nueva credencial de cliente. La única key sensible (`GROQ_API_KEY`) ya vive como secreto de Cloudflare Worker (`wrangler secret put`), nunca en el HTML ni en el repo. El `paypalClientId` no es secreto (es público por diseño del SDK de PayPal), igual que ya está hardcodeado en `diagnostico-circularidad.html`.

**Despliegue continuo:** GitHub Pages ya despliega `main` automáticamente — no se requiere pipeline nuevo. Para el worker, `wrangler deploy` manual (o un GitHub Action simple con `wrangler-action` si se quiere automatizar, opcional para v2).

## 14. Propuesta de integración con la página web

- **No usar subdominio nuevo** (`materialidad.projectability.net`) en el MVP — agrega configuración DNS/CNAME innecesaria cuando el patrón vigente (`amdavil.github.io/herramientas-y-assessment/estudio-materialidad-express.html` enlazado desde una tarjeta) ya funciona para los otros 4 productos y es donde vive el tráfico actual.
- **Acción concreta:** agregar en `projectability-site/index.html`, junto a las tarjetas de `reporte-gri-express.html` y `diagnostico-circularidad.html` (líneas ~1001-1011), una tercera tarjeta: *"Estudio de Materialidad Exprés — Identifique sus asuntos ESG prioritarios y grupos de interés clave en menos de 90 minutos"* con CTA *"Iniciar mi estudio →"*.
- **Captura de leads:** el paso 1 (perfil de empresa) ya pide correo y nombre de empresa — replicar el patrón de `reporte-gri-express.html`/circularidad de enviar esos datos a donde hoy se centralizan los leads (revisar si ya hay un webhook/Sheet común; si no existe, es una tarea de v1.1, no del MVP estricto).
- **Login para empresas / panel admin / CRM:** quedan en v2, cuando exista Supabase. En el MVP, "login" = código de acceso o pago, igual que en los productos hermanos.
- **Free / demo / pago:** el mismo patrón de circularidad (ver gratis el diagnóstico básico + matriz, pagar por el informe completo con IA y export) es el más probatoriamente ya aceptado por el público de Projectability — se reutiliza tal cual, no se reinventa.

## 15. Roadmap de desarrollo

| Fase | Objetivo | Funcionalidades | Tiempo estimado | Complejidad | Riesgos | Entregable |
|---|---|---|---|---|---|---|
| **1. MVP funcional** | Wizard completo + scoring + matriz, sin IA todavía | Pantallas 0-7, catálogos embebidos, localStorage, matriz canvas | 2-3 semanas (1 dev) | Media | Subestimar el tiempo de UI de sliders/formularios largos | `estudio-materialidad-express.html` navegable end-to-end |
| **2. Generación de informe con IA** | Conectar `pal-ai-worker` y armar la vista de informe | Nuevo `mode`, vista de informe navegable, export PDF (print) | 1 semana | Media | Prompt requiere iteración para no sonar genérico | Informe completo generado y descargable |
| **3. Monetización + integración web** | Cerrar el embudo comercial | PayPal + código de acceso, export Excel (SheetJS), tarjeta en landing | 3-5 días | Baja | Reutiliza patrón existente, bajo riesgo | Producto vendible en producción |
| **4. Panel administrativo** | Ver estudios generados, códigos de acceso usados, leads | Requiere backend real (Supabase) | 2-3 semanas | Alta | Primer componente con backend propio del ecosistema — riesgo de alcance | Panel interno básico |
| **5. Integración avanzada de IA** | Prompts satélite (sugerir grupos/asuntos por sector, explicar score) | Modos ligeros adicionales en el worker | 1 semana | Media | Costos de IA si se llama en cada paso sin control | Wizard más "inteligente" paso a paso |
| **6. Benchmark sectorial** | Comparar resultados de una empresa contra el promedio de su sector | Requiere volumen de datos históricos (solo posible tras Fase 4) | 3-4 semanas | Alta | Sin suficientes estudios acumulados, el benchmark es poco creíble | Sección comparativa en el informe |
| **7. Consulta real a grupos de interés** | Encuestas enviables a stakeholders reales, resultados agregados automáticamente | Formularios públicos + agregación | 3-4 semanas | Alta | Esto convierte el "exprés" en un proceso real — cambia la propuesta de valor, evaluar si conviene como producto separado | Módulo de encuestas |
| **8. Comercialización y escalamiento** | White-label para gremios/consultores ESG, planes por volumen | Multi-tenant, marca personalizable | 4-6 semanas | Alta | Requiere v2 de arquitectura completa (Fase 4 como prerequisito) | Producto licenciable |

**MVP = Fases 1-3.** Todo lo demás es v2/v3 explícitamente.

## 16. Riesgos técnicos y metodológicos

| Riesgo | Tipo | Mitigación |
|---|---|---|
| El usuario interpreta el resultado como una certificación o auditoría | Metodológico / reputacional | Disclaimer visible en portada, metodología e informe; lenguaje del prompt de IA restringido explícitamente (ver sección 11, regla 3) |
| Sesgo de anclaje: el usuario califica todo alto o todo bajo por comodidad | Metodológico | Mostrar distribución en vivo ("la mayoría de sus asuntos están en 4-5, ¿es esto realista?") y permitir comparación entre asuntos en la misma pantalla |
| La IA "alucina" datos específicos de la empresa | Técnico / reputacional | Prompt con instrucción explícita anti-invención (ya probado en `worker.js` con el mismo patrón para GRI/Circularidad) + revisión humana antes de enviar el informe a un tercero |
| `localStorage` se borra (caché del navegador, cambio de equipo) y la empresa pierde su estudio | Técnico | Botón de "exportar/importar estado" (JSON descargable) desde el MVP, sin esperar a v2 con backend |
| Payload de contexto a la IA crece demasiado (empresas con 45 asuntos + 20 grupos) y excede límites de tokens/costo | Técnico | Enviar solo asuntos con `nivel_materialidad` crítico/alto/medio al prompt de PHVA; resumir (no enviar los 45 en detalle) |
| Confusión entre doble materialidad "exprés" (cualitativa) y la exigida formalmente por ESRS/CSRD | Metodológico / legal | Nota explícita en la sección de metodología y en cualquier lugar donde se use el término "doble materialidad" |
| Ajustes manuales de la matriz sin trazabilidad | Metodológico | Obligar justificación de texto en cada ajuste (ya definido en sección 10), y listarlos en el anexo del informe |
| Origen no autorizado abusa del endpoint de IA (costos) | Técnico | Ya mitigado por el patrón `ALLOWED_ORIGINS` + límite de tamaño de payload existente en `worker.js`; replicar igual para el nuevo modo |

## 17. Recomendaciones para convertirlo en producto comercial

| Modelo | Descripción | Precio sugerido de referencia |
|---|---|---|
| Diagnóstico gratuito | Perfil + grupos + matriz básica sin IA ni export | Gratis (embudo de captura de leads) |
| Estudio exprés pago | Todo lo anterior + informe completo con IA + PHVA + export PDF | USD $39–59 (por encima del Diagnóstico de Circularidad a $9.99, dado el mayor alcance analítico y de IA) |
| Informe premium | Estudio exprés + revisión humana de un consultor Projectability (1 llamada de validación) | USD $150–250 |
| Consultoría complementaria | Puente natural desde el informe (CTA "agende su sesión de profundización") hacia servicios de consultoría ESG completos | Cotización directa |
| Licenciamiento a gremios/cámaras | Acceso a un lote de códigos de acceso para sus afiliados | Paquete por volumen (ej. 50 estudios) |
| Plan para consultores ESG | Marca blanca o co-branding, el consultor lo usa como herramienta de diagnóstico inicial con sus clientes | Suscripción mensual (solo viable en v2 con backend) |

La palanca comercial más fuerte es el **embudo ya validado** de esta familia de productos: Diagnóstico gratuito de circularidad/materialidad → informe pago con IA → CTA de consultoría. No inventar un modelo de negocio nuevo; extender el que ya está funcionando (confirmado por memoria del proyecto: PayPal Business ya en vivo, códigos de acceso ya gestionados).

## 18. Backlog inicial (épicas → historias → tareas técnicas)

### Épica A — Perfil de empresa y contexto inicial
- **Historia A1:** Como empresa, quiero ingresar mis datos básicos para que la herramienta adapte los siguientes pasos a mi sector.
  - Tarea: formulario Pantalla 1 con validación mínima (campos obligatorios: nombre, sector, tamaño).
  - Tarea: función `inferirContextoInicial(empresa)` que preselecciona grupos/asuntos por sector desde los catálogos JSON.
- **Historia A2:** Como empresa, quiero que mis respuestas se guarden automáticamente para no perder el progreso.
  - Tarea: `saveState()`/`loadState()` sobre `localStorage`, con botón manual de exportar/importar JSON.

### Épica B — Grupos de interés
- **Historia B1:** Como empresa, quiero ver una lista sugerida de grupos de interés relevantes a mi sector.
  - Tarea: catálogo `banco-grupos-interes.json` con 20 grupos + `sectores_sugeridos`.
  - Tarea: UI de chips seleccionables + "agregar grupo personalizado".
- **Historia B2:** Como empresa, quiero calificar cada grupo en 8 criterios para obtener su nivel de prioridad.
  - Tarea: componente de sliders reutilizable (1-5) con acordeón por grupo.
  - Tarea: función `scoreGrupo(criterios)` (sección 8) + clasificación.
  - Tarea: plantilla de justificación automática basada en los 2 criterios top.

### Épica C — Banco de asuntos ESG
- **Historia C1:** Como empresa, quiero ver un banco de asuntos ESG ajustado a mi sector, y poder editarlo.
  - Tarea: catálogo `banco-asuntos-esg.json` (~45 asuntos, dimensión, estándares relacionados, sectores sugeridos).
  - Tarea: UI de tabla con checkbox + edición de nombre + "agrupar asuntos similares" (merge simple de 2 filas).
  - Tarea: vínculo asunto↔grupos de interés (multiselect).

### Épica D — Evaluación y scoring de materialidad
- **Historia D1:** Como empresa, quiero calificar cada asunto desde la perspectiva de mis grupos de interés.
  - Tarea: UI de sliders (5 criterios) por asunto + función `scoreGI(asunto)` (sección 9A).
- **Historia D2:** Como empresa, quiero calificar cada asunto desde la perspectiva del negocio.
  - Tarea: UI de sliders (10 criterios) por asunto + función `scoreEmpresa(asunto)` (sección 9B).
- **Historia D3:** Como empresa, quiero ver el nivel de materialidad final de cada asunto y entender por qué.
  - Tarea: función `scoreCombinado()` + `clasificarMaterialidad()` (sección 9C) + botón "¿por qué?" con explicación regla-basada (fallback si IA no responde).

### Épica E — Matriz de materialidad
- **Historia E1:** Como empresa, quiero ver mis asuntos ubicados visualmente en una matriz.
  - Tarea: función `dibujarMatriz(canvas, asuntos)` (adaptar `drawRadar` a scatter).
  - Tarea: tooltips on hover + click-to-detail.
- **Historia E2:** Como empresa, quiero poder ajustar manualmente un punto si no refleja mi realidad.
  - Tarea: drag limitado (±0.5) + modal de justificación obligatoria.
- **Historia E3:** Como empresa, quiero ver una vista de doble materialidad.
  - Tarea: segunda vista con clasificación cruzada (sección 9D) + toggle entre vistas.

### Épica F — Informe con IA
- **Historia F1:** Como empresa, quiero generar un informe profesional redactado automáticamente.
  - Tarea: agregar `MATERIALIDAD_SYSTEM_PROMPT` y rama `mode` en `pal-ai-worker/worker.js`.
  - Tarea: función cliente `generarInformeIA(context)` con manejo de error/reintento (patrón ya en circularidad `AI.endpoint`).
  - Tarea: vista de informe navegable por índice (adaptar de `reporte-gri-express.html`).
- **Historia F2:** Como empresa, quiero que el informe incluya un disclaimer claro de que no es una certificación.
  - Tarea: bloque fijo de metodología + advertencia, no dependiente de la IA (texto controlado por el equipo, no generado).

### Épica G — Exportación
- **Historia G1:** Como empresa, quiero descargar el informe en PDF.
  - Tarea: CSS `@media print` + botón `window.print()` (patrón existente).
- **Historia G2:** Como empresa, quiero descargar mis datos en Excel.
  - Tarea: integrar SheetJS, función `exportarExcel(estudio)` con hojas: Grupos, Asuntos, Matriz.

### Épica H — Monetización y acceso
- **Historia H1:** Como visitante, quiero probar el diagnóstico gratis y pagar solo por el informe completo.
  - Tarea: gate de contenido tras Pantalla 7 (matriz visible, informe bloqueado).
  - Tarea: botones PayPal (reutilizar `paypalClientId` existente) + `grantAccess()`/`hasAccess()` (patrón existente).
  - Tarea: código de acceso maestro para pruebas internas/beta.

### Épica I — Integración con el sitio y despliegue
- **Historia I1:** Como visitante del sitio de Projectability, quiero encontrar el nuevo estudio desde la landing.
  - Tarea: nueva tarjeta en `projectability-site/index.html` (#herramientas).
  - Tarea: `sitemap.xml` actualizado si aplica.
- **Historia I2:** Como equipo, queremos que el worker acepte el nuevo modo sin romper los otros productos.
  - Tarea: agregar origin de desarrollo local al `ALLOWED_ORIGINS`.
  - Tarea: prueba manual de regresión sobre GRI Express y Circularidad tras el cambio al worker compartido.

## 19. Criterios de aceptación del MVP

- [ ] Una empresa puede completar el wizard completo (pantallas 0-9) sin recargar la página ni perder datos.
- [ ] El estado persiste en `localStorage` y sobrevive a un refresh del navegador.
- [ ] Al menos 10 grupos de interés y 30 asuntos ESG están precargados y filtrables por sector.
- [ ] Las fórmulas de scoring (secciones 8 y 9) están implementadas en JS puro, son testeables sin llamar a IA, y su resultado es determinístico dado el mismo input.
- [ ] La matriz de materialidad se renderiza correctamente para 5, 15 y 45 asuntos sin solaparse ilegiblemente (mínimo: jitter o agrupación visual si hay puntos superpuestos).
- [ ] El botón "Generar informe con IA" produce las 8 piezas de contenido definidas en la sección 11, o falla con un mensaje claro y opción de reintento (mismo patrón de manejo de errores que `diagnostico-circularidad.html`).
- [ ] El informe deja explícito, sin ambigüedad, que es un estudio exprés y no una auditoría/certificación (verificable por lectura humana, no solo por prompt).
- [ ] El export a PDF (impresión) produce un documento legible, sin elementos de navegación/UI cortados.
- [ ] El export a Excel contiene al menos las hojas de Grupos de Interés y Asuntos ESG con sus scores.
- [ ] El flujo de pago (PayPal) y el de código de acceso maestro desbloquean correctamente el contenido, verificado con al menos una transacción de prueba y un código.
- [ ] El worker `pal-ai-worker` responde al nuevo `mode` sin afectar el comportamiento de los modos existentes (regresión verificada manualmente en GRI Express y Circularidad).
- [ ] Ningún secreto (API key de Groq) aparece en el HTML, en el JS del cliente, ni en el repositorio.

## 20. Recomendación final sobre cómo empezar

1. **Esta semana:** crear `banco-grupos-interes.json` y `banco-asuntos-esg.json` (Épicas B1/C1) — es trabajo de contenido ESG, no de código, y desbloquea todo lo demás. Puede hacerse en paralelo al scaffold del HTML.
2. **Scaffold del archivo:** copiar la estructura de `diagnostico-circularidad.html` (layout `aside`/`main`, sistema de `state` + `save()`, patrón de `ACCESS_KEY`) como punto de partida de `estudio-materialidad-express.html`, en vez de empezar en blanco — es la forma más rápida de mantener consistencia visual y de reducir errores.
3. **Construir el wizard sin IA primero** (Épicas A-E): perfil → grupos → asuntos → evaluación → matriz. Esto ya es un producto demostrable y valioso por sí solo (una empresa podría usarlo gratis solo para ver su matriz), y permite validar con 2-3 empresas reales de la cartera de Projectability antes de invertir en el prompt de IA.
4. **Conectar la IA al final** (Épica F): en este punto ya se tiene payload real de empresas piloto para iterar el prompt del informe con casos reales, en vez de datos inventados.
5. **Activar monetización e integración web al final** (Épicas H-I), cuando el flujo completo ya esté validado con al menos un piloto gratuito exitoso.
6. **No paralelizar con v2** (Supabase, panel admin, benchmarking): esperar a tener el MVP vendiendo antes de justificar esa inversión.

Punto de partida concreto de la próxima sesión de trabajo: generar los dos catálogos JSON (grupos y asuntos) con el detalle sectorial completo, y el esqueleto HTML de `estudio-materialidad-express.html` con las pantallas 0-2 funcionando.
