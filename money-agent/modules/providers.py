"""
Proveedores intercambiables de BÚSQUEDA WEB y de IA, con fallback offline.

Búsqueda (config.json -> busqueda.proveedor): tavily | exa | brave | google_cse | serpapi | simulado
  Clave en SEARCH_API_KEY. Devuelve dicts: {title, url, content, query}.

IA (prioridad automática): Claude (ANTHROPIC_API_KEY) > Groq (GROQ_API_KEY, gratis)
   > Gemini (GEMINI_API_KEY, gratis) > offline (None).
  Expón un 'call_fn(prompt) -> str' uniforme vía get_ai_caller().
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

from .settings import get_env


# ════════════════════════════════════════════════════════════════════════════
#  BÚSQUEDA WEB
# ════════════════════════════════════════════════════════════════════════════

def _tavily(api_key, query, max_results, depth):
    from tavily import TavilyClient  # type: ignore
    client = TavilyClient(api_key=api_key)
    resp = client.search(query=query, search_depth=depth, max_results=max_results, include_answer=False)
    return [{"title": r.get("title", ""), "url": r.get("url", ""),
             "content": r.get("content", ""), "query": query} for r in resp.get("results", [])]


def _exa(api_key, query, max_results, depth):
    import requests
    resp = requests.post("https://api.exa.ai/search",
                         headers={"x-api-key": api_key, "Content-Type": "application/json"},
                         json={"query": query, "numResults": max_results, "contents": {"text": True}}, timeout=30)
    resp.raise_for_status()
    return [{"title": r.get("title", ""), "url": r.get("url", ""),
             "content": (r.get("text") or "")[:2000], "query": query} for r in resp.json().get("results", [])]


def _brave(api_key, query, max_results, depth):
    import requests
    resp = requests.get("https://api.search.brave.com/res/v1/web/search",
                        headers={"X-Subscription-Token": api_key, "Accept": "application/json"},
                        params={"q": query, "count": max_results}, timeout=30)
    resp.raise_for_status()
    return [{"title": r.get("title", ""), "url": r.get("url", ""),
             "content": r.get("description", ""), "query": query}
            for r in resp.json().get("web", {}).get("results", [])]


def _google_cse(api_key, query, max_results, depth):
    import requests
    cx = get_env("GOOGLE_CSE_ID")
    if not cx:
        raise RuntimeError("Google CSE requiere GOOGLE_CSE_ID.")
    resp = requests.get("https://www.googleapis.com/customsearch/v1",
                        params={"key": api_key, "cx": cx, "q": query, "num": min(max_results, 10)}, timeout=30)
    resp.raise_for_status()
    return [{"title": r.get("title", ""), "url": r.get("link", ""),
             "content": r.get("snippet", ""), "query": query} for r in resp.json().get("items", [])]


def _serpapi(api_key, query, max_results, depth):
    import requests
    resp = requests.get("https://serpapi.com/search.json",
                        params={"q": query, "api_key": api_key, "num": max_results, "engine": "google"}, timeout=30)
    resp.raise_for_status()
    return [{"title": r.get("title", ""), "url": r.get("link", ""),
             "content": r.get("snippet", ""), "query": query} for r in resp.json().get("organic_results", [])]


_SEARCH_FNS = {
    "tavily": _tavily, "exa": _exa, "brave": _brave,
    "google_cse": _google_cse, "serpapi": _serpapi,
}


def _simulated_results(sample_path: str, logger: logging.Logger) -> list[dict]:
    p = Path(sample_path)
    if not p.exists():
        logger.warning("No hay datos simulados en %s.", sample_path)
        return []
    data = json.loads(p.read_text(encoding="utf-8"))
    results = data.get("resultados", data) if isinstance(data, dict) else data
    for r in results:
        r.setdefault("query", "[simulado]")
    return results


def run_searches(config: dict, queries: list[str], logger: logging.Logger) -> list[dict]:
    busq = config.get("busqueda", {})
    name = busq.get("proveedor", "tavily").lower()
    max_results = int(busq.get("max_resultados_por_query", 5))
    depth = busq.get("profundidad", "advanced")

    if name == "simulado":
        logger.warning("Búsqueda = SIMULADA (offline, datos de prueba).")
        return _simulated_results(config["rutas"]["datos_simulados"], logger)

    api_key = get_env("SEARCH_API_KEY")
    if not api_key or name not in _SEARCH_FNS:
        logger.warning("Sin SEARCH_API_KEY válida para '%s' -> modo SIMULADO.", name)
        return _simulated_results(config["rutas"]["datos_simulados"], logger)

    fn = _SEARCH_FNS[name]
    logger.info("Búsqueda con proveedor '%s' — %d queries", name, len(queries))

    all_results: list[dict] = []
    for q in queries:
        try:
            res = fn(api_key, q, max_results, depth)
            all_results.extend(res)
            logger.info("  ✓ %-50s → %d", (q[:47] + "...") if len(q) > 50 else q, len(res))
        except Exception as e:  # noqa: BLE001
            logger.error("  ✗ Error en query '%s': %s", q[:50], e)

    # Deduplicar por URL
    seen, unique = set(), []
    for r in all_results:
        url = (r.get("url") or "").strip()
        if url and url not in seen:
            seen.add(url)
            unique.append(r)
    logger.info("Resultados únicos por URL: %d (de %d brutos)", len(unique), len(all_results))
    return unique


# ════════════════════════════════════════════════════════════════════════════
#  IA  (estrategia + estructuración)
# ════════════════════════════════════════════════════════════════════════════

def _call_claude(api_key, model, max_tokens, prompt):
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)
    msg = client.messages.create(model=model, max_tokens=max_tokens,
                                 messages=[{"role": "user", "content": prompt}])
    return msg.content[0].text


def _call_groq(api_key, model, max_tokens, prompt):
    import requests
    resp = requests.post("https://api.groq.com/openai/v1/chat/completions",
                         headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                         json={"model": model, "messages": [{"role": "user", "content": prompt}],
                               "max_tokens": min(max_tokens, 8000), "temperature": 0.2}, timeout=120)
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]


def _call_gemini(api_key, model, max_tokens, prompt):
    import requests
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/{model}"
           f":generateContent?key={api_key}")
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"maxOutputTokens": min(max_tokens, 8192), "temperature": 0.2}}
    resp = requests.post(url, json=body, timeout=120)
    resp.raise_for_status()
    return resp.json()["candidates"][0]["content"]["parts"][0]["text"]


def get_ai_caller(config: dict, logger: logging.Logger, force_offline: bool = False):
    """Devuelve (call_fn, nombre_proveedor) o (None, 'offline') si no hay claves.

    call_fn(prompt: str) -> str  (uniforme para Claude/Groq/Gemini)
    """
    if force_offline:
        return None, "offline"

    modelo = config.get("modelo", {})
    max_tokens = int(modelo.get("max_tokens", 8192))

    anthropic_key = get_env("ANTHROPIC_API_KEY")
    groq_key = get_env("GROQ_API_KEY")
    gemini_key = get_env("GEMINI_API_KEY")

    if anthropic_key:
        m = modelo.get("estructuracion", "claude-sonnet-4-5")
        logger.info("Proveedor IA: Claude (%s)", m)
        return (lambda p: _call_claude(anthropic_key, m, max_tokens, p)), "claude"
    if groq_key:
        m = modelo.get("modelo_groq", "llama-3.3-70b-versatile")
        logger.info("Proveedor IA: Groq (%s) — gratis", m)
        return (lambda p: _call_groq(groq_key, m, max_tokens, p)), "groq"
    if gemini_key:
        m = modelo.get("modelo_gemini", "gemini-2.0-flash")
        logger.info("Proveedor IA: Gemini (%s) — gratis", m)
        return (lambda p: _call_gemini(gemini_key, m, max_tokens, p)), "gemini"

    logger.warning("Sin claves de IA (Claude/Groq/Gemini) -> modo OFFLINE.")
    return None, "offline"
