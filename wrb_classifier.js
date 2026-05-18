// WRB Classifier based on JRip rules
// Faithful translation from wrb_classifier.py

class SensorReading {
    constructor(id, depth = -1.0, vwc10cm = -1.0, vwc30cm = -1.0, vwc40cm = -1.0, vwc60cm = -1.0, vic70cm = -1.0, vic80cm = -1.0, hasVic = -1.0) {
        this.id = id;
        this.depth = depth;
        this.vwc10cm = vwc10cm;
        this.vwc30cm = vwc30cm;
        this.vwc40cm = vwc40cm;
        this.vwc60cm = vwc60cm;
        this.vic70cm = vic70cm;
        this.vic80cm = vic80cm;
        this.hasVic = hasVic;
    }
}

function toNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSensor(sensor) {
    return {
        id: toNumber(sensor.id, 0),
        depth: toNumber(sensor.depth, -1.0),
        vwc10cm: toNumber(sensor.vwc10cm ?? sensor.vwc_10cm, -1.0),
        vwc30cm: toNumber(sensor.vwc30cm ?? sensor.vwc_30cm, -1.0),
        vwc40cm: toNumber(sensor.vwc40cm ?? sensor.vwc_40cm, -1.0),
        vwc60cm: toNumber(sensor.vwc60cm ?? sensor.vwc_60cm, -1.0),
        vic70cm: toNumber(sensor.vic70cm ?? sensor.vic_70cm, -1.0),
        vic80cm: toNumber(sensor.vic80cm ?? sensor.vic_80cm, -1.0),
        hasVic: toNumber(sensor.hasVic ?? sensor.has_vic, -1.0)
    };
}

function classifyWRB(sensor) {
    const s = normalizeSensor(sensor);

    // Rules ordered by priority (R1 > R2 > ... > R7)
    if (s.vwc30cm !== -1.0 && s.vwc30cm >= 3.17 && s.vwc30cm <= 7.175) {
        return {
            id: s.id,
            soilType: "Calcisols",
            soil_type: "Calcisols",
            rule: "R1: 3.17 <= vwc_30cm <= 7.175",
            coverage_errors: "39/0",
            interpretation: "Horizonte petroCalcico (Bk) seco - baja porosidad util por carbonatos"
        };
    }

    if (s.vic80cm <= 157.92) {
        return {
            id: s.id,
            soilType: "Calcisols",
            soil_type: "Calcisols",
            rule: "R2: vic_80cm <= 157.92",
            coverage_errors: "7/0",
            interpretation: "Baja conductividad ionica en horizonte profundo (o sensor sin canal VIC-80)"
        };
    }

    if (s.vwc10cm <= 0.029565 && s.depth <= 10.0) {
        return {
            id: s.id,
            soilType: "Arenosols",
            soil_type: "Arenosols",
            rule: "R3: vwc_10cm <= 0.030 AND depth <= 10",
            coverage_errors: "94/0",
            interpretation: "Macroporosidad elevada - drenaje rapido, humedad superficial casi nula"
        };
    }

    if (s.vic70cm >= 191.233846) {
        return {
            id: s.id,
            soilType: "Fluvisols",
            soil_type: "Fluvisols",
            rule: "R4: vic_70cm >= 191.23",
            coverage_errors: "95/0",
            interpretation: "Acumulacion de sales y minerales aluviales en horizonte profundo"
        };
    }

    if (s.vwc40cm >= 8.053333 && s.vwc60cm <= 38.483333 && s.hasVic <= 0.0) {
        return {
            id: s.id,
            soilType: "Luvisols",
            soil_type: "Luvisols",
            rule: "R5: vwc_40cm >= 8.05 AND vwc_60cm <= 38.48 AND has_vic <= 0",
            coverage_errors: "329/0",
            interpretation: "Iluviacion de arcillas (horizonte Bt) - sensor sin canal VIC"
        };
    }

    if (s.vwc10cm >= 35.983333) {
        return {
            id: s.id,
            soilType: "Luvisols",
            soil_type: "Luvisols",
            rule: "R6: vwc_10cm >= 35.98",
            coverage_errors: "30/0",
            interpretation: "Saturacion superficial temporal por horizonte argilico Bt"
        };
    }

    return {
        id: s.id,
        soilType: "Cambisols",
        soil_type: "Cambisols",
        rule: "R7: default",
        coverage_errors: "6997/9",
        interpretation: "Suelo pardo poco desarrollado - sin patron diferenciador"
    };
}

// Export the class and function for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SensorReading, classifyWRB };
}