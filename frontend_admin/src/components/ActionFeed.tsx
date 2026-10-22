export default function ActionFeed() {
  const actions = [
    { id: 1, time: "12:04", player: "Juan Pérez (#8)", event: "Escaneo de Cabeza Exitoso", type: "success" },
    { id: 2, time: "12:05", player: "Carlos Méndez (#5)", event: "Falla de Perfilación (Rodilla Erguida)", type: "error" },
    { id: 3, time: "12:08", player: "Línea Defensiva", event: "Sincronía de Basculación al 85%", type: "info" },
    { id: 4, time: "12:12", player: "Equipo", event: "Bloque Corto - Amplitud Excelente", type: "success" },
  ];

  return (
    <div className="luxury-panel rounded-xl p-6 h-full flex flex-col border border-luxury-border">
      <h3 className="text-sm font-bold mb-6 flex items-center gap-2 border-b border-luxury-border pb-4 uppercase tracking-widest text-luxury-silver">
        <span className="w-2 h-2 rounded-full bg-luxury-gold animate-pulse"></span>
        Live Feed
      </h3>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-5">
        {actions.map((action) => (
          <div key={action.id} className="flex gap-3 items-start group">
            <div className="text-xs text-luxury-silver mt-0.5 w-10 shrink-0 font-mono">{action.time}</div>
            
            <div className="relative pb-5">
              {/* Timeline line */}
              <div className="absolute left-1 top-4 bottom-0 w-px bg-luxury-border group-last:hidden"></div>
              
              {/* Timeline dot */}
              <div className={`w-2 h-2 rounded-full mt-1 relative z-10 ${
                action.type === 'success' ? 'bg-luxury-silver' : 
                action.type === 'error' ? 'bg-luxury-maroon' : 
                'bg-luxury-gold'
              }`}></div>
            </div>
            
            <div className="bg-luxury-navy border border-luxury-border p-3 rounded flex-1">
              <p className="text-xs font-bold text-luxury-white uppercase tracking-wide">{action.player}</p>
              <p className="text-xs text-luxury-silver mt-1">{action.event}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
