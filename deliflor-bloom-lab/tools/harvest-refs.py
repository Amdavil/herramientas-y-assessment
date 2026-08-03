#!/usr/bin/env python3
"""
Recolector de imágenes de referencia de crisantemo desde Wikimedia Commons.

Por qué Commons y no una búsqueda de imágenes cualquiera: cada archivo trae
su licencia y su autoría en los metadatos, así que se puede saber qué se
puede usar y cómo hay que atribuirlo. Una foto encontrada en un buscador
normalmente tiene dueño y no se puede empaquetar en la app del kiosco.

Sólo escribe un catálogo JSON con metadatos y URLs. NO descarga las imágenes:
eso es un paso aparte y deliberado (ver fetch-refs.py).
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "DeliflorBloomLab-ReferenceHarvester/1.0 (botanical reference catalog; contact: projectability.pal@gmail.com)"

# Categorías barridas. Se mezclan cultivares con nombre propio (que es donde
# aparecen las características finas de cada variedad) y las categorías
# generales de calidad, que traen macro bien resueltas.
CATEGORIES = [
    "Category:Quality images of Chrysanthemum",
    "Category:Chrysanthemum × morifolium",
    "Category:Chrysanthemum (cultivars)",
    "Category:Chrysanthemum indicum",
    "Category:Yellow chrysanthemums",
    "Category:White chrysanthemums",
    "Category:Pink chrysanthemums",
    "Category:Red chrysanthemums",
    "Category:Orange chrysanthemums",
    "Category:Purple chrysanthemums",
    "Category:Chrysanthemum leaves",
    "Category:Chrysanthemum buds",
]

# Además se desciende a cada subcategoría de cultivar con nombre propio
# ('Chrysanthemum Alberta', 'Chrysanthemum Barbie', ...). Ahí es donde
# están las variedades identificadas, que es lo que permite comparar
# forma y color contra un nombre real en vez de contra "un crisantemo".
CULTIVAR_PARENT = "Category:Chrysanthemum (cultivars)"

# Licencias aceptables para empaquetar, de más a menos permisiva. Las que no
# estén aquí se catalogan igual pero quedan marcadas como no empaquetables.
LICENSE_TIERS = {
    "public domain": "libre",
    "cc0": "libre",
    "cc by 4.0": "atribucion",
    "cc by 3.0": "atribucion",
    "cc by 2.0": "atribucion",
    "cc by-sa 4.0": "atribucion-compartir",
    "cc by-sa 3.0": "atribucion-compartir",
    "cc by-sa 2.0": "atribucion-compartir",
}


def api(params):
    params = dict(params)
    params["format"] = "json"
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.load(r)


def strip_html(s):
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def tier_of(license_short):
    key = (license_short or "").strip().lower()
    return LICENSE_TIERS.get(key)


def harvest_category(cat, limit=200):
    """Devuelve los archivos de una categoría con sus metadatos de licencia."""
    out = []
    cont = {}
    while True:
        params = {
            "action": "query",
            "generator": "categorymembers",
            "gcmtitle": cat,
            "gcmtype": "file",
            "gcmlimit": "50",
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size|mime",
            "iiurlwidth": "1600",
        }
        params.update(cont)
        try:
            d = api(params)
        except Exception as e:
            print("  ! %s: %s" % (cat, e), file=sys.stderr)
            break

        pages = d.get("query", {}).get("pages", {})
        for _, v in pages.items():
            infos = v.get("imageinfo") or []
            if not infos:
                continue
            ii = infos[0]
            em = ii.get("extmetadata", {})
            mime = ii.get("mime", "")
            if not mime.startswith("image/"):
                continue

            lic = strip_html(em.get("LicenseShortName", {}).get("value"))
            out.append({
                "title": v["title"],
                "page": "https://commons.wikimedia.org/wiki/" + urllib.parse.quote(v["title"].replace(" ", "_")),
                "original": ii.get("url"),
                "thumb": ii.get("thumburl"),
                "width": ii.get("width"),
                "height": ii.get("height"),
                "mime": mime,
                "license": lic,
                "tier": tier_of(lic),
                "author": strip_html(em.get("Artist", {}).get("value"))[:200],
                "credit": strip_html(em.get("Credit", {}).get("value"))[:200],
                "description": strip_html(em.get("ImageDescription", {}).get("value"))[:400],
                "category": cat,
            })

        if len(out) >= limit or "continue" not in d:
            break
        cont = d["continue"]
        time.sleep(0.2)
    return out


def subcategories(parent):
    """Subcategorías directas de una categoría (una por cultivar)."""
    try:
        d = api({
            "action": "query", "generator": "categorymembers",
            "gcmtitle": parent, "gcmtype": "subcat", "gcmlimit": "500",
        })
    except Exception as e:
        print("  ! subcats %s: %s" % (parent, e), file=sys.stderr)
        return []
    return sorted(v["title"] for v in d.get("query", {}).get("pages", {}).values())


CULTIVAR_RE = re.compile(r"Chrysanthemum\s+'([^']+)'")


def main():
    cats = list(CATEGORIES)
    subs = subcategories(CULTIVAR_PARENT)
    print("· %d subcategorías de cultivar con nombre propio" % len(subs))
    cats.extend(subs)

    seen = {}
    for cat in cats:
        got = harvest_category(cat)
        if got:
            print("· %-52s %3d" % (cat.replace("Category:", "")[:52], len(got)))
        for item in got:
            # Un mismo archivo aparece en varias categorías; se conserva una
            # sola entrada y se acumulan las categorías donde vive, porque esa
            # lista es justamente la pista del color/forma de la variedad.
            t = item["title"]
            cat_name = item.pop("category")
            cultivar = None
            m = CULTIVAR_RE.search(cat_name)
            if m:
                cultivar = m.group(1)
            if t in seen:
                seen[t]["categories"].append(cat_name)
                if cultivar and not seen[t].get("cultivar"):
                    seen[t]["cultivar"] = cultivar
            else:
                item["categories"] = [cat_name]
                item["cultivar"] = cultivar
                seen[t] = item
        time.sleep(0.3)

    items = sorted(seen.values(), key=lambda x: (x["tier"] is None, -(x.get("width") or 0)))

    stats = {}
    for it in items:
        k = it["tier"] or "no-empaquetable"
        stats[k] = stats.get(k, 0) + 1

    cultivars = sorted({it["cultivar"] for it in items if it.get("cultivar")})

    catalog = {
        "source": "Wikimedia Commons",
        "harvested": time.strftime("%Y-%m-%d"),
        "note": ("Catálogo de referencia botánica. 'tier' indica qué se puede "
                 "empaquetar: libre = dominio público/CC0; atribucion = exige "
                 "crédito; atribucion-compartir = exige crédito y licencia "
                 "compartida; no-empaquetable = revisar a mano."),
        "stats": stats,
        "count": len(items),
        "cultivars": cultivars,
        "items": items,
    }

    with open("referencias-crisantemo.json", "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print("\n%d imágenes únicas · %d cultivares con nombre" % (len(items), len(cultivars)))
    for k, v in sorted(stats.items()):
        print("  %-22s %d" % (k, v))


if __name__ == "__main__":
    main()
