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
    "Presença é um espaço digital de bem-estar emocional: diário guiado, conversas com IA, meditações e práticas de respiração, com a opção de compartilhar o acompanhamento com seu terapeuta.",
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
