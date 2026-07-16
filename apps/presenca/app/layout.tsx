import type { Metadata } from "next";
import { Spectral } from "next/font/google";

import { AmbienteShell } from "./AmbienteShell";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Presença",
  description:
    "Presença é um espaço digital de bem-estar emocional e autoconhecimento — um diário guiado pra registrar sua jornada, podendo ser uma jornada acompanhada por quem já cuida de você.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={spectral.variable}>
      <body>
        <AmbienteShell>{children}</AmbienteShell>
      </body>
    </html>
  );
}
