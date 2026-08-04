"""Parseo robusto del JSON que devuelve la IA (puede venir con ```fences``` o ruido)."""

from __future__ import annotations

import json
import re


def strip_fences(raw: str) -> str:
    s = raw.strip()
    if s.startswith("```"):
        s = re.sub(r"^```[a-zA-Z]*\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    return s


def parse_json_loose(raw: str, default: dict | None = None) -> dict:
    """Extrae el primer objeto JSON {...} de un texto, tolerando envoltorios."""
    text = strip_fences(raw)
    match = re.search(r"\{[\s\S]*\}", text)
    candidate = match.group() if match else text
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        return default if default is not None else {}
