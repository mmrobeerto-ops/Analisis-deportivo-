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
  { id: 9, x: 65, y: 30, num: 7 }, // Posición de Martin Murillo
  { id: 10, x: 80, y: 50, num: 9 },
  { id: 11, x: 75, y: 80, num: 11 },
];

export default function TacticalPitch({ playerId }: { playerId?: string }) {
  // Dynamically position heatmaps based on player position
  const isForward = playerId === 'p1' || playerId === 'p4';
  const isMid = playerId === 'p2';
  const isDef = playerId === 'p3';

  // Determine active player number for the pitch
  let activeNum = 0;
  if (playerId === 'p4') activeNum = 7;
  else if (playerId === 'p2') activeNum = 8;
  else if (playerId === 'p1') activeNum = 9;
  else activeNum = 1;

  return (
    <div className="flex flex-col gap-4 h-full">
      
      {/* AI VISION STREAM (Top) */}
      <div className="glass-panel-dense p-5 flex flex-col flex-shrink-0">
        <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono mb-4 flex justify-between">
          Visión IA en Vivo 
          <span className="text-red-400 flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-red-400"></div> EN VIVO</span>
        </h3>
        <div className="w-full h-[420px] relative border border-white/10 flex items-center justify-center p-0 rounded overflow-hidden bg-black/50 mb-4">
          <img 
            src="http://localhost:8000/api/video_feed" 
            alt="AI Tracking Stream" 
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-xs text-slate-500 font-mono tracking-widest">ESPERANDO CONEXIÓN...</span>';
            }}
          />
        </div>

        {/* Análisis de la Jugada */}
        <div className="bg-[#0b1320] border border-slate-700/50 rounded-lg p-4">
          <h4 className="text-[10px] text-[#00f2fe] uppercase tracking-widest font-mono mb-2">Análisis de la Jugada (Motor IA)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Transición def-ata en Zona 1 buscando un juego rápido y vertical. Envío en largo para el delantero, quien realiza un <strong>excelente control orientado</strong> y filtra el balón al extremo. El extremo falla en la toma de decisión al enfrentarse mano a mano con el portero.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[9px] font-mono px-2 py-1 bg-green-900/40 text-green-400 border border-green-500/30 rounded">Control Orientado (Exitoso)</span>
            <span className="text-[9px] font-mono px-2 py-1 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 rounded">Transición Def-Ataque</span>
            <span className="text-[9px] font-mono px-2 py-1 bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 rounded">Juego Vertical</span>
            <span className="text-[9px] font-mono px-2 py-1 bg-red-900/40 text-red-400 border border-red-500/30 rounded">Toma de Decisión (Falla)</span>
          </div>
        </div>
      </div>

      {/* TACTICAL OVERVIEW (Bottom) */}
      <div className="glass-panel-dense p-5 flex flex-col items-center overflow-hidden">
        <div className="w-full flex justify-between items-center mb-4">
          <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">Mapa de Influencia (Análisis Personal)</h3>
          <span className="w-4 h-4 border border-slate-600 rounded flex items-center justify-center text-[8px]">⛶</span>
        </div>
        
        <div className="w-full flex justify-between items-start gap-4 mb-2">
          
          {/* PANEL IZQUIERDO: Estadísticas del Partido */}
          <div className="flex-[0.8] flex flex-col gap-3 h-[260px] justify-center bg-slate-900/40 border border-slate-700/50 rounded-lg p-3">
            <h4 className="text-[9px] text-[#48b0ba] uppercase tracking-widest font-mono mb-1 text-center border-b border-slate-700/50 pb-2">Rendimiento Físico / Táctico</h4>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Pases Intentados</span>
              <span className="text-white font-mono">14</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Pases Exitosos</span>
              <span className="text-[#00f2fe] font-mono">3 (21%)</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Recuperaciones</span>
              <span className="text-green-400 font-mono">5</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Goles / Tiros</span>
              <span className="text-white font-mono">1 / 4</span>
            </div>
            <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-slate-700/50">
              <span className="text-slate-400">Perfil de Juego</span>
              <span className="text-red-400 font-mono text-[10px]">Egocéntrico</span>
            </div>
          </div>

          {/* CAMPO HORIZONTAL CENTRAL */}
          <div className="w-full max-w-[500px] h-[260px] border border-[#00f2fe]/30 relative rounded overflow-hidden flex-shrink-0 bg-[#0b1320] shadow-[0_0_20px_rgba(0,242,254,0.1)]">
            <div className="absolute inset-0 opacity-20" style={{ background: 'repeating-linear-gradient(to right, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 100px)' }}></div>
            <div className="absolute inset-0 z-0 mix-blend-screen opacity-90 transition-all duration-1000" style={{ filter: 'blur(20px)' }}>
              {isForward && (
                <>
                  <div className="absolute w-[45%] h-[80%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.85)_0%,_rgba(0,242,254,0.4)_40%,_transparent_70%)] rounded-full" style={{ top: '10%', left: '55%' }}></div>
                  <div className="absolute w-[40%] h-[60%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.3)_0%,_transparent_70%)] rounded-full" style={{ top: '20%', left: '35%' }}></div>
                </>
              )}
              {isMid && (
                <>
                  <div className="absolute w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.8)_0%,_rgba(0,242,254,0.3)_40%,_transparent_70%)] rounded-full" style={{ top: '10%', left: '20%' }}></div>
                  <div className="absolute w-[40%] h-[50%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.5)_0%,_transparent_70%)] rounded-full" style={{ top: '25%', left: '45%' }}></div>
                </>
              )}
              {isDef && (
                <>
                  <div className="absolute w-[45%] h-[90%] bg-[radial-gradient(ellipse_at_center,_rgba(0,242,254,0.85)_0%,_rgba(0,242,254,0.3)_50%,_transparent_70%)] rounded-full" style={{ top: '5%', left: '5%' }}></div>
                </>
              )}
            </div>
            <div className="absolute inset-0 z-10 border-2 border-[#00f2fe]/40 m-2">
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-[#00f2fe]/40 -translate-x-1/2"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-[#00f2fe]/40"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#00f2fe]/80"></div>
              <div className="absolute top-1/4 bottom-1/4 left-0 w-[15%] border-y-2 border-r-2 border-[#00f2fe]/40"></div>
              <div className="absolute top-[35%] bottom-[35%] left-0 w-[6%] border-y-2 border-r-2 border-[#00f2fe]/40"></div>
              <div className="absolute top-1/2 left-[15%] -translate-y-1/2 w-[5%] h-[20%] border-r-2 border-[#00f2fe]/40 rounded-r-[100%]"></div>
              <div className="absolute top-1/4 bottom-1/4 right-0 w-[15%] border-y-2 border-l-2 border-[#00f2fe]/40"></div>
              <div className="absolute top-[35%] bottom-[35%] right-0 w-[6%] border-y-2 border-l-2 border-[#00f2fe]/40"></div>
              <div className="absolute top-1/2 right-[15%] -translate-y-1/2 w-[5%] h-[20%] border-l-2 border-[#00f2fe]/40 rounded-l-[100%]"></div>
            </div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill="#00f2fe" opacity="0.8" />
                </marker>
              </defs>
              {isForward && <path d="M 60% 60% Q 75% 40% 80% 50%" fill="none" stroke="#00f2fe" strokeWidth="2" strokeDasharray="4 4" markerEnd="url(#arrow)" opacity="0.8" />}
            </svg>
            {positions.map(p => {
              if (p.num !== activeNum) return null;
              return (
                <div 
                  key={p.id}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-bold z-20 transition-all duration-500 border-2 border-[#00f2fe] bg-[#1c2431] text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,1)] scale-125"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  {p.num}
                </div>
              );
            })}
          </div>

          {/* PANEL DERECHO: Evaluación de Fundamentos */}
          <div className="flex-[0.8] flex flex-col gap-2 h-[260px] bg-slate-900/40 border border-slate-700/50 rounded-lg p-3 overflow-y-auto custom-scrollbar">
            <h4 className="text-[9px] text-[#48b0ba] uppercase tracking-widest font-mono mb-1 text-center border-b border-slate-700/50 pb-2">Evaluación Cualitativa</h4>
            
            <div className="mb-2">
              <span className="text-[10px] text-slate-300 font-bold block mb-1">Dominio de Zona</span>
              <p className="text-[9px] text-slate-400 leading-tight">No reconoce su zona. Juega por todo el campo (efecto enjambre). <span className="text-red-400">Correcciones necesarias.</span></p>
            </div>
            
            <div className="mb-2">
              <span className="text-[10px] text-slate-300 font-bold block mb-1">Fundamentos Utilizados</span>
              <ul className="text-[9px] text-slate-400 list-disc pl-3">
                <li>Conducción Simple <span className="text-green-400">(Alta Precisión)</span></li>
                <li>Tiro <span className="text-yellow-400">(Media)</span></li>
                <li>Pase Corto <span className="text-red-400">(Baja Precisión)</span></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] text-slate-300 font-bold block mb-1">Toma de Decisión</span>
              <p className="text-[9px] text-slate-400 leading-tight">Preferencia por el duelo 1v1 y la finalización individual en lugar de buscar al compañero libre.</p>
            </div>
          </div>

        </div>

        <button className="w-full pt-3 border-t border-slate-600/30 text-[10px] uppercase tracking-widest text-slate-400 hover:text-white transition">
          Sincronizar Datos de Posición
        </button>
      </div>
    </div>
  );
}
