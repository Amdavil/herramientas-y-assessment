// ─────────────────────────────────────────────────────────────────
// Actualizador de resultados reales del Mundial 2026 — STUB
//
// GitHub Pages es un hosting estático: no puede ejecutar tareas
// programadas ni llamar APIs con credenciales. Este script corre en
// GitHub Actions (ver .github/workflows/polla-daily-results.yml) y
// escribe data/polla/resultados.json, que el admin importa desde el
// panel (o que una versión futura de la app puede leer por fetch).
//
// PENDIENTE para activarlo:
//  1. Contratar/registrar un proveedor de resultados con API
//     (api-football.com, football-data.org, etc.).
//  2. Guardar la clave como secret FOOTBALL_API_KEY en el repo.
//  3. Implementar fetchResultados() con el mapeo de IDs de partido
//     (M73..M104 y GS-01..GS-72 — ver index.html).
//  4. Descomentar el cron del workflow.
//
// Estados de partido soportados por el formato:
//   scheduled | live | final | postponed | cancelled | manual_review
// Solo los partidos "final" deben usarse para recalcular puntos.
// ─────────────────────────────────────────────────────────────────
import { writeFileSync, mkdirSync } from 'node:fs';

const API_KEY = process.env.FOOTBALL_API_KEY;

if (!API_KEY) {
  console.log('⚠️  FOOTBALL_API_KEY no configurada — no hay nada que actualizar.');
  console.log('    Ver docs/polla/DEPLOYMENT.md para instrucciones de activación.');
  process.exit(0); // salida limpia: el workflow no debe fallar por esto
}

async function fetchResultados() {
  // TODO: implementar contra el proveedor elegido.
  // Debe devolver: [{match_id:'M73', goals_a:2, goals_b:1, winner:'local',
  //                  status:'final', updated_at:'2026-06-28T23:00:00Z'}, ...]
  throw new Error('fetchResultados() sin implementar — ver comentarios del archivo');
}

try {
  const resultados = await fetchResultados();
  mkdirSync('data/polla', { recursive: true });
  writeFileSync('data/polla/resultados.json', JSON.stringify({
    actualizado: new Date().toISOString(),
    resultados,
  }, null, 2));
  console.log(`✅ ${resultados.length} resultados escritos en data/polla/resultados.json`);
} catch (e) {
  console.error('❌ Error actualizando resultados:', e.message);
  process.exit(1);
}
