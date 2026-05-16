import json, os, re, numpy as np
from PIL import Image

def load_js(p, v):
    if not os.path.exists(p): return None
    try:
        c = open(p, "r", encoding="utf-8").read()
        m = re.search(f"window.{v}\\s*=\\s*({{.*?}});", c, re.DOTALL)
        if m: return json.loads(m.group(1))
    except: pass
    return None

def check_images(base):
    errs = []
    fd = os.path.join(base, "results/figures")
    for i in range(1, 14):
        fn = f"fig_{i:02d}.png"
        fp = os.path.join(fd, fn)
        if not os.path.exists(fp): errs.append(f"PNG: {fn} missing")
        else:
            try:
                with Image.open(fp) as img:
                    if img.size[0] < 400 or img.size[1] < 300: errs.append(f"PNG: {fn} too small")
                    if np.std(np.array(img.convert(\"L\"))) == 0: errs.append(f"PNG: {fn} flat")
            except: errs.append(f"PNG: {fn} open error")
    return errs

base = "D:/Proyectos/spherag_web"
f_data = load_js(os.path.join(base, "figuras_data.js"), "FIGURAS_DATA")
p_data = load_js(os.path.join(base, "presentation_data.js"), "PRESENTATION_DATA")

errs = []
if not f_data: errs.append("figuras_data.js invalid")
if not p_data: errs.append("presentation_data.js invalid")
errs += check_images(base)

for h, s_list in {"figuras.html":["figuras_data.js","figuras.js"], "dashboard.html":["presentation_data.js","dashboard.js"]}.items():
    hp = os.path.join(base, h)
    if not os.path.exists(hp): errs.append(f"HTML: {h} missing")
    else:
        hc = open(hp, "r", encoding="utf-8").read()
        for s in s_list:
            if s not in hc: errs.append(f"HTML: {h} no {s}")

print("RESUMEN GENERAL:", "OK" if not errs else "PROBLEMAS")
for e in errs: print(f"- {e}")

if f_data and p_data:
    print("\nOBSERVACIONES DE NEGOCIO:")
    # Balance
    c = f_data.get("wrb_class_distribution", {}).get("counts", [])
    if c: print(f"- Balance WRB: {'Ok' if (None if len(c)<2 else np.std(c)/np.mean(c)) < 1 else 'Desbalanceado'}")
    # Coverage
    cov = f_data.get("label_coverage", {})
    t = cov.get("known",0)+cov.get("unknown",1)
    print(f"- Cobertura etiquetas: {cov.get('known',0)/t*100:.1f}%")
    # Missing
    m = f_data.get("wrb_missing_top20", {}).get("pct", [])
    print(f"- Max missing: {max(m) if m else 0:.1f}%")
    # Significant
    kp = p_data.get("kruskal", {}).get("vwc", {}).get("p_value")
    print(f"- Diferencias VWC: {'Significativas' if kp is not None and kp < 0.05 else 'No significativas'}")
    # Textures
    tx = len(set(p.get("usda_class") for p in p_data.get("usda",{}).get("depth_30_60",[]) if "usda_class" in p))
    print(f"- Texturas USDA (30-60cm): {tx}")
    # Data range
    d = p_data.get("profiles", {}).get("depths_cm", [])
    if d: print(f"- Rango monitorizacion: {min(d)}-{max(d)} cm")
