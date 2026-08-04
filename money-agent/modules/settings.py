"""
Carga de configuración, variables de entorno, logging y constantes.
Define la estructura de LA CUENTA (ledger): las columnas y los estados del ciclo de vida.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import date
from pathlib import Path

# Raíz del proyecto = carpeta money-agent/ (padre de modules/)
BASE_DIR = Path(__file__).resolve().parent.parent


# ── Variables de entorno ─────────────────────────────────────────────────────

def _load_dotenv() -> None:
    """Carga .env si existe. Usa python-dotenv si está disponible; si no, parser propio."""
    env_path = BASE_DIR / ".env"
    if not env_path.exists():
        return
    try:
        from dotenv import dotenv_values  # type: ignore
        for key, value in dotenv_values(env_path).items():
            if value is not None and not os.environ.get(key):
                os.environ[key] = value
        return
    except Exception:
        pass
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        if not os.environ.get(key):
            os.environ[key] = value.strip().strip('"').strip("'")


def get_env(name: str, default: str | None = None, required: bool = False) -> str | None:
    _load_dotenv()
    value = os.environ.get(name, default)
    if isinstance(value, str):
        value = value.strip()
    if required and not value:
        raise RuntimeError(
            f"Falta la variable de entorno requerida: {name}. "
            f"Configúrala en money-agent/.env (ver .env.example)."
        )
    return value


# ── Configuración ─────────────────────────────────────────────────────────────

def load_config() -> dict:
    """Lee config.json y resuelve rutas a absolutas bajo BASE_DIR."""
    with open(BASE_DIR / "config.json", "r", encoding="utf-8") as f:
        config = json.load(f)

    rutas = config.get("rutas", {})
    for key, rel in rutas.items():
        rutas[key] = str((BASE_DIR / rel).resolve())
    config["rutas"] = rutas

    for key in ("data", "output", "logs"):
        if key in rutas:
            Path(rutas[key]).mkdir(parents=True, exist_ok=True)

    return config


# ── Logging ──────────────────────────────────────────────────────────────────

def setup_logging(logs_dir: str | Path) -> logging.Logger:
    logs_dir = Path(logs_dir)
    logs_dir.mkdir(parents=True, exist_ok=True)
    log_file = logs_dir / f"ingresos_{date.today().isoformat()}.log"

    logger = logging.getLogger("money_agent")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    fmt = logging.Formatter("%(asctime)s  %(levelname)-7s  %(message)s", datefmt="%H:%M:%S")

    fh = logging.FileHandler(log_file, encoding="utf-8")
    fh.setFormatter(fmt)
    logger.addHandler(fh)

    ch = logging.StreamHandler()
    ch.setFormatter(fmt)
    logger.addHandler(ch)

    logger.info("Log de ejecución: %s", log_file)
    return logger


# ── LA CUENTA (ledger): columnas y orden en Excel/CSV ────────────────────────
# (clave interna, encabezado humano). El ORDEN define el orden en el archivo.

COLUMNS: list[tuple[str, str]] = [
    ("id",                 "ID"),
    ("fecha_deteccion",    "Fecha detección"),
    ("nombre",             "Oportunidad"),
    ("tipo",               "Tipo"),
    ("cliente_entidad",    "Cliente / Entidad"),
    ("plataforma",         "Plataforma / Fuente"),
    ("url",                "URL"),
    ("pago_estimado_min",  "Pago estimado (min)"),
    ("pago_estimado_max",  "Pago estimado (max)"),
    ("moneda",             "Moneda"),
    ("esfuerzo_horas",     "Esfuerzo (horas)"),
    ("probabilidad",       "Probabilidad de éxito (0-1)"),
    ("valor_esperado_usd", "Valor esperado (USD)"),
    ("fecha_limite",       "Fecha límite"),
    ("encaje",             "Encaje con tu perfil (1-5)"),
    ("estado",             "Estado"),
    ("proximo_paso",       "Próximo paso"),
    ("fecha_cobro",        "Fecha de cobro"),
    ("monto_cobrado_usd",  "Monto cobrado (USD)"),
    ("notas",              "Notas"),
    ("clave_hash",         "Clave (anti-duplicado)"),
    ("fecha_ultima_revision", "Última revisión"),
]

COLUMN_KEYS: list[str] = [key for key, _ in COLUMNS]
COLUMN_HEADERS: list[str] = [header for _, header in COLUMNS]
KEY_TO_HEADER: dict[str, str] = dict(COLUMNS)

NO_ESPECIFICADO = "No especificado"

# ── Ciclo de vida de una oportunidad en la cuenta ────────────────────────────
ESTADO_DETECTADA = "detectada"     # recién encontrada por el agente
ESTADO_EN_PROGRESO = "en_progreso" # ya aplicaste / propusiste / estás trabajándola
ESTADO_GANADA = "ganada"           # te la adjudicaron, falta cobrar
ESTADO_COBRADA = "cobrada"         # dinero recibido -> suma al saldo real
ESTADO_DESCARTADA = "descartada"   # no aplica / perdida / vencida

ESTADOS = [
    ESTADO_DETECTADA, ESTADO_EN_PROGRESO, ESTADO_GANADA,
    ESTADO_COBRADA, ESTADO_DESCARTADA,
]

# Tipos de oportunidad de ingreso que el agente reconoce
TIPOS_OPORTUNIDAD = [
    "Freelance / proyecto", "Bounty / tarea pagada", "Concurso / challenge con premio",
    "Convocatoria / grant", "Empleo remoto", "Venta de producto/servicio digital",
    "Lead / cliente potencial", "Otro",
]
