'use client';
import React from 'react';

export default function TopBar() {
  return (
    <header className="flex justify-between items-center mb-6 z-10 w-full h-12">
      {/* Tabs */}
      <div className="flex gap-4">
        <button className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition">EQUIPOS</button>
        <button className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition">CALENDARIO</button>
        <button className="text-[10px] uppercase tracking-widest bg-[#1c2431] border border-white/5 px-4 py-1.5 rounded text-white shadow-md">ANÁLISIS</button>
        <button className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-white transition">PREDICCIONES</button>
      </div>

      {/* Center Icons */}
      <div className="flex gap-4 bg-[#1c2431] border border-white/5 px-4 py-2 rounded-xl">
         <span className="text-slate-400 text-xs">⛶</span>
         <span className="text-slate-400 text-xs">📈</span>
         <span className="text-slate-400 text-xs">📊</span>
         <span className="text-slate-400 text-xs">⚙️</span>
      </div>

      {/* Action & Status */}
      <div className="flex items-center gap-4">
        <button className="px-3 py-1.5 rounded border border-white/10 text-[10px] uppercase tracking-widest text-slate-300 hover:bg-white/5 transition flex items-center gap-2 bg-[#1c2431]">
          <span>📹</span> EN VIVO
        </button>
        
        <div className="flex items-center gap-3 bg-[#48b0ba]/10 border border-[#48b0ba]/30 rounded-full pl-2 pr-4 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex items-center justify-center border border-[#48b0ba]">
             <span className="text-sm">👨🏻‍💻</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-[#48b0ba] uppercase tracking-widest">Analista Jefe</span>
            <span className="text-xs font-bold text-white leading-none">LEO</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] ml-2 glow-data-cyan"></div>
        </div>
      </div>
    </header>
  );
}
