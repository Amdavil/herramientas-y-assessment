"""
Catálogo rotativo de temas para los posts diarios de LinkedIn.

El tema del día se elige de forma determinista por día del año. Cada área
temática tiene varios enfoques, y el enfoque avanza más lento que el área:
así la misma área vuelve con un ángulo, una pregunta y una fuente distintos
en cada vuelta del ciclo, en vez de repetir el mismo post cada dos semanas.
"""

from datetime import date

BASE_URL = "https://amdavil.github.io/herramientas-y-assessment"

# Página de empresa en LinkedIn. Va en el primer comentario, no en el cuerpo:
# en el cuerpo la empresa ya aparece mencionada (y etiquetada) en la firma.
LINKEDIN_EMPRESA = "https://www.linkedin.com/company/projectability_sustainability/"

# Catálogo de herramientas al que puede apuntar un post.
# `gancho` es la frase que se agrega al final del post: describe lo que la
# persona obtiene gratis, no lo que cuesta — el paywall aparece después, ya
# dentro de la herramienta.
HERRAMIENTAS = {
    "circularidad": {
        "nombre": "Diagnóstico de Circularidad",
        "archivo": "diagnostico-circularidad.html",
        "gancho": "Si querés ver dónde está perdiendo valor tu empresa, nuestro diagnóstico de circularidad te da el mapa en 10 minutos, gratis",
    },
    "gei": {
        "nombre": "Radar de Carbono",
        "archivo": "inventario-gei-express.html",
        "gancho": "Podés ubicar y medir las emisiones de tu organización (alcances 1, 2 y 3) con nuestro Radar de Carbono",
    },
    "gri": {
        "nombre": "Reporte GRI Exprés",
        "archivo": "reporte-gri-express.html",
        "gancho": "Si te toca armar el primer reporte de sostenibilidad, PAL te guía paso a paso con referencia a los Estándares GRI",
    },
    "materialidad": {
        "nombre": "Estudio de Materialidad Exprés",
        "archivo": "estudio-materialidad-express.html",
        "gancho": "Podés construir tu matriz de materialidad y ver qué asuntos son realmente críticos para tu organización",
    },
    "adn": {
        "nombre": "Test ADN Sostenible",
        "archivo": "adn-sostenible.html",
        "gancho": "¿Querés saber qué perfil de sostenibilidad tiene tu organización? El test ADN Sostenible te lo dice en 3 minutos",
    },
    "assessment": {
        "nombre": "Assessment ESG + IA",
        "archivo": "assessment_sostenibilidad_ia.html",
        "gancho": "Podés medir la madurez de tu organización en sostenibilidad e IA con nuestro assessment gratuito",
    },
}

# Fuentes institucionales reales. El modelo NO puede inventar datos ni citar
# estudios que no estén acá: sólo puede apoyarse en la institución y el marco
# que le pasamos, y nombrarlos en el texto. La URL nunca va en el cuerpo del
# post (LinkedIn castiga el alcance de los enlaces salientes) — el agente la
# publica como primer comentario.
#
# Todas las URLs fueron verificadas. Si alguna deja de responder, el post
# igual se publica: simplemente sale sin comentario de fuente.
FUENTES = {
    "gri": {
        "institucion": "Global Reporting Initiative (GRI)",
        "referencia": "los Estándares GRI de reporte de sostenibilidad",
        "url": "https://www.globalreporting.org/standards/",
    },
    "ghg_protocol": {
        "institucion": "GHG Protocol",
        "referencia": "el Corporate Standard, la metodología estándar para medir emisiones corporativas",
        "url": "https://ghgprotocol.org/corporate-standard",
    },
    "sbti": {
        "institucion": "Science Based Targets initiative (SBTi)",
        "referencia": "su marco de metas de reducción alineadas con la ciencia climática",
        "url": "https://sciencebasedtargets.org/how-it-works",
    },
    "cdp": {
        "institucion": "CDP",
        "referencia": "su sistema global de divulgación ambiental corporativa",
        "url": "https://www.cdp.net/en/companies",
    },
    "ellen_macarthur": {
        "institucion": "Ellen MacArthur Foundation",
        "referencia": "su trabajo sobre los principios de la economía circular",
        "url": "https://www.ellenmacarthurfoundation.org/topics/circular-economy-introduction/overview",
    },
    "circularity_gap": {
        "institucion": "Circle Economy",
        "referencia": "el Circularity Gap Report, que mide qué porcentaje de la economía mundial es circular",
        "url": "https://www.circularity-gap.world/",
    },
    "pri": {
        "institucion": "Principles for Responsible Investment (PRI)",
        "referencia": "los principios de inversión responsable que siguen los grandes fondos institucionales",
        "url": "https://www.unpri.org/about-us/about-the-pri",
    },
    "aie": {
        "institucion": "Agencia Internacional de Energía (AIE)",
        "referencia": "su World Energy Outlook",
        "url": "https://www.iea.org/reports/world-energy-outlook-2025",
    },
    "ipcc": {
        "institucion": "IPCC",
        "referencia": "su Sexto Informe de Evaluación",
        "url": "https://www.ipcc.ch/report/ar6/syr/",
    },
    "stanford_ai": {
        "institucion": "Stanford HAI",
        "referencia": "el AI Index, su informe anual sobre el estado de la inteligencia artificial",
        "url": "https://hai.stanford.edu/ai-index",
    },
    "ocde_ia": {
        "institucion": "OCDE",
        "referencia": "su trabajo sobre políticas de inteligencia artificial",
        "url": "https://www.oecd.org/en/topics/artificial-intelligence.html",
    },
    "ocde_digital": {
        "institucion": "OCDE",
        "referencia": "su trabajo sobre transformación digital de las economías",
        "url": "https://www.oecd.org/en/topics/digital-transformation.html",
    },
    "oit": {
        "institucion": "Organización Internacional del Trabajo (OIT)",
        "referencia": "su informe World Employment and Social Outlook",
        "url": "https://www.ilo.org/publications/flagship-reports/world-employment-and-social-outlook-trends-2025",
    },
    "banco_mundial": {
        "institucion": "Banco Mundial",
        "referencia": "su informe Global Economic Prospects",
        "url": "https://www.worldbank.org/en/publication/global-economic-prospects",
    },
    "imd": {
        "institucion": "IMD World Competitiveness Center",
        "referencia": "su ranking anual de competitividad mundial",
        "url": "https://www.imd.org/centers/wcc/world-competitiveness-center/rankings/world-competitiveness-ranking/",
    },
    "wipo": {
        "institucion": "OMPI",
        "referencia": "el Global Innovation Index",
        "url": "https://www.wipo.int/global_innovation_index/en/",
    },
    "gallup": {
        "institucion": "Gallup",
        "referencia": "su estudio State of the Global Workplace",
        "url": "https://www.gallup.com/workplace/349484/state-of-the-global-workplace.aspx",
    },
}

# Cada área tiene varios enfoques. Un enfoque = ángulo + pregunta de cierre +
# fuente en la que apoyarse. Agregar enfoques es la forma de que el agente
# tarde más en repetirse: 14 áreas x 3 enfoques = 42 combinaciones.
TEMAS = [
    {
        "area": "Inteligencia Artificial",
        "herramienta": "assessment",
        "enfoques": [
            {
                "angle": "cómo las empresas líderes están integrando IA generativa en sus operaciones cotidianas",
                "cta": "¿Tu empresa ya está explorando estas herramientas?",
                "fuente": "stanford_ai",
            },
            {
                "angle": "la brecha entre las empresas que experimentan con IA y las pocas que ya la tienen en procesos críticos",
                "cta": "¿En tu organización la IA ya salió de la fase piloto?",
                "fuente": "ocde_ia",
            },
            {
                "angle": "por qué el cuello de botella de la IA en las empresas casi nunca es la tecnología, sino los datos y el gobierno de esos datos",
                "cta": "¿Qué fue lo que más los frenó al implementar IA?",
                "fuente": "stanford_ai",
            },
        ],
    },
    {
        "area": "Sostenibilidad Corporativa",
        "herramienta": "materialidad",
        "enfoques": [
            {
                "angle": "por qué las empresas que integran ESG en su estrategia core superan a sus competidores a largo plazo",
                "cta": "¿Cómo está posicionando tu organización el pilar de sostenibilidad?",
                "fuente": "gri",
            },
            {
                "angle": "la diferencia entre reportar sostenibilidad y gestionarla, y por qué muchas empresas se quedan en lo primero",
                "cta": "¿Tu reporte de sostenibilidad cambia decisiones o sólo las documenta?",
                "fuente": "gri",
            },
            {
                "angle": "cómo la doble materialidad cambió la pregunta de fondo: ya no es sólo cómo el mundo afecta a la empresa, sino cómo la empresa afecta al mundo",
                "cta": "¿Ya hicieron el ejercicio de materialidad con esa doble mirada?",
                "fuente": "cdp",
            },
        ],
    },
    {
        "area": "Competitividad Empresarial",
        "herramienta": "assessment",
        "enfoques": [
            {
                "angle": "los factores que diferencian a las organizaciones más competitivas del mercado actual",
                "cta": "¿Cuál es el mayor diferenciador competitivo de tu industria hoy?",
                "fuente": "imd",
            },
            {
                "angle": "por qué la competitividad de un país y la de sus empresas están más atadas de lo que solemos admitir",
                "cta": "¿Qué condición del entorno te limita más como empresa?",
                "fuente": "imd",
            },
            {
                "angle": "cómo la eficiencia operativa dejó de ser un diferenciador para convertirse en el piso mínimo de la competencia",
                "cta": "¿Dónde está hoy tu verdadera ventaja?",
                "fuente": "banco_mundial",
            },
        ],
    },
    {
        "area": "Equipos de Alto Rendimiento",
        "herramienta": "adn",
        "enfoques": [
            {
                "angle": "las prácticas de gestión que construyen equipos resilientes en entornos de incertidumbre",
                "cta": "¿Qué práctica ha transformado más a tu equipo?",
                "fuente": "gallup",
            },
            {
                "angle": "el costo silencioso de la desconexión laboral y cómo se ve en los números de una empresa",
                "cta": "¿Cómo miden el compromiso real de su gente?",
                "fuente": "gallup",
            },
            {
                "angle": "por qué el mando medio es el punto donde una estrategia se ejecuta o se muere, y lo poco que solemos apoyarlo",
                "cta": "¿Qué tanto acompañan a sus líderes intermedios?",
                "fuente": "gallup",
            },
        ],
    },
    {
        "area": "Tendencias Económicas",
        "herramienta": "adn",
        "enfoques": [
            {
                "angle": "las fuerzas macroeconómicas que están redefiniendo los modelos de negocio",
                "cta": "¿Cómo está adaptando tu empresa su estrategia ante este contexto?",
                "fuente": "banco_mundial",
            },
            {
                "angle": "qué significa para una empresa de América Latina planificar en un contexto de crecimiento global lento",
                "cta": "¿Están planificando a un año o a tres?",
                "fuente": "banco_mundial",
            },
            {
                "angle": "cómo la transición energética está reordenando costos y cadenas de suministro completas",
                "cta": "¿Ya calcularon qué les cuesta la energía en su estructura?",
                "fuente": "aie",
            },
        ],
    },
    {
        "area": "Transformación Digital",
        "herramienta": "assessment",
        "enfoques": [
            {
                "angle": "por qué la adopción tecnológica ya no es una ventaja competitiva sino una condición de supervivencia",
                "cta": "¿En qué etapa de transformación digital se encuentra tu organización?",
                "fuente": "ocde_digital",
            },
            {
                "angle": "por qué digitalizar un proceso mal diseñado sólo consigue que sus fallas ocurran más rápido, y qué habría que revisar antes",
                "cta": "¿Rediseñaron el proceso antes de digitalizarlo?",
                "fuente": "ocde_digital",
            },
            {
                "angle": "la brecha digital entre grandes empresas y pymes, y por qué es un problema de toda la cadena de valor",
                "cta": "¿Qué tan digitalizados están sus proveedores?",
                "fuente": "ocde_digital",
            },
        ],
    },
    {
        "area": "Economía Circular",
        "herramienta": "circularidad",
        "enfoques": [
            {
                "angle": "cómo las empresas que adoptan modelos circulares reducen costos y abren mercados al mismo tiempo",
                "cta": "¿Tu empresa ha explorado la economía circular como palanca de crecimiento?",
                "fuente": "ellen_macarthur",
            },
            {
                "angle": "qué tan poco circular sigue siendo la economía mundial y qué oportunidad deja eso abierta",
                "cta": "¿Qué material desperdician hoy que podría volver al ciclo?",
                "fuente": "circularity_gap",
            },
            {
                "angle": "por qué la circularidad empieza en el diseño del producto y no en la gestión del residuo",
                "cta": "¿En qué momento del diseño entra la pregunta por el fin de vida?",
                "fuente": "ellen_macarthur",
            },
        ],
    },
    {
        "area": "Liderazgo Moderno",
        "herramienta": "adn",
        "enfoques": [
            {
                "angle": "las competencias que distinguen a los líderes que generan impacto real en organizaciones complejas",
                "cta": "¿Qué competencia de liderazgo considerás más crítica hoy?",
                "fuente": "gallup",
            },
            {
                "angle": "por qué liderar la transición sostenible exige convencer al área financiera antes que a nadie",
                "cta": "¿Cómo lograron que sostenibilidad y finanzas hablen el mismo idioma?",
                "fuente": "pri",
            },
            {
                "angle": "la diferencia entre un líder que comunica el cambio y uno que lo sostiene cuando aparece la resistencia",
                "cta": "¿Qué hacés cuando el entusiasmo inicial se apaga?",
                "fuente": "gallup",
            },
        ],
    },
    {
        "area": "Innovación Organizacional",
        "herramienta": "circularidad",
        "enfoques": [
            {
                "angle": "cómo estructurar culturas que convierten la innovación en un proceso sistemático y no en un evento esporádico",
                "cta": "¿Tu organización innova por cultura o por necesidad?",
                "fuente": "wipo",
            },
            {
                "angle": "por qué América Latina innova por debajo de su capacidad y qué parte de eso depende de las empresas",
                "cta": "¿Cuánto de su presupuesto va a probar cosas que pueden fallar?",
                "fuente": "wipo",
            },
            {
                "angle": "la innovación que no se ve: rediseñar un proceso o un modelo de negocio rinde más que lanzar un producto nuevo",
                "cta": "¿Cuál fue su última innovación que no fue un producto?",
                "fuente": "wipo",
            },
        ],
    },
    {
        "area": "Futuro del Trabajo",
        "herramienta": "adn",
        "enfoques": [
            {
                "angle": "cómo los modelos híbridos y la economía de proyectos están rediseñando la estructura empresarial",
                "cta": "¿Cómo ha evolucionado el modelo de trabajo en tu organización?",
                "fuente": "oit",
            },
            {
                "angle": "el impacto real de la automatización inteligente en la fuerza laboral y cómo prepararse",
                "cta": "¿Cómo está gestionando tu empresa la transición hacia roles aumentados por IA?",
                "fuente": "oit",
            },
            {
                "angle": "por qué recalificar al equipo que ya tenés suele salir más barato que salir a buscar perfiles nuevos",
                "cta": "¿Cuándo fue la última vez que formaron a alguien para un rol que todavía no existía?",
                "fuente": "oit",
            },
        ],
    },
    {
        "area": "Finanzas Sostenibles",
        "herramienta": "gri",
        "enfoques": [
            {
                "angle": "por qué los inversores institucionales priorizan empresas con métricas de impacto sólidas",
                "cta": "¿Tu empresa ya tiene una narrativa clara de impacto para inversores?",
                "fuente": "pri",
            },
            {
                "angle": "qué le piden hoy los bancos y fondos a una empresa que busca financiamiento verde",
                "cta": "¿Ya les pidieron datos ambientales para dar un crédito?",
                "fuente": "cdp",
            },
            {
                "angle": "la diferencia entre contar una buena historia de sostenibilidad y poder auditarla",
                "cta": "¿Sus datos ambientales resistirían una verificación externa?",
                "fuente": "gri",
            },
        ],
    },
    {
        "area": "Gestión del Cambio",
        "herramienta": "adn",
        "enfoques": [
            {
                "angle": "por qué tantas transformaciones empresariales fracasan por razones humanas y no técnicas",
                "cta": "¿Cuál ha sido el mayor aprendizaje en un proceso de cambio que lideraste?",
                "fuente": "gallup",
            },
            {
                "angle": "la resistencia al cambio como información y no como obstáculo: qué te está diciendo el que se resiste",
                "cta": "¿Qué aprendiste de alguien que se opuso a un cambio que impulsabas?",
                "fuente": "gallup",
            },
            {
                "angle": "por qué medir la adopción del cambio importa más que medir el avance del proyecto",
                "cta": "¿Miden si la gente efectivamente cambió su forma de trabajar?",
                "fuente": "gallup",
            },
        ],
    },
    {
        "area": "Cadena de Valor Sostenible",
        "herramienta": "gei",
        "enfoques": [
            {
                "angle": "cómo las empresas más avanzadas están descarbonizando su cadena de suministro como ventaja competitiva",
                "cta": "¿Tu empresa ya mide el alcance 3 de sus emisiones?",
                "fuente": "ghg_protocol",
            },
            {
                "angle": "por qué el alcance 3 suele ser la mayor parte de la huella y el más incómodo de medir",
                "cta": "¿Qué tan lejos llegaron midiendo su cadena?",
                "fuente": "ghg_protocol",
            },
            {
                "angle": "qué cambia cuando una empresa se pone metas de reducción validadas por terceros en vez de metas propias",
                "cta": "¿Sus metas climáticas están validadas o son internas?",
                "fuente": "sbti",
            },
        ],
    },
    {
        "area": "Riesgo Climático",
        "herramienta": "gei",
        "enfoques": [
            {
                "angle": "por qué el riesgo climático dejó de ser un tema ambiental para volverse un tema de continuidad del negocio",
                "cta": "¿Tienen mapeado qué pasa con su operación ante un evento climático extremo?",
                "fuente": "ipcc",
            },
            {
                "angle": "la diferencia entre riesgo físico y riesgo de transición, y por qué a muchas empresas les pega el segundo primero",
                "cta": "¿Cuál de los dos riesgos les preocupa más hoy?",
                "fuente": "ipcc",
            },
            {
                "angle": "cómo la regulación climática se volvió un asunto de acceso a mercados para quien exporta",
                "cta": "¿Ya les pidieron huella de carbono desde algún cliente del exterior?",
                "fuente": "cdp",
            },
        ],
    },
]


def get_today_topic() -> dict:
    """Devuelve el tema del día: área + enfoque (ángulo, pregunta y fuente).

    El área rota día a día; el enfoque avanza una posición recién cuando el
    ciclo de áreas dio la vuelta completa. Así la misma área nunca vuelve con
    el mismo ángulo dos veces seguidas.
    """
    day_index = date.today().timetuple().tm_yday
    tema = TEMAS[day_index % len(TEMAS)]
    enfoques = tema["enfoques"]
    enfoque = enfoques[(day_index // len(TEMAS)) % len(enfoques)]
    return {
        "area": tema["area"],
        "herramienta": tema["herramienta"],
        "angle": enfoque["angle"],
        "cta": enfoque["cta"],
        "fuente": enfoque["fuente"],
    }


def get_fuente(topic: dict) -> dict | None:
    """Devuelve la fuente institucional en la que debe apoyarse el post."""
    clave = topic.get("fuente")
    if not clave or clave not in FUENTES:
        return None
    return FUENTES[clave]


def get_cta_herramienta(topic: dict) -> dict | None:
    """Devuelve el llamado a la acción de la herramienta afín al tema del día.

    El enlace lleva UTM para que GA4 pueda atribuir a LinkedIn las visitas y las
    ventas que genere el post. La campaña incluye la fecha: así se puede ver qué
    publicación puntual trajo cada venta, no solo que "vino de LinkedIn".
    """
    clave = topic.get("herramienta")
    if not clave or clave not in HERRAMIENTAS:
        return None

    h = HERRAMIENTAS[clave]
    utm = (
        f"?utm_source=linkedin&utm_medium=social"
        f"&utm_campaign=post-{date.today().isoformat()}"
        f"&utm_content={clave}"
    )
    return {
        "clave": clave,
        "nombre": h["nombre"],
        "gancho": h["gancho"],
        "url": f"{BASE_URL}/{h['archivo']}{utm}",
    }
