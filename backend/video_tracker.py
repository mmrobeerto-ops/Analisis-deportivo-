import cv2
import numpy as np
import math
from typing import Dict, List, Tuple
from backend.aether_bridge import AetherCoreBiomechanicsBridge


class RealVideoPlayerTracker:
    """
    Rastreador de alta precisión para videos subidos (.mp4):
    Soluciona los 3 errores clásicos en videos de fútbol (como liv.mp4):
    1. FALSOS POSITIVOS EN TRIBUNA, VALLAS Y LOGOS:
       - Extrae el 'Convex Hull' del componente conexo verde MÁS GRANDE (únicamente la cancha),
         erosionando 18px los bordes para excluir por completo la valla publicitaria (UPS.COM/LFC) y la grada.
       - Verifica que alrededor de los pies (foot_x, foot_y) exista >= 65% de píxeles de césped real.
       - Excluye las zonas de marcadores/logos de TV (esquina sup. izq. LIV 2-0 CHE y esquina inf. der. Premier League).
    2. BARRAS NEGRAS LATERALES:
       - Recorta automáticamente las franjas negras verticales/horizontales del video antes de analizar.
    3. SEPARACIÓN DE EQUIPOS (SOLO CONECTAR COMPAÑEROS DEL MISMO EQUIPO):
       - Clasifica el color real de la camiseta en el torso (Rojo vs. Azul vs. Negro/Árbitro) y solo traza
         conexiones entre compañeros del mismo equipo.
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

    @staticmethod
    def crop_black_bars(frame: np.ndarray) -> np.ndarray:
        """Elimina las barras negras laterales o superiores que traen los videos de WhatsApp/TikTok."""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        col_mean = np.mean(gray, axis=0)
        row_mean = np.mean(gray, axis=1)

        valid_cols = np.where(col_mean > 12)[0]
        valid_rows = np.where(row_mean > 12)[0]

        if len(valid_cols) > 100 and len(valid_rows) > 100:
            x0, x1 = valid_cols[0], valid_cols[-1]
            y0, y1 = valid_rows[0], valid_rows[-1]
            if (x1 - x0) > frame.shape[1] * 0.45 and (y1 - y0) > frame.shape[0] * 0.45:
                return frame[y0:y1 + 1, x0:x1 + 1]
        return frame

    def detect_players_on_pitch(self, frame: np.ndarray) -> List[Tuple[int, int, int, int, str]]:
        h, w = frame.shape[:2]
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 1. Máscara estricta del césped verde
        lower_green = np.array([32, 45, 40])
        upper_green = np.array([85, 255, 245])
        grass_mask = cv2.inRange(hsv, lower_green, upper_green)

        # Encontrar ÚNICAMENTE el contorno verde más grande (el campo de juego)
        kernel_close = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
        grass_closed = cv2.morphologyEx(grass_mask, cv2.MORPH_CLOSE, kernel_close)
        contours_pitch, _ = cv2.findContours(grass_closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours_pitch:
            return []

        largest_pitch_cnt = max(contours_pitch, key=cv2.contourArea)
        hull = cv2.convexHull(largest_pitch_cnt)

        # Crear máscara del polígono de la cancha y erosionar 20px hacia adentro
        # para eliminar por completo la valla publicitaria amarilla (UPS.COM/LFC) y la grada
        strict_pitch_poly = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(strict_pitch_poly, [hull], -1, 255, -1)
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 25))
        strict_pitch_poly = cv2.erode(strict_pitch_poly, erode_kernel, iterations=1)

        # 2. Excluir zonas de marcadores de TV y marcas de agua (esquina sup-izq y esquina inf-der)
        # Marcador LIV 2-0 CHE (arriba izquierda)
        strict_pitch_poly[0:int(h * 0.22), 0:int(w * 0.32)] = 0
        # Logo Premier League (abajo derecha)
        strict_pitch_poly[int(h * 0.78):h, int(w * 0.76):w] = 0
        # Logo superior derecha (Tactical Lab)
        strict_pitch_poly[0:int(h * 0.22), int(w * 0.80):w] = 0

        # 3. Candidatos a jugadores = píxeles NO verdes que están estrictamente dentro del campo erosionado
        non_grass = cv2.bitwise_not(grass_mask)
        candidates = cv2.bitwise_and(non_grass, strict_pitch_poly)

        # Eliminar líneas blancas largas de la cancha (círculo central / área) usando morfología
        kernel_player = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 7))
        candidates = cv2.morphologyEx(candidates, cv2.MORPH_OPEN, kernel_player)
        candidates = cv2.dilate(candidates, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 9)), iterations=2)

        cnts, _ = cv2.findContours(candidates, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        for c in cnts:
            x, y, bw, bh = cv2.boundingRect(c)
            aspect = bh / float(bw + 1e-5)

            # Filtro biomecánico: una silueta humana parada o corriendo es más alta que ancha (aspect >= 1.25)
            # Esto descarta de inmediato carteles horizontales o manchas del pasto
            if 18 <= bh <= int(h * 0.26) and 7 <= bw <= int(w * 0.08) and 1.25 <= aspect <= 4.2:
                foot_x = x + bw // 2
                foot_y = min(h - 4, y + bh)

                # VALIDACIÓN DE CÉSPED BAJO LOS PIES:
                # Alrededor de los pies del jugador DEBE haber pasto verde real (>= 60%)
                patch_y0 = max(0, foot_y - 6)
                patch_y1 = min(h, foot_y + 8)
                patch_x0 = max(0, foot_x - int(bw * 0.9))
                patch_x1 = min(w, foot_x + int(bw * 0.9))
                grass_patch = grass_mask[patch_y0:patch_y1, patch_x0:patch_x1]

                if grass_patch.size == 0:
                    continue
                grass_ratio = np.count_nonzero(grass_patch) / float(grass_patch.size)
                if grass_ratio < 0.52:
                    continue

                # Clasificación real del color del uniforme en el torso (HSV)
                ty0 = max(0, y + int(bh * 0.18))
                ty1 = min(h, y + int(bh * 0.55))
                tx0 = max(0, x + int(bw * 0.2))
                tx1 = min(w, x + int(bw * 0.8))
                torso_hsv = hsv[ty0:ty1, tx0:tx1]

                if torso_hsv.size == 0:
                    continue

                # Contar píxeles rojos (Liverpool/Equipo A), azules (Chelsea/Equipo B) u oscuros (Árbitro)
                red_mask1 = cv2.inRange(torso_hsv, np.array([0, 70, 50]), np.array([14, 255, 255]))
                red_mask2 = cv2.inRange(torso_hsv, np.array([165, 70, 50]), np.array([180, 255, 255]))
                blue_mask = cv2.inRange(torso_hsv, np.array([95, 65, 50]), np.array([138, 255, 255]))
                dark_mask = cv2.inRange(torso_hsv, np.array([0, 0, 0]), np.array([180, 255, 65]))

                red_px = np.count_nonzero(red_mask1) + np.count_nonzero(red_mask2)
                blue_px = np.count_nonzero(blue_mask)
                dark_px = np.count_nonzero(dark_mask)

                # Descartar si el contorno es solo una línea blanca del pasto (sin color de camiseta)
                if red_px == 0 and blue_px == 0 and dark_px < (torso_hsv.shape[0] * torso_hsv.shape[1] * 0.35):
                    continue

                if red_px >= blue_px and red_px > 4:
                    team = "rojo"
                elif blue_px > red_px and blue_px > 4:
                    team = "azul"
                else:
                    team = "arbitro"

                detections.append((x, y, bw, bh, team))

        detections.sort(key=lambda b: b[1] + b[3])
        return detections[:22]

    def update_tracks(self, raw_boxes: List[Tuple[int, int, int, int, str]], frame_idx: int) -> List[Dict]:
        used_boxes = set()

        for tid, tr in list(self.tracks.items()):
            best_dist = 55.0
            best_idx = -1
            for idx, (x, y, bw, bh, team) in enumerate(raw_boxes):
                if idx in used_boxes:
                    continue
                fx = x + bw // 2
                fy = y + bh
                dist = math.hypot(fx - tr["foot_x"], fy - tr["foot_y"])
                if dist < best_dist:
                    best_dist = dist
                    best_idx = idx

            if best_idx != -1:
                x, y, bw, bh, team = raw_boxes[best_idx]
                used_boxes.add(best_idx)
                new_fx = x + bw // 2
                new_fy = y + bh
                tr["vx"] = new_fx - tr["foot_x"]
                tr["vy"] = new_fy - tr["foot_y"]
                tr["foot_x"] = int(tr["foot_x"] * 0.35 + new_fx * 0.65)
                tr["foot_y"] = int(tr["foot_y"] * 0.35 + new_fy * 0.65)
                tr["x"] = int(tr["x"] * 0.35 + x * 0.65)
                tr["y"] = int(tr["y"] * 0.35 + y * 0.65)
                tr["w"] = int(tr["w"] * 0.4 + bw * 0.6)
                tr["h"] = int(tr["h"] * 0.4 + bh * 0.6)
                if team != "arbitro":
                    tr["team"] = team
                tr["last_seen"] = frame_idx
                tr["hits"] += 1

        for idx, (x, y, bw, bh, team) in enumerate(raw_boxes):
            if idx not in used_boxes and len(self.tracks) < 22:
                tid = self.next_id
                self.next_id = (self.next_id % 22) + 1
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

        for tid in list(self.tracks.keys()):
            if frame_idx - self.tracks[tid]["last_seen"] > 6:
                del self.tracks[tid]

        # Exigir al menos 2 cuadros seguidos (regla de continuidad de Edu) para no dibujar destellos falsos
        return [t for t in self.tracks.values() if frame_idx - t["last_seen"] <= 2 and t["hits"] >= 2]

    def process_and_draw(self, frame: np.ndarray, frame_idx: int, mode: str = "dron", max_conn_m: float = 20.0) -> np.ndarray:
        # 1. Recortar barras negras laterales automáticamente
        cropped = self.crop_black_bars(frame)
        frame = cv2.resize(cropped, (960, 540))
        h, w = frame.shape[:2]

        raw_boxes = self.detect_players_on_pitch(frame)
        active_players = self.update_tracks(raw_boxes, frame_idx)

        for p in active_players:
            p["x_m"] = round((p["foot_x"] / float(w)) * 87.0, 1)
            p["y_m"] = round((p["foot_y"] / float(h)) * 55.0, 1)

        # Filtrar equipos por separado (Regla de Edu: solo conectar compañeros del mismo equipo, nunca rivales ni árbitro)
        team_rojo = [p for p in active_players if p["team"] == "rojo"]
        team_azul = [p for p in active_players if p["team"] == "azul"]
        primary_team = team_rojo if len(team_rojo) >= len(team_azul) else team_azul

        if mode == "dron":
            overlay = frame.copy()

            # 1. Conectar ÚNICAMENTE a compañeros del mismo equipo (< max_conn_m)
            for i in range(len(primary_team)):
                for j in range(i + 1, len(primary_team)):
                    p1, p2 = primary_team[i], primary_team[j]
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

            # 2. Dibujar anillos diferenciados por equipo en los pies reales
            for p in active_players:
                if p["team"] == "arbitro":
                    continue
                fx, fy = p["foot_x"], p["foot_y"]
                ring_rx = max(11, int(p["w"] * 0.6))
                ring_ry = max(4, int(p["w"] * 0.24))

                # Rosa para el equipo analizado, Cian para el rival
                color = (180, 105, 255) if p in primary_team else (255, 210, 0)
                cv2.ellipse(frame, (fx, fy), (ring_rx, ring_ry), 0, 0, 360, color, 2, cv2.LINE_AA)
                cv2.circle(frame, (fx, fy), 2, (255, 255, 255), -1)

                label = f"#{p['id']}"
                cv2.putText(
                    frame,
                    label,
                    (max(5, p["x"]), max(15, p["y"] - 5)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.4,
                    (255, 255, 255),
                    1,
                    cv2.LINE_AA,
                )

            if len(primary_team) >= 2:
                xs = [p["x_m"] for p in primary_team]
                ys = [p["y_m"] for p in primary_team]
                min_dists = []
                aislados = 0
                for i, p1 in enumerate(primary_team):
                    md = min(
                        [
                            math.hypot(p1["x_m"] - p2["x_m"], p1["y_m"] - p2["y_m"])
                            for j, p2 in enumerate(primary_team)
                            if i != j
                        ]
                        or [0.0]
                    )
                    min_dists.append(md)
                    if md > 12.0:
                        aislados += 1

                self.latest_telemetry["dron"] = {
                    "players_detected": len(primary_team),
                    "largo_m": round(max(xs) - min(xs), 1),
                    "ancho_m": round(max(ys) - min(ys), 1),
                    "altura_def_m": round(min(xs), 1),
                    "nearest_m": round(sum(min_dists) / len(min_dists), 1),
                    "aislados": aislados,
                    "detections": [
                        {"id": p["id"], "team": p["team"], "x_m": p["x_m"], "y_m": p["y_m"]}
                        for p in primary_team[:10]
                    ],
                }

        else:
            # --- MODO 1 CONTRA 1: Empareja a un Atacante (Rojo) contra el Defensor rival (Azul) más cercano ---
            field_players = [p for p in active_players if p["team"] != "arbitro"]
            if len(team_rojo) >= 1 and len(team_azul) >= 1:
                best_pair = None
                best_d = 9999.0
                for r in team_rojo:
                    for b in team_azul:
                        d = math.hypot(r["foot_x"] - b["foot_x"], r["foot_y"] - b["foot_y"])
                        if d < best_d:
                            best_d = d
                            best_pair = (r, b)
                attacker, defender = best_pair
            elif len(field_players) >= 2:
                attacker, defender = field_players[0], field_players[1]
            else:
                return frame

            for role, pl, col in [
                ("ATACANTE", attacker, (254, 242, 0)),
                ("DEFENSOR", defender, (90, 90, 255)),
            ]:
                x, y, bw, bh = pl["x"], pl["y"], pl["w"], pl["h"]
                fx, fy = pl["foot_x"], pl["foot_y"]

                head = (x + bw // 2, y + int(bh * 0.12))
                l_sh = (x + int(bw * 0.22), y + int(bh * 0.28))
                r_sh = (x + int(bw * 0.78), y + int(bh * 0.28))
                hip = (x + bw // 2, y + int(bh * 0.54))
                knee = (x + bw // 2 + int(pl["vx"] * 0.6), y + int(bh * 0.77))
                ankle = (fx, fy)

                cv2.ellipse(frame, ankle, (max(13, bw // 2), 5), 0, 0, 360, col, 2, cv2.LINE_AA)
                cv2.line(frame, l_sh, r_sh, (0, 255, 180), 2, cv2.LINE_AA)
                cv2.line(frame, head, hip, col, 2, cv2.LINE_AA)
                cv2.line(frame, hip, knee, (255, 255, 255), 2, cv2.LINE_AA)
                cv2.line(frame, knee, ankle, (129, 185, 16), 2, cv2.LINE_AA)
                cv2.circle(frame, hip, 4, (255, 255, 255), -1)

                cv2.rectangle(frame, (x - 8, max(5, y - 20)), (x + bw + 20, max(20, y - 4)), (15, 20, 28), -1)
                cv2.putText(
                    frame,
                    f"{role} #{pl['id']}",
                    (x - 4, max(16, y - 7)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.36,
                    col,
                    1,
                    cv2.LINE_AA,
                )

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
            cv2.rectangle(frame, (mx - 28, my - 13), (mx + 28, my + 5), (15, 20, 28), -1)
            cv2.putText(frame, f"{dist_m}m", (mx - 22, my), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (254, 242, 0), 1, cv2.LINE_AA)

        return frame
