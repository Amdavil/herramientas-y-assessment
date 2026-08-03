#!/usr/bin/env python3
"""
Índice visual del banco de referencias: una hoja de contactos con el nombre
del cultivar bajo cada foto, para poder recorrer 139 imágenes de un vistazo
en vez de abrirlas una por una.
"""
import json
import os

from PIL import Image, ImageDraw, ImageFont

SRC = "../assets/referencias"
COLS = 8
CELL = 240
LABEL = 26
PAD = 6
BG = (18, 18, 20)
FG = (238, 232, 235)
DIM = (150, 145, 150)


def font(size):
    for p in (r"C:\Windows\Fonts\segoeui.ttf", r"C:\Windows\Fonts\arial.ttf"):
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def main():
    with open(os.path.join(SRC, "CREDITOS.json"), encoding="utf-8") as f:
        items = json.load(f)["items"]

    # Con cultivar primero y agrupados por nombre: así la hoja se lee como
    # un catálogo de variedades y no como un volcado de archivos.
    items.sort(key=lambda i: (i.get("cultivar") is None, (i.get("cultivar") or "").lower()))

    have = [i for i in items if os.path.exists(os.path.join(SRC, i["file"]))]
    rows = (len(have) + COLS - 1) // COLS
    W = COLS * (CELL + PAD) + PAD
    H = rows * (CELL + LABEL + PAD) + PAD + 46

    sheet = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(sheet)
    f_title, f_lab = font(21), font(13)
    d.text((PAD + 4, 13),
           "Referencias de crisantemo · %d imágenes · Wikimedia Commons "
           "(uso interno, ver CREDITOS.json)" % len(have),
           fill=FG, font=f_title)

    for n, it in enumerate(have):
        r, c = divmod(n, COLS)
        x = PAD + c * (CELL + PAD)
        y = 46 + PAD + r * (CELL + LABEL + PAD)
        try:
            im = Image.open(os.path.join(SRC, it["file"])).convert("RGB")
        except Exception:
            continue
        # recorte cuadrado centrado: preserva la flor, no la deforma
        w, h = im.size
        s = min(w, h)
        im = im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))
        im = im.resize((CELL, CELL), Image.LANCZOS)
        sheet.paste(im, (x, y))

        name = it.get("cultivar") or "—"
        d.text((x + 2, y + CELL + 5), name[:30], fill=FG if it.get("cultivar") else DIM,
               font=f_lab)

    out = "../assets/referencias/_INDICE.jpg"
    sheet.save(out, "JPEG", quality=82, optimize=True)
    print("%s  (%dx%d, %d imágenes)" % (out, W, H, len(have)))


if __name__ == "__main__":
    main()
