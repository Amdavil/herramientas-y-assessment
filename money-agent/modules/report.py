"""
Plan de acción de la mañana (Markdown) + envío opcional por correo.

Resume: la estrategia auto-prompteada de la noche, el estado de LA CUENTA
(saldo real vs pipeline vs meta) y el TOP de oportunidades a perseguir hoy,
ordenadas por dinero esperado.
"""

from __future__ import annotations

import logging
from pathlib import Path

from .settings import get_env


def _fmt_money(x) -> str:
    try:
        return f"{float(x):,.0f}"
    except (TypeError, ValueError):
        return "0"


def _top_table(opps: list[dict], n: int = 10) -> str:
    if not opps:
        return "_No se encontraron oportunidades nuevas esta noche._\n"
    head = ("| # | Oportunidad | Tipo | Pago est. | Prob. | Valor esp. (USD) | USD/h | Próximo paso |\n"
            "|---|-------------|------|-----------|-------|------------------|-------|--------------|\n")
    rows = []
    for i, o in enumerate(opps[:n], 1):
        pago = f"{_fmt_money(o.get('pago_estimado_min'))}–{_fmt_money(o.get('pago_estimado_max'))} {o.get('moneda', 'USD')}"
        nombre = str(o.get("nombre", ""))[:45]
        url = o.get("url", "")
        nombre_md = f"[{nombre}]({url})" if url and url != "No especificado" else nombre
        rows.append(
            f"| {i} | {nombre_md} | {o.get('tipo', '')} | {pago} | "
            f"{o.get('probabilidad', 0)} | **{_fmt_money(o.get('valor_esperado_usd'))}** | "
            f"{_fmt_money(o.get('valor_hora_usd'))} | {str(o.get('proximo_paso', ''))[:60]} |"
        )
    return head + "\n".join(rows) + "\n"


def build_markdown(strategy: dict, opps: list[dict], balances: dict, config: dict, today: str) -> str:
    meta = config.get("meta", {})
    b = balances
    barra_n = int(min(b.get("avance_pct", 0), 100) // 10)
    barra = "█" * barra_n + "░" * (10 - barra_n)

    md = f"""# 💰 Plan de ingresos — {today}

## 🧭 Estrategia de esta noche ({strategy.get('modo', 'base')})
**{strategy.get('estrategia_resumen', '')}**

{strategy.get('razonamiento', '')}

Búsquedas ejecutadas:
""" + "".join(f"- `{q}`\n" for q in strategy.get("queries", [])) + f"""

## 🏦 La cuenta
| Métrica | USD |
|---|---|
| **Saldo real cobrado (total)** | **{_fmt_money(b.get('saldo_real_usd'))}** |
| Cobrado este mes | {_fmt_money(b.get('saldo_mes_usd'))} |
| Ganado pendiente de cobro | {_fmt_money(b.get('ganado_pendiente_usd'))} |
| Pipeline (valor esperado abierto) | {_fmt_money(b.get('pipeline_usd'))} |

**Meta mensual:** {_fmt_money(meta.get('objetivo_mensual_usd'))} USD
`{barra}` {b.get('avance_pct', 0)}%

Estados en la cuenta: {b.get('conteos', {})}

## 🎯 Oportunidades para perseguir HOY (ordenadas por dinero esperado)
{_top_table(opps)}

---
> Recuerda: el agente *encuentra y organiza* el dinero potencial. Entra a tu cuenta de verdad
> cuando avanzas estas oportunidades a **ganada** y luego **cobrada** en el Excel
> (`data/cuenta_ingresos.xlsx`). Persigue primero las de mayor *valor esperado*.
"""
    return md


def write_report(strategy: dict, opps: list[dict], balances: dict, config: dict,
                 logger: logging.Logger, today: str) -> dict:
    out_dir = Path(config["rutas"]["output"])
    out_dir.mkdir(parents=True, exist_ok=True)
    md = build_markdown(strategy, opps, balances, config, today)
    md_path = out_dir / f"plan_ingresos_{today}.md"
    md_path.write_text(md, encoding="utf-8")
    logger.info("Plan de acción: %s", md_path)
    return {"md_path": md_path, "markdown": md}


def maybe_send_email(md: str, config: dict, logger: logging.Logger, today: str) -> None:
    if not config.get("correo", {}).get("enviar_resumen", False):
        return
    sender = get_env("GMAIL_SENDER_EMAIL")
    password = get_env("GMAIL_APP_PASSWORD")
    to = get_env("ALERT_EMAIL") or sender
    if not (sender and password and to):
        logger.warning("Correo activado pero faltan GMAIL_SENDER_EMAIL/GMAIL_APP_PASSWORD/ALERT_EMAIL. Se omite.")
        return
    try:
        import smtplib
        from email.mime.text import MIMEText
        msg = MIMEText(md, "plain", "utf-8")
        msg["Subject"] = config["correo"].get("asunto", "Plan de ingresos — {fecha}").format(fecha=today)
        msg["From"] = sender
        msg["To"] = to
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as s:
            s.login(sender, password)
            s.send_message(msg)
        logger.info("Resumen enviado por correo a %s", to)
    except Exception as e:  # noqa: BLE001
        logger.error("No se pudo enviar el correo: %s", e)
