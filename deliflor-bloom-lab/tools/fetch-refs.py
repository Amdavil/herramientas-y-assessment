#!/usr/bin/env python3
"""
Descarga el subconjunto curado del catálogo de referencia.

Se ejecuta APARTE del recolector a propósito: harvest-refs.py sólo mira
metadatos, y esto sí trae archivos. Por defecto hace un simulacro y no
escribe nada; hay que pasar --descargar para que baje de verdad.

Curaduría: se prioriza licencia limpia (dominio público, CC0, CC BY y
"No restrictions"), porque son las que se pueden empaquetar en la app del
cliente sin arrastrar la cláusula de compartir-igual de CC BY-SA. Las
CC BY-SA quedan en el catálogo como enlace, para consultarlas, no para
distribuirlas dentro del kiosco.

Se baja la versión de 1600 px, no el original: para estudiar la forma del
pétalo y el centro sobra, y evita traer 4000 px por archivo.
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

UA = "DeliflorBloomLab-ReferenceFetcher/1.0 (botanical reference; contact: projectability.pal@gmail.com)"

# Licencias que sí se pueden empaquetar en la app del cliente.
PACKABLE = {"libre", "atribucion"}
# 'No restrictions' es de instituciones que liberan su archivo; el
# recolector no la mapea porque no es una etiqueta Creative Commons.
EXTRA_FREE = {"no restrictions"}

MIN_W = 1200


def is_packable(item):
    if item.get("tier") in PACKABLE:
        return True
    return (item.get("license") or "").strip().lower() in EXTRA_FREE


def slug(s):
    s = re.sub(r"^File:", "", s)
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s)
    return s[:110]


# Ruido que aparece al filtrar sólo por licencia: la franja de dominio
# público está llena de estampas antiguas, láminas de herbario y planos
# generales de cultivo, que no muestran ninguna característica fina.
REJECT = re.compile(
    r"utagawa|hokusai|hiroshige|woodblock|ukiyo|blanco\d|herbari|botanical\s*print|"
    r"illustration|drawing|engraving|postage|stamp|coat\s*of\s*arms|"
    r"csendélet|still\s*life|festő|painting|plate\s*\d|the\s*book\s*of|"
    r"museum|gallery|portrait|kimono|woman|women|man\b|people|"
    r"field|panoramio|market|festival|garden\s*show|buga|cemeter|grave|"
    r"tea\b|glass|wine|malbec|food|dish|soup|"
    r"lilies|dahlia|rose|tulip|aster\b",
    re.I)
# Señales de que la foto sí muestra la flor de cerca.
BOOST = re.compile(r"macro|close|closeup|close-up|detail|floret|petal|bloom|"
                   r"flower\s*head|capitul|center|centre|stamen|disc", re.I)


def quality(item):
    """Puntúa cuánto sirve la foto como referencia morfológica."""
    title = re.sub(r"^File:", "", item.get("title", ""))
    desc = item.get("description", "") or ""
    hay = title + " " + desc

    if REJECT.search(hay):
        return -1

    w, h = item.get("width") or 0, item.get("height") or 0
    if not w or not h:
        return -1
    ar = w / float(h)
    # Las panorámicas son planos generales de cultivo, no macro.
    if ar > 1.75 or ar < 0.55:
        return -1

    score = 0.0
    if BOOST.search(hay):
        score += 3
    if item.get("cultivar"):
        score += 4          # variedad identificada: es lo que pidió el cliente
    score += min(w, h) / 1000.0
    if 0.8 <= ar <= 1.25:   # encuadre cuadrado = macro de una flor
        score += 1.5
    return score


ONLY_FREE = False


def curate(items):
    """Selección que cubre el rango botánico, no sólo las más bonitas.

    Para consulta interna entran las dos franjas de licencia: la referencia
    útil (variedades con nombre y macro nítida) está casi toda en CC BY-SA,
    y dejarla fuera vaciaría el propósito. Con --solo-libres se restringe a
    lo que sí se podría empaquetar y redistribuir.
    """
    pool = [i for i in items
            if (i.get("width") or 0) >= MIN_W and quality(i) > 0
            and (is_packable(i) if ONLY_FREE else True)]
    pool.sort(key=quality, reverse=True)

    # Se reparte por categoría de origen para que no salgan 200 fotos del
    # mismo color: las categorías por color y por parte de la planta son
    # justamente el eje que interesa cubrir.
    buckets = {}
    for it in pool:
        key = it.get("cultivar") or (it.get("categories") or ["?"])[0]
        buckets.setdefault(key, []).append(it)

    picked, seen = [], set()
    # ronda a ronda, una de cada grupo, para repartir
    round_i = 0
    while True:
        added = False
        for key in sorted(buckets):
            grp = buckets[key]
            if round_i < len(grp):
                it = grp[round_i]
                if it["title"] not in seen:
                    seen.add(it["title"])
                    picked.append(it)
                    added = True
        if not added:
            break
        round_i += 1
    return picked


def head_size(url):
    try:
        req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=30) as r:
            return int(r.headers.get("Content-Length") or 0)
    except Exception:
        return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--descargar", action="store_true",
                    help="baja los archivos (por defecto sólo simula)")
    ap.add_argument("--limite", type=int, default=180)
    ap.add_argument("--salida", default="../assets/referencias")
    ap.add_argument("--muestra-peso", type=int, default=12,
                    help="cuántos archivos medir para estimar el total")
    ap.add_argument("--ancho", type=int, default=1280,
                    help="ancho de la copia a descargar (Commons la genera al vuelo)")
    ap.add_argument("--solo-libres", action="store_true",
                    help="excluye CC BY-SA; deja sólo lo empaquetable sin "
                         "cláusula de compartir-igual")
    args = ap.parse_args()
    global ONLY_FREE
    ONLY_FREE = args.solo_libres

    with open("referencias-crisantemo.json", encoding="utf-8") as f:
        cat = json.load(f)

    picked = curate(cat["items"])[:args.limite]
    print("Seleccionadas: %d de %d" % (len(picked), cat["count"]))

    # El recolector guardó la miniatura a 1600 px; Commons genera cualquier
    # otro ancho cambiando ese número en la URL, así que no hace falta
    # volver a consultar la API para pedir una copia más liviana.
    # Commons sólo sirve una lista fija de anchos y varía por archivo, así
    # que se prueba el pedido y se cae al que ya venía si lo rechaza.
    for it in picked:
        if not it.get("thumb"):
            continue
        cand = re.sub(r"/(\d+)px-", "/%dpx-" % args.ancho, it["thumb"])
        it["thumb_alt"] = it["thumb"]
        it["thumb"] = cand

    # Estimación de peso a partir de una muestra
    sizes = [head_size(i["thumb"]) for i in picked[:args.muestra_peso] if i.get("thumb")]
    sizes = [s for s in sizes if s]
    if sizes:
        avg = sum(sizes) / len(sizes)
        print("Peso medio por archivo: %.0f KB" % (avg / 1024))
        print("Peso total estimado:    %.1f MB" % (avg * len(picked) / 1024 / 1024))

    lic = {}
    for i in picked:
        lic[i["license"]] = lic.get(i["license"], 0) + 1
    print("Licencias del lote:")
    for k, v in sorted(lic.items(), key=lambda x: -x[1]):
        print("  %-24s %d" % (k, v))

    if not args.descargar:
        print("\n(simulacro — nada descargado; use --descargar)")
        return

    os.makedirs(args.salida, exist_ok=True)
    manifest = []
    for n, it in enumerate(picked, 1):
        url = it.get("thumb") or it.get("original")
        if not url:
            continue
        name = slug(it["title"])
        if not name.lower().endswith((".jpg", ".jpeg", ".png")):
            name += ".jpg"
        dest = os.path.join(args.salida, name)
        if os.path.exists(dest):
            manifest.append({**{k: it[k] for k in ("title", "page", "license", "author")},
                             "file": name, "cultivar": it.get("cultivar")})
            continue
        try:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                data = urllib.request.urlopen(req, timeout=60).read()
            except urllib.error.HTTPError:
                req = urllib.request.Request(it.get("thumb_alt") or it["original"],
                                             headers={"User-Agent": UA})
                data = urllib.request.urlopen(req, timeout=60).read()
            with open(dest, "wb") as f:
                f.write(data)
            manifest.append({**{k: it[k] for k in ("title", "page", "license", "author")},
                             "file": name, "cultivar": it.get("cultivar")})
            print("  [%3d/%d] %s" % (n, len(picked), name[:70]))
        except Exception as e:
            print("  ! %s: %s" % (name[:50], e), file=sys.stderr)
        time.sleep(0.15)

    # El manifiesto con autoría viaja junto a las imágenes: sin él no se
    # puede cumplir la atribución que exigen las licencias CC BY.
    with open(os.path.join(args.salida, "CREDITOS.json"), "w", encoding="utf-8") as f:
        json.dump({"source": "Wikimedia Commons",
                   "note": "Atribución requerida para las licencias CC BY.",
                   "items": manifest}, f, ensure_ascii=False, indent=2)
    print("\n%d archivos en %s (+ CREDITOS.json)" % (len(manifest), args.salida))


if __name__ == "__main__":
    main()
