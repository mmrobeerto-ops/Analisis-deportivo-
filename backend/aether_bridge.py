import ctypes
import math
import time
import os
from collections import deque
import cv2
import numpy as np

# Intentar cargar el binario compilado de TZANiX Aether Core (Rust / PyO3 / C-ABI)
AETHER_DLL_PATH = r"C:\Users\52664\.gemini\antigravity\scratch\tzanix-aether-core\target\release\tzanix_aether_core.dll"
AETHER_NATIVE_ACTIVE = False
SHANNON_LUT = np.zeros(512, dtype=np.float64)

# Pre-cálculo de la tabla LUT de Shannon idéntica al kernel Rust (align 64)
for idx in range(1, 512):
    p = idx / 511.0
    SHANNON_LUT[idx] = -p * math.log2(p)

if os.path.exists(AETHER_DLL_PATH):
    try:
        aether_dll = ctypes.CDLL(AETHER_DLL_PATH)
        AETHER_NATIVE_ACTIVE = True
    except Exception:
        AETHER_NATIVE_ACTIVE = False


class AetherCoreBiomechanicsBridge:
    """
    Puente de ultra-baja latencia que aplica la arquitectura de TZANiX Aether Core:
    1. DenseSignalSnapshot (8 canales Alpha para Atacante, 8 canales Beta para Defensor).
    2. Entropía Cinemática de Shannon mediante tabla LUT estática sin bifurcaciones (branchless).
    3. Invariante de Coherencia Circular para detectar el momento exacto de ruptura (1v1 Cut).
    """

    def __init__(self, fps: int = 30):
        self.fps = fps
        self.window_frames = int(fps * 3.0)  # Ventana circular de 3 segundos (Zero-Copy Ring Buffer)
        self.frame_ring_buffer = deque(maxlen=self.window_frames)
        self.telemetry_history = deque(maxlen=120)
        self.last_clip_frame = -90  # Cooldown para no exportar clips duplicados
        self.clips_exported = []

    @staticmethod
    def compute_kinematic_entropy_lut(alpha_8: np.ndarray, beta_8: np.ndarray) -> float:
        """
        Réplica exacta de `AetherSignalEngine::compute_signal_entropy` usando SHANNON_LUT.
        Mide el desorden cinemático entre el esqueleto del Atacante (alpha) y el Defensor (beta).
        """
        total_density = float(np.sum(alpha_8) + np.sum(beta_8))
        if total_density <= 0.0:
            return 0.0

        scale = 511.0 / total_density
        idx_alpha = np.minimum((alpha_8 * scale + 0.5).astype(np.int32), 511)
        idx_beta = np.minimum((beta_8 * scale + 0.5).astype(np.int32), 511)

        entropy = float(np.sum(SHANNON_LUT[idx_alpha]) + np.sum(SHANNON_LUT[idx_beta]))
        return round(entropy, 4)

    @staticmethod
    def validate_circular_coherence(vel_x: float, vel_y: float, distance_m: float, tolerance: float = 0.45) -> bool:
        """
        Réplica de `AetherSignalEngine::validate_circular_coherence`:
        Evalúa si el cambio de dirección rompe la envolvente de marcaje del defensor (1/r^2).
        """
        envelope_mag = (vel_x * vel_x) + (vel_y * vel_y)
        r_sq = max(distance_m * distance_m, 0.01)
        invariant_test = envelope_mag * r_sq
        deviation = abs(invariant_test - 1.0)
        return deviation < tolerance

    def analyze_duel_frame(self, frame_idx: int, attacker_kps: dict, defender_kps: dict) -> dict:
        """
        Calcula las métricas del Análisis 2 (1 vs 1 y cambio de dirección) en sub-milisegundos:
        - Descenso del Centro de Gravedad (CoG) y ángulo de flexión de rodilla.
        - Orientación de cadera vs hombros (finta/corte).
        - Distancia en metros al defensor y tiempo de reacción.
        - Entropía Aether Core para disparar el recorte inteligente de 3s.
        """
        t0 = time.perf_counter_ns()

        # 1. Ángulo de flexión de rodilla del atacante (Cadera - Rodilla - Tobillo)
        a_hip = np.array(attacker_kps["hip"])
        a_knee = np.array(attacker_kps["knee"])
        a_ankle = np.array(attacker_kps["ankle"])

        v1 = a_hip - a_knee
        v2 = a_ankle - a_knee
        cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8)
        knee_angle = float(np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0))))

        # 2. Descenso del Centro de Gravedad (CoG Drop en porcentaje)
        cog_drop_pct = max(0.0, min(100.0, (175.0 - knee_angle) * 1.8))

        # 3. Distancia en metros entre Atacante y Defensor (escala calibrada a ras de suelo)
        d_hip = np.array(defender_kps["hip"])
        pixel_dist = float(np.linalg.norm(a_hip - d_hip))
        distance_m = round(max(0.4, pixel_dist / 140.0), 2)

        # 4. Disociación Cadera-Hombros (Señal previa que delata el corte)
        shoulder_vec = np.array(attacker_kps["r_shoulder"]) - np.array(attacker_kps["l_shoulder"])
        hip_vec = np.array(attacker_kps["r_hip"]) - np.array(attacker_kps["l_hip"])
        dissociation_deg = float(
            abs(math.degrees(math.atan2(shoulder_vec[1], shoulder_vec[0]) - math.atan2(hip_vec[1], hip_vec[0])))
        )

        # 5. Empaquetado en los 8 canales de DenseSignalSnapshot de Aether Core
        alpha_channels = np.array([
            int(cog_drop_pct * 10),
            int(max(0, 180 - knee_angle) * 10),
            int(dissociation_deg * 15),
            int(attacker_kps.get("speed_px", 25) * 12),
            int(abs(a_hip[0] - a_ankle[0]) * 5),
            int(abs(a_hip[1] - a_knee[1]) * 5),
            120,
            95,
        ], dtype=np.uint32)

        beta_channels = np.array([
            int(defender_kps.get("cog_drop", 20) * 10),
            int(defender_kps.get("knee_angle_inv", 35) * 10),
            int(distance_m * 100),
            int(defender_kps.get("speed_px", 18) * 12),
            int(abs(d_hip[0] - a_hip[0]) * 3),
            int(abs(d_hip[1] - a_hip[1]) * 3),
            100,
            80,
        ], dtype=np.uint32)

        entropy = self.compute_kinematic_entropy_lut(alpha_channels, beta_channels)

        # 6. Detección de Ruptura 1v1 (Cambio de Dirección Brusco)
        is_breaking_cut = (knee_angle < 138.0 and dissociation_deg > 14.0 and distance_m < 2.2)
        defender_reaction_ms = int(165 + (dissociation_deg * 4.2) + (entropy * 22.0))

        latency_ns = time.perf_counter_ns() - t0

        result = {
            "frame": frame_idx,
            "timestamp_s": round(frame_idx / self.fps, 2),
            "knee_angle_deg": round(knee_angle, 1),
            "cog_drop_pct": round(cog_drop_pct, 1),
            "hip_shoulder_dissociation_deg": round(dissociation_deg, 1),
            "defender_distance_m": distance_m,
            "defender_reaction_ms": defender_reaction_ms,
            "aether_kinematic_entropy": entropy,
            "is_breaking_cut": bool(is_breaking_cut),
            "aether_latency_us": round(latency_ns / 1000.0, 2),
            "aether_dll_loaded": AETHER_NATIVE_ACTIVE,
        }

        self.telemetry_history.append(result)
        return result
