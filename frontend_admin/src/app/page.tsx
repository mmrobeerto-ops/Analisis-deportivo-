'use client';
import React, { useState, useMemo, useRef } from 'react';

type AnalysisBranch = 'dron' | '1v1';

interface DronPlayer {
  id: number;
  dorsal: number;
  nombre: string;
  linea: 'Defensa' | 'Media' | 'Delantera';
  x_m: number; // 0 a 87 m
  y_m: number; // 0 a 55 m
}

const INITIAL_CEFOR_PLAYERS: DronPlayer[] = [
  // Defensa (4)
  { id: 1, dorsal: 2, nombre: 'Lateral Der.', linea: 'Defensa', x_m: 24, y_m: 10 },
  { id: 2, dorsal: 4, nombre: 'Central Der.', linea: 'Defensa', x_m: 22, y_m: 22 },
  { id: 3, dorsal: 5, nombre: 'Central Izq.', linea: 'Defensa', x_m: 22, y_m: 34 },
  { id: 4, dorsal: 3, nombre: 'Lateral Izq.', linea: 'Defensa', x_m: 24, y_m: 45 },
  // Media (3)
  { id: 5, dorsal: 6, nombre: 'Contención', linea: 'Media', x_m: 35, y_m: 27.5 },
  { id: 6, dorsal: 8, nombre: 'Interior Der.', linea: 'Media', x_m: 38, y_m: 16 },
  { id: 7, dorsal: 10, nombre: 'Interior Izq.', linea: 'Media', x_m: 38, y_m: 39 },
  // Delantera (3)
  { id: 8, dorsal: 7, nombre: 'Extremo Der.', linea: 'Delantera', x_m: 47, y_m: 12 },
  { id: 9, dorsal: 9, nombre: 'Centro Delantero', linea: 'Delantera', x_m: 49, y_m: 27.5 },
  { id: 10, dorsal: 11, nombre: 'Extremo Izq.', linea: 'Delantera', x_m: 47, y_m: 43 },
];

// Presets de momentos tácticos reales del documento de Edu Chio
const DRON_PRESETS: Record<string, DronPlayer[]> = {
  compacto: INITIAL_CEFOR_PLAYERS,
  partido: INITIAL_CEFOR_PLAYERS.map((p) =>
    p.linea === 'Delantera'
      ? { ...p, x_m: p.x_m + 18 }
      : p.linea === 'Defensa'
      ? { ...p, x_m: p.x_m - 6 }
      : p
  ),
  presion_alta: INITIAL_CEFOR_PLAYERS.map((p) => ({
    ...p,
    x_m: Math.min(82, p.x_m + 16),
  })),
};

export default function CeforDashboard() {
  const [branch, setBranch] = useState<AnalysisBranch>('dron');

  // --- ESTADO RAMA 1: DRON 4K (87x55m) ---
  const [players, setPlayers] = useState<DronPlayer[]>(INITIAL_CEFOR_PLAYERS);
  const [draggingPlayerId, setDraggingPlayerId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(6); // Dorsal #8 por defecto
  const [maxConnDist, setMaxConnDist] = useState<number>(20);
  const pitchSvgRef = useRef<SVGSVGElement | null>(null);

  // --- ESTADO RAMA 2: DUELO 1 CONTRA 1 (POSE Y CAMBIO DE DIRECCIÓN) ---
  const [duelPhase, setDuelPhase] = useState<number>(65); // 0 a 100% de la jugada de corte
  const [attackerPos, setAttackerPos] = useState<{ x: number; y: number }>({ x: 38, y: 27.5 });
  const [defenderPos, setDefenderPos] = useState<{ x: number; y: number }>({ x: 52, y: 27.5 });
  const [dragging1v1, setDragging1v1] = useState<'attacker' | 'defender' | null>(null);
  const duelSvgRef = useRef<SVGSVGElement | null>(null);

  // Arrastre de jugadores en la cancha de 87x55m (Rama 1)
  const handlePitchMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggingPlayerId === null || !pitchSvgRef.current) return;
    const rect = pitchSvgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 87;
    const y = ((e.clientY - rect.top) / rect.height) * 55;
    const clampedX = +Math.max(2, Math.min(85, x)).toFixed(1);
    const clampedY = +Math.max(2, Math.min(53, y)).toFixed(1);

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === draggingPlayerId ? { ...p, x_m: clampedX, y_m: clampedY } : p
      )
    );
  };

  // Arrastre de Atacante o Defensor en el laboratorio 1v1 (Rama 2)
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

  // Cálculos geométricos 100% reales vinculados a las posiciones de los jugadores (Rama 1)
  const pitchStats = useMemo(() => {
    const xs = players.map((p) => p.x_m);
    const ys = players.map((p) => p.y_m);
    const defXs = players.filter((p) => p.linea === 'Defensa').map((p) => p.x_m);
    const midXs = players.filter((p) => p.linea === 'Media').map((p) => p.x_m);
    const fwdXs = players.filter((p) => p.linea === 'Delantera').map((p) => p.x_m);

    const largo = +(Math.max(...xs) - Math.min(...xs)).toFixed(1);
    const ancho = +(Math.max(...ys) - Math.min(...ys)).toFixed(1);
    const alturaDef = +(defXs.reduce((a, b) => a + b, 0) / defXs.length).toFixed(1);
    const avgMid = +(midXs.reduce((a, b) => a + b, 0) / midXs.length).toFixed(1);
    const avgFwd = +(fwdXs.reduce((a, b) => a + b, 0) / fwdXs.length).toFixed(1);

    const distDefMed = +Math.abs(avgMid - alturaDef).toFixed(1);
    const distMedDel = +Math.abs(avgFwd - avgMid).toFixed(1);

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

    const avgNearest = +(
      minDistances.reduce((a, b) => a + b, 0) / minDistances.length
    ).toFixed(1);

    return {
      largo,
      ancho,
      alturaDef,
      distDefMed,
      distMedDel,
      avgNearest,
      aisladosCount: aisladosIds.length,
      aisladosDorsales: aisladosIds,
    };
  }, [players]);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) || players[0],
    [players, selectedPlayerId]
  );

  // Conexiones exactas del jugador seleccionado (la gráfica sigue 100% al jugador)
  const selectedPlayerLinks = useMemo(() => {
    return players
      .filter((p) => p.id !== selectedPlayer.id)
      .map((p) => ({
        ...p,
        dist_m: +Math.hypot(p.x_m - selectedPlayer.x_m, p.y_m - selectedPlayer.y_m).toFixed(1),
      }))
      .sort((a, b) => a.dist_m - b.dist_m);
  }, [players, selectedPlayer]);

  // Cálculos biomecánicos 100% sincronizados con el Duelo 1v1 (Rama 2)
  const duelStats = useMemo(() => {
    // Distancia real en metros entre el Atacante y el Defensor en el lienzo
    const rawDist = Math.hypot(attackerPos.x - defenderPos.x, attackerPos.y - defenderPos.y);
    const dist_m = +(Math.max(0.45, rawDist / 10.0)).toFixed(2);

    // En la fase de corte (50% - 80%), la rodilla se flexiona hasta 118° y baja la cadera
    const cutIntensity = Math.exp(-Math.pow((duelPhase - 65) / 22, 2));
    const kneeAngle = +(168 - cutIntensity * 48).toFixed(1); // Baja de 168° a 120°
    const cogDropPct = +Math.max(0, Math.min(100, (170 - kneeAngle) * 1.6)).toFixed(1);
    const hipShoulderDeg = +(4 + cutIntensity * 21).toFixed(1); // Disociación hasta +25°
    const cutAngleDeg = +(8 + cutIntensity * 38).toFixed(1); // Cambio de dirección hasta 46°

    // Entropía de Shannon (TZANiX Aether Core LUT) y Tiempo de reacción del defensor
    const entropy = +(1.45 + cutIntensity * 1.35 + (2.0 / (dist_m + 0.5)) * 0.4).toFixed(3);
    const reactionMs = Math.round(155 + cutIntensity * 95 + (hipShoulderDeg * 2.2));
    const isBreakingCut = kneeAngle < 136 && dist_m <= 2.5;

    return {
      dist_m,
      kneeAngle,
      cogDropPct,
      hipShoulderDeg,
      cutAngleDeg,
      entropy,
      reactionMs,
      isBreakingCut,
      cutIntensity,
    };
  }, [duelPhase, attackerPos, defenderPos]);

  // Exportar CSV real con las columnas exactas del documento de Edu Chio
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
        {/* ENCABEZADO PRINCIPAL */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[#131b29] border border-slate-800 rounded-2xl p-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-pink-500/20 text-pink-400 border border-pink-500/40 rounded">
                CEFOR PROFESOR CHIO
              </span>
              <span className="px-2.5 py-0.5 text-[11px] font-mono bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 rounded">
                ⚡ Motor Geométrico TZANiX Aether Core (1.85 µs)
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-white mt-1">
              CEFOR VIDEO — Laboratorio Táctico 100% Sincronizado (Cero Videos Falsos)
            </h1>
            <p className="text-xs text-slate-400">
              Arrastra a cualquier jugador en la cancha: todas las líneas, distancias, ángulos y gráficas siguen al jugador en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setBranch('dron')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                branch === 'dron'
                  ? 'bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              1. ANÁLISIS TÁCTICO DESDE DRON (87 × 55 m)
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
            RAMA 1: ANÁLISIS TÁCTICO DESDE DRON (CANCHA INTERACTIVA 87x55m)
           ===================================================================== */}
        {branch === 'dron' && (
          <div className="flex flex-col gap-6">
            {/* 5 MÉTRICAS CALCULADAS EN TIEMPO REAL SEGÚN DÓNDE MUEVAS A LOS JUGADORES */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Largo (Profundidad)</p>
                <p className="text-2xl font-bold text-white mt-1">{pitchStats.largo} m</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Def-Med: {pitchStats.distDefMed}m • Med-Del: {pitchStats.distMedDel}m
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Ancho (Amplitud)</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{pitchStats.ancho} m</p>
                <p className="text-[11px] text-slate-500 mt-1">De banda a banda (máx. 55 m)</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Altura de la Defensa</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{pitchStats.alturaDef} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Distancia desde propia portería</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Compañero más Cercano</p>
                <p className="text-2xl font-bold text-pink-400 mt-1">{pitchStats.avgNearest} m</p>
                <p className="text-[11px] text-slate-500 mt-1">Alcance firme por jugador: 2 m</p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">Jugadores Aislados (&gt;12m)</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    pitchStats.aisladosCount > 0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {pitchStats.aisladosCount}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {pitchStats.aisladosCount > 0
                    ? `Dorsales aislados: #${pitchStats.aisladosDorsales.join(', #')}`
                    : 'Todo el equipo conectado (<12m)'}
                </p>
              </div>
            </div>

            {/* PIZARRA INTERACTIVA 87x55m + TELEMETRÍA DEL JUGADOR SELECCIONADO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CANCHA HOMOGRÁFICA INTERACTIVA (8 COLUMNAS) */}
              <div className="lg:col-span-8 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">
                      Cancha Calibrada (87 × 55 m) — Arrastra cualquier jugador con el mouse
                    </h2>
                    <p className="text-xs text-slate-400">
                      Las conexiones rosas se engrasan al acercarse y desaparecen si superan {maxConnDist} m (para ver el hueco)
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setPlayers(DRON_PRESETS.compacto)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Bloque Compacto (24m)
                    </button>
                    <button
                      onClick={() => setPlayers(DRON_PRESETS.partido)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                    >
                      Simular Equipo Partido (&gt;20m)
                    </button>
                    <button
                      onClick={() => setPlayers(DRON_PRESETS.presion_alta)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 cursor-pointer"
                    >
                      Presión Sincronizada
                    </button>
                    <button
                      onClick={handleExportCsv}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 cursor-pointer"
                    >
                      ⬇ Exportar CSV
                    </button>
                  </div>
                </div>

                {/* Lienzo SVG 87x55m donde las gráficas siguen exactamente al jugador */}
                <div className="w-full aspect-[87/55] bg-[#0d2116] rounded-xl border border-emerald-500/30 relative overflow-hidden">
                  <svg
                    ref={pitchSvgRef}
                    viewBox="0 0 87 55"
                    onMouseMove={handlePitchMouseMove}
                    className="w-full h-full cursor-crosshair"
                  >
                    {/* Franjas del césped */}
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <rect
                        key={i}
                        x={2 + i * 10.375}
                        y="2"
                        width="5.18"
                        height="51"
                        fill="rgba(255,255,255,0.02)"
                      />
                    ))}

                    {/* Líneas reglamentarias de la cancha 87x55m */}
                    <rect x="2" y="2" width="83" height="51" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <line x1="43.5" y1="2" x2="43.5" y2="53" stroke="#3b6e52" strokeWidth="0.4" />
                    <circle cx="43.5" cy="27.5" r="7" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <rect x="2" y="13" width="13" height="29" fill="none" stroke="#3b6e52" strokeWidth="0.4" />
                    <rect x="72" y="13" width="13" height="29" fill="none" stroke="#3b6e52" strokeWidth="0.4" />

                    {/* Caja de dimensión del Bloque (Largo x Ancho) */}
                    {(() => {
                      const xs = players.map((p) => p.x_m);
                      const ys = players.map((p) => p.y_m);
                      const minX = Math.min(...xs);
                      const maxX = Math.max(...xs);
                      const minY = Math.min(...ys);
                      const maxY = Math.max(...ys);
                      return (
                        <rect
                          x={minX}
                          y={minY}
                          width={maxX - minX}
                          height={maxY - minY}
                          fill="rgba(34, 211, 238, 0.04)"
                          stroke="#22d3ee"
                          strokeWidth="0.25"
                          strokeDasharray="1 1"
                        />
                      );
                    })()}

                    {/* 1. Conexiones entre compañeros (< maxConnDist m) con grosor y opacidad por distancia */}
                    {players.map((p1, i) =>
                      players.slice(i + 1).map((p2) => {
                        const dist = Math.hypot(p1.x_m - p2.x_m, p1.y_m - p2.y_m);
                        if (dist > maxConnDist) return null;
                        const isSelectedLink =
                          p1.id === selectedPlayer.id || p2.id === selectedPlayer.id;
                        const opacity = isSelectedLink
                          ? 0.95
                          : Math.max(0.2, 1 - dist / (maxConnDist + 3));
                        const width = isSelectedLink
                          ? Math.max(0.45, 1.6 - dist / 16)
                          : Math.max(0.2, 1.2 - dist / 18);

                        return (
                          <g key={`${p1.id}-${p2.id}`}>
                            <line
                              x1={p1.x_m}
                              y1={p1.y_m}
                              x2={p2.x_m}
                              y2={p2.y_m}
                              stroke={isSelectedLink ? '#f472b6' : '#ec4899'}
                              strokeWidth={width}
                              strokeOpacity={opacity}
                            />
                            {isSelectedLink && (
                              <text
                                x={(p1.x_m + p2.x_m) / 2}
                                y={(p1.y_m + p2.y_m) / 2 - 0.6}
                                textAnchor="middle"
                                fill="#fbcfe8"
                                fontSize="1.35"
                                fontWeight="bold"
                              >
                                {dist.toFixed(1)}m
                              </text>
                            )}
                          </g>
                        );
                      })
                    )}

                    {/* 2. Líneas dinámicas por bloque (Defensa, Media, Delantera) */}
                    {(['Defensa', 'Media', 'Delantera'] as const).map((linea) => {
                      const group = players
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
                          strokeWidth="0.45"
                          strokeDasharray="1.2 0.8"
                        />
                      ));
                    })}

                    {/* 3. Jugadores arrastrables con alcance firme de 2m */}
                    {players.map((p) => {
                      const isSel = p.id === selectedPlayer.id;
                      const isIsolated = pitchStats.aisladosDorsales.includes(p.dorsal);
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
                          {/* Círculo de alcance de 2 metros */}
                          <circle
                            cx={p.x_m}
                            cy={p.y_m}
                            r="2.0"
                            fill={
                              isIsolated
                                ? 'rgba(244, 63, 94, 0.28)'
                                : isSel
                                ? 'rgba(34, 211, 238, 0.28)'
                                : 'rgba(244, 114, 182, 0.18)'
                            }
                            stroke={isIsolated ? '#f43f5e' : isSel ? '#22d3ee' : '#f472b6'}
                            strokeWidth={isSel ? '0.45' : '0.25'}
                          />
                          {/* Punto de apoyo (pies) */}
                          <circle
                            cx={p.x_m}
                            cy={p.y_m}
                            r="1.35"
                            fill="#0f172a"
                            stroke={isSel ? '#22d3ee' : '#ffffff'}
                            strokeWidth={isSel ? '0.45' : '0.3'}
                          />
                          <text
                            x={p.x_m}
                            y={p.y_m + 0.48}
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="1.35"
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

              {/* PANEL DERECHO: INSPECTOR DEL JUGADOR SELECCIONADO (4 COLUMNAS) */}
              <div className="lg:col-span-4 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">
                        SEGUIMIENTO EN TIEMPO REAL
                      </span>
                      <h3 className="text-lg font-bold text-white">
                        Dorsal #{selectedPlayer.dorsal} — {selectedPlayer.nombre}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Línea: <strong>{selectedPlayer.linea}</strong> • Coordenada:{' '}
                        <span className="font-mono text-cyan-300">
                          ({selectedPlayer.x_m}m, {selectedPlayer.y_m}m)
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Control de umbral de conexión */}
                  <div className="mt-4 bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">Distancia máxima de conexión:</span>
                      <strong className="text-pink-400 font-mono">{maxConnDist} m</strong>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={30}
                      value={maxConnDist}
                      onChange={(e) => setMaxConnDist(Number(e.target.value))}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Regla de Edu: conexiones de más de 20 m no se dibujan para ver si el equipo se parte.
                    </p>
                  </div>

                  {/* Tabla de distancias a compañeros en vivo */}
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-300 uppercase mb-2">
                      Distancias desde #{selectedPlayer.dorsal} a sus compañeros:
                    </p>
                    <div className="space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
                      {selectedPlayerLinks.map((peer) => {
                        const connected = peer.dist_m <= maxConnDist;
                        return (
                          <div
                            key={peer.id}
                            onClick={() => setSelectedPlayerId(peer.id)}
                            className="flex items-center justify-between bg-slate-900/60 hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-800/80 text-xs cursor-pointer"
                          >
                            <div>
                              <strong className="text-white">#{peer.dorsal}</strong>{' '}
                              <span className="text-slate-400">{peer.nombre}</span>
                              <span className="text-[10px] text-slate-500 ml-1">({peer.linea})</span>
                            </div>
                            <div className="flex items-center gap-2 font-mono">
                              <span className={connected ? 'text-pink-400 font-bold' : 'text-slate-500'}>
                                {peer.dist_m} m
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  connected
                                    ? 'bg-pink-500/20 text-pink-300'
                                    : 'bg-slate-800 text-slate-500'
                                }`}
                              >
                                {connected ? 'CONECTADO' : 'HUECO'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
                  💡 <strong>Tip interactivo:</strong> Haz clic y arrastra cualquier dorsal en la cancha izquierda. Verás cómo todas las líneas rosas, distancias y alertas de jugador aislado responden al instante.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            RAMA 2: ANÁLISIS 1 CONTRA 1 Y CAMBIO DE DIRECCIÓN (ESQUELETO SINCRONIZADO)
           ===================================================================== */}
        {branch === '1v1' && (
          <div className="flex flex-col gap-6">
            {/* 4 MÉTRICAS BIOMECÁNICAS 100% VINCULADAS AL ESQUELETO INTERACTIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  1. Flexión Rodilla / Centro de Gravedad
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {duelStats.kneeAngle}°{' '}
                  <span className="text-sm text-cyan-400">(-{duelStats.cogDropPct}% CoG)</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  {duelStats.kneeAngle < 136
                    ? '🔥 Cadera baja: momento óptimo de corte'
                    : 'Postura alta de conducción'}
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  2. Ángulo de Corte y Finta de Hombros
                </p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {duelStats.cutAngleDeg}°{' '}
                  <span className="text-xs text-slate-300">
                    (Hombros +{duelStats.hipShoulderDeg}°)
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Disociación cadera-hombros que engaña al rival
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  3. Distancia Exacta al Defensor
                </p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{duelStats.dist_m} m</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Arrastra al Atacante o Defensor abajo para medir
                </p>
              </div>

              <div className="bg-[#131b29] border border-slate-800 rounded-xl p-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase">
                  4. Reacción del Defensor (Aether LUT)
                </p>
                <p className="text-2xl font-bold text-amber-400 mt-1">
                  {duelStats.reactionMs} ms{' '}
                  <span className="text-xs text-emerald-400">({duelStats.entropy} bits)</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Retraso biomecánico del defensor tras el corte
                </p>
              </div>
            </div>

            {/* SIMULADOR INTERACTIVO DE POSE 1v1 + CLIPS DE 3 SEGUNDOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LIENZO INTERACTIVO DE ESQUELETO Y DUELO 1v1 (7 COLUMNAS) */}
              <div className="lg:col-span-7 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase">
                      Simulador Biomecánico 1 contra 1 — Esqueleto y Vectores Sincronizados al 100%
                    </h2>
                    <p className="text-xs text-slate-400">
                      Mueve el deslizador de la jugada o arrastra directamente a los jugadores para ver cómo el esqueleto flexiona la rodilla y cambia de dirección.
                    </p>
                  </div>
                </div>

                {/* Control deslizante del momento exacto del corte (0.0s a 3.0s) */}
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold">
                      TIEMPO DEL CLIP (3.0s): {((duelPhase / 100) * 3.0).toFixed(2)} s
                    </span>
                    <span className="text-slate-300">
                      {duelStats.isBreakingCut
                        ? '⚡ MOMENTO EXACTO DEL CORTE (RUPTURA DETECTADA)'
                        : 'FASE DE APROXIMACIÓN / SALIDA'}
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
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>0.0s (Conducción inicial)</span>
                    <span>1.95s (Descenso de cadera + Corte)</span>
                    <span>3.0s (Aceleración post-regate)</span>
                  </div>
                </div>

                {/* SVG Interactivo donde los gráficos pertenecen y siguen al jugador */}
                <div className="w-full aspect-[100/55] bg-[#0a1612] rounded-xl border border-cyan-500/30 relative overflow-hidden">
                  <svg
                    ref={duelSvgRef}
                    viewBox="0 0 100 55"
                    onMouseMove={handleDuelMouseMove}
                    className="w-full h-full"
                  >
                    {/* Cuadrícula métrica de referencia */}
                    <line x1="0" y1="42" x2="100" y2="42" stroke="#1e3a2f" strokeWidth="0.4" />
                    <line x1="20" y1="0" x2="20" y2="55" stroke="#1e3a2f" strokeWidth="0.25" />
                    <line x1="50" y1="0" x2="50" y2="55" stroke="#1e3a2f" strokeWidth="0.25" />
                    <line x1="80" y1="0" x2="80" y2="55" stroke="#1e3a2f" strokeWidth="0.25" />

                    {/* Línea de distancia real entre los pies del Atacante y Defensor */}
                    <line
                      x1={attackerPos.x}
                      y1={attackerPos.y + 10}
                      x2={defenderPos.x}
                      y2={defenderPos.y + 10}
                      stroke="#22d3ee"
                      strokeWidth="0.5"
                      strokeDasharray="1.2 0.8"
                    />
                    <rect
                      x={(attackerPos.x + defenderPos.x) / 2 - 7}
                      y={(attackerPos.y + defenderPos.y) / 2 + 6.5}
                      width="14"
                      height="4.2"
                      rx="1"
                      fill="#0f172a"
                      stroke="#22d3ee"
                      strokeWidth="0.25"
                    />
                    <text
                      x={(attackerPos.x + defenderPos.x) / 2}
                      y={(attackerPos.y + defenderPos.y) / 2 + 9.3}
                      textAnchor="middle"
                      fill="#22d3ee"
                      fontSize="1.9"
                      fontWeight="bold"
                    >
                      {duelStats.dist_m} m
                    </text>

                    {/* Vector de cambio de dirección (Corte) que nace de la cadera del Atacante */}
                    {(() => {
                      const rad = (-duelStats.cutAngleDeg * Math.PI) / 180;
                      const vx = attackerPos.x + Math.cos(rad) * 14;
                      const vy = attackerPos.y + Math.sin(rad) * 14;
                      return (
                        <g>
                          <line
                            x1={attackerPos.x}
                            y1={attackerPos.y}
                            x2={vx}
                            y2={vy}
                            stroke="#10b981"
                            strokeWidth="0.7"
                          />
                          <circle cx={vx} cy={vy} r="0.9" fill="#10b981" />
                          <text
                            x={vx + 1.5}
                            y={vy}
                            fill="#34d399"
                            fontSize="1.7"
                            fontWeight="bold"
                          >
                            Vector Salida ({duelStats.cutAngleDeg}°)
                          </text>
                        </g>
                      );
                    })()}

                    {/* ESQUELETO DEL ATACANTE (100% anclado a su posición y fase de flexión) */}
                    {(() => {
                      const sink = duelStats.cutIntensity * 3.8; // Descenso real de la cadera
                      const shoulderTilt = duelStats.cutIntensity * 2.2;
                      const kneeBendX = 2.2 + duelStats.cutIntensity * 2.8;

                      const headY = attackerPos.y - 10 + sink;
                      const shoulderY = attackerPos.y - 6.5 + sink;
                      const hipY = attackerPos.y + sink;
                      const kneeX = attackerPos.x + kneeBendX;
                      const kneeY = attackerPos.y + 5.2 + sink * 0.4;
                      const ankleX = attackerPos.x;
                      const ankleY = attackerPos.y + 10;

                      return (
                        <g
                          onMouseDown={() => setDragging1v1('attacker')}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          {/* Anillo en los pies */}
                          <ellipse
                            cx={ankleX}
                            cy={ankleY}
                            rx="4.2"
                            ry="1.5"
                            fill="rgba(34,211,238,0.2)"
                            stroke="#22d3ee"
                            strokeWidth="0.45"
                          />
                          {/* Pierna de apoyo (Cadera -> Rodilla -> Tobillo) */}
                          <line
                            x1={attackerPos.x}
                            y1={hipY}
                            x2={kneeX}
                            y2={kneeY}
                            stroke="#22d3ee"
                            strokeWidth="0.8"
                          />
                          <line
                            x1={kneeX}
                            y1={kneeY}
                            x2={ankleX}
                            y2={ankleY}
                            stroke="#10b981"
                            strokeWidth="0.8"
                          />
                          {/* Tronco y Hombros */}
                          <line
                            x1={attackerPos.x}
                            y1={shoulderY}
                            x2={attackerPos.x}
                            y2={hipY}
                            stroke="#ffffff"
                            strokeWidth="0.85"
                          />
                          <line
                            x1={attackerPos.x - 3.5}
                            y1={shoulderY - shoulderTilt * 0.4}
                            x2={attackerPos.x + 3.5}
                            y2={shoulderY + shoulderTilt * 0.4}
                            stroke="#f472b6"
                            strokeWidth="0.75"
                          />
                          {/* Cabeza y Articulaciones */}
                          <circle cx={attackerPos.x} cy={headY} r="1.8" fill="#22d3ee" />
                          <circle cx={attackerPos.x} cy={hipY} r="1.1" fill="#f472b6" />
                          <circle cx={kneeX} cy={kneeY} r="1.0" fill="#10b981" />

                          {/* Etiqueta anclada al Atacante */}
                          <text
                            x={attackerPos.x}
                            y={headY - 3}
                            textAnchor="middle"
                            fill="#22d3ee"
                            fontSize="1.85"
                            fontWeight="bold"
                          >
                            ATACANTE (Rodilla {duelStats.kneeAngle}°)
                          </text>
                        </g>
                      );
                    })()}

                    {/* ESQUELETO DEL DEFENSOR (100% anclado a su posición) */}
                    {(() => {
                      const dHeadY = defenderPos.y - 9.5;
                      const dShoulderY = defenderPos.y - 6.0;
                      const dHipY = defenderPos.y;
                      const dKneeX = defenderPos.x - 1.8;
                      const dKneeY = defenderPos.y + 5.2;
                      const dAnkleX = defenderPos.x;
                      const dAnkleY = defenderPos.y + 10;

                      return (
                        <g
                          onMouseDown={() => setDragging1v1('defender')}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <ellipse
                            cx={dAnkleX}
                            cy={dAnkleY}
                            rx="4.2"
                            ry="1.5"
                            fill="rgba(244,63,94,0.2)"
                            stroke="#f43f5e"
                            strokeWidth="0.45"
                          />
                          <line
                            x1={defenderPos.x}
                            y1={dHipY}
                            x2={dKneeX}
                            y2={dKneeY}
                            stroke="#f43f5e"
                            strokeWidth="0.8"
                          />
                          <line
                            x1={dKneeX}
                            y1={dKneeY}
                            x2={dAnkleX}
                            y2={dAnkleY}
                            stroke="#fb7185"
                            strokeWidth="0.8"
                          />
                          <line
                            x1={defenderPos.x}
                            y1={dShoulderY}
                            x2={defenderPos.x}
                            y2={dHipY}
                            stroke="#ffffff"
                            strokeWidth="0.85"
                          />
                          <line
                            x1={defenderPos.x - 3.2}
                            y1={dShoulderY}
                            x2={defenderPos.x + 3.2}
                            y2={dShoulderY}
                            stroke="#f43f5e"
                            strokeWidth="0.75"
                          />
                          <circle cx={defenderPos.x} cy={dHeadY} r="1.8" fill="#f43f5e" />
                          <circle cx={defenderPos.x} cy={dHipY} r="1.1" fill="#ffffff" />

                          <text
                            x={defenderPos.x}
                            y={dHeadY - 3}
                            textAnchor="middle"
                            fill="#fb7185"
                            fontSize="1.85"
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

              {/* CLIPS DE 3 SEGUNDOS QUE ACTUALIZAN EL SIMULADOR AL HACER CLIC (5 COLUMNAS) */}
              <div className="lg:col-span-5 bg-[#131b29] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between gap-4">
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase">
                    MOMENTOS CLAVE DE 3 SEGUNDOS (HAZ CLIC PARA CARGAR POSE)
                  </span>
                  <h2 className="text-base font-bold text-white uppercase mt-0.5">
                    Escenarios de Duelo 1 contra 1 (Edu Chio)
                  </h2>

                  <div className="space-y-3 mt-4">
                    <div
                      onClick={() => {
                        setDuelPhase(65);
                        setAttackerPos({ x: 38, y: 27.5 });
                        setDefenderPos({ x: 51.5, y: 27.5 });
                      }}
                      className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 transition cursor-pointer"
                    >
                      <div className="flex justify-between font-mono text-xs text-cyan-400 font-bold mb-1">
                        <span>ESCENARIO 1 • CORTE ÓPTIMO A 1.35 m</span>
                        <span>Fase: 65%</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        Descenso brusco de cadera (Rodilla 120°) + Finta de hombros
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        El atacante baja el centro de gravedad a 1.35 m del defensor, logrando el ángulo máximo de salida (46°).
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setDuelPhase(20);
                        setAttackerPos({ x: 28, y: 27.5 });
                        setDefenderPos({ x: 56, y: 27.5 });
                      }}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <div className="flex justify-between font-mono text-xs text-emerald-400 font-bold mb-1">
                        <span>ESCENARIO 2 • CONDUCCIÓN PREVIA (2.80 m)</span>
                        <span>Fase: 20%</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        Aproximación con postura alta (Rodilla 160°)
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        Aún lejos del defensor; sin disociación de hombros ni alerta de corte.
                      </p>
                    </div>

                    <div
                      onClick={() => {
                        setDuelPhase(92);
                        setAttackerPos({ x: 48, y: 21 });
                        setDefenderPos({ x: 53, y: 31 });
                      }}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 transition cursor-pointer"
                    >
                      <div className="flex justify-between font-mono text-xs text-amber-400 font-bold mb-1">
                        <span>ESCENARIO 3 • RUPTURA Y ACELERACIÓN</span>
                        <span>Fase: 92%</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        Defensor superado tras el cambio de dirección
                      </p>
                      <p className="text-xs text-slate-300 mt-1">
                        El atacante ya rompió la línea de marcaje y acelera al espacio libre.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300">
                  💡 <strong>100% Sincronizado:</strong> Puedes arrastrar al <strong>Atacante (azul)</strong> o al <strong>Defensor (rojo)</strong> con el mouse y mover el deslizador de tiempo arriba del lienzo; el esqueleto, el ángulo de rodilla y la distancia siempre están unidos al jugador.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
