/**
 * Webhook de Google Apps Script — recibe los resultados enviados por
 * assets/lead-capture.js y los agrega como fila nueva a la hoja "Resultados".
 *
 * NO se ejecuta en este repositorio: es el código que se pega en
 * Extensiones → Apps Script de la Google Sheet donde se quiere llevar el registro.
 * Ver instrucciones de despliegue en pal-ai-worker/README-google-sheet.md.
 */

const COLUMNAS = ["Fecha", "Herramienta", "Nombre", "Empresa", "Correo", "Sector", "Resumen", "JSON completo"];

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Resultados") || ss.insertSheet("Resultados");

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(COLUMNAS);
    sheet.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
  }

  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.herramienta || "",
    data.nombre || "",
    data.empresa || "",
    data.correo || "",
    data.sector || "",
    data.resumen || "",
    JSON.stringify(data)
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput("OK — webhook de resultados activo");
}
