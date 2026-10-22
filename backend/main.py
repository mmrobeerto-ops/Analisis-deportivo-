from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from typing import List
from datetime import datetime
import math
from backend.aether_bridge import AetherCoreBiomechanicsBridge, AETHER_NATIVE_ACTIVE

app = FastAPI(title="M-360 Sports IQ + TZANiX Aether Core API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

aether_engine = AetherCoreBiomechanicsBridge(fps=30)

def get_db_connection():
    conn = sqlite3.connect('backend/m360_sports.db')
    conn.row_factory = sqlite3.Row
    return conn

class JugadorCreate(BaseModel):
    nombre_completo: str
    fecha_nacimiento: str
    posicion: str
    dorsal: int
    talla_inicial_cm: float
    peso_inicial_kg: float

class Jugador(JugadorCreate):
    id: int
    fase_ludologica: str

def calcular_fase_ludologica(fecha_nac):
    nacimiento = datetime.strptime(fecha_nac, "%Y-%m-%d")
    edad = (datetime.now() - nacimiento).days // 365
    if edad <= 10:
        return "EGOCENTRICA"
    elif edad <= 13:
        return "SUMA I"
    else:
        return "SUMA II"

@app.get("/api/jugadores", response_model=List[Jugador])
def obtener_jugadores():
    conn = get_db_connection()
    jugadores = conn.execute('SELECT * FROM jugadores').fetchall()
    conn.close()
    return [dict(ix) for ix in jugadores]

@app.post("/api/jugadores", response_model=Jugador)
def crear_jugador(jugador: JugadorCreate):
    fase = calcular_fase_ludologica(jugador.fecha_nacimiento)
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO jugadores (nombre_completo, fecha_nacimiento, posicion, dorsal, talla_inicial_cm, peso_inicial_kg, fase_ludologica)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (jugador.nombre_completo, jugador.fecha_nacimiento, jugador.posicion, jugador.dorsal, jugador.talla_inicial_cm, jugador.peso_inicial_kg, fase))
    conn.commit()
    jugador_id = cursor.lastrowid
    conn.close()
    return {**jugador.dict(), "id": jugador_id, "fase_ludologica": fase}

@app.get("/api/aether/1v1-telemetry")
def get_aether_1v1_telemetry(frame: int = 45):
    """
    Endpoint en tiempo real que ejecuta el motor TZANiX Aether Core (SHANNON_LUT)
    para el Análisis 2 de CEFOR VIDEO (Duelo 1 contra 1 y cambio de dirección).
    """
    # Simulación cinemática parametrizada por frame de un corte 1 contra 1
    phase = frame * 0.15
    knee_flex = 128 + math.sin(phase) * 22  # Baja a <135° durante el cambio de dirección
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
    metrics = aether_engine.analyze_duel_frame(frame, attacker_kps, defender_kps)
    return {
        "engine": "TZANiX Aether Core v0.1.0 (SHANNON_LUT 64-byte aligned)",
        "native_dll_active": AETHER_NATIVE_ACTIVE,
        "cefor_analysis_mode": "Análisis 2: Duelo 1v1 & Cambio de Dirección (Ras de Suelo)",
        "metrics": metrics,
        "smart_clips_generated": [
            {
                "clip_id": "CLIP_1V1_001",
                "window": "00:14.2 - 00:17.2 (3.0s)",
                "event": "Corte brusco 42° + Descenso CoG (Rodilla 122°)",
                "defender_dist_m": 1.35,
                "reaction_delay_ms": 238,
            },
            {
                "clip_id": "CLIP_1V1_002",
                "window": "00:38.5 - 00:41.5 (3.0s)",
                "event": "Finta de hombros (+19° disociación) + Ruptura",
                "defender_dist_m": 1.18,
                "reaction_delay_ms": 274,
            },
        ],
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "system": "M-360 Sports IQ + TZANiX Aether Core"}
