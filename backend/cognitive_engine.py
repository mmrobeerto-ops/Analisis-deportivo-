class CognitiveEngine:
    def __init__(self):
        pass

    def calcular_nivel_100(self, score_fisico, score_iq, score_tactica):
        """Calcula el índice Nivel 100 100 100."""
        # Se asume que los scores vienen en base 100
        total = (score_fisico + score_iq + score_tactica) / 3
        return {
            "score_fisico": score_fisico,
            "score_iq": score_iq,
            "score_tactica": score_tactica,
            "nivel_global": round(total, 2)
        }

    def diagnosticar_error(self, escaneo_previo: bool, decision_correcta: bool, ejecucion_tecnica: bool):
        """Diagnostica la causa raíz del error basado en la matriz lógica."""
        if not escaneo_previo:
            return {"causa_raiz": "FALLA_PERCEPCION_OJOS", "zona_desarrollo": "ZDPt"}
        elif escaneo_previo and not decision_correcta:
            return {"causa_raiz": "FALLA_TACTICA_CABEZA", "zona_desarrollo": "ZDPt"}
        elif escaneo_previo and decision_correcta and not ejecucion_tecnica:
            return {"causa_raiz": "FALLA_TECNICA_PIES", "zona_desarrollo": "ZDPx"}
        else:
            return {"causa_raiz": "CONSOLIDADO", "zona_desarrollo": "ZDR"}

    def prescribir_microciclo(self, falla_dominante: str, sub_etapa: str):
        """Selecciona la tarea de entrenamiento (Receta del DT)."""
        # Mapeo básico según la regla especificada
        if falla_dominante == "FALLA_PERCEPCION_OJOS" and sub_etapa == "Ego II":
            return {
                "estrategia_mbp": "#4",
                "tarea": "Rondo Condicionado con Estímulo Visual",
                "mindset": "Audio de Meditación de Enfoque"
            }
        elif falla_dominante == "FALLA_TACTICA_CABEZA" and sub_etapa == "Suma I":
            return {
                "estrategia_mbp": "#6 o #9",
                "tarea": "Juego de Posición / Oposición Encadenada",
                "mindset": "Meditación de Visualización"
            }
        
        # Default fallback
        return {
            "estrategia_mbp": "Por definir",
            "tarea": "Trabajo Específico Analítico",
            "mindset": "Audio Estandar"
        }
