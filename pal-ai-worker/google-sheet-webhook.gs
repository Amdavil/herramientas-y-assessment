/**
 * Webhook de Google Apps Script — archivo madre de resultados de Projectability.
 * Recibe lo que envía assets/lead-capture.js y agrega una fila nueva en la pestaña
 * correspondiente a la herramienta (una pestaña por herramienta, dentro de la misma
 * hoja de cálculo), con las respuestas completas diligenciadas por el usuario.
 *
 * NO se ejecuta en este repositorio: es el código que se pega en
 * Extensiones → Apps Script de la Google Sheet donde se quiere llevar el registro.
 * Ver instrucciones de despliegue en la conversación / README del proyecto.
 */

const COLUMNAS = [
  "Fecha", "Nombre", "Empresa", "Correo", "Sector",
  "Resumen", "Respuestas (JSON)", "Oportunidades", "Fortalezas", "Notas",
  "JSON completo"
];

function nombreHoja(herramienta) {
  // Cada herramienta tiene su propia pestaña dentro del mismo archivo (el "archivo madre").
  const limpio = String(herramienta || "Sin especificar").slice(0, 95);
  return limpio;
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = JSON.parse(e.postData.contents);
  const sheet = ss.getSheetByName(nombreHoja(data.herramienta)) || ss.insertSheet(nombreHoja(data.herramienta));

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNAS);
    sheet.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([
    new Date(),
    data.nombre || "",
    data.empresa || "",
    data.correo || "",
    data.sector || "",
    data.resumen || "",
    data.respuestas || "",
    data.oportunidades || "",
    data.fortalezas || "",
    data.notas || "",
    JSON.stringify(data)
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("OK — webhook de resultados activo");
}
