"""
PIPELINE: resultados de búsqueda -> oportunidades estructuradas -> valoración en USD.

1) Estructuración (IA): de cada resultado web saca una oportunidad de ingreso con
   pago estimado, esfuerzo, probabilidad y encaje con tu perfil. Reglas anti-invención.
2) Valoración: valor_esperado = pago_promedio(USD) * probabilidad - esfuerzo*tarifa_min.
   Ordena por dinero esperado (lo que más conviene perseguir primero).

Sin IA (offline) usa tests/sample_opportunities.json para probar el flujo completo.
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .jsonutil import parse_json_loose
from .settings import BASE_DIR, TIPOS_OPORTUNIDAD

# Tasas APROXIMADAS a USD (solo para ordenar/estimar; NO son cotización real).
TASAS_USD = {
    "USD": 1.0, "EUR": 1.08, "GBP": 1.27, "COP": 0.00025,
    "MXN": 0.058, "ARS": 0.0011, "BRL": 0.20, "PEN": 0.27, "CLP": 0.0011,
}

STRUCT_PROMPT = """Eres un analista que detecta OPORTUNIDADES DE INGRESO para esta persona y las estructura.

PERFIL (para juzgar encaje y probabilidad de éxito):
{perfil}

Se te entregan resultados de búsqueda web de hoy. Identifica OPORTUNIDADES REALES de ganar dinero \
aplicables a esta persona: proyectos freelance abiertos, bounties/tareas pagadas, concursos/challenges \
con premio, convocatorias/grants, empleos remotos, o demanda clara de sus servicios.

REGLAS (estrictas):
- NO inventes nombres, montos, fechas ni URLs. Si un dato no aparece, marca "No especificado".
- 'pago_estimado_min'/'max' y 'probabilidad' SON ESTIMACIONES tuyas: si la fuente no da monto, estima un \
rango razonable para ese tipo de trabajo y dilo en "notas" (ej. "monto estimado, no publicado").
- 'probabilidad' entre 0 y 1 = probabilidad realista de que ESTA persona lo consiga (sé conservador).
- 'esfuerzo_horas' = horas estimadas para entregarlo/aplicar.
- 'encaje' 1-5 según qué tan alineada está con sus habilidades.
- Descarta lo que no tenga dinero asociado, esté claramente vencido, o no encaje en absoluto.

CATÁLOGO de 'tipo' (elige uno): {tipos}.

Responde ÚNICAMENTE con JSON válido, sin texto extra:
{{
  "oportunidades": [
    {{
      "nombre": "Título de la oportunidad",
      "tipo": "uno del catálogo",
      "cliente_entidad": "Quién paga / contrata, o 'No especificado'",
      "plataforma": "Dónde está (Upwork, LinkedIn, web de la entidad, etc.)",
      "url": "URL directa",
      "pago_estimado_min": 0,
      "pago_estimado_max": 0,
      "moneda": "USD | EUR | COP | ...",
      "esfuerzo_horas": 0,
      "probabilidad": 0.0,
      "fecha_limite": "YYYY-MM-DD | texto | No especificado",
      "encaje": 1,
      "proximo_paso": "La primera acción concreta para perseguirla hoy",
      "notas": "Supuestos, si el monto es estimado, riesgos, etc."
    }}
  ],
  "descartadas": [
    {{ "nombre": "...", "motivo": "Sin pago | Vencida | No encaja | Duplicada | Fuente dudosa" }}
  ]
}}

Si no hay oportunidades válidas, devuelve "oportunidades": [].

RESULTADOS DE BÚSQUEDA DE HOY:
"""


def _format_results(results: list[dict]) -> str:
    text = ""
    for i, r in enumerate(results, 1):
        text += f"\n[{i}] TÍTULO: {r.get('title', 'N/A')}\nURL: {r.get('url', 'N/A')}\n"
        text += f"CONTENIDO: {(r.get('content') or '')[:1500]}\n---\n"
    return text


def _chunks(seq, size):
    for i in range(0, len(seq), size):
        yield seq[i:i + size]


def _offline_opportunities(logger: logging.Logger) -> list[dict]:
    sample = BASE_DIR / "tests" / "sample_opportunities.json"
    logger.warning("Estructuración OFFLINE: %s (datos simulados).", sample.name)
    if not sample.exists():
        return []
    data = json.loads(sample.read_text(encoding="utf-8"))
    return data.get("oportunidades", data) if isinstance(data, dict) else data


def extract_opportunities(search_results: list[dict], config: dict, call_fn,
                          logger: logging.Logger, force_offline: bool = False) -> list[dict]:
    if force_offline or call_fn is None:
        return _offline_opportunities(logger)

    modelo = config.get("modelo", {})
    batch_size = max(1, int(modelo.get("batch_size", 25)))
    base = STRUCT_PROMPT.format(
        perfil=json.dumps(config.get("perfil", {}), ensure_ascii=False, indent=2),
        tipos=", ".join(TIPOS_OPORTUNIDAD),
    )
    batches = list(_chunks(search_results, batch_size))
    logger.info("Estructurando %d resultados en %d lote(s)...", len(search_results), len(batches))

    all_opps: list[dict] = []
    for n, batch in enumerate(batches, 1):
        try:
            raw = call_fn(base + _format_results(batch))
        except Exception as e:  # noqa: BLE001
            logger.error("Lote %d/%d falló: %s", n, len(batches), e)
            continue
        data = parse_json_loose(raw, default={"oportunidades": []})
        opps = data.get("oportunidades", []) or []
        all_opps.extend(opps)
        logger.info("  Lote %d/%d: %d oportunidades.", n, len(batches), len(opps))
    return all_opps


# ── Valoración ────────────────────────────────────────────────────────────────

def _to_usd(monto: float, moneda: str) -> float:
    return monto * TASAS_USD.get((moneda or "USD").upper(), 1.0)


def _num(v, default=0.0) -> float:
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def value_opportunities(opps: list[dict], config: dict, logger: logging.Logger) -> list[dict]:
    """Calcula, por oportunidad:
       - valor_esperado_usd = pago_promedio(USD) * probabilidad   (dinero bruto esperado; nunca negativo)
       - valor_hora_usd     = valor_esperado_usd / horas          (eficiencia: cuánto rinde tu tiempo)
    Ordena por dinero esperado o por eficiencia, según config.valoracion.ordenar_por.
    """
    ordenar_por = config.get("valoracion", {}).get("ordenar_por", "dinero").lower()

    for o in opps:
        pmin = _num(o.get("pago_estimado_min"))
        pmax = _num(o.get("pago_estimado_max"))
        promedio = (pmin + pmax) / 2 if (pmin or pmax) else 0.0
        promedio_usd = _to_usd(promedio, o.get("moneda", "USD"))

        prob = min(max(_num(o.get("probabilidad", 0.2)), 0.0), 1.0)
        horas = max(_num(o.get("esfuerzo_horas", 0)), 0.0)

        valor = promedio_usd * prob
        o["valor_esperado_usd"] = round(valor, 2)
        o["valor_hora_usd"] = round(valor / horas, 2) if horas > 0 else round(valor, 2)
        o["probabilidad"] = round(prob, 2)

    clave = "valor_hora_usd" if ordenar_por in ("eficiencia", "hora", "valor_hora") else "valor_esperado_usd"
    opps.sort(key=lambda x: x.get(clave, 0), reverse=True)
    if opps:
        logger.info("Valoradas %d oportunidades (orden: %s). Top: '%s' = %.0f USD esperados (%.0f USD/h).",
                    len(opps), clave, str(opps[0].get("nombre", ""))[:40],
                    opps[0].get("valor_esperado_usd", 0), opps[0].get("valor_hora_usd", 0))
    return opps
