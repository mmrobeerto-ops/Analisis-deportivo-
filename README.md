# CEFOR VIDEO — Análisis Táctico desde Dron (4K) y Duelos 1 contra 1

Repositorio técnico de análisis de video para **CEFOR Profesor Chio** (San Luis Río Colorado, Dir. Técnico **Edu Fabian Chio Arellanes**), con aceleración de cálculo e integración de estructuras de baja latencia de **TZANiX Aether Core**.

El sistema está dividido estrictamente en los **dos análisis** definidos por el cuerpo técnico de Edu Chio:

---

## 1. Análisis 1: Táctico desde Dron (Video Aéreo 4K)

El dron graba entre **27 y 35 m de altura** sobre una cancha calibrada mediante homografía a **$87 \times 55\text{ m}$**. Como los jugadores se ven como figuras pequeñas desde arriba, el análisis es 100% **posicional y colectivo**:

### Reglas Geométricas y Tácticas Implementadas
* **Conexiones entre compañeros (`< 20 m`):** Se traza una línea rosa entre cada jugador de campo y sus compañeros cercanos. Es **gruesa y opaca** cuando están cerca (opción clara de pase) y se vuelve **delgada y tenue** conforme se alejan. Si la distancia supera **$20\text{ m}$**, la línea se corta para hacer evidente el hueco cuando el equipo se parte.
* **Alcance firme de $2\text{ m}$:** Cada jugador tiene un radio de acción de $2\text{ m}$ alrededor de su punto de apoyo (`x_m`, `y_m`).
* **Sin porteros en las conexiones:** Solo se conectan los 10 jugadores de campo del equipo de Edu (camiseta negra, etiquetado como equipo `rojo` en el CSV).
* **Líneas dinámicas (3 a 5 líneas):** Agrupación automática en Defensa, Media y Delantera (un mediocampista que adelanta su posición se integra dinámicamente a la línea delantera).
* **Métricas colectivas cuadro por cuadro:**
  * **Largo (Profundidad del bloque):** Distancia en el eje $X$ entre el jugador más retrasado y el más adelantado (referencia medida en `DJI_0279`: promedio **$24\text{ m}$**, rango $10\text{–}38\text{ m}$).
  * **Ancho (Amplitud):** Distancia en el eje $Y$ de banda a banda ocupada por el equipo (promedio **$18\text{ m}$**, rango $11\text{–}29\text{ m}$).
  * **Altura de la defensa:** Distancia promedio de la línea defensiva respecto a la propia portería (promedio **$28\text{ m}$**, rango $5\text{–}47\text{ m}$).
  * **Distancia al compañero más cercano:** Promedio de **$6.0\text{ m}$**.
  * **Jugadores aislados (`> 12 m`):** Jugadores sin ningún socio a menos de $12\text{ m}$ (promedio **$1.2$** por momento).

### Estructura del Archivo de Datos (`<video>_detecciones_equipo.csv`)

| Columna | Descripción exacta |
| :--- | :--- |
| `frame`, `t_seg` | Número de cuadro y segundo exacto del video |
| `x_px`, `y_px` | Punto de apoyo (centro de los pies) en píxeles del cuadro 4K |
| `x_m`, `y_m` | Posición real en metros tras homografía: `x` de portería propia a rival ($0\text{–}87\text{ m}$), `y` de banda a banda ($0\text{–}55\text{ m}$) |
| `ancho_px`, `alto_px` | Dimensiones de la caja delimitadora (`bounding box`) |
| `color_b`, `color_g`, `color_r` | Color promedio del torso (filtrado en espacio LAB para separar camiseta negra vs. celeste bajo sol/sombra) |
| `pista_id` | Identificador de seguimiento continuo (asignación húngara con velocidad máx. $8\text{ m/s}$, memoria de $1.5\text{ s}$ si se pierde y $3.0\text{ s}$ en oclusión) |
| `equipo` | `rojo` (CEFOR Edu, camiseta negra), `azul` (rival, camiseta celeste) u `otro` (árbitro, porteros) |

---

## 2. Análisis 2: Duelo 1 contra 1 y Cambio de Dirección (Ras de Suelo)

Grabado a **ras de suelo** (donde sí se distingue la articulación completa del cuerpo). Su objetivo es medir biomecánicamente cómo el atacante engaña al defensor, rompe la marca y provoca el error:

1. **Seguimiento Esquelético (Pose):** Rastreo de **caderas, hombros, rodillas y pies** tanto del atacante como del defensor (`YOLO-Pose` / `MediaPipe`).
2. **Centro de Gravedad (CoG) y Desaceleración:** Cálculo del ángulo de flexión de rodilla ($\text{Cadera}-\text{Rodilla}-\text{Tobillo}$) y descenso vertical de la pelvis. Detecta el instante exacto en que el jugador "se sienta" ($< 136^\circ$) para frenar y ejecutar el corte.
3. **Orientación de Cadera vs. Hombros (Señal Previa):** Mide la disociación angular entre la línea de los hombros (finta corporal) y el vector real de salida de la cadera.
4. **Distancia al Defensor y Tiempo de Reacción:** Mide a cuántos metros exactos estaba el rival en el momento del cambio de dirección y cuántos milisegundos ($\text{ms}$) tarda en reaccionar.
5. **Clips Inteligentes de 3.0 Segundos:** Recorte automático de la ventana $[t_{\text{corte}} - 1.5\text{ s},\ t_{\text{corte}} + 1.5\text{ s}]$ con las señales previas marcadas para enseñanza directa al jugador.

---

## ⚡ Optimización de Hardware e Ingeniería TZANiX Aether Core

Sobre el entorno de trabajo (**ASUS ROG Strix G18, Intel i9-13980HX, 64 GB RAM, NVIDIA RTX 4080 Laptop 12 GB**), se integra el puente [`backend/aether_bridge.py`](./backend/aether_bridge.py) basado en **TZANiX Aether Core**:

* **Aceleración del Pipeline 4K:** Reducción del cuello de botella de detección en 4K (de $\sim 1\text{ hora}$ por cada $5.4\text{ min}$ de video) mediante exportación a **TensorRT FP16** y empaquetado por lotes (*Tile Batching*) de los recortes de $960\text{ px}$ escalados a $1280\text{ px}$.
* **Cálculo Sin Bloqueos (`SHANNON_LUT` 64-Byte Aligned):** Evaluación de entropía cinemática entre los 8 canales del atacante (`channel_alpha`) y los 8 canales del defensor (`channel_beta`) en **$\sim 1.85\ \mu\text{s}$** para disparar los recortes automáticos de $3.0\text{ s}$ sin sobrecargar el GIL de Python.

---

## 🛠️ Cómo Ejecutar el Laboratorio Táctico Interactivo

### 1. Backend (FastAPI + Puente TZANiX Aether Core)
```bash
pip install fastapi uvicorn numpy pydantic
python -m uvicorn backend.main:app --port 8080 --reload
```

### 2. Frontend Interactivo (Next.js)
```bash
cd frontend_admin
npm install
npx next dev --webpack -p 3000
```
Abre **[http://localhost:3000](http://localhost:3000)** en el navegador:
* En la pestaña **1. Análisis Táctico desde Dron (87 × 55 m)** puedes arrastrar con el mouse a cualquiera de los 10 jugadores de campo y ver cómo las **conexiones rosas**, las **líneas dinámicas**, el **largo**, **ancho**, **altura de defensa** y **jugadores aislados (`>12m`)** se recalculan en tiempo real siguiendo exactamente a cada jugador, además de exportar el archivo `.csv` oficial.
* En la pestaña **2. Análisis 1 contra 1 y Cambio de Dirección** puedes mover el deslizador de tiempo ($0.0\text{ s}$ a $3.0\text{ s}$) o arrastrar al Atacante y al Defensor: el **esqueleto articulado**, el **ángulo de rodilla (CoG)**, el **vector de corte** y la **distancia en metros** están 100% anclados al cuerpo del jugador.
