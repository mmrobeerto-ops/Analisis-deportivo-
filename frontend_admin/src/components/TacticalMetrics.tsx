'use client';
import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

import AetherDuelPanel from './AetherDuelPanel';

const INITIAL_DATA = [
  { time: '00:00', hr: 80, dist: 0 },
  { time: '10:00', hr: 95, dist: 1.2 },
  { time: '20:00', hr: 120, dist: 2.8 },
  { time: '30:00', hr: 110, dist: 3.5 },
  { time: '40:00', hr: 150, dist: 5.1 },
  { time: '50:00', hr: 130, dist: 6.8 },
  { time: '60:00', hr: 140, dist: 7.2 },
];

export default function TacticalMetrics({ playerId }: { playerId?: string }) {
  const [data, setData] = useState(INITIAL_DATA);

  // Dynamic simulation for the graph to move
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData];
        newData.shift();
        const lastItem = prevData[prevData.length - 1];
        const newTimeMin = parseInt(lastItem.time.split(':')[0]) + 10;
        const newTimeStr = `${newTimeMin}:00`;
        const newHr = Math.floor(Math.random() * (180 - 100 + 1) + 100);
        const newDist = parseFloat((lastItem.dist + Math.random() * 1.5).toFixed(1));
        newData.push({ time: newTimeStr, hr: newHr, dist: newDist });
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [playerId]);

  const radarData = [
    { subject: 'Biometría', A: playerId === 'p4' ? 95 : 70 },
    { subject: 'Táctica', A: playerId === 'p4' ? 10 : 82 },
    { subject: 'Psicología', A: playerId === 'p4' ? 99 : 65 },
    { subject: 'Velocidad', A: playerId === 'p4' ? 90 : 85 },
    { subject: 'Físico', A: playerId === 'p4' ? 30 : 80 },
  ];

  return (
    <div className="flex flex-col gap-3 h-full overflow-y-auto pr-1">
      {/* Top Row: Radar */}
      <div className="glass-panel-dense p-4 h-48 flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">Radar Táctico</h3>
          <div className="flex gap-2 text-[8px] uppercase tracking-widest text-[#48b0ba]">
            <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#48b0ba]"></span> Biometría</span>
            <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-[#48b0ba]"></span> Distancia</span>
          </div>
        </div>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Jugador"
                dataKey="A"
                stroke="#00f2fe"
                fill="#00f2fe"
                fillOpacity={0.15}
                isAnimationActive={true}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Middle Row: TZANiX Aether Core 1v1 & Auto-Clips */}
      <AetherDuelPanel />

      {/* Bottom Row: Training Trends */}
      <div className="glass-panel-dense p-4 h-44 flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">Tendencias (En Vivo)</h3>
          <div className="flex gap-3 text-[9px] uppercase tracking-widest font-mono">
            <span className="text-red-400 flex items-center gap-1 animate-pulse"><div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div> REC</span>
            <span className="text-[#48b0ba] flex items-center gap-1"><div className="w-1.5 h-1.5 bg-[#48b0ba] rounded-full"></div> Ritmo Cardíaco</span>
          </div>
        </div>
        <div className="flex-1 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{top:5, right:0, left:-25, bottom:0}}>
              <XAxis dataKey="time" tick={{fill: '#475569', fontSize: 10}} axisLine={{stroke: '#334155'}} tickLine={false} />
              <YAxis tick={{fill: '#475569', fontSize: 10}} axisLine={false} tickLine={false} domain={[50, 200]} />
              <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '8px'}} />
              <Area type="monotone" dataKey="hr" fill="url(#colorHr)" stroke="none" isAnimationActive={true} />
              <Line type="monotone" dataKey="hr" stroke="#00f2fe" strokeWidth={2} dot={{r: 4, fill: '#00f2fe'}} isAnimationActive={true} />
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
