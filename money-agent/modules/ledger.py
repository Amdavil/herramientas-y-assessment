"""
LA CUENTA (ledger) — persistencia y saldos.

Cada oportunidad detectada entra a un Excel/CSV y vive un ciclo:
  detectada -> en_progreso -> ganada -> cobrada   (o -> descartada)

El AGENTE solo AÑADE oportunidades nuevas (sin duplicar). TÚ editas el Excel para
mover el estado y, al cobrar, pones 'Estado'=cobrada y 'Monto cobrado (USD)'. Así:
  - saldo_real      = suma de lo COBRADO  (tu dinero de verdad en la cuenta)
  - ganado_pendiente= adjudicado pero sin cobrar
  - pipeline        = valor esperado de lo que sigue abierto (detectada/en_progreso)

El agente NUNCA sobrescribe tus ediciones: respeta filas existentes.
"""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import date
from pathlib import Path

import pandas as pd

from .settings import (
    COLUMN_HEADERS, COLUMN_KEYS, KEY_TO_HEADER, NO_ESPECIFICADO,
    ESTADO_DETECTADA, ESTADO_EN_PROGRESO, ESTADO_GANADA, ESTADO_COBRADA,
)
from .pipeline import _to_usd, _num

HASH_HEADER = KEY_TO_HEADER["clave_hash"]
ID_HEADER = KEY_TO_HEADER["id"]
ESTADO_HEADER = KEY_TO_HEADER["estado"]


def _norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def hash_opp(opp: dict) -> str:
    base = _norm(opp.get("url", "")) or _norm(opp.get("nombre", ""))
    return hashlib.sha1(base.encode("utf-8")).hexdigest()[:12]


def _empty_df() -> pd.DataFrame:
    return pd.DataFrame(columns=COLUMN_HEADERS)


def load_ledger(excel_path: Path, csv_path: Path) -> pd.DataFrame:
    path = excel_path if excel_path.exists() else (csv_path if csv_path.exists() else None)
    if path is None:
        return _empty_df()
    try:
        df = pd.read_excel(path, dtype=str) if path.suffix == ".xlsx" else pd.read_csv(path, dtype=str, encoding="utf-8-sig")
    except Exception:
        return _empty_df()
    return df.reindex(columns=COLUMN_HEADERS).fillna("")


def _existing_hashes(df: pd.DataFrame) -> set[str]:
    if HASH_HEADER not in df.columns:
        return set()
    return {str(k) for k in df[HASH_HEADER].tolist() if str(k).strip()}


def _next_id(df: pd.DataFrame) -> int:
    max_n = 0
    if ID_HEADER in df.columns:
        for val in df[ID_HEADER].tolist():
            m = re.search(r"(\d+)", str(val))
            if m:
                max_n = max(max_n, int(m.group(1)))
    return max_n + 1


# Columnas que TÚ gestionas a mano: si están vacías, se dejan en blanco (no "No especificado")
_EDITABLES_VACIO = {"fecha_cobro", "monto_cobrado_usd", "notas"}


def _opp_to_row(opp: dict) -> dict:
    row = {}
    for key in COLUMN_KEYS:
        val = opp.get(key, "")
        if val is None or str(val).strip() == "":
            row[KEY_TO_HEADER[key]] = "" if key in _EDITABLES_VACIO else NO_ESPECIFICADO
        else:
            row[KEY_TO_HEADER[key]] = str(val)
    return row


def add_opportunities(new_opps: list[dict], config: dict, logger: logging.Logger,
                      today: str | None = None) -> dict:
    today = today or date.today().isoformat()
    excel_path = Path(config["rutas"]["ledger_excel"])
    csv_path = Path(config["rutas"]["ledger_csv"])
    excel_path.parent.mkdir(parents=True, exist_ok=True)

    df = load_ledger(excel_path, csv_path)
    known = _existing_hashes(df)
    counter = _next_id(df)

    rows, agregadas = [], 0
    for opp in new_opps:
        h = hash_opp(opp)
        if h in known:
            continue
        known.add(h)
        opp["clave_hash"] = h
        opp["id"] = f"ING-{counter:04d}"
        counter += 1
        opp.setdefault("fecha_deteccion", today)
        opp.setdefault("estado", ESTADO_DETECTADA)
        opp["fecha_ultima_revision"] = today
        opp.setdefault("monto_cobrado_usd", "")
        opp.setdefault("fecha_cobro", "")
        rows.append(_opp_to_row(opp))
        agregadas += 1

    if rows:
        df = pd.concat([df, pd.DataFrame(rows, columns=COLUMN_HEADERS)], ignore_index=True)

    df = df.reindex(columns=COLUMN_HEADERS).fillna("")
    df.to_excel(excel_path, index=False)
    df.to_csv(csv_path, index=False, encoding="utf-8-sig")

    logger.info("Cuenta actualizada: +%d nuevas (de %d candidatas). Total filas: %d",
                agregadas, len(new_opps), len(df))
    return {"excel_path": excel_path, "csv_path": csv_path, "agregadas": agregadas, "total": len(df)}


# ── Saldos y métricas ─────────────────────────────────────────────────────────

def _col_num(df: pd.DataFrame, header: str) -> pd.Series:
    return pd.to_numeric(df.get(header, pd.Series(dtype=str)), errors="coerce").fillna(0.0)


def _avg_pay_usd(row: pd.Series) -> float:
    pmin = _num(row.get(KEY_TO_HEADER["pago_estimado_min"]))
    pmax = _num(row.get(KEY_TO_HEADER["pago_estimado_max"]))
    prom = (pmin + pmax) / 2 if (pmin or pmax) else 0.0
    return _to_usd(prom, str(row.get(KEY_TO_HEADER["moneda"], "USD")))


def compute_balances(df: pd.DataFrame, config: dict) -> dict:
    if df.empty:
        return {"saldo_real_usd": 0.0, "ganado_pendiente_usd": 0.0, "pipeline_usd": 0.0,
                "saldo_mes_usd": 0.0, "conteos": {}, "objetivo_mensual_usd":
                float(config.get("meta", {}).get("objetivo_mensual_usd", 0)), "avance_pct": 0.0}

    estado = df[ESTADO_HEADER].astype(str).str.strip().str.lower()
    cobrado = _col_num(df, KEY_TO_HEADER["monto_cobrado_usd"])
    esperado = _col_num(df, KEY_TO_HEADER["valor_esperado_usd"])

    saldo_real = float(cobrado[estado == ESTADO_COBRADA].sum())

    ganadas = df[estado == ESTADO_GANADA]
    ganado_pendiente = float(sum(_avg_pay_usd(r) for _, r in ganadas.iterrows())) if not ganadas.empty else 0.0

    abierto = estado.isin([ESTADO_DETECTADA, ESTADO_EN_PROGRESO])
    pipeline = float(esperado[abierto].clip(lower=0).sum())

    # Saldo cobrado en el mes en curso
    mes = date.today().strftime("%Y-%m")
    fcobro = df[KEY_TO_HEADER["fecha_cobro"]].astype(str)
    saldo_mes = float(cobrado[(estado == ESTADO_COBRADA) & (fcobro.str.startswith(mes))].sum())

    conteos = estado.value_counts().to_dict()
    objetivo = float(config.get("meta", {}).get("objetivo_mensual_usd", 0))
    avance = (saldo_mes / objetivo * 100) if objetivo else 0.0

    return {
        "saldo_real_usd": round(saldo_real, 2),
        "ganado_pendiente_usd": round(ganado_pendiente, 2),
        "pipeline_usd": round(pipeline, 2),
        "saldo_mes_usd": round(saldo_mes, 2),
        "conteos": conteos,
        "objetivo_mensual_usd": objetivo,
        "avance_pct": round(avance, 1),
    }


def learning_digest(df: pd.DataFrame) -> str:
    """Texto corto para alimentar la estrategia: qué tipos/plataformas acumulan más valor."""
    if df.empty:
        return "Aún no hay datos en la cuenta."
    val = _col_num(df, KEY_TO_HEADER["valor_esperado_usd"])
    tmp = df.copy()
    tmp["_v"] = val
    partes = []
    for col, etiqueta in [(KEY_TO_HEADER["tipo"], "tipos"), (KEY_TO_HEADER["plataforma"], "plataformas")]:
        if col in tmp.columns:
            top = tmp.groupby(col)["_v"].sum().sort_values(ascending=False).head(3)
            top = top[top > 0]
            if not top.empty:
                partes.append(f"Mejores {etiqueta} por valor: " +
                              ", ".join(f"{k} ({v:.0f} USD)" for k, v in top.items()))
    return " | ".join(partes) if partes else "Sin valor acumulado todavía."
