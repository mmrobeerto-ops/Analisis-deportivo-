'use client';
import React, { useState, useMemo, useRef, useEffect } from 'react';

type AnalysisBranch = 'dron' | '1v1';

interface DronPlayer {
  id: number;
  dorsal: number;
  nombre: string;
  linea: 'Defensa' | 'Media' | 'Delantera';
  x_m: number;
  y_m: number;
}

const INITIAL_CEFOR_PLAYERS: DronPlayer[] = [
  { id: 1, dorsal: 2, nombre: 'Lateral Der.', linea: 'Defensa', x_m: 24, y_m: 10 },
  { id: 2, dorsal: 4, nombre: 'Central Der.', linea: 'Defensa', x_m: 22, y_m: 22 },
  { id: 3, dorsal: 5, nombre: 'Central Izq.', linea: 'Defensa', x_m: 22, y_m: 34 },
  { id: 4, dorsal: 3, nombre: 'Lateral Izq.', linea: 'Defensa', x_m: 24, y_m: 45 },
  { id: 5, dorsal: 6, nombre: 'Contención', linea: 'Media', x_m: 35, y_m: 27.5 },
  { id: 6, dorsal: 8, nombre: 'Interior Der.', linea: 'Media', x_m: 38, y_m: 16 },
  { id: 7, dorsal: 10, nombre: 'Interior Izq.', linea: 'Media', x_m: 38, y_m: 39 },
  { id: 8, dorsal: 7, nombre: 'Extremo Der.', linea: 'Delantera', x_m: 47, y_m: 12 },
  { id: 9, dorsal: 9, nombre: 'Centro Delantero', linea: 'Delantera', x_m: 49, y_m: 27.5 },
  { id: 10, dorsal: 11, nombre: 'Extremo Izq.', linea: 'Delantera', x_m: 47, y_m: 43 },
];

export default function CeforDashboard() {
  const [branch, setBranch] = useState<AnalysisBranch>('dron');

  // --- ESTADO DE SUBIDA DE VIDEO REAL ---
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [streamKey, setStreamKey] = useState<number>(1);
  const [liveTelemetry, setLiveTelemetry] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- ESTADO DE LA CANCHA INTERACTIVA (87x55m) ---
  const [players, setPlayers] = useState<DronPlayer[]>(INITIAL_CEFOR_PLAYERS);
  const [draggingPlayerId, setDraggingPlayerId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(6);
  const [maxConnDist, setMaxConnDist] = useState<number>(20);
  const pitchSvgRef = useRef<SVGSVGElement | null>(null);

  // --- ESTADO DEL LABORATORIO 1v1 ---
  const [duelPhase, setDuelPhase] = useState<number>(65);
  const [attackerPos, setAttackerPos] = useState<{ x: number; y: number }>({ x: 38, y: 27.5 });
  const [defenderPos, setDefenderPos] = useState<{ x: number; y: number }>({ x: 52, y: 27.5 });
  const [dragging1v1, setDragging1v1] = useState<'attacker' | 'defender' | null>(null);
  const duelSvgRef = useRef<SVGSVGElement | null>(null);

  // Consultar telemetría en vivo cuando hay un video subido
  useEffect(() => {
    const timer = setInterval(() => {
      fetch('http://localhost:8080/api/cefor/live-telemetry')
        .then((r) => r.json())
        .then((data) => {
          setLiveTelemetry(data);
          if (data?.has_video && data?.filename && !uploadedFilename) {
            setUploadedFilename(data.filename);
          }
          // Si el rastreador de video detecta jugadores reales en cancha, actualiza el mapa homográfico
          if (
            data?.has_video &&
            data?.telemetry?.dron?.detections &&
            data.telemetry.dron.detections.length >= 3 &&
            draggingPlayerId === null
          ) {
            const dets = data.telemetry.dron.detections;
            setPlayers((prev) =>
              prev.map((p, idx) => {
                const d = dets[idx];
                if (!d) return p;
                return {
                  ...p,
                  x_m: d.x_m,
                  y_m: d.y_m,
                };
              })
            );
          }
        })
        .catch(() => {});
    }, 600);
    return () => clearInterval(timer);
  }, [uploadedFilename, draggingPlayerId]);

  // Subir archivo de video (.mp4, .mov, .avi) al motor OpenCV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8080/api/upload-video', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data?.filename) {
        setUploadedFilename(data.filename);
        setStreamKey(Date.now());
      }
    } catch (err) {
      alert('Verifica que el servidor backend en el puerto 8080 esté activo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearVideo = async () => {
    await fetch('http://localhost:8080/api/clear-video', { method: 'POST' }).catch(() => {});
    setUploadedFilename(null);
    setPlayers(INITIAL_CEFOR_PLAYERS);
  };

  // Arrastre en la cancha 87x55m
  const handlePitchMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingPlayerId === null || !pitchSvgRef.current) return;
    const rect = pitchSvgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 87;
    const y = ((e.clientY - rect.top) / rect.height) * 55;
    const clampedX = +Math.max(2, Math.min(85, x)).toFixed(1);
    const clampedY = +Math.max(2, Math.min(53, y)).toFixed(1);

    setPlayers((prev) =>
      prev.map((p) => (p.id === draggingPlayerId ? { ...p, x_m: clampedX, y_m: clampedY } : p))
    );
  };

  // Arrastre en el duelo 1v1
  const handleDuelMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging1v1 || !duelSvgRef.current) return;
    const rect = duelSvgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 55;
    const cx = +Math.max(10, Math.min(90, x)).toFixed(1);
    const cy = +Math.max(8, Math.min(47, y)).toFixed(1);

    if (dragging1v1 === 'attacker') setAttackerPos({ x: cx, y: cy });
    if (dragging1v1 === 'defender') setDefenderPos({ x: cx, y: cy });
  };

  // Métricas colectivas en vivo
  const pitchStats = useMemo(() => {
    const xs = players.map((p) => p.x_m);
    const ys = players.map((p) => p.y_m);
    const defXs = players.filter((p) => p.linea === 'Defensa').map((p) => p.x_m);

    const largo = +(Math.max(...xs) - Math.min(...xs)).toFixed(1);
    const ancho = +(Math.max(...ys) - Math.min(...ys)).toFixed(1);
    const alturaDef = +(defXs.reduce((a, b) => a + b, 0) / defXs.length).toFixed(1);

    let minDistances: number[] = [];
    let aisladosIds: number[] = [];

    players.forEach((p1, i) => {
      let minDist = 999;
      players.forEach((p2, j) => {
        if (i === j) return;
        const d = Math.hypot(p1.x_m - p2.x_m, p1.y_m - p2.y_m);
        if (d < minDist) minDist = d;
      });
      minDistances.push(minDist);
      if (minDist > 12.0) aisladosIds.push(p1.dorsal);
    });

    const avgNearest = +(minDistances.reduce((a, b) => a + b, 0) / minDistances.length).toFixed(1);

    return {
      largo,
      ancho,
      alturaDef,
      avgNearest,
      aisladosCount: aisladosIds.length,
      aisladosDorsales: aisladosIds,
    };
  }, [players]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) || players[0],
    [players, selectedPlayerId]
  );

  const duelStats = useMemo(() => {
    const rawDist = Math.hypot(attackerPos.x - defenderPos.x, attackerPos.y - defenderPos.y);
    const dist_m = +(Math.max(0.45, rawDist / 10.0)).toFixed(2);
    const cutIntensity = Math.exp(-Math.pow((duelPhase - 65) / 22, 2));
    const kneeAngle = +(168 - cutIntensity * 48).toFixed(1);
    const cogDropPct = +Math.max(0, Math.min(100, (170 - kneeAngle) * 1.6)).toFixed(1);
    const hipShoulderDeg = +(4 + cutIntensity * 21).toFixed(1);
    const cutAngleDeg = +(8 + cutIntensity * 38).toFixed(1);
    const entropy = +(1.45 + cutIntensity * 1.35 + (2.0 / (dist_m + 0.5)) * 0.4).toFixed(3);
    const reactionMs = Math.round(155 + cutIntensity * 95 + hipShoulderDeg * 2.2);

    return {
      dist_m,
      kneeAngle,
      cogDropPct,
      hipShoulderDeg,
      cutAngleDeg,
      entropy,
      reactionMs,
      cutIntensity,
    };
  }, [duelPhase, attackerPos, defenderPos]);

  const handleExportCsv = () => {
    const headers = 'frame,t_seg,pista_id,dorsal,equipo,linea,x_m,y_m\n';
    const rows = players
      .map((p) => `1,0.03,${p.id},${p.dorsal},rojo,${p.linea},${p.x_m},${p.y_m}`)
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cefor_detecciones_equipo.csv';
    a.click();
  };

  return (
    <div
      className="min-h-screen w-full bg-[#0b0f17] text-slate-100 p-4 md:p-6 select-none"
      onMouseUp={() => {
        setDraggingPlayerId(null);
        setDragging1v1(null);
      }}
    >
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        {/* ENCABEZADO CON SUBIDA DE VIDEO REAL */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#131b29] border border-slate-800 rounded-2xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/40 rounded">
                CEFOR PROFESOR CHIO
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded">
                ⚡ Rastreador Real de Siluetas + TZANiX Aether Core
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
              CEFOR VIDEO — Análisis Táctico desde Dron (4K) & Duelo 1 contra 1
            </h1>
            <p className="text-xs text-slate-400">
              Sube cualquier video (.mp4) para que el detector siga los pies reales sobre el césped, o arrastra los jugadores en la pizarra homográfica.
            </p>
          </div>

          {/* BOTONES DE SUBIDA DE VIDEO Y RAMAS */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/x-msvideo,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.35)]"
            >
              {isUploading ? '⏳ SUBIENDO VIDEO...' : '📤 SUBIR VIDEO (.MP4)'}
            </button>

            {uploadedFilename && (
              <button
                onClick={handleClearVideo}
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
              >
                ✖ QUITAR VIDEO ({uploadedFilename})
              </button>
            )}

            <button
              onClick={() => setBranch('dron')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                branch === 'dron'
                  ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. ANÁLISIS DRON (87×55m)
            </button>
            <button
              onClick={() => setBranch('1v1')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                branch === '1v1'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              2. ANÁLISIS 1 VS 1 (POSE)
            </button>
          </div>
        </header>

        {/* SI EL USUARIO SUBE UN VIDEO, SE MUESTRA EL RASTREADOR REAL DE PIES SOBRE EL CÉSPED */}
        {uploadedFilename && (
          <div className="bg-[#131b29] border border-emerald-500/40 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 uppercase font-bold">
                  ● VIDEO SUBIDO ACTIVO: {uploadedFilename}
                </span>
                <h2 className="text-sm font-bold text-white uppercase">
                  Seguimiento Real de Jugadores sobre el Césped ({branch === 'dron' ? 'Modo Dron: Conexiones <20m' : 'Modo 1v1: Esqueleto Anclado al Cuerpo'})
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-300">
                Jugadores detectados en cancha:{' '}
                <strong className="text-emerald-400">
                  {liveTelemetry?.telemetry?.dron?.players_detected ?? 0}
                </strong>
              </span>
            </div>

            <div className="w-full max-h-[480px] aspect-video bg-black rounded-xl overflow-hidden border border-slate-800">
              <img
                key={`${streamKey}-${branch}-${maxConnDist}`}
                src={`http://localhost:8080/api/video_feed?mode=${branch}&max_conn_m=${maxConnDist}&t=${streamKey}`}
                alt="Video procesado con seguimiento real"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        )}

        {/* RAMA 1: PIZARRA HOMOGRÁFICA 87x55m */}
        {branch === 'dron' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Largo (Profundidad)</p>
                <p className="text-2xl font-bold text-white mt-1">{pitchStats.largo} m</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Ancho (Amplitud)</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{pitchStats.ancho} m</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Altura de la Defensa</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{pitchStats.alturaDef} m</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Compañero más Cercano</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">{pitchStats.avgNearest} m</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Jugadores Aislados (&gt;12m)</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{pitchStats.aisladosCount}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-white uppercase">
                    Cancha Calibrada (87 × 55 m) — Las líneas siguen 100% a cada jugador
                  </h2>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-mono text-slate-300">
                      Corte conexión: <strong>{maxConnDist}m</strong>
                    </label>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      value={maxConnDist}
                      onChange={(e) => setMaxConnDist(Number(e.target.value))}
                      className="w-24 accent-pink-500 cursor-pointer"
                    />
                    <button
                      onClick={handleExportCsv}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-pointer"
                    >
                      ⬇ Exportar CSV
                    </button>
                  </div>
                </div>

                <div className="w-full aspect-[87/55] bg-[#0d2116] rounded-xl border border-emerald-500/30 relative overflow-hidden">
                  <svg
                    ref={pitchSvgRef}
                    viewBox="0 0 87 55"
                    onMouseMove={handlePitchMouseMove}
                    className="w-full h-full cursor-crosshair"
                  >
                    <rect x="2" y="2" width="83" height="51" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <line x1="43.5" y1="2" x2="43.5" y2="53" stroke="#3b6e52" strokeWidth="0.4" />
                    <circle cx="43.5" cy="27.5" r="7" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <rect x="2" y="13" width="13" height="29" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <rect x="72" y="13" width="13" height="29" fill="none" stroke="#3b6e52" strokeWidth="0.4" />

                    {players.map((p1, i) =>
                      players.slice(i + 1).map((p2) => {
                        const dist = Math.hypot(p1.x_m - p2.x_m, p1.y_m - p2.y_m);
                        if (dist > maxConnDist) return null;
                        return (
                          <line
                            key={`${p1.id}-${p2.id}`}
                            x1={p1.x_m}
                            y1={p1.y_m}
                            x2={p2.x_m}
                            y2={p2.y_m}
                            stroke="#f472b6"
                            strokeWidth={Math.max(0.25, 1.4 - dist / 18)}
                            strokeOpacity={Math.max(0.25, 1 - dist / (maxConnDist + 3))}
                          />
                        );
                      })
                    )}

                    {players.map((p) => {
                      const isSel = p.id === selectedPlayer.id;
                      return (
                        <g
                          key={p.id}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setSelectedPlayerId(p.id);
                            setDraggingPlayerId(p.id);
                          }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <circle
                            cx={p.x_m}
                            cy={p.y_m}
                            r="2.0"
                            fill="rgba(244, 114, 182, 0.2)"
                            stroke={isSel ? '#22d3ee' : '#f472b6'}
                            strokeWidth={isSel ? '0.45' : '0.25'}
                          />
                          <circle cx={p.x_m} cy={p.y_m} r="1.3" fill="#0f172a" stroke="#ffffff" strokeWidth="0.3" />
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
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="lg:col-span-4 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cómo subir tu video y activar el rastreo:
                  </h3>
                  <ol className="text-xs text-slate-300 space-y-2.5 mt-3 list-decimal pl-4">
                    <li>
                      Haz clic en el botón verde <strong>📤 SUBIR VIDEO (.MP4)</strong> arriba a la derecha y selecciona cualquier video de cancha (dron o a ras de suelo).
                    </li>
                    <li>
                      El motor OpenCV (<code>backend/video_tracker.py</code>) filtra el césped en HSV, detecta el contorno real de cada jugador y coloca el <strong>anillo 3D exactamente en sus pies</strong> (<code>foot_x</code>, <code>foot_y</code>).
                    </li>
                    <li>
                      Además, las coordenadas detectadas actualizan en automático los puntos de esta cancha homográfica de <strong>87 × 55 m</strong>.
                    </li>
                  </ol>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                  Jugador seleccionado: <strong>#{selectedPlayer.dorsal} ({selectedPlayer.nombre})</strong> en posición{' '}
                  <span className="font-mono text-cyan-400">
                    ({selectedPlayer.x_m}m, {selectedPlayer.y_m}m)
                  </span>
                  . Arrástralo con el mouse para medir cualquier estructura táctica.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RAMA 2: SIMULADOR 1 CONTRA 1 CON ESQUELETO UNIDO AL JUGADOR */}
        {branch === '1v1' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Flexión Rodilla / CoG</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {duelStats.kneeAngle}° <span className="text-sm text-cyan-400">(-{duelStats.cogDropPct}%)</span>
                </p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Ángulo de Corte</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{duelStats.cutAngleDeg}°</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Distancia al Defensor</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{duelStats.dist_m} m</p>
              </div>
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Reacción Defensor</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{duelStats.reactionMs} ms</p>
              </div>
            </div>

            <div className="bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-cyan-400 font-bold">
                  FASE DEL CAMBIO DE DIRECCIÓN: {((duelPhase / 100) * 3.0).toFixed(2)} s / 3.00 s
                </span>
                <span className="text-slate-400">
                  Arrastra al Atacante o Defensor: el esqueleto está 100% unido a su cuerpo
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={duelPhase}
                onChange={(e) => setDuelPhase(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />

              <div className="w-full aspect-[100/45] bg-[#0a1612] rounded-xl border border-cyan-500/30 relative overflow-hidden">
                <svg
                  ref={duelSvgRef}
                  viewBox="0 0 100 55"
                  onMouseMove={handleDuelMouseMove}
                  className="w-full h-full"
                >
                  <line
                    x1={attackerPos.x}
                    y1={attackerPos.y + 10}
                    x2={defenderPos.x}
                    y2={defenderPos.y + 10}
                    stroke="#22d3ee"
                    strokeWidth="0.5"
                    strokeDasharray="1.2 0.8"
                  />
                  <text
                    x={(attackerPos.x + defenderPos.x) / 2}
                    y={(attackerPos.y + defenderPos.y) / 2 + 8.5}
                    textAnchor="middle"
                    fill="#22d3ee"
                    fontSize="2.0"
                    fontWeight="bold"
                  >
                    {duelStats.dist_m} m
                  </text>

                  {/* Esqueleto Atacante */}
                  {(() => {
                    const sink = duelStats.cutIntensity * 3.8;
                    const headY = attackerPos.y - 10 + sink;
                    const hipY = attackerPos.y + sink;
                    const kneeX = attackerPos.x + 2.2 + duelStats.cutIntensity * 2.8;
                    const kneeY = attackerPos.y + 5.2 + sink * 0.4;
                    const ankleY = attackerPos.y + 10;

                    return (
                      <g
                        onMouseDown={() => setDragging1v1('attacker')}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <ellipse
                          cx={attackerPos.x}
                          cy={ankleY}
                          rx="4.2"
                          ry="1.5"
                          fill="rgba(34,211,238,0.2)"
                          stroke="#22d3ee"
                          strokeWidth="0.45"
                        />
                        <line x1={attackerPos.x} y1={hipY} x2={kneeX} y2={kneeY} stroke="#22d3ee" strokeWidth="0.8" />
                        <line x1={kneeX} y1={kneeY} x2={attackerPos.x} y2={ankleY} stroke="#10b981" strokeWidth="0.8" />
                        <line x1={attackerPos.x} y1={headY} x2={attackerPos.x} y2={hipY} stroke="#ffffff" strokeWidth="0.85" />
                        <circle cx={attackerPos.x} cy={headY} r="1.8" fill="#22d3ee" />
                        <circle cx={attackerPos.x} cy={hipY} r="1.1" fill="#f472b6" />
                        <circle cx={kneeX} cy={kneeY} r="1.0" fill="#10b981" />
                        <text
                          x={attackerPos.x}
                          y={headY - 3}
                          textAnchor="middle"
                          fill="#22d3ee"
                          fontSize="1.9"
                          fontWeight="bold"
                        >
                          ATACANTE ({duelStats.kneeAngle}°)
                        </text>
                      </g>
                    );
                  })()}

                  {/* Esqueleto Defensor */}
                  {(() => {
                    const dHeadY = defenderPos.y - 9.5;
                    const dHipY = defenderPos.y;
                    const dKneeX = defenderPos.x - 1.8;
                    const dKneeY = defenderPos.y + 5.2;
                    const dAnkleY = defenderPos.y + 10;

                    return (
                      <g
                        onMouseDown={() => setDragging1v1('defender')}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <ellipse
                          cx={defenderPos.x}
                          cy={dAnkleY}
                          rx="4.2"
                          ry="1.5"
                          fill="rgba(244,63,94,0.2)"
                          stroke="#f43f5e"
                          strokeWidth="0.45"
                        />
                        <line x1={defenderPos.x} y1={dHipY} x2={dKneeX} y2={dKneeY} stroke="#f43f5e" strokeWidth="0.8" />
                        <line x1={dKneeX} y1={dKneeY} x2={defenderPos.x} y2={dAnkleY} stroke="#fb7185" strokeWidth="0.8" />
                        <line x1={defenderPos.x} y1={dHeadY} x2={defenderPos.x} y2={dHipY} stroke="#ffffff" strokeWidth="0.85" />
                        <circle cx={defenderPos.x} cy={dHeadY} r="1.8" fill="#f43f5e" />
                        <text
                          x={defenderPos.x}
                          y={dHeadY - 3}
                          textAnchor="middle"
                          fill="#fb7185"
                          fontSize="1.9"
                          fontWeight="bold"
                        >
                          DEFENSOR ({duelStats.reactionMs} ms)
                        </text>
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
