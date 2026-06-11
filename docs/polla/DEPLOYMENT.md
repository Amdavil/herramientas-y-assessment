# Despliegue y automatización — Polla Mundialista 2026

## Despliegue en GitHub Pages (estado actual)

1. El repo `Amdavil/polla-mundialista-2026` tiene Pages activo sirviendo `main` desde la raíz.
2. Cada push a `main` que toque `index.html` redespliega la app en
   `https://amdavil.github.io/polla-mundialista-2026/` (1–2 min).
3. No hay build: `index.html` es autónomo (HTML + CSS + JS).

## Qué NO puede hacer GitHub Pages (y las soluciones)

GitHub Pages es hosting estático: no ejecuta código de servidor, no envía correos y no corre tareas programadas. Funciones que lo requieren y su solución recomendada:

| Necesidad | Solución viable | Estado |
|---|---|---|
| Actualizar resultados a las 11:00 p.m. Colombia | GitHub Actions con cron `0 4 * * *` (04:00 UTC) + API de resultados | Workflow placeholder creado, **deshabilitado** hasta tener API key |
| Enviar soporte por correo | Resend/SendGrid vía función serverless, o Google Apps Script | **No implementado** — el soporte se descarga localmente y el apostador lo reenvía |
| Base de datos compartida entre apostadores | Supabase/Firebase (free tier) | **No implementado** — se usa respaldo JSON + import del admin |
| Bloqueo anti-trampa del lado servidor | Cualquiera de los backends anteriores | Mitigado con checksum + consolidación en el dispositivo del admin |

## Activar la actualización diaria de resultados

1. Registrarse en un proveedor (api-football.com, football-data.org, etc.).
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret** → nombre `FOOTBALL_API_KEY`. **Nunca poner la clave en el código del frontend.**
3. Implementar `fetchResultados()` en `scripts/polla/update_results.mjs` (el mapeo de IDs M73–M104 y GS-01–GS-72 está documentado en el archivo).
4. Descomentar el bloque `schedule:` en `.github/workflows/polla-daily-results.yml`.
5. El workflow escribe `data/polla/resultados.json` con log de última actualización; el admin lo importa, o se extiende la app para leerlo con `fetch()`.

Ejecución manual: pestaña **Actions → Polla — actualización diaria de resultados → Run workflow**.

## Pruebas en CI

`.github/workflows/polla-tests.yml` corre `node tests/polla/run-tests.mjs` en cada push que toque `index.html`. Si los datos FIFA o la lógica se rompen, el push queda marcado en rojo.

## ⚠️ Nota de higiene del repositorio

Este repo público contiene además el **Radar Visión Circular** (`funding-agent/`, workflow activo con secrets propios) por una mezcla de historiales previa. Recomendación: migrar el radar a su propio repo privado y dejar aquí solo la polla. No se separó automáticamente para no romper la automatización del radar.
