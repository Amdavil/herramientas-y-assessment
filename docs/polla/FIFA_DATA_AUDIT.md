# Auditoría de datos FIFA — Polla Mundialista 2026

**Fecha de auditoría:** 11 de junio de 2026
**Auditor:** Claude Code (revisión solicitada por el administrador)

## Fuentes consultadas

- FIFA.com — *Knockout stage match schedule & bracket* (la página oficial no fue accesible programáticamente desde el agente; su contenido se contrastó a través de medios que reproducen el calendario oficial).
- ESPN — *2026 FIFA World Cup match schedule* y bracket oficial.
- Wikipedia — *2026 FIFA World Cup knockout stage* (usada solo como espejo estructurado del calendario oficial FIFA, contrastada con ESPN/NBC/CBS).
- Sorteo oficial del 5 de diciembre de 2025 (composición de grupos A–L, verificada en sesión previa contra resultados oficiales del sorteo).

## Estructura verificada

| Chequeo | Resultado |
|---|---|
| Grupos | 12 (A–L) ✅ |
| Equipos | 48, sin duplicados, 4 por grupo ✅ |
| Partidos fase de grupos | 72, cada equipo juega 3 ✅ |
| Partidos eliminatorias | 32, numerados 73–104 ✅ |
| Total | 104 ✅ |

Estos chequeos corren automáticamente al cargar la app (`validarDatosFIFA()`) y en CI (`tests/polla/run-tests.mjs`).

## Errores encontrados y corregidos en esta auditoría

1. **Bracket de Ronda de 32 inventado (crítico).** La versión anterior emparejaba `1A vs 2B`, `1C vs 2D`… y hacía jugar **terceros contra terceros** (`M3°-1 vs M3°-2`), algo que no existe en el formato FIFA. Se reemplazó por los 16 cruces oficiales (partidos 73–88), p. ej. `M73: 2A vs 2B`, `M79: 1A vs 3° de C/E/F/H/I`.
2. **Cruces de octavos a final inventados.** Se reemplazaron por los oficiales (M89: W74 vs W77, …, M104: W101 vs W102) con sedes y fechas oficiales (final: MetLife, 19 de julio).
3. **Asignación de terceros.** Implementada con las restricciones del Anexo C (cada partido solo admite terceros de grupos específicos), resuelta por backtracking. *Limitación documentada:* FIFA define una tabla exacta de 495 combinaciones; esta implementación garantiza siempre una asignación válida que respeta las restricciones, pero en algunos escenarios la pareja exacta podría diferir de la tabla FIFA. Impacto en la polla: nulo para la puntuación por avance (se puntúa por equipo que avanza, no por cruce).
4. **Desempates de grupo no FIFA.** Antes: pts → DG → GF → alfabético. Ahora: pts → **enfrentamientos directos entre empatados (pts, DG, GF)** → DG total → GF total → alfabético. Fair play y ranking FIFA no están disponibles como datos; el orden alfabético es el sustituto determinista documentado (FIFA usa fair play y sorteo).
5. **Puntuación de eliminatorias comparaba `local/visitante`** en lugar del **equipo** que avanza — fallaba cuando el bracket del apostador difería del real. Corregido.
6. **Clasificados reales con grupos a medias.** Ahora un grupo real solo clasifica equipos cuando sus 6 partidos tienen resultado final, y los 8 mejores terceros solo se asignan con los 12 grupos completos.

## Datos conservados de la sesión anterior (verificados entonces contra el sorteo oficial)

- Composición de los 12 grupos y los 48 clasificados.
- Calendario de los 72 partidos de grupos (fechas 11–27 de junio, sedes, horas ET).

## Riesgos y pendientes

- **Horas ET de algunos partidos de grupos** provienen de la investigación de la sesión anterior; se recomienda una verificación puntual contra el PDF oficial de FIFA si se requiere precisión al minuto (no afecta puntuación).
- La conversión a hora Colombia es fija: ET (UTC-4 en junio/julio) − 1h = Bogotá (UTC-5).
- Si FIFA reprograma algún partido, actualizar `PARTIDOS_GRUPOS`/`PARTIDOS_ELIMINATORIAS` en `index.html` y correr `node tests/polla/run-tests.mjs`.
