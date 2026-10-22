import cv2
import math
import numpy as np
import os
import glob

def draw_fifa_triangle(img, center, size=40, color=(0, 242, 254)):
    """Dibuja un cursor 3D estilo EA FC en el suelo"""
    pt1 = (center[0], center[1] + size//2)
    pt2 = (center[0] - size, center[1] - size//2)
    pt3 = (center[0] + size, center[1] - size//2)
    
    pts = np.array([pt1, pt2, pt3], np.int32)
    pts = pts.reshape((-1,1,2))
    
    overlay = img.copy()
    cv2.fillPoly(overlay, [pts], color)
    cv2.addWeighted(overlay, 0.4, img, 0.6, 0, img)
    cv2.polylines(img, [pts], True, (255,255,255), 2, cv2.LINE_AA)

def draw_floating_stat(img, origin, stat_text, value_text):
    """Línea diagonal y caja de estadísticas"""
    end_point = (origin[0] + 80, origin[1] - 60)
    cv2.line(img, origin, end_point, (0, 242, 254), 1, cv2.LINE_AA)
    cv2.circle(img, origin, 3, (0, 242, 254), -1)
    
    box_w, box_h = 100, 45
    box_rect = (end_point[0], end_point[1] - box_h//2, box_w, box_h)
    
    overlay = img.copy()
    cv2.rectangle(overlay, (box_rect[0], box_rect[1]), (box_rect[0]+box_w, box_rect[1]+box_h), (28, 36, 49), -1)
    cv2.addWeighted(overlay, 0.8, img, 0.2, 0, img)
    
    cv2.line(img, (box_rect[0], box_rect[1]), (box_rect[0]+box_w, box_rect[1]), (0, 242, 254), 2)
    
    cv2.putText(img, stat_text, (box_rect[0]+10, box_rect[1]+15), cv2.FONT_HERSHEY_DUPLEX, 0.4, (150, 150, 150), 1, cv2.LINE_AA)
    cv2.putText(img, value_text, (box_rect[0]+10, box_rect[1]+35), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1, cv2.LINE_AA)

def generate_frames():
    # Buscar el video específico en Descargas (manejando caracteres acentuados con glob)
    search_path = r"C:\Users\52664\Downloads\*escenas*(1).mp4"
    files = glob.glob(search_path)
    video_path = files[0] if files else r"C:\Users\52664\Downloads\Exportación de escenas (1).mp4"
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            yield b""
            return

    # MOG2 Background Subtractor para seguimiento de jugadores
    back_sub = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)
    
    # Kalman Filter u otra variable de suavizado de posición
    player_pos = None

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue
            
        frame = cv2.resize(frame, (1024, 576))
        frame_count += 1
        
        # Aplicar Background Subtraction
        fg_mask = back_sub.apply(frame)
        
        # Limpiar máscara (Erosión y Dilatación)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_DILATE, kernel, iterations=2)
        
        # Encontrar contornos
        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        largest_contour = None
        max_area = 0
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Ignorar ruido pequeño y el contorno entero
            if 500 < area < 50000:
                if area > max_area:
                    max_area = area
                    largest_contour = cnt
                    
        # Suavizar movimiento del jugador con inercia
        if largest_contour is not None:
            x, y, w, h = cv2.boundingRect(largest_contour)
            center_x = x + w // 2
            center_y = y + h // 2
            bottom_y = y + h
            
            if player_pos is None:
                player_pos = (center_x, center_y, bottom_y)
            else:
                # Interpolación para movimiento suave
                player_pos = (
                    int(player_pos[0] * 0.8 + center_x * 0.2),
                    int(player_pos[1] * 0.8 + center_y * 0.2),
                    int(player_pos[2] * 0.8 + bottom_y * 0.2)
                )
        
        # HUD General Broadcast
        cv2.rectangle(frame, (40, 30), (320, 70), (28, 36, 49), -1)
        cv2.line(frame, (40, 70), (320, 70), (129, 185, 16), 3)
        cv2.putText(frame, 'M-360 HYPERMOTION V', (50, 55), cv2.FONT_HERSHEY_TRIPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        # 4. Líneas tácticas (simulación)
        cv2.line(frame, (0, 400), (1024, 320), (0, 242, 254), 1, cv2.LINE_AA)
        
        # Dibujar tracking si encontramos a alguien
        if player_pos is not None:
            p_x, p_y, p_bottom = player_pos
            
            # Dibujar rectangulo AI al rededor
            cv2.rectangle(frame, (p_x - 30, p_y - 60), (p_x + 30, p_y + 40), (129, 185, 16), 1)
            
            # Indicador de Jugador (Triángulo en el suelo)
            draw_fifa_triangle(frame, (p_x, p_bottom + 10), size=25)
            
            # Barra de estamina curva
            cv2.ellipse(frame, (p_x, p_y - 75), (30, 10), 180, 0, 180, (200, 200, 200), 2)
            cv2.ellipse(frame, (p_x, p_y - 75), (30, 10), 180, 0, 130, (0, 242, 254), 4)
            
            # Flotante de Estadísticas
            speed = f"{15 + abs(math.sin(frame_count * 0.1) * 8):.1f} KM/H"
            draw_floating_stat(frame, (p_x + 30, p_y - 20), "VELOCIDAD", speed)
            
        ret, buffer = cv2.imencode('.jpg', frame)
        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

    cap.release()

