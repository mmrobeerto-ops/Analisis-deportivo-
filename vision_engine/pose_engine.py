import cv2
import mediapipe as mp
import numpy as np

# Inicializar MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)

def calcular_angulo(a, b, c):
    """Calcula el ángulo entre tres puntos (articulaciones)"""
    a = np.array(a) # Cadera
    b = np.array(b) # Rodilla
    c = np.array(c) # Tobillo
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angulo = np.abs(radians*180.0/np.pi)
    
    if angulo > 180.0:
        angulo = 360 - angulo
    return angulo

# Cargar video de prueba (grabado en ángulo elevado)
cap = cv2.VideoCapture('partido_prueba_60fps.mp4')

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
        
    # Convertir a RGB para MediaPipe
    image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    
    try:
        landmarks = results.pose_landmarks.landmark
        
        # Obtener coordenadas de la pierna izquierda
        cadera = [landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].x, landmarks[mp_pose.PoseLandmark.LEFT_HIP.value].y]
        rodilla = [landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_KNEE.value].y]
        tobillo = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
        
        # Calcular ángulo de flexión
        angulo_rodilla = calcular_angulo(cadera, rodilla, tobillo)
        
        # Evaluar Postura Biomecánica (Regla M-360)
        estado_postura = "CORRECTA (Flexionado)" if angulo_rodilla < 140 else "INCORRECTA (Erguido)"
        
        # Renderizar en el frame
        cv2.putText(image, f'Angulo Rodilla: {int(angulo_rodilla)}deg', (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(image, f'Postura: {estado_postura}', (10, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0) if angulo_rodilla < 140 else (0, 0, 255), 2)
        
    except Exception as e:
        pass
        
    # Dibujar esqueleto digital
    mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS)
    
    cv2.imshow('M-360 Sport IQ - Motor Biomecanico', image)
    if cv2.waitKey(10) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
