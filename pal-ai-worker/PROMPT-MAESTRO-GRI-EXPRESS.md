# PROMPT MAESTRO — Reporte GRI Express

> Prompt integral para construir la aplicación completa. Úsalo para regenerarla,
> extenderla o crear productos hermanos (misma arquitectura, otro estándar).

---

## EL ENCARGO

Construye una aplicación web de una sola página (HTML/CSS/JS puro, sin frameworks ni build,
desplegable en GitHub Pages) llamada **"Reporte GRI Express"**, de la marca **Projectability**
(consultora de sostenibilidad, projectability.net).

**Propósito:** que una pyme sin experiencia en reportes construya su primer reporte de
sostenibilidad profesional **"con referencia a los Estándares GRI 2021"** (GRI 1: Fundamentos),
guiada por un asistente conversacional, y lo descargue en PDF pagando USD $25.

---

## 1. EL ASISTENTE (AVATAR)

- Se llama **PAL**, avatar 🌱 con estilo de chat profesional pero cercano (trato de "usted").
- Interfaz conversacional: burbujas de PAL (con indicador de escritura animado) y respuestas
  del usuario alineadas a la derecha.
- Cada pregunta incluye: texto claro en lenguaje no técnico, caja de ayuda 💡 con dónde
  encontrar el dato ("está en su factura de energía"), y etiqueta del contenido GRI que cubre
  (ej. "GRI 2-7").
- Tipos de entrada: texto, número (con unidad), textarea, select, chips de selección múltiple.

## 2. ESTRUCTURA DEL FLUJO (5 módulos, ~25-40 preguntas)

**Módulo 1 — Perfil de la organización (GRI 2):** nombre legal (2-1), naturaleza jurídica (2-1),
sector y productos (2-6), ubicación y operaciones (2-1), cadena de valor (2-6),
número de empleados (2-7), periodo del reporte (2-3).

**Módulo 2 — Gobernanza y compromiso:** estructura de gobernanza (2-9), responsable de
sostenibilidad (2-13), declaración de la dirección en primera persona (2-22),
políticas formalizadas — chips (2-23).

**Módulo 3 — Materialidad:** grupos de interés — chips de 12 opciones (2-29);
método de determinación — select (3-1); selección de 3 a 8 temas materiales de un
catálogo de 21 (3-2).

**Módulo 4 — Contenidos por tema material (dinámico):** solo se generan las preguntas de los
temas elegidos. Cada tema tiene: 1 pregunta de enfoque de gestión (GRI 3-3, textarea) +
1-2 indicadores (número o texto corto).

**Módulo 5 — Cierre:** principal logro del periodo, compromiso futuro, punto de contacto (2-3).

**Catálogo de 21 temas** (estándares temáticos GRI): 201 Desempeño económico, 203 Impactos
económicos indirectos, 204 Prácticas de adquisición, 205 Anticorrupción, 301 Materiales,
302 Energía, 303 Agua y efluentes, 304 Biodiversidad, 305 Emisiones, 306 Residuos,
308 Evaluación ambiental de proveedores, 401 Empleo, 403 Salud y seguridad en el trabajo,
404 Formación y educación, 405 Diversidad e igualdad, 406 No discriminación,
413 Comunidades locales, 414 Evaluación social de proveedores, 416 Salud y seguridad de
clientes, 417 Marketing y etiquetado, 418 Privacidad del cliente.

## 3. EXPERIENCIA DE USO

- **Guardado automático** en localStorage tras cada respuesta. Al volver: "Tiene un reporte
  en progreso (X respuestas) → Continuar donde quedé". Advertir en la bienvenida: mismo
  navegador y dispositivo, sin modo incógnito.
- **Barra de progreso numérica** siempre visible: "12 de 27 · 44%" (usa "13+" mientras el
  total dependa de los temas aún no elegidos).
- **Navegación libre:** botones "← Anterior" (edita con la respuesta precargada y aviso
  '✏️ Está editando') y "Omitir por ahora →" en cada pregunta.
- **🗺 Mapa de avance** (panel lateral): módulos y preguntas con estado ✔/○, pregunta actual
  resaltada, clic para saltar a cualquiera, contador de faltantes; módulos 4-5 aparecen
  "🔒 Se habilita al seleccionar temas materiales".
- **Cierre inteligente:** si quedan omitidas, avisar cuántas y ofrecer completarlas desde el
  mapa o continuar (las vacías salen como "Información no disponible en este periodo" — válido GRI).
- **Bienvenida** con caja "Cómo funciona" (guardado, navegación, mapa, barra) y un
  **disclaimer metodológico**: es "con referencia a" GRI, no "de conformidad con"; sin
  verificación externa; datos responsabilidad de la empresa.

## 4. KIT DE DELEGACIÓN (recolectar datos de otras áreas sin exponer la herramienta)

Desde el mapa: botón "📤 Delegar preguntas a otras áreas" → selector con checkboxes
(pendientes pre-marcadas) → genera documento imprimible con membrete Projectability:
instrucciones para el responsable de área, cada pregunta numerada con referencia GRI y
ayuda, caja de respuesta (o casillas ☐ para selects), campos "Diligenciado por / Área / Fecha",
y nota: "el reporte final se genera exclusivamente en la aplicación". El coordinador ingresa
las respuestas devueltas usando el mapa.

## 5. EL REPORTE GENERADO

Vista imprimible (window.print → PDF) con: portada (nombre, periodo, "Elaborado con referencia
a los Estándares GRI 2021", fecha), mensaje de la dirección, resumen ejecutivo (IA),
"Acerca de este reporte" (2-3), perfil (2-1/2-6/2-7), gobernanza (2-9/2-13/2-23),
materialidad con grupos de interés (2-29) y proceso (3-1/3-2), un capítulo por tema material
(contexto de sostenibilidad IA + enfoque 3-3 + tarjetas KPI), logros y compromisos,
**índice de contenidos GRI** (tabla contenido → descripción → ubicación) y nota de alcance
y limitaciones (incluye declaración de asistencia de IA cuando aplique).

## 6. MONETIZACIÓN (paywall)

- Entrevista y **vista previa gratis**: portada a materialidad visibles; capítulos, índice y
  PDF **difuminados** (blur CSS) con cinta "VISTA PREVIA" y banner de desbloqueo.
- **Desbloqueo USD $25** (constante configurable) por dos vías:
  a) **PayPal Smart Buttons** (JS SDK, client-id en constante `PAY.paypalClientId`) — al
     aprobar el pago, desbloqueo automático (localStorage) y generación inmediata;
  b) **Códigos de acceso** formato `PAL-XXXX-XXXX`: en el código solo viven los hashes
     SHA-256 (crypto.subtle); los códigos en texto plano se guardan fuera del repositorio
     para venta manual (transferencia/Nequi → enviar código por correo).
- El acceso persiste en localStorage; quien pagó no vuelve a pagar.

## 7. CAPA DE INTELIGENCIA ARTIFICIAL (redacción por defecto)

**Arquitectura:** la página llama a un **Cloudflare Worker** (proxy seguro) que guarda la
clave de Groq como secreto y restringe CORS a los dominios propios. Modelo:
`llama-3.3-70b-versatile`, temperature 0.3, response_format json_object.

**Comportamiento en la app:** todo reporte completo pasa por IA por defecto (botón único
"✨ Generar mi Reporte GRI Express" y también tras pagar o validar código); enlace discreto
"generar sin IA"; si el servicio falla, degradación elegante (generar con textos originales
o reintentar — nunca bloquear). Se envían a la IA todos los campos descriptivos (sector,
ubicación, cadena, gobernanza, responsable, declaración, logro, reto y los enfoques 3-3);
se excluyen nombre legal, correo, cifras, selects y los indicadores.

**Prompt del Worker (system):** eres PAL, redactor experto GRI de Projectability. Para cada
campo: (1) corrige SIEMPRE ortografía/gramática/tildes; (2) reescribe en lenguaje corporativo
tercera persona (salvo la declaración de la dirección, primera del plural); (3) ENRIQUECE con
1-3 frases de profundidad profesional vinculando con el sector y los grupos de interés;
(4) NUNCA inventes hechos, cifras, certificaciones ni logros — el enriquecimiento es de marco,
no de hechos; (5) aplica los principios de calidad GRI (precisión, equilibrio, claridad,
comparabilidad, exhaustividad, contexto de sostenibilidad, puntualidad, verificabilidad);
(6) conserva limitaciones ("no medido aún" → oportunidad de mejora identificada);
(7) 3-6 frases por campo, español neutro latinoamericano. Además genera:
`resumen_ejecutivo` (4-6 frases presentando la organización) y un párrafo de contexto
sectorial por cada tema material. Respuesta: solo JSON
`{"fields": {id: texto, resumen_ejecutivo}, "contexts": {topicId: párrafo}}`.

**Transparencia:** el reporte declara en su nota de alcance que la redacción fue asistida por
IA sobre información de la organización, sin modificar cifras, y revisada por la empresa.

## 8. DISEÑO

Paleta Projectability: navy #1f4e79, teal #16817a, verde #5f8d3e, ámbar #c47f1b,
tinta #172033, fondo #eef3f7. Tipografía Inter/Segoe UI. Tarjetas con sombras suaves,
bordes redondeados 12-20px, animaciones sutiles (rise/pop). Responsive móvil.
Todo en español, trato de "usted", serio pero cálido.

## 9. PRINCIPIOS INNEGOCIABLES

1. Honestidad metodológica: nunca prometer "de conformidad con GRI".
2. Los datos del usuario no salen de su navegador (salvo los textos enviados a la IA vía proxy).
3. La IA jamás inventa hechos ni toca cifras.
4. El usuario nunca queda bloqueado (fallbacks en pago e IA).
5. El know-how (motor del reporte, mapeo GRI, prompt) nunca se expone: vive en la app y en
   el Worker, no en los documentos que circulan.
