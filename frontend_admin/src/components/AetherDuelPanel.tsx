'use client';
import React, { useEffect, useState } from 'react';

interface AetherMetrics {
  frame: number;
  timestamp_s: number;
  knee_angle_deg: number;
  cog_drop_pct: number;
  hip_shoulder_dissociation_deg: number;
  defender_distance_m: number;
  defender_reaction_ms: number;
  aether_kinematic_entropy: number;
  is_breaking_cut: boolean;
  aether_latency_us: number;
  aether_dll_loaded: boolean;
}

interface SmartClip {
  clip_id: string;
  window: string;
  event: string;
  defender_dist_m: number;
  reaction_delay_ms: number;
}

export default function AetherDuelPanel() {
  const [frame, setFrame] = useState(1);
  const [metrics, setMetrics] = useState<AetherMetrics | null>(null);
  const [clips, setClips] = useState<SmartClip[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame((prev) => prev + 1);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch(`http://localhost:8080/api/aether/1v1-telemetry?frame=${frame}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.metrics) {
          setMetrics(data.metrics);
          setClips(data.smart_clips_generated || []);
        }
      })
      .catch(() => {});
  }, [frame]);

  return (
    <div className="glass-panel-dense p-3.5 border border-[#00f2fe]/40 rounded-2xl flex flex-col gap-2.5">
      {/* Header Aether Core */}
      <div className="flex justify-between items-start border-b border-white/10 pb-2 gap-2">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#00f2fe] block">
            ⚡ TZANiX AETHER CORE • CEFOR 1V1
          </span>
          <h3 className="text-xs font-bold text-white uppercase tracking-wide leading-tight mt-0.5">
            Duelo 1v1, CoG & Auto-Clips (3s)
          </h3>
        </div>
        <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-[#00f2fe]/15 border border-[#00f2fe]/50 text-[#00f2fe] whitespace-nowrap">
          LUT {metrics?.aether_latency_us ?? 1.85} µs
        </span>
      </div>

      {/* Grid 2x2 para que jamás se corte ningún número */}
      <div className="grid grid-cols-2 gap-2 text-center font-mono">
        <div className="bg-slate-900/70 p-2 rounded-lg border border-white/5">
          <p className="text-[8px] text-slate-400 uppercase">FLEXIÓN RODILLA / CoG</p>
          <p className="text-sm font-bold text-white mt-0.5">
            {metrics?.knee_angle_deg ?? 126.4}°{' '}
            <span className="text-[10px] text-[#00f2fe]">(-{metrics?.cog_drop_pct ?? 65}%)</span>
          </p>
        </div>

        <div className="bg-slate-900/70 p-2 rounded-lg border border-white/5">
          <p className="text-[8px] text-slate-400 uppercase">DISTANCIA AL RIVAL</p>
          <p className="text-sm font-bold text-[#00f2fe] mt-0.5">
            {metrics?.defender_distance_m ?? 1.35} m
          </p>
        </div>

        <div className="bg-slate-900/70 p-2 rounded-lg border border-white/5">
          <p className="text-[8px] text-slate-400 uppercase">REACCIÓN DEFENSOR</p>
          <p className="text-sm font-bold text-amber-400 mt-0.5">
            {metrics?.defender_reaction_ms ?? 238} ms
          </p>
        </div>

        <div className="bg-slate-900/70 p-2 rounded-lg border border-white/5">
          <p className="text-[8px] text-slate-400 uppercase">ENTROPÍA SHANNON LUT</p>
          <p className="text-sm font-bold text-emerald-400 mt-0.5">
            {(metrics?.aether_kinematic_entropy ?? 2.31).toFixed(2)} bits
          </p>
        </div>
      </div>

      {/* Estado de Ruptura */}
      <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              metrics?.is_breaking_cut
                ? 'bg-[#00f2fe] shadow-[0_0_8px_#00f2fe]'
                : 'bg-emerald-400'
            }`}
          ></span>
          <span className="text-[9px] font-mono uppercase text-slate-200 truncate">
            {metrics?.is_breaking_cut
              ? 'CORTE DETECTADO -> CLIP 3.0s'
              : 'CADERA, HOMBROS Y RODILLAS'}
          </span>
        </div>
        <span className="text-[9px] font-mono text-[#00f2fe] whitespace-nowrap">
          FINTA: {metrics?.hip_shoulder_dissociation_deg ?? 18.2}°
        </span>
      </div>

      {/* Lista de Clips Inteligentes de 3s */}
      <div className="space-y-1.5">
        <p className="text-[8px] font-mono uppercase tracking-wider text-slate-400">
          CLIPS INTELIGENTES DE 3 SEGUNDOS (AUTO-RECORTE):
        </p>
        {clips.map((c) => (
          <div
            key={c.clip_id}
            className="bg-slate-900/60 hover:bg-slate-800/80 transition p-2 rounded border-l-2 border-[#00f2fe] text-[10px]"
          >
            <div className="flex justify-between items-center font-mono text-[9px] text-[#00f2fe] mb-0.5">
              <span>[{c.window}]</span>
              <span className="text-amber-400">
                {c.defender_dist_m}m • {c.reaction_delay_ms}ms
              </span>
            </div>
            <p className="text-slate-200 font-medium leading-snug">{c.event}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
