import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEFOR VIDEO — Análisis Táctico & 1v1 (Prof. Edu Chio)",
  description: "Plataforma de Videoanálisis Táctico desde Dron 4K y Duelos 1v1 a ras de suelo para CEFOR Profesor Chio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className="bg-[#0b0f17] text-slate-200 min-h-screen overflow-y-auto overflow-x-auto antialiased"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
