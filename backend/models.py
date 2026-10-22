from pydantic import BaseModel
from typing import List, Optional

class VideoProcessRequest(BaseModel):
    partido_id: str
    jugador_id: str
    video_url: str
    sub_etapa_ludologica: str

class EvaluacionResult(BaseModel):
    causa_raiz: str
    zona_desarrollo: str
    score_fisico: float
    score_iq: float
    score_tactica: float
    nivel_global: float
    
class MicrocicloPrescrito(BaseModel):
    estrategia_mbp: str
    tarea: str
    mindset: str
