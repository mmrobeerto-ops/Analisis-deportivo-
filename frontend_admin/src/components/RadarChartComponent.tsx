'use client';
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const data = [
  { subject: 'Biomecánica', A: 70, fullMark: 100 },
  { subject: 'Táctica', A: 82, fullMark: 100 },
  { subject: 'Velocidad', A: 65, fullMark: 100 },
  { subject: 'Físico', A: 85, fullMark: 100 },
  { subject: 'Percepción (IQ)', A: 80, fullMark: 100 },
];

export default function PlayerRadarChart() {
  return (
    <div className="w-full h-[250px] mt-4 relative">
      <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-2xl z-0"></div>
      <ResponsiveContainer width="100%" height="100%" className="relative z-10">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#1e293b" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name="Jugador"
            dataKey="A"
            stroke="#00F2FE"
            fill="#00F2FE"
            fillOpacity={0.4}
            isAnimationActive={true}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
