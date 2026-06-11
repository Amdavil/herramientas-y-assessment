# Guía del administrador — Polla Mundialista 2026

## Acceso

Pestaña **Admin** → PIN (por defecto `2026`). **Cámbialo antes del lanzamiento** en Admin → Configurar Puntajes → campo PIN.

## Antes del cierre (11 jun 2026, 1:00 p.m. Colombia)

1. Comparte el link de la app y las **Reglas de Juego** con los apostadores.
2. Cada apostador: se registra → llena los 72 partidos de grupos → completa el bracket (la app arma los cruces automáticamente) → **Mi Panel → Enviar apuesta definitiva**.
3. El envío bloquea su apuesta, genera ID + checksum y descarga su **soporte HTML** (que puede reenviar por correo/WhatsApp como comprobante).
4. Pide a cada apostador su **respaldo JSON** (Mi Panel → Respaldo JSON) y consolídalos en TU dispositivo con **Admin → Importar respaldo JSON** (acepta varios archivos a la vez y verifica el checksum: si el archivo fue alterado, lo rechaza).
5. Tu navegador queda como la **fuente oficial** de la polla. Haz tu propio respaldo exportando los CSV.

## Durante el torneo

1. **Admin → Ingresar Resultados Reales**: marca el marcador de cada partido jugado y guarda (💾). En eliminatorias con empate debes elegir el **ganador por penales** en el selector.
2. Los puntos y la tabla se recalculan solos (botón 🔄 Recalcular si quieres forzarlo).
3. Publica la tabla con **📥 Tabla** (CSV) o compartiendo pantalla de la pestaña Tabla.
4. Los grupos reales solo clasifican equipos cuando los 6 partidos del grupo estén ingresados; los mejores terceros, cuando los 12 grupos estén completos.

## Herramientas

| Botón | Qué hace |
|---|---|
| 📥 Tabla | CSV de posiciones de apostadores |
| 📥 Predicciones | CSV maestro: todas las predicciones (grupos + eliminatorias) con ID, checksum, locked |
| 📥 Resultados | CSV de resultados reales con estado y fecha de actualización |
| 📂 Importar respaldo JSON | Consolida apuestas de otros dispositivos |
| 🩺 Diagnóstico y pruebas | Corre las validaciones FIFA y los self-tests |
| 🔒 Bloquear todos | Bloquea manualmente todos los partidos sin resultado |
| 🗑️ Reiniciar | **Borra todo** (doble confirmación) — solo para empezar de cero |

## Seguridad y límites conocidos

- El cierre (deadline) y el bloqueo por envío se validan en el código, pero al ser una app de navegador un usuario técnico podría manipular su propio `localStorage`. La defensa es la consolidación: **la copia del admin manda**, y el checksum del soporte/respaldo delata cualquier alteración posterior al envío.
- No edites predicciones ajenas; si hay una corrección legítima antes del cierre, que el apostador la haga y reenvíe su respaldo.
- El PIN del admin no protege datos en el dispositivo del apostador, solo el acceso al panel en el tuyo.
