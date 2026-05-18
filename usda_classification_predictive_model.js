// USDA Soil Classification Predictive Model
// Faithful translation from usda_classification_predictive_model.py

function isValidNumber(value) {
    return value !== null && value !== undefined && !Number.isNaN(value);
}

function GTE(value, limit) {
    return isValidNumber(value) && value >= limit;
}

function LTE(value, limit) {
    return isValidNumber(value) && value <= limit;
}

function predictSoilType(
    avgHum10cm,
    avgHum50cm,
    rangeHum10cm,
    rangeHum50cm,
    avgTemp10cm,
    rangeTemp10cm,
    dryRate10cm,
    dryRate50cm
) {
    // Rules 1-3: Arena
    if (LTE(avgHum10cm, 0.0813) && LTE(rangeTemp10cm, 1.725) && GTE(avgTemp10cm, 25.5783)) {
        return "Arena";
    } else if (GTE(avgTemp10cm, 23.4978) && LTE(avgHum10cm, 0.0) && LTE(rangeTemp10cm, 0.3193)) {
        return "Arena";
    } else if (GTE(avgTemp10cm, 22.75) && LTE(avgHum10cm, 0.0) && LTE(rangeTemp10cm, 1.9971) && GTE(rangeTemp10cm, 0.57)) {
        return "Arena";
    }

    // Rules 4-14: Franco Arcillo-Arenoso
    else if (GTE(avgHum50cm, 17.8033) && LTE(avgHum50cm, 24.2583) && LTE(avgHum10cm, 21.9567) && GTE(avgHum10cm, 11.1333)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(avgHum50cm, 18.6333) && LTE(avgHum50cm, 23.89) && LTE(rangeTemp10cm, 1.22) && GTE(dryRate10cm, 0.015)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(avgHum50cm, 18.6333) && LTE(avgHum50cm, 24.6256) && GTE(rangeHum10cm, 0.33) && LTE(rangeTemp10cm, 2.41)) {
        return "Franco Arcillo-Arenoso";
    } else if (LTE(avgHum50cm, 27.7667) && GTE(avgHum10cm, 20.5867) && GTE(avgHum50cm, 20.9933)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(avgHum50cm, 18.86) && LTE(avgHum50cm, 20.7833) && GTE(dryRate50cm, 0.01) && GTE(rangeHum10cm, 0.03)) {
        return "Franco Arcillo-Arenoso";
    } else if (LTE(avgHum50cm, 20.7833) && GTE(avgHum50cm, 19.15) && LTE(avgTemp10cm, 10.3033)) {
        return "Franco Arcillo-Arenoso";
    } else if (LTE(avgHum50cm, 20.5067) && GTE(avgHum50cm, 19.1933) && LTE(avgHum10cm, 25.2133)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(avgTemp10cm, 20.9933) && LTE(avgHum50cm, 20.1767) && GTE(rangeHum50cm, 0.03)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(rangeHum50cm, 0.01) && GTE(rangeHum10cm, 0.48) && LTE(rangeHum50cm, 0.01)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(rangeHum50cm, 0.01) && LTE(avgHum50cm, 20.8033) && GTE(avgHum10cm, 27.8567)) {
        return "Franco Arcillo-Arenoso";
    } else if (GTE(avgHum50cm, 19.9767) && LTE(avgHum50cm, 20.33) && GTE(rangeHum10cm, 0.2) && LTE(rangeHum10cm, 0.26)) {
        return "Franco Arcillo-Arenoso";
    }

    // Rule 15 (default)
    return "Franco Arcilloso";
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { predictSoilType };
}
