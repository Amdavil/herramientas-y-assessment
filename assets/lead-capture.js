/**
 * Captura de resultados — envía un registro cuando alguien completa una herramienta
 * de Projectability (Diagnóstico de Circularidad, Reporte GRI Express, Assessment ESG+IA).
 *
 * Fire-and-forget: nunca bloquea ni afecta la experiencia del usuario si el envío falla
 * (sin conexión, formulario lleno, script no configurado, etc.).
 *
 * Doble destino:
 *  1) Formspree — reenvía un correo por cada registro (mismo formulario que usa el
 *     registro del Assessment en projectability.net).
 *  2) Google Sheet en vivo — opcional. Vacío hasta que se despliegue el Apps Script
 *     correspondiente y se pegue aquí la URL (ver pal-ai-worker/google-sheet-webhook.gs).
 */
(function (global) {
  const FORMSPREE_RESULTADOS = "https://formspree.io/f/xzdqznry";
  const SHEET_WEBHOOK_URL = ""; // pegar aquí la URL /exec del Google Apps Script una vez desplegado

  function send(data) {
    const payload = Object.assign(
      {
        _subject: `Resultado ${data.herramienta || "herramienta"} — ${data.empresa || "sin empresa"}`,
        tipo: `Resultado — ${data.herramienta || ""}`,
        fecha: new Date().toISOString()
      },
      data
    );

    try {
      fetch(FORMSPREE_RESULTADOS, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch (e) { /* nunca bloquear por esto */ }

    if (SHEET_WEBHOOK_URL) {
      try {
        // Content-Type text/plain evita el preflight CORS que Apps Script no maneja bien.
        fetch(SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      } catch (e) { /* nunca bloquear por esto */ }
    }
  }

  global.PALLeadCapture = { send };
})(window);
