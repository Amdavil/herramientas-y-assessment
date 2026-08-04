"""Generate a LinkedIn post using Groq API (free tier)."""

import os
import re
from openai import OpenAI
from topics import get_today_topic


SYSTEM_PROMPT = """Sos un experto en comunicación corporativa y estrategia de contenido B2B.
Escribís posts de LinkedIn para Projectability (www.projectability.net), empresa de consultoría
y servicios profesionales en Argentina y Latinoamérica.

Tu estilo:
- Tono profesional pero cercano, sin ser formal al punto de sonar frío
- Abrís con una afirmación o pregunta que detiene el scroll (hook poderoso, máx 2 líneas)
- Desarrollás la idea con claridad: datos, ejemplos reales o tendencias verificables
- Usás párrafos cortos (máx 3-4 líneas) para facilitar lectura en mobile
- Mencionás "Projectability" (con esa escritura exacta) de forma natural en el cuerpo del post (no al final como aviso)
- Cerrás siempre con una pregunta que invita a la conversación (CTA natural)
- SIEMPRE incluís una invitación a visitar www.projectability.net al final, antes de los hashtags (ej: "Conocé más en www.projectability.net")
- Usás emojis de forma estratégica: 1-2 máximo, solo si suman al mensaje
- No usás hashtags genéricos ni listas largas de hashtags al final
- Longitud óptima: 150-250 palabras

Nunca:
- Clichés vacíos ("En el mundo actual...", "En un mundo VUCA...")
- Exceso de mayúsculas o signos de exclamación
- Promesas exageradas o lenguaje de ventas directo
- Más de 5 hashtags, y solo los más relevantes al final"""


def _split_trailing_hashtags(text: str) -> tuple[str, str]:
    """Separa el bloque final de hashtags del cuerpo del post."""
    lines = text.rstrip().split("\n")
    idx = len(lines)
    while idx > 0 and (not lines[idx - 1].strip() or lines[idx - 1].strip().startswith("#")):
        idx -= 1
    body = "\n".join(lines[:idx]).rstrip()
    tags = "\n".join(lines[idx:]).strip()
    return body, tags


def ensure_branding(text: str) -> str:
    """Garantiza que el post siempre mencione a Projectability (para el tag)
    e invite a visitar www.projectability.net."""
    # Normalizar typos o variantes de mayúsculas del nombre (sin tocar la URL).
    # *+ (posesivo) evita que el backtracking haga match parcial dentro de la URL.
    text = re.sub(r"\bProjectabil\w*+(?!\.net)", "Projectability", text, flags=re.IGNORECASE)

    body, tags = _split_trailing_hashtags(text)
    additions = []
    if not re.search(r"Projectability(?!\.net)", body):
        additions.append("En Projectability acompañamos a las organizaciones en este camino.")
    if "projectability.net" not in body.lower():
        additions.append("Conocé más en www.projectability.net")
    if additions:
        body += "\n\n" + " ".join(additions)
    return f"{body}\n\n{tags}".strip() if tags else body


def generate_post(company_name: str = "", industry_context: str = "") -> str:
    """Call Groq to generate today's LinkedIn post."""
    topic = get_today_topic()

    context_block = ""
    if company_name:
        context_block += f"La empresa se llama {company_name}. "
    if industry_context:
        context_block += f"Contexto de industria: {industry_context}. "

    user_prompt = f"""Escribí un post de LinkedIn sobre {topic['area']}.

Ángulo específico: {topic['angle']}.

Pregunta de cierre sugerida: {topic['cta']}

{context_block}

Entregá solo el texto del post, listo para copiar y publicar. Sin explicaciones adicionales."""

    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY"),
    )

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=600,
    )

    return ensure_branding(response.choices[0].message.content.strip())
