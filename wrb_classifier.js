// WRB Classifier based on JRip rules
// Translated from Python to JavaScript

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

function classifyWRB(sensor) {
    // Example rules (priority R1 > R2 > ... > R7)
    if (sensor.vwc30cm >= 3.17 && sensor.vwc30cm <= 7.175) {
        return { id: sensor.id, soilType: "Calcisols", rule: "R1: 3.17<=vwc30<=7.175" };
    }

    // Add more rules as needed

    return { id: sensor.id, soilType: "Unknown", rule: "No matching rule" };
}

// Export the class and function for use in other modules
module.exports = { SensorReading, classifyWRB };