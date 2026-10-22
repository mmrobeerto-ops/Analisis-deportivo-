import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import time

class HeadScanDetector:
    def __init__(self, history_seconds=3.0, fps=30):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.history_frames = int(history_seconds * fps)
        # Cola para almacenar el historial de angulos yaw
        self.yaw_history = deque(maxlen=self.history_frames)

    def estimate_yaw(self, face_landmarks, image_width):
        """Estima el ángulo Yaw (giro izquierda/derecha) usando Face Mesh."""
        # Índices aproximados: 1 (Punta nariz), 234 (Borde izquierdo), 454 (Borde derecho)
        nariz = face_landmarks.landmark[1]
        borde_izq = face_landmarks.landmark[234]
        borde_der = face_landmarks.landmark[454]
        
        # Proporción de la distancia de la nariz al borde izquierdo vs el ancho total de la cara
        ancho_cara = borde_der.x - borde_izq.x
        if ancho_cara == 0: return 0
        
        # Cuando la nariz está en el centro, la proporción es ~0.5
        # Si mira a la derecha, la proporción aumenta. Si mira a la izquierda, disminuye.
        proporcion = (nariz.x - borde_izq.x) / ancho_cara
        
        # Mapeamos la proporción [0, 1] a grados aproximados [-90, 90]
        # Asumiendo que 0.5 es 0 grados.
        yaw_aproximado = (proporcion - 0.5) * 180.0
        return yaw_aproximado

    def procesar_frame(self, image_rgb):
        results = self.face_mesh.process(image_rgb)
        h, w, _ = image_rgb.shape
        yaw_actual = 0
        
        if results.multi_face_landmarks:
            for face_landmarks in results.multi_face_landmarks:
                yaw_actual = self.estimate_yaw(face_landmarks, w)
                self.yaw_history.append(yaw_actual)
                break # Solo evaluamos la primera cara detectada
        
        return yaw_actual

    def evaluar_escaneo_previo(self):
        """Evalúa si en la ventana temporal hubo un giro de cabeza > 25° y regresó."""
        if len(self.yaw_history) < 10: # Necesitamos un mínimo de frames
            return False
            
        max_yaw = max(self.yaw_history)
        min_yaw = min(self.yaw_history)
        yaw_actual = self.yaw_history[-1]
        
        # Verificamos si hubo una variación > 25 grados hacia los lados 
        # y si la cabeza "regresó" cerca del centro (asumimos el balón de frente, abs(yaw) < 15)
        hubo_variacion = (max_yaw > 25) or (min_yaw < -25)
        regreso_al_centro = abs(yaw_actual) < 15
        
        return hubo_variacion and regreso_al_centro
