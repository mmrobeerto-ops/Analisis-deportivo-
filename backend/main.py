from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import math
from backend.aether_bridge import AetherCoreBiomechanicsBridge, AETHER_NATIVE_ACTIVE

app = FastAPI(title="CEFOR VIDEO — Motor Geométrico y Biomecánico (TZANiX Aether Core)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

aether_engine = AetherCoreBiomechanicsBridge(fps=30)

@app.get("/api/cefor/status")
def get_cefor_status(frame: int = 30):
    phase = frame * 0.15
    attacker_kps = {
        "hip": [480.0, 310.0 + math.sin(phase) * 18.0],
        "knee": [495.0, 390.0],
        "ankle": [470.0 + math.cos(phase) * 25.0, 470.0],
        "l_shoulder": [455.0, 220.0],
        "r_shoulder": [515.0, 232.0 + math.sin(phase) * 14.0],
        "l_hip": [465.0, 310.0],
        "r_hip": [500.0, 312.0],
        "speed_px": 28.5,
    }
    defender_kps = {
        "hip": [640.0 + math.cos(phase) * 35.0, 305.0],
        "cog_drop": 24.0,
        "knee_angle_inv": 38.0,
        "speed_px": 21.0,
    }
    duel_metrics = aether_engine.analyze_duel_frame(frame, attacker_kps, defender_kps)

    return {
        "engine": "TZANiX Aether Core v0.1.0 (SHANNON_LUT 64-byte aligned)",
        "native_dll_active": AETHER_NATIVE_ACTIVE,
        "metrics": duel_metrics,
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "CEFOR VIDEO + TZANiX Aether Core"}
