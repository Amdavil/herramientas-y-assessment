/**
 * Promoción de lanzamiento — acceso completo gratis durante un mes.
 *
 * Un solo sitio para la fecha: las cuatro herramientas de pago (Reporte GRI
 * Express, Diagnóstico de Circularidad, Estudio de Materialidad Exprés y Radar
 * de Carbono) y la página projectability.net leen este archivo. Para ampliar o
 * cerrar la promoción basta con cambiar HASTA y publicar; al pasar la fecha el
 * muro de pago vuelve solo, sin tocar nada más.
 *
 * Si este archivo no carga (sin conexión, bloqueador), activa() devuelve false
 * y las herramientas se comportan como siempre: el cobro nunca se abre por error.
 */
(function (global) {
  // Último instante con acceso gratis (hora de Colombia, UTC-5).
  var HASTA = "2026-12-13T23:59:59-05:00";
  var fin = new Date(HASTA).getTime();

  function activa() { return Date.now() <= fin; }

  function diasRestantes() {
    return Math.max(0, Math.ceil((fin - Date.now()) / 86400000));
  }

  function fechaLarga() {
    try {
      return new Date(fin).toLocaleDateString("es-CO", {
        day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota"
      });
    } catch (e) { return "el 13 de diciembre de 2026"; }
  }

  function textoDias() {
    var d = diasRestantes();
    if (d <= 1) return "último día";
    return "quedan " + d + " días";
  }

  /** Franja informativa dentro de la herramienta (solo mientras la promoción está activa). */
  function pintarBarra() {
    if (!activa() || !global.document || global.document.getElementById("pal-promo-bar")) return;
    try {
      var css = global.document.createElement("style");
      css.textContent =
        "#pal-promo-bar{box-sizing:border-box;width:100%;padding:9px 16px;text-align:center;" +
        "background:linear-gradient(90deg,#16817a,#5f8d3e);color:#fff;font:600 13px/1.45 Inter,'Segoe UI',Arial,sans-serif;}" +
        "#pal-promo-bar b{font-weight:800}" +
        "@media print{#pal-promo-bar{display:none!important}}";
      global.document.head.appendChild(css);

      var bar = global.document.createElement("div");
      bar.id = "pal-promo-bar";
      bar.setAttribute("role", "status");
      bar.innerHTML = "🎁 <b>Promoción de lanzamiento:</b> acceso completo gratis hasta el " +
        fechaLarga() + " (" + textoDias() + ") — informe, IA y PDF incluidos.";
      global.document.body.insertBefore(bar, global.document.body.firstChild);
    } catch (e) { /* nunca bloquear por esto */ }
  }

  if (global.document) {
    if (global.document.readyState === "loading") {
      global.document.addEventListener("DOMContentLoaded", pintarBarra);
    } else {
      pintarBarra();
    }
  }

  global.PALPromo = {
    hasta: HASTA,
    activa: activa,
    diasRestantes: diasRestantes,
    fechaLarga: fechaLarga,
    textoDias: textoDias
  };
})(window);
