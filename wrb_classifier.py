"""
Clasificador WRB basado en reglas JRip — Sensores Sentek
=========================================================
Origen de las reglas: results/clips_jrip_sentek_1000.clp
Algoritmo: JRip (RIPPER) entrenado en Weka con sentek_wrb_classify_ready.csv

Campos de entrada (los mismos slots del deftemplate CLIPS):
    id          : int   — identificador del sensor
    depth       : float — profundidad del sensor (cm)
    vwc_10cm    : float — humedad volumetrica a 10 cm (%)
    vwc_30cm    : float — humedad volumetrica a 30 cm (%)
    vwc_40cm    : float — humedad volumetrica a 40 cm (%)
    vwc_60cm    : float — humedad volumetrica a 60 cm (%)
    vic_70cm    : float — conductividad ionica a 70 cm (uS/cm), -1.0 si no disponible
    vic_80cm    : float — conductividad ionica a 80 cm (uS/cm), -1.0 si no disponible
    has_vic     : float — 1.0 si el sensor tiene canal VIC activo, 0.0 / -1.0 si no

Uso rapido:
    from wrb_classifier import classify_wrb
    resultado = classify_wrb(id=1, depth=10, vwc_10cm=0.02, vwc_30cm=5.0,
                              vwc_40cm=10.0, vwc_60cm=20.0,
                              vic_70cm=-1.0, vic_80cm=-1.0, has_vic=0.0)
    print(resultado)
    # {'id': 1, 'soil_type': 'Calcisols', 'rule': 'R1: 3.17<=vwc30<=7.175'}
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional
import pandas as pd


# ---------------------------------------------------------------------------
# Dataclass que representa una lectura de sensor
# ---------------------------------------------------------------------------
@dataclass
class SensorReading:
    id:       int
    depth:    float = -1.0
    vwc_10cm: float = -1.0
    vwc_30cm: float = -1.0
    vwc_40cm: float = -1.0
    vwc_60cm: float = -1.0
    vic_70cm: float = -1.0   # centinela -1.0 = canal no disponible
    vic_80cm: float = -1.0   # centinela -1.0 = canal no disponible
    has_vic:  float = -1.0   # 1.0 = tiene VIC activo, <= 0 = no tiene


# ---------------------------------------------------------------------------
# Motor de reglas JRip (prioridad R1 > R2 > ... > R7)
# Las condiciones son exactas a las del fichero .clp
# ---------------------------------------------------------------------------
def classify_wrb(
    id: int,
    depth: float    = -1.0,
    vwc_10cm: float = -1.0,
    vwc_30cm: float = -1.0,
    vwc_40cm: float = -1.0,
    vwc_60cm: float = -1.0,
    vic_70cm: float = -1.0,
    vic_80cm: float = -1.0,
    has_vic:  float = -1.0,
) -> dict:
    """
    Aplica las 7 reglas JRip-WRB en orden de prioridad.
    Devuelve un dict con: id, soil_type, rule, coverage_errors.
    """

    # R1 — Calcisols: humedad a 30 cm en rango calcareo [3.17, 7.175]
    if vwc_30cm != -1.0 and 3.17 <= vwc_30cm <= 7.175:
        return {
            "id": id,
            "soil_type": "Calcisols",
            "rule": "R1: 3.17 <= vwc_30cm <= 7.175",
            "coverage_errors": "39/0",
            "interpretation": "Horizonte petroCalcico (Bk) seco — baja porosidad util por carbonatos",
        }

    # R2 — Calcisols: conductividad ionica baja a 80 cm
    # Nota: el centinela -1.0 satisface esta condicion (<= 157.92)
    if vic_80cm <= 157.92:
        return {
            "id": id,
            "soil_type": "Calcisols",
            "rule": "R2: vic_80cm <= 157.92",
            "coverage_errors": "7/0",
            "interpretation": "Baja conductividad ionica en horizonte profundo (o sensor sin canal VIC-80)",
        }

    # R3 — Arenosols: humedad superficial casi nula y sonda a <= 10 cm
    if vwc_10cm <= 0.029565 and depth <= 10.0:
        return {
            "id": id,
            "soil_type": "Arenosols",
            "rule": "R3: vwc_10cm <= 0.030 AND depth <= 10",
            "coverage_errors": "94/0",
            "interpretation": "Macroporosidad elevada — drenaje rapido, humedad superficial casi nula",
        }

    # R4 — Fluvisols: alta conductividad ionica a 70 cm
    if vic_70cm >= 191.233846:
        return {
            "id": id,
            "soil_type": "Fluvisols",
            "rule": "R4: vic_70cm >= 191.23",
            "coverage_errors": "95/0",
            "interpretation": "Acumulacion de sales y minerales aluviales en horizonte profundo",
        }

    # R5 — Luvisols: perfil hidrico moderado sin canal VIC activo
    if vwc_40cm >= 8.053333 and vwc_60cm <= 38.483333 and has_vic <= 0.0:
        return {
            "id": id,
            "soil_type": "Luvisols",
            "rule": "R5: vwc_40cm >= 8.05 AND vwc_60cm <= 38.48 AND has_vic <= 0",
            "coverage_errors": "329/0",
            "interpretation": "Iluviacion de arcillas (horizonte Bt) — sensor sin canal VIC",
        }

    # R6 — Luvisols: alta humedad superficial (saturacion por horizonte Bt)
    if vwc_10cm >= 35.983333:
        return {
            "id": id,
            "soil_type": "Luvisols",
            "rule": "R6: vwc_10cm >= 35.98",
            "coverage_errors": "30/0",
            "interpretation": "Saturacion superficial temporal por horizonte argilico Bt",
        }

    # R7 — Cambisols: regla por defecto (ninguna condicion anterior cumplida)
    return {
        "id": id,
        "soil_type": "Cambisols",
        "rule": "R7: default",
        "coverage_errors": "6997/9",
        "interpretation": "Suelo pardo poco desarrollado — sin patron diferenciador",
    }


def classify_from_row(row) -> dict:
    """Clasifica una fila de un DataFrame o dict con los nombres de columna del CSV."""
    def get(col):
        val = row.get(col, -1.0) if hasattr(row, "get") else getattr(row, col, -1.0)
        try:
            return float(val)
        except (TypeError, ValueError):
            return -1.0

    return classify_wrb(
        id       = int(get("id") if hasattr(row, "get") else getattr(row, "id", 0)),
        depth    = get("sensor_depth_cm"),
        vwc_10cm = get("mean_vwc_10cm"),
        vwc_30cm = get("mean_vwc_30cm"),
        vwc_40cm = get("mean_vwc_40cm"),
        vwc_60cm = get("mean_vwc_60cm"),
        vic_70cm = get("mean_vic_70cm"),
        vic_80cm = get("mean_vic_80cm"),
        has_vic  = get("sensor_has_vic"),
    )


def classify_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Aplica el clasificador WRB a todo un DataFrame.
    Devuelve el DataFrame original con columnas nuevas:
        wrb_predicted, wrb_rule, wrb_interpretation
    """
    results = df.apply(classify_from_row, axis=1, result_type="expand")
    df = df.copy()
    df["wrb_predicted"]     = results["soil_type"]
    df["wrb_rule"]          = results["rule"]
    df["wrb_interpretation"] = results["interpretation"]
    return df


# ---------------------------------------------------------------------------
# Ejecucion directa: clasifica sentek_wrb_classify_ready.csv
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import os
    from pathlib import Path

    root = Path(__file__).parent
    csv_path = root / "sentek_wrb_classify_ready.csv"

    if not csv_path.exists():
        print(f"No se encuentra {csv_path}")
    else:
        df = pd.read_csv(csv_path, na_values=["?"])
        # Asignar id si no existe
        if "id" not in df.columns:
            df.insert(0, "id", range(1, len(df) + 1))

        df_result = classify_dataframe(df)

        print("\n=== Distribucion de clases WRB (reglas JRip) ===")
        print(df_result["wrb_predicted"].value_counts().to_string())

        print("\n=== Reglas disparadas ===")
        print(df_result["wrb_rule"].value_counts().to_string())

        if "soil_type_1" in df_result.columns:
            correct = (df_result["wrb_predicted"] == df_result["soil_type_1"]).sum()
            total   = len(df_result)
            print(f"\n=== Accuracy vs etiqueta real: {correct}/{total} ({100*correct/total:.2f}%) ===")

        out = root / "results" / "wrb_predictions.csv"
        df_result[["id","wrb_predicted","wrb_rule","wrb_interpretation"]].to_csv(out, index=False)
        print(f"\nResultados guardados en: {out}")
