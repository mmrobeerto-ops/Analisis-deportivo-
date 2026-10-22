import cv2
import mediapipe as mp
import numpy as np

class PoseDetector:
    def __init__(self, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        self.mp_pose = mp.solutions.pose
        self.mp_drawing = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

    def calcular_angulo(self, p1, p2, p3):
        """Calcula el ángulo entre tres puntos (p2 es el vértice)."""
        p1, p2, p3 = np.array(p1), np.array(p2), np.array(p3)
        radians = np.arctan2(p3[1] - p2[1], p3[0] - p2[0]) - np.arctan2(p1[1] - p2[1], p1[0] - p2[0])
        angulo = np.abs(radians * 180.0 / np.pi)
        if angulo > 180.0:
            angulo = 360 - angulo
        return angulo

    def evaluar_flexion(self, angulo_rodilla):
        """Evalúa si la flexión de rodilla es correcta según M-360."""
        if 110 <= angulo_rodilla <= 135:
            return "Correcta (Estable)", True
        elif angulo_rodilla > 150:
            return "Erguida (Inestable)", False
        return "Regular", False

    def evaluar_perfilacion(self, hombro_izq, hombro_der, vector_balon=np.array([0, 1])):
        """Evalúa la perfilación corporal respecto al balón."""
        vector_hombros = np.array([hombro_der[0] - hombro_izq[0], hombro_der[1] - hombro_izq[1]])
        norm_hombros = np.linalg.norm(vector_hombros)
        norm_balon = np.linalg.norm(vector_balon)
        
        if norm_hombros == 0 or norm_balon == 0:
            return 0, False
            
        cos_theta = np.dot(vector_hombros, vector_balon) / (norm_hombros * norm_balon)
        # Asegurar que esté en el dominio del arccos
        cos_theta = np.clip(cos_theta, -1.0, 1.0)
        angulo_apertura = np.degrees(np.arccos(cos_theta))
        
        # Considerar el ángulo complementario si es mayor a 90
        if angulo_apertura > 90:
            angulo_apertura = 180 - angulo_apertura
            
        es_correcto = 45 <= angulo_apertura <= 90
        return angulo_apertura, es_correcto

    def process_frame(self, frame):
        """Procesa un frame y devuelve la imagen anotada y los resultados."""
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = self.pose.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        metrics = {}
        if results.pose_landmarks:
            landmarks = results.pose_landmarks.landmark
            
            # Extraer puntos clave
            cadera_izq = [landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value].y]
            rodilla_izq = [landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[self.mp_pose.PoseLandmark.LEFT_KNEE.value].y]
            tobillo_izq = [landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
            
            hombro_izq = [landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            hombro_der = [landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            
            # Calcular y evaluar métricas
            angulo_rodilla = self.calcular_angulo(cadera_izq, rodilla_izq, tobillo_izq)
            estado_flexion, flexion_ok = self.evaluar_flexion(angulo_rodilla)
            
            # Asumimos que el balón viene de frente (vector [0, 1]) para la demo
            angulo_perfil, perfil_ok = self.evaluar_perfilacion(hombro_izq, hombro_der)
            
            metrics = {
                'angulo_rodilla': angulo_rodilla,
                'flexion_estado': estado_flexion,
                'flexion_ok': flexion_ok,
                'angulo_perfil': angulo_perfil,
                'perfil_ok': perfil_ok
            }
            
            # Anotaciones visuales
            color_flex = (0, 255, 0) if flexion_ok else (0, 0, 255)
            color_perf = (0, 255, 0) if perfil_ok else (0, 0, 255)
            cv2.putText(image, f'Rodilla: {int(angulo_rodilla)}deg ({estado_flexion})', (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color_flex, 2)
            cv2.putText(image, f'Perfilacion: {int(angulo_perfil)}deg', (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color_perf, 2)
            
            self.mp_drawing.draw_landmarks(image, results.pose_landmarks, self.mp_pose.POSE_CONNECTIONS)
            
        return image, metrics
