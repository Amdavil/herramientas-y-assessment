"""
LinkedIn Daily Post Agent
Entry point for the scheduled daily execution.
"""

import os
import sys
import logging
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

from generate_post import generate_post
from post_to_linkedin import publish_post
from topics import get_today_topic

# Cargar variables de entorno siempre desde el .env junto a este archivo,
# sin importar desde qué directorio se llame al agente.
_env_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def load_config() -> dict:
    """Load required config from environment variables."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "Falta GROQ_API_KEY en el archivo .env\n"
            "Revisá que esté configurado correctamente."
        )
    return {
        "company_name": os.getenv("COMPANY_NAME", ""),
        "industry_context": os.getenv("INDUSTRY_CONTEXT", ""),
    }


def run():
    log.info("=== LinkedIn Post Agent iniciando ===")
    log.info(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

    topic = get_today_topic()
    log.info(f"Tema del día: {topic['area']} — {topic['angle'][:60]}...")

    config = load_config()

    log.info("Generando post con Claude...")
    post_text = generate_post(
        company_name=config["company_name"],
        industry_context=config["industry_context"],
    )

    log.info("Post generado:")
    log.info("-" * 60)
    log.info(post_text)
    log.info("-" * 60)
    log.info(f"Longitud: {len(post_text.split())} palabras")

    log.info("Publicando en LinkedIn...")
    result = publish_post(text=post_text)

    log.info(f"Post publicado exitosamente. ID: {result['post_id']}")
    log.info("=== Agente finalizado ===")
    return result


if __name__ == "__main__":
    run()
