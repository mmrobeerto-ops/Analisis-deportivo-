'use client';
import React from 'react';

const positions = [
  { id: 1, x: 10, y: 50, num: 1 },
  { id: 2, x: 25, y: 20, num: 2 },
  { id: 3, x: 25, y: 80, num: 4 },
  { id: 4, x: 20, y: 60, num: 5 },
  { id: 5, x: 20, y: 40, num: 3 },
  { id: 6, x: 45, y: 50, num: 6 },
  { id: 7, x: 60, y: 60, num: 8 },
  { id: 8, x: 60, y: 40, num: 10 },
  { id: 9, x: 65, y: 30, num: 7 },
  { id: 10, x: 80, y: 50, num: 9 },
  { id: 11, x: 75, y: 80, num: 11 },
];

export default function TacticalPitch({ playerId }: { playerId?: string }) {
  const isForward = playerId === 'p1' || playerId === 'p4';
  const isMid = playerId === 'p2';
  const isDef = playerId === 'p3';

  let activeNum = 9;
  if (playerId === 'p4') activeNum = 7;
  else if (playerId === 'p2') activeNum = 8;
  else if (playerId === 'p1') activeNum = 9;
  else activeNum = 1;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* AI VISION STREAM (Top) */}
      <div className="glass-panel-dense p-4 flex flex-col flex-shrink-0">
        <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono mb-2.5 flex justify-between items-center">
          <span className="flex items-center gap-2">
            <span className="text-[#00f2fe]">⚡</span> VISIÓN IA EN VIVO • CEFOR 1V1 & CONEXIONES
          </span>
          <span className="text-emerald-400 flex items-center gap-1.5 text-[9px] bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            STREAM 30 FPS ACTIVO
          </span>
        </h3>

        <div className="w-full h-[290px] relative border border-[#00f2fe]/30 flex items-center justify-center rounded-xl overflow-hidden bg-[#070b12] mb-3 shadow-[0_0_25px_rgba(0,242,254,0.08)]">
          <img
            src="http://localhost:8080/api/video_feed"
            alt="TZANiX Aether Core AI Stream"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Análisis de la Jugada */}
        <div className="bg-[#0b1320]/90 border border-slate-700/50 rounded-xl p-3">
          <div className="flex justify-between items-center mb-1.5">
            <h4 className="text-[10px] text-[#00f2fe] uppercase tracking-widest font-mono">
              Diagnóstico Táctico en Tiempo Real (Motor IA + Aether Core)
            </h4>
            <span className="text-[9px] font-mono text-slate-400">HOMOGRAFÍA: 87×55m</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Duelo 1 contra 1 detectado: el atacante ejecuta descenso del <strong>Centro de Gravedad (flexión 122°)</strong> con disociación de hombros de <strong>+19°</strong> a <strong>1.35 m</strong> del defensor, provocando un retraso de reacción de <strong>238 ms</strong> y habilitando línea de pase interior.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="text-[9px] font-mono px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 rounded">
              CoG Óptimo (&lt;135°)
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 rounded">
              Ruptura 1v1 (1.35m)
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 rounded">
              Auto-Clip 3.0s Guardado
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-amber-900/40 text-amber-400 border border-amber-500/30 rounded">
              Reacción Rival: 238ms
            </span>
          </div>
        </div>
      </div>

      {/* TACTICAL OVERVIEW (Bottom) */}
      <div className="glass-panel-dense p-4 flex-1 flex flex-col justify-between overflow-hidden min-h-[250px]">
        <div className="w-full flex justify-between items-center mb-2">
          <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">
            Mapa de Influencia & Estructura CEFOR (Dron 4K)
          </h3>
          <span className="text-[9px] font-mono text-[#00f2fe]">BLOQUE: 24m × 18m</span>
        </div>

        <div className="w-full grid grid-cols-12 gap-3 items-stretch flex-1 min-h-0">
          {/* PANEL IZQUIERDO: Estadísticas */}
          <div className="col-span-3 flex flex-col justify-between bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5">
            <h4 className="text-[9px] text-[#48b0ba] uppercase tracking-widest font-mono text-center border-b border-slate-700/50 pb-1">
              Métricas Colectivas
            </h4>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Profundidad</span>
              <span className="text-white font-mono">24 m</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Amplitud</span>
              <span className="text-[#00f2fe] font-mono">18 m</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Alt. Defensa</span>
              <span className="text-emerald-400 font-mono">28 m</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Dist. Socio</span>
              <span className="text-white font-mono">6.0 m</span>
            </div>
            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-700/50">
              <span className="text-slate-400">Fase MBP</span>
              <span className="text-[#00f2fe] font-mono">Sumativo II</span>
            </div>
          </div>

          {/* CAMPO HORIZONTAL CENTRAL */}
          <div className="col-span-6 border border-[#00f2fe]/30 relative rounded-xl overflow-hidden bg-[#0b1320] shadow-[0_0_20px_rgba(0,242,254,0.1)]">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background:
                  'repeating-linear-gradient(to right, transparent, transparent 40px, rgba(255,255,255,0.05) 40px, rgba(255,255,255,0.05) 80px)',
              }}
            ></div>
            <div
              className="absolute inset-0 z-0 mix-blend-screen opacity-90 transition-all duration-1000"
              style={{ filter: 'blur(18px)' }}
            >
              {isForward && (
                <>
                  <div
                    className="absolute w-[45%] h-[80%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.85)_0%,_rgba(0,242,254,0.4)_40%,_transparent_70%)] rounded-full"
                    style={{ top: '10%', left: '55%' }}
                  ></div>
                  <div
                    className="absolute w-[40%] h-[60%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.3)_0%,_transparent_70%)] rounded-full"
                    style={{ top: '20%', left: '35%' }}
                  ></div>
                </>
              )}
              {isMid && (
                <div
                  className="absolute w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.8)_0%,_rgba(0,242,254,0.3)_40%,_transparent_70%)] rounded-full"
                  style={{ top: '10%', left: '20%' }}
                ></div>
              )}
              {isDef && (
                <div
                  className="absolute w-[45%] h-[90%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.85)_0%,_rgba(0,242,254,0.3)_50%,_transparent_70%)] rounded-full"
                  style={{ top: '5%', left: '5%' }}
                ></div>
              )}
            </div>
            <div className="absolute inset-0 z-10 border border-[#00f2fe]/40 m-2">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#00f2fe]/40 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-[#00f2fe]/40"></div>
              <div className="absolute top-1/4 bottom-1/4 left-0 w-[15%] border-y border-r border-[#00f2fe]/40"></div>
              <div className="absolute top-1/4 bottom-1/4 right-0 w-[15%] border-y border-l border-[#00f2fe]/40"></div>
            </div>
            {positions.map((p) => {
              if (p.num !== activeNum) return null;
              return (
                <div
                  key={p.id}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold z-20 transition-all duration-500 border-2 border-[#00f2fe] bg-[#1c2431] text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,1)]"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {p.num}
                </div>
              );
            })}
          </div>

          {/* PANEL DERECHO: Evaluación Cualitativa */}
          <div className="col-span-3 flex flex-col justify-between bg-slate-900/50 border border-slate-700/50 rounded-xl p-2.5">
            <h4 className="text-[9px] text-[#48b0ba] uppercase tracking-widest font-mono text-center border-b border-slate-700/50 pb-1">
              Lectura 1v1 / Dron
            </h4>
            <div>
              <span className="text-[10px] text-slate-200 font-bold block">Red de Caída</span>
              <p className="text-[9px] text-slate-400 leading-tight">
                Conexiones &lt;20m activas. Cobertura interior sincronizada.
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-200 font-bold block">Duelos 1v1</span>
              <p className="text-[9px] text-emerald-400 leading-tight">
                +84% efectividad al bajar cadera antes del corte.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
