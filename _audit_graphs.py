import json
import re
from pathlib import Path
from PIL import Image, ImageStat

root = Path(r"D:/Proyectos/spherag_web")
fig_js = root / "figuras_data.js"
pres_js = root / "presentation_data.js"
fig_html = root / "figuras.html"
dash_html = root / "dashboard.html"
fig_dir = root / "results" / "figures"

fails = []
notes = []


def extract_window_json(path, var):
    txt = path.read_text(encoding="utf-8")
    m = re.search(rf"window\.{re.escape(var)}\s*=\s*(.*);\s*$", txt, flags=re.S)
    if not m:
        raise ValueError(f"No se encontró window.{var} en {path}")
    return json.loads(m.group(1))


def check(cond, msg):
    if not cond:
        fails.append(msg)

# Load JS payloads
try:
    fd = extract_window_json(fig_js, "FIGURAS_DATA")
except Exception as e:
    fails.append(f"figuras_data.js inválido: {e}")
    fd = {}

try:
    pd = extract_window_json(pres_js, "PRESENTATION_DATA")
except Exception as e:
    fails.append(f"presentation_data.js inválido: {e}")
    pd = {}

# figuras_data checks
if fd:
    labels = fd["wrb_class_distribution"]["labels"]
    counts = fd["wrb_class_distribution"]["counts"]
    check(len(labels) == len(counts) and len(labels) > 0, "wrb_class_distribution dimensiones inválidas")
    check(sum(counts) > 0, "wrb_class_distribution suma no positiva")

    m_labels = fd["wrb_missing_top20"]["labels"]
    m_pct = fd["wrb_missing_top20"]["pct"]
    check(len(m_labels) == len(m_pct) and len(m_labels) > 0, "wrb_missing_top20 dimensiones inválidas")
    check(all((p is None) or (0 <= p <= 100) for p in m_pct), "wrb_missing_top20 pct fuera de rango [0,100]")

    for sig in ["vwc", "temp", "vic"]:
        d = fd["missing_by_depth"][sig]["depth"]
        p = fd["missing_by_depth"][sig]["pct"]
        check(len(d) == len(p), f"missing_by_depth {sig} con longitudes distintas")

    depth = fd["profiles"]["depth"]
    check(len(depth) > 0, "profiles.depth vacío")
    for sig in ["vwc", "temp"]:
        for cls, vals in fd["profiles"][sig].items():
            check(len(vals) == len(depth), f"profiles.{sig}.{cls} longitud distinta a depth")

    cols = fd["correlation"]["columns"]
    vals = fd["correlation"]["values"]
    check(len(vals) == len(cols), "correlation filas != columnas")
    check(all(len(r) == len(cols) for r in vals), "correlation no es matriz cuadrada")

    px = fd["pca"]["x"]
    py = fd["pca"]["y"]
    pl = fd["pca"]["label"]
    check(len(px) == len(py) == len(pl) and len(px) > 0, "pca x/y/label inconsistente")

    for k in ["clay", "sand", "silt"]:
        check(len(fd["usda_hist"][k]) > 0, f"usda_hist.{k} vacío")

    sc = fd["usda_scatter"]
    check(len(sc["clay"]) == len(sc["sand"]) == len(sc["silt"]) and len(sc["clay"]) > 0, "usda_scatter inconsistente")

    lc = fd["label_coverage"]
    check((lc.get("known", 0) + lc.get("unknown", 0)) > 0, "label_coverage sin datos")

    # business notes
    total = sum(counts)
    top_idx = max(range(len(counts)), key=lambda i: counts[i])
    top_cls = labels[top_idx]
    top_pct = 100 * counts[top_idx] / total if total else 0
    notes.append(f"Clase WRB dominante: {top_cls} ({top_pct:.1f}% de {total:,} muestras)")
    notes.append(f"Cobertura de etiquetas (FIGURAS_DATA): conocidas={lc.get('known',0):,}, desconocidas={lc.get('unknown',0):,}")
    notes.append(f"Puntos USDA scatter: {len(sc['clay']):,}")

# presentation_data checks
if pd:
    wrb = pd.get("wrb", {})
    check(len(wrb.get("labels", [])) == len(wrb.get("counts", [])) and len(wrb.get("labels", [])) > 0, "presentation wrb labels/counts inválido")

    prof = pd.get("profiles", {})
    depths = prof.get("depths_cm", [])
    by_class = prof.get("by_class", {})
    check(len(depths) > 0, "presentation profiles.depths_cm vacío")
    for cls, obj in by_class.items():
        for sig in ["vwc", "temp"]:
            vals = obj.get(sig, [])
            check(len(vals) == len(depths), f"presentation by_class {cls} {sig} longitud inválida")

    un = pd.get("uncertainty", {}).get("by_signal", {})
    for sig in ["vwc", "temp"]:
        for cls, obj in un.get(sig, {}).items():
            L = len(depths)
            for k in ["median", "q1", "q3", "n"]:
                check(len(obj.get(k, [])) == L, f"uncertainty {sig}.{cls}.{k} longitud inválida")

    kr = pd.get("kruskal", {})
    for sig in ["vwc", "temp"]:
        rows = kr.get(sig, [])
        check(len(rows) > 0, f"kruskal {sig} vacío")
        for r in rows:
            check("depth_cm" in r and "n_total" in r, f"kruskal {sig} fila incompleta")
            check((r.get("n_total", -1) is not None) and (r.get("n_total", -1) >= 0), f"kruskal {sig} n_total negativo")

    usda = pd.get("usda", {})
    for key in ["depth_30_60", "depth_60_100"]:
        pts = usda.get(key, [])
        check(len(pts) > 0, f"usda {key} vacío")
        if pts:
            s = pts[0]
            for req in ["clay", "sand", "silt", "soil", "usda_class"]:
                check(req in s, f"usda {key} puntos sin {req}")

    if usda.get("depth_30_60"):
        uclasses = sorted(set(p["usda_class"] for p in usda["depth_30_60"]))
        notes.append(f"Texturas USDA distintas (30-60): {len(uclasses)}")

# PNG checks
expected = [
    "01_wrb_class_distribution.png",
    "02_wrb_class_distribution_log.png",
    "03_wrb_missing_top20.png",
    "04_missing_by_depth_signal.png",
    "05_vwc_profile_top_classes.png",
    "06_temp_profile_top_classes.png",
    "07_predictor_correlation.png",
    "08_wrb_pca_top_classes.png",
    "09_usda_targets_hist.png",
    "10_usda_texture_scatter.png",
    "11_unified_label_coverage.png",
    "12_calibration_curve.png",
    "13_decision_curve.png",
]
for name in expected:
    p = fig_dir / name
    check(p.exists(), f"Falta PNG {name}")
    if p.exists():
        try:
            with Image.open(p) as im:
                w, h = im.size
                check(w >= 400 and h >= 300, f"{name} tamaño demasiado pequeño: {w}x{h}")
                st = ImageStat.Stat(im.convert("RGB"))
                spread = sum(st.stddev)
                check(spread > 0, f"{name} parece imagen plana (sin variación)")
        except Exception as e:
            fails.append(f"{name} no se pudo abrir: {e}")

# HTML references
if fig_html.exists():
    t = fig_html.read_text(encoding="utf-8")
    check("figuras_data.js" in t and "figuras.js" in t, "figuras.html no referencia figuras_data.js y/o figuras.js")
else:
    fails.append("figuras.html no existe")

if dash_html.exists():
    t = dash_html.read_text(encoding="utf-8")
    check("presentation_data.js" in t and "dashboard.js" in t, "dashboard.html no referencia presentation_data.js y/o dashboard.js")
else:
    fails.append("dashboard.html no existe")

status = "OK" if not fails else "PROBLEMAS"
print("RESUMEN GENERAL:", status)
if fails:
    print("FALLOS:")
    for f in fails:
        print("-", f)

print("OBSERVACIONES:")
for n in notes[:8]:
    print("-", n)

print("CHECKS:", {
    "fails": len(fails),
    "notes": len(notes),
    "expected_png": len(expected),
})
