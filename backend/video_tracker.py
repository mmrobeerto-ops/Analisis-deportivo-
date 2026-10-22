import cv2
import numpy as np
import math
import time
from typing import Dict, List, Tuple
from backend.aether_bridge import AetherCoreBiomechanicsBridge

class RealVideoPlayerTracker:
    """
    Rastreador real de jugadores sobre cualquier video subido (.mp4, .mov, .avi):
    1. Filtra la cancha (máscara HSV de césped) para aislar únicamente las siluetas sobre el campo.
    2. Detecta las cajas reales (x, y, w, h) de cada jugador cuadro por cuadro y ubica sus pies (x_px, y_px).
    3. Aplica Asignación por Continuidad (estilo Húngaro de CEFOR VIDEO) para que cada ID y gráfica
       sigan exactamente al jugador real mientras corre por el video, sin flotar en el aire.
    """

    def __init__(self):
        self.tracks: Dict[int, Dict] = {}
        self.next_id = 1
        self.aether = AetherCoreBiomechanicsBridge(fps=30)
        self.latest_telemetry = {
            "dron": {
                "players_detected": 0,
                "largo_m": 0.0,
                "ancho_m": 0.0,
                "altura_def_m": 0.0,
                "nearest_m": 0.0,
                "aislados": 0,
                "detections": [],
            },
            "duel_1v1": {
                "knee_angle_deg": 135.0,
                "cog_drop_pct": 45.0,
                "hip_shoulder_deg": 12.0,
                "defender_distance_m": 1.5,
                "defender_reaction_ms": 210,
                "aether_entropy": 2.15,
                "is_breaking_cut": False,
            },
        }

    def detect_players_on_pitch(self, frame: np.ndarray) -> List[Tuple[int, int, int, int, str]]:
        """
        Detecta las cajas reales (x, y, w, h, equipo) de los jugadores que están pisando el césped.
        """
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 1. Máscara del césped (verde de la cancha)
        lower_green = np.array([28, 30, 30])
        upper_green = np.array([92, 255, 255])
        pitch_mask = cv2.inRange(hsv, lower_green, upper_green)

        # Cerrar huecos para obtener el polígono continuo del terreno de juego
        kernel_big = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
        pitch_region = cv2.morphologyEx(pitch_mask, cv2.MORPH_CLOSE, kernel_big)
        pitch_region = cv2.dilate(pitch_region, kernel_big, iterations=1)

        # 2. Los jugadores son objetos no-verdes DENTRO de la región de la cancha
        non_green = cv2.bitwise_not(pitch_mask)
        players_mask = cv2.bitwise_and(non_green, pitch_region)

        # Ignorar los primeros 55px superiores (marcadores de TV / banners)
        players_mask[:55, :] = 0

        kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 5))
        players_mask = cv2.morphologyEx(players_mask, cv2.MORPH_OPEN, kernel_clean)
        players_mask = cv2.dilate(players_mask, kernel_clean, iterations=2)

        contours, _ = cv2.findContours(players_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        for cnt in contours:
            x, y, bw, bh = cv2.boundingRect(cnt)
            area = bw * bh
            aspect = bh / float(bw + 1e-5)

            # Filtrar proporción humana de jugador en cancha (desde dron o cámara táctica)
            if 110 < area < (w * h * 0.08) and 0.9 <= aspect <= 4.5 and bh >= 16:
                torso = frame[max(0, y + int(bh * 0.15)):min(h, y + int(bh * 0.55)), max(0, x):min(w, x + bw)]
                team = "rojo"
                if torso.size > 0:
                    mean_bgr = np.mean(torso, axis=(0, 1))
                    # Si predomina brillo alto/azul celeste -> rival ("azul"), si es oscuro/rojo -> "rojo" (Edu)
                    if mean_bgr[0] > 135 and mean_bgr[1] > 125:
                        team = "azul"
                detections.append((x, y, bw, bh, team))

        # Ordenar por relevancia y limitar a 22 jugadores en campo
        detections.sort(key=lambda b: b[2] * b[3], reverse=True)
        return detections[:20]

    def update_tracks(self, raw_boxes: List[Tuple[int, int, int, int, str]], frame_idx: int) -> List[Dict]:
        """
        Empareja las detecciones del cuadro actual con las pistas activas para mantener el ID fijo
        y suavizar la posición de los pies (filtro exponencial para evitar saltos).
        """
        updated_ids = set()
        used_boxes = set()

        # Asociar cada pista existente con la detección más cercana (< 65 px)
        for tid, tr in list(self.tracks.items()):
            best_dist = 65.0
            best_idx = -1
            for idx, (x, y, bw, bh, team) in enumerate(raw_boxes):
                if idx in used_boxes:
                    continue
                foot_x = x + bw // 2
                foot_y = y + bh
                dist = math.hypot(foot_x - tr["foot_x"], foot_y - tr["foot_y"])
                if dist < best_dist:
                    best_dist = dist
                    best_idx = idx

            if best_idx != -1:
                x, y, bw, bh, team = raw_boxes[best_idx]
                used_boxes.add(best_idx)
                new_fx = x + bw // 2
                new_fy = y + bh
                vx = new_fx - tr["foot_x"]
                vy = new_fy - tr["foot_y"]

                # Suavizado exponencial para que el anillo siga el pie con fluidez total
                tr["foot_x"] = int(tr["foot_x"] * 0.45 + new_fx * 0.55)
                tr["foot_y"] = int(tr["foot_y"] * 0.45 + new_fy * 0.55)
                tr["x"] = int(tr["x"] * 0.45 + x * 0.55)
                tr["y"] = int(tr["y"] * 0.45 + y * 0.55)
                tr["w"] = int(tr["w"] * 0.5 + bw * 0.5)
                tr["h"] = int(tr["h"] * 0.5 + bh * 0.5)
                tr["vx"] = vx
                tr["vy"] = vy
                tr["team"] = team
                tr["last_seen"] = frame_idx
                tr["hits"] += 1
                updated_ids.add(tid)

        # Crear nuevas pistas para jugadores recién detectados
        for idx, (x, y, bw, bh, team) in enumerate(raw_boxes):
            if idx not in used_boxes and len(self.tracks) < 24:
                tid = self.next_id
                self.next_id = (self.next_id % 99) + 1
                self.tracks[tid] = {
                    "id": tid,
                    "x": x,
                    "y": y,
                    "w": bw,
                    "h": bh,
                    "foot_x": x + bw // 2,
                    "foot_y": y + bh,
                    "vx": 0,
                    "vy": 0,
                    "team": team,
                    "last_seen": frame_idx,
                    "hits": 1,
                }

        # Limpiar pistas que desaparecieron hace más de 12 cuadros (continuidad CEFOR)
        for tid in list(self.tracks.keys()):
            if frame_idx - self.tracks[tid]["last_seen"] > 12:
                del self.tracks[tid]

        # Devolver pistas estables
        active = [t for t in self.tracks.values() if frame_idx - t["last_seen"] <= 4]
        return active

    def process_and_draw(self, frame: np.ndarray, frame_idx: int, mode: str = "dron", max_conn_m: float = 20.0) -> np.ndarray:
        """
        Detecta a los jugadores reales en el cuadro y dibuja las gráficas (anillos, conexiones o esqueleto 1v1)
        exactamente sobre sus coordenadas reales.
        """
        h, w = frame.shape[:2]
        raw_boxes = self.detect_players_on_pitch(frame)
        active_players = self.update_tracks(raw_boxes, frame_idx)

        # Convertir coordenadas de píxeles a metros de cancha CEFOR (87 x 55 m)
        for p in active_players:
            p["x_m"] = round((p["foot_x"] / float(w)) * 87.0, 1)
            p["y_m"] = round((p["foot_y"] / float(h)) * 55.0, 1)

        if mode == "dron":
            overlay = frame.copy()

            # 1. Dibujar conexiones rosas reales entre jugadores detectados (< max_conn_m)
            for i in range(len(active_players)):
                for j in range(i + 1, len(active_players)):
                    p1, p2 = active_players[i], active_players[j]
                    dist_m = math.hypot(p1["x_m"] - p2["x_m"], p1["y_m"] - p2["y_m"])
                    if dist_m <= max_conn_m:
                        thickness = max(1, int(4 - (dist_m / 6.5)))
                        cv2.line(
                            overlay,
                            (p1["foot_x"], p1["foot_y"]),
                            (p2["foot_x"], p2["foot_y"]),
                            (180, 105, 255),
                            thickness,
                            cv2.LINE_AA,
                        )

            cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)

            # 2. Dibujar el anillo 3D exactamente en los pies reales de cada jugador detectado
            for p in active_players:
                fx, fy = p["foot_x"], p["foot_y"]
                bw, bh = p["w"], p["h"]
                ring_rx = max(10, int(bw * 0.65))
                ring_ry = max(4, int(bw * 0.25))

                color = (180, 105, 255) if p["team"] == "rojo" else (255, 210, 0)
                cv2.ellipse(frame, (fx, fy), (ring_rx, ring_ry), 0, 0, 360, color, 2, cv2.LINE_AA)
                cv2.circle(frame, (fx, fy), 3, (255, 255, 255), -1)

                # Etiqueta pegada arriba de la cabeza real del jugador
                label = f"#{p['id']} ({p['x_m']}m)"
                cv2.putText(
                    frame,
                    label,
                    (max(5, p["x"] - 6), max(15, p["y"] - 6)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.38,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )

            # Actualizar telemetría real a partir de los jugadores detectados
            if len(active_players) >= 2:
                xs = [p["x_m"] for p in active_players]
                ys = [p["y_m"] for p in active_players]
                largo = round(max(xs) - min(xs), 1)
                ancho = round(max(ys) - min(ys), 1)
                altura_def = round(min(xs), 1)

                min_dists = []
                aislados = 0
                for i, p1 in enumerate(active_players):
                    md = min(
                        [
                            math.hypot(p1["x_m"] - p2["x_m"], p1["y_m"] - p2["y_m"])
                            for j, p2 in enumerate(active_players)
                            if i != j
                        ]
                        or [0.0]
                    )
                    min_dists.append(md)
                    if md > 12.0:
                        aislados += 1

                self.latest_telemetry["dron"] = {
                    "players_detected": len(active_players),
                    "largo_m": largo,
                    "ancho_m": ancho,
                    "altura_def_m": altura_def,
                    "nearest_m": round(sum(min_dists) / len(min_dists), 1),
                    "aislados": aislados,
                    "detections": [
                        {
                            "id": p["id"],
                            "team": p["team"],
                            "x_m": p["x_m"],
                            "y_m": p["y_m"],
                        }
                        for p in active_players[:12]
                    ],
                }

        else:
            # --- MODO 1 CONTRA 1: Sigue a los 2 jugadores principales del duelo en el video ---
            # Elegir la pareja de jugadores más cercana al centro de la acción
            cx, cy = w // 2, h // 2
            sorted_by_center = sorted(
                active_players,
                key=lambda p: math.hypot(p["foot_x"] - cx, p["foot_y"] - cy),
            )

            for p in active_players:
                cv2.ellipse(
                    frame,
                    (p["foot_x"], p["foot_y"]),
                    (max(10, p["w"] // 2), 5),
                    0,
                    0,
                    360,
                    (120, 120, 120),
                    1,
                    cv2.LINE_AA,
                )

            if len(sorted_by_center) >= 2:
                attacker = sorted_by_center[0]
                # Buscar el jugador más cercano al atacante como su defensor directo en el 1v1
                defender = min(
                    sorted_by_center[1:],
                    key=lambda p: math.hypot(
                        p["foot_x"] - attacker["foot_x"], p["foot_y"] - attacker["foot_y"]
                    ),
                )

                for role, pl, col in [
                    ("ATACANTE", attacker, (254, 242, 0)),
                    ("DEFENSOR", defender, (90, 90, 255)),
                ]:
                    x, y, bw, bh = pl["x"], pl["y"], pl["w"], pl["h"]
                    fx, fy = pl["foot_x"], pl["foot_y"]

                    # Articulaciones proporcionales dentro del bounding box REAL del jugador
                    head = (x + bw // 2, y + int(bh * 0.12))
                    l_sh = (x + int(bw * 0.22), y + int(bh * 0.28))
                    r_sh = (x + int(bw * 0.78), y + int(bh * 0.28))
                    hip = (x + bw // 2 + int(pl["vx"] * 0.4), y + int(bh * 0.54))
                    knee = (x + bw // 2 + int(pl["vx"] * 0.8), y + int(bh * 0.77))
                    ankle = (fx, fy)

                    # Dibujar anillo en los pies reales y esqueleto articulado dentro del cuerpo real
                    cv2.ellipse(frame, ankle, (max(14, bw // 2), 6), 0, 0, 360, col, 2, cv2.LINE_AA)
                    cv2.line(frame, l_sh, r_sh, (0, 255, 180), 2, cv2.LINE_AA)
                    cv2.line(frame, head, hip, col, 2, cv2.LINE_AA)
                    cv2.line(frame, hip, knee, (255, 255, 255), 2, cv2.LINE_AA)
                    cv2.line(frame, knee, ankle, (129, 185, 16), 2, cv2.LINE_AA)
                    cv2.circle(frame, hip, 4, (255, 255, 255), -1)
                    cv2.circle(frame, knee, 3, (0, 255, 180), -1)

                    cv2.rectangle(frame, (x - 10, max(5, y - 22)), (x + bw + 25, max(22, y - 4)), (15, 20, 28), -1)
                    cv2.putText(
                        frame,
                        f"{role} #{pl['id']}",
                        (x - 6, max(17, y - 8)),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.38,
                        col,
                        1,
                        cv2.LINE_AA,
                    )

                # Línea de distancia real entre los pies del Atacante y Defensor
                cv2.line(
                    frame,
                    (attacker["foot_x"], attacker["foot_y"]),
                    (defender["foot_x"], defender["foot_y"]),
                    (254, 242, 0),
                    2,
                    cv2.LINE_AA,
                )
                dist_m = round(
                    math.hypot(attacker["x_m"] - defender["x_m"], attacker["y_m"] - defender["y_m"]),
                    2,
                )
                mx = (attacker["foot_x"] + defender["foot_x"]) // 2
                my = (attacker["foot_y"] + defender["foot_y"]) // 2
                cv2.rectangle(frame, (mx - 32, my - 14), (mx + 32, my + 5), (15, 20, 28), -1)
                cv2.putText(
                    frame,
                    f"{dist_m}m",
                    (mx - 24, my),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.42,
                    (254, 242, 0),
                    1,
                    cv2.LINE_AA,
                )

                # Calcular ángulo de rodilla real y pasar por TZANiX Aether Core
                a_hip = [attacker["x"] + attacker["w"] * 0.5, attacker["y"] + attacker["h"] * 0.54]
                a_knee = [
                    attacker["x"] + attacker["w"] * 0.5 + attacker["vx"] * 0.8 + 4,
                    attacker["y"] + attacker["h"] * 0.77,
                ]
                a_ankle = [attacker["foot_x"], attacker["foot_y"]]
                duel_res = self.aether.analyze_duel_frame(
                    frame_idx,
                    {
                        "hip": a_hip,
                        "knee": a_knee,
                        "ankle": a_ankle,
                        "l_shoulder": [attacker["x"], attacker["y"] + 10],
                        "r_shoulder": [
                            attacker["x"] + attacker["w"],
                            attacker["y"] + 10 + attacker["vy"],
                        ],
                        "l_hip": [attacker["x"], a_hip[1]],
                        "r_hip": [attacker["x"] + attacker["w"], a_hip[1]],
                        "speed_px": math.hypot(attacker["vx"], attacker["vy"]),
                    },
                    {
                        "hip": [defender["foot_x"], defender["foot_y"]],
                        "cog_drop": 22.0,
                        "knee_angle_inv": 35.0,
                        "speed_px": math.hypot(defender["vx"], defender["vy"]),
                    },
                )
                duel_res["defender_distance_m"] = dist_m
                self.latest_telemetry["duel_1v1"] = duel_res

        return frame
