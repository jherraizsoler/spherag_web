// USDA Soil Classification Predictive Model
// Translated from Python to JavaScript

// Helper functions to handle null values
function GTE(value, limit) {
    return value !== null && value >= limit;
}

function LTE(value, limit) {
    return value !== null && value <= limit;
}

// Main function to predict soil type
function predictSoilType(
    avgHum10cm, avgHum50cm,
    rangeHum10cm, rangeHum50cm,
    avgTemp10cm, rangeTemp10cm,
    dryRate10cm, dryRate50cm
) {
    // Rules for "Sand" (High Priority)
    if (LTE(avgHum10cm, 0.0813) && LTE(rangeTemp10cm, 1.725) && GTE(avgTemp10cm, 25.5783)) {
        return "Sand";
    } else if (GTE(avgTemp10cm, 23.4978) && LTE(avgHum10cm, 0.0) && LTE(rangeTemp10cm, 0.3193)) {
        return "Sand";
    } else if (GTE(avgTemp10cm, 22.75) && LTE(avgHum10cm, 0.0) && LTE(rangeTemp10cm, 1.9971) && GTE(rangeTemp10cm, 0.57)) {
        return "Sand";
    }

    // Rules for "Loamy Sand" (Medium Priority)
    if (GTE(avgHum50cm, 17.8033) && LTE(avgHum50cm, 24.2583) && LTE(avgHum10cm, 21.9567) && GTE(avgHum10cm, 11.1333)) {
        return "Loamy Sand";
    } else if (GTE(avgHum50cm, 18.6333) && LTE(avgHum50cm, 23.89) && LTE(rangeTemp10cm, 1.22) && GTE(dryRate10cm, 0.015)) {
        return "Loamy Sand";
    } else if (GTE(avgHum50cm, 18.6333) && LTE(avgHum50cm, 24.6256) && GTE(rangeHum10cm, 0.33) && LTE(rangeTemp10cm, 2.41)) {
        return "Loamy Sand";
    } else if (LTE(avgHum50cm, 27.7667) && GTE(avgHum10cm, 20.5867) && GTE(avgHum50cm, 20.9933)) {
        return "Loamy Sand";
    } else if (GTE(avgHum50cm, 18.86) && LTE(avgHum50cm, 20.7833) && GTE(dryRate50cm, 0.01) && GTE(rangeHum10cm, 0.03)) {
        return "Loamy Sand";
    }

    // Default case
    return "Unknown";
}

// Export the function for use in other modules
module.exports = { predictSoilType };
