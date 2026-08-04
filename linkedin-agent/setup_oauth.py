"""
One-time OAuth 2.0 setup to get your LinkedIn access token.
Run this ONCE to authorize the app and save your token.

Usage:
    python setup_oauth.py
"""

import os
import sys
import urllib.parse
import requests
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI = "https://www.linkedin.com/developers/tools/oauth/redirect"
# w_organization_social permite publicar como página de empresa.
# Requiere el producto "Community Management API" aprobado en la app
# y que el usuario que autoriza sea admin de la página.
SCOPES = "openid w_member_social w_organization_social"

AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization"
TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken"


def main():
    if not CLIENT_ID or not CLIENT_SECRET:
        print("ERROR: Definí LINKEDIN_CLIENT_ID y LINKEDIN_CLIENT_SECRET en tu .env")
        sys.exit(1)

    auth_params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
        "state": "linkedin_agent_setup",
    }
    auth_url = f"{AUTH_URL}?{urllib.parse.urlencode(auth_params)}"

    print("\n=== LinkedIn OAuth Setup ===\n")
    print("PASO 1: Copiá esta URL y pegala en tu navegador (con tu cuenta de LinkedIn):\n")
    print(auth_url)
    print("\nPASO 2: Autorizá la app cuando LinkedIn te lo pida.")
    print("\nPASO 3: LinkedIn te va a redirigir a una página de confirmación.")
    print("En la URL del navegador vas a ver algo como:")
    print("  https://www.linkedin.com/developers/...?code=CODIGO_LARGO&state=...")
    print("\nCopiá ese CODIGO_LARGO y pegalo aquí abajo:")
    print()

    auth_code = input("Pegá el código de autorización: ").strip()

    if not auth_code:
        print("ERROR: No ingresaste ningún código.")
        sys.exit(1)

    print("\nObteniendo access token...")
    response = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": auth_code,
            "redirect_uri": REDIRECT_URI,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )

    if response.status_code != 200:
        print(f"ERROR al obtener el token: {response.text}")
        sys.exit(1)

    token_data = response.json()
    access_token = token_data["access_token"]
    expires_in = token_data.get("expires_in", 0)

    print(f"\n✓ TOKEN OBTENIDO")
    print(f"  Expira en: {expires_in // 86400} días")

    # Guardar en .env
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            content = f.read()
        lines = content.splitlines()
        new_lines = []
        for line in lines:
            if line.startswith("LINKEDIN_ACCESS_TOKEN="):
                new_lines.append(f"LINKEDIN_ACCESS_TOKEN={access_token}")
            else:
                new_lines.append(line)
        with open(env_path, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines))
        print("✓ Token guardado en .env automáticamente.")
    else:
        print(f"\nGuardá este token en tu .env:")
        print(f"LINKEDIN_ACCESS_TOKEN={access_token}")


if __name__ == "__main__":
    main()
