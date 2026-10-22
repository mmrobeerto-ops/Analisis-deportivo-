'use client';
import React from 'react';
import { Search, Home, Users, BarChart2, Bell, Settings } from 'lucide-react';

const PLAYERS = [
  { id: 'p1', name: 'Alex Ruiz', pos: 'DEL / Delantero' },
  { id: 'p2', name: 'Mateo Silva', pos: 'MED / Mediocampista' },
  { id: 'p3', name: 'Liam Gómez', pos: 'DEF / Defensa' },
  { id: 'p4', name: 'Martin Murillo', pos: 'DEL / Promesa', age: 5, image: '/martin_murillo.jpg' },
];

export default function SidebarRoster({ activePlayerId, onSelectPlayer }: { activePlayerId?: string, onSelectPlayer?: (id: string) => void }) {
  const activePlayer = PLAYERS.find(p => p.id === activePlayerId) || PLAYERS[0];

  return (
    <div className="w-[260px] flex-shrink-0 flex gap-2 h-full">
      {/* Icon Sidebar */}
      <div className="w-[50px] glass-panel-dense flex flex-col items-center py-4 gap-6">
        <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-sm text-sm">
          <span className="font-bold text-slate-200">M</span>
        </div>
        <div className="flex flex-col gap-5 text-slate-500 mt-2">
          <Home className="w-4 h-4 hover:text-slate-300 transition cursor-pointer" title="Inicio" />
          <Users className="w-4 h-4 text-slate-300 cursor-pointer" title="Plantilla" />
          <BarChart2 className="w-4 h-4 hover:text-slate-300 transition cursor-pointer" title="Estadísticas" />
          <Bell className="w-4 h-4 hover:text-slate-300 transition cursor-pointer" title="Notificaciones" />
        </div>
        <div className="mt-auto">
          <Settings className="w-4 h-4 text-slate-500 hover:text-slate-300 transition cursor-pointer" title="Ajustes" />
        </div>
      </div>

      {/* Active Subject Pane */}
      <div className="flex-1 glass-panel-dense flex flex-col p-3 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">PLANTILLA</h3>
          <span className="text-slate-500 tracking-widest">...</span>
        </div>
        
        <div className="flex flex-col items-center justify-center mb-6 border border-white/10 rounded-xl p-3 bg-slate-900/50 shadow-inner">
          <div className="w-16 h-16 rounded-full border border-slate-600 flex items-center justify-center mb-3 bg-slate-800 shadow-md overflow-hidden">
            {activePlayer.image ? (
              <img src={activePlayer.image} alt={activePlayer.name} className={`w-full h-full object-cover ${activePlayer.id === 'p4' ? 'scale-150 origin-top' : ''}`} />
            ) : (
              <span className="text-2xl">👤</span>
            )}
          </div>
          <h2 className="text-sm font-medium text-slate-200 text-center leading-tight">{activePlayer.name}</h2>
          <p className="text-[9px] text-slate-400 mt-1">{activePlayer.pos}</p>
        </div>

        <div className="flex flex-col gap-2">
          {PLAYERS.map(player => (
            <button 
              key={player.id}
              onClick={() => onSelectPlayer && onSelectPlayer(player.id)}
              className={`w-full text-left rounded-xl p-4 flex items-center gap-4 transition border ${activePlayerId === player.id ? 'bg-slate-800/80 border-slate-500 shadow-md' : 'bg-slate-900/20 border-transparent hover:bg-slate-800/40'}`}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-sm shadow-sm overflow-hidden flex-shrink-0">
                {player.image ? (
                  <img src={player.image} alt={player.name} className={`w-full h-full object-cover ${player.id === 'p4' ? 'scale-[1.7] origin-top' : ''}`} />
                ) : (
                  <span>👤</span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{player.name}</p>
                <p className="text-[10px] text-slate-400">{player.pos}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
