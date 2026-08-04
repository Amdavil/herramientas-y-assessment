"""Publish a text post to LinkedIn personal profile via ugcPosts API.

Uses the OpenID Connect `sub` as the author identifier, which is the
correct identifier for LinkedIn's modern API (not the legacy member ID).
"""

import os
import re
import requests

LINKEDIN_API_BASE = "https://api.linkedin.com/v2"


def _headers(access_token: str) -> dict:
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
    }


def clean_text(text: str) -> str:
    """Remove Markdown formatting that LinkedIn doesn't support."""
    text = re.sub(r'\*\*(.*?)\*\*', r'\1', text)
    text = re.sub(r'\*(.*?)\*', r'\1', text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1 (\2)', text)
    return text.strip()


def get_author_urn(access_token: str) -> str:
    """Get the author URN using the OpenID Connect `sub` value."""
    response = requests.get(
        f"{LINKEDIN_API_BASE}/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
        timeout=30,
    )
    if response.status_code != 200:
        raise requests.HTTPError(
            f"No se pudo obtener el perfil (status {response.status_code}): {response.text}\n"
            "Verificá que el token tenga el scope 'openid'."
        )
    sub = response.json().get("sub")
    if not sub:
        raise ValueError("La respuesta de userinfo no contiene 'sub'.")
    return f"urn:li:person:{sub}"


def _utf16_len(s: str) -> int:
    """Length in UTF-16 code units (LinkedIn counts offsets in UTF-16, e.g. emojis = 2)."""
    return len(s.encode("utf-16-le")) // 2


def build_annotations(text: str, org_id: str) -> list:
    """Find every mention of 'Projectability' in text and return LinkedIn annotations.

    Each annotation links the word to the company page URN so LinkedIn renders
    it as a clickable mention (@Projectability). Matches are case-insensitive
    and skip the occurrence inside the URL www.projectability.net. Offsets are
    computed in UTF-16 code units as LinkedIn requires.
    """
    annotations = []
    org_urn = f"urn:li:organization:{org_id}"
    for match in re.finditer(r"Projectability(?!\.net)", text, re.IGNORECASE):
        annotations.append({
            "entity": org_urn,
            "start": _utf16_len(text[:match.start()]),
            "length": _utf16_len(match.group(0)),
        })
    return annotations


def publish_post(text: str, access_token: str = "", org_id: str = "") -> dict:
    """Publish a text post to LinkedIn.

    Si LINKEDIN_POST_AS=organization, publica como la página de empresa
    (requiere token con scope w_organization_social y ser admin de la página).
    Si no, publica en el perfil personal.
    """
    token = access_token or os.getenv("LINKEDIN_ACCESS_TOKEN", "")
    resolved_org_id = org_id or os.getenv("LINKEDIN_ORG_ID", "")
    clean = clean_text(text)

    post_as = os.getenv("LINKEDIN_POST_AS", "member").strip().lower()
    if post_as == "organization":
        if not resolved_org_id:
            raise EnvironmentError(
                "LINKEDIN_POST_AS=organization pero falta LINKEDIN_ORG_ID en el .env"
            )
        author_urn = f"urn:li:organization:{resolved_org_id}"
    else:
        author_urn = get_author_urn(token)

    commentary: dict = {"text": clean}
    if resolved_org_id:
        annotations = build_annotations(clean, resolved_org_id)
        if annotations:
            commentary["annotations"] = annotations

    payload = {
        "author": author_urn,
        "lifecycleState": "PUBLISHED",
        "specificContent": {
            "com.linkedin.ugc.ShareContent": {
                "shareCommentary": commentary,
                "shareMediaCategory": "NONE",
            }
        },
        "visibility": {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
        },
    }

    response = requests.post(
        f"{LINKEDIN_API_BASE}/ugcPosts",
        headers=_headers(token),
        json=payload,
        timeout=30,
    )

    if not response.ok:
        raise requests.HTTPError(
            f"Error {response.status_code}: {response.text}",
            response=response
        )

    post_id = response.json().get("id", "unknown")
    return {
        "status": "published",
        "post_id": post_id,
        "http_status": response.status_code
    }
