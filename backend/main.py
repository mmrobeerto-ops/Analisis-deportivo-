from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import shutil
import time
import cv2
import numpy as np
import os
from backend.video_tracker import RealVideoPlayerTracker
from backend.aether_bridge import AETHER_NATIVE_ACTIVE

app = FastAPI(title="CEFOR VIDEO — Subida de Videos & Rastreo Real de Jugadores")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join("backend", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Estado global del video cargado por el usuario (empieza vacío hasta que el usuario suba uno)
CURRENT_VIDEO_STATE = {
    "video_path": None,
    "filename": None,
}

tracker = RealVideoPlayerTracker()


@app.post("/api/upload-video")
async def upload_video(file: UploadFile = File(...)):
    """
    Recibe cualquier archivo de video (.mp4, .mov, .avi) desde el navegador,
    lo guarda en backend/uploads y reinicia el rastreador real de jugadores.
    """
    safe_name = os.path.basename(file.filename or "partido_cefor.mp4")
    dest_path = os.path.join(UPLOAD_DIR, safe_name)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    CURRENT_VIDEO_STATE["video_path"] = dest_path
    CURRENT_VIDEO_STATE["filename"] = safe_name
    tracker.tracks.clear()

    return {
        "status": "uploaded",
        "filename": safe_name,
        "stream_url": "/api/video_feed",
    }


@app.post("/api/clear-video")
def clear_video():
    CURRENT_VIDEO_STATE["video_path"] = None
    CURRENT_VIDEO_STATE["filename"] = None
    tracker.tracks.clear()
    return {"status": "cleared"}


def generate_tracked_stream(mode: str = "dron", max_conn_m: float = 20.0):
    """
    Lee cuadro por cuadro el video subido por el usuario, detecta las siluetas reales
    sobre el césped y dibuja los anillos/conexiones/esqueletos exactamente pegados a los jugadores.
    """
    last_path = CURRENT_VIDEO_STATE["video_path"]
    cap = cv2.VideoCapture(last_path) if (last_path and os.path.exists(last_path)) else None
    frame_idx = 0

    while True:
        cur_path = CURRENT_VIDEO_STATE["video_path"]
        if cur_path != last_path:
            if cap is not None:
                cap.release()
            last_path = cur_path
            cap = cv2.VideoCapture(last_path) if (last_path and os.path.exists(last_path)) else None
            frame_idx = 0

        if cap is not None and cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()

            if ret and frame is not None:
                frame_idx += 1
                frame = cv2.resize(frame, (880, 495))
                frame = tracker.process_and_draw(frame, frame_idx, mode=mode, max_conn_m=max_conn_m)
            else:
                frame = np.zeros((495, 880, 3), dtype=np.uint8)
        else:
            frame = np.zeros((495, 880, 3), dtype=np.uint8)
            cv2.putText(
                frame,
                "SUBE UN VIDEO (.MP4) ARRIBA PARA INICIAR EL SEGUIMIENTO REAL",
                (140, 245),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.58,
                (180, 195, 210),
                1,
                cv2.LINE_AA,
            )

        ok, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), 82])
        if ok:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n"
            )
        time.sleep(0.033)


@app.get("/api/video_feed")
def video_feed(mode: str = "dron", max_conn_m: float = 20.0):
    return StreamingResponse(
        generate_tracked_stream(mode=mode, max_conn_m=max_conn_m),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/api/cefor/live-telemetry")
def get_live_telemetry():
    return {
        "has_video": CURRENT_VIDEO_STATE["video_path"] is not None,
        "filename": CURRENT_VIDEO_STATE["filename"],
        "aether_native": AETHER_NATIVE_ACTIVE,
        "telemetry": tracker.latest_telemetry,
    }
