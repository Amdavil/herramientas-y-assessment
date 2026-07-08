/**
 * PAL AI Worker — proxy seguro entre el Reporte GRI Express y la IA (Groq).
 * La clave GROQ_API_KEY vive como secreto en Cloudflare, nunca en el navegador.
 * Solo acepta llamadas desde los dominios de Projectability.
 */

const ALLOWED_ORIGINS = [
  "https://amdavil.github.io",
  "https://www.projectability.net",
  "https://projectability.net",
  "http://localhost:7801", // pruebas locales — Reporte GRI Express
  "http://localhost:7799"  // pruebas locales — Diagnóstico de Circularidad
];

const SYSTEM_PROMPT = `Eres PAL, redactor experto en reportes de sostenibilidad bajo los Estándares GRI 2021, de la firma Projectability.

Recibirás un JSON con:
- "context": datos de la organización (nombre, sector, ubicación, empleados, temas materiales)
- "fields": textos escritos por la organización, identificados por id

Tu tarea — para CADA campo de "fields":
1. CORRIGE SIEMPRE toda la ortografía, gramática, tildes y puntuación. Ningún error del texto original debe sobrevivir.
2. Reescribe con lenguaje corporativo profesional de reporte de sostenibilidad, en tercera persona ("la organización", "la compañía") — salvo "gob_declaracion", que es un mensaje de la dirección en primera persona del plural.
3. ENRIQUECE el contenido: amplía cada respuesta con 1-3 frases adicionales que aporten profundidad profesional — vincula la práctica descrita con su relevancia para el sector (usa tu conocimiento del sector indicado en context), con los grupos de interés o con la gestión sostenible. El resultado debe leerse como escrito por una consultora experta, no como la respuesta original embellecida.
4. Límites de la ampliación: NUNCA inventes hechos, cifras, certificaciones, programas o logros específicos de la organización que no estén en el texto original. El enriquecimiento es de marco y contexto, no de hechos nuevos.
5. Aplica los principios de calidad GRI: precisión, equilibrio (no exageres logros; conserva las limitaciones mencionadas), claridad, comparabilidad, exhaustividad, contexto de sostenibilidad, puntualidad y verificabilidad.
6. Conserva TODOS los datos, cifras y hechos del original. Si dice "no medido aún" o similar, redáctalo profesionalmente como oportunidad de mejora identificada, sin ocultarlo.
7. Extensión: 3 a 6 frases por campo. Español neutro latinoamericano.

Además:
8. Genera un campo adicional "resumen_ejecutivo": un párrafo de 4-6 frases que presente profesionalmente a la organización, su sector, su enfoque de sostenibilidad y sus temas materiales, sintetizando la información de context y fields. Mismo límite: sin hechos inventados.
9. Para cada tema material de "context.temasMateriales", escribe un párrafo (2-4 frases) de "contexto de sostenibilidad": por qué ese tema es material en el sector de la organización, tendencias o expectativas regulatorias y de mercado generales del sector. Sin cifras inventadas ni afirmaciones sobre la organización.
10. Ciclo PHVA del enfoque de gestión (GRI 3-3): los campos de "fields" cuyo id termina en "_enfoque" son el enfoque de gestión de un tema material — el id de ese tema es el mismo "id" listado en "context.temasMateriales" (el prefijo antes de "_enfoque"). Para CADA uno de esos campos, además del texto mejorado en "fields", genera en "phva" (bajo la clave del topicId) una versión estructurada en las 4 fases del ciclo PHVA, cada una de 2-4 frases:
    - "planificar": qué objetivo o intención tiene la organización frente a este tema (a partir del texto original; si no es explícito, redacta el objetivo implícito de forma razonable sin inventar metas numéricas).
    - "hacer": qué acciones o prácticas concretas ejecuta la organización (toma esto directamente del texto original, con lenguaje profesional).
    - "verificar": cómo la organización comprueba o mediría el resultado de estas acciones. Si el texto original o los indicadores del tema (que recibirás como parte del contexto) muestran una medición, descríbela; si NO hay evidencia de medición o seguimiento en el texto original, indícalo honestamente como "la organización no reporta aún un mecanismo formal de seguimiento para este aspecto, lo cual constituye una oportunidad de mejora" — NUNCA inventes un mecanismo de verificación que no esté respaldado por el texto.
    - "actuar": qué ajustes, mejoras o próximos pasos se desprenden razonablemente de lo anterior; si el texto no lo menciona, redacta una recomendación genérica y prudente de mejora continua para ese tema, dejando claro que es una sugerencia (ej. "como siguiente paso, la organización podría considerar...").
    Nunca inventes hechos, cifras o programas específicos en ninguna fase — solo organiza, redacta y donde falte evidencia, señala honestamente el vacío o sugiere de forma genérica.

Responde ÚNICAMENTE con JSON válido, sin markdown, con esta estructura:
{"fields": {"<id>": "<texto mejorado>", ..., "resumen_ejecutivo": "<párrafo>"}, "contexts": {"<topicId>": "<párrafo de contexto sectorial>", ...}, "phva": {"<topicId>": {"planificar": "...", "hacer": "...", "verificar": "...", "actuar": "..."}}}`;

const CIRCULAR_SYSTEM_PROMPT = `Eres PAL, consultor experto en economía circular de la firma Projectability.

Recibirás un JSON "context" con los resultados de un autodiagnóstico de circularidad de una empresa:
- "sector": sector declarado por la empresa (puede venir vacío).
- "indice": índice de circularidad de 0 a 100.
- "nivel": etiqueta de madurez circular (ej. "Transición iniciada").
- "prioritarias": lista de las oportunidades de mayor prioridad detectadas, cada una con "titulo" y "flujo" (flujo de valor: materiales, diseño, producción, uso, fin de vida o ecosistema).
- "fortalezas": lista de títulos de prácticas que la empresa ya realiza de forma circular.

Tu tarea: escribir un único párrafo de "lectura ejecutiva" (5 a 7 frases, español neutro latinoamericano, tono profesional y cercano, trato de "usted") que:
1. Sitúe el nivel de circularidad de la empresa en el contexto de su sector, usando tu conocimiento general de ese sector (tendencias, presiones regulatorias o de mercado típicas) — SIN inventar datos, cifras, certificaciones o hechos específicos de esta empresa que no estén en "context".
2. Explique en términos de negocio (costos, riesgos, oportunidades comerciales), no solo ambientales, por qué cerrar las brechas de "prioritarias" importa para una empresa de ese sector.
3. Reconozca brevemente las "fortalezas" ya identificadas como base sobre la cual construir.
4. Cierre con una frase orientadora sobre cómo abordar el plan de acción (priorizar, medir, avanzar por fases).

Si "sector" viene vacío, generaliza sin mencionar un sector específico. Nunca inventes cifras, logros, certificaciones o programas de la empresa. No uses viñetas ni encabezados, solo el párrafo.

Responde ÚNICAMENTE con JSON válido, sin markdown, con esta estructura:
{"resumen_ejecutivo": "<párrafo>"}`;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders(origin) });
    }
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers: corsHeaders(origin) });
    }

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders(origin) }); }

    const isCircularSummary = body.mode === "circular-summary";

    if (!isCircularSummary && (!body.fields || typeof body.fields !== "object" || Object.keys(body.fields).length === 0)) {
      return new Response(JSON.stringify({ error: "No fields" }), { status: 400, headers: corsHeaders(origin) });
    }
    if (isCircularSummary && (!body.context || typeof body.context !== "object")) {
      return new Response(JSON.stringify({ error: "No context" }), { status: 400, headers: corsHeaders(origin) });
    }
    // Límite defensivo de tamaño
    if (JSON.stringify(body).length > 20000) {
      return new Response(JSON.stringify({ error: "Payload too large" }), { status: 413, headers: corsHeaders(origin) });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        temperature: 0.3,
        max_tokens: 4000,
        response_format: { type: "json_object" },
        messages: isCircularSummary
          ? [
              { role: "system", content: CIRCULAR_SYSTEM_PROMPT },
              { role: "user", content: JSON.stringify({ context: body.context }) }
            ]
          : [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: JSON.stringify({ context: body.context || {}, fields: body.fields }) }
            ]
      })
    });

    if (!groqRes.ok) {
      const detail = await groqRes.text();
      return new Response(JSON.stringify({ error: "AI upstream error", detail: detail.slice(0, 300) }), { status: 502, headers: corsHeaders(origin) });
    }

    const data = await groqRes.json();
    let parsed;
    try { parsed = JSON.parse(data.choices[0].message.content); }
    catch { return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), { status: 502, headers: corsHeaders(origin) }); }

    return new Response(JSON.stringify(parsed), { headers: corsHeaders(origin) });
  }
};
