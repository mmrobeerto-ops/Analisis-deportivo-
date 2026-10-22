import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "600", "700"] });

export const metadata: Metadata = {
  title: "M-360 Sports IQ v2.4",
  description: "Centro de Analítica Biomecánica y Táctica Cognitiva",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`bg-dark-slate text-slate-200 min-h-screen p-4 relative overflow-hidden flex`} style={{ fontFamily: "'Oswald', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
