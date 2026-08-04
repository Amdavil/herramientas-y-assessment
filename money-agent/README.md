# 💰 Agente de Ingresos Nocturno

Un agente autónomo que **cada noche se auto-promptea**, busca **oportunidades reales de dinero**
afines a tu perfil, las **valora en dinero esperado** y las acumula en **una cuenta** (un Excel/ledger)
que sigue cada oportunidad desde *detectada* hasta *cobrada*. En la mañana te deja un **plan de acción**.

---

## ⚠️ Lo primero: la verdad sobre "doblar dinero todos los días"

No es posible. Es aritmética, no pesimismo. Con $100 doblando a diario:

| Día | Dinero |
|----:|-------:|
| 1 | $100 |
| 10 | $51.200 |
| 20 | $52 millones |
| 30 | $53 mil millones |
| 40 | más que toda la economía mundial |

Por eso **ningún programa fabrica ni deposita dinero solo**. Lo que promete eso es una estafa.
Lo que este agente **sí** hace es quitarte el trabajo aburrido (buscar, filtrar, priorizar, organizar)
para que tú conviertas oportunidades en ingresos reales, y llevar la cuenta de tu progreso.

### Qué hace y qué NO hace

| ✅ Sí hace | ❌ No hace |
|-----------|-----------|
| Genera su propia estrategia de búsqueda cada noche | Acceder a tu banco / mover dinero |
| Encuentra freelance, bounties, grants, concursos, empleos remotos | Garantizar ingresos |
| Estima pago, esfuerzo y probabilidad → **dinero esperado** | "Doblar" tu dinero |
| Lleva una cuenta con saldo real, pipeline y meta | Cobrar por ti (el cierre lo haces tú) |
| Aprende: prioriza lo que te ha dado más valor | Inventar oportunidades (regla anti-invención) |

> El dinero entra a "la cuenta" cuando avanzas una oportunidad a **ganada** y luego **cobrada**
> en `data/cuenta_ingresos.xlsx`. Ver más abajo cómo automatizar incluso ese paso con Stripe/Gumroad.

---

## 🚀 Pruébalo en 30 segundos (sin claves, modo simulado)

```powershell
cd money-agent
pip install -r requirements.txt
python money_agent.py --simulate
```

Genera `output/plan_ingresos_AAAA-MM-DD.md` y `data/cuenta_ingresos.xlsx` con datos de prueba.
Ábrelos y mira el flujo completo.

## 🔌 Corrida real

1. Copia `.env.example` a `.env` y pon **al menos una** clave (todas tienen capa gratis):
   - `SEARCH_API_KEY` → [Tavily](https://app.tavily.com) (búsqueda)
   - `GROQ_API_KEY` → [Groq](https://console.groq.com) (IA gratis) **o** `GEMINI_API_KEY` → [Google AI Studio](https://aistudio.google.com/apikey) **o** `ANTHROPIC_API_KEY` (Claude)
2. **Edita `config.json` → `perfil`** con la verdad sobre ti (habilidades, plataformas, tarifa, mercados).
   Cuanto mejor el perfil, mejores las oportunidades.
3. Define tu meta realista en `config.json → meta.objetivo_mensual_usd`.
4. Corre:

```powershell
python money_agent.py
```

---

## 🌙 Automatizarlo "todas las noches"

### Opción A — Windows (Task Scheduler), tu PC
```powershell
# Crea una tarea que corre cada día a las 2:00 AM
$accion  = New-ScheduledTaskAction -Execute "python" -Argument "money_agent.py" -WorkingDirectory "C:\Users\danie\OneDrive\Documentos\Claude-Practica\money-agent"
$disparo = New-ScheduledTaskTrigger -Daily -At 2:00AM
Register-ScheduledTask -TaskName "AgenteIngresos" -Action $accion -Trigger $disparo -Description "Agente de Ingresos Nocturno"
```
(Tu PC debe estar encendida a esa hora.)

### Opción B — GitHub Actions (corre en la nube, gratis)
Crea `.github/workflows/nightly.yml`:
```yaml
name: Agente de Ingresos Nocturno
on:
  schedule:
    - cron: "0 7 * * *"   # 07:00 UTC = 02:00 Colombia
  workflow_dispatch: {}
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install -r money-agent/requirements.txt
      - run: python money_agent.py
        working-directory: money-agent
        env:
          SEARCH_API_KEY: ${{ secrets.SEARCH_API_KEY }}
          GROQ_API_KEY:   ${{ secrets.GROQ_API_KEY }}
          GMAIL_SENDER_EMAIL: ${{ secrets.GMAIL_SENDER_EMAIL }}
          GMAIL_APP_PASSWORD: ${{ secrets.GMAIL_APP_PASSWORD }}
          ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}
      - uses: actions/upload-artifact@v4
        with: { name: plan-y-cuenta, path: "money-agent/output/*\nmoney-agent/data/*" }
```
Pon las claves en *Settings → Secrets and variables → Actions*. Activa `correo.enviar_resumen: true`
en `config.json` para recibir el plan por email cada mañana.

---

## 🏦 Cómo hacer que el dinero llegue (cada vez más) solo

El agente encuentra y organiza; el ingreso se vuelve "automático" cuando enchufas una **fuente real**:

- **Producto/servicio digital** (tu generador de CV, plantillas, una mini-herramienta) en **Gumroad/Stripe/Lemon Squeezy**:
  el cliente paga y el dinero cae en tu cuenta de pagos. Una mejora futura puede leer la API de Stripe
  y registrar cada venta como fila *cobrada* en el ledger → así "se deposita en la cuenta" de verdad y solo.
- **Plataformas freelance con API** (Upwork/Workana): el agente prioriza y te prepara la propuesta; tú aplicas.
- **Grants/concursos**: el agente arma el pipeline y los plazos; tú presentas.

El primer paso siempre eres tú cerrando; cada fuente que automatices reduce ese paso.

---

## 🧠 Cómo se "auto-promptea" (lo que pediste)

`modules/strategy.py` arma un **meta-prompt** con tu perfil + el historial de noches anteriores
(`data/historial_estrategia.json`) + qué tipos/plataformas te han dado más valor en la cuenta, y la IA
**genera las búsquedas de esta noche** (parte explotación de lo que funciona, parte exploración de nichos
nuevos). Cada noche guarda su estrategia, así **mañana aprende de hoy**. Sin IA, usa una estrategia base
derivada de tu perfil.

## 📁 Estructura

```
money-agent/
├─ money_agent.py          # orquestador (6 pasos)
├─ config.json             # tu perfil, meta y ajustes
├─ .env.example            # claves (cópialo a .env)
├─ modules/
│  ├─ strategy.py          # ★ auto-prompting nocturno
│  ├─ providers.py         # búsqueda (Tavily/Exa/...) + IA (Claude/Groq/Gemini)
│  ├─ pipeline.py          # estructura oportunidades + valora en dinero esperado
│  ├─ ledger.py            # ★ la cuenta: saldos, pipeline, meta, anti-duplicados
│  ├─ report.py            # plan de acción (MD) + correo opcional
│  └─ settings.py          # config, .env, logging, columnas de la cuenta
├─ data/                   # cuenta_ingresos.xlsx/csv + historial_estrategia.json
├─ output/                 # plan_ingresos_AAAA-MM-DD.md
└─ tests/                  # datos de prueba (modo --simulate)
```

## ❓ Preguntas frecuentes

**¿Por qué no opera mi dinero solo?** Porque un bot autónomo moviendo dinero real sin supervisión es
la forma más rápida de perderlo todo, y además sería peligroso e irresponsable. Este agente trabaja
*antes* del dinero: te consigue y organiza las oportunidades.

**¿Y el trading automático?** Lo de "doblar a diario" con trading no existe (ver tabla arriba). Si te
interesa el trading, lo correcto es aprender con **backtesting y paper-trading** (dinero ficticio) primero.
Eso puede ser otro proyecto, honesto y sin promesas falsas.
