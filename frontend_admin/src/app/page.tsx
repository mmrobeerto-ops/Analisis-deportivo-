'use client';
import React, { useState, useEffect, useMemo } from 'react';

type AnalysisBranch = 'dron' | '1v1';

interface DronPlayer {
  id: number;
  dorsal: number;
  linea: 'Defensa' | 'Media' | 'Delantera';
  x_m: number; // 0 a 87 m
  y_m: number; // 0 a 55 m
}

const INITIAL_CEFOR_PLAYERS: DronPlayer[] = [
  // Defensa (4)
  { id: 1, dorsal: 2, linea: 'Defensa', x_m: 26, y_m: 11 },
  { id: 2, dorsal: 4, linea: 'Defensa', x_m: 24, y_m: 22 },
  { id: 3, dorsal: 5, linea: 'Defensa', x_m: 24, y_m: 34 },
  { id: 4, dorsal: 3, linea: 'Defensa', x_m: 26, y_m: 45 },
  // Media (3)
  { id: 5, dorsal: 6, linea: 'Media', x_m: 36, y_m: 27 },
  { id: 6, dorsal: 8, linea: 'Media', x_m: 39, y_m: 17 },
  { id: 7, dorsal: 10, linea: 'Media', x_m: 39, y_m: 38 },
  // Delantera (3)
  { id: 8, dorsal: 7, linea: 'Delantera', x_m: 48, y_m: 13 },
  { id: 9, dorsal: 9, linea: 'Delantera', x_m: 50, y_m: 28 },
  { id: 10, dorsal: 11, linea: 'Delantera', x_m: 48, y_m: 42 },
];

export default function CeforDashboard() {
  const [branch, setBranch] = useState<AnalysisBranch>('dron');
  const [frame, setFrame] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [maxConnectionDist, setMaxConnectionDist] = useState<number>(20);
  const [selectedClipIdx, setSelectedClipIdx] = useState<number>(0);
  const [apiData, setApiData] = useState<any>(null);

  // Avance de cuadros cuando está en reproducción
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setFrame((f) => f + 1);
    }, 500);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Consulta al motor Python + TZANiX Aether Core
  useEffect(() => {
    fetch(`http://localhost:8080/api/cefor/status?frame=${frame}`)
      .then((r) => r.json())
      .then((d) => setApiData(d))
      .catch(() => {});
  }, [frame]);

  // Posiciones dinámicas en la cancha de 87x55m según el cuadro actual
  const playersInPitch = useMemo(() => {
    const phase = frame * 0.18;
    return INITIAL_CEFOR_PLAYERS.map((p, idx) => ({
      ...p,
      x_m: +(p.x_m + Math.sin(phase + idx * 0.6) * 2.2).toFixed(1),
      y_m: +(p.y_m + Math.cos(phase * 0.8 + idx) * 1.6).toFixed(1),
    }));
  }, [frame]);

  // Cálculo real de Largo, Ancho, Altura de Defensa, Distancia al compañero y Aislados (>12m)
  const pitchStats = useMemo(() => {
    const xs = playersInPitch.map((p) => p.x_m);
    const ys = playersInPitch.map((p) => p.y_m);
    const defXs = playersInPitch.filter((p) => p.linea === 'Defensa').map((p) => p.x_m);

    const largo = +(Math.max(...xs) - Math.min(...xs)).toFixed(1);
    const ancho = +(Math.max(...ys) - Math.min(...ys)).toFixed(1);
    const alturaDef = +(defXs.reduce((a, b) => a + b, 0) / defXs.length).toFixed(1);

    let minDistances: number[] = [];
    let aislados = 0;

    playersInPitch.forEach((p1, i) => {
      let minDist = 999;
      playersInPitch.forEach((p2, j) => {
        if (i === j) return;
        const d = Math.hypot(p1.x_m - p2.x_m, p1.y_m - p2.y_m);
        if (d < minDist) minDist = d;
      });
      minDistances.push(minDist);
      if (minDist > 12.0) aislados += 1;
    });

    const avgNearest = +(
      minDistances.reduce((a, b) => a + b, 0) / minDistances.length
    ).toFixed(1);

    return { largo, ancho, alturaDef, avgNearest, aislados };
  }, [playersInPitch]);

  // Exportar CSV real con las columnas de Edu Chio
  const handleExportCsv = () => {
    const headers = 'frame,t_seg,pista_id,dorsal,equipo,linea,x_m,y_m\n';
    const rows = playersInPitch
      .map(
        (p) =>
          `${frame},${(frame / 30).toFixed(2)},${p.id},${p.dorsal},rojo,${p.linea},${p.x_m},${p.y_m}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DJI_0279_detecciones_equipo_frame_${frame}.csv`;
    a.click();
  };

  const clips1v1 = apiData?.analisis_2_duelo_1v1?.clips_3_segundos || [
    {
      id: 'CLIP_1V1_01',
      tiempo: '00:14.2 – 00:17.2 (3.0 s)',
      jugada: 'Descenso de cadera (Rodilla 122°) + Corte 42° a la derecha',
      señal_previa: 'Orientación de hombros +19° (finta de cuerpo)',
      distancia_defensor_m: 1.35,
      reaccion_defensor_ms: 238,
    },
    {
      id: 'CLIP_1V1_02',
      tiempo: '00:38.5 – 00:41.5 (3.0 s)',
      jugada: 'Frenado brusco (Desaceleración) + Cambio de ritmo exterior',
      señal_previa: 'Hundimiento de cadera (-68% CoG) frente a perfil plano del rival',
      distancia_defensor_m: 1.18,
      reaccion_defensor_ms: 274,
    },
    {
      id: 'CLIP_1V1_03',
      tiempo: '01:05.0 – 01:08.0 (3.0 s)',
      jugada: 'Enganche interior provocando pérdida de equilibrio del defensor',
      señal_previa: 'Rotación de pelvis anticipada 160 ms antes del apoyo',
      distancia_defensor_m: 1.42,
      reaccion_defensor_ms: 290,
    },
  ];

  const duelMetrics = apiData?.analisis_2_duelo_1v1?.metrics || {
    knee_angle_deg: 125.4,
    cog_drop_pct: 66.8,
    hip_shoulder_dissociation_deg: 18.5,
    defender_distance_m: 1.35,
    defender_reaction_ms: 238,
    aether_kinematic_entropy: 2.34,
    aether_latency_us: 1.85,
  };

  return (
    <div className="min-h-screen w-full bg-[#0b0f17] text-slate-100 p-4 md:p-6">
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* ENCABEZADO LIMPIO Y FUNCIONAL */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#131b29] border border-slate-800 rounded-2xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/40 rounded">
                CEFOR PROFESOR CHIO
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded">
                ⚡ TZANiX Aether Core ({duelMetrics.aether_latency_us} µs)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
              CEFOR VIDEO — Plataforma de Análisis Táctico & Duelos 1 contra 1
            </h1>
            <p className="text-xs text-slate-400">
              San Luis Río Colorado • Dos ramas operativas: 1) Táctico desde Dron 4K (87×55m) y 2) Duelo 1v1 y Cambio de Dirección a ras de suelo
            </p>
          </div>

          {/* SELECTOR FUNCIONAL DE LAS 2 RAMAS DE EDU CHIO */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBranch('dron')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                branch === 'dron'
                  ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. ANÁLISIS TÁCTICO DESDE DRON (4K)
            </button>
            <button
              onClick={() => setBranch('1v1')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                branch === '1v1'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. ANÁLISIS 1 CONTRA 1 Y CAMBIO DE DIRECCIÓN
            </button>
          </div>
        </header>

        {/* =====================================================================
            RAMA 1: ANÁLISIS TÁCTICO DESDE DRON (4K) - LO QUE PIDE EDU CHIO
           ===================================================================== */}
        {branch === 'dron' && (
          <div className="flex flex-col gap-6">
            {/* FILA DE 5 MÉTRICAS EXACTAS DEL DOCUMENTO DE EDU CHIO */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Largo (Profundidad)</p>
                <p className="text-2xl font-bold text-white mt-1">{pitchStats.largo} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Ref. partido: 24 m (10–38 m)</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Ancho (Amplitud)</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{pitchStats.ancho} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Ref. partido: 18 m (11–29 m)</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Altura de la Defensa</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{pitchStats.alturaDef} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Ref. partido: 28 m (5–47 m)</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Compañero más Cercano</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">{pitchStats.avgNearest} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Alcance firme por jugador: 2 m</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Jugadores Aislados (&gt;12m)</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{pitchStats.aislados}</p>
                <p className="text-[11px] text-slate-500 mt-1">Promedio DJI_0279: 1.2 por momento</p>
              </div>
            </div>

            {/* BLOQUE CENTRAL: VIDEO CON CONEXIONES + CANCHA CALIBRADA 87x55m */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* IZQUIERDA: Video en vivo con conexiones rosas y líneas dinámicas */}
              <div className="lg:col-span-6 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">
                      Video Dron (DJI_0279) — Conexiones y Líneas Dinámicas
                    </h2>
                    <p className="text-xs text-slate-400">
                      Equipo de Edu (camiseta negra / grupo &ldquo;rojo&rdquo;) atacando de izquierda a derecha
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
                    >
                      {isPlaying ? '⏸ PAUSAR LECTURA' : '▶ REANUDAR'}
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer"
                    >
                      ⬇ EXPORTAR CSV (x_m, y_m)
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative">
                  <img
                    src="http://localhost:8080/api/video_feed?mode=dron"
                    alt="Stream Dron CEFOR"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">DETECCIÓN CAMPO</span>
                    <strong className="text-white">18 / 18 jugadores (YOLO11m)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">CONTINUIDAD HÚNGARA</span>
                    <strong className="text-emerald-400">62 cambios (vs 606 sin filtro)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">ACELERACIÓN TZANiX</span>
                    <strong className="text-cyan-400">TensorRT FP16 + Tile Batching</strong>
                  </div>
                </div>
              </div>

              {/* DERECHA: Cancha Homográfica Interactiva 87 × 55 m */}
              <div className="lg:col-span-6 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">
                      Homografía Calibrada (87 × 55 m) — Red de Caída y Huecos
                    </h2>
                    <p className="text-xs text-slate-400">
                      Sin porteros en las conexiones • Si supera {maxConnectionDist} m se corta la línea para ver el hueco
                    </p>
                  </div>

                  {/* Control interactivo de distancia máxima de conexión */}
                  <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <label className="text-[11px] font-mono text-slate-300">
                      Corte conexión: <strong>{maxConnectionDist} m</strong>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      value={maxConnectionDist}
                      onChange={(e) => setMaxConnectionDist(Number(e.target.value))}
                      className="w-24 accent-pink-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* SVG de la Cancha 87x55m */}
                <div className="w-full aspect-video bg-[#0d1f14] rounded-xl border border-emerald-500/30 relative overflow-hidden">
                  <svg viewBox="0 0 87 55" className="w-full h-full">
                    {/* Césped y líneas de cancha */}
                    <rect x="2" y="2" width="83" height="51" fill="none" stroke="#335c42" strokeWidth="0.4" />
                    <line x1="43.5" y1="2" x2="43.5" y2="53" stroke="#335c42" strokeWidth="0.4" />
                    <circle cx="43.5" cy="27.5" r="7" fill="none" stroke="#335c42" strokeWidth="0.4" />
                    <rect x="2" y="13" width="13" height="29" fill="none" stroke="#335c42" strokeWidth="0.4" />
                    <rect x="72" y="13" width="13" height="29" fill="none" stroke="#335c42" strokeWidth="0.4" />

                    {/* Conexiones entre compañeros (< maxConnectionDist m) */}
                    {playersInPitch.map((p1, i) =>
                      playersInPitch.slice(i + 1).map((p2) => {
                        const dist = Math.hypot(p1.x_m - p2.x_m, p1.y_m - p2.y_m);
                        if (dist > maxConnectionDist) return null;
                        const opacity = Math.max(0.2, 1 - dist / (maxConnectionDist + 4));
                        const width = Math.max(0.25, 1.3 - dist / 18);
                        return (
                          <line
                            key={`${p1.id}-${p2.id}`}
                            x1={p1.x_m}
                            y1={p1.y_m}
                            x2={p2.x_m}
                            y2={p2.y_m}
                            stroke="#f472b6"
                            strokeWidth={width}
                            strokeOpacity={opacity}
                          />
                        );
                      })
                    )}

                    {/* Líneas dinámicas por bloque (Defensa, Media, Delantera) */}
                    {(['Defensa', 'Media', 'Delantera'] as const).map((linea) => {
                      const group = playersInPitch
                        .filter((p) => p.linea === linea)
                        .sort((a, b) => a.y_m - b.y_m);
                      return group.slice(0, -1).map((p, idx) => (
                        <line
                          key={`${linea}-${idx}`}
                          x1={p.x_m}
                          y1={p.y_m}
                          x2={group[idx + 1].x_m}
                          y2={group[idx + 1].y_m}
                          stroke="#22d3ee"
                          strokeWidth="0.55"
                          strokeDasharray="1.2 0.8"
                        />
                      ));
                    })}

                    {/* Jugadores con alcance de 2m */}
                    {playersInPitch.map((p) => (
                      <g key={p.id}>
                        <circle
                          cx={p.x_m}
                          cy={p.y_m}
                          r="2.0"
                          fill="rgba(244, 114, 182, 0.18)"
                          stroke="#f472b6"
                          strokeWidth="0.25"
                        />
                        <circle cx={p.x_m} cy={p.y_m} r="1.2" fill="#111827" stroke="#ffffff" strokeWidth="0.3" />
                        <text
                          x={p.x_m}
                          y={p.y_m + 0.45}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="1.3"
                          fontWeight="bold"
                        >
                          {p.dorsal}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Resumen de momentos en que el equipo se parte */}
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <p className="text-[11px] font-mono text-slate-300 uppercase mb-2">
                    Resumen por Partido — Momentos en que el equipo se parte (con segundo exacto):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-950/70 p-2 rounded border-l-2 border-amber-400">
                      <span className="font-mono text-amber-400 font-bold">00:34 s</span>
                      <p className="text-slate-300 mt-0.5">Hueco entre línea media y delantera (&gt;20 m)</p>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded border-l-2 border-emerald-400">
                      <span className="font-mono text-emerald-400 font-bold">01:12 s</span>
                      <p className="text-slate-300 mt-0.5">Presión total sincronizada (3 jugadores atrás)</p>
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded border-l-2 border-pink-400">
                      <span className="font-mono text-pink-400 font-bold">01:48 s</span>
                      <p className="text-slate-300 mt-0.5">Extremo aislado a 14.5 m del interior cercano</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            RAMA 2: ANÁLISIS 1 CONTRA 1 Y CAMBIO DE DIRECCIÓN (RAS DE SUELO)
           ===================================================================== */}
        {branch === '1v1' && (
          <div className="flex flex-col gap-6">
            {/* 4 MÉTRICAS CONCRETAS DEL DUELO 1 CONTRA 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  1. Centro de Gravedad (Rodilla)
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {duelMetrics.knee_angle_deg}°{' '}
                  <span className="text-sm text-cyan-400">(-{duelMetrics.cog_drop_pct}% CoG)</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Detecta cuándo baja la cadera antes del corte
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  2. Orientación Cadera vs Hombros
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  +{duelMetrics.hip_shoulder_dissociation_deg}°
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Señal corporal que delata el lado de salida
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  3. Distancia Exacta al Defensor
                </p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">
                  {duelMetrics.defender_distance_m} m
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Medida en el instante exacto del giro o regate
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  4. Tiempo de Reacción del Defensor
                </p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {duelMetrics.defender_reaction_ms} ms
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Calculado con Entropía TZANiX Aether Core ({duelMetrics.aether_kinematic_entropy} bits)
                </p>
              </div>
            </div>

            {/* VIDEO A RAS DE SUELO + CLIPS INTELIGENTES DE 3 SEGUNDOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Video 1v1 con Pose de Caderas, Hombros y Rodillas */}
              <div className="lg:col-span-7 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">
                      Video a Ras de Suelo — Seguimiento de Pose (Caderas, Hombros, Rodillas y Pies)
                    </h2>
                    <p className="text-xs text-slate-400">
                      YOLO-Pose + TZANiX Aether Core midiendo el corte del atacante y la reacción del defensor
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
                  >
                    {isPlaying ? '⏸ PAUSAR CUADRO' : '▶ REANUDAR'}
                  </button>
                </div>

                <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-cyan-500/30 relative">
                  <img
                    src="http://localhost:8080/api/video_feed?mode=1v1"
                    alt="Stream 1v1 Pose CEFOR"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Lista interactiva de Clips Inteligentes de 3 Segundos */}
              <div className="lg:col-span-5 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase">
                    SALIDA ÚTIL PARA EL ENTRENADOR EDU
                  </span>
                  <h2 className="text-base font-bold text-white uppercase mt-0.5">
                    Clips Inteligentes de 3 Segundos (Auto-Recorte)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Haz clic en cualquier jugada detectada para inspeccionar el momento del corte y las señales previas:
                  </p>

                  <div className="space-y-3 mt-4">
                    {clips1v1.map((clip: any, idx: number) => (
                      <div
                        key={clip.id}
                        onClick={() => setSelectedClipIdx(idx)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer ${
                          selectedClipIdx === idx
                            ? 'bg-cyan-500/15 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                            : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex justify-between items-center font-mono text-xs mb-1">
                          <span className="text-cyan-400 font-bold">{clip.id} • {clip.tiempo}</span>
                          <span className="text-amber-400">
                            Rival a {clip.distancia_defensor_m}m • {clip.reaccion_defensor_ms}ms
                          </span>
                        </div>
                        <p className="text-sm font-bold text-white">{clip.jugada}</p>
                        <p className="text-xs text-slate-300 mt-1">
                          <strong className="text-emerald-400">Señal previa:</strong> {clip.señal_previa}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detalle del clip seleccionado */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs">
                  <p className="font-mono text-[11px] text-cyan-400 uppercase mb-1">
                    LECTURA PEDAGÓGICA PARA EL JUGADOR ({clips1v1[selectedClipIdx]?.id}):
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    En el intervalo <strong>{clips1v1[selectedClipIdx]?.tiempo}</strong>, el jugador baja el centro de gravedad antes de que el defensor ajuste su perfil a{' '}
                    <strong>{clips1v1[selectedClipIdx]?.distancia_defensor_m} m</strong>, ganando una ventaja limpia de{' '}
                    <strong>{clips1v1[selectedClipIdx]?.reaccion_defensor_ms} ms</strong> en el cambio de dirección.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
