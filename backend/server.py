from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import ai_engine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/video_feed")
def video_feed():
    return StreamingResponse(ai_engine.generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/api/players/{player_id}/metrics")
def get_player_metrics(player_id: str):
    # Mock data to simulate DB
    metrics = {
        "p1": {"speed": 32.5, "distance": 10.2, "stamina": 85},
        "p2": {"speed": 28.1, "distance": 8.5, "stamina": 90},
        "p3": {"speed": 30.0, "distance": 11.1, "stamina": 75},
    }
    return metrics.get(player_id, metrics["p1"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
