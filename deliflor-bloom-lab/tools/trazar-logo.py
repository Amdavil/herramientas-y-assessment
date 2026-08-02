#!/usr/bin/env python3
"""
Vectoriza el isotipo oficial de Deliflor a trazados SVG.

Se parte del favicon 270x270 publicado por la propia empresa, que es el
glifo aislado y limpio. Reconstruirlo a ojo con curvas inventadas nunca
iba a coincidir; esto sigue el contorno real del mapa de bits.

Salida: los dos atributos `d` (óvalo rojo y asta azul) normalizados a un
lienzo de 100x210, listos para pegar en js/app.js.
"""
import math
import sys

from PIL import Image

SRC = "fav270.png"
# Colores muestreados del propio archivo.
BLUE = (0x22, 0x3A, 0x77)
RED = (0xE7, 0x2E, 0x3B)
TOL = 90


def mask_of(im, target):
    w, h = im.size
    px = im.load()
    m = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            d = abs(r - target[0]) + abs(g - target[1]) + abs(b - target[2])
            if d < TOL:
                m[y][x] = True
    return m, w, h


def components(m, w, h):
    """Regiones conexas (4-vecinos), de mayor a menor."""
    seen = [[False] * w for _ in range(h)]
    out = []
    for y in range(h):
        for x in range(w):
            if not m[y][x] or seen[y][x]:
                continue
            stack, cells = [(x, y)], []
            seen[y][x] = True
            while stack:
                cx, cy = stack.pop()
                cells.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < w and 0 <= ny < h and m[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            out.append(cells)
    out.sort(key=len, reverse=True)
    return out


def trace(cells, w, h):
    """Contorno exterior por seguimiento de Moore."""
    s = set(cells)
    start = min(cells, key=lambda p: (p[1], p[0]))
    # 8 vecinos en orden horario desde el oeste
    nb = [(-1, 0), (-1, -1), (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1)]
    contour = [start]
    cur, bdir = start, 0
    guard = 0
    while guard < 100000:
        guard += 1
        found = False
        for k in range(8):
            i = (bdir + k) % 8
            nxt = (cur[0] + nb[i][0], cur[1] + nb[i][1])
            if nxt in s:
                # se retrocede para seguir pegado al borde
                bdir = (i + 5) % 8
                cur = nxt
                contour.append(cur)
                found = True
                break
        if not found:
            break
        if cur == start and len(contour) > 3:
            break
    return contour


def rdp_closed(pts, eps):
    """RDP sobre un contorno CERRADO.

    Aplicar RDP directamente a un contorno cerrado no funciona: como el
    primer punto y el último coinciden, el segmento de referencia tiene
    longitud cero, todas las distancias salen 0 y la curva entera se
    colapsa a dos puntos. Hay que partirlo en dos arcos abiertos primero.
    """
    if len(pts) > 1 and pts[0] == pts[-1]:
        pts = pts[:-1]
    if len(pts) < 4:
        return pts
    a = pts[0]
    far = max(range(len(pts)), key=lambda i: (pts[i][0] - a[0]) ** 2 + (pts[i][1] - a[1]) ** 2)
    first = rdp(pts[:far + 1], eps)
    second = rdp(pts[far:] + [pts[0]], eps)
    return first[:-1] + second[:-1]


def rdp(pts, eps):
    """Simplificación Ramer-Douglas-Peucker sobre una polilínea abierta."""
    if len(pts) < 3:
        return pts
    a, b = pts[0], pts[-1]
    dx, dy = b[0] - a[0], b[1] - a[1]
    n = math.hypot(dx, dy) or 1e-9
    worst, wi = 0, 0
    for i in range(1, len(pts) - 1):
        p = pts[i]
        d = abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / n
        if d > worst:
            worst, wi = d, i
    if worst <= eps:
        return [a, b]
    return rdp(pts[:wi + 1], eps)[:-1] + rdp(pts[wi:], eps)


def smooth_path(pts, sx, sy, ox, oy):
    """Polígono cerrado -> curvas cúbicas (Catmull-Rom convertido a Bézier).

    Sin esto el contorno queda facetado al ampliarlo, que es justo lo que se
    nota en el logo de una marca.
    """
    P = [((p[0] - ox) * sx, (p[1] - oy) * sy) for p in pts]
    n = len(P)
    if n < 3:
        return ""
    d = "M%.2f %.2f" % P[0]
    for i in range(n):
        p0 = P[(i - 1) % n]
        p1 = P[i]
        p2 = P[(i + 1) % n]
        p3 = P[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d += "C%.2f %.2f,%.2f %.2f,%.2f %.2f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    return d + "Z"


def main():
    im = Image.open(SRC).convert("RGBA")
    parts = {}
    for name, col in (("blue", BLUE), ("red", RED)):
        m, w, h = mask_of(im, col)
        comps = components(m, w, h)
        if not comps:
            print("sin región para", name, file=sys.stderr)
            continue
        parts[name] = (comps, w, h)

    # Encuadre común: la caja que contiene todo, con un poco de aire.
    allc = [p for name in parts for c in parts[name][0] for p in c]
    minx = min(p[0] for p in allc); maxx = max(p[0] for p in allc)
    miny = min(p[1] for p in allc); maxy = max(p[1] for p in allc)
    bw, bh = maxx - minx, maxy - miny
    # Se normaliza a 100 de ancho conservando la proporción real.
    sx = 100.0 / bw
    sy = sx
    print("caja original: %dx%d  ->  100 x %.1f" % (bw, bh, bh * sy))
    print()

    for name in ("red", "blue"):
        if name not in parts:
            continue
        comps, w, h = parts[name]
        for j, cells in enumerate(comps):
            if len(cells) < 60:
                continue
            cont = trace(cells, w, h)
            simp = rdp_closed(cont, 0.7)
            d = smooth_path(simp, sx, sy, minx, miny)
            print("/* %s #%d — %d px, %d puntos */" % (name, j, len(cells), len(simp)))
            print(d)
            print()


if __name__ == "__main__":
    main()
