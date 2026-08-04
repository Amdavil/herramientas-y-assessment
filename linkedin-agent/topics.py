"""
Rotating topic pool for daily LinkedIn posts.
Topics are selected deterministically by day-of-year so they cycle
without repeating the same subject two days in a row.
"""

from datetime import date

TOPICS = [
    {
        "area": "Inteligencia Artificial",
        "angle": "cómo las empresas líderes están integrando IA generativa en sus operaciones cotidianas",
        "cta": "¿Tu empresa ya está explorando estas herramientas?",
    },
    {
        "area": "Sostenibilidad Corporativa",
        "angle": "por qué las empresas que integran ESG en su estrategia core superan a sus competidores a largo plazo",
        "cta": "¿Cómo está posicionando tu organización el pilar de sostenibilidad?",
    },
    {
        "area": "Competitividad Empresarial",
        "angle": "los factores que diferencian a las organizaciones más competitivas del mercado actual",
        "cta": "¿Cuál es el mayor diferenciador competitivo de tu industria hoy?",
    },
    {
        "area": "Equipos de Alto Rendimiento",
        "angle": "las prácticas de gestión que construyen equipos resilientes y altamente productivos en entornos de incertidumbre",
        "cta": "¿Qué práctica ha transformado más a tu equipo?",
    },
    {
        "area": "Tendencias Económicas",
        "angle": "las fuerzas macroeconómicas que están redefiniendo los modelos de negocio en 2026",
        "cta": "¿Cómo está adaptando tu empresa su estrategia ante este contexto?",
    },
    {
        "area": "Transformación Digital",
        "angle": "por qué la adopción tecnológica ya no es una ventaja competitiva sino una condición de supervivencia",
        "cta": "¿En qué etapa de transformación digital se encuentra tu organización?",
    },
    {
        "area": "Economía Circular",
        "angle": "cómo las empresas que adoptan modelos circulares están reduciendo costos y abriendo nuevos mercados simultáneamente",
        "cta": "¿Tu empresa ha explorado la economía circular como palanca de crecimiento?",
    },
    {
        "area": "Liderazgo Moderno",
        "angle": "las competencias que distinguen a los líderes que generan impacto real en organizaciones complejas",
        "cta": "¿Qué competencia de liderazgo considerás más crítica hoy?",
    },
    {
        "area": "Innovación Organizacional",
        "angle": "cómo estructurar culturas que convierten la innovación en un proceso sistemático, no en un evento esporádico",
        "cta": "¿Tu organización innova por cultura o por necesidad?",
    },
    {
        "area": "Inteligencia Artificial",
        "angle": "el impacto real de la automatización inteligente en la fuerza laboral y cómo prepararse",
        "cta": "¿Cómo está gestionando tu empresa la transición hacia roles aumentados por IA?",
    },
    {
        "area": "Futuro del Trabajo",
        "angle": "cómo los modelos híbridos y la economía de proyectos están rediseñando la estructura empresarial",
        "cta": "¿Cómo ha evolucionado el modelo de trabajo en tu organización?",
    },
    {
        "area": "Finanzas Sostenibles",
        "angle": "por qué los inversores institucionales están priorizando empresas con métricas de impacto sólidas",
        "cta": "¿Tu empresa ya tiene una narrativa clara de impacto para inversores?",
    },
    {
        "area": "Gestión del Cambio",
        "angle": "las razones por las que el 70% de las transformaciones empresariales fallan y cómo evitar ese destino",
        "cta": "¿Cuál ha sido el mayor aprendizaje en un proceso de cambio que lideraste?",
    },
    {
        "area": "Cadena de Valor Sostenible",
        "angle": "cómo las empresas más avanzadas están decarbonizando su cadena de suministro como ventaja competitiva",
        "cta": "¿Tu empresa ya mide el alcance 3 de sus emisiones?",
    },
]


def get_today_topic() -> dict:
    """Return the topic assigned to today based on day-of-year."""
    day_index = date.today().timetuple().tm_yday
    return TOPICS[day_index % len(TOPICS)]
