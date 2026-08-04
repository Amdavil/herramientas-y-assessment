"""Verifica el token de LinkedIn y obtiene el ID del miembro."""
import os
import requests
from dotenv import load_dotenv

load_dotenv()

token = os.getenv("LINKEDIN_ACCESS_TOKEN", "")
if not token:
    print("ERROR: No hay LINKEDIN_ACCESS_TOKEN en el .env")
    exit(1)

headers = {
    "Authorization": f"Bearer {token}",
    "X-Restli-Protocol-Version": "2.0.0",
}

print("Verificando token...\n")

for endpoint in ["/v2/me", "/v2/userinfo", "/v2/introspectToken"]:
    try:
        if endpoint == "/v2/introspectToken":
            resp = requests.post(
                f"https://api.linkedin.com{endpoint}",
                headers={"Authorization": f"Bearer {token}"},
                data={"token": token},
                timeout=10,
            )
        else:
            resp = requests.get(
                f"https://api.linkedin.com{endpoint}",
                headers=headers,
                timeout=10,
            )
        print(f"{endpoint} → {resp.status_code}: {resp.text[:300]}")
    except Exception as e:
        print(f"{endpoint} → ERROR: {e}")
    print()
