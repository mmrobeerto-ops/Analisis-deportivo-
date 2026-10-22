import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 luxury-panel border-r border-y-0 border-l-0 flex flex-col items-center py-8">
      {/* Brand Logo */}
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-black tracking-tighter">
          <span className="text-luxury-white">M-360</span>
        </h1>
        <span className="gold-gradient-text block text-sm tracking-[0.3em] mt-1 font-bold">SPORTS IQ</span>
      </div>

      {/* Navigation */}
      <nav className="w-full flex flex-col gap-2 px-4">
        <NavItem href="/" label="Dashboard Central" active />
        <NavItem href="/video" label="Carga de Video" />
        <NavItem href="/microciclos" label="Microciclos MBP" />
        <NavItem href="/asistencia" label="Asistencia QR" />
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-8 border-t border-luxury-border w-full px-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-luxury-navy border border-luxury-gold flex items-center justify-center font-bold text-luxury-gold">
          DT
        </div>
        <div>
          <p className="text-sm font-bold text-luxury-white">Juan Pérez</p>
          <p className="text-xs text-luxury-silver uppercase tracking-wider mt-0.5">Dir. Técnico</p>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ href, label, active = false }: { href: string; label: string; active?: boolean }) {
  return (
    <Link 
      href={href}
      className={`px-4 py-3 rounded text-sm font-bold uppercase tracking-wide transition-all duration-300 ${
        active 
          ? "bg-luxury-navy text-luxury-gold border-l-2 border-luxury-gold shadow-sm" 
          : "text-luxury-silver hover:text-luxury-white hover:bg-luxury-navy-light border-l-2 border-transparent"
      }`}
    >
      {label}
    </Link>
  );
}
