# Inventario GEI Exprés — Propuesta de producto y documento base de construcción

Mesa de trabajo: arquitectura de software, IA aplicada, consultoría en inventarios GEI (GHG Protocol, ISO 14064-1, IPCC), estrategia ESG.
Cliente interno: Projectability / Soluciones PAL S.A.S.
Repositorio: `Amdavil/herramientas-y-assessment` (GitHub Pages → `https://amdavil.github.io/herramientas-y-assessment/`)

> Este documento asume la infraestructura que **ya existe** en este repositorio (`diagnostico-circularidad.html`, `reporte-gri-express.html`, `estudio-materialidad-express.html`, `adn-sostenible.html`, `assessment_sostenibilidad_ia.html`, `pal-ai-worker/`) y diseña el Inventario GEI Exprés como el **sexto producto de la misma familia**, no como una plataforma nueva. Es la herramienta metodológicamente más pesada de la familia (cálculo numérico trazable, factores de emisión, alcances), así que el MVP acota deliberadamente el alcance de cálculo automático a Alcance 1 y 2, dejando Alcance 3 completo para v2.

---

## Capa 0 — Diagnóstico de lo que ya existe (punto de partida real)

| Pieza | Qué es | Cómo se reutiliza aquí |
|---|---|---|
| `herramientas-y-assessment` (este repo) | Sitio estático GitHub Pages, un HTML autocontenido por herramienta | Nueva herramienta: `inventario-gei-express.html` en la raíz |
| `pal-ai-worker/worker.js` | Cloudflare Worker proxy a Groq (`llama-3.3-70b-versatile`), enruta por `body.mode`, valida `ALLOWED_ORIGINS`, la API key nunca sale del servidor | Se agregan modos nuevos: `gei-informe`, `gei-sugerir-fuentes`, `gei-explicar-resultado`, `gei-plan-gestion` (mismo patrón que `materialidad-*`) |
| Botones PayPal + `ACCESS_KEY` en `localStorage` | Monetización sin backend de pagos | Mismo patrón, precio propio (ver Módulo 18) |
| `window.print()` + CSS `@media print` | Exportación PDF sin librerías | Mismo patrón para el informe final de inventario |
| Canvas `drawRadar()` / scatter de materialidad | Gráficos dibujados a mano en `<canvas>`, sin librería | Se reutiliza la técnica para barras (por alcance/fuente) y donut (distribución %); ver Módulo 8 |
| SheetJS (ya incorporado en materialidad-express para exportar Excel) | Export a `.xlsx` client-side | Se reutiliza para exportar la base de cálculo y el banco de factores de emisión |
| `projectability-site/index.html` | Landing con sección `#herramientas` | Se agrega tarjeta "Inventario GEI Exprés" |

**Consecuencia directa para la arquitectura:** no se necesita Next.js, base de datos propia ni backend de cálculo. El motor de cálculo es JS puro en el navegador — esto es, además, un requisito metodológico: la trazabilidad exige que cada tCO₂e resultante pueda explicarse como `dato_actividad × factor_emisión`, visible y auditable, no una caja negra de servidor.

**Diferencia clave frente a los productos anteriores:** en materialidad/circularidad la IA puede redactar libremente sobre un scoring cualitativo. Aquí la IA **nunca calcula ni decide un número** — solo interpreta, redacta y sugiere. El cálculo es 100% determinístico y reproducible en el cliente. Esta separación es el principio de diseño más importante de toda la herramienta.

---

## 1. Concepto general de la herramienta

Aplicación web de una sola página que guía a una organización, en un flujo de wizard de ~10 pasos, a construir su inventario de emisiones de GEI bajo GHG Protocol / ISO 14064-1: caracterización → límites organizacionales → límites operacionales (selección de fuentes por alcance) → captura de datos de actividad → selección de factores de emisión → cálculo automático y trazable → validación de calidad → dashboard → plan de gestión de emisiones (evitar → reducir → sustituir → compensar) → informe descargable.

**A quién resuelve el problema:** pymes, instituciones, fundaciones y organizaciones sin equipo de sostenibilidad que necesitan un primer inventario de Alcance 1 y 2 (con puerta abierta a Alcance 3) para responder a un cliente, iniciar su estrategia ESG, o alimentar un reporte GRI/CDP/Pacto Global, sin pagar semanas de consultoría tradicional para un primer corte.

**Lo que NO es (debe decirse explícitamente en portada, metodología y disclaimer legal):** no es un inventario verificado, certificado ni auditado. No sustituye una verificación externa bajo ISO 14064-3 quien la organización necesite para mercados de carbono o reportes regulados. Es un **cálculo asistido y trazable** con base en la información y los factores de emisión que la organización aporta o selecciona.

## 2. Nombres sugeridos para el producto

**"Inventario GEI Exprés"** — consistente con el naming ya validado de la familia (Diagnóstico de Circularidad, Reporte GRI Express, Estudio de Materialidad Exprés). Archivo: `inventario-gei-express.html`. Marca corta interna: **HuellaPAL**.

Alternativas descartadas: "Calculadora de Carbono" (suena a herramienta genérica gratuita tipo ONG, no a producto consultivo pago), "ClimaScope" (rompe el patrón de naming existente).

## 3. Descripción del MVP

Página única HTML/JS sin build ni backend propio:

1. Wizard de 10 pasos (organización → límites organizacionales → alcances a calcular → fuentes de emisión Alcance 1/2 → datos de actividad → factores de emisión → resultados → dashboard → plan de gestión → informe).
2. Banco de factores de emisión embebido en JS para Colombia/LatAm (combustibles fósiles estándar IPCC/GHG Protocol, factor de red eléctrica nacional cuando esté documentado) — editable y ampliable por el usuario, **nunca inventado por la IA**.
3. Motor de cálculo 100% cliente: `emisión_kgCO2e = dato_actividad × factor_emisión`, con conversión de unidades y suma por fuente/alcance/organización. Sin llamada a IA para calcular.
4. Alcance 3 en el MVP: **solo 3 categorías simplificadas** (viajes de negocios, desplazamiento de empleados, residuos) con factores gruesos documentados como estimación — el resto de las 15 categorías de Alcance 3 quedan marcadas "disponibles en v2" para no prometer precisión que el MVP no puede sostener.
5. Único punto de contacto con IA: `pal-ai-worker` con 4 modos nuevos (ver Módulo 17) — interpreta resultados, sugiere fuentes por sector, redacta el plan de gestión y el informe. Nunca calcula ni inventa factores.
6. Gráficos en `<canvas>`: barras por alcance/fuente, donut de distribución %, tabla de calidad de datos. Sin librería de charts.
7. Exportación: PDF vía impresión de navegador; Excel (base de cálculo + factores usados) vía SheetJS.
8. Monetización: gratis hasta ver totales por alcance y top 3 fuentes → pago único o código de acceso para desbloquear informe completo con IA, plan de gestión y exportaciones.
9. Persistencia: `localStorage` (una organización = un inventario por navegador, un año base). Sin login, sin base de datos.

Fuera del MVP explícitamente: las 15 categorías completas de Alcance 3, cálculo market-based con certificados de energía renovable, multiempresa/panel admin, comparabilidad multianual automática, carga masiva vía Excel, exportación a Word/PowerPoint, preparación formal para verificación externa.

## 4. Metodologías climáticas de referencia

| Estándar | Uso en la herramienta |
|---|---|
| GHG Protocol Corporate Standard | Estructura general: alcances, límites organizacionales (control operacional/financiero/accionario), principios de contabilidad (relevancia, integridad, consistencia, transparencia, precisión) |
| GHG Protocol Scope 2 Guidance | Distinción location-based vs. market-based; el MVP calcula solo location-based (v2 agrega market-based cuando exista certificado válido) |
| GHG Protocol Corporate Value Chain (Scope 3) Standard | Las 15 categorías de Alcance 3 (módulo de selección completo en MVP; cálculo completo en v2) |
| ISO 14064-1:2018 | Vocabulario y requisitos de cuantificación/reporte a nivel organizacional; base de la sección de "limitaciones e incertidumbre" del informe |
| Directrices IPCC (2006/2019 Refinement) | Fuente de factores de emisión por defecto cuando no hay factor nacional oficial, siempre marcados con su procedencia |
| Factores de emisión nacionales (ej. UPME/FECOC en Colombia, según país de operación) | Prioridad sobre factores IPCC genéricos cuando existan y estén documentados |
| GRI 305, ESRS E1, IFRS S2 | Referencias de salida — el informe queda listo para alimentar esas divulgaciones, no las reemplaza |

**Advertencia metodológica fija (aparece en portada del wizard, en el informe y en cada exportación):**
> Este inventario es un cálculo asistido y estructurado con base en la información entregada por la organización y los factores de emisión seleccionados o cargados por ella. No constituye un inventario verificado, certificado o auditado, salvo que exista una revisión independiente posterior bajo ISO 14064-3 u otro esquema de verificación reconocido.

## 5. Arquitectura técnica recomendada (MVP)

```
┌──────────────────────────────────────────────────────────────┐
│  Navegador del usuario                                         │
│  inventario-gei-express.html (HTML + CSS + JS vanilla)         │
│   - Wizard UI (10 pasos)                                        │
│   - Banco de factores de emisión (JS, editable)                 │
│   - Motor de cálculo (JS puro, determinístico, auditable)       │
│   - Motor de validación de calidad (reglas JS)                  │
│   - Render de gráficos (Canvas 2D: barras, donut)                │
│   - Estado en localStorage                                       │
│   - PayPal SDK (checkout)                                        │
│   - SheetJS (export Excel: base de cálculo + factores)           │
│   - window.print() (export PDF)                                  │
└───────────────┬────────────────────────────────────────────────┘
                │ fetch POST (solo para redacción/interpretación IA)
                ▼
┌──────────────────────────────────────────────────────────────┐
│  Cloudflare Worker: pal-ai-worker (existente, se extiende)     │
│   - Valida origin (+ nuevo puerto localhost dev)                │
│   - mode === "gei-informe" | "gei-sugerir-fuentes" |            │
│     "gei-explicar-resultado" | "gei-plan-gestion"                │
│   - GROQ_API_KEY como secret, nunca en cliente                   │
└──────────────────────────────────────────────────────────────┘
```

**Por qué NO Next.js/backend propio para el MVP:** el cálculo no requiere servidor (es aritmética simple), no hay necesidad de multiusuario todavía, y el patrón ya probado en 3 productos anteriores del repo minimiza tiempo de construcción y costo de hosting (GitHub Pages + Cloudflare Worker gratis en el tier usado). Se justifica backend propio recién en v2 (multiempresa, comparabilidad anual con histórico persistente en servidor, panel admin).

## 6. Stack tecnológico recomendado

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (ES6+), sin framework — coherente con el resto de la familia, cero build step, despliegue directo a GitHub Pages.
- **Backend de IA:** Cloudflare Worker existente (`pal-ai-worker`), extendido con nuevos `mode`. Modelo: Groq `llama-3.3-70b-versatile` (ya integrado, gratis/bajo costo, rápido, soporta `response_format: json_object`).
- **Persistencia:** `localStorage` en MVP. v2: si se necesita multiempresa, Supabase (Postgres + Auth gratis en tier bajo, encaja con el patrón serverless del resto de la arquitectura).
- **Gráficos:** Canvas 2D nativo (barras y donut), sin librería — mismo patrón que el scatter de materialidad.
- **Exportación:** SheetJS (Excel, CDN, ~30 KB, ya usado en materialidad-express), `window.print()` + CSS `@media print` (PDF).
- **Pagos:** PayPal SDK client-side + `ACCESS_KEY` de bypass (mismo patrón que los otros 3 productos pagos).
- **Hosting:** GitHub Pages (frontend) + Cloudflare Workers (proxy IA) — sin costo de infraestructura adicional al ya existente.

## 7. Modelo de datos (JS en cliente para MVP; referencia para v2 con base de datos)

| Entidad | Campos principales | Tipo | Relación | Obligatorio |
|---|---|---|---|---|
| Organización | nombre, tipo, sector, país, ciudad, nEmpleados, nSedes, añoBase, periodo, actividadPrincipal, madurezClimatica, alcancesSeleccionados[] | string/number/enum | 1—1 con Inventario (MVP) | nombre, tipo, sector, país, añoBase |
| LimiteOrganizacional | enfoqueConsolidacion (operacional/financiero/accionario), sedesIncluidas[], sedesExcluidas[], justificacionExclusiones | enum/string[]/text | pertenece a Inventario | enfoqueConsolidacion |
| FuenteEmision | id, nombre, alcance (1/2/3), categoria, sede, activa (bool) | string/enum/bool | pertenece a Inventario, tiene muchos DatoActividad | id, alcance, activa |
| DatoActividad | fuenteId, valor, unidad, periodo, calidadDato (alta/media/baja), origenDato (factura/medidor/estimación/ERP/otro), comentario, evidenciaAdjunta (nombre archivo, no se sube a servidor en MVP) | number/enum/string | pertenece a FuenteEmision | fuenteId, valor, unidad |
| FactorEmision | id, nombre, fuenteFactor, año, país, unidad, gas, pcgUtilizado, versionMetodologica, referencia, fechaConsulta, confiabilidad (alta/media/baja/supuesto) | string/number/enum | asociado a DatoActividad al calcular | id, fuenteFactor, unidad, gas — **nunca generado por IA** |
| ResultadoEmision | fuenteId, kgCO2e, tCO2e, alcance, gas | number/enum | derivado de DatoActividad × FactorEmision | calculado, no editable manualmente |
| IndicadorIntensidad | tipo (por empleado/producción/ingresos/m²), valor | enum/number | derivado del total y un dato base declarado | tipo, valor |
| AccionGestion | nombre, nivel (evitar/reducir/sustituir/compensar), fuenteAsociada, alcance, potencialReduccion, costo (bajo/medio/alto), plazo (corto/mediano/largo), responsableSugerido, indicadorSeguimiento, prioridad | string/enum | pertenece a PlanGestion | nombre, nivel, prioridad |
| PlanGestion | organizacionId, acciones[], resumenIA | array/text | pertenece a Inventario | — |
| ReporteGenerado | fecha, version, hashDatos (para detectar cambios post-generación) | date/string | pertenece a Inventario | fecha |

**Reglas de validación transversales:** `valor` de DatoActividad debe ser numérico ≥ 0; `FactorEmision.confiabilidad = "supuesto"` obliga a mostrar advertencia visible en el resultado y en el informe; una FuenteEmision `activa = true` sin ningún DatoActividad bloquea el cálculo final con mensaje de dato faltante (no lo omite silenciosamente).

## 8. Flujo UX paso a paso (MVP, wizard)

1. **Bienvenida** — qué es, qué NO es, tiempo estimado (30-50 min para Alcance 1+2).
2. **Registro de organización** — Módulo 1 completo.
3. **Límites organizacionales** — enfoque de consolidación, sedes incluidas/excluidas, justificación de exclusiones; el sistema redacta automáticamente la descripción del límite (texto plantilla, no IA).
4. **Selección de alcances** — Alcance 1+2 obligatorio, Alcance 3 simplificado opcional (3 categorías).
5. **Fuentes de emisión** — catálogo preconfigurado por alcance con checkboxes activar/desactivar; IA sugiere fuentes típicas según sector declarado (`gei-sugerir-fuentes`).
6. **Datos de actividad** — formulario por fuente activa: valor, unidad, calidad del dato, origen, comentario. Conversión de unidades automática (ej. galones → litros).
7. **Factores de emisión** — por cada fuente, seleccionar del banco embebido o cargar uno propio con toda su ficha (Módulo 5); bloqueo si falta factor y el dato de actividad ya existe.
8. **Resultados y validación de calidad** — cálculo instantáneo, alertas de datos faltantes/atípicos, badge de calidad (alta/media/baja) con el desglose de criterios.
9. **Dashboard** — gráficos + interpretación IA por gráfico (`gei-explicar-resultado`).
10. **Plan de gestión de emisiones** — generado con IA a partir de fuentes críticas (`gei-plan-gestion`), editable.
11. **Informe y descarga** — vista previa completa, PDF/Excel, recomendaciones para el siguiente ciclo de medición.

## 9. Motor de cálculo de emisiones

Fórmula base, aplicada por fuente y sumada por alcance:

```
emisión_fuente_kgCO2e = dato_actividad_en_unidad_factor × factor_emisión_kgCO2e_por_unidad
tCO2e = kgCO2e / 1000

Total_Alcance_1 = Σ emisión_fuente  (fuentes con alcance = 1)
Total_Alcance_2_LB = Σ emisión_fuente (fuentes con alcance = 2, location-based)
Total_Alcance_3 = Σ emisión_fuente  (fuentes con alcance = 3, categorías simplificadas MVP)
Total_organizacional = Total_Alcance_1 + Total_Alcance_2_LB + Total_Alcance_3

Participación_%_fuente = emisión_fuente / Total_organizacional × 100
```

Ejemplo concreto: 500 galones de diésel consumidos en generador propio (Alcance 1). Se convierte a litros (500 × 3.785 = 1,892.5 L). Factor de emisión diésel (ejemplo de referencia IPCC, el usuario debe confirmar el vigente para su país): 2.68 kgCO2e/L → `1,892.5 × 2.68 = 5,072 kgCO2e = 5.07 tCO2e`. Ese cálculo, su factor y su fuente quedan visibles y exportables junto al resultado — nunca solo el número final.

**Indicadores de intensidad**, ejemplo: `tCO2e_por_empleado = Total_organizacional_tCO2e / nEmpleados`.

## 10. Estructura de factores de emisión

Cada factor cargado en el sistema (embebido o del usuario) debe tener, sin excepción: nombre, fuente, año, país/región, unidad, gas, PCG utilizado, versión metodológica, referencia/link, fecha de consulta, confiabilidad. **Regla fundamental, no negociable:** si no hay factor disponible en el banco para una fuente activa, el sistema pide al usuario cargarlo o marcarlo explícitamente como supuesto — nunca lo genera la IA ni el sistema por defecto sin marca visible.

## 11. Sistema de validación de datos

Validaciones automáticas antes de dar por completo el inventario:
- Fuente activa sin dato de actividad → bloqueante.
- Dato de actividad sin factor de emisión asociado → bloqueante.
- Unidades del dato y del factor incompatibles sin conversión definida → bloqueante.
- Factor marcado `confiabilidad = supuesto` → advertencia visible, no bloqueante.
- Variación >50% frente a un valor de referencia por tamaño de organización (heurística simple, no oficial) → advertencia de dato atípico.
- Sin evidencia adjunta en fuentes de alta materialidad (top 3 por %) → advertencia en sección de calidad.

**Calificación de calidad del inventario** (Alta/Media/Baja), score simple 1–5 por criterio, promedio:
- % de datos con soporte documental.
- % de emisiones calculadas con factores oficiales (no supuestos).
- Cobertura de sedes incluidas vs. declaradas.
- Cobertura de fuentes relevantes activadas vs. catálogo sugerido por sector.
- Documentación de supuestos y exclusiones.

Promedio ≥ 4 → Alta; 2.5–3.9 → Media; < 2.5 → Baja. El informe siempre incluye la sección de limitaciones, sin importar el resultado.

## 12. Dashboard y gráficos requeridos (MVP)

Barras por alcance, donut de distribución %, barras top fuentes emisoras, tabla de calidad de datos por fuente. (Emisiones por sede/proceso, mensualidad, comparativo año base y mapa de calor quedan en v2 cuando haya multi-periodo). Cada gráfico va acompañado de un párrafo de interpretación generado por `gei-explicar-resultado`, siempre citando qué datos sustentan la lectura.

## 13. Estructura del informe final

Sigue exactamente el índice del Módulo 9 del brief original (portada → resumen ejecutivo → información de la organización → metodología → resultados → análisis → gráficos con interpretación → calidad de datos y limitaciones → plan de gestión → recomendaciones finales → anexos con base de cálculo y factores). En el MVP, los anexos completos de evidencias cargadas se listan por nombre de archivo (sin almacenamiento en servidor); v2 puede agregar carga real a un bucket si se decide backend.

## 14–16. Plan de gestión de emisiones, jerarquía y curva de abatimiento

Jerarquía obligatoria y siempre visible: **medir → evitar → reducir → sustituir → compensar**. El sistema advierte explícitamente que la compensación no reemplaza la reducción, y no permite generar un plan que solo contenga acciones de compensación sin al menos una acción de nivel evitar/reducir/sustituir por cada fuente crítica.

Cada acción generada (por IA, a partir de las fuentes con mayor % de participación) incluye: nombre, fuente asociada, alcance, descripción, potencial estimado (cualitativo: bajo/medio/alto — la IA no inventa un % de reducción numérico sin base), dificultad, costo, plazo, responsable sugerido, indicador de seguimiento, riesgos, beneficios adicionales, prioridad.

**Curva de abatimiento simplificada**, scoring 1–5 en dos ejes (potencial de reducción, facilidad/costo de implementación), clasificando en 4 cuadrantes: victorias rápidas (alto potencial, fácil/barato), acciones estratégicas (alto potencial, difícil/caro), acciones de inversión (bajo potencial, fácil — bajo impacto pero rápidas de hacer), acciones complejas (bajo potencial, difícil — reevaluar prioridad). Compensación residual se marca aparte, fuera de los 4 cuadrantes, como último recurso.

## 17. Prompts internos de IA (extensión de `pal-ai-worker`)

Se agregan 4 modos nuevos siguiendo exactamente el patrón de `MATERIALIDAD_SYSTEM_PROMPT` ya existente en `pal-ai-worker/worker.js`:

**`gei-sugerir-fuentes`** — recibe `context.sector` y `context.tipoOperacion`; devuelve hasta 6 fuentes de emisión típicas del sector que no estén ya en el catálogo activo, cada una con nombre, alcance, categoría y una frase de justificación. Nunca sugiere factores de emisión, solo fuentes a considerar.

**`gei-explicar-resultado`** — recibe los totales por alcance/fuente y el contexto sectorial; devuelve un párrafo por gráfico interpretando el patrón (qué domina, por qué es plausible para ese tipo de organización), sin inventar causas no sustentadas en los datos.

**`gei-plan-gestion`** — recibe fuentes críticas (top %), su alcance y contexto sectorial; devuelve el listado de acciones de gestión estructuradas (Módulo 14–16), respetando la jerarquía evitar→reducir→sustituir→compensar y sin asignar cifras de reducción numéricas sin base declarada.

**`gei-informe`** — recibe todo el contexto consolidado (organización, límites, resultados, calidad, plan); devuelve resumen ejecutivo, lectura estratégica de resultados, redacción de la sección de metodología y recomendaciones finales por plazo. Reglas fijas en el prompt (igual que los modos existentes): nunca afirma verificación externa, nunca declara carbono neutralidad, siempre distingue dato real / estimado / supuesto, siempre incluye la advertencia metodológica del Módulo 4.

Extensión necesaria en `worker.js`: agregar los 4 `mode` al `CONTEXT_ONLY_MODES`, sus system prompts, y sus `maxTokens` (el modo `gei-informe` necesita el límite más alto, similar a `materialidad-informe` en 9000 tokens; los otros 3 pueden ir en 500–1500).

## 18. Modelo de negocio

Mismo patrón de la familia: diagnóstico gratuito (totales por alcance + top 3 fuentes, sin informe descargable) → pago único para desbloquear informe completo con IA, plan de gestión y exportaciones PDF/Excel. Precio sugerido en el mismo rango que Reporte GRI Express/Materialidad Exprés (ajustar según pricing vigente de esos productos). v2: plan con Alcance 3 completo, plan con acompañamiento consultivo de verificación, licenciamiento para gremios/cadenas de proveedores.

## 19. Integración con página web y GitHub

Tarjeta nueva en `projectability-site/index.html#herramientas` enlazando a `https://amdavil.github.io/herramientas-y-assessment/inventario-gei-express.html`. Estructura de repo: el archivo vive en la raíz junto a sus hermanos; `pal-ai-worker/worker.js` se extiende (no se crea un worker nuevo); si el banco de factores de emisión crece, puede externalizarse a un `.json` cargado por `fetch` desde el mismo repo (como ya hace materialidad-express con `banco-asuntos-esg.json`). Seguridad: `GROQ_API_KEY` permanece como secret de Cloudflare, `ALLOWED_ORIGINS` se actualiza con el puerto de desarrollo local nuevo.

## 20. Roadmap de desarrollo (resumen)

- **Fase 1 (MVP):** Alcance 1+2, wizard completo, motor de cálculo, banco de factores base, dashboard, informe PDF/Excel, monetización. Complejidad alta (motor de cálculo trazable + banco de factores curado es el esfuerzo real). ~3-4 semanas.
- **Fase 2:** Alcance 3 completo (15 categorías), market-based Scope 2, comparabilidad año base.
- **Fase 3:** Multiempresa, panel admin, histórico persistente (justifica backend con Supabase).
- **Fase 4:** Preparación para verificación externa, benchmarking sectorial.

## 21. Riesgos principales

- **Metodológico:** un factor de emisión desactualizado o mal citado invalida el resultado — mitigación: banco curado con fecha de consulta visible y advertencia de revisión periódica.
- **Producto:** la percepción de "esto certifica mi huella" — mitigación: disclaimer en portada, informe y cada exportación, sin excepción.
- **Técnico:** el motor de cálculo cliente-side no debe permitir que la IA sobrescriba un número — mitigación: separación estricta de responsabilidades ya reflejada en los prompts (Módulo 17).

## Recomendación final sobre cómo empezar

Construir en este orden: (1) banco de factores de emisión mínimo viable para Colombia (combustibles + electricidad) con fichas completas, curado a mano — esto es lo único que no se puede improvisar; (2) motor de cálculo y wizard de pasos 1–8 sin IA, con datos de prueba; (3) extender `pal-ai-worker` con los 4 modos; (4) dashboard, plan de gestión, informe y monetización. El primer entregable útil (sin IA) ya sirve para validar el motor de cálculo con un caso real antes de invertir en la capa de redacción.
