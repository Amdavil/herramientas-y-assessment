# LinkedIn Daily Post Agent — Guía de Setup

## Paso 1: Crear la app en LinkedIn Developer

1. Ir a **https://www.linkedin.com/developers/apps** e iniciar sesión con tu cuenta personal
2. Clic en **"Create app"**
3. Completar:
   - **App name**: `LinkedIn Post Agent` (o el nombre que quieras)
   - **LinkedIn Page**: seleccioná la página de empresa que querés usar
   - **App logo**: subí cualquier imagen (requerida)
   - Aceptar los términos y crear la app
4. Ir a la pestaña **"Auth"** y anotar:
   - `Client ID`
   - `Client Secret` (clic en el ojo para verlo)
5. En **"OAuth 2.0 settings"** → Authorized redirect URLs, agregar:
   ```
   http://localhost:8765/callback
   ```
6. Ir a la pestaña **"Products"** y solicitar acceso a:
   - **"Share on LinkedIn"** → clic en "Request access"
   - **"Marketing Developer Platform"** → clic en "Request access"
   > ⚠️ El acceso a Marketing Developer Platform puede tomar 1-3 días hábiles en aprobarse.
   > Para publicar en páginas de empresa necesitás este producto aprobado.

## Paso 2: Configurar el entorno local

```bash
# Clonar o abrir la carpeta del proyecto
cd linkedin-agent

# Crear entorno virtual FUERA de OneDrive
# (OneDrive deshidrata archivos del venv y rompe los imports de Python)
python -m venv "%USERPROFILE%\.venvs\linkedin-agent"
"%USERPROFILE%\.venvs\linkedin-agent\Scripts\activate"   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Crear tu archivo .env desde el template
copy .env.example .env
```

Editá `.env` con tus datos:
```env
GROQ_API_KEY=gsk_...
LINKEDIN_CLIENT_ID=tu_client_id
LINKEDIN_CLIENT_SECRET=tu_client_secret
LINKEDIN_ORG_ID=id_numerico_de_tu_pagina
COMPANY_NAME=Nombre de tu empresa
INDUSTRY_CONTEXT=Descripción breve del rubro y mercado
```

**¿Cómo encontrar tu LINKEDIN_ORG_ID?**
Ir a tu página de empresa en LinkedIn → Admin → la URL tiene el formato:
`https://www.linkedin.com/company/ESTE-NUMERO/admin/`

## Paso 3: Autorizar la app (una sola vez)

```bash
python setup_oauth.py
```

Se abrirá el navegador, autorizás la app con tu cuenta de LinkedIn y el script
guardará el token automáticamente en tu `.env`.

> El token de LinkedIn dura **60 días**. Cuando expire, volvé a correr este script.

## Paso 4: Probar el agente manualmente

```bash
python agent.py
```

Deberías ver en la consola el post generado y la confirmación de publicación.

## Paso 5: Configurar el schedule diario (Windows Task Scheduler)

Abrí PowerShell **como administrador** y ejecutá:

```powershell
cd "C:\Users\User\OneDrive\Documentos\Claude-Practica\linkedin-agent"
.\setup_scheduler.ps1
```

Esto crea una tarea que corre **de lunes a viernes a las 9:00 AM** automáticamente.

**Comandos útiles:**
```powershell
# Probar manualmente ahora mismo
Start-ScheduledTask -TaskName "LinkedInDailyPostAgent"

# Ver logs en tiempo real
Get-Content "logs\agent.log" -Tail 50

# Ver estado de la tarea
Get-ScheduledTask -TaskName "LinkedInDailyPostAgent"

# Eliminar la tarea
Unregister-ScheduledTask -TaskName "LinkedInDailyPostAgent" -Confirm:$false
```

---

## Personalización de temas

Editá `topics.py` para agregar, quitar o modificar temas y ángulos.
Cada tema tiene:
- `area`: el área temática general
- `angle`: el ángulo específico del post
- `cta`: la pregunta de cierre sugerida

Los temas rotan por día del año, así nunca se repite el mismo tema dos días seguidos.

## Personalización del tono

Editá el `SYSTEM_PROMPT` en `generate_post.py` para ajustar la voz de tu marca.
