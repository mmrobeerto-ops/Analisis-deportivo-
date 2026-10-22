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
    <div className="w-full h-full flex flex-col relative z-10 overflow-hidden text-slate-200">
      <TopBar />
      
      <div className="flex-1 min-h-0 flex gap-4 overflow-x-auto overflow-y-hidden pb-2" style={{minWidth: '1200px'}}>
        {/* Column 1: Sidebar Roster (approx 300px fixed in component) */}
        <SidebarRoster activePlayerId={activePlayerId} onSelectPlayer={setActivePlayerId} />
        
        {/* Column 2: Ficha y Tendencias (approx 25%) */}
        <div className="flex-1 min-w-[320px] max-w-[400px]">
          <PlayerOverview playerId={activePlayerId} />
        </div>

        {/* Column 3: Visión y Pitch (Wide) */}
        <div className="flex-[1.5] min-w-[450px] overflow-y-auto pr-2 custom-scrollbar">
          <TacticalPitch playerId={activePlayerId} />
        </div>

        {/* Column 4: Radar y Métricas (Narrow) */}
        <div className="flex-1 min-w-[250px] max-w-[300px] overflow-y-auto pr-2 custom-scrollbar">
          <TacticalMetrics playerId={activePlayerId} />
        </div>
      </div>

      {/* Footer Status Bar */}
      <div className="absolute bottom-2 right-4 flex items-center gap-4 text-[9px] text-slate-500 font-mono tracking-widest bg-black/40 py-1 px-4 rounded-full border border-white/5">
        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> CONNECTED 11:21</span>
        <span>|</span>
        <span>SESSION: 75_M360</span>
        <span>|</span>
        <span>JULY 23, 2026</span>
      </div>
    </div>
  );
}
