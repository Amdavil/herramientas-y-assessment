// Runner de pruebas de la Polla Mundialista 2026 (Node >= 18)
// Extrae el <script> de index.html, lo evalúa con stubs de navegador
// y ejecuta validarDatosFIFA() + runSelfTests().
// Uso: node tests/polla/run-tests.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const match = html.match(/<script>([\s\S]*)<\/script>/);
if (!match) { console.error('❌ No se encontró <script> en index.html'); process.exit(1); }

// Stubs mínimos de browser para que el script cargue en Node
globalThis.document = {
  addEventListener() {},
  getElementById: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ style: {}, click() {} }),
  body: { appendChild() {} },
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
globalThis.window = { scrollTo() {} };

const api = eval(match[1] + ';({validarDatosFIFA, runSelfTests, cargarDB})');
api.cargarDB();

const erroresFIFA = api.validarDatosFIFA();
const tests = api.runSelfTests();

let fallos = 0;
for (const t of tests) {
  console.log(`${t.ok ? '✅' : '❌'} ${t.nombre}${!t.ok && t.detalle ? ' — ' + t.detalle : ''}`);
  if (!t.ok) fallos++;
}
for (const e of erroresFIFA) { console.log(`❌ [datos FIFA] ${e}`); fallos++; }

console.log(`\n${tests.length} pruebas · ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
