/**
 * Embudo de venta — mide el recorrido completo en las herramientas de pago de
 * Projectability (Reporte GRI Express, Inventario GEI Express, Estudio de
 * Materialidad, Diagnóstico de Circularidad).
 *
 * Responde tres preguntas que hoy no se pueden responder:
 *   1) ¿Cuánta gente llega al paywall?
 *   2) ¿Cuántos inician el pago y no lo terminan?
 *   3) ¿De qué canal viene quien sí compra?
 *
 * Fire-and-forget, igual que lead-capture.js: si algo falla (bloqueador de
 * anuncios, sin conexión, GA caído) el usuario nunca se entera y la herramienta
 * sigue funcionando igual.
 *
 * Doble destino, a propósito:
 *   - GA4 (G-JZ3F8M1R42, el mismo de projectability.net) para el embudo y los canales.
 *   - El Google Sheet de lead-capture.js para las COMPRAS. GA4 muestrea y demora;
 *     una fila en la hoja es la constancia definitiva de que entró una venta.
 */
(function (global) {
  const GA_ID = "G-JZ3F8M1R42";
  const UTM_KEY = "pal-utm-v1";
  const SEEN_KEY = "pal-visto-v1";

  /* ---------- GA4: cargarlo solo si la página aún no lo tiene ---------- */

  function ensureGtag() {
    global.dataLayer = global.dataLayer || [];
    if (typeof global.gtag !== "function") {
      global.gtag = function () { global.dataLayer.push(arguments); };
    }
    if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;

    try {
      const s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
      document.head.appendChild(s);
      global.gtag("js", new Date());
      // Las herramientas son de una sola página: el avance se mide con eventos
      // propios, no con page_view, así que no hace falta configurar nada más.
      global.gtag("config", GA_ID);
    } catch (e) { /* nunca bloquear por esto */ }
  }

  /* ---------- Origen del visitante: se captura una vez y se conserva ---------- */

  // Sin esto, quien llega por LinkedIn, abandona y vuelve directo al día
  // siguiente se contaría como tráfico directo, y el canal que sí trajo la
  // venta quedaría sin crédito.
  function capturarOrigen() {
    let guardado = null;
    try { guardado = JSON.parse(sessionStorage.getItem(UTM_KEY) || "null"); } catch (e) {}

    const params = new URLSearchParams(global.location.search);
    const utm = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content"].forEach(k => {
      const v = params.get(k);
      if (v) utm[k] = v.slice(0, 80);
    });

    // Los UTM de esta visita mandan; si no hay, se conserva lo de la sesión.
    if (!Object.keys(utm).length) {
      if (guardado) return guardado;
      const ref = document.referrer || "";
      if (ref && ref.indexOf(global.location.host) === -1) {
        utm.utm_source = ref.replace(/^https?:\/\//, "").split("/")[0].slice(0, 80);
        utm.utm_medium = "referral";
      }
    }

    try { sessionStorage.setItem(UTM_KEY, JSON.stringify(utm)); } catch (e) {}
    return utm;
  }

  const origen = capturarOrigen();

  /* ---------- Envío ---------- */

  function track(evento, params) {
    try {
      ensureGtag();
      global.gtag("event", evento, Object.assign({}, origen, params || {}));
    } catch (e) { /* nunca bloquear por esto */ }
  }

  // Para hitos que no deben inflarse si el usuario recarga o vuelve atrás.
  function unaVez(clave, fn) {
    let vistos = {};
    try { vistos = JSON.parse(sessionStorage.getItem(SEEN_KEY) || "{}"); } catch (e) {}
    if (vistos[clave]) return;
    vistos[clave] = 1;
    try { sessionStorage.setItem(SEEN_KEY, JSON.stringify(vistos)); } catch (e) {}
    fn();
  }

  /* ---------- Los cinco momentos del embudo ---------- */

  const PAL = {
    /** Alguien abrió la herramienta. */
    inicio(producto) {
      unaVez("inicio:" + producto, () => track("pal_inicio", { producto }));
    },

    /** Terminó el contenido gratuito y vio el muro de pago. El denominador real. */
    verPaywall(producto, precio) {
      unaVez("paywall:" + producto, () =>
        track("pal_ver_paywall", { producto, value: precio, currency: "USD" })
      );
    },

    /** Pulsó el botón de PayPal. Entre esto y la compra está la fuga más cara. */
    iniciarPago(producto, precio, metodo) {
      track("begin_checkout", {
        producto,
        value: precio,
        currency: "USD",
        metodo: metodo || "paypal"
      });
    },

    /** Pago aprobado. Único evento que además deja constancia fuera de GA4. */
    compra(producto, precio, ordenId) {
      track("purchase", {
        producto,
        value: precio,
        currency: "USD",
        transaction_id: ordenId || "",
        items: [{ item_id: producto, item_name: producto, price: precio, quantity: 1 }]
      });

      // Constancia independiente: GA4 puede demorar horas y no sirve de recibo.
      try {
        if (global.PALLeadCapture) {
          global.PALLeadCapture.send({
            herramienta: producto,
            tipo_registro: "VENTA",
            monto_usd: precio,
            orden_paypal: ordenId || "",
            origen: origen.utm_source || "directo",
            campana: origen.utm_campaign || ""
          });
        }
      } catch (e) { /* nunca bloquear por esto */ }
    },

    /** Desbloqueó con código manual: acceso sin pago por PayPal. */
    canje(producto) {
      track("pal_canje_codigo", { producto });
    },

    /** Dejó sus datos. */
    lead(producto) {
      unaVez("lead:" + producto, () => track("generate_lead", { producto }));
    },

    track
  };

  global.PALAnalytics = PAL;
})(window);
