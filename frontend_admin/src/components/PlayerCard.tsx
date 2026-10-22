import React from 'react';

interface PlayerCardProps {
  name: string;
  dorsal: number;
  position: string;
  fase: string;
  scorePosture: number;
  scoreIQ: number;
  scoreTactic: number;
  diagnostic: string;
}

export default function PlayerCard({ 
  name, dorsal, position, fase, scorePosture, scoreIQ, scoreTactic, diagnostic 
}: PlayerCardProps) {
  
  // Calculate average for the global level
  const globalLevel = Math.round((scorePosture + scoreIQ + scoreTactic) / 3);
  
  return (
    <div className="luxury-panel p-6 rounded-xl relative overflow-hidden group border border-luxury-border hover:border-luxury-gold/50 transition-colors duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-luxury-border">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wide text-luxury-white">{name}</h2>
          <p className="text-luxury-silver font-medium text-xs mt-1 uppercase tracking-widest">{position} • Fase: {fase}</p>
        </div>
        <div className="text-3xl font-black text-luxury-gold opacity-80">#{dorsal}</div>
      </div>

      {/* 100 100 100 Bars */}
      <div className="space-y-5 mb-8">
        <ProgressBar label="Biomecánica" value={scorePosture} color="bg-luxury-silver" />
        <ProgressBar label="IQ Perceptivo" value={scoreIQ} color="bg-luxury-gold" />
        <ProgressBar label="Decisión Táctica" value={scoreTactic} color="bg-luxury-maroon" />
      </div>

      {/* Global Score & Diagnostic */}
      <div className="flex items-center gap-4 bg-luxury-navy p-4 rounded border border-luxury-border border-l-4 border-l-luxury-gold">
        <div className="flex flex-col items-center justify-center min-w-16">
          <span className="text-3xl font-black text-white">{globalLevel}</span>
          <span className="text-[10px] text-luxury-silver font-bold tracking-[0.2em] uppercase mt-1">Nivel</span>
        </div>
        <p className="text-xs text-luxury-white/80 italic border-l border-luxury-border pl-4 leading-relaxed font-light">
          "{diagnostic}"
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5 uppercase tracking-wider">
        <span className="font-bold text-luxury-silver">{label}</span>
        <span className="font-bold text-luxury-white">{value}</span>
      </div>
      <div className="w-full bg-luxury-navy h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}
