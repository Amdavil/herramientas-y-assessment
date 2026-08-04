# -*- coding: utf-8 -*-
import io, sys
sys.stdout = __import__('io').TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate,
                                 Paragraph, Spacer, FrameBreak,
                                 KeepTogether, Image as RLImage)
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import mm, inch, cm
from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage

# ── RUTAS ──────────────────────────────────────────────────────────────────
PHOTO  = r"C:\Users\danie\Downloads\ChatGPT Image 7 may 2026, 10_20_26.png"
OUTPUT = r"G:\Mi unidad\5-DOCUMENTOS DANIEL\Resume\Daniel_Villa_CV_Profesional.pdf"

# ── FUENTES (Calibri del sistema) ──────────────────────────────────────────
FONTS = r"C:\Windows\Fonts"
try:
    pdfmetrics.registerFont(TTFont('Cal',     f'{FONTS}\\calibri.ttf'))
    pdfmetrics.registerFont(TTFont('CalB',    f'{FONTS}\\calibrib.ttf'))
    pdfmetrics.registerFont(TTFont('CalI',    f'{FONTS}\\calibrii.ttf'))
    pdfmetrics.registerFont(TTFont('CalBI',   f'{FONTS}\\calibriz.ttf'))
    pdfmetrics.registerFontFamily('Cal', normal='Cal', bold='CalB',
                                  italic='CalI', boldItalic='CalBI')
    F = 'Cal'
except:
    F = 'Helvetica'

# ── COLORES ────────────────────────────────────────────────────────────────
NAVY   = HexColor('#1C3553')
GREEN  = HexColor('#27965C')
LBLUE  = HexColor('#A8C8E8')
LGRAY  = HexColor('#CCDDEE')
WHITE  = HexColor('#FFFFFF')
DARK   = HexColor('#2C2C2C')
GRAY   = HexColor('#777777')

# ── PÁGINA ────────────────────────────────────────────────────────────────
PW, PH   = LETTER           # 612 × 792 pt
SB_W     = 187              # ancho sidebar en pt
PAD_S    = 13               # relleno interno sidebar
PAD_ML   = 16               # relleno izq. panel principal
PAD_MR   = 14               # relleno der. panel principal
MARGIN_V = 16               # márgenes verticales

# ── FONDO SIDEBAR (dibujado en cada página) ────────────────────────────────
def draw_bg(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, SB_W, PH, fill=1, stroke=0)
    canvas.restoreState()

# ── ESTILOS ────────────────────────────────────────────────────────────────
def S(name, size=9, color=DARK, bold=False, italic=False,
      align=TA_LEFT, sb=0, sa=3, leading=None):
    fn = (F+'B' if bold else F) if F != 'Helvetica' else (
          'Helvetica-Bold' if bold else 'Helvetica')
    if italic and F != 'Helvetica':
        fn = F+'BI' if bold else F+'I'
    elif italic:
        fn = 'Helvetica-BoldOblique' if bold else 'Helvetica-Oblique'
    return ParagraphStyle(name, fontName=fn, fontSize=size, textColor=color,
                          spaceBefore=sb, spaceAfter=sa, alignment=align,
                          leading=leading or round(size * 1.32, 1),
                          leftIndent=0, rightIndent=0)

# estilos sidebar
sNAME  = S('sName',  13, WHITE, bold=True,  align=TA_CENTER, sb=6,  sa=2)
sTITLE = S('sTitle',  8, LBLUE, italic=True, align=TA_CENTER, sb=0,  sa=12)
sSEC   = S('sSec',    8, LBLUE, bold=True,  sb=10, sa=4)
sLBL   = S('sLbl',  8.5, WHITE, bold=True,  sb=2,  sa=1)
sVAL   = S('sVal',  8.2, LGRAY, sb=0, sa=3)
sITEM  = S('sItem', 8.2, LGRAY, sb=1, sa=1)
sDEG   = S('sDeg',  8.5, WHITE, bold=True,  sb=8, sa=0)
sSCH   = S('sSch',    8, LGRAY, italic=True, sb=0, sa=0)
sYR    = S('sYr',     8, LBLUE, sb=0, sa=6)

# estilos panel principal
mSEC   = S('mSec',  11, NAVY, bold=True, sb=14, sa=5)
mBODY  = S('mBody', 9.5, DARK, align=TA_JUSTIFY, sb=2, sa=3)
mCO    = S('mCo',  10.5, NAVY, bold=True, sb=12, sa=1)
mDATE  = S('mDate', 8.5, GREEN, bold=True, sb=0, sa=1)
mROLE  = S('mRole', 9.5, DARK,  italic=True, bold=True, sb=0, sa=4)
mLBL   = S('mLbl',   9, DARK, bold=True, sb=5, sa=1)
mBUL   = S('mBul',   9, DARK, sb=1, sa=1, leading=12)

# ── HELPERS SIDEBAR ────────────────────────────────────────────────────────
def sb_section(txt):
    hr = f'<font color="#27965C">{"─"*28}</font>'
    return [Paragraph(f'<b>{txt.upper()}</b>', sSEC),
            Paragraph(hr, S('hr', 6, GREEN, sb=0, sa=4))]

def sb_kv(label, value):
    return [Paragraph(f'<b>{label}</b>', sLBL),
            Paragraph(value, sVAL)]

def sb_item(txt):
    return Paragraph(f'<font color="#27965C">›</font> {txt}', sITEM)

def sb_degree(degree, school, year):
    return [Paragraph(degree, sDEG),
            Paragraph(school, sSCH),
            Paragraph(year, sYR)]

def sb_study(title, detail):
    return [Paragraph(f'<b>{title}</b>', S('st', 8, WHITE, bold=True, sb=6, sa=0)),
            Paragraph(detail, S('sd', 7.5, LGRAY, italic=True, sb=0, sa=2))]

# ── HELPERS PANEL PRINCIPAL ────────────────────────────────────────────────
def m_section(txt):
    style = ParagraphStyle('mSecU', parent=mSEC,
                           borderPadding=(0,0,3,0))
    p = Paragraph(txt.upper(), style)
    return [p, Paragraph('<font color="#27965C">%s</font>' % ('─'*60),
                          S('gline', 7, GREEN, sb=0, sa=6))]

def m_job(company, location, dates, role):
    return [
        Paragraph(f'<b>{company}</b>  <font color="#777777" size="9"><i>| {location}</i></font>', mCO),
        Paragraph(dates, mDATE),
        Paragraph(role,  mROLE),
    ]

def m_label(txt):
    return Paragraph(f'<b>{txt}</b>', mLBL)

def m_bullet(txt):
    return Paragraph(
        f'<font color="#27965C"><b>›</b></font>  {txt}', mBUL,
        bulletText=None)

# ── FOTO: recorte cuadrado desde la parte SUPERIOR ────────────────────────
def photo_flowable(path, width_pt=148):
    img = PILImage.open(path)
    w, h = img.size
    side  = min(w, h)
    left  = (w - side) // 2
    top   = 0                          # tomar desde la parte superior
    crop  = img.crop((left, top, left+side, top+side))
    buf   = io.BytesIO()
    crop.save(buf, 'PNG')
    buf.seek(0)
    return RLImage(buf, width=width_pt, height=width_pt)

# ══════════════════════════════════════════════════════════════════════════
#  CONTENIDO SIDEBAR
# ══════════════════════════════════════════════════════════════════════════
sb_story = []

# Foto centrada
ph = photo_flowable(PHOTO, width_pt=148)
ph.hAlign = 'CENTER'
sb_story.append(Spacer(1, 6))
sb_story.append(ph)
sb_story.append(Paragraph('DANIEL VILLA VÉLEZ', sNAME))
sb_story.append(Paragraph('Ingeniero Ambiental  |  MBA', sTITLE))

# Contacto
sb_story += sb_section('Contacto')
sb_story += sb_kv('Tel:',    '+57 300 235 4198')
sb_story += sb_kv('Email:',  'danielvillavelez@gmail.com')
sb_story += sb_kv('Ciudad:', 'Envigado, Antioquia')
sb_story += sb_kv('Web:',    'bit.ly/2RRr0pe')

# Idiomas
sb_story += sb_section('Idiomas')
sb_story += sb_kv('Español:',  'Lengua materna')
sb_story += sb_kv('Inglés:',   'Alto')
sb_story += sb_kv('Francés:',  'Básico')

# Áreas de experticia
sb_story += sb_section('Áreas de Experticia')
for sk in ['Planeación estratégica y proyectos',
           'Sostenibilidad corporativa / ESG',
           'Reportes GRI / estándares ISSB',
           'Cambio climático y huella de carbono',
           'Transformación digital',
           'IA generativa (ChatGPT, Claude, Copilot)',
           'Automatización de procesos con IA',
           'Responsabilidad social corporativa']:
    sb_story.append(sb_item(sk))

# Educación formal
sb_story += sb_section('Educación Formal')
sb_story += sb_degree('MBA Ejecutivo',
                       'Westfield Business School', '2021 – 2022')
sb_story += sb_degree('Máster en Transformación Exp.',
                       'EIG – Granada, España', '2022')
sb_story += sb_degree('Esp. Gerencia de Proyectos',
                       'Univ. Pontificia Bolivariana', '2006 – 2008')
sb_story += sb_degree('Ingeniero Ambiental',
                       'Escuela de Ing. de Antioquia', '1998 – 2004')

# Otros estudios
sb_story += sb_section('Otros Estudios')
sb_story += sb_study('Transformación Digital',
                     'Univ. de La Sabana (2019)')
sb_story += sb_study('Reportes GRI Standards G4',
                     'GRI (2018, 2013, 2012)')
sb_story += sb_study('Starting Business',
                     'Shadd Business Centre, Canadá (2015)')
sb_story += sb_study('Inglés',
                     'Commission Scolaire English-Montréal (2014-2015)')
sb_story += sb_study('Gestión ISO 9001:2008 / ISO 26000',
                     'Icontec / Vincular (2012)')
sb_story += sb_study('Auditor Ambiental en P+L',
                     'Icontec (2010)')

# ── Salto al frame principal
sb_story.append(FrameBreak())

# ══════════════════════════════════════════════════════════════════════════
#  CONTENIDO PANEL PRINCIPAL
# ══════════════════════════════════════════════════════════════════════════
m_story = []
m_story.append(Spacer(1, 4))

# Perfil
m_story += m_section('Perfil Profesional')
m_story.append(Paragraph(
    'Ingeniero, Magíster en Administración de Empresas y Transformación Exponencial, '
    'Especialista en Gerencia de Proyectos con <b>más de 20 años de experiencia</b> '
    'en consultoría estratégica y dirección de proyectos en sectores minero, '
    'industrial y de servicios, en organizaciones gubernamentales y privadas.', mBODY))
m_story.append(Paragraph(
    'Competencias en sostenibilidad corporativa, sistemas de gestión y transformación digital. '
    'Actualmente integra <b>inteligencia artificial generativa (ChatGPT, Claude, Copilot)</b> '
    'en procesos de reporte ESG, análisis de huella de carbono y automatización de '
    'flujos de trabajo de consultoría.', mBODY))

# Experiencia
m_story += m_section('Experiencia Profesional')

# 1. PPROJECTABILITY
m_story += m_job('PPROJECTABILITY', 'Medellín, Colombia',
                  'jun/2022 – Actualidad', 'Director Estratégico')
m_story.append(m_label('Funciones principales:'))
for t in ['Estructuración de estrategias de sostenibilidad corporativa y adopción del enfoque ESG.',
          'Elaboración de estudios de materialidad, reportes GRI y programas de gestión de emisiones.',
          'Estrategias de relacionamiento con grupos de interés y adaptación al cambio climático.']:
    m_story.append(m_bullet(t))
m_story.append(m_label('Logros destacados:'))
for t in ['Diseño de planes de descarbonización en la industria de petróleo y gas.',
          'Estructuración de soluciones digitales orientadas a estrategias de sostenibilidad.',
          'Integración de IA generativa (ChatGPT, Claude, Copilot) en flujos de consultoría ESG, '
           'optimizando reportes de sostenibilidad y estudios de materialidad.',
          'Análisis predictivo de huella de carbono con IA para escenarios de descarbonización '
           'en clientes del sector energético e industrial.',
          'Diseño de flujos y prompts con IA generativa para automatización de procesos '
           'internos y soluciones digitales para clientes corporativos.']:
    m_story.append(m_bullet(t))

# 2. PORTAFOLIO VERDE
m_story += m_job('PORTAFOLIO VERDE', 'Medellín, Colombia',
                  'jun/2015 – may/2022', 'Ejecutivo de Proyectos / Consultor Senior')
for t in ['Diseño e implementación de planes de intervención en proyectos de sostenibilidad.',
          'Coordinación de proyectos de gestión de huella de carbono organizacional.',
          'Clientes: Hocol, Stork, Celsia, Luker, BBVA, Uniban, Ministerio de Ambiente, Corantioquia.',
          'Diseño de metodologías de valoración empresarial en sostenibilidad y cambio climático.']:
    m_story.append(m_bullet(t))

# 3. ICONTEC
m_story += m_job('ICONTEC', 'Medellín, Colombia',
                  'ago/2012 – jul/2014',
                  'Auditor en Sostenibilidad / Profesional de Evaluación de la Conformidad')
for t in ['Evaluación de gestión en Responsabilidad Social e Informes de Sostenibilidad GRI.',
          'Diseño del "Sello de Sostenibilidad" y metodología de mínimos para clientes.',
          'Clientes: Team Group, ESU, Mineros SA, Alcaldía de Medellín, Isagen.']:
    m_story.append(m_bullet(t))

# 4. CEMENTOS ARGOS
m_story += m_job('CEMENTOS ARGOS', 'Medellín, Colombia',
                  'ago/2010 – mar/2012', 'Profesional de Gestión Ambiental')
for t in ['Gestión ambiental de instalaciones y monitoreo de requerimientos legales.',
          'Mejoramiento de indicadores ambientales mediante cumplimiento normativo diligente.']:
    m_story.append(m_bullet(t))

# 5. ÁREA METROPOLITANA
m_story += m_job('ÁREA METROPOLITANA DEL VALLE ABURRÁ', 'Medellín, Colombia',
                  'ene/2006 – jul/2010', 'Consultor Ambiental')
for t in ['Formulación y seguimiento de proyectos de Producción Más Limpia para +500 empresas.',
          'Estructuración de herramientas de monitoreo y gestión de indicadores regionales.']:
    m_story.append(m_bullet(t))

# ══════════════════════════════════════════════════════════════════════════
#  DOCUMENTO
# ══════════════════════════════════════════════════════════════════════════
story = sb_story + m_story

FRAME_SB = Frame(
    PAD_S, MARGIN_V,
    SB_W - 2*PAD_S, PH - 2*MARGIN_V,
    leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    id='sidebar')

FRAME_MAIN = Frame(
    SB_W + PAD_ML, MARGIN_V,
    PW - SB_W - PAD_ML - PAD_MR, PH - 2*MARGIN_V,
    leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
    id='main')

tmpl = PageTemplate(id='cv', frames=[FRAME_SB, FRAME_MAIN],
                    onPage=draw_bg)

doc = BaseDocTemplate(
    OUTPUT,
    pagesize=LETTER,
    leftMargin=0, rightMargin=0, topMargin=0, bottomMargin=0)
doc.addPageTemplates([tmpl])
doc.build(story)

print(f'PDF generado: {OUTPUT}')
