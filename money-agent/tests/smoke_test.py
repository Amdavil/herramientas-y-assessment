"""
Test de humo: ejercita las rutas de IA (auto-prompting + estructuración) con un
'LLM falso', sin necesitar claves. Verifica que los prompts se formatean bien y
que el JSON se parsea y valora correctamente.

    python tests/smoke_test.py
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from modules import pipeline, strategy            # noqa: E402
from modules.settings import load_config          # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("smoke")


def fake_llm_strategy(prompt: str) -> str:
    assert "{perfil}" not in prompt and "{historial}" not in prompt, "META_PROMPT mal formateado"
    return ('{"estrategia_resumen":"Foco en IA + economía circular",'
            '"razonamiento":"El historial muestra mejor valor en freelance de IA.",'
            '"queries":["AI automation freelancer needed 2026",'
            '"convocatoria economía circular consultor LATAM","python bounty paid task"]}')


def fake_llm_struct(prompt: str) -> str:
    assert "{perfil}" not in prompt and "{tipos}" not in prompt, "STRUCT_PROMPT mal formateado"
    return ('{"oportunidades":[{"nombre":"Proyecto de automatización","tipo":"Freelance / proyecto",'
            '"cliente_entidad":"ACME","plataforma":"Upwork","url":"https://x.test",'
            '"pago_estimado_min":200,"pago_estimado_max":600,"moneda":"USD","esfuerzo_horas":5,'
            '"probabilidad":0.3,"fecha_limite":"2026-07-01","encaje":4,"proximo_paso":"Aplicar",'
            '"notas":""}],"descartadas":[]}')


def main() -> int:
    config = load_config()

    # 1) Auto-prompting con IA simulada
    est = strategy.generate_strategy(config, fake_llm_strategy, "Mejores tipos: Freelance (500 USD)", log)
    assert est["modo"] == "auto", f"esperaba modo auto, fue {est['modo']}"
    assert len(est["queries"]) >= 1, "sin queries"
    print(f"[OK] Estrategia AUTO: '{est['estrategia_resumen']}' - {len(est['queries'])} queries")

    # 2) Estructuración + valoración con IA simulada
    results = [{"title": "t", "url": "https://x.test", "content": "c", "query": "q"}]
    opps = pipeline.extract_opportunities(results, config, fake_llm_struct, log, force_offline=False)
    opps = pipeline.value_opportunities(opps, config, log)
    assert opps, "sin oportunidades"
    o = opps[0]
    assert o["valor_esperado_usd"] > 0, "valor esperado debería ser positivo"
    # 200-600 prom 400 * 0.3 = 120 ; /5h = 24 USD/h
    assert abs(o["valor_esperado_usd"] - 120) < 0.01, o["valor_esperado_usd"]
    assert abs(o["valor_hora_usd"] - 24) < 0.01, o["valor_hora_usd"]
    print(f"[OK] Estructuracion+valoracion: '{o['nombre']}' = {o['valor_esperado_usd']} USD ({o['valor_hora_usd']} USD/h)")

    print("\n[OK] SMOKE TEST OK - las rutas de IA funcionan.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
