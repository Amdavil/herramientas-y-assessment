/**
 * Prueba el render fotorrealista sin abrir el kiosco.
 *
 *   node deliflor-bloom-lab/tools/probar-render.mjs
 *
 * Pide una imagen al worker con un prompt real de Bloom Lab, mide cuánto tarda
 * y la guarda como render-prueba.jpg para poder mirarla. Es la forma más rápida
 * de saber si la clave funciona y si la lámina vale la pena.
 */
import { writeFileSync } from 'node:fs';

const WORKER = process.argv[2] || 'https://pal-ai.projectability-pal.workers.dev';
const ORIGIN = 'https://amdavil.github.io';
const PRESUPUESTO_MS = 12000;   // el mismo plazo que aplica el kiosco

const prompt =
  'Professional botanical product photography of an entirely new chrysanthemum ' +
  'cultivar named "Aurora Magenta". The flower has a semi-spherical dome silhouette, ' +
  'very high petal density and spoon-tipped petals arranged in a spiral phyllotaxis. ' +
  'Petals are magenta with a gradient toward the tips, strong pink accents and a ' +
  'lime green centre. Flower diameter is large (11-14 cm). Growth habit is a single ' +
  'disbudded bloom per stem. Create a sophisticated round bouquet containing 15 stems, ' +
  'presented with natural kraft paper against a bright chrysanthemum greenhouse setting. ' +
  'Photorealistic botanical details, realistic chrysanthemum leaves and stems, natural ' +
  'petal translucency, professional floral styling, premium studio lighting, highly ' +
  'detailed, botanically coherent, centered composition, no text, no watermark, no logos.';

const negative =
  'roses, tulips, lilies, sunflowers, unrelated flower species, plastic petals, fabric ' +
  'flowers, malformed petals, duplicated stems, floating flowers, impossible vase geometry, ' +
  'artificial leaves, distorted bouquet, text, watermark, logo, people, hands, insects, ' +
  'excessive blur, cropped bouquet, low resolution.';

await main();

async function main() {
const ctrl = new AbortController();
const corte = setTimeout(() => ctrl.abort(), PRESUPUESTO_MS);
const t0 = Date.now();

console.log('Pidiendo la imagen a', WORKER);
console.log('Plazo máximo:', PRESUPUESTO_MS / 1000, 'segundos (el mismo del kiosco)\n');

try {
  const res = await fetch(WORKER, {
    method: 'POST',
    signal: ctrl.signal,
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({
      mode: 'bloom-render', prompt, negative, size: '1024x1024', quality: 'medium'
    })
  });
  clearTimeout(corte);
  const ms = Date.now() - t0;
  const cuerpo = await res.json().catch(() => ({}));

  if (!res.ok || !cuerpo.image) {
    console.error(`✕  Falló tras ${(ms / 1000).toFixed(1)} s — HTTP ${res.status}`);
    console.error('   Respuesta:', JSON.stringify(cuerpo).slice(0, 300));
    console.error('\n   Qué suele significar:');
    console.error('   503 Image service not configured → falta el secreto IMAGE_API_KEY');
    console.error('   403 Origin not allowed           → el worker no reconoce el origen');
    console.error('   400 No fields                    → el worker desplegado es el viejo:');
    console.error('                                      falta `npx wrangler deploy`');
    console.error('   502 No image returned            → la clave o el modelo no son válidos');
    process.exitCode = 1;
    return;
  }

  const b64 = cuerpo.image.split(',')[1] || cuerpo.image;
  const bytes = Buffer.from(b64, 'base64');
  const salida = 'render-prueba.jpg';
  writeFileSync(salida, bytes);

  console.log(`✓  Respondió en ${(ms / 1000).toFixed(1)} s`);
  console.log(`   ${Math.round(bytes.length / 1024)} KB guardados en ${salida}`);
  console.log('\n   Ábrelo y juzga la lámina. Si tarda más de 12 s en el evento,');
  console.log('   el visitante no la verá: baja la calidad o cambia de modelo.');
} catch (e) {
  clearTimeout(corte);
  const ms = Date.now() - t0;
  if (e.name === 'AbortError') {
    console.error(`✕  Plazo agotado a los ${(ms / 1000).toFixed(1)} s.`);
    console.error('   Con este modelo el kiosco abandonaría la petición y mostraría');
    console.error('   su modelo 3D. Prueba quality "low" o un modelo más rápido.');
  } else {
    console.error('✕  Error de red:', e.message);
  }
  process.exitCode = 1;
}
}
