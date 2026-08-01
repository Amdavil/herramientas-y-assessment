# Referencia botánica del crisantemo

Base para que el modelo procedural y los prompts de la capa fotorrealista
describan un crisantemo real y no "una flor genérica". Todo lo de aquí sale
de dos sitios: la clasificación oficial de la National Chrysanthemum Society
(EE. UU.) y la observación directa del banco de 139 fotos de referencia
(`assets/referencias/`, índice visual en `_INDICE.jpg`).

El banco no se publica: casi todo es CC BY-SA y empaquetarlo en el kiosco
arrastraría la cláusula de compartir-igual. El catálogo con enlaces, autoría
y licencia de cada foto sí está versionado en
`tools/referencias-crisantemo.json` (1.080 fichas, 156 cultivares).

---

## 1. Anatomía: dos flores en una

Un "pétalo" de crisantemo no es un pétalo. El capítulo es una inflorescencia
compuesta por dos tipos de flor:

- **Flósculos radiales** (*ray florets*) — los "pétalos" visibles. Sólo
  tienen órganos femeninos. Son la parte vistosa y la que define la forma.
- **Flósculos del disco** (*disc florets*) — el centro. Son flores
  completas, diminutas y apretadas.

Consecuencia para el render: **el centro no es una cúpula lisa**. En todas
las fotos con centro visible ('Icey Isle', 'Harry Gee', 'Carrie') se ve
granular, formado por cientos de florecillas individuales, con un anillo
verdoso en el ápice y los estambres asomando en la corona exterior primero.

---

## 2. Las 13 clases de la NCS

| # | Clase | Rasgo que la define | Centro |
|---|-------|---------------------|--------|
| 1 | Incurvada irregular | Gigante (15-20 cm), flósculos que se curvan hacia dentro de forma laxa; los de abajo cuelgan formando "falda" | cerrado |
| 2 | Refleja | Flósculos curvados hacia abajo, superpuestos como plumaje | oculto |
| 3 | Incurvada regular | Esfera perfecta, igual de ancha que de alta | cerrado |
| 4 | Decorativa | Los de arriba incurvan, los de abajo reflejan; silueta aplanada | no visible |
| 5 | Incurvada intermedia | Como la 1 pero menor y sólo parcialmente incurvada | lleno, más abierto |
| 6 | Pompón | Globo pequeño, plano de joven y esférico maduro | oculto |
| 7 | Simple / semidoble | Margarita: disco visible y 1-5 filas de radiales | **abierto** |
| 8 | Anémona | Como la semidoble pero con **cojín central elevado** | abierto y prominente |
| 9 | Cuchara | Como la semidoble pero cada radial termina en **cuchara** | abierto, redondo |
| 10 | Canuto (*quill*) | Radiales tubulares rectos con la punta abierta | sin centro visible |
| 11 | Araña | Radiales largos y tubulares que **se enroscan o enganchan** en la punta | variable |
| 12 | Brocha / cardo | Tubulares finos paralelos al tallo (brocha) o aplanados y retorcidos (cardo) | — |
| 13 | Exótica | No encaja en ninguna | — |

Las 10 familias del aplicativo mapean así: Ballhia→3, Decorativa→4,
Margriet→7, Cuchara→9, Araña→11, Anémona→8, Simple→7, Semidoble→7,
Doble→1/5, Sorpresa→13.

---

## 3. Hallazgos de la observación directa

Esto es lo que separa el render actual de una fotografía. Cada punto sale de
una foto concreta del banco.

### 3.1 La punta del flósculo es **dentada**, no redonda lisa
Referencia: `Chrysanthemum_morifolium_Icey_Isle_*.jpg`, `*_Carrie_*`.

El ápice de cada radial tiene **2-3 dientes o lóbulos pequeños**. Es el
rasgo más identificable del crisantemo frente a una margarita o una gerbera,
y es lo primero que delata un pétalo procedural con punta perfectamente
redondeada. Se aprecia sobre todo en las clases de centro abierto (7, 9),
donde los radiales se ven completos.

### 3.2 El flósculo es un **canal en U**, no una lámina
Referencia: `Chrysanthemum_morifolium_Harry_Gee_*.jpg`.

En las incurvadas el radial se pliega hacia arriba hasta casi cerrarse sobre
sí mismo, como una canoa. Además hay **un solo pliegue central marcado** a lo
largo del nervio, visible como una línea más clara — no un rayado múltiple.

### 3.3 La cuchara es **tubo + cazoleta más oscura**
Referencia: `Chrysanthemum_Jimmy_Spoon_*.jpg`.

El radial es un tubo delgado y pálido en casi toda su longitud, y sólo en el
extremo se abre en una cuchara pequeña, redonda y **más saturada de color que
el tubo**. El contraste de color entre tubo y cazoleta es tan característico
como la forma.

### 3.4 Zona intermedia de botones cortos
Referencia: `Chrysanthemum_Jimmy_Spoon_*.jpg`, `*_Harry_Gee_*`.

Entre el disco y los radiales largos hay una corona de radiales **inmaduros,
cortos y aún con forma de botón**, muy apretados. La flor no pasa del disco a
los pétalos largos de golpe: hay un gradiente de madurez.

### 3.5 El envés es más saturado que el haz
Referencia: `Chrysanthemum_morifolium_Harry_Gee_*.jpg`.

En los cultivares claros el dorso del radial es visiblemente más rosado o
lavanda que la cara superior. Cuando el pétalo se curva y muestra el dorso,
aparece ese tono más intenso. El genoma ya tiene el parámetro `reverse`; la
observación confirma que debe ser **más saturado**, no sólo distinto.

### 3.6 Hoja
Lobulada profunda, casi como hoja de roble, con lóbulos redondeados y seno
marcado; verde muy oscuro y algo lustrosa, con nervadura más pálida. El
envés es mate y más claro.

---

## 4. Vocabulario para los prompts

Términos que hacen que el generador devuelva un crisantemo y no una dalia o
un aster. Usar en `Genome.prompt()`:

- `ray florets` / `disc florets` (no "petals" / "center")
- `notched floret tips`, `toothed apex`
- `incurved` / `reflexed` / `quilled` / `spatulate spoon tips`
- `capitulum`, `receptacle`
- `Chrysanthemum × morifolium`

Negativos útiles (ya en `Genome.NEGATIVE`): dalia, aster, gerbera y
margarita son las confusiones más frecuentes, porque comparten el capítulo
radiado.

---

## 5. Cultivares reales del banco

81 variedades con nombre y foto local; 156 en el catálogo completo. Sirven
como referencia de nomenclatura comercial y como control de que una
combinación de forma y color existe de verdad:

Alberta · Alexis · Amor · Amor Coral · Amor Pink · Amphian · Baltazar ·
Barbie · Bethany · Blushing Emily · Bold Melissa · Brandi · Branhill Red ·
Bretgne · Bright Gretchen · Brigitte · Brouzefeuer · Cameo White · Carrie ·
Cheryl · Christine · Copycat Yellow · Courtney · Cronus · Dance ·
Dark Triumph · Delianne · Delightful Victoria · Denise · Disco Club ·
Enbee Wedding Golden · Erica · Fine Feathers · Frosty Jeanette ·
Gentle Alberta · Glenda · Golden Andrea · Golden Marilyn · Grand Pink ·
Harvest Emily · Hebe · Helen · Hot Salsa · Jennifer · Jimmy Spoon ·
Kishinonishi · Linda · Lipsi · Lisa · Mariah · Mariyo · Mary Jayne · Megan ·
Melissa · Mia · Michelle · Misty · Mona Lisa Pink · Okra · Optimist · Pam ·
Rage Spray · Raquel · Reagan Splendid · Rhapsody · Roxanne · Seashell ·
Seedling · Soraja · Spicy Cheryl · Spotlight · Sundoro · Sunny Denise ·
Taffy · Triumph · Venus · Vesuvius · Vicki · Yellow Sarah ·
Yellow Triumph · Zibena

---

## 6. Cómo regenerar el banco

```bash
cd deliflor-bloom-lab/tools
python harvest-refs.py                 # catálogo de metadatos (versionado)
python fetch-refs.py --descargar       # descarga (no versionada)
python contact-sheet.py                # índice visual
```

`fetch-refs.py --solo-libres` restringe a dominio público y CC BY, que es lo
único empaquetable sin heredar compartir-igual. Ojo: en esa franja casi
ninguna foto trae variedad identificada.

## Fuentes

- National Chrysanthemum Society (EE. UU.), vía Central Carolina
  Chrysanthemum Society — <https://www.carolinamums.org/classifications>
- New York Botanical Garden, guía de crisantemos —
  <https://libguides.nybg.org/chrysanthemumform>
- Wikimedia Commons — <https://commons.wikimedia.org/wiki/Category:Chrysanthemum>
