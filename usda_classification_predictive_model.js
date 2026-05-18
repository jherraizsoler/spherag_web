/**
 * Evalúa los datos estadísticos de telemetría y devuelve la clase USDA.
 * Implementa las reglas extraídas del modelo JRIP.
 * Soporta valores nulos (null o undefined) pasándolos por alto de forma segura.
 */
function predecir_suelo(media_hum_10cm, media_hum_50cm, 
                        rango_hum_10cm, rango_hum_50cm, 
                        media_temp_10cm, rango_temp_10cm, 
                        vel_secado_10cm, vel_secado_50cm) {
    
    // FUNCIONES AUXILIARES PARA MANEJAR NULOS
    const GTE = (valor, limite) => valor != null && valor >= limite;
    const LTE = (valor, limite) => valor != null && valor <= limite;

    // REGLAS PARA LA ARENA (Prioridad Alta)
    // Regla 1 (Cubre 74 casos)
    if (LTE(media_hum_10cm, 0.0813) && LTE(rango_temp_10cm, 1.725) && GTE(media_temp_10cm, 25.5783)) {
        return "Arena";
    }
    // Regla 2 (Cubre 8 casos)
    else if (GTE(media_temp_10cm, 23.4978) && LTE(media_hum_10cm, 0.0) && LTE(rango_temp_10cm, 0.3193)) {
        return "Arena";
    }
    // Regla 3 (Cubre 17 casos)
    else if (GTE(media_temp_10cm, 22.75) && LTE(media_hum_10cm, 0.0) && LTE(rango_temp_10cm, 1.9971) && GTE(rango_temp_10cm, 0.57)) {
        return "Arena";
    }

    // REGLAS PARA FRANCO ARCILLO-ARENOSO (Prioridad Media)    
    // Regla 4 (Cubre 1767 casos)
    else if (GTE(media_hum_50cm, 17.8033) && LTE(media_hum_50cm, 24.2583) && LTE(media_hum_10cm, 21.9567) && GTE(media_hum_10cm, 11.1333)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 5 (Cubre 653 casos)
    else if (GTE(media_hum_50cm, 18.6333) && LTE(media_hum_50cm, 23.89) && LTE(rango_temp_10cm, 1.22) && GTE(vel_secado_10cm, 0.015)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 6 (Cubre 234 casos)
    else if (GTE(media_hum_50cm, 18.6333) && LTE(media_hum_50cm, 24.6256) && GTE(rango_hum_10cm, 0.33) && LTE(rango_temp_10cm, 2.41)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 7 (Cubre 273 casos)
    else if (LTE(media_hum_50cm, 27.7667) && GTE(media_hum_10cm, 20.5867) && GTE(media_hum_50cm, 20.9933)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 8 (Cubre 106 casos)
    else if (GTE(media_hum_50cm, 18.86) && LTE(media_hum_50cm, 20.7833) && GTE(vel_secado_50cm, 0.01) && GTE(rango_hum_10cm, 0.03)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 9 (Cubre 48 casos)
    else if (LTE(media_hum_50cm, 20.7833) && GTE(media_hum_50cm, 19.15) && LTE(media_temp_10cm, 10.3033)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 10 (Cubre 26 casos)
    else if (LTE(media_hum_50cm, 20.5067) && GTE(media_hum_50cm, 19.1933) && LTE(media_hum_10cm, 25.2133)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 11 (Cubre 18 casos)
    else if (GTE(media_temp_10cm, 20.9933) && LTE(media_hum_50cm, 20.1767) && GTE(rango_hum_50cm, 0.03)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 12 (Cubre 8 casos)
    else if (GTE(rango_hum_50cm, 0.01) && GTE(rango_hum_10cm, 0.48) && LTE(rango_hum_50cm, 0.01)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 13 (Cubre 7 casos)
    else if (GTE(rango_hum_50cm, 0.01) && LTE(media_hum_50cm, 20.8033) && GTE(media_hum_10cm, 27.8567)) {
        return "Franco Arcillo-Arenoso";
    }
    // Regla 14 (Cubre 3 casos)
    else if (GTE(media_hum_50cm, 19.9767) && LTE(media_hum_50cm, 20.33) && GTE(rango_hum_10cm, 0.2) && LTE(rango_hum_10cm, 0.26)) {
        return "Franco Arcillo-Arenoso";
    }

    // REGLA POR DEFECTO (Prioridad Baja)
    // Regla 15 (Cubre 6911 casos). Si nada de lo anterior se cumple:
    else {
        return "Franco Arcilloso";
    }
}