# ⚽ Polla Mundialista 2026 — Los Pibes de la 12

Plataforma de predicciones para la Copa Mundial FIFA 2026 (Estados Unidos · México · Canadá, 11 jun – 19 jul 2026). Aplicación de **un solo archivo** (`index.html`) desplegada en GitHub Pages.

**App en vivo:** https://amdavil.github.io/polla-mundialista-2026/

## Qué hace

- 48 equipos · 12 grupos (A–L) · 104 partidos con el calendario oficial FIFA (sedes, fechas, partidos 1–104).
- Registro/login de apostadores y pronósticos de los 72 partidos de grupos.
- Tabla de cada grupo calculada con **criterios de desempate FIFA** (puntos → enfrentamientos directos → diferencia de gol → goles a favor).
- Los **8 mejores terceros** y el **bracket oficial de Ronda de 32** (cruces FIFA reales, restricciones del Anexo C para los terceros) se generan automáticamente desde los pronósticos.
- **Cierre de apuestas: 11 de junio de 2026, 1:00 p.m. hora Colombia** (`BETTING_DEADLINE` en `index.html`). Después del cierre nadie puede crear ni modificar pronósticos.
- **Envío definitivo**: valida la predicción completa (72+32), bloquea la apuesta, genera ID + checksum y descarga un **soporte HTML** con todo el detalle.
- Panel admin (PIN) para ingresar resultados reales (con ganador por penales en eliminatorias), recalcular puntos, exportar CSV (predicciones maestro / resultados / tabla) e **importar respaldos JSON** de otros dispositivos.
- Pestaña **Reglas de Juego** cuyos puntos se leen de la misma configuración que usa el motor de cálculo.

## Limitación arquitectónica importante

La app guarda los datos en `localStorage`: **cada navegador tiene su propia copia**. Para consolidar la polla:

1. Cada apostador envía su apuesta y comparte su **respaldo JSON** (botón en Mi Panel) con el administrador.
2. El admin usa **Admin → Importar respaldo JSON** para consolidar todas las apuestas en su dispositivo, que se convierte en la fuente oficial de la tabla.

Envío automático de correos y actualización automática de resultados **no son posibles en GitHub Pages puro**; ver `docs/polla/DEPLOYMENT.md` para las opciones (GitHub Actions + API de resultados, Supabase, Apps Script).

## Correr localmente

```bash
python -m http.server 8642
# abrir http://localhost:8642/index.html
```

## Pruebas

```bash
node tests/polla/run-tests.mjs
```

También corren solas en GitHub Actions en cada push a `index.html`, y en la app: **Admin → Diagnóstico y pruebas**.

## Documentación

- `docs/polla/FIFA_DATA_AUDIT.md` — auditoría de datos vs FIFA, fuentes y cambios.
- `docs/polla/SCORING_RULES.md` — sistema de puntuación y desempates.
- `docs/polla/DEPLOYMENT.md` — despliegue, secrets y automatización diaria.
- `docs/polla/ADMIN_GUIDE.md` — guía del administrador.

> Nota: este repositorio también aloja el workflow del Radar Visión Circular (`funding-agent/`), un proyecto independiente del dueño del repo.
