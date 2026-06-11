# Sistema de puntuación — Polla Mundialista 2026

La configuración vive en `CFG_DEFAULT.puntajes` dentro de `index.html` y es editable por el admin (Admin → Configurar Puntajes). La pestaña **Reglas de Juego** y el soporte del apostador leen estos mismos valores: texto y motor nunca divergen.

## Valores por defecto

| Concepto | Clave | Puntos |
|---|---|---|
| Marcador exacto (fase de grupos) | `marcadorExacto` (+ bono dif.) | 5 + 1 = **6** |
| Resultado correcto (1X2) | `resultadoCorrecto` | **3** |
| Bono diferencia de gol (con resultado correcto) | `diferenciaGol` | **+1** |
| Equipo clasificado a dieciseisavos (1°, 2° o mejor tercero) | `clasificadoGrupos` | **2** c/u |
| Equipo que avanza de dieciseisavos | `avanceDieciseisavos` | **3** c/u |
| Equipo que avanza de octavos | `avanceOctavos` | **4** c/u |
| Equipo que avanza de cuartos | `avanceCuartos` | **5** c/u |
| Equipo que llega a la final (gana semis) | `avanceSemis` | **6** c/u |
| Campeón | `campeon` | **15** |
| Subcampeón | `subcampeon` | **10** |
| Ganador del tercer puesto | `tercerPuesto` | **5** |

## Reglas de cálculo

- **Grupos:** marcador exacto = `marcadorExacto + diferenciaGol` (el exacto siempre acierta la diferencia). Resultado correcto sin marcador = `resultadoCorrecto`, más `diferenciaGol` si coincide la diferencia de gol.
- **Clasificados/avances:** se compara el **equipo**, no la posición del cruce. Si pronosticaste que Colombia llega a cuartos y llega (aunque por otro camino del bracket), puntúa.
- Solo se puntúan partidos con resultado **final** ingresado por el admin. La fase de grupos real solo clasifica equipos cuando el grupo está completo (6/6 partidos).
- En eliminatorias reales con empate, el admin debe registrar el ganador por penales; sin él, el partido no resuelve avances.

## Desempates

**Grupos (criterios FIFA, Art. 13):** puntos → puntos entre empatados → DG entre empatados → GF entre empatados → DG total → GF total → *(fair play y sorteo no disponibles)* → orden alfabético (determinista, documentado).

**Mejores terceros:** puntos → DG → GF → alfabético. Avanzan exactamente 8.

**Entre apostadores:** puntos → marcadores exactos → resultados acertados → clasificados acertados → orden alfabético (misma posición práctica).

## Escenarios cubiertos por pruebas

Ver `runSelfTests()` en `index.html` y `tests/polla/run-tests.mjs`: tabla por puntos, desempate head-to-head, grupo sin pronósticos, asignación de terceros (Anexo C), deadline, checksum, configuración completa.
