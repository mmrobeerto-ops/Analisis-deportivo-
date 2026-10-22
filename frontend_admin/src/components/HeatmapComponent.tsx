'use client';
import React from 'react';

// Puntos simulados: { x: porcentaje, y: porcentaje, type: 'success' | 'error' }
const heatmapPoints = [
  { x: 20, y: 30, type: 'success' },
  { x: 25, y: 35, type: 'success' },
  { x: 30, y: 50, type: 'error' },
  { x: 60, y: 70, type: 'success' },
  { x: 75, y: 20, type: 'error' },
  { x: 80, y: 25, type: 'error' },
  { x: 45, y: 40, type: 'success' },
];

export default function FootballHeatmap() {
  return (
    <div className="w-full relative bg-slate-900 border border-slate-700 rounded-lg overflow-hidden flex items-center justify-center p-2" style={{ aspectRatio: '1.5 / 1' }}>
      {/* Fondo de Cancha Simulada (Líneas) */}
      <div className="absolute inset-2 border-2 border-slate-600 rounded">
        {/* Línea Central */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600"></div>
        {/* Círculo Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-slate-600 rounded-full"></div>
        {/* Áreas */}
        <div className="absolute top-1/4 bottom-1/4 left-0 w-12 border-y-2 border-r-2 border-slate-600"></div>
        <div className="absolute top-1/4 bottom-1/4 right-0 w-12 border-y-2 border-l-2 border-slate-600"></div>
      </div>

      {/* Puntos del Heatmap */}
      {heatmapPoints.map((point, index) => (
        <div
          key={index}
          className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full mix-blend-screen opacity-70 blur-md ${
            point.type === 'success' ? 'bg-turquoise-4d' : 'bg-maroon-4d'
          }`}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        ></div>
      ))}
      
      {/* Puntos centrales (core) */}
      {heatmapPoints.map((point, index) => (
        <div
          key={`core-${index}`}
          className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full z-10 ${
            point.type === 'success' ? 'bg-white shadow-[0_0_5px_#00F2FE]' : 'bg-red-400 shadow-[0_0_5px_#5C0B1B]'
          }`}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        ></div>
      ))}
    </div>
  );
}
