'use client';
import React from 'react';

const PLAYERS: Record<string, any> = {
  p1: { 
    name: 'Alex Ruiz', pos: 'MC', height: '1.78', 
    stats: { PAC: 88, DRI: 85, SHO: 82, DEF: 76, PAS: 90, IQ: 95 },
    playstyles: [{ icon: '⚡', label: 'RÁPIDO' }, { icon: '👁️', label: 'VISIÓN+' }, { icon: '🛡️', label: 'BLOQUEO' }],
    rating: 92, tag: 'M-360 PRO',
    fundamentos: 'Pase en profundidad, regate en espacios reducidos, tiro a puerta con ambas piernas.',
    adaptacion: 'Totalmente adaptado al sistema táctico 4-3-3 del primer equipo.',
    estadoJuego: 'Óptimo. Alta influencia en la creación de juego en el último tercio.'
  },
  p2: { 
    name: 'Mateo Silva', pos: 'MC', height: '1.82', 
    stats: { PAC: 75, DRI: 88, SHO: 79, DEF: 82, PAS: 92, IQ: 88 },
    playstyles: [{ icon: '🎯', label: 'INCISIVO' }, { icon: '🧠', label: 'TÁCTICO' }, { icon: '👟', label: '1ER TOQUE' }],
    rating: 85, tag: 'M-360 PRO',
    fundamentos: 'Control orientado, distribución bajo presión, lectura de espacios.',
    adaptacion: 'Excelente química con los mediocampistas, buena asimilación de cargas.',
    estadoJuego: 'Estable. Controla el ritmo del partido con pases seguros.'
  },
  p3: { 
    name: 'Liam Gómez', pos: 'DF', height: '1.85', 
    stats: { PAC: 80, DRI: 70, SHO: 60, DEF: 89, PAS: 78, IQ: 85 },
    playstyles: [{ icon: '🧱', label: 'MURALLA' }, { icon: '✈️', label: 'AÉREO' }, { icon: '🛡️', label: 'ANTICIPACIÓN' }],
    rating: 83, tag: 'M-360 PRO',
    fundamentos: 'Marca uno a uno, despejes aéreos, cobertura en zona.',
    adaptacion: 'Sólido en la línea de 4, líder vocal en defensa.',
    estadoJuego: 'Dominante en duelos físicos. Difícil de rebasar.'
  },
  p4: { 
    name: 'Martin Murillo', pos: 'DEL', height: '1.10', image: '/martin_murillo.jpg', 
    stats: { PAC: 85, DRI: 45, SHO: 30, DEF: 10, PAS: 15, IQ: 10 },
    playstyles: [{ icon: '🐝', label: 'PERSIGUE BALÓN' }, { icon: '🔥', label: 'SIN MIEDO' }, { icon: '🔋', label: 'ENERGÍA INFINITA' }],
    rating: '07', tag: 'EGO NIVEL 1',
    fundamentos: 'Apenas descubre el control de balón. Conducción en línea recta, uso exclusivo de pierna hábil. Necesita trabajar visión periférica.',
    adaptacion: 'Excelente energía y entusiasmo, pero se distrae con facilidad. Alta motivación por el juego lúdico y competitivo.',
    estadoJuego: 'Fase Egocéntrica (Nivel 1). Corre detrás del balón constantemente sin mantener una posición fija (Efecto enjambre).'
  },
};

export default function PlayerOverview({ playerId }: { playerId?: string }) {
  const player = PLAYERS[playerId || 'p1'] || PLAYERS['p1'];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1 pb-4">
      {/* TARJETA ESTILO ULTIMATE TEAM (FUT CARD) */}
      <div className="relative w-full mx-auto h-[320px] bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-600 shadow-xl flex flex-col items-center p-3 overflow-hidden flex-shrink-0" 
           style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)' }}>
        
        {/* Soft Background Accent */}
        <div className="absolute -top-20 -right-20 w-32 h-32 bg-slate-500/10 blur-3xl rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-slate-400/10 blur-3xl rounded-full"></div>

        {/* Encabezado de Tarjeta */}
        <div className="flex justify-between w-full px-2 mt-2 z-10">
          <div className="flex flex-col items-center">
            <span className="text-4xl font-light text-slate-200 leading-none">{player.rating}</span>
            <span className="text-lg text-slate-400 font-medium">{player.pos}</span>
            {/* Bandera simulada (MEX) */}
            <div className="w-6 h-4 bg-green-700 mt-1 flex border border-slate-700 opacity-80">
                <div className="w-1/3 bg-slate-200 h-full"></div>
                <div className="w-1/3 bg-red-700 h-full"></div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium tracking-widest uppercase mb-1">{player.tag}</div>
            {/* Logo de club simulado */}
            <div className="w-8 h-8 ml-auto border border-slate-600 flex items-center justify-center rotate-45 mt-1 bg-slate-800/80">
               <span className="-rotate-45 text-[10px] font-bold text-slate-300">FC</span>
            </div>
          </div>
        </div>

        {/* Foto de Jugador (Espacio central) */}
        <div className="relative flex-grow flex items-end justify-center w-full z-10 mt-2 h-[140px]">
           <div className="w-full h-full relative overflow-hidden flex items-end justify-center">
             {player.image ? (
                 <img src={player.image} alt={player.name} className={`h-full object-cover object-top mask-image-bottom ${playerId === 'p4' ? 'scale-[1.3] translate-y-6 origin-top' : ''}`} style={{ maskImage: 'linear-gradient(to top, transparent 0%, black 20%)', WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 20%)' }} />
             ) : (
                 <div className="w-32 h-32 bg-gradient-to-t from-slate-900 to-transparent absolute bottom-0 rounded-t-full flex items-center justify-center">
                     <span className="text-5xl text-slate-500">👤</span>
                 </div>
             )}
           </div>
        </div>

        {/* Nombre y stats base */}
        <div className="w-full z-10 text-center border-t border-slate-700/50 pt-2 mt-1">
            <h2 className="text-xl font-medium uppercase tracking-wide text-slate-200 mb-1">{player.name}</h2>
            
            <div className="w-full flex justify-center items-center gap-2 mt-1 text-[10px] text-slate-500">
                <span>{player.height} M</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>MED/MED</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>DIESTRO</span>
            </div>
        </div>
      </div>
      
      {/* Panel secundario de Formación u otros datos */}
      <div className="bg-slate-800/50 p-3 border border-slate-700 relative overflow-hidden flex-shrink-0"
           style={{ clipPath: 'polygon(0 0, 95% 0, 100% 15%, 100% 100%, 5% 100%, 0 85%)' }}>
          <div className="absolute top-0 left-0 w-1 h-full bg-slate-500"></div>
          <h3 className="text-slate-400 text-[9px] font-mono tracking-widest uppercase mb-2">Estilos de Juego+</h3>
          <div className="flex gap-1.5">
             {player.playstyles.map((style: any, idx: number) => (
               <div key={idx} className="bg-slate-900/50 p-1.5 border border-slate-700 rounded text-center text-[10px] text-slate-300 flex-1 leading-tight">
                   <span className="block text-slate-400 mb-0.5 text-sm">{style.icon}</span>
                   {style.label}
               </div>
             ))}
          </div>
      </div>

      {/* REPORTE TÉCNICO (NUEVO) */}
      <div className="glass-panel-dense p-3 flex flex-col gap-2 flex-shrink-0">
        <h3 className="text-[9px] text-slate-300 uppercase tracking-widest font-mono border-b border-white/10 pb-1 mb-1">Reporte Técnico Completo</h3>
        
        <div>
          <h4 className="text-[8px] text-[#48b0ba] uppercase tracking-widest mb-0.5">Fundamentos Dominados</h4>
          <p className="text-[10px] text-slate-300 leading-tight">{player.fundamentos}</p>
        </div>
        
        <div>
          <h4 className="text-[8px] text-[#48b0ba] uppercase tracking-widest mb-0.5">Adaptación</h4>
          <p className="text-[10px] text-slate-300 leading-tight">{player.adaptacion}</p>
        </div>

        <div>
          <h4 className="text-[8px] text-[#48b0ba] uppercase tracking-widest mb-0.5">Estado de Juego Actual</h4>
          <p className="text-[10px] text-slate-300 leading-tight">{player.estadoJuego}</p>
        </div>
      </div>

    </div>
  );
}
