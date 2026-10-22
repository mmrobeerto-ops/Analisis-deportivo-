# ⚽ M-360 Sports IQ × CEFOR VIDEO (Powered by TZANiX Aether Core)

Plataforma integral de **Videoanálisis Táctico (Dron 4K)** y **Biomecánica de Duelos 1 contra 1 (Ras de Suelo)** diseñada para el cuerpo técnico del **Profesor Edu Fabian Chio Arellanes (CEFOR)** e impulsada por el motor de silicio de ultra-baja latencia **TZANiX Aether Core**.

---

## 🚀 Arquitectura de Dos Ramas (CEFOR VIDEO + M-360)

| Módulo | Enfoque | Tecnología Clave | Métricas Extraídas |
| :--- | :--- | :--- | :--- |
| **Análisis 1: Táctico desde Dron (4K)** | Colectivo / Posicional (27–35 m de altura) | `YOLOv11m` + Homografía ($87 \times 55\text{ m}$) + Asignación Húngara Continua | • Conexiones entre compañeros ($<20\text{ m}$)<br>• Líneas dinámicas (Defensa, Medios, Delanteros)<br>• Profundidad ($24\text{ m}$), Amplitud ($18\text{ m}$) y Altura del Bloque ($28\text{ m}$)<br>• Detección de jugadores aislados ($>12\text{ m}$) |
| **Análisis 2: Duelo 1 contra 1 y Cambio de Dirección** | Individual / Biomecánico a ras de suelo | `YOLO-Pose` / `MediaPipe` + **TZANiX Aether Core (`SHANNON_LUT`)** | • **Centro de Gravedad (CoG):** Ángulo de flexión de rodilla ($<135^\circ$) antes del corte<br>• **Disociación Cadera-Hombros:** Ángulo que delata la finta<br>• **Distancia al Rival (m)** y **Tiempo de Reacción del Defensor (ms)**<br>• **Clips Inteligentes Automáticos de 3.0 segundos** |

---

## ⚡ Aceleración con TZANiX Aether Core (`backend/aether_bridge.py`)

Para eliminar los cuellos de botella en el procesamiento de video y cálculo de métricas cuadro por cuadro, integramos los principios del motor en Rust **`tzanix-aether-core`**:

1. **`DenseSignalSnapshot` (64-Byte Cache Aligned):** Empaqueta 8 canales cinemáticos del Atacante (`channel_alpha`) y 8 canales del Defensor (`channel_beta`) por cuadro.
2. **Entropía Cinemática de Shannon (`SHANNON_LUT`):** Utiliza una tabla de búsqueda precalculada de 512 entradas libre de bifurcaciones (*branchless*) que detecta el instante exacto de ruptura en el duelo 1 vs 1 en **$\sim 1.85\ \mu\text{s}$**.
3. **Zero-Copy Ring Buffer (Auto-Clips de 3s):** Mantiene una ventana circular en memoria (`3.0s = 90 frames @ 30fps`) para exportar automáticamente los recortes clave del regate o cambio de dirección sin releer el disco.

---

## 📂 Estructura del Repositorio

```text
├── backend/
│   ├── main.py                # Servidor FastAPI + Streaming MJPEG (/api/video_feed) + Telemetría 1v1
│   ├── aether_bridge.py       # Puente de alta velocidad TZANiX Aether Core (SHANNON_LUT & 1v1 Cut Detector)
│   ├── ai_engine.py           # Motor OpenCV Hypermotion V & Pizarra Táctica (Telestrator)
│   └── init_db.py             # Inicializador de Base de Datos SQLite (Fases Ludológicas MBP)
├── frontend_admin/            # Dashboard Ejecutivo 4 Columnas en Next.js + TailwindCSS + Recharts
│   └── src/components/
│       ├── AetherDuelPanel.tsx    # Panel en tiempo real para Análisis 2 (1v1, CoG, Reacción y Auto-Clips 3s)
│       ├── TacticalPitch.tsx      # Visión IA en Vivo (Stream 30 FPS) + Mapa de Influencia y Bloque CEFOR
│       ├── PlayerOverview.tsx     # Ficha Biomecánica / Carta Táctica + Reporte Técnico
│       ├── TacticalMetrics.tsx    # Radar Táctico + Curvas de Ritmo Cardíaco y Distancia
│       └── SidebarRoster.tsx      # Plantilla de Jugadores e Indicadores de Rendimiento
├── vision_engine/             # Módulos de escaneo cefálico (Head Scan) y postura corporal
└── mobile_app/                # Aplicación Móvil en Flutter para Jugadores y Padres
```

---

## 🛠️ Instalación y Ejecución Rápida

### 1. Iniciar el Motor Backend (FastAPI + Stream de Video + Aether Core)
```bash
pip install fastapi uvicorn opencv-python numpy pydantic
python -m uvicorn backend.main:app --port 8080 --reload
```
* Stream de Visión IA en vivo: `http://localhost:8080/api/video_feed`
* Telemetría JSON Aether Core 1v1: `http://localhost:8080/api/aether/1v1-telemetry`

### 2. Iniciar el Dashboard Web (Next.js)
```bash
cd frontend_admin
npm install
npm run dev
```
* Abrir en el navegador: **[http://localhost:3000](http://localhost:3000)**
