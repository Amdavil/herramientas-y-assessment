"""
Agente de Ingresos Nocturno — orquestador.

Flujo de cada noche:
  1) Auto-prompting: la IA genera la estrategia de búsqueda de hoy (aprende del historial + la cuenta).
  2) Búsqueda web con esas queries.
  3) Estructuración: convierte resultados en oportunidades de ingreso (con pago/esfuerzo/probabilidad).
  4) Valoración: ordena por dinero esperado.
  5) La cuenta (ledger): añade las nuevas, sin duplicar; respeta tus ediciones.
  6) Plan de acción de la mañana (Markdown) + correo opcional.
  7) Guarda la estrategia en el historial para que mañana aprenda de hoy.

Uso:
  python money_agent.py                 # corrida real (según config.json y claves en .env)
  python money_agent.py --simulate      # offline: sin red ni APIs, datos de prueba (para ver el flujo)
  python money_agent.py --provider exa  # fuerza un proveedor de búsqueda
  python money_agent.py --no-email      # no envía correo aunque esté activado
"""

from __future__ import annotations

import argparse
import sys
from datetime import date
from pathlib import Path

from modules import ledger, pipeline, providers, report, strategy
from modules.settings import load_config, setup_logging


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Agente de Ingresos Nocturno")
    p.add_argument("--simulate", action="store_true",
                   help="Modo offline (sin red ni APIs). Datos de prueba para ver el flujo completo.")
    p.add_argument("--provider", help="Forzar proveedor de búsqueda (tavily|exa|brave|google_cse|serpapi|simulado).")
    p.add_argument("--no-email", action="store_true", help="No enviar correo aunque esté activado.")
    return p.parse_args()


def main() -> int:
    args = parse_args()
    today = date.today().isoformat()

    config = load_config()
    logger = setup_logging(config["rutas"]["logs"])

    if args.simulate:
        config["busqueda"]["proveedor"] = "simulado"
        config["correo"]["enviar_resumen"] = False
    if args.provider:
        config["busqueda"]["proveedor"] = args.provider
    if args.no_email:
        config["correo"]["enviar_resumen"] = False

    logger.info("=" * 64)
    logger.info("  Agente de Ingresos Nocturno — %s", today)
    logger.info("  Búsqueda: %s | Simulación: %s", config["busqueda"]["proveedor"], args.simulate)
    logger.info("=" * 64)

    call_fn, ai_name = providers.get_ai_caller(config, logger, force_offline=args.simulate)

    # Estado actual de la cuenta (para que la estrategia aprenda de lo que ha dado valor)
    excel_path = Path(config["rutas"]["ledger_excel"])
    csv_path = Path(config["rutas"]["ledger_csv"])
    df_actual = ledger.load_ledger(excel_path, csv_path)
    aprendizaje = ledger.learning_digest(df_actual)

    # 1) AUTO-PROMPTING — estrategia de la noche
    logger.info("[1/6] Auto-prompting: generando la estrategia de esta noche")
    estrategia = strategy.generate_strategy(config, call_fn, aprendizaje, logger)
    queries = estrategia["queries"]
    logger.info("      %d queries (%s)", len(queries), estrategia["modo"])

    # 2) Búsqueda
    logger.info("[2/6] Búsqueda web")
    resultados = providers.run_searches(config, queries, logger)
    if not resultados and not args.simulate:
        logger.warning("La búsqueda no devolvió resultados (¿cuota/clave de SEARCH_API_KEY?). "
                       "Continúo para mostrar el estado de la cuenta.")

    # 3) Estructuración
    logger.info("[3/6] Estructuración de oportunidades")
    opps = pipeline.extract_opportunities(resultados, config, call_fn, logger, force_offline=args.simulate)

    # 4) Valoración
    logger.info("[4/6] Valoración (dinero esperado)")
    opps = pipeline.value_opportunities(opps, config, logger)

    # 5) La cuenta
    logger.info("[5/6] Actualizando la cuenta (ledger)")
    res = ledger.add_opportunities(opps, config, logger, today)
    df_final = ledger.load_ledger(excel_path, csv_path)
    balances = ledger.compute_balances(df_final, config)

    # 6) Plan de acción + correo
    logger.info("[6/6] Plan de acción de la mañana")
    rep = report.write_report(estrategia, opps, balances, config, logger, today)
    report.maybe_send_email(rep["markdown"], config, logger, today)

    # Guardar la estrategia en el historial (para que mañana aprenda de hoy)
    valor_total = round(sum(max(o.get("valor_esperado_usd", 0), 0) for o in opps), 2)
    strategy.save_history(config["rutas"]["historial_estrategia"], {
        "fecha": today,
        "modo": estrategia["modo"],
        "estrategia_resumen": estrategia["estrategia_resumen"],
        "queries": queries,
        "n_oportunidades": len(opps),
        "valor_esperado_total": valor_total,
    })

    logger.info("=" * 64)
    logger.info("  RESUMEN — %d oportunidades nuevas | valor esperado total: %.0f USD", res["agregadas"], valor_total)
    logger.info("  CUENTA — saldo real cobrado: %.0f USD | pipeline abierto: %.0f USD | avance meta mes: %.1f%%",
                balances["saldo_real_usd"], balances["pipeline_usd"], balances["avance_pct"])
    logger.info("  Plan: %s", rep["md_path"])
    logger.info("  Cuenta: %s", res["excel_path"])
    logger.info("=" * 64)
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:  # noqa: BLE001
        print(f"\n[ERROR FATAL] {exc}\n", file=sys.stderr)
        raise
