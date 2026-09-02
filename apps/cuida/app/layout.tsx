import type { Metadata } from "next";
import { IBM_Plex_Mono, Spectral, Work_Sans } from "next/font/google";

import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

// Corpo de texto e campos — substitui a stack system-ui genérica. Tom mais
// caloroso e desenhado do que o "SaaS" que ui-sans-serif costuma sugerir.
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-worksans",
  display: "swap",
});

// Eyebrows, código de convite e outros rótulos técnicos — registro
// "profissional" do Cuida (voz-de-marca §5), nunca usado pro corpo de texto.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cuida",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${spectral.variable} ${workSans.variable} ${plexMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
