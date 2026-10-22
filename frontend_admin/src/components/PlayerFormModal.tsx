'use client';
import React, { useState } from 'react';

interface PlayerFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PlayerFormModal({ onClose, onSuccess }: PlayerFormModalProps) {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    fecha_nacimiento: '',
    posicion: 'Delantero',
    dorsal: '',
    talla_inicial_cm: '',
    peso_inicial_kg: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:8080/api/jugadores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          dorsal: parseInt(formData.dorsal) || 0,
          talla_inicial_cm: parseFloat(formData.talla_inicial_cm) || 0,
          peso_inicial_kg: parseFloat(formData.peso_inicial_kg) || 0,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Error al registrar alumno");
      }
    } catch (error) {
      console.error(error);
      alert("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-8 bg-slate-900 border border-cyan-500/30 rounded-2xl glow-card">
        {/* Línea Neón */}
        <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
        
        <h2 className="text-2xl font-bold text-white mb-2">ALTA DE ALUMNO</h2>
        <p className="text-xs text-slate-400 font-mono tracking-widest mb-6">INGRESO AL SISTEMA MBP</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">NOMBRE COMPLETO</label>
            <input 
              required type="text"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">FECHA NACIMIENTO</label>
              <input 
                required type="date"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">DORSAL</label>
              <input 
                required type="number"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                value={formData.dorsal}
                onChange={(e) => setFormData({...formData, dorsal: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">TALLA INICIAL (CM)</label>
              <input 
                required type="number" step="0.1"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                value={formData.talla_inicial_cm}
                onChange={(e) => setFormData({...formData, talla_inicial_cm: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">PESO INICIAL (KG)</label>
              <input 
                required type="number" step="0.1"
                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                value={formData.peso_inicial_kg}
                onChange={(e) => setFormData({...formData, peso_inicial_kg: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">POSICIÓN PRIMARIA</label>
            <select 
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
              value={formData.posicion}
              onChange={(e) => setFormData({...formData, posicion: e.target.value})}
            >
              <option value="Portero">Portero</option>
              <option value="Defensa Central">Defensa Central</option>
              <option value="Lateral Derecho">Lateral Derecho</option>
              <option value="Lateral Izquierdo">Lateral Izquierdo</option>
              <option value="Volante Central">Volante Central</option>
              <option value="Volante Interior">Volante Interior</option>
              <option value="Extremo Derecho">Extremo Derecho</option>
              <option value="Extremo Izquierdo">Extremo Izquierdo</option>
              <option value="Delantero Centro">Delantero Centro</option>
            </select>
          </div>

          <div className="flex gap-4 mt-8 pt-4 border-t border-slate-800">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-lg font-bold text-xs text-slate-400 hover:text-white transition"
            >
              CANCELAR
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 py-3 rounded-lg font-bold text-xs bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'PROCESANDO...' : 'REGISTRAR ALUMNO'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
