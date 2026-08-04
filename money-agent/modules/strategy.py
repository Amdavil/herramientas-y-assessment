"""
AUTO-PROMPTING NOCTURNO — "un prompt sobre otro".

Cada noche el agente NO usa búsquedas fijas: reflexiona sobre (a) tu perfil,
(b) el historial de noches anteriores y (c) qué tipos/plataformas dieron las
oportunidades de mayor valor en la cuenta, y con eso la IA GENERA la estrategia
y las búsquedas de esta noche. La estrategia se guarda para que la noche
siguiente aprenda de esta. Si no hay IA, usa una estrategia base del perfil.
"""

from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path

from .jsonutil import parse_json_loose

META_PROMPT = """Eres un ESTRATEGA DE INGRESOS. Tu trabajo es decidir qué buscar HOY en la web \
para encontrar las oportunidades de dinero de MAYOR VALOR ESPERADO para esta persona, y mejorar \
respecto a las noches anteriores.

PERFIL DE LA PERSONA:
{perfil}

META: ingreso objetivo de {objetivo_mensual} USD/mes. Tarifa mínima: {tarifa} USD/hora.

HISTORIAL DE NOCHES ANTERIORES (estrategias usadas y cuántas oportunidades dieron):
{historial}

QUÉ HA FUNCIONADO SEGÚN LA CUENTA (tipos y plataformas con más valor acumulado):
{aprendizaje}

INSTRUCCIONES:
- Genera EXACTAMENTE {n} consultas de búsqueda web, concretas y accionables, que un buscador (Google/Tavily) \
entienda bien. Mezcla idiomas según el perfil (español e inglés si aplica).
- Aproximadamente el {explorar}% deben ser EXPLORATORIAS (ángulos/plataformas/nichos nuevos no probados antes); \
el resto, EXPLOTACIÓN (refinar lo que ya dio resultados).
- Apunta a oportunidades REALES y con dinero asociado: proyectos freelance abiertos, bounties/tareas pagadas, \
concursos/challenges con premio, convocatorias/grants, empleos remotos, demanda de los servicios del perfil.
- Evita repetir literalmente consultas de noches anteriores salvo que claramente valga la pena.
- NO inventes resultados; solo propones QUÉ buscar.

Responde ÚNICAMENTE con JSON válido, sin texto extra:
{{
  "estrategia_resumen": "1-2 frases: el enfoque de esta noche y por qué",
  "razonamiento": "2-4 frases: qué aprendiste del historial y cómo lo aplicas hoy",
  "queries": ["consulta 1", "consulta 2", "..."]
}}
"""


def load_history(path: str | Path) -> list[dict]:
    p = Path(path)
    if not p.exists():
        return []
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return []


def save_history(path: str | Path, entry: dict, max_entries: int = 60) -> None:
    p = Path(path)
    history = load_history(p)
    history.append(entry)
    history = history[-max_entries:]  # conserva las últimas N noches
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(history, ensure_ascii=False, indent=2), encoding="utf-8")


def _history_digest(history: list[dict], limit: int = 7) -> str:
    if not history:
        return "Es la PRIMERA noche: no hay historial todavía."
    lines = []
    for h in history[-limit:]:
        lines.append(
            f"- {h.get('fecha', '?')}: {h.get('estrategia_resumen', '(sin resumen)')} "
            f"→ {h.get('n_oportunidades', 0)} oportunidades, "
            f"valor esperado total {h.get('valor_esperado_total', 0):.0f} USD"
        )
    return "\n".join(lines)


def _default_queries(config: dict, n: int) -> list[str]:
    """Estrategia base (sin IA): combina habilidades × plataformas × idiomas del perfil."""
    perfil = config.get("perfil", {})
    habilidades = perfil.get("habilidades", ["servicios profesionales"])
    plataformas = perfil.get("plataformas", ["Upwork", "LinkedIn"])
    en = "inglés" in [i.lower() for i in perfil.get("idiomas", [])]

    plantillas_es = [
        '{hab} freelance proyecto abierto contratar 2026',
        'convocatoria OR grant OR premio "{hab}" Latinoamérica 2026',
        'se busca {hab} remoto pago por proyecto',
        'concurso challenge con premio {hab}',
    ]
    plantillas_en = [
        'hire freelance "{hab}" remote project 2026',
        '"{hab}" bounty OR paid task open',
        'remote contract "{hab}" apply now',
        'grant OR competition prize "{hab}"',
    ]
    queries: list[str] = []
    i = 0
    while len(queries) < n:
        hab = habilidades[i % len(habilidades)]
        plantillas = plantillas_es + (plantillas_en if en else [])
        tmpl = plantillas[i % len(plantillas)]
        q = tmpl.format(hab=hab)
        if q not in queries:
            queries.append(q)
        i += 1
        if i > n * 4:  # red de seguridad
            break
    # añade una búsqueda por plataforma preferida
    for plat in plataformas[:2]:
        if len(queries) < n:
            queries.append(f'oportunidades pagadas {plat} {habilidades[0]}')
    return queries[:n]


def generate_strategy(config: dict, call_fn, aprendizaje: str, logger: logging.Logger) -> dict:
    """Devuelve {estrategia_resumen, razonamiento, queries, modo}."""
    estr = config.get("estrategia", {})
    n = int(estr.get("n_queries_por_noche", 8))
    auto = bool(estr.get("auto_prompting", True))
    explorar = int(estr.get("explorar_pct", 30))

    history = load_history(config["rutas"]["historial_estrategia"])

    if not auto or call_fn is None:
        motivo = "auto_prompting desactivado" if not auto else "sin IA disponible"
        logger.info("Estrategia BASE del perfil (%s).", motivo)
        return {
            "estrategia_resumen": f"Estrategia base derivada del perfil ({motivo}).",
            "razonamiento": "Combinación de tus habilidades, plataformas e idiomas.",
            "queries": _default_queries(config, n),
            "modo": "base",
        }

    prompt = META_PROMPT.format(
        perfil=json.dumps(config.get("perfil", {}), ensure_ascii=False, indent=2),
        objetivo_mensual=config.get("meta", {}).get("objetivo_mensual_usd", 1000),
        tarifa=config.get("perfil", {}).get("tarifa_hora_min_usd", 15),
        historial=_history_digest(history),
        aprendizaje=aprendizaje or "Aún no hay datos en la cuenta.",
        n=n, explorar=explorar,
    )

    try:
        raw = call_fn(prompt)
        data = parse_json_loose(raw, default={})
        queries = [q for q in data.get("queries", []) if isinstance(q, str) and q.strip()]
        if not queries:
            raise ValueError("La IA no devolvió queries utilizables.")
        logger.info("Estrategia AUTO-PROMPTEADA: %s", data.get("estrategia_resumen", "")[:90])
        return {
            "estrategia_resumen": data.get("estrategia_resumen", ""),
            "razonamiento": data.get("razonamiento", ""),
            "queries": queries[:n],
            "modo": "auto",
        }
    except Exception as e:  # noqa: BLE001
        logger.warning("Falló el auto-prompting (%s). Uso estrategia base.", e)
        return {
            "estrategia_resumen": "Estrategia base (falló el auto-prompting).",
            "razonamiento": str(e),
            "queries": _default_queries(config, n),
            "modo": "base_fallback",
        }
