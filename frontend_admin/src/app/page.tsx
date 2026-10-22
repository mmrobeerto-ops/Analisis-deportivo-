'use client';
import React, { useState } from 'react';
import SidebarRoster from '@/components/SidebarRoster';
import TopBar from '@/components/TopBar';
import PlayerOverview from '@/components/PlayerOverview';
import TacticalMetrics from '@/components/TacticalMetrics';
import TacticalPitch from '@/components/TacticalPitch';

export default function Dashboard() {
  const [activePlayerId, setActivePlayerId] = useState<string>('p1');

  return (
    <div className="w-full h-screen flex flex-col relative z-10 overflow-hidden text-slate-200 px-2 pt-1 pb-2">
      <TopBar />

      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 overflow-hidden pb-6">
        {/* Columna 1: Plantilla (2 cols) */}
        <div className="col-span-2 min-h-0 h-full overflow-hidden">
          <SidebarRoster activePlayerId={activePlayerId} onSelectPlayer={setActivePlayerId} />
        </div>

        {/* Columna 2: Carta FUT + Reporte Técnico (3 cols) */}
        <div className="col-span-3 min-h-0 h-full overflow-y-auto pr-1 custom-scrollbar">
          <PlayerOverview playerId={activePlayerId} />
        </div>

        {/* Columna 3: Visión IA en Vivo + Mapa de Influencia (4 cols) */}
        <div className="col-span-4 min-h-0 h-full overflow-y-auto pr-1 custom-scrollbar">
          <TacticalPitch playerId={activePlayerId} />
        </div>

        {/* Columna 4: TZANiX Aether Core 1v1 + Radar + Tendencias (3 cols) */}
        <div className="col-span-3 min-h-0 h-full overflow-y-auto pr-1 custom-scrollbar">
          <TacticalMetrics playerId={activePlayerId} />
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="absolute bottom-1 right-4 flex items-center gap-4 text-[9px] text-slate-400 font-mono tracking-widest bg-[#0b1320]/90 py-1 px-4 rounded-full border border-[#00f2fe]/20">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span>
          TZANiX AETHER CORE: ONLINE (1.85 µs)
        </span>
        <span>|</span>
        <span>CEFOR 1v1 & DRON 4K</span>
        <span>|</span>
        <span>M-360 SPORTS IQ v2.4</span>
      </div>
    </div>
  );
}
